export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  type: string;             // e.g. STOCKABLE, SERVICE
  categoryId: number;
  /** Nullable — the backend has been observed returning null here. Always
   * read through formatMoney()/formatNumber(), never .toFixed() directly. */
  unitPurchasePrice: number | null;
  unitSalePrice: number | null;
  marginPercent: number | null;
  unit: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  type: string;
  unit: string;
  unitPurchasePrice: number;
  description?: string;
  categoryId: number;
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  categoryId: number;
  unitPurchasePrice: number;
  unit: string;
  marginPercent?: number;
  unitSalePrice?: number;
}

export interface ProductStockInfo {
  productId: number;
  warehouseId: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  avgCost: number;
  totalValue: number;
  lastUpdated: string;
}
