import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, TrendingDown, CheckCircle2, Info } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export function AIAlerts() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mock AI alerts data
  const alerts = [
    {
      id: 1,
      type: 'critical',
      title: 'Hết hàng: Nước khoáng Lavie 500ml',
      message: 'Sản phẩm đã hết hàng tại kho Quận 3. Dự kiến mất doanh thu 5tr/ngày.',
      time: '10 phút trước',
      icon: AlertTriangle,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Doanh số chi nhánh giảm',
      message: 'Cửa hàng Gò Vấp có doanh thu giảm 15% so với tuần trước. AI đề xuất chạy CTKM giảm giá 10%.',
      time: '1 giờ trước',
      icon: TrendingDown,
    },
    {
      id: 3,
      type: 'success',
      title: 'Đạt chỉ tiêu doanh thu',
      message: 'Cửa hàng Tân Bình đã vượt KPI tuần sớm 2 ngày!',
      time: '3 giờ trước',
      icon: CheckCircle2,
    },
    {
      id: 4,
      type: 'info',
      title: 'Dự báo nhu cầu',
      message: 'Dự báo cuối tuần này nhu cầu Bia Heineken sẽ tăng gấp 3. Hãy chuẩn bị nhập thêm hàng.',
      time: 'Hôm qua',
      icon: Info,
    }
  ];

  const unreadCount = alerts.filter(a => a.type === 'critical' || a.type === 'warning').length;

  // Close when click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Alert Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[380px] origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 z-50"
          >
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900/50">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-indigo-500" /> AI Smart Alerts
              </h3>
              <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                Đánh dấu đã đọc
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex gap-4 border-b border-gray-50 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/50 cursor-pointer"
                >
                  <div
                    className={twMerge(
                      "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      alert.type === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      alert.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      alert.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    )}
                  >
                    <alert.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{alert.title}</p>
                      <span className="shrink-0 text-xs text-gray-400">{alert.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-100 p-2 dark:border-gray-800 text-center bg-gray-50 dark:bg-gray-900">
              <button className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                Xem tất cả thông báo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
