// refund-web GraphQL 사용 현황 → 백엔드·프론트 작업용 문서 폴더 생성
// 사용: node tools/gen.cjs <graphql 패키지 경로> <refund-web 경로> <출력 폴더> <기준 ref 문구>
const fs = require('fs');
const path = require('path');
const gql = require(process.argv[2]);
const appDir = process.argv[3];
const outDir = process.argv[4];
const baseRef = process.argv[5];

// ───────── 1. 소스 읽기 · 파싱 ─────────
const walk = (dir, acc) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', '__generated__'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
};
const sources = Object.fromEntries(walk(appDir, []).map((file) => [path.relative(appDir, file), fs.readFileSync(file, 'utf8')]));
const schema = gql.buildSchema(fs.readFileSync(path.join(appDir, 'graphql/schema/schema.graphql'), 'utf8'), { assumeValidSDL: true });

const definitions = [];
for (const [file, text] of Object.entries(sources)) {
  const tagPattern = /(?:graphql|\/\* GraphQL \*\/\s*)`([\s\S]*?)`/g;
  let match;
  while ((match = tagPattern.exec(text))) {
    for (const def of gql.parse(match[1]).definitions) definitions.push({ file, def });
  }
}
const fragments = Object.fromEntries(definitions.filter((item) => item.def.kind === 'FragmentDefinition').map((item) => [item.def.name.value, item.def]));

// 에러 코드 상수(TAX_REFUND_ERROR 키 → 값)
const errorSource = sources['components/tax-refund/common/error/error.ts'] ?? '';
const taxRefundErrorMap = Object.fromEntries([...errorSource.matchAll(/(\S+): '(ERR_[A-Z_]+)'/g)].map((item) => [item[1], item[2]]));
const cardErrorCodes = [...errorSource.matchAll(/^\s{2}(ERR_[A-Z_]+): \{/gm)].map((item) => item[1]);

// ───────── 2. 타입 표기 ─────────
const SCALAR_TS = { String: 'string', ID: 'string', Int: 'number', Float: 'number', Boolean: 'boolean', DateTime: 'string /* DateTime */', JSON: 'unknown /* JSON */' };
const usedEnums = new Set();
const tsType = (type) => {
  // GraphQL 타입 → TS 표기 (nullable 은 | null)
  const nonNull = gql.isNonNullType(type);
  const inner = nonNull ? type.ofType : type;
  let text;
  if (gql.isListType(inner)) text = `${wrapForArray(tsType(inner.ofType))}[]`;
  else if (gql.isEnumType(inner)) {
    usedEnums.add(inner.name);
    text = inner.name;
  } else if (gql.isScalarType(inner)) text = SCALAR_TS[inner.name] ?? `unknown /* ${inner.name} */`;
  else text = inner.name;
  return nonNull ? text : `${text} | null`;
};
const wrapForArray = (text) => (text.includes('|') ? `(${text})` : text);

// ───────── 3. 루트 필드(API)별로 모으기 ─────────
const mergeSelection = (target, selectionSet, parentType) => {
  if (!selectionSet) return;
  const named = gql.getNamedType(parentType);
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      const fieldName = selection.name.value;
      if (fieldName === '__typename') continue;
      const fieldDef = named?.getFields?.()[fieldName];
      if (!target.has(fieldName)) target.set(fieldName, { type: fieldDef?.type ?? null, children: new Map() });
      mergeSelection(target.get(fieldName).children, selection.selectionSet, fieldDef?.type);
    } else if (selection.kind === 'InlineFragment') {
      mergeSelection(target, selection.selectionSet, selection.typeCondition ? schema.getType(selection.typeCondition.name.value) : parentType);
    } else if (selection.kind === 'FragmentSpread') {
      const fragment = fragments[selection.name.value];
      if (fragment) mergeSelection(target, fragment.selectionSet, schema.getType(fragment.typeCondition.name.value));
    }
  }
};

