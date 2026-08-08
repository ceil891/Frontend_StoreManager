import { useMemo, useState, useEffect } from 'react';
import { Search, Eye, Building, RefreshCw } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type InventoryResponse } from '@/features/inventory/store/inventoryStore';

export function ProductWarehousesPage() {
  const { inventories, fetchInventories } = useInventoryStore();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<InventoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetchInventories().finally(() => setIsLoading(false));
  }, [fetchInventories]);

  const filtered = useMemo(() => {
    if (!search) return inventories;
    const q = search.toLowerCase();
    return inventories.filter(
      (d) =>
        d.productCode.toLowerCase().includes(q) ||
        d.productName.toLowerCase().includes(q) ||
        d.branchName.toLowerCase().includes(q)
    );
  }, [search, inventories]);

  const getStockStatus = (inv: InventoryResponse) => {
    if (inv.quantityOnHand === 0) return 'CHAY_HANG';
    if (inv.quantityAvailable < 10) return 'SAP_HET';
    return 'CON_HANG';
  };

  const columns = useMemo<ColumnDef<InventoryResponse>[]>(
    () => [
      {
        accessorKey: 'productCode',
        header: 'Mã SKU',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Sản phẩm',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'branchName',
        header: 'Chi nhánh / kho',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'quantityOnHand',
        header: 'Tổng tồn thực tế',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'quantityAvailable',
        header: 'Khả dụng bán',
        cell: (info) => <span className="font-mono text-emerald-600 font-bold">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'quantityReserved',
        header: 'Đang giữ chỗ',
        cell: (info) => <span className="font-mono text-amber-600">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'locationBin',
        header: 'Vị trí kệ',
        cell: (info) => <span className="text-sm text-gray-500 font-mono">{(info.getValue() as string) || '—'}</span>,
      },
      {
        id: 'status',
        header: 'Trạng thái tồn',
        cell: ({ row }) => {
          const status = getStockStatus(row.original);
          let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
          let label = 'Còn hàng';
          if (status === 'CHAY_HANG') {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            label = 'Cháy hàng';
          } else if (status === 'SAP_HET') {
            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
            label = 'Sắp hết hàng';
          }
          return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              title="Xem chi tiết tồn kho"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo tồn kho theo chi nhánh</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Xem và giám sát số lượng tồn kho chi tiết tại từng chi nhánh / kho hàng. Dữ liệu được đồng bộ trực tiếp từ hệ thống backend.
          </p>
        </div>
        <button
          onClick={() => { setIsLoading(true); fetchInventories().finally(() => setIsLoading(false)); }}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
        <Building className="w-5 h-5 text-gray-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã SKU, tên sản phẩm, chi nhánh..."
          className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Đang tải dữ liệu từ backend...</span>
        </div>
      ) : inventories.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Chưa có dữ liệu tồn kho</p>
          <p className="text-sm mt-1">Nhập hàng vào hệ thống để xem báo cáo tồn kho tại đây.</p>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Tồn kho: ${selected?.productName}`}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Chi nhánh / kho</p>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{selected.branchName}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1">Tổng tồn</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{selected.quantityOnHand}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1">Khả dụng</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selected.quantityAvailable}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm text-center">
                <p className="text-xs text-gray-500 mb-1">Giữ chỗ</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{selected.quantityReserved}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Mã SKU:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selected.productCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tên sản phẩm:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selected.productName}</span>
              </div>
              {selected.locationBin && (
                <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-500 dark:text-gray-400">Vị trí kệ:</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{selected.locationBin}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-500 dark:text-gray-400">Trạng thái:</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                  getStockStatus(selected) === 'CON_HANG'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : getStockStatus(selected) === 'SAP_HET'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                }`}>
                  {getStockStatus(selected) === 'CON_HANG' ? 'Còn hàng' : getStockStatus(selected) === 'SAP_HET' ? 'Sắp cháy hàng' : 'Hết hàng'}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default ProductWarehousesPage;
