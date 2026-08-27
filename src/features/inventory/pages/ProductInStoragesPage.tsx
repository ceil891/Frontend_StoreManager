import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, MapPin, Grid, RefreshCw, Package } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useInventoryStore,
  type ProductLocationRecord,
} from '@/features/inventory/store/inventoryStore';

export function ProductInStoragesPage() {
  const {
    productLocations,
    fetchProductLocations,
    assignProductLocation,
    products,
    fetchProducts,
    warehouseBins,
    fetchWarehouseBins,
  } = useInventoryStore();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ProductLocationRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [assignForm, setAssignForm] = useState<{
    productId: number;
    binId: number;
    quantity: number;
  }>({ productId: 0, binId: 0, quantity: 0 });
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchProductLocations(), fetchProducts(), fetchWarehouseBins()])
      .finally(() => setIsLoading(false));
  }, [fetchProductLocations, fetchProducts, fetchWarehouseBins]);

  const filtered = useMemo(() => {
    if (!search) return productLocations;
    const q = search.toLowerCase();
    return productLocations.filter(
      (d) =>
        d.productCode.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.zoneCode.toLowerCase().includes(q) ||
        d.binCode.toLowerCase().includes(q)
    );
  }, [search, productLocations]);

  const handleOpenAssign = () => {
    setSaveError(null);
    setAssignForm({
      productId: products[0] ? Number(products[0].id) : 0,
      binId: warehouseBins[0] ? Number(warehouseBins[0].id) : 0,
      quantity: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ProductLocationRecord) => {
    setSaveError(null);
    setAssignForm({
      productId: Number(item.productId),
      binId: Number(item.binId),
      quantity: item.quantity,
    });
    setIsModalOpen(true);
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.productId || !assignForm.binId) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await assignProductLocation({
        productId: assignForm.productId,
        binId: assignForm.binId,
        quantity: assignForm.quantity,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu vị trí.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<ColumnDef<ProductLocationRecord>[]>(
    () => [
      {
        accessorKey: 'productCode',
        header: 'Mã SKU',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Tên sản phẩm',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'zoneCode',
        header: 'Phân khu kho',
        cell: (info) => <span className="text-gray-700 dark:text-gray-300">{info.getValue() as string || 'Chưa phân khu'}</span>,
      },
      {
        accessorKey: 'binCode',
        header: 'Ô kệ (bin)',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <MapPin className="w-3 h-3" /> {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Số lượng tồn kệ',
        cell: (info) => {
          const qty = info.getValue() as number;
          return (
            <span className={`font-mono font-bold text-sm ${qty === 0 ? 'text-red-500' : 'text-primary'}`}>
              {qty.toLocaleString('vi-VN')}
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
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết vị trí"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Cập nhật số lượng ô kệ"
            >
              <Edit className="w-4 h-4" />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vị trí lưu kho sản phẩm (ô kệ / bin)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý vị trí lưu trữ thực tế của từng sản phẩm theo phân khu và ô kệ trong kho
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAssign}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Gán vị trí kho
            </button>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo mã SKU, tên hàng, phân khu kho, số ô kệ..."
            className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Đang tải dữ liệu từ hệ thống...</span>
          </div>
        ) : productLocations.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Chưa có vị trí lưu kho nào được gán</p>
            <p className="text-sm mt-1">Nhấn "Gán vị trí kho" để phân bổ sản phẩm vào ô kệ.</p>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Vị trí sản phẩm: ${selected?.productName}`}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-6">
            <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
              <p className="text-xs text-primary font-semibold uppercase tracking-wider">Ô kệ lưu trữ</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{selected.binCode}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selected.zoneCode || 'Chưa phân khu'}</p>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Mã SKU:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selected.productCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tên sản phẩm:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selected.productName}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Grid className="w-3.5 h-3.5" /> Số lượng tồn kệ:</span>
                <span className={`font-mono font-bold text-lg ${selected.quantity === 0 ? 'text-red-500' : 'text-primary'}`}>
                  {selected.quantity.toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tình trạng kệ:</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selected.quantity === 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                }`}>
                  {selected.quantity === 0 ? 'Trống kệ' : 'Có hàng'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal gán vị trí kho */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Gán / cập nhật vị trí lưu kho"
        width="max-w-lg"
      >
        <form onSubmit={handleSaveAssign} className="space-y-4">
          {saveError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
              {saveError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sản phẩm *</label>
            <select
              value={assignForm.productId}
              onChange={(e) => setAssignForm({ ...assignForm, productId: Number(e.target.value) })}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              required
            >
              <option value={0}>-- Chọn sản phẩm --</option>
              {products.map((p) => (
                <option key={p.id} value={Number(p.id)}>{p.sku} — {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ô kệ (bin) *</label>
            <select
              value={assignForm.binId}
              onChange={(e) => setAssignForm({ ...assignForm, binId: Number(e.target.value) })}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              required
            >
              <option value={0}>-- Chọn ô kệ kho --</option>
              {warehouseBins.map((b) => (
                <option key={b.id} value={Number(b.id)}>{b.binCode} ({b.areaCode || b.areaName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng *</label>
            <input
              type="number"
              min={0}
              value={assignForm.quantity}
              onChange={(e) => setAssignForm({ ...assignForm, quantity: Number(e.target.value) })}
              className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Đang lưu...' : 'Xác nhận gán'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
export default ProductInStoragesPage;
