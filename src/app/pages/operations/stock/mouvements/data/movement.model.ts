export interface MovementLine {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitCost?: number;
}

export type MovementType = 'RECEIVE' | 'ISSUE' | 'ADJUST' | 'TRANSFER';

export interface StockMovement {
  id: number;
  type: string;
  status: string;
  warehouseId: number;
  destWarehouseId?: number;
  reference: string;
  notes: string;
  lines: MovementLine[];
  totalValue: number;
  createdAt: string;
  confirmedAt: string;
}

export interface ReceiveIssueAdjustRequest {
  lines: MovementLine[];
  warehouseId: number;
  reference?: string;
  notes?: string;
}

export interface TransferRequest {
  sourceWarehouseId: number;
  destWarehouseId: number;
  lines: MovementLine[];
  reference?: string;
  notes?: string;
}

export interface CurrentStock {
  productId: number;
  warehouseId: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  avgCost: number;
  totalValue: number;
  lastUpdated: string;
}