const apis = new Map();
const operations = [];
for (const { file, def } of definitions) {
  if (def.kind !== 'OperationDefinition') continue;
  const opName = def.name.value;
  const exportMatch = new RegExp(`(?:export )?const (\\w+)\\s*=\\s*(?:graphql|/\\* GraphQL \\*/\\s*)\`\\s*${def.operation}\\s+${opName}\\b`).exec(sources[file]);
  const exportName = exportMatch?.[1] ?? null;
  const usedBy = Object.entries(sources)
    .filter(([usingFile, text]) => {
      if (usingFile === file) {
        if (!exportName) return /use(LazyLoadQuery|Mutation|QueryLoader|PreloadedQuery|Fragment)|fetchQuery|serverGraphQLFetch/.test(text);
        return (text.match(new RegExp(`\\b${exportName}\\b`, 'g')) ?? []).length > 1;
      }
      return text.includes(`${opName}.graphql`) || (exportName && new RegExp(`\\b${exportName}\\b`).test(text));
    })
    .map(([usingFile]) => usingFile);
  const rootType = def.operation === 'query' ? schema.getQueryType() : schema.getMutationType();
  const rootFields = def.selectionSet.selections.filter((selection) => selection.kind === 'Field');
  operations.push({ opName, kind: def.operation, file, usedBy, roots: rootFields.map((selection) => selection.name.value) });
  for (const selection of rootFields) {
    const fieldName = selection.name.value;
    const fieldDef = rootType.getFields()[fieldName];
    const key = `${def.operation}:${fieldName}`;
    if (!apis.has(key)) apis.set(key, { key, kind: def.operation, field: fieldName, fieldDef, argsSent: new Set(), response: new Map(), ops: [], files: new Set([file]), usedBy: new Set() });
    const api = apis.get(key);
    (selection.arguments ?? []).forEach((arg) => api.argsSent.add(arg.name.value));
    mergeSelection(api.response, selection.selectionSet, fieldDef?.type);
    api.ops.push({ opName, bundle: rootFields.length, file });
    api.files.add(file);
    usedBy.forEach((usingFile) => {
      api.usedBy.add(usingFile);
      api.files.add(usingFile);
    });
  }
}

