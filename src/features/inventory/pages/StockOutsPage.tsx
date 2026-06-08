import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

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
    creator: 'Lưu Hữu Phước',
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
    creator: 'Nguyễn Văn Thủ Kho',
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
    creator: 'Trần Thị Kiểm Kho',
    status: 'CHO_XU-LY',
    notes: 'Yêu cầu xuất hủy 5 hộp sữa bị hỏng móp do chuột cắn',
  },
];

export function StockOutsPage() {
  const [data, setData] = useState<StockOutRecord[]>(MOCK_STOCK_OUTS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StockOutRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<StockOutRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.stockOutCode.toLowerCase().includes(q) ||
        d.creator.toLowerCase().includes(q) ||
        d.outType.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      stockOutCode: `SOUT-2026-${Date.now().toString().slice(-4)}`,
      outType: 'BAN_HANG',
      issuedDate: new Date().toISOString().split('T')[0],
      totalItems: 0,
      totalValue: 0,
      creator: '',
      status: 'CHO_XU-LY',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: StockOutRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.stockOutCode || !editingItem.creator) return;

    if (modalMode === 'create') {
      const newItem: StockOutRecord = {
        id: String(data.length + 1),
        stockOutCode: editingItem.stockOutCode!,
        outType: editingItem.outType as any || 'BAN_HANG',
        issuedDate: editingItem.issuedDate!,
        totalItems: Number(editingItem.totalItems || 0),
        totalValue: Number(editingItem.totalValue || 0),
        creator: editingItem.creator!,
        status: editingItem.status as any || 'CHO_XU-LY',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as StockOutRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiếu xuất kho này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<StockOutRecord>[]>(
    () => [
      {
        accessorKey: 'stockOutCode',
        header: 'Mã Phiếu Xuất',
        cell: (info) => <span className="font-mono font-bold text-red-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'outType',
        header: 'Loại Xuất Kho',
        cell: (info) => {
          const val = info.getValue() as string;
          let label = 'Bán Hàng';
          let color = 'text-blue-600 bg-blue-50 dark:bg-blue-900/30';
          if (val === 'TRA_NCC') {
            label = 'Trả Nhà CC';
            color = 'text-purple-600 bg-purple-50 dark:bg-purple-900/30';
          } else if (val === 'HUY_HANG_HONG') {
            label = 'Hủy Hàng Hỏng';
            color = 'text-red-600 bg-red-50 dark:bg-red-900/30';
          } else if (val === 'CHUYEN_KHO') {
            label = 'Chuyển Kho';
            color = 'text-amber-600 bg-amber-50 dark:bg-amber-900/30';
          }
          return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>;
        },
      },
      {
        accessorKey: 'issuedDate',
        header: 'Ngày Xuất',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalItems',
        header: 'Số Lượng',
        cell: (info) => <span className="font-mono">{info.getValue() as number} mã</span>,
      },
      {
        accessorKey: 'totalValue',
        header: 'Giá Trị Xuất',
        cell: (info) => <span className="font-mono font-bold text-red-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ Xử Lý';
          if (status === 'DA_XUAT') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Xuất Kho';
          } else if (status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã Hủy';
          }
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
              title="Xem Chi Tiết Phiếu"
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
          <h1 className="text-2xl font-bold">Phiếu Xuất Kho (Stock Outs)</h1>
          <p className="text-sm text-gray-500">
            Xem danh sách, quản lý xuất kho hàng hóa phục vụ bán lẻ, trả nhà cung cấp, hoặc tiêu hủy hàng hỏng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
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

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết phiếu xuất: ${selected?.stockOutCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Phiếu Xuất:</span>
                <p className="font-mono font-semibold text-red-600">{selected.stockOutCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Loại Xuất Kho:</span>
                <p className="font-semibold">
                  {selected.outType === 'BAN_HANG'
                    ? 'Bán Hàng'
                    : selected.outType === 'TRA_NCC'
                    ? 'Trả Nhà Cung Cấp'
                    : selected.outType === 'HUY_HANG_HONG'
                    ? 'Hủy Hàng Hỏng'
                    : 'Chuyển Kho'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Xuất Kho:</span>
                <p className="font-mono">{selected.issuedDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Người Lập Phiếu:</span>
                <p>{selected.creator}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Tổng Số Mặt Hàng:</span>
                <p className="font-mono font-bold">{selected.totalItems} món</p>
              </div>
              <div>
                <span className="text-gray-500">Giá Trị Xuất Kho:</span>
                <p className="font-mono font-bold text-red-600 text-lg">{formatCurrency(selected.totalValue)}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Phiếu:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_XUAT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_XU-LY'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_XUAT' ? 'Đã Xuất Kho' : selected.status === 'CHO_XU-LY' ? 'Chờ Xử Lý' : 'Đã Hủy'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Chi Tiết:</span>
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
        title={modalMode === 'create' ? 'Lập Phiếu Xuất Kho Mới' : 'Sửa Thông Tin Phiếu Xuất'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Phiếu Xuất *</label>
              <input
                type="text"
                value={editingItem.stockOutCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, stockOutCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại Xuất Kho *</label>
              <select
                value={editingItem.outType || 'BAN_HANG'}
                onChange={(e) => setEditingItem({ ...editingItem, outType: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="BAN_HANG">Xuất Bán Hàng (SO/POS)</option>
                <option value="TRA_NCC">Xuất Trả Hàng Nhà Cung Cấp</option>
                <option value="HUY_HANG_HONG">Xuất Tiêu Hủy Hàng Hỏng</option>
                <option value="CHUYEN_KHO">Xuất Điều Chuyển Nội Bộ</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Lập Phiếu *</label>
              <input
                type="date"
                value={editingItem.issuedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, issuedDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Người Lập Phiếu *</label>
              <input
                type="text"
                value={editingItem.creator || ''}
                onChange={(e) => setEditingItem({ ...editingItem, creator: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên lập"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Số Lượng Mặt Hàng *</label>
              <input
                type="number"
                value={editingItem.totalItems || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalItems: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng Giá Trị Xuất (VND) *</label>
              <input
                type="number"
                value={editingItem.totalValue || 0}
                onChange={(e) => setEditingItem({ ...editingItem, totalValue: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái Xử Lý *</label>
            <select
              value={editingItem.status || 'CHO_XU-LY'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_XU-LY">Chờ Xử Lý (Soạn hàng/Đóng gói)</option>
              <option value="DA_XUAT">Đã Xác Nhận Xuất Hàng Khỏi Kho</option>
              <option value="DA_HUY">Đã Hủy Phiếu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú</label>
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
              Lưu Phiếu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
