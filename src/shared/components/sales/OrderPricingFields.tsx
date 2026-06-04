import { calcTotalAmount } from '@/features/sales/store/salesStore';

export type OrderPricingValues = {
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingFee?: number;
  totalAmount: number;
};

type Props = {
  values: OrderPricingValues;
  onChange: (patch: Partial<OrderPricingValues>) => void;
  showShipping?: boolean;
  currency?: 'VND' | 'USD';
};

export function OrderPricingFields({ values, onChange, showShipping = false, currency = 'USD' }: Props) {
  const recalc = (patch: Partial<OrderPricingValues>) => {
    const next = { ...values, ...patch };
    onChange({
      ...patch,
      totalAmount: calcTotalAmount({
        subTotal: next.subTotal,
        taxAmount: next.taxAmount,
        discountAmount: next.discountAmount,
        shippingFee: next.shippingFee,
      }),
    });
  };

  const step = currency === 'VND' ? 1 : 0.01;

  return (
    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700">
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tiền hàng (subTotal)</label>
        <input
          type="number"
          step={step}
          value={values.subTotal}
          onChange={(e) => recalc({ subTotal: parseFloat(e.target.value) || 0 })}
          className="w-full px-2 py-1.5 border rounded-lg text-sm font-mono dark:bg-gray-900"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Thuế (VAT)</label>
        <input
          type="number"
          step={step}
          value={values.taxAmount}
          onChange={(e) => recalc({ taxAmount: parseFloat(e.target.value) || 0 })}
          className="w-full px-2 py-1.5 border rounded-lg text-sm font-mono dark:bg-gray-900"
        />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Giảm giá</label>
        <input
          type="number"
          step={step}
          value={values.discountAmount}
          onChange={(e) => recalc({ discountAmount: parseFloat(e.target.value) || 0 })}
          className="w-full px-2 py-1.5 border rounded-lg text-sm font-mono dark:bg-gray-900"
        />
      </div>
      {showShipping ? (
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Phí ship</label>
          <input
            type="number"
            step={step}
            value={values.shippingFee ?? 0}
            onChange={(e) => recalc({ shippingFee: parseFloat(e.target.value) || 0 })}
            className="w-full px-2 py-1.5 border rounded-lg text-sm font-mono dark:bg-gray-900"
          />
        </div>
      ) : (
        <div className="flex items-end">
          <p className="text-xs text-gray-500">Tổng = subTotal + thuế + ship − giảm giá</p>
        </div>
      )}
      <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Tổng thanh toán</span>
        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
          {currency === 'VND'
            ? `${Math.round(values.totalAmount).toLocaleString('vi-VN')}đ`
            : `$${values.totalAmount.toFixed(2)}`}
        </span>
      </div>
    </div>
  );
}
