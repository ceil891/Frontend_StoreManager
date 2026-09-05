import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, UserCheck, Download, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Upload } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

export interface DeliveryNoteRecord {
  id: string;
  noteCode: string; // Mã biên bản: BB-2026-0001 (⚡ Sinh mã)
  waybillCode: string; // Mã vận đơn liên kết
  customerName: string;
  deliveryStaff: string; // Shipper / Nhân viên bàn giao
  issuedDate: string;
  totalWeight: number; // Tổng trọng lượng (kg)
  packageCount: number; // Tổng số kiện (tách biệt)
  productCount: number; // Tổng số sản phẩm (tách biệt)
  status: 'CHO_BAN_GIAO' | 'DA_BAN_GIAO' | 'BI_TU_CHOI';
  rejectionReasonType?: 'HANG_HU_HONG' | 'SAI_SAN_PHAM' | 'THIEU_HANG' | 'BAO_BI_HU_HONG' | 'KHACH_KHONG_NHAN' | 'KHAC';
  rejectionReasonDetail?: string;
  signerName?: string; // Người ký nhận
  signedAt?: string; // Thời gian ký nhận
  conditionNotes?: string; // Ghi chú tình trạng thùng/hàng
  attachments?: string; // Tài liệu đính kèm
}

const REJECTION_TYPES: { key: DeliveryNoteRecord['rejectionReasonType']; label: string }[] = [
  { key: 'HANG_HU_HONG', label: 'Hàng hư hỏng' },
  { key: 'SAI_SAN_PHAM', label: 'Sai sản phẩm' },
  { key: 'THIEU_HANG', label: 'Thiếu hàng' },
  { key: 'BAO_BI_HU_HONG', label: 'Bao bì hư hỏng' },
  { key: 'KHACH_KHONG_NHAN', label: 'Khách không nhận' },
  { key: 'KHAC', label: 'Khác' },
];

