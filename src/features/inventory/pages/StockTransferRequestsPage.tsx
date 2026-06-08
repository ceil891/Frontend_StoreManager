import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ArrowRightLeft, Calendar, User, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface TransferRequestItem {
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
}

interface StockTransferRequestRecord {
  id: string;
  requestCode: string;
  sourceWarehouse: string; // Kho xuất đi
  destinationWarehouse: string; // Kho nhận về
  requestDate: string; // Ngày đề xuất
  proposedBy: string; // Người yêu cầu
  status: 'CHỜ_PHÊ_DUYỆT' | 'ĐÃ_PHÊ_DUYỆT' | 'BỊ_TỪ_CHỐI';
  reason?: string;
  items: TransferRequestItem[];
}

const MOCK_REQUESTS: StockTransferRequestRecord[] = [
  {
    id: '1',
    requestCode: 'STR-2026-001',
    sourceWarehouse: 'Tổng kho Thủ Đức',
    destinationWarehouse: 'Chi nhánh Quận 1',
    requestDate: '2026-06-04',
    proposedBy: 'Lê Hoàng Hải (Quản lý CN Q1)',
    status: 'CHỜ_PHÊ_DUYỆT',
    reason: 'Bổ sung sản phẩm chuẩn bị cho chương trình khuyến mãi hè.',
    items: [
      { productName: 'Nước ngọt Coca-Cola lon 320ml', sku: 'COCA-320', quantity: 200, unit: 'Thùng' },
      { productName: 'Bột giặt Omo Matic 3.8kg', sku: 'OMO-3.8', quantity: 50, unit: 'Túi' },
    ],
  },
  {
    id: '2',
    requestCode: 'STR-2026-002',
    sourceWarehouse: 'Tổng kho Thủ Đức',
    destinationWarehouse: 'Chi nhánh Bình Thạnh',
    requestDate: '2026-06-02',
    proposedBy: 'Nguyễn Bích Vy (Quản lý CN BT)',
    status: 'ĐÃ_PHÊ_DUYỆT',
    reason: 'Hết hàng dự trữ trên kệ bán lẻ.',
    items: [
      { productName: 'Sữa tươi Vinamilk ít đường 1L', sku: 'VNM-MILK-1L', quantity: 150, unit: 'Hộp' },
    ],
  },
  {
    id: '3',
    requestCode: 'STR-2026-003',
    sourceWarehouse: 'Chi nhánh Quận 1',
    destinationWarehouse: 'Chi nhánh Bình Thạnh',
    requestDate: '2026-05-30',
    proposedBy: 'Trần Minh Tâm (Điều phối viên)',
    status: 'BỊ_TỪ_CHỐI',
    reason: 'Kho xuất cũng đang ở mức tồn tối thiểu không thể chuyển.',
    items: [
      { productName: 'Dầu ăn Simply 1L', sku: 'SIMPLY-1L', quantity: 100, unit: 'Chai' },
    ],
  },
];

