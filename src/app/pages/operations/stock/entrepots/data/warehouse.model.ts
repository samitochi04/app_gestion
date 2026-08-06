/**
 * `purchaseDefault` and `damagedDefault` are mutually exclusive and unique
 * across all warehouses: exactly one warehouse receives purchases, exactly one
 * receives damaged goods. Every other warehouse is supplied by transfer.
 */
export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  active: boolean;
  purchaseDefault: boolean;
  damagedDefault: boolean;
}

/** `code` is immutable once created, which is why update omits it. */
export interface CreateWarehouseRequest {
  code: string;
  name: string;
  address?: string;
}

export interface UpdateWarehouseRequest {
  name: string;
  address?: string;
}
