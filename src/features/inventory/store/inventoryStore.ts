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
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED' | 'DISCREPANCY_HELD';
  logisticsPartner: string;
  trackingRef?: string;
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
}

// ---------------------------
// Products & units
// ---------------------------
export interface ProductUnit {
  id: string;
  unitCode: string;
  conversionFactor: number;
  barcode: string;
  price: number;
}

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
  condition: string;
  capacity: number;
  branchName: string;
  status: 'HOẠT_ĐỘNG' | 'TẠM_NGƯNG';
  description?: string;
}

export interface WarehouseBinRecord {
  id: string;
  binCode: string;
  barcode: string;
  areaCode: string;
  areaName: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  status: 'EMPTY' | 'FULL';
  notes?: string;
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
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  locationBin?: string;
}

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

// ---------------------------
// STATE INTERFACE
// ---------------------------
interface InventoryState {
  categories: ProductCategory[];
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
  productLocations: ProductLocationRecord[];

  addCategory: (category: Omit<ProductCategory, 'id'>) => void;
  updateCategory: (id: string, data: Partial<ProductCategory>) => void;
  deleteCategory: (id: string) => void;

  addProductBatch: (batch: Omit<ProductBatchRecord, 'id'>) => void;
  updateProductBatch: (id: string, data: Partial<ProductBatchRecord>) => void;
  deleteProductBatch: (id: string) => void;

  addStockTransfer: (transfer: Omit<StockTransferOrder, 'id'>) => void;
  updateStockTransfer: (id: string, data: Partial<StockTransferOrder>) => void;
  deleteStockTransfer: (id: string) => void;

  addProduct: (product: Omit<ProductInventory, 'id'>) => void;
  updateProduct: (id: string, data: Partial<ProductInventory>) => void;
  deleteProduct: (id: string) => void;

  addCombo: (combo: Omit<ProductCombo, 'id'>) => void;
  updateCombo: (id: string, data: Partial<ProductCombo>) => void;
  deleteCombo: (id: string) => void;

  addCancelIssue: (issue: Omit<CancelIssueRecord, 'id'>) => Promise<void>;
  updateCancelIssue: (id: string, data: Partial<CancelIssueRecord>) => Promise<void>;
  deleteCancelIssue: (id: string) => Promise<void>;

  addInventoryAudit: (audit: Omit<InventoryAuditSession, 'id'>) => void;
  updateInventoryAudit: (id: string, data: Partial<InventoryAuditSession>) => void;
  deleteInventoryAudit: (id: string) => void;

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
  fetchProducts: () => Promise<void>;
  fetchCombos: () => Promise<void>;
  fetchProductBatches: () => Promise<void>;
  fetchStockTransfers: () => Promise<void>;
  fetchCancelIssues: () => Promise<void>;
  fetchStockLedger: () => Promise<void>;
  fetchInventories: () => Promise<void>;
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
}

// ---------------------------
// MOCK DATA SEED
// ---------------------------
const MOCK_CATEGORIES: ProductCategory[] = [
  {
    id: '1',
    code: 'CAT-ELEC',
    categoryName: 'Thiết bị Điện tử',
    department: 'Công nghệ',
    itemsCount: 1450,
    totalValuation: 325000,
    status: 'ACTIVE',
    manager: 'Marcus Vance',
    inventoryGlCode: '1561',
    cogsGlCode: '6321',
    taxClass: 'VAT_10',
  },
  {
    id: '2',
    code: 'CAT-APPA',
    categoryName: 'Thời trang & May mặc',
    parentId: '1',
    department: 'Thời trang',
    itemsCount: 4200,
    totalValuation: 180500,
    status: 'ACTIVE',
    manager: 'Sarah Jenkins',
    inventoryGlCode: '1562',
    cogsGlCode: '6322',
    taxClass: 'VAT_8',
  },
  {
    id: '3',
    code: 'CAT-SHOE',
    categoryName: 'Giày thể thao',
    parentId: '2',
    department: 'Thời trang',
    itemsCount: 890,
    totalValuation: 95000,
    status: 'ACTIVE',
    manager: 'Sarah Jenkins',
    inventoryGlCode: '1562.1',
    cogsGlCode: '6322.1',
    taxClass: 'VAT_8',
  },
];

