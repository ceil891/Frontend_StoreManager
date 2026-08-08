import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Truck, CheckCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface DeliveryRecord {
  id: string;
  waybillCode: string;
  orderCode: string;
  customerName: string;
  shippingAddress: string;
  carrierName: string;
  createdDate: string;
  expectedDeliveryDate: string;
  status: 'CHO_GIAO' | 'DANG_GIAO' | 'DA_GIAO' | 'THAT_BAI';
  notes?: string;
}

export function DeliveryListsPage() {
  const [data, setData] = useState<DeliveryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<DeliveryRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<DeliveryRecord>>({});

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/trips');
      const mapped = (Array.isArray(res) ? res : []).map((t: any) => ({
        id: String(t.id),
        waybillCode: t.tripCode || '',
        orderCode: t.order?.orderCode || t.tripCode,
        customerName: t.receiverName || 'Khách lẻ',
        shippingAddress: t.deliveryAddress || '',
        carrierName: t.shipper?.name || 'Vận chuyển nội bộ',
        createdDate: t.startTime ? t.startTime.substring(0, 10) : new Date().toISOString().substring(0, 10),
        expectedDeliveryDate: t.endTime ? t.endTime.substring(0, 10) : new Date().toISOString().substring(0, 10),
        status: (t.status === 'PENDING' ? 'CHO_GIAO' : t.status === 'DELIVERING' ? 'DANG_GIAO' : t.status === 'SUCCESS' ? 'DA_GIAO' : 'THAT_BAI') as DeliveryRecord['status'],
        notes: t.deliveryNote || '',
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
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.waybillCode.toLowerCase().includes(q) ||
        d.orderCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      waybillCode: `WB-2026-${Date.now().toString().slice(-4)}`,
      orderCode: '',
      customerName: '',
      shippingAddress: '',
      carrierName: '',
      createdDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      status: 'CHO_GIAO',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: DeliveryRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.waybillCode || !editingItem.orderCode || !editingItem.customerName) return;

    try {
      const apiStatus = editingItem.status === 'CHO_GIAO' ? 'PENDING' : editingItem.status === 'DANG_GIAO' ? 'DELIVERING' : editingItem.status === 'DA_GIAO' ? 'SUCCESS' : 'FAILED';
      const payload = {
        tripCode: editingItem.waybillCode,
        status: apiStatus,
        deliveryAddress: editingItem.shippingAddress,
        receiverName: editingItem.customerName,
        receiverPhone: '0901234567',
        deliveryNote: editingItem.notes || '',
      };

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/trips', payload);
        toast.success('Thêm vận đơn thành công!');
      } else {
        await axiosClient.put(`/logistics/trips/${editingItem.id}`, payload);
        toast.success('Cập nhật vận đơn thành công!');
      }
      setIsModalOpen(false);
      fetchTrips();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu thông tin vận đơn.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thông tin vận đơn này?')) {
      try {
        await axiosClient.delete(`/logistics/trips/${id}`);
        toast.success('Đã xóa vận đơn thành công!');
        fetchTrips();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa vận đơn.');
      }
    }
  };

  const columns = useMemo<ColumnDef<DeliveryRecord>[]>(
    () => [
      {
        accessorKey: 'waybillCode',
        header: 'Mã vận đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn SO',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Đơn vị vận chuyển',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'expectedDeliveryDate',
        header: 'Ngày giao dự kiến',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-gray-100 text-gray-800';
          let label = 'Chờ giao';
          if (status === 'DANG_GIAO') {
            badgeClass = 'bg-blue-100 text-blue-800';
            label = 'Đang giao';
          } else if (status === 'DA_GIAO') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã giao';
          } else if (status === 'THAT_BAI') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Giao thất bại';
          }
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
              title="Xóa"
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Danh sách vận đơn giao hàng</h1>
          <p className="text-sm text-gray-500">
            Theo dõi quá trình giao nhận hàng cho khách hàng, liên kết thông tin đối tác vận chuyển và trạng thái giao hàng thực tế.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Vận Đơn Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã vận đơn, mã đơn hàng, tên khách hàng, đối tác vận chuyển..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách vận đơn...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Vận Đơn: ${selected?.waybillCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã vận đơn:</span>
                <p className="font-mono font-semibold">{selected.waybillCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã đơn SO:</span>
                <p className="font-mono font-semibold">{selected.orderCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div>
              <span className="text-gray-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" /> Địa Chỉ Nhận Hàng:
              </span>
              <p className="font-medium text-gray-700 dark:text-gray-300">{selected.shippingAddress}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Truck className="w-4 h-4 text-gray-400" /> Đơn Vị Vận Chuyển:
                </span>
                <p>{selected.carrierName}</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng thái giao hàng:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'DA_GIAO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selected.status === 'DANG_GIAO'
                        ? 'bg-blue-100 text-blue-800'
                        : selected.status === 'THAT_BAI'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selected.status === 'DA_GIAO'
                      ? 'Đã giao'
                      : selected.status === 'DANG_GIAO'
                      ? 'Đang giao'
                      : selected.status === 'THAT_BAI'
                      ? 'Giao thất bại'
                      : 'Chờ giao'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày tạo:</span>
                <p className="font-mono">{selected.createdDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn giao hàng:</span>
                <p className="font-mono">{selected.expectedDeliveryDate}</p>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú hành trình:</span>
                <p className="mt-1 font-mono text-gray-800 dark:text-gray-200">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '🚚 Tạo vận đơn giao hàng mới' : '⚙️ Cấu hình thông tin vận đơn'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã vận đơn *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, waybillCode: `WB-${Date.now().toString().slice(-6)}` })}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    ⚡ Sinh mã
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingItem.waybillCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, waybillCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã đơn hàng (SO) *</label>
              <input
                type="text"
                value={editingItem.orderCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, orderCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="SO-2026-XXX"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên người nhận *</label>
              <input
                type="text"
                value={editingItem.customerName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Họ tên người nhận"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Số điện thoại nhận hàng</label>
              <input
                type="text"
                value={(editingItem as any).recipientPhone || ''}
                onChange={(e) => setEditingItem({ ...editingItem, recipientPhone: e.target.value } as any)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="0912345678"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Địa chỉ giao hàng đầy đủ *</label>
            <input
              type="text"
              value={editingItem.shippingAddress || ''}
              onChange={(e) => setEditingItem({ ...editingItem, shippingAddress: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/TP..."
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Đơn vị vận chuyển *</label>
              <select
                value={editingItem.carrierName || 'Giao Hàng Tiết Kiệm (GHTK)'}
                onChange={(e) => setEditingItem({ ...editingItem, carrierName: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
                <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                <option value="Viettel Post">Viettel Post</option>
                <option value="Shopee Express (SPX)">Shopee Express (SPX)</option>
                <option value="Vận chuyển nội bộ">Vận chuyển nội bộ (Shipper riêng)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trọng lượng (kg)</label>
              <input
                type="number"
                step="0.1"
                value={(editingItem as any).weightKg || 1}
                onChange={(e) => setEditingItem({ ...editingItem, weightKg: Number(e.target.value) } as any)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tiền thu hộ COD (VND)</label>
              <input
                type="number"
                value={(editingItem as any).codAmount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, codAmount: Number(e.target.value) } as any)}
                className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded font-mono bg-white dark:bg-gray-900 text-emerald-600 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày tạo vận đơn *</label>
              <input
                type="date"
                value={editingItem.createdDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, createdDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày giao dự kiến *</label>
              <input
                type="date"
                value={editingItem.expectedDeliveryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expectedDeliveryDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái vận chuyển *</label>
            <select
              value={editingItem.status || 'CHO_GIAO'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="CHO_GIAO">📦 Chờ giao hàng cho ĐVVC</option>
              <option value="DANG_GIAO">🚚 Đang vận chuyển trên đường</option>
              <option value="DA_GIAO">🟢 Giao hàng thành công</option>
              <option value="THAT_BAI">🔴 Giao hàng thất bại / Chờ chuyển hoàn</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú vận tải</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Yêu cầu giao giờ hành chính, cho xem hàng trước..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Lưu vận đơn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
