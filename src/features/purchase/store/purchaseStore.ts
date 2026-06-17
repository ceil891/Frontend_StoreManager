import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';

const resolveBranchId = (name?: string): number => {
  if (!name) return 1;
  const lower = name.toLowerCase();
  if (lower.includes('quận 2') || lower.includes('q2') || lower.includes('cn2')) return 2;
  if (lower.includes('quận 3') || lower.includes('q3') || lower.includes('cn3')) return 3;
  return 1;
};

const resolveProductId = (): number => {
  const products = useInventoryStore.getState().products;
  return products.length > 0 ? Number(products[0].id) : 1;
};

export interface SupplierRecord {
  id: string;
  code: string;
  supplierName: string;
  category: 'ELECTRONICS' | 'APPAREL' | 'FOOD_BEVERAGE' | 'HARDWARE' | 'PACKAGING' | 'GENERAL';
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  rating: number; // 1-5
  leadTimeDays: number;
  paymentTerms: string;
  activeOrdersCount: number;
  status: 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';
  notes?: string;
}

export interface PurchaseOrderItem {
  id: string;
  poNumber: string;
  supplierName: string;
  destinationStore: string;
  orderDate: string;
  estDeliveryDate: string;
  totalCost: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'PARTIAL_ADVANCE' | 'PAID';
  orderedBy: string;
  itemsCount: number;
  notes?: string;
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

interface PurchaseState {
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrderItem[];
  importReceipts: ImportReceiptItem[];
  returnToSuppliers: ReturnToSupplierItem[];
  
  // Actions
  addSupplier: (supplier: Omit<SupplierRecord, 'id'>) => void;
  updateSupplier: (id: string, data: Partial<SupplierRecord>) => void;
  deleteSupplier: (id: string) => void;

  addPurchaseOrder: (po: Omit<PurchaseOrderItem, 'id'>) => void;
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrderItem>) => void;
  deletePurchaseOrder: (id: string) => void;

  fetchImportReceipts: () => Promise<void>;
  addImportReceipt: (receipt: Omit<ImportReceiptItem, 'id'>) => Promise<void>;
  updateImportReceipt: (id: string, data: Partial<ImportReceiptItem>) => Promise<void>;
  deleteImportReceipt: (id: string) => Promise<void>;

  fetchReturnToSuppliers: () => Promise<void>;
  addReturnToSupplier: (rtv: Omit<ReturnToSupplierItem, 'id'>) => Promise<void>;
  updateReturnToSupplier: (id: string, data: Partial<ReturnToSupplierItem>) => Promise<void>;
  deleteReturnToSupplier: (id: string) => Promise<void>;
}

const MOCK_SUPPLIERS: SupplierRecord[] = [
  { id: '1', code: 'SUP-2024-001', supplierName: 'Global Tech Distribution', category: 'ELECTRONICS', contactPerson: 'Marcus Vance', phone: '+1 (555) 234-5678', email: 'orders@globaltech.dist', address: '102 Silicon Parkway, San Jose, CA', rating: 4.8, leadTimeDays: 5, paymentTerms: 'Net 30', activeOrdersCount: 4, status: 'ACTIVE', notes: 'Primary distributor for POS hardware and barcode scanners.' },
  { id: '2', code: 'SUP-2024-002', supplierName: 'Apex Premium Packaging', category: 'PACKAGING', contactPerson: 'Elena Rostova', phone: '+1 (555) 987-6543', email: 'sales@apexpack.co', address: '44 Industrial Blvd, Chicago, IL', rating: 4.2, leadTimeDays: 14, paymentTerms: 'Net 60', activeOrdersCount: 1, status: 'ACTIVE', notes: 'Custom eco-friendly shopping bags and shipping boxes.' },
  { id: '3', code: 'SUP-2024-003', supplierName: 'Nordic Apparel Mills', category: 'APPAREL', contactPerson: 'Sven Lindqvist', phone: '+46 8 123 4567', email: 'export@nordicmills.se', address: 'Fabric Way 12, Gothenburg, Sweden', rating: 4.9, leadTimeDays: 21, paymentTerms: '50% Adv / 50% Delivery', activeOrdersCount: 2, status: 'ACTIVE', notes: 'High quality cotton garments.' },
  { id: '4', code: 'SUP-2024-004', supplierName: 'Omega Hardware Wholesalers', category: 'HARDWARE', contactPerson: 'Tom Briggs', phone: '+1 (555) 443-1122', email: 'billing@omegahardware.net', address: '99 Warehouse Ave, Dallas, TX', rating: 3.1, leadTimeDays: 10, paymentTerms: 'Due on Receipt', activeOrdersCount: 0, status: 'ON_HOLD', notes: 'Placed on hold due to quality issues in batch #8912.' },
];

