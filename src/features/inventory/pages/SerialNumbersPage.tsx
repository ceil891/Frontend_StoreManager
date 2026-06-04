import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, QrCode, Building2, Calendar, FileText, Wrench, RefreshCw, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type SerialItemRecord } from '../store/inventoryStore';

export function SerialNumbersPage() {
  const data = useInventoryStore((s) => s.serialItems);
  const [search, setSearch] = useState('');
  const [selectedSerial, setSelectedSerial] = useState<SerialItemRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.serialNumber.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (!!item.associatedCustomer && item.associatedCustomer.toLowerCase().includes(q))
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns = useMemo<ColumnDef<SerialItemRecord>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: 'Số Serial',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Sản phẩm / SKU',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{row.original.productName}</p>
            <p className="text-xs font-mono text-gray-500">{row.original.sku}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            IN_STOCK: 'Trong kho',
            SOLD: 'Đã bán',
            RESERVED: 'Đã đặt trước',
            RMA_REPAIR: 'Đang bảo hành',
            WRITTEN_OFF: 'Thanh lý / Hủy',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'SOLD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'RESERVED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' :
              status === 'RMA_REPAIR' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {statusMap[status] || status}
            </span>
          );
        },
      },
      {
        accessorKey: 'currentLocation',
        header: 'Vị trí hiện tại',
      },
      {
        accessorKey: 'unitCost',
        header: 'Giá trị',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">${(info.getValue() as number).toFixed(2)}</span>,
      },
      {
        accessorKey: 'warrantyExpiry',
        header: 'Hạn bảo hành',
        cell: (info) => <span className="font-mono text-sm text-gray-500">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedSerial(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); alert(`Chỉnh sửa serial: ${row.original.serialNumber}`); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirm(`Bạn có chắc muốn xóa serial ${row.original.serialNumber}?`); }}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Số Serial & Bảo hành</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi số serial từng thiết bị giá trị cao, kiểm soát hàng bảo hành RMA và quyền lợi khách hàng. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Đăng ký Serial
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo số serial, tên sản phẩm, SKU hoặc khách hàng..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái serial:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="IN_STOCK">Trong kho (IN STOCK)</option>
                <option value="SOLD">Đã bán (SOLD)</option>
                <option value="RESERVED">Đã giữ chỗ (RESERVED)</option>
                <option value="RMA_REPAIR">Bảo hành (RMA REPAIR)</option>
                <option value="WRITTEN_OFF">Đã hủy kho (WRITTEN OFF)</option>
              </select>
            </div>

            {(statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedSerial(row)} />
      </div>

      <Drawer
        isOpen={!!selectedSerial}
        onClose={() => setSelectedSerial(null)}
        title={selectedSerial ? `Serial Passport: ${selectedSerial.serialNumber}` : 'Serial passport'}
        width="max-w-lg"
      >
        {selectedSerial && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Asset Unit Cost</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">${selectedSerial.unitCost.toFixed(2)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedSerial.status === 'IN_STOCK' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedSerial.status === 'SOLD' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                selectedSerial.status === 'RESERVED' ? 'bg-indigo-200 text-indigo-900 dark:bg-indigo-800 dark:text-indigo-100' :
                selectedSerial.status === 'RMA_REPAIR' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedSerial.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Current Location
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedSerial.currentLocation}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Warranty Expiry
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedSerial.warrantyExpiry}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Target Product Name:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSerial.productName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">SKU Barcode Reference:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedSerial.sku}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Classification Category:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSerial.category}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Initial Receiving Date:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSerial.receivedDate}</span>
              </div>
              {(selectedSerial.vendorName || selectedSerial.poReference) && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  {selectedSerial.vendorName && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Nhà cung cấp:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{selectedSerial.vendorName}</span>
                    </div>
                  )}
                  {selectedSerial.poReference && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Phiếu nhập (PO):</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{selectedSerial.poReference}</span>
                    </div>
                  )}
                </div>
              )}
              {(selectedSerial.macAddress || selectedSerial.imei1) && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  {selectedSerial.macAddress && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">MAC Address:</span>
                      <span className="font-mono text-xs font-semibold">{selectedSerial.macAddress}</span>
                    </div>
                  )}
                  {selectedSerial.imei1 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 dark:text-gray-400">IMEI 1 / IMEI 2:</span>
                      <span className="font-mono text-[10px] font-semibold text-right">
                        {selectedSerial.imei1}
                        {selectedSerial.imei2 ? ` / ${selectedSerial.imei2}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {selectedSerial.associatedInvoice && (
                <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-500 dark:text-gray-400">Associated Sale Invoice:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selectedSerial.associatedInvoice}</span>
                </div>
              )}
              {selectedSerial.associatedCustomer && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Registered Customer:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedSerial.associatedCustomer}</span>
                </div>
              )}

              {selectedSerial.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Asset Traceability Notes</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedSerial.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedSerial.status === 'IN_STOCK' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <RefreshCw className="w-4 h-4" /> Transfer Serial Location
                </button>
              )}
              {selectedSerial.status === 'SOLD' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <Wrench className="w-4 h-4" /> Log RMA Warranty Claim
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <FileText className="w-4 h-4 inline mr-1" /> Print QR Tag
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
