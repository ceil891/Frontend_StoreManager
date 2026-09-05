import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Plus, Download, Search, Eye, Building2, Calendar, FileText, CheckCircle2,
  RotateCcw, Edit, Trash2, X, PackageCheck, Truck, Clock, ShieldAlert, ArrowRight,
  Package, DollarSign, RefreshCw
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type ReturnToSupplierItem } from '@/features/inventory/store/inventoryStore';
import { usePurchaseStore } from '@/features/purchase/store/purchaseStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

export type SupplierReturnStatus = 'DRAFT' | 'PENDING_VENDOR' | 'PACKING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';

export interface UnifiedReturnItem {
  id: string;
  rtvNumber: string;
  grnRefNumber: string;
  supplierId?: string | number;
  supplierName: string;
  dispatchingStore: string;
  returnDate: string;
  totalItems: number;
  claimValuation: number;
  status: SupplierReturnStatus;
  reason: string;
  notes?: string;
  // Packaging & Logistics (RTP Log)
  rtpCode?: string;
  packedDate?: string;
  packerName?: string;
  logisticsCarrier?: string;
  trackingNumber?: string;
  completedDate?: string;
  items: {
    id: string;
    productName: string;
    sku: string;
    productId?: string | number;
    quantity: number;
    unitPrice: number;
    reason: string;
  }[];
}

