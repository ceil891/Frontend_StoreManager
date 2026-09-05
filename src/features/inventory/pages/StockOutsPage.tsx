import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import {
  Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download,
  Printer, Package, Layers, DollarSign, Building, UserCheck, Tag, PlusCircle, X
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type StockOutRecord, type StockOutDetailItem } from '@/features/inventory/store/inventoryStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

export const StockOutType = {
  BAN_HANG: 'BAN_HANG',
  TRA_NCC: 'TRA_NCC',
  HUY_HANG_HONG: 'HUY_HANG_HONG',
  CHUYEN_KHO: 'CHUYEN_KHO',
  NOI_BO: 'NOI_BO',
} as const;
export type StockOutType = (typeof StockOutType)[keyof typeof StockOutType];

export const StockOutStatus = {
  CHO_XU_LY: 'CHO_XU_LY',
  DA_XUAT: 'DA_XUAT',
  DA_HUY: 'DA_HUY',
} as const;
export type StockOutStatus = (typeof StockOutStatus)[keyof typeof StockOutStatus];

const TYPE_MAP: Record<StockOutType | string, { label: string; cls: string }> = {
  [StockOutType.BAN_HANG]: { label: 'Bán hàng / Xuất đơn', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200' },
  [StockOutType.TRA_NCC]: { label: 'Trả nhà cung cấp', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200' },
  [StockOutType.HUY_HANG_HONG]: { label: 'Xuất hủy / Hư hỏng', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200' },
  [StockOutType.CHUYEN_KHO]: { label: 'Xuất luân chuyển kho', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200' },
  [StockOutType.NOI_BO]: { label: 'Xuất sử dụng nội bộ', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200' },
};

const STATUS_MAP: Record<StockOutStatus | string, { label: string; cls: string }> = {
  [StockOutStatus.CHO_XU_LY]: { label: 'Chờ xử lý (Nháp)', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200' },
  [StockOutStatus.DA_XUAT]: { label: 'Đã xuất kho', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200' },
  [StockOutStatus.DA_HUY]: { label: 'Đã hủy', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200' },
};

export function StockOutsPage() {
  const { stockOuts: data, fetchStockOuts, addStockOut, updateStockOut, deleteStockOut, products, fetchProducts } = useInventoryStore();
  const currentUser = useAuthStore((s) => s.user);

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StockOutRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Dynamic API options
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Edit Form State
  const [editingItem, setEditingItem] = useState<Partial<StockOutRecord>>({});
  const [editingLines, setEditingLines] = useState<StockOutDetailItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchStockOuts(),
          fetchProducts(),
        ]);
      } catch (err) {
        console.error('Error fetching stock outs / products API:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    // Fetch branches list from API
    axiosClient.get('/branches')
      .then((res: any) => {
        const list = res.data?.content || res.content || res.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setBranchesList(list);
        }
      })
      .catch(() => {});

    // Fetch active users for creator dropdown
    axiosClient.get('/users?status=ACTIVE&size=200')
      .then((res: any) => {
        const list = res.data?.content || res.content || res.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setUsersList(list);
        }
      })
      .catch(() => {});
  }, [fetchStockOuts, fetchProducts]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.stockOutCode.toLowerCase().includes(q) ||
        d.creator.toLowerCase().includes(q) ||
        (d.warehouseName && d.warehouseName.toLowerCase().includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q))
    );
  }, [search, data]);

  const generateNextStockOutCode = () => {
    const count = data.length + 1;
    return `PXK${String(count).padStart(6, '0')}`;
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    const nowStr = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const defaultBranch = branchesList.length > 0 ? (branchesList[0].branchName || branchesList[0].name) : 'Chi nhánh Hà Nội (Kho chính)';
    const defaultCreator = currentUser?.name || (usersList.length > 0 ? usersList[0].fullName || usersList[0].username : 'Nguyễn Văn A (Trưởng kho)');

    setEditingItem({
      stockOutCode: generateNextStockOutCode(),
      outType: StockOutType.BAN_HANG,
      warehouseName: defaultBranch,
      issuedDate: nowStr,
      creator: defaultCreator,
      status: StockOutStatus.CHO_XU_LY,
      notes: 'Xuất kho phục vụ đơn hàng bán lẻ POS & Đơn hàng Online.',
    });

    const firstProduct = products.length > 0 ? products[0] : null;
    setEditingLines([
      {
        id: `line-${Date.now()}`,
        productName: firstProduct ? firstProduct.name : 'Chọn sản phẩm',
        variant: firstProduct && firstProduct.variants && firstProduct.variants.length > 0 
          ? `${firstProduct.variants[0].color || ''} ${firstProduct.variants[0].size || ''}`.trim() 
          : 'Mẫu tiêu chuẩn',
        sku: firstProduct ? firstProduct.sku : `SKU-OUT-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: firstProduct && firstProduct.barcodes && firstProduct.barcodes.length > 0 ? firstProduct.barcodes[0] : `893521${Math.floor(100000 + Math.random() * 900000)}`,
        quantity: 1,
        unitPrice: firstProduct ? (firstProduct.costPrice || firstProduct.price || 100000) : 100000,
        amount: firstProduct ? (firstProduct.costPrice || firstProduct.price || 100000) : 100000,
      },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StockOutRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setEditingLines(item.items && item.items.length > 0 ? item.items : []);
    setIsModalOpen(true);
  };

  const handleAddLineItem = () => {
    const firstProduct = products.length > 0 ? products[0] : null;
    const newLine: StockOutDetailItem = {
      id: `line-${Date.now()}`,
      productName: firstProduct ? firstProduct.name : 'Sản phẩm mới',
      variant: firstProduct && firstProduct.variants && firstProduct.variants.length > 0 
        ? `${firstProduct.variants[0].color || ''} ${firstProduct.variants[0].size || ''}`.trim() 
        : 'Tiêu chuẩn',
      sku: firstProduct ? firstProduct.sku : `SKU-OUT-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: firstProduct && firstProduct.barcodes && firstProduct.barcodes.length > 0 ? firstProduct.barcodes[0] : `893521${Math.floor(100000 + Math.random() * 900000)}`,
      quantity: 1,
      unitPrice: firstProduct ? (firstProduct.costPrice || firstProduct.price || 500000) : 500000,
      amount: firstProduct ? (firstProduct.costPrice || firstProduct.price || 500000) : 500000,
    };
    setEditingLines((prev) => [...prev, newLine]);
  };

  const handleSelectProductForLine = (index: number, selectedProductId: string) => {
    const p = products.find((prod) => String(prod.id) === selectedProductId);
    if (!p) return;

    setEditingLines((prev) => {
      const next = [...prev];
      const qty = Number(next[index].quantity || 1);
      const price = Number(p.costPrice || p.price || 0);
      next[index] = {
        ...next[index],
        productName: p.name,
        sku: p.sku || next[index].sku,
        barcode: p.barcodes && p.barcodes.length > 0 ? p.barcodes[0] : next[index].barcode,
        variant: p.variants && p.variants.length > 0 
          ? `${p.variants[0].color || ''} ${p.variants[0].size || ''}`.trim() 
          : 'Mẫu tiêu chuẩn',
        unitPrice: price,
        amount: qty * price,
      };
      return next;
    });
  };

  const handleUpdateLine = (index: number, field: keyof StockOutDetailItem, value: any) => {
    setEditingLines((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = Number(target.quantity || 0);
        const price = Number(target.unitPrice || 0);
        target.amount = qty * price;
      }
      next[index] = target;
      return next;
    });
  };

  const handleRemoveLine = (index: number) => {
    setEditingLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Totals Calculation
  const formTotals = useMemo(() => {
    const totalVariants = editingLines.length;
    const totalItems = editingLines.reduce((acc, line) => acc + Number(line.quantity || 0), 0);
    const totalValue = editingLines.reduce((acc, line) => acc + Number(line.amount || 0), 0);
    return { totalVariants, totalItems, totalValue };
  }, [editingLines]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.stockOutCode || !editingItem.creator) {
      toast.error('Vui lòng điền đầy đủ Mã phiếu xuất và Người lập phiếu!');
      return;
    }

    const recordToSave: StockOutRecord = {
      id: editingItem.id || String(Date.now()),
      stockOutCode: editingItem.stockOutCode || generateNextStockOutCode(),
      outType: editingItem.outType || StockOutType.BAN_HANG,
      warehouseName: editingItem.warehouseName || 'Chi nhánh Hà Nội (Kho chính)',
      issuedDate: editingItem.issuedDate || new Date().toISOString().slice(0, 16).replace('T', ' '),
      creator: editingItem.creator || currentUser?.name || 'Nhân viên kho',
      status: editingItem.status || StockOutStatus.CHO_XU_LY,
      totalVariants: formTotals.totalVariants,
      totalItems: formTotals.totalItems,
      totalValue: formTotals.totalValue,
      items: editingLines,
      notes: editingItem.notes || '',
    };

    try {
      if (modalMode === 'create') {
        await addStockOut(recordToSave);
        toast.success(`Tạo thành công Phiếu xuất kho ${recordToSave.stockOutCode}!`);
      } else if (editingItem.id) {
        await updateStockOut(editingItem.id, recordToSave);
        toast.success(`Đã cập nhật thành công Phiếu xuất kho ${recordToSave.stockOutCode}!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('API save stock out error:', err);
      toast.error('Có lỗi xảy ra khi lưu phiếu xuất kho.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      try {
        await deleteStockOut(deletingId);
        toast.success('Đã xóa phiếu xuất kho thành công!');
        setDeletingId(null);
        if (selected?.id === deletingId) setSelected(null);
      } catch (err) {
        console.error('API delete stock out error:', err);
        toast.error('Có lỗi xảy ra khi xóa phiếu xuất kho.');
      }
    }
  };

  const formatCurrency = (val?: number) => {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  };

  const columns = useMemo<ColumnDef<StockOutRecord>[]>(
    () => [
      {
        accessorKey: 'stockOutCode',
        header: 'Mã phiếu xuất',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'outType',
        header: 'Loại xuất kho',
        cell: (info) => {
          const typeKey = info.getValue() as string;
          const cfg = TYPE_MAP[typeKey] || { label: typeKey, cls: 'bg-gray-100 text-gray-800 border-gray-200' };
          return (
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>
              {cfg.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'warehouseName',
        header: 'Chi nhánh / Kho xuất',
        cell: (info) => <span className="font-medium text-gray-800 dark:text-gray-200 text-xs">{info.getValue() as string || 'Chi nhánh Hà Nội'}</span>,
      },
      {
        accessorKey: 'creator',
        header: 'Người lập',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'issuedDate',
        header: 'Ngày xuất',
        cell: (info) => <span className="text-gray-500 dark:text-gray-400 font-mono text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalItems',
        header: 'Số lượng / Variant',
        cell: ({ row }) => (
          <div className="text-xs">
            <span className="font-mono font-bold text-gray-900 dark:text-white">{row.original.totalItems} sản phẩm</span>
            <span className="text-[11px] text-gray-400 block font-semibold">{row.original.totalVariants || (row.original.items ? row.original.items.length : 1)} variant</span>
          </div>
        ),
      },
      {
        accessorKey: 'totalValue',
        header: 'Tổng giá trị xuất',
        cell: (info) => <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
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
              title="Xem chi tiết phiếu xuất"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
              title="Chỉnh sửa phiếu xuất"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingId(row.original.id); }}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Xóa phiếu xuất"
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
            <FileText className="text-emerald-600" /> Quản lý Phiếu Xuất Kho
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi chi tiết các đợt xuất kho bán hàng, xuất trả bưu cục/nhà cung cấp, hủy hỏng hoặc chuyển kho nội bộ.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-xs font-semibold shadow-sm">
            <Download className="w-4 h-4" /> Xuất Báo Cáo Excel
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-xs font-bold shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Lập Phiếu Xuất Kho Mới
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm phiếu xuất kho theo Mã phiếu, Người lập, Chi nhánh kho xuất, Ghi chú..."
          className="w-full bg-transparent outline-none text-xs text-gray-900 dark:text-white"
        />
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-500">Đang tải danh sách phiếu xuất kho từ API...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      {/* ── Modal Xem Chi Tiết Phiếu Xuất Kho ────────────────── */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi Tiết Phiếu Xuất Kho: ${selected.stockOutCode}` : 'Chi Tiết Phiếu Xuất'}
        width="max-w-3xl"
      >
        {selected && (
          <div className="space-y-6 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {selected.stockOutCode}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_MAP[selected.status]?.cls}`}>
                  {STATUS_MAP[selected.status]?.label || selected.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.success(`Đang gửi lệnh in phiếu ${selected.stockOutCode}...`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold hover:bg-gray-50 text-xs shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" /> In Phiếu Xuất
                </button>
              </div>
            </div>

            {/* 1. Thông Tin Phiếu */}
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" /> 1. Thông tin phiếu xuất kho
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Mã phiếu xuất</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{selected.stockOutCode}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Loại xuất kho</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {TYPE_MAP[selected.outType]?.label || selected.outType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Chi nhánh / Kho xuất</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selected.warehouseName || 'Chi nhánh Hà Nội (Kho chính)'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Người lập phiếu</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selected.creator}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Ngày xuất kho</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">{selected.issuedDate}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Trạng thái</span>
                  <span className="font-bold text-gray-900 dark:text-white">{STATUS_MAP[selected.status]?.label}</span>
                </div>
              </div>
            </div>

            {/* 2. Chi Tiết Hàng Xuất */}
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" /> 2. Chi tiết danh mục hàng xuất
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-2.5 border-b">#</th>
                      <th className="p-2.5 border-b">Sản phẩm</th>
                      <th className="p-2.5 border-b">Variant</th>
                      <th className="p-2.5 border-b font-mono">SKU / Barcode</th>
                      <th className="p-2.5 border-b text-right">Số lượng</th>
                      <th className="p-2.5 border-b text-right">Đơn giá</th>
                      <th className="p-2.5 border-b text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                    {(selected.items || []).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                        <td className="p-2.5 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-gray-900 dark:text-white">{item.productName}</td>
                        <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">{item.variant}</td>
                        <td className="p-2.5 font-mono text-gray-500">
                          <div>{item.sku}</div>
                          {item.barcode && <div className="text-[10px] text-gray-400 font-mono">{item.barcode}</div>}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900 dark:text-white">{item.quantity}</td>
                        <td className="p-2.5 text-right font-mono text-gray-600 dark:text-gray-400">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Tổng Hợp Cuối Phiếu */}
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" /> 3. Tổng hợp giá trị phiếu xuất kho
              </h4>
              <div className="grid grid-cols-3 gap-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-center">
                <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số variant</span>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                    {selected.totalVariants || (selected.items ? selected.items.length : 0)} <span className="text-xs text-gray-400 font-normal">variant</span>
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số lượng</span>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 font-mono">
                    {selected.totalItems} <span className="text-xs text-gray-400 font-normal">sản phẩm</span>
                  </p>
                </div>
                <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng giá trị xuất</span>
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                    {formatCurrency(selected.totalValue)}
                  </p>
                </div>
              </div>
            </div>

            {selected.notes && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú xuất kho</span>
                <p className="italic text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setSelected(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs transition-colors"
              >
                Đóng Hộp Thoại
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Lập / Chỉnh sửa Phiếu Xuất Kho ─────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lập Phiếu Xuất Kho Mới (Goods Issue Note)' : 'Chỉnh sửa Phiếu Xuất Kho'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          
          {/* Section 1: Header Information */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] border-b pb-1">
              1. Thông tin phiếu xuất kho
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Mã phiếu xuất *</label>
                <input
                  type="text"
                  value={editingItem.stockOutCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, stockOutCode: e.target.value })}
                  required
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono font-bold text-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Loại xuất kho *</label>
                <select
                  value={editingItem.outType || StockOutType.BAN_HANG}
                  onChange={(e) => setEditingItem({ ...editingItem, outType: e.target.value as StockOutType })}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold"
                >
                  <option value={StockOutType.BAN_HANG}>Bán hàng / Xuất đơn</option>
                  <option value={StockOutType.TRA_NCC}>Trả nhà cung cấp</option>
                  <option value={StockOutType.HUY_HANG_HONG}>Xuất hủy / Hư hỏng</option>
                  <option value={StockOutType.CHUYEN_KHO}>Xuất luân chuyển kho</option>
                  <option value={StockOutType.NOI_BO}>Xuất sử dụng nội bộ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Chi nhánh / Kho xuất *</label>
                <select
                  value={editingItem.warehouseName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, warehouseName: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-bold"
                >
                  {branchesList.length > 0 ? (
                    branchesList.map((b) => (
                      <option key={b.id} value={b.branchName || b.name || `Chi nhánh ${b.id}`}>
                        {b.branchName || b.name || `Chi nhánh ${b.id}`}
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
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Người lập phiếu *</label>
                {usersList.length > 0 ? (
                  <select
                    value={editingItem.creator || currentUser?.name || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, creator: e.target.value })}
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
                    value={editingItem.creator || currentUser?.name || 'Nguyễn Văn A (Trưởng kho)'}
                    onChange={(e) => setEditingItem({ ...editingItem, creator: e.target.value })}
                    required
                    placeholder="Nhập tên người lập..."
                    className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-medium"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Ngày xuất kho</label>
                <input
                  type="text"
                  value={editingItem.issuedDate || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Trạng thái xử lý</label>
                <select
                  value={editingItem.status || StockOutStatus.CHO_XU_LY}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as StockOutStatus })}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-bold"
                >
                  <option value={StockOutStatus.CHO_XU_LY}>Chờ xử lý (Nháp)</option>
                  <option value={StockOutStatus.DA_XUAT}>Đã xuất kho</option>
                  <option value={StockOutStatus.DA_HUY}>Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Line Items Dynamic Builder */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px]">
                2. Chi tiết danh mục hàng xuất
              </h4>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Thêm sản phẩm xuất
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b">
                    <th className="pb-1 w-48">Sản phẩm</th>
                    <th className="pb-1 w-32">Variant</th>
                    <th className="pb-1">SKU / Barcode</th>
                    <th className="pb-1 text-right w-20">Số lượng</th>
                    <th className="pb-1 text-right w-28">Đơn giá (đ)</th>
                    <th className="pb-1 text-right w-32">Thành tiền (đ)</th>
                    <th className="pb-1 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {editingLines.map((line, idx) => (
                    <tr key={line.id || idx}>
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
                            placeholder="Nhập tên sản phẩm"
                            required
                          />
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={line.variant}
                          onChange={(e) => handleUpdateLine(idx, 'variant', e.target.value)}
                          className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs text-emerald-600 font-semibold"
                          placeholder="Variant"
                          required
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={line.sku}
                          onChange={(e) => handleUpdateLine(idx, 'sku', e.target.value)}
                          className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-mono mb-1"
                          placeholder="SKU"
                          required
                        />
                        <input
                          type="text"
                          value={line.barcode || ''}
                          onChange={(e) => handleUpdateLine(idx, 'barcode', e.target.value)}
                          className="w-full p-1 bg-white dark:bg-gray-800 border rounded text-[10px] font-mono text-gray-400"
                          placeholder="Barcode"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => handleUpdateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-mono font-bold text-right"
                          required
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={line.unitPrice}
                          onChange={(e) => handleUpdateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-mono text-right"
                          required
                        />
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(line.amount)}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Totals Live Box */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-center">
            <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số variant</span>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                {formTotals.totalVariants} variant
              </p>
            </div>
            <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số lượng</span>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5 font-mono">
                {formTotals.totalItems} sản phẩm
              </p>
            </div>
            <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng giá trị xuất kho</span>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                {formatCurrency(formTotals.totalValue)}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú phiếu xuất kho</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              rows={2}
              placeholder="Ghi chú thêm về lý do xuất kho, bưu cục nhận hoặc ghi chú đơn..."
              className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all"
            >
              Lưu Phiếu Xuất Kho
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Xác nhận xóa phiếu xuất kho"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-700 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa phiếu xuất kho này? Hành động này không thể hoàn tác.
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
              Xóa phiếu xuất
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
