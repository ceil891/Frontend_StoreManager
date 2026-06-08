import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, CheckCircle, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface ClaimRecord {
  id: string;
  warrantyCode: string;
  claimCode: string;
  description: string;
  reportedAt: string;
  handler: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

const MOCK_CLAIMS: ClaimRecord[] = [
  {
    id: '1',
    warrantyCode: 'W001',
    claimCode: 'CLM001',
    description: 'Màn hình lỗi hiển thị chấm màu',
    reportedAt: '2024-05-10',
    handler: 'Nguyễn Văn Hậu',
    status: 'PENDING',
    notes: 'Khách hàng muốn đổi mới',
  },
  {
    id: '2',
    warrantyCode: 'W002',
    claimCode: 'CLM002',
    description: 'Pin không sạc',
    reportedAt: '2024-04-22',
    handler: 'Lê Thị Mai',
    status: 'APPROVED',
  },
  {
    id: '3',
    warrantyCode: 'W003',
    claimCode: 'CLM003',
    description: 'Bàn phím kẹt phím',
    reportedAt: '2024-03-15',
    handler: 'Trần Văn Dũng',
    status: 'REJECTED',
    notes: 'Không đủ điều kiện bảo hành',
  },
];

export function WarrantyClaimsPage() {
  const [data] = useState<ClaimRecord[]>(MOCK_CLAIMS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClaimRecord | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (c) =>
        c.claimCode.toLowerCase().includes(q) ||
        c.warrantyCode.toLowerCase().includes(q) ||
        c.handler.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [search, data]);

  const columns = useMemo<ColumnDef<ClaimRecord>[]>(
    () => [
      {
        accessorKey: 'claimCode',
        header: 'Mã Yêu cầu',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'warrantyCode',
        header: 'Mã Bảo hành',
        cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: (info) => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'reportedAt',
        header: 'Ngày báo cáo',
        cell: (info) => <span className="text-sm font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'handler',
        header: 'Người xử lý',
        cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const styleMap: Record<string, string> = {
            PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
            APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
            REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
          };
          const labelMap: Record<string, string> = {
            PENDING: 'Đang chờ',
            APPROVED: 'Đã duyệt',
            REJECTED: 'Từ chối',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleMap[status]}`}>
              {labelMap[status]}
            </span>
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
              onClick={() => alert('Chỉnh sửa yêu cầu: ' + row.original.claimCode)}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => confirm('Xóa yêu cầu ' + row.original.claimCode + '?')}
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu cầu Bảo hành</h1>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4" /> Tạo mới
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
              placeholder="Tìm kiếm mã yêu cầu, mã bảo hành, người xử lý..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      </div>

      {/* Drawer chi tiết */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết Yêu cầu: ${selected.claimCode}` : ''} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Mã Yêu cầu</p>
                <p className="font-mono font-bold text-primary">{selected.claimCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mã Bảo hành</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.warrantyCode}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Mô tả</p>
                <p className="italic text-gray-700 dark:text-gray-300">{selected.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ngày báo cáo</p>
                <p className="font-medium">{selected.reportedAt}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Người xử lý</p>
                <p className="font-medium">{selected.handler}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Trạng thái</p>
                <p>{selected.status}</p>
              </div>
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

      {/* Modal tạo mới (placeholder) */}
      <Modal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} title="Tạo Yêu cầu Bảo hành" width="max-w-lg">
        <div className="p-4">
          <p className="text-gray-600 dark:text-gray-400">Form tạo yêu cầu sẽ được xây dựng ở đây.</p>
          <button className="mt-4 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded" onClick={() => alert('Chức năng lưu chưa triển khai')}>Lưu</button>
        </div>
      </Modal>
    </>
  );
}
