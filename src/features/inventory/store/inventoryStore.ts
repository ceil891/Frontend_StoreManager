import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  serialItems: SerialItemRecord[];
  stockLedger: StockLedgerEntry[];
  mobileProducts: MobileProduct[];

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

  addCancelIssue: (issue: Omit<CancelIssueRecord, 'id'>) => void;
  updateCancelIssue: (id: string, data: Partial<CancelIssueRecord>) => void;

  addInventoryAudit: (audit: Omit<InventoryAuditSession, 'id'>) => void;
  updateInventoryAudit: (id: string, data: Partial<InventoryAuditSession>) => void;
  deleteInventoryAudit: (id: string) => void;

  addSerialItem: (item: Omit<SerialItemRecord, 'id'>) => void;
  updateSerialItem: (id: string, data: Partial<SerialItemRecord>) => void;

  addMobileProduct: (product: Omit<MobileProduct, 'id'>) => void;
  updateMobileProduct: (id: string, data: Partial<MobileProduct>) => void;
  deleteMobileProduct: (id: string) => void;
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
    (set) => ({
      categories: MOCK_CATEGORIES,
      productBatches: [],
      stockTransfers: [],
      products: MOCK_PRODUCTS,
      combos: MOCK_COMBOS,
      cancelIssues: MOCK_CANCEL_ISSUES,
      inventoryAudits: INITIAL_INVENTORY_AUDITS,
      serialItems: MOCK_SERIALS,
      stockLedger: MOCK_LEDGER,
      mobileProducts: MOCK_MOBILE_PRODUCTS,

      addCategory: (category) =>
        set((state) => ({ categories: [{ id: Date.now().toString(), ...category }, ...state.categories] })),
      updateCategory: (id, data) =>
        set((state) => ({ categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCategory: (id) =>
        set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),

      addProductBatch: (batch) =>
        set((state) => ({ productBatches: [{ id: Date.now().toString(), ...batch }, ...state.productBatches] })),
      updateProductBatch: (id, data) =>
        set((state) => ({ productBatches: state.productBatches.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
      deleteProductBatch: (id) =>
        set((state) => ({ productBatches: state.productBatches.filter((b) => b.id !== id) })),

      addStockTransfer: (transfer) =>
        set((state) => ({ stockTransfers: [{ id: Date.now().toString(), ...transfer }, ...state.stockTransfers] })),
      updateStockTransfer: (id, data) =>
        set((state) => ({ stockTransfers: state.stockTransfers.map((t) => (t.id === id ? { ...t, ...data } : t)) })),
      deleteStockTransfer: (id) =>
        set((state) => ({ stockTransfers: state.stockTransfers.filter((t) => t.id !== id) })),

      addProduct: (product) =>
        set((state) => ({ products: [{ id: Date.now().toString(), ...product }, ...state.products] })),
      updateProduct: (id, data) =>
        set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

      addCombo: (combo) =>
        set((state) => ({ combos: [{ id: Date.now().toString(), ...combo }, ...state.combos] })),
      updateCombo: (id, data) =>
        set((state) => ({ combos: state.combos.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCombo: (id) =>
        set((state) => ({ combos: state.combos.filter((c) => c.id !== id) })),

      addCancelIssue: (issue) =>
        set((state) => ({ cancelIssues: [{ id: Date.now().toString(), ...issue }, ...state.cancelIssues] })),
      updateCancelIssue: (id, data) =>
        set((state) => ({ cancelIssues: state.cancelIssues.map((i) => (i.id === id ? { ...i, ...data } : i)) })),

      addInventoryAudit: (audit) =>
        set((state) => ({ inventoryAudits: [{ id: Date.now().toString(), ...audit }, ...state.inventoryAudits] })),
      updateInventoryAudit: (id, data) =>
        set((state) => ({
          inventoryAudits: state.inventoryAudits.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      deleteInventoryAudit: (id) =>
        set((state) => ({ inventoryAudits: state.inventoryAudits.filter((a) => a.id !== id) })),

      addSerialItem: (item) =>
        set((state) => ({ serialItems: [{ id: Date.now().toString(), ...item }, ...state.serialItems] })),
      updateSerialItem: (id, data) =>
        set((state) => ({ serialItems: state.serialItems.map((s) => (s.id === id ? { ...s, ...data } : s)) })),

      addMobileProduct: (product) =>
        set((state) => ({ mobileProducts: [{ id: Date.now().toString(), ...product }, ...state.mobileProducts] })),
      updateMobileProduct: (id, data) =>
        set((state) => ({
          mobileProducts: state.mobileProducts.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
      deleteMobileProduct: (id) =>
        set((state) => ({ mobileProducts: state.mobileProducts.filter((p) => p.id !== id) })),
    }),
    {
      name: 'retailhub-inventory-storage',
      version: 2,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as InventoryState;
        if (version < 2) {
          return {
            ...state,
            cancelIssues: MOCK_CANCEL_ISSUES,
            inventoryAudits: INITIAL_INVENTORY_AUDITS,
            serialItems: MOCK_SERIALS,
            stockLedger: MOCK_LEDGER,
            mobileProducts: MOCK_MOBILE_PRODUCTS,
            combos: MOCK_COMBOS,
            categories: MOCK_CATEGORIES,
            products: MOCK_PRODUCTS,
          };
        }
        return state;
      },
    }
  )
);
