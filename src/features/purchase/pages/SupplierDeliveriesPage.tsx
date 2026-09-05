import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  Building2,
  PackageCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Lock,
  ShoppingBag,
  Star,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';
import { toast } from 'sonner';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { usePurchaseStore } from '@/features/purchase/store/purchaseStore';

export interface DeliveryLineItem {
  id: string;
  productId?: number;
  productVariantId: number;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  currentReceiveQty: number;
  unitPrice: number;
  subTotal: number;
}

export interface SupplierDeliveryRecord {
  id: string;
  deliveryCode: string;
  poCode: string;
  purchaseOrderId?: number;
  supplierName: string;
  supplierCode?: string;
  branchName: string;
  branchId?: number | string;
  expectedDate: string;
  actualDate?: string;
  receiver: string;
  status: 'CHO_NHAN' | 'DANG_NHAN' | 'DA_NHAN' | 'DA_HUY';
  notes?: string;
  totalItems?: number;
  totalQuantity?: number;
  totalAmount?: number;
  paidAmount?: number;
  paymentStatus?: 'UNPAID' | 'PARTIAL' | 'PAID';
  paymentMethod?: string;
  lines?: DeliveryLineItem[];
}

export interface PurchaseOrderLookupItem {
  id: number;
  poCode: string;
  supplierId?: number;
  supplierName: string;
  supplierCode?: string;
  branchId?: number;
  branchName: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  paymentStatus?: string;
  advanceAmount?: number;
  lines: DeliveryLineItem[];
}

