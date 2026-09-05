import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useEffect, useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Calendar, User, ClipboardList, Briefcase, FileText, CheckCircle2, Clock, XCircle, ChevronRight, Trash2, Edit, Send, ShoppingCart } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { usePurchaseStore } from '@/features/purchase/store/purchaseStore';

interface PurchaseRequestItem {
  id: string;
  requestCode: string;
  requestDate: string;
  department: string;
  reason: string;
  estimatedTotal: number;
  proposedBy: string;
  status: 'CHỜ_DUYỆT' | 'ĐÃ_DUYỆT' | 'ĐÃ_CHUYỂN_PO' | 'TỪ_CHỐI';
  notes?: string;
  branchId?: number;
  itemsList?: { itemName: string; qty: number; unit: string; estimatedPrice: number }[];
}

export function PurchaseRequestsPage() {
  const { products, fetchProducts } = useInventoryStore();
  const { branches, fetchBranches } = useBranchStore();
  const { suppliers, fetchSuppliers } = usePurchaseStore();
  const [data, setData] = useState<PurchaseRequestItem[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedItem, setSelectedItem] = useState<PurchaseRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<PurchaseRequestItem>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [convertModalItem, setConvertModalItem] = useState<PurchaseRequestItem | null>(null);
  const [convertSupplierId, setConvertSupplierId] = useState<string>('');

  // RFQ Product Line Items State
  const [rfqItems, setRfqItems] = useState<{ id: string; productId?: number; itemName: string; qty: number; unit: string; estimatedPrice: number }[]>([]);

  const updateRfqItemsAndTotal = (newItems: typeof rfqItems) => {
    setRfqItems(newItems);
    const total = newItems.reduce((sum, i) => sum + ((Number(i.qty) || 0) * (Number(i.estimatedPrice) || 0)), 0);
    setEditingItem(prev => ({ ...prev, estimatedTotal: total }));
  };

  const handleAddRfqItem = () => {
    const p = products[0];
    const newItem = {
      id: Date.now().toString(),
      productId: p ? Number(p.id) : undefined,
      itemName: p?.name || '',
      qty: 1,
      unit: 'Cái',
      estimatedPrice: p ? Number(p.costPrice || p.price || 0) : 0,
    };
    updateRfqItemsAndTotal([...rfqItems, newItem]);
  };

  const handleRemoveRfqItem = (id: string) => {
    if (rfqItems.length <= 1) {
      toast.warning('Yêu cầu mua hàng phải có ít nhất 1 mặt hàng');
      return;
    }
    updateRfqItemsAndTotal(rfqItems.filter(i => i.id !== id));
  };

  const handleUpdateRfqItem = (id: string, field: string, val: any) => {
    const updated = rfqItems.map(i => i.id === id ? { ...i, [field]: val } : i);
    updateRfqItemsAndTotal(updated);
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get('/purchase/requests?size=500');
      const list = (res as any).content || res || [];
      const mapped: PurchaseRequestItem[] = (Array.isArray(list) ? list : []).map((item: any) => {
        const statusMap: Record<string, PurchaseRequestItem['status']> = {
          DRAFT: 'CHỜ_DUYỆT',
          PENDING_APPROVAL: 'CHỜ_DUYỆT',
          APPROVED: 'ĐÃ_DUYỆT',
          CONVERTED: 'ĐÃ_CHUYỂN_PO',
          COMPLETED: 'ĐÃ_CHUYỂN_PO',
          REJECTED: 'TỪ_CHỐI',
        };
        const rawItems = item.items || item.details || item.itemsList || [];
        const itemsList = Array.isArray(rawItems) && rawItems.length > 0
          ? rawItems.map((ri: any) => ({
              itemName: ri.itemName || ri.productName || ri.name || 'Thiết bị / Vật tư',
              qty: Number(ri.qty || ri.quantity || 1),
              unit: ri.unit || 'Cái',
              estimatedPrice: Number(ri.estimatedPrice || ri.unitPrice || (item.estimatedTotal ? Math.round(item.estimatedTotal / (ri.quantity || 1)) : 0))
            }))
          : [
              {
                itemName: item.reason || 'Thiết bị / Hàng hóa đề xuất',
                qty: 1,
                unit: 'Gói/Bộ',
                estimatedPrice: item.estimatedTotal || 0,
              }
            ];

        return {
          id: String(item.id),
          requestCode: item.requestCode || '',
          requestDate: item.requestDate || '',
          department: item.branch?.name || item.department || '',
          reason: item.reason || '',
          estimatedTotal: item.estimatedTotal || 0,
          proposedBy: item.proposedBy || item.createdBy || '',
          status: statusMap[item.status] || 'CHỜ_DUYỆT',
          notes: item.notes || '',
          itemsList,
        };
      });
      setData(mapped);
    } catch (err) {
      console.error('Lỗi tải danh sách yêu cầu mua hàng:', err);
      toast.error('Không thể tải danh sách yêu cầu mua hàng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchProducts();
    fetchBranches();
    fetchSuppliers();
  }, [fetchProducts, fetchBranches, fetchSuppliers]);

  const handleSubmitRequest = async (id: string) => {
    try {
      await axiosClient.post(`/purchase/requests/${id}/submit`);
      toast.success('Gửi duyệt yêu cầu mua hàng thành công!');
      fetchRequests();
      setSelectedItem(null);
    } catch (err: any) {
      toast.error('Lỗi khi gửi duyệt: ' + (err?.response?.data?.message || err?.message || ''));
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await axiosClient.post(`/purchase/requests/${id}/approve`);
      toast.success('Đã phê duyệt yêu cầu mua hàng!');
      fetchRequests();
      setSelectedItem(null);
    } catch (err: any) {
      toast.error('Lỗi khi phê duyệt: ' + (err?.response?.data?.message || err?.message || ''));
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await axiosClient.post(`/purchase/requests/${id}/reject`);
      toast.success('Đã từ chối yêu cầu mua hàng!');
      fetchRequests();
      setSelectedItem(null);
    } catch (err: any) {
      toast.error('Lỗi khi từ chối: ' + (err?.response?.data?.message || err?.message || ''));
    }
  };

  const handleConvertToOrder = async () => {
    if (!convertModalItem || !convertSupplierId) {
      toast.error('Vui lòng chọn nhà cung cấp để tạo đơn mua hàng (PO)!');
      return;
    }
    try {
      await axiosClient.post(`/purchase/requests/${convertModalItem.id}/convert-to-order?supplierId=${convertSupplierId}`);
      toast.success('Đã chuyển đổi yêu cầu mua hàng thành đơn mua hàng (PO) thành công!');
      setConvertModalItem(null);
      setSelectedItem(null);
      fetchRequests();
    } catch (err: any) {
      toast.error('Lỗi khi chuyển thành PO: ' + (err?.response?.data?.message || err?.message || ''));
    }
  };

  const filtered = data.filter((item) => {
    const matchesSearch =
      item.requestCode.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase()) ||
      item.reason.toLowerCase().includes(search.toLowerCase()) ||
      item.proposedBy.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    const user = useAuthStore.getState().user;
    const p = products[0];
    setEditingItem({
      requestCode: `PR-2026-00${data.length + 1}`,
      requestDate: new Date().toISOString().split('T')[0],
      department: 'Bộ phận Kho vận',
      reason: '',
      estimatedTotal: p ? Number(p.price || 100000) : 100000,
      proposedBy: user?.name || user?.email || '',
      status: 'CHỜ_DUYỆT',
      notes: '',
    });
    setRfqItems([
      {
        id: '1',
        productId: p ? Number(p.id) : 1,
        itemName: p?.name || 'Sản phẩm đề xuất',
        qty: 1,
        unit: 'Cái',
        estimatedPrice: p ? Number(p.price || 100000) : 100000,
      }
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PurchaseRequestItem) => {
    setModalMode('edit');
    setEditingItem({
      id: item.id,
      requestCode: item.requestCode,
      requestDate: item.requestDate ? item.requestDate.split('T')[0] : new Date().toISOString().split('T')[0],
      department: item.department || 'Bộ phận Kho vận',
      reason: item.reason || '',
      estimatedTotal: item.estimatedTotal || 0,
      proposedBy: item.proposedBy || '',
      status: item.status || 'CHỜ_DUYỆT',
      notes: item.notes || '',
    });
    if (item.itemsList && item.itemsList.length > 0) {
      setRfqItems(item.itemsList.map((it, idx) => {
        const prod = products.find(p => p.name === it.itemName);
        return {
          id: String(idx + 1),
          productId: prod ? Number(prod.id) : (products[0] ? Number(products[0].id) : 1),
          itemName: it.itemName,
          qty: it.qty,
          unit: it.unit || 'Cái',
          estimatedPrice: it.estimatedPrice,
        };
      }));
    } else {
      const p = products[0];
      setRfqItems([
        {
          id: '1',
          productId: p ? Number(p.id) : 1,
          itemName: item.reason || 'Thiết bị / Hàng hóa đề xuất',
          qty: 1,
          unit: 'Gói/Bộ',
          estimatedPrice: item.estimatedTotal || 0,
        }
      ]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.reason || !editingItem.estimatedTotal) return;

    try {
      const statusMap: Record<string, string> = {
        'CHỜ_DUYỆT': 'PENDING_APPROVAL',
        'ĐÃ_CHUYỂN_PO': 'APPROVED',
        'TỪ_CHỐI': 'REJECTED',
      };

      const branchId = (editingItem as any).branchId ? Number((editingItem as any).branchId) : (branches[0] ? Number(branches[0].id) : 1);
      const details = rfqItems.length > 0
        ? rfqItems.map((it) => {
            const matched = products.find(p => String(p.id) === String(it.productId) || p.name.toLowerCase() === it.itemName.toLowerCase() || p.sku.toLowerCase() === it.itemName.toLowerCase());
            const resolvedId = it.productId || (matched ? Number(matched.id) : (products[0] ? Number(products[0].id) : 1));
            return {
              productId: resolvedId,
              quantity: Number(it.qty || 1),
              estimatedPrice: Number(it.estimatedPrice || 0),
            };
          })
        : [
            {
              productId: products[0] ? Number(products[0].id) : 1,
              quantity: 1,
              estimatedPrice: Number(editingItem.estimatedTotal || 0),
            }
          ];

      const rawDate = editingItem.requestDate || new Date().toISOString().split('T')[0];
      const requestDate = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`;

      const payload = {
        requestCode: editingItem.requestCode || `PR-2026-00${data.length + 1}`,
        requestDate,
        reason: editingItem.reason,
        status: statusMap[editingItem.status || 'CHỜ_DUYỆT'] || 'PENDING_APPROVAL',
        branchId,
        note: editingItem.notes || '',
        details,
      };

      if (modalMode === 'edit' && editingItem.id) {
        await axiosClient.put(`/purchase/requests/${editingItem.id}`, payload);
        toast.success('Cập nhật yêu cầu mua hàng thành công');
      } else {
        await axiosClient.post('/purchase/requests', payload);
        toast.success('Tạo yêu cầu mua hàng thành công');
      }
      await fetchRequests();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lỗi lưu yêu cầu mua hàng:', err);
      toast.error('Không thể lưu yêu cầu mua hàng: ' + (err?.response?.data?.message || err?.message || 'Lỗi dữ liệu'));
    }
  };

  const [deletingItem, setDeletingItem] = useState<PurchaseRequestItem | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await axiosClient.delete(`/purchase/requests/${deletingItem.id}`);
      toast.success(`Đã xóa yêu cầu mua hàng "${deletingItem.requestCode}" thành công!`);
      if (selectedItem?.id === deletingItem.id) setSelectedItem(null);
      setDeletingItem(null);
      fetchRequests();
    } catch (err: any) {
      console.error('Lỗi khi xóa yêu cầu mua hàng:', err);
      toast.error('Lỗi khi xóa yêu cầu mua hàng: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<PurchaseRequestItem>[]>(
    () => [
      {
        accessorKey: 'requestCode',
        header: 'Mã yêu cầu',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'requestDate',
        header: 'Ngày đề xuất',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'department',
        header: 'Bộ phận đề xuất',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'reason',
        header: 'Lý do đề xuất',
        cell: (info) => <span className="text-gray-500 text-sm whitespace-normal max-w-xs block line-clamp-2">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'estimatedTotal',
        header: 'Tổng tiền dự kiến',
        cell: (info) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'proposedBy',
        header: 'Người đề xuất',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = '';
          let icon = null;

          if (status === 'ĐÃ_CHUYỂN_PO') {
            badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
            icon = <CheckCircle2 className="w-3.5 h-3.5" />;
          } else if (status === 'CHỜ_DUYỆT') {
            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
            icon = <Clock className="w-3.5 h-3.5" />;
          } else {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            icon = <XCircle className="w-3.5 h-3.5" />;
          }

          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
              {icon}
              {status === 'ĐÃ_CHUYỂN_PO' ? 'ĐÃ CHUYỂN PO' : status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
              title="Chỉnh sửa yêu cầu"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
              title="Xóa yêu cầu"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu cầu mua hàng (purchase request)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Phê duyệt các yêu cầu mua sắm thiết bị, vật tư văn phòng hoặc nhập hàng hóa từ các bộ phận trước khi tạo đơn PO chính thức.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tạo phiếu yêu cầu
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã yêu cầu, bộ phận, lý do hoặc người đề xuất..."
              className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="CHỜ_DUYỆT">CHỜ DUYỆT</option>
              <option value="ĐÃ_CHUYỂN_PO">ĐÃ CHUYỂN PO</option>
              <option value="TỪ_CHỐI">TỪ CHỐI</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedItem(row)} />
        )}
      </div>

      {/* Drawer Chi tiết và mặt hàng mua */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Chi tiết Yêu cầu: ${selectedItem.requestCode}` : 'Thông tin chi tiết'}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng ngân sách dự kiến</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(selectedItem.estimatedTotal)}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-gray-400" /> Mã yêu cầu:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedItem.requestCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-gray-400" /> Bộ phận đề xuất:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.department}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><User className="w-3.5 h-3.5 text-gray-400" /> Người đề xuất:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.proposedBy}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Ngày đề xuất:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.requestDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Trạng thái phê duyệt:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    selectedItem.status === 'ĐÃ_CHUYỂN_PO'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : selectedItem.status === 'CHỜ_DUYỆT'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {selectedItem.status === 'ĐÃ_CHUYỂN_PO' ? 'ĐÃ CHUYỂN PO' : selectedItem.status}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Lý do đề xuất mua sắm</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-850 p-2.5 rounded-lg border border-gray-150 dark:border-gray-800 shadow-sm leading-relaxed">{selectedItem.reason}</p>
              </div>
              {selectedItem.notes && (
                <div className="pt-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú duyệt</span>
                  <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40 italic">{selectedItem.notes}</p>
                </div>
              )}
            </div>

            {/* Chi tiết mặt hàng mua */}
            {selectedItem.itemsList && selectedItem.itemsList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <ChevronRight className="w-4 h-4 text-emerald-500" /> Danh sách thiết bị/vật tư đề xuất mua:
                </h3>
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs">
                      <tr>
                        <th className="p-3">Tên sản phẩm / vật tư</th>
                        <th className="p-3 text-center">SL</th>
                        <th className="p-3 text-center">ĐVT</th>
                        <th className="p-3 text-right">Đơn giá dự kiến</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                      {selectedItem.itemsList.map((itm, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="p-3 font-medium text-gray-900 dark:text-white">{itm.itemName}</td>
                          <td className="p-3 text-center text-gray-700 dark:text-gray-300 font-semibold">{itm.qty}</td>
                          <td className="p-3 text-center text-gray-600 dark:text-gray-400 text-xs">{itm.unit}</td>
                          <td className="p-3 text-right font-bold text-gray-900 dark:text-white">{formatCurrency(itm.estimatedPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Workflow Action Buttons */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-2 justify-end">
              {selectedItem.status === 'CHỜ_DUYỆT' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleSubmitRequest(selectedItem.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Gửi duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveRequest(selectedItem.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Phê duyệt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(selectedItem.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Từ chối
                  </button>
                </>
              )}
              {selectedItem.status === 'ĐÃ_CHUYỂN_PO' && (
                <button
                  type="button"
                  onClick={() => {
                    setConvertModalItem(selectedItem);
                    setConvertSupplierId(suppliers[0] ? String(suppliers[0].id) : '1');
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Chuyển thành Đơn mua (PO)
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'edit' ? '✏️ Chỉnh sửa yêu cầu mua hàng' : '📑 Tạo phiếu gửi yêu cầu báo giá RFQ / Yêu cầu mua hàng'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày lập đề xuất (Mặc định hôm nay) *</label>
              <input
                type="date"
                value={editingItem.requestDate || new Date().toISOString().split('T')[0]}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white cursor-not-allowed font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã yêu cầu (RF/PR) *</label>
              <input
                type="text"
                value={editingItem.requestCode || ''}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bộ phận đề xuất *</label>
              <select
                value={editingItem.department || 'Bộ phận Kho vận'}
                onChange={(e) => setEditingItem({ ...editingItem, department: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="Bộ phận Kho vận">Bộ phận Kho vận</option>
                <option value="Bộ phận Hành chính nhân sự">Bộ phận Hành chính nhân sự</option>
                <option value="Bộ phận Công nghệ (IT)">Bộ phận Công nghệ (IT)</option>
                <option value="Phòng Kinh doanh / Bán hàng">Phòng Kinh doanh / Bán hàng</option>
                <option value="Ban giám đốc">Ban giám đốc</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Người đề xuất *</label>
              <input
                type="text"
                value={editingItem.proposedBy || ''}
                onChange={(e) => setEditingItem({ ...editingItem, proposedBy: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:italic"
                placeholder="Nhập tên người đề xuất (VD: Nguyễn Văn A)..."
                required
              />
            </div>
          </div>

          {/* Datalist for autocomplete product name */}
          <datalist id="suggested-products">
            <option value="Máy in hóa đơn nhiệt Xprinter Q200" />
            <option value="Máy quét mã vạch 2D Zebra DS2208" />
            <option value="Giấy in nhiệt K80 bọc bạc phi 45" />
            <option value="Ngăn kéo đựng tiền thu ngân M410" />
            <option value="Màn hình cảm ứng POS 15 inch" />
            <option value="Bàn phím cơ không dây văn phòng" />
          </datalist>

          {/* Section Bảng Vật tư / Sản phẩm đề xuất RFQ */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                📦 Danh sách thiết bị / vật tư cần báo giá ({rfqItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddRfqItem}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm vật tư
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Tên sản phẩm / Thiết bị</th>
                    <th className="p-2 w-24 text-center">Số lượng</th>
                    <th className="p-2 w-28 text-center">ĐVT</th>
                    <th className="p-2 w-36 text-right">Đơn giá dự kiến</th>
                    <th className="p-2 w-32 text-right">Thành tiền</th>
                    <th className="p-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {rfqItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">
                        {products.length > 0 ? (
                          <select
                            value={(item as any).productId ? String((item as any).productId) : ''}
                            onChange={(e) => {
                              const pid = e.target.value;
                              const p = products.find(prod => String(prod.id) === pid);
                              if (p) {
                                handleUpdateRfqItem(item.id, 'productId', Number(p.id));
                                handleUpdateRfqItem(item.id, 'itemName', p.name);
                                handleUpdateRfqItem(item.id, 'estimatedPrice', Number(p.costPrice || p.price || 0));
                              }
                            }}
                            className="w-full p-1.5 border rounded bg-white dark:bg-gray-900 text-xs font-medium"
                          >
                            <option value="">-- Chọn sản phẩm --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            list="suggested-products"
                            value={item.itemName}
                            onChange={(e) => handleUpdateRfqItem(item.id, 'itemName', e.target.value)}
                            className="w-full p-1.5 border rounded bg-white dark:bg-gray-900 text-xs placeholder:text-gray-400 placeholder:italic"
                            placeholder="Gõ hoặc chọn thiết bị..."
                          />
                        )}
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleUpdateRfqItem(item.id, 'qty', parseInt(e.target.value) || 0)}
                          className="w-full p-1.5 border rounded text-center font-bold"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={item.unit}
                          onChange={(e) => handleUpdateRfqItem(item.id, 'unit', e.target.value)}
                          className="w-full p-1.5 border rounded bg-white dark:bg-gray-900 text-xs"
                        >
                          <option value="Cái">Cái</option>
                          <option value="Bộ">Bộ</option>
                          <option value="Hộp">Hộp</option>
                          <option value="Thùng">Thùng</option>
                          <option value="Cuộn">Cuộn</option>
                          <option value="Chiếc">Chiếc</option>
                          <option value="Gói">Gói</option>
                        </select>
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input
                          type="text"
                          value={(item.estimatedPrice || 0).toLocaleString('vi-VN')}
                          onChange={(e) => {
                            const raw = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                            handleUpdateRfqItem(item.id, 'estimatedPrice', raw);
                          }}
                          className="w-full p-1.5 border rounded text-right font-mono text-xs"
                          placeholder="100.000"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 font-mono">
                        {((item.qty || 0) * (item.estimatedPrice || 0)).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRfqItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                Kinh phí dự toán tự động:
              </span>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                <span className="font-mono text-base text-emerald-600 font-extrabold">{(editingItem.estimatedTotal || 0).toLocaleString('vi-VN')} ₫</span>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lý do & mục đích đề xuất mua hàng *</label>
            <textarea
              rows={2}
              value={editingItem.reason || ''}
              onChange={(e) => setEditingItem({ ...editingItem, reason: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Giải trình cụ thể nhu cầu sử dụng..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú bổ sung</label>
            <textarea
              rows={2}
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Hướng dẫn thêm cho bộ phận mua sắm..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'edit' ? 'Lưu thay đổi' : 'Tạo phiếu đề xuất'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa yêu cầu mua hàng"
        description="Bạn có chắc chắn muốn xóa yêu cầu mua hàng này khỏi hệ thống không?"
        itemName={deletingItem ? `${deletingItem.requestCode} (${deletingItem.department})` : undefined}
      />

      <Modal
        isOpen={Boolean(convertModalItem)}
        onClose={() => setConvertModalItem(null)}
        title={`Chuyển yêu cầu ${convertModalItem?.requestCode} thành Đơn Mua Hàng (PO)`}
        width="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-300">
            Vui lòng chọn nhà cung cấp để hệ thống tự động sinh Đơn mua hàng (PO) từ các mặt hàng được duyệt:
          </p>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhà cung cấp *</label>
            <select
              value={convertSupplierId}
              onChange={(e) => setConvertSupplierId(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.supplierName} ({s.code || s.id})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setConvertModalItem(null)}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConvertToOrder}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold"
            >
              Tạo Đơn PO Ngay
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
