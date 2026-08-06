export interface MovementLine {
  id?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitCost?: number;
  lineTotal?: number;
  lotId?: number;
}

export type MovementType = 'RECEIVE' | 'ISSUE' | 'ADJUST' | 'TRANSFER';

export interface StockMovement {
  id: number;
  /** Backend `MovementType`: IN · OUT · TRANSFER · ADJUSTMENT. */
  type: string;
  status: string;
  warehouseId: number;
  destWarehouseId?: number;
  reference: string;
  notes: string;
  lines: MovementLine[];
  totalValue: number;
  operationDate?: string;
  createdAt: string;
  confirmedAt: string;
}

/** Common head shared by every movement command. */
interface MovementCommandBase {
  reference?: string;
  notes?: string;
  /** Backdating a movement is legitimate; it drives the accounting period. */
  operationDate?: string;
}

/**
 * A reception declares three quantities per line. The sound `quantity` lands
 * in the purchase warehouse, `damagedQuantity` in the damaged one as a
 * *separate* movement, and `missingQuantity` nowhere at all.
 */
export interface ReceiveLine {
  productId: number;
  quantity: number;
  unitCost: number;
  damagedQuantity?: number;
  missingQuantity?: number;
  batchNumber?: string;
  expirationDate?: string;
}

export interface ReceiveRequest extends MovementCommandBase {
  warehouseId: number;
  partnerId?: number;
  lines: ReceiveLine[];
}

export interface IssueLine {
  productId: number;
  quantity: number;
  unitCost?: number;
}

export interface IssueRequest extends MovementCommandBase {
  warehouseId: number;
  partnerId?: number;
  lines: IssueLine[];
}

/**
 * An adjustment states the counted quantity, not a delta — hence
 * `newQuantity`. Sending `quantity` here is rejected by the backend.
 */
export interface AdjustLine {
  productId: number;
  newQuantity: number;
  unitCost?: number;
}

export interface AdjustRequest extends MovementCommandBase {
  warehouseId: number;
  partnerId?: number;
  /** Required by the backend for adjustments (the inventory sheet reference). */
  reference: string;
  lines: AdjustLine[];
}

export interface TransferRequest extends MovementCommandBase {
  sourceWarehouseId: number;
  destWarehouseId: number;
  lines: IssueLine[];
}

export interface CurrentStock {
  productId: number;
  warehouseId: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  avgCost: number;
  unitPurchasePrice?: number;
  unitSalePrice?: number;
  stockValue?: number;
  saleValue?: number;
  potentialMargin?: number;
  lastUpdated: string;
}

export interface StockLot {
  id: number;
  batchNumber: string;
  productId: number;
  warehouseId: number;
  quantity: number;
  availableQuantity: number;
  unitCost: number;
  expirationDate?: string;
  expired: boolean;
  createdAt: string;
}

export interface ValuationLine {
  productId: number;
  productName: string;
  quantity: number;
  unitPurchasePrice: number;
  stockValue: number;
  unitSalePrice: number;
  saleValue: number;
  potentialMargin: number;
}

export interface StockValuation {
  asOfDate: string;
  totalStockValue: number;
  totalSaleValue: number;
  totalPotentialMargin: number;
  lines: ValuationLine[];
}

export interface StockReservation {
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
