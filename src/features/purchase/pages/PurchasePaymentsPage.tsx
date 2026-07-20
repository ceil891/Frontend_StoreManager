import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface PurchasePaymentRecord {
  id: string;
  paymentCode: string;
  invoiceCode: string;
  supplierName: string;
  paymentMethod: 'TIEN_MAT' | 'CHUYEN_KHOAN' | 'THE' | 'CONG_NO';
  paymentDate: string;
  amount: number;
  handler: string;
  status: 'CHO_DUYET' | 'DA_THANH_TOAN' | 'DA_HUY';
  notes?: string;
}

export function PurchasePaymentsPage() {
  const [data, setData] = useState<PurchasePaymentRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PurchasePaymentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<PurchasePaymentRecord>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/finance/payment-vouchers');
      const list = Array.isArray(res) ? res : res?.content || [];
      const mapped: PurchasePaymentRecord[] = list.map((item: any) => {
        const status: PurchasePaymentRecord['status'] =
          item.status === 'COMPLETED'
            ? 'DA_THANH_TOAN'
            : item.status === 'CANCELLED'
              ? 'DA_HUY'
              : 'CHO_DUYET';
        return {
          id: String(item.id),
          paymentCode: item.voucherCode || '',
          invoiceCode: `INV-${item.id}`,
          supplierName: item.payerName || 'NCC',
          paymentMethod: 'CHUYEN_KHOAN' as const,
          paymentDate: item.voucherDate ? String(item.voucherDate).substring(0, 10) : '',
          amount: item.amount || 0,
          handler: 'Kế toán',
          status,
        };
      });
      setData(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách phiếu chi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.paymentCode.toLowerCase().includes(q) ||
        d.invoiceCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q) ||
        d.handler.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      paymentCode: `PAY-PUR-${Date.now().toString().slice(-4)}`,
      invoiceCode: '',
      supplierName: '',
      paymentMethod: 'CHUYEN_KHOAN',
      paymentDate: new Date().toISOString().split('T')[0],
      amount: 0,
      handler: '',
      status: 'CHO_DUYET',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: PurchasePaymentRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.paymentCode || !editingItem.invoiceCode || !editingItem.supplierName) return;

    try {
      if (modalMode === 'create') {
        await axiosClient.post('/finance/payment-vouchers', {
          voucherCode: editingItem.paymentCode,
          payerName: editingItem.supplierName,
          voucherDate: editingItem.paymentDate,
          amount: Number(editingItem.amount || 0),
          reason: editingItem.notes || '',
        });
        toast.success('Tạo phiếu chi thành công');
      } else {
        await axiosClient.put(`/finance/payment-vouchers/${editingItem.id}`, {
          voucherCode: editingItem.paymentCode,
          payerName: editingItem.supplierName,
          voucherDate: editingItem.paymentDate,
          amount: Number(editingItem.amount || 0),
          reason: editingItem.notes || '',
        });
        toast.success('Cập nhật phiếu chi thành công');
      }
      setIsModalOpen(false);
      await fetchPayments();
    } catch (err) {
      console.error(err);
      toast.error('Lưu phiếu chi thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiếu chi này?')) {
      try {
        await axiosClient.delete(`/finance/payment-vouchers/${id}`);
        toast.success('Đã xóa phiếu chi');
        await fetchPayments();
      } catch (err) {
        console.error(err);
        toast.error('Xóa phiếu chi thất bại');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<PurchasePaymentRecord>[]>(
    () => [
      {
        accessorKey: 'paymentCode',
        header: 'Mã phiếu chi',
        cell: (info) => <span className="font-mono font-bold text-red-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceCode',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'amount',
        header: 'Số tiền chi',
        cell: (info) => <span className="font-mono font-bold text-red-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'paymentMethod',
        header: 'Hình thức',
        cell: (info) => {
          const val = info.getValue() as string;
          const label = val === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : val === 'TIEN_MAT' ? 'Tiền mặt' : val === 'THE' ? 'Thẻ' : 'Công nợ';
          return <span className="text-gray-700 dark:text-gray-300">{label}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass =
            status === 'DA_THANH_TOAN'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'CHO_DUYET'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800';
          const label = status === 'DA_THANH_TOAN' ? 'Đã thanh toán' : status === 'CHO_DUYET' ? 'Chờ Duyệt' : 'Đã hủy';
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
          <h1 className="text-2xl font-bold">Thanh toán đơn mua hàng (phiếu chi)</h1>
          <p className="text-sm text-gray-500">
            Quản lý chi tiết giao dịch chi tiền thanh toán cho nhà cung cấp để ghi nhận giảm công nợ đầu vào.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Lập Phiếu Chi Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu chi, mã hóa đơn, nhà cung cấp, người lập..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Phiếu Chi: ${selected?.paymentCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã phiếu chi:</span>
                <p className="font-mono font-semibold text-red-600">{selected.paymentCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã hóa đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nhà cung cấp:</span>
              <p className="font-semibold">{selected.supplierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Số tiền thanh toán:</span>
                <p className="font-mono font-bold text-red-600">{formatCurrency(selected.amount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Phương thức:</span>
                <p>
                  {selected.paymentMethod === 'CHUYEN_KHOAN'
                    ? 'Chuyển khoản'
                    : selected.paymentMethod === 'TIEN_MAT'
                    ? 'Tiền mặt'
                    : selected.paymentMethod === 'THE'
                    ? 'Thẻ'
                    : 'Công nợ'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày thanh toán:</span>
                <p className="font-mono">{selected.paymentDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Người thực hiện:</span>
                <p>{selected.handler || 'Hệ thống'}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_THANH_TOAN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_DUYET'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_THANH_TOAN' ? 'Đã thanh toán' : selected.status === 'CHO_DUYET' ? 'Chờ Duyệt' : 'Đã hủy'}
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
        title={modalMode === 'create' ? 'Lập phiếu chi mới' : 'Sửa thông tin phiếu chi'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã phiếu chi *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Mã hóa đơn *</label>
              <input
                type="text"
                value={editingItem.invoiceCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="INV-PUR-2026-XXX"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Nhà cung cấp *</label>
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
              <label className="block text-xs text-gray-500 mb-1">Số tiền thanh toán *</label>
              <input
                type="number"
                value={editingItem.amount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, amount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hình thức chi *</label>
              <select
                value={editingItem.paymentMethod || 'CHUYEN_KHOAN'}
                onChange={(e) => setEditingItem({ ...editingItem, paymentMethod: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="CHUYEN_KHOAN">Chuyển khoản</option>
                <option value="TIEN_MAT">Tiền mặt</option>
                <option value="THE">Thẻ</option>
                <option value="CONG_NO">Công nợ</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày thanh toán *</label>
              <input
                type="date"
                value={editingItem.paymentDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, paymentDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người thực hiện</label>
              <input
                type="text"
                value={editingItem.handler || ''}
                onChange={(e) => setEditingItem({ ...editingItem, handler: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên người duyệt/thực hiện"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng trái *</label>
            <select
              value={editingItem.status || 'CHO_DUYET'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_DUYET">Chờ Duyệt</option>
              <option value="DA_THANH_TOAN">Đã chi trả (thành công)</option>
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
              placeholder="Chi tiết chuyển khoản, chứng từ đối chiếu..."
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
              Lưu phiếu chi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
