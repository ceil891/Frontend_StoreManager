import React from 'react';
import { Clock, LogOut, ShieldAlert } from 'lucide-react';

interface IdleTimeoutModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  totalWarningSeconds?: number;
  onStayLoggedIn: () => void;
  onLogout: () => void;
}

export const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({
  isOpen,
  remainingSeconds,
  totalWarningSeconds = 60,
  onStayLoggedIn,
  onLogout,
}) => {
  if (!isOpen) return null;

  // Tính phần trăm thời gian còn lại cho thanh tiến trình
  const percentage = Math.min(100, Math.max(0, (remainingSeconds / totalWarningSeconds) * 100));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-7 text-center transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="idle-modal-title"
      >
        {/* Icon cảnh báo */}
        <div className="relative mx-auto mb-5 w-16 h-16 flex items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
          <Clock className="w-8 h-8 animate-pulse" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        {/* Tiêu đề & Nội dung */}
        <h3
          id="idle-modal-title"
          className="text-xl font-bold text-gray-900 dark:text-white mb-2"
        >
          Phiên làm việc sắp hết hạn
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          Hệ thống không ghi nhận thao tác của bạn trong một thời gian. Vì lý do an toàn thông tin quầy, phiên làm việc sẽ tự động kết thúc sau:
        </p>

        {/* Đồng hồ đếm ngược lớn */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex items-baseline gap-1 text-4xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            <span>{remainingSeconds}</span>
            <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">giây</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-amber-500 dark:bg-amber-400 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Nhắc nhở */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-6">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Bấm &quot;Tiếp tục làm việc&quot; để duy trì ca bán hàng.</span>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <LogOut className="w-4 h-4 text-gray-500" />
            Đăng xuất ngay
          </button>

          <button
            type="button"
            onClick={onStayLoggedIn}
            autoFocus
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold shadow-md shadow-primary/25 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Tiếp tục làm việc
          </button>
        </div>
      </div>
    </div>
  );
};
