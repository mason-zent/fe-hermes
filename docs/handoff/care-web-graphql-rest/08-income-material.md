# 08. 종소세 자료제출

> [README](./README.md) · API 39개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [08-01](#08-01) | `incomeMaterialMain` | 조회 | 종소세 자료제출 메인 | | ☐ | ☐ |
| [08-02](#08-02) | `personalExemptionInfo` | 조회 | 본인공제 정보 | | ☐ | ☐ |
| [08-03](#08-03) | `submitPersonalExemptionSurvey` | 변경 | 본인공제 설문 제출 | | ☐ | ☐ |
| [08-04](#08-04) | `dependentList` | 조회 | 부양가족 목록 | | ☐ | ☐ |
| [08-05](#08-05) | `createDependent` | 변경 | 부양가족 생성 | | ☐ | ☐ |
| [08-06](#08-06) | `updateDependent` | 변경 | 부양가족 정보 개별 업데이트 | | ☐ | ☐ |
| [08-07](#08-07) | `deleteDependent` | 변경 | 부양가족 개별 삭제 | | ☐ | ☐ |
| [08-08](#08-08) | `deleteAllDependent` | 변경 | 부양가족 전체 삭제 (스키마 설명 '부양가족 개별 삭제' 는 복사 실수로 보임) | | ☐ | ☐ |
| [08-09](#08-09) | `updateBulkDisabilityYn` | 변경 | 부양가족 장애여부 일괄 업데이트 | | ☐ | ☐ |
| [08-10](#08-10) | `checkFamilyRegistryCert` | 조회 | 가족관계 증명서 이미 수집 여부 | | ☐ | ☐ |
| [08-11](#08-11) | `familyRegistryCertLogin` | 변경 | 가족관계 증명서 로그인 요청 | | ☐ | ☐ |
| [08-12](#08-12) | `familyRegistryCertSign` | 변경 | 가족관계 증명서 로그인 확인 및 발급요청 | | ☐ | ☐ |
| [08-13](#08-13) | `smeTaxExemptionDetail` | 조회 | 종소세 중소기업 세액감면 상세 | | ☐ | ☐ |
| [08-14](#08-14) | `prevMilitaryPeriod` | 조회 | 이전 신고 군 복무 기간 | | ☐ | ☐ |
| [08-15](#08-15) | `submitIncomeMaterial` | 변경 | 종소세 자료제출 (수기) | | ☐ | ☐ |
| [08-16](#08-16) | `donationInfo` | 조회 | 종소세 자료제출 내역 | | ☐ | ☐ |
| [08-17](#08-17) | `donationFileList` | 조회 | 종소세 기타자료 제출 내역 | | ☐ | ☐ |
| [08-18](#08-18) | `incomeMaterialEtcFiles` | 조회 | 종소세 기타자료 제출 내역 | | ☐ | ☐ |
| [08-19](#08-19) | `incomeEtcSupportingMaterial` | 조회 | 종소세 기타 증빙 제출 내역 | | ☐ | ☐ |
| [08-20](#08-20) | `expensesMySelectList` | 조회 | 종소세 경비자료 선택 리스트 | | ☐ | ☐ |
| [08-21](#08-21) | `updateBulkSelectedYn` | 변경 | 부양가족 선택여부 일괄 업데이트 | | ☐ | ☐ |
| [08-22](#08-22) | `expensesLocalTaxDetail` | 조회 | 종소세 지방세 납부 상세 | | ☐ | ☐ |
| [08-23](#08-23) | `localTaxCertLogin` | 변경 | 종소세-지방세납부 간편인증 | | ☐ | ☐ |
| [08-24](#08-24) | `scrapingLocalTax` | 변경 | 종소세-지방세납부 스크래핑 | | ☐ | ☐ |
| [08-25](#08-25) | `incomeCardFeeOrgs` | 조회 | 종소세 카드수수료 경비처리 대상 사업체 리스트 | | ☐ | ☐ |
| [08-26](#08-26) | `scrapingCardFee` | 변경 | 종소세-카드수수료 스크래핑 | | ☐ | ☐ |
| [08-27](#08-27) | `incomeTaxOrgsCardSummary` | 조회 | 종소세 신고 대상 사업체별 개인카드(추가/홈택스) 요약 | | ☐ | ☐ |
| [08-28](#08-28) | `incomeTaxCardList` | 조회 | 종소세 개인카드(신고용) 리스트 조회 | | ☐ | ☐ |
| [08-29](#08-29) | `incomeTaxCardDetail` | 조회 | 종소세 개인카드(신고용) 단건 조회 | | ☐ | ☐ |
| [08-30](#08-30) | `incomeTaxCardDetailByMaterial` | 조회 | 종소세 제출자료 ID별 개인카드 상세 조회 | | ☐ | ☐ |
| [08-31](#08-31) | `updateIncomeTaxPersonalCardNo` | 변경 | 종소세 개인카드 번호 등록 또는 수정 | | ☐ | ☐ |
| [08-32](#08-32) | `deleteIncomeTaxPersonalCardNo` | 변경 | 종소세 개인카드 삭제 | | ☐ | ☐ |
| [08-33](#08-33) | `incomeTaxCardFileUpload` | 변경 | 종소세 개인카드(신고용) 파일 업로드 및 파싱 | | ☐ | ☐ |
| [08-34](#08-34) | `incomeTaxAdditionalExpenseBookDetail` | 조회 | 장부 매입 중 경조사·개인카드·기타증빙 — 종류별 합계와 내역 | | ☐ | ☐ |
| [08-35](#08-35) | `incomeFileUpload` | 변경 | 종소세 파일업로드 | | ☐ | ☐ |
| [08-36](#08-36) | `deleteSubmittedIncomeMaterial` | 변경 | 종소세 제출자료 삭제 | | ☐ | ☐ |
| [08-37](#08-37) | `yearendAuthRequest` | 변경 | 연말정산 홈택스 인증 요청 | | ☐ | ☐ |
| [08-38](#08-38) | `yearendAuthResult` | 변경 | 연말정산 홈택스 인증 결과 | | ☐ | ☐ |
| [08-39](#08-39) | `yearendDownlaod` | 변경 | 연말정산 다운로드 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `AdditionalExpenseBillTypeEnum`: `CEREMONY` · `PERSONAL_CARD` · `ETC`
- `CardFeeScrapingType`: `Zsoo` · `User`
- `CompletedType`: `none` · `continue` · `completed`
- `CompletionStatusEnum`: `NO_TARGET` · `INCOMPLETE` · `PARTIALLY_COMPLETE` · `COMPLETE`
- `FamilyRegistryCertErrorType`: `LOGIN_EXPIRED` · `FAMILY_INFO_MISMATCH` · `NAME_REGNO_MISMATCH` · `INVALID_INPUT` · `KAKAO_AUTH_INCOMPLETE`
- `HtxError`: `HtxDataNotFoundError` · `HtxESubmitError` · `HtxLoginError` · `HtxOrgNotFoundError` · `HtxOverloadError` · `HtxPermissionError` · `HtxRExportError` · `HtxReportError` · `HtxSessionExpireError` · `HtxSimpleCertError` · `HtxTimeoutError` · `HtxUnknownError`
- `IncomeCardFeeStatusType`: `none` · `completed`
- `IncomeMaterialTypeEnum`: `DependentDisabilityCertificate` · `DependentFamilyCertificate` · `AdditionalExemptionDonation` · `SmeTaxExemptionMilitaryPeriod` · `SmeTaxExemptionSurvey` · `PersonalExemptionDisabilityCertificate` · `PersonalExemptionSurvey` · `ExpensesCardFee` · `ExpensesEtcFile` · `ExpensesLocalTax` · `ExpensesMySelectList` · `YearendTaxSettlement` · `PersonalCard` · `RefundClaim`
- `RelationCode`: `SELF` · `DIRECT_DESCENDANT` · `SPOUSE_DESCENDANT` · `SPOUSE` · `DIRECT_RELATIVE` · `OTHER_DIRECT_RELATIVE` · `SIBLINGS` · `RECIPIENT` · `FOSTER_CHILD`

## 프론트 작업 파일 (114) — `apps/care-web/` 기준

- `app/global-income/(auth)/(submit-material)/card-expense/detail/components/CardDetailView.tsx`
- `app/global-income/(auth)/(submit-material)/card-expense/detail/components/CardDetailWrapper.tsx`
- `app/global-income/(auth)/(submit-material)/card-expense/detail/components/CardUseDetailList.tsx`
- `app/global-income/(auth)/(submit-material)/card-expense/detail/hooks/useGetGlobalIncomeCardDetail.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/graphql/deleteIncomeTaxPersonalCardNo.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/graphql/globalIncomeCardDetail.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/graphql/globalIncomeCardDetailByMaterialId.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/graphql/globalIncomeCardList.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/graphql/incomeTaxCardFileUpload.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/graphql/updateIncomeTaxPersonalCardNo.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/hooks/useGetGlobalIncomeCardList.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/hooks/useGlobalIncomeCardListQuery.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/hooks/usePersonalCardNo.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/page.tsx`
- `app/global-income/(auth)/(submit-material)/card-expense/summary/hooks/useGetCardListByMaterial.ts`
- `app/global-income/(auth)/(submit-material)/card-expense/upload-file/hooks/useUploadCardFile.ts`
- `app/global-income/(auth)/(submit-material)/deductions-additional/collection-complete/hooks/useGetDonationInfo.ts`
- `app/global-income/(auth)/(submit-material)/deductions-additional/collection-complete/hooks/useIncomeMaterialUpload.ts`
- `app/global-income/(auth)/(submit-material)/deductions-additional/components/CollectProcessDrawer.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-additional/hooks/useGetDonationFileList.ts`
- `app/global-income/(auth)/(submit-material)/deductions-additional/hooks/useYearendAuthRequest.ts`
- `app/global-income/(auth)/(submit-material)/deductions-additional/hooks/useYearendAuthResult.ts`
- `app/global-income/(auth)/(submit-material)/deductions-additional/hooks/useYearendDownload.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/constants/RelationType.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/dependents-list/components/DependentUploadButton.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/dependents-list/hooks/useDependentFileUpload.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useCheckFamilyRegistryCert.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useFamilyRegistryCertLogin.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useFamilyRegistryCertSign.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useGetDependentsList.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useSupremeCourtSimpleLogin.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/add-dependents/page.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/DeleteDependentButton.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/DeleteDependentDialog.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/RegistCancelDialog.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/RegisterDependentsForm.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/RelationListDrawer.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useCreateDependent.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useDeleteAllDependent.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useDeleteDependent.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useRegisterDependents.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useRegisterDependentsForm.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useUpdateDependent.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/modify-dependents/page.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/page.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/select-disability/hooks/useUpdateBulkDataYn.ts`
- `app/global-income/(auth)/(submit-material)/deductions-personal/hooks/useGetPersonalExemptionSurvey.ts`
- `app/global-income/(auth)/(submit-material)/deductions-personal/hooks/useSubmitDisabilityMaterial.ts`
- `app/global-income/(auth)/(submit-material)/deductions-personal/hooks/useSubmitPersonalExemptionSurvey.ts`
- `app/global-income/(auth)/(submit-material)/deductions-personal/page.tsx`
- `app/global-income/(auth)/(submit-material)/expenses-card-fees/hooks/useGetIncomeCardFeeOrgs.ts`
- `app/global-income/(auth)/(submit-material)/expenses-card-fees/hooks/useScrapingCardFee.ts`
- `app/global-income/(auth)/(submit-material)/expenses-card-fees/input/components/CardFeeScrappingDrawer.tsx`
- `app/global-income/(auth)/(submit-material)/expenses-card-fees/input/components/CollectInfoBottomButton.tsx`
- `app/global-income/(auth)/(submit-material)/expenses-documents/hooks/useSubmitSelectList.ts`
- `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/components/EtcSupportingMaterialDrawer.tsx`
- `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/components/EtcSupportingMaterialList.tsx`
- `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/components/ExpenseFileUpload.tsx`
- `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/hooks/useGetEtcSupportingMaterial.ts`
- `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/hooks/useGetExpenseEtcFile.ts`
- `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/hooks/useGetSelectList.ts`
- `app/global-income/(auth)/(submit-material)/local-tax-expense/hooks/useGovernmentSimpleAuth.ts`
- `app/global-income/(auth)/(submit-material)/local-tax-expense/hooks/useScrapingLocalTax.ts`
- `app/global-income/(auth)/(submit-material)/main/components/MainBottomButton.tsx`
- `app/global-income/(auth)/(submit-material)/main/components/list/ExpensesEtcFile.tsx`
- `app/global-income/(auth)/(submit-material)/main/components/list/ExpensesLocalTax.tsx`
- `app/global-income/(auth)/(submit-material)/main/hooks/useGetIncomeMaterialMainInfo.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/components/PrevMilitaryPeriodDrawer.tsx`
- `app/global-income/(auth)/(submit-material)/reductions-sme/graphql/prevMilitaryPeriodQuery.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useDeleteSubmittedIncomeMatrial.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useGetSmeTaxExemptionDetail.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useMilitaryPeriodForm.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/usePrevMilitaryPeriodPrompt.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useSubmitIncomeMaterial.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useGetSmeInfo.ts`
- `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useSubmitSurvey.ts`
- `app/global-income/(auth)/components/GlobalIncomeFileUpload.tsx`
- `app/global-income/(auth)/estimated-tax/business-expenses/hooks/useGetAdditionalExpenseBookDetail.ts`
- `app/global-income/(auth)/estimated-tax/constants/additionalExpenseBillType.ts`
- `app/global-income/(auth)/estimated-tax/graphql/incomeTaxAdditionalExpenseBookDetail.ts`
- `app/global-income/(auth)/graphql/checkFamilyRegistryCert.ts`
- `app/global-income/(auth)/graphql/createDependent.ts`
- `app/global-income/(auth)/graphql/deleteAllDependent.ts`
- `app/global-income/(auth)/graphql/deleteDependent.ts`
- `app/global-income/(auth)/graphql/deleteSubmittedIncomeMaterial.ts`
- `app/global-income/(auth)/graphql/dependentList.ts`
- `app/global-income/(auth)/graphql/donationFileList.ts`
- `app/global-income/(auth)/graphql/donationInfo.ts`
- `app/global-income/(auth)/graphql/expensesLocalTaxDetail.ts`
- `app/global-income/(auth)/graphql/expensesMySelectList.ts`
- `app/global-income/(auth)/graphql/familyRegistryCertLogin.ts`
- `app/global-income/(auth)/graphql/familyRegistryCertSign.ts`
- `app/global-income/(auth)/graphql/incomeCardFeeOrgs.ts`
- `app/global-income/(auth)/graphql/incomeEtcSupportingMaterial.ts`
- `app/global-income/(auth)/graphql/incomeFileUpload.ts`
- `app/global-income/(auth)/graphql/incomeMaterialEtcFiles.ts`
- `app/global-income/(auth)/graphql/incomeMaterialMain.ts`
- `app/global-income/(auth)/graphql/incomeTaxOrgsCardSummary.ts`
- `app/global-income/(auth)/graphql/localTaxCertLogin.ts`
- `app/global-income/(auth)/graphql/personalExemptionInfo.ts`
- `app/global-income/(auth)/graphql/scrapingCardFee.ts`
- `app/global-income/(auth)/graphql/scrapingLocalTax.ts`
- `app/global-income/(auth)/graphql/smeTaxExemptionDetail.ts`
- `app/global-income/(auth)/graphql/submitIncomeMaterial.ts`
- `app/global-income/(auth)/graphql/submitPersonalExemptionSurvey.ts`
- `app/global-income/(auth)/graphql/updateBulkDisabilityYn.ts`
- `app/global-income/(auth)/graphql/updateBulkSelectedYn.ts`
- `app/global-income/(auth)/graphql/updateDependent.ts`
- `app/global-income/(auth)/graphql/yearendAuthRequest.ts`
- `app/global-income/(auth)/graphql/yearendAuthResult.ts`
- `app/global-income/(auth)/graphql/yearendDownlaod.ts`
- `app/global-income/(auth)/hooks/useDeleteUploadedFile.ts`
- `app/global-income/(auth)/hooks/useIncomeFileUploadMutation.ts`
- `app/global-income/(auth)/hooks/useKakaoAuthFlow.ts`

## API 상세

---

<a id="08-01"></a>

### 08-01 `incomeMaterialMain` — 종소세 자료제출 메인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeMaterialMainOutput` · union 3종)

```ts
{
  __typename: 'NoTargetIncomeTaxDeclare';
  message: string;
}
| {
  __typename: 'IncomeMaterialMain';
  dependent: { // DependentType
    completeCount: number;
    needCertYn: boolean;
    scrapingCompleteYn: boolean;
  };
  myExemption: { // MyExemptionType
    needCertYn: boolean;
    completeCount: number;
  };
  myAdditionalExemption: { // MyAdditionalExemptionType
    scrapingCompleteYn: boolean;
    fileCount: number;
  };
  smeTaxExemption: { // SmeTaxExemptionType
    status: CompletionStatusEnum;
    remainingCount: number;
  };
  expensesCardFee: { // ExpensesCardFeeType
    status: CompletionStatusEnum;
    remainingCount: number;
  };
  expensesLocalTax: { // ExpensesLocalTaxType
    scrapingYn: boolean;
    isApplied: boolean;
  };
  expensesEtcFile: { // ExpensesEtcFileType
    fileCount: number;
    isApplied: boolean;
  };
  personalCard: { // PersonalCardType
    cardCount: number;
    isApplied: boolean;
    mskCardCount: number;
  };
  materialExist: boolean;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `incomeMaterialMainQuery` (`app/global-income/(auth)/graphql/incomeMaterialMain.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/main/components/MainBottomButton.tsx`, `app/global-income/(auth)/(submit-material)/main/hooks/useGetIncomeMaterialMainInfo.tsx`

---

<a id="08-02"></a>

### 08-02 `personalExemptionInfo` — 본인공제 정보

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PersonalExemptionInfoOutput` · union 2종)

```ts
{
  __typename: 'PersonalExemptionInfo';
  maritalYn: boolean;
  disabilityYn: boolean;
  isApplied: boolean;
  disabilityCertFile: { // SelfDisabilityCertFile
    filename: string;
    extension: string | null;
    materialId: number;
    isApplied: boolean;
  } | null;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `personalExemptionInfoQuery` (`app/global-income/(auth)/graphql/personalExemptionInfo.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/deductions-personal/hooks/useGetPersonalExemptionSurvey.ts`

---

<a id="08-03"></a>

### 08-03 `submitPersonalExemptionSurvey` — 본인공제 설문 제출

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `maritalYn` | `boolean` | ✅ | 보냄 |  |
| `disabilityYn` | `boolean` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SubmitPersonalExemptionSurveyOutput` · union 3종)

```ts
{
  __typename: 'SubmitPersonalExemptionSurveySucceed';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeMaterialAlreadyAppliedError` `SubmitPersonalExemptionSurveySucceed`

**프론트**
- 연산: `submitPersonalExemptionSurveyMutation` (`app/global-income/(auth)/graphql/submitPersonalExemptionSurvey.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/deductions-personal/hooks/useSubmitPersonalExemptionSurvey.ts`, `app/global-income/(auth)/(submit-material)/deductions-personal/page.tsx`

---

<a id="08-04"></a>

### 08-04 `dependentList` — 부양가족 목록

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DependentListOutput` · union 3종)

```ts
{
  __typename: 'DependentIsNone';
}
| {
  __typename: 'DependentList';
  dependentList: { // Dependent
    disabilityCert: { // DependentCertFile
      materialId: number;
      filename: string;
      extension: string | null;
      isApplied: boolean;
    } | null;
    familyRegistryCert: { // DependentCertFile
      filename: string;
      materialId: number;
      extension: string | null;
      isApplied: boolean;
    } | null;
    dependentId: number;
    name: string;
    birthday: string;
    regno: string;
    relationType: RelationCode;
    disabilityYn: boolean;
    selectYn: boolean;
    insertType: string;
    order: number;
  }[];
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DependentIsNone`

**프론트**
- 연산: `dependentListQuery` (`app/global-income/(auth)/graphql/dependentList.ts`)
- 쓰는 파일 (6): `app/global-income/(auth)/(submit-material)/deductions-dependents/constants/RelationType.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useGetDependentsList.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/RegisterDependentsForm.tsx`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/RelationListDrawer.tsx`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useRegisterDependentsForm.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/page.tsx`

---

<a id="08-05"></a>

### 08-05 `createDependent` — 부양가족 생성

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `name` | `string` | ✅ | 보냄 |  |
| `relationType` | `RelationCode` | ✅ | 보냄 |  |
| `disabilityYn` | `boolean \| null` |  | 보냄 |  |
| `regno` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CreateDependentOutput` · union 2종)

```ts
{
  __typename: 'CreateDependentSucceed';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `CreateDependentSucceed`

**프론트**
- 연산: `createDependentMutation` (`app/global-income/(auth)/graphql/createDependent.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/add-dependents/page.tsx`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useCreateDependent.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useRegisterDependents.ts`

---

<a id="08-06"></a>

### 08-06 `updateDependent` — 부양가족 정보 개별 업데이트

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `dependentId` | `number` | ✅ | 보냄 |  |
| `name` | `string \| null` |  | 보냄 |  |
| `birthday` | `string \| null` |  | 보냄 |  |
| `relationType` | `RelationCode \| null` |  | 보냄 |  |
| `regno` | `string \| null` |  | 보냄 |  |
| `selectYn` | `boolean \| null` |  | 보냄 |  |
| `disabilityYn` | `boolean \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdateDependentOutput` · union 2종)

```ts
{
  __typename: 'UpdateDependentSucceed';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdateDependentSucceed`

**프론트**
- 연산: `updateDependentMutation` (`app/global-income/(auth)/graphql/updateDependent.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useRegisterDependents.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useUpdateDependent.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/modify-dependents/page.tsx`

---

<a id="08-07"></a>

### 08-07 `deleteDependent` — 부양가족 개별 삭제

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `dependentId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeleteDependentOutput` · union 3종)

```ts
{
  __typename: 'DeleteDependentSucceed';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeleteDependentSucceed` `IncomeMaterialAlreadyAppliedError`

**프론트**
- 연산: `deleteDependentMutation` (`app/global-income/(auth)/graphql/deleteDependent.ts`)
- 쓰는 파일 (4): `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/DeleteDependentButton.tsx`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/DeleteDependentDialog.tsx`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useDeleteDependent.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useRegisterDependents.ts`

---

<a id="08-08"></a>

### 08-08 `deleteAllDependent` — 부양가족 전체 삭제 (스키마 설명 '부양가족 개별 삭제' 는 복사 실수로 보임)

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeleteAllDependentOutput` · union 3종)

```ts
{
  __typename: 'DeleteAllDependentSucceed';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeleteAllDependentSucceed` `IncomeMaterialAlreadyAppliedError`

**프론트**
- 연산: `deleteAllDependentMutation` (`app/global-income/(auth)/graphql/deleteAllDependent.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/components/RegistCancelDialog.tsx`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useDeleteAllDependent.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/registration/hooks/useRegisterDependents.ts`

---

<a id="08-09"></a>

### 08-09 `updateBulkDisabilityYn` — 부양가족 장애여부 일괄 업데이트

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `dependentId` | `number[]` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `BulkUpdateYnOutput` · union 3종)

```ts
{
  __typename: 'BulkUpdateYnSucceed';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `BulkUpdateYnSucceed` `IncomeMaterialAlreadyAppliedError`

**프론트**
- 연산: `updateBulkDisabilityYnMutation` (`app/global-income/(auth)/graphql/updateBulkDisabilityYn.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/deductions-dependents/select-disability/hooks/useUpdateBulkDataYn.ts`

---

<a id="08-10"></a>

### 08-10 `checkFamilyRegistryCert` — 가족관계 증명서 이미 수집 여부

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `CheckFamilyRegistryCertOutput` · union 2종)

```ts
{
  __typename: 'CheckFamilyRegistryCertResult';
  existYn: boolean;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `checkFamilyRegistryCertQuery` (`app/global-income/(auth)/graphql/checkFamilyRegistryCert.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useCheckFamilyRegistryCert.ts`

---

<a id="08-11"></a>

### 08-11 `familyRegistryCertLogin` — 가족관계 증명서 로그인 요청

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `name` | `string` | ✅ | 보냄 | 이름 |
| `regno` | `string` | ✅ | 보냄 | 주민 번호 |
| `phone` | `string` | ✅ | 보냄 | 핸드폰 번호 |
| `fthrNm` | `string \| null` |  | 보냄 | 부 성명 |
| `mthrNm` | `string \| null` |  | 보냄 | 모 성명 |
| `sposNm` | `string \| null` |  | 보냄 | 배우자 성명 |
| `childNm` | `string \| null` |  | 보냄 | 자녀 성명 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `FamilyRegistryCertLoginOutput` · union 3종)

```ts
{
  __typename: 'FamilyRegistryCertLoginSucceed';
  stepData: string;
}
| {
  __typename: 'FamilyRegistryCertLoginFailed';
  type: FamilyRegistryCertErrorType;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `FamilyRegistryCertLoginFailed` `FamilyRegistryCertLoginSucceed` `TemporaryError`

**프론트**
- 연산: `familyRegistryCertLoginMutation` (`app/global-income/(auth)/graphql/familyRegistryCertLogin.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useFamilyRegistryCertLogin.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useSupremeCourtSimpleLogin.ts`

---

<a id="08-12"></a>

### 08-12 `familyRegistryCertSign` — 가족관계 증명서 로그인 확인 및 발급요청

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `name` | `string` | ✅ | 보냄 | 이름 |
| `regno` | `string` | ✅ | 보냄 | 주민 번호 |
| `phone` | `string` | ✅ | 보냄 | 핸드폰 번호 |
| `fthrNm` | `string \| null` |  | 보냄 | 부 성명 |
| `mthrNm` | `string \| null` |  | 보냄 | 모 성명 |
| `sposNm` | `string \| null` |  | 보냄 | 배우자 성명 |
| `childNm` | `string \| null` |  | 보냄 | 자녀 성명 |
| `stepData` | `string \| null` |  | 보냄 | 스텝 데이터 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `FamilyRegistryCertSignOutput` · union 3종)

```ts
{
  __typename: 'FamilyRegistryCertSignSucceed';
  message: string;
}
| {
  __typename: 'FamilyRegistryCertSignFailed';
  type: FamilyRegistryCertErrorType;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `FamilyRegistryCertSignFailed` `FamilyRegistryCertSignSucceed` `TemporaryError`

**프론트**
- 연산: `familyRegistryCertSignMutation` (`app/global-income/(auth)/graphql/familyRegistryCertSign.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useFamilyRegistryCertSign.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/hooks/useSupremeCourtSimpleLogin.ts`

---

<a id="08-13"></a>

### 08-13 `smeTaxExemptionDetail` — 종소세 중소기업 세액감면 상세

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SmeTaxExemptionDetailOutput` · union 2종)

```ts
{
  __typename: 'SmeTaxExemptionDetail';
  militaryPeriodInfo: { // MilitaryPeriodInfo
    militaryPeriod: unknown /* JSON */ | null;
    isApplied: boolean;
  } | null;
  refundClaimScrapingInfo: { // RefundClaimScrapingInfo
    isRefundClaimScrapingComplete: boolean | null;
    isApplied: boolean;
  } | null;
  survey: { // SmeTaxExemptionSurvey
    bizNo: string;
    incomeMaterialId: string | null;
    bizAddress: string;
    bizName: string;
    bmanTin: string;
    openingBizAt: string;
    surveyStatus: CompletedType;
    survey: unknown /* JSON */ | null;
    isApplied: boolean;
  }[];
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `SmeTaxExemptionDetail`

**프론트**
- 연산: `smeTaxExemptionDetailQuery` (`app/global-income/(auth)/graphql/smeTaxExemptionDetail.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useGetSmeTaxExemptionDetail.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/usePrevMilitaryPeriodPrompt.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useGetSmeInfo.ts`

---

<a id="08-14"></a>

### 08-14 `prevMilitaryPeriod` — 이전 신고 군 복무 기간

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PrevMilitaryPeriodOutput` · union 3종)

```ts
{
  __typename: 'PrevMilitaryPeriod';
  militaryPeriod: unknown /* JSON */ | null;
}
| {
  __typename: 'NoPrevMilitaryPeriod';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `PrevMilitaryPeriod`

**프론트**
- 연산: `prevMilitaryPeriodQuery` (`app/global-income/(auth)/(submit-material)/reductions-sme/graphql/prevMilitaryPeriodQuery.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/usePrevMilitaryPeriodPrompt.ts`

---

<a id="08-15"></a>

### 08-15 `submitIncomeMaterial` — 종소세 자료제출 (수기)

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `incomeMaterialType` | `IncomeMaterialTypeEnum` | ✅ | 보냄 |  |
| `bmanTin` | `string \| null` |  | 보냄 |  |
| `data` | `unknown /* JSON */ \| null` |  | 보냄 |  |
| `tempData` | `unknown /* JSON */ \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SubmitIncomeMaterialOutput` · union 3종)

```ts
{
  __typename: 'SubmitIncomeMaterialSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeMaterialAlreadyAppliedError` `SubmitIncomeMaterialSucceed`

**프론트**
- 연산: `submitIncomeMaterialMutation` (`app/global-income/(auth)/graphql/submitIncomeMaterial.ts`)
- 쓰는 파일 (5): `app/global-income/(auth)/(submit-material)/expenses-documents/hooks/useSubmitSelectList.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/components/PrevMilitaryPeriodDrawer.tsx`, `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useMilitaryPeriodForm.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useSubmitIncomeMaterial.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useSubmitSurvey.ts`

---

<a id="08-16"></a>

### 08-16 `donationInfo` — 종소세 자료제출 내역

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DonationInfoOutput` · union 2종)

```ts
{
  __typename: 'DonationInfo';
  selfTotalSum: number;
  dependantsTotalSum: number;
  donationList: { // DonationList
    name: string;
    sum: number;
    tradeDonations: { // DonationDetail
      tradeNm: string;
      amount: number;
    }[];
  }[] | null;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `donationInfoQuery` (`app/global-income/(auth)/graphql/donationInfo.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/deductions-additional/collection-complete/hooks/useGetDonationInfo.ts`

---

<a id="08-17"></a>

### 08-17 `donationFileList` — 종소세 기타자료 제출 내역

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DonationMaterialFilesOutput` · union 3종)

```ts
{
  __typename: 'DonationMaterialFiles';
  materialFiles: { // DonationMaterialFile
    materialId: number;
    filename: string;
    extension: string | null;
    isApplied: boolean;
  }[];
}
| {
  __typename: 'NoSubmittedDonationMaterial';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `donationFileListQuery` (`app/global-income/(auth)/graphql/donationFileList.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/deductions-additional/hooks/useGetDonationFileList.ts`

---

<a id="08-18"></a>

### 08-18 `incomeMaterialEtcFiles` — 종소세 기타자료 제출 내역

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeMaterialEtcFilesOutput` · union 3종)

```ts
{
  __typename: 'NoSubmittedIncomeMaterial';
  message: string;
}
| {
  __typename: 'IncomeMaterialFiles';
  materialFiles: { // IncomeMaterialFile
    filename: string;
    extension: string | null;
    materialId: number;
    isApplied: boolean;
  }[];
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `incomeMaterialEtcFilesQuery` (`app/global-income/(auth)/graphql/incomeMaterialEtcFiles.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/hooks/useGetExpenseEtcFile.ts`

---

<a id="08-19"></a>

### 08-19 `incomeEtcSupportingMaterial` — 종소세 기타 증빙 제출 내역

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeEtcSupportingMaterialOutput` · union 2종)

```ts
{
  __typename: 'IncomeEtcSupportingMaterials';
  material: { // IncomeEtcSupportingMaterial
    title: string;
    amount: string;
    date: string;
  }[];
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `incomeEtcSupportingMaterialQuery` (`app/global-income/(auth)/graphql/incomeEtcSupportingMaterial.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/components/EtcSupportingMaterialDrawer.tsx`, `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/components/EtcSupportingMaterialList.tsx`, `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/hooks/useGetEtcSupportingMaterial.ts`

---

<a id="08-20"></a>

### 08-20 `expensesMySelectList` — 종소세 경비자료 선택 리스트

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeExpensesMySelectListOutput` · union 2종)

```ts
{
  __typename: 'IncomeExpensesMySelectList';
  selectedList: unknown /* JSON */ | null;
  isApplied: boolean;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeExpensesMySelectList`

**프론트**
- 연산: `expensesMySelectListQuery` (`app/global-income/(auth)/graphql/expensesMySelectList.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/hooks/useGetSelectList.ts`, `app/global-income/(auth)/(submit-material)/main/components/list/ExpensesEtcFile.tsx`

---

<a id="08-21"></a>

### 08-21 `updateBulkSelectedYn` — 부양가족 선택여부 일괄 업데이트

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `dependentId` | `number[]` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `BulkUpdateYnOutput` · union 3종)

```ts
{
  __typename: 'BulkUpdateYnSucceed';
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `BulkUpdateYnSucceed` `IncomeMaterialAlreadyAppliedError`

**프론트**
- 연산: `updateBulkSelectedYnMutation` (`app/global-income/(auth)/graphql/updateBulkSelectedYn.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/deductions-dependents/select-disability/hooks/useUpdateBulkDataYn.ts`

---

<a id="08-22"></a>

### 08-22 `expensesLocalTaxDetail` — 종소세 지방세 납부 상세

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ExpensesLocalTaxDetailOutput` · union 2종)

```ts
{
  __typename: 'ExpensesLocalTaxDetail';
  isConfirmedLocalTax: boolean;
  address: string;
  isApplied: boolean;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ExpensesLocalTaxDetail`

**프론트**
- 연산: `expensesLocalTaxDetailQuery` (`app/global-income/(auth)/graphql/expensesLocalTaxDetail.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/main/components/list/ExpensesLocalTax.tsx`

---

<a id="08-23"></a>

### 08-23 `localTaxCertLogin` — 종소세-지방세납부 간편인증

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `name` | `string` | ✅ | 보냄 |  |
| `phone` | `string` | ✅ | 보냄 |  |
| `regNo` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `LocalTaxCertLoginOutput` · union 3종)

```ts
{
  __typename: 'LocalTaxCertLoginSucceed';
  stepData: string;
}
| {
  __typename: 'LocalTaxCertLoginFailed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `LocalTaxCertLoginFailed` `LocalTaxCertLoginSucceed` `TemporaryError`

**프론트**
- 연산: `localTaxCertLoginMutation` (`app/global-income/(auth)/graphql/localTaxCertLogin.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/local-tax-expense/hooks/useGovernmentSimpleAuth.ts`

---

<a id="08-24"></a>

### 08-24 `scrapingLocalTax` — 종소세-지방세납부 스크래핑

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `name` | `string` | ✅ | 보냄 |  |
| `phone` | `string` | ✅ | 보냄 |  |
| `regNo` | `string` | ✅ | 보냄 |  |
| `sido` | `string` | ✅ | 보냄 | 도/시 이름 |
| `sigungu` | `string` | ✅ | 보냄 | 시/군/구 이름 |
| `roadStr` | `string` | ✅ | 보냄 | 도로명주소 |
| `stepData` | `string` | ✅ | 보냄 | stepData |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ScrapingLocalTaxOutput` · union 8종)

```ts
{
  __typename: 'ScrapingLocalTaxSucceed';
  message: string;
  isConfirmedLocalTax: boolean;
  address: string;
}
| {
  __typename: 'ScrapingLocalTaxFailed';
  message: string;
}
| {
  __typename: 'ScrapingLocalTaxExpiredSession';
  message: string;
}
| {
  __typename: 'ScrapingLocalTaxCheckCert';
  message: string;
}
| {
  __typename: 'ScrapingLocalTaxRoadAddress';
  message: string;
}
| {
  __typename: 'ScrapingLocalTaxHasNoRecords';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeMaterialAlreadyAppliedError` `ScrapingLocalTaxCheckCert` `ScrapingLocalTaxExpiredSession` `ScrapingLocalTaxFailed` `ScrapingLocalTaxHasNoRecords` `ScrapingLocalTaxRoadAddress` `ScrapingLocalTaxSucceed`

**프론트**
- 연산: `scrapingLocalTaxMutation` (`app/global-income/(auth)/graphql/scrapingLocalTax.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/local-tax-expense/hooks/useScrapingLocalTax.ts`

---

<a id="08-25"></a>

### 08-25 `incomeCardFeeOrgs` — 종소세 카드수수료 경비처리 대상 사업체 리스트

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeCardFeeOrgsOutput` · union 2종)

```ts
{
  __typename: 'IncomeCardFeeOrgs';
  orgs: { // IncomeCardFeeOrg
    bizNo: string;
    bizName: string;
    bmanTin: string;
    status: IncomeCardFeeStatusType;
  }[];
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `incomeCardFeeOrgsQuery` (`app/global-income/(auth)/graphql/incomeCardFeeOrgs.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/expenses-card-fees/hooks/useGetIncomeCardFeeOrgs.ts`

---

<a id="08-26"></a>

### 08-26 `scrapingCardFee` — 종소세-카드수수료 스크래핑

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `accountType` | `CardFeeScrapingType` | ✅ | 보냄 |  |
| `cardCode` | `string \| null` |  | 보냄 |  |
| `bankCode` | `string \| null` |  | 보냄 |  |
| `accountNumber` | `string \| null` |  | 보냄 |  |
| `id` | `string \| null` |  | 보냄 |  |
| `password` | `string \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `ScrapingCardFeeOutput` · union 10종)

```ts
{
  __typename: 'ScrapingCardFeeSucceed';
}
| {
  __typename: 'CrefiaLoginError';
  message: string;
}
| {
  __typename: 'CrefiaAccountError';
}
| {
  __typename: 'CrefiaBirthOrBizNoError';
}
| {
  __typename: 'CrefiaLoginBlockError';
}
| {
  __typename: 'CrefiaLoginIdError';
}
| {
  __typename: 'CrefiaLoginPasswordError';
}
| {
  __typename: 'CrefiaNotFoundOrgError';
}
| {
  __typename: 'NotFoundOrgError';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `ScrapingCardFeeSucceed`

**프론트**
- 연산: `scrapingCardFeeMutation` (`app/global-income/(auth)/graphql/scrapingCardFee.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/(submit-material)/expenses-card-fees/hooks/useScrapingCardFee.ts`, `app/global-income/(auth)/(submit-material)/expenses-card-fees/input/components/CardFeeScrappingDrawer.tsx`, `app/global-income/(auth)/(submit-material)/expenses-card-fees/input/components/CollectInfoBottomButton.tsx`

---

<a id="08-27"></a>

### 08-27 `incomeTaxOrgsCardSummary` — 종소세 신고 대상 사업체별 개인카드(추가/홈택스) 요약

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

없음 — 토큰의 사용자·현재 신고로 대상을 정하는 것으로 보인다 (README 4 Q4)

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeTaxOrgCardSummaryOutput` · union 2종)

```ts
{
  __typename: 'IncomeTaxOrgCardSummary';
  incomeTaxOrgCardList: { // IncomeTaxOrgCardInfo
    bmanTin: string;
    bizName: string;
    bizNo: string;
    addedBasedCardCount: number;
    hometaxBasedCardCount: number;
    existMaskingCard: boolean;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeTaxOrgCardSummary`

**프론트**
- 연산: `incomeTaxOrgsCardSummaryQuery` (`app/global-income/(auth)/graphql/incomeTaxOrgsCardSummary.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/card-expense/page.tsx`

---

<a id="08-28"></a>

### 08-28 `incomeTaxCardList` — 종소세 개인카드(신고용) 리스트 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeCardListOutput` · union 2종)

```ts
{
  __typename: 'IncomeCardList';
  bizName: string;
  addedBasedCardList: { // IncomeCardBasedAdded
    cardId: number;
    cardNo: string;
    cardCo: string | null;
    amt: string;
    maskingYn: boolean;
  }[];
  hometaxBasedCardList: { // IncomeCardBasedHometax
    cardNo: string;
    cardCo: string;
    amt: string;
    startDate: string;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeCardList`

**프론트**
- 연산: `globalIncomeCardListQuery` (`app/global-income/(auth)/(submit-material)/card-expense/graphql/globalIncomeCardList.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/card-expense/hooks/useGetGlobalIncomeCardList.ts`, `app/global-income/(auth)/(submit-material)/card-expense/hooks/useGlobalIncomeCardListQuery.ts`

---

<a id="08-29"></a>

### 08-29 `incomeTaxCardDetail` — 종소세 개인카드(신고용) 단건 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `cardId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeCardDetailOutput` · union 2종)

```ts
{
  __typename: 'IncomeCardDetail';
  taxationStart: string;
  taxationEnd: string;
  incomeMaterialId: number;
  fileName: string;
  isApplied: boolean;
  cardDetail: { // IncomeCardDetailItem
    cardId: number;
    cardNo: string;
    cardCo: string | null;
    maskingYn: boolean;
    cardUse: { // IncomeCardUse
      partnerName: string;
      cnt: number;
      amt: number;
    }[];
  };
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeCardDetail`

**프론트**
- 연산: `globalIncomeCardDetailQuery` (`app/global-income/(auth)/(submit-material)/card-expense/graphql/globalIncomeCardDetail.ts`)
- 쓰는 파일 (4): `app/global-income/(auth)/(submit-material)/card-expense/detail/components/CardDetailView.tsx`, `app/global-income/(auth)/(submit-material)/card-expense/detail/components/CardDetailWrapper.tsx`, `app/global-income/(auth)/(submit-material)/card-expense/detail/components/CardUseDetailList.tsx`, `app/global-income/(auth)/(submit-material)/card-expense/detail/hooks/useGetGlobalIncomeCardDetail.ts`

---

<a id="08-30"></a>

### 08-30 `incomeTaxCardDetailByMaterial` — 종소세 제출자료 ID별 개인카드 상세 조회

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `materialId` | `number` | ✅ | 보냄 | 자료 ID |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeCardDetailByMaterialOutput` · union 2종)

```ts
{
  __typename: 'IncomeCardDetailByMaterial';
  cardDetails: { // IncomeCardDetailItem
    cardId: number;
    cardNo: string;
    cardCo: string | null;
    maskingYn: boolean;
    cardUse: { // IncomeCardUse
      partnerName: string;
      cnt: number;
      amt: number;
    }[];
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeCardDetailByMaterial`

**프론트**
- 연산: `globalIncomeCardDetailByMaterialIdQuery` (`app/global-income/(auth)/(submit-material)/card-expense/graphql/globalIncomeCardDetailByMaterialId.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/card-expense/summary/hooks/useGetCardListByMaterial.ts`

---

<a id="08-31"></a>

### 08-31 `updateIncomeTaxPersonalCardNo` — 종소세 개인카드 번호 등록 또는 수정

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `cardId` | `number` | ✅ | 보냄 |  |
| `cardNo` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomePersonalCardUpdateOutput` · union 3종)

```ts
{
  __typename: 'IncomePersonalCardUpdateSucceed';
  message: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeMaterialAlreadyAppliedError` `IncomePersonalCardUpdateSucceed`

**프론트**
- 연산: `updateIncomeTaxPersonalCardNoMutation` (`app/global-income/(auth)/(submit-material)/card-expense/graphql/updateIncomeTaxPersonalCardNo.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/card-expense/hooks/usePersonalCardNo.ts`

---

<a id="08-32"></a>

### 08-32 `deleteIncomeTaxPersonalCardNo` — 종소세 개인카드 삭제

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `cardId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomePersonalCardDeleteOutput` · union 3종)

```ts
{
  __typename: 'IncomePersonalCardDeleteSucceed';
  cardCo: string | null;
  cardNo: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeMaterialAlreadyAppliedError` `IncomePersonalCardDeleteSucceed`

**프론트**
- 연산: `deleteIncomeTaxPersonalCardNoMutation` (`app/global-income/(auth)/(submit-material)/card-expense/graphql/deleteIncomeTaxPersonalCardNo.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/card-expense/hooks/usePersonalCardNo.ts`

---

<a id="08-33"></a>

### 08-33 `incomeTaxCardFileUpload` — 종소세 개인카드(신고용) 파일 업로드 및 파싱

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) · **파일 업로드(multipart)** |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `password` | `string \| null` |  | 보냄 |  |
| `append` | `File /* Upload — multipart */` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomePersonalCardOutput` · union 8종)

```ts
{
  __typename: 'NeedFilePassword';
  message: string;
}
| {
  __typename: 'IncomePersonalCardSucceed';
  materialId: number;
}
| {
  __typename: 'AlreadyUploadedFile';
  message: string;
}
| {
  __typename: 'PasswordNotCorrect';
  message: string;
}
| {
  __typename: 'NotResultInPeriod';
  message: string;
}
| {
  __typename: 'NotExistCardItem';
  message: string;
}
| {
  __typename: 'IncomePersonalCardOnlyUploadSucceed';
  materialId: number;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomePersonalCardOnlyUploadSucceed` `IncomePersonalCardSucceed` `NeedFilePassword` `TemporaryError`

**프론트**
- 연산: `incomeTaxCardFileUploadMutation` (`app/global-income/(auth)/(submit-material)/card-expense/graphql/incomeTaxCardFileUpload.ts`)
- 쓰는 파일 (1): `app/global-income/(auth)/(submit-material)/card-expense/upload-file/hooks/useUploadCardFile.ts`

---

<a id="08-34"></a>

### 08-34 `incomeTaxAdditionalExpenseBookDetail` — 장부 매입 중 경조사·개인카드·기타증빙 — 종류별 합계와 내역

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bizNo` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeTaxAdditionalExpenseBookDetailOutput` · union 2종)

```ts
{
  __typename: 'IncomeTaxAdditionalExpenseBookDetail';
  bizNo: string;
  billTypeGroups: { // AdditionalExpenseBillTypeBookGroup
    typeName: AdditionalExpenseBillTypeEnum;
    totalAmount: number;
    dateGroups: { // AdditionalExpenseBookDateGroup
      billDate: string | null;
      totalAmount: number;
      items: { // AdditionalExpenseBookLineItem
        partnerName: string | null;
        accountCodeName: string | null;
        tradeAmount: number | null;
      }[];
    }[];
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeTaxAdditionalExpenseBookDetail`

**프론트**
- 연산: `incomeTaxAdditionalExpenseBookDetailQuery` (`app/global-income/(auth)/estimated-tax/graphql/incomeTaxAdditionalExpenseBookDetail.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/estimated-tax/business-expenses/hooks/useGetAdditionalExpenseBookDetail.ts`, `app/global-income/(auth)/estimated-tax/constants/additionalExpenseBillType.ts`

---

<a id="08-35"></a>

### 08-35 `incomeFileUpload` — 종소세 파일업로드

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) · **파일 업로드(multipart)** |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `materialTypeId` | `IncomeMaterialTypeEnum` | ✅ | 보냄 |  |
| `append` | `File /* Upload — multipart */` | ✅ | 보냄 |  |
| `dependentId` | `number \| null` |  | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `IncomeFileUploadOutput` · union 2종)

```ts
{
  __typename: 'IncomeFileUploadSucceed';
  materialId: number;
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `IncomeFileUploadSucceed`

**프론트**
- 연산: `incomeFileUploadMutation` (`app/global-income/(auth)/graphql/incomeFileUpload.ts`)
- 쓰는 파일 (7): `app/global-income/(auth)/(submit-material)/deductions-additional/collection-complete/hooks/useIncomeMaterialUpload.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/dependents-list/components/DependentUploadButton.tsx`, `app/global-income/(auth)/(submit-material)/deductions-dependents/dependents-list/hooks/useDependentFileUpload.ts`, `app/global-income/(auth)/(submit-material)/deductions-personal/hooks/useSubmitDisabilityMaterial.ts`, `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/components/ExpenseFileUpload.tsx`, `app/global-income/(auth)/components/GlobalIncomeFileUpload.tsx`, `app/global-income/(auth)/hooks/useIncomeFileUploadMutation.ts`

---

<a id="08-36"></a>

### 08-36 `deleteSubmittedIncomeMaterial` — 종소세 제출자료 삭제

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `materialId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeleteSubmittedIncomeMaterialOutput` · union 3종)

```ts
{
  __typename: 'DeleteSubmittedIncomeMaterialSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'IncomeMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeleteSubmittedIncomeMaterialSucceed` `IncomeMaterialAlreadyAppliedError`

**프론트**
- 연산: `deleteSubmittedIncomeMaterialMutation` (`app/global-income/(auth)/graphql/deleteSubmittedIncomeMaterial.ts`)
- 쓰는 파일 (3): `app/global-income/(auth)/(submit-material)/reductions-sme/hooks/useDeleteSubmittedIncomeMatrial.ts`, `app/global-income/(auth)/(submit-material)/reductions-sme/org-survey/hooks/useSubmitSurvey.ts`, `app/global-income/(auth)/hooks/useDeleteUploadedFile.ts`

---

<a id="08-37"></a>

### 08-37 `yearendAuthRequest` — 연말정산 홈택스 인증 요청

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `name` | `string` | ✅ | 보냄 |  |
| `phone` | `string` | ✅ | 보냄 |  |
| `birthday` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `YearendAuthRequestOutput` · union 3종)

```ts
{
  __typename: 'YearendAuthRequestResult';
  reqTxId: string;
  token: string;
  cxId: string;
}
| {
  __typename: 'YearendFailed';
  type: HtxError;
  msg: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `YearendAuthRequestResult` `YearendFailed`

**프론트**
- 연산: `yearendAuthRequestMutation` (`app/global-income/(auth)/graphql/yearendAuthRequest.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/deductions-additional/hooks/useYearendAuthRequest.ts`, `app/global-income/(auth)/hooks/useKakaoAuthFlow.ts`

---

<a id="08-38"></a>

### 08-38 `yearendAuthResult` — 연말정산 홈택스 인증 결과

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `yearendAuthRequestInput` | `YearendAuthRequestInput` | ✅ | 보냄 |  |
| `yearendAuthRequestInput.name` | `string` | ✅ | 보냄 |  |
| `yearendAuthRequestInput.phone` | `string` | ✅ | 보냄 |  |
| `yearendAuthRequestInput.birthday` | `string` | ✅ | 보냄 |  |
| `authRequestResultData` | `AuthResultData` | ✅ | 보냄 |  |
| `authRequestResultData.reqTxId` | `string` | ✅ | 보냄 |  |
| `authRequestResultData.token` | `string` | ✅ | 보냄 |  |
| `authRequestResultData.cxId` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `YearendAuthResultOutput` · union 3종)

```ts
{
  __typename: 'YearendAuthSucceed';
  token: string;
}
| {
  __typename: 'YearendFailed';
  type: HtxError;
  msg: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `YearendAuthSucceed` `YearendFailed`

**프론트**
- 연산: `yearendAuthResultMutation` (`app/global-income/(auth)/graphql/yearendAuthResult.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/deductions-additional/hooks/useYearendAuthResult.ts`, `app/global-income/(auth)/hooks/useKakaoAuthFlow.ts`

---

<a id="08-39"></a>

### 08-39 `yearendDownlaod` — 연말정산 다운로드

| 항목 | 내용 |
|---|---|
| 종류 | 변경 (GraphQL mutation) |
| 호출 시점 | 사용자 동작 시 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `token` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `YearendDownloadOutput` · union 4종)

```ts
{
  __typename: 'YearendDownloadComplete';
  message: string;
}
| {
  __typename: 'YearendFailed';
  type: HtxError;
  msg: string;
}
| {
  __typename: 'YearendRpnTinMismatch';
  name: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `YearendDownloadComplete` `YearendFailed` `YearendRpnTinMismatch`

**프론트**
- 연산: `yearendDownlaodMutation` (`app/global-income/(auth)/graphql/yearendDownlaod.ts`)
- 쓰는 파일 (2): `app/global-income/(auth)/(submit-material)/deductions-additional/components/CollectProcessDrawer.tsx`, `app/global-income/(auth)/(submit-material)/deductions-additional/hooks/useYearendDownload.ts`