// ───────── 4. 도메인 · 설명 (이름·사용처로 붙임 — 백엔드 확인 필요) ─────────
const DOMAINS = [
  { id: '01-common', title: '공통·화면 설정', fields: { getAdSlots: '광고 구좌(배너) 조회', landingModal: '랜딩 모달 조회', notice: '긴급 공지 조회', refundPartner: '제휴처(파트너) 정보 조회', hometaxBlockSettings: '홈택스 차단(대기열) 설정 조회', hometaxBlockNotificationStatus: '홈택스 차단 해제 알림 신청 여부 조회', requestHometaxBlockNotification: '홈택스 차단 해제 알림 신청', reserveHometaxMaintenanceExitAlimtalk: '홈택스 점검 종료 알림톡 예약', saveRefundActionLog: '사용자 행동 로그 저장', molocoConversionStatus: '몰로코 전환 이벤트 전송 여부 조회', markMolocoConversionSent: '몰로코 전환 이벤트 전송 기록' } },
  { id: '02-me', title: '내 정보·마이', fields: { bznavRefund: '내 환급 정보(유저·환급 이력) 조회', checkUserLeave: '탈퇴 관련 확인', getRefundUserMarketingTerm: '마케팅 수신 동의 조회', updateRefundUserMarketingTerms: '마케팅 수신 동의 변경', checkRefundUserPassword: '환급 비밀번호 확인', updateRefundUserPassword: '환급 비밀번호 변경', getRefundHistoryId: '환급 이력 ID 조회' } },
  { id: '03-event', title: '이벤트·프로모션', fields: { getRefundUserPromotion: '내 프로모션 조회', getRefundUserPromotionHistory: '프로모션(초대) 이력 조회', createRefundPromotionTermsLog: '프로모션 약관 동의 기록' } },
  { id: '04-content-ssr', title: '콘텐츠 페이지 (서버 렌더링)', fields: { getRefundContentPage: '콘텐츠(랜딩) 페이지 조회 — 서버에서 로그인 없이', getRefundContentPageSitemap: '사이트맵용 콘텐츠 페이지 목록 — 서버에서 로그인 없이' } },
  { id: '05-survey', title: '설문', fields: { getSurvey: '설문 조회', getSurveyTarget: '설문 대상 조회', getSurveyStatus: '설문 진행 상태 조회', getSurveyAddress: '주소(법정동) 조회', getSurveyBusinessInfo: '사업장 정보 조회', getSurveyBusinessAnswer: '사업 문항 답변 조회', getSurveyEmployees: '직원 목록 조회', getSurveyEmploymentAnswer: '고용 문항 답변 조회', isCertNeed: '추가 인증 필요 여부 조회', putSurveyAnswer: '설문 답변 저장(put)', saveSurveyAnswer: '설문 답변 저장(save)', submitSurvey: '설문 제출', upsertBusinessAnswer: '사업 문항 답변 부분 저장', upsertEmploymentAnswer: '고용 문항 답변 부분 저장' } },
  { id: '06-bank-payment', title: '계좌·결제 카드', fields: { bankList: '은행 목록 조회', checkBankAccount: '계좌 확인(예금주)', checkBankAccountByCode: '링크 코드로 계좌 확인(간편 신청)', changeBankAccount: '환급 계좌 변경', paymentCards: '등록된 결제 카드 조회', checkNeedPaymentCard: '결제 카드 등록 필요 여부', refundPaymentCardLink: '결제 카드 등록 링크 정보(TRP)', createPaymentCard: '결제 카드 등록', updatePaymentCard: '결제 카드 변경' } },
  { id: '07-lookup', title: '환급 조회', fields: { searchRefundV2: '환급 조회 시작', checkSearchStatus: '조회 진행 상태 확인(폴링)', checkRefund: '종합소득세 환급 조회 결과 확인', checkTritxRefund: '양도세 환급 조회 결과 확인', checkLookPage: '결과 화면 열람 확인·기록', searchHometaxRefundResult: '알림톡 링크로 환급 결과 조회', searchHometaxRefundResultByLogin: '로그인 상태로 환급 결과 조회', reload: '알림톡 링크로 다시 수집', loadEmployeeIncrease: '고용 증대 추가 수집', searchPersonalDeductionByLogin: '인적공제 수집', applyRefundPossibleAlarm: '환급 가능 알림 신청' } },
  { id: '08-apply', title: '신청·취소', fields: { canApplyRefund: '신청 가능 여부 확인', checkApplyRefund: '종합소득세(·법인) 신청 정보 확인', checkApplyTritxRefund: '양도세 신청 정보 확인', applyRefund: '종합소득세(·법인) 환급 신청', tritxApplyRefund: '양도세 환급 신청', simpleApply: '간편 신청(링크)', cancelReasonsV2: '취소 사유 목록', applyCancel: '신청 취소', tritxApplyCancel: '양도세 신청 취소', revokeCancel: '취소 철회', tritxRevokeCancel: '양도세 취소 철회', getApplyRefundCertificate: '신청 확인서 조회', createApplyRefundCertificate: '신청 확인서 생성', getDeligationInfoOfUser: '위임 정보 조회', saveApplyRefundDelegationFiles: '위임장·서명 저장' } },
  { id: '09-hometax-auth', title: '홈택스 인증', fields: { hometaxSimpleAuth: '간편인증 요청(사용자가 [확인]을 누르는 방식)', hometaxSimpleAuthPolling: '간편인증 요청(자동 전환 방식)', hometaxSimpleAuthStatus: '간편인증 진행 상태 확인(폴링)', hometaxSimpleAuthConfirm: '간편인증 승인 확인 → 간편인증 토큰', hometaxLogin: '홈택스 로그인 → 조회 토큰(refundToken)', checkHometaxAccount: '홈택스 계정 확인 → 조회 토큰(refundToken) · 조회 화면용', sendCommonCertPcLink: '공동인증서 PC 링크 발송' } }
];
const POLLING = { hometaxSimpleAuthStatus: '폴링 — 3초마다(브라우저로 돌아오면 즉시 한 번), PENDING 이 아닐 때까지. 네트워크 실패 5회 연속이면 중단', checkSearchStatus: '폴링 — 3초마다, 조회가 끝날 때까지. 화면 진입 시 진행 중인 조회가 있는지 먼저 한 번' };
const fieldDomain = new Map();
DOMAINS.forEach((domain) => Object.keys(domain.fields).forEach((field) => fieldDomain.set(field, domain)));
const unassigned = [...apis.values()].filter((api) => !fieldDomain.has(api.field));
if (unassigned.length) throw new Error(`도메인 미지정: ${unassigned.map((api) => api.field).join(', ')}`);

