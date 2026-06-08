import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Grid, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface ProductStorageRecord {
  id: string;
  sku: string;
  productName: string;
  branchName: string;
  zoneName: string;
  binName: string;
  quantity: number;
  status: 'BINH_THUONG' | 'DAY_KE' | 'TRONG_KE';
  notes?: string;
}

const MOCK_STORAGE: ProductStorageRecord[] = [
  {
    id: '1',
    sku: 'SKU-MILK-01',
    productName: 'Sữa Tươi Tiệt Trùng Vinamilk 1L',
    branchName: 'Chi nhánh Cầu Giấy',
    zoneName: 'Khu A - Thực phẩm mát',
    binName: 'Kệ A1 - Ngăn 3',
    quantity: 120,
    status: 'BINH_THUONG',
    notes: 'Bảo quản nhiệt độ dưới 25 độ C',
  },
  {
    id: '2',
    sku: 'SKU-COKE-02',
    productName: 'Nước Ngọt Coca Cola Lon 320ml',
    branchName: 'Chi nhánh Cầu Giấy',
    zoneName: 'Khu B - Nước giải khát',
    binName: 'Kệ B2 - Ngăn 1',
    quantity: 0,
    status: 'TRONG_KE',
    notes: 'Kệ trống cần lấy thêm hàng từ kho tổng bổ sung lên kệ bán',
  },
  {
    id: '3',
    sku: 'SKU-RICE-03',
    productName: 'Gạo Tám Thơm Điện Biên 5kg',
    branchName: 'Chi nhánh Thanh Xuân',
    zoneName: 'Khu C - Hàng khô',
    binName: 'Kệ C4 - Ngăn 2',
    quantity: 500,
    status: 'DAY_KE',
    notes: 'Sắp xếp đủ 500 túi, không xếp đè thêm',
  },
];

export function ProductInStoragesPage() {
  const [data, setData] = useState<ProductStorageRecord[]>(MOCK_STORAGE);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProductStorageRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ProductStorageRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.sku.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.zoneName.toLowerCase().includes(q) ||
        d.binName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenTransfer = (item: ProductStorageRecord) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.id) return;

    setData(
      data.map((d) => {
        if (d.id === editingItem.id) {
          const qty = Number(editingItem.quantity || 0);
          const status = qty === 0 ? 'TRONG_KE' : d.status;
          return {
            ...d,
            zoneName: editingItem.zoneName || d.zoneName,
            binName: editingItem.binName || d.binName,
            quantity: qty,
            status,
          };
        }
        return d;
      })
    );
    setIsModalOpen(false);
  };

  const columns = useMemo<ColumnDef<ProductStorageRecord>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'Mã SKU',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Tên Sản Phẩm',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'branchName',
        header: 'Chi Nhánh',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'zoneName',
        header: 'Phân Khu Kho',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'binName',
        header: 'Kệ / Ô Kệ',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'quantity',
        header: 'Số Lượng',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Tình Trạng Kệ',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-emerald-100 text-emerald-800';
          let label = 'Bình Thường';
          if (status === 'TRONG_KE') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Trống Kệ';
          } else if (status === 'DAY_KE') {
            badgeClass = 'bg-amber-100 text-amber-800';
            label = 'Đầy Kệ';
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
              title="Xem Chi Tiết Vị Trí"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenTransfer(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Đổi Vị Trí Kệ / Số Lượng"
            >
              <Edit className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold">Vị Trí Lưu Kho Hàng Hóa Chi Tiết</h1>
          <p className="text-sm text-gray-500">
            Xem vị trí phân khu kho, số ô kệ (bin) chi tiết của từng SKU mặt hàng, hỗ trợ xếp dỡ hàng hóa đúng ngăn kệ.
          </p>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã SKU, tên hàng, phân khu kho, số ô kệ..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Vị trí sản phẩm: ${selected?.productName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã SKU:</span>
                <p className="font-mono font-semibold">{selected.sku}</p>
              </div>
              <div>
                <span className="text-gray-500">Chi Nhánh:</span>
                <p className="font-semibold">{selected.branchName}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Sản Phẩm:</span>
              <p className="font-semibold text-base">{selected.productName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" /> Phân Khu Kho:
                </span>
                <p className="font-semibold">{selected.zoneName}</p>
              </div>
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Grid className="w-4 h-4 text-gray-400" /> Ô Kệ (Bin):
                </span>
                <p className="font-semibold text-blue-600">{selected.binName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Số Lượng Tồn Kệ:</span>
                <p className="font-mono font-bold text-lg text-emerald-600">{selected.quantity}</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng Thái Kệ:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.status === 'BINH_THUONG'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selected.status === 'TRONG_KE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {selected.status === 'BINH_THUONG' ? 'Đầy Đủ' : selected.status === 'TRONG_KE' ? 'Trống Kệ' : 'Đầy Kệ'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Vị Trí:</span>
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
        title="Điều Chuyển Vị Trí Lưu Kho / Sửa Số Lượng Kệ"
      >
        <form onSubmit={handleSaveTransfer} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mặt Hàng</label>
            <p className="font-semibold text-sm">{editingItem.productName} ({editingItem.sku})</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Phân Khu Kho *</label>
              <input
                type="text"
                value={editingItem.zoneName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, zoneName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Khu A, Khu B..."
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Số Ô Kệ (Bin) *</label>
              <input
                type="text"
                value={editingItem.binName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, binName: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Kệ A1 - Ngăn 1..."
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Số Lượng Trên Kệ *</label>
            <input
              type="number"
              value={editingItem.quantity || 0}
              onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
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
              Xác Nhận Thay Đổi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ProductInStoragesPage;