const MOCK_PRODUCTS: ProductInventory[] = [
  {
    id: '1',
    sku: 'NK-AM24',
    name: 'Nike Air Max 2024',
    category: 'Thời trang & May mặc',
    price: 2500000,
    costPrice: 1500000,
    brand: 'Nike',
    unit: 'Đôi',
    weight: '0.45 kg',
    location: 'Kệ A1-02',
    onHand: 45,
    status: 'ACTIVE',
    lastUpdated: '2024-05-15 14:30',
    mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    barcodes: ['8934673312345', '8934673312346'],
    reorderPoint: 10,
    minStock: 5,
    maxStock: 100,
    variants: [
      { size: '40', color: 'Đỏ', skuSuffix: '-R40' },
      { size: '42', color: 'Đen', skuSuffix: '-B42' },
    ],
    galleryImages: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80',
    ],
    units: [{ id: 'u1', unitCode: 'Thùng', conversionFactor: 10, barcode: '893NKAM24BOX', price: 22000000 }],
  },
  {
    id: '2',
    sku: 'SS-S24',
    name: 'Samsung Galaxy S24',
    category: 'Thiết bị Điện tử',
    price: 22990000,
    costPrice: 18000000,
    brand: 'Samsung',
    unit: 'Cái',
    weight: '0.22 kg',
    location: 'Kệ B2-03',
    onHand: 5,
    status: 'ACTIVE',
    lastUpdated: '2024-05-16 11:20',
    mainImage: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80',
    barcodes: ['8806095041234'],
    reorderPoint: 3,
    minStock: 2,
    maxStock: 30,
    variants: [{ color: 'Tím', skuSuffix: '-VIO' }],
    galleryImages: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'],
    units: [],
  },
];

const MOCK_COMBOS: ProductCombo[] = [
  {
    id: '1',
    comboCode: 'CB-FITNESS',
    comboName: 'Fitness Starter Pack',
    comboBarcode: '8934673399999',
    comboType: 'PRE_ASSEMBLED',
    description: 'Shoes and accessories for a fresh start.',
    comboPrice: 199.99,
    status: 'ACTIVE',
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    details: [
      { id: 'cd1', sku: 'NK-AM24', productName: 'Nike Air Max 2024', quantity: 1, unitPriceAtCreation: 129.99 },
    ],
  },
];

export const MOCK_CANCEL_ISSUES: CancelIssueRecord[] = [
  {
    id: '1',
    issueCode: 'WRO-2024-001',
    sku: 'SKU-FOOD-102',
    productName: 'Artisanal Sourdough Flour 5KG',
    category: 'Grocery',
    quantity: 5,
    totalValuation: 41.0,
    reason: 'DAMAGED',
    locationHub: 'Downtown Branch',
    loggedDate: '2024-05-18',
    reportedBy: 'Nguyễn Văn Kho',
    authorizedBy: 'Michael Chang',
    proofImages: ['https://images.unsplash.com/photo-1586201375774-2817e6f5c2a0?w=400'],
    status: 'APPROVED',
    notes: 'Water damage resulting from storage humidity leak.',
  },
  {
    id: '2',
    issueCode: 'WRO-2024-002',
    sku: 'SKU-BEV-909',
    productName: 'Imported Sparkling Mineral Water',
    category: 'Beverage',
    quantity: 24,
    totalValuation: 30.0,
    reason: 'EXPIRED',
    locationHub: 'Northside Store',
    loggedDate: '2024-05-17',
    reportedBy: 'Trần Thị Lan',
    authorizedBy: 'David Ross',
    batchLotNumber: 'LOT-BEV-2023-Q4',
    expiryDate: '2024-05-01',
    proofImages: [
      'https://images.unsplash.com/photo-1548839140-5a941f8e0f0e?w=400',
      'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
    ],
    status: 'PROCESSED',
    notes: 'Batch expired on display shelves.',
  },
  {
    id: '3',
    issueCode: 'WRO-2024-003',
    sku: 'SKU-ELEC-002',
    productName: 'Bluetooth Barcode Scanner',
    category: 'Hardware',
    quantity: 1,
    totalValuation: 120.0,
    reason: 'LOST',
    locationHub: 'Central Warehouse',
    loggedDate: '2024-05-15',
    reportedBy: 'Lê Hoàng Nam',
    authorizedBy: 'Super Admin',
    proofImages: [],
    status: 'PENDING_APPROVAL',
    notes: 'Missing during physical inventory audit count.',
  },
];