const MOCK_PURCHASE_ORDERS: PurchaseOrderItem[] = [
  { id: '1', poNumber: 'PO-2024-801', supplierName: 'Global Tech Distribution', destinationStore: 'Main Flagship / HQ', orderDate: '2024-05-10', estDeliveryDate: '2024-05-18', totalCost: 35000.00, status: 'DISPATCHED', paymentStatus: 'PARTIAL_ADVANCE', orderedBy: 'Sarah Jenkins', itemsCount: 45, notes: 'Includes 25 Barcode Scanners and 20 Receipt Printers. 50% advance wired.' },
  { id: '2', poNumber: 'PO-2024-802', supplierName: 'Nordic Apparel Mills', destinationStore: 'Downtown Branch', orderDate: '2024-05-12', estDeliveryDate: '2024-05-25', totalCost: 18500.00, status: 'APPROVED', paymentStatus: 'UNPAID', orderedBy: 'Michael Chang', itemsCount: 350, notes: 'Summer collection cotton basics wholesale batch.' },
  { id: '3', poNumber: 'PO-2024-803', supplierName: 'Apex Premium Packaging', destinationStore: 'Central Distribution Warehouse', orderDate: '2024-05-15', estDeliveryDate: '2024-05-20', totalCost: 4200.00, status: 'PENDING_APPROVAL', paymentStatus: 'UNPAID', orderedBy: 'David Ross', itemsCount: 5000, notes: 'Branded paper shopping bags and biodegradable boxes.' },
  { id: '4', poNumber: 'PO-2024-804', supplierName: 'Omega Hardware Wholesalers', destinationStore: 'Northside Store', orderDate: '2024-05-01', estDeliveryDate: '2024-05-08', totalCost: 8900.00, status: 'DELIVERED', paymentStatus: 'PAID', orderedBy: 'Super Admin', itemsCount: 120, notes: 'Fully received and inspected. Zero discrepancies.' },
];

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      suppliers: MOCK_SUPPLIERS,
      purchaseOrders: MOCK_PURCHASE_ORDERS,
      importReceipts: [],
      returnToSuppliers: [],

      addSupplier: (supplier) =>
        set((state) => ({
          suppliers: [{ id: Date.now().toString(), ...supplier }, ...state.suppliers],
        })),
      updateSupplier: (id, data) =>
        set((state) => ({
          suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...data } : s)),
        })),
      deleteSupplier: (id) =>
        set((state) => ({
          suppliers: state.suppliers.filter((s) => s.id !== id),
        })),

      addPurchaseOrder: (po) =>
        set((state) => ({
          purchaseOrders: [{ id: Date.now().toString(), ...po }, ...state.purchaseOrders],
        })),
      updatePurchaseOrder: (id, data) =>
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => (po.id === id ? { ...po, ...data } : po)),
        })),
      deletePurchaseOrder: (id) =>
        set((state) => ({
          purchaseOrders: state.purchaseOrders.filter((po) => po.id !== id),
        })),

      fetchImportReceipts: async () => {
        try {
          const res = await axiosClient.get<any, any[]>('/inventories/imports');
          const mapped = res.map((r: any) => ({
            id: String(r.id),
            grnNumber: r.receiptCode,
            poNumber: r.purchaseOrderCode || '',
            supplierName: r.supplierName || '',
            receivingStore: r.branchName || '',
            receivedDate: r.receiptDate ? r.receiptDate.split('T')[0] : '',
            totalItems: r.receiptLines ? r.receiptLines.reduce((acc: number, cur: any) => acc + (cur.quantity || 0), 0) : 0,
            acceptedItems: r.receiptLines ? r.receiptLines.reduce((acc: number, cur: any) => acc + (cur.quantity || 0), 0) : 0,
            rejectedItems: 0,
            totalValuation: Number(r.totalAmount || 0),
            status: r.status === 'COMPLETE' ? ('INSPECTED_ACCEPTED' as const) : ('PENDING_INSPECTION' as const),
            inspectedBy: r.createdBy || '',
            notes: '',
          }));
          set({ importReceipts: mapped });
        } catch (error) {
          console.error('Failed to fetch import receipts:', error);
        }
      },
      addImportReceipt: async (receipt) => {
        try {
          const payload = {
            receiptCode: receipt.grnNumber || `GRN-${Date.now()}`,
            receiptDate: new Date().toISOString(),
            branchId: resolveBranchId(receipt.receivingStore),
            totalAmount: receipt.totalValuation,
            status: 'PENDING',
            receiptLines: [
              {
                productId: resolveProductId(),
                quantity: receipt.totalItems || 1,
                unitPrice: receipt.totalValuation / (receipt.totalItems || 1),
                subTotal: receipt.totalValuation,
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
            await axiosClient.put(`/inventories/imports/${id}/complete`);
          } else {
            const payload = {
              receiptCode: data.grnNumber,
              receiptDate: new Date().toISOString(),
              branchId: resolveBranchId(data.receivingStore),
              totalAmount: data.totalValuation,
              status: 'PENDING',
              receiptLines: [
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
            await axiosClient.put(`/inventories/returns/${id}/approve`);
          } else if (data.status === 'REJECTED') {
            await axiosClient.put(`/inventories/returns/${id}/reject`);
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
      name: 'retailhub-purchase-storage',
    }
  )
);
