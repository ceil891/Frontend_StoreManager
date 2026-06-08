import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Tag, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

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
    customerName: 'Trần Thị B',
    voucherCode: 'VIP50',
    issuedAt: '2024-03-01',
    expiryDate: '2024-09-01',
    status: 'USED',
    notes: 'Ưu đãi VIP, đã sử dụng cho đơn 2024-04-10',
  },
  {
    id: '3',
    customerId: 'C003',
    customerName: 'Lê Công C',
    voucherCode: 'SUMMER25',
    issuedAt: '2024-06-01',
    expiryDate: '2024-08-31',
    status: 'EXPIRED',
  },
];

export function CustomerVouchersPage() {
  const [data] = useState<VoucherRecord[]>(MOCK_VOUCHERS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<VoucherRecord | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);

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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleMap[status]}`}>{labelMap[status] || status}</span>
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
              onClick={() => alert('Chỉnh sửa voucher: ' + row.original.voucherCode)}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => confirm('Xóa voucher ' + row.original.voucherCode + '?')}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ví Voucher Khách Hàng</h1>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
              onClick={() => setCreateOpen(true)}
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
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
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

      {/* Modal tạo mới (giao diện mẫu, chưa lưu) */}
      <Modal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} title="Tạo Voucher mới" width="max-w-lg">
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-400">Form tạo voucher sẽ được xây dựng ở đây.</p>
          <button className="mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded" onClick={() => alert('Chức năng lưu chưa triển khai')}>Lưu</button>
        </div>
      </Modal>
    </>
  );
}