export const MOCK_AUDIT_LINE_ITEMS: AuditLineItem[] = [
  { sku: 'SV-001', name: 'Sữa Vinamilk 1L', systemQty: 120, actualQty: 118, variance: -2, unitCost: 29000, varianceReason: 'DAMAGED' },
  { sku: 'BH-002', name: 'Bia Heineken 330ml', systemQty: 200, actualQty: 200, variance: 0, unitCost: 14000 },
  { sku: 'GS-003', name: 'Gạo ST25 5kg', systemQty: 45, actualQty: 42, variance: -3, unitCost: 155000, varianceReason: 'THEFT' },
  { sku: 'NM-004', name: 'Nước mắm Chinsu 500ml', systemQty: 88, actualQty: 90, variance: 2, unitCost: 22000, varianceReason: 'INPUT_ERROR' },
  { sku: 'MG-005', name: 'Mì gói Hảo Hảo', systemQty: 500, actualQty: 488, variance: -12, unitCost: 5500, varianceReason: 'COUNT_ERROR' },
  { sku: 'CF-009', name: 'Cà phê G7 3in1', systemQty: 60, actualQty: 60, variance: 0, unitCost: 52000 },
];

export const INITIAL_INVENTORY_AUDITS: InventoryAuditSession[] = [
  {
    id: '1',
    auditNumber: 'KK-2024-501',
    storeLocation: 'CH Quận 1 – Trung tâm',
    scheduledDate: '2024-05-15',
    executionDate: '2024-05-16',
    type: 'FULL_STORE',
    totalSkusCounted: 4500,
    discrepancySkusCount: 12,
    netValuationVariance: -350000,
    status: 'RECONCILED_CLOSED',
    leadAuditor: 'Nguyễn Minh Châu',
    isBlindCount: false,
    approvedBy: 'Giám đốc Kho - Phạm Văn Đức',
    lineItems: MOCK_AUDIT_LINE_ITEMS,
    notes: 'Kiểm kê toàn bộ kho tháng 5.',
  },
  {
    id: '2',
    auditNumber: 'KK-2024-502',
    storeLocation: 'Kho Trung tâm phân phối',
    scheduledDate: '2024-05-17',
    executionDate: '2024-05-17',
    type: 'CYCLE_COUNT',
    totalSkusCounted: 1850,
    discrepancySkusCount: 15,
    netValuationVariance: -123000,
    status: 'UNDER_REVIEW',
    leadAuditor: 'Trần Đức Anh',
    isBlindCount: true,
    lineItems: MOCK_AUDIT_LINE_ITEMS,
    notes: 'Kiểm định kỳ khu hàng giá trị cao.',
  },
  {
    id: '3',
    auditNumber: 'KK-2024-503',
    storeLocation: 'CH Tân Bình',
    scheduledDate: '2024-05-18',
    type: 'CATEGORY_SPECIFIC',
    totalSkusCounted: 350,
    discrepancySkusCount: 0,
    netValuationVariance: 0,
    status: 'IN_PROGRESS',
    leadAuditor: 'Lê Thị Hương',
    isBlindCount: true,
    notes: 'Kiểm danh mục đồ uống.',
  },
  {
    id: '4',
    auditNumber: 'KK-2024-504',
    storeLocation: 'CH Quận 7',
    scheduledDate: '2024-05-20',
    type: 'DISCREPANCY_SPOT_CHECK',
    totalSkusCounted: 0,
    discrepancySkusCount: 0,
    netValuationVariance: 0,
    status: 'SCHEDULED',
    leadAuditor: 'Phạm Văn Bình',
    isBlindCount: false,
    notes: 'Kiểm tra đột xuất sau cảnh báo lệch số liệu từ POS.',
  },
];

