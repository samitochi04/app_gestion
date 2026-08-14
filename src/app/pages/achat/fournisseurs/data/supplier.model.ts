/**
 * Supplier (`FRN-0001`). Mirror of the sales `Customer` on the purchase side.
 * A supplier is never deleted — only deactivated — because journal entries
 * reference it (see MODULES.md § erp-supplier).
 */
export interface Supplier {
  id: number;
  reference: string;
  name: string;
  email: string;
  phone: string;
  taxId: string;
  address: string;
  active: boolean;
  createdAt: string;
}

export interface SupplierRequest {
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
}
