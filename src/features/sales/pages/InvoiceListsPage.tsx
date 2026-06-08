import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download, Filter } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface GeneralInvoiceRecord {
  id: string;
  invoiceCode: string;
  invoiceType: 'BAN_LE' | 'BAN_SI' | 'TRA_HANG';
  issuedDate: string;
  customerName: string;
  subTotal: number;
  taxRate: number;
  totalAmount: number;
  status: 'DA_XUAT' | 'DA_HUY';
  notes?: string;
}

const MOCK_INVOICES: GeneralInvoiceRecord[] = [
  {
    id: '1',
    invoiceCode: 'INV-2026-101',
    invoiceType: 'BAN_LE',
    issuedDate: '2026-06-04',
    customerName: 'Nguyễn Văn A',
    subTotal: 1500000,
    taxRate: 10,
    totalAmount: 1650000,
    status: 'DA_XUAT',
    notes: 'Xuất hóa đơn bán lẻ tại POS 1',
  },
  {
    id: '2',
    invoiceCode: 'INV-2026-102',
    invoiceType: 'BAN_SI',
    issuedDate: '2026-06-03',
    customerName: 'Công Ty Đại Phát',
    subTotal: 50000000,
    taxRate: 8,
    totalAmount: 54000000,
    status: 'DA_XUAT',
    notes: 'Hóa đơn bán sỉ lô thiết bị gia dụng',
  },
  {
    id: '3',
    invoiceCode: 'INV-2026-103',
    invoiceType: 'TRA_HANG',
    issuedDate: '2026-06-02',
    customerName: 'Trần Thị B',
    subTotal: -300000,
    taxRate: 10,
    totalAmount: -330000,
    status: 'DA_XUAT',
    notes: 'Hóa đơn hoàn trả tiền hàng lỗi',
  },
];

export function InvoiceListsPage() {
  const [data, setData] = useState<GeneralInvoiceRecord[]>(MOCK_INVOICES);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GeneralInvoiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<GeneralInvoiceRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.invoiceCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.invoiceType.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      invoiceCode: `INV-2026-${Date.now().toString().slice(-4)}`,
      invoiceType: 'BAN_LE',
      issuedDate: new Date().toISOString().split('T')[0],
      customerName: '',
      subTotal: 0,
      taxRate: 10,
      totalAmount: 0,
      status: 'DA_XUAT',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: GeneralInvoiceRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.customerName) return;

    const sub = Number(editingItem.subTotal || 0);
    const tax = Number(editingItem.taxRate || 0);
    const total = sub + (sub * tax) / 100;

    if (modalMode === 'create') {
      const newItem: GeneralInvoiceRecord = {
        id: String(data.length + 1),
        invoiceCode: editingItem.invoiceCode!,
        invoiceType: editingItem.invoiceType as any || 'BAN_LE',
        issuedDate: editingItem.issuedDate!,
        customerName: editingItem.customerName!,
        subTotal: sub,
        taxRate: tax,
        totalAmount: total,
        status: editingItem.status as any || 'DA_XUAT',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      const updated = {
        ...editingItem,
        subTotal: sub,
        taxRate: tax,
        totalAmount: total,
      } as GeneralInvoiceRecord;
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

  const columns = useMemo<ColumnDef<GeneralInvoiceRecord>[]>(
    () => [
      {
        accessorKey: 'invoiceCode',
        header: 'Mã Hóa Đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceType',
        header: 'Loại Hóa Đơn',
        cell: (info) => {
          const val = info.getValue() as string;
          let label = 'Bán Lẻ';
          let color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
          if (val === 'BAN_SI') {
            label = 'Bán Sỉ';
            color = 'text-purple-600 bg-purple-50 dark:bg-purple-900/30';
          } else if (val === 'TRA_HANG') {
            label = 'Trả Hàng';
            color = 'text-red-600 bg-red-50 dark:bg-red-900/30';
          }
          return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>;
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'issuedDate',
        header: 'Ngày Xuất',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng Giá Trị',
        cell: (info) => {
          const val = info.getValue() as number;
          const isNegative = val < 0;
          return (
            <span className={`font-mono font-bold ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(val)}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'DA_XUAT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'DA_XUAT' ? 'Đã Xuất' : 'Đã Hủy';
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
              title="Xem Hóa Đơn"
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
          <h1 className="text-2xl font-bold">Danh Sách Hóa Đơn Tài Chính</h1>
          <p className="text-sm text-gray-500">
            Xem lịch sử, thống kê toàn bộ hóa đơn VAT bán lẻ, bán sỉ và các nghiệp vụ trả hàng khách hàng.
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
          placeholder="Tìm kiếm mã hóa đơn, tên khách hàng, loại hóa đơn..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết hóa đơn: ${selected?.invoiceCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Hóa Đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Loại Hóa Đơn:</span>
                <p className="font-semibold">
                  {selected.invoiceType === 'BAN_LE' ? 'Bán Lẻ' : selected.invoiceType === 'BAN_SI' ? 'Bán Sỉ' : 'Trả Hàng'}
                </p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách Hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Xuất Hóa Đơn:</span>
                <p className="font-mono">{selected.issuedDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Thuế Suất VAT:</span>
                <p className="font-mono">{selected.taxRate}%</p>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Giá trị trước thuế:</span>
                <span className="font-mono">{formatCurrency(selected.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thuế giá trị gia tăng:</span>
                <span className="font-mono">{formatCurrency((selected.subTotal * selected.taxRate) / 100)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Tổng giá trị hóa đơn:</span>
                <span className={`font-mono ${selected.totalAmount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(selected.totalAmount)}
                </span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_XUAT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_XUAT' ? 'Đã Xuất' : 'Đã Hủy'}
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
        title={modalMode === 'create' ? 'Lập Hóa Đơn Mới' : 'Sửa Thông Tin Hóa Đơn'}
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
              <label className="block text-xs text-gray-500 mb-1">Loại Hóa Đơn *</label>
              <select
                value={editingItem.invoiceType || 'BAN_LE'}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceType: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="BAN_LE">Bán Lẻ (POS)</option>
                <option value="BAN_SI">Bán Sỉ (Hợp Đồng)</option>
                <option value="TRA_HANG">Hoàn Trả / Hủy Hàng</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Khách Hàng *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Khách mua/trả hàng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Xuất Hóa Đơn *</label>
              <input
                type="date"
                value={editingItem.issuedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thuế Suất VAT (%) *</label>
              <input
                type="number"
                value={editingItem.taxRate || 0}
                onChange={(e) => setEditingItem({ ...editingItem, taxRate: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tổng Tiền Hàng (Trước Thuế) *</label>
            <input
              type="number"
              value={editingItem.subTotal || 0}
              onChange={(e) => setEditingItem({ ...editingItem, subTotal: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái *</label>
            <select
              value={editingItem.status || 'DA_XUAT'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="DA_XUAT">Đã Xuất Bản In / Ký Số</option>
              <option value="DA_HUY">Đã Hủy Hóa Đơn</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết hàng hóa..."
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