export const MOCK_SERIALS: SerialItemRecord[] = [
  {
    id: '1',
    serialNumber: 'SN-RH99-8012',
    sku: 'SKU-ELEC-001',
    productName: 'RetailHub Pro POS Terminal',
    category: 'Hardware',
    unitCost: 850.0,
    status: 'IN_STOCK',
    currentLocation: 'Main Flagship / HQ',
    receivedDate: '2024-05-10',
    warrantyExpiry: '2027-05-10',
    vendorName: 'RetailHub Technologies',
    poReference: 'PO-2024-0442',
    macAddress: '00:1A:2B:3C:4D:5E',
    notes: 'Pristine unit in sealed factory packaging.',
  },
  {
    id: '2',
    serialNumber: 'SN-RH99-8015',
    sku: 'SKU-ELEC-001',
    productName: 'RetailHub Pro POS Terminal',
    category: 'Hardware',
    unitCost: 850.0,
    status: 'SOLD',
    currentLocation: 'Customer Site - Apex Retail',
    receivedDate: '2024-04-15',
    warrantyExpiry: '2027-04-15',
    vendorName: 'RetailHub Technologies',
    poReference: 'PO-2024-0388',
    macAddress: '00:1A:2B:3C:4D:61',
    associatedInvoice: 'INV-2024-9012',
    associatedCustomer: 'Apex Retail Group',
  },
  {
    id: '3',
    serialNumber: 'SN-BCS2-1092',
    sku: 'SKU-ELEC-002',
    productName: 'Bluetooth Barcode Scanner',
    category: 'Peripherals',
    unitCost: 120.0,
    status: 'RMA_REPAIR',
    currentLocation: 'Vendor Repair Depot',
    receivedDate: '2024-03-01',
    warrantyExpiry: '2025-03-01',
    vendorName: 'ScanTech Co.',
    poReference: 'PO-2024-0210',
    associatedInvoice: 'INV-2024-8110',
    associatedCustomer: 'Downtown Bistro',
    notes: 'Laser alignment error reported.',
  },
  {
    id: '4',
    serialNumber: 'SN-IP15-7788',
    sku: 'SKU-PHONE-015',
    productName: 'iPhone 15 Pro 256GB',
    category: 'Mobile',
    unitCost: 999.0,
    status: 'IN_STOCK',
    currentLocation: 'Central Warehouse',
    receivedDate: '2024-05-16',
    warrantyExpiry: '2026-05-16',
    vendorName: 'Apple Authorized Distributor',
    poReference: 'PO-2024-0512',
    imei1: '356938035643809',
    imei2: '356938035643817',
  },
];

export const MOCK_LEDGER: StockLedgerEntry[] = [
  {
    id: '1',
    transactionCode: 'TRX-2024-901',
    sku: 'SKU-ELEC-001',
    productName: 'RetailHub Pro POS Terminal',
    type: 'STOCK_IN',
    quantityChange: 25,
    runningBalance: 125,
    unitPrice: 850.0,
    totalValuation: 21250.0,
    timestamp: '2024-05-17 14:30',
    location: 'Main Flagship / HQ',
    batchLotRef: 'LOT-ELEC-2024-Q2',
    glPostingId: 'JE-GL-2024-8821',
    loggedBy: 'Michael Chang',
    referenceDoc: 'GRN-2024-301',
    notes: 'Inbound PO delivery successfully verified and restocked.',
  },
  {
    id: '2',
    transactionCode: 'TRX-2024-902',
    sku: 'SKU-APPA-204',
    productName: 'Staff Uniform Organic Tee (L)',
    type: 'STOCK_OUT',
    quantityChange: -5,
    runningBalance: 45,
    unitPrice: 25.0,
    totalValuation: -125.0,
    timestamp: '2024-05-17 11:15',
    location: 'Downtown Branch',
    glPostingId: 'JE-GL-2024-8822',
    loggedBy: 'Sarah Jenkins',
    referenceDoc: 'REQ-2024-118',
    notes: 'Internal store requisition for newly onboarded retail staff.',
  },
  {
    id: '3',
    transactionCode: 'TRX-2024-903',
    sku: 'SKU-PACK-990',
    productName: 'Premium Paper Shopping Bags',
    type: 'ADJUSTMENT_DOWN',
    quantityChange: -150,
    runningBalance: 4850,
    unitPrice: 0.82,
    totalValuation: -123.0,
    timestamp: '2024-05-16 09:00',
    location: 'Central Warehouse',
    batchLotRef: 'LOT-PACK-2023-12',
    glPostingId: 'JE-GL-2024-8815',
    loggedBy: 'David Ross',
    referenceDoc: 'ADJ-2024-055',
    notes: 'Stock reconciliation adjustment following transit water damage.',
  },
  {
    id: '4',
    transactionCode: 'TRX-2024-904',
    sku: 'SKU-ELEC-002',
    productName: 'Bluetooth Barcode Scanner',
    type: 'TRANSFER',
    quantityChange: -1,
    runningBalance: 80,
    unitPrice: 120.0,
    totalValuation: -120.0,
    timestamp: '2024-05-15 16:45',
    location: 'Northside Store',
    fromLocationId: 'WH-CENTRAL',
    toLocationId: 'STORE-NORTHSIDE',
    glPostingId: 'JE-GL-2024-8810',
    loggedBy: 'Super Admin',
    referenceDoc: 'TRF-2024-088',
    notes: 'Inter-store transfer for POS deployment.',
  },
];