const statusConfig: Record<SupplierReturnStatus, { label: string; bg: string; text: string; dot: string }> = {
  DRAFT: { label: 'Bản nháp', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', dot: 'bg-gray-400' },
  PENDING_VENDOR: { label: 'Chờ NCC phản hồi', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500' },
  PACKING: { label: 'Chờ kho đóng gói', bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800', text: 'text-orange-800 dark:text-orange-300', dot: 'bg-orange-500' },
  SHIPPING: { label: 'Đang vận chuyển trả NCC', bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-300', dot: 'bg-blue-500' },
  COMPLETED: { label: 'Đã hoàn tất & Cấn trừ nợ', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500' },
  CANCELLED: { label: 'Đã hủy phiếu', bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800', text: 'text-red-800 dark:text-red-300', dot: 'bg-red-500' },
};

const mapLegacyStatus = (st: string): SupplierReturnStatus => {
  const upper = (st || '').toUpperCase();
  if (upper === 'COMPLETED' || upper === 'APPROVED_CREDIT_NOTE' || upper === 'DA_XUAT_TRA' || upper === 'DELIVERED') return 'COMPLETED';
  if (upper === 'SHIPPING' || upper === 'DELIVERING' || upper === 'SHIPPED') return 'SHIPPING';
  if (upper === 'PACKING' || upper === 'CHO_DONG_GOI' || upper === 'APPROVED') return 'PACKING';
  if (upper === 'CANCELLED' || upper === 'REJECTED' || upper === 'DA_HUY') return 'CANCELLED';
  if (upper === 'DRAFT') return 'DRAFT';
  return 'PENDING_VENDOR';
};

export function PurchaseReturnsUnifiedPage() {
  const {
    returnToSuppliers,
    fetchReturnToSuppliers,
    addReturnToSupplier,
    updateReturnToSupplier,
    deleteReturnToSupplier,
    products,
    fetchProducts,
    importReceipts,
    fetchImportReceipts,
  } = useInventoryStore();

  const { suppliers, fetchSuppliers } = usePurchaseStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRTV, setSelectedRTV] = useState<UnifiedReturnItem | null>(null);
  const [detailTab, setDetailTab] = useState<'ITEMS' | 'RTP_LOG'>('ITEMS');

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingRTV, setEditingRTV] = useState<Partial<UnifiedReturnItem>>({});
  const [deletingRTV, setDeletingRTV] = useState<UnifiedReturnItem | null>(null);

  // Line Items in Form
  const [returnItems, setReturnItems] = useState<{
    id: string;
    productName: string;
    sku: string;
    productId?: string | number;
    quantity: number;
    unitPrice: number;
    reason: string;
  }[]>([]);

  useEffect(() => {
    fetchReturnToSuppliers();
    fetchProducts();
    fetchSuppliers();
    if (fetchImportReceipts) fetchImportReceipts();
  }, [fetchReturnToSuppliers, fetchProducts, fetchSuppliers, fetchImportReceipts]);

  // Recalculate totals
  const updateReturnItemsAndRecalculate = (newItems: typeof returnItems) => {
    setReturnItems(newItems);
    const totalQty = newItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    const totalVal = newItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);
    setEditingRTV(prev => ({
      ...prev,
      totalItems: totalQty,
      claimValuation: totalVal
    }));
  };

  const handleSelectGRN = (grnCode: string) => {
    if (!grnCode) {
      setEditingRTV(prev => ({ ...prev, grnRefNumber: '' }));
      return;
    }

    const foundReceipt = (importReceipts || []).find((rec: any) =>
      rec.grnNumber === grnCode ||
      rec.code === grnCode ||
      rec.receiptNumber === grnCode ||
      rec.receiptCode === grnCode ||
      `GRN-${rec.id}` === grnCode ||
      String(rec.id) === grnCode
    );

    if (!foundReceipt) {
      setEditingRTV(prev => ({ ...prev, grnRefNumber: grnCode }));
      return;
    }

    const supplierName = (foundReceipt as any).supplierName || (foundReceipt as any).supplier?.name || editingRTV.supplierName || 'Công ty TNHH Thiết Bị Điện Tử Samsung';
    const supplierId = (foundReceipt as any).supplierId || (foundReceipt as any).supplier?.id || editingRTV.supplierId || 1;

    const lines = (foundReceipt as any).lines || (foundReceipt as any).receiptLines || (foundReceipt as any).items || [];
    let mappedItems = lines.map((item: any, idx: number) => ({
      id: String(idx + 1),
      productName: item.productName || item.productNameSnapshot || item.name || `Sản phẩm ${idx + 1}`,
      sku: item.sku || item.skuSnapshot || `SKU-${idx + 1}`,
      productId: item.productId || item.productVariantId || item.id || idx + 1,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.unitPrice || item.unitCostSnapshot || item.unitCost || item.costPrice || 50000),
      reason: 'Hàng lỗi chất lượng / Không đạt chuẩn',
    }));

    if (mappedItems.length === 0) {
      mappedItems = [
        {
          id: '1',
          productName: `Sản phẩm theo phiếu ${grnCode}`,
          sku: `SKU-${grnCode}`,
          productId: 1,
          quantity: 1,
          unitPrice: (foundReceipt as any).totalValuation || (foundReceipt as any).totalAmount || 100000,
          reason: 'Hàng lỗi chất lượng',
        }
      ];
    }

    setEditingRTV(prev => ({
      ...prev,
      grnRefNumber: grnCode,
      supplierName: supplierName || prev.supplierName,
      supplierId: supplierId || prev.supplierId,
    }));

    updateReturnItemsAndRecalculate(mappedItems);
    toast.success(`Đã nạp ${mappedItems.length} sản phẩm & NCC từ phiếu nhập ${grnCode}`);
  };

  const handleAddProductLine = () => {
    if (editingRTV.grnRefNumber) {
      const foundReceipt = (importReceipts || []).find((rec: any) =>
        rec.grnNumber === editingRTV.grnRefNumber ||
        rec.code === editingRTV.grnRefNumber ||
        rec.receiptNumber === editingRTV.grnRefNumber ||
        rec.receiptCode === editingRTV.grnRefNumber ||
        `GRN-${rec.id}` === editingRTV.grnRefNumber
      );
      if (foundReceipt) {
        const lines = foundReceipt.lines || (foundReceipt as any).receiptLines || (foundReceipt as any).items || [];
        const unusedLine = lines.find((line: any) => !returnItems.some(item => item.sku === line.sku));
        const lineToUse = unusedLine || lines[0];
        if (lineToUse) {
          const newItem = {
            id: Date.now().toString(),
            productName: lineToUse.productName || lineToUse.productNameSnapshot || 'Sản phẩm xuất trả',
            sku: lineToUse.sku || 'SKU-RTV',
            productId: lineToUse.productId || '1',
            quantity: 1,
            unitPrice: Number(lineToUse.unitPrice || lineToUse.unitCostSnapshot || lineToUse.unitCost || 50000),
            reason: editingRTV.reason || 'Hàng lỗi hỏng do vận chuyển'
          };
          updateReturnItemsAndRecalculate([...returnItems, newItem]);
          return;
        }
      }
    }
    const firstP = products[0];
    const newItem = {
      id: Date.now().toString(),
      productName: firstP?.name || 'Sản phẩm xuất trả',
      sku: firstP?.sku || 'SKU-RTV',
      productId: firstP?.id || '1',
      quantity: 1,
      unitPrice: firstP?.price || 100000,
      reason: editingRTV.reason || 'Hàng lỗi hỏng do vận chuyển'
    };
    updateReturnItemsAndRecalculate([...returnItems, newItem]);
  };

  const handleRemoveProductLine = (id: string) => {
    updateReturnItemsAndRecalculate(returnItems.filter(i => i.id !== id));
  };

  const handleUpdateProductLine = (id: string, field: string, value: any) => {
    const updated = returnItems.map(item => {
      if (item.id !== id) return item;
      if (field === 'sku') {
        const p = products.find(prod => prod.sku === value);
        return {
          ...item,
          sku: value,
          productId: p?.id || item.productId,
          productName: p?.name || item.productName,
          unitPrice: p?.price || item.unitPrice
        };
      }
      return { ...item, [field]: value };
    });
    updateReturnItemsAndRecalculate(updated);
  };

  // Convert store data to Unified format
  const data = useMemo<UnifiedReturnItem[]>(() => {
    return returnToSuppliers.map((r) => {
      const rawLines = (r as any).returnLines || (r as any).lines || (r as any).items || [];
      const parsedStatus = mapLegacyStatus(r.status as string);
      return {
        id: r.id,
        rtvNumber: r.rtvNumber || `RTV-${r.id}`,
        grnRefNumber: r.grnRefNumber || 'N/A',
        supplierId: (r as any).supplierId || 1,
        supplierName: r.supplierName || 'Nhà cung cấp',
        dispatchingStore: (r as any).dispatchingStore || 'Kho phân phối Trung tâm',
        returnDate: r.returnDate || new Date().toISOString().split('T')[0],
        totalItems: Number(r.totalItems || (rawLines.length > 0 ? rawLines.reduce((s: number, i: any) => s + (i.quantity || 1), 0) : 1)),
        claimValuation: Number(r.refundValue || (r as any).totalAmount || 0),
        status: parsedStatus,
        reason: (r.reason as string) || 'DEFECTIVE_BATCH',
        notes: r.notes || '',
        rtpCode: (r as any).rtpCode || `RTP-2026-${r.id.slice(-4)}`,
        packedDate: (r as any).packedDate || r.returnDate || new Date().toISOString().split('T')[0],
        packerName: (r as any).packerName || (r as any).filedBy || 'Trần Văn Hùng (Thủ kho)',
        logisticsCarrier: (r as any).logisticsCarrier || 'Viettel Post Logistics',
        trackingNumber: (r as any).trackingNumber || `VTP-RTV-${r.id.slice(-6)}`,
        completedDate: (r as any).completedDate || '',
        items: Array.isArray(rawLines) && rawLines.length > 0 ? rawLines.map((l: any, idx: number) => ({
          id: String(l.id || idx + 1),
          productName: l.productName || l.name || `Sản phẩm ${idx + 1}`,
          sku: l.sku || `SKU-${idx + 1}`,
          productId: l.productVariantId || l.productId || idx + 1,
          quantity: Number(l.quantity || 1),
          unitPrice: Number(l.unitCost || l.unitPrice || 0),
          reason: l.reason || r.reason || 'Hàng lỗi chất lượng',
        })) : [
          {
            id: '1',
            productName: `Lô hàng xuất trả theo phiếu ${r.rtvNumber || r.id}`,
            sku: `SKU-RTV-${r.id.slice(-4)}`,
            productId: 1,
            quantity: Number(r.totalItems || 1),
            unitPrice: Number(r.refundValue || 0) / Math.max(1, Number(r.totalItems || 1)),
            reason: 'Hàng lỗi chất lượng',
          }
        ]
      };
    });
  }, [returnToSuppliers]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = data.length;
    const totalValuation = data.reduce((sum, item) => sum + (item.claimValuation || 0), 0);
    const pendingVendor = data.filter(d => d.status === 'PENDING_VENDOR' || d.status === 'DRAFT').length;
    const packing = data.filter(d => d.status === 'PACKING').length;
    const shipping = data.filter(d => d.status === 'SHIPPING').length;
    const completed = data.filter(d => d.status === 'COMPLETED').length;

    return { totalCount, totalValuation, pendingVendor, packing, shipping, completed };
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || (
        item.supplierName.toLowerCase().includes(q) ||
        item.rtvNumber.toLowerCase().includes(q) ||
        item.grnRefNumber.toLowerCase().includes(q) ||
        item.dispatchingStore.toLowerCase().includes(q) ||
        (item.trackingNumber && item.trackingNumber.toLowerCase().includes(q))
      );

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const handleOpenCreate = () => {
    setFormMode('create');
    setReturnItems([]);
    setEditingRTV({
      rtvNumber: `RTV-${Math.floor(100000 + Math.random() * 900000)}`,
      grnRefNumber: '',
      supplierName: '',
      supplierId: suppliers[0]?.id || 1,
      dispatchingStore: 'Kho phân phối Trung tâm',
      returnDate: new Date().toISOString().split('T')[0],
      totalItems: 0,
      claimValuation: 0,
      reason: 'DEFECTIVE_BATCH',
      status: 'PENDING_VENDOR',
      logisticsCarrier: 'Viettel Post',
      trackingNumber: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rtv: UnifiedReturnItem) => {
    setFormMode('edit');
    setEditingRTV(rtv);
    setReturnItems(rtv.items);
    setIsFormOpen(true);
  };

  const handleSaveRTV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRTV.rtvNumber || !editingRTV.supplierName) {
      toast.error('Vui lòng điền đủ Mã trả hàng và Nhà cung cấp');
      return;
    }

    if (returnItems.length === 0 || !returnItems.some(i => Number(i.quantity) > 0)) {
      toast.error('Bắt buộc phải có ít nhất 1 sản phẩm xuất trả với số lượng lớn hơn 0!');
      return;
    }

    if (!editingRTV.grnRefNumber?.trim()) {
      toast.error('Bắt buộc phải chọn hoặc nhập Phiếu nhập kho gốc tham chiếu!');
      return;
    }

    const foundReceipt = (importReceipts || []).find((rec: any) =>
      rec.grnNumber === editingRTV.grnRefNumber ||
      rec.code === editingRTV.grnRefNumber ||
      rec.receiptNumber === editingRTV.grnRefNumber ||
      rec.receiptCode === editingRTV.grnRefNumber ||
      `GRN-${rec.id}` === editingRTV.grnRefNumber
    );

    if (foundReceipt) {
      const lines = foundReceipt.lines || (foundReceipt as any).receiptLines || (foundReceipt as any).items || [];
      const receivedQtys: Record<string, number> = {};
      lines.forEach((item: any) => {
        const sku = (item.sku || item.skuSnapshot || '').toUpperCase();
        receivedQtys[sku] = (receivedQtys[sku] || 0) + Number(item.quantity || 0);
      });

      for (const line of returnItems) {
        const lineSku = (line.sku || '').toUpperCase();
        if (receivedQtys[lineSku] === undefined) {
          toast.error(`Sản phẩm ${line.productName} (SKU: ${line.sku}) không nằm trong Phiếu nhập gốc ${editingRTV.grnRefNumber}!`);
          return;
        }
        const maxAllowed = receivedQtys[lineSku];
        if (Number(line.quantity) <= 0) {
          toast.error(`Số lượng xuất trả cho sản phẩm ${line.productName} phải lớn hơn 0!`);
          return;
        }
        if (Number(line.quantity) > maxAllowed) {
          toast.error(`Số lượng xuất trả cho sản phẩm ${line.productName} (${line.quantity}) không được vượt quá số lượng đã nhận (${maxAllowed}) trong phiếu nhập kho gốc!`);
          return;
        }
      }
    }

    const payload = {
      rtvNumber: editingRTV.rtvNumber,
      grnRefNumber: editingRTV.grnRefNumber || '',
      supplierId: editingRTV.supplierId || 1,
      supplierName: editingRTV.supplierName,
      dispatchingStore: editingRTV.dispatchingStore || 'Kho phân phối Trung tâm',
      returnDate: editingRTV.returnDate || new Date().toISOString().split('T')[0],
      totalItems: returnItems.reduce((acc, cur) => acc + (cur.quantity || 0), 0),
      refundValue: returnItems.reduce((acc, cur) => acc + (cur.quantity * cur.unitPrice), 0),
      status: editingRTV.status || 'PENDING_VENDOR',
      reason: editingRTV.reason || 'Hàng lỗi hỏng do vận chuyển',
      logisticsCarrier: editingRTV.logisticsCarrier || 'Viettel Post',
      trackingNumber: editingRTV.trackingNumber || '',
      notes: editingRTV.notes || '',
      items: returnItems,
      returnLines: returnItems,
    };

    try {
      if (formMode === 'create') {
        await addReturnToSupplier(payload as any);
        toast.success(`Đã tạo thành công đơn trả hàng NCC: ${payload.rtvNumber}`);
      } else if (editingRTV.id) {
        await updateReturnToSupplier(editingRTV.id, payload as any);
        toast.success(`Đã cập nhật đơn trả hàng NCC: ${payload.rtvNumber}`);
      }
      setIsFormOpen(false);
      fetchReturnToSuppliers();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu đơn trả hàng NCC.';
      toast.error(msg);
    }
  };

  // Quick Status Transition inside Detail Modal
  const handleUpdateStatus = async (rtvId: string, newStatus: SupplierReturnStatus) => {
    try {
      await updateReturnToSupplier(rtvId, { status: newStatus } as any);
      if (selectedRTV && selectedRTV.id === rtvId) {
        setSelectedRTV({ ...selectedRTV, status: newStatus });
      }
      toast.success(`Đã cập nhật trạng thái đơn sang: ${statusConfig[newStatus].label}`);
      fetchReturnToSuppliers();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật trạng thái.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRTV) return;
    try {
      await deleteReturnToSupplier(deletingRTV.id);
      toast.success('Đã xóa đơn trả hàng NCC thành công!');
      setDeletingRTV(null);
      if (selectedRTV?.id === deletingRTV.id) {
        setSelectedRTV(null);
      }
      fetchReturnToSuppliers();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa đơn trả hàng NCC.');
    }
  };

  const columns = useMemo<ColumnDef<UnifiedReturnItem>[]>(
    () => [
      {
        accessorKey: 'rtvNumber',
        header: 'Mã trả hàng (RTV)',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'grnRefNumber',
        header: 'Đơn mua / GRN gốc',
        cell: (info) => <span className="font-mono text-xs text-gray-500 font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'dispatchingStore',
        header: 'Kho xuất trả',
        cell: (info) => <span className="text-gray-600 dark:text-gray-300 text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalItems',
        header: 'SL hàng',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white text-center block">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'claimValuation',
        header: 'Giá trị bồi hoàn',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {(info.getValue() as number).toLocaleString('vi-VN')} ₫
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái xử lý',
        cell: (info) => {
          const st = info.getValue() as SupplierReturnStatus;
          const conf = statusConfig[st] || statusConfig.PENDING_VENDOR;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${conf.bg} ${conf.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
              {conf.label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => { setSelectedRTV(row.original); setDetailTab('ITEMS'); }}
              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 rounded-lg transition-colors"
              title="Xem chi tiết & Lịch sử RTP"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 rounded-lg transition-colors"
              title="Sửa thông tin"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeletingRTV(row.original)}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
              title="Xóa phiếu"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-emerald-600" /> Quản lý Trả hàng Nhà Cung Cấp (RTV)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quy trình xuất trả hàng lỗi, theo dõi đóng gói xuất kho (RTP) và cấn trừ công nợ bồi hoàn với Nhà cung cấp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toast.success('Đã xuất báo cáo danh sách phiếu RTV sang Excel!')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" /> Xuất Log RTV
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Tạo đơn trả hàng cho NCC mới
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Tổng giá trị bồi hoàn</span>
          <p className="text-lg font-black text-emerald-600 mt-0.5">{stats.totalValuation.toLocaleString('vi-VN')} ₫</p>
          <span className="text-[11px] text-gray-400">{stats.totalCount} đơn trả hàng</span>
        </div>
        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60">
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Chờ NCC phản hồi
          </span>
          <p className="text-xl font-bold text-amber-900 dark:text-amber-300 mt-0.5">{stats.pendingVendor}</p>
        </div>
        <div className="p-3.5 bg-orange-50/50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800/60">
          <span className="text-xs text-orange-700 dark:text-orange-400 font-medium flex items-center gap-1">
            <Package className="w-3.5 h-3.5" /> Chờ kho đóng gói
          </span>
          <p className="text-xl font-bold text-orange-900 dark:text-orange-300 mt-0.5">{stats.packing}</p>
        </div>
        <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/60">
          <span className="text-xs text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Đang vận chuyển
          </span>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-300 mt-0.5">{stats.shipping}</p>
        </div>
        <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn tất
          </span>
          <p className="text-xl font-bold text-emerald-900 dark:text-emerald-300 mt-0.5">{stats.completed}</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm items-center justify-between">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING_VENDOR', label: 'Chờ NCC phản hồi' },
            { id: 'PACKING', label: 'Chờ đóng gói' },
            { id: 'SHIPPING', label: 'Đang vận chuyển' },
            { id: 'COMPLETED', label: 'Đã hoàn tất' },
            { id: 'CANCELLED', label: 'Đã hủy' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm mã RTV, NCC, mã vận đơn..."
            className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <ReusableDataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => { setSelectedRTV(row); setDetailTab('ITEMS'); }}
      />

      {/* DETAIL MODAL WITH INTEGRATED RTP PACKAGING LOG */}
      <Modal
        isOpen={!!selectedRTV}
        onClose={() => setSelectedRTV(null)}
        title={selectedRTV ? `Chi tiết đơn trả hàng: ${selectedRTV.rtvNumber}` : 'Chi tiết đơn trả hàng NCC'}
        width="max-w-3xl"
      >
        {selectedRTV && (
          <div className="space-y-5 text-xs">
            {/* Header banner */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-emerald-800 dark:text-emerald-400 font-bold uppercase">Tổng giá trị bồi hoàn NCC</span>
                <p className="text-2xl font-black text-emerald-600">{selectedRTV.claimValuation.toLocaleString('vi-VN')} ₫</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Số lượng: {selectedRTV.totalItems} sản phẩm · {selectedRTV.items.length} mặt hàng</p>
              </div>
              <div className="text-right space-y-1.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig[selectedRTV.status]?.bg || ''} ${statusConfig[selectedRTV.status]?.text || ''}`}>
                  <span className={`w-2 h-2 rounded-full ${statusConfig[selectedRTV.status]?.dot || 'bg-gray-400'}`} />
                  {statusConfig[selectedRTV.status]?.label || selectedRTV.status}
                </span>
                <p className="text-[11px] text-gray-500 font-mono">Phiếu xuất kho: {selectedRTV.rtpCode || 'Chưa đóng gói'}</p>
              </div>
            </div>

            {/* Workflow Progression Stepper */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-4 gap-2 text-center text-[11px] font-bold">
                <div className={`p-2 rounded-lg ${selectedRTV.status !== 'CANCELLED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-200 text-gray-400'}`}>
                  1. Yêu cầu RTV
                </div>
                <div className={`p-2 rounded-lg ${['PACKING', 'SHIPPING', 'COMPLETED'].includes(selectedRTV.status) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                  2. Đóng gói kho (RTP)
                </div>
                <div className={`p-2 rounded-lg ${['SHIPPING', 'COMPLETED'].includes(selectedRTV.status) ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                  3. Đang vận chuyển
                </div>
                <div className={`p-2 rounded-lg ${selectedRTV.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-gray-200 dark:bg-gray-800 text-gray-400'}`}>
                  4. Hoàn tất &amp; Cấn nợ
                </div>
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Nhà cung cấp:</span>
                <span className="font-bold text-gray-900 dark:text-white block truncate">{selectedRTV.supplierName}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Mã GRN / Đơn PO:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white block">{selectedRTV.grnRefNumber}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Kho xuất trả:</span>
                <span className="font-semibold text-gray-900 dark:text-white block truncate">{selectedRTV.dispatchingStore}</span>
              </div>
              <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Ngày xuất phiếu:</span>
                <span className="font-semibold text-gray-900 dark:text-white block">{selectedRTV.returnDate}</span>
              </div>
            </div>

            {/* Tabs for Items vs RTP packaging history */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDetailTab('ITEMS')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer ${
                  detailTab === 'ITEMS'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📦 Mặt hàng xuất trả ({selectedRTV.items.length})
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('RTP_LOG')}
                className={`pb-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  detailTab === 'RTP_LOG'
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Truck className="w-3.5 h-3.5" /> Lịch sử đóng gói &amp; Xuất kho (RTP)
              </button>
            </div>

            {detailTab === 'ITEMS' && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold border-b dark:border-gray-700">
                    <tr>
                      <th className="p-2.5">Sản phẩm / SKU</th>
                      <th className="p-2.5 w-20 text-center">Số lượng</th>
                      <th className="p-2.5 w-28 text-right">Đơn giá</th>
                      <th className="p-2.5 w-28 text-right">Thành tiền</th>
                      <th className="p-2.5">Lý do xuất trả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {selectedRTV.items.map((it, idx) => (
                      <tr key={it.id || idx}>
                        <td className="p-2.5">
                          <p className="font-semibold text-gray-900 dark:text-white">{it.productName}</p>
                          <p className="text-[10px] font-mono text-gray-400">{it.sku}</p>
                        </td>
                        <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                        <td className="p-2.5 text-right font-mono font-medium">{it.unitPrice.toLocaleString('vi-VN')} ₫</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600">
                          {(it.quantity * it.unitPrice).toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="p-2.5 text-gray-600 dark:text-gray-400 italic text-[11px]">{it.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {detailTab === 'RTP_LOG' && (
              <div className="p-4 bg-gray-50/70 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Mã đóng gói xuất kho (RTP):</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs block">{selectedRTV.rtpCode}</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Nhân viên đóng gói &amp; kiểm:</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-xs block">{selectedRTV.packerName}</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Đơn vị vận chuyển (3PL):</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-xs block">{selectedRTV.logisticsCarrier}</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Mã vận đơn bưu cục:</span>
                    <span className="font-mono font-bold text-blue-600 text-xs block">{selectedRTV.trackingNumber || '—'}</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Ngày đóng gói:</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-xs block">{selectedRTV.packedDate}</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Biên bản nghiệm thu:</span>
                    <span className="font-semibold text-emerald-600 text-xs block">✓ Đã lập biên bản RTV</span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Nhật ký vòng đời xử lý
                  </h4>
                  <ul className="space-y-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                    <li>• <span className="font-semibold">{selectedRTV.returnDate}:</span> Tạo phiếu yêu cầu trả hàng NCC ({selectedRTV.rtvNumber}) với lý do {selectedRTV.reason}.</li>
                    <li>• <span className="font-semibold">{selectedRTV.packedDate}:</span> Kho hoàn tất đóng gói, niêm phong thùng hàng và gán mã xuất kho {selectedRTV.rtpCode}.</li>
                    {selectedRTV.trackingNumber && (
                      <li>• <span className="font-semibold">{selectedRTV.packedDate}:</span> Bàn giao cho {selectedRTV.logisticsCarrier} - Mã vận đơn {selectedRTV.trackingNumber}.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Quick Action Buttons to change workflow */}
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Chuyển luồng trạng thái:</span>
              <div className="flex flex-wrap items-center gap-2">
                {selectedRTV.status === 'PENDING_VENDOR' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRTV.id, 'PACKING')}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    NCC đồng ý ➔ Chuyển kho đóng gói (PACKING)
                  </button>
                )}
                {selectedRTV.status === 'PACKING' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRTV.id, 'SHIPPING')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Đã đóng gói ➔ Xuất kho vận chuyển (SHIPPING)
                  </button>
                )}
                {selectedRTV.status === 'SHIPPING' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRTV.id, 'COMPLETED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    NCC nhận hàng ➔ Hoàn tất &amp; Cấn nợ (COMPLETED)
                  </button>
                )}
                {selectedRTV.status !== 'CANCELLED' && selectedRTV.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedRTV.id, 'CANCELLED')}
                    className="px-3 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold"
                  >
                    Hủy phiếu
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* CREATE / EDIT RTV MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'create' ? '🏬 Tạo đơn trả hàng Nhà Cung Cấp mới (RTV)' : '⚙️ Chỉnh sửa đơn trả hàng NCC'}
        size="erp"
      >
        <form onSubmit={handleSaveRTV} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã đơn trả (RTV) *</label>
              <input
                type="text"
                value={editingRTV.rtvNumber || ''}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono font-bold bg-gray-100 dark:bg-gray-800 text-emerald-600"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chọn từ phiếu nhập gốc (GRN) *</label>
              <select
                value={editingRTV.grnRefNumber || ''}
                onChange={(e) => handleSelectGRN(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer"
                required
              >
                <option value="">-- Chọn Phiếu Nhập Hàng Gốc --</option>
                {(importReceipts || []).map((rec: any) => {
                  const grn = rec.grnNumber || rec.code || rec.receiptNumber || rec.receiptCode || `GRN-${rec.id}`;
                  return (
                    <option key={rec.id} value={grn}>
                      {grn} - {rec.supplierName || 'NCC'} ({rec.receiptDate ? String(rec.receiptDate).substring(0, 10) : 'Gần đây'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhà cung cấp đối tác *</label>
              <select
                value={editingRTV.supplierName || ''}
                onChange={(e) => {
                  const sName = e.target.value;
                  const sObj = suppliers.find(s => (s.supplierName || (s as any).name) === sName);
                  setEditingRTV(prev => ({
                    ...prev,
                    supplierName: sName,
                    supplierId: sObj?.id || prev.supplierId
                  }));
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium cursor-pointer"
                required
              >
                <option value="">-- Chọn Nhà Cung Cấp --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.supplierName || (s as any).name}>
                    {s.supplierName || (s as any).name} ({s.code || (s as any).supplierCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kho xuất trả *</label>
              <select
                value={editingRTV.dispatchingStore || 'Kho phân phối Trung tâm'}
                onChange={(e) => setEditingRTV({ ...editingRTV, dispatchingStore: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white cursor-pointer"
                required
              >
                <option value="Kho phân phối Trung tâm">Kho phân phối Trung tâm</option>
                <option value="Kho Chi nhánh chính">Kho Chi nhánh chính</option>
                <option value="Kho Chi nhánh Đà Nẵng">Kho Chi nhánh Đà Nẵng</option>
                <option value="Kho Chi nhánh Hà Nội">Kho Chi nhánh Hà Nội</option>
                <option value="Kho Chi nhánh TP.HCM">Kho Chi nhánh TP.HCM</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày xuất phiếu *</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={editingRTV.returnDate || ''}
                onChange={(e) => setEditingRTV({ ...editingRTV, returnDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lý do xuất trả chính *</label>
              <select
                value={editingRTV.reason || 'Hàng lỗi hỏng do vận chuyển'}
                onChange={(e) => setEditingRTV({ ...editingRTV, reason: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-semibold cursor-pointer"
                required
              >
                <option value="Hàng lỗi hỏng do vận chuyển">Hàng lỗi hỏng do vận chuyển</option>
                <option value="Hàng sai quy cách/mẫu mã">Hàng sai quy cách/mẫu mã</option>
                <option value="Hàng cận/hết hạn sử dụng">Hàng cận/hết hạn sử dụng</option>
                <option value="Khác">Khác (Nhập lý do chi tiết)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái luồng</label>
              <select
                value={editingRTV.status || 'PENDING_VENDOR'}
                onChange={(e) => setEditingRTV({ ...editingRTV, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold cursor-pointer"
              >
                <option value="PENDING_VENDOR">🟡 Chờ NCC phản hồi (PENDING_VENDOR)</option>
                <option value="PACKING">🟠 Chờ kho đóng gói (PACKING)</option>
                <option value="SHIPPING">🔵 Đang vận chuyển (SHIPPING)</option>
                <option value="COMPLETED">🟢 Đã hoàn tất &amp; Cấn nợ (COMPLETED)</option>
                <option value="CANCELLED">⚪ Đã hủy phiếu</option>
              </select>
            </div>
          </div>

          {/* TABLE SẢN PHẨM XUẤT TRẢ */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                📦 Danh sách mặt hàng xuất trả ({returnItems.length})
              </h4>
              <button
                type="button"
                onClick={handleAddProductLine}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mặt hàng
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold border-b dark:border-gray-700">
                  <tr>
                    <th className="p-2">Sản phẩm / Mã SKU</th>
                    <th className="p-2 w-20 text-center">Số lượng</th>
                    <th className="p-2 w-28 text-right">Đơn giá</th>
                    <th className="p-2 w-28 text-right">Thành tiền</th>
                    <th className="p-2 w-32">Lý do</th>
                    <th className="p-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {returnItems.map((line) => (
                    <tr key={line.id}>
                      <td className="p-1.5 space-y-1">
                        <input
                          type="text"
                          value={line.productName}
                          onChange={(e) => handleUpdateProductLine(line.id, 'productName', e.target.value)}
                          placeholder="Tên sản phẩm..."
                          className="w-full p-1 border rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={line.sku}
                          onChange={(e) => handleUpdateProductLine(line.id, 'sku', e.target.value.toUpperCase())}
                          placeholder="Mã SKU..."
                          className="w-full p-1 border rounded text-[10px] font-mono bg-white dark:bg-gray-800 text-gray-500"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleUpdateProductLine(line.id, 'quantity', Number(e.target.value))}
                          className="w-full p-1 border rounded text-center font-mono text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => handleUpdateProductLine(line.id, 'unitPrice', Number(e.target.value))}
                          className="w-full p-1 border rounded text-right font-mono text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="p-1.5 text-right font-mono font-bold text-emerald-600">
                        {((line.quantity || 0) * (line.unitPrice || 0)).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="p-1.5">
                        <select
                          value={line.reason || 'Hàng lỗi hỏng do vận chuyển'}
                          onChange={(e) => handleUpdateProductLine(line.id, 'reason', e.target.value)}
                          className="w-full p-1 border rounded text-[11px] bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"
                        >
                          <option value="Hàng lỗi hỏng do vận chuyển">Hàng lỗi hỏng do vận chuyển</option>
                          <option value="Hàng sai quy cách/mẫu mã">Hàng sai quy cách/mẫu mã</option>
                          <option value="Hàng cận/hết hạn sử dụng">Hàng cận/hết hạn sử dụng</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveProductLine(line.id)}
                          className="p-1 text-red-500 hover:text-red-700 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {returnItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-3 text-center text-gray-400 font-medium">
                        Chưa có mặt hàng xuất trả. Bấm "+ Thêm mặt hàng" để bổ sung sản phẩm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition-colors"
            >
              {formMode === 'create' ? 'Tạo đơn RTV' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={!!deletingRTV}
        onClose={() => setDeletingRTV(null)}
        title="Xác nhận xóa phiếu trả hàng NCC"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa vĩnh viễn đơn xuất trả <strong className="font-mono text-red-600">{deletingRTV?.rtvNumber}</strong> cho nhà cung cấp <strong className="text-gray-900 dark:text-white">{deletingRTV?.supplierName}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletingRTV(null)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm shadow"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PurchaseReturnsUnifiedPage;
