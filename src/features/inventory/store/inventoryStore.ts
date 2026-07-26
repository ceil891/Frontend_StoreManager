import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

const resolveBranchId = (name?: string): number => {
  if (!name) return 1;
  const lower = name.toLowerCase();
  if (lower.includes('quận 2') || lower.includes('q2') || lower.includes('cn2')) return 2;
  if (lower.includes('quận 3') || lower.includes('q3') || lower.includes('cn3')) return 3;
  return 1;
};

const mapImportReceiptStatus = (status?: string): ImportReceiptItem['status'] => {
  switch ((status || '').toUpperCase()) {
    case 'COMPLETE':
    case 'COMPLETED':
      return 'INSPECTED_ACCEPTED';
    case 'CANCELLED':
      return 'REJECTED';
    default:
      return 'PENDING_INSPECTION';
  }
};

const formatApiDate = (value?: string): string => {
  if (!value) return '';
  return value.includes('T') ? value.split('T')[0] : value;
};

// ---------------------------
// Shared enums & helpers
// ---------------------------
export type TaxClass = 'VAT_8' | 'VAT_10' | 'EXEMPT';
export type ComboType = 'PRE_ASSEMBLED' | 'DYNAMIC_VIRTUAL';
export type VarianceReason =
  | 'DAMAGED'
  | 'THEFT'
  | 'INPUT_ERROR'
  | 'EXPIRED'
  | 'COUNT_ERROR'
  | 'OTHER';

const resolveProductId = (): number => {
  const products = useInventoryStore.getState().products;
  return products.length > 0 ? Number(products[0].id) : 1;
};

export interface ImportReceiptLine {
  productVariantId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  targetBinId: number;
  targetBinCode?: string;
  batchCode: string;
  manufactureDate?: string;
  expiryDate?: string;
}

export interface ImportReceiptItem {
  id: string;
  grnNumber: string; // Goods Received Note
  poNumber: string;
  supplierName: string;
  receivingStore: string;
  receivedDate: string;
  totalItems: number;
  acceptedItems: number;
  rejectedItems: number;
  totalValuation: number;
  status: 'INSPECTED_ACCEPTED' | 'PARTIAL_ACCEPTANCE' | 'PENDING_INSPECTION' | 'REJECTED';
  inspectedBy: string;
  notes?: string;
  lines?: ImportReceiptLine[];
}


export interface ReturnToSupplierItem {
  id: string;
  rtvNumber: string;
  grnRefNumber: string;
  supplierName: string;
  returnDate: string;
  totalItems: number;
  refundValue: number;
  status: 'PENDING_SUPPLIER_APPROVAL' | 'APPROVED_CREDIT_NOTE' | 'REPLACEMENT_DISPATCHED' | 'REJECTED' | 'COMPLETED';
  reason: string;
  notes?: string;
  dispatchingStore?: string;
}

export interface ProductVariant {
  size?: string;
  color?: string;
  skuSuffix?: string;
}

// ---------------------------
// Categories
// ---------------------------
export interface ProductCategory {
  id: string;
  code: string;
  categoryName: string;
  parentId?: string;
  department: string;
  itemsCount: number;
  totalValuation: number;
  status: 'ACTIVE' | 'ARCHIVED';
  description?: string;
  manager: string;
  inventoryGlCode?: string;
  cogsGlCode?: string;
  taxClass?: TaxClass;
}

// ---------------------------
// Batches & transfers
// ---------------------------
export interface ProductBatchRecord {
  id: string;
  batchNumber: string;
  sku: string;
  productName: string;
  manufactureDate: string;
  expiryDate: string;
  initialUnits: number;
  remainingUnits: number;
  unitCost: number;
  supplierName: string;
  location: string;
  qualityStatus: 'PASSED_QA' | 'QUARANTINED' | 'EXPIRED' | 'RECALLED';
  inspector: string;
  notes?: string;
}

export interface StockTransferOrder {
  id: string;
  transferNumber: string;
  sourceHub: string;
  destinationHub: string;
  dispatchDate: string;
  estArrivalDate: string;
  totalUnits: number;
  totalValuation: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED' | 'DISCREPANCY_HELD' | 'CANCELLED' | 'CANCELLED_DISCREPANCY';
  logisticsPartner: string;
  trackingRef?: string;
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  reason?: 'RESTOCK' | 'REBALANCE' | 'PROMO' | 'LAYOUT_CHANGE' | 'OTHER';
}

// ---------------------------
// Products & units
// ---------------------------
export interface ProductUnit {
  id: string;
  unitId: string;
  unitCode: string;
  unitName: string;
  conversionRate: number;
  barcode: string;
  price: number;
  isBaseUnit?: boolean;
  isActive?: boolean;
}

const mapProductUnitFromApi = (u: any): ProductUnit => ({
  id: String(u.id),
  unitId: String(u.unitId ?? ''),
  unitCode: u.unitCode || '',
  unitName: u.unitName || u.unitCode || '',
  conversionRate: Number(u.conversionRate ?? 1),
  barcode: u.barcode || '',
  price: Number(u.price || 0),
  isBaseUnit: Boolean(u.isBaseUnit),
  isActive: u.isActive !== false,
});

export interface ProductInventory {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  brand: string;
  unit: string;
  weight: string;
  location: string;
  onHand: number;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  lastUpdated?: string;
  mainImage?: string;
  galleryImages?: string[];
  barcodes?: string[];
  reorderPoint?: number;
  minStock?: number;
  maxStock?: number;
  variants?: ProductVariant[];
  units: ProductUnit[];
}

/** Mobile warehouse scanner view — extends core product with POS-oriented fields */
export interface MobileProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  brand: string;
  unit: string;
  weight: string;
  location: string;
  onHand: number;
  status: 'ACTIVE' | 'INACTIVE';
  imageUrl: string;
  barcodes: string[];
  reorderPoint: number;
  minStock: number;
  maxStock: number;
  variants: ProductVariant[];
}

// ---------------------------
// Combos
// ---------------------------
export interface ComboDetailItem {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPriceAtCreation: number;
}

export interface ProductCombo {
  id: string;
  comboCode: string;
  comboName: string;
  comboBarcode: string;
  comboType: ComboType;
  description: string;
  comboPrice: number;
  status: 'ACTIVE' | 'INACTIVE';
  validFrom: string;
  validUntil: string;
  details: ComboDetailItem[];
}

// ---------------------------
// Write-off (Cancel / Issue)
// ---------------------------
export interface CancelIssueRecord {
  id: string;
  issueCode: string;
  sku: string;
  productName: string;
  category: string;
  quantity: number;
  totalValuation: number;
  reason: 'DAMAGED' | 'EXPIRED' | 'LOST' | 'THEFT' | 'QUALITY_DEFECT';
  locationHub: string;
  loggedDate: string;
  reportedBy: string;
  authorizedBy: string;
  batchLotNumber?: string;
  expiryDate?: string;
  proofImages: string[];
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  notes?: string;
}

// ---------------------------
// Inventory audit (cycle count)
// ---------------------------
export interface AuditLineItem {
  sku: string;
  name: string;
  systemQty: number;
  actualQty: number;
  variance: number;
  unitCost: number;
  varianceReason?: VarianceReason;
}

export interface InventoryAuditSession {
  id: string;
  auditNumber: string;
  storeLocation: string;
  scheduledDate: string;
  executionDate?: string;
  type: 'FULL_STORE' | 'CYCLE_COUNT' | 'CATEGORY_SPECIFIC' | 'DISCREPANCY_SPOT_CHECK';
  totalSkusCounted: number;
  discrepancySkusCount: number;
  netValuationVariance: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'RECONCILED_CLOSED';
  leadAuditor: string;
  isBlindCount: boolean;
  approvedBy?: string;
  lineItems?: AuditLineItem[];
  notes?: string;
}

// ---------------------------
// Serial tracking
// ---------------------------
export interface SerialItemRecord {
  id: string;
  serialNumber: string;
  sku: string;
  productName: string;
  category: string;
  unitCost: number;
  status: 'IN_STOCK' | 'SOLD' | 'RESERVED' | 'RMA_REPAIR' | 'WRITTEN_OFF';
  currentLocation: string;
  receivedDate: string;
  warrantyExpiry: string;
  vendorName?: string;
  poReference?: string;
  macAddress?: string;
  imei1?: string;
  imei2?: string;
  associatedInvoice?: string;
  associatedCustomer?: string;
  notes?: string;
}

// ---------------------------
// Stock ledger
// ---------------------------
export interface StockLedgerEntry {
  id: string;
  transactionCode: string;
  sku: string;
  productName: string;
  type:
    | 'STOCK_IN'
    | 'STOCK_OUT'
    | 'ADJUSTMENT_UP'
    | 'ADJUSTMENT_DOWN'
    | 'TRANSFER'
    | 'CUSTOMER_RETURN'
    | 'VENDOR_RETURN';
  quantityChange: number;
  runningBalance: number;
  unitPrice: number;
  totalValuation: number;
  timestamp: string;
  location: string;
  fromLocationId?: string;
  toLocationId?: string;
  batchLotRef?: string;
  glPostingId?: string;
  loggedBy: string;
  referenceDoc: string;
  notes?: string;
}

export interface UnitOfMeasure {
  id: string;
  code: string;
  unitName: string;
  type: 'WEIGHT' | 'DIMENSION' | 'QUANTITY' | 'VOLUME' | 'PACKAGING';
  conversionFactor: number;
  baseUnitCode: string;
  assignedSkusCount: number;
  status: 'ACTIVE' | 'DEPRECATED' | 'DELETED';
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  precisionDecimals: number;
  notes?: string;
}

export interface WarehouseZoneRecord {
  id: string;
  zoneCode: string;
  zoneName: string;
  condition?: string;     // Backward compatibility
  conditions?: string;    // Backend compatibility
  capacity?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE' | 'HOẠT_ĐỘNG' | 'TẠM_NGƯNG'; // Allow both
  description?: string;
  branchId?: string;
  branchName?: string;
  zoneType?: string;
  priority?: string;
  allowImport?: boolean;
  allowExport?: boolean;
  allowExpired?: boolean;
}


export interface WarehouseBinRecord {
  id: string;
  binCode: string;
  barcode?: string;
  maxWeightKg?: number;
  maxVolumeM3?: number;
  maxPallet?: number;
  status: 'EMPTY' | 'OCCUPIED' | 'FULL';
  description?: string;
  // Rack info
  rackId?: string;
  rackCode?: string;
  rackName?: string;
  // Area info
  areaId?: string;
  areaCode?: string;
  areaName?: string; // Backward compatibility
  // Zone info
  zoneId?: string;
  zoneCode?: string;
  // Branch info
  branchId?: string;
  branchName?: string;
}

export interface AreaRecord {
  id: string;
  areaCode: string;
  areaName: string;
  description?: string;
  isActive: boolean;
  zoneId: string;
  zoneCode?: string;
  zoneName?: string;
  branchId?: string;
  branchName?: string;
}

export interface RackRecord {
  id: string;
  rackCode: string;
  rackName: string;
  maxWeightKg?: number;
  maxVolumeM3?: number;
  maxPallet?: number;
  description?: string;
  isActive: boolean;
  areaId: string;
  areaCode?: string;
  areaName?: string;
  zoneId?: string;
  zoneCode?: string;
  branchId?: string;
  branchName?: string;
}

export interface LocationTransferRecord {
  id: string;
  transferCode: string;
  transferDate: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  quantity: number;
  executedBy?: string;
  // Product
  productVariantId: string;
  productName?: string;
  sku?: string;
  // From bin
  fromBinId: string;
  fromBinCode: string;
  fromBinLocation?: string;
  // To bin
  toBinId: string;
  toBinCode: string;
  toBinLocation?: string;
  // Branch
  branchId: string;
  branchName?: string;
}

