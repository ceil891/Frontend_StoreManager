import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Send, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface RFQRecord {
  id: string;
  rfqCode: string;
  supplierName: string;
  sentDate: string;
  expiryDate: string;
  itemsDescription: string;
  handler: string;
  status: 'CHO_BAO_GIA' | 'DA_BAO_GIA' | 'DA_HUY';
  notes?: string;
}

const MOCK_RFQS: RFQRecord[] = [
  {
    id: '1',
    rfqCode: 'RFQ-2026-001',
    supplierName: 'Nhà Cung Cấp Toàn Cầu',
    sentDate: '2026-06-01',
    expiryDate: '2026-06-10',
    itemsDescription: 'Yêu cầu báo giá 500 thùng sữa, 1000 lon nước ngọt các loại',
    handler: 'Lưu Hữu Phước',
    status: 'CHO_BAO_GIA',
    notes: 'Liên hệ gửi báo giá qua email sales@global.com',
  },
  {
    id: '2',
    rfqCode: 'RFQ-2026-002',
    supplierName: 'Công Ty Nhập Khẩu Á Châu',
    sentDate: '2026-05-15',
    expiryDate: '2026-05-25',
    itemsDescription: 'Báo giá 20 bộ máy lạnh DAIKIN 1.5 HP tiết kiệm điện',
    handler: 'Nguyễn Thị Hoa',
    status: 'DA_BAO_GIA',
    notes: 'Nhà cung cấp đã phản hồi giá tốt, đang soạn thảo đơn mua PO',
  },
];

export function SupplierRequestsPage() {
  const [data, setData] = useState<RFQRecord[]>(MOCK_RFQS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<RFQRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<RFQRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.rfqCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q) ||
        d.handler.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      rfqCode: `RFQ-2026-${Date.now().toString().slice(-4)}`,
      supplierName: '',
      sentDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      itemsDescription: '',
      handler: '',
      status: 'CHO_BAO_GIA',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: RFQRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.rfqCode || !editingItem.supplierName) return;

    if (modalMode === 'create') {
      const newItem: RFQRecord = {
        id: String(data.length + 1),
        rfqCode: editingItem.rfqCode!,
        supplierName: editingItem.supplierName!,
        sentDate: editingItem.sentDate!,
        expiryDate: editingItem.expiryDate || editingItem.sentDate!,
        itemsDescription: editingItem.itemsDescription || '',
        handler: editingItem.handler || '',
        status: editingItem.status as any || 'CHO_BAO_GIA',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as RFQRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa yêu cầu báo giá này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const columns = useMemo<ColumnDef<RFQRecord>[]>(
    () => [
      {
        accessorKey: 'rfqCode',
        header: 'Mã Yêu Cầu (RFQ)',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà Cung Cấp',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sentDate',
        header: 'Ngày Gửi',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'itemsDescription',
        header: 'Nội Dung Yêu Cầu',
        cell: (info) => <span className="truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ Báo Giá';
          if (status === 'DA_BAO_GIA') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Báo Giá';
          } else if (status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã Hủy';
          }
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
              title="Xem Chi Tiết RFQ"
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
          <h1 className="text-2xl font-bold">Yêu Cầu Báo Giá Nhà Cung Cấp (RFQs)</h1>
          <p className="text-sm text-gray-500">
            Tạo và theo dõi các bản yêu cầu báo giá (Requests for Quotation) gửi tới nhà cung cấp nhằm tìm kiếm giá tốt nhất.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Gửi Yêu Cầu Báo Giá
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã RFQ, nhà cung cấp, nội dung..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Yêu Cầu RFQ: ${selected?.rfqCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã RFQ:</span>
                <p className="font-mono font-semibold">{selected.rfqCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Người Thực Hiện:</span>
                <p>{selected.handler || 'Nhân viên mua hàng'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nhà Cung Cấp:</span>
              <p className="font-semibold">{selected.supplierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Gửi RFQ:</span>
                <p className="font-mono">{selected.sentDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày Hết Hạn Nhận Báo Giá:</span>
                <p className="font-mono">{selected.expiryDate}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nội Dung / Mặt Hàng Yêu Cầu:</span>
              <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                {selected.itemsDescription}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái RFQ:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_BAO_GIA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_BAO_GIA'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_BAO_GIA'
                    ? 'Đã Nhận Báo Giá'
                    : selected.status === 'CHO_BAO_GIA'
                    ? 'Chờ Báo Giá'
                    : 'Đã Hủy RFQ'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Vận Hành:</span>
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
        title={modalMode === 'create' ? 'Gửi Yêu Cầu Báo Giá RFQ' : 'Sửa Yêu Cầu Báo Giá RFQ'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã RFQ *</label>
              <input
                type="text"
                value={editingItem.rfqCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, rfqCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người Liên Hệ / Nhân Viên *</label>
              <input
                type="text"
                value={editingItem.handler || ''}
                onChange={(e) => setEditingItem({ ...editingItem, handler: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Họ tên nhân viên"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Nhà Cung Cấp Yêu Cầu *</label>
            <input
              type="text"
              value={editingItem.supplierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Nhà cung cấp"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Gửi *</label>
              <input
                type="date"
                value={editingItem.sentDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, sentDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Hết Hạn Phản Hồi *</label>
              <input
                type="date"
                value={editingItem.expiryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nội Dung / Mặt Hàng Yêu Cầu *</label>
            <textarea
              value={editingItem.itemsDescription || ''}
              onChange={(e) => setEditingItem({ ...editingItem, itemsDescription: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Danh sách sản phẩm chi tiết..."
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái *</label>
            <select
              value={editingItem.status || 'CHO_BAO_GIA'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_BAO_GIA">Chờ Báo Giá</option>
              <option value="DA_BAO_GIA">Đã Nhận Báo Giá</option>
              <option value="DA_HUY">Đã Hủy RFQ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="Ghi chú thêm..."
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
              Gửi Yêu Cầu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
