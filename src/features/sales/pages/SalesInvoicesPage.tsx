import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Receipt } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore } from '@/features/sales/store/salesStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

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

export function SalesInvoicesPage() {
  const { exportInvoices, fetchExportInvoices, addExportInvoice, updateExportInvoice, deleteExportInvoice } = useSalesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SalesInvoiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SalesInvoiceRecord>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchExportInvoices();
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách hóa đơn bán');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchExportInvoices]);

  const data = useMemo<SalesInvoiceRecord[]>(() => {
    return exportInvoices.map((inv) => ({
      id: inv.id,
      invoiceCode: inv.invoiceNumber,
      orderCode: inv.orderIds?.[0] || inv.invoiceNumber,
      customerName: inv.customerId || 'Khách lẻ',
      invoiceDate: inv.issueDate ? inv.issueDate.substring(0, 10) : '',
      dueDate: inv.dueDate ? inv.dueDate.substring(0, 10) : '',
      subTotal: inv.subtotal,
      discount: 0,
      totalAmount: inv.totalAmount,
      status: inv.status === 'PAID' ? 'DA_THANH_TOAN' : inv.status === 'CANCELLED' ? 'DA_HUY' : 'CHO_THANH_TOAN',
      notes: inv.notes,
    }));
  }, [exportInvoices]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.orderCode || !editingItem.customerName) return;

    try {
      const sub = Number(editingItem.subTotal || 0);
      const disc = Number(editingItem.discount || 0);
      const tot = sub - disc;

      const payload = {
        invoiceNumber: editingItem.invoiceCode,
        customerId: editingItem.customerName,
        taxId: 'VAT10',
        billingAddress: 'Hà Nội, Việt Nam',
        orderIds: [editingItem.orderCode],
        issueDate: editingItem.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: editingItem.dueDate || new Date().toISOString().split('T')[0],
        subtotal: sub,
        vatAmount: sub * 0.1,
        totalAmount: tot,
        status: (editingItem.status === 'DA_THANH_TOAN' ? 'PAID' : editingItem.status === 'DA_HUY' ? 'CANCELLED' : 'ISSUED') as any,
        paymentTerms: 'COD',
        notes: editingItem.notes || '',
      };

      if (modalMode === 'create') {
        await addExportInvoice(payload);
        toast.success('Tạo hóa đơn thành công!');
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

  const columns = useMemo<ColumnDef<SalesInvoiceRecord>[]>(
    () => [
      {
        accessorKey: 'invoiceCode',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn SO',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Tên khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Ngày hóa đơn',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Thành tiền',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass =
            status === 'DA_THANH_TOAN'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'CHO_THANH_TOAN'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800';
          const label = status === 'DA_THANH_TOAN' ? 'Đã thanh toán' : status === 'CHO_THANH_TOAN' ? 'Chờ thanh toán' : 'Đã hủy';
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
              title="Xem chi tiết"
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
          <h1 className="text-2xl font-bold">Hóa đơn bán hàng (đầu ra)</h1>
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách hóa đơn...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Hóa Đơn Bán: ${selected?.invoiceCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã hóa đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã đơn hàng (SO):</span>
                <p className="font-mono font-semibold">{selected.orderCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày hóa đơn:</span>
                <p className="font-mono">{selected.invoiceDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn thanh toán:</span>
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
              <span className="text-gray-500">Trạng thái:</span>
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
                  {selected.status === 'DA_THANH_TOAN' ? 'Đã thanh toán' : selected.status === 'CHO_THANH_TOAN' ? 'Chờ thanh toán' : 'Đã hủy'}
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
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lập hóa đơn bán mới' : 'Sửa thông tin hóa đơn bán'}
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
              <label className="block text-xs text-gray-500 mb-1">Mã đơn SO *</label>
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
            <label className="block text-xs text-gray-500 mb-1">Tên khách hàng *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Ngày hóa đơn *</label>
              <input
                type="date"
                value={editingItem.invoiceDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hạn thanh toán *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Thành tiền hàng *</label>
              <input
                type="number"
                value={editingItem.subTotal || 0}
                onChange={(e) => setEditingItem({ ...editingItem, subTotal: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Chiết khấu</label>
              <input
                type="number"
                value={editingItem.discount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, discount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái</label>
            <select
              value={editingItem.status || 'CHO_THANH_TOAN'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_THANH_TOAN">Chờ thanh toán</option>
              <option value="DA_THANH_TOAN">Đã thanh toán</option>
              <option value="DA_HUY">Đã hủy</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
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
              Lưu hóa đơn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
