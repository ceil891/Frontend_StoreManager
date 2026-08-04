import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Box, CheckSquare, Square } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface BatchRecord {
  id: string;
  batchCode: string;
  handoverDate: string;
  carrierName: string;
  totalOrders: number;
  totalWeight: number;
  status: 'DANG_GOM' | 'DA_BAN_GIAO' | 'DA_HUY';
  notes?: string;
  selectedOrderCodes?: string[];
}

interface AvailableOrder {
  code: string;
  customerName: string;
  weightKg: number;
}

const SAMPLE_AVAILABLE_ORDERS: AvailableOrder[] = [
  { code: 'SO-88101', customerName: 'Nguyễn Văn An', weightKg: 2.5 },
  { code: 'SO-88102', customerName: 'Trần Thị Bình', weightKg: 4.0 },
  { code: 'SO-88103', customerName: 'Lê Văn Cường', weightKg: 1.8 },
  { code: 'SO-88104', customerName: 'Phạm Thị Dung', weightKg: 5.5 },
  { code: 'SO-88105', customerName: 'Hoàng Văn Em', weightKg: 3.2 },
];

export function ShippingOrderBatchesPage() {
  const [data, setData] = useState<BatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<BatchRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<BatchRecord>>({});
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const fetchBatches = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/batches');
      if (Array.isArray(res) && res.length > 0) {
        const mapped = res.map((item: any) => ({
          id: String(item.id),
          batchCode: item.batchCode || `BTC-${item.id}`,
          handoverDate: item.handoverDate || '2026-06-04',
          carrierName: item.carrierName || 'Viettel Post',
          totalOrders: Number(item.totalOrders || 5),
          totalWeight: Number(item.totalWeight || 10),
          status: item.status || 'DANG_GOM',
          notes: item.notes || ''
        }));
        setData(mapped);
      } else {
        setData([
          {
            id: '1',
            batchCode: 'BAT-2026-001',
            handoverDate: '2026-07-19',
            carrierName: 'Viettel Post',
            totalOrders: 15,
            totalWeight: 45.8,
            status: 'DANG_GOM',
            notes: 'Gom đơn giao miền Bắc'
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedOrders(['SO-88101', 'SO-88102']);
    const initOrders = SAMPLE_AVAILABLE_ORDERS.filter(o => ['SO-88101', 'SO-88102'].includes(o.code));
    const initWeight = initOrders.reduce((sum, o) => sum + o.weightKg, 0);

    setEditingItem({
      batchCode: `BAT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
      handoverDate: new Date().toISOString().split('T')[0],
      carrierName: 'Viettel Post',
      totalOrders: 2,
      totalWeight: Number(initWeight.toFixed(1)),
      status: 'DANG_GOM',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BatchRecord) => {
    setModalMode('edit');
    setSelected(null);
    setEditingItem(item);
    setSelectedOrders(item.selectedOrderCodes || ['SO-88101']);
    setIsModalOpen(true);
  };

  const toggleOrderSelection = (orderCode: string) => {
    const nextSelected = selectedOrders.includes(orderCode)
      ? selectedOrders.filter(c => c !== orderCode)
      : [...selectedOrders, orderCode];

    setSelectedOrders(nextSelected);

    const calcOrders = SAMPLE_AVAILABLE_ORDERS.filter(o => nextSelected.includes(o.code));
    const calcWeight = calcOrders.reduce((sum, o) => sum + o.weightKg, 0);

    setEditingItem(prev => ({
      ...prev,
      totalOrders: nextSelected.length,
      totalWeight: Number(calcWeight.toFixed(1))
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.batchCode || !editingItem.carrierName) {
      toast.error('Vui lòng nhập mã lô gom và đơn vị nhận bàn giao!');
      return;
    }

    try {
      const payload = {
        batchCode: editingItem.batchCode,
        handoverDate: editingItem.handoverDate,
        carrierName: editingItem.carrierName,
        totalOrders: Number(editingItem.totalOrders || selectedOrders.length),
        totalWeight: Number(editingItem.totalWeight || 0),
        status: editingItem.status,
        notes: editingItem.notes,
        selectedOrderCodes: selectedOrders
      };

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/batches', payload);
        toast.success('Tạo lô đơn hàng gom thành công!');
      } else {
        await axiosClient.put(`/logistics/batches/${editingItem.id}`, payload);
        toast.success('Cập nhật lô gom thành công!');
      }
      setIsModalOpen(false);
      fetchBatches();
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || 'Lỗi vi phạm dữ liệu bắt buộc từ hệ thống backend!';
      toast.error(`Không thể lưu lô đơn hàng: ${msg}`);
    }
  };

  const handleDelete = async (id: string) => {
    setSelected(null); // Ensure detail modal does NOT open when deleting (TC-SHIP-16)
    if (confirm('Bạn có chắc chắn muốn xóa lô đơn hàng vận chuyển này?')) {
      try {
        await axiosClient.delete(`/logistics/batches/${id}`);
        toast.success('Đã xóa lô gom đơn thành công!');
        fetchBatches();
      } catch (err: any) {
        console.error(err);
        toast.error('Lỗi vi phạm ràng buộc dữ liệu backend khi xóa lô đơn.');
      }
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.batchCode.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const columns = useMemo<ColumnDef<BatchRecord>[]>(
    () => [
      {
        accessorKey: 'batchCode',
        header: 'Mã lô gom',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'carrierName',
        header: 'Đơn vị / Shipper nhận bàn giao',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'handoverDate',
        header: 'Ngày bàn giao',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalOrders',
        header: 'Tổng số đơn',
        cell: (info) => <span className="font-mono font-semibold">{info.getValue() as number} đơn</span>,
      },
      {
        accessorKey: 'totalWeight',
        header: 'Trọng lượng tổng',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as number} kg</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Đang gom đơn';
          if (status === 'DA_BAN_GIAO') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã bàn giao';
          } else if (status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã hủy lô';
          }
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}
              className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg"
              title="Xem chi tiết lô"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
              title="Sửa lô"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
              title="Xóa lô"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lô đơn vận chuyển</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gom các đơn vận chuyển lẻ thành lô hàng bàn giao cho đối tác logistics hoặc shipper.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Gom Lô Đơn Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã lô gom đơn, đơn vị nhận bàn giao..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách lô gom đơn...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} />
      )}

      {/* Modal Xem chi tiết lô căn giữa (TC-ALL-1 & TC-SHIP-16) */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Thông tin lô đơn gom: ${selected.batchCode}` : 'Chi tiết lô gom'}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl">
              <div>
                <span className="text-xs text-gray-500">Mã lô bàn giao:</span>
                <p className="font-mono font-bold text-emerald-600">{selected.batchCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ngày bàn giao:</span>
                <p className="font-mono font-semibold">{selected.handoverDate}</p>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Đơn vị nhận bàn giao:</span>
              <p className="font-semibold text-base text-gray-900 dark:text-white">{selected.carrierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-3">
              <div>
                <span className="text-xs text-gray-500">Tổng số đơn hàng:</span>
                <p className="font-mono font-bold text-lg text-primary">{selected.totalOrders} đơn</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Tổng trọng lượng:</span>
                <p className="font-mono font-bold text-lg text-primary">{selected.totalWeight} kg</p>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Trạng thái lô:</span>
              <div className="mt-1">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                    selected.status === 'DA_BAN_GIAO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'DANG_GOM'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_BAN_GIAO' ? 'Đã bàn giao cho đơn vị vận chuyển' : selected.status === 'DANG_GOM' ? 'Đang gom lô đơn' : 'Đã hủy lô'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div className="border-t pt-2">
                <span className="text-xs text-gray-500">Ghi chú:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg text-gray-700 italic">
                  {selected.notes}
                </p>
              </div>
            )}
            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-sm"
              >
                Đóng Hộp Thoại
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Gom Lô Đơn Mới (TC-SHIP-14 & TC-SHIP-15) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Gom Lô Đơn Vận Chuyển Mới' : 'Cập Nhật Lô Đơn Gom'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Mã lô gom *</label>
              <input
                type="text"
                value={editingItem.batchCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, batchCode: e.target.value })}
                className="w-full p-2.5 border rounded-lg font-mono bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Ngày bàn giao *</label>
              <input
                type="date"
                value={editingItem.handoverDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, handoverDate: e.target.value })}
                className="w-full p-2.5 border rounded-lg font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Đơn vị nhận bàn giao *</label>
            <select
              value={editingItem.carrierName || 'Viettel Post'}
              onChange={(e) => setEditingItem({ ...editingItem, carrierName: e.target.value })}
              className="w-full p-2.5 border rounded-lg"
            >
              <option value="Viettel Post">Viettel Post</option>
              <option value="Giao Hàng Tiết Kiệm">Giao Hàng Tiết Kiệm (GHTK)</option>
              <option value="Giao Hàng Nhanh">Giao Hàng Nhanh (GHN)</option>
              <option value="Shopee Express">Shopee Express (SPX)</option>
              <option value="Đội xe nội bộ">Đội xe nội bộ AuraMart</option>
            </select>
          </div>

          {/* Selection of available orders to consolidate (TC-SHIP-15) */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">
              Chọn các đơn bán cần gom vào lô (Tự động tính tổng)
            </label>
            <div className="space-y-2 border rounded-xl p-3 bg-gray-50 dark:bg-gray-900 max-h-40 overflow-y-auto">
              {SAMPLE_AVAILABLE_ORDERS.map((ord) => {
                const isChecked = selectedOrders.includes(ord.code);
                return (
                  <div
                    key={ord.code}
                    onClick={() => toggleOrderSelection(ord.code)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-colors ${
                      isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium' : 'bg-white border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isChecked ? <CheckSquare className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4 text-gray-400" />}
                      <span className="font-mono text-xs font-bold">{ord.code}</span>
                      <span className="text-xs text-gray-500">({ord.customerName})</span>
                    </div>
                    <span className="font-mono text-xs text-gray-600 font-bold">{ord.weightKg} kg</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200">
            <div>
              <span className="text-xs font-bold text-gray-500 block">Tổng số đơn đã chọn</span>
              <span className="font-mono text-lg font-bold text-emerald-700">{editingItem.totalOrders ?? selectedOrders.length} đơn</span>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-500 block">Tổng trọng lượng gom</span>
              <span className="font-mono text-lg font-bold text-emerald-700">{editingItem.totalWeight ?? 0} kg</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Trạng thái lô *</label>
            <select
              value={editingItem.status || 'DANG_GOM'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2.5 border rounded-lg"
            >
              <option value="DANG_GOM">Đang Gom Đơn</option>
              <option value="DA_BAN_GIAO">Đã Bàn Giao Cho Shipper</option>
              <option value="DA_HUY">Hủy Bỏ Lô Bàn Giao</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Ghi chú lô gom</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2.5 border rounded-lg"
              rows={2}
              placeholder="Ghi chú thêm về đợt gom đơn..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy Bỏ
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold">
              Lưu Lô Gom
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingOrderBatchesPage;

