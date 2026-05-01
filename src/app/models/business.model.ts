import { PageResponse } from './user.model';

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
}

export type ProductType = 'STOCKABLE' | 'CONSUMABLE' | 'SERVICE';

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  type: ProductType;
  categoryId: number | null;
  unitPurchasePrice: number;
  unitSalePrice: number;
  marginPercent: number;
  unit: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  page?: number;
  size?: number;
  query?: string;
  categoryId?: number | null;
  active?: boolean | null;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  description: string;
  type: ProductType;
  categoryId: number | null;
  unitPurchasePrice: number;
  unit: string;
}

export interface UpdateProductRequest {
  name: string;
  description: string;
  categoryId: number | null;
  unitPurchasePrice: number;
  unit: string;
  marginPercent: number;
  unitSalePrice: number;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  active: boolean;
}

export interface CreateWarehouseRequest {
  name: string;
  code: string;
  address: string;
}

export interface UpdateWarehouseRequest {
  name: string;
  address: string;
}

export type CustomerType = 'INDIVIDUAL' | 'COMPANY';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  taxId: string;
  active: boolean;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  createdAt: string;
}

export interface CustomerFilters {
  page?: number;
  size?: number;
  query?: string;
  active?: boolean | null;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  taxId: string;
}

export interface UpdateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  taxId: string;
}

export interface StockCurrent {
  productId: number;
  warehouseId: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  avgCost: number;
  totalValue: number;
  lastUpdated: string;
}

export interface StockLot {
  id: number;
  batchNumber: string;
  productId: number;
  warehouseId: number;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitCost: number;
  expirationDate: string;
  expired: boolean;
  createdAt: string;
}

export interface StockLineCommand {
  productId: number;
  quantity: number;
  unitCost?: number;
}

export interface StockLineDto {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitSalePrice: number;
  discount: number;
  vatRate: number;
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
}

export interface StockMovement {
  id: number;
  type: string;
  status: string;
  warehouseId: number;
  destWarehouseId: number | null;
  reference: string;
  notes: string;
  lines: StockLineDto[];
  totalValue: number;
  createdAt: string;
  confirmedAt: string | null;
}

export interface StockMovementFilters {
  page?: number;
  size?: number;
  type?: string;
  warehouseId?: number | null;
}

export interface ReceiveStockRequest {
  warehouseId: number;
  reference: string;
  notes: string;
  lines: StockLineCommand[];
}

export interface IssueStockRequest {
  warehouseId: number;
  reference: string;
  notes: string;
  lines: StockLineCommand[];
}

export interface AdjustStockRequest {
  warehouseId: number;
  reference: string;
  notes: string;
  lines: StockLineCommand[];
}

export interface TransferStockRequest {
  sourceWarehouseId: number;
  destWarehouseId: number;
  reference: string;
  notes: string;
  lines: StockLineCommand[];
}

export interface Reservation {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  reference: string;
  status: string;
  createdAt: string;
}

export interface ReserveStockRequest {
  productId: number;
  warehouseId: number;
  quantity: number;
  reference: string;
}

export type ProductPage = PageResponse<Product>;
export type CustomerPage = PageResponse<Customer>;
export type StockCurrentPage = PageResponse<StockCurrent>;
export type StockMovementPage = PageResponse<StockMovement>;