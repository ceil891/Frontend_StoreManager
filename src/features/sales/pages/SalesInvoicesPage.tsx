import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Receipt } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface SalesInvoiceRecord {
  id: string;
  invoiceCode: string;
  orderCode: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  discount: number;
  totalAmount: number;
  status: 'CHO_THANH_TOAN' | 'DA_THANH_TOAN' | 'DA_HUY';
  notes?: string;
}

const MOCK_INVOICES: SalesInvoiceRecord[] = [
  {
    id: '1',
    invoiceCode: 'INV-2026-001',
    orderCode: 'SO-2026-001',
    customerName: 'Nguyễn Văn A',
    invoiceDate: '2026-06-04',
    dueDate: '2026-06-04',
    subTotal: 1500000,
    discount: 50000,
    totalAmount: 1450000,
    status: 'DA_THANH_TOAN',
    notes: 'Khách hàng thanh toán qua VNPay',
  },
  {
    id: '2',
    invoiceCode: 'INV-2026-002',
    orderCode: 'SO-2026-002',
    customerName: 'Trần Thị B',
    invoiceDate: '2026-06-04',
    dueDate: '2026-06-18',
    subTotal: 3400000,
    discount: 0,
    totalAmount: 3400000,
    status: 'CHO_THANH_TOAN',
    notes: 'Đơn hàng giao COD đi tỉnh',
  },
  {
    id: '3',
    invoiceCode: 'INV-2026-003',
    orderCode: 'SO-2026-003',
    customerName: 'Lê Văn C',
    invoiceDate: '2026-06-03',
    dueDate: '2026-06-17',
    subTotal: 850000,
    discount: 100000,
    totalAmount: 750000,
    status: 'DA_HUY',
    notes: 'Hủy đơn do khách đổi ý không mua nữa',
  },
];

export function SalesInvoicesPage() {
  const [data, setData] = useState<SalesInvoiceRecord[]>(MOCK_INVOICES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SalesInvoiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SalesInvoiceRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.invoiceCode.toLowerCase().includes(q) ||
        d.orderCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      invoiceCode: `INV-2026-${Date.now().toString().slice(-4)}`,
      orderCode: '',
      customerName: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      subTotal: 0,
      discount: 0,
      totalAmount: 0,
      status: 'CHO_THANH_TOAN',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SalesInvoiceRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.orderCode || !editingItem.customerName) return;

    const sub = Number(editingItem.subTotal || 0);
    const disc = Number(editingItem.discount || 0);
    const total = sub - disc;

    if (modalMode === 'create') {
      const newItem: SalesInvoiceRecord = {
        id: String(data.length + 1),
        invoiceCode: editingItem.invoiceCode!,
        orderCode: editingItem.orderCode!,
        customerName: editingItem.customerName!,
        invoiceDate: editingItem.invoiceDate!,
        dueDate: editingItem.dueDate || editingItem.invoiceDate!,
        subTotal: sub,
        discount: disc,
        totalAmount: total,
        status: editingItem.status as any || 'CHO_THANH_TOAN',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      const updated = {
        ...editingItem,
        subTotal: sub,
        discount: disc,
        totalAmount: total,
      } as SalesInvoiceRecord;
      setData(data.map((d) => (d.id === editingItem.id ? updated : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hóa đơn bán hàng này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<SalesInvoiceRecord>[]>(
    () => [
      {
        accessorKey: 'invoiceCode',
        header: 'Mã Hóa Đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã Đơn SO',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Tên Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Ngày Hóa Đơn',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Thành Tiền',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass =
            status === 'DA_THANH_TOAN'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'CHO_THANH_TOAN'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800';
          const label = status === 'DA_THANH_TOAN' ? 'Đã Thanh Toán' : status === 'CHO_THANH_TOAN' ? 'Chờ Thanh Toán' : 'Đã Hủy';
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
          <h1 className="text-2xl font-bold">Hóa Đơn Bán Hàng (Đầu Ra)</h1>
          <p className="text-sm text-gray-500">
            Quản lý và xuất hóa đơn bán hàng cho khách hàng, hỗ trợ in hóa đơn, ghi nhận doanh thu và báo cáo VAT.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Lập Hóa Đơn Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã hóa đơn, mã đơn hàng, tên khách hàng..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Hóa Đơn Bán: ${selected?.invoiceCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Hóa Đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã Đơn Hàng (SO):</span>
                <p className="font-mono font-semibold">{selected.orderCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách Hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Hóa Đơn:</span>
                <p className="font-mono">{selected.invoiceDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn Thanh Toán:</span>
                <p className="font-mono">{selected.dueDate}</p>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Thành tiền hàng:</span>
                <span className="font-mono">{formatCurrency(selected.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chiết khấu/Giảm giá:</span>
                <span className="font-mono text-red-500">-{formatCurrency(selected.discount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Tổng phải trả:</span>
                <span className="font-mono text-emerald-600">{formatCurrency(selected.totalAmount)}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_THANH_TOAN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_THANH_TOAN'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_THANH_TOAN' ? 'Đã Thanh Toán' : selected.status === 'CHO_THANH_TOAN' ? 'Chờ Thanh Toán' : 'Đã Hủy'}
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
        title={modalMode === 'create' ? 'Lập Hóa Đơn Bán Mới' : 'Sửa Thông Tin Hóa Đơn Bán'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Hóa Đơn *</label>
              <input
                type="text"
                value={editingItem.invoiceCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Đơn SO *</label>
              <input
                type="text"
                value={editingItem.orderCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, orderCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SO-2026-XXX"
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
              placeholder="Khách mua hàng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Hóa Đơn *</label>
              <input
                type="date"
                value={editingItem.invoiceDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hạn Thanh Toán *</label>
              <input
                type="date"
                value={editingItem.dueDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, dueDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thành Tiền Hàng *</label>
              <input
                type="number"
                value={editingItem.subTotal || 0}
                onChange={(e) => setEditingItem({ ...editingItem, subTotal: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chiết Khấu</label>
              <input
                type="number"
                value={editingItem.discount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, discount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái</label>
            <select
              value={editingItem.status || 'CHO_THANH_TOAN'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_THANH_TOAN">Chờ Thanh Toán</option>
              <option value="DA_THANH_TOAN">Đã Thanh Toán</option>
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
              placeholder="Ghi chú chi tiết hóa đơn..."
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
              Lưu Hóa Đơn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
