import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';

export function AIInsightsWidget() {
  return (
    <div className="col-span-full xl:col-span-2 rounded-2xl bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm border border-indigo-100 dark:from-indigo-950/20 dark:to-gray-900 dark:border-indigo-900/30">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Executive Insights</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Phân tích dữ liệu tự động từ Google Sheets</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Summary Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-800/50"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Tóm tắt hôm nay</h3>
          </div>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Hệ thống RetailHub đạt <strong>92%</strong> KPI doanh thu tuần. Cửa hàng Tân Bình tăng trưởng mạnh nhất (+15%). Tuy nhiên, chi phí vận hành tại Gò Vấp đang cao hơn mức trung bình 10%.
          </p>
        </motion.div>

        {/* Low Stock Alert */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-red-100 bg-red-50/50 p-4 shadow-sm dark:border-red-900/30 dark:bg-red-900/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <h3 className="font-semibold text-red-700 dark:text-red-400">Cảnh báo tồn kho</h3>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Bia Heineken thùng 24</span>
              <span className="font-medium text-red-600 dark:text-red-400">2 ngày</span>
            </li>
            <li className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
              <span>Nước mắm Nam Ngư</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">5 ngày</span>
            </li>
          </ul>
        </motion.div>

        {/* Restock Recommendations */}
        <motion.div
          whileHover={{ y: -2 }}
          className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm dark:border-blue-900/30 dark:bg-blue-900/10"
        >
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="h-4 w-4 text-blue-500" />
            <h3 className="font-semibold text-blue-700 dark:text-blue-400">Gợi ý nhập hàng</h3>
          </div>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 mb-3">
            Nhu cầu nước giải khát tăng cao vào cuối tuần. AI đề xuất tạo đơn hàng (PO):
          </p>
          <button className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-blue-700">
            Tạo PO tự động (+300 Coca)
          </button>
        </motion.div>
      </div>
    </div>
  );
}
