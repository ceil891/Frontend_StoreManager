import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Link, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface MappingRecord {
  id: string;
  channelItemId: string; // SKU ID of Shopee/Lazada
  sku: string; // System SKU
  systemProductName: string;
  channelProductName: string;
  channelName: string;
  channelStock: number;
  syncStatus: 'SYNCED' | 'OUT_OF_SYNC';
  notes?: string;
}

const MOCK_MAPPINGS: MappingRecord[] = [
  {
    id: '1',
    channelItemId: 'SP-10023412',
    sku: 'SKU-MILK-01',
    systemProductName: 'Sữa Tươi Tiệt Trùng Vinamilk 1L',
    channelProductName: '[Hỏa Tốc] Sữa tươi nguyên chất tiệt trùng Vinamilk 1 Lít',
    channelName: 'Shopee - Gian Hàng Thời Trang',
    channelStock: 120,
    syncStatus: 'SYNCED',
    notes: 'Đã khớp tồn kho tự động lúc 16:30',
  },
  {
    id: '2',
    channelItemId: 'TT-98124512',
    sku: 'SKU-COKE-02',
    systemProductName: 'Nước Ngọt Coca Cola Lon 320ml',
    channelProductName: 'Nước giải khát lon Coca-Cola 320ml (Combo 6 lon)',
    channelName: 'TikTok Shop - RetailHub',
    channelStock: 50,
    syncStatus: 'OUT_OF_SYNC',
    notes: 'Sai lệch số lượng tồn kho do TikTok có đơn hàng chưa đồng bộ về POS',
  },
];

export function ChannelProductMappingPage() {
  const [data, setData] = useState<MappingRecord[]>(MOCK_MAPPINGS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MappingRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<MappingRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.sku.toLowerCase().includes(q) ||
        d.channelItemId.toLowerCase().includes(q) ||
        d.systemProductName.toLowerCase().includes(q) ||
        d.channelName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      channelItemId: '',
      sku: '',
      systemProductName: '',
      channelProductName: '',
      channelName: '',
      channelStock: 0,
      syncStatus: 'SYNCED',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: MappingRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.channelItemId || !editingItem.sku || !editingItem.channelName) return;

    if (modalMode === 'create') {
      const newItem: MappingRecord = {
        id: String(data.length + 1),
        channelItemId: editingItem.channelItemId!.toUpperCase(),
        sku: editingItem.sku!.toUpperCase(),
        systemProductName: editingItem.systemProductName || 'Mặt hàng hệ thống',
        channelProductName: editingItem.channelProductName || 'Tên trên sàn',
        channelName: editingItem.channelName!,
        channelStock: Number(editingItem.channelStock || 0),
        syncStatus: editingItem.syncStatus as any || 'SYNCED',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as MappingRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa liên kết sản phẩm này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<MappingRecord>[]>(
    () => [
      {
        accessorKey: 'channelItemId',
        header: 'Mã Sản Phẩm Sàn',
        cell: (info) => <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sku',
        header: 'SKU Hệ Thống',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'systemProductName',
        header: 'Sản Phẩm Trong POS',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'channelName',
        header: 'Kênh Liên Kết',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'channelStock',
        header: 'Tồn Kho Sàn',
        cell: (info) => <span className="font-mono font-semibold">{info.getValue() as number} món</span>,
      },
      {
        accessorKey: 'syncStatus',
        header: 'Trạng Thái Kho',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'SYNCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'SYNCED' ? 'Đã Đồng Bộ' : 'Sai Lệch Tồn';
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem Chi Tiết Liên Kết"
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
              title="Xóa Liên Kết"
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
          <h1 className="text-2xl font-bold">Liên Kết Sản Phẩm Đa Kênh (Channel Mapping)</h1>
          <p className="text-sm text-gray-500">
            Xem và cấu hình liên kết mã sản phẩm SKU trên sàn TMĐT với mã SKU trong kho hàng POS, tự động đồng bộ số dư kho.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Liên Kết SKU Sàn
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Link className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã SKU hệ thống, mã sản phẩm sàn, kênh liên kết..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết liên kết SKU: ${selected?.sku}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã SKU Trên Sàn:</span>
                <p className="font-mono font-semibold">{selected.channelItemId}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã SKU Trong POS:</span>
                <p className="font-mono font-semibold text-emerald-600">{selected.sku}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Sản Phẩm Trong POS:</span>
              <p className="font-semibold text-base">{selected.systemProductName}</p>
            </div>
            <div>
              <span className="text-gray-500">Tên Sản Phẩm Trên Sàn TMĐT:</span>
              <p className="font-semibold text-gray-700 dark:text-gray-300 text-base">{selected.channelProductName}</p>
            </div>
            <div>
              <span className="text-gray-500">Gian Hàng / Kênh:</span>
              <p className="font-semibold text-blue-600">{selected.channelName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Tồn Kho Trên Sàn:</span>
                <p className="font-mono font-bold text-lg">{selected.channelStock} món</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng Thái Đồng Bộ:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.syncStatus === 'SYNCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.syncStatus === 'SYNCED' ? 'Đã Đồng Bộ Khớp' : 'Lệch Số Dư Tồn Kho'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Liên Kết:</span>
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
        title={modalMode === 'create' ? 'Tạo Liên Kết Sản Phẩm TMĐT' : 'Sửa Liên Kết Sản Phẩm'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã SKU Trên Sàn *</label>
              <input
                type="text"
                value={editingItem.channelItemId || ''}
                onChange={(e) => setEditingItem({ ...editingItem, channelItemId: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SP-XXXX"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">SKU Hệ Thống *</label>
              <input
                type="text"
                value={editingItem.sku || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sku: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SKU-XXXX"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Hàng Hóa Trên Sàn *</label>
            <input
              type="text"
              value={editingItem.channelProductName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, channelProductName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên hiển thị trên Shopee/Lazada"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Kênh Bán TMĐT *</label>
              <input
                type="text"
                value={editingItem.channelName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, channelName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Shopee, TikTok Shop..."
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tồn Kho Sàn Hiện Tại</label>
              <input
                type="number"
                value={editingItem.channelStock || 0}
                onChange={(e) => setEditingItem({ ...editingItem, channelStock: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái Đồng Bộ *</label>
            <select
              value={editingItem.syncStatus || 'SYNCED'}
              onChange={(e) => setEditingItem({ ...editingItem, syncStatus: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="SYNCED">Đồng Bộ Khớp Số Liệu</option>
              <option value="OUT_OF_SYNC">Sai Lệch Tồn Kho (Yêu cầu Sync lại)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết chênh lệch tồn hoặc mã định danh..."
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
              Lưu Liên Kết
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ChannelProductMappingPage;
