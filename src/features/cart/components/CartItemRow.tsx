import { Minus, Plus, Trash2 } from 'lucide-react';
import type { CartItem } from '../types';
import { useCartStore } from '../store/cartStore';

interface Props {
  item: CartItem;
}

export function CartItemRow({ item }: Props) {
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const handleDecrement = () => {
    if (item.quantity <= 1) {
      removeItem(item.itemId);
    } else {
      updateItem(item.itemId, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    updateItem(item.itemId, item.quantity + 1);
  };

  const handleRemove = () => {
    removeItem(item.itemId);
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 border border-gray-200 dark:border-gray-700">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 text-xs">
            📦
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-snug">
          {item.productName}
        </p>
        {item.variantName && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {item.variantName}
          </p>
        )}
        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
          SKU: {item.sku}
        </p>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity stepper */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={handleDecrement}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-red-500 transition-colors"
              aria-label="Giảm số lượng"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-7 text-center text-sm font-semibold text-gray-900 dark:text-white tabular-nums">
              {item.quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-emerald-600 transition-colors"
              aria-label="Tăng số lượng"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Subtotal */}
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatPrice(item.subtotal)}
          </span>
        </div>
      </div>

      {/* Remove button */}
      <button
        onClick={handleRemove}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all duration-150 shrink-0 mt-0.5"
        aria-label="Xóa sản phẩm"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
