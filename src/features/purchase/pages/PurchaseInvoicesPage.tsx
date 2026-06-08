import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Receipt } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface PurchaseInvoiceRecord {
  id: string;
  invoiceCode: string;
  poCode: string;
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  status: 'CHO_THANH_TOAN' | 'DA_THANH_TOAN' | 'DA_HUY';
  notes?: string;
}

const MOCK_INVOICES: PurchaseInvoiceRecord[] = [
  {
    id: '1',
    invoiceCode: 'INV-PUR-2026-001',
    poCode: 'PO-2026-881',
    supplierName: 'Nhà Cung Cấp Toàn Cầu',
    invoiceDate: '2026-06-01',
    dueDate: '2026-06-15',
    subTotal: 50000000,
    vatAmount: 5000000,
    totalAmount: 55000000,
    status: 'CHO_THANH_TOAN',
    notes: 'Hóa đơn tiền nước ngọt lô hàng ngày 01/06',
  },
  {
    id: '2',
    invoiceCode: 'INV-PUR-2026-002',
    poCode: 'PO-2026-882',
    supplierName: 'Công Ty Nhập Khẩu Á Châu',
    invoiceDate: '2026-05-20',
    dueDate: '2026-06-03',
    subTotal: 120000000,
    vatAmount: 12000000,
    totalAmount: 132000000,
    status: 'DA_THANH_TOAN',
    notes: 'Đã chuyển khoản thanh toán qua Vietcombank',
  },
  {
    id: '3',
    invoiceCode: 'INV-PUR-2026-003',
    poCode: 'PO-2026-883',
    supplierName: 'Tổng Kho Thực Phẩm HN',
    invoiceDate: '2026-05-15',
    dueDate: '2026-05-30',
    subTotal: 15000000,
    vatAmount: 1500000,
    totalAmount: 16500000,
    status: 'DA_HUY',
    notes: 'Hủy xuất hóa đơn do sai thông tin số PO',
  },
];

export function PurchaseInvoicesPage() {
  const [data, setData] = useState<PurchaseInvoiceRecord[]>(MOCK_INVOICES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PurchaseInvoiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<PurchaseInvoiceRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.invoiceCode.toLowerCase().includes(q) ||
        d.poCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      invoiceCode: `INV-PUR-2026-${Date.now().toString().slice(-3)}`,
      poCode: '',
      supplierName: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      subTotal: 0,
      vatAmount: 0,
      totalAmount: 0,
      status: 'CHO_THANH_TOAN',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PurchaseInvoiceRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.poCode || !editingItem.supplierName) return;

    const sub = Number(editingItem.subTotal || 0);
    const vat = Number(editingItem.vatAmount || 0);
    const total = sub + vat;

    if (modalMode === 'create') {
      const newItem: PurchaseInvoiceRecord = {
        id: String(data.length + 1),
        invoiceCode: editingItem.invoiceCode!,
        poCode: editingItem.poCode!,
        supplierName: editingItem.supplierName!,
        invoiceDate: editingItem.invoiceDate!,
        dueDate: editingItem.dueDate || editingItem.invoiceDate!,
        subTotal: sub,
        vatAmount: vat,
        totalAmount: total,
        status: editingItem.status as any || 'CHO_THANH_TOAN',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      const updated = {
        ...editingItem,
        subTotal: sub,
        vatAmount: vat,
        totalAmount: total,
      } as PurchaseInvoiceRecord;
      setData(data.map((d) => (d.id === editingItem.id ? updated : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<PurchaseInvoiceRecord>[]>(
    () => [
      {
        accessorKey: 'invoiceCode',
        header: 'Mã Hóa Đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'poCode',
        header: 'Mã PO',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà Cung Cấp',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Ngày Hóa Đơn',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng Thanh Toán',
        cell: (info) => <span className="font-mono font-bold text-blue-600">{formatCurrency(info.getValue() as number)}</span>,
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
          <h1 className="text-2xl font-bold">Hóa Đơn Mua Hàng (Nguồn Vào)</h1>
          <p className="text-sm text-gray-500">
            Quản lý hóa đơn VAT đầu vào từ các nhà cung cấp nhằm đối chiếu công nợ và kế toán tài chính.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Nhận Hóa Đơn Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã hóa đơn, mã PO, nhà cung cấp..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Hóa Đơn Mua: ${selected?.invoiceCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Hóa Đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã PO Đơn Mua:</span>
                <p className="font-mono font-semibold">{selected.poCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nhà Cung Cấp:</span>
              <p className="font-semibold">{selected.supplierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Hóa Đơn:</span>
                <p className="font-mono">{selected.invoiceDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày Đến Hạn:</span>
                <p className="font-mono">{selected.dueDate}</p>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền hàng (Subtotal):</span>
                <span className="font-mono">{formatCurrency(selected.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thuế VAT:</span>
                <span className="font-mono">{formatCurrency(selected.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Tổng cộng:</span>
                <span className="font-mono text-blue-600">{formatCurrency(selected.totalAmount)}</span>
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
        title={modalMode === 'create' ? 'Ghi Nhận Hóa Đơn Mới' : 'Sửa Thông Tin Hóa Đơn'}
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
              <label className="block text-xs text-gray-500 mb-1">Mã PO Đơn Mua *</label>
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
            <label className="block text-xs text-gray-500 mb-1">Nhà Cung Cấp *</label>
            <input
              type="text"
              value={editingItem.supplierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên nhà cung cấp"
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
              <label className="block text-xs text-gray-500 mb-1">Ngày Đến Hạn *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Tiền Hàng (Subtotal) *</label>
              <input
                type="number"
                value={editingItem.subTotal || 0}
                onChange={(e) => setEditingItem({ ...editingItem, subTotal: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tiền Thuế VAT</label>
              <input
                type="number"
                value={editingItem.vatAmount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, vatAmount: Number(e.target.value) })}
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
              placeholder="Ghi chú chi tiết..."
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
