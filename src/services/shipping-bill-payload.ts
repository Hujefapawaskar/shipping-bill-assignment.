// Maps form values to the backend's shipping bill request body.
// Field names (incl. existing spellings such as `packging_list` / `freight_insaurance_included`) follow the backend
// contract and must not be "fixed" here without a matching backend change.
import {
  impliedPriceInclusion,
  invoiceTotal,
  isBlank,
  lineTotal,
  portCountry,
  toOptionalNumber,
  valueOr
} from '@/shipping-bills/model/calculations'
import { BillInvoiceForm, ShippingBillFormValues } from '@/shipping-bills/model/types'

function charge(
  invoice: BillInvoiceForm,
  prefix: 'freight' | 'insurance' | 'commission' | 'discount' | 'otherDeductions'
) {
  return {
    rate: toOptionalNumber(invoice[`${prefix}Rate`]),
    amount: toOptionalNumber(invoice[`${prefix}Amount`]),
    currency: valueOr(invoice[`${prefix}Currency`], invoice.currency)
  }
}

export function toShippingBillPayload(values: ShippingBillFormValues) {
  const dischargePort = valueOr(values.dischargePort, values.finalDestinationPort)

  return {
    shipping_bill: {
      job_number: toOptionalNumber(values.jobNumber),
      job_date: values.jobDate,
      exporter: Number(values.exporterId),
      exporter_branch: Number(values.exporterBranchId),
      consignee: Number(values.consigneeId),
      consignee_address: Number(values.consigneeBranchId),
      loading_port: values.loadingPort,
      loading_country_code: portCountry(values.loadingPort),
      final_destination_port: values.finalDestinationPort,
      final_destination_country_code: portCountry(values.finalDestinationPort),
      discharge_port: dischargePort,
      discharge_country_code: portCountry(dischargePort),
      origin_state_code: toOptionalNumber(values.originStateCode),
      nfei_category: toOptionalNumber(values.nfeiCategory),
      rbi_waiver_number: values.rbiWaiverNumber,
      rbi_waiver_date: values.rbiWaiverDate,
      sealtype: values.sealType,
      natureofcargo: values.natureOfCargo,
      grossweight: toOptionalNumber(values.grossWeight),
      netweight: toOptionalNumber(values.netWeight),
      measurement_unit: values.measurementUnit,
      total_packages: toOptionalNumber(values.totalPackages),
      marks_and_numbers: values.marksAndNumbers,
      loose_packets: toOptionalNumber(values.loosePackets),
      number_of_containers: values.containers.length || (toOptionalNumber(values.numberOfContainers) ?? 0),
      mawb_number: values.mawbNumber,
      hawb_number: values.hawbNumber
    },
    invoices: values.invoices.map((invoice, index) => {
      const freight = charge(invoice, 'freight')
      const insurance = charge(invoice, 'insurance')
      const commission = charge(invoice, 'commission')
      const discount = charge(invoice, 'discount')
      const otherDeductions = charge(invoice, 'otherDeductions')
      return {
        serial_number: index + 1,
        invoicenumber: invoice.invoiceNumber,
        date: invoice.invoiceDate,
        currency: invoice.currency,
        contract_type: invoice.contractType,
        buyer: Number(invoice.buyerSameAsConsignee ? values.consigneeId : invoice.buyerId),
        buyer_address: Number(invoice.buyerSameAsConsignee ? values.consigneeBranchId : invoice.buyerBranchId),
        third_party: toOptionalNumber(invoice.thirdPartyId),
        third_party_address: toOptionalNumber(invoice.thirdPartyBranchId),
        freight_rate: freight.rate,
        freight_amount: freight.amount,
        freight_currency: freight.currency,
        insurance_rate: insurance.rate,
        insurance_amount: insurance.amount,
        insurance_currency: insurance.currency,
        commission_rate: commission.rate,
        commission_amount: commission.amount,
        commission_currency: commission.currency,
        discount_rate: discount.rate,
        discount_amount: discount.amount,
        discount_currency: discount.currency,
        other_deductions_rate: otherDeductions.rate,
        other_deductions_amount: otherDeductions.amount,
        other_deductions_currency: otherDeductions.currency,
        packing_charges: toOptionalNumber(invoice.packingCharges),
        freight_insaurance_included: valueOr(
          invoice.freightInsuranceIncluded,
          impliedPriceInclusion(invoice.contractType)
        ),
        contract_number: invoice.contractNumber,
        nature_of_payment: invoice.natureOfPayment,
        period_of_payment: toOptionalNumber(invoice.periodOfPayment),
        invoice_total: invoiceTotal(invoice),
        items: invoice.items.map((item, itemIndex) => {
          const igstPaid = item.igstPaymentStatus === 'P'
          return {
            item_serial_number: itemIndex + 1,
            ritc_code: item.ritcCode,
            goods_description_1: item.goodsDescription1,
            accessories_description: item.accessoriesDescription,
            scheme_code: item.schemeCode,
            quantity: Number(item.quantity),
            unit_of_measurement: item.unitOfMeasurement,
            unit_price: Number(item.unitPrice),
            unit_of_rate: valueOr(item.unitOfRate, item.unitOfMeasurement),
            line_total: lineTotal(item),
            present_market_value: toOptionalNumber(item.presentMarketValue),
            no_of_units: toOptionalNumber(item.numberOfUnits),
            accessory_status: item.accessoryStatus,
            third_party: item.thirdPartyItem,
            igst_payment_status: item.igstPaymentStatus,
            taxable_value: igstPaid ? toOptionalNumber(item.taxableValue) : undefined,
            igst_amount: igstPaid ? toOptionalNumber(item.igstAmount) : undefined,
            drawback_serial_number: item.drawbackSerialNumber,
            drawback_unit: item.drawbackUnit,
            drawback_quantity: toOptionalNumber(item.drawbackQuantity),
            cess: toOptionalNumber(item.cess),
            origin_district_code: toOptionalNumber(item.originDistrictCode),
            trade_agreements_code: item.tradeAgreementsCode,
            end_use_of_item: item.endUseOfItem,
            total_package: toOptionalNumber(item.totalPackage),
            reward_item: item.rewardItem
          }
        })
      }
    }),
    invoice_item_third_parties: values.invoices.flatMap((invoice, invoiceIndex) =>
      invoice.items
        .map((item, itemIndex) => ({ item, itemIndex }))
        .filter(({ item }) => item.thirdPartyItem && !isBlank(item.itemThirdPartyId))
        .map(({ item, itemIndex }) => ({
          invoice_serial_number: invoiceIndex + 1,
          item_serial_number: itemIndex + 1,
          third_party: Number(item.itemThirdPartyId),
          third_party_address: toOptionalNumber(item.itemThirdPartyBranchId)
        }))
    ),
    ar4_details: values.invoices.flatMap((invoice, invoiceIndex) =>
      invoice.items
        .map((item, itemIndex) => ({ item, itemIndex }))
        .filter(({ item }) => !isBlank(item.ar4Number))
        .map(({ item, itemIndex }) => ({
          invoice_serial_number: invoiceIndex + 1,
          item_serial_number: itemIndex + 1,
          ar4_number: item.ar4Number,
          ar4_date: item.ar4Date
        }))
    ),
    container_details: values.containers.map((container) => ({
      container_number: container.containerNumber,
      container_size: toOptionalNumber(container.containerSize),
      excise_seal_number: container.exciseSealNumber,
      seal_date: container.sealDate,
      seal_type: container.sealType,
      seal_device_id: container.sealDeviceId,
      movement_document_type: container.movementDocumentType,
      movement_document_number: container.movementDocumentNumber
    })),
    packging_list: values.packingRanges.map((range) => ({
      packing_number_from: toOptionalNumber(range.packingNumberFrom),
      packing_number_to: toOptionalNumber(range.packingNumberTo),
      packing_code: range.packingCode
    })),
    supporting_docs: values.documents.map((document, index) => ({
      serial_number: index + 1,
      invoice_serial_number: toOptionalNumber(document.invoiceSerialNumber),
      item_serial_number: toOptionalNumber(document.itemSerialNumber),
      document_type_code: document.documentTypeCode,
      document_reference_number: document.documentReferenceNumber,
      image_reference_number: document.imageReferenceNumber,
      document_issue_date: document.documentIssueDate,
      document_expiry_date: document.documentExpiryDate,
      place_of_issue: document.placeOfIssue,
      issuing_party_code: document.issuingPartyCode,
      issue_party_name: document.issuingPartyName,
      issuing_party_name_addr1: document.issuingPartyAddress1,
      issuing_party_name_addr2: document.issuingPartyAddress2,
      issuing_party_name_city: document.issuingPartyCity,
      issuing_party_name_pin: document.issuingPartyPin,
      beneficiary_party_code: document.beneficiaryPartyCode,
      beneficiary_party_name: document.beneficiaryPartyName,
      beneficiary_party_name_addr1: document.beneficiaryPartyAddress1,
      beneficiary_party_name_addr2: document.beneficiaryPartyAddress2,
      beneficiary_party_name_city: document.beneficiaryPartyCity,
      beneficiary_party_name_pin: document.beneficiaryPartyPin,
      file_type: document.fileType
    })),
    licenses: values.licenses.map((license) => ({
      registration_number: license.registrationNumber,
      registration_date: license.registrationDate,
      invoice_serial_number: toOptionalNumber(license.invoiceSerialNumber),
      item_serial_number: toOptionalNumber(license.itemSerialNumber),
      licence_serial_number: toOptionalNumber(license.licenseSerialNumber),
      item_serial_number_part_e: license.itemSerialNumberPartE,
      item_serial_number_part_c: license.itemSerialNumberPartC,
      quantity: toOptionalNumber(license.licenseQuantity),
      export_quantity: toOptionalNumber(license.licenseExportQuantity),
      indigenous_or_imported: license.indigenousOrImported
    }))
  }
}

export type ShippingBillPayload = ReturnType<typeof toShippingBillPayload>
