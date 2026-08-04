import { useNavigate } from 'react-router';
import { ShoppingBag, LogIn } from 'lucide-react';
import { useIsAuthenticated } from '@/features/auth/store/authStore';
import { useCartTotalAmount, useCartTotalQuantity } from '../store/cartStore';

interface Props {
  onClose: () => void;
}

export function CartSummary({ onClose }: Props) {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const totalAmount = useCartTotalAmount();
  const totalQuantity = useCartTotalQuantity();

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  const handleCheckout = () => {
    onClose();
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login', { state: { from: '/checkout' } });
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-3 bg-white dark:bg-gray-900">
      {/* Totals */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          {totalQuantity} sản phẩm
        </span>
        <span className="font-bold text-gray-900 dark:text-white text-base tabular-nums">
          {formatPrice(totalAmount)}
        </span>
      </div>

      <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
        💡 Giá hiển thị là giá tại thời điểm thêm vào giỏ. Giá thực sẽ được xác nhận khi thanh toán.
      </p>

      {/* CTA */}
      {isAuthenticated ? (
        <button
          onClick={handleCheckout}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-xl transition-all duration-150 text-sm"
        >
          <ShoppingBag className="w-4 h-4" />
          Thanh toán
        </button>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleCheckout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-xl transition-all duration-150 text-sm"
          >
            <LogIn className="w-4 h-4" />
            Đăng nhập để thanh toán
          </button>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Giỏ hàng sẽ được giữ nguyên sau khi đăng nhập
          </p>
        </div>
      )}
    </div>
  );
}
