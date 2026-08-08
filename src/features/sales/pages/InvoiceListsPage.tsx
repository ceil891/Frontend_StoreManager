import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download, Filter } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore } from '@/features/sales/store/salesStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

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

export function InvoiceListsPage() {
  const { exportInvoices, fetchExportInvoices, addExportInvoice, updateExportInvoice, deleteExportInvoice } = useSalesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GeneralInvoiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<GeneralInvoiceRecord>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchExportInvoices();
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách hóa đơn');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchExportInvoices]);

  const data = useMemo<GeneralInvoiceRecord[]>(() => {
    return exportInvoices.map((inv) => ({
      id: inv.id,
      invoiceCode: inv.invoiceNumber,
      invoiceType: 'BAN_SI',
      issuedDate: inv.issueDate ? inv.issueDate.substring(0, 10) : '',
      customerName: inv.customerId || 'Khách lẻ',
      subTotal: inv.subtotal,
      taxRate: inv.vatAmount && inv.subtotal ? Math.round((inv.vatAmount / inv.subtotal) * 100) : 10,
      totalAmount: inv.totalAmount,
      status: inv.status === 'CANCELLED' ? 'DA_HUY' : 'DA_XUAT',
      notes: inv.notes,
    }));
  }, [exportInvoices]);

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
      invoiceType: 'BAN_SI',
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.customerName) return;

    try {
      const sub = Number(editingItem.subTotal || 0);
      const tax = Number(editingItem.taxRate || 10);
      const vat = sub * (tax / 100);
      const tot = sub + vat;

      const payload = {
        invoiceNumber: editingItem.invoiceCode,
        customerId: editingItem.customerName,
        taxId: 'VAT10',
        billingAddress: 'Hà Nội, Việt Nam',
        orderIds: [],
        issueDate: editingItem.issuedDate || new Date().toISOString().split('T')[0],
        dueDate: editingItem.issuedDate || new Date().toISOString().split('T')[0],
        subtotal: sub,
        vatAmount: vat,
        totalAmount: tot,
        status: (editingItem.status === 'DA_HUY' ? 'CANCELLED' : 'ISSUED') as any,
        paymentTerms: 'COD',
        notes: editingItem.notes || '',
      };

      if (modalMode === 'create') {
        await addExportInvoice(payload);
        toast.success('Thêm hóa đơn thành công!');
      } else {
        await updateExportInvoice(editingItem.id!, payload);
        toast.success('Cập nhật hóa đơn thành công!');
      }
      setIsModalOpen(false);
      fetchExportInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu hóa đơn.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      try {
        await deleteExportInvoice(id);
        toast.success('Đã xóa hóa đơn thành công!');
        fetchExportInvoices();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa hóa đơn.');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<GeneralInvoiceRecord>[]>(
    () => [
      {
        accessorKey: 'invoiceCode',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceType',
        header: 'Loại hóa đơn',
        cell: (info) => {
          const val = info.getValue() as string;
          let label = 'Bán lẻ';
          let color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
          if (val === 'BAN_SI') {
            label = 'Bán sỉ';
            color = 'text-purple-600 bg-purple-50 dark:bg-purple-900/30';
          } else if (val === 'TRA_HANG') {
            label = 'Trả hàng';
            color = 'text-red-600 bg-red-50 dark:bg-red-900/30';
          }
          return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>;
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'issuedDate',
        header: 'Ngày xuất',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng giá trị',
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
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'DA_XUAT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'DA_XUAT' ? 'Đã xuất' : 'Đã hủy';
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem hóa đơn"
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
          <h1 className="text-2xl font-bold">Danh sách hóa đơn tài chính</h1>
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách hóa đơn...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết hóa đơn: ${selected?.invoiceCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã hóa đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Loại hóa đơn:</span>
                <p className="font-semibold">
                  {selected.invoiceType === 'BAN_LE' ? 'Bán lẻ' : selected.invoiceType === 'BAN_SI' ? 'Bán sỉ' : 'Trả hàng'}
                </p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày xuất hóa đơn:</span>
                <p className="font-mono">{selected.issuedDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Thuế suất VAT:</span>
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
              <span className="text-gray-500">Trạng thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_XUAT' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_XUAT' ? 'Đã xuất' : 'Đã hủy'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lập hóa đơn mới' : 'Sửa thông tin hóa đơn'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã hóa đơn *</label>
              <input
                type="text"
                value={editingItem.invoiceCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại hóa đơn *</label>
              <select
                value={editingItem.invoiceType || 'BAN_LE'}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceType: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="BAN_LE">Bán lẻ</option>

                <option value="BAN_SI">Bán sỉ (hợp đồng)</option>
                <option value="TRA_HANG">Hoàn trả / hủy hàng</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên khách hàng *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Ngày xuất hóa đơn *</label>
              <input
                type="date"
                value={editingItem.issuedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thuế suất VAT (%) *</label>
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
            <label className="block text-xs text-gray-500 mb-1">Tổng tiền hàng (trước thuế) *</label>
            <input
              type="number"
              value={editingItem.subTotal || 0}
              onChange={(e) => setEditingItem({ ...editingItem, subTotal: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'DA_XUAT'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="DA_XUAT">Đã xuất bản in / ký số</option>
              <option value="DA_HUY">Đã hủy hóa đơn</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
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
              Lưu hóa đơn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