export function DeliveryNotesPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<DeliveryNoteRecord[]>([]);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selected, setSelected] = useState<DeliveryNoteRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<DeliveryNoteRecord>>({});

  const [deleteTarget, setDeleteTarget] = useState<DeliveryNoteRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axiosClient.delete(`/wms/delivery-notes/${deleteTarget.id}`);
      setData((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast.success(`Đã xóa biên bản bàn giao ${deleteTarget.noteCode}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi xóa biên bản bàn giao trên hệ thống.');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any>('/wms/delivery-notes');
      const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : []));
      const mapped = items.map((n: any) => ({
        id: String(n.id),
        noteCode: n.noteCode || `BB-2026-${String(n.id).padStart(4, '0')}`,
        waybillCode: n.waybillCode || n.packingListCode || n.trackingNumber || `VD-2026-000${n.id}`,
        issuedDate: n.deliveryDate ? n.deliveryDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
        customerName: n.customerName || n.recipientName || 'Khách hàng',
        totalWeight: Number(n.totalWeight || 2.5),
        packageCount: Number(n.packageCount || 1),
        productCount: Number(n.productCount || 1),
        deliveryStaff: n.deliveryStaff || n.carrierName || 'Nhân viên giao hàng',
        status: (n.status === 'DA_BAN_GIAO' || n.status === 'DELIVERED' || n.status === 'SUCCESS' ? 'DA_BAN_GIAO' :
                n.status === 'BI_TU_CHOI' || n.status === 'FAILED' || n.status === 'REJECTED' ? 'BI_TU_CHOI' : 'CHO_BAN_GIAO') as DeliveryNoteRecord['status'],
        rejectionReasonType: n.rejectionReasonType,
        rejectionReasonDetail: n.rejectionReasonDetail || n.failureReason || '',
        signerName: n.signerName || '',
        signedAt: n.signedAt || '',
        conditionNotes: n.conditionNotes || 'Thùng hàng nguyên vẹn, niêm phong kỹ',
        attachments: n.attachments || '',
      }));
      setData(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách biên bản bàn giao từ Backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axiosClient.get<any, any>('/sales/orders?size=100');
      const items = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : []));
      setAvailableOrders(items);
    } catch (err) {
      console.warn('Could not fetch orders for delivery notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchOrders();
  }, []);

  // Pre-fill from navigation state if coming from DeliveryListsPage [Tạo Biên bản bàn giao]
  useEffect(() => {
    if (location.state?.waybill) {
      const wb = location.state.waybill;
      setModalMode('create');
      setEditingItem({
        noteCode: `BB-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
        waybillCode: wb.waybillCode,
        issuedDate: new Date().toISOString().split('T')[0],
        customerName: wb.customerName,
        totalWeight: wb.weightKg || 2.5,
        packageCount: wb.packageCount || 1,
        productCount: wb.itemCount || 1,
        deliveryStaff: wb.shipperName || wb.carrierName || 'Nguyễn Văn Shipper',
        status: 'DA_BAN_GIAO',
        signerName: wb.customerName,
        signedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        conditionNotes: 'Hàng nguyên tem mác, bao bì nguyên vẹn',
      });
      setIsModalOpen(true);
    }
  }, [location.state]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch =
        !search ||
        d.noteCode.toLowerCase().includes(search.toLowerCase()) ||
        d.waybillCode.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        d.deliveryStaff.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const today = new Date().toISOString().split('T')[0];
    const firstOrd = availableOrders[0];
    const defaultWaybill = firstOrd?.trackingCode || firstOrd?.orderCode || 'VD-2026-0001';
    const defaultCustomer = firstOrd?.customerName || 'Công ty TNHH Thương Mại ABC';
    const defaultStaff = firstOrd?.shipperName || firstOrd?.carrier || 'Nguyễn Văn A (Sales/Shipper)';
    const defaultProductCount = firstOrd?.details?.length || 15;

    setEditingItem({
      noteCode: `BB-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      waybillCode: defaultWaybill,
      issuedDate: today,
      customerName: defaultCustomer,
      totalWeight: 3.5,
      packageCount: 2,
      productCount: defaultProductCount,
      deliveryStaff: defaultStaff,
      status: 'CHO_BAN_GIAO',
      signerName: '',
      signedAt: '',
      rejectionReasonType: undefined,
      rejectionReasonDetail: '',
      conditionNotes: 'Thùng carton niêm phong kỹ',
      attachments: '',
    });
    setIsModalOpen(true);
  };

  const handleSelectOrder = (waybill: string) => {
    const matched = availableOrders.find(o => (o.trackingCode === waybill || o.orderCode === waybill));
    if (matched) {
      setEditingItem(prev => ({
        ...prev,
        waybillCode: waybill,
        customerName: matched.customerName || prev.customerName,
        deliveryStaff: matched.shipperName || matched.carrier || prev.deliveryStaff,
        productCount: matched.details?.length || prev.productCount || 1,
      }));
      toast.info(`Đã chọn vận đơn ${waybill} - Khách: ${matched.customerName}`);
    } else {
      setEditingItem(prev => ({ ...prev, waybillCode: waybill }));
    }
  };

  const handleOpenEdit = (item: DeliveryNoteRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.noteCode || !editingItem.waybillCode || !editingItem.customerName) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    if (editingItem.status === 'BI_TU_CHOI' && !editingItem.rejectionReasonType && !editingItem.rejectionReasonDetail) {
      toast.error('Vui lòng chọn hoặc nhập Lý do từ chối nhận hàng (*)');
      return;
    }

    try {
      const payload = {
        noteCode: editingItem.noteCode,
        waybillCode: editingItem.waybillCode,
        customerName: editingItem.customerName,
        recipientName: editingItem.signerName || editingItem.customerName,
        deliveryStaff: editingItem.deliveryStaff,
        totalWeight: Number(editingItem.totalWeight || 0),
        packageCount: Number(editingItem.packageCount || 0),
        productCount: Number(editingItem.productCount || 0),
        deliveryDate: editingItem.issuedDate ? `${editingItem.issuedDate}T00:00:00` : new Date().toISOString(),
        status: editingItem.status || 'CHO_BAN_GIAO',
        signerName: editingItem.signerName,
        signedAt: editingItem.signedAt,
        conditionNotes: editingItem.conditionNotes,
        attachments: editingItem.attachments,
        rejectionReasonType: editingItem.rejectionReasonType,
        rejectionReasonDetail: editingItem.rejectionReasonDetail,
        carrierName: editingItem.deliveryStaff,
        trackingNumber: editingItem.waybillCode,
      };

      if (modalMode === 'create') {
        await axiosClient.post('/wms/delivery-notes', payload);
        toast.success(`Đã tạo Biên bản bàn giao ${payload.noteCode} thành công!`);
      } else {
        await axiosClient.put(`/wms/delivery-notes/${editingItem.id}`, payload);
        toast.success(`Đã cập nhật Biên bản bàn giao ${payload.noteCode}!`);
      }
      setIsModalOpen(false);
      await fetchNotes();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu biên bản bàn giao lên máy chủ.');
    }
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    CHO_BAN_GIAO: { label: 'Chờ bàn giao', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    DA_BAN_GIAO: { label: 'Đã bàn giao thành công / Khách đã ký', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold' },
    BI_TU_CHOI: { label: 'Khách từ chối nhận hàng', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 font-bold' },
  };

  const columns = useMemo<ColumnDef<DeliveryNoteRecord>[]>(
    () => [
      {
        accessorKey: 'noteCode',
        header: 'Mã biên bản',
        cell: (info) => (
          <div>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">{info.getValue() as string}</span>
            <p className="text-[10px] text-gray-400">Vận đơn: {info.row.original.waybillCode}</p>
          </div>
        ),
      },
      {
        id: 'customerInfo',
        header: 'Người nhận (Khách hàng / Đại lý)',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">{row.original.customerName}</p>
            <p className="text-xs text-gray-500">Bàn giao: {row.original.deliveryStaff}</p>
          </div>
        ),
      },
      {
        id: 'counts',
        header: 'Số kiện / Số sản phẩm',
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-bold text-blue-600">{row.original.packageCount} kiện hàng</p>
            <p className="text-gray-600">{row.original.productCount} sản phẩm ({row.original.totalWeight} kg)</p>
          </div>
        ),
      },
      {
        id: 'signature',
        header: 'Người ký & Thời gian',
        cell: ({ row }) => (
          <div className="text-xs">
            {row.original.signerName ? (
              <>
                <p className="font-bold text-gray-900 dark:text-white">✍️ {row.original.signerName}</p>
                <p className="text-gray-400">{row.original.signedAt}</p>
              </>
            ) : (
              <span className="text-gray-400 italic">Chưa ký nhận</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Tình trạng bàn giao',
        cell: (info) => {
          const status = info.getValue() as string;
          const conf = statusMap[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${conf.cls}`}>
              {conf.label}
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
              onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}
              title="Xem chi tiết biên bản"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa biên bản"
              className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.original); }}
              title="Xóa biên bản bàn giao"
              className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biên bản bàn giao hàng hóa</h1>
            <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-semibold rounded-full">
              Nghiệm thu & Chữ ký người nhận
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý biên bản bàn giao, tách biệt Tổng số kiện vs Số sản phẩm, ghi nhận chữ ký và lý do từ chối nhận hàng.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Tạo Biên Bản Bàn Giao Mới
        </button>
      </div>

      {/* Filter Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          { key: 'ALL', label: 'Tất cả biên bản', count: data.length, color: 'text-gray-700' },
          { key: 'CHO_BAN_GIAO', label: 'Chờ bàn giao', count: data.filter(d => d.status === 'CHO_BAN_GIAO').length, color: 'text-blue-600' },
          { key: 'DA_BAN_GIAO', label: 'Đã bàn giao (Khách ký)', count: data.filter(d => d.status === 'DA_BAN_GIAO').length, color: 'text-emerald-600 font-bold' },
          { key: 'BI_TU_CHOI', label: 'Khách từ chối nhận', count: data.filter(d => d.status === 'BI_TU_CHOI').length, color: 'text-rose-600 font-bold' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            className={`p-3 rounded-xl border text-left transition-all ${
              statusFilter === item.key
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300'
            }`}
          >
            <p className="text-xs text-gray-500 font-medium">{item.label}</p>
            <p className={`text-lg font-extrabold ${item.color}`}>{item.count}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm mã biên bản, mã vận đơn, tên khách, shipper..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <ReusableDataTable data={filtered} columns={columns} isLoading={isLoading} />
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'create' ? 'TẠO BIÊN BẢN BÀN GIAO HÀNG HÓA MỚI' : 'CHỈNH SỬA BIÊN BẢN BÀN GIAO'}
          width="max-w-5xl"
        >
          <form onSubmit={handleSave} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            {/* Codes & Linked waybill */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã biên bản *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.noteCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, noteCode: e.target.value })}
                  placeholder="BB-2026-XXXX"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã vận đơn liên kết *
                </label>
                <input
                  type="text"
                  required
                  list="ordersDatalist"
                  value={editingItem.waybillCode || ''}
                  onChange={(e) => handleSelectOrder(e.target.value)}
                  placeholder="VD-2026-XXXX hoặc chọn đơn..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-blue-600 font-bold"
                />
                <datalist id="ordersDatalist">
                  {availableOrders.map((ord: any) => (
                    <option key={ord.id} value={ord.trackingCode || ord.orderCode}>
                      {ord.orderCode} - {ord.customerName} ({Number(ord.totalAmount || 0).toLocaleString('vi-VN')} ₫)
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ngày lập biên bản *
                </label>
                <input
                  type="date"
                  required
                  value={editingItem.issuedDate || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>
            </div>

            {/* Handover Parties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Người nhận hàng (Khách hàng / Đại lý) *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.customerName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                  placeholder="Tên khách hàng hoặc tên đại lý nhận hàng..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nhân viên bàn giao / Nhân viên giao hàng *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.deliveryStaff || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, deliveryStaff: e.target.value })}
                  placeholder="Họ tên nhân viên bàn giao..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold"
                />
              </div>
            </div>

            {/* Separated counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-blue-200 dark:border-blue-900 bg-blue-50/20 p-4 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tổng trọng lượng (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editingItem.totalWeight || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, totalWeight: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tổng số kiện hàng
                </label>
                <input
                  type="number"
                  value={editingItem.packageCount || 1}
                  onChange={(e) => setEditingItem({ ...editingItem, packageCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tổng số sản phẩm
                </label>
                <input
                  type="number"
                  value={editingItem.productCount || 1}
                  onChange={(e) => setEditingItem({ ...editingItem, productCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-purple-600"
                />
              </div>
            </div>

            {/* Status & Rejection section */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tình trạng bàn giao *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'CHO_BAN_GIAO', label: 'Chờ bàn giao', color: 'border-blue-300 text-blue-800' },
                    { key: 'DA_BAN_GIAO', label: 'Đã bàn giao / Khách đã ký', color: 'border-emerald-500 text-emerald-800 font-bold' },
                    { key: 'BI_TU_CHOI', label: 'Khách từ chối nhận hàng', color: 'border-rose-500 text-rose-800 font-bold' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setEditingItem({ ...editingItem, status: st.key as any })}
                      className={`p-3 text-sm rounded-xl border text-center transition-all ${
                        editingItem.status === st.key
                          ? 'ring-2 ring-blue-500 shadow-md bg-white dark:bg-gray-800 font-bold'
                          : 'bg-gray-50 dark:bg-gray-900 border-gray-200'
                      } ${st.color}`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rejection reason (Mandatory if BI_TU_CHOI) */}
              {editingItem.status === 'BI_TU_CHOI' && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Lý do từ chối nhận hàng *
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {REJECTION_TYPES.map((t) => (
                      <label key={t.key} className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        <input
                          type="radio"
                          name="rejectionType"
                          checked={editingItem.rejectionReasonType === t.key}
                          onChange={() => setEditingItem({ ...editingItem, rejectionReasonType: t.key })}
                          className="text-rose-600 focus:ring-rose-500"
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    value={editingItem.rejectionReasonDetail || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, rejectionReasonDetail: e.target.value })}
                    placeholder="Mô tả chi tiết lý do từ chối (VD: Thùng móp méo, vỡ tem niêm phong, sai số lượng...)"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-rose-300 dark:border-rose-800 rounded-lg focus:ring-rose-500"
                  />
                </div>
              )}

              {/* Signature section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-emerald-200 dark:border-emerald-900 bg-emerald-50/20 p-4 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Người ký nhận (Khách hàng)
                  </label>
                  <input
                    type="text"
                    value={editingItem.signerName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, signerName: e.target.value })}
                    placeholder="Họ tên người trực tiếp ký nhận..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian ký nhận
                  </label>
                  <input
                    type="text"
                    value={editingItem.signedAt || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, signedAt: e.target.value })}
                    placeholder="2026-08-13 14:30"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>
              </div>

              {/* Condition notes & Attachments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Ghi chú tình trạng thùng/hàng
                  </label>
                  <textarea
                    rows={2}
                    value={editingItem.conditionNotes || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, conditionNotes: e.target.value })}
                    placeholder="Tình trạng bao bì, màng co, niêm phong..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Biên bản nghiệm thu / Tài liệu đính kèm
                  </label>
                  <input
                    type="text"
                    value={editingItem.attachments || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, attachments: e.target.value })}
                    placeholder="Link file đính kèm, ảnh chụp chữ ký..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20"
              >
                Lưu Biên Bản Bàn Giao
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail view Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`BIÊN BẢN BÀN GIAO: ${selected.noteCode}`}
          width="max-w-4xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Vận đơn</span>
                <span className="font-bold text-blue-600">{selected.waybillCode}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Khách nhận</span>
                <span className="font-bold">{selected.customerName}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Nhân viên giao hàng</span>
                <span className="font-bold">{selected.deliveryStaff}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Trạng thái</span>
                <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${statusMap[selected.status]?.cls}`}>
                  {statusMap[selected.status]?.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl text-center text-xs">
              <div>
                <span className="text-gray-500 block">Trọng lượng</span>
                <span className="text-sm font-bold">{selected.totalWeight} kg</span>
              </div>
              <div>
                <span className="text-gray-500 block">Số kiện hàng</span>
                <span className="text-sm font-bold text-blue-600">{selected.packageCount} kiện</span>
              </div>
              <div>
                <span className="text-gray-500 block">Số sản phẩm</span>
                <span className="text-sm font-bold text-purple-600">{selected.productCount} SP</span>
              </div>
            </div>

            {selected.status === 'BI_TU_CHOI' && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl space-y-1 text-sm">
                <p className="font-bold">🔴 Lý do từ chối nhận hàng:</p>
                <p className="font-semibold">{REJECTION_TYPES.find(t => t.key === selected.rejectionReasonType)?.label || selected.rejectionReasonType}</p>
                <p className="text-xs">{selected.rejectionReasonDetail || 'Không có mô tả chi tiết'}</p>
              </div>
            )}

            {selected.signerName && (
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-sm space-y-1">
                <p className="font-bold">✍️ Người ký nhận: {selected.signerName}</p>
                <p className="text-xs">Thời gian ký: {selected.signedAt}</p>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-xl">Đóng</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal xác nhận xóa biên bản bàn giao */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Xóa biên bản bàn giao"
        itemName={deleteTarget?.noteCode}
        description="Hành động này sẽ xóa vĩnh viễn biên bản bàn giao khỏi hệ thống. Bạn có chắc chắn muốn tiếp tục?"
      />
    </div>
  );
}
