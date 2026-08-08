import { axiosClient } from '@/shared/lib/axiosClient';
import type {
  SupplierRecord,
  PurchaseOrderRecord,
  PurchaseRequestRecord,
  SupplierContractRecord,
  SupplierEvaluationRecord,
} from '../store/purchaseStore';

export const purchaseService = {
  // --- Suppliers ---
  async fetchSuppliers(): Promise<SupplierRecord[]> {
    const res = await axiosClient.get<any, any>('/partnerarea/suppliers?size=500');
    const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
    return list.map((item: any) => ({
      id: String(item.id),
      code: item.supplierCode || item.code || `SUP-${item.id}`,
      supplierName: item.name || item.supplierName || '',
      shortName: item.shortName || item.supplierCode || '',
      tags: item.tags || (item.category ? `CAT-${item.category}` : ''),
      category: item.category || 'GENERAL',
      contactPerson: item.contactPerson || '',
      phone: item.phone || '',
      email: item.email || '',
      address: item.address || '',
      taxCode: item.taxCode || '',
      paymentTerm: item.paymentTerm !== undefined ? Number(item.paymentTerm) : 30,
      creditLimit: item.creditLimit !== undefined ? Number(item.creditLimit) : 0,
      bankName: item.bankName || '',
      bankAccount: item.bankAccount || '',
      accountHolder: item.accountHolder || '',
      rating: Number(item.rating || 5.0),
      leadTimeDays: Number(item.leadTimeDays || 7),
      paymentTerms: item.paymentTerms || (item.paymentTerm ? `Net ${item.paymentTerm}` : 'Net 30'),
      activeOrdersCount: Number(item.activeOrdersCount || 0),
      status: item.isActive === false ? 'INACTIVE' : 'ACTIVE',
      notes: item.description || item.notes || '',
      groupId: item.groupId ? String(item.groupId) : undefined,
      areaId: item.areaId ? String(item.areaId) : undefined,
    }));
  },

  async addSupplier(supplier: Omit<SupplierRecord, 'id'>): Promise<SupplierRecord> {
    const payload = {
      supplierCode: supplier.code,
      name: supplier.supplierName,
      shortName: supplier.shortName,
      tags: supplier.tags,
      category: supplier.category,
      contactPerson: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      taxCode: supplier.taxCode,
      paymentTerm: supplier.paymentTerm || 30,
      creditLimit: supplier.creditLimit || 0,
      bankName: supplier.bankName,
      bankAccount: supplier.bankAccount,
      accountHolder: supplier.accountHolder,
      description: supplier.notes || supplier.description,
      groupId: supplier.groupId ? Number(supplier.groupId) : null,
      areaId: supplier.areaId ? Number(supplier.areaId) : null,
      isActive: supplier.status === 'ACTIVE'
    };
    const res = await axiosClient.post<any, any>('/partnerarea/suppliers', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...supplier,
      ...(item || {}),
      supplierName: item?.name || supplier.supplierName,
      code: item?.supplierCode || supplier.code,
    };
  },

  async updateSupplier(id: string, data: Partial<SupplierRecord>): Promise<Partial<SupplierRecord>> {
    const payload = {
      supplierCode: data.code,
      name: data.supplierName,
      shortName: data.shortName,
      tags: data.tags,
      category: data.category,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      taxCode: data.taxCode,
      paymentTerm: data.paymentTerm,
      creditLimit: data.creditLimit,
      bankName: data.bankName,
      bankAccount: data.bankAccount,
      accountHolder: data.accountHolder,
      description: data.notes || data.description,
      groupId: data.groupId ? Number(data.groupId) : null,
      areaId: data.areaId ? Number(data.areaId) : null,
      isActive: data.status === undefined ? true : data.status === 'ACTIVE'
    };
    const res = await axiosClient.put<any, any>(`/partnerarea/suppliers/${id}`, payload);
    return res?.data || res || data;
  },

  async deleteSupplier(id: string): Promise<void> {
    await axiosClient.delete(`/partnerarea/suppliers/${id}`);
  },

  // --- Purchase Orders ---
  async fetchPurchaseOrders(): Promise<PurchaseOrderItem[]> {
    const res = await axiosClient.get<any, any>('/purchase/orders');
    const list = Array.isArray(res) ? res : (res?.content || res?.data || []);
    return list.map((item: any) => ({
      id: String(item.id),
      poNumber: item.poCode || item.poNumber || item.code || `PO-${item.id}`,
      supplierName: item.supplierName || item.supplier?.name || 'Nhà cung cấp',
      destinationStore: item.branchName || item.branch?.name || item.destinationStore || 'Chi nhánh chính',
      orderDate: item.poDate ? String(item.poDate).split('T')[0] : (item.orderDate ? String(item.orderDate).split('T')[0] : new Date().toISOString().split('T')[0]),
      estDeliveryDate: item.expectedDate ? String(item.expectedDate).split('T')[0] : (item.estDeliveryDate || ''),
      totalCost: Number(item.totalAmount || item.totalCost || 0),
      status: item.status || 'DRAFT',
      paymentStatus: item.paymentStatus || 'UNPAID',
      orderedBy: item.createdByName || item.orderedBy || 'Admin User',
      itemsCount: item.details ? item.details.length : Number(item.itemsCount || 1),
      notes: item.note || item.notes || '',
      poLines: item.details ? item.details.map((d: any) => ({
        productId: d.productId || d.product?.id,
        productName: d.productNameSnapshot || d.product?.name || d.productName || 'Sản phẩm đặt mua',
        quantity: Number(d.quantity || 1),
        unitPrice: Number(d.unitPriceSnapshot || d.unitPrice || 0)
      })) : []
    }));
  },

  async addPurchaseOrder(po: Omit<PurchaseOrderItem, 'id'>): Promise<PurchaseOrderItem> {
    // 1. Resolve Supplier ID
    let supplierId = 1;
    try {
      const supRes = await axiosClient.get<any, any>('/partnerarea/suppliers?size=500');
      const supList: any[] = Array.isArray(supRes) ? supRes : (supRes?.content || supRes?.data || []);
      const matched = supList.find(
        (s: any) =>
          (s.name && s.name.toLowerCase() === (po.supplierName || '').toLowerCase()) ||
          (s.supplierName && s.supplierName.toLowerCase() === (po.supplierName || '').toLowerCase()) ||
          (s.supplierCode && s.supplierCode.toLowerCase() === (po.supplierName || '').toLowerCase()) ||
          String(s.id) === String((po as any).supplierId)
      );
      if (matched?.id) {
        supplierId = Number(matched.id);
      } else if (supList.length > 0 && supList[0].id) {
        supplierId = Number(supList[0].id);
      }
    } catch {}

    // 2. Resolve Branch ID
    let branchId = 1;
    try {
      const branchRes = await axiosClient.get<any, any>('/branches?size=100');
      const branchList: any[] = Array.isArray(branchRes) ? branchRes : (branchRes?.content || branchRes?.data || []);
      const matchedBranch = branchList.find(
        (b: any) =>
          (b.name && b.name.toLowerCase() === (po.destinationStore || '').toLowerCase()) ||
          String(b.id) === String((po as any).branchId)
      );
      if (matchedBranch?.id) {
        branchId = Number(matchedBranch.id);
      } else if (branchList.length > 0 && branchList[0].id) {
        branchId = Number(branchList[0].id);
      }
    } catch {}

    // 3. Resolve Product IDs for details
    let prodList: any[] = [];
    try {
      const prodRes = await axiosClient.get<any, any>('/products?size=500');
      prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.content || prodRes?.data || []);
    } catch {}

    const firstValidProdId = prodList.length > 0 && prodList[0].id ? Number(prodList[0].id) : 1;

    const details = (po.poLines && po.poLines.length > 0 ? po.poLines : [{ productName: 'Sản phẩm', quantity: 1, unitPrice: po.totalCost || 100000 }]).map((l: any, idx: number) => {
      const matchedProd = prodList.find(
        (p: any) =>
          (p.name && p.name.toLowerCase() === (l.productName || '').toLowerCase()) ||
          (p.productCode && p.productCode.toLowerCase() === (l.productName || '').toLowerCase()) ||
          String(p.id) === String(l.productId)
      );
      const pid = matchedProd?.id ? Number(matchedProd.id) : (firstValidProdId + idx);
      return {
        productId: pid,
        quantity: Math.max(1, Number(l.quantity) || 1),
        unitPrice: Math.max(0, Number(l.unitPrice) || 0),
      };
    });

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatLocalDateTime = (dateStr?: string) => {
      if (!dateStr) return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00:00`;
      if (dateStr.includes('T') && !dateStr.includes('Z')) return dateStr;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00:00`;
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const payload = {
      poCode: po.poNumber || `PO-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      poDate: formatLocalDateTime(po.orderDate),
      expectedDate: po.estDeliveryDate ? formatLocalDateTime(po.estDeliveryDate) : null,
      supplierId: supplierId,
      branchId: branchId,
      status: po.status || 'DRAFT',
      note: po.notes || '',
      details: details,
    };

    const res = await axiosClient.post<any, any>('/purchase/orders', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...po,
      poNumber: item?.poCode || po.poNumber,
      totalCost: item?.totalAmount ? Number(item.totalAmount) : po.totalCost,
    };
  },

  async updatePurchaseOrder(id: string, data: Partial<PurchaseOrderItem>): Promise<Partial<PurchaseOrderItem>> {
    let supplierId = 1;
    let branchId = 1;
    let prodList: any[] = [];
    try {
      const [supRes, branchRes, prodRes] = await Promise.all([
        axiosClient.get<any, any>('/partnerarea/suppliers?size=500'),
        axiosClient.get<any, any>('/branches?size=100'),
        axiosClient.get<any, any>('/products?size=500')
      ]);
      const supList: any[] = Array.isArray(supRes) ? supRes : (supRes?.content || supRes?.data || []);
      const matched = supList.find((s: any) => s.name === data.supplierName || s.supplierName === data.supplierName);
      if (matched?.id) supplierId = Number(matched.id);

      const branchList: any[] = Array.isArray(branchRes) ? branchRes : (branchRes?.content || branchRes?.data || []);
      const matchedBranch = branchList.find((b: any) => b.name === data.destinationStore);
      if (matchedBranch?.id) branchId = Number(matchedBranch.id);

      prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.content || prodRes?.data || []);
    } catch {}

    const firstValidProdId = prodList.length > 0 && prodList[0].id ? Number(prodList[0].id) : 1;
    const details = (data.poLines && data.poLines.length > 0 ? data.poLines : [{ productName: 'Sản phẩm', quantity: 1, unitPrice: data.totalCost || 100000 }]).map((l: any, idx: number) => {
      const matchedProd = prodList.find((p: any) => p.name === l.productName || String(p.id) === String(l.productId));
      return {
        productId: matchedProd?.id ? Number(matchedProd.id) : (firstValidProdId + idx),
        quantity: Math.max(1, Number(l.quantity) || 1),
        unitPrice: Math.max(0, Number(l.unitPrice) || 0),
      };
    });

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatLocalDateTime = (dateStr?: string) => {
      if (!dateStr) return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00:00`;
      if (dateStr.includes('T') && !dateStr.includes('Z')) return dateStr;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T00:00:00`;
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const payload = {
      poDate: formatLocalDateTime(data.orderDate),
      expectedDate: data.estDeliveryDate ? formatLocalDateTime(data.estDeliveryDate) : null,
      supplierId: supplierId,
      branchId: branchId,
      status: data.status || 'DRAFT',
      note: data.notes || '',
      details: details,
    };
    const res = await axiosClient.put<any, any>(`/purchase/orders/${id}`, payload);
    return res?.data || res || data;
  },

  async deletePurchaseOrder(id: string): Promise<void> {
    await axiosClient.delete(`/purchase/orders/${id}`);
  },

  // --- Purchase Requests ---
  async fetchPurchaseRequests(): Promise<PurchaseRequestRecord[]> {
    const res = await axiosClient.get<any, any>('/purchase/requests');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      requestCode: item.requestCode || `PR-${item.id}`,
      requesterName: item.requesterName || '',
      departmentName: item.departmentName || 'Kho vận',
      reason: item.reason || '',
      estimatedTotal: Number(item.estimatedTotal || 0),
      requestDate: item.requestDate ? item.requestDate.split('T')[0] : '',
      status: item.status || 'PENDING',
    }));
  },

  async addPurchaseRequest(pr: Omit<PurchaseRequestRecord, 'id'>): Promise<PurchaseRequestRecord> {
    const res = await axiosClient.post<any, any>('/purchase/requests', pr);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...pr,
      ...(item || {}),
    };
  },

  async updatePurchaseRequest(id: string, data: Partial<PurchaseRequestRecord>): Promise<Partial<PurchaseRequestRecord>> {
    const res = await axiosClient.put<any, any>(`/purchase/requests/${id}`, data);
    return res?.data || res || data;
  },

  async deletePurchaseRequest(id: string): Promise<void> {
    await axiosClient.delete(`/purchase/requests/${id}`);
  },

  // --- Supplier Contracts ---
  async fetchSupplierContracts(): Promise<SupplierContractRecord[]> {
    const res = await axiosClient.get<any, any>('/purchase/contracts');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      contractCode: item.contractCode || `CTR-${item.id}`,
      supplierName: item.supplierName || '',
      title: item.title || '',
      contractValue: Number(item.contractValue || 0),
      startDate: item.startDate ? item.startDate.split('T')[0] : '',
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      status: item.status || 'ACTIVE',
    }));
  },

  async addSupplierContract(ctr: Omit<SupplierContractRecord, 'id'>): Promise<SupplierContractRecord> {
    const res = await axiosClient.post<any, any>('/purchase/contracts', ctr);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...ctr,
      ...(item || {}),
    };
  },

  async updateSupplierContract(id: string, data: Partial<SupplierContractRecord>): Promise<Partial<SupplierContractRecord>> {
    const res = await axiosClient.put<any, any>(`/purchase/contracts/${id}`, data);
    return res?.data || res || data;
  },

  async deleteSupplierContract(id: string): Promise<void> {
    await axiosClient.delete(`/purchase/contracts/${id}`);
  },

  // --- Supplier Evaluations ---
  async fetchSupplierEvaluations(): Promise<SupplierEvaluationRecord[]> {
    const res = await axiosClient.get<any, any>('/purchase/evaluations');
    const list = Array.isArray(res) ? res : (res?.content || []);
    return list.map((item: any) => ({
      id: String(item.id),
      supplierName: item.supplierName || '',
      evaluationPeriod: item.evaluationPeriod || 'Q1-2026',
      qualityScore: Number(item.qualityScore || 5),
      deliveryScore: Number(item.deliveryScore || 5),
      priceScore: Number(item.priceScore || 5),
      overallScore: Number(item.overallScore || 5),
      evaluatorName: item.evaluatorName || 'Quản lý mua hàng',
      evaluatedDate: item.evaluatedDate ? item.evaluatedDate.split('T')[0] : '',
    }));
  },

  async addSupplierEvaluation(evalItem: Omit<SupplierEvaluationRecord, 'id'>): Promise<SupplierEvaluationRecord> {
    const res = await axiosClient.post<any, any>('/purchase/evaluations', evalItem);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...evalItem,
      ...(item || {}),
    };
  },
};
