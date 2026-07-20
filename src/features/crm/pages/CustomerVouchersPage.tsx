import { useMemo, useState, useEffect, useCallback } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface VoucherRecord {
  id: string;
  customerId: string;
  customerName: string;
  voucherCode: string;
  issuedAt: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'USED' | 'REVOKED';
  notes?: string;
}

const MOCK_VOUCHERS: VoucherRecord[] = [
  {
    id: '1',
    customerId: 'C001',
    customerName: 'Nguyễn Văn A',
    voucherCode: 'WELCOME10',
    issuedAt: '2024-01-15',
    expiryDate: '2024-12-31',
    status: 'ACTIVE',
    notes: 'Mã chào mừng lần đầu mua hàng',
  },
  {
    id: '2',
    customerId: 'C002',
    customerName: 'Trần thị B',
    voucherCode: 'VIP50',
    issuedAt: '2024-03-01',
    expiryDate: '2024-09-01',
    status: 'USED',
    notes: 'Ưu đãi VIP, đã sử dụng cho đơn 2024-04-10',
  },
  {
    id: '3',
    customerId: 'C003',
    customerName: 'Lê công C',
    voucherCode: 'SUMMER25',
    issuedAt: '2024-06-01',
    expiryDate: '2024-08-31',
    status: 'EXPIRED',
  },
];

export function CustomerVouchersPage() {
  const [data, setData] = useState<VoucherRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<VoucherRecord | null>(null);
  
  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VoucherRecord | null>(null);
  const [form, setForm] = useState({
    customerId: '1',
    customerName: '',
    voucherCode: '',
    status: 'ACTIVE' as VoucherRecord['status'],
    notes: '',
  });

  const fetchCustomerVouchers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await axiosClient.get('/crm/customer-vouchers');
      const list = Array.isArray(res) ? res : res?.content || res?.data || [];
      if (list.length > 0) {
        const mapped: VoucherRecord[] = list.map((item: any) => ({
          id: String(item.id),
          customerId: item.customer?.id ? String(item.customer.id) : 'CUST-0',
          customerName: item.customer?.name || item.customerName || 'Khách hàng',
          voucherCode: item.voucher?.voucherCode || item.voucherCode || `VC-${item.id}`,
          issuedAt: item.collectedAt ? String(item.collectedAt).split('T')[0] : '2024-01-01',
          expiryDate: item.expiredAt ? String(item.expiredAt).split('T')[0] : '2024-12-31',
          status: item.status === 'UNUSED' ? 'ACTIVE' : (item.status || 'ACTIVE'),
          notes: item.notes || '',
        }));
        setData(mapped);
      } else {
        setData(MOCK_VOUCHERS);
      }
    } catch (err) {
      console.error('Error fetching customer vouchers:', err);
      toast.error('Lỗi khi tải ví voucher khách hàng, dùng dữ liệu tạm');
      setData(MOCK_VOUCHERS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomerVouchers();
  }, [fetchCustomerVouchers]);

  const handleDelete = async (item: VoucherRecord) => {
    if (!confirm(`Xóa voucher ${item.voucherCode} của khách ${item.customerName}?`)) return;
    try {
      await axiosClient.delete(`/crm/customer-vouchers/${item.id}`);
      toast.success(`Đã xóa voucher ${item.voucherCode}`);
      setData((prev) => prev.filter((v) => v.id !== item.id));
    } catch (err) {
      console.error('Error deleting customer voucher:', err);
      toast.error('Lỗi khi xóa voucher');
    }
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      customerId: '1',
      customerName: '',
      voucherCode: `CUST-VC-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'ACTIVE',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: VoucherRecord) => {
    setEditingItem(item);
    setForm({
      customerId: item.customerId,
      customerName: item.customerName,
      voucherCode: item.voucherCode,
      status: item.status,
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      status: form.status,
      notes: form.notes,
    };
    try {
      if (editingItem) {
        await axiosClient.put(`/crm/customer-vouchers/${editingItem.id}`, payload);
        toast.success(`Cập nhật voucher ${form.voucherCode} thành công!`);
      } else {
        await axiosClient.post('/crm/customer-vouchers', payload);
        toast.success(`Tạo voucher mới cho khách hàng thành công!`);
      }
      setIsModalOpen(false);
      fetchCustomerVouchers();
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
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết Voucher: ${selected.voucherCode}` : ''} width="max-w-lg">
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
      </Drawer>

      {/* Modal tạo / sửa voucher khách hàng */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Chỉnh sửa Voucher Khách Hàng' : 'Cấp Voucher cho Khách Hàng'} width="max-w-lg">
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã Voucher</label>
            <input
              type="text"
              required
              value={form.voucherCode}
              onChange={(e) => setForm({ ...form, voucherCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên khách hàng</label>
            <input
              type="text"
              required
              placeholder="Nhập tên khách hàng"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="ACTIVE">Hoạt động</option>
              <option value="USED">Đã sử dụng</option>
              <option value="EXPIRED">Hết hạn</option>
              <option value="REVOKED">Bị thu hồi</option>
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

