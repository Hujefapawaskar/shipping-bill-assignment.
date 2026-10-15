// Small customs code lists served by the mock reference-data endpoint.
import type { Option, Port } from '../../api-types'

export const currencies: Option[] = ['USD', 'EUR', 'INR', 'AED', 'GBP', 'SGD'].map((code) => ({
  value: code,
  label: code
}))

export const contractTypes: Option[] = [
  { value: 'FOB', label: 'FOB (Free on Board)' },
  { value: 'CF', label: 'CF (Cost + Freight)' },
  { value: 'CIF', label: 'CIF (Cost + Insurance + Freight)' },
  { value: 'CI', label: 'CI (Cost + Insurance)' }
]

export const sealTypes: Option[] = [
  { value: 'S', label: 'S - Self sealed' },
  { value: 'A', label: 'A - Agency / Customs sealed' },
  { value: 'W', label: 'W - Warehouse / Port sealed' }
]

export const containerSealTypes: Option[] = [
  { value: 'BTSL', label: 'BTSL - Bottle seal' },
  { value: 'ESEAL', label: 'ESEAL - Electronic seal' },
  { value: 'RFID', label: 'RFID - Radio frequency identifier' }
]

export const containerSizes: Option[] = [
  { value: '20', label: '20 ft' },
  { value: '40', label: '40 ft' },
  { value: '45', label: '45 ft' }
]

export const weightUnits: Option[] = [
  { value: 'KG', label: 'kg (kilogram)' },
  { value: 'g', label: 'g (gram)' },
  { value: 'MT', label: 'mt (metric ton)' },
  { value: 'lb', label: 'lb (pound)' }
]

export const paymentTypes: Option[] = [
  { value: 'DP', label: 'DP (Direct payment)' },
  { value: 'AP', label: 'AP (Advance payment)' },
  { value: 'LC', label: 'LC (Letter of credit)' },
  { value: 'DA', label: 'DA (Delivery against acceptance)' },
  { value: 'NA', label: 'NA (Not applicable)' }
]

export const priceInclusionTypes: Option[] = [
  { value: 'B', label: 'Freight and insurance - B' },
  { value: 'F', label: 'Freight only - F' },
  { value: 'I', label: 'Insurance only - I' },
  { value: 'N', label: 'Neither - N' }
]

export const cargoNatures: Option[] = [
  { value: 'P', label: 'Packaged cargo - P' },
  { value: 'C', label: 'Containerized - C' },
  { value: 'CP', label: 'Containerized packages - CP' },
  { value: 'LB', label: 'Liquid bulk - LB' },
  { value: 'DB', label: 'Dry bulk - DB' }
]

export const nfeiCategories: Option[] = [
  { value: '01', label: 'Free trade sample' },
  { value: '02', label: 'Diplomatic goods' },
  { value: '03', label: 'Warranty replacement' },
  { value: '07', label: 'Gift parcel' },
  { value: '08', label: 'Other' }
]

export const igstPaymentStatuses: Option[] = [
  { value: 'NA', label: 'Not applicable' },
  { value: 'LUT', label: 'Under LUT / bond' },
  { value: 'P', label: 'Against payment' }
]

export const accessoryStatuses: Option[] = [
  { value: '0', label: 'No accessory' },
  { value: '1', label: 'Included free of cost' },
  { value: '2', label: 'Entered separately' }
]

export const goodsSources: Option[] = [
  { value: 'I', label: 'Imported' },
  { value: 'D', label: 'Indigenous' }
]

export const documentFileTypes: Option[] = [{ value: 'pdf', label: 'PDF' }]

export const countries: Option[] = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'DE', label: 'Germany' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SG', label: 'Singapore' },
  { value: 'GB', label: 'United Kingdom' }
]

export const exporterClasses: Option[] = [
  { value: 'F', label: 'Manufacturer' },
  { value: 'R', label: 'Merchant' },
  { value: 'C', label: 'Merchant courier' },
  { value: 'D', label: 'Manufacturer courier' }
]

export const exporterTypes: Option[] = [
  { value: 'P', label: 'Private' },
  { value: 'G', label: 'Government' },
  { value: 'W', label: 'Warehouse' }
]

export const loadingPorts: Port[] = [
  { code: 'INNSA1', name: 'Nhava Sheva', countryCode: 'IN' },
  { code: 'INMUN1', name: 'Mundra', countryCode: 'IN' },
  { code: 'INMAA1', name: 'Chennai', countryCode: 'IN' },
  { code: 'INBOM4', name: 'Mumbai Air Cargo', countryCode: 'IN' }
]

export const destinationPorts: Port[] = [
  { code: 'USMSY', name: 'New Orleans', countryCode: 'US' },
  { code: 'USLAX', name: 'Los Angeles', countryCode: 'US' },
  { code: 'DEHAM', name: 'Hamburg', countryCode: 'DE' },
  { code: 'AEJEA', name: 'Jebel Ali', countryCode: 'AE' },
  { code: 'SGSIN', name: 'Singapore', countryCode: 'SG' }
]

/** Shipping-mark templates registered per exporter id. */
export const marksByExporter: Record<string, string[]> = {
  '1000': ['AARAV TEXTILES / MADE IN INDIA', 'ATPL / LOT NO. ______'],
  '1002': ['BLUE HARBOR EXPORTS / INDIA', 'BHE / SHIPPING MARKS AS PER INVOICE']
}
