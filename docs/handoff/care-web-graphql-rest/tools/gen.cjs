// care-web GraphQL 사용 현황 → 백엔드·프론트 작업용 문서 폴더 생성 (refund-web 판 tools/gen.cjs 를 care 에 맞춤)
// 사용: node tools/gen.cjs <graphql 패키지 경로> <care-web 경로> <출력 폴더> <기준 ref 문구>
// care 와 refund 의 차이: 응답이 union(성공·오류 타입)이라 카드에 멤버별로 펼친다 · 분기는 __typename 비교 · 파일 업로드(Upload) 있음
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
const schema = gql.buildSchema(fs.readFileSync(path.join(appDir, 'schema/schema-care.graphql'), 'utf8'), { assumeValidSDL: true });

const definitions = [];
for (const [file, text] of Object.entries(sources)) {
  const tagPattern = /graphql`([\s\S]*?)`/g;
  let match;
  while ((match = tagPattern.exec(text))) {
    for (const def of gql.parse(match[1]).definitions) definitions.push({ file, def });
  }
}
const fragments = Object.fromEntries(definitions.filter((item) => item.def.kind === 'FragmentDefinition').map((item) => [item.def.name.value, item]));

// 에러 상수(ERROR_TYPE 키 → __typename 값) — constants/error.ts
const errorSource = sources['constants/error.ts'] ?? '';
const errorTypeMap = Object.fromEntries([...errorSource.matchAll(/^\s{2}(\w+): '([^']+)'/gm)].map((item) => [item[1], item[2]]));

// ───────── 2. 타입 표기 ─────────
const SCALAR_TS = { String: 'string', ID: 'string', Int: 'number', Float: 'number', Boolean: 'boolean', Upload: 'File /* Upload — multipart */' };
const usedEnums = new Set();
const wrapForArray = (text) => (text.includes('|') ? `(${text})` : text);
const tsType = (type) => {
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

// ───────── 3. 루트 필드(API)별로 모으기 ─────────
// 선택 = { fields: Map<이름, { type, sel }>, variants: Map<타입명, 선택> } — union·interface 의 ... on X 는 variants 로
const newSel = () => ({ fields: new Map(), variants: new Map() });
const mergeSelection = (target, selectionSet, parentType) => {
  if (!selectionSet) return;
  const named = gql.getNamedType(parentType);
  for (const selection of selectionSet.selections) {
    if (selection.kind === 'Field') {
      const fieldName = selection.name.value;
      if (fieldName === '__typename') continue;
      const fieldDef = named?.getFields?.()[fieldName];
      if (!target.fields.has(fieldName)) target.fields.set(fieldName, { type: fieldDef?.type ?? null, sel: newSel() });
      mergeSelection(target.fields.get(fieldName).sel, selection.selectionSet, fieldDef?.type);
    } else if (selection.kind === 'InlineFragment') {
      const condName = selection.typeCondition?.name.value;
      if (condName && named && gql.isAbstractType(named) && condName !== named.name) {
        if (!target.variants.has(condName)) target.variants.set(condName, newSel());
        mergeSelection(target.variants.get(condName), selection.selectionSet, schema.getType(condName));
      } else mergeSelection(target, selection.selectionSet, condName ? schema.getType(condName) : parentType);
    } else if (selection.kind === 'FragmentSpread') {
      const fragment = fragments[selection.name.value];
      if (!fragment) continue;
      const condName = fragment.def.typeCondition.name.value;
      if (named && gql.isAbstractType(named) && condName !== named.name) {
        if (!target.variants.has(condName)) target.variants.set(condName, newSel());
        mergeSelection(target.variants.get(condName), fragment.def.selectionSet, schema.getType(condName));
      } else mergeSelection(target, fragment.def.selectionSet, schema.getType(condName));
    }
  }
};

const apis = new Map();
const operations = [];
for (const { file, def } of definitions) {
  if (def.kind !== 'OperationDefinition') continue;
  const opName = def.name.value;
  const exportMatch = new RegExp(`(?:export )?const (\\w+)\\s*=\\s*graphql\`\\s*${def.operation}\\s+${opName}\\b`).exec(sources[file]);
  const exportName = exportMatch?.[1] ?? null;
  const usedBy = Object.entries(sources)
    .filter(([usingFile, text]) => {
      if (usingFile === file) {
        if (!exportName) return /use(LazyLoadQuery|Mutation|QueryLoader|PreloadedQuery|Fragment)|fetchQuery/.test(text);
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
    if (!apis.has(key)) apis.set(key, { key, kind: def.operation, field: fieldName, fieldDef, argsSent: new Set(), response: newSel(), ops: [], files: new Set([file]), usedBy: new Set() });
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

// ───────── 4. 도메인 · 설명 ─────────
// 설명은 스키마 설명을 쓰고, 없거나 잘못 복사된 것만 아래 OVERRIDE (이름·사용처로 붙임 — 백엔드 확인 필요)
const DOMAINS = [
  { id: '01-common', title: '공통·내 정보', fields: ['me', 'orgList', 'Ledger', 'getRfndAccs', 'registerRfndAcc', 'findMarketingTerms', 'approveMarketingTerms', 'withdrawMarketingTerms', 'addSubAccount', 'mktEvent'] },
  { id: '02-hometax', title: '홈택스 연동·수임 동의·4대보험', fields: ['hometaxSimpleLogin', 'hometaxSimpleLoginConfirm', 'hometaxIdConnect', 'hometaxChangePassword', 'issueTmpCrdtlsCer', 'redeemTmpCrdtlsCer', 'hometaxOrgs', 'taxAgencyAgree', 'survey', 'fourInsureDelegationOrgs', 'fourInsureDelegationAgreement'] },
  { id: '03-pricing', title: '이용료 조회·가입', fields: ['hometaxOrgsV2', 'leadCalcResultV2', 'sendHookForPricingStart', 'saveLeadEmployeeInfo', 'promotionNotice'] },
  { id: '04-billing', title: '결제', fields: ['orgsRegularPaymentMethod', 'incometaxOrgsRegularPaymentMethod', 'myRegularPaymentMethods', 'cmsRequiredOrgs', 'hasPaymentOverdue', 'paymentOverdueStats', 'checkBankAccount', 'initMyBankPayment', 'createRegularPayment', 'refCreateRegularPayment', 'prePayment', 'createPaymentLink'] },
  { id: '05-vat-material', title: '부가세 자료제출', fields: ['vatMaterialMain', 'vatRecommendMaterial', 'passMaterialStatus', 'savePassMaterialStatus', 'saveFirstEnter', 'orgMaterialDetail', 'materialFileDownload', 'orgCashSalesInfo', 'salesMallList', 'vatMaterialReusing', 'vatCardList', 'vatCardDetail', 'vatCardDetailByMaterialId', 'updatePersonalCardNo', 'deletePersonalCardNo', 'cardFileUpload', 'rentInfoList', 'beforeRentInfoList', 'rentParsing', 'insertRentInfo', 'updateRentInfo', 'deleteRentInfo', 'taxInvcInfoList', 'taxInvcParsingMultiple', 'insertTaxInvcInfo', 'updateTaxInvcInfo', 'deleteTaxInvcInfo', 'checkBsnoValid', 'fileUpload', 'saveTextMaterial', 'deleteSubmittedMaterial', 'vatMaterialComplete', 'vatMaterialCancel'] },
  { id: '06-vat-connect', title: '부가세 판매처(배달앱·온라인몰) 연동', fields: ['deliveryAccountStatus', 'onlineMallAccountStatus', 'linkDeliveryAccount', 'linkOnlineMallAccount', 'inputAuthNumber', 'deleteLinkStatus'] },
  { id: '07-vat-declare', title: '부가세 예상세액·신고 결과', fields: ['vatDeclareStatus', 'allVatMaterialAppliedCheck', 'vatDeclareEstimatedTax', 'getDeductionSummary', 'myBankAccount', 'vatDeclareEstimatedTaxConfirm', 'vatDeclareResult', 'vatDeclareResultList', 'vatDeclareResultById'] },
  { id: '08-income-material', title: '종소세 자료제출', fields: ['incomeMaterialMain', 'personalExemptionInfo', 'submitPersonalExemptionSurvey', 'dependentList', 'createDependent', 'updateDependent', 'deleteDependent', 'deleteAllDependent', 'updateBulkDisabilityYn', 'checkFamilyRegistryCert', 'familyRegistryCertLogin', 'familyRegistryCertSign', 'smeTaxExemptionDetail', 'prevMilitaryPeriod', 'submitIncomeMaterial', 'donationInfo', 'donationFileList', 'incomeMaterialEtcFiles', 'incomeEtcSupportingMaterial', 'expensesMySelectList', 'updateBulkSelectedYn', 'expensesLocalTaxDetail', 'localTaxCertLogin', 'scrapingLocalTax', 'incomeCardFeeOrgs', 'scrapingCardFee', 'incomeTaxOrgsCardSummary', 'incomeTaxCardList', 'incomeTaxCardDetail', 'incomeTaxCardDetailByMaterial', 'updateIncomeTaxPersonalCardNo', 'deleteIncomeTaxPersonalCardNo', 'incomeTaxCardFileUpload', 'incomeTaxAdditionalExpenseBookDetail', 'incomeFileUpload', 'deleteSubmittedIncomeMaterial', 'yearendAuthRequest', 'yearendAuthResult', 'yearendDownlaod'] },
  { id: '09-income-declare', title: '종소세 진행·예상세액·신고 결과', fields: ['checkIncomeIntroStatus', 'checkIncomeFirstEnter', 'updateIncomeFirstEnter', 'incomeTaxStlAgree', 'checkAllMaterialApplied', 'incomeTaxDeclareEstimatedTax', 'checkBankAccountForDeclare', 'declareRefundAccount', 'refundClaimList', 'incomeTaxDeclareStageConfirm', 'incomeTaxDeclareResult', 'incomeTaxDeclareList', 'incomeTaxDeclareResultById'] },
  { id: '10-payroll', title: '급여', fields: ['listWorker', 'listPayroll', 'listPayrollMonthly', 'getSalaryDay', 'updateSalaryDay', 'getOrgsWithoutSubmission', 'updatePayroll', 'updateNoPayroll', 'uploadPayrollFile', 'getWithholdingOrgs', 'getWithholdingResultDetail'] },
  { id: '11-part-time', title: '알바 급여 계산', fields: ['orgListByNormalUser', 'getPartTimers', 'getWorkersWithPayResult', 'getPartTimeWorkerDetail', 'updatePartTimeWorkerBasicInfo', 'updatePartTimeAdditionalInfo', 'getPartTimeDetail', 'getDailyBreakdowns', 'calculateWeeklyHoliday', 'updatePayCalculate'] },
  { id: '12-year-end-tax', title: '연말정산', fields: ['getYearEndTaxOrgs', 'getYearEndTaxEmployees', 'getYearEndTaxFiles', 'uploadYearEndTaxFile', 'deleteYearEndTaxFile', 'updateYearEndTaxEmployeePrgrStat', 'getYearEndTaxCalcSummary'] },
  { id: '13-expense-card', title: '추가경비 증빙·사업용 카드', fields: ['bkpAddXpsPrfList', 'bkpAddXpsPrfInfo', 'bkpAddXpsPrfParsingMultiple', 'insertBkpAddXpsPrfInfo', 'updateBkpAddXpsPrfInfo', 'deleteBkpAddXpsPrfInfo', 'getXpsPrfSbmsBrkds', 'getXpsPrfSbmsBrkd', 'getCardCompanies', 'listCards', 'registerCard', 'updateCard', 'removeCard'] },
  { id: '14-startup-check', title: '창업 점검(세액공제·감면 진단)', fields: ['startupConversation', 'startupConversationResult', 'saveStartupCheck', 'startupCheck', 'sendHookForStartupCheck'] }
];
const OVERRIDE = JSON.parse(fs.readFileSync(path.join(__dirname, 'descriptions.json'), 'utf8'));
const POLLING = { hometaxOrgsV2: '폴링 — 1.5초마다 같은 조회를 반복, 결과 타입이 진행 중이 아닐 때까지 (README 3-3 ②)' };
const fieldDomain = new Map();
DOMAINS.forEach((domain) => domain.fields.forEach((field) => fieldDomain.set(field, domain)));
const unassigned = [...apis.values()].filter((api) => !fieldDomain.has(api.field));
if (unassigned.length) throw new Error(`도메인 미지정: ${unassigned.map((api) => api.field).join(', ')}`);
const describe = (api) => (OVERRIDE[api.field] ?? (api.fieldDef.description ?? '').replace(/\s+/g, ' ').trim()) || '(설명 없음 — 확인 필요)';

// ───────── 5. 카드 렌더링 ─────────
const renderFields = (fields, indent) => {
  const pad = '  '.repeat(indent);
  return [...fields.entries()].map(([name, node]) => {
    if (!node.type) return `${pad}${name}: unknown;`;
    if (node.sel.fields.size === 0 && node.sel.variants.size === 0) return `${pad}${name}: ${tsType(node.type)};`;
    const base = tsType(node.type);
    const objectName = gql.getNamedType(node.type).name;
    return `${pad}${name}: ${base.replace(objectName, renderObject(node.sel, gql.getNamedType(node.type), indent))};`;
  }).join('\n');
};
const renderObject = (sel, namedType, indent) => {
  const pad = '  '.repeat(indent);
  if (sel.variants.size === 0) return `{ // ${namedType.name}\n${renderFields(sel.fields, indent + 1)}\n${pad}}`;
  // union: 프론트가 읽는 멤버만 펼치고 나머지 멤버는 이름만
  const members = gql.isUnionType(namedType) ? namedType.getTypes().map((member) => member.name) : [];
  const parts = [...sel.variants.entries()].map(([typeName, variantSel]) => {
    const merged = new Map([...sel.fields, ...variantSel.fields]);
    const body = renderFields(merged, indent + 1);
    // union 멤버가 아닌 조건(BaseError 같은 interface)은 '그 interface 를 구현한 멤버 공통' 으로 표기
    if (members.length && !members.includes(typeName)) return `{ // ... on ${typeName} — 이 interface 를 구현한 멤버 공통${body ? '\n' + body : ''}\n${pad}}`;
    return `{\n${pad}  __typename: '${typeName}';${body ? '\n' + body : ''}\n${pad}}`;
  });
  const rest = members.filter((name) => !sel.variants.has(name));
  if (rest.length) parts.push(`{ __typename: ${rest.map((name) => `'${name}'`).join(' | ')} } /* 필드를 읽지 않는 멤버 */`);
  return parts.join(`\n${pad}| `);
};
const expandInput = (type, prefix, depth, rows, sent) => {
  const named = gql.getNamedType(type);
  for (const inputField of Object.values(named.getFields())) {
    const name = `${prefix}.${inputField.name}`;
    rows.push(`| \`${name}\` | \`${cell(tsType(inputField.type))}\` | ${gql.isNonNullType(inputField.type) ? '✅' : ''} | ${sent} | ${(inputField.description ?? '').replace(/\n/g, ' ')} |`);
    if (gql.isInputObjectType(gql.getNamedType(inputField.type)) && depth < 3) expandInput(inputField.type, name, depth + 1, rows, sent);
  }
};
// 표 칸 안의 | 는 칸 구분자로 읽히므로 이스케이프
const cell = (text) => text.replace(/\|/g, '\\|');
const hasUpload = (type, depth = 0) => {
  const named = gql.getNamedType(type);
  if (named.name === 'Upload') return true;
  if (gql.isInputObjectType(named) && depth < 3) return Object.values(named.getFields()).some((inputField) => hasUpload(inputField.type, depth + 1));
  return false;
};
const callModeOf = (api) => {
  if (POLLING[api.field]) return POLLING[api.field];
  if (api.kind === 'mutation') return '사용자 동작 시';
  const texts = [...api.usedBy].map((file) => sources[file]);
  const modes = new Set();
  if (texts.some((text) => /useLazyLoadQuery|usePreloadedQuery|useQueryLoader/.test(text))) modes.add('화면 진입 시');
  if (texts.some((text) => /fetchQuery/.test(text))) modes.add('필요할 때 직접 호출');
  if (texts.some((text) => /fetchGraphQLFactory/.test(text))) modes.add('Relay 밖 직접 fetch');
  return [...modes].join(' · ') || '화면 진입 시';
};
// 프론트가 분기하는 응답 타입: 이 API 를 쓰는 파일에서 union 멤버 이름을 문자열로 비교하거나 ERROR_TYPE 상수로 비교하는 것
const branchTypesOf = (api) => {
  const named = gql.getNamedType(api.fieldDef.type);
  const members = new Set(gql.isUnionType(named) ? named.getTypes().map((member) => member.name) : []);
  const found = new Set();
  for (const file of api.usedBy) {
    const text = sources[file];
    for (const match of text.matchAll(/'([A-Z][A-Za-z0-9]+)'/g)) if (members.has(match[1])) found.add(match[1]);
    for (const match of text.matchAll(/ERROR_TYPE\.(\w+)/g)) if (members.has(errorTypeMap[match[1]])) found.add(errorTypeMap[match[1]]);
  }
  return [...found].sort();
};

const domainRows = new Map();
const tracker = [];
for (const domain of DOMAINS) {
  usedEnums.clear();
  const domainApis = domain.fields.flatMap((field) => [...apis.values()].filter((api) => api.field === field));
  let body = '';
  const domainFiles = new Set();
  domainApis.forEach((api, index) => {
    const id = `${domain.id.slice(0, 2)}-${String(index + 1).padStart(2, '0')}`;
    const kindLabel = api.kind === 'query' ? '조회' : '변경';
    const label = describe(api);
    tracker.push({ id, domain, api, kindLabel, label, branches: branchTypesOf(api) });
    const usedFiles = [...api.usedBy].filter((file) => !/\/graphql\/|^graphql\//.test(file)).sort();
    [...api.files].forEach((file) => domainFiles.add(file));
    const argRows = [];
    for (const arg of api.fieldDef.args) {
      const sent = api.argsSent.has(arg.name) ? '보냄' : '안 보냄';
      argRows.push(`| \`${arg.name}\` | \`${cell(tsType(arg.type))}\` | ${gql.isNonNullType(arg.type) ? '✅' : ''} | ${sent} | ${(arg.description ?? '').replace(/\n/g, ' ')} |`);
      if (gql.isInputObjectType(gql.getNamedType(arg.type))) expandInput(arg.type, arg.name, 1, argRows, sent);
    }
    const upload = api.fieldDef.args.some((arg) => hasUpload(arg.type));
    const branches = branchTypesOf(api);
    const named = gql.getNamedType(api.fieldDef.type);
    const sameApiOps = api.ops.length > 1 ? `${api.ops.length}개 — ${api.ops.map((op) => `\`${op.opName}\``).join(', ')} (README 3-2)` : '1개';
    body += `\n---\n\n<a id="${id}"></a>\n\n### ${id} \`${api.field}\` — ${label}\n\n`;
    body += `| 항목 | 내용 |\n|---|---|\n`;
    body += `| 종류 | ${kindLabel} (GraphQL ${api.kind})${upload ? ' · **파일 업로드(multipart)**' : ''} |\n`;
    body += `| 호출 시점 | ${callModeOf(api)} |\n`;
    body += `| 이 API 를 부르는 프론트 연산 | ${sameApiOps} |\n`;
    body += `| REST (백엔드 기입) | \`METHOD /path\` |\n`;
    body += `| 진행 | ☐ 백엔드 · ☐ 프론트 |\n\n`;
    body += `**요청**\n\n`;
    body += argRows.length ? `| 이름 | 타입 | 필수 | 프론트 | 설명 |\n|---|---|---|---|---|\n${argRows.join('\n')}\n\n` : `없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)\n\n`;
    body += `**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 \`${named.name}\`${gql.isUnionType(named) ? ` · union ${named.getTypes().length}종` : ''})\n\n`;
    const responseText = api.response.fields.size || api.response.variants.size ? renderObject(api.response, named, 0) : `${tsType(api.fieldDef.type)}`;
    body += '```ts\n' + responseText + '\n```\n\n';
    body += `**프론트가 분기하는 응답 타입** ${branches.length ? '(이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다)' : ''}: ${branches.length ? branches.map((name) => `\`${name}\``).join(' ') : '따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)'}\n\n`;
    body += `**프론트**\n- 연산: ${api.ops.map((op) => `\`${op.opName}\` (\`${op.file}\`)`).join(', ')}\n- 쓰는 파일 (${usedFiles.length}): ${usedFiles.map((file) => `\`${file}\``).join(', ') || '(정의 파일 안에서만)'}\n`;
  });
  const enumBlock = [...usedEnums].sort().map((name) => `- \`${name}\`: ${schema.getType(name).getValues().map((value) => `\`${value.name}\``).join(' · ')}`);
  const header = `# ${domain.id.slice(0, 2)}. ${domain.title}\n\n> [README](./README.md) · API ${domainApis.length}개 · 기준 ${baseRef}\n> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.\n\n`;
  const summaryTable = `## 목록\n\n| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |\n|---|---|---|---|---|---|---|\n${tracker.filter((row) => row.domain === domain).map((row) => `| [${row.id}](#${row.id}) | \`${row.api.field}\` | ${row.kindLabel} | ${row.label} | | ☐ | ☐ |`).join('\n')}\n\n`;
  const enumSection = enumBlock.length ? `## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)\n\n${enumBlock.join('\n')}\n\n` : '';
  const fileSection = `## 프론트 작업 파일 (${domainFiles.size}) — \`apps/care-web/\` 기준\n\n${[...domainFiles].sort().map((file) => `- \`${file}\``).join('\n')}\n\n`;
  fs.writeFileSync(path.join(outDir, `${domain.id}.md`), header + summaryTable + enumSection + fileSection + `## API 상세\n${body}`);
  domainRows.set(domain.id, { domain, count: domainApis.length, files: domainFiles.size, uploads: domainApis.filter((api) => api.fieldDef.args.some((arg) => hasUpload(arg.type))).length });
}

// ───────── 6. README 에 넣을 표 · 숫자 ─────────
const summary = {
  operations: operations.length,
  queries: operations.filter((op) => op.kind === 'query').length,
  mutations: operations.filter((op) => op.kind === 'mutation').length,
  apis: apis.size,
  bundles: operations.filter((op) => op.roots.length > 1).map((op) => op.opName),
  shared: [...apis.values()].filter((api) => api.ops.length > 1).map((api) => ({ field: api.field, ops: api.ops.map((op) => op.opName) })),
  unused: operations.filter((op) => op.usedBy.length === 0).map((op) => op.opName),
  uploads: [...apis.values()].filter((api) => api.fieldDef.args.some((arg) => hasUpload(arg.type))).map((api) => api.field),
  noArgs: [...apis.values()].filter((api) => api.argsSent.size === 0).map((api) => api.field),
  domains: [...domainRows.values()].map((row) => ({ id: row.domain.id, title: row.domain.title, count: row.count, files: row.files, uploads: row.uploads })),
  tracker: tracker.map((row) => ({ id: row.id, domainId: row.domain.id, domain: row.domain.title, field: row.api.field, kind: row.kindLabel, label: row.label, branches: row.branches, members: gql.isUnionType(gql.getNamedType(row.api.fieldDef.type)) ? gql.getNamedType(row.api.fieldDef.type).getTypes().map((member) => member.name) : [] })),
  missingDescriptions: [...apis.values()].filter((api) => !api.fieldDef.description && !OVERRIDE[api.field]).map((api) => api.field)
};
fs.writeFileSync(path.join(outDir, '.summary.json'), JSON.stringify(summary, null, 2));
console.log(`API ${apis.size} · 연산 ${operations.length} (q${summary.queries}/m${summary.mutations}) · 도메인 ${DOMAINS.length} · 설명 없음 ${summary.missingDescriptions.length}`);