export function StockTransferRequestsPage() {
  const [data, setData] = useState<StockTransferRequestRecord[]>(MOCK_REQUESTS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StockTransferRequestRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<StockTransferRequestRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.requestCode.toLowerCase().includes(q) ||
        d.sourceWarehouse.toLowerCase().includes(q) ||
        d.destinationWarehouse.toLowerCase().includes(q) ||
        d.proposedBy.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      requestCode: `STR-2026-${Date.now().toString().slice(-4)}`,
      sourceWarehouse: 'Tổng kho Thủ Đức',
      destinationWarehouse: 'Chi nhánh Quận 1',
      requestDate: new Date().toISOString().split('T')[0],
      proposedBy: 'Quản lý kho hiện tại',
      status: 'CHỜ_PHÊ_DUYỆT',
      reason: '',
      items: [{ productName: '', sku: '', quantity: 1, unit: 'Cái' }],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StockTransferRequestRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.requestCode || !editingItem.sourceWarehouse || !editingItem.destinationWarehouse) return;

    if (modalMode === 'create') {
      const newItem: StockTransferRequestRecord = {
        id: String(data.length + 1),
        requestCode: editingItem.requestCode!,
        sourceWarehouse: editingItem.sourceWarehouse!,
        destinationWarehouse: editingItem.destinationWarehouse!,
        requestDate: editingItem.requestDate!,
        proposedBy: editingItem.proposedBy!,
        status: editingItem.status as any || 'CHỜ_PHÊ_DUYỆT',
        reason: editingItem.reason,
        items: editingItem.items || [],
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as StockTransferRequestRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa yêu cầu chuyển kho này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<StockTransferRequestRecord>[]>(
    () => [
      {
        accessorKey: 'requestCode',
        header: 'Mã Yêu Cầu Chuyển',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sourceWarehouse',
        header: 'Kho Xuất Đi',
        cell: (info) => <span className="font-semibold text-gray-800 dark:text-gray-200">{info.getValue() as string}</span>,
      },
      {
        id: 'direction',
        header: 'Hướng Chuyển',
        cell: () => <ArrowRightLeft className="w-4 h-4 text-gray-400 mx-auto" />,
      },
      {
        accessorKey: 'destinationWarehouse',
        header: 'Kho Nhận Về',
        cell: (info) => <span className="font-semibold text-gray-800 dark:text-gray-200">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'requestDate',
        header: 'Ngày Đề Xuất',
        cell: (info) => (
          <span className="font-mono flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'proposedBy',
        header: 'Người Yêu Cầu',
        cell: (info) => (
          <span className="flex items-center gap-1 text-xs">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái Duyệt',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
          let icon = <Clock className="w-3.5 h-3.5" />;

          if (status === 'ĐÃ_PHÊ_DUYỆT') {
            badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            icon = <CheckCircle2 className="w-3.5 h-3.5" />;
          } else if (status === 'BỊ_TỪ_CHỐI') {
            badgeClass = 'bg-red-50 text-red-700 border-red-200';
            icon = <XCircle className="w-3.5 h-3.5" />;
          }

          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
            >
              {icon}
              {status.replace('_', ' ')}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem Chi Tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa / Phê duyệt"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu Cầu Chuyển Kho</h1>
          <p className="text-sm text-gray-500">
            Xem và lập các phiếu đề xuất luân chuyển hàng hoá nội bộ giữa các chi nhánh hoặc kho tổng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Yêu Cầu Chuyển Hàng
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-150 dark:border-gray-750 flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã yêu cầu, kho xuất, kho nhận, người yêu cầu..."
          className="w-full bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Drawer Xem Chi Tiết Mặt Hàng Yêu Cầu */}
      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Yêu Cầu: ${selected?.requestCode}`}
      >
        {selected && (
          <div className="space-y-6 text-sm text-gray-700 dark:text-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Mã Yêu Cầu:</span>
                <p className="font-mono font-semibold text-gray-900 dark:text-white">{selected.requestCode}</p>
              </div>
              <div>
                <span className="text-gray-400">Trạng Thái:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'ĐÃ_PHÊ_DUYỆT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selected.status === 'CHỜ_PHÊ_DUYỆT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 dark:border-gray-800 py-3">
              <div>
                <span className="text-gray-400 block text-xs">Kho xuất đi:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.sourceWarehouse}</p>
              </div>
              <div>
                <span className="text-gray-400 block text-xs">Kho nhận về:</span>
                <p className="font-semibold text-gray-900 dark:text-white">{selected.destinationWarehouse}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400">Ngày Đề Xuất:</span>
                <p className="font-mono text-gray-900 dark:text-white">{selected.requestDate}</p>
              </div>
              <div>
                <span className="text-gray-400">Người Yêu Cầu:</span>
                <p className="text-gray-900 dark:text-white">{selected.proposedBy}</p>
              </div>
            </div>

            {selected.reason && (
              <div>
                <span className="text-gray-400">Lý Do Đề Xuất:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded text-gray-800 dark:text-gray-300">
                  {selected.reason}
                </p>
              </div>
            )}

            <div>
              <span className="text-gray-400 block mb-2">Danh Sách Mặt Hàng Đề Xuất Chuyển:</span>
              <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 uppercase font-bold border-b dark:border-gray-750">
                      <th className="p-2.5">Tên Mặt Hàng</th>
                      <th className="p-2.5">Mã SKU</th>
                      <th className="p-2.5 text-right">Số Lượng Chuyển</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-750 text-xs">
                    {selected.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                        <td className="p-2.5 font-medium text-gray-900 dark:text-white">{it.productName}</td>
                        <td className="p-2.5 font-mono text-gray-500">{it.sku}</td>
                        <td className="p-2.5 font-mono font-semibold text-right text-emerald-600 dark:text-emerald-400">
                          {it.quantity} {it.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Tạo/Sửa Phiếu Yêu Cầu Chuyển Hàng */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo Đề Xuất Chuyển Kho Mới' : 'Cập Nhật & Phê Duyệt Phiếu Chuyển'}
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phiếu Yêu Cầu *</label>
              <input
                type="text"
                value={editingItem.requestCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, requestCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người Đề Xuất *</label>
              <input
                type="text"
                value={editingItem.proposedBy || ''}
                onChange={(e) => setEditingItem({ ...editingItem, proposedBy: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kho Xuất Đi *</label>
              <input
                type="text"
                value={editingItem.sourceWarehouse || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sourceWarehouse: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                placeholder="Kho đi"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kho Nhận Về *</label>
              <input
                type="text"
                value={editingItem.destinationWarehouse || ''}
                onChange={(e) => setEditingItem({ ...editingItem, destinationWarehouse: e.target.value })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
                placeholder="Kho nhận"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Yêu Cầu *</label>
              <input
                type="date"
                value={editingItem.requestDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, requestDate: e.target.value })}
                className="w-full p-2 border rounded font-mono dark:bg-gray-950 dark:border-gray-700"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng Thái Đề Xuất *</label>
              <select
                value={editingItem.status || 'CHỜ_PHÊ_DUYỆT'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              >
                <option value="CHỜ_PHÊ_DUYỆT">Chờ Phê Duyệt</option>
                <option value="ĐÃ_PHÊ_DUYỆT">Phê Duyệt (Cho chuyển hàng)</option>
                <option value="BỊ_TỪ_CHỐI">Từ Chối Đề Xuất</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Lý Do Đề Xuất Chuyển Kho</label>
            <textarea
              value={editingItem.reason || ''}
              onChange={(e) => setEditingItem({ ...editingItem, reason: e.target.value })}
              className="w-full p-2 border rounded dark:bg-gray-950 dark:border-gray-700"
              rows={2}
              placeholder="Ghi rõ lý do như bù tồn kho, sự kiện khuyến mãi..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition text-gray-700 dark:text-gray-300"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition">
              {modalMode === 'create' ? 'Tạo Phiếu Đề Xuất' : 'Cập Nhật Phiếu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
