import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Building2, Calendar, FileText, ShieldCheck, FileCheck, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { usePurchaseStore, type PurchaseOrderItem } from '../store/purchaseStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Bản nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  DISPATCHED: 'Đang vận chuyển',
  DELIVERED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
};

interface POLineItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export function PurchaseOrdersPage() {
  const { purchaseOrders: data, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, fetchPurchaseOrders } = usePurchaseStore();
  const [apiSuppliers, setApiSuppliers] = useState<string[]>([]);
  const [apiProducts, setApiProducts] = useState<{ name: string; price: number }[]>([]);
  const [apiBranches, setApiBranches] = useState<string[]>([]);

  useEffect(() => {
    fetchPurchaseOrders();

    axiosClient.get('/partnerarea/suppliers?size=500').then((res: any) => {
      const list = extractPageContent<any>(res);
      setApiSuppliers(list.map((s: any) => s.supplierName || s.name || s.fullName || '').filter(Boolean));
    }).catch(() => {});

    axiosClient.get('/products?size=500').then((res: any) => {
      const list = extractPageContent<any>(res);
      setApiProducts(list.map((p: any) => ({
        name: p.name || p.productName || '',
        price: Number(p.costPrice || p.basePrice || p.retailPrice || 0)
      })).filter((p: any) => p.name));
    }).catch(() => {});

    axiosClient.get('/branches').then((res: any) => {
      const list = extractPageContent<any>(res);
      setApiBranches(list.map((b: any) => b.branchName || b.name || '').filter(Boolean));
    }).catch(() => {});
  }, [fetchPurchaseOrders]);

