import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ShieldCheck, Link2, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface CarrierRecord {
  id: string;
  carrierCode: string;
  carrierName: string;
  phone: string;
  address: string;
  apiStatus: 'CONNECTED' | 'DISCONNECTED' | 'SUSPENDED';
  serviceTypes: string;
  notes?: string;
}

export function ShippingCarriersPage() {
  const [data, setData] = useState<CarrierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CarrierRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<CarrierRecord>>({});

  const fetchCarriers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/carriers');
      if (Array.isArray(res)) {
        const mapped = res.map((item: any) => ({
          id: String(item.id),
          carrierCode: item.carrierCode || `CR-${item.id}`,
          carrierName: item.carrierName || 'Hãng vận chuyển',
          phone: '1900 1234',
          address: 'Hà Nội, Việt Nam',
          apiStatus: item.isActive ? 'CONNECTED' : 'DISCONNECTED',
          serviceTypes: 'Standard, Fast',
          notes: item.note || ''
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách hãng vận chuyển.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      carrierCode: `CR-${Date.now().toString().slice(-6)}`,
      carrierName: '',
      phone: '1900 1234',
      address: 'Hà Nội, Việt Nam',
      apiStatus: 'DISCONNECTED',
      serviceTypes: 'Standard, Fast',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CarrierRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.carrierCode || !editingItem.carrierName) return;

    try {
      const payload = {
        carrierCode: editingItem.carrierCode,
        carrierName: editingItem.carrierName,
        isActive: editingItem.apiStatus === 'CONNECTED',
        note: editingItem.notes
      };

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/carriers', payload);
        toast.success('Thêm hãng vận chuyển mới thành công!');
      } else {
        await axiosClient.put(`/logistics/carriers/${editingItem.id}`, payload);
        toast.success('Cập nhật hãng vận chuyển thành công!');
      }
      setIsModalOpen(false);
      fetchCarriers();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu hãng vận chuyển.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa đối tác vận chuyển này?')) {
      try {
        await axiosClient.delete(`/logistics/carriers/${id}`);
        toast.success('Đã xóa đối tác vận chuyển thành công!');
        fetchCarriers();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa đối tác vận chuyển.');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.carrierCode.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q) ||
        d.phone.includes(q)
    );
  }, [search, data]);

  const columns = useMemo<ColumnDef<CarrierRecord>[]>(
    () => [
      {
        accessorKey: 'carrierCode',
        header: 'Mã đối tác',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Đơn vị vận chuyển',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'phone',
        header: 'Tổng đài hỗ trợ',
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'serviceTypes',
        header: 'Dịch vụ cung cấp',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'apiStatus',
        header: 'Đồng bộ API',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-gray-100 text-gray-800';
          let label = 'Chưa kết nối';
          if (status === 'CONNECTED') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã kết nối';
          } else if (status === 'SUSPENDED') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Tạm khóa';
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
              title="Cấu hình API / sửa"
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
          <h1 className="text-2xl font-bold">Đối tác vận chuyển (carriers)</h1>
          <p className="text-sm text-gray-500">
            Quản lý danh sách các đơn vị chuyển phát liên kết ngoài, theo dõi trạng thái tích hợp API tạo đơn tự động.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Thêm Đối Tác
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã đối tác, tên đơn vị vận chuyển..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách hãng vận chuyển...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết đối tác: ${selected?.carrierName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã đơn vị:</span>
                <p className="font-mono font-semibold">{selected.carrierCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Tổng đài hỗ trợ:</span>
                <p className="font-mono">{selected.phone}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên đối tác vận chuyển:</span>
              <p className="font-semibold">{selected.carrierName}</p>
            </div>
            <div>
              <span className="text-gray-500">Địa chỉ Văn Phòng / trụ sở:</span>
              <p className="text-gray-700 dark:text-gray-300">{selected.address}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Các dịch vụ:</span>
                <p>{selected.serviceTypes}</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng thái kết nối API:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.apiStatus === 'CONNECTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selected.apiStatus === 'DISCONNECTED'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.apiStatus === 'CONNECTED'
                      ? 'Đã kết nối API'
                      : selected.apiStatus === 'DISCONNECTED'
                      ? 'Chưa kết nối'
                      : 'Đang tạm khóa'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú vận hành:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm đơn vị vận chuyển đối tác' : 'Sửa thông tin đơn vị'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã đối tác *</label>
              <input
                type="text"
                value={editingItem.carrierCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, carrierCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="CR-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng đài hỗ trợ *</label>
              <input
                type="text"
                value={editingItem.phone || ''}
                onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="1900XXXX"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên đối tác vận chuyển *</label>
            <input
              type="text"
              value={editingItem.carrierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, carrierName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên công ty vận chuyển"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Địa chỉ trụ sở *</label>
            <input
              type="text"
              value={editingItem.address || ''}
              onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Địa chỉ công ty"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dịch vụ cung cấp *</label>
              <input
                type="text"
                value={editingItem.serviceTypes || ''}
                onChange={(e) => setEditingItem({ ...editingItem, serviceTypes: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Nhanh, Tiết kiệm, Hỏa tốc"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đồng bộ API</label>
              <select
                value={editingItem.apiStatus || 'DISCONNECTED'}
                onChange={(e) => setEditingItem({ ...editingItem, apiStatus: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="DISCONNECTED">Chưa Kết Nối (Gọi thủ công)</option>
                <option value="CONNECTED">Đã Kết Nối (Tự động đồng bộ)</option>
                <option value="SUSPENDED">Tạm Dừng Đồng Bộ (Khóa kết nối)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết tài khoản API kết nối hoặc thông tin liên hệ bưu cục..."
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
              Lưu đối tác
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
