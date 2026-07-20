import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent, toFormData } from '@/shared/lib/apiHelpers';

export interface SupplierRecord {
  id: string;
  code: string;
  supplierName: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxCode?: string;
  paymentTerm?: number;
  creditLimit?: number;
  bankName?: string;
  bankAccount?: string;
  accountHolder?: string;
  description?: string;
  rating: number;
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

function mapSupplier(item: any): SupplierRecord {
  return {
    id: String(item.id),
    code: item.supplierCode || `SUP-${item.id}`,
    supplierName: item.name || item.supplierName || '',
    category: item.category || 'GENERAL',
    contactPerson: item.contactPerson || '',
    phone: item.phone || '',
    email: item.email || '',
    address: item.address || '',
    taxCode: item.taxCode || '',
    paymentTerm: item.paymentTerm ?? undefined,
    creditLimit: item.creditLimit ?? undefined,
    bankName: item.bankName || '',
    bankAccount: item.bankAccount || '',
    accountHolder: item.accountHolder || '',
    description: item.description || '',
    rating: 4.0,
    leadTimeDays: item.paymentTerm ?? 7,
    paymentTerms: item.paymentTerm ? `Net ${item.paymentTerm}` : 'COD',
    activeOrdersCount: 0,
    status: item.isActive === false ? 'INACTIVE' : 'ACTIVE',
    notes: item.description || '',
  };
}

interface PurchaseState {
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrderItem[];
  isLoadingSuppliers: boolean;

  fetchSuppliers: () => Promise<void>;
  addSupplier: (supplier: Omit<SupplierRecord, 'id'>) => Promise<void>;
  updateSupplier: (id: string, data: Partial<SupplierRecord>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  toggleSupplierStatus: (id: string) => Promise<void>;

  fetchPurchaseOrders: () => Promise<void>;
  addPurchaseOrder: (po: Omit<PurchaseOrderItem, 'id'>) => Promise<void>;
  updatePurchaseOrder: (id: string, data: Partial<PurchaseOrderItem>) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
}

const MOCK_PURCHASE_ORDERS: PurchaseOrderItem[] = [
  { id: '1', poNumber: 'PO-2024-801', supplierName: 'Global Tech Distribution', destinationStore: 'Main Flagship / HQ', orderDate: '2024-05-10', estDeliveryDate: '2024-05-18', totalCost: 35000.00, status: 'DISPATCHED', paymentStatus: 'PARTIAL_ADVANCE', orderedBy: 'Sarah Jenkins', itemsCount: 45, notes: 'Includes 25 Barcode Scanners and 20 Receipt Printers. 50% advance wired.' },
  { id: '2', poNumber: 'PO-2024-802', supplierName: 'Nordic Apparel Mills', destinationStore: 'Downtown Branch', orderDate: '2024-05-12', estDeliveryDate: '2024-05-25', totalCost: 18500.00, status: 'APPROVED', paymentStatus: 'UNPAID', orderedBy: 'Michael Chang', itemsCount: 350, notes: 'Summer collection cotton basics wholesale batch.' },
];

export const usePurchaseStore = create<PurchaseState>()(
  persist(
    (set, get) => ({
      suppliers: [],
      purchaseOrders: [],
      isLoadingSuppliers: false,

      fetchSuppliers: async () => {
        set({ isLoadingSuppliers: true });
        try {
          const data = await axiosClient.get<any, unknown>('/partnerarea/suppliers?size=500');
          const list = extractPageContent<any>(data);
          set({ suppliers: list.map(mapSupplier), isLoadingSuppliers: false });
        } catch (err) {
          console.error('Failed to fetch suppliers:', err);
          set({ isLoadingSuppliers: false });
        }
      },

      addSupplier: async (supplier) => {
        try {
          const form = toFormData({
            name: supplier.supplierName,
            category: supplier.category,
            contactPerson: supplier.contactPerson,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            taxCode: supplier.taxCode,
            description: supplier.description,
            isActive: true,
          });
          await axiosClient.post('/partnerarea/suppliers', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          await get().fetchSuppliers();
        } catch (err) {
          console.error('Failed to add supplier:', err);
        }
      },

      updateSupplier: async (id, data) => {
        try {
          const form = toFormData({
            name: data.supplierName,
            category: data.category,
            contactPerson: data.contactPerson,
            phone: data.phone,
            email: data.email,
            address: data.address,
            taxCode: data.taxCode,
            description: data.description,
          });
          await axiosClient.put(`/partnerarea/suppliers/${id}`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          await get().fetchSuppliers();
        } catch (err) {
          console.error('Failed to update supplier:', err);
        }
      },

      deleteSupplier: async (id) => {
        try {
          await axiosClient.delete(`/partnerarea/suppliers/${id}`);
          set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));
        } catch (err) {
          console.error('Failed to delete supplier:', err);
        }
      },

      toggleSupplierStatus: async (id) => {
        try {
          await axiosClient.patch(`/partnerarea/suppliers/${id}/status`);
          await get().fetchSuppliers();
        } catch (err) {
          console.error('Failed to toggle supplier status:', err);
        }
      },

      fetchPurchaseOrders: async () => {
        try {
          const res = await axiosClient.get<any, any>('/purchase/orders');
          const data = res.content || res || [];
          if (Array.isArray(data) && data.length > 0) {
            set({ purchaseOrders: data.map((item: any) => ({
              id: String(item.id),
              poNumber: item.poNumber || `PO-${item.id}`,
              supplierName: item.supplierName || '',
              destinationStore: item.destinationStore || 'Main Branch',
              orderDate: item.orderDate ? item.orderDate.split('T')[0] : '',
              estDeliveryDate: item.estDeliveryDate ? item.estDeliveryDate.split('T')[0] : '',
              totalCost: Number(item.totalCost || 0),
              status: item.status || 'DRAFT',
              paymentStatus: item.paymentStatus || 'UNPAID',
              orderedBy: item.orderedBy || '',
              itemsCount: Number(item.itemsCount || 0),
              notes: item.notes || '',
            })) });
          }
        } catch (e) {
          console.error('Failed to fetch purchase orders:', e);
        }
      },

      addPurchaseOrder: async (po) => {
        try {
          await axiosClient.post('/purchase/orders', po);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          purchaseOrders: [{ id: Date.now().toString(), ...po }, ...state.purchaseOrders],
        }));
      },

      updatePurchaseOrder: async (id, data) => {
        try {
          await axiosClient.put(`/purchase/orders/${id}`, data);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          purchaseOrders: state.purchaseOrders.map((po) => (po.id === id ? { ...po, ...data } : po)),
        }));
      },

      deletePurchaseOrder: async (id) => {
        try {
          await axiosClient.delete(`/purchase/orders/${id}`);
        } catch (e) {
          console.error(e);
        }
        set((state) => ({
          purchaseOrders: state.purchaseOrders.filter((po) => po.id !== id),
        }));
      },
    }),
    { name: 'retailhub-purchase-storage' }
  )
);