export function SupplierDeliveriesPage() {
  const [data, setData] = useState<SupplierDeliveryRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderLookupItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [selected, setSelected] = useState<SupplierDeliveryRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const navigate = useNavigate();
  // Loading & Error states
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Form State for Goods Receipt Modal
  const [selectedPoId, setSelectedPoId] = useState<string>('');
  const [editingItem, setEditingItem] = useState<Partial<SupplierDeliveryRecord>>({});
  const [deliveryLines, setDeliveryLines] = useState<DeliveryLineItem[]>([]);

  const [apiBranches, setApiBranches] = useState<{ id: number; name: string }[]>([]);
  const [apiUsers, setApiUsers] = useState<{ id: string; fullName: string; role?: string; email?: string }[]>([]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        let bRes: any = await axiosClient.get('/branches');
        let list = Array.isArray(bRes) ? bRes : (bRes?.data || bRes?.content || []);
        if (!list || list.length === 0) {
          bRes = await axiosClient.get('/purchase/dropdowns/branches');
          list = Array.isArray(bRes) ? bRes : (bRes?.data || []);
        }
        const mapped = list.map((b: any) => ({
          id: Number(b.id),
          name: b.branchName || b.name || ''
        })).filter((b: any) => b.name);
        if (mapped.length > 0) {
          setApiBranches(mapped);
        } else {
          setApiBranches([
            { id: 1, name: 'Hội Sở Chính Hà Nội' },
            { id: 2, name: 'Chi nhánh Quận 1 TP.HCM' },
            { id: 3, name: 'Chi nhánh Đà Nẵng' },
            { id: 4, name: 'Chi nhánh Cần Thơ (Ninh Kiều)' },
            { id: 5, name: 'Chi nhánh Hải Phòng' },
            { id: 6, name: 'Chi nhánh Cầu Giấy, Hà Nội' },
          ]);
        }
      } catch {
        setApiBranches([
          { id: 1, name: 'Hội Sở Chính Hà Nội' },
          { id: 2, name: 'Chi nhánh Quận 1 TP.HCM' },
          { id: 3, name: 'Chi nhánh Đà Nẵng' },
          { id: 4, name: 'Chi nhánh Cần Thơ (Ninh Kiều)' },
          { id: 5, name: 'Chi nhánh Hải Phòng' },
          { id: 6, name: 'Chi nhánh Cầu Giấy, Hà Nội' },
        ]);
      }
    };

    const loadUsers = async () => {
      try {
        let uRes: any = await axiosClient.get('/users');
        let list = Array.isArray(uRes) ? uRes : (uRes?.data || uRes?.content || []);
        if (!list || list.length === 0) {
          uRes = await axiosClient.get('/purchase/dropdowns/employees');
          list = Array.isArray(uRes) ? uRes : (uRes?.data || []);
        }
        const mapped = list.map((u: any) => ({
          id: String(u.id),
          fullName: u.fullName || u.name || u.username || 'Thủ kho',
          role: u.role?.roleName || u.roleName || u.role || 'Thủ kho',
          email: u.email || '',
        })).filter((u: any) => u.fullName);
        if (mapped.length > 0) setApiUsers(mapped);
      } catch (err) {
        console.warn('Failed to load users:', err);
      }
    };

    loadBranches();
    loadUsers();
  }, []);

  // Fetch Supplier Deliveries / Import Receipts & Purchase Orders
  const fetchDeliveries = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      // 1. Fetch Purchase Orders for Lookup
      try {
        const poRes = await axiosClient.get('/purchase/orders');
        const poList = Array.isArray(poRes) ? poRes : (poRes as any)?.content || [];
        const mappedPOs: PurchaseOrderLookupItem[] = poList.map((po: any) => {
          const rawLines = Array.isArray(po.details) ? po.details : (Array.isArray(po.items) ? po.items : (Array.isArray(po.orderLines) ? po.orderLines : (Array.isArray(po.poLines) ? po.poLines : [])));
          const parsedLines: DeliveryLineItem[] = rawLines.map((l: any, idx: number) => {
            const pName = l.productName || l.productNameSnapshot || l.product?.name || `Sản phẩm ${idx + 1}`;
            const pSku = l.sku || l.productCode || l.barcode || `SKU-PO-${idx + 1}`;
            const qty = Number(l.quantity || l.orderedQuantity || 1);
            const recQty = Number(l.receivedQuantity || 0);
            const price = Number(l.unitPrice || l.unitPriceSnapshot || l.price || 0);
            const curRecQty = Math.max(0, qty - recQty);
            return {
              id: String(l.id || idx + 1),
              productId: Number(l.productId || l.product?.id || idx + 1),
              productVariantId: Number(l.productVariantId || l.variantId || l.productId || idx + 1),
              productName: pName,
              sku: pSku,
              orderedQty: qty,
              receivedQty: recQty,
              currentReceiveQty: curRecQty,
              unitPrice: price,
              subTotal: curRecQty * price,
            };
          });

          const branchStr = po.destinationStore || po.branchName || po.branch?.branchName || po.branch?.name || 'Chi nhánh chính';
          let poOverrides: Record<string, any> = {};
          try {
            const poSaved = localStorage.getItem('retailhub_po_payment_overrides');
            if (poSaved) poOverrides = JSON.parse(poSaved);
          } catch {}
          const poCode = po.poNumber || po.poCode || `PO-2026-${String(po.id).padStart(5, '0')}`;
          const poOv = poOverrides[String(po.id)] || poOverrides[poCode] || {};
          const poStatus = poOv.status || po.status || 'APPROVED';
          const poPayStatus = poOv.paymentStatus || po.paymentStatus || 'UNPAID';
          const poAdvance = poOv.advanceAmount !== undefined ? Number(poOv.advanceAmount) : Number(po.advanceAmount || 0);

          return {
            id: Number(po.id),
            poCode,
            supplierId: Number(po.supplierId || po.supplier?.id || 1),
            supplierName: po.supplierName || po.supplier?.name || 'Nhà cung cấp',
            supplierCode: po.supplierCode || po.supplier?.supplierCode || 'SUP-00125',
            branchId: Number(po.branchId || po.branch?.id || 1),
            branchName: branchStr,
            orderDate: po.orderDate ? String(po.orderDate).substring(0, 10) : new Date().toISOString().substring(0, 10),
            totalAmount: Number(po.totalAmount || 0),
            status: poStatus,
            paymentStatus: poPayStatus,
            advanceAmount: poAdvance,
            lines: parsedLines,
          };
        });

        // CHỈ LẤY CÁC ĐƠN ĐÃ ĐƯỢC DUYỆT / ĐANG GIAO HÀNG ĐỂ TẠO ĐỢT NHẬN HÀNG (LOẠI BỎ DRAFT / CHỜ DUYỆT)
        const approvedPOs = mappedPOs.filter((po) => {
          const st = String(po.status || '').toUpperCase();
          return st !== 'DRAFT' && st !== 'PENDING_APPROVAL' && st !== 'BẢN NHÁP' && st !== 'CHỜ DUYỆT' && st !== 'CANCELLED' && st !== 'ĐÃ HỦY';
        });
        setPurchaseOrders(approvedPOs);
      } catch (e) {
        console.warn('Failed to fetch PO list for lookup:', e);
      }

      // 2. Fetch Import Receipts / Deliveries
      let receiptsList: any[] = [];
      try {
        const importRes = await axiosClient.get('/inventory/imports');
        receiptsList = Array.isArray(importRes) ? importRes : (importRes as any)?.content || [];
      } catch {
        const poResFallback = await axiosClient.get('/purchase/orders');
        receiptsList = Array.isArray(poResFallback) ? poResFallback : (poResFallback as any)?.content || [];
      }

      let overrides: Record<string, any> = {};
      try {
        const saved = localStorage.getItem('retailhub_supplier_deliveries_overrides');
        if (saved) overrides = JSON.parse(saved);
      } catch {}

      const mappedDeliveries: SupplierDeliveryRecord[] = receiptsList.map((item: any) => {
        const override = overrides[String(item.id)] || overrides[item.receiptCode] || overrides[item.deliveryCode];
        const statusStr = override?.status
          ? String(override.status).toUpperCase()
          : String(item.status || '').toUpperCase();

        const status: SupplierDeliveryRecord['status'] =
          statusStr === 'COMPLETED' ||
          statusStr === 'COMPLETE' ||
          statusStr === 'RECEIVED' ||
          statusStr === 'DA_NHAN' ||
          statusStr === 'INSPECTED_ACCEPTED' ||
          statusStr === 'PASSED'
            ? 'DA_NHAN'
            : statusStr === 'CANCELLED' || statusStr === 'DA_HUY'
              ? 'DA_HUY'
              : statusStr === 'RECEIVING' || statusStr === 'DANG_NHAN' || statusStr === 'PARTIAL_ACCEPTANCE'
                ? 'DANG_NHAN'
                : 'CHO_NHAN';

        const totalAmount = Number(override?.totalAmount || item.totalAmount || 0);
        const paidAmount = override?.paidAmount !== undefined
          ? Number(override.paidAmount)
          : (item.paidAmount !== undefined
            ? Number(item.paidAmount)
            : (status === 'DA_NHAN' ? totalAmount : 0));
        let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = override?.paymentStatus || item.paymentStatus;
        if (!paymentStatus) {
          paymentStatus = paidAmount >= totalAmount && totalAmount > 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID');
        }
        const paymentMethod = override?.paymentMethod || item.paymentMethod || 'Chuyển khoản';

        return {
          id: String(item.id),
          deliveryCode: item.receiptCode || item.deliveryCode || `GR-2026-${String(item.id).padStart(6, '0')}`,
          poCode: item.purchaseOrderCode || item.poNumber || item.poCode || 'PO-2026-00125',
          purchaseOrderId: item.purchaseOrderId || item.purchaseOrder?.id,
          supplierName: item.supplierName || item.supplier?.name || 'Nhà cung cấp',
          supplierCode: item.supplierCode || 'SUP-001',
          branchName: override?.branchName || item.branchName || item.branch?.branchName || 'Chi nhánh mặc định',
          expectedDate: item.receiptDate ? String(item.receiptDate).substring(0, 10) : (item.estDeliveryDate ? String(item.estDeliveryDate).substring(0, 10) : new Date().toISOString().substring(0, 10)),
          actualDate: status === 'DA_NHAN' ? (override?.actualDate || (item.actualDate ? String(item.actualDate).substring(0, 10) : new Date().toISOString().substring(0, 10))) : undefined,
          receiver: override?.receiver || item.createdBy || item.orderedBy || item.inspectedBy || 'Thủ kho',
          status,
          notes: override?.notes || item.note || item.notes || 'Đợt nhận hàng theo đơn đặt hàng PO',
          totalItems: Number(item.totalItems || (Array.isArray(item.receiptLines) ? item.receiptLines.length : 0)),
          totalAmount,
          paidAmount,
          paymentStatus,
          paymentMethod,
          lines: Array.isArray(item.receiptLines) ? item.receiptLines.map((l: any, idx: number) => ({
            id: String(l.id || idx + 1),
            productVariantId: Number(l.productVariantId || l.id || idx + 1),
            productName: l.productName || l.productNameSnapshot || `Sản phẩm ${idx + 1}`,
            sku: l.sku || l.skuSnapshot || `SKU-${idx + 1}`,
            orderedQty: Number(l.quantity || 0),
            receivedQty: status === 'DA_NHAN' ? Number(l.quantity || 0) : 0,
            currentReceiveQty: Number(l.quantity || 0),
            unitPrice: Number(l.unitCost || l.unitCostSnapshot || 0),
            subTotal: Number(l.subTotal || 0),
          })) : undefined,
        };
      });

      let createdDeliveries: SupplierDeliveryRecord[] = [];
      try {
        createdDeliveries = JSON.parse(localStorage.getItem('retailhub_created_deliveries') || '[]');
      } catch {}

      const combined = [
        ...createdDeliveries,
        ...mappedDeliveries.filter((m) => !createdDeliveries.some((c) => c.deliveryCode === m.deliveryCode || c.id === m.id)),
      ];

      setData(combined);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử nhận hàng:', err);
      setHasError(true);
      toast.error('Không thể tải lịch sử nhận hàng từ máy chủ');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Filtered Table Data
  const filtered = useMemo(() => {
    return data.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch = !search || (
        item.deliveryCode.toLowerCase().includes(q) ||
        item.poCode.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q) ||
        item.receiver.toLowerCase().includes(q) ||
        item.branchName.toLowerCase().includes(q)
      );
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, data]);

  // Lọc danh sách PO có sẵn để tạo đợt nhận hàng:
  // Chặn không cho phép chọn các PO đã nhận hàng, đã hoàn tất, hoặc đã có đợt nhận hàng trong hệ thống
  const availablePurchaseOrders = useMemo(() => {
    // 1. Tập hợp các mã PO đã có phiếu nhận hàng trong hệ thống (chưa bị hủy)
    const existingDeliveryPoCodes = new Set(
      data
        .filter((d) => d.status !== 'DA_HUY' && d.status !== 'CANCELLED' && (modalMode === 'create' || String(d.id) !== String(editingItem.id)))
        .map((d) => d.poCode?.trim().toLowerCase())
        .filter(Boolean)
    );

    return purchaseOrders.filter((po) => {
      const poCodeLower = po.poCode?.trim().toLowerCase() || '';
      const st = String(po.status || '').toUpperCase();

      // Kiểm tra trạng thái đã hoàn tất nhận hàng
      const isDelivered =
        st === 'DELIVERED' ||
        st === 'RECEIVED' ||
        st === 'DA_NHAN' ||
        st === 'COMPLETED' ||
        st === 'COMPLETE' ||
        st === 'ĐÃ NHẬN HÀNG' ||
        st === 'INSPECTED_ACCEPTED';

      // Kiểm tra đã có phiếu nhận hàng (đơn nhập) nào được tạo trước đó chưa
      const isAlreadyImported = existingDeliveryPoCodes.has(poCodeLower);

      // Nếu đang ở chế độ chỉnh sửa đợt nhận hàng hiện tại thì cho phép giữ nguyên PO này
      if (modalMode === 'edit' && poCodeLower === editingItem.poCode?.trim().toLowerCase()) {
        return true;
      }

      // Đơn đã nhận đủ, hoặc đã có đợt nhận hàng trong hệ thống thì không cho tạo thêm đợt nhận mới
      if (isDelivered || isAlreadyImported) {
        return false;
      }

      // Loại bỏ đơn đã hủy
      if (st === 'CANCELLED' || st === 'ĐÃ HỦY') {
        return false;
      }

      return true;
    });
  }, [purchaseOrders, data, modalMode, editingItem.id, editingItem.poCode]);

  // Handle PO Selection in Form
  const handleSelectPo = (poVal: string) => {
    setSelectedPoId(poVal);
    const matchedPo = purchaseOrders.find((p) => p.poCode === poVal || String(p.id) === poVal || p.poCode.toLowerCase() === poVal.toLowerCase());
    if (matchedPo) {
      const defaultPaid = matchedPo.paymentStatus === 'PAID' ? matchedPo.totalAmount : (matchedPo.advanceAmount || 0);
      const defaultPayStatus: 'UNPAID' | 'PARTIAL' | 'PAID' =
        matchedPo.paymentStatus === 'PAID'
          ? 'PAID'
          : matchedPo.paymentStatus === 'PARTIAL_ADVANCE' || defaultPaid > 0
            ? 'PARTIAL'
            : 'UNPAID';

      setEditingItem((prev) => ({
        ...prev,
        poCode: matchedPo.poCode,
        purchaseOrderId: matchedPo.id,
        supplierName: matchedPo.supplierName,
        supplierCode: matchedPo.supplierCode,
        branchId: matchedPo.branchId || prev.branchId,
        branchName: matchedPo.branchName || prev.branchName,
        paidAmount: defaultPaid,
        paymentStatus: defaultPayStatus,
        paymentMethod: prev.paymentMethod || 'Chuyển khoản',
      }));
      setDeliveryLines(matchedPo.lines.map(l => ({ ...l })));
    } else {
      setEditingItem((prev) => ({
        ...prev,
        poCode: '',
        supplierName: '',
        supplierCode: '',
        paidAmount: 0,
        paymentStatus: 'UNPAID',
      }));
      setDeliveryLines([]);
    }
  };

  // Handle Changing Received Quantity for a Line Item
  const handleLineQtyChange = (id: string, qtyStr: string) => {
    setDeliveryLines((prev) => {
      const updated = prev.map((line) => {
        if (line.id === id) {
          const rawNum = Math.max(0, Number(qtyStr) || 0);
          const cappedQty = Math.min(line.orderedQty, rawNum);
          return {
            ...line,
            currentReceiveQty: cappedQty,
            subTotal: cappedQty * line.unitPrice,
          };
        }
        return line;
      });

      const totalOrdered = updated.reduce((sum, l) => sum + (Number(l.orderedQty) || 0), 0);
      const totalRecv = updated.reduce((sum, l) => sum + (Number(l.currentReceiveQty) || 0), 0);
      let autoStatus: SupplierDeliveryRecord['status'] = 'CHO_NHAN';
      if (totalRecv >= totalOrdered && totalOrdered > 0) {
        autoStatus = 'DA_NHAN';
      } else if (totalRecv > 0) {
        autoStatus = 'DANG_NHAN'; // Nhận 1 phần
      }
      setEditingItem((cur) => ({ ...cur, status: autoStatus }));

      return updated;
    });
  };

  // Summary Metrics of Current Delivery Form
  const formSummary = useMemo(() => {
    const totalLines = deliveryLines.length;
    const activeLinesCount = deliveryLines.filter((l) => l.currentReceiveQty > 0).length;
    const totalReceiveQty = deliveryLines.reduce((sum, l) => sum + (Number(l.currentReceiveQty) || 0), 0);
    const totalAmount = deliveryLines.reduce((sum, l) => sum + (Number(l.subTotal) || 0), 0);
    return { totalLines, activeLinesCount, totalReceiveQty, totalAmount };
  }, [deliveryLines]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedPoId('');
    setDeliveryLines([]);
    const defaultBranch = apiBranches[0] || { id: 1, name: 'Chi nhánh chính' };
    setEditingItem({
      deliveryCode: `GR-2026-${Date.now().toString().slice(-6)}`,
      poCode: '',
      supplierName: '',
      supplierCode: '',
      branchId: defaultBranch.id,
      branchName: defaultBranch.name,
      expectedDate: new Date().toISOString().split('T')[0],
      receiver: 'Nguyễn Văn Hùng (Thủ kho - Chi nhánh chính)',
      status: 'CHO_NHAN',
      notes: '',
      paidAmount: 0,
      paymentStatus: 'UNPAID',
      paymentMethod: 'Chuyển khoản',
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: SupplierDeliveryRecord) => {
    setModalMode('edit');
    const matchedPo = purchaseOrders.find(
      (p) =>
        (item.poCode && p.poCode.trim().toLowerCase() === item.poCode.trim().toLowerCase()) ||
        (item.purchaseOrderId && String(p.id) === String(item.purchaseOrderId))
    );
    const targetPoCode = matchedPo ? matchedPo.poCode : (item.poCode || '');
    setSelectedPoId(targetPoCode);

    const isCompleted = item.status === 'DA_NHAN';
    const initialPaid = item.paidAmount !== undefined
      ? item.paidAmount
      : (item.paymentStatus === 'PAID' || isCompleted ? (item.totalAmount || 0) : 0);
    const initialPayStatus: 'UNPAID' | 'PARTIAL' | 'PAID' =
      item.paymentStatus || (initialPaid >= (item.totalAmount || 0) && (item.totalAmount || 0) > 0 ? 'PAID' : (initialPaid > 0 ? 'PARTIAL' : 'UNPAID'));

    setEditingItem({
      ...item,
      purchaseOrderId: matchedPo ? matchedPo.id : item.purchaseOrderId,
      poCode: matchedPo ? matchedPo.poCode : item.poCode,
      supplierName: matchedPo ? matchedPo.supplierName : item.supplierName,
      supplierCode: matchedPo ? matchedPo.supplierCode : item.supplierCode,
      paidAmount: initialPaid,
      paymentStatus: initialPayStatus,
      paymentMethod: item.paymentMethod || 'Chuyển khoản',
    });
    if (item.lines && item.lines.length > 0) {
      setDeliveryLines(item.lines);
    } else if (matchedPo && matchedPo.lines && matchedPo.lines.length > 0) {
      setDeliveryLines(matchedPo.lines.map((l) => ({ ...l })));
    } else {
      setDeliveryLines([]);
    }
    setIsModalOpen(true);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit Goods Receipt Form
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!editingItem.poCode || !editingItem.supplierName) {
      toast.error('Vui lòng chọn Đơn mua PO hợp lệ trước khi lưu!');
      return;
    }

    // CHẶN TẠO TRÙNG ĐỢT NHẬN HÀNG KHI ĐƠN PO ĐÃ CÓ PHIẾU HOẶC ĐÃ HOÀN TẤT
    if (modalMode === 'create') {
      const poCodeTarget = editingItem.poCode?.trim().toLowerCase();
      const existingImport = data.find(
        (d) => d.poCode?.trim().toLowerCase() === poCodeTarget && d.status !== 'DA_HUY' && d.status !== 'CANCELLED'
      );
      if (existingImport) {
        toast.error(`Đơn mua ${editingItem.poCode} đã có đợt nhận hàng (${existingImport.deliveryCode} - ${existingImport.status === 'DA_NHAN' ? 'Đã nhận đủ' : 'Đang xử lý'})! Không thể tạo thêm đợt nhận hàng trùng.`);
        return;
      }

      const matchedPO = purchaseOrders.find((p) => p.poCode?.trim().toLowerCase() === poCodeTarget);
      if (matchedPO) {
        const st = String(matchedPO.status || '').toUpperCase();
        if (
          st === 'DELIVERED' ||
          st === 'RECEIVED' ||
          st === 'DA_NHAN' ||
          st === 'COMPLETED' ||
          st === 'COMPLETE' ||
          st === 'ĐÃ NHẬN HÀNG' ||
          st === 'INSPECTED_ACCEPTED'
        ) {
          toast.error(`Đơn mua ${editingItem.poCode} đã được nhận hàng hoàn tất trước đó! Không thể tạo thêm đợt nhận hàng.`);
          return;
        }
      }
    }

    if (formSummary.totalReceiveQty <= 0) {
      toast.error('Số lượng nhận lần này phải lớn hơn 0!');
      return;
    }

    setIsSubmitting(true);
    const currentBranchList = apiBranches.length > 0
      ? apiBranches
      : [
          { id: 1, name: 'Chi nhánh chính' },
          { id: 2, name: 'Đà Nẵng' },
          { id: 3, name: 'Hà Nội' },
          { id: 4, name: 'TP. Hồ Chí Minh' }
        ];
    const matchedBranch = currentBranchList.find(b => b.name.toLowerCase() === (editingItem.branchName || '').toLowerCase());
    const finalBranchId = editingItem.branchId || matchedBranch?.id || 1;
    const finalBranchName = editingItem.branchName || matchedBranch?.name || 'Chi nhánh chính';

    const isCompleted = editingItem.status === 'DA_NHAN';
    const statusPayload = isCompleted ? 'COMPLETE' : editingItem.status === 'DA_HUY' ? 'CANCELLED' : editingItem.status === 'DANG_NHAN' ? 'RECEIVING' : 'PENDING';

    const finalPaidAmount = Number(editingItem.paidAmount || 0);
    const finalPaymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' =
      finalPaidAmount >= formSummary.totalAmount && formSummary.totalAmount > 0
        ? 'PAID'
        : finalPaidAmount > 0
          ? 'PARTIAL'
          : 'UNPAID';
    const finalPaymentMethod = editingItem.paymentMethod || 'Chuyển khoản';

    const payload = {
      receiptCode: editingItem.deliveryCode,
      purchaseOrderId: editingItem.purchaseOrderId || (selectedPoId ? Number(selectedPoId) : 1),
      purchaseOrderCode: editingItem.poCode,
      supplierName: editingItem.supplierName,
      supplierCode: editingItem.supplierCode || 'SUP-00125',
      branchId: finalBranchId,
      branchName: finalBranchName,
      receiptDate: editingItem.expectedDate ? `${editingItem.expectedDate}T00:00:00` : new Date().toISOString(),
      totalAmount: formSummary.totalAmount,
      status: statusPayload,
      createdBy: editingItem.receiver || 'Thủ kho',
      note: editingItem.notes || 'Tạo đợt nhận hàng cho đơn PO',
      receiptLines: deliveryLines.map((line) => ({
        productVariantId: line.productVariantId,
        productName: line.productName,
        sku: line.sku,
        quantity: line.currentReceiveQty,
        unitCost: line.unitPrice,
        subTotal: line.subTotal,
      })),
    };

    const newRecord: SupplierDeliveryRecord = {
      id: String(editingItem.id || Date.now()),
      deliveryCode: editingItem.deliveryCode || `GR-${Date.now()}`,
      poCode: editingItem.poCode || '',
      purchaseOrderId: editingItem.purchaseOrderId,
      supplierName: editingItem.supplierName || '',
      supplierCode: editingItem.supplierCode || '',
      branchId: finalBranchId,
      branchName: finalBranchName,
      expectedDate: editingItem.expectedDate || new Date().toISOString().split('T')[0],
      actualDate: isCompleted ? new Date().toISOString().split('T')[0] : undefined,
      receiver: editingItem.receiver || 'Nguyễn Văn Hùng (Thủ kho)',
      status: editingItem.status || 'CHO_NHAN',
      notes: editingItem.notes || '',
      totalItems: formSummary.activeLinesCount,
      totalQuantity: formSummary.totalReceiveQty,
      totalAmount: formSummary.totalAmount,
      paidAmount: finalPaidAmount,
      paymentStatus: finalPaymentStatus,
      paymentMethod: finalPaymentMethod,
      lines: deliveryLines,
    };

    try {
      if (modalMode === 'create') {
        console.log('[SupplierDeliveries] CREATE payload:', JSON.stringify(payload, null, 2));
        const createRes = await axiosClient.post('/inventory/imports', payload);
        console.log('[SupplierDeliveries] CREATE response:', createRes);
        const createdId = (createRes as any)?.data?.id || (createRes as any)?.id;
        toast.success(`Tạo đợt nhận hàng ${editingItem.deliveryCode} thành công!`);

        // If status is "Đã nhận đủ", call /complete to trigger stock addition to branch
        if (isCompleted && createdId) {
          try {
            await axiosClient.post(`/inventory/imports/${createdId}/complete`);
            toast.success(`Đã cộng tồn kho cho chi nhánh "${finalBranchName}"!`);
          } catch (completeErr) {
            console.warn('Auto-complete after create (backend may have auto-completed):', completeErr);
          }
        }
        if (createdId) newRecord.id = String(createdId);
      } else {
        if (editingItem.id && /^\d+$/.test(String(editingItem.id))) {
          console.log('[SupplierDeliveries] UPDATE payload:', JSON.stringify(payload, null, 2));
          await axiosClient.put(`/inventory/imports/${editingItem.id}`, payload);
          if (isCompleted) {
            try {
              await axiosClient.post(`/inventory/imports/${editingItem.id}/complete`);
              toast.success(`Đã cộng tồn kho cho chi nhánh "${finalBranchName}"!`);
            } catch {}
          }
        }
        toast.success(`Cập nhật đợt nhận hàng ${editingItem.deliveryCode} thành công!`);
      }

      // Save override locally for instant UI update & persistent storage
      try {
        const overrides = JSON.parse(localStorage.getItem('retailhub_supplier_deliveries_overrides') || '{}');
        const overrideObj = {
          status: editingItem.status,
          branchName: finalBranchName,
          actualDate: isCompleted ? new Date().toISOString().split('T')[0] : undefined,
          totalAmount: formSummary.totalAmount,
          paidAmount: finalPaidAmount,
          paymentStatus: finalPaymentStatus,
          paymentMethod: finalPaymentMethod,
          notes: editingItem.notes,
          receiver: editingItem.receiver,
        };
        if (editingItem.deliveryCode) overrides[editingItem.deliveryCode] = overrideObj;
        if (editingItem.id) overrides[String(editingItem.id)] = overrideObj;
        localStorage.setItem('retailhub_supplier_deliveries_overrides', JSON.stringify(overrides));
      } catch {}

      // TỰ ĐỘNG ĐỒNG BỘ TRẠNG THÁI SANG ĐƠN ĐẶT MUA PO SAU KHI NHẬP KHO THÀNH CÔNG
      try {
        const currentPOs = usePurchaseStore.getState().purchaseOrders;
        const matchingPo = currentPOs.find(
          (p) => p.poNumber === editingItem.poCode || String(p.id) === String(editingItem.purchaseOrderId)
        );

        const poPaymentStatus = finalPaidAmount >= formSummary.totalAmount && formSummary.totalAmount > 0
          ? 'PAID'
          : finalPaidAmount > 0
            ? 'PARTIAL_ADVANCE'
            : (matchingPo?.paymentStatus || 'UNPAID');

        const poOverrideData = {
          paymentStatus: poPaymentStatus,
          advanceAmount: finalPaidAmount > 0 ? finalPaidAmount : matchingPo?.advanceAmount,
          paidAmount: finalPaidAmount > 0 ? finalPaidAmount : matchingPo?.paidAmount,
          status: isCompleted ? 'RECEIVED' : (matchingPo?.status || 'APPROVED'),
        };

        const poOverrides = JSON.parse(localStorage.getItem('retailhub_po_payment_overrides') || '{}');
        if (editingItem.poCode) poOverrides[editingItem.poCode] = { ...poOverrides[editingItem.poCode], ...poOverrideData };
        if (editingItem.purchaseOrderId) poOverrides[String(editingItem.purchaseOrderId)] = { ...poOverrides[String(editingItem.purchaseOrderId)], ...poOverrideData };
        localStorage.setItem('retailhub_po_payment_overrides', JSON.stringify(poOverrides));

        if (matchingPo) {
          usePurchaseStore.getState().updatePurchaseOrder(matchingPo.id, {
            paymentStatus: poPaymentStatus,
            advanceAmount: poOverrideData.advanceAmount,
            status: isCompleted ? 'RECEIVED' : matchingPo.status,
          } as any).catch(() => {});
        }

        setPurchaseOrders((prev) => prev.map((p) => {
          if (p.poCode === editingItem.poCode || String(p.id) === String(editingItem.purchaseOrderId)) {
            return {
              ...p,
              status: isCompleted ? 'RECEIVED' : p.status,
              paymentStatus: poPaymentStatus,
              advanceAmount: poOverrideData.advanceAmount,
            };
          }
          return p;
        }));

        if (isCompleted) {
          toast.success(`Đã cập nhật trạng thái đơn mua ${editingItem.poCode || ''} thành "ĐÃ NHẬN HÀNG (RECEIVED)"`);
        }
      } catch (syncErr) {
        console.warn('Lỗi khi đồng bộ trạng thái sang PO:', syncErr);
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      console.error('[SupplierDeliveries] API ERROR:', err?.response?.status, errMsg, err);
      toast.error(`Lỗi khi lưu đợt nhận hàng: ${errMsg}`);
      return;
    } finally {
      setIsSubmitting(false);
    }

    await fetchDeliveries();
    useInventoryStore.getState().fetchProducts();
    setIsModalOpen(false);
  };

  const [deletingItem, setDeletingItem] = useState<SupplierDeliveryRecord | null>(null);
  const [receivingItem, setReceivingItem] = useState<SupplierDeliveryRecord | null>(null);

  // Delete Delivery Record
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const id = deletingItem.id;
    try {
      if (/^\d+$/.test(String(id))) {
        await axiosClient.delete(`/inventory/imports/${id}`);
      }
      try {
        const stored = JSON.parse(localStorage.getItem('retailhub_created_deliveries') || '[]');
        localStorage.setItem('retailhub_created_deliveries', JSON.stringify(stored.filter((s: any) => s.id !== id && s.deliveryCode !== id)));
      } catch {}
      setData((prev) => prev.filter((i) => i.id !== id && i.deliveryCode !== id));
      toast.success(`Đã xóa đợt nhận hàng "${deletingItem.deliveryCode}" thành công!`);
      if (selected?.id === id) setSelected(null);
      setDeletingItem(null);
    } catch (err: any) {
      console.error('API delete delivery failed:', err);
      toast.error('Lỗi khi xóa đợt giao nhận: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const handleConfirmReceive = async () => {
    if (!receivingItem) return;
    const rec = receivingItem;
    const recId = rec.id;
    try {
      if (/^\d+$/.test(String(recId))) {
        await axiosClient.post(`/inventory/imports/${recId}/complete`);
      }

      // Update local state
      setData((prev) => prev.map((item) =>
        item.id === recId || item.deliveryCode === rec.deliveryCode
          ? { ...item, status: 'DA_NHAN' as const, actualDate: new Date().toISOString().split('T')[0] }
          : item
      ));

      // Update overrides
      try {
        const overrides = JSON.parse(localStorage.getItem('retailhub_supplier_deliveries_overrides') || '{}');
        const ov = { ...overrides[recId], status: 'DA_NHAN', actualDate: new Date().toISOString().split('T')[0] };
        overrides[recId] = ov;
        if (rec.deliveryCode) overrides[rec.deliveryCode] = ov;
        localStorage.setItem('retailhub_supplier_deliveries_overrides', JSON.stringify(overrides));
      } catch {}

      try {
        const stored: any[] = JSON.parse(localStorage.getItem('retailhub_created_deliveries') || '[]');
        localStorage.setItem('retailhub_created_deliveries', JSON.stringify(stored.map((s) =>
          s.id === recId || s.deliveryCode === rec.deliveryCode
            ? { ...s, status: 'DA_NHAN', actualDate: new Date().toISOString().split('T')[0] }
            : s
        )));
      } catch {}

      // Đồng bộ trạng thái nhận hàng & thanh toán sang Đơn mua PO
      const recPaid = rec.paidAmount !== undefined ? rec.paidAmount : (rec.paymentStatus === 'PAID' ? (rec.totalAmount || 0) : 0);
      const poPayStatus: 'UNPAID' | 'PARTIAL_ADVANCE' | 'PAID' =
        rec.paymentStatus === 'PAID' || (recPaid >= (rec.totalAmount || 0) && (rec.totalAmount || 0) > 0)
          ? 'PAID'
          : recPaid > 0
            ? 'PARTIAL_ADVANCE'
            : 'UNPAID';

      try {
        const poOverrides = JSON.parse(localStorage.getItem('retailhub_po_payment_overrides') || '{}');
        const poOvData = {
          status: 'DELIVERED',
          paymentStatus: poPayStatus,
          advanceAmount: recPaid,
          paidAmount: recPaid,
        };
        if (rec.poCode) poOverrides[rec.poCode] = { ...poOverrides[rec.poCode], ...poOvData };
        if (rec.purchaseOrderId) poOverrides[String(rec.purchaseOrderId)] = { ...poOverrides[String(rec.purchaseOrderId)], ...poOvData };
        localStorage.setItem('retailhub_po_payment_overrides', JSON.stringify(poOverrides));

        const matchingPoInStore = usePurchaseStore.getState().purchaseOrders.find(
          (p) => p.poNumber === rec.poCode || String(p.id) === String(rec.purchaseOrderId)
        );
        if (matchingPoInStore) {
          usePurchaseStore.getState().updatePurchaseOrder(matchingPoInStore.id, {
            status: 'DELIVERED',
            paymentStatus: poPayStatus,
            advanceAmount: recPaid,
          } as any).catch(() => {});
        }

        setPurchaseOrders((prev) => prev.map((p) => {
          if (p.poCode === rec.poCode || String(p.id) === String(rec.purchaseOrderId)) {
            return {
              ...p,
              status: 'DELIVERED',
              paymentStatus: poPayStatus,
              advanceAmount: recPaid,
            };
          }
          return p;
        }));
      } catch (syncErr) {
        console.warn('Lỗi đồng bộ PO trong confirmReceive:', syncErr);
      }

      useInventoryStore.getState().fetchProducts();
      toast.success(`Đã nhận hàng & cộng tồn kho cho chi nhánh "${rec.branchName}"!`);
      setReceivingItem(null);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || '';
      toast.error(`Lỗi khi nhận hàng: ${errMsg}`);
    }
  };

  // Table Column Definitions
  const columns = useMemo<ColumnDef<SupplierDeliveryRecord>[]>(
    () => [
      {
        accessorKey: 'deliveryCode',
        header: 'Mã đợt nhận',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'poCode',
        header: 'Mã đơn mua (PO)',
        cell: (info) => (
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => (
          <div>
            <span className="font-semibold text-gray-900 dark:text-white block">{info.getValue() as string}</span>
            <span className="text-xs text-gray-400 font-mono">{info.row.original.supplierCode || 'SUP-00125'}</span>
          </div>
        ),
      },
      {
        accessorKey: 'branchName',
        header: 'Kho nhận',
        cell: (info) => (
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'expectedDate',
        header: 'Ngày dự kiến',
        cell: (info) => <span className="font-mono text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng giá trị',
        cell: (info) => {
          const val = Number(info.getValue() || 0);
          return (
            <span className="font-mono font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Thanh toán',
        cell: ({ row }) => {
          const item = row.original;
          const status = item.paymentStatus || (item.status === 'DA_NHAN' ? 'PAID' : 'UNPAID');
          const paid = item.paidAmount !== undefined ? item.paidAmount : (status === 'PAID' ? (item.totalAmount || 0) : 0);
          const total = item.totalAmount || 0;
          const debt = Math.max(0, total - paid);

          return (
            <div className="space-y-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : status === 'PARTIAL'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
                {status === 'PAID' ? 'Đã thanh toán đủ' : status === 'PARTIAL' ? 'Thanh toán thiếu' : 'Chưa thanh toán'}
              </span>
              {status === 'PARTIAL' && (
                <div className="text-[10px] text-gray-500 font-mono leading-tight">
                  <span>Đã trả: <strong className="text-blue-600">{new Intl.NumberFormat('vi-VN').format(paid)}đ</strong></span>
                  <span className="block text-red-500 font-medium">Nợ: {new Intl.NumberFormat('vi-VN').format(debt)}đ</span>
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as SupplierDeliveryRecord['status'];
          const badgeClass =
            status === 'DA_NHAN'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
              : status === 'DANG_NHAN'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                : status === 'CHO_NHAN'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
          
          const label =
            status === 'DA_NHAN'
              ? 'Đã nhận đủ'
              : status === 'DANG_NHAN'
                ? 'Đang nhận hàng'
                : status === 'CHO_NHAN'
                  ? 'Chờ nhận hàng'
                  : 'Đã hủy';
          
          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
              {status === 'DA_NHAN' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {status === 'DANG_NHAN' && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {status === 'CHO_NHAN' && <Clock className="w-3.5 h-3.5" />}
              {status === 'DA_HUY' && <XCircle className="w-3.5 h-3.5" />}
              {label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {(row.original.status === 'CHO_NHAN' || row.original.status === 'DANG_NHAN') && (
              <button
                onClick={() => setReceivingItem(row.original)}
                className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                title="Nhận hàng & cộng tồn kho"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(row.original)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <PackageCheck className="w-7 h-7 text-emerald-600" />
            Quản lý nhận hàng nhà cung cấp
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Lập đợt giao nhận hàng từ Đơn mua (PO), quản lý nhập kho thực tế và kiểm soát lịch sử giao hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Đợt Nhận Hàng Mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã đợt nhận, mã PO, nhà cung cấp, người nhận..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="CHO_NHAN">Chờ nhận hàng</option>
              <option value="DANG_NHAN">Đang nhận hàng</option>
              <option value="DA_NHAN">Đã nhận đủ</option>
              <option value="DA_HUY">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content Section: Loading, Error State, or Data Table */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-sm font-medium text-gray-500">Đang tải danh sách đợt nhận hàng...</p>
        </div>
      ) : hasError ? (
        <div className="flex flex-col items-center justify-center py-16 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40 rounded-xl space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div className="text-center">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Không thể tải lịch sử nhận hàng</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Đã xảy ra lỗi kết nối API. Vui lòng kiểm tra lại dịch vụ máy chủ.</p>
          </div>
          <button
            onClick={fetchDeliveries}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      {/* Detail Drawer Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi tiết đợt nhận hàng: ${selected.deliveryCode}` : 'Chi tiết đợt nhận hàng'}
        width="max-w-3xl"
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase">Mã đợt nhận</span>
                <span className="font-mono font-bold text-emerald-600 text-base">{selected.deliveryCode}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase">Đơn mua PO gốc</span>
                <span className="font-mono font-bold text-gray-800 dark:text-gray-200 text-base">{selected.poCode}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase">Kho nhận</span>
                <span className="font-medium text-gray-900 dark:text-white text-sm">{selected.branchName}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase">Nhà cung cấp</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">{selected.supplierName}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase">Ngày giao dự kiến</span>
                <span className="font-mono text-sm">{selected.expectedDate}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400 block uppercase">Ngày thực tế</span>
                <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{selected.actualDate || 'Chưa nhận'}</span>
              </div>
            </div>

            {/* Thông tin thanh toán & công nợ đợt nhận hàng */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/60 dark:bg-emerald-950/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng giá trị</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selected.totalAmount || 0)}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Thanh toán</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs inline-block mt-0.5 ${
                  selected.paymentStatus === 'PAID'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : selected.paymentStatus === 'PARTIAL'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }`}>
                  {selected.paymentStatus === 'PAID' ? 'Đã thanh toán đủ' : selected.paymentStatus === 'PARTIAL' ? 'Thanh toán thiếu' : 'Chưa thanh toán'}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Đã thanh toán</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selected.paidAmount || (selected.paymentStatus === 'PAID' ? (selected.totalAmount || 0) : 0))}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Hình thức</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300 text-xs block mt-0.5">
                  {selected.paymentMethod || 'Chuyển khoản'}
                </span>
              </div>
            </div>

            {selected.lines && selected.lines.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Danh sách mặt hàng nhận</h4>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="p-2.5">Sản phẩm / SKU</th>
                        <th className="p-2.5 text-center">SL Đặt</th>
                        <th className="p-2.5 text-center">SL Nhận</th>
                        <th className="p-2.5 text-right">Đơn giá</th>
                        <th className="p-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selected.lines.map((l) => (
                        <tr key={l.id}>
                          <td className="p-2.5">
                            <span className="font-semibold text-gray-900 dark:text-white block">{l.productName}</span>
                            <span className="font-mono text-gray-400">{l.sku}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono">{l.orderedQty}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-600">{l.currentReceiveQty}</td>
                          <td className="p-2.5 text-right font-mono">{new Intl.NumberFormat('vi-VN').format(l.unitPrice)}đ</td>
                          <td className="p-2.5 text-right font-mono font-bold">{new Intl.NumberFormat('vi-VN').format(l.subTotal)}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selected.notes && (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 text-xs">
                <span className="font-semibold text-gray-500 block mb-1">Ghi chú:</span>
                <p className="text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  const matchedPo = purchaseOrders.find(p => p.poCode === selected.poCode);
                  const supId = matchedPo?.supplierId || (selected as any).supplierId;
                  setSelected(null);
                  navigate(`/purchase/evaluations?supplierId=${supId || ''}`);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Star className="w-4 h-4" /> Đánh giá nhà cung cấp
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3-Section Form Modal for Creating Goods Receipt */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo đợt nhận hàng nhà cung cấp mới' : 'Sửa đợt nhận hàng'}
        size="erp"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* PHẦN 1 — THÔNG TIN NHẬN HÀNG */}
          <div className="space-y-3">
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Phần 1 — Thông tin giao nhận hàng
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Mã đợt nhận hàng (Tự động)</label>
                <input
                  type="text"
                  value={editingItem.deliveryCode || ''}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 font-mono font-bold text-emerald-600 text-sm"
                  disabled
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã PO đơn mua hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPoId}
                  onChange={(e) => handleSelectPo(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                  required
                >
                  <option value="">-- 🔍 Chọn đơn mua PO... --</option>
                  {modalMode === 'edit' && editingItem.poCode && !availablePurchaseOrders.some((p) => p.poCode.toLowerCase() === editingItem.poCode?.toLowerCase()) && (
                    <option value={editingItem.poCode}>
                      {editingItem.poCode} - {editingItem.supplierName} ({editingItem.status === 'DA_NHAN' ? 'Đã nhận đủ' : 'Đơn hiện tại'})
                    </option>
                  )}
                  {availablePurchaseOrders.length === 0 && !editingItem.poCode && (
                    <option value="" disabled>-- ⚠️ Không có đơn PO nào chờ nhận hàng --</option>
                  )}
                  {availablePurchaseOrders.map((po) => (
                    <option key={po.id || po.poCode} value={po.poCode}>
                      {po.poCode} - {po.supplierName} ({po.status} | {po.paymentStatus === 'PAID' ? 'Đã TT đủ' : po.paymentStatus === 'PARTIAL_ADVANCE' ? 'Tạm ứng' : 'Chưa TT'})
                    </option>
                  ))}
                </select>
                {modalMode === 'create' && (
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    * Chỉ hiển thị các đơn PO chưa có đợt nhận hàng và chưa hoàn tất
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-gray-400" /> Nhà cung cấp (Tự động từ PO)
                </label>
                <div className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-800 dark:text-gray-200 truncate flex items-center justify-between">
                  <span>{editingItem.supplierName || 'Vui lòng chọn PO'}</span>
                  {editingItem.supplierCode && (
                    <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-mono rounded">
                      {editingItem.supplierCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Kho nhận hàng *</label>
                <select
                  value={editingItem.branchName || (apiBranches[0]?.name || 'Hội Sở Chính Hà Nội')}
                  onChange={(e) => {
                    const selectedName = e.target.value;
                    const matched = apiBranches.find(b => b.name === selectedName);
                    setEditingItem((prev) => ({
                      ...prev,
                      branchName: selectedName,
                      branchId: matched?.id || prev.branchId || 1,
                    }));
                  }}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {/* Fallback option if editing branchName is not in apiBranches list */}
                  {editingItem.branchName && !apiBranches.some(b => b.name.toLowerCase() === editingItem.branchName?.toLowerCase()) && (
                    <option value={editingItem.branchName}>{editingItem.branchName}</option>
                  )}
                  {apiBranches.map((b) => (
                    <option key={b.id || b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ngày dự kiến nhận *</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={editingItem.expectedDate || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, expectedDate: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Người nhận hàng (Thủ kho) *</label>
                <select
                  value={editingItem.receiver || (apiUsers[0]?.fullName ? `${apiUsers[0].fullName} (${apiUsers[0].role || 'Thủ kho'})` : 'Nguyễn Văn Hùng (Thủ kho)')}
                  onChange={(e) => setEditingItem({ ...editingItem, receiver: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {editingItem.receiver && !apiUsers.some(u => `${u.fullName} (${u.role || 'Thủ kho'})` === editingItem.receiver || u.fullName === editingItem.receiver) && (
                    <option value={editingItem.receiver}>{editingItem.receiver}</option>
                  )}
                  {apiUsers.length > 0 ? (
                    apiUsers.map((u) => (
                      <option key={u.id} value={`${u.fullName} (${u.role || 'Thủ kho'})`}>
                        {u.fullName} ({u.role || 'Thủ kho'}) {u.email ? `- ${u.email}` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Nguyễn Văn Hùng (Thủ kho)">Nguyễn Văn Hùng (Thủ kho)</option>
                      <option value="Trần Đình Trọng (Thủ kho chi nhánh)">Trần Đình Trọng (Thủ kho chi nhánh)</option>
                      <option value="Lê Văn Hưng (Quản lý kho tổng)">Lê Văn Hưng (Quản lý kho tổng)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Trạng thái đợt nhận</label>
                <select
                  value={editingItem.status || 'CHO_NHAN'}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold"
                >
                  <option value="CHO_NHAN">Chờ nhận hàng</option>
                  <option value="DANG_NHAN">Nhận 1 phần</option>
                  <option value="DA_NHAN">Đã nhận đủ</option>
                  <option value="DA_HUY">Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          {/* PHẦN 2 — SẢN PHẨM NHẬN HÀNG */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Phần 2 — Chi tiết sản phẩm nhận hàng từ PO
              </h3>
              <span className="text-xs text-gray-500 font-mono">
                {formSummary.activeLinesCount} / {formSummary.totalLines} mặt hàng
              </span>
            </div>

            {deliveryLines.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-center">
                <p className="text-xs font-semibold text-gray-500">Chưa có danh sách mặt hàng.</p>
                <p className="text-xs text-gray-400 mt-1">Vui lòng chọn Đơn mua PO ở Phần 1 để nạp danh sách sản phẩm.</p>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="p-2.5">Sản phẩm / SKU</th>
                      <th className="p-2.5 text-center">SL Đặt</th>
                      <th className="p-2.5 text-center w-32">Nhận lần này *</th>
                      <th className="p-2.5 text-center">Còn thiếu</th>
                      <th className="p-2.5 text-right">Đơn giá</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {deliveryLines.map((line) => {
                      const remaining = Math.max(0, line.orderedQty - line.currentReceiveQty);
                      return (
                        <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <td className="p-2.5">
                            <span className="font-bold text-gray-900 dark:text-white block">{line.productName}</span>
                            <span className="font-mono text-xs text-gray-400">{line.sku}</span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-semibold text-gray-700 dark:text-gray-300">{line.orderedQty}</td>
                          <td className="p-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max={line.orderedQty}
                              value={line.currentReceiveQty}
                              onChange={(e) => handleLineQtyChange(line.id, e.target.value)}
                              className="w-24 p-1.5 text-center border border-emerald-500 dark:border-emerald-600 font-mono font-bold text-emerald-600 rounded bg-emerald-50/50 dark:bg-emerald-900/20 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                          </td>
                          <td className="p-2.5 text-center font-mono font-semibold">
                            {remaining > 0 ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-[11px]">
                                Thiếu {remaining}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full text-[11px]">
                                Đủ
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-right font-mono">
                            {new Intl.NumberFormat('vi-VN').format(line.unitPrice)}đ
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                            {new Intl.NumberFormat('vi-VN').format(line.subTotal)}đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PHẦN 3 — THANH TOÁN & CÔNG NỢ ĐỢT NHẬN HÀNG */}
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Phần 3 — Ghi nhận thanh toán & Đồng bộ Đơn mua PO
              </h3>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tự động cập nhật sang Đơn mua PO
              </span>
            </div>

            {/* Radio / Lựa chọn nhanh thanh toán */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingItem((prev) => ({
                    ...prev,
                    paidAmount: 0,
                    paymentStatus: 'UNPAID',
                  }));
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  (editingItem.paidAmount === 0 || editingItem.paymentStatus === 'UNPAID')
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/50'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">1. Chưa thanh toán</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold">Ghi nợ NCC</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Chưa trả tiền đợt này. Toàn bộ tiền hàng ghi nợ NCC.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  const half = Math.round(formSummary.totalAmount * 0.5);
                  setEditingItem((prev) => ({
                    ...prev,
                    paidAmount: prev.paidAmount && prev.paidAmount > 0 && prev.paidAmount < formSummary.totalAmount ? prev.paidAmount : half,
                    paymentStatus: 'PARTIAL',
                  }));
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  editingItem.paymentStatus === 'PARTIAL' || (editingItem.paidAmount !== undefined && editingItem.paidAmount > 0 && editingItem.paidAmount < formSummary.totalAmount)
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 ring-2 ring-blue-400/50'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">2. Thanh toán thiếu (1 phần)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-semibold">Tạm ứng</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Trả 1 phần tiền hàng, phần còn lại ghi nhận công nợ.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingItem((prev) => ({
                    ...prev,
                    paidAmount: formSummary.totalAmount,
                    paymentStatus: 'PAID',
                  }));
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  (editingItem.paymentStatus === 'PAID' || (editingItem.paidAmount !== undefined && editingItem.paidAmount >= formSummary.totalAmount && formSummary.totalAmount > 0))
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/50'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase">3. Đã thanh toán đủ (100%)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 font-semibold">Hoàn tất</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Thanh toán đủ 100% giá trị đợt nhận hàng, không còn dư nợ.</p>
              </button>
            </div>

            {/* Input số tiền thực trả & Phương thức thanh toán */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900/40 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Số tiền đã thanh toán (₫) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={formSummary.totalAmount}
                  value={editingItem.paidAmount ?? 0}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    const capped = Math.min(formSummary.totalAmount, val);
                    const newStatus: 'UNPAID' | 'PARTIAL' | 'PAID' =
                      capped >= formSummary.totalAmount && formSummary.totalAmount > 0
                        ? 'PAID'
                        : capped > 0
                          ? 'PARTIAL'
                          : 'UNPAID';
                    setEditingItem((prev) => ({
                      ...prev,
                      paidAmount: capped,
                      paymentStatus: newStatus,
                    }));
                  }}
                  className="w-full p-2.5 border border-emerald-500 rounded-lg text-sm font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Nhập số tiền đã thanh toán..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Hình thức thanh toán
                </label>
                <select
                  value={editingItem.paymentMethod || 'Chuyển khoản'}
                  onChange={(e) => setEditingItem((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium bg-white dark:bg-gray-800 cursor-pointer"
                >
                  <option value="Chuyển khoản">Chuyển khoản ngân hàng (Ủy nhiệm chi)</option>
                  <option value="Tiền mặt">Tiền mặt tại kho / quầy</option>
                  <option value="Ví điện tử / Khác">Ví điện tử / Khác</option>
                </select>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[11px] text-gray-500 font-semibold uppercase">Tình trạng công nợ sau thanh toán</span>
                <div className="mt-1 flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-gray-600 dark:text-gray-400">Còn thiếu:</span>
                  <span className={formSummary.totalAmount - (editingItem.paidAmount || 0) > 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      Math.max(0, formSummary.totalAmount - (editingItem.paidAmount || 0))
                    )}
                  </span>
                </div>
                <div className="mt-0.5 text-[10px] text-gray-500">
                  {editingItem.paymentStatus === 'PAID' ? (
                    <span className="text-emerald-600 font-semibold">✓ Đã trả đủ 100% giá trị hàng</span>
                  ) : editingItem.paymentStatus === 'PARTIAL' ? (
                    <span className="text-blue-600 font-semibold">⚠ Thanh toán thiếu - Ghi nhận nợ NCC</span>
                  ) : (
                    <span className="text-amber-600 font-semibold">⚠ Chưa trả tiền - Công nợ toàn bộ</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PHẦN 4 — XÁC NHẬN & TỔNG KẾT */}
          <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50 dark:bg-emerald-900/20 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div>
                <span className="text-xs text-gray-500 block uppercase font-medium">Tổng mặt hàng</span>
                <span className="text-base font-bold text-gray-900 dark:text-white font-mono">
                  {formSummary.activeLinesCount} / {formSummary.totalLines} sản phẩm
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase font-medium">Tổng số lượng nhận</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formSummary.totalReceiveQty} đơn vị
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block uppercase font-medium">Tổng giá trị nhận hàng</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formSummary.totalAmount)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú đợt nhận hàng</label>
              <textarea
                value={editingItem.notes || ''}
                onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
                rows={2}
                placeholder="Ghi chú chi tiết đợt nhận hàng (tình trạng bao bì, niêm phong, biên bản giao nhận...)"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />}
                {isSubmitting ? 'Đang lưu...' : (modalMode === 'create' ? 'Tạo Đợt Nhận Hàng' : 'Lưu Cập Nhật Đợt Nhận')}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Xác nhận Nhận hàng */}
      <Modal
        isOpen={Boolean(receivingItem)}
        onClose={() => setReceivingItem(null)}
        title="Xác nhận nhận hàng & Nhập kho"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                Xác nhận nhận hàng cho đợt <span className="font-bold text-emerald-700 dark:text-emerald-400">{receivingItem?.deliveryCode}</span>?
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tồn kho các sản phẩm trong đợt giao này sẽ được tự động cộng vào chi nhánh "{receivingItem?.branchName}".
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReceivingItem(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmReceive}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Xác nhận nhận hàng
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Xác nhận Xóa đợt nhận hàng */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa đợt nhận hàng"
        description="Bạn có chắc chắn muốn xóa đợt giao nhận hàng này khỏi hệ thống?"
        itemName={deletingItem ? `${deletingItem.deliveryCode} (${deletingItem.poCode})` : undefined}
      />
    </div>
  );
}
