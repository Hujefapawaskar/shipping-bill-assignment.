// Shape of the Shipping Bill form. Every value is kept as a string while editing (that is what inputs produce);
// conversion to numbers/dates happens once, at the API boundary (see services/shipping-bill-payload.ts).

export interface BillItemForm {
  ritcCode: string
  schemeCode?: string
  goodsDescription1: string
  quantity: string
  unitOfMeasurement: string
  unitPrice: string
  /** Optional override; when blank the line total is quantity × unit price. */
  lineTotal?: string
  igstPaymentStatus?: string
  taxableValue?: string
  igstAmount?: string
  drawbackSerialNumber?: string
  drawbackUnit?: string
  drawbackQuantity?: string
  rewardItem?: boolean
  thirdPartyItem?: boolean
  itemThirdPartyId?: string
  itemThirdPartyBranchId?: string
  unitOfRate?: string
  numberOfUnits?: string
  presentMarketValue?: string
  cess?: string
  accessoriesDescription?: string
  accessoryStatus?: string
  originDistrictCode?: string
  tradeAgreementsCode?: string
  endUseOfItem?: string
  totalPackage?: string
  ar4Number?: string
  ar4Date?: string
}

export interface BillInvoiceForm {
  invoiceNumber: string
  invoiceDate: string
  currency: string
  contractType: string
  /** Optional declared total; when blank the sum of item totals is used. */
  invoiceTotal?: string
  buyerSameAsConsignee: boolean
  buyerId: string
  buyerBranchId: string
  thirdPartyId?: string
  thirdPartyBranchId?: string
  freightRate?: string
  freightAmount?: string
  freightCurrency?: string
  insuranceRate?: string
  insuranceAmount?: string
  insuranceCurrency?: string
  commissionRate?: string
  commissionAmount?: string
  commissionCurrency?: string
  discountRate?: string
  discountAmount?: string
  discountCurrency?: string
  otherDeductionsRate?: string
  otherDeductionsAmount?: string
  otherDeductionsCurrency?: string
  packingCharges?: string
  freightInsuranceIncluded?: string
  contractNumber?: string
  natureOfPayment?: string
  periodOfPayment?: string
  items: BillItemForm[]
}

export interface ContainerForm {
  containerNumber: string
  containerSize?: string
  exciseSealNumber?: string
  sealDate?: string
  sealType?: string
  sealDeviceId?: string
  movementDocumentType?: string
  movementDocumentNumber?: string
}

export interface PackingRangeForm {
  packingNumberFrom: string
  packingNumberTo: string
  packingCode?: string
}

export interface SupportingDocForm {
  documentTypeCode: string
  documentReferenceNumber: string
  imageReferenceNumber?: string
  documentIssueDate?: string
  documentExpiryDate?: string
  invoiceSerialNumber?: string
  itemSerialNumber?: string
  fileType?: string
  placeOfIssue?: string
  issuingPartyCode?: string
  issuingPartyName?: string
  issuingPartyAddress1?: string
  issuingPartyAddress2?: string
  issuingPartyCity?: string
  issuingPartyPin?: string
  beneficiaryPartyCode?: string
  beneficiaryPartyName?: string
  beneficiaryPartyAddress1?: string
  beneficiaryPartyAddress2?: string
  beneficiaryPartyCity?: string
  beneficiaryPartyPin?: string
}

export interface LicenseForm {
  registrationNumber: string
  registrationDate?: string
  invoiceSerialNumber?: string
  itemSerialNumber?: string
  licenseSerialNumber?: string
  itemSerialNumberPartE?: string
  itemSerialNumberPartC?: string
  licenseQuantity?: string
  licenseExportQuantity?: string
  indigenousOrImported?: string
}

export interface ShippingBillFormValues {
  /** Assigned by the server on first save when left blank. */
  jobNumber?: string
  jobDate: string
  exporterId: string
  exporterBranchId: string
  consigneeId: string
  consigneeBranchId: string
  loadingPort: string
  finalDestinationPort: string
  /** Defaults to the final destination port when blank. */
  dischargePort?: string
  originStateCode?: string
  nfeiCategory?: string
  rbiWaiverNumber?: string
  rbiWaiverDate?: string
  natureOfCargo: string
  grossWeight?: string
  netWeight?: string
  measurementUnit: string
  totalPackages?: string
  marksAndNumbers?: string
  sealType?: string
  /** Only used when no containers are listed individually. */
  numberOfContainers?: string
  loosePackets?: string
  mawbNumber?: string
  hawbNumber?: string
  invoices: BillInvoiceForm[]
  containers: ContainerForm[]
  packingRanges: PackingRangeForm[]
  documents: SupportingDocForm[]
  licenses: LicenseForm[]
}
