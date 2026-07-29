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
  groupId?: string;
  areaId?: string;
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
    rating: item.rating || 5,
    leadTimeDays: item.leadTimeDays || 3,
    paymentTerms: item.paymentTerms || 'Net 30',
    activeOrdersCount: item.activeOrdersCount || 0,
    status: item.isActive === false ? 'INACTIVE' : 'ACTIVE',
    notes: item.note || '',
    groupId: item.group?.id ? String(item.group.id) : undefined,
    areaId: item.area?.id ? String(item.area.id) : undefined,
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
  updatePurchaseOrderStatus: (id: string, status: string) => Promise<void>;
  deletePurchaseOrder: (id: string) => Promise<void>;
}

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
        const tempId = String(Date.now());
        const newRecord: SupplierRecord = {
          id: tempId,
          ...supplier,
        };
        set((state) => ({ suppliers: [newRecord, ...state.suppliers] }));

        try {
          const form = toFormData({
            supplierCode: supplier.code,
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
          console.error('Failed to add supplier to API, kept in local state:', err);
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
          const data = extractPageContent<any>(res);
          if (Array.isArray(data) && data.length > 0) {
            const apiOrders = data.map((item: any) => ({
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
            }));
            const currentLocal = get().purchaseOrders || [];
            const merged = [...apiOrders];
            currentLocal.forEach(loc => {
              if (!merged.some(m => String(m.id) === String(loc.id) || m.poNumber === loc.poNumber)) {
                merged.push(loc);
              }
            });
            set({ purchaseOrders: merged });
          }
        } catch (e) {
          console.error('Failed to fetch purchase orders:', e);
        }
      },

      addPurchaseOrder: async (po) => {
        const tempId = `po_${Date.now()}`;
        const newRecord: PurchaseOrderItem = {
          id: tempId,
          ...po,
        };
        set((state) => ({
          purchaseOrders: [newRecord, ...state.purchaseOrders.filter(p => p.poNumber !== po.poNumber)],
        }));
        try {
          const nowIso = new Date().toISOString();
          const details = (po.poLines || []).map((line, idx) => ({
            productId: (line as any).productId ? Number((line as any).productId) : idx + 1,
            productVariantId: (line as any).productVariantId ? Number((line as any).productVariantId) : null,
            orderQuantity: Number(line.quantity || 1),
            unitPrice: Number(line.unitPrice || 0),
            note: line.productName || '',
          }));

          const validDetails = details.length > 0 ? details : [{
            productId: 1,
            productVariantId: null,
            orderQuantity: po.itemsCount || 1,
            unitPrice: po.totalCost || 0,
            note: 'Sản phẩm đặt mua',
          }];

          const payload = {
            poCode: po.poNumber || `PO-${Date.now()}`,
            poDate: po.orderDate ? `${po.orderDate}T00:00:00` : nowIso,
            expectedDate: po.estDeliveryDate ? `${po.estDeliveryDate}T00:00:00` : null,
            supplierId: (po as any).supplierId ? Number((po as any).supplierId) : 1,
            branchId: (po as any).branchId ? Number((po as any).branchId) : 1,
            status: po.status || 'DRAFT',
            note: po.notes || '',
            details: validDetails,
          };
          await axiosClient.post('/purchase/orders', payload);
          await get().fetchPurchaseOrders();
        } catch (e) {
          console.error('Failed to post PO to API, kept in local state:', e);
        }
      },

      updatePurchaseOrder: async (id, data) => {
        try {
          await axiosClient.put(`/purchase/orders/${id}`, data);
          await get().fetchPurchaseOrders();
        } catch (e) {
          console.error(e);
        }
      },

      updatePurchaseOrderStatus: async (id, status) => {
        try {
          await axiosClient.put(`/purchase/orders/${id}/status?status=${status}`);
          await get().fetchPurchaseOrders();
        } catch (e) {
          console.error(e);
        }
      },

      deletePurchaseOrder: async (id) => {
        try {
          await axiosClient.delete(`/purchase/orders/${id}`);
          await get().fetchPurchaseOrders();
        } catch (e) {
          console.error(e);
        }
      },
    }),
    { name: 'retailhub-purchase-storage' }
  )
);