// ───────── 5. 카드 렌더링 ─────────
const renderResponse = (map, indent) => {
  const pad = '  '.repeat(indent);
  return [...map.entries()]
    .map(([name, node]) => {
      if (!node.type) return `${pad}${name}: unknown;`;
      if (node.children.size === 0) return `${pad}${name}: ${tsType(node.type)};`;
      // 객체: 리스트·nullable 표기를 유지하며 안쪽을 펼친다
      const base = tsType(node.type);
      const objectName = gql.getNamedType(node.type).name;
      const body = `{ // ${objectName}\n${renderResponse(node.children, indent + 1)}\n${pad}}`;
      return `${pad}${name}: ${base.replace(objectName, body)};`;
    })
    .join('\n');
};
const expandInput = (type, prefix, depth, rows, sent) => {
  const named = gql.getNamedType(type);
  for (const inputField of Object.values(named.getFields())) {
    const name = `${prefix}.${inputField.name}`;
    rows.push(`| \`${name}\` | \`${tsType(inputField.type)}\` | ${gql.isNonNullType(inputField.type) ? '✅' : ''} | ${sent} | ${(inputField.description ?? '').replace(/\n/g, ' ')} |`);
    if (gql.isInputObjectType(gql.getNamedType(inputField.type)) && depth < 3) expandInput(inputField.type, name, depth + 1, rows, sent);
  }
};
const callModeOf = (api) => {
  if (POLLING[api.field]) return POLLING[api.field];
  const texts = [...api.usedBy].map((file) => sources[file]);
  if (texts.some((text) => text.includes('serverGraphQLFetch'))) return '서버(getServerSideProps)에서 — 로그인 헤더 없이';
  if (api.kind === 'mutation') return '사용자 동작 시';
  const modes = new Set();
  if (texts.some((text) => /useLazyLoadQuery|usePreloadedQuery|useQueryLoader/.test(text))) modes.add('화면 진입 시');
  if (texts.some((text) => /fetchQuery/.test(text))) modes.add('필요할 때 직접 호출');
  return [...modes].join(' · ') || '화면 진입 시';
};
const errorCodesOf = (api) => {
  const codes = new Set();
  for (const file of api.usedBy) {
    const text = sources[file];
    for (const match of text.matchAll(/TAX_REFUND_ERROR\.([^\s)?;,:\]]+)/g)) if (taxRefundErrorMap[match[1]]) codes.add(taxRefundErrorMap[match[1]]);
    for (const match of text.matchAll(/'((?:ERR|E)_[A-Z0-9_]+|FORBIDDEN)'/g)) codes.add(match[1]);
    if (text.includes('CARD_PAYMENT_ERROR')) cardErrorCodes.forEach((code) => codes.add(code));
  }
  return [...codes].sort();
};

