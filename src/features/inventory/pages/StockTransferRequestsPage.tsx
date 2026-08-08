import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import {
  Plus, Search, Eye, Edit, Trash2, ArrowRightLeft, Calendar, FileText,
  Download, Printer, Package, Layers, AlertCircle, CheckCircle2, XCircle,
  Building2, User, PlusCircle, X, Check, ArrowRight
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type TransferRequestRecord, type TransferRequestItem } from '../store/inventoryStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export enum TransferRequestStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum TransferPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

const STATUS_MAP: Record<TransferRequestStatus | string, { label: string; cls: string }> = {
  [TransferRequestStatus.DRAFT]: { label: 'Bản nháp', cls: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300' },
  [TransferRequestStatus.PENDING_APPROVAL]: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300' },
  [TransferRequestStatus.APPROVED]: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold' },
  [TransferRequestStatus.REJECTED]: { label: 'Từ chối', cls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300' },
  [TransferRequestStatus.CANCELLED]: { label: 'Đã hủy', cls: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300' },
};

const PRIORITY_MAP: Record<TransferPriority | string, { label: string; cls: string }> = {
  [TransferPriority.LOW]: { label: 'Thấp', cls: 'bg-gray-100 text-gray-700 border-gray-200' },
  [TransferPriority.MEDIUM]: { label: 'Trung bình', cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300' },
  [TransferPriority.HIGH]: { label: 'Cao', cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300' },
  [TransferPriority.URGENT]: { label: 'Khẩn cấp', cls: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 font-bold' },
};

export function StockTransferRequestsPage() {
  const navigate = useNavigate();
  const {
    fetchStockTransfers,
    addStockTransfer,
    products,
    fetchProducts,
  } = useInventoryStore();

  const { branches, fetchBranches } = useBranchStore();
  const currentUser = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selected, setSelected] = useState<TransferRequestRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Dynamic API Users
  const [usersList, setUsersList] = useState<any[]>([]);

  // Request form state
  const [editingHeader, setEditingHeader] = useState<Partial<TransferRequestRecord>>({});
  const [editingLines, setEditingLines] = useState<TransferRequestItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Local state for transfer requests
  const [requests, setRequests] = useState<TransferRequestRecord[]>([
    {
      id: 'req-1',
      requestCode: 'STR-2026-001',
      sourceHub: 'Chi nhánh Hà Nội (Kho chính)',
      destinationHub: 'Chi nhánh TP. Hồ Chí Minh',
      priority: TransferPriority.HIGH,
      reason: 'Bổ sung tồn kho cao điểm bán hàng',
      requestedBy: 'Nguyễn Văn A (Trưởng kho HN)',
      requestDate: '2026-08-08',
      expectedDate: '2026-08-09',
      status: TransferRequestStatus.APPROVED,
      notes: 'Gửi gấp 50 lon Coca & 30 lon Pepsi cho cửa hàng miền Nam.',
      items: [
        {
          id: 'ri-1',
          productName: 'Nước giải khát Coca-Cola 330ml',
          variant: 'Lon 330ml Original Taste',
          sku: 'SKU-COCA-330ML',
          availableQuantity: 100,
          requestedQuantity: 50,
        },
        {
          id: 'ri-2',
          productName: 'Nước giải khát Pepsi 330ml',
          variant: 'Lon 330ml vị Chanh',
          sku: 'SKU-PEPSI-330ML',
          availableQuantity: 80,
          requestedQuantity: 30,
        },
      ],
    },
    {
      id: 'req-2',
      requestCode: 'STR-2026-002',
      sourceHub: 'Tổng kho TP. Hồ Chí Minh',
      destinationHub: 'Chi nhánh Đà Nẵng',
      priority: TransferPriority.MEDIUM,
      reason: 'Cân bằng tồn kho định kỳ',
      requestedBy: 'Trần Thị Mai',
      requestDate: '2026-08-07',
      expectedDate: '2026-08-08',
      status: TransferRequestStatus.PENDING_APPROVAL,
      notes: 'Điều chuyển sản phẩm phục vụ nhu cầu kho Đà Nẵng.',
      items: [
        {
          id: 'ri-3',
          productName: 'Tròng kính Đổi màu Transition 1.67',
          variant: 'Khói 1.67 ASP',
          sku: 'SKU-TR-167-SMK',
          availableQuantity: 200,
          requestedQuantity: 100,
        },
      ],
    },
  ]);

  useEffect(() => {
    fetchStockTransfers();
    fetchProducts();
    fetchBranches();

    // Fetch active users from Backend API
    axiosClient.get('/users?status=ACTIVE&size=200')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || res?.data || res || []);
        if (Array.isArray(list) && list.length > 0) {
          setUsersList(list);
        }
      })
      .catch(() => {});
  }, [fetchStockTransfers, fetchProducts, fetchBranches]);

  const filtered = useMemo(() => {
    return requests.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.requestCode.toLowerCase().includes(q) ||
        item.sourceHub.toLowerCase().includes(q) ||
        item.destinationHub.toLowerCase().includes(q) ||
        item.requestedBy.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, requests]);

  const generateNextRequestCode = () => {
    const count = requests.length + 1;
    return `STR-2026-${String(count).padStart(3, '0')}`;
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const defaultSource = branches.length > 0 ? branches[0].name : 'Chi nhánh Hà Nội (Kho chính)';
    const defaultDest = branches.length > 1 ? branches[1].name : 'Chi nhánh TP. Hồ Chí Minh';
    const defaultUser = currentUser?.name || (usersList.length > 0 ? (usersList[0].fullName || usersList[0].username) : 'System User');

    setEditingHeader({
      requestCode: generateNextRequestCode(),
      sourceHub: defaultSource,
      destinationHub: defaultDest,
      priority: TransferPriority.MEDIUM,
      reason: 'Điều chuyển bổ sung tồn kho',
      requestedBy: defaultUser,
      requestDate: today,
      expectedDate: tomorrow.toISOString().split('T')[0],
      notes: '',
      status: TransferRequestStatus.DRAFT,
    });

    const firstProduct = products.length > 0 ? products[0] : null;
    setEditingLines([
      {
        id: `line-${Date.now()}`,
        productName: firstProduct ? firstProduct.name : 'Nước giải khát Coca-Cola 330ml',
        variant: firstProduct && firstProduct.variants && firstProduct.variants.length > 0 
          ? `${firstProduct.variants[0].color || ''} ${firstProduct.variants[0].size || ''}`.trim() 
          : 'Lon 330ml Original Taste',
        sku: firstProduct ? firstProduct.sku : 'SKU-COCA-330ML',
        availableQuantity: firstProduct ? (firstProduct.onHand || 100) : 100,
        requestedQuantity: 10,
      },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (req: TransferRequestRecord) => {
    setModalMode('edit');
    setEditingHeader(req);
    setEditingLines(req.items || []);
    setIsModalOpen(true);
  };

  const handleAddLineItem = () => {
    const firstProduct = products.length > 0 ? products[0] : null;
    const newLine: TransferRequestItem = {
      id: `line-${Date.now()}`,
      productName: firstProduct ? firstProduct.name : 'Sản phẩm yêu cầu mới',
      variant: firstProduct && firstProduct.variants && firstProduct.variants.length > 0 
        ? `${firstProduct.variants[0].color || ''} ${firstProduct.variants[0].size || ''}`.trim() 
        : 'Phiên bản tiêu chuẩn',
      sku: firstProduct ? firstProduct.sku : `SKU-REQ-${Math.floor(100 + Math.random() * 900)}`,
      availableQuantity: firstProduct ? (firstProduct.onHand || 100) : 100,
      requestedQuantity: 10,
    };
    setEditingLines((prev) => [...prev, newLine]);
  };

  const handleSelectProductForLine = (index: number, selectedProductId: string) => {
    const p = products.find((prod) => String(prod.id) === selectedProductId);
    if (!p) return;

    setEditingLines((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        productName: p.name,
        sku: p.sku || next[index].sku,
        variant: p.variants && p.variants.length > 0 
          ? `${p.variants[0].color || ''} ${p.variants[0].size || ''}`.trim() 
          : 'Mẫu tiêu chuẩn',
        availableQuantity: p.onHand !== undefined ? Number(p.onHand) : 100,
      };
      return next;
    });
  };

  const handleUpdateLine = (index: number, field: keyof TransferRequestItem, value: any) => {
    setEditingLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveLine = (index: number) => {
    setEditingLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Totals Calculation
  const formTotals = useMemo(() => {
    const totalVariants = editingLines.length;
    const totalUnits = editingLines.reduce((acc, line) => acc + Number(line.requestedQuantity || 0), 0);
    const hasExceededStock = editingLines.some(
      (line) => line.availableQuantity !== undefined && Number(line.requestedQuantity || 0) > Number(line.availableQuantity)
    );

    return { totalVariants, totalUnits, hasExceededStock };
  }, [editingLines]);

  const handleSaveRequest = (e: React.FormEvent, targetStatus?: string) => {
    e.preventDefault();
    if (!editingHeader.requestCode || !editingHeader.sourceHub || !editingHeader.destinationHub) {
      toast.error('Vui lòng điền đầy đủ Mã yêu cầu, Kho xuất và Kho nhận!');
      return;
    }

    if (editingHeader.sourceHub === editingHeader.destinationHub) {
      toast.error('Kho xuất và Kho nhận không được trùng nhau!');
      return;
    }

    if (formTotals.hasExceededStock) {
      toast.error('Có sản phẩm có Số lượng yêu cầu vượt quá Tồn kho nguồn khả dụng!');
      return;
    }

    const newStatus = (targetStatus || editingHeader.status || TransferRequestStatus.DRAFT) as any;

    const recordToSave: TransferRequestRecord = {
      id: editingHeader.id || `req-${Date.now()}`,
      requestCode: editingHeader.requestCode || generateNextRequestCode(),
      sourceHub: editingHeader.sourceHub || 'Chi nhánh Hà Nội (Kho chính)',
      destinationHub: editingHeader.destinationHub || 'Chi nhánh TP. Hồ Chí Minh',
      priority: editingHeader.priority || TransferPriority.MEDIUM,
      reason: editingHeader.reason || 'Bổ sung tồn kho',
      requestedBy: editingHeader.requestedBy || currentUser?.name || 'System User',
      requestDate: editingHeader.requestDate || new Date().toISOString().split('T')[0],
      expectedDate: editingHeader.expectedDate || '',
      status: newStatus,
      notes: editingHeader.notes || '',
      items: editingLines,
    };

    if (modalMode === 'create') {
      setRequests((prev) => [recordToSave, ...prev]);
      toast.success(`Đã tạo Yêu Cầu Chuyển Kho ${recordToSave.requestCode}! (Chưa trừ tồn kho)`);
    } else {
      setRequests((prev) => prev.map((item) => (item.id === recordToSave.id ? recordToSave : item)));
      toast.success(`Đã cập nhật Yêu Cầu Chuyển Kho ${recordToSave.requestCode}!`);
    }

    setIsModalOpen(false);
  };

  const handleUpdateStatus = (req: TransferRequestRecord, nextStatus: string, label: string) => {
    const updated = { ...req, status: nextStatus as any };
    setRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)));
    if (selected?.id === req.id) setSelected(updated);
    toast.success(`Đã ${label} Yêu cầu chuyển kho ${req.requestCode}!`);
  };

  // Convert approved request into Stock Transfer Execution
  const handleConvertToExecution = (req: TransferRequestRecord) => {
    const executionOrder: any = {
      id: `stx-${Date.now()}`,
      transferNumber: `STX-2026-${Math.floor(500 + Math.random() * 500)}`,
      requestRefCode: req.requestCode,
      sourceHub: req.sourceHub,
      destinationHub: req.destinationHub,
      dispatchDate: new Date().toISOString().split('T')[0],
      estArrivalDate: req.expectedDate || '',
      totalUnits: req.items.reduce((acc, i) => acc + i.requestedQuantity, 0),
      totalValuation: req.items.reduce((acc, i) => acc + i.requestedQuantity * 20000, 0),
      status: 'READY_TO_SHIP',
      logisticsPartner: 'Nội bộ (Đội xe công ty)',
      trackingRef: '',
      requestedBy: req.requestedBy,
      approvedBy: 'Giám đốc kho (System Admin)',
      notes: `Tạo từ Yêu cầu chuyển kho ${req.requestCode}`,
      priority: req.priority,
      items: req.items.map((i) => ({
        id: `ex-${Date.now()}-${Math.random()}`,
        productName: i.productName,
        variant: i.variant,
        sku: i.sku,
        requestedQuantity: i.requestedQuantity,
        quantity: i.requestedQuantity,
        receivedQuantity: 0,
        unitPrice: 20000,
        amount: i.requestedQuantity * 20000,
      })),
    };

    addStockTransfer(executionOrder);
    toast.success(`Đã khởi tạo Phiếu Chuyển Kho ${executionOrder.transferNumber} từ Yêu cầu ${req.requestCode}!`);
    navigate('/inventory/transfers');
  };

  const handleDeleteConfirm = () => {
    if (deletingId) {
      setRequests((prev) => prev.filter((r) => r.id !== deletingId));
      toast.success('Đã xóa Yêu cầu chuyển kho!');
      setDeletingId(null);
      if (selected?.id === deletingId) setSelected(null);
    }
  };

  const columns = useMemo<ColumnDef<TransferRequestRecord>[]>(
    () => [
      {
        accessorKey: 'requestCode',
        header: 'Mã yêu cầu',
        cell: (info) => (
          <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800 text-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'sourceHub',
        header: 'Kho/Chi nhánh xuất',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'destinationHub',
        header: 'Kho/Chi nhánh nhận',
        cell: (info) => <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'requestedBy',
        header: 'Người yêu cầu',
        cell: (info) => <span className="font-medium text-gray-800 dark:text-gray-200 text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'priority',
        header: 'Độ ưu tiên',
        cell: (info) => {
          const p = info.getValue() as string || TransferPriority.MEDIUM;
          const cfg = PRIORITY_MAP[p] || PRIORITY_MAP[TransferPriority.MEDIUM];
          return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>{cfg.label}</span>;
        },
      },
      {
        accessorKey: 'items',
        header: 'SL Yêu cầu / Variant',
        cell: ({ row }) => {
          const totalUnits = (row.original.items || []).reduce((acc, i) => acc + (i.requestedQuantity || 0), 0);
          return (
            <div className="text-xs">
              <span className="font-mono font-bold text-gray-900 dark:text-white">{totalUnits} sản phẩm</span>
              <span className="text-[11px] text-gray-400 block font-semibold">
                {row.original.items ? row.original.items.length : 0} variant
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái Yêu cầu',
        cell: (info) => {
          const status = info.getValue() as string;
          const cfg = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-800 border-gray-200' };
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.cls}`}>{cfg.label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
              title="Xem chi tiết yêu cầu"
            >
              <Eye className="w-4 h-4" />
            </button>
            {row.original.status === TransferRequestStatus.APPROVED && (
              <button
                onClick={(e) => { e.stopPropagation(); handleConvertToExecution(row.original); }}
                className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                title="Tạo Phiếu Chuyển Kho Thực Hiện"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Lập Phiếu
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
              title="Sửa yêu cầu"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingId(row.original.id); }}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Xóa yêu cầu"
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="text-amber-600" /> Quản lý Yêu Cầu Chuyển Kho (Transfer Requests)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ghi nhận nhu cầu luân chuyển tồn kho giữa các bãi kho & phê duyệt trước khi tạo Phiếu chuyển kho xuất hàng (Chưa trừ tồn kho).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all text-xs font-bold shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo Yêu Cầu Chuyển Kho Mới
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex items-center gap-3 w-full sm:w-2/3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm Yêu cầu theo Mã, Kho xuất, Kho nhận, Người yêu cầu..."
            className="w-full bg-transparent outline-none text-xs text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-400 whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value={TransferRequestStatus.DRAFT}>Bản nháp</option>
            <option value={TransferRequestStatus.PENDING_APPROVAL}>Chờ duyệt</option>
            <option value={TransferRequestStatus.APPROVED}>Đã duyệt</option>
            <option value={TransferRequestStatus.REJECTED}>Bị từ chối</option>
            <option value={TransferRequestStatus.CANCELLED}>Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* ── Modal Xem Chi Tiết Yêu Cầu Chuyển Kho ────────────────── */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi Tiết Yêu Cầu Chuyển Kho: ${selected.requestCode}` : 'Chi Tiết Yêu Cầu'}
        width="max-w-3xl"
      >
        {selected && (
          <div className="space-y-6 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-sm text-amber-600 dark:text-amber-400">
                  {selected.requestCode}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_MAP[selected.status]?.cls}`}>
                  {STATUS_MAP[selected.status]?.label || selected.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selected.status === TransferRequestStatus.DRAFT && (
                  <button
                    onClick={() => handleUpdateStatus(selected, TransferRequestStatus.PENDING_APPROVAL, 'gửi duyệt')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs"
                  >
                    Gửi Phê Duyệt
                  </button>
                )}
                {selected.status === TransferRequestStatus.PENDING_APPROVAL && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selected, TransferRequestStatus.APPROVED, 'phê duyệt')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Duyệt Yêu Cầu
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selected, TransferRequestStatus.REJECTED, 'từ chối')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Từ Chối
                    </button>
                  </>
                )}
                {selected.status === TransferRequestStatus.APPROVED && (
                  <button
                    onClick={() => handleConvertToExecution(selected)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-extrabold text-xs shadow-md flex items-center gap-1.5"
                  >
                    <ArrowRight className="w-4 h-4" /> Lập Phiếu Chuyển Kho
                  </button>
                )}
              </div>
            </div>

            {/* 1. Header Details */}
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" /> 1. Thông tin phiếu đề xuất
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Mã yêu cầu</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{selected.requestCode}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Người đề xuất</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selected.requestedBy}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Kho / Chi nhánh xuất</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selected.sourceHub}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Kho / Chi nhánh nhận</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selected.destinationHub}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Mức độ ưu tiên</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${PRIORITY_MAP[selected.priority || TransferPriority.MEDIUM]?.cls}`}>
                    {PRIORITY_MAP[selected.priority || TransferPriority.MEDIUM]?.label}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Lý do điều chuyển</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selected.reason}</span>
                </div>
              </div>
            </div>

            {/* 2. Items List */}
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" /> 2. Danh mục sản phẩm yêu cầu điều chuyển
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-2.5 border-b">#</th>
                      <th className="p-2.5 border-b">Sản phẩm</th>
                      <th className="p-2.5 border-b">SKU / Variant</th>
                      <th className="p-2.5 border-b text-right">Tồn kho nguồn (Khả dụng)</th>
                      <th className="p-2.5 border-b text-right">SL Yêu cầu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                    {(selected.items || []).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                        <td className="p-2.5 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-gray-900 dark:text-white">{item.productName}</td>
                        <td className="p-2.5 font-mono text-amber-600 dark:text-amber-400 font-semibold">
                          <div>{item.variant}</div>
                          <div className="text-[10px] text-gray-400">{item.sku}</div>
                        </td>
                        <td className="p-2.5 text-right font-mono text-gray-500 font-semibold">
                          {item.availableQuantity ?? 100} sp
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900 dark:text-white text-sm">
                          {item.requestedQuantity} sp
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selected.notes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú đề xuất</span>
                <p className="italic text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setSelected(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs"
              >
                Đóng Hộp Thoại
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Lập Yêu Cầu Chuyển Kho ────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Khởi Tạo Yêu Cầu Chuyển Kho (Transfer Request)' : 'Chỉnh Sửa Yêu Cầu Chuyển Kho'}
        width="max-w-3xl"
      >
        <form onSubmit={(e) => handleSaveRequest(e)} className="space-y-5 text-xs">
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] border-b pb-1">
              1. Thông tin yêu cầu điều chuyển
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Mã yêu cầu *</label>
                <input
                  type="text"
                  value={editingHeader.requestCode || ''}
                  onChange={(e) => setEditingHeader({ ...editingHeader, requestCode: e.target.value })}
                  required
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono font-bold text-amber-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Người đề xuất *</label>
                {usersList.length > 0 ? (
                  <select
                    value={editingHeader.requestedBy || currentUser?.name || ''}
                    onChange={(e) => setEditingHeader({ ...editingHeader, requestedBy: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-medium"
                  >
                    {usersList.map((u) => (
                      <option key={u.id} value={u.fullName || u.username}>
                        {u.fullName || u.username} ({u.role || 'User'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editingHeader.requestedBy || currentUser?.name || 'System User'}
                    onChange={(e) => setEditingHeader({ ...editingHeader, requestedBy: e.target.value })}
                    required
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-medium"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Mức độ ưu tiên *</label>
                <select
                  value={editingHeader.priority || TransferPriority.MEDIUM}
                  onChange={(e) => setEditingHeader({ ...editingHeader, priority: e.target.value as TransferPriority })}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold"
                >
                  <option value={TransferPriority.LOW}>Thấp</option>
                  <option value={TransferPriority.MEDIUM}>Trung bình</option>
                  <option value={TransferPriority.HIGH}>Cao</option>
                  <option value={TransferPriority.URGENT}>Khẩn cấp</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Kho / Chi nhánh xuất *</label>
                <select
                  value={editingHeader.sourceHub || ''}
                  onChange={(e) => setEditingHeader({ ...editingHeader, sourceHub: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-gray-900 dark:text-white"
                >
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.branchCode})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Chi nhánh Hà Nội (Kho chính)">Chi nhánh Hà Nội (Kho chính)</option>
                      <option value="Tổng kho TP. Hồ Chí Minh">Tổng kho TP. Hồ Chí Minh</option>
                      <option value="Chi nhánh Đà Nẵng">Chi nhánh Đà Nẵng</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Kho / Chi nhánh nhận *</label>
                <select
                  value={editingHeader.destinationHub || ''}
                  onChange={(e) => setEditingHeader({ ...editingHeader, destinationHub: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-bold text-emerald-600 dark:text-emerald-400"
                >
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name} ({b.branchCode})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Chi nhánh TP. Hồ Chí Minh">Chi nhánh TP. Hồ Chí Minh</option>
                      <option value="Chi nhánh Hà Nội (Kho chính)">Chi nhánh Hà Nội (Kho chính)</option>
                      <option value="Chi nhánh Đà Nẵng">Chi nhánh Đà Nẵng</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Lý do điều chuyển *</label>
                <input
                  type="text"
                  value={editingHeader.reason || ''}
                  onChange={(e) => setEditingHeader({ ...editingHeader, reason: e.target.value })}
                  placeholder="Nhập lý do điều chuyển..."
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items Builder */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-600" /> 2. Danh mục sản phẩm yêu cầu điều chuyển
              </h4>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Thêm sản phẩm
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b">
                    <th className="pb-1 w-48">Sản phẩm</th>
                    <th className="pb-1 w-32">Variant / SKU</th>
                    <th className="pb-1 text-right w-28">Tồn nguồn khả dụng</th>
                    <th className="pb-1 text-right w-28">SL Yêu cầu *</th>
                    <th className="pb-1 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {editingLines.map((line, idx) => {
                    const isExceeded = line.availableQuantity !== undefined && line.requestedQuantity > line.availableQuantity;
                    return (
                      <tr key={line.id || idx} className={isExceeded ? 'bg-rose-50/70 dark:bg-rose-950/30' : ''}>
                        <td className="py-2 pr-2">
                          {products.length > 0 ? (
                            <select
                              value={products.find((p) => p.name === line.productName)?.id || ''}
                              onChange={(e) => handleSelectProductForLine(idx, e.target.value)}
                              className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-bold text-gray-900 dark:text-white"
                            >
                              <option value="">-- Chọn sản phẩm --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.sku})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={line.productName}
                              onChange={(e) => handleUpdateLine(idx, 'productName', e.target.value)}
                              className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-bold"
                              placeholder="Tên sản phẩm"
                              required
                            />
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="text"
                            value={line.variant}
                            onChange={(e) => handleUpdateLine(idx, 'variant', e.target.value)}
                            className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs text-amber-600 font-semibold mb-1"
                            placeholder="Variant"
                            required
                          />
                          <input
                            type="text"
                            value={line.sku}
                            onChange={(e) => handleUpdateLine(idx, 'sku', e.target.value)}
                            className="w-full p-1 bg-white dark:bg-gray-800 border rounded text-[10px] font-mono text-gray-500"
                            placeholder="SKU"
                          />
                        </td>
                        <td className="py-2 pr-2 text-right font-mono font-bold text-gray-500">
                          {line.availableQuantity ?? 100} sp
                        </td>
                        <td className="py-2 pr-2">
                          <input
                            type="number"
                            min={1}
                            max={line.availableQuantity ?? 9999}
                            value={line.requestedQuantity}
                            onChange={(e) => handleUpdateLine(idx, 'requestedQuantity', parseFloat(e.target.value) || 0)}
                            className={`w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-mono font-bold text-right ${
                              isExceeded ? 'border-rose-500 text-rose-600 bg-rose-50' : ''
                            }`}
                            required
                          />
                          {isExceeded && (
                            <span className="text-[10px] text-rose-600 font-bold block text-right mt-0.5">
                              Vượt tồn nguồn!
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          {editingLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {formTotals.hasExceededStock && (
              <div className="p-2.5 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 flex items-center gap-2 font-bold text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Cảnh báo: Có sản phẩm có Số lượng yêu cầu vượt quá Tồn kho nguồn khả dụng ({editingHeader.sourceHub})!
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/50 text-center">
              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-amber-100 dark:border-amber-800">
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số variant</span>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {formTotals.totalVariants} variant
                </p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-amber-100 dark:border-amber-800">
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số lượng yêu cầu</span>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5 font-mono">
                  {formTotals.totalUnits} sản phẩm
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú đề xuất</label>
            <textarea
              value={editingHeader.notes || ''}
              onChange={(e) => setEditingHeader({ ...editingHeader, notes: e.target.value })}
              rows={2}
              placeholder="Ghi chú thêm về nhu cầu điều chuyển..."
              className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={(e) => handleSaveRequest(e, TransferRequestStatus.DRAFT)}
              className="px-4 py-2 bg-gray-600 text-white rounded-xl text-xs font-bold"
            >
              Lưu Bản Nháp
            </button>
            <button
              type="submit"
              onClick={(e) => handleSaveRequest(e, TransferRequestStatus.PENDING_APPROVAL)}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer"
            >
              Gửi Phê Duyệt
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Xác nhận xóa yêu cầu chuyển kho"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-700 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa yêu cầu chuyển kho này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer"
            >
              Xóa yêu cầu
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
