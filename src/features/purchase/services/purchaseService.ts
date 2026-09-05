import { axiosClient } from '@/shared/lib/axiosClient';
import type {
  SupplierRecord,
  PurchaseOrderItem,
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
    const res = await axiosClient.get<any, any>('/purchase/orders?sort=id,desc');
    const list = Array.isArray(res) ? res : (res?.content || res?.data || []);

    let overrides: Record<string, any> = {};
    try {
      const saved = localStorage.getItem('retailhub_po_payment_overrides');
      if (saved) overrides = JSON.parse(saved);
    } catch {}

    return list.map((item: any) => {
      const poNum = item.poCode || item.poNumber || item.code || `PO-${item.id}`;
      const ov = overrides[String(item.id)] || overrides[poNum] || {};

      const rawStatus = ov.status || item.status || 'DRAFT';
      const isDraftOrPending =
        rawStatus === 'DRAFT' ||
        rawStatus === 'PENDING_APPROVAL' ||
        rawStatus === 'BẢN NHÁP' ||
        rawStatus === 'CHỜ DUYỆT';

      // Bản nháp / Chờ duyệt KHÔNG được phép thanh toán -> luôn là UNPAID và advanceAmount = 0
      const paymentStatus: 'UNPAID' | 'PARTIAL_ADVANCE' | 'PAID' = isDraftOrPending
        ? 'UNPAID'
        : (ov.paymentStatus || item.paymentStatus || 'UNPAID');

      const totalCost = Number(item.totalAmount || item.totalCost || 0);
      const advanceAmount = isDraftOrPending
        ? 0
        : (ov.advanceAmount !== undefined ? Number(ov.advanceAmount) : Number(item.advanceAmount || 0));

      return {
        id: String(item.id),
        poNumber: poNum,
        supplierName: item.supplierName || item.supplier?.name || 'Nhà cung cấp',
        destinationStore: item.branchName || item.branch?.name || item.destinationStore || 'Chi nhánh chính',
        orderDate: item.poDate ? String(item.poDate).split('T')[0] : (item.orderDate ? String(item.orderDate).split('T')[0] : new Date().toISOString().split('T')[0]),
        estDeliveryDate: item.expectedDate ? String(item.expectedDate).split('T')[0] : (item.estDeliveryDate || ''),
        totalCost,
        status: rawStatus,
        paymentStatus,
        advanceAmount,
        paidAmount: advanceAmount,
        paymentTerms: item.paymentTerms || 'Net 30',
        shippingFee: Number(item.shippingFee || 0),
        orderedBy: item.createdByName || item.orderedBy || 'Admin User',
        itemsCount: item.details ? item.details.length : Number(item.itemsCount || 1),
        notes: item.note || item.notes || '',
        poLines: item.details ? item.details.map((d: any) => ({
          productId: d.productId || d.product?.id,
          productName: d.productNameSnapshot || d.productName || d.product?.name || 'Sản phẩm đặt mua',
          quantity: Number(d.quantity || 1),
          unitPrice: Number(d.unitPriceSnapshot || d.unitPrice || 0)
        })) : []
      };
    });
  },

  async addPurchaseOrder(po: Omit<PurchaseOrderItem, 'id'>): Promise<PurchaseOrderItem> {
    // 1. Resolve Supplier ID
    let supplierId = Number((po as any).supplierId);
    if (!supplierId || isNaN(supplierId)) {
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
    }

    // 2. Resolve Branch ID
    let branchId = Number((po as any).branchId);
    if (!branchId || isNaN(branchId)) {
      try {
        const branchRes = await axiosClient.get<any, any>('/branches?size=100');
        const branchList: any[] = Array.isArray(branchRes) ? branchRes : (branchRes?.content || branchRes?.data || []);
        const matchedBranch = branchList.find(
          (b: any) =>
            (b.name && b.name.toLowerCase() === (po.destinationStore || '').toLowerCase()) ||
            (b.branchName && b.branchName.toLowerCase() === (po.destinationStore || '').toLowerCase()) ||
            String(b.id) === String((po as any).branchId)
        );
        if (matchedBranch?.id) {
          branchId = Number(matchedBranch.id);
        } else if (branchList.length > 0 && branchList[0].id) {
          branchId = Number(branchList[0].id);
        }
      } catch {}
    }

    // 3. Resolve Product IDs for details
    let prodList: any[] = [];
    try {
      const prodRes = await axiosClient.get<any, any>('/products?size=500');
      prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.content || prodRes?.data || []);
    } catch {}

    if (!po.poLines || po.poLines.length === 0) {
      throw new Error('Đơn mua hàng phải có ít nhất một sản phẩm chi tiết.');
    }

    const details = po.poLines.map((l: any) => {
      let pid = Number(l.productId);
      if (!pid || isNaN(pid)) {
        const matchedProd = prodList.find(
          (p: any) =>
            (p.name && p.name.toLowerCase() === (l.productName || '').toLowerCase()) ||
            (p.productCode && p.productCode.toLowerCase() === (l.productName || '').toLowerCase())
        );
        if (matchedProd?.id) {
          pid = Number(matchedProd.id);
        }
      }
      if (!pid || isNaN(pid)) {
        throw new Error(`Không tìm thấy sản phẩm '${l.productName || l.productId}' trong hệ thống.`);
      }
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

    const uniquePoCode = po.poNumber && !po.poNumber.startsWith('PO-2026-')
      ? po.poNumber
      : `PO-${now.getFullYear()}-${Date.now().toString().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;

    const rawStatus = (po.status as string) || 'DRAFT';
    const isDraftOrPending =
      rawStatus === 'DRAFT' ||
      rawStatus === 'PENDING_APPROVAL' ||
      rawStatus === 'BẢN NHÁP' ||
      rawStatus === 'CHỜ DUYỆT';

    const payload = {
      poCode: uniquePoCode,
      poDate: formatLocalDateTime(po.orderDate),
      expectedDate: (po.estDeliveryDate || (po as any).expectedDeliveryDate || (po as any).expectedDate) ? formatLocalDateTime(po.estDeliveryDate || (po as any).expectedDeliveryDate || (po as any).expectedDate) : null,
      supplierId: supplierId || 1,
      branchId: branchId || 1,
      status: rawStatus,
      paymentStatus: isDraftOrPending ? 'UNPAID' : (po.paymentStatus || 'UNPAID'),
      advanceAmount: isDraftOrPending ? 0 : Number((po as any).advanceAmount || 0),
      paymentTerms: po.paymentTerms || 'Net 30',
      shippingFee: Number(po.shippingFee || 0),
      note: po.notes || '',
      details: details,
    };

    const res = await axiosClient.post<any, any>('/purchase/orders', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...po,
      poNumber: item?.poCode || po.poNumber,
      status: item?.status || po.status,
      paymentStatus: item?.paymentStatus || po.paymentStatus,
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
        productId: matchedProd?.id ? Number(matchedProd.id) : (prodList[idx % Math.max(1, prodList.length)]?.id ? Number(prodList[idx % Math.max(1, prodList.length)].id) : firstValidProdId),
        quantity: Math.max(1, Number(l.quantity) || 1),
        unitPrice: Math.max(1000, Number(l.unitPrice) || 1000),
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

    const rawStatus = (data.status as string) || 'DRAFT';
    const isDraftOrPending =
      rawStatus === 'DRAFT' ||
      rawStatus === 'PENDING_APPROVAL' ||
      rawStatus === 'BẢN NHÁP' ||
      rawStatus === 'CHỜ DUYỆT';

    const payload = {
      poDate: formatLocalDateTime(data.orderDate),
      expectedDate: (data.estDeliveryDate || (data as any).expectedDeliveryDate || (data as any).expectedDate) ? formatLocalDateTime(data.estDeliveryDate || (data as any).expectedDeliveryDate || (data as any).expectedDate) : null,
      supplierId: supplierId,
      branchId: branchId,
      status: rawStatus,
      paymentStatus: isDraftOrPending ? 'UNPAID' : (data.paymentStatus || 'UNPAID'),
      advanceAmount: isDraftOrPending ? 0 : Number((data as any).advanceAmount || 0),
      paymentTerms: data.paymentTerms !== undefined ? data.paymentTerms : undefined,
      shippingFee: data.shippingFee !== undefined ? Number(data.shippingFee) : undefined,
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
      requesterName: item.requesterName || item.createdBy || 'Kho vận',
      departmentName: item.departmentName || 'Kho vận',
      reason: item.reason || item.note || '',
      estimatedTotal: Number(item.estimatedTotal || item.totalAmount || 0),
      requestDate: item.requestDate ? String(item.requestDate).split('T')[0] : '',
      status: item.status || 'PENDING',
    }));
  },

  async addPurchaseRequest(pr: Omit<PurchaseRequestRecord, 'id'>): Promise<PurchaseRequestRecord> {
    let branchId = 1;
    let prodList: any[] = [];
    try {
      const [branchRes, prodRes] = await Promise.all([
        axiosClient.get<any, any>('/branches?size=100'),
        axiosClient.get<any, any>('/products?size=500')
      ]);
      const branchList: any[] = Array.isArray(branchRes) ? branchRes : (branchRes?.content || branchRes?.data || []);
      if (branchList.length > 0 && branchList[0].id) branchId = Number(branchList[0].id);
      prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.content || prodRes?.data || []);
    } catch {}

    const firstValidProdId = prodList.length > 0 && prodList[0].id ? Number(prodList[0].id) : 1;

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
      requestCode: pr.requestCode || `PR-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      requestDate: formatLocalDateTime(pr.requestDate),
      reason: pr.reason || 'Yêu cầu mua hàng bổ sung tồn kho',
      status: pr.status || 'PENDING',
      branchId: branchId,
      note: pr.reason || '',
      details: [{
        productId: firstValidProdId,
        quantity: 1,
        estimatedPrice: pr.estimatedTotal || 100000
      }],
    };

    const res = await axiosClient.post<any, any>('/purchase/requests', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...pr,
      ...(item || {}),
    };
  },

  async updatePurchaseRequest(id: string, data: Partial<PurchaseRequestRecord>): Promise<Partial<PurchaseRequestRecord>> {
    let branchId = 1;
    let prodList: any[] = [];
    try {
      const [branchRes, prodRes] = await Promise.all([
        axiosClient.get<any, any>('/branches?size=100'),
        axiosClient.get<any, any>('/products?size=500')
      ]);
      const branchList: any[] = Array.isArray(branchRes) ? branchRes : (branchRes?.content || branchRes?.data || []);
      if (branchList.length > 0 && branchList[0].id) branchId = Number(branchList[0].id);
      prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.content || prodRes?.data || []);
    } catch {}

    const firstValidProdId = prodList.length > 0 && prodList[0].id ? Number(prodList[0].id) : 1;

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
      requestCode: data.requestCode,
      requestDate: formatLocalDateTime(data.requestDate),
      reason: data.reason || 'Yêu cầu mua hàng bổ sung tồn kho',
      status: data.status || 'PENDING',
      branchId: branchId,
      note: data.reason || '',
      details: [{
        productId: firstValidProdId,
        quantity: 1,
        estimatedPrice: data.estimatedTotal || 100000
      }],
    };

    const res = await axiosClient.put<any, any>(`/purchase/requests/${id}`, payload);
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
    const payload = {
      contractCode: ctr.contractCode,
      supplierId: (ctr as any).supplierId ? Number((ctr as any).supplierId) : 1,
      startDate: ctr.startDate || new Date().toISOString().split('T')[0],
      endDate: ctr.endDate || new Date().toISOString().split('T')[0],
      contractValue: ctr.contractValue || 0,
      title: ctr.title || '',
      status: ctr.status || 'ACTIVE',
    };
    const res = await axiosClient.post<any, any>('/purchase/contracts', payload);
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
      evaluatedDate: item.evalDate ? item.evalDate.split('T')[0] : (item.evaluatedDate ? item.evaluatedDate.split('T')[0] : ''),
    }));
  },

  async addSupplierEvaluation(evalItem: Omit<SupplierEvaluationRecord, 'id'>): Promise<SupplierEvaluationRecord> {
    const payload = {
      supplierId: (evalItem as any).supplierId ? Number((evalItem as any).supplierId) : 1,
      evalDate: evalItem.evaluatedDate || new Date().toISOString().split('T')[0],
      qualityScore: evalItem.qualityScore || 5,
      deliveryScore: evalItem.deliveryScore || 5,
      priceScore: evalItem.priceScore || 5,
      serviceScore: evalItem.overallScore || 5,
      notes: (evalItem as any).notes || `Đánh giá định kỳ ${evalItem.evaluationPeriod || ''}`,
    };
    const res = await axiosClient.post<any, any>('/purchase/evaluations', payload);
    const item = res?.data || res;
    return {
      id: String(item?.id || Date.now()),
      ...evalItem,
      ...(item || {}),
    };
  },
};
