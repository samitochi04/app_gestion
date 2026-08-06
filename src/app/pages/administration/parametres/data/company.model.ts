/**
 * Company identity, as printed on every invoice and accounting statement.
 * Single-row aggregate on the backend.
 */
export interface CompanySettings {
  id: number;
  // identité
  name: string;
  legalForm: string;
  slogan: string;
  // contact
  address: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  // mentions légales
  nui: string;
  rccm: string;
  niu: string;
  taxRegime: string;
  authorizedCapital: number | null;
  // documents
  hasLogo: boolean;
  logoContentType: string;
  hasSignature: boolean;
  signatureLabel: string;
  // facturation
  defaultVatRate: number | null;
  invoiceFooter: string;
  invoiceTerms: string;
  updatedAt: string;
}

/** The backend splits updates into four commands, one per concern. */
export interface CompanyIdentityRequest {
  name?: string;
  legalForm?: string;
  slogan?: string;
}

export interface CompanyContactRequest {
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  website?: string;
}

export interface CompanyLegalRequest {
  nui?: string;
  rccm?: string;
  niu?: string;
  taxRegime?: string;
  authorizedCapital?: number;
}

export interface BillingSettingsRequest {
  defaultVatRate?: number;
  invoiceFooter?: string;
  invoiceTerms?: string;
}
