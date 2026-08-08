import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Check, Star } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type SupplierProductRecord } from '@/features/inventory/store/inventoryStore';
import { usePurchaseStore } from '@/features/purchase/store/purchaseStore';

export function SupplierProductsPage() {
  const {
    supplierProducts,
    fetchSupplierProducts,
    addSupplierProduct,
    updateSupplierProduct,
    deleteSupplierProduct,
    setSupplierProductPreferred,
    products,
    fetchProducts,
  } = useInventoryStore();

  const { suppliers, fetchSuppliers } = usePurchaseStore();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SupplierProductRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SupplierProductRecord>>({});

  useEffect(() => {
    fetchSupplierProducts();
    fetchProducts();
    fetchSuppliers();
  }, [fetchSupplierProducts, fetchProducts, fetchSuppliers]);

  const filtered = useMemo(() => {
    if (!search) return supplierProducts;
    const q = search.toLowerCase();
    return supplierProducts.filter(
      (d) =>
        (d.supplierSku && d.supplierSku.toLowerCase().includes(q)) ||
        (d.productName && d.productName.toLowerCase().includes(q)) ||
        (d.supplierName && d.supplierName.toLowerCase().includes(q)) ||
        (d.productCode && d.productCode.toLowerCase().includes(q)) ||
        (d.supplierCode && d.supplierCode.toLowerCase().includes(q))
    );

  }, [search, supplierProducts]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      supplierSku: '',
      productId: products[0]?.id || '',
      supplierId: suppliers[0]?.id || '',
      unitPrice: 0,
      currency: 'VND',
      moq: 1,
      leadTimeDays: 3,
      isPreferred: false,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SupplierProductRecord) => {
    setSelected(null);
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.productId) {
      toast.error('Vui lòng chọn Sản phẩm cần liên kết!');
      return;
    }
    if (!editingItem.supplierId) {
      toast.error('Vui lòng chọn Nhà cung cấp!');
      return;
    }

    const payload = {
      productId: editingItem.productId,
      supplierId: editingItem.supplierId,
      supplierSku: editingItem.supplierSku || '',
      unitPrice: Number(editingItem.unitPrice || 0),
      currency: editingItem.currency || 'VND',
      moq: Number(editingItem.moq || 1),
      leadTimeDays: Number(editingItem.leadTimeDays || 3),
      isPreferred: !!editingItem.isPreferred,
      isActive: editingItem.isActive !== false,
    };

    try {
      if (modalMode === 'create') {
        await addSupplierProduct(payload);
        toast.success('Đã tạo liên kết mặt hàng với Nhà cung cấp thành công!');
      } else {
        await updateSupplierProduct(editingItem.id!, payload);
        toast.success('Đã cập nhật thông tin liên kết Nhà cung cấp thành công!');
      }
      setIsModalOpen(false);
    } catch {
      toast.error('Lỗi khi lưu liên kết mặt hàng!');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa liên kết nhà cung cấp này?')) {
      await deleteSupplierProduct(id);
      toast.success('Đã xóa liên kết nhà cung cấp thành công!');
    }
  };

  const handleTogglePreferred = async (id: string, currentValue: boolean) => {
    await setSupplierProductPreferred(id, !currentValue);
  };

  const formatCurrency = (val: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: currency || 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<SupplierProductRecord>[]>(
    () => [
      {
        id: 'preferred',
        header: 'Ưu tiên',
        cell: ({ row }) => (
          <button
            onClick={() => handleTogglePreferred(row.original.id, row.original.isPreferred)}
            className={`p-1 rounded hover:bg-gray-100 ${
              row.original.isPreferred ? 'text-amber-500' : 'text-gray-300'
            }`}
            title="Đánh dấu nhà cung cấp ưu tiên"
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        ),
      },
      {
        accessorKey: 'supplierSku',
        header: 'Mã hàng NCC (sku)',
        cell: (info) => <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{info.getValue() as string || 'N/A'}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Tên sản phẩm',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'unitPrice',
        header: 'Giá nhập thỏa thuận',
        cell: ({ row }) => (
          <span className="font-mono text-emerald-600 font-bold">
            {formatCurrency(row.original.unitPrice || 0, row.original.currency)}
          </span>
        ),
      },
      {
        accessorKey: 'moq',
        header: 'Đặt tối thiểu (MOQ)',
        cell: (info) => <span className="font-mono">{info.getValue() as number || 0}</span>,
      },
      {
        accessorKey: 'leadTimeDays',
        header: 'Thời gian giao',
        cell: (info) => <span className="font-mono">{info.getValue() as number || 0} ngày</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Trạng thái',
        cell: (info) => {
          const isActive = info.getValue() as boolean;
          const badgeClass = isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800';
          const label = isActive ? 'Đang cung cấp' : 'Tạm ngưng';
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [supplierProducts]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Danh mục mặt hàng nhà cung cấp (vendor catalog)</h1>
          <p className="text-sm text-gray-500">
            Quản lý và thiết lập mức giá nhập, số lượng mua tối thiểu (MOQ) và thời gian giao hàng thỏa thuận từ các nhà cung cấp đối với từng sản phẩm.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Liên Kết Mặt Hàng
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã hàng NCC, tên sản phẩm, nhà cung cấp..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      {/* Modal Xem chi tiết sản phẩm NCC cấp căn giữa (TC-ALL-1) */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi tiết hàng NCC: ${selected.productName}` : 'Thông tin liên kết sản phẩm NCC'}
        width="max-w-md"
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{selected.productName}</h3>
                <p className="text-xs font-mono text-gray-500">SKU Hệ Thống: {selected.productCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b pb-2">
              <div>
                <span className="text-xs text-gray-500">Nhà cung cấp:</span>
                <p className="font-semibold text-blue-600">{selected.supplierName} ({selected.supplierCode})</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Mã SKU đối tác NCC:</span>
                <p className="font-mono font-semibold">{selected.supplierSku || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-b pb-2">
              <div>
                <span className="text-xs text-gray-500">Giá thỏa thuận:</span>
                <p className="font-mono text-emerald-600 font-bold">{formatCurrency(selected.unitPrice || 0, selected.currency)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Đặt tối thiểu:</span>
                <p className="font-mono font-semibold">{selected.moq || 0}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Thời gian Giao:</span>
                <p className="font-mono font-semibold">{selected.leadTimeDays || 0} ngày</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-gray-100 font-bold rounded-lg text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo liên kết hàng NCC mới' : 'Sửa liên kết hàng NCC'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp đối tác *</label>
              <SearchLookupModal
                title="Chọn Nhà Cung Cấp"
                iconType="building"
                placeholder="Chọn nhà cung cấp..."
                value={editingItem.supplierId}
                options={suppliers.map(s => ({
                  id: s.id,
                  code: s.code,
                  name: s.supplierName,
                  subtitle: `SĐT: ${s.phone || 'N/A'}`
                }))}
                onChange={(val) => setEditingItem(prev => ({ ...prev, supplierId: val }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sản phẩm hệ thống *</label>
              <SearchLookupModal
                title="Chọn Sản Phẩm Hệ Thống"
                iconType="package"
                placeholder="Chọn sản phẩm..."
                value={editingItem.productId}
                options={products.map(p => ({
                  id: p.id,
                  code: p.sku,
                  name: p.name,
                  subtitle: `Đơn giá: ${p.costPrice ? p.costPrice.toLocaleString('vi-VN') + ' ₫' : '0 ₫'}`
                }))}
                onChange={(val) => setEditingItem(prev => ({ ...prev, productId: val }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã SKU định nghĩa bởi NCC</label>
              <input
                type="text"
                value={editingItem.supplierSku || ''}
                onChange={(e) => setEditingItem({ ...editingItem, supplierSku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="SKU đối tác định nghĩa..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian giao hàng chuẩn (Lead Time - Ngày) *</label>
              <input
                type="number"
                value={editingItem.leadTimeDays || 3}
                onChange={(e) => setEditingItem({ ...editingItem, leadTimeDays: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá nhập thỏa thuận hợp đồng *</label>
              <div className="flex gap-2">
                <CurrencyInput
                  value={editingItem.unitPrice || 0}
                  onChange={(val) => setEditingItem(prev => ({ ...prev, unitPrice: val }))}
                  currencySymbol={editingItem.currency === 'USD' ? '$' : '₫'}
                  placeholder="0"
                />
                <select
                  value={editingItem.currency || 'VND'}
                  onChange={(e) => setEditingItem({ ...editingItem, currency: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="VND">VND</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lượng đặt tối thiểu (MOQ) *</label>
              <input
                type="number"
                value={editingItem.moq || 1}
                onChange={(e) => setEditingItem({ ...editingItem, moq: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!editingItem.isPreferred}
                  onChange={(e) => setEditingItem({ ...editingItem, isPreferred: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nhà cung cấp ưu tiên chính</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái hoạt động *</label>
              <select
                value={editingItem.isActive === false ? 'false' : 'true'}
                onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.value === 'true' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="true">Đang cung cấp hàng</option>
                <option value="false">Tạm ngưng cung cấp</option>
              </select>
            </div>
          </div>

          <div>
            <FileDropzone
              label="Bản báo giá & Hợp đồng cung ứng đính kèm (PDF/Image)"
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
              Lưu liên kết
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default SupplierProductsPage;
