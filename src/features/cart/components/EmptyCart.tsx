import { Package } from 'lucide-react';

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
      <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
        <Package className="w-9 h-9 text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
        Giỏ hàng trống
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Hãy thêm sản phẩm vào giỏ hàng để bắt đầu mua sắm.
      </p>
    </div>
  );
}
