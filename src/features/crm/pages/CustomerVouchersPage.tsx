import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';

interface VoucherRecord {
  id: string;
  customerId: string;
  customerName: string;
  voucherCode: string;
  issuedAt: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED' | 'REVOKED';
  notes: string;
  type?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  discountValue?: number;
  startDate?: string;
}

const generateVoucherCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VC2026-${randomPart}`;
};

export function CustomerVouchersPage() {
  const {
    customerVouchers: storeVouchers,
    fetchCustomerVouchers,
    addCustomerVoucher,
    updateCustomerVoucher,
    deleteCustomerVoucher,
    customers,
    fetchCustomers,
  } = useCrmStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchCustomerVouchers().finally(() => setIsLoading(false));
    fetchCustomers();
  }, [fetchCustomerVouchers, fetchCustomers]);

  const data = useMemo(() => {
    return storeVouchers.map((cv: any) => ({
      id: cv.id,
      customerId: cv.customerPhone || '1',
      customerName: cv.customerName,
      voucherCode: cv.voucherCode,
      issuedAt: cv.issueDate,
      startDate: cv.startDate || cv.issueDate,
      expiryDate: cv.expiryDate || '2026-12-31',
      status: (cv.status === 'UNUSED' ? 'ACTIVE' : cv.status) as any,
      notes: cv.voucherName,
      type: cv.type || 'FIXED_AMOUNT',
      discountValue: cv.discountValue || 0,
    }));
  }, [storeVouchers]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    voucherCode: '',
    status: 'ACTIVE' as any,
    notes: '',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type: 'FIXED_AMOUNT' as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING',
    discountValue: 0,
  });

  const handleDelete = async (item: any) => {
    if (!confirm(`Xóa voucher ${item.voucherCode} của khách ${item.customerName}?`)) return;
    try {
      await deleteCustomerVoucher(item.id);
      toast.success(`Đã xóa voucher ${item.voucherCode}`);
    } catch (err) {
      toast.error('Lỗi khi xóa voucher');
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      customerName: '',
      customerPhone: '',
      voucherCode: generateVoucherCode(),
      status: 'ACTIVE',
      notes: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'FIXED_AMOUNT',
      discountValue: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      customerName: item.customerName,
      customerPhone: item.customerId,
      voucherCode: item.voucherCode,
      status: item.status,
      notes: item.notes || '',
      startDate: item.startDate || new Date().toISOString().split('T')[0],
      expiryDate: item.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: item.type || 'FIXED_AMOUNT',
      discountValue: item.discountValue || 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateCustomerVoucher(editingItem.id, {
          customerName: form.customerName,
          voucherCode: form.voucherCode,
          status: form.status === 'ACTIVE' ? 'UNUSED' : (form.status as any),
        });
        toast.success('Cập nhật voucher khách hàng thành công');
      } else {
        await addCustomerVoucher({
          customerName: form.customerName || 'Khách vãng lai',
          customerPhone: form.customerPhone || '0900000000',
          voucherCode: form.voucherCode,
          voucherName: form.notes || 'Voucher tặng',
          discountValue: form.discountValue,
          issueDate: form.startDate,
          expiryDate: form.expiryDate,
          type: form.type,
          status: 'UNUSED',
        });
        toast.success('Cấp voucher cho khách hàng thành công');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving customer voucher:', err);
      toast.error('Không thể lưu voucher khách hàng');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (v) =>
        v.customerName.toLowerCase().includes(q) ||
        v.voucherCode.toLowerCase().includes(q) ||
        v.customerId.toLowerCase().includes(q)
    );
  }, [search, data]);

  const columns = useMemo<ColumnDef<VoucherRecord>[]>(
    () => [
      {
        accessorKey: 'voucherCode',
        header: 'Mã Voucher',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-white truncate block max-w-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'issuedAt',
        header: 'Ngày phát hành',
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: 'Ngày hết hạn',
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const styleMap: Record<string, string> = {
            ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
            EXPIRED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            USED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            REVOKED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
          };
          const labelMap: Record<string, string> = {
            ACTIVE: 'Hoạt động',
            EXPIRED: 'Hết hạn',
            USED: 'Đã sử dụng',
            REVOKED: 'Bị thu hồi',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleMap[status] || 'bg-gray-100 text-gray-800'}`}>{labelMap[status] || status}</span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ví voucher khách hàng</h1>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
              onClick={handleOpenCreate}
            >
              <Plus className="w-4 h-4" /> Tạo Voucher mới
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã voucher, khách hàng, hoặc ID..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row) => setSelected(row)} />
      </div>

      {/* Drawer chi tiết */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết Voucher: ${selected.voucherCode}` : ''} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Khách hàng</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mã Voucher</p>
                <p className="font-mono font-bold text-primary">{selected.voucherCode}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Ngày phát hành</p>
                <p className="font-medium">{selected.issuedAt}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ngày hết hạn</p>
                <p className="font-medium">{selected.expiryDate}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Trạng thái</p>
              <p>{selected.status}</p>
            </div>
            {selected.notes && (
              <div>
                <p className="text-xs text-gray-500">Ghi chú</p>
                <p className="italic text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal tạo / sửa voucher khách hàng */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Chỉnh sửa Voucher Khách Hàng' : 'Cấp Voucher cho Khách Hàng'} width="max-w-lg">
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã Voucher</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={form.voucherCode}
                onChange={(e) => setForm({ ...form, voucherCode: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, voucherCode: generateVoucherCode() })}
                className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                🎲 Tạo mã
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng</label>
            <input
              type="text"
              list="customer-suggestions"
              required
              placeholder="Gõ tên/SĐT/Mã KH để tìm..."
              value={form.customerName}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, customerName: val });
                const matched = (customers || []).find((c: any) => `${c.name} - ${c.phone}` === val);
                if (matched) {
                  setForm(prev => ({ ...prev, customerName: matched.name, customerPhone: matched.phone }));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
            <datalist id="customer-suggestions">
              {(customers || []).map((c: any) => (
                <option key={c.id} value={`${c.name} - ${c.phone}`} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hiệu lực</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn</label>
              <input
                type="date"
                required
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại voucher</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any, discountValue: e.target.value === 'FREE_SHIPPING' ? 0 : form.discountValue })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="PERCENTAGE">Giảm theo %</option>
                <option value="FIXED_AMOUNT">Giảm cố định</option>
                <option value="FREE_SHIPPING">Freeship</option>
              </select>
            </div>
            {form.type !== 'FREE_SHIPPING' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Giá trị ({form.type === 'PERCENTAGE' ? '%' : 'VNĐ'})
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={form.type === 'PERCENTAGE' ? 100 : undefined}
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="USED" disabled={!editingItem}>Đã sử dụng</option>
              <option value="EXPIRED" disabled={!editingItem}>Hết hạn</option>
              <option value="REVOKED" disabled={!editingItem}>Bị thu hồi</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
            >
              Lưu Voucher
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

