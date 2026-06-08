import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Clock } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface SaleOfferRecord {
  id: string;
  offerCode: string;
  customerName: string;
  offerDate: string;
  expiryDate: string;
  totalAmount: number;
  salesperson: string;
  status: 'CHO_DUYET' | 'DA_CHAP_NHAN' | 'DA_TU_CHOI' | 'HET_HAN';
  notes?: string;
}

const MOCK_OFFERS: SaleOfferRecord[] = [
  {
    id: '1',
    offerCode: 'OF-2026-001',
    customerName: 'Công Ty TNHH Hoàng Phong',
    offerDate: '2026-06-01',
    expiryDate: '2026-06-15',
    totalAmount: 150000000,
    salesperson: 'Trần Văn Thịnh',
    status: 'CHO_DUYET',
    notes: 'Báo giá lô hàng điện tử gia dụng văn phòng, chiết khấu dự kiến 5%',
  },
  {
    id: '2',
    offerCode: 'OF-2026-002',
    customerName: 'Siêu Thị Mini Mart Cầu Giấy',
    offerDate: '2026-05-20',
    expiryDate: '2026-06-03',
    totalAmount: 35000000,
    salesperson: 'Nguyễn Thị Hương',
    status: 'DA_CHAP_NHAN',
    notes: 'Khách hàng đã đồng ý giá và ký hợp đồng nguyên tắc',
  },
  {
    id: '3',
    offerCode: 'OF-2026-003',
    customerName: 'Đại Lý Tạp Hóa Bình An',
    offerDate: '2026-05-10',
    expiryDate: '2026-05-24',
    totalAmount: 18000000,
    salesperson: 'Trần Văn Thịnh',
    status: 'HET_HAN',
    notes: 'Quá hạn chốt báo giá, khách hàng không phản hồi lại',
  },
];

export function SaleOffersPage() {
  const [data, setData] = useState<SaleOfferRecord[]>(MOCK_OFFERS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SaleOfferRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SaleOfferRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.offerCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.salesperson.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      offerCode: `OF-2026-${Date.now().toString().slice(-4)}`,
      customerName: '',
      offerDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      totalAmount: 0,
      salesperson: '',
      status: 'CHO_DUYET',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SaleOfferRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.offerCode || !editingItem.customerName) return;

    if (modalMode === 'create') {
      const newItem: SaleOfferRecord = {
        id: String(data.length + 1),
        offerCode: editingItem.offerCode!,
        customerName: editingItem.customerName!,
        offerDate: editingItem.offerDate!,
        expiryDate: editingItem.expiryDate || editingItem.offerDate!,
        totalAmount: Number(editingItem.totalAmount || 0),
        salesperson: editingItem.salesperson || '',
        status: editingItem.status as any || 'CHO_DUYET',
        notes: editingItem.notes,
      };
      setData([...data, newItem]);
    } else {
      setData(data.map((d) => (d.id === editingItem.id ? (editingItem as SaleOfferRecord) : d)));
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa báo giá này?')) {
      setData(data.filter((d) => d.id !== id));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<SaleOfferRecord>[]>(
    () => [
      {
        accessorKey: 'offerCode',
        header: 'Mã Báo Giá',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách Hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'offerDate',
        header: 'Ngày Báo Giá',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng Báo Giá',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'salesperson',
        header: 'Nhân Viên Lập',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ Duyệt';
          if (status === 'DA_CHAP_NHAN') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã Chấp Nhận';
          } else if (status === 'DA_TU_CHOI') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã Từ Chối';
          } else if (status === 'HET_HAN') {
            badgeClass = 'bg-gray-100 text-gray-800';
            label = 'Hết Hạn';
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
              title="Xem Chi Tiết Báo Giá"
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
          <h1 className="text-2xl font-bold">Báo Giá Khách Hàng (Sale Offers)</h1>
          <p className="text-sm text-gray-500">
            Tạo và theo dõi các báo giá bán sỉ/hợp đồng gửi cho khách hàng, quản lý vòng đời duyệt báo giá.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Báo Giá Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã báo giá, tên khách hàng, nhân viên lập..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Báo Giá: ${selected?.offerCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã Báo Giá:</span>
                <p className="font-mono font-semibold">{selected.offerCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Nhân Viên Kinh Doanh:</span>
                <p>{selected.salesperson}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách Hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày Tạo Báo Giá:</span>
                <p className="font-mono">{selected.offerDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn Hiệu Lực:</span>
                <p className="font-mono">{selected.expiryDate}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tổng Giá Trị Dự Kiến:</span>
              <p className="font-mono font-bold text-emerald-600 text-lg">{formatCurrency(selected.totalAmount)}</p>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Báo Giá:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_CHAP_NHAN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_DUYET'
                      ? 'bg-amber-100 text-amber-800'
                      : selected.status === 'DA_TU_CHOI'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selected.status === 'DA_CHAP_NHAN'
                    ? 'Đã Chấp Nhận'
                    : selected.status === 'CHO_DUYET'
                    ? 'Chờ Duyệt'
                    : selected.status === 'DA_TU_CHOI'
                    ? 'Đã Từ Chối'
                    : 'Hết Hạn'}
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
        title={modalMode === 'create' ? 'Tạo Báo Giá Bán Hàng Mới' : 'Sửa Báo Giá'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã Báo Giá *</label>
              <input
                type="text"
                value={editingItem.offerCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, offerCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nhân Viên Kinh Doanh *</label>
              <input
                type="text"
                value={editingItem.salesperson || ''}
                onChange={(e) => setEditingItem({ ...editingItem, salesperson: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên Khách Hàng *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Công ty, tổ chức hoặc khách mua sỉ"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày Báo Giá *</label>
              <input
                type="date"
                value={editingItem.offerDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, offerDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hạn Hiệu Lực Báo Giá *</label>
              <input
                type="date"
                value={editingItem.expiryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tổng Giá Trị Dự Kiến (VND) *</label>
            <input
              type="number"
              value={editingItem.totalAmount || 0}
              onChange={(e) => setEditingItem({ ...editingItem, totalAmount: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng Thái *</label>
            <select
              value={editingItem.status || 'CHO_DUYET'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_DUYET">Chờ Duyệt</option>
              <option value="DA_CHAP_NHAN">Đã Chấp Nhận</option>
              <option value="DA_TU_CHOI">Đã Từ Chối</option>
              <option value="HET_HAN">Hết Hiệu Lực</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi Chú Chi Tiết</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết sản phẩm, mức chiết khấu..."
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
              Lưu Báo Giá
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