const domainRows = new Map();
let number = 0;
const tracker = [];
for (const domain of DOMAINS) {
  usedEnums.clear();
  const domainApis = Object.keys(domain.fields).map((field) => [...apis.values()].find((api) => api.field === field)).filter(Boolean);
  let body = '';
  const domainFiles = new Set();
  domainApis.forEach((api, index) => {
    number += 1;
    const id = `${domain.id.slice(0, 2)}-${String(index + 1).padStart(2, '0')}`;
    const kindLabel = api.kind === 'query' ? '조회' : '변경';
    tracker.push({ id, domain, api, kindLabel });
    const bundled = api.ops.filter((op) => op.bundle > 1);
    const usedFiles = [...api.usedBy].filter((file) => !file.startsWith('graphql/')).sort();
    [...api.files].forEach((file) => domainFiles.add(file));
    // 요청
    const argRows = [];
    for (const arg of api.fieldDef.args) {
      const sent = api.argsSent.has(arg.name) ? '보냄' : '안 보냄';
      argRows.push(`| \`${arg.name}\` | \`${tsType(arg.type)}\` | ${gql.isNonNullType(arg.type) ? '✅' : ''} | ${sent} | ${(arg.description ?? '').replace(/\n/g, ' ')} |`);
      if (gql.isInputObjectType(gql.getNamedType(arg.type))) expandInput(arg.type, arg.name, 1, argRows, sent);
    }
    const codes = errorCodesOf(api);
    body += `\n---\n\n<a id="${id}"></a>\n\n### ${id} \`${api.field}\` — ${domain.fields[api.field]}\n\n`;
    body += `| 항목 | 내용 |\n|---|---|\n`;
    body += `| 종류 | ${kindLabel} (GraphQL ${api.kind}) |\n`;
    body += `| 호출 시점 | ${callModeOf(api)} |\n`;
    body += `| 다른 API 와 한 요청으로 묶임 | ${bundled.length ? bundled.map((op) => `\`${op.opName}\`(${op.bundle}개)`).join(', ') + ' — README 3-1' : '없음'} |\n`;
    body += `| REST (백엔드 기입) | \`METHOD /path\` |\n`;
    body += `| 진행 | ☐ 백엔드 · ☐ 프론트 |\n\n`;
    body += `**요청**\n\n`;
    body += argRows.length ? `| 이름 | 타입 | 필수 | 프론트 | 설명 |\n|---|---|---|---|---|\n${argRows.join('\n')}\n\n` : `없음\n\n`;
    body += `**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 \`${gql.getNamedType(api.fieldDef.type).name}\`)\n\n`;
    body += api.response.size ? '```ts\n{\n' + renderResponse(api.response, 1) + '\n}\n```\n\n' : `스칼라 \`${tsType(api.fieldDef.type)}\`\n\n`;
    body += `**프론트가 분기하는 에러 코드** ${codes.length ? '(이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다)' : ''}: ${codes.length ? codes.map((code) => `\`${code}\``).join(' ') : '따로 분기 없음 (`result`·메시지로만 처리)'}\n\n`;
    body += `**프론트**\n- 연산: ${api.ops.map((op) => `\`${op.opName}\` (\`${op.file}\`)`).join(', ')}\n- 쓰는 파일 (${usedFiles.length}): ${usedFiles.map((file) => `\`${file}\``).join(', ') || '(정의 파일 안에서만)'}\n`;
  });
  const enumBlock = [...usedEnums].filter((name) => name !== 'ErrorType').sort().map((name) => {
    const enumType = schema.getType(name);
    return `- \`${name}\`: ${enumType.getValues().map((value) => `\`${value.name}\``).join(' · ')}`;
  });
  const header = `# ${domain.id.slice(0, 2)}. ${domain.title}\n\n> [README](./README.md) · API ${domainApis.length}개 · 기준 ${baseRef}\n> 설명 한 줄은 API 이름·사용처로 붙였다(스키마에 설명이 없다) — 틀리면 고쳐 주세요.\n\n`;
  const summary = `## 목록\n\n| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |\n|---|---|---|---|---|---|---|\n${tracker.filter((row) => row.domain === domain).map((row) => `| [${row.id}](#${row.id}) | \`${row.api.field}\` | ${row.kindLabel} | ${domain.fields[row.api.field]} | | ☐ | ☐ |`).join('\n')}\n\n`;
  const enumSection = enumBlock.length ? `## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)\n\n${enumBlock.join('\n')}\n- \`ErrorType\`(에러 코드) 은 [README 5-3](./README.md#5-3-에러-코드)\n\n` : '';
  const fileSection = `## 프론트 작업 파일 (${domainFiles.size}) — \`apps/refund-web/\` 기준\n\n${[...domainFiles].sort().map((file) => `- \`${file}\``).join('\n')}\n\n`;
  fs.writeFileSync(path.join(outDir, `${domain.id}.md`), header + summary + enumSection + fileSection + `## API 상세\n${body}`);
  domainRows.set(domain.id, { domain, count: domainApis.length, files: domainFiles.size });
}

// ───────── 6. README 에 넣을 표 · 숫자 ─────────
const summary = {
  operations: operations.length,
  queries: operations.filter((op) => op.kind === 'query').length,
  mutations: operations.filter((op) => op.kind === 'mutation').length,
  apis: apis.size,
  bundles: operations.filter((op) => op.roots.length > 1).map((op) => ({ opName: op.opName, roots: op.roots, usedBy: op.usedBy.filter((file) => !file.startsWith('graphql/')) })),
  shared: [...apis.values()].filter((api) => api.ops.length > 1).map((api) => ({ field: api.field, count: api.ops.length })).sort((a, b) => b.count - a.count),
  unused: operations.filter((op) => op.usedBy.length === 0).map((op) => op.opName),
  domains: [...domainRows.values()].map((row) => ({ id: row.domain.id, title: row.domain.title, count: row.count, files: row.files })),
  tracker: tracker.map((row) => ({ id: row.id, domainId: row.domain.id, domain: row.domain.title, field: row.api.field, kind: row.kindLabel, label: row.domain.fields[row.api.field] }))
};
// README 진행표를 다시 만들 때 쓰는 요약
fs.writeFileSync(path.join(outDir, '.summary.json'), JSON.stringify(summary, null, 2));
console.log(`API ${apis.size} · 연산 ${operations.length} (q${summary.queries}/m${summary.mutations}) · 도메인 ${DOMAINS.length}`);
