export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: string;
  taxId: string;
  active: boolean;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  createdAt: string;
}

export interface CustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  type?: string;
  taxId?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}
