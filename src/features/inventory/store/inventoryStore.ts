import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------
// 1. ADVANCED INVENTORY TYPES
// ---------------------------
export interface ProductCategory {
  id: string;
  code: string;
  categoryName: string;
  department: string;
  itemsCount: number;
  totalValuation: number;
  status: 'ACTIVE' | 'ARCHIVED';
  description?: string;
  manager: string;
}

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
// 2. PRODUCT & PRODUCT UNIT
// ---------------------------
export interface ProductUnit {
  id: string;
  unitCode: string; // e.g., PCS, BOX, THUNG
  conversionFactor: number; // e.g., 1 BOX = 12 PCS -> factor = 12
  barcode: string; // Specific barcode for this unit packaging
  price: number; // Specific price for this unit
}

export interface ProductInventory {
  id: string;
  sku: string;
  name: string;
  category: string; // Reference to ProductCategory.categoryName
  price: number; // Base retail price
  costPrice: number; // Base cost price
  brand: string;
  unit: string; // Base Unit Code (e.g., PCS)
  weight: string;
  location: string;
  onHand: number;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
  lastUpdated?: string;
  mainImage?: string;
  galleryImages?: string[];
  units: ProductUnit[]; // Nested mapping of alternative units
}

// ---------------------------
// 3. COMBO & COMBO DETAIL
// ---------------------------
export interface ComboDetailItem {
  id: string;
  sku: string; // Reference to ProductInventory.sku
  productName: string;
  quantity: number; // Quantity of this SKU in the combo
  unitPriceAtCreation: number; 
}

export interface ProductCombo {
  id: string;
  comboCode: string;
  comboName: string;
  description: string;
  comboPrice: number; // The target selling price for the whole combo
  status: 'ACTIVE' | 'INACTIVE';
  validFrom: string;
  validUntil: string;
  details: ComboDetailItem[]; // Elements of this combo
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
  
  // Category Actions
  addCategory: (category: Omit<ProductCategory, 'id'>) => void;
  updateCategory: (id: string, data: Partial<ProductCategory>) => void;
  deleteCategory: (id: string) => void;

  // Batch Actions
  addProductBatch: (batch: Omit<ProductBatchRecord, 'id'>) => void;
  updateProductBatch: (id: string, data: Partial<ProductBatchRecord>) => void;
  deleteProductBatch: (id: string) => void;

  // Transfer Actions
  addStockTransfer: (transfer: Omit<StockTransferOrder, 'id'>) => void;
  updateStockTransfer: (id: string, data: Partial<StockTransferOrder>) => void;
  deleteStockTransfer: (id: string) => void;

  // Product Actions
  addProduct: (product: Omit<ProductInventory, 'id'>) => void;
  updateProduct: (id: string, data: Partial<ProductInventory>) => void;
  deleteProduct: (id: string) => void;

  // Combo Actions
  addCombo: (combo: Omit<ProductCombo, 'id'>) => void;
  updateCombo: (id: string, data: Partial<ProductCombo>) => void;
  deleteCombo: (id: string) => void;
}

// ---------------------------
// MOCK DATA SEED
// ---------------------------
const MOCK_CATEGORIES: ProductCategory[] = [
  { id: '1', code: 'CAT-ELEC', categoryName: 'Thiết bị Điện tử', department: 'Công nghệ', itemsCount: 1450, totalValuation: 325000, status: 'ACTIVE', manager: 'Marcus Vance' },
  { id: '2', code: 'CAT-APPA', categoryName: 'Thời trang & May mặc', department: 'Thời trang', itemsCount: 4200, totalValuation: 180500, status: 'ACTIVE', manager: 'Sarah Jenkins' }
];

const MOCK_PRODUCTS: ProductInventory[] = [
  { 
    id: '1', sku: 'NK-AM24', name: 'Nike Air Max 2024', category: 'Thời trang & May mặc', price: 2500000, costPrice: 1500000, brand: 'Nike', unit: 'Đôi', weight: '0.45 kg', location: 'Kệ A1-02', onHand: 45, status: 'ACTIVE', lastUpdated: '2024-05-15 14:30', mainImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80', 
    galleryImages: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&q=80',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80'
    ],
    units: [
      { id: 'u1', unitCode: 'Thùng', conversionFactor: 10, barcode: '893NKAM24BOX', price: 22000000 }
    ] 
  },
  { 
    id: '2', sku: 'SS-S24', name: 'Samsung Galaxy S24', category: 'Thiết bị Điện tử', price: 22990000, costPrice: 18000000, brand: 'Samsung', unit: 'Cái', weight: '0.22 kg', location: 'Kệ B2-03', onHand: 5, status: 'ACTIVE', lastUpdated: '2024-05-16 11:20', mainImage: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80'
    ],
    units: [] 
  }
];

const MOCK_COMBOS: ProductCombo[] = [
  {
    id: '1',
    comboCode: 'CB-FITNESS',
    comboName: 'Fitness Starter Pack',
    description: 'Shoes and accessories for a fresh start.',
    comboPrice: 199.99,
    status: 'ACTIVE',
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    details: [
      { id: 'cd1', sku: 'NK-AM24', productName: 'Nike Air Max 2024', quantity: 1, unitPriceAtCreation: 129.99 }
    ]
  }
];

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      categories: MOCK_CATEGORIES,
      productBatches: [],
      stockTransfers: [],
      products: MOCK_PRODUCTS,
      combos: MOCK_COMBOS,

      // Category Actions
      addCategory: (category) => set((state) => ({ categories: [{ id: Date.now().toString(), ...category }, ...state.categories] })),
      updateCategory: (id, data) => set((state) => ({ categories: state.categories.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCategory: (id) => set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),

      // Batch Actions
      addProductBatch: (batch) => set((state) => ({ productBatches: [{ id: Date.now().toString(), ...batch }, ...state.productBatches] })),
      updateProductBatch: (id, data) => set((state) => ({ productBatches: state.productBatches.map((b) => (b.id === id ? { ...b, ...data } : b)) })),
      deleteProductBatch: (id) => set((state) => ({ productBatches: state.productBatches.filter((b) => b.id !== id) })),

      // Transfer Actions
      addStockTransfer: (transfer) => set((state) => ({ stockTransfers: [{ id: Date.now().toString(), ...transfer }, ...state.stockTransfers] })),
      updateStockTransfer: (id, data) => set((state) => ({ stockTransfers: state.stockTransfers.map((t) => (t.id === id ? { ...t, ...data } : t)) })),
      deleteStockTransfer: (id) => set((state) => ({ stockTransfers: state.stockTransfers.filter((t) => t.id !== id) })),

      // Product Actions
      addProduct: (product) => set((state) => ({ products: [{ id: Date.now().toString(), ...product }, ...state.products] })),
      updateProduct: (id, data) => set((state) => ({ products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)) })),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

      // Combo Actions
      addCombo: (combo) => set((state) => ({ combos: [{ id: Date.now().toString(), ...combo }, ...state.combos] })),
      updateCombo: (id, data) => set((state) => ({ combos: state.combos.map((c) => (c.id === id ? { ...c, ...data } : c)) })),
      deleteCombo: (id) => set((state) => ({ combos: state.combos.filter((c) => c.id !== id) })),
    }),
    {
      name: 'retailhub-inventory-storage',
    }
  )
);
