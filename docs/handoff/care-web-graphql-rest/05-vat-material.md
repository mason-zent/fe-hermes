# 05. 부가세 자료제출

> [README](./README.md) · API 33개 · 기준 bznav-web origin/dev dc6d98d29 (2026-10-08)
> 설명 한 줄은 스키마 설명을 옮겼다. 스키마에 없거나 어긋난 것만 이름·사용처로 붙였다 — 틀리면 고쳐 주세요.

## 목록

| ID | API | 종류 | 설명 | REST (백엔드 기입) | 백엔드 | 프론트 |
|---|---|---|---|---|---|---|
| [05-01](#05-01) | `vatMaterialMain` | 조회 | 부가세 자료제출 메인 | | ☐ | ☐ |
| [05-02](#05-02) | `vatRecommendMaterial` | 조회 | 부가세 권장자료 안낸 목록 | | ☐ | ☐ |
| [05-03](#05-03) | `passMaterialStatus` | 조회 | 자료제출 없이 신고하기 여부 | | ☐ | ☐ |
| [05-04](#05-04) | `savePassMaterialStatus` | 변경 | 자료제출 없이 신고하기 상태 업데이트 | | ☐ | ☐ |
| [05-05](#05-05) | `saveFirstEnter` | 변경 | 첫 진입여부 업데이트 | | ☐ | ☐ |
| [05-06](#05-06) | `orgMaterialDetail` | 조회 | 사업체 제출자료 내역 | | ☐ | ☐ |
| [05-07](#05-07) | `materialFileDownload` | 조회 | 내 제출자료 다운로드 | | ☐ | ☐ |
| [05-08](#05-08) | `orgCashSalesInfo` | 조회 | 현금 신고 정보 | | ☐ | ☐ |
| [05-09](#05-09) | `salesMallList` | 조회 | 온라인 / 배달앱 매출 조회 | | ☐ | ☐ |
| [05-10](#05-10) | `vatMaterialReusing` | 조회 | 직전 신고 자료 가져오기 | | ☐ | ☐ |
| [05-11](#05-11) | `vatCardList` | 조회 | 사업자의 카드 리스트 조회 | | ☐ | ☐ |
| [05-12](#05-12) | `vatCardDetail` | 조회 | 부가세 개인카드 단건 상세 (스키마 설명 '사업자의 카드 리스트 조회' 는 복사 실수로 보임) | | ☐ | ☐ |
| [05-13](#05-13) | `vatCardDetailByMaterialId` | 조회 | 부가세 제출자료 ID 별 개인카드 상세 (스키마 설명 '사업자의 카드 리스트 조회' 는 복사 실수로 보임) | | ☐ | ☐ |
| [05-14](#05-14) | `updatePersonalCardNo` | 변경 | 카드번호 업데이트 | | ☐ | ☐ |
| [05-15](#05-15) | `deletePersonalCardNo` | 변경 | 부가세 개인카드 번호 삭제 (스키마 설명 '카드번호 업데이트' 는 복사 실수로 보임) | | ☐ | ☐ |
| [05-16](#05-16) | `cardFileUpload` | 변경 | 개인카드 업로드 및 파싱 | | ☐ | ☐ |
| [05-17](#05-17) | `rentInfoList` | 조회 | 등록된 임대차 계약서 목록 | | ☐ | ☐ |
| [05-18](#05-18) | `beforeRentInfoList` | 조회 | 이전 등록된 임대차 계약서 목록 | | ☐ | ☐ |
| [05-19](#05-19) | `rentParsing` | 변경 | 임대차계약서 파싱 | | ☐ | ☐ |
| [05-20](#05-20) | `insertRentInfo` | 변경 | 임대차 계약서 관련 사항 저장 | | ☐ | ☐ |
| [05-21](#05-21) | `updateRentInfo` | 변경 | 임대차 계약서 수정 | | ☐ | ☐ |
| [05-22](#05-22) | `deleteRentInfo` | 변경 | 임대차 계약서 삭제 | | ☐ | ☐ |
| [05-23](#05-23) | `taxInvcInfoList` | 조회 | 등록된 세금계산서 목록 | | ☐ | ☐ |
| [05-24](#05-24) | `taxInvcParsingMultiple` | 변경 | 수기 증빙 계산서 다중 파싱 (최대 10개) | | ☐ | ☐ |
| [05-25](#05-25) | `insertTaxInvcInfo` | 변경 | 세금계산서 정보 저장 | | ☐ | ☐ |
| [05-26](#05-26) | `updateTaxInvcInfo` | 변경 | 세금계산서 정보 수정 | | ☐ | ☐ |
| [05-27](#05-27) | `deleteTaxInvcInfo` | 변경 | 세금계산서 정보 삭제 | | ☐ | ☐ |
| [05-28](#05-28) | `checkBsnoValid` | 조회 | 사업자번호 유효성 검증 | | ☐ | ☐ |
| [05-29](#05-29) | `fileUpload` | 변경 | 파일업로드 | | ☐ | ☐ |
| [05-30](#05-30) | `saveTextMaterial` | 변경 | 자료 입력 | | ☐ | ☐ |
| [05-31](#05-31) | `deleteSubmittedMaterial` | 변경 | 제출자료 삭제 | | ☐ | ☐ |
| [05-32](#05-32) | `vatMaterialComplete` | 변경 | 부가세신고 자료제출 완료 | | ☐ | ☐ |
| [05-33](#05-33) | `vatMaterialCancel` | 변경 | 부가세신고 자료제출완료 취소 | | ☐ | ☐ |

## 이 도메인에서 쓰는 enum (값을 그대로 유지해 주세요)

- `CarDeductionStatusEnum`: `Deductible` · `NonDeductible` · `NeedsCheck`
- `DeclareTypeEnum`: `Vat` · `IncomeTax`
- `MaterialStatusEnum`: `RECOMMENDED` · `COMPLETE` · `NONE`
- `SalesMallInputTypeEnum`: `Online` · `Delivery`
- `TaxInvoiceTypeEnum`: `SALES` · `PURCHASE`
- `VatMaterialItemEnum`: `Online` · `Delivery` · `Export` · `Rent` · `PaperBill` · `CashWithoutProof` · `DuplicateCard` · `Car` · `PurchaseAgency`
- `VatMaterialReusingIdEnum`: `Car`

## 프론트 작업 파일 (121) — `apps/care-web/` 기준

- `app/global-income/(auth)/(submit-material)/deductions-additional/collection-complete/hooks/useIncomeMaterialUpload.ts`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/dependents-list/components/DependentUploadButton.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-dependents/dependents-list/hooks/useDependentFileUpload.ts`
- `app/global-income/(auth)/(submit-material)/deductions-personal/components/DisabilityDeductionCard.tsx`
- `app/global-income/(auth)/(submit-material)/deductions-personal/hooks/useSubmitDisabilityMaterial.ts`
- `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/components/ExpenseFileUpload.tsx`
- `app/global-income/(auth)/components/GlobalIncomeFileUpload.tsx`
- `app/vat/(status)/org-status/components/VatRequireMaterial.tsx`
- `app/vat/(status)/org-status/graphql/vatMaterialMainConnectCountCheck.ts`
- `app/vat/(status)/org-status/graphql/vatMaterialMainSubmitCountCheck.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/car/components/CarDeductionStatusAlert.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/car/components/CarNoticeDrawer.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/car/hooks/useSaveVehicleMaterial.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/car/page.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/components/CardDetailView.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/components/CardDetailWrapper.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/components/CardUseDetailList.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/hooks/useGetVatCardDetail.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/page.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/cardFileUpload.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/deletePersonalCardNo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/updatePersonalCardNo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/vatCardDetail.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/vatCardDetailByMaterialId.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/vatCardList.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/hooks/useGetVatCardList.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/hooks/usePersonalCardNo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/hooks/useVatCardListQuery.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/input-password/page.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/summary/hooks/useGetCardListByMaterial.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/upload-file/hooks/useUploadCardFile.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/card-expense/upload-file/page.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/cash-sales/page.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/delivery/components/UploadableDeliveryPage.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/duplicate-sales/page.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/online/components/OnlineMallSalesCard.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/online/components/UploadableOnlinePage.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/components/TaxInvoiceList.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/components/TaxInvoiceUploadErrorDialog.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/detail/hooks/useGetPaperTaxInvoiceFile.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/checkBsnoValid.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/deleteTaxInvcInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/insertTaxInvcInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/taxInvcInfoList.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/taxInvcParsingMultiple.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/updateTaxInvcInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useCheckBsnoValidApi.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useDeleteTaxInvcInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useInsertTaxInvcInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useParsingTaxInvoices.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useTaxInvcInfoList.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useUpdateTaxInvcInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/store/paperTaxInvoiceDetailAtom.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/types/paperTaxInvoiceTypes.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/contract-list/components/ContractList.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/contract-list/components/NoContract.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/contract-list/hooks/useGetContractListInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/contract-list/hooks/useGetContractListQuery.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/components/ContractDeleteDialog.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/components/ContractDetailWrapper.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/hooks/useDeleteRentInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/hooks/useGetRealEstateFile.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/hooks/useUpdateRentInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/beforeRentInfoList.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/deleteRentInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/insertRentInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/rentInfoList.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/rentParsing.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/updateRentInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/hooks/useInsertRentInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/hooks/useParsingRentFile.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/input-loaded/hooks/useGetSelectedContract.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/input-loaded/page.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/input-ocr/page.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/page.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/select-loaded/components/BeforeRentList.tsx`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/select-loaded/hooks/useGetBeforeRentInfo.ts`
- `app/vat/submit-material/(submitMaterial)/(category)/real-estate/select-loaded/hooks/useGetBeforeRentInfoQuery.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/components/RequireInfoBox.tsx`
- `app/vat/submit-material/(submitMaterial)/(main)/graphql/passMaterialStatus.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/graphql/vatMaterialCancel.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/graphql/vatMaterialComplete.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/graphql/vatMaterialMain.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/graphql/vatRecommendMaterial.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/hooks/useGetRecommendMaterial.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/hooks/useGetVatMaterialStatus.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/hooks/useSubmitMaterial.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/hooks/useVatMaterialCompleteRequest.ts`
- `app/vat/submit-material/(submitMaterial)/(main)/hooks/useVatMaterialMainQuery.ts`
- `app/vat/submit-material/(submitMaterial)/components/FileList.tsx`
- `app/vat/submit-material/(submitMaterial)/components/FileUploadForm.tsx`
- `app/vat/submit-material/(submitMaterial)/components/UploadFileList.tsx`
- `app/vat/submit-material/(submitMaterial)/graphql/deleteSubmittedMaterial.ts`
- `app/vat/submit-material/(submitMaterial)/graphql/fileUpload.ts`
- `app/vat/submit-material/(submitMaterial)/graphql/materialFileDownload.ts`
- `app/vat/submit-material/(submitMaterial)/graphql/orgMaterialDetail.ts`
- `app/vat/submit-material/(submitMaterial)/graphql/salesMallList.ts`
- `app/vat/submit-material/(submitMaterial)/graphql/saveTextMaterial.ts`
- `app/vat/submit-material/(submitMaterial)/hooks/useGetSalesMallListQuery.ts`
- `app/vat/submit-material/(submitMaterial)/hooks/useGetUploadFileList.ts`
- `app/vat/submit-material/(submitMaterial)/hooks/useSaveTextMaterial.ts`
- `app/vat/submit-material/(submitMaterial)/hooks/useVatDeleteFile.ts`
- `app/vat/submit-material/(submitMaterial)/hooks/useVatUploadFile.ts`
- `app/vat/submit-material/(submitMaterial)/no-materials/components/RecommendMaterialCheckList.tsx`
- `app/vat/submit-material/(submitMaterial)/no-materials/components/RecommendMaterialList.tsx`
- `app/vat/submit-material/(submitMaterial)/no-materials/graphql/savePassMaterialStatus.ts`
- `app/vat/submit-material/(submitMaterial)/no-materials/hooks/useCheckRecommendMaterial.ts`
- `app/vat/submit-material/(submitMaterial)/no-materials/hooks/useSavePassMaterialStatus.ts`
- `app/vat/submit-material/(submitMaterial)/no-materials/page.tsx`
- `app/vat/submit-material/(submitMaterial)/preview/hooks/useGetVatPreviewFileUrl.ts`
- `app/vat/submit-material/(submitMaterial)/preview/page.tsx`
- `app/vat/submit-material/guide/graphql/orgCashSalesInfo.ts`
- `app/vat/submit-material/guide/graphql/saveFirstEnter.ts`
- `app/vat/submit-material/guide/graphql/vatMaterialReusing.ts`
- `app/vat/submit-material/guide/hooks/useCashSalesInfo.ts`
- `app/vat/submit-material/guide/hooks/useGetLastCarInfo.ts`
- `app/year-end-tax/[year]/[employeeId]/components/UploadContents.tsx`
- `app/year-end-tax/[year]/[employeeId]/hooks/useYearEndTaxFileUpload.ts`
- `constants/ocrFileUpload.ts`
- `hooks/useFileUploadModalState.ts`
- `hooks/useUploadFiles.ts`

## API 상세

---

<a id="05-01"></a>

### 05-01 `vatMaterialMain` — 부가세 자료제출 메인

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 3개 — `vatMaterialMainConnectCountCheckQuery`, `vatMaterialMainSubmitCountCheckQuery`, `vatMaterialMainQuery` (README 3-2) |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatMaterialMainOutput` · union 3종)

```ts
{
  __typename: 'VatMaterialMain';
  online: { // MallVatMaterialStatus
    connectedCount: number | null;
    submitCount: number | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
  delivery: { // MallVatMaterialStatus
    connectedCount: number | null;
    submitCount: number | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
  export: { // DefaultVatMaterialStatus
    submitCount: number | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
  personalCard: { // CardVatMaterialStatus
    submitCount: number | null;
    isMaskedCardNo: boolean | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
  car: { // DefaultVatMaterialStatus
    submitCount: number | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
  duplicateCard: { // DefaultVatMaterialStatus
    submitCount: number | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
  cashWithoutProof: { // DefaultVatMaterialStatus
    submitCount: number | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
  purchaseAgency: { // DefaultVatMaterialStatus
    submitCount: number | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
  paperBill: { // DefaultVatMaterialStatus
    submitCount: number | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
  rent: { // DefaultVatMaterialStatus
    submitCount: number | null;
    materialStatus: MaterialStatusEnum;
    vatMaterialTypeId: string;
  };
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| { __typename: 'NoTargetVatDeclare' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `VatMaterialMain`

**프론트**
- 연산: `vatMaterialMainConnectCountCheckQuery` (`app/vat/(status)/org-status/graphql/vatMaterialMainConnectCountCheck.ts`), `vatMaterialMainSubmitCountCheckQuery` (`app/vat/(status)/org-status/graphql/vatMaterialMainSubmitCountCheck.ts`), `vatMaterialMainQuery` (`app/vat/submit-material/(submitMaterial)/(main)/graphql/vatMaterialMain.ts`)
- 쓰는 파일 (4): `app/vat/(status)/org-status/components/VatRequireMaterial.tsx`, `app/vat/submit-material/(submitMaterial)/(main)/hooks/useGetVatMaterialStatus.ts`, `app/vat/submit-material/(submitMaterial)/(main)/hooks/useVatMaterialMainQuery.ts`, `app/vat/submit-material/(submitMaterial)/no-materials/page.tsx`

---

<a id="05-02"></a>

### 05-02 `vatRecommendMaterial` — 부가세 권장자료 안낸 목록

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
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatRecommendMaterialOutput` · union 2종)

```ts
{
  __typename: 'VatRecommendMaterial';
  recommendMaterial: VatMaterialItemEnum[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `VatRecommendMaterial`

**프론트**
- 연산: `vatRecommendMaterialQuery` (`app/vat/submit-material/(submitMaterial)/(main)/graphql/vatRecommendMaterial.ts`)
- 쓰는 파일 (7): `app/vat/submit-material/(submitMaterial)/(main)/components/RequireInfoBox.tsx`, `app/vat/submit-material/(submitMaterial)/(main)/hooks/useGetRecommendMaterial.ts`, `app/vat/submit-material/(submitMaterial)/(main)/hooks/useGetVatMaterialStatus.ts`, `app/vat/submit-material/(submitMaterial)/(main)/hooks/useSubmitMaterial.ts`, `app/vat/submit-material/(submitMaterial)/no-materials/components/RecommendMaterialCheckList.tsx`, `app/vat/submit-material/(submitMaterial)/no-materials/components/RecommendMaterialList.tsx`, `app/vat/submit-material/(submitMaterial)/no-materials/hooks/useCheckRecommendMaterial.ts`

---

<a id="05-03"></a>

### 05-03 `passMaterialStatus` — 자료제출 없이 신고하기 여부

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PassMaterialStatusOutput` · union 3종)

```ts
{
  __typename: 'PassMaterialStatus';
  passMaterialYn: boolean;
}
| {
  __typename: 'NotFoundVatDeclare';
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

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `passMaterialStatusQuery` (`app/vat/submit-material/(submitMaterial)/(main)/graphql/passMaterialStatus.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)

---

<a id="05-04"></a>

### 05-04 `savePassMaterialStatus` — 자료제출 없이 신고하기 상태 업데이트

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
| `passMaterialYn` | `boolean` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdatePassMaterialStatusOutput` · union 3종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| {
  __typename: 'UpdatePassMaterialStatusSucceed';
  message: string;
}
| { __typename: 'NotFoundVatDeclare' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdatePassMaterialStatusSucceed`

**프론트**
- 연산: `savePassMaterialStatusMutation` (`app/vat/submit-material/(submitMaterial)/no-materials/graphql/savePassMaterialStatus.ts`)
- 쓰는 파일 (2): `app/vat/submit-material/(submitMaterial)/(main)/hooks/useSubmitMaterial.ts`, `app/vat/submit-material/(submitMaterial)/no-materials/hooks/useSavePassMaterialStatus.ts`

---

<a id="05-05"></a>

### 05-05 `saveFirstEnter` — 첫 진입여부 업데이트

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
| `firstEnterYn` | `boolean` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdateFirstEnterOutput` · union 3종)

```ts
{
  __typename: 'UpdateFirstEnterSucceed';
  message: string;
}
| {
  __typename: 'NotFoundVatDeclare';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `saveFirstEnterMutation` (`app/vat/submit-material/guide/graphql/saveFirstEnter.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)

---

<a id="05-06"></a>

### 05-06 `orgMaterialDetail` — 사업체 제출자료 내역

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 화면 진입 시 · 필요할 때 직접 호출 · Relay 밖 직접 fetch |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `materialTypeId` | `string` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `vatDeclareId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `OrgMaterialDetailOutput` · union 5종)

```ts
{
  __typename: 'MaterialCarDetail';
  materialId: number;
  deductionStatus: CarDeductionStatusEnum;
  isApplied: boolean;
  car: { // CarDetail
    company: string | null;
    carNumber: string;
    owner: string;
    seater: string;
  }[];
}
| {
  __typename: 'MaterialFileDetail';
  materialFile: { // MaterialFile
    extension: string | null;
    filename: string;
    materialId: number;
    isApplied: boolean;
  }[];
}
| {
  __typename: 'MaterialTextDetail';
  materialId: number;
  textValue: string;
  isApplied: boolean;
}
| {
  __typename: 'NoSubmittedMaterial';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `MaterialCarDetail`

**프론트**
- 연산: `orgMaterialDetailQuery` (`app/vat/submit-material/(submitMaterial)/graphql/orgMaterialDetail.ts`)
- 쓰는 파일 (12): `app/vat/submit-material/(submitMaterial)/(category)/car/components/CarDeductionStatusAlert.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/car/components/CarNoticeDrawer.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/car/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/card-expense/input-password/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/card-expense/upload-file/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/cash-sales/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/duplicate-sales/page.tsx`, `app/vat/submit-material/(submitMaterial)/components/FileUploadForm.tsx`, `app/vat/submit-material/(submitMaterial)/hooks/useGetUploadFileList.ts`, `app/vat/submit-material/(submitMaterial)/hooks/useVatUploadFile.ts`, `app/vat/submit-material/(submitMaterial)/preview/page.tsx`

---

<a id="05-07"></a>

### 05-07 `materialFileDownload` — 내 제출자료 다운로드

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
| `materialId` | `number` | ✅ | 보냄 |  |
| `declareType` | `DeclareTypeEnum` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `MaterialFileDownloadOutput` · union 2종)

```ts
{
  __typename: 'MaterialFileDownload';
  url: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `materialFileDownloadQuery` (`app/vat/submit-material/(submitMaterial)/graphql/materialFileDownload.ts`)
- 쓰는 파일 (3): `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/detail/hooks/useGetPaperTaxInvoiceFile.ts`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/hooks/useGetRealEstateFile.ts`, `app/vat/submit-material/(submitMaterial)/preview/hooks/useGetVatPreviewFileUrl.ts`

---

<a id="05-08"></a>

### 05-08 `orgCashSalesInfo` — 현금 신고 정보

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `OrgCashSalesOutput` · union 2종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'CashSalesInfo';
  cashAmount: number | null;
  cashRatio: number | null;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `orgCashSalesInfoQuery` (`app/vat/submit-material/guide/graphql/orgCashSalesInfo.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/guide/hooks/useCashSalesInfo.ts`

---

<a id="05-09"></a>

### 05-09 `salesMallList` — 온라인 / 배달앱 매출 조회

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
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `mallCategory` | `SalesMallInputTypeEnum` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SalesMallListOutput` · union 2종)

```ts
{
  __typename: 'SalesMallList';
  salesMallList: string[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `salesMallListQuery` (`app/vat/submit-material/(submitMaterial)/graphql/salesMallList.ts`)
- 쓰는 파일 (4): `app/vat/submit-material/(submitMaterial)/(category)/delivery/components/UploadableDeliveryPage.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/online/components/OnlineMallSalesCard.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/online/components/UploadableOnlinePage.tsx`, `app/vat/submit-material/(submitMaterial)/hooks/useGetSalesMallListQuery.ts`

---

<a id="05-10"></a>

### 05-10 `vatMaterialReusing` — 직전 신고 자료 가져오기

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
| `materialTypeId` | `VatMaterialReusingIdEnum` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatMaterialReusingOutput` · union 3종)

```ts
{
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'PreviousVatMaterialCar';
  car: { // PrevCarInfoType
    owner: string;
    company: string | null;
    carNumber: string;
    seater: string;
  }[];
}
| {
  __typename: 'NoData';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `NoData` `PreviousVatMaterialCar`

**프론트**
- 연산: `vatMaterialReusingQuery` (`app/vat/submit-material/guide/graphql/vatMaterialReusing.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/guide/hooks/useGetLastCarInfo.ts`

---

<a id="05-11"></a>

### 05-11 `vatCardList` — 사업자의 카드 리스트 조회

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatCardListOutput` · union 2종)

```ts
{
  __typename: 'VatCardList';
  addedBasedCardList: { // VatCardBasedAdded
    cardCo: string | null;
    cardId: number;
    cardNo: string;
    amt: string;
    maskingYn: boolean;
  }[];
  hometaxBasedCardList: { // VatCardBasedHometax
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
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `vatCardListQuery` (`app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/vatCardList.ts`)
- 쓰는 파일 (2): `app/vat/submit-material/(submitMaterial)/(category)/card-expense/hooks/useGetVatCardList.ts`, `app/vat/submit-material/(submitMaterial)/(category)/card-expense/hooks/useVatCardListQuery.ts`

---

<a id="05-12"></a>

### 05-12 `vatCardDetail` — 부가세 개인카드 단건 상세 (스키마 설명 '사업자의 카드 리스트 조회' 는 복사 실수로 보임)

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatCardDetailOutput` · union 2종)

```ts
{
  __typename: 'VatCardDetail';
  taxationEnd: string;
  taxationStart: string;
  vatMaterialId: number;
  isApplied: boolean;
  cardDetail: { // CardDetail
    cardCo: string | null;
    cardNo: string;
    maskingYn: boolean;
    cardUse: { // CardUse
      cnt: number;
      amt: number;
      partnerName: string;
    }[];
  };
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `vatCardDetailQuery` (`app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/vatCardDetail.ts`)
- 쓰는 파일 (4): `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/components/CardDetailView.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/components/CardDetailWrapper.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/components/CardUseDetailList.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/card-expense/detail/hooks/useGetVatCardDetail.ts`

---

<a id="05-13"></a>

### 05-13 `vatCardDetailByMaterialId` — 부가세 제출자료 ID 별 개인카드 상세 (스키마 설명 '사업자의 카드 리스트 조회' 는 복사 실수로 보임)

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatCardDetailByMaterialOutput` · union 2종)

```ts
{
  __typename: 'VatCardDetailByMaterial';
  cardDetails: { // CardDetail
    cardCo: string | null;
    cardNo: string;
    cardId: number;
    maskingYn: boolean;
    cardUse: { // CardUse
      cnt: number;
      amt: number;
      partnerName: string;
    }[];
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `vatCardDetailByMaterialIdQuery` (`app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/vatCardDetailByMaterialId.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/card-expense/summary/hooks/useGetCardListByMaterial.ts`

---

<a id="05-14"></a>

### 05-14 `updatePersonalCardNo` — 카드번호 업데이트

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PersonalCardUpdateOutput` · union 3종)

```ts
{
  __typename: 'PersonalCardUpdateSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'VatMaterialAlreadyAppliedError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `PersonalCardUpdateSucceed` `VatMaterialAlreadyAppliedError`

**프론트**
- 연산: `updatePersonalCardNoMutation` (`app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/updatePersonalCardNo.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/card-expense/hooks/usePersonalCardNo.ts`

---

<a id="05-15"></a>

### 05-15 `deletePersonalCardNo` — 부가세 개인카드 번호 삭제 (스키마 설명 '카드번호 업데이트' 는 복사 실수로 보임)

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PersonalCardDeleteOutput` · union 3종)

```ts
{
  __typename: 'PersonalCardDeleteSucceed';
  cardNo: string;
  cardCo: string | null;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'VatMaterialAlreadyAppliedError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `PersonalCardDeleteSucceed` `VatMaterialAlreadyAppliedError`

**프론트**
- 연산: `deletePersonalCardNoMutation` (`app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/deletePersonalCardNo.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/card-expense/hooks/usePersonalCardNo.ts`

---

<a id="05-16"></a>

### 05-16 `cardFileUpload` — 개인카드 업로드 및 파싱

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
| `declareType` | `DeclareTypeEnum` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `materialTypeId` | `string` | ✅ | 보냄 |  |
| `password` | `string \| null` |  | 보냄 |  |
| `append` | `File /* Upload — multipart */` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `PersonalCardOutput` · union 9종)

```ts
{
  __typename: 'NeedFilePassword';
  message: string;
}
| {
  __typename: 'PersonalCardParsingFailed';
  message: string;
}
| {
  __typename: 'PersonalCardSucceed';
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
  __typename: 'NotExistVatItem';
  message: string;
}
| {
  __typename: 'OnlyUploadSucceed';
  materialId: number;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `NeedFilePassword` `OnlyUploadSucceed` `PersonalCardSucceed` `TemporaryError`

**프론트**
- 연산: `cardFileUploadMutation` (`app/vat/submit-material/(submitMaterial)/(category)/card-expense/graphql/cardFileUpload.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/card-expense/upload-file/hooks/useUploadCardFile.ts`

---

<a id="05-17"></a>

### 05-17 `rentInfoList` — 등록된 임대차 계약서 목록

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
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RentInfoListOutput` · union 2종)

```ts
{
  __typename: 'RentInfoList';
  rentInfoList: { // RentInfoWithId
    address: string | null;
    rentUnit: string | null;
    rentFloor: string | null;
    rentRoom: string | null;
    area: string | null;
    tenantName: string | null;
    tenantBizNo: string | null;
    moveInDate: string | null;
    moveOutDate: string | null;
    deposit: string | null;
    rentalFee: string | null;
    rentInfoId: number;
    isApplied: boolean;
    fileMaterialInfo: { // FileMaterialInfo
      vatMaterialId: number | null;
      fileName: string | null;
    } | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `rentInfoListQuery` (`app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/rentInfoList.ts`)
- 쓰는 파일 (10): `app/vat/submit-material/(submitMaterial)/(category)/real-estate/contract-list/components/NoContract.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/contract-list/hooks/useGetContractListInfo.ts`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/contract-list/hooks/useGetContractListQuery.ts`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/hooks/useInsertRentInfo.ts`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/input-loaded/hooks/useGetSelectedContract.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/input-loaded/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/input-ocr/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/select-loaded/components/BeforeRentList.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/select-loaded/hooks/useGetBeforeRentInfo.ts`

---

<a id="05-18"></a>

### 05-18 `beforeRentInfoList` — 이전 등록된 임대차 계약서 목록

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
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `BeforeRentListOutput` · union 2종)

```ts
{
  __typename: 'BeforeRentList';
  rentInfoList: { // RentInfo
    address: string | null;
    rentUnit: string | null;
    rentFloor: string | null;
    rentRoom: string | null;
    area: string | null;
    tenantName: string | null;
    tenantBizNo: string | null;
    moveInDate: string | null;
    moveOutDate: string | null;
    deposit: string | null;
    rentalFee: string | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `beforeRentInfoListQuery` (`app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/beforeRentInfoList.ts`)
- 쓰는 파일 (6): `app/vat/submit-material/(submitMaterial)/(category)/real-estate/contract-list/components/ContractList.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/contract-list/components/NoContract.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/input-loaded/hooks/useGetSelectedContract.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/page.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/select-loaded/hooks/useGetBeforeRentInfo.ts`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/select-loaded/hooks/useGetBeforeRentInfoQuery.ts`

---

<a id="05-19"></a>

### 05-19 `rentParsing` — 임대차계약서 파싱

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
| `declareType` | `DeclareTypeEnum` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `materialTypeId` | `string` | ✅ | 보냄 |  |
| `append` | `File /* Upload — multipart */` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RentUploadOutput` · union 2종)

```ts
{
  __typename: 'RentParsingSucceed';
  rentInfo: { // RentInfo
    address: string | null;
    rentUnit: string | null;
    rentFloor: string | null;
    rentRoom: string | null;
    area: string | null;
    tenantName: string | null;
    tenantBizNo: string | null;
    moveInDate: string | null;
    moveOutDate: string | null;
    deposit: string | null;
    rentalFee: string | null;
  };
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `RentParsingSucceed`

**프론트**
- 연산: `rentParsingMutation` (`app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/rentParsing.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/real-estate/hooks/useParsingRentFile.ts`

---

<a id="05-20"></a>

### 05-20 `insertRentInfo` — 임대차 계약서 관련 사항 저장

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
| `append` | `File /* Upload — multipart */ \| null` |  | 보냄 | ocr인 경우에만 upload |
| `rentInfoList` | `RentInfoInputType[] \| null` |  | 보냄 | 임대차 계약 인서트 목록 |
| `rentInfoList.address` | `string \| null` |  | 보냄 | 소재지 |
| `rentInfoList.rentUnit` | `string \| null` |  | 보냄 | 임대 동 |
| `rentInfoList.rentFloor` | `string \| null` |  | 보냄 | 임대 층 |
| `rentInfoList.rentRoom` | `string \| null` |  | 보냄 | 임대 호 |
| `rentInfoList.area` | `string \| null` |  | 보냄 | 임대 면적 |
| `rentInfoList.tenantName` | `string \| null` |  | 보냄 | 이름 |
| `rentInfoList.tenantBizNo` | `string \| null` |  | 보냄 | 주민 번호/사업자 등록 번호 |
| `rentInfoList.moveInDate` | `string \| null` |  | 보냄 | 입주일 |
| `rentInfoList.moveOutDate` | `string \| null` |  | 보냄 | 퇴거일 |
| `rentInfoList.deposit` | `string \| null` |  | 보냄 | 보증금 |
| `rentInfoList.rentalFee` | `string \| null` |  | 보냄 | 임대료 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `RentInfoInsertOutput` · union 2종)

```ts
{
  __typename: 'RentInfoInsertSucceed';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `RentInfoInsertSucceed`

**프론트**
- 연산: `insertRentInfoMutation` (`app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/insertRentInfo.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/real-estate/hooks/useInsertRentInfo.ts`

---

<a id="05-21"></a>

### 05-21 `updateRentInfo` — 임대차 계약서 수정

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
| `rentInfoId` | `number` | ✅ | 보냄 |  |
| `rentInfo` | `RentInfoInputType` | ✅ | 보냄 |  |
| `rentInfo.address` | `string \| null` |  | 보냄 | 소재지 |
| `rentInfo.rentUnit` | `string \| null` |  | 보냄 | 임대 동 |
| `rentInfo.rentFloor` | `string \| null` |  | 보냄 | 임대 층 |
| `rentInfo.rentRoom` | `string \| null` |  | 보냄 | 임대 호 |
| `rentInfo.area` | `string \| null` |  | 보냄 | 임대 면적 |
| `rentInfo.tenantName` | `string \| null` |  | 보냄 | 이름 |
| `rentInfo.tenantBizNo` | `string \| null` |  | 보냄 | 주민 번호/사업자 등록 번호 |
| `rentInfo.moveInDate` | `string \| null` |  | 보냄 | 입주일 |
| `rentInfo.moveOutDate` | `string \| null` |  | 보냄 | 퇴거일 |
| `rentInfo.deposit` | `string \| null` |  | 보냄 | 보증금 |
| `rentInfo.rentalFee` | `string \| null` |  | 보냄 | 임대료 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdateRentInfoOutput` · union 3종)

```ts
{
  __typename: 'UpdateRentInfoSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'VatMaterialAlreadyAppliedError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdateRentInfoSucceed` `VatMaterialAlreadyAppliedError`

**프론트**
- 연산: `updateRentInfoMutation` (`app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/updateRentInfo.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/hooks/useUpdateRentInfo.ts`

---

<a id="05-22"></a>

### 05-22 `deleteRentInfo` — 임대차 계약서 삭제

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
| `rentInfoId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeleteRentInfoOutput` · union 3종)

```ts
{
  __typename: 'DeleteRentInfoSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'VatMaterialAlreadyAppliedError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeleteRentInfoSucceed` `VatMaterialAlreadyAppliedError`

**프론트**
- 연산: `deleteRentInfoMutation` (`app/vat/submit-material/(submitMaterial)/(category)/real-estate/graphql/deleteRentInfo.ts`)
- 쓰는 파일 (3): `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/components/ContractDeleteDialog.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/components/ContractDetailWrapper.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/real-estate/detail/hooks/useDeleteRentInfo.ts`

---

<a id="05-23"></a>

### 05-23 `taxInvcInfoList` — 등록된 세금계산서 목록

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
| `bmanTin` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `TaxInvcInfoListOutput` · union 2종)

```ts
{
  __typename: 'TaxInvcInfoList';
  taxInvcInfoList: { // TaxInvcInfoWithVatMaterial
    taxInvcInfoId: number;
    bsno: string;
    fileName: string | null;
    slsPrh: TaxInvoiceTypeEnum;
    splrBsno: string | null;
    dmnrDscmNo: string | null;
    wrtDt: string | null;
    splCft: number | null;
    txamt: number | null;
    sumAmt: number | null;
    clplcTnm: string | null;
    prfType: string | null;
    trsCntn: string | null;
    isApplied: boolean;
    fileMaterialInfo: { // FileMaterialInfo
      vatMaterialId: number | null;
      fileName: string | null;
    } | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `taxInvcInfoListQuery` (`app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/taxInvcInfoList.ts`)
- 쓰는 파일 (5): `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/components/TaxInvoiceList.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useParsingTaxInvoices.ts`, `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useTaxInvcInfoList.ts`, `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/store/paperTaxInvoiceDetailAtom.ts`, `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/types/paperTaxInvoiceTypes.ts`

---

<a id="05-24"></a>

### 05-24 `taxInvcParsingMultiple` — 수기 증빙 계산서 다중 파싱 (최대 10개)

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
| `append` | `File /* Upload — multipart */[]` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `TaxInvcUploadOutput` · union 2종)

```ts
{
  __typename: 'TaxInvcParsingMultipleSucceed';
  message: string;
  taxInvcInfoList: { // TaxInvcInfo
    fileName: string | null;
    slsPrh: TaxInvoiceTypeEnum | null;
    splrBsno: string | null;
    dmnrDscmNo: string | null;
    wrtDt: string | null;
    splCft: number | null;
    txamt: number | null;
    sumAmt: number | null;
    clplcTnm: string | null;
    prfType: string | null;
    trsCntn: string | null;
  }[];
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `TaxInvcParsingMultipleSucceed`

**프론트**
- 연산: `taxInvcParsingMultipleMutation` (`app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/taxInvcParsingMultiple.ts`)
- 쓰는 파일 (2): `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useParsingTaxInvoices.ts`, `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/types/paperTaxInvoiceTypes.ts`

---

<a id="05-25"></a>

### 05-25 `insertTaxInvcInfo` — 세금계산서 정보 저장

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
| `append` | `File /* Upload — multipart */` | ✅ | 보냄 | 계산서 파일 |
| `taxInvcInfo` | `TaxInvcInfoInputType` | ✅ | 보냄 | 세금계산서 정보 |
| `taxInvcInfo.slsPrh` | `TaxInvoiceTypeEnum` | ✅ | 보냄 | 매입매출구분 |
| `taxInvcInfo.splrBsno` | `string` | ✅ | 보냄 | 공급자사업자등록번호 |
| `taxInvcInfo.dmnrDscmNo` | `string` | ✅ | 보냄 | 공급받는자사업자번호 |
| `taxInvcInfo.wrtDt` | `string` | ✅ | 보냄 | 작성일자 (YYYYMMDD) |
| `taxInvcInfo.splCft` | `number` | ✅ | 보냄 | 공급가액 |
| `taxInvcInfo.txamt` | `number` | ✅ | 보냄 | 세액(부가세) |
| `taxInvcInfo.sumAmt` | `number` | ✅ | 보냄 | 합계금액 |
| `taxInvcInfo.clplcTnm` | `string` | ✅ | 보냄 | 거래처상호 |
| `taxInvcInfo.prfType` | `string \| null` |  | 보냄 | 증빙유형 |
| `taxInvcInfo.trsCntn` | `string \| null` |  | 보냄 | 거래 내용 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `TaxInvcInfoInsertOutput` · union 3종)

```ts
{
  __typename: 'TaxInvcInfoInsertSucceed';
  message: string;
}
| {
  __typename: 'IncorrectCareUserBsno';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `TaxInvcInfoInsertSucceed` `TemporaryError`

**프론트**
- 연산: `insertTaxInvcInfoMutation` (`app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/insertTaxInvcInfo.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useInsertTaxInvcInfo.ts`

---

<a id="05-26"></a>

### 05-26 `updateTaxInvcInfo` — 세금계산서 정보 수정

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
| `taxInvcInfoId` | `number` | ✅ | 보냄 |  |
| `taxInvcInfoUpdate` | `TaxInvcInfoUpdateInputType` | ✅ | 보냄 |  |
| `taxInvcInfoUpdate.slsPrh` | `TaxInvoiceTypeEnum` | ✅ | 보냄 | 매입매출구분 |
| `taxInvcInfoUpdate.splrBsno` | `string` | ✅ | 보냄 | 공급자사업자등록번호 |
| `taxInvcInfoUpdate.dmnrDscmNo` | `string` | ✅ | 보냄 | 공급받는자사업자번호 |
| `taxInvcInfoUpdate.wrtDt` | `string` | ✅ | 보냄 | 작성일자 (YYYYMMDD) |
| `taxInvcInfoUpdate.splCft` | `number` | ✅ | 보냄 | 공급가액 |
| `taxInvcInfoUpdate.txamt` | `number` | ✅ | 보냄 | 세액(부가세) |
| `taxInvcInfoUpdate.sumAmt` | `number` | ✅ | 보냄 | 합계금액 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `UpdateTaxInvcInfoOutput` · union 3종)

```ts
{
  __typename: 'UpdateTaxInvcInfoSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'VatMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `UpdateTaxInvcInfoSucceed` `VatMaterialAlreadyAppliedError`

**프론트**
- 연산: `updateTaxInvcInfoMutation` (`app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/updateTaxInvcInfo.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useUpdateTaxInvcInfo.ts`

---

<a id="05-27"></a>

### 05-27 `deleteTaxInvcInfo` — 세금계산서 정보 삭제

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
| `taxInvcInfoId` | `number` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeleteTaxInvcInfoOutput` · union 3종)

```ts
{
  __typename: 'DeleteTaxInvcInfoSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'VatMaterialAlreadyAppliedError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeleteTaxInvcInfoSucceed` `VatMaterialAlreadyAppliedError`

**프론트**
- 연산: `deleteTaxInvcInfoMutation` (`app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/deleteTaxInvcInfo.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useDeleteTaxInvcInfo.ts`

---

<a id="05-28"></a>

### 05-28 `checkBsnoValid` — 사업자번호 유효성 검증

| 항목 | 내용 |
|---|---|
| 종류 | 조회 (GraphQL query) |
| 호출 시점 | 필요할 때 직접 호출 |
| 이 API 를 부르는 프론트 연산 | 1개 |
| REST (백엔드 기입) | `METHOD /path` |
| 진행 | ☐ 백엔드 · ☐ 프론트 |

**요청**

| 이름 | 타입 | 필수 | 프론트 | 설명 |
|---|---|---|---|---|
| `bsno` | `string` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `BsnoValidCheckOutput` · union 3종)

```ts
{
  __typename: 'BsnoValid';
  message: string;
}
| {
  __typename: 'BsnoInvalid';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `BsnoInvalid` `BsnoValid` `TemporaryError`

**프론트**
- 연산: `checkBsnoValidQuery` (`app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/graphql/checkBsnoValid.ts`)
- 쓰는 파일 (1): `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/hooks/useCheckBsnoValidApi.ts`

---

<a id="05-29"></a>

### 05-29 `fileUpload` — 파일업로드

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
| `declareType` | `DeclareTypeEnum` | ✅ | 보냄 |  |
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `materialTypeId` | `string` | ✅ | 보냄 |  |
| `append` | `File /* Upload — multipart */` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `FileUploadOutput` · union 3종)

```ts
{
  __typename: 'FileUploadSucceed';
  materialId: number;
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'VatMaterialAlreadyAppliedError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `FileUploadSucceed` `VatMaterialAlreadyAppliedError`

**프론트**
- 연산: `fileUploadMutation` (`app/vat/submit-material/(submitMaterial)/graphql/fileUpload.ts`)
- 쓰는 파일 (17): `app/global-income/(auth)/(submit-material)/deductions-additional/collection-complete/hooks/useIncomeMaterialUpload.ts`, `app/global-income/(auth)/(submit-material)/deductions-dependents/dependents-list/components/DependentUploadButton.tsx`, `app/global-income/(auth)/(submit-material)/deductions-dependents/dependents-list/hooks/useDependentFileUpload.ts`, `app/global-income/(auth)/(submit-material)/deductions-personal/components/DisabilityDeductionCard.tsx`, `app/global-income/(auth)/(submit-material)/deductions-personal/hooks/useSubmitDisabilityMaterial.ts`, `app/global-income/(auth)/(submit-material)/expenses-documents/submit-material/components/ExpenseFileUpload.tsx`, `app/global-income/(auth)/components/GlobalIncomeFileUpload.tsx`, `app/vat/submit-material/(submitMaterial)/(category)/paper-tax-invoice/components/TaxInvoiceUploadErrorDialog.tsx`, `app/vat/submit-material/(submitMaterial)/components/FileList.tsx`, `app/vat/submit-material/(submitMaterial)/components/FileUploadForm.tsx`, `app/vat/submit-material/(submitMaterial)/components/UploadFileList.tsx`, `app/vat/submit-material/(submitMaterial)/hooks/useVatUploadFile.ts`, `app/year-end-tax/[year]/[employeeId]/components/UploadContents.tsx`, `app/year-end-tax/[year]/[employeeId]/hooks/useYearEndTaxFileUpload.ts`, `constants/ocrFileUpload.ts`, `hooks/useFileUploadModalState.ts`, `hooks/useUploadFiles.ts`

---

<a id="05-30"></a>

### 05-30 `saveTextMaterial` — 자료 입력

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
| `materialTypeId` | `string` | ✅ | 보냄 | 자료 타입 아이디 |
| `bmanTin` | `string` | ✅ | 보냄 |  |
| `declareType` | `DeclareTypeEnum` | ✅ | 보냄 |  |
| `textValue` | `string \| null` |  | 보냄 | 텍스트형 자료 |
| `carInfo` | `CarInfoInput[] \| null` |  | 보냄 | 차량 자료 |
| `carInfo.owner` | `string` | ✅ | 보냄 | 소유자 |
| `carInfo.company` | `string \| null` |  | 보냄 | 렌트/리스사명 |
| `carInfo.carNumber` | `string` | ✅ | 보냄 | 차량번호 |
| `carInfo.seater` | `string` | ✅ | 보냄 | 인승 |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `SaveTextMaterialOutput` · union 3종)

```ts
{
  __typename: 'SaveTextMaterialSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
| { __typename: 'DuplicateMaterial' } /* 필드를 읽지 않는 멤버 */
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `SaveTextMaterialSucceed`

**프론트**
- 연산: `saveTextMaterialMutation` (`app/vat/submit-material/(submitMaterial)/graphql/saveTextMaterial.ts`)
- 쓰는 파일 (2): `app/vat/submit-material/(submitMaterial)/(category)/car/hooks/useSaveVehicleMaterial.ts`, `app/vat/submit-material/(submitMaterial)/hooks/useSaveTextMaterial.ts`

---

<a id="05-31"></a>

### 05-31 `deleteSubmittedMaterial` — 제출자료 삭제

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
| `declareType` | `DeclareTypeEnum` | ✅ | 보냄 |  |

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `DeleteSubmittedMaterialOutput` · union 3종)

```ts
{
  __typename: 'DeleteSubmittedMaterialSucceed';
  message: string;
}
| {
  __typename: 'TemporaryError';
  message: string;
}
| {
  __typename: 'VatMaterialAlreadyAppliedError';
  message: string;
}
| { // ... on BaseError — 이 interface 를 구현한 멤버 공통
  message: string;
}
```

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `DeleteSubmittedMaterialSucceed` `VatMaterialAlreadyAppliedError`

**프론트**
- 연산: `deleteSubmittedMaterialMutation` (`app/vat/submit-material/(submitMaterial)/graphql/deleteSubmittedMaterial.ts`)
- 쓰는 파일 (4): `app/vat/submit-material/(submitMaterial)/(category)/car/hooks/useSaveVehicleMaterial.ts`, `app/vat/submit-material/(submitMaterial)/hooks/useSaveTextMaterial.ts`, `app/vat/submit-material/(submitMaterial)/hooks/useVatDeleteFile.ts`, `app/vat/submit-material/(submitMaterial)/hooks/useVatUploadFile.ts`

---

<a id="05-32"></a>

### 05-32 `vatMaterialComplete` — 부가세신고 자료제출 완료

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatDeclareMaterialCompleteOutput` · union 2종)

```ts
{
  __typename: 'VatDeclareMaterialCompleteSucceed';
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

**프론트가 분기하는 응답 타입** (이 API 를 쓰는 파일 기준 — 같은 파일의 다른 API 것이 섞일 수 있다): `VatDeclareMaterialCompleteSucceed`

**프론트**
- 연산: `vatMaterialCompleteMutation` (`app/vat/submit-material/(submitMaterial)/(main)/graphql/vatMaterialComplete.ts`)
- 쓰는 파일 (2): `app/vat/submit-material/(submitMaterial)/(main)/hooks/useSubmitMaterial.ts`, `app/vat/submit-material/(submitMaterial)/(main)/hooks/useVatMaterialCompleteRequest.ts`

---

<a id="05-33"></a>

### 05-33 `vatMaterialCancel` — 부가세신고 자료제출완료 취소

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

**응답** — 프론트가 실제로 읽는 필드만 (전체 타입 `VatDeclareMaterialCancelOutput` · union 2종)

```ts
{
  __typename: 'VatDeclareMaterialCancelSucceed';
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

**프론트가 분기하는 응답 타입** : 따로 분기 없음 (성공 타입만 보고 나머지는 일시 오류 처리)

**프론트**
- 연산: `vatMaterialCancelMutation` (`app/vat/submit-material/(submitMaterial)/(main)/graphql/vatMaterialCancel.ts`)
- 쓰는 파일 (0): (정의 파일 안에서만)
