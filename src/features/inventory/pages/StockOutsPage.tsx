import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';

interface StockOutRecord {
  id: string;
  stockOutCode: string;
  outType: 'BAN_HANG' | 'TRA_NCC' | 'HUY_HANG_HONG' | 'CHUYEN_KHO';
  issuedDate: string;
  totalItems: number;
  totalValue: number;
  creator: string;
  status: 'CHO_XU-LY' | 'DA_XUAT' | 'DA_HUY';
  notes?: string;
}

const MOCK_STOCK_OUTS: StockOutRecord[] = [
  {
    id: '1',
    stockOutCode: 'SOUT-2026-001',
    outType: 'BAN_HANG',
    issuedDate: '2026-06-04',
    totalItems: 12,
    totalValue: 5400000,
    creator: 'Lưu hữu phước',
    status: 'DA_XUAT',
    notes: 'Xuất kho cho đơn hàng SO-2026-001 gửi GHTK',
  },
  {
    id: '2',
    stockOutCode: 'SOUT-2026-002',
    outType: 'TRA_NCC',
    issuedDate: '2026-06-03',
    totalItems: 100,
    totalValue: 12000000,
    creator: 'Nguyễn Văn thủ kho',
    status: 'DA_XUAT',
    notes: 'Xuất trả lô nước ngọt hết hạn cho Nhà Cung Cấp Toàn Cầu',
  },
  {
    id: '3',
    stockOutCode: 'SOUT-2026-003',
    outType: 'HUY_HANG_HONG',
    issuedDate: '2026-06-02',
    totalItems: 5,
    totalValue: 250000,
    creator: 'Trần thị kiểm kho',
    status: 'CHO_XU-LY',
    notes: 'Yêu cầu xuất hủy 5 hộp sữa bị hỏng móp do chuột cắn',
  },
];

export function StockOutsPage() {
  const { cancelIssues: data, fetchCancelIssues } = useInventoryStore();

  useEffect(() => {
    fetchCancelIssues();
  }, [fetchCancelIssues]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<any>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d: any) =>
        d.issueCode.toLowerCase().includes(q) ||
        d.reportedBy.toLowerCase().includes(q) ||
        d.reason.toLowerCase().includes(q)
    );

  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      issueCode: `SOUT-2026-${Date.now().toString().slice(-4)}`,
      reason: 'BAN_HANG',
      loggedDate: new Date().toISOString().split('T')[0],
      quantity: 0,
      totalValuation: 0,
      reportedBy: '',
      status: 'PENDING_APPROVAL',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.issueCode || !editingItem.reportedBy) return;

    if (modalMode === 'create') {
      console.warn("Please use store addCancelIssue");
    } else {
      console.warn("Please use store updateCancelIssue");
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    console.warn("Please use store deleteCancelIssue");
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'issueCode',
        header: 'Mã xuất kho',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'loggedDate',
        header: 'Ngày yêu cầu',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'reason',
        header: 'Loại xuất',
        cell: (info) => {
          const type = info.getValue() as string;
          let label = type;
          if (type === 'DAMAGED') label = 'Hàng hỏng';
          else if (type === 'EXPIRED') label = 'Hết hạn';
          else if (type === 'LOST') label = 'Mất mát';
          return <span className="font-semibold text-gray-700">{label}</span>;
        },
      },
      {
        accessorKey: 'quantity',
        header: 'Số lượng',
        cell: (info) => <span className="font-mono font-bold">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'totalValuation',
        header: 'Tổng giá trị',
        cell: (info) => <span className="font-mono text-blue-600 font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'reportedBy',
        header: 'Người lập phiếu',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ xử lý';
          if (status === 'PENDING_APPROVAL') {
            badgeClass = 'bg-amber-100 text-amber-800';
            label = 'Chờ xử lý';
          } else if (status === 'REJECTED' || status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã hủy';
          }
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button onClick={() => setSelected(row.original)} className="p-1 text-gray-500 hover:text-emerald-600 rounded"><Eye className="w-4 h-4" /></button>
            <button onClick={() => handleOpenEdit(row.original)} className="p-1 text-gray-500 hover:text-blue-600 rounded"><Edit className="w-4 h-4" /></button>
            <button onClick={() => handleDelete(row.original.id)} className="p-1 text-gray-500 hover:text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
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
          <h1 className="text-2xl font-bold">Phiếu xuất kho (stock outs)</h1>
          <p className="text-sm text-gray-500">Xem danh sách, quản lý xuất kho hàng hóa.</p>
        </div>
        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition">
          <Plus className="w-4 h-4" /> Lập Phiếu Xuất Kho
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu xuất, người lập, loại xuất kho..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={`Chi tiết xuất kho: ${selected?.issueCode}`}>
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã phiếu xuất:</span>
                <p className="font-mono font-semibold">{selected.issueCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Loại xuất:</span>
                <p>{selected.reason}</p>
              </div>
            </div>
            {selected.notes && <p className="text-gray-600 italic">"{selected.notes}"</p>}
          </div>
        )}
      </Drawer>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Lập phiếu xuất kho mới' : 'Sửa thông tin phiếu xuất'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã phiếu xuất *</label>
              <input
                type="text"
                value={editingItem.issueCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issueCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="SOUT-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại xuất kho *</label>
              <select
                value={editingItem.reason || 'DAMAGED'}
                onChange={(e) => setEditingItem({ ...editingItem, reason: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="DAMAGED">Hàng hỏng</option>
                <option value="EXPIRED">Hết hạn</option>
                <option value="LOST">Mất mát</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người lập phiếu *</label>
              <input
                type="text"
                value={editingItem.reportedBy || ''}
                onChange={(e) => setEditingItem({ ...editingItem, reportedBy: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên..."
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Xuất (Yêu cầu)</label>
              <input
                type="date"
                value={editingItem.loggedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, loggedDate: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng số lượng *</label>
              <input
                type="number"
                value={editingItem.quantity || 0}
                onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng giá trị ước tính (VND) *</label>
              <input
                type="number"
                value={editingItem.totalValuation || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalValuation: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái xử lý</label>
            <select
              value={editingItem.status || 'PENDING_APPROVAL'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="PENDING_APPROVAL">Chờ xử lý Duyệt</option>
              <option value="APPROVED">Đã Duyệt / đã xuất</option>
              <option value="REJECTED">Hủy bỏ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết sản phẩm..."
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
              Lưu phiếu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
