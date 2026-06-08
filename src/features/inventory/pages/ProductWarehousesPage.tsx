import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, MapPin, Building, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface ProductWarehouseRecord {
  id: string;
  sku: string;
  productName: string;
  warehouseName: string;
  quantity: number;
  availableQuantity: number;
  inTransitQuantity: number;
  status: 'CON_HANG' | 'SAP_HET' | 'CHAY_HANG';
  notes?: string;
}

const MOCK_WAREHOUSE_STOCK: ProductWarehouseRecord[] = [
  {
    id: '1',
    sku: 'SKU-MILK-01',
    productName: 'Sữa Tươi Tiệt Trùng Vinamilk 1L',
    warehouseName: 'Kho Tổng Hà Nội',
    quantity: 1500,
    availableQuantity: 1450,
    inTransitQuantity: 50,
    status: 'CON_HANG',
    notes: 'Kho bảo quản thực phẩm chính miền Bắc',
  },
  {
    id: '2',
    sku: 'SKU-COKE-02',
    productName: 'Nước Ngọt Coca Cola Lon 320ml',
    warehouseName: 'Kho Cầu Giấy',
    quantity: 8,
    availableQuantity: 8,
    inTransitQuantity: 200,
    status: 'SAP_HET',
    notes: 'Đang chờ đợt chuyển hàng 200 lon từ Kho Tổng Hà Nội tới',
  },
  {
    id: '3',
    sku: 'SKU-Oreo-03',
    productName: 'Bánh Quy Kem Oreo Hộp Giấy 248g',
    warehouseName: 'Kho Quận 1 - HCM',
    quantity: 0,
    availableQuantity: 0,
    inTransitQuantity: 0,
    status: 'CHAY_HANG',
    notes: 'Hàng đã ngừng bán tại khu vực phía Nam',
  },
];

export function ProductWarehousesPage() {
  const [data, setData] = useState<ProductWarehouseRecord[]>(MOCK_WAREHOUSE_STOCK);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProductWarehouseRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ProductWarehouseRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.sku.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.warehouseName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenAdjust = (item: ProductWarehouseRecord) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.id) return;

    setData(
      data.map((d) => {
        if (d.id === editingItem.id) {
          const qty = Number(editingItem.quantity || 0);
          const avail = Number(editingItem.availableQuantity || 0);
          const transit = Number(editingItem.inTransitQuantity || 0);
          let status: 'CON_HANG' | 'SAP_HET' | 'CHAY_HANG' = 'CON_HANG';
          if (qty === 0) status = 'CHAY_HANG';
          else if (qty < 20) status = 'SAP_HET';

          return {
            ...d,
            quantity: qty,
            availableQuantity: avail,
            inTransitQuantity: transit,
            status,
          };
        }
        return d;
      })
    );
    setIsModalOpen(false);
  };

  const columns = useMemo<ColumnDef<ProductWarehouseRecord>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'Mã SKU',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Sản Phẩm',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'warehouseName',
        header: 'Kho Lưu Trữ',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'quantity',
        header: 'Tổng Tồn Thực Tế',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'availableQuantity',
        header: 'Khả Dụng Bán',
        cell: (info) => <span className="font-mono text-emerald-600 font-bold">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'inTransitQuantity',
        header: 'Đang Vận Chuyển',
        cell: (info) => <span className="font-mono text-gray-500">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái Tồn',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-emerald-100 text-emerald-800';
          let label = 'Còn Hàng';
          if (status === 'CHAY_HANG') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Cháy Hàng';
          } else if (status === 'SAP_HET') {
            badgeClass = 'bg-amber-100 text-amber-800';
            label = 'Sắp Hết Hàng';
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
              title="Xem Chi Tiết Tồn Kho"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenAdjust(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Điều Chỉnh Số Liệu"
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
          <h1 className="text-2xl font-bold">Báo Cáo Tồn Kho Theo Kho Hàng</h1>
          <p className="text-sm text-gray-500">
            Xem và quản lý số lượng sản phẩm chi tiết tại từng kho chi nhánh, kho tổng hoặc kho trung chuyển của doanh nghiệp.
          </p>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Building className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã SKU, tên sản phẩm, tên kho hàng..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Số dư tồn kho: ${selected?.productName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã SKU:</span>
                <p className="font-mono font-semibold">{selected.sku}</p>
              </div>
              <div>
                <span className="text-gray-500">Kho Lưu Trữ:</span>
                <p className="font-semibold text-blue-600">{selected.warehouseName}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên Sản Phẩm:</span>
              <p className="font-semibold text-base">{selected.productName}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Tổng Tồn Kho:</span>
                <p className="font-mono font-bold text-lg">{selected.quantity}</p>
              </div>
              <div>
                <span className="text-gray-500 text-emerald-600">Khả Dụng Bán:</span>
                <p className="font-mono font-bold text-emerald-600 text-lg">{selected.availableQuantity}</p>
              </div>
              <div>
                <span className="text-gray-500">Đang Vận Chuyển:</span>
                <p className="font-mono font-bold text-lg text-gray-500">{selected.inTransitQuantity}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng Thái Tồn Kho:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'CON_HANG'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'SAP_HET'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'CON_HANG' ? 'Còn Hàng' : selected.status === 'SAP_HET' ? 'Sắp Cháy Hàng' : 'Hết Hàng'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi Chú Vận Hành Kho:</span>
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
        title="Điều Chỉnh Hạn Mức Tồn Kho Nhanh"
      >
        <form onSubmit={handleSaveAdjust} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mặt Hàng & Kho Lưu</label>
            <p className="font-semibold text-sm">{editingItem.productName} ({editingItem.sku})</p>
            <p className="text-xs text-blue-600 font-semibold">{editingItem.warehouseName}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tổng Tồn *</label>
              <input
                type="number"
                value={editingItem.quantity || 0}
                onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Khả Dụng Bán *</label>
              <input
                type="number"
                value={editingItem.availableQuantity || 0}
                onChange={(e) => setEditingItem({ ...editingItem, availableQuantity: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đang Đi Đường *</label>
              <input
                type="number"
                value={editingItem.inTransitQuantity || 0}
                onChange={(e) => setEditingItem({ ...editingItem, inTransitQuantity: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
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
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ProductWarehousesPage;