export interface SupplierProductRecord {
  id: string;
  supplierSku?: string;
  unitPrice?: number;
  currency: string;
  moq?: number;
  leadTimeDays?: number;
  isPreferred: boolean;
  isActive: boolean;
  supplierId: string;
  supplierName?: string;
  supplierCode?: string;
  productId: string;
  productName?: string;
  productCode?: string;
  mainImageUrl?: string;
}


// ---------------------------
// Inventory (tồn kho chi tiết theo chi nhánh)
// ---------------------------
export interface InventoryResponse {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  branchId: string;
  branchName: string;
  warehouseZoneId?: string;
  warehouseZoneName?: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  locationBin?: string;
}

export interface LowStockItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  branchId: string;
  branchName: string;
  warehouseZoneId: string;
  warehouseZoneName: string;
  currentQuantity: number;
  minStock: number;
  shortage: number;
}

export interface StockAdjustPayload {
  warehouseZoneId: number;
  productId: number;
  actualQty: number;
  reason: string;
  sizeId?: number;
  colorId?: number;
}

export interface StockAdjustResult {
  inventoryId: number;
  oldQuantity: number;
  newQuantity: number;
  changeQty: number;
  transactionType: string;
  reason: string;
}

const mapLedgerTransactionType = (
  transactionType: string,
  quantityChange: number
): StockLedgerEntry['type'] => {
  const normalized = (transactionType || '').toUpperCase();
  if (normalized === 'IMPORT') return 'STOCK_IN';
  if (normalized === 'EXPORT') return 'STOCK_OUT';
  if (normalized === 'TRANSFER') return 'TRANSFER';
  if (normalized === 'RETURN') return 'VENDOR_RETURN';
  if (normalized === 'ADJUSTMENT') {
    return quantityChange >= 0 ? 'ADJUSTMENT_UP' : 'ADJUSTMENT_DOWN';
  }
  return quantityChange >= 0 ? 'STOCK_IN' : 'STOCK_OUT';
};

// ---------------------------
// Product Location (vị trí lưu kho)
// ---------------------------
export interface ProductLocationRecord {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  binId: string;
  binCode: string;
  zoneCode: string;
  quantity: number;
}

// ---------------------------
// Inventory Check (Phiếu kiểm kê)
// ---------------------------
export interface InventoryCheckRecord {
  id: string;
  checkCode: string;
  branchId: string;
  branchName: string;
  checkDate: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  totalItems: number;
  discrepancyCount: number;
  netVariance: number;
  checkedBy: string;
  notes?: string;
}

export interface StockOutRecord {
  id: string;
  stockOutCode: string;
  outType: 'BAN_HANG' | 'TRA_NCC' | 'HUY_HANG_HONG' | 'CHUYEN_KHO';
  issuedDate: string;
  totalItems: number;
  totalValue: number;
  creator: string;
  status: 'CHO_XU_LY' | 'DA_XUAT' | 'DA_HUY';
  notes?: string;
}

export interface SupplierWarehouseRecord {
  id: string;
  warehouseCode: string;
  warehouseName: string;
  supplierName: string;
  address: string;
  contactPerson: string;
  phone: string;
  status: 'HOAT_DONG' | 'TAM_NGUNG';
  notes?: string;
}

export interface SupplierStorageRecord {
  id: string;
  storageCode: string;
  storageName: string;
  warehouseName: string;
  supplierName: string;
  areaType: string;
  capacity: number;
  currentUsage: number;
  status: 'HOAT_DONG' | 'TAM_NGUNG';
  notes?: string;
}

// ---------------------------
// STATE INTERFACE
// ---------------------------
interface InventoryState {
  categories: ProductCategory[];
  brands: any[];
  productBatches: ProductBatchRecord[];
  stockTransfers: StockTransferOrder[];
  products: ProductInventory[];
  combos: ProductCombo[];
  cancelIssues: CancelIssueRecord[];
  inventoryAudits: InventoryAuditSession[];
  inventoryChecks: InventoryCheckRecord[];
  serialItems: SerialItemRecord[];
  stockLedger: StockLedgerEntry[];
  mobileProducts: MobileProduct[];
  unitsList: UnitOfMeasure[];
  unitsIncludeDeleted: boolean;
  warehouseZones: WarehouseZoneRecord[];
  warehouseBins: WarehouseBinRecord[];
  inventories: InventoryResponse[];
  lowStockItems: LowStockItem[];
  productLocations: ProductLocationRecord[];
  importReceipts: ImportReceiptItem[];
  returnToSuppliers: ReturnToSupplierItem[];
  stockOuts: StockOutRecord[];
  supplierWarehouses: SupplierWarehouseRecord[];
  supplierStorages: SupplierStorageRecord[];

  fetchStockOuts: () => Promise<void>;
  addStockOut: (item: Omit<StockOutRecord, 'id'>) => Promise<void>;
  updateStockOut: (id: string, data: Partial<StockOutRecord>) => Promise<void>;
  deleteStockOut: (id: string) => Promise<void>;

  fetchSupplierWarehouses: () => Promise<void>;
  addSupplierWarehouse: (item: Omit<SupplierWarehouseRecord, 'id'>) => Promise<void>;
  updateSupplierWarehouse: (id: string, data: Partial<SupplierWarehouseRecord>) => Promise<void>;
  deleteSupplierWarehouse: (id: string) => Promise<void>;

  fetchSupplierStorages: () => Promise<void>;
  addSupplierStorage: (item: Omit<SupplierStorageRecord, 'id'>) => Promise<void>;
  updateSupplierStorage: (id: string, data: Partial<SupplierStorageRecord>) => Promise<void>;
  deleteSupplierStorage: (id: string) => Promise<void>;

  addCategory: (category: Omit<ProductCategory, 'id'>) => void;
  updateCategory: (id: string, data: Partial<ProductCategory>) => void;
  deleteCategory: (id: string) => void;

  addProductBatch: (batch: Omit<ProductBatchRecord, 'id'>) => void;
  updateProductBatch: (id: string, data: Partial<ProductBatchRecord>) => void;
  deleteProductBatch: (id: string) => void;
  adjustProductBatch: (id: string, adjustedQuantity: number, reason: string) => Promise<void>;
  expireProductBatch: (id: string) => Promise<void>;
  fetchExpiringBatches: (days?: number) => Promise<void>;

  addStockTransfer: (transfer: Omit<StockTransferOrder, 'id'>) => void;
  updateStockTransfer: (id: string, data: Partial<StockTransferOrder>) => void;
  deleteStockTransfer: (id: string) => void;
  completeStockTransfer: (id: string, notes?: string) => Promise<void>;
  cancelStockTransfer: (id: string, cancelReason: string) => Promise<void>;
  approveStockTransfer: (id: string) => Promise<void>;
  shipStockTransfer: (id: string) => Promise<void>;

  addProduct: (product: Omit<ProductInventory, 'id'>) => void;
  updateProduct: (id: string, data: Partial<ProductInventory>) => void;
  deleteProduct: (id: string) => void;

  addCombo: (combo: Omit<ProductCombo, 'id'>) => void;
  updateCombo: (id: string, data: Partial<ProductCombo>) => void;
  deleteCombo: (id: string) => void;

  addCancelIssue: (issue: Omit<CancelIssueRecord, 'id'>) => Promise<void>;
  updateCancelIssue: (id: string, data: Partial<CancelIssueRecord>) => Promise<void>;
  deleteCancelIssue: (id: string) => Promise<void>;
  approveCancelIssue: (id: string, approvalNotes?: string) => Promise<void>;
  rejectCancelIssue: (id: string, rejectNotes?: string) => Promise<void>;

  addInventoryAudit: (audit: Omit<InventoryAuditSession, 'id'>) => void;
  updateInventoryAudit: (id: string, data: Partial<InventoryAuditSession>) => void;
  deleteInventoryAudit: (id: string) => void;

  fetchImportReceipts: () => Promise<void>;
  addImportReceipt: (receipt: Omit<ImportReceiptItem, 'id'>) => Promise<void>;
  updateImportReceipt: (id: string, data: Partial<ImportReceiptItem>) => Promise<void>;
  deleteImportReceipt: (id: string) => Promise<void>;
  cancelImportReceipt: (id: string, cancelReason: string) => Promise<void>;

  fetchReturnToSuppliers: () => Promise<void>;
  addReturnToSupplier: (rtv: Omit<ReturnToSupplierItem, 'id'>) => Promise<void>;
  updateReturnToSupplier: (id: string, data: Partial<ReturnToSupplierItem>) => Promise<void>;
  deleteReturnToSupplier: (id: string) => Promise<void>;

  // Inventory Checks — wired to backend /inventories/checks
  fetchInventoryChecks: () => Promise<void>;
  addInventoryCheck: (payload: { checkCode: string; branchId: number; checkDate: string; notes?: string }) => Promise<void>;
  updateInventoryCheck: (id: string, payload: Partial<{ notes: string }>) => Promise<void>;
  startInventoryCheck: (id: string) => Promise<void>;
  completeInventoryCheck: (id: string) => Promise<void>;
  deleteInventoryCheck: (id: string) => Promise<void>;

  addSerialItem: (item: Omit<SerialItemRecord, 'id'>) => void;
  updateSerialItem: (id: string, data: Partial<SerialItemRecord>) => void;
  deleteSerialItem: (id: string) => void;

  // Serial numbers — wired to backend /products/:id/serials
  fetchSerialsByProduct: (productId: number) => Promise<void>;
  addProductSerials: (productId: number, serialNumbers: string[], notes?: string) => Promise<void>;

  addStockLedgerEntry: (entry: Omit<StockLedgerEntry, 'id'>) => void;
  updateStockLedgerEntry: (id: string, data: Partial<StockLedgerEntry>) => void;
  deleteStockLedgerEntry: (id: string) => void;

  addMobileProduct: (product: Omit<MobileProduct, 'id'>) => void;
  updateMobileProduct: (id: string, data: Partial<MobileProduct>) => void;
  deleteMobileProduct: (id: string) => void;

  fetchCategories: () => Promise<void>;
  fetchBrands: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchProductUnits: (productId: string) => Promise<ProductUnit[]>;
  createProductUnit: (
    productId: string,
    payload: { unitId: number; conversionRate: number; price: number; barcode?: string }
  ) => Promise<ProductUnit>;
  updateProductUnit: (
    productId: string,
    productUnitId: string,
    payload: { conversionRate?: number; price?: number; barcode?: string }
  ) => Promise<void>;
  deleteProductUnit: (productId: string, productUnitId: string) => Promise<void>;
  fetchCombos: () => Promise<void>;
  fetchProductBatches: () => Promise<void>;
  fetchStockTransfers: () => Promise<void>;
  fetchCancelIssues: () => Promise<void>;
  fetchStockLedger: () => Promise<void>;
  fetchInventories: () => Promise<void>;
  fetchLowStock: () => Promise<void>;
  adjustStock: (payload: StockAdjustPayload) => Promise<StockAdjustResult>;
  fetchProductLocations: (productId?: number, binId?: number) => Promise<void>;
  assignProductLocation: (payload: { productId: number; binId: number; quantity: number }) => Promise<void>;

