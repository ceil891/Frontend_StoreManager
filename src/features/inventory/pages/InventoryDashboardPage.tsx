import { useMemo, useState } from 'react';
import { Package, TrendingUp, AlertTriangle, RefreshCw, BarChart2, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

const MOCK_STATS = {
  totalSkus: 845,
  totalStockValue: 1250000000,
  totalStockQty: 18450,
  lowStockCount: 14,
  overStockCount: 5,
};

const MOCK_RECENT_ACTIVITIES = [
  { id: 1, type: 'IMPORT', code: 'IM-2026-981', item: 'Sữa tươi Vinamilk', qty: 200, time: '10 phút trước', user: 'Lưu Hữu Phước' },
  { id: 2, type: 'EXPORT', code: 'SOUT-2026-001', item: 'Nước ngọt Coca-Cola', qty: 48, time: '25 phút trước', user: 'Nguyễn Văn Thủ Kho' },
  { id: 3, type: 'ADJUST', code: 'IADJ-2026-001', item: 'Gạo tám thơm', qty: +5, time: '1 giờ trước', user: 'Lưu Hữu Phước' },
];

export function InventoryDashboardPage() {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Báo Cáo Tổng Quan Kho Hàng</h1>
        <p className="text-sm text-gray-500">
          Xem chỉ số thống kê, hiệu suất quay vòng tồn kho, giá trị tài sản lưu kho và các biến động xuất nhập tồn.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500">Tổng Số Mặt Hàng (SKUs)</span>
            <h3 className="text-2xl font-bold font-mono">{MOCK_STATS.totalSkus}</h3>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500">Tổng Giá Trị Lưu Kho</span>
            <h3 className="text-2xl font-bold font-mono text-blue-600">{formatCurrency(MOCK_STATS.totalStockValue)}</h3>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500">Tổng Số Lượng Tồn Kho</span>
            <h3 className="text-2xl font-bold font-mono">{MOCK_STATS.totalStockQty} sản phẩm</h3>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-500">Cảnh Báo Sắp Hết Hàng</span>
            <h3 className="text-2xl font-bold font-mono text-red-600">{MOCK_STATS.lowStockCount} SKUs</h3>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activities */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-600" /> Biến Động Nhập Xuất Gần Đây
          </h2>
          <div className="space-y-4">
            {MOCK_RECENT_ACTIVITIES.map((act) => (
              <div key={act.id} className="flex justify-between items-center border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded text-xs font-bold ${
                    act.type === 'IMPORT' 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30' 
                      : act.type === 'EXPORT'
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/30'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30'
                  }`}>
                    {act.type === 'IMPORT' ? 'Nhập' : act.type === 'EXPORT' ? 'Xuất' : 'Cân Bằng'}
                  </span>
                  <div>
                    <p className="font-semibold">{act.item}</p>
                    <span className="text-xs font-mono text-gray-500">{act.code} - {act.user}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold font-mono ${act.type === 'EXPORT' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {act.type === 'EXPORT' ? '-' : '+'}{Math.abs(act.qty)}
                  </p>
                  <span className="text-xs text-gray-400">{act.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Low Stock Alerts */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> Báo Động Hết Hàng
          </h2>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold text-xs text-red-900 dark:text-red-200">Coca Cola Lon 320ml</p>
                <span className="text-xs text-red-700">Tồn: 8 lon (Định mức min: 50)</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded font-semibold">Gấp</span>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded flex justify-between items-center">
              <div>
                <p className="font-semibold text-xs text-red-900 dark:text-red-200">Dầu Ăn Simply 1L</p>
                <span className="text-xs text-red-700">Tồn: 12 chai (Định mức min: 40)</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded font-semibold">Gấp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default InventoryDashboardPage;
