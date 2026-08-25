import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Truck, Clock, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface ShippingMethodRecord {
  id: string;
  methodCode: string;
  methodName: string;
  description: string;
  estimatedMin: number;
  estimatedMax: number;
  timeUnit: 'HOURS' | 'DAYS';
  fulfilledBy: 'INTERNAL' | 'GHN' | 'GHTK' | 'VIETTELPOST' | 'SHOPEE_EXPRESS';
  baseWeightKg: number;
  surchargePerKg: number;
  freeshippingThreshold: number;
  allowCod: boolean;
  maxWeightKg: number;
  baseFee: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
}

const generateShippingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SHIP-${randomPart}`;
};

export function ShippingMethodsPage() {
  const [data, setData] = useState<ShippingMethodRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ShippingMethodRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingMethodRecord>>({});

  const fetchMethods = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/methods');
      if (Array.isArray(res)) {
        const mapped = res.map((item: any) => ({
          id: String(item.id),
          methodCode: item.methodCode || `SM-${item.id}`,
          methodName: item.methodName || 'Phương thức giao hàng',
          description: item.description || '',
          estimatedMin: Number(item.estimatedMin || 1),
          estimatedMax: Number(item.estimatedMax || 3),
          timeUnit: item.timeUnit || 'DAYS',
          fulfilledBy: item.fulfilledBy || 'INTERNAL',
          baseWeightKg: Number(item.baseWeightKg || 1),
          surchargePerKg: Number(item.surchargePerKg || 0),
          freeshippingThreshold: Number(item.freeshippingThreshold || 0),
          allowCod: item.allowCod !== undefined ? item.allowCod : true,
          maxWeightKg: Number(item.maxWeightKg || 10),
          baseFee: Number(item.baseFee || 0),
          status: item.status || 'ACTIVE',
          notes: item.notes || ''
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách hình thức giao hàng.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      methodCode: generateShippingCode(),
      methodName: '',
      description: '',
      estimatedMin: 1,
      estimatedMax: 3,
      timeUnit: 'DAYS',
      fulfilledBy: 'INTERNAL',
      baseWeightKg: 1,
      surchargePerKg: 0,
      freeshippingThreshold: 0,
      allowCod: true,
      maxWeightKg: 10,
      baseFee: 30000,
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShippingMethodRecord) => {
    setSelected(null);
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.methodCode || !editingItem.methodName) return;

    try {
      const payload = {
        methodCode: editingItem.methodCode,
        methodName: editingItem.methodName,
        description: editingItem.description,
        estimatedMin: Number(editingItem.estimatedMin || 0),
        estimatedMax: Number(editingItem.estimatedMax || 0),
        timeUnit: editingItem.timeUnit,
        fulfilledBy: editingItem.fulfilledBy,
        baseWeightKg: Number(editingItem.baseWeightKg || 0),
        surchargePerKg: Number(editingItem.surchargePerKg || 0),
        freeshippingThreshold: Number(editingItem.freeshippingThreshold || 0),
        allowCod: editingItem.allowCod,
        maxWeightKg: Number(editingItem.maxWeightKg || 0),
        baseFee: Number(editingItem.baseFee || 0),
        status: editingItem.status,
        notes: editingItem.notes
      };

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/methods', payload);
        toast.success('Thêm hình thức vận chuyển mới thành công!');
      } else {
        await axiosClient.put(`/logistics/methods/${editingItem.id}`, payload);
        toast.success('Cập nhật hình thức vận chuyển thành công!');
      }
      setIsModalOpen(false);
      fetchMethods();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu hình thức vận chuyển.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phương thức vận chuyển này?')) {
      try {
        await axiosClient.delete(`/logistics/methods/${id}`);
        toast.success('Đã xóa hình thức vận chuyển thành công!');
        fetchMethods();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa hình thức vận chuyển.');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.methodCode.toLowerCase().includes(q) ||
        d.methodName.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
    );
  }, [search, data]);

  const formatCurrency = (val: number) => {
    return `${Number(val || 0).toLocaleString('vi-VN')} đ`;
  };

  const columns = useMemo<ColumnDef<ShippingMethodRecord>[]>(
    () => [
      {
        accessorKey: 'methodCode',
        header: 'Mã phương thức',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'methodName',
        header: 'Tên phương thức',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'estimatedTime',
        header: 'Hạn giao (dự kiến)',
        cell: (info) => {
          const row = info.row.original;
          const unit = row.timeUnit === 'DAYS' ? 'ngày' : 'giờ';
          return <span className="font-mono">{row.estimatedMin} - {row.estimatedMax} {unit}</span>;
        },
      },
      {
        accessorKey: 'baseFee',
        header: 'Phí cơ bản',
        cell: (info) => <span className="font-mono text-primary font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
          const label = status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa';
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phương thức vận chuyển</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý các hình thức vận chuyển, phí giao hàng cơ bản và thời gian giao hàng dự kiến phục vụ lên đơn bán hàng
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm mới phương thức
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã phương thức, tên phương thức..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách phương thức giao hàng...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết phương thức: ${selected?.methodName || ''}`}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Mã hình thức</span>
                <p className="font-mono font-bold text-primary">{selected.methodCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Phí giao cơ bản</span>
                <p className="font-mono font-bold text-primary">{formatCurrency(selected.baseFee)}</p>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Tên hình thức vận chuyển</span>
              <p className="font-semibold text-base text-gray-900 dark:text-white">{selected.methodName}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Mô tả dịch vụ</span>
              <p className="text-gray-700 dark:text-gray-300">{selected.description || 'Chưa cập nhật'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" /> Hạn giao dự kiến
                </span>
                <p className="font-mono font-semibold">{selected.estimatedMin} - {selected.estimatedMax} {selected.timeUnit === 'DAYS' ? 'ngày' : 'giờ'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Trạng thái</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Đơn vị thực hiện</span>
                <p className="font-semibold">{selected.fulfilledBy}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Miễn phí vận chuyển từ đơn</span>
                <p className="font-semibold">{selected.freeshippingThreshold ? formatCurrency(selected.freeshippingThreshold) : 'Không áp dụng'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Trọng lượng cơ bản</span>
                <p className="font-semibold">{selected.baseWeightKg} kg</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Phí cộng thêm/kg</span>
                <p className="font-semibold">{formatCurrency(selected.surchargePerKg)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Trọng lượng tối đa</span>
                <p className="font-semibold">{selected.maxWeightKg} kg</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Cho phép COD</span>
                <p className="font-semibold">{selected.allowCod ? 'Có' : 'Không'}</p>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-xs text-gray-500">Ghi chú thêm</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                  {selected.notes}
                </p>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới phương thức vận chuyển' : 'Cập nhật phương thức vận chuyển'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phương thức *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingItem.methodCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, methodCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="SHIP-XXXX"
                  required
                  disabled={modalMode === 'edit'}
                />
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, methodCode: generateShippingCode() })}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-200 dark:bg-gray-800 whitespace-nowrap"
                  >
                    Tạo mã
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên hình thức *</label>
              <input
                type="text"
                value={editingItem.methodName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, methodName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                placeholder="Tên phương thức"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả dịch vụ</label>
            <input
              type="text"
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              placeholder="Chi tiết cách thức giao hàng"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian (từ) *</label>
              <input
                type="number"
                value={editingItem.estimatedMin || 0}
                onChange={(e) => setEditingItem({ ...editingItem, estimatedMin: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian (đến) *</label>
              <input
                type="number"
                value={editingItem.estimatedMax || 0}
                onChange={(e) => setEditingItem({ ...editingItem, estimatedMax: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                required
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị *</label>
              <select
                value={editingItem.timeUnit || 'DAYS'}
                onChange={(e) => setEditingItem({ ...editingItem, timeUnit: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="HOURS">Giờ</option>
                <option value="DAYS">Ngày</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị thực hiện *</label>
              <select
                value={editingItem.fulfilledBy || 'INTERNAL'}
                onChange={(e) => setEditingItem({ ...editingItem, fulfilledBy: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="INTERNAL">Đội nhà / Tự giao</option>
                <option value="GHN">Giao Hàng Nhanh</option>
                <option value="GHTK">Giao Hàng Tiết Kiệm</option>
                <option value="VIETTELPOST">Viettel Post</option>
                <option value="SHOPEE_EXPRESS">Shopee Express</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phí giao hàng cơ bản (VNĐ) *</label>
              <input
                type="number"
                value={editingItem.baseFee || 0}
                onChange={(e) => setEditingItem({ ...editingItem, baseFee: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trọng lượng cơ bản (kg)</label>
              <input
                type="number"
                value={editingItem.baseWeightKg || 0}
                onChange={(e) => setEditingItem({ ...editingItem, baseWeightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phí cộng thêm/kg (VNĐ)</label>
              <input
                type="number"
                value={editingItem.surchargePerKg || 0}
                onChange={(e) => setEditingItem({ ...editingItem, surchargePerKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                min={0}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trọng lượng tối đa (kg)</label>
              <input
                type="number"
                value={editingItem.maxWeightKg || 0}
                onChange={(e) => setEditingItem({ ...editingItem, maxWeightKg: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                min={0}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Miễn phí vận chuyển từ đơn (VNĐ)</label>
              <input
                type="number"
                value={editingItem.freeshippingThreshold || 0}
                onChange={(e) => setEditingItem({ ...editingItem, freeshippingThreshold: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm"
                min={0}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allowCod"
              checked={editingItem.allowCod !== false}
              onChange={(e) => setEditingItem({ ...editingItem, allowCod: e.target.checked })}
              className="w-4 h-4 text-primary rounded border-gray-300"
            />
            <label htmlFor="allowCod" className="text-sm font-medium text-gray-700 dark:text-gray-300">Cho phép thanh toán COD</label>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'ACTIVE'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="INACTIVE">Tạm khóa</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              rows={2}
              placeholder="Ghi chú thêm..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium"
            >
              Hủy bỏ
            </button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm">
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingMethodsPage;
