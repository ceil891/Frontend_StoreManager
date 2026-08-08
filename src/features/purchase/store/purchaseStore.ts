import { create } from 'zustand';
import { purchaseService } from '../services/purchaseService';

export interface SupplierRecord {
  id: string;
  code: string;
  supplierName: string;
  shortName?: string;
  tags?: string;
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
  poLines?: any[];
}

export interface PurchaseOrderRecord {
  id: string;
  poCode: string;
  supplierName: string;
  supplierPhone: string;
  totalAmount: number;
  paidAmount: number;
  createdDate: string;
  expectedDeliveryDate: string;
  status: string;
  branchLocation: string;
  createdByName: string;
}

export interface PurchaseRequestRecord {
  id: string;
  requestCode: string;
  requesterName: string;
  departmentName: string;
  reason: string;
  estimatedTotal: number;
  requestDate: string;
  status: string;
}

export interface SupplierContractRecord {
  id: string;
  contractCode: string;
  supplierName: string;
  title: string;
  contractValue: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface SupplierEvaluationRecord {
  id: string;
  supplierName: string;
  evaluationPeriod: string;
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
  overallScore: number;
  evaluatorName: string;
  evaluatedDate: string;
}

interface PurchaseState {
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrderItem[];
  purchaseRequests: PurchaseRequestRecord[];
  supplierContracts: SupplierContractRecord[];
  supplierEvaluations: SupplierEvaluationRecord[];
  isLoadingSuppliers: boolean;
  isLoading: boolean;
  error: string | null;

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

export const usePurchaseStore = create<PurchaseState>()((set) => ({
  suppliers: [],
  purchaseOrders: [],
  purchaseRequests: [],
  supplierContracts: [],
  supplierEvaluations: [],
  isLoadingSuppliers: false,
  isLoading: false,
  error: null,

  fetchSuppliers: async () => {
    set({ isLoadingSuppliers: true, isLoading: true, error: null });
    try {
      const data = await purchaseService.fetchSuppliers();
      set({ suppliers: data, isLoadingSuppliers: false, isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch suppliers:', err);
      set({ isLoadingSuppliers: false, isLoading: false, error: err.message || 'Lỗi khi tải nhà cung cấp' });
    }
  },

  addSupplier: async (supplier) => {
    set({ isLoading: true, error: null });
    try {
      const created = await purchaseService.addSupplier(supplier);
      set((state) => ({ suppliers: [created, ...state.suppliers], isLoading: false }));
    } catch (err: any) {
      console.error('Failed to add supplier:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi thêm nhà cung cấp' });
      throw err;
    }
  },

  updateSupplier: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await purchaseService.updateSupplier(id, data);
      set((state) => ({
        suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...updated } : s)),
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Failed to update supplier:', err);
      set({ isLoading: false, error: err.message || 'Lỗi khi cập nhật nhà cung cấp' });
      throw err;
    }
  },

  deleteSupplier: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await purchaseService.deleteSupplier(id);
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Failed to delete supplier:', err);
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
        isLoading: false,
      }));
    }
  },

  toggleSupplierStatus: async (id) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => ({
        suppliers: state.suppliers.map((s) =>
          s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : s
        ),
        isLoading: false,
      }));
    } catch (err: any) {
      console.error('Failed to toggle supplier status:', err);
      set({ isLoading: false });
    }
  },

  fetchPurchaseOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await purchaseService.fetchPurchaseOrders();
      const mappedOrders: PurchaseOrderItem[] = data.map((po) => ({
        id: po.id,
        poNumber: po.poCode,
        supplierName: po.supplierName,
        destinationStore: po.branchLocation,
        orderDate: po.createdDate,
        estDeliveryDate: po.expectedDeliveryDate,
        totalCost: po.totalAmount,
        status: po.status as any,
        paymentStatus: 'UNPAID',
        orderedBy: po.createdByName,
        itemsCount: 1,
      }));
      set({ purchaseOrders: mappedOrders, isLoading: false });
    } catch (e: any) {
      console.error('Failed to fetch purchase orders:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi tải đơn mua hàng' });
    }
  },

  addPurchaseOrder: async (po) => {
    set({ isLoading: true, error: null });
    try {
      const createdPO = await purchaseService.addPurchaseOrder({
        id: '',
        poCode: po.poNumber,
        supplierName: po.supplierName,
        supplierPhone: '',
        totalAmount: po.totalCost,
        paidAmount: 0,
        createdDate: po.orderDate,
        expectedDeliveryDate: po.estDeliveryDate,
        status: po.status,
        branchLocation: po.destinationStore,
        createdByName: po.orderedBy,
      });

      const newOrderItem: PurchaseOrderItem = {
        id: createdPO.id,
        poNumber: createdPO.poCode || po.poNumber,
        supplierName: createdPO.supplierName || po.supplierName,
        destinationStore: createdPO.branchLocation || po.destinationStore,
        orderDate: createdPO.createdDate || po.orderDate,
        estDeliveryDate: createdPO.expectedDeliveryDate || po.estDeliveryDate,
        totalCost: createdPO.totalAmount || po.totalCost,
        status: (createdPO.status as any) || po.status,
        paymentStatus: po.paymentStatus || 'UNPAID',
        orderedBy: createdPO.createdByName || po.orderedBy,
        itemsCount: po.itemsCount || 1,
      };

      set((state) => ({ purchaseOrders: [newOrderItem, ...state.purchaseOrders], isLoading: false }));
    } catch (e: any) {
      console.error('Failed to post PO to API:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi thêm đơn mua hàng' });
      throw e;
    }
  },

  updatePurchaseOrder: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updated = await purchaseService.updatePurchaseOrder(id, {
        poCode: data.poNumber,
        supplierName: data.supplierName,
        totalAmount: data.totalCost,
        status: data.status,
      });
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((p) => (p.id === id ? { ...p, ...data, ...(updated as any) } : p)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error('Failed to update PO:', e);
      set({ isLoading: false, error: e.message || 'Lỗi khi cập nhật đơn mua hàng' });
      throw e;
    }
  },

  updatePurchaseOrderStatus: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      await purchaseService.updatePurchaseOrder(id, { status });
      set((state) => ({
        purchaseOrders: state.purchaseOrders.map((p) => (p.id === id ? { ...p, status: status as any } : p)),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  deletePurchaseOrder: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await purchaseService.deletePurchaseOrder(id);
      set((state) => ({
        purchaseOrders: state.purchaseOrders.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (e: any) {
      console.error(e);
      set((state) => ({
        purchaseOrders: state.purchaseOrders.filter((p) => p.id !== id),
        isLoading: false,
      }));
    }
  },
}));
