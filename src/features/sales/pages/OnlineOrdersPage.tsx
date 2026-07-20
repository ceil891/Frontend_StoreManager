import { Wrench } from 'lucide-react';

export function OnlineOrdersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-6">
        <Wrench className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Tính năng đang nâng cấp</h1>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
        Phần tạo và quản lý đơn hàng Online (E-commerce) hiện đang được bảo trì và nâng cấp để ghép nối với hệ thống API mới. Vui lòng quay lại sau!
      </p>
    </div>
  );
}