const MOCK_MOBILE_PRODUCTS: MobileProduct[] = [
  {
    id: '1',
    sku: 'NK-AM24',
    name: 'Nike Air Max 24',
    category: 'Footwear',
    price: 129.99,
    costPrice: 80.0,
    brand: 'Nike',
    unit: 'Đôi',
    weight: '0.45 kg',
    location: 'Kệ A1-02',
    onHand: 45,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
    barcodes: ['8934673312345'],
    reorderPoint: 10,
    minStock: 5,
    maxStock: 100,
    variants: [
      { size: '40', color: 'Đỏ' },
      { size: '42', color: 'Đen' },
    ],
  },
  {
    id: '2',
    sku: 'AD-UB24',
    name: 'Adidas Ultraboost',
    category: 'Footwear',
    price: 159.99,
    costPrice: 95.0,
    brand: 'Adidas',
    unit: 'Đôi',
    weight: '0.38 kg',
    location: 'Kệ A2-05',
    onHand: 12,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
    barcodes: ['8934673312400'],
    reorderPoint: 8,
    minStock: 4,
    maxStock: 80,
    variants: [{ size: '41', color: 'Trắng' }],
  },
  {
    id: '3',
    sku: 'AP-APRO',
    name: 'AirPods Pro 2',
    category: 'Electronics',
    price: 249.0,
    costPrice: 150.0,
    brand: 'Apple',
    unit: 'Chiếc',
    weight: '0.05 kg',
    location: 'Kệ B1-01',
    onHand: 0,
    status: 'INACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1588449668338-d13417f16af1?w=400&q=80',
    barcodes: ['0194253401234'],
    reorderPoint: 5,
    minStock: 3,
    maxStock: 50,
    variants: [],
  },
  {
    id: '4',
    sku: 'SS-S24',
    name: 'Samsung S24 Ultra',
    category: 'Electronics',
    price: 899.0,
    costPrice: 600.0,
    brand: 'Samsung',
    unit: 'Chiếc',
    weight: '0.22 kg',
    location: 'Kệ B2-03',
    onHand: 5,
    status: 'ACTIVE',
    imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80',
    barcodes: ['8806095041234'],
    reorderPoint: 3,
    minStock: 2,
    maxStock: 25,
    variants: [{ color: 'Tím Titan' }],
  },
];

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
      productBatches: [],
      stockTransfers: [],
      products: [],
      combos: [],
      cancelIssues: [],
      inventoryAudits: INITIAL_INVENTORY_AUDITS,
      inventoryChecks: [],
      serialItems: [],
      stockLedger: [],
      mobileProducts: [],
      unitsList: [],
      unitsIncludeDeleted: false,
      warehouseZones: [],
      warehouseBins: [],
      inventories: [],
      productLocations: [],

      fetchCategories: async () => {
        try {
          const data = await axiosClient.get<any, any[]>('/categories');
          const mapped = data.map((item: any) => ({
            id: String(item.id),
            code: item.code || `CAT-${item.id}`,
            categoryName: item.categoryName,
            parentId: item.parentId ? String(item.parentId) : undefined,
            department: item.department || 'Chung',
            itemsCount: item.productCount || 0,
            totalValuation: 0,
            status: (item.isActive ? 'ACTIVE' : 'ARCHIVED') as 'ACTIVE' | 'ARCHIVED',
            description: item.description,
            manager: item.manager || 'N/A',
            inventoryGlCode: item.inventoryGlCode,
            cogsGlCode: item.cogsGlCode,
            taxClass: item.taxClass,
          }));
          set({ categories: mapped });
        } catch (error) {
          console.error('Failed to fetch categories:', error);
        }
      },

      fetchProducts: async () => {
        try {
          const pageData = await axiosClient.get<any, any>('/products?size=10000');
          const content = pageData.content || [];
          const safeParse = (str: string, fallback: any = []) => {
            if (!str) return fallback;
            try { return JSON.parse(str); } catch (e) { return fallback; }
          };
          const mapped = content.map((item: any) => ({
            id: String(item.id),
            sku: item.productCode,
            name: item.name,
            category: item.categoryName || 'Chung',
            price: Number(item.basePrice),
            costPrice: Number(item.costPrice || 0),
            brand: item.brand || 'N/A',
            unit: item.baseUnitName || 'Cái',
            weight: item.weight ? `${item.weight} kg` : '0 kg',
            location: 'Kệ chính',
            onHand: item.onHand || 0,
            status: (item.isActive ? 'ACTIVE' : 'INACTIVE') as 'ACTIVE' | 'INACTIVE',
            description: item.description,
            mainImage: item.mainImageUrl,
            galleryImages: safeParse(item.galleryImages),
            barcodes: item.barcode ? [item.barcode] : [],
            reorderPoint: Number(item.reorderPoint || 0),
            minStock: Number(item.minStock || 0),
            maxStock: Number(item.maxStock || 0),
            variants: safeParse(item.variants),
            units: item.units ? item.units.map((u: any) => ({
              id: String(u.id),
              unitCode: u.unitName || 'Cái',
              conversionFactor: Number(u.conversionValue || 1),
              barcode: u.barcode || '',
              price: Number(u.price || 0),
            })) : [],
          }));
          set({ products: mapped });
        } catch (error) {
          console.error('Failed to fetch products:', error);
        }
      },

      fetchCombos: async () => {
        try {
          const pageData = await axiosClient.get<any, any>('/combos?size=10000');
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
              dispatchDate: item.transferDate || item.createdAt || '',
              estArrivalDate: item.updatedAt || '',
              totalUnits,
              totalValuation: 0,
              status: (item.status || 'PENDING_APPROVAL') as 'DRAFT' | 'PENDING_APPROVAL' | 'IN_TRANSIT' | 'COMPLETED' | 'REJECTED' | 'DISCREPANCY_HELD',
              logisticsPartner: 'GHTK',
              requestedBy: item.createdBy || 'System',
              notes: '',
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
          const mapped = data.map((item: any) => ({
            id: String(item.id),
            transactionCode: item.referenceDocument || `TRX-${item.id}`,
            sku: item.productCode || '',
            productName: item.productName || '',
            type: (item.transactionType || 'STOCK_IN') as any,
            quantityChange: Number(item.quantityChange || 0),
            runningBalance: Number(item.runningBalance || 0),
            unitPrice: 0,
            totalValuation: 0,
            timestamp: item.transactionDate || '',
            location: item.branchName || '',
            referenceDoc: item.referenceDocument || '',
            notes: item.notes,
            loggedBy: item.createdBy || 'System',
          }));
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
          };
          await axiosClient.post('/products', payload);
          get().fetchProducts();
        } catch (error) {
          console.error('Failed to add product:', error);
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
          get().fetchProducts();
        } catch (error) {
          console.error('Failed to update product:', error);
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
            };
          });
          const payload = {
            comboCode: combo.comboCode,
            comboName: combo.comboName,
            price: combo.comboPrice,
            isActive: combo.status === 'ACTIVE',
            details,
          };
          await axiosClient.post('/combos', payload);
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
            };
          });
          const payload = {
            comboCode: data.comboCode,
            comboName: data.comboName,
            price: data.comboPrice,
            isActive: data.status === undefined ? undefined : data.status === 'ACTIVE',
            details,
          };
          await axiosClient.put(`/combos/${id}`, payload);
          get().fetchCombos();
        } catch (error) {
          console.error('Failed to update combo:', error);
        }
      },
      deleteCombo: async (id) => {
        try {
          await axiosClient.delete(`/combos/${id}`);
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
            await axiosClient.put(`/inventories/cancel-issues/${masterId}/approve`);
          } else {
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
          }
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
          const mapped: InventoryCheckRecord[] = data.map((item: any) => ({
            id: String(item.id),
            checkCode: item.checkCode || `CHK-${item.id}`,
            branchId: String(item.branchId || ''),
            branchName: item.branchName || 'Chi nhánh',
            checkDate: item.checkDate ? item.checkDate.split('T')[0] : '',
            status: (() => {
              const s = (item.status || '').toUpperCase();
              if (s === 'IN_PROGRESS') return 'IN_PROGRESS';
              if (s === 'COMPLETED') return 'COMPLETED';
              if (s === 'CANCELLED') return 'CANCELLED';
              return 'DRAFT';
            })() as InventoryCheckRecord['status'],
            totalItems: Number(item.totalItems || 0),
            discrepancyCount: Number(item.discrepancyCount || 0),
            netVariance: Number(item.netVariance || 0),
            checkedBy: item.createdBy || item.checkedBy || '',
            notes: item.notes || '',
          }));
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
      startInventoryCheck: async (id) => {
        try {
          await axiosClient.put(`/inventories/checks/${id}/start`);
          await get().fetchInventoryChecks();
        } catch (error) {
          console.error('Failed to start inventory check:', error);
          throw error;
        }
      },
      completeInventoryCheck: async (id) => {
        try {
          await axiosClient.put(`/inventories/checks/${id}/complete`);
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
            quantityOnHand: Number(item.quantityOnHand || 0),
            quantityReserved: Number(item.quantityReserved || 0),
            quantityAvailable: Number(item.quantityAvailable || 0),
            locationBin: item.locationBin || '',
          }));
          set({ inventories: mapped });
        } catch (error) {
          console.error('Failed to fetch inventories:', error);
        }
      },

      fetchProductLocations: async (productId?: number, binId?: number) => {
        try {
          const params = new URLSearchParams();
          if (productId) params.append('productId', String(productId));
          if (binId) params.append('binId', String(binId));
          const url = `/product-locations${params.toString() ? `?${params.toString()}` : ''}`;
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
          await axiosClient.post('/product-locations/assign', payload);
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
          const res = await axiosClient.get<any, any[]>('/warehouse/zones');
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
          await axiosClient.post('/warehouse/zones', payload);
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
          await axiosClient.put(`/warehouse/zones/${id}`, payload);
          await get().fetchWarehouseZones();
        } catch (error) {
          console.error('Failed to update warehouse zone:', error);
        }
      },
      deleteWarehouseZone: async (id) => {
        try {
          await axiosClient.delete(`/warehouse/zones/${id}`);
          await get().fetchWarehouseZones();
        } catch (error) {
          console.error('Failed to delete warehouse zone:', error);
        }
      },

      fetchWarehouseBins: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/warehouse/bins');
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
          await axiosClient.post('/warehouse/bins', payload);
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
          await axiosClient.put(`/warehouse/bins/${id}`, payload);
          await get().fetchWarehouseBins();
        } catch (error) {
          console.error('Failed to update warehouse bin:', error);
        }
      },
      deleteWarehouseBin: async (id) => {
        try {
          await axiosClient.delete(`/warehouse/bins/${id}`);
          await get().fetchWarehouseBins();
        } catch (error) {
          console.error('Failed to delete warehouse bin:', error);
        }
      },
    }),
    {
      name: 'retailhub-inventory-storage',
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as InventoryState;
        if (version < 4) {
          return {
            ...state,
            cancelIssues: [],
            inventoryAudits: INITIAL_INVENTORY_AUDITS,
            inventoryChecks: [],
            serialItems: [],
            stockLedger: [],
            mobileProducts: [],
            combos: [],
            categories: [],
            products: [],
            inventories: [],
            productLocations: [],
          };
        }
        return state;
      },
    }
  )
);
