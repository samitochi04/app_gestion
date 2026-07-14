export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  active: boolean;
}

export interface WarehouseRequest {
  code: string;
  name: string;
  address?: string;
}
