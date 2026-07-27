import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Tag, Layers, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { TreeSelect } from '@/shared/components/ui/TreeSelect';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '../store/inventoryStore';

interface ProductDetailRecord {
  id: string;
  barcode: string;
  productName: string;
  categoryName: string;
  brand: string;
  sellingPrice: number;
  costPrice: number;
  status: 'DANG_KINH_DOANH' | 'NGUNG_KINH_DOANH';
  notes?: string;
}

export function ProductDetailsPage() {
  const { products: storeProducts, fetchProducts, addProduct, updateProduct, deleteProduct } = useInventoryStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const data: ProductDetailRecord[] = useMemo(() => {
    return storeProducts.map((p) => ({
      id: p.id,
      barcode: (p.barcodes && p.barcodes[0]) || p.sku,
      productName: p.name,
      categoryName: p.category || 'Mặc định',
      brand: p.brand || 'Chính hãng',
      sellingPrice: p.price || 0,
      costPrice: p.costPrice || 0,
      status: p.status === 'INACTIVE' ? 'NGUNG_KINH_DOANH' : 'DANG_KINH_DOANH',
      notes: (p as any).notes || '',
    }));
  }, [storeProducts]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProductDetailRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ProductDetailRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.barcode.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.brand.toLowerCase().includes(q) ||
        d.categoryName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      barcode: `893${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      productName: '',
      categoryName: 'Chung',
      brand: 'Chính hãng',
      sellingPrice: 0,
      costPrice: 0,
      status: 'DANG_KINH_DOANH',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ProductDetailRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.barcode || !editingItem.productName) return;

    const payload: any = {
      sku: editingItem.barcode,
      name: editingItem.productName,
      category: editingItem.categoryName || 'Mặc định',
      brand: editingItem.brand || 'Chính hãng',
      price: Number(editingItem.sellingPrice || 0),
      costPrice: Number(editingItem.costPrice || 0),
      status: editingItem.status === 'NGUNG_KINH_DOANH' ? 'INACTIVE' : 'ACTIVE',
      notes: editingItem.notes || '',
    };

    if (modalMode === 'create') {
      await addProduct(payload);
    } else if (editingItem.id) {
      await updateProduct(editingItem.id, payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?')) {
      await deleteProduct(id);
      if (selected?.id === id) setSelected(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ProductDetailRecord>[]>(
    () => [
      {
        accessorKey: 'barcode',
        header: 'Mã barcode',
        cell: (info) => <span className="font-mono font-semibold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Tên sản phẩm',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'categoryName',
        header: 'Danh mục',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'brand',
        header: 'Thương hiệu',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sellingPrice',
        header: 'Giá bán',
        cell: (info) => <span className="font-mono text-emerald-600 font-bold">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass = status === 'DANG_KINH_DOANH' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = status === 'DANG_KINH_DOANH' ? 'Đang kinh doanh' : 'Ngừng kinh doanh';
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
              title="Xem chi tiết sản phẩm"
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
          <h1 className="text-2xl font-bold">Danh mục sản phẩm chi tiết</h1>
          <p className="text-sm text-gray-500">
            Quản lý cơ sở dữ liệu hàng hóa, thông tin mã vạch, giá nhập/bán, thương hiệu và trạng thái kinh doanh của cửa hàng.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all text-sm font-bold shadow hover:shadow-lg active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Thêm Sản Phẩm Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã barcode, tên sản phẩm, thương hiệu, danh mục..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết sản phẩm: ${selected?.productName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã vạch / barcode:</span>
                <p className="font-mono font-semibold">{selected.barcode}</p>
              </div>
              <div>
                <span className="text-gray-500">Thương hiệu:</span>
                <p className="font-semibold">{selected.brand}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên sản phẩm:</span>
              <p className="font-semibold text-base">{selected.productName}</p>
            </div>
            <div>
              <span className="text-gray-500">Danh mục phân loại:</span>
              <p className="font-semibold text-emerald-600">{selected.categoryName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Giá nhập (VND):</span>
                <p className="font-mono text-red-500 font-bold">{formatCurrency(selected.costPrice)}</p>
              </div>
              <div>
                <span className="text-gray-500">Giá bán lẻ (VND):</span>
                <p className="font-mono text-emerald-600 font-bold text-lg">{formatCurrency(selected.sellingPrice)}</p>
              </div>
            </div>
            <div className="border-t pt-2">
              <span className="text-gray-500">Trạng thái kinh doanh:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DANG_KINH_DOANH' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DANG_KINH_DOANH' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Mô tả / ghi chú:</span>
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
        title={modalMode === 'create' ? 'Thêm sản phẩm mới' : 'Sửa thông tin sản phẩm'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Mã vạch / Barcode *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() =>
                      setEditingItem(prev => ({
                        ...prev,
                        barcode: `893${Math.floor(1000000000 + Math.random() * 9000000000)}`
                      }))
                    }
                    className="text-[10px] text-primary hover:underline font-medium"
                  >
                    Tự sinh EAN-13
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingItem.barcode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                placeholder="Mã vạch sản phẩm"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thương hiệu / Hãng SX</label>
              <input
                type="text"
                value={editingItem.brand || ''}
                onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Ví dụ: Vinamilk, Samsung..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên sản phẩm đầy đủ *</label>
              <input
                type="text"
                value={editingItem.productName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, productName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Tên đầy đủ của mặt hàng kinh doanh..."
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên ngắn / Viết tắt (Short Name - In HĐ/POS)</label>
              <input
                type="text"
                value={(editingItem as any).shortName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, shortName: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="Tên rút gọn in phiếu..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp cung ứng chính (Supplier)</label>
              <SearchLookupModal
                title="Chọn Nhà Cung Cấp Mặc Định"
                iconType="building"
                placeholder="Chọn nhà cung cấp chính..."
                value={(editingItem as any).supplierId}
                options={[
                  { id: 'SUP-VINAMILK', code: 'SUP-01', name: 'Vinamilk Corporation', subtitle: 'Hàng tiêu dùng' },
                  { id: 'SUP-UNILEVER', code: 'SUP-02', name: 'Unilever Việt Nam', subtitle: 'Hóa mỹ phẩm' },
                  { id: 'SUP-SAMSUNG', code: 'SUP-03', name: 'Samsung Electronics', subtitle: 'Thiết bị điện tử' },
                ]}
                onChange={(val) => setEditingItem(prev => ({ ...prev, supplierId: val } as any))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thẻ phân loại (Tags)</label>
              <input
                type="text"
                value={(editingItem as any).tags || ''}
                onChange={(e) => setEditingItem({ ...editingItem, tags: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                placeholder="VD: Best-Seller, Hang-Khuyen-Mai, Hot..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục phân cấp (Parent Category) *</label>
              <TreeSelect
                value={editingItem.categoryName}
                onChange={(val) => setEditingItem({ ...editingItem, categoryName: val })}
                placeholder="-- Chọn danh mục sản phẩm --"
                options={[
                  {
                    id: 'Điện tử / Công nghệ',
                    name: 'Điện tử & Công nghệ',
                    children: [
                      { id: 'Điện thoại & Máy tính bảng', name: 'Điện thoại & Máy tính bảng' },
                      { id: 'Phụ kiện máy tính', name: 'Phụ kiện máy tính' },
                    ],
                  },
                  {
                    id: 'Thực phẩm & Đồ uống',
                    name: 'Thực phẩm & Đồ uống',
                    children: [
                      { id: 'Nước giải khát', name: 'Nước giải khát' },
                      { id: 'Thực phẩm đóng hộp', name: 'Thực phẩm đóng hộp' },
                    ],
                  },
                  { id: 'Thời trang & Phụ kiện', name: 'Thời trang & Phụ kiện' },
                  { id: 'Gia dụng & Đời sống', name: 'Gia dụng & Đời sống' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị tính Master (UOM) *</label>
              <select
                value={editingItem.unit || 'Cái'}
                onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="Cái">Cái / Chiếc (Unit)</option>
                <option value="Hộp">Hộp (Box)</option>
                <option value="Thùng">Thùng (Carton)</option>
                <option value="Chai">Chai / Lọ (Bottle)</option>
                <option value="Kg">Kilogram (Kg)</option>
                <option value="Gói">Gói (Pack)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá nhập chi phí (Cost Price) *</label>
              <CurrencyInput
                value={editingItem.costPrice || 0}
                onChange={(val) => setEditingItem({ ...editingItem, costPrice: val })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá bán lẻ đề xuất (Selling Price) *</label>
              <CurrencyInput
                value={editingItem.sellingPrice || 0}
                onChange={(val) => setEditingItem({ ...editingItem, sellingPrice: val })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Định mức tồn tối thiểu (Reorder Level)</label>
              <input
                type="number"
                value={editingItem.reorderPoint ?? 10}
                onChange={(e) => setEditingItem({ ...editingItem, reorderPoint: parseInt(e.target.value) || 0 })}
                placeholder="10"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tồn kho an toàn (Safety Stock)</label>
              <input
                type="number"
                value={editingItem.safetyStock ?? 5}
                onChange={(e) => setEditingItem({ ...editingItem, safetyStock: parseInt(e.target.value) || 0 })}
                placeholder="5"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thuế suất VAT (%)</label>
              <select
                value={editingItem.vatRate ?? 10}
                onChange={(e) => setEditingItem({ ...editingItem, vatRate: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value={0}>0% (Miễn thuế / Không chịu thuế)</option>
                <option value={5}>5% (Thuế suất ưu đãi)</option>
                <option value={8}>8% (Nghị định giảm thuế VAT)</option>
                <option value={10}>10% (Thuế suất chuẩn GTGT)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái kinh doanh *</label>
              <select
                value={editingItem.status || 'DANG_KINH_DOANH'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="DANG_KINH_DOANH">Đang kinh doanh (Active)</option>
                <option value="NGUNG_KINH_DOANH">Ngừng Kinh Doanh (Inactive)</option>
              </select>
            </div>
          </div>

          <div>
            <FileDropzone
              accept=".png,.jpg,.jpeg,.pdf"
              label="Bộ sưu tập ảnh sản phẩm & Tài liệu kỹ thuật"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú in hóa đơn (External Note)</label>
              <textarea
                value={editingItem.notes || ''}
                onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary resize-none"
                rows={2}
                placeholder="Mô tả in trên phiếu xuất..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú nội bộ (Internal Note - Chỉ nhân viên thấy)</label>
              <textarea
                value={(editingItem as any).internalNote || ''}
                onChange={(e) => setEditingItem({ ...editingItem, internalNote: e.target.value } as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 resize-none"
                rows={2}
                placeholder="Lưu ý bảo quản, thông số kỹ thuật nội bộ..."
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
              Lưu sản phẩm
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