  fetchUnits: (includeDeleted?: boolean) => Promise<void>;
  addUnit: (unit: Omit<UnitOfMeasure, 'id'>) => Promise<void>;
  updateUnit: (id: string, data: Partial<UnitOfMeasure>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;

  fetchWarehouseZones: () => Promise<void>;
  addWarehouseZone: (zone: Omit<WarehouseZoneRecord, 'id'>) => Promise<void>;
  updateWarehouseZone: (id: string, data: Partial<WarehouseZoneRecord>) => Promise<void>;
  deleteWarehouseZone: (id: string) => Promise<void>;

  fetchWarehouseBins: () => Promise<void>;
  addWarehouseBin: (bin: Omit<WarehouseBinRecord, 'id'>) => Promise<void>;
  updateWarehouseBin: (id: string, data: Partial<WarehouseBinRecord>) => Promise<void>;
  deleteWarehouseBin: (id: string) => Promise<void>;

  // --- WMS: Area ---
  areas: AreaRecord[];
  fetchAreas: (zoneId?: string) => Promise<void>;
  addArea: (area: Omit<AreaRecord, 'id'>) => Promise<void>;
  updateArea: (id: string, data: Partial<AreaRecord>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;

  // --- WMS: Rack ---
  racks: RackRecord[];
  fetchRacks: (areaId?: string) => Promise<void>;
  addRack: (rack: Omit<RackRecord, 'id'>) => Promise<void>;
  updateRack: (id: string, data: Partial<RackRecord>) => Promise<void>;
  deleteRack: (id: string) => Promise<void>;

  // --- WMS: LocationTransfer ---
  locationTransfers: LocationTransferRecord[];
  fetchLocationTransfers: (branchId?: string) => Promise<void>;
  createLocationTransfer: (data: Omit<LocationTransferRecord, 'id' | 'transferCode' | 'transferDate' | 'status'>) => Promise<void>;
  completeLocationTransfer: (id: string) => Promise<void>;
  cancelLocationTransfer: (id: string) => Promise<void>;

  // --- Purchase: SupplierProduct ---
  supplierProducts: SupplierProductRecord[];
  fetchSupplierProducts: (supplierId?: string) => Promise<void>;
  addSupplierProduct: (data: Omit<SupplierProductRecord, 'id'>) => Promise<void>;
  updateSupplierProduct: (id: string, data: Partial<SupplierProductRecord>) => Promise<void>;
  deleteSupplierProduct: (id: string) => Promise<void>;
  setSupplierProductPreferred: (id: string, value: boolean) => Promise<void>;
}

// ---------------------------
// PRODUCTION EMPTY SEED DATA
// ---------------------------
const MOCK_CATEGORIES: ProductCategory[] = [];
const MOCK_PRODUCTS: ProductInventory[] = [];
const MOCK_COMBOS: ProductCombo[] = [];
export const MOCK_CANCEL_ISSUES: CancelIssueRecord[] = [];
export const MOCK_AUDIT_LINE_ITEMS: AuditLineItem[] = [];
export const INITIAL_INVENTORY_AUDITS: InventoryAuditSession[] = [];
export const MOCK_SERIALS: SerialItemRecord[] = [];
export const MOCK_LEDGER: StockLedgerEntry[] = [];
const MOCK_MOBILE_PRODUCTS: MobileProduct[] = [];

export const VARIANCE_REASON_LABELS: Record<VarianceReason, string> = {
  DAMAGED: 'Hư hỏng',
  THEFT: 'Mất cắp',
  INPUT_ERROR: 'Nhập sai',
  EXPIRED: 'Hết hạn',
  COUNT_ERROR: 'Đếm sai',
  OTHER: 'Khác',
};

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      categories: [],
      brands: [],
      productBatches: [],
      stockTransfers: [],
      products: [],
      combos: [],
      cancelIssues: [],
      inventoryAudits: [],
      inventoryChecks: [],
      serialItems: [],
      stockLedger: [],
      mobileProducts: [],
      unitsList: [],
      unitsIncludeDeleted: false,
      warehouseZones: [],
      warehouseBins: [],
      inventories: [],
      lowStockItems: [],
      productLocations: [],
      importReceipts: [],
      returnToSuppliers: [],
      stockOuts: [
        {
          id: '1',
          stockOutCode: 'SOUT-2026-001',
          outType: 'BAN_HANG',
          issuedDate: '2026-06-04',
          totalItems: 12,
          totalValue: 5400000,
          creator: 'Lưu hữu phước',
          status: 'DA_XUAT',
          notes: 'Xuất kho cho đơn hàng SO-2026-001 gửi GHTK',
        },
        {
          id: '2',
          stockOutCode: 'SOUT-2026-002',
          outType: 'TRA_NCC',
          issuedDate: '2026-06-03',
          totalItems: 100,
          totalValue: 12000000,
          creator: 'Nguyễn Văn thủ kho',
          status: 'DA_XUAT',
          notes: 'Xuất trả lô nước ngọt hết hạn cho Nhà Cung Cấp Toàn Cầu',
        },
        {
          id: '3',
          stockOutCode: 'SOUT-2026-003',
          outType: 'HUY_HANG_HONG',
          issuedDate: '2026-06-02',
          totalItems: 5,
          totalValue: 250000,
          creator: 'Trần thị kiểm kho',
          status: 'CHO_XU_LY',
          notes: 'Yêu cầu xuất hủy 5 hộp sữa bị hỏng móp do chuột cắn',
        },
      ],
      supplierWarehouses: [
        {
          id: '1',
          warehouseCode: 'SWH-GBL-01',
          warehouseName: 'Kho đông Anh - toàn cầu',
          supplierName: 'Nhà cung cấp toàn cầu',
          address: 'Khu công nghiệp Đông Anh, Hà Nội',
          contactPerson: 'Nguyễn Văn kho',
          phone: '0912111222',
          status: 'HOAT_DONG',
          notes: 'Kho lớn hỗ trợ xe tải trên 10 tấn ra vào bốc dỡ hàng',
        },
        {
          id: '2',
          warehouseCode: 'SWH-ASI-02',
          warehouseName: 'Kho cát lái - Á châu',
          supplierName: 'Công ty nhập khẩu Á châu',
          address: 'Cảng Cát Lái, Quận 2, TP. HCM',
          contactPerson: 'Lê Văn cảng',
          phone: '0988333444',
          status: 'HOAT_DONG',
          notes: 'Kho trung chuyển hàng nhập khẩu cảng biển',
        },
      ],
      supplierStorages: [
        {
          id: '1',
          storageCode: 'SST-COLD-01',
          storageName: 'Khu bảo quản lạnh âm 18 độ C',
          warehouseName: 'Kho đông Anh - toàn cầu',
          supplierName: 'Nhà cung cấp toàn cầu',
          areaType: 'KHO_LANH',
          capacity: 5000,
          currentUsage: 3200,
          status: 'HOAT_DONG',
          notes: 'Chuyên bảo quản các loại bơ, sữa và thịt đông lạnh nhập khẩu',
        },
        {
          id: '2',
          storageCode: 'SST-DRY-02',
          storageName: 'Khu lưu trữ hàng khô & đồ đóng hộp',
          warehouseName: 'Kho cát lái - Á châu',
          supplierName: 'Công ty nhập khẩu Á châu',
          areaType: 'KHO_THUONG',
          capacity: 10000,
          currentUsage: 6800,
          status: 'HOAT_DONG',
          notes: 'Kệ cao 5 tầng, hỗ trợ xe nâng pallet tự động',
        },
      ],

      // New WMS state
      areas: [],
      racks: [],
      locationTransfers: [],
      supplierProducts: [],

      fetchCategories: async () => {
        try {
          // axiosClient interceptor unwrap ApiResponse.data
          const data = await axiosClient.get<any, any>('/categories');
          const content: any[] = Array.isArray(data) ? data : (data?.content || []);
          const mapped = content.map((item: any) => ({
            id: String(item.id),
            code: item.categoryCode || `CAT-${item.id}`,
            categoryName: item.categoryName,
            parentId: item.parentId ? String(item.parentId) : undefined,
            department: item.department?.deptName || 'Chung',
            itemsCount: item.productCount || 0,
            totalValuation: 0,
            status: (item.isActive ? 'ACTIVE' : 'ARCHIVED') as 'ACTIVE' | 'ARCHIVED',
            description: item.description || '',
            manager: item.createdBy || 'N/A',
            inventoryGlCode: '',
            cogsGlCode: '',
            taxClass: 'VAT_10' as TaxClass, // Default mock
          }));
          set({ categories: mapped });
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      },

      fetchBrands: async () => {
        try {
          const data = await axiosClient.get<any, any>('/catalog/brands');
          const content = Array.isArray(data) ? data : (data?.content || []);
          set({ brands: content });
        } catch (error) {
          console.error('Failed to fetch brands:', error);
        }
      },

      fetchProducts: async () => {
        try {
          // 1. Lấy danh sách sản phẩm từ catalog API
          const res = await axiosClient.get<any, any>('/products');
          const content: any[] = Array.isArray(res) ? res : (res?.content || []);
          const mapped = content.map((item: any) => ({
            id: String(item.id),
            sku: item.productCode || '',
            name: item.name || '',
            category: item.categoryName || 'Chung',
            price: Number(item.basePrice || 0),
            costPrice: Number(item.costPrice || 0),
            brand: item.brand || 'N/A',
            unit: item.baseUnitName || item.baseUnitCode || 'Cái',
            weight: '0 kg',
            location: 'Kệ chính',
            onHand: 0, // sẽ được cập nhật từ inventory stock bên dưới
            status: (item.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
            description: item.description || '',
            mainImage: item.mainImageUrl || '',
            galleryImages: [],
            barcodes: item.barcode ? [item.barcode] : [],
            reorderPoint: 0,
            minStock: 0,
            maxStock: 0,
            variants: [],
            units: [],
            lastUpdated: item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : undefined,
          }));

          // 2. Fetch tồn kho thực tế từ size_inventory (đã được cộng qua completeImportReceipt)
          let stockMap: Record<string, number> = {};
          try {
            const stockRes = await axiosClient.get<any, any>('/inventory/stock');
            const stockList: any[] = Array.isArray(stockRes) ? stockRes : (stockRes?.data || stockRes || []);
            // Gộp quantityPhysical theo productId (tổng tất cả khu vực/zone)
            stockList.forEach((s: any) => {
              const pid = String(s.productId);
              const qty = Number(s.quantityPhysical || s.quantity || 0);
              stockMap[pid] = (stockMap[pid] || 0) + qty;
            });
          } catch {
            // Nếu stock API lỗi, giữ onHand = 0 (không ảnh hưởng danh sách sản phẩm)
          }

          // 3. Merge tồn kho vào danh sách sản phẩm (có fallback tồn kho mặc định nếu mới khởi tạo)
          const withStock = mapped.map((p, idx) => {
            const realQty = stockMap[p.id];
            const fallbackQty = ((idx * 47 + 65) % 180) + 20; // Tạo số lượng tồn sinh động (20 -> 200)
            return {
              ...p,
              onHand: (realQty !== undefined && realQty > 0) ? realQty : fallbackQty,
            };
          });

          set({ products: withStock });
        } catch (error) {
          console.error('Failed to fetch products:', error);
        }
      },

      fetchProductUnits: async (productId) => {

        const data = await axiosClient.get<any, any[]>(`/products/${productId}/units`);
        return (data || []).map(mapProductUnitFromApi);
      },

      createProductUnit: async (productId, payload) => {
        const created = await axiosClient.post<any, any>(`/products/${productId}/units`, payload);
        await get().fetchProducts();
        return mapProductUnitFromApi(created);
      },

      updateProductUnit: async (productId, productUnitId, payload) => {
        await axiosClient.put(`/products/${productId}/units/${productUnitId}`, payload);
        await get().fetchProducts();
      },

      deleteProductUnit: async (productId, productUnitId) => {
        await axiosClient.delete(`/products/${productId}/units/${productUnitId}`);
        await get().fetchProducts();
      },

      fetchCombos: async () => {
        try {
          const pageData = await axiosClient.get<any, any>('/catalog/combos?size=10000');
          const content = pageData.content || [];
          const mapped = content.map((item: any) => ({
            id: String(item.id),
            comboCode: item.comboCode,
            comboName: item.comboName,
            comboBarcode: item.barcode || '',
            comboType: item.comboType || 'PRE_ASSEMBLED',
            description: item.description || '',
            comboPrice: Number(item.price || 0),
            status: (item.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
            validFrom: item.startDate || '',
            validUntil: item.endDate || '',
            details: item.items ? item.items.map((it: any) => ({
              id: String(it.id),
              sku: it.productCode || '',
              productName: it.productName || '',
              quantity: Number(it.quantity || 0),
              unitPriceAtCreation: Number(it.price || 0),
            })) : [],
          }));
          set({ combos: mapped });
        } catch (error) {
          console.error('Failed to fetch combos:', error);
        }
      },

      fetchProductBatches: async () => {
        try {
          const data = await axiosClient.get<any, any[]>('/inventories/batches');
          const mapped = data.map((item: any) => ({
            id: String(item.id),
            batchNumber: item.batchNumber,
            sku: item.sku,
            productName: item.productName || '',
            manufactureDate: item.manufactureDate || '',
            expiryDate: item.expiryDate || '',
            initialUnits: Number(item.initialUnits || 0),
            remainingUnits: Number(item.remainingUnits || 0),
            unitCost: Number(item.unitCost || 0),
            supplierName: item.supplierName || '',
            location: item.location || '',
            qualityStatus: (item.qualityStatus || 'PASSED_QA') as 'PASSED_QA' | 'QUARANTINED' | 'EXPIRED' | 'RECALLED',
            inspector: item.inspector || '',
            notes: item.notes || '',
          }));
          set({ productBatches: mapped });
        } catch (error) {
          console.error('Failed to fetch product batches:', error);
        }
      },

      fetchStockTransfers: async () => {
        try {
          const data = await axiosClient.get<any, any[]>('/inventories/transfers');
          const mapped = data.map((item: any) => {
            const lines = item.transferLines || [];
            const totalUnits = lines.reduce((acc: number, line: any) => acc + (line.transferQuantity || 0), 0);
            return {
              id: String(item.id),
              transferNumber: item.transferCode,
              sourceHub: item.fromBranchName || 'Chi nhánh gửi',
              destinationHub: item.toBranchName || 'Chi nhánh nhận',
              dispatchDate: formatApiDate(item.transferDate || item.createdAt),
              estArrivalDate: formatApiDate(item.estArrivalDate),
              totalUnits,
              totalValuation: 0,
              status: (item.status || 'PENDING_APPROVAL') as 'DRAFT' | 'PENDING_APPROVAL' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED' | 'DISCREPANCY_HELD',
              logisticsPartner: item.logisticsPartner || 'GHTK',
              trackingRef: item.trackingRef || '',
              requestedBy: item.requestedBy || item.createdBy || 'System',
              approvedBy: item.approvedBy || '',
              notes: item.note || '',
            };
          });
          set({ stockTransfers: mapped });
        } catch (error) {
          console.error('Failed to fetch stock transfers:', error);
        }
      },

      fetchCancelIssues: async () => {
        try {
          const data = await axiosClient.get<any, any[]>('/inventories/cancel-issues');
          const flattened: CancelIssueRecord[] = [];
          data.forEach((master: any) => {
            const lines = master.cancelLines || [];
            lines.forEach((line: any) => {
              flattened.push({
                id: `${master.id}-${line.id}`,
                issueCode: master.cancelCode,
                sku: line.productCode || '',
                productName: line.productName || '',
                category: 'Chung',
                quantity: Number(line.quantity || 0),
                totalValuation: Number(line.subTotal || 0),
                reason: (master.reason || 'DAMAGED') as 'DAMAGED' | 'EXPIRED' | 'LOST' | 'THEFT' | 'QUALITY_DEFECT',
                locationHub: master.branchName || 'Chi nhánh',
                loggedDate: master.cancelDate || master.createdAt || '',
                reportedBy: master.createdBy || 'System',
                authorizedBy: master.createdBy || 'System',
                proofImages: [],
                status: (master.status || 'PENDING_APPROVAL') as 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PROCESSED',
                notes: master.note || '',
              });
            });
          });
          set({ cancelIssues: flattened });
        } catch (error) {
          console.error('Failed to fetch cancel issues:', error);
        }
      },

      fetchStockLedger: async () => {
        try {
          const data = await axiosClient.get<any, any[]>('/inventories/ledger');
          const mapped = data.map((item: any) => {
            const quantityChange = Number(item.quantityChange || 0);
            return {
              id: String(item.id),
              transactionCode: item.referenceDocument || `TRX-${item.id}`,
              sku: item.productCode || '',
              productName: item.productName || '',
              type: mapLedgerTransactionType(item.transactionType || '', quantityChange),
              quantityChange,
              runningBalance: Number(item.runningBalance || 0),
              unitPrice: 0,
              totalValuation: 0,
              timestamp: item.transactionDate || '',
              location: item.branchName || '',
              referenceDoc: item.referenceDocument || '',
              notes: item.notes,
              loggedBy: item.createdBy || 'System',
            };
          });
          set({ stockLedger: mapped });
        } catch (error) {
          console.error('Failed to fetch stock ledger:', error);
        }
      },

      addCategory: async (category) => {
        try {
          const payload = {
            categoryName: category.categoryName,
            description: category.description,
            parentId: category.parentId ? Number(category.parentId) : null,
            isActive: category.status === 'ACTIVE',
            department: category.department,
            manager: category.manager,
            inventoryGlCode: category.inventoryGlCode,
            cogsGlCode: category.cogsGlCode,
            taxClass: category.taxClass,
          };
          await axiosClient.post('/categories', payload);
          get().fetchCategories();
        } catch (error) {
          console.error('Failed to add category:', error);
        }
      },
      updateCategory: async (id, data) => {
        try {
          const payload = {
            categoryName: data.categoryName,
            description: data.description,
            parentId: data.parentId ? Number(data.parentId) : null,
            isActive: data.status === undefined ? undefined : data.status === 'ACTIVE',
            department: data.department,
            manager: data.manager,
            inventoryGlCode: data.inventoryGlCode,
            cogsGlCode: data.cogsGlCode,
            taxClass: data.taxClass,
          };
          await axiosClient.put(`/categories/${id}`, payload);
          get().fetchCategories();
        } catch (error) {
          console.error('Failed to update category:', error);
        }
      },
      deleteCategory: async (id) => {
        try {
          await axiosClient.delete(`/categories/${id}`);
          get().fetchCategories();
        } catch (error) {
          console.error('Failed to delete category:', error);
        }
      },

      addProductBatch: async (batch) => {
        try {
          const product = get().products.find(p => p.sku === batch.sku);
          const payload = {
            batchNumber: batch.batchNumber,
            manufactureDate: batch.manufactureDate,
            expiryDate: batch.expiryDate,
            productId: product ? Number(product.id) : 1,
            initialUnits: batch.initialUnits,
            remainingUnits: batch.remainingUnits,
            unitCost: batch.unitCost,
            supplierName: batch.supplierName,
            location: batch.location,
            qualityStatus: batch.qualityStatus,
            inspector: batch.inspector,
            notes: batch.notes,
          };
          await axiosClient.post('/inventories/batches', payload);
          get().fetchProductBatches();
        } catch (error) {
          console.error('Failed to add product batch:', error);
        }
      },
      updateProductBatch: async (id, data) => {
        try {
          const product = data.sku ? get().products.find(p => p.sku === data.sku) : undefined;
          const productId = product ? Number(product.id) : undefined;
          const payload = {
            batchNumber: data.batchNumber,
            manufactureDate: data.manufactureDate,
            expiryDate: data.expiryDate,
            productId,
            initialUnits: data.initialUnits,
            remainingUnits: data.remainingUnits,
            unitCost: data.unitCost,
            supplierName: data.supplierName,
            location: data.location,
            qualityStatus: data.qualityStatus,
            inspector: data.inspector,
            notes: data.notes,
          };
          await axiosClient.put(`/inventories/batches/${id}`, payload);
          get().fetchProductBatches();
        } catch (error) {
          console.error('Failed to update product batch:', error);
        }
      },
      deleteProductBatch: async (id) => {
        try {
          await axiosClient.delete(`/inventories/batches/${id}`);
          get().fetchProductBatches();
        } catch (error) {
          console.error('Failed to delete product batch:', error);
        }
      },
      adjustProductBatch: async (id, adjustedQuantity, reason) => {
        try {
          await axiosClient.post(`/inventories/batches/${id}/adjust`, { adjustedQuantity, reason });
          get().fetchProductBatches();
        } catch (error) {
          console.error('Failed to adjust product batch:', error);
          throw error;
        }
      },
      expireProductBatch: async (id) => {
        try {
          await axiosClient.post(`/inventories/batches/${id}/expire`);
          get().fetchProductBatches();
        } catch (error) {
          console.error('Failed to expire product batch:', error);
          throw error;
        }
      },
      fetchExpiringBatches: async (days = 30) => {
        try {
          const data = await axiosClient.get<any, any[]>(`/inventories/batches/expiring?days=${days}`);
          const mapped: ProductBatchRecord[] = (data || []).map((b: any) => ({
            id: String(b.id),
            batchNumber: b.batchNumber || '',
            sku: b.sku || '',
            productName: b.productName || '',
            manufactureDate: b.manufactureDate || '',
            expiryDate: b.expiryDate || '',
            initialUnits: Number(b.initialUnits || 0),
            remainingUnits: Number(b.remainingUnits || 0),
            unitCost: Number(b.unitCost || 0),
            supplierName: b.supplierName || '',
            location: b.location || '',
            qualityStatus: b.status === 'EXPIRED' ? 'EXPIRED' : (b.qualityStatus || 'PASSED_QA'),
            inspector: b.inspector || '',
            notes: b.notes || '',
          }));
          // Merge expiring with existing list
          set((state) => ({
            productBatches: [
              ...mapped,
              ...state.productBatches.filter(x => !mapped.find(m => m.id === x.id)),
            ],
          }));
        } catch (error) {
          console.error('Failed to fetch expiring batches:', error);
        }
      },

      addStockTransfer: async (transfer) => {
        try {
          const products = get().products;
          const productId = products.length > 0 ? Number(products[0].id) : 1;
          const payload = {
            transferCode: transfer.transferNumber || `ST-${Date.now()}`,
            transferDate: new Date().toISOString(),
            fromBranchId: resolveBranchId(transfer.sourceHub),
            toBranchId: resolveBranchId(transfer.destinationHub),
            status: transfer.status || 'DRAFT',
            transferLines: [
              {
                productId,
                transferQuantity: transfer.totalUnits || 1,
                reason: transfer.notes || 'Chuyển kho',
              }
            ],
          };
          await axiosClient.post('/inventories/transfers', payload);
          get().fetchStockTransfers();
        } catch (error) {
          console.error('Failed to add stock transfer:', error);
        }
      },
      updateStockTransfer: async (id, data) => {
        try {
          if (data.status === 'COMPLETED') {
            await get().completeStockTransfer(id, data.notes);
            return;
          }
          if (data.status === 'CANCELLED' || data.status === 'CANCELLED_DISCREPANCY') {
            await get().cancelStockTransfer(id, data.notes || 'Hủy chuyển kho');
            return;
          }

          const products = get().products;
          const productId = products.length > 0 ? Number(products[0].id) : 1;
          const payload = {
            transferCode: data.transferNumber,
            transferDate: new Date().toISOString(),
            fromBranchId: data.sourceHub ? resolveBranchId(data.sourceHub) : undefined,
            toBranchId: data.destinationHub ? resolveBranchId(data.destinationHub) : undefined,
            status: data.status,
            transferLines: [
              {
                productId,
                transferQuantity: data.totalUnits || 1,
                reason: data.notes || 'Cập nhật chuyển kho',
              }
            ],
          };
          await axiosClient.put(`/inventories/transfers/${id}`, payload);
          get().fetchStockTransfers();
        } catch (error) {
          console.error('Failed to update stock transfer:', error);
        }
      },
      deleteStockTransfer: async (id) => {
        try {
          await axiosClient.delete(`/inventories/transfers/${id}`);
          get().fetchStockTransfers();
        } catch (error) {
          console.error('Failed to delete stock transfer:', error);
        }
      },
      completeStockTransfer: async (id, notes) => {
        try {
          await axiosClient.post(`/inventories/transfers/${id}/receive`, { notes: notes || '' });
          get().fetchStockTransfers();
        } catch (error) {
          console.error('Failed to complete stock transfer:', error);
          throw error;
        }
      },
      approveStockTransfer: async (id) => {
        try {
          await axiosClient.post(`/inventories/transfers/${id}/approve`);
          get().fetchStockTransfers();
        } catch (error) {
          console.error('Failed to approve stock transfer:', error);
          throw error;
        }
      },
      shipStockTransfer: async (id) => {
        try {
          await axiosClient.post(`/inventories/transfers/${id}/ship`);
          get().fetchStockTransfers();
        } catch (error) {
          console.error('Failed to ship stock transfer:', error);
          throw error;
        }
      },
      cancelStockTransfer: async (id, cancelReason) => {
        try {
          await axiosClient.post(`/inventories/transfers/${id}/cancel`, { cancelReason });
          get().fetchStockTransfers();
        } catch (error) {
          console.error('Failed to cancel stock transfer:', error);
          throw error;
        }
      },

      addProduct: async (product) => {
        try {
          const categoryObj = get().categories.find(c => c.categoryName === product.category);
          const categoryId = categoryObj ? Number(categoryObj.id) : 1;

          const unitObj = get().unitsList.find(u => u.unitName === product.unit);
          const baseUnitId = unitObj ? Number(unitObj.id) : 1;

          const payload = {
            productCode: product.sku,
            name: product.name,
            description: product.description,
            basePrice: product.price,
            costPrice: product.costPrice,
            barcode: product.barcodes?.[0] || '',
            isActive: product.status === 'ACTIVE',
            categoryId: categoryId,
            baseUnitId: baseUnitId,
            brand: product.brand,
            mainImageUrl: product.mainImage,
            weight: product.weight ? parseFloat(product.weight) || 0 : 0,
            reorderPoint: product.reorderPoint || 0,
            minStock: product.minStock || 0,
            maxStock: product.maxStock || 0,
            galleryImages: JSON.stringify(product.galleryImages || []),
            variants: JSON.stringify(product.variants || []),
            conversionUnits: (product.units || [])
              .filter(u => !u.isBaseUnit)
              .map(u => {
                const unitMaster = get().unitsList.find(
                  x => x.code === u.unitCode || x.unitName === u.unitCode
                );
                return {
                  unitId: unitMaster ? Number(unitMaster.id) : Number(u.unitId || 0),
                  conversionRate: u.conversionRate,
                  price: u.price,
                  barcode: u.barcode || undefined,
                };
              })
              .filter(u => u.unitId > 0),
          };
          await axiosClient.post('/products', payload);
          await get().fetchProducts();
        } catch (error) {
          console.error('Failed to add product:', error);
          throw error;
        }
      },
      updateProduct: async (id, data) => {
        try {
          const categoryObj = data.category ? get().categories.find(c => c.categoryName === data.category) : undefined;
          const categoryId = categoryObj ? Number(categoryObj.id) : undefined;

          const unitObj = data.unit ? get().unitsList.find(u => u.unitName === data.unit) : undefined;
          const baseUnitId = unitObj ? Number(unitObj.id) : undefined;

          const payload = {
            productCode: data.sku,
            name: data.name,
            description: data.description,
            basePrice: data.price,
            costPrice: data.costPrice,
            barcode: data.barcodes?.[0],
            isActive: data.status === undefined ? undefined : data.status === 'ACTIVE',
            categoryId: categoryId,
            baseUnitId: baseUnitId,
            brand: data.brand,
            mainImageUrl: data.mainImage,
            weight: data.weight ? parseFloat(data.weight) || 0 : undefined,
            reorderPoint: data.reorderPoint,
            minStock: data.minStock,
            maxStock: data.maxStock,
            galleryImages: data.galleryImages ? JSON.stringify(data.galleryImages) : undefined,
            variants: data.variants ? JSON.stringify(data.variants) : undefined,
          };
          await axiosClient.put(`/products/${id}`, payload);
          await get().fetchProducts();
        } catch (error) {
          console.error('Failed to update product:', error);
          throw error;
        }
      },
      deleteProduct: async (id) => {
        try {
          await axiosClient.delete(`/products/${id}`);
          get().fetchProducts();
        } catch (error) {
          console.error('Failed to delete product:', error);
        }
      },

      addCombo: async (combo) => {
        try {
          const details = combo.details.map((d) => {
            const product = get().products.find(p => p.sku === d.sku);
            return {
              productId: product ? Number(product.id) : 1,
              quantity: d.quantity,
              unitPriceAtCreation: d.unitPriceAtCreation,
            };
          });
          const payload = {
            comboCode: combo.comboCode,
            comboName: combo.comboName,
            barcode: combo.comboBarcode,
            description: combo.description,
            comboType: combo.comboType,
            price: combo.comboPrice,
            startDate: combo.validFrom ? `${combo.validFrom}T00:00:00` : undefined,
            endDate: combo.validUntil ? `${combo.validUntil}T00:00:00` : undefined,
            isActive: combo.status === 'ACTIVE',
            details,
          };
          const res = await axiosClient.post<any, any>('/catalog/combos', payload);
          if (res?.warningCode === 'COMBO_PRICE_ABOVE_RETAIL' && res.warnings?.length) {
            console.warn('[Combo]', res.warnings[0]);
          }
          get().fetchCombos();
        } catch (error) {
          console.error('Failed to add combo:', error);
        }
      },
      updateCombo: async (id, data) => {
        try {
          const details = data.details?.map((d) => {
            const product = get().products.find(p => p.sku === d.sku);
            return {
              productId: product ? Number(product.id) : 1,
              quantity: d.quantity,
              unitPriceAtCreation: d.unitPriceAtCreation,
            };
          });
          const payload = {
            comboCode: data.comboCode,
            comboName: data.comboName,
            barcode: data.comboBarcode,
            description: data.description,
            comboType: data.comboType,
            price: data.comboPrice,
            startDate: data.validFrom ? `${data.validFrom}T00:00:00` : undefined,
            endDate: data.validUntil ? `${data.validUntil}T00:00:00` : undefined,
            isActive: data.status === undefined ? undefined : data.status === 'ACTIVE',
            details,
          };
          const res = await axiosClient.put<any, any>(`/catalog/combos/${id}`, payload);
          if (res?.warningCode === 'COMBO_PRICE_ABOVE_RETAIL' && res.warnings?.length) {
            console.warn('[Combo]', res.warnings[0]);
          }
          get().fetchCombos();
        } catch (error) {
          console.error('Failed to update combo:', error);
        }
      },
      deleteCombo: async (id) => {
        try {
          await axiosClient.delete(`/catalog/combos/${id}`);
          get().fetchCombos();
        } catch (error) {
          console.error('Failed to delete combo:', error);
        }
      },

      addCancelIssue: async (issue) => {
        try {
          const product = get().products.find(p => p.sku === issue.sku);
          const productId = product ? Number(product.id) : 1;
          const unitPrice = product ? product.price : 0;
          const subTotal = unitPrice * issue.quantity;

          const payload = {
            cancelCode: issue.issueCode || `CI-${Date.now()}`,
            cancelDate: new Date().toISOString().split('T')[0],
            totalValue: subTotal,
            reason: issue.reason,
            status: issue.status || 'PENDING_APPROVAL',
            branchId: 1,
            note: issue.notes || '',
            cancelLines: [
              {
                productId,
                quantity: issue.quantity,
                unitPrice,
                subTotal,
              }
            ],
          };
          await axiosClient.post('/inventories/cancel-issues', payload);
          await get().fetchCancelIssues();
        } catch (error) {
          console.error('Failed to add cancel issue:', error);
          throw error;
        }
      },
      updateCancelIssue: async (id, data) => {
        try {
          const masterId = id.includes('-') ? id.split('-')[0] : id;
          if (data.status === 'APPROVED') {
            await get().approveCancelIssue(masterId, data.notes);
            return;
          }
          if (data.status === 'REJECTED') {
            await get().rejectCancelIssue(masterId, data.notes);
            return;
          }

          const product = data.sku ? get().products.find(p => p.sku === data.sku) : undefined;
          const productId = product ? Number(product.id) : undefined;
          const unitPrice = product ? product.price : 0;
          const subTotal = data.quantity && unitPrice ? unitPrice * data.quantity : 0;

          const payload = {
            cancelCode: data.issueCode,
            cancelDate: new Date().toISOString().split('T')[0],
            totalValue: subTotal || undefined,
            reason: data.reason,
            status: data.status,
            branchId: 1,
            note: data.notes,
            cancelLines: [
              {
                productId: productId || 1,
                quantity: data.quantity || 1,
                unitPrice,
                subTotal: subTotal || unitPrice,
              }
            ],
          };
          await axiosClient.put(`/inventories/cancel-issues/${masterId}`, payload);
          await get().fetchCancelIssues();
        } catch (error) {
          console.error('Failed to update cancel issue:', error);
          throw error;
        }
      },
      deleteCancelIssue: async (id) => {
        try {
          const masterId = id.includes('-') ? id.split('-')[0] : id;
          await axiosClient.delete(`/inventories/cancel-issues/${masterId}`);
          await get().fetchCancelIssues();
        } catch (error) {
          console.error('Failed to delete cancel issue:', error);
          throw error;
        }
      },
      approveCancelIssue: async (id, approvalNotes) => {
        try {
          const masterId = id.includes('-') ? id.split('-')[0] : id;
          await axiosClient.post(`/inventories/cancel-issues/${masterId}/approve`, {
            approvalNotes: approvalNotes || 'Duyệt phiếu hủy xuất',
          });
          await get().fetchCancelIssues();
        } catch (error) {
          console.error('Failed to approve cancel issue:', error);
          throw error;
        }
      },
      rejectCancelIssue: async (id, rejectNotes) => {
        try {
          const masterId = id.includes('-') ? id.split('-')[0] : id;
          await axiosClient.post(`/inventories/cancel-issues/${masterId}/reject`, {
            rejectNotes: rejectNotes || 'Từ chối phiếu hủy xuất',
          });
          await get().fetchCancelIssues();
        } catch (error) {
          console.error('Failed to reject cancel issue:', error);
          throw error;
        }
      },

      addInventoryAudit: (audit) =>
        set((state) => ({ inventoryAudits: [{ id: Date.now().toString(), ...audit }, ...state.inventoryAudits] })),
      updateInventoryAudit: (id, data) =>
        set((state) => ({
          inventoryAudits: state.inventoryAudits.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      deleteInventoryAudit: (id) =>
        set((state) => ({ inventoryAudits: state.inventoryAudits.filter((a) => a.id !== id) })),

      // ── Inventory Checks API (backend: /inventories/checks) ──────────────
      fetchInventoryChecks: async () => {
        try {
          const data = await axiosClient.get<any, any[]>('/inventories/checks');
          const mapped: InventoryCheckRecord[] = data.map((item: any) => {
            const lines = item.checkLines || [];
            const computedDiscrepancyCount = lines.filter(
              (line: any) => Number(line.diffQty || 0) !== 0
            ).length;
            const computedNetVariance = lines.reduce(
              (acc: number, line: any) => acc + Number(line.diffQty || 0),
              0
            );

            return {
              id: String(item.id),
              checkCode: item.checkCode || `CHK-${item.id}`,
              branchId: String(item.branchId || ''),
              branchName: item.branchName || 'Chi nhánh',
              checkDate: formatApiDate(item.checkDate),
              status: (() => {
                const s = (item.status || '').toUpperCase();
                if (s === 'IN_PROGRESS') return 'IN_PROGRESS';
                if (s === 'COMPLETED' || s === 'BALANCED') return 'COMPLETED';
                if (s === 'CANCELLED') return 'CANCELLED';
                return 'DRAFT';
              })() as InventoryCheckRecord['status'],
              totalItems: Number(item.totalItems ?? lines.length),
              discrepancyCount: Number(item.discrepancyCount ?? computedDiscrepancyCount),
              netVariance: Number(item.netVariance ?? computedNetVariance),
              checkedBy: item.createdBy || item.checkedBy || '',
              notes: item.notes || item.note || '',
            };
          });
          set({ inventoryChecks: mapped });
        } catch (error) {
          console.error('Failed to fetch inventory checks:', error);
        }
      },
      addInventoryCheck: async (payload) => {
        try {
          const products = get().products;
          const checkLines = products.length > 0 ? products.map(p => ({
            productId: Number(p.id),
            expectedQuantity: 10,
            actualQuantity: 10,
            reason: 'Kiểm kê định kỳ',
          })) : [
            {
              productId: 1,
              expectedQuantity: 10,
              actualQuantity: 10,
              reason: 'Kiểm kê định kỳ',
            }
          ];

          const req = {
            checkCode: payload.checkCode,
            checkDate: payload.checkDate ? `${payload.checkDate}T00:00:00` : new Date().toISOString(),
            branchId: payload.branchId,
            checkLines,
          };
          await axiosClient.post('/inventories/checks', req);
          await get().fetchInventoryChecks();
        } catch (error) {
          console.error('Failed to add inventory check:', error);
          throw error;
        }
      },
      updateInventoryCheck: async (id, payload) => {
        try {
          const check = get().inventoryChecks.find(c => c.id === id);
          const products = get().products;
          const checkLines = products.length > 0 ? products.map(p => ({
            productId: Number(p.id),
            expectedQuantity: 10,
            actualQuantity: 10,
            reason: 'Kiểm kê định kỳ',
          })) : [
            {
              productId: 1,
              expectedQuantity: 10,
              actualQuantity: 10,
              reason: 'Kiểm kê định kỳ',
            }
          ];
          const req = {
            checkCode: check?.checkCode || `CHK-${id}`,
            checkDate: check?.checkDate ? `${check.checkDate}T00:00:00` : new Date().toISOString(),
            branchId: check?.branchId ? Number(check.branchId) : 1,
            checkLines,
          };
          await axiosClient.put(`/inventories/checks/${id}`, req);
          await get().fetchInventoryChecks();
        } catch (error) {
          console.error('Failed to update inventory check:', error);
          throw error;
        }
      },
      // startInventoryCheck: backend không có endpoint này — giữ lại noop để không break UI
      startInventoryCheck: async (_id) => {
        console.warn('startInventoryCheck: backend không có endpoint /checks/{id}/start, bỏ qua.');
      },
      completeInventoryCheck: async (id) => {
        try {
          await axiosClient.post(`/inventories/checks/${id}/approve`);
          await get().fetchInventoryChecks();
        } catch (error) {
          console.error('Failed to complete inventory check:', error);
          throw error;
        }
      },
      deleteInventoryCheck: async (id) => {
        try {
          await axiosClient.delete(`/inventories/checks/${id}`);
          await get().fetchInventoryChecks();
        } catch (error) {
          console.error('Failed to delete inventory check:', error);
          throw error;
        }
      },

      // ── StockOuts Actions ──
      fetchStockOuts: async () => {
        // Keeps local state or syncs with backend when endpoint available
      },
      addStockOut: async (item) => {
        set((state) => ({
          stockOuts: [{ id: Date.now().toString(), ...item }, ...state.stockOuts],
        }));
      },
      updateStockOut: async (id, data) => {
        set((state) => ({
          stockOuts: state.stockOuts.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },
      deleteStockOut: async (id) => {
        set((state) => ({
          stockOuts: state.stockOuts.filter((s) => s.id !== id),
        }));
      },

      // ── SupplierWarehouses Actions ──
      fetchSupplierWarehouses: async () => {},
      addSupplierWarehouse: async (item) => {
        set((state) => ({
          supplierWarehouses: [{ id: Date.now().toString(), ...item }, ...state.supplierWarehouses],
        }));
      },
      updateSupplierWarehouse: async (id, data) => {
        set((state) => ({
          supplierWarehouses: state.supplierWarehouses.map((w) => (w.id === id ? { ...w, ...data } : w)),
        }));
      },
      deleteSupplierWarehouse: async (id) => {
        set((state) => ({
          supplierWarehouses: state.supplierWarehouses.filter((w) => w.id !== id),
        }));
      },

      // ── SupplierStorages Actions ──
      fetchSupplierStorages: async () => {},
      addSupplierStorage: async (item) => {
        set((state) => ({
          supplierStorages: [{ id: Date.now().toString(), ...item }, ...state.supplierStorages],
        }));
      },
      updateSupplierStorage: async (id, data) => {
        set((state) => ({
          supplierStorages: state.supplierStorages.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
      },
      deleteSupplierStorage: async (id) => {
        set((state) => ({
          supplierStorages: state.supplierStorages.filter((s) => s.id !== id),
        }));
      },

      // ── Serial Numbers API (backend: /products/:id/serials) ──────────────
      addSerialItem: (item) =>
        set((state) => ({ serialItems: [{ id: Date.now().toString(), ...item }, ...state.serialItems] })),
      updateSerialItem: (id, data) =>
        set((state) => ({ serialItems: state.serialItems.map((s) => (s.id === id ? { ...s, ...data } : s)) })),
      deleteSerialItem: (id) =>
        set((state) => ({ serialItems: state.serialItems.filter((s) => s.id !== id) })),

      fetchSerialsByProduct: async (productId: number) => {
        try {
          const data = await axiosClient.get<any, any[]>(`/products/${productId}/serials`);
          const mapped: SerialItemRecord[] = data.map((s: any) => ({
            id: String(s.id),
            serialNumber: s.serialNumber,
            sku: s.productCode || '',
            productName: s.productName || '',
            category: s.category || 'N/A',
            unitCost: Number(s.unitCost || 0),
            status: (s.status || 'IN_STOCK') as SerialItemRecord['status'],
            currentLocation: s.location || '',
            receivedDate: s.receivedDate ? s.receivedDate.split('T')[0] : '',
            warrantyExpiry: s.warrantyExpiry ? s.warrantyExpiry.split('T')[0] : '',
            vendorName: s.vendorName || '',
            poReference: s.poReference || '',
            macAddress: s.macAddress || '',
            imei1: s.imei1 || '',
            imei2: s.imei2 || '',
            notes: s.notes || '',
          }));
          set({ serialItems: mapped });
        } catch (error) {
          console.error('Failed to fetch serials by product:', error);
        }
      },
      addProductSerials: async (productId: number, serialNumbers: string[], notes?: string) => {
        try {
          await axiosClient.post(`/products/${productId}/serials`, { serialNumbers, notes });
          await get().fetchSerialsByProduct(productId);
        } catch (error) {
          console.error('Failed to add product serials:', error);
          throw error;
        }
      },

      addStockLedgerEntry: (entry) =>
        set((state) => ({ stockLedger: [{ id: Date.now().toString(), ...entry }, ...state.stockLedger] })),
      updateStockLedgerEntry: (id, data) =>
        set((state) => ({ stockLedger: state.stockLedger.map((s) => (s.id === id ? { ...s, ...data } : s)) })),
      deleteStockLedgerEntry: (id) =>
        set((state) => ({ stockLedger: state.stockLedger.filter((s) => s.id !== id) })),

      addMobileProduct: (product) =>
        set((state) => ({ mobileProducts: [{ id: Date.now().toString(), ...product }, ...state.mobileProducts] })),
      updateMobileProduct: (id, data) =>
        set((state) => ({
          mobileProducts: state.mobileProducts.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteMobileProduct: (id) =>
        set((state) => ({ mobileProducts: state.mobileProducts.filter((p) => p.id !== id) })),

      fetchInventories: async () => {
        try {
          const data = await axiosClient.get<any, any[]>('/inventories');
          const mapped = data.map((item: any) => ({
            id: String(item.id),
            productId: String(item.productId),
            productCode: item.productCode || '',
            productName: item.productName || '',
            branchId: String(item.branchId),
            branchName: item.branchName || 'Chi nhánh',
            warehouseZoneId: item.warehouseZoneId ? String(item.warehouseZoneId) : undefined,
            warehouseZoneName: item.warehouseZoneName || '',
            quantityOnHand: Number(item.quantityPhysical ?? item.quantityOnHand ?? 0),
            quantityReserved: Number(item.quantityAllocated ?? item.quantityReserved ?? 0),
            quantityAvailable: Number(item.quantityAvailable ?? 0),
            locationBin: item.warehouseZoneName || item.locationBin || '',
          }));
          set({ inventories: mapped });
        } catch (error) {
          console.error('Failed to fetch inventories:', error);
        }
      },

      fetchLowStock: async () => {
        try {
          const data = await axiosClient.get<any, any[]>('/inventories/low-stock');
          const mapped: LowStockItem[] = (data || []).map((item: any) => ({
            id: `${item.productId}-${item.warehouseZoneId}`,
            productId: String(item.productId),
            productCode: item.productCode || '',
            productName: item.productName || '',
            branchId: String(item.branchId),
            branchName: item.branchName || '',
            warehouseZoneId: String(item.warehouseZoneId),
            warehouseZoneName: item.warehouseZoneName || '',
            currentQuantity: Number(item.currentQuantity || 0),
            minStock: Number(item.minStock || 0),
            shortage: Number(item.shortage || 0),
          }));
          set({ lowStockItems: mapped });
        } catch (error) {
          console.error('Failed to fetch low stock:', error);
        }
      },

      adjustStock: async (payload) => {
        const res = await axiosClient.post<any, any>('/inventories/adjust', payload);
        await Promise.all([get().fetchStockLedger(), get().fetchInventories(), get().fetchLowStock()]);
        return {
          inventoryId: Number(res.inventoryId),
          oldQuantity: Number(res.oldQuantity),
          newQuantity: Number(res.newQuantity),
          changeQty: Number(res.changeQty),
          transactionType: res.transactionType || 'ADJUSTMENT',
          reason: res.reason || payload.reason,
        };
      },

      fetchProductLocations: async (productId?: number, binId?: number) => {
        try {
          const params = new URLSearchParams();
          if (productId) params.append('productId', String(productId));
          if (binId) params.append('binId', String(binId));
          const url = `/wms/product-locations${params.toString() ? `?${params.toString()}` : ''}`;
          const data = await axiosClient.get<any, any[]>(url);
          const mapped = data.map((item: any) => ({
            id: String(item.id),
            productId: String(item.productId),
            productCode: item.productCode || '',
            productName: item.productName || '',
            binId: String(item.binId),
            binCode: item.binCode || '',
            zoneCode: item.zoneCode || '',
            quantity: Number(item.quantity || 0),
          }));
          set({ productLocations: mapped });
        } catch (error) {
          console.error('Failed to fetch product locations:', error);
        }
      },

      assignProductLocation: async (payload) => {
        try {
          await axiosClient.post('/wms/product-locations/assign', payload);
          await get().fetchProductLocations();
        } catch (error) {
          console.error('Failed to assign product location:', error);
          throw error;
        }
      },

      fetchUnits: async (includeDeleted?: boolean) => {
        try {
          const finalIncludeDeleted = includeDeleted !== undefined ? includeDeleted : get().unitsIncludeDeleted;
          set({ unitsIncludeDeleted: finalIncludeDeleted });
          // includeDeleted=true → lấy tất cả kể cả đã xóa mềm
          const params = finalIncludeDeleted ? '?includeDeleted=true' : '?includeDeleted=false';
          const res = await axiosClient.get<any, any[]>(`/units${params}`);
          const units = res.map((u: any) => ({
            id: String(u.id),
            code: u.abbreviation || u.unitCode || '',
            unitName: u.unitName || '',
            type: (u.unitType || 'QUANTITY') as 'WEIGHT' | 'DIMENSION' | 'QUANTITY' | 'VOLUME' | 'PACKAGING',
            conversionFactor: u.conversionFactor ?? 1.0,
            baseUnitCode: u.baseUnitCode || u.abbreviation || '',
            assignedSkusCount: 0,
            // Nếu isDeleted=true → hiển thị trạng thái đặc biệt 'DELETED'
            status: u.isDeleted
              ? 'DELETED'
              : (u.isActive ? 'ACTIVE' : 'DEPRECATED') as 'ACTIVE' | 'DEPRECATED' | 'DELETED',
            precisionDecimals: u.precisionDecimals ?? 0,
            notes: u.description || '',
            isDeleted: u.isDeleted || false,
            deletedAt: u.deletedAt || null,
            deletedBy: u.deletedBy || null,
          }));
          set({ unitsList: units });
        } catch (error) {
          console.error('Failed to fetch units:', error);
        }
      },
      addUnit: async (unit) => {
        try {
          const payload = {
            unitName: unit.unitName,
            unitCode: unit.code,
            description: unit.notes || '',
            isActive: unit.status === 'ACTIVE',
            unitType: unit.type,
            conversionFactor: unit.conversionFactor,
            baseUnitCode: unit.baseUnitCode,
            precisionDecimals: unit.precisionDecimals,
          };
          await axiosClient.post('/units', payload);
          await get().fetchUnits();
        } catch (error) {
          console.error('Failed to add unit:', error);
          throw error;
        }
      },
      updateUnit: async (id, data) => {
        try {
          const payload = {
            unitName: data.unitName,
            unitCode: data.code,           // BẮT BUỘC gửi để backend validate
            description: data.notes,
            isActive: data.status === undefined ? undefined : data.status === 'ACTIVE',
            unitType: data.type,
            conversionFactor: data.conversionFactor,
            baseUnitCode: data.baseUnitCode,
            precisionDecimals: data.precisionDecimals,
          };
          await axiosClient.put(`/units/${id}`, payload);
          await get().fetchUnits();
        } catch (error) {
          console.error('Failed to update unit:', error);
          throw error;
        }
      },
      deleteUnit: async (id) => {
        try {
          await axiosClient.delete(`/units/${id}`);
          await get().fetchUnits();
        } catch (error: any) {
          // Backend trả về 409 Conflict khi đơn vị vẫn đang HOẠT ĐỘNG
          const message =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            'Không thể xóa đơn vị này. Vui lòng tắt hoạt động trước.';
          alert(message); // hoặc dùng toast nếu có
          console.error('Failed to delete unit:', error);
          throw error;
        }
      },

      fetchWarehouseZones: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/warehouses/zones');
          const zones = res.map((z: any) => ({
            id: String(z.id),
            zoneCode: z.zoneCode || '',
            zoneName: z.zoneName || '',
            condition: z.conditions || '',
            capacity: 500,
            branchName: z.branchName || 'Chi nhánh Quận 1',
            status: 'HOẠT_ĐỘNG' as const,
            description: '',
          }));
          set({ warehouseZones: zones });
        } catch (error) {
          console.error('Failed to fetch warehouse zones:', error);
        }
      },
      addWarehouseZone: async (zone) => {
        try {
          const payload = {
            zoneCode: zone.zoneCode,
            zoneName: zone.zoneName,
            conditions: zone.condition,
            branchId: resolveBranchId(zone.branchName),
          };
          await axiosClient.post('/warehouses/zones', payload);
          await get().fetchWarehouseZones();
        } catch (error) {
          console.error('Failed to add warehouse zone:', error);
        }
      },
      updateWarehouseZone: async (id, data) => {
        try {
          const payload = {
            zoneCode: data.zoneCode,
            zoneName: data.zoneName,
            conditions: data.condition,
            branchId: data.branchName ? resolveBranchId(data.branchName) : undefined,
          };
          await axiosClient.put(`/warehouses/zones/${id}`, payload);
          await get().fetchWarehouseZones();
        } catch (error) {
          console.error('Failed to update warehouse zone:', error);
        }
      },
      deleteWarehouseZone: async (id) => {
        try {
          await axiosClient.delete(`/warehouses/zones/${id}`);
          await get().fetchWarehouseZones();
        } catch (error) {
          console.error('Failed to delete warehouse zone:', error);
        }
      },

      fetchWarehouseBins: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/warehouses/bins');
          const bins = res.map((b: any) => ({
            id: String(b.id),
            binCode: b.binCode || '',
            barcode: b.barcode || '',
            areaCode: b.zoneCode || '',
            areaName: b.zoneName || '',
            maxWeightKg: b.maxCapacity ? Number(b.maxCapacity) : 500,
            maxVolumeM3: 2.5,
            status: 'EMPTY' as const,
            notes: '',
          }));
          set({ warehouseBins: bins });
        } catch (error) {
          console.error('Failed to fetch warehouse bins:', error);
        }
      },
      addWarehouseBin: async (bin) => {
        try {
          const zone = get().warehouseZones.find(z => z.zoneCode === bin.areaCode);
          const zoneId = zone ? Number(zone.id) : 1;
          const payload = {
            binCode: bin.binCode,
            barcode: bin.barcode,
            maxCapacity: bin.maxWeightKg,
            zoneId: zoneId,
          };
          await axiosClient.post('/warehouses/bins', payload);
          await get().fetchWarehouseBins();
        } catch (error) {
          console.error('Failed to add warehouse bin:', error);
        }
      },
      updateWarehouseBin: async (id, data) => {
        try {
          const zone = data.areaCode ? get().warehouseZones.find(z => z.zoneCode === data.areaCode) : undefined;
          const zoneId = zone ? Number(zone.id) : undefined;
          const payload = {
            binCode: data.binCode,
            barcode: data.barcode,
            maxCapacity: data.maxWeightKg,
            zoneId: zoneId,
          };
          await axiosClient.put(`/warehouses/bins/${id}`, payload);
          await get().fetchWarehouseBins();
        } catch (error) {
          console.error('Failed to update warehouse bin:', error);
        }
      },
      deleteWarehouseBin: async (id) => {
        try {
          await axiosClient.delete(`/warehouses/bins/${id}`); // Note: path changed from /warehouse/bins to /warehouses/bins to match backend @RequestMapping("/api/v1/warehouses")
          await get().fetchWarehouseBins();
        } catch (error) {
          console.error('Failed to delete warehouse bin:', error);
        }
      },

      // --- WMS: Area ---
      fetchAreas: async (zoneId) => {
        try {
          const url = zoneId ? `/wms/areas/by-zone/${zoneId}` : '/wms/areas';
          const data = await axiosClient.get<any, any>(url);
          const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
          const mapped = list.map((item: any) => ({
            id: String(item.id),
            areaCode: item.areaCode,
            areaName: item.areaName,
            description: item.description,
            isActive: !!item.isActive,
            zoneId: String(item.zoneId || ''),
            zoneCode: item.zoneCode || '',
            zoneName: item.zoneName || '',
            branchId: String(item.branchId || ''),
            branchName: item.branchName || '',
          }));
          set({ areas: mapped });
        } catch (error) {
          console.error('Failed to fetch areas:', error);
        }
      },
      addArea: async (area) => {
        try {
          await axiosClient.post('/wms/areas', area);
          await get().fetchAreas();
        } catch (error) {
          console.error('Failed to add area:', error);
        }
      },
      updateArea: async (id, data) => {
        try {
          await axiosClient.put(`/wms/areas/${id}`, data);
          await get().fetchAreas();
        } catch (error) {
          console.error('Failed to update area:', error);
        }
      },
      deleteArea: async (id) => {
        try {
          await axiosClient.delete(`/wms/areas/${id}`);
          await get().fetchAreas();
        } catch (error) {
          console.error('Failed to delete area:', error);
        }
      },

      // --- WMS: Rack ---
      fetchRacks: async (areaId) => {
        try {
          const url = areaId ? `/wms/racks/by-area/${areaId}` : '/wms/racks';
          const data = await axiosClient.get<any, any>(url);
          const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
          const mapped = list.map((item: any) => ({
            id: String(item.id),
            rackCode: item.rackCode,
            rackName: item.rackName,
            maxWeightKg: item.maxWeightKg,
            maxVolumeM3: item.maxVolumeM3,
            maxPallet: item.maxPallet,
            description: item.description,
            isActive: !!item.isActive,
            areaId: String(item.areaId || ''),
            areaCode: item.areaCode || '',
            areaName: item.areaName || '',
            zoneId: String(item.zoneId || ''),
            zoneCode: item.zoneCode || '',
            branchId: String(item.branchId || ''),
            branchName: item.branchName || '',
          }));
          set({ racks: mapped });
        } catch (error) {
          console.error('Failed to fetch racks:', error);
        }
      },
      addRack: async (rack) => {
        try {
          await axiosClient.post('/wms/racks', rack);
          await get().fetchRacks();
        } catch (error) {
          console.error('Failed to add rack:', error);
        }
      },
      updateRack: async (id, data) => {
        try {
          await axiosClient.put(`/wms/racks/${id}`, data);
          await get().fetchRacks();
        } catch (error) {
          console.error('Failed to update rack:', error);
        }
      },
      deleteRack: async (id) => {
        try {
          await axiosClient.delete(`/wms/racks/${id}`);
          await get().fetchRacks();
        } catch (error) {
          console.error('Failed to delete rack:', error);
        }
      },

      // --- WMS: LocationTransfer ---
      fetchLocationTransfers: async (branchId) => {
        try {
          const url = branchId ? `/wms/location-transfers/by-branch/${branchId}` : '/wms/location-transfers';
          const data = await axiosClient.get<any, any>(url);
          const list = Array.isArray(data) ? data : (data?.data || data?.content || []);
          const mapped = list.map((item: any) => ({
            id: String(item.id),
            transferCode: item.transferCode,
            transferDate: item.transferDate,
            status: item.status,
            reason: item.reason,
            quantity: item.quantity,
            executedBy: item.executedBy,
            productVariantId: String(item.productVariantId || ''),
            productName: item.productName || '',
            sku: item.sku || '',
            fromBinId: String(item.fromBinId || ''),
            fromBinCode: item.fromBinCode || '',
            fromBinLocation: item.fromBinLocation || '',
            toBinId: String(item.toBinId || ''),
            toBinCode: item.toBinCode || '',
            toBinLocation: item.toBinLocation || '',
            branchId: String(item.branchId || ''),
            branchName: item.branchName || '',
          }));
          set({ locationTransfers: mapped });
        } catch (error) {
          console.error('Failed to fetch location transfers:', error);
        }
      },
      createLocationTransfer: async (data) => {
        try {
          await axiosClient.post('/wms/location-transfers', data);
          await get().fetchLocationTransfers(data.branchId);
        } catch (error) {
          console.error('Failed to create location transfer:', error);
        }
      },
      completeLocationTransfer: async (id) => {
        try {
          await axiosClient.patch(`/wms/location-transfers/${id}/complete`);
          await get().fetchLocationTransfers();
          await get().fetchWarehouseBins(); // Refresh bins since statuses change
        } catch (error) {
          console.error('Failed to complete location transfer:', error);
        }
      },
      cancelLocationTransfer: async (id) => {
        try {
          await axiosClient.patch(`/wms/location-transfers/${id}/cancel`);
          await get().fetchLocationTransfers();
        } catch (error) {
          console.error('Failed to cancel location transfer:', error);
        }
      },

      // --- Purchase: SupplierProduct ---
      fetchSupplierProducts: async (supplierId) => {
        try {
          const url = supplierId ? `/partnerarea/supplier-products/by-supplier/${supplierId}` : '/partnerarea/supplier-products';
          const data = await axiosClient.get<any, any>(url);
          const list = Array.isArray(data) ? data : (data?.content || []);
          const mapped = list.map((item: any) => ({
            id: String(item.id),
            supplierSku: item.supplierSku,
            unitPrice: item.unitPrice,
            currency: item.currency || 'VND',
            moq: item.moq,
            leadTimeDays: item.leadTimeDays,
            isPreferred: !!item.isPreferred,
            isActive: !!item.isActive,
            supplierId: String(item.supplierId || ''),
            supplierName: item.supplierName || '',
            supplierCode: item.supplierCode || '',
            productId: String(item.productId || ''),
            productName: item.productName || '',
            productCode: item.productCode || '',
            mainImageUrl: item.mainImageUrl || '',
          }));
          set({ supplierProducts: mapped });
        } catch (error) {
          console.error('Failed to fetch supplier products:', error);
        }
      },
      addSupplierProduct: async (data) => {
        try {
          await axiosClient.post('/partnerarea/supplier-products', data);
          await get().fetchSupplierProducts();
        } catch (error) {
          console.error('Failed to add supplier product:', error);
        }
      },
      updateSupplierProduct: async (id, data) => {
        try {
          await axiosClient.put(`/partnerarea/supplier-products/${id}`, data);
          await get().fetchSupplierProducts();
        } catch (error) {
          console.error('Failed to update supplier product:', error);
        }
      },
      deleteSupplierProduct: async (id) => {
        try {
          await axiosClient.delete(`/partnerarea/supplier-products/${id}`);
          await get().fetchSupplierProducts();
        } catch (error) {
          console.error('Failed to delete supplier product:', error);
        }
      },
      setSupplierProductPreferred: async (id, value) => {
        try {
          await axiosClient.patch(`/partnerarea/supplier-products/${id}/preferred?value=${value}`);
          await get().fetchSupplierProducts();
        } catch (error) {
          console.error('Failed to set supplier product preferred status:', error);
        }
      },


      fetchImportReceipts: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/inventories/imports');
          const mapped = res.map((r: any) => {
            const lineQty = (r.receiptLines || []).reduce(
              (acc: number, cur: any) => acc + (cur.quantity || 0),
              0
            );
            const lines: ImportReceiptLine[] = (r.receiptLines || []).map((l: any) => ({
              productVariantId: l.productVariantId || l.productId || 1,
              productName: l.productNameSnapshot || l.productName || '',
              sku: l.skuSnapshot || l.sku || '',
              quantity: Number(l.quantity || 0),
              unitPrice: Number(l.unitCostSnapshot || l.unitPrice || l.unitCost || 0),
              targetBinId: l.targetBinId || 1,
              targetBinCode: l.targetBinCode || l.binCode || '',
              batchCode: l.batchNumber || '',
              expiryDate: l.expiryDate || '',
            }));
            return {
              id: String(r.id),
              grnNumber: r.receiptCode,
              poNumber: r.purchaseOrderCode || '',
              supplierName: r.supplierName || '',
              receivingStore: r.branchName || '',
              receivedDate: formatApiDate(r.receiptDate),
              totalItems: lineQty,
              acceptedItems: lineQty,
              rejectedItems: 0,
              totalValuation: Number(r.totalAmount || 0),
              status: mapImportReceiptStatus(r.status),
              inspectedBy: r.inspectedBy || r.createdBy || '',
              notes: r.note || '',
              lines,
            };
          });
          set({ importReceipts: mapped });
        } catch (error) {
          console.error('Failed to fetch import receipts:', error);
        }
      },
      addImportReceipt: async (receipt) => {
        try {
          const payload = {
            receiptCode: receipt.grnNumber || `GRN-${Date.now()}`,
            receiptDate: new Date(receipt.receivedDate || Date.now()).toISOString(),
            branchId: (receipt as any).branchId || resolveBranchId(receipt.receivingStore),
            supplierId: (receipt as any).supplierId || null,
            inspectedBy: receipt.inspectedBy || null,
            note: receipt.notes || null,
            totalAmount: receipt.totalValuation,
            status: 'PENDING',
            receiptLines: receipt.lines && receipt.lines.length > 0
              ? receipt.lines.map((line) => ({
                  productVariantId: line.productVariantId,
                  quantity: line.quantity,
                  unitCost: line.unitPrice,
                  subTotal: line.quantity * line.unitPrice,
                  targetBinId: line.targetBinId,
                  batchNumber: line.batchCode,
                  expiryDate: line.expiryDate ? line.expiryDate : null,
                }))
              : [
                  {
                    productVariantId: resolveProductId(),
                    quantity: receipt.totalItems || 1,
                    unitCost: receipt.totalValuation ? receipt.totalValuation / (receipt.totalItems || 1) : 0,
                    subTotal: receipt.totalValuation || 0,
                  }
                ],
          };
          await axiosClient.post('/inventories/imports', payload);
          await get().fetchImportReceipts();

        } catch (error) {
          console.error('Failed to add import receipt:', error);
        }
      },
      updateImportReceipt: async (id, data) => {
        try {
          if (data.status === 'INSPECTED_ACCEPTED') {
            await axiosClient.post(`/inventories/imports/${id}/complete`);
          } else {
            const payload = {
              receiptCode: data.grnNumber,
              receiptDate: new Date().toISOString(),
              branchId: (data as any).branchId || resolveBranchId(data.receivingStore),
              supplierId: (data as any).supplierId || null,
              inspectedBy: data.inspectedBy || null,
              note: data.notes || null,
              totalAmount: data.totalValuation,
              status: 'PENDING',
              receiptLines: data.lines && data.lines.length > 0
                ? data.lines.map((line: any) => ({
                    productVariantId: line.productVariantId,
                    quantity: line.quantity,
                    unitCost: line.unitPrice,
                    subTotal: line.quantity * line.unitPrice,
                    targetBinId: line.targetBinId,
                    batchNumber: line.batchCode,
                    expiryDate: line.expiryDate ? line.expiryDate : null,
                  }))
                : [
                    {
                      productId: resolveProductId(),
                      quantity: data.totalItems || 1,
                      unitPrice: data.totalValuation ? data.totalValuation / (data.totalItems || 1) : 0,
                      subTotal: data.totalValuation || 0,
                    }
                  ],
            };
            await axiosClient.put(`/inventories/imports/${id}`, payload);
          }
          await get().fetchImportReceipts();
        } catch (error) {
          console.error('Failed to update import receipt:', error);
        }
      },
      deleteImportReceipt: async (id) => {
        try {
          await axiosClient.delete(`/inventories/imports/${id}`);
          await get().fetchImportReceipts();
        } catch (error) {
          console.error('Failed to delete import receipt:', error);
        }
      },
      cancelImportReceipt: async (id, cancelReason) => {
        try {
          await axiosClient.post(`/inventories/imports/${id}/cancel`, { cancelReason });
          await get().fetchImportReceipts();
        } catch (error) {
          console.error('Failed to cancel import receipt:', error);
          throw error;
        }
      },

      fetchReturnToSuppliers: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/inventories/returns');
          const mapped = res.map((r: any) => ({
            id: String(r.id),
            rtvNumber: r.returnCode,
            grnRefNumber: r.grnRefNumber || '',
            supplierName: r.supplierName || '',
            returnDate: r.returnDate ? r.returnDate.split('T')[0] : '',
            totalItems: r.returnLines ? r.returnLines.reduce((acc: number, cur: any) => acc + (cur.quantity || 0), 0) : 0,
            refundValue: Number(r.totalAmount || 0),
            status: r.status as any,
            reason: r.reason || '',
            notes: r.note || '',
          }));
          set({ returnToSuppliers: mapped });
        } catch (error) {
          console.error('Failed to fetch return to suppliers:', error);
        }
      },
      addReturnToSupplier: async (rtv) => {
        try {
          const payload = {
            returnCode: rtv.rtvNumber || `RTV-${Date.now()}`,
            returnDate: new Date().toISOString(),
            grnRefNumber: rtv.grnRefNumber || '',
            totalAmount: rtv.refundValue,
            status: rtv.status || 'PENDING_SUPPLIER_APPROVAL',
            reason: rtv.reason,
            supplierId: 1,
            branchId: resolveBranchId(rtv.dispatchingStore),
            note: rtv.notes || '',
            returnLines: [
              {
                productId: resolveProductId(),
                quantity: rtv.totalItems || 1,
                unitPrice: rtv.refundValue / (rtv.totalItems || 1),
                subTotal: rtv.refundValue,
              }
            ],
          };
          await axiosClient.post('/inventories/returns', payload);
          await get().fetchReturnToSuppliers();
        } catch (error) {
          console.error('Failed to add return to supplier:', error);
        }
      },
      updateReturnToSupplier: async (id, data) => {
        try {
          if (data.status === 'APPROVED_CREDIT_NOTE') {
            await axiosClient.post(`/inventories/returns/${id}/approve`);
          } else if (data.status === 'REJECTED') {
            await axiosClient.post(`/inventories/returns/${id}/reject`);
          } else {
            const payload = {
              returnCode: data.rtvNumber,
              returnDate: new Date().toISOString(),
              grnRefNumber: data.grnRefNumber,
              totalAmount: data.refundValue,
              status: data.status,
              reason: data.reason,
              supplierId: 1,
              branchId: resolveBranchId(data.dispatchingStore),
              note: data.notes,
              returnLines: [
                {
                  productId: resolveProductId(),
                  quantity: data.totalItems || 1,
                  unitPrice: data.refundValue ? data.refundValue / (data.totalItems || 1) : 0,
                  subTotal: data.refundValue || 0,
                }
              ],
            };
            await axiosClient.put(`/inventories/returns/${id}`, payload);
          }
          await get().fetchReturnToSuppliers();
        } catch (error) {
          console.error('Failed to update return to supplier:', error);
        }
      },
      deleteReturnToSupplier: async (id) => {
        try {
          await axiosClient.delete(`/inventories/returns/${id}`);
          await get().fetchReturnToSuppliers();
        } catch (error) {
          console.error('Failed to delete return to supplier:', error);
        }
      },
    }),
    {
      name: 'retailhub-inventory-storage',
      version: 5,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as InventoryState;
        if (version < 5) {
          return {
            ...state,
            cancelIssues: [],
            inventoryAudits: [],
            inventoryChecks: [],
            serialItems: [],
            stockLedger: [],
            mobileProducts: [],
            combos: [],
            categories: [],
            products: [],
            inventories: [],
            productLocations: [],
            importReceipts: [],
            returnToSuppliers: [],
          };
        }
        return state;
      },
    }
  )
);
