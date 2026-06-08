import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface SalesPaymentRecord {
  id: string;
  paymentCode: string;
  invoiceCode: string;
  customerName: string;
  paymentMethod: 'TIEN_MAT' | 'CHUYEN_KHOAN' | 'THE' | 'VI_DIEN_TU';
  paymentDate: string;
  amount: number;
  receiver: string;
  status: 'CHO_DUYET' | 'DA_THU' | 'DA_HUY';
  notes?: string;
}

const MOCK_PAYMENTS: SalesPaymentRecord[] = [
  {
    id: '1',
    paymentCode: 'PAY-SO-2026-001',
    invoiceCode: 'INV-2026-001',
    customerName: 'Nguyễn Văn A',
    paymentMethod: 'CHUYEN_KHOAN',
    paymentDate: '2026-06-04',
    amount: 1450000,
    receiver: 'Lưu Hữu Phước',
    status: 'DA_THU',
    notes: 'Thanh toán trực tiếp qua chuyển khoản ngân hàng Techcombank',
  },
  {
    id: '2',
    paymentCode: 'PAY-SO-2026-002',
    invoiceCode: 'INV-2026-002',
    customerName: 'Trần Thị B',
    paymentMethod: 'TIEN_MAT',
    paymentDate: '2026-06-04',
    amount: 3400000,
    receiver: 'Nguyễn Văn Thu',
    status: 'CHO_DUYET',
    notes: 'Khách thanh toán tiền mặt khi giao hàng (COD)',
  },
];

export function SalesPaymentsPage() {
  const [data, setData] = useState<SalesPaymentRecord[]>(MOCK_PAYMENTS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SalesPaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SalesPaymentRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.paymentCode.toLowerCase().includes(q) ||
        d.invoiceCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.receiver.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      paymentCode: `PAY-SO-${Date.now().toString().slice(-4)}`,
      invoiceCode: '',
      customerName: '',
      paymentMethod: 'CHUYEN_KHOAN',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      receiver: '',
      status: 'CHO_DUYET',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SalesPaymentRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.paymentCode || !editingItem.invoiceCode || !editingItem.customerName) return;

    if (modalMode === 'create') {
      const newItem: SalesPaymentRecord = {
        id: String(data.length + 1),
        paymentCode: editingItem.paymentCode!,
        invoiceCode: editingItem.invoiceCode!,
        customerName: editingItem.customerName!,
        paymentMethod: editingItem.paymentMethod as any || 'CHUYEN_KHOAN',
        paymentDate: editingItem.paymentDate!,
        amount: Number(editingItem.amount || 0),
        receiver: editingItem.receiver || '',
        status: editingItem.status as any || 'CHO_DUYET',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as SalesPaymentRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiếu thu này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<SalesPaymentRecord>[]>(
    () => [
      {
        accessorKey: 'paymentCode',
        header: 'Mã Phiếu Thu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceCode',
        header: 'Mã Hóa Đơn',
        cell: (info) => <span className="font-mono font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'amount',
        header: 'Số Tiền Thu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Phương Thức',
        cell: (info) => {
          const val = info.getValue() as string;
          const label = val === 'CHUYEN_KHOAN' ? 'Chuyển Khoản' : val === 'TIEN_MAT' ? 'Tiền Mặt' : val === 'THE' ? 'Thẻ' : 'Ví Điện Tử';
          return <span className="text-gray-700 dark:text-gray-300">{label}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass =
            status === 'DA_THU'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'CHO_DUYET'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800';
          const label = status === 'DA_THU' ? 'Đã Thu' : status === 'CHO_DUYET' ? 'Chờ Duyệt' : 'Đã Hủy';
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
          <h1 className="text-2xl font-bold">Thanh Toán Đơn Bán (Phiếu Thu)</h1>
          <p className="text-sm text-gray-500">
            Quản lý các khoản thanh toán, giao dịch thu tiền từ khách hàng nhằm xác nhận doanh thu thực tế.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Lập Phiếu Thu Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu thu, mã hóa đơn, khách hàng, người thu..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Phiếu Thu: ${selected?.paymentCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Phiếu Thu:</span>
                <p className="font-mono font-semibold text-emerald-600">{selected.paymentCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã Hóa Đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách Hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Số Tiền Thu:</span>
                <p className="font-mono font-bold text-emerald-600">{formatCurrency(selected.amount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Phương Thức:</span>
                <p>
                  {selected.paymentMethod === 'CHUYEN_KHOAN'
                    ? 'Chuyển Khoản'
                    : selected.paymentMethod === 'TIEN_MAT'
                    ? 'Tiền Mặt'
                    : selected.paymentMethod === 'THE'
                    ? 'Thẻ'
                    : 'Ví Điện Tử'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Thu Tiền:</span>
                <p className="font-mono">{selected.paymentDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Người Thu / Nhân Viên:</span>
                <p>{selected.receiver || 'Chưa rõ'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_THU'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_DUYET'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_THU' ? 'Đã Thu' : selected.status === 'CHO_DUYET' ? 'Chờ Duyệt' : 'Đã Hủy'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú:</span>
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
        title={modalMode === 'create' ? 'Lập Phiếu Thu Mới' : 'Sửa Thông Tin Phiếu Thu'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phiếu Thu *</label>
              <input
                type="text"
                value={editingItem.paymentCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, paymentCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Hóa Đơn *</label>
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
              placeholder="Khách thanh toán"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Số Tiền Thu *</label>
              <input
                type="number"
                value={editingItem.amount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, amount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phương Thức Thanh Toán *</label>
              <select
                value={editingItem.paymentMethod || 'CHUYEN_KHOAN'}
                onChange={(e) => setEditingItem({ ...editingItem, paymentMethod: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="CHUYEN_KHOAN">Chuyển Khoản</option>
                <option value="TIEN_MAT">Tiền Mặt</option>
                <option value="THE">Thẻ (Visa/Master)</option>
                <option value="VI_DIEN_TU">Ví Điện Tử (Momo/VNPay)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Thu *</label>
              <input
                type="date"
                value={editingItem.paymentDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, paymentDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người Thu / Nhân Viên</label>
              <input
                type="text"
                value={editingItem.receiver || ''}
                onChange={(e) => setEditingItem({ ...editingItem, receiver: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên lập phiếu"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái *</label>
            <select
              value={editingItem.status || 'CHO_DUYET'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_DUYET">Chờ Duyệt</option>
              <option value="DA_THU">Đã Thu (Xác nhận tài khoản)</option>
              <option value="DA_HUY">Đã Hủy</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết giao dịch..."
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
              Lưu Phiếu Thu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
