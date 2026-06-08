import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, RefreshCw } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface ReturnBillRecord {
  id: string;
  returnCode: string;
  invoiceCode: string;
  customerName: string;
  returnDate: string;
  returnAmount: number;
  refundedAmount: number;
  receiver: string;
  status: 'CHO_KIEM_TRA' | 'DA_NHAN_LAI' | 'DA_HUY';
  notes?: string;
}

const MOCK_RETURNS: ReturnBillRecord[] = [
  {
    id: '1',
    returnCode: 'RT-2026-001',
    invoiceCode: 'INV-2026-101',
    customerName: 'Nguyễn Văn A',
    returnDate: '2026-06-04',
    returnAmount: 300000,
    refundedAmount: 300000,
    receiver: 'Lưu Hữu Phước',
    status: 'DA_NHAN_LAI',
    notes: 'Khách trả lại 2 hộp sữa bị móp méo vỏ bọc khi vận chuyển',
  },
  {
    id: '2',
    returnCode: 'RT-2026-002',
    invoiceCode: 'INV-2026-102',
    customerName: 'Công Ty Đại Phát',
    returnDate: '2026-06-03',
    returnAmount: 4500000,
    refundedAmount: 0,
    receiver: 'Nguyễn Thị Hoa Kho',
    status: 'CHO_KIEM_TRA',
    notes: 'Trả hàng do lỗi sản phẩm sấy khô, đang chờ kiểm định lỗi chất lượng',
  },
];

export function ReturnsListsPage() {
  const [data, setData] = useState<ReturnBillRecord[]>(MOCK_RETURNS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ReturnBillRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ReturnBillRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.returnCode.toLowerCase().includes(q) ||
        d.invoiceCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.receiver.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      returnCode: `RT-2026-${Date.now().toString().slice(-4)}`,
      invoiceCode: '',
      customerName: '',
      returnDate: new Date().toISOString().split('T')[0],
      returnAmount: 0,
      refundedAmount: 0,
      receiver: '',
      status: 'CHO_KIEM_TRA',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ReturnBillRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.returnCode || !editingItem.invoiceCode || !editingItem.customerName) return;

    if (modalMode === 'create') {
      const newItem: ReturnBillRecord = {
        id: String(data.length + 1),
        returnCode: editingItem.returnCode!,
        invoiceCode: editingItem.invoiceCode!,
        customerName: editingItem.customerName!,
        returnDate: editingItem.returnDate!,
        returnAmount: Number(editingItem.returnAmount || 0),
        refundedAmount: Number(editingItem.refundedAmount || 0),
        receiver: editingItem.receiver || '',
        status: editingItem.status as any || 'CHO_KIEM_TRA',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as ReturnBillRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiếu trả hàng này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ReturnBillRecord>[]>(
    () => [
      {
        accessorKey: 'returnCode',
        header: 'Mã Phiếu Trả',
        cell: (info) => <span className="font-mono font-bold text-red-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceCode',
        header: 'Hóa Đơn Gốc',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'returnAmount',
        header: 'Giá Trị Hàng Trả',
        cell: (info) => <span className="font-mono font-bold text-red-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'refundedAmount',
        header: 'Đã Hoàn Khách',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ Kiểm Kho';
          if (status === 'DA_NHAN_LAI') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Nhận Lại';
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
          <h1 className="text-2xl font-bold">Lịch Sử Nhận Hàng Hoàn Trả (Khách Hàng)</h1>
          <p className="text-sm text-gray-500">
            Xem và xử lý các yêu cầu trả lại hàng hóa của khách hàng, ghi nhận nhập kho lại và hoàn lại tiền.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Phiếu Trả Hàng
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu trả, mã hóa đơn gốc, khách hàng, thủ kho..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Phiếu Trả: ${selected?.returnCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Phiếu Trả:</span>
                <p className="font-mono font-semibold text-red-600">{selected.returnCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Hóa Đơn Mua Gốc:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách Hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Trả Hàng:</span>
                <p className="font-mono">{selected.returnDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Thủ Kho Nhận Hàng:</span>
                <p>{selected.receiver || 'Chưa nhận'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Giá Trị Trả Lại:</span>
                <p className="font-mono font-bold text-red-600">{formatCurrency(selected.returnAmount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Đã Hoàn Trả Khách:</span>
                <p className="font-mono font-bold text-emerald-600">{formatCurrency(selected.refundedAmount)}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Xử Lý:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_NHAN_LAI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_KIEM_TRA'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_NHAN_LAI'
                    ? 'Đã Nhận Lại Kho'
                    : selected.status === 'CHO_KIEM_TRA'
                    ? 'Chờ Kiểm Kho'
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
        title={modalMode === 'create' ? 'Tạo Phiếu Trả Hàng Mới' : 'Sửa Thông Tin Phiếu Trả'}
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
              <label className="block text-xs text-gray-500 mb-1">Hóa Đơn Mua Gốc *</label>
              <input
                type="text"
                value={editingItem.invoiceCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="INV-2026-XXX"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Khách Hàng *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Họ tên khách hàng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá Trị Hàng Trả (VND) *</label>
              <input
                type="number"
                value={editingItem.returnAmount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, returnAmount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đã Hoàn Khách (VND) *</label>
              <input
                type="number"
                value={editingItem.refundedAmount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, refundedAmount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Trả Hàng *</label>
              <input
                type="date"
                value={editingItem.returnDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, returnDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thủ Kho Nhận Hàng</label>
              <input
                type="text"
                value={editingItem.receiver || ''}
                onChange={(e) => setEditingItem({ ...editingItem, receiver: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên nhận kho"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tình Trạng Xử Lý *</label>
            <select
              value={editingItem.status || 'CHO_KIEM_TRA'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_KIEM_TRA">Chờ Kiểm Kho (Chưa nhập kho)</option>
              <option value="DA_NHAN_LAI">Đã Nhập Lại Kho & Duyệt Trả</option>
              <option value="DA_HUY">Đã Hủy Phiếu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Chi Tiết Lý Do Trả</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết lỗi sản phẩm, số lượng..."
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
