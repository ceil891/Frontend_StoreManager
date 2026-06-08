import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface PurchaseReturnRecord {
  id: string;
  returnCode: string;
  poCode: string;
  supplierName: string;
  returnDate: string;
  totalAmount: number;
  handler: string;
  status: 'CHO_DONG_GOI' | 'DA_XUAT_TRA' | 'DA_HUY';
  notes?: string;
}

const MOCK_RETURNS: PurchaseReturnRecord[] = [
  {
    id: '1',
    returnCode: 'RTP-2026-001',
    poCode: 'PO-2026-881',
    supplierName: 'Nhà Cung Cấp Toàn Cầu',
    returnDate: '2026-06-03',
    totalAmount: 12000000,
    handler: 'Nguyễn Văn Kho',
    status: 'DA_XUAT_TRA',
    notes: 'Xuất trả lại 100 chai nước ngọt bị hết hạn sử dụng cận ngày giao',
  },
  {
    id: '2',
    returnCode: 'RTP-2026-002',
    poCode: 'PO-2026-882',
    supplierName: 'Công Ty Nhập Khẩu Á Châu',
    returnDate: '2026-06-04',
    totalAmount: 3500000,
    handler: 'Nguyễn Thị Hoa',
    status: 'CHO_DONG_GOI',
    notes: 'Đang xếp thùng để trả lại linh kiện bị trầy xước bên ngoài',
  },
];

export function PurchaseReturnsListsPage() {
  const [data, setData] = useState<PurchaseReturnRecord[]>(MOCK_RETURNS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PurchaseReturnRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<PurchaseReturnRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.returnCode.toLowerCase().includes(q) ||
        d.poCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q) ||
        d.handler.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      returnCode: `RTP-2026-${Date.now().toString().slice(-4)}`,
      poCode: '',
      supplierName: '',
      returnDate: new Date().toISOString().split('T')[0],
      totalAmount: 0,
      handler: '',
      status: 'CHO_DONG_GOI',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PurchaseReturnRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.returnCode || !editingItem.poCode || !editingItem.supplierName) return;

    if (modalMode === 'create') {
      const newItem: PurchaseReturnRecord = {
        id: String(data.length + 1),
        returnCode: editingItem.returnCode!,
        poCode: editingItem.poCode!,
        supplierName: editingItem.supplierName!,
        returnDate: editingItem.returnDate!,
        totalAmount: Number(editingItem.totalAmount || 0),
        handler: editingItem.handler || '',
        status: editingItem.status as any || 'CHO_DONG_GOI',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as PurchaseReturnRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiếu trả hàng mua này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<PurchaseReturnRecord>[]>(
    () => [
      {
        accessorKey: 'returnCode',
        header: 'Mã Phiếu Trả',
        cell: (info) => <span className="font-mono font-bold text-red-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'poCode',
        header: 'Đơn Mua Gốc (PO)',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà Cung Cấp',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'returnDate',
        header: 'Ngày Xuất Trả',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng Tiền Trả',
        cell: (info) => <span className="font-mono font-bold text-red-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ Đóng Gói';
          if (status === 'DA_XUAT_TRA') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Xuất Trả';
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
              title="Xem Chi Tiết"
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
          <h1 className="text-2xl font-bold">Lịch Sử Trả Hàng Cho Nhà Cung Cấp</h1>
          <p className="text-sm text-gray-500">
            Xem danh sách các đợt trả hàng hỏng, hàng lỗi, hàng quá hạn sử dụng lại cho nhà cung cấp đối tác.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Lập Phiếu Xuất Trả
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu trả, mã PO gốc, nhà cung cấp, người lập..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Phiếu Xuất Trả: ${selected?.returnCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Phiếu Trả:</span>
                <p className="font-mono font-semibold text-red-600">{selected.returnCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã PO Gốc:</span>
                <p className="font-mono font-semibold">{selected.poCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nhà Cung Cấp:</span>
              <p className="font-semibold">{selected.supplierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Xuất Trả:</span>
                <p className="font-mono">{selected.returnDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Người Thực Hiện:</span>
                <p>{selected.handler || 'Thủ kho'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tổng Giá Trị Hàng Xuất Trả:</span>
              <p className="font-mono font-bold text-red-600 text-lg">{formatCurrency(selected.totalAmount)}</p>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Xử Lý:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_XUAT_TRA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_DONG_GOI'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_XUAT_TRA'
                    ? 'Đã Xuất Trả'
                    : selected.status === 'CHO_DONG_GOI'
                    ? 'Chờ Đóng Gói'
                    : 'Đã Hủy'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Chi Tiết Lý Do Trả:</span>
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
        title={modalMode === 'create' ? 'Lập Phiếu Xuất Trả Mới' : 'Sửa Thông Tin Phiếu Xuất Trả'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phiếu Trả *</label>
              <input
                type="text"
                value={editingItem.returnCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, returnCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đơn Mua Gốc PO *</label>
              <input
                type="text"
                value={editingItem.poCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, poCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="PO-2026-XXX"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Nhà Cung Cấp *</label>
            <input
              type="text"
              value={editingItem.supplierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên nhà cung cấp nhận hàng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng Giá Trị Trả (VND) *</label>
              <input
                type="number"
                value={editingItem.totalAmount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalAmount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Xuất Trả *</label>
              <input
                type="date"
                value={editingItem.returnDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, returnDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thủ Kho Nhận / Đóng Gói</label>
              <input
                type="text"
                value={editingItem.handler || ''}
                onChange={(e) => setEditingItem({ ...editingItem, handler: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng Thái Xử Lý *</label>
              <select
                value={editingItem.status || 'CHO_DONG_GOI'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="CHO_DONG_GOI">Chờ Đóng Gói</option>
                <option value="DA_XUAT_TRA">Đã Xuất Khỏi Kho (Giao đối tác vận chuyển)</option>
                <option value="DA_HUY">Đã Hủy Phiếu</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú Chi Tiết</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết sản phẩm lỗi, số lượng trả..."
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
              Lưu Phiếu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
