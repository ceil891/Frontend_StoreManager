import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Truck, CheckCircle, Package, ArrowRight, DollarSign, UserCheck, ShieldAlert, Phone } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { useSalesStore, formatMoney } from '@/features/sales/store/salesStore';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export interface DeliveryRecord {
  id: string;
  waybillCode: string; // Mã vận đơn nội bộ: VD-2026-0001
  carrierTrackingCode?: string; // Mã vận đơn ĐVVC: GHTK123456789
  orderCode: string; // Mã đơn hàng (SO)
  customerName: string;
  customerPhone?: string;
  shippingAddress: string;
  carrierName: string; // GHTK, GHN, Viettel Post, Shopee Express (SPX), Vận chuyển nội bộ
  shipperName?: string;
  shipperPhone?: string;
  weightKg: number;
  packageCount: number;
  totalAmount: number;
  paidAmount: number;
  codAmount: number; // COD = Total - Paid
  createdDate: string;
  expectedDeliveryDate: string;
  status: 'CHO_GIAO_DVVC' | 'DANG_VAN_CHUYEN' | 'GIAO_THANH_CONG' | 'GIAO_THAT_BAI' | 'CHO_CHUYEN_HOAN' | 'DA_CHUYEN_HOAN';
  notes?: string;
}

export function DeliveryListsPage() {
  const { saleOrders, fetchSaleOrders } = useSalesStore();
  const customers = useCrmStore((s) => s.customers);
  const fetchCustomers = useCrmStore((s) => s.fetchCustomers);
  const navigate = useNavigate();

  const [data, setData] = useState<DeliveryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selected, setSelected] = useState<DeliveryRecord | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<DeliveryRecord>>({});
  const [deletingItem, setDeletingItem] = useState<DeliveryRecord | null>(null);

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchSaleOrders(), fetchCustomers()]);
      const res = await axiosClient.get<any, any[]>('/logistics/trips');
      const mapped = (Array.isArray(res) ? res : []).map((t: any) => ({
        id: String(t.id),
        waybillCode: t.tripCode || `VD-2026-${String(t.id).padStart(4, '0')}`,
        carrierTrackingCode: t.carrierTrackingCode || t.trackingCode || '',
        orderCode: t.orderCode || t.order?.orderCode || `SO-2026-${t.id}`,
        customerName: t.receiverName || t.customerName || 'Khách hàng',
        customerPhone: t.receiverPhone || t.customerPhone || '',
        shippingAddress: t.deliveryAddress || t.shippingAddress || '',
        carrierName: t.carrierName || (t.shipper?.name ? 'Vận chuyển nội bộ' : 'GHTK'),
        shipperName: t.shipperName || t.shipper?.name || 'Nguyễn Văn Shipper',
        shipperPhone: t.shipperPhone || t.shipper?.phone || '0901234567',
        weightKg: Number(t.weightKg || t.weight || 1.5),
        packageCount: Number(t.packageCount || t.packages || 1),
        totalAmount: Number(t.totalAmount || t.amount || 1000000),
        paidAmount: Number(t.paidAmount || 300000),
        codAmount: Number(t.codAmount !== undefined ? t.codAmount : Math.max(0, (t.totalAmount || 1000000) - (t.paidAmount || 300000))),
        createdDate: t.startTime ? t.startTime.substring(0, 10) : new Date().toISOString().substring(0, 10),
        expectedDeliveryDate: t.endTime ? t.endTime.substring(0, 10) : new Date(Date.now() + 2 * 84600000).toISOString().substring(0, 10),
        status: (t.status === 'SUCCESS' || t.status === 'DELIVERED' ? 'GIAO_THANH_CONG' :
                t.status === 'DELIVERING' || t.status === 'IN_TRANSIT' ? 'DANG_VAN_CHUYEN' :
                t.status === 'FAILED' ? 'GIAO_THAT_BAI' :
                t.status === 'PENDING_RETURN' ? 'CHO_CHUYEN_HOAN' :
                t.status === 'RETURNED' ? 'DA_CHUYEN_HOAN' : 'CHO_GIAO_DVVC') as DeliveryRecord['status'],
        notes: t.deliveryNote || t.notes || '',
      }));
      setData(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách vận đơn.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch =
        !search ||
        d.waybillCode.toLowerCase().includes(search.toLowerCase()) ||
        (d.carrierTrackingCode && d.carrierTrackingCode.toLowerCase().includes(search.toLowerCase())) ||
        d.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        d.customerName.toLowerCase().includes(search.toLowerCase()) ||
        d.carrierName.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const today = new Date().toISOString().split('T')[0];
    const expected = new Date(Date.now() + 2 * 84600000).toISOString().split('T')[0];

    const firstOrder = saleOrders[0];
    const totalAmt = firstOrder ? firstOrder.totalAmount : 1000000;
    const paidAmt = firstOrder ? (firstOrder.paymentStatus === 'PAID' ? totalAmt : 300000) : 300000;
    const computedCod = Math.max(0, totalAmt - paidAmt);

    setEditingItem({
      waybillCode: `VD-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      carrierTrackingCode: 'GHTK' + Math.floor(100000000 + Math.random() * 900000000),
      orderCode: firstOrder ? firstOrder.code : 'SO-2026-0001',
      customerName: firstOrder ? (firstOrder.customerName || 'Khách hàng') : 'Công ty ABC',
      customerPhone: firstOrder ? (firstOrder.customerPhone || '0908888999') : '0908888999',
      shippingAddress: firstOrder ? (firstOrder.shippingAddress || '123 Nguyễn Huệ, Q.1, TP.HCM') : '123 Nguyễn Huệ, Q.1, TP.HCM',
      carrierName: 'Giao Hàng Tiết Kiệm (GHTK)',
      shipperName: 'Nguyễn Văn A (Shipper GHTK)',
      shipperPhone: '0909123456',
      weightKg: 2.5,
      packageCount: 2,
      totalAmount: totalAmt,
      paidAmount: paidAmt,
      codAmount: computedCod,
      createdDate: today,
      expectedDeliveryDate: expected,
      status: 'CHO_GIAO_DVVC',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DeliveryRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCalculateCod = (total: number, paid: number) => {
    const cod = Math.max(0, total - paid);
    setEditingItem((prev) => ({
      ...prev,
      totalAmount: total,
      paidAmount: paid,
      codAmount: cod,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.waybillCode || !editingItem.orderCode || !editingItem.customerName) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc (*)');
      return;
    }

    try {
      const matchedOrder = saleOrders.find(
        (so) => so.code === editingItem.orderCode || `SO-${so.id}` === editingItem.orderCode
      );

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/trips', {
          tripCode: editingItem.waybillCode,
          status: editingItem.status || 'PENDING',
          deliveryAddress: editingItem.shippingAddress || '',
          receiverName: editingItem.customerName || '',
          receiverPhone: editingItem.customerPhone || '',
          deliveryNote: editingItem.notes || '',
          orderId: matchedOrder ? Number(matchedOrder.id) : null,
        });
        toast.success(`Đã tạo Vận đơn giao hàng ${editingItem.waybillCode} thành công!`);
      } else if (editingItem.id) {
        await axiosClient.put(`/logistics/trips/${editingItem.id}`, {
          status: editingItem.status,
          deliveryAddress: editingItem.shippingAddress,
          receiverName: editingItem.customerName,
          receiverPhone: editingItem.customerPhone,
          deliveryNote: editingItem.notes,
          orderId: matchedOrder ? Number(matchedOrder.id) : undefined,
        });
        toast.success(`Đã cập nhật Vận đơn ${editingItem.waybillCode}!`);
      }
      setIsModalOpen(false);
      await fetchTrips();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu vận đơn: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await axiosClient.delete(`/logistics/trips/${deletingItem.id}`);
      toast.success(`Đã xóa vận đơn ${deletingItem.waybillCode} thành công!`);
      setDeletingItem(null);
      await fetchTrips();
    } catch (err: any) {
      console.error('Lỗi khi xóa vận đơn:', err);
      toast.error('Không thể xóa vận đơn: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    CHO_GIAO_DVVC: { label: 'Chờ giao ĐVVC', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    DANG_VAN_CHUYEN: { label: 'Đang vận chuyển', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    GIAO_THANH_CONG: { label: 'Giao hàng thành công', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold' },
    GIAO_THAT_BAI: { label: 'Giao hàng thất bại', cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
    CHO_CHUYEN_HOAN: { label: 'Chờ chuyển hoàn', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
    DA_CHUYEN_HOAN: { label: 'Đã chuyển hoàn', cls: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  };

  const columns = useMemo<ColumnDef<DeliveryRecord>[]>(
    () => [
      {
        accessorKey: 'waybillCode',
        header: 'Mã vận đơn',
        cell: (info) => (
          <div>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">{info.getValue() as string}</span>
            {info.row.original.carrierTrackingCode && (
              <p className="text-[10px] font-mono text-purple-600 dark:text-purple-400">ĐVVC: {info.row.original.carrierTrackingCode}</p>
            )}
            <p className="text-[10px] text-gray-400">Đơn SO: {info.row.original.orderCode}</p>
          </div>
        ),
      },
      {
        id: 'customerInfo',
        header: 'Người nhận & Địa chỉ',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">{row.original.customerName}</p>
            {row.original.customerPhone && <p className="text-xs text-gray-500">SĐT: {row.original.customerPhone}</p>}
            <p className="text-xs text-gray-400 truncate max-w-xs">{row.original.shippingAddress}</p>
          </div>
        ),
      },
      {
        id: 'carrierInfo',
        header: 'ĐVVC & Nhân viên giao hàng',
        cell: ({ row }) => (
          <div>
            <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded">
              {row.original.carrierName}
            </span>
            {row.original.shipperName && (
              <p className="text-xs text-gray-500 mt-0.5">Nhân viên giao hàng: {row.original.shipperName} {row.original.shipperPhone ? `(${row.original.shipperPhone})` : ''}</p>
            )}
          </div>
        ),
      },
      {
        id: 'packageSpecs',
        header: 'Trọng lượng / Số kiện',
        cell: ({ row }) => (
          <div className="text-xs text-gray-700 dark:text-gray-300">
            <p><span className="font-bold">{row.original.weightKg}</span> kg</p>
            <p className="text-blue-600 font-semibold">{row.original.packageCount} kiện hàng</p>
          </div>
        ),
      },
      {
        accessorKey: 'codAmount',
        header: 'Thu hộ COD',
        cell: ({ row }) => (
          <div>
            <span className={`font-extrabold text-sm ${row.original.codAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {formatMoney(row.original.codAmount, 'VND')}
            </span>
            {row.original.paidAmount > 0 && (
              <p className="text-[10px] text-gray-400">Đã cọc/thanh toán: {formatMoney(row.original.paidAmount, 'VND')}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
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
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingItem(row.original); }}
              title="Xóa vận đơn"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {row.original.status === 'GIAO_THANH_CONG' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.info(`Chuyển sang tạo Biên bản bàn giao cho vận đơn ${row.original.waybillCode}`);
                  navigate('/sales/delivery-notes', { state: { waybill: row.original } });
                }}
                title="Tạo Biên bản bàn giao hàng hóa"
                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 shadow transition-all"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Biên bản bàn giao
              </button>
            )}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vận đơn giao hàng</h1>
            <span className="text-xs px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold rounded-full">
              Đơn bán (SO) → Vận đơn → Biên bản bàn giao
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý mã vận đơn nội bộ & ĐVVC (GHTK, GHN, Viettel Post...), Shipper, Trọng lượng, Số kiện và Tiền thu hộ COD.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Tạo Vận Đơn Giao Hàng Mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {[
          { key: 'ALL', label: 'Tất cả', count: data.length, color: 'text-gray-700' },
          { key: 'CHO_GIAO_DVVC', label: 'Chờ giao ĐVVC', count: data.filter(d => d.status === 'CHO_GIAO_DVVC').length, color: 'text-blue-600' },
          { key: 'DANG_VAN_CHUYEN', label: 'Đang vận chuyển', count: data.filter(d => d.status === 'DANG_VAN_CHUYEN').length, color: 'text-amber-600' },
          { key: 'GIAO_THANH_CONG', label: 'Giao thành công', count: data.filter(d => d.status === 'GIAO_THANH_CONG').length, color: 'text-emerald-600 font-bold' },
          { key: 'GIAO_THAT_BAI', label: 'Giao thất bại', count: data.filter(d => d.status === 'GIAO_THAT_BAI').length, color: 'text-rose-600' },
          { key: 'DA_CHUYEN_HOAN', label: 'Đã chuyển hoàn', count: data.filter(d => d.status === 'DA_CHUYEN_HOAN').length, color: 'text-gray-600' },
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
              placeholder="Tìm mã vận đơn, mã ĐVVC, mã đơn SO, tên khách..."
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
          title={modalMode === 'create' ? 'TẠO VẬN ĐƠN GIAO HÀNG MỚI' : 'CHỈNH SỬA VẬN ĐƠN GIAO HÀNG'}
          width="max-w-5xl"
        >
          <form onSubmit={handleSave} className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            {/* Codes section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã vận đơn nội bộ *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.waybillCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, waybillCode: e.target.value })}
                  placeholder="VD-2026-XXXX"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã vận đơn của ĐVVC (Tracking Code)
                </label>
                <input
                  type="text"
                  value={editingItem.carrierTrackingCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, carrierTrackingCode: e.target.value })}
                  placeholder="GHTK123456789 (Nếu dùng ĐVVC ngoài)"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-purple-600 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã đơn hàng (SO) *
                </label>
                <select
                  value={editingItem.orderCode || ''}
                  onChange={(e) => {
                    const order = saleOrders.find(o => o.code === e.target.value);
                    const total = order ? order.totalAmount : 1000000;
                    const paid = order ? (order.paymentStatus === 'PAID' ? total : 300000) : 300000;
                    setEditingItem({
                      ...editingItem,
                      orderCode: e.target.value,
                      customerName: order?.customerName || editingItem.customerName,
                      customerPhone: order?.customerPhone || editingItem.customerPhone,
                      shippingAddress: order?.shippingAddress || editingItem.shippingAddress,
                      totalAmount: total,
                      paidAmount: paid,
                      codAmount: Math.max(0, total - paid),
                    });
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                >
                  {saleOrders.map((o) => (
                    <option key={o.id} value={o.code}>
                      {o.code} - {o.customerName} ({formatMoney(o.totalAmount, 'VND')})
                    </option>
                  ))}
                  {saleOrders.length === 0 && <option value="SO-2026-0001">SO-2026-0001 - Đơn hàng mẫu</option>}
                </select>
              </div>
            </div>

            {/* Receiver info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Người nhận hàng *</label>
                <input
                  type="text"
                  required
                  value={editingItem.customerName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                  placeholder="Tên khách nhận..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Số điện thoại nhận hàng</label>
                <input
                  type="text"
                  value={editingItem.customerPhone || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, customerPhone: e.target.value })}
                  placeholder="09xx..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Trạng thái vận chuyển *</label>
                <select
                  value={editingItem.status || 'CHO_GIAO_DVVC'}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                >
                  <option value="CHO_GIAO_DVVC">Chờ giao hàng cho ĐVVC</option>
                  <option value="DANG_VAN_CHUYEN">Đang vận chuyển</option>
                  <option value="GIAO_THANH_CONG">Giao hàng thành công</option>
                  <option value="GIAO_THAT_BAI">Giao hàng thất bại</option>
                  <option value="CHO_CHUYEN_HOAN">Chờ chuyển hoàn</option>
                  <option value="DA_CHUYEN_HOAN">Đã chuyển hoàn</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Địa chỉ giao hàng đầy đủ *</label>
                <input
                  type="text"
                  required
                  value={editingItem.shippingAddress || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, shippingAddress: e.target.value })}
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>
            </div>

            {/* Carrier & Shipper */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border border-blue-200 dark:border-blue-900 bg-blue-50/20 p-4 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Đơn vị vận chuyển *</label>
                <select
                  value={editingItem.carrierName || 'Giao Hàng Tiết Kiệm (GHTK)'}
                  onChange={(e) => setEditingItem({ ...editingItem, carrierName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-blue-600"
                >
                  <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
                  <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                  <option value="Viettel Post">Viettel Post</option>
                  <option value="Shopee Express (SPX)">Shopee Express (SPX)</option>
                  <option value="Vận chuyển nội bộ">Vận chuyển nội bộ (Shipper riêng)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tên nhân viên giao hàng</label>
                <input
                  type="text"
                  value={editingItem.shipperName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, shipperName: e.target.value })}
                  placeholder="Họ tên nhân viên giao hàng..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">SĐT nhân viên giao hàng</label>
                <input
                  type="text"
                  value={editingItem.shipperPhone || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, shipperPhone: e.target.value })}
                  placeholder="09xx..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>
            </div>

            {/* Package Specifications & COD calculation */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border border-amber-200 dark:border-amber-900 bg-amber-50/20 p-4 rounded-xl">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Trọng lượng (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingItem.weightKg || 1}
                  onChange={(e) => setEditingItem({ ...editingItem, weightKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Số kiện hàng</label>
                <input
                  type="number"
                  value={editingItem.packageCount || 1}
                  onChange={(e) => setEditingItem({ ...editingItem, packageCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tổng tiền đơn (VND)</label>
                <input
                  type="number"
                  value={editingItem.totalAmount || 0}
                  onChange={(e) => handleCalculateCod(Number(e.target.value), editingItem.paidAmount || 0)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tiền thu hộ COD (VND)
                </label>
                <input
                  type="number"
                  value={editingItem.codAmount || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, codAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-amber-50 dark:bg-amber-900/30 border border-amber-400 rounded-lg font-extrabold text-amber-700 dark:text-amber-300"
                />
                <p className="text-[10px] text-gray-500 mt-1">COD = Tổng đơn - Đã thanh toán ({formatMoney(editingItem.paidAmount || 0, 'VND')})</p>
              </div>
            </div>

            {/* Dates & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ngày tạo vận đơn *</label>
                <input
                  type="date"
                  required
                  value={editingItem.createdDate || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, createdDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ngày giao dự kiến *</label>
                <input
                  type="date"
                  required
                  value={editingItem.expectedDeliveryDate || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, expectedDeliveryDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú vận tải</label>
                <textarea
                  rows={2}
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="Ghi chú đóng gói, chỉ dẫn giao hàng..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>
            </div>

            {/* Footer */}
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
                Lưu Vận Đơn
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={`CHI TIẾT VẬN ĐƠN GIAO HÀNG: ${selected.waybillCode}`}
          width="max-w-4xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Mã SO</span>
                <span className="font-bold">{selected.orderCode}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">ĐVVC</span>
                <span className="font-bold text-blue-600">{selected.carrierName}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Mã ĐVVC</span>
                <span className="font-mono text-purple-600 font-bold">{selected.carrierTrackingCode || 'Nội bộ'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Thu hộ COD</span>
                <span className="font-extrabold text-amber-600">{formatMoney(selected.codAmount, 'VND')}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p><strong>Người nhận:</strong> {selected.customerName} ({selected.customerPhone || 'N/A'})</p>
              <p><strong>Địa chỉ:</strong> {selected.shippingAddress}</p>
              <p><strong>Nhân viên giao hàng:</strong> {selected.shipperName || 'N/A'} {selected.shipperPhone ? `(${selected.shipperPhone})` : ''}</p>
              <p><strong>Thông số:</strong> {selected.weightKg} kg | {selected.packageCount} kiện hàng</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-xl">Đóng</button>
              {selected.status === 'GIAO_THANH_CONG' && (
                <button
                  onClick={() => {
                    navigate('/sales/delivery-notes', { state: { waybill: selected } });
                  }}
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1 shadow"
                >
                  <ArrowRight className="w-4 h-4" /> [Tạo Biên bản bàn giao]
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDeleteModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa vận đơn"
        description={`Bạn có chắc chắn muốn xóa vận đơn "${deletingItem?.waybillCode}" (Đơn hàng: ${deletingItem?.orderCode})?`}
      />
    </div>
  );
}