  const [search, setSearch] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderItem | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoCode, setIsAutoCode] = useState(true);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPO, setEditingPO] = useState<Partial<PurchaseOrderItem> & { poLines?: POLineItem[] }>({});
  const [deletingPO, setDeletingPO] = useState<PurchaseOrderItem | null>(null);

  const filtered = data.filter((item) =>
    item.supplierName.toLowerCase().includes(search.toLowerCase()) ||
    item.poNumber.toLowerCase().includes(search.toLowerCase()) ||
    item.destinationStore.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setIsAutoCode(true);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const initialLines: POLineItem[] = apiProducts.length > 0
      ? [{ productName: apiProducts[0].name, quantity: 10, unitPrice: apiProducts[0].price }]
      : [];
    const totalQty = initialLines.reduce((acc, l) => acc + l.quantity, 0);
    const totalVal = initialLines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);

    setEditingPO({
      poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: apiSuppliers[0] || '',
      destinationStore: apiBranches[0] || 'Chi nhánh mặc định',
      orderDate: today,
      estDeliveryDate: nextWeek.toISOString().split('T')[0],
      totalCost: totalVal,
      status: 'DRAFT',
      paymentStatus: 'UNPAID',
      orderedBy: 'Admin User',
      itemsCount: totalQty,
      notes: 'Giao hàng trong giờ hành chính, kèm đầy đủ chứng từ VAT.',
      poLines: initialLines
    });
    setIsModalOpen(true);
  };

  const handleAddPOLine = () => {
    const lines = editingPO.poLines || [];
    const newLine: POLineItem = apiProducts.length > 0
      ? { productName: apiProducts[0].name, quantity: 10, unitPrice: apiProducts[0].price }
      : { productName: '', quantity: 1, unitPrice: 0 };
    const updatedLines = [...lines, newLine];
    const totalQty = updatedLines.reduce((acc, l) => acc + Number(l.quantity), 0);
    const totalVal = updatedLines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);

    setEditingPO({
      ...editingPO,
      poLines: updatedLines,
      itemsCount: totalQty,
      totalCost: totalVal
    });
  };

  const handlePOLineChange = (index: number, field: keyof POLineItem, val: any) => {
    const lines = [...(editingPO.poLines || [])];
    const item = { ...lines[index], [field]: val };

    if (field === 'productName') {
      const found = apiProducts.find(p => p.name === val);
      if (found) {
        item.unitPrice = found.price;
      }
    }
    lines[index] = item;

    const totalQty = lines.reduce((acc, l) => acc + Number(l.quantity), 0);
    const totalVal = lines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);

    setEditingPO({
      ...editingPO,
      poLines: lines,
      itemsCount: totalQty,
      totalCost: totalVal
    });
  };

  const handleRemovePOLine = (index: number) => {
    const lines = (editingPO.poLines || []).filter((_, i) => i !== index);
    const totalQty = lines.reduce((acc, l) => acc + Number(l.quantity), 0);
    const totalVal = lines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);

    setEditingPO({
      ...editingPO,
      poLines: lines,
      itemsCount: totalQty,
      totalCost: totalVal
    });
  };

  const handleOpenEdit = (po: PurchaseOrderItem & { poLines?: POLineItem[] }) => {
    setModalMode('edit');
    setIsAutoCode(false);

    const existingLines: POLineItem[] = (po.poLines && po.poLines.length > 0)
      ? po.poLines
      : [
          {
            productName: apiProducts[0]?.name || 'Sản phẩm',
            quantity: po.itemsCount || 1,
            unitPrice: po.itemsCount && po.itemsCount > 0 ? Math.round(po.totalCost / po.itemsCount) : po.totalCost
          }
        ];

    setEditingPO({
      ...po,
      poLines: existingLines
    });
    setIsModalOpen(true);
  };

  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPO.supplierName?.trim()) {
      toast.error('Vui lòng chọn hoặc nhập tên Nhà cung cấp!');
      return;
    }
    if (!editingPO.poNumber?.trim()) {
      toast.error('Vui lòng nhập Mã đơn mua hàng (PO)!');
      return;
    }
    if (!editingPO.poLines || editingPO.poLines.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 sản phẩm vào đơn mua!');
      return;
    }

    try {
      if (modalMode === 'create') {
        const newPO: Omit<PurchaseOrderItem, 'id'> = {
          poNumber: editingPO.poNumber,
          supplierName: editingPO.supplierName,
          destinationStore: editingPO.destinationStore || 'Main Flagship / HQ',
          orderDate: editingPO.orderDate || new Date().toISOString().split('T')[0],
          estDeliveryDate: editingPO.estDeliveryDate || '',
          totalCost: Number(editingPO.totalCost) || 0,
          status: editingPO.status as any || 'DRAFT',
          paymentStatus: editingPO.paymentStatus as any || 'UNPAID',
          orderedBy: editingPO.orderedBy || 'Admin User',
          itemsCount: Number(editingPO.itemsCount) || 1,
          notes: editingPO.notes || ''
        };
        await addPurchaseOrder(newPO);
        toast.success('Đã tạo đơn mua hàng thành công');
      } else if (editingPO.id) {
        await updatePurchaseOrder(editingPO.id, editingPO);
        toast.success('Đã cập nhật đơn mua hàng');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Lưu đơn mua hàng thất bại');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPO) return;
    try {
      await deletePurchaseOrder(deletingPO.id);
      toast.success('Đã xóa đơn mua hàng');
    } catch (err) {
      console.error(err);
      toast.error('Xóa đơn mua hàng thất bại');
    }
    setDeletingPO(null);
  };

  const columns = useMemo<ColumnDef<PurchaseOrderItem>[]>(
    () => [
      {
        accessorKey: 'poNumber',
        header: 'Mã đơn mua (PO)',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'destinationStore',
        header: 'Chi nhánh nhận',
      },
      {
        accessorKey: 'totalCost',
        header: 'Tổng chi phí',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{(info.getValue() as number).toLocaleString('vi-VN')} ₫</span>,
      },
      {
        accessorKey: 'estDeliveryDate',
        header: 'Ngày dự kiến (ETA)',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái đơn',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'DISPATCHED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'APPROVED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' :
              status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {STATUS_LABELS[status] || status}
            </span>
          );
        },
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Thanh toán',
        cell: (info) => {
          const status = info.getValue() as string;
          const payMap: Record<string, string> = {
            UNPAID: 'Chưa thanh toán',
            PARTIAL_ADVANCE: 'Tạm ứng 1 phần',
            PAID: 'Đã thanh toán',
          };
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
              status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'PARTIAL_ADVANCE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {payMap[status] || status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedPO(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingPO(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn đặt hàng mua (Purchase Orders)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tạo đơn đặt hàng mua sỉ, theo dõi tiến độ giao hàng và ngân sách thu mua. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success('Xuất dữ liệu đơn mua hàng thành công!')}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-95 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all text-sm font-bold shadow hover:shadow-lg active:scale-95 whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Tạo Đơn Mua Hàng Mới
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
              placeholder="Tìm kiếm theo số PO, nhà cung cấp hoặc kho nhận..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button title="Bộ lọc" className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm whitespace-nowrap shrink-0">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedPO(row)} />
      </div>

      <Modal
        isOpen={!!selectedPO}
        onClose={() => setSelectedPO(null)}
        title={selectedPO ? `Đơn đặt hàng mua: ${selectedPO.poNumber}` : 'Chi tiết đơn PO'}
        width="max-w-lg"
      >
        {selectedPO && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Tổng chi phí dự kiến</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedPO.totalCost.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedPO.status === 'DELIVERED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedPO.status === 'DISPATCHED' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedPO.status === 'APPROVED' ? 'bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100' :
                selectedPO.status === 'PENDING_APPROVAL' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {STATUS_LABELS[selectedPO.status] || selectedPO.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Nhà cung cấp
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedPO.supplierName}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày nhận dự kiến (ETA)
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedPO.estDeliveryDate}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Chi nhánh nhận:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedPO.destinationStore}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Ngày lập đơn:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedPO.orderDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Số lượng mặt hàng:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedPO.itemsCount} đơn vị</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Thanh toán:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                  selectedPO.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                  selectedPO.paymentStatus === 'PARTIAL_ADVANCE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                }`}>{
                  selectedPO.paymentStatus === 'PAID' ? 'Đã thanh toán đủ' :
                  selectedPO.paymentStatus === 'PARTIAL_ADVANCE' ? 'Tạm ứng 1 phần' :
                  'Chưa thanh toán'
                }</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Nhân viên thu mua:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedPO.orderedBy}</span>
              </div>

              {selectedPO.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Điều khoản & Ghi chú vận chuyển</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedPO.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedPO.status === 'PENDING_APPROVAL' && (
                <button
                  onClick={() => {
                    updatePurchaseOrder(selectedPO.id, { status: 'APPROVED' });
                    setSelectedPO({ ...selectedPO, status: 'APPROVED' });
                    toast.success('Đã phê duyệt đơn đặt hàng mua thành công!');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  <ShieldCheck className="w-4 h-4" /> Phê duyệt đơn mua
                </button>
              )}
              {selectedPO.status === 'DISPATCHED' && (
                <button
                  onClick={() => {
                    updatePurchaseOrder(selectedPO.id, { status: 'DELIVERED' });
                    setSelectedPO({ ...selectedPO, status: 'DELIVERED' });
                    toast.success('Đã ghi nhận nhập kho hàng thành công!');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  <FileCheck className="w-4 h-4" /> Nhập kho hàng (GRN)
                </button>
              )}
              <button
                onClick={() => toast.success('Đã tải xuống file PO PDF thành công!')}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                Tải PO PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo đơn đặt hàng mua' : 'Cập nhật đơn mua'}
        size="erp"
      >
        <form onSubmit={handleSavePO}>
          <div className="erp-form-body">
            {/* Section 1: Thông tin đơn hàng */}
            <div className="erp-form-section space-y-4" style={{gridColumn: 'span 2'}}>
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Thông tin đơn hàng</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mã PO *</label>
                    {modalMode === 'create' && (
                      <label className="flex items-center gap-1 text-[10px] text-emerald-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isAutoCode}
                          onChange={(e) => {
                            setIsAutoCode(e.target.checked);
                            if (e.target.checked) {
                              setEditingPO(prev => ({
                                ...prev,
                                poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                              }));
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-550 w-3 h-3"
                        />
                        <span>Tự động sinh</span>
                      </label>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editingPO.poNumber || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, poNumber: e.target.value })}
                    disabled={modalMode === 'create' && isAutoCode}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp *</label>
                  <select
                    value={editingPO.supplierName || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, supplierName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
                    required
                  >
                    <option value="">-- Chọn Nhà Cung Cấp --</option>
                    {apiSuppliers.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh nhận hàng</label>
                  <select
                    value={editingPO.destinationStore || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, destinationStore: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Chọn Chi Nhánh --</option>
                    {apiBranches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người lập đơn</label>
                  <input
                    type="text"
                    value={editingPO.orderedBy || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, orderedBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày lập đơn</label>
                  <input
                    type="date"
                    value={editingPO.orderDate || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, orderDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày nhận dự kiến (ETA)</label>
                  <input
                    type="date"
                    value={editingPO.estDeliveryDate || ''}
                    onChange={(e) => setEditingPO({ ...editingPO, estDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái đơn hàng</label>
                  <select
                    value={editingPO.status || 'DRAFT'}
                    onChange={(e) => setEditingPO({ ...editingPO, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="DRAFT">Bản nháp</option>
                    <option value="PENDING_APPROVAL">Chờ duyệt</option>
                    <option value="APPROVED">Đã duyệt</option>
                    <option value="DISPATCHED">Đang vận chuyển</option>
                    <option value="DELIVERED">Đã nhận hàng</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái thanh toán</label>
                  <select
                    value={editingPO.paymentStatus || 'UNPAID'}
                    onChange={(e) => setEditingPO({ ...editingPO, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UNPAID">Chưa thanh toán</option>
                    <option value="PARTIAL_ADVANCE">Đã tạm ứng</option>
                    <option value="PAID">Đã thanh toán đủ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Chi tiết sản phẩm - full width */}
            <div className="erp-form-section space-y-3" style={{gridColumn: '1 / -1'}}>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 animate-pulse" />
                  Chi tiết các sản phẩm đặt mua (PO Line Items)
                </h3>
                <button
                  type="button"
                  onClick={handleAddPOLine}
                  className="px-2.5 py-1 text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors font-semibold"
                >
                  + Thêm sản phẩm đặt mua
                </button>
              </div>

              {(!editingPO.poLines || editingPO.poLines.length === 0) ? (
                <p className="text-xs text-gray-400 italic bg-white dark:bg-gray-900/10 p-4 text-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  Chưa có sản phẩm nào. Vui lòng bấm nút phía trên để thêm mặt hàng đặt mua.
                </p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {editingPO.poLines.map((line, idx) => (
                    <div key={idx} className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 space-y-2 relative">
                      <button
                        type="button"
                        onClick={() => handleRemovePOLine(idx)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Xóa mặt hàng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pr-6">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase">Tên sản phẩm *</label>
                          <select
                            value={line.productName}
                            onChange={(e) => handlePOLineChange(idx, 'productName', e.target.value)}
                            className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium cursor-pointer"
                          >
                            <option value="">-- Chọn Sản Phẩm --</option>
                            {apiProducts.map((p) => (
                              <option key={p.name} value={p.name}>
                                {p.name} ({p.price.toLocaleString('vi-VN')} ₫)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:col-span-1">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-400 uppercase">Số lượng</label>
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => handlePOLineChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-400 uppercase">Đơn giá (₫)</label>
                            <input
                              type="number"
                              min="0"
                              value={line.unitPrice}
                              onChange={(e) => handlePOLineChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        Thành tiền: {(line.quantity * line.unitPrice).toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & Điều khoản</label>
                <textarea
                  rows={2}
                  value={editingPO.notes || ''}
                  onChange={(e) => setEditingPO({ ...editingPO, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Ghi chú về vận chuyển, thanh toán..."
                />
              </div>
            </div>
          </div>

          <div className="erp-form-footer">
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
              {modalMode === 'create' ? 'Tạo PO' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </Modal>


      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingPO}
        onClose={() => setDeletingPO(null)}
        title="Xác nhận xóa Đơn mua"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa đơn đặt hàng <strong className="text-gray-900 dark:text-white">{deletingPO?.poNumber}</strong> không? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setDeletingPO(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
