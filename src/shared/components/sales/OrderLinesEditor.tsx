import { Plus, Trash2 } from 'lucide-react';
import type { OrderLineItem } from '@/features/sales/store/salesStore';
import { QuoteVariantSelector, type SelectedVariantInfo } from './QuoteVariantSelector';

interface OrderLinesEditorProps {
  lines: OrderLineItem[];
  onChange: (lines: OrderLineItem[]) => void;
  currency?: 'VND' | 'USD';
}

function newLine(): OrderLineItem {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sku: '',
    barcode: '',
    productName: '',
    unit: 'Cái',
    quantity: 1,
    unitPrice: 0,
    discountType: 'AMOUNT',
    discountValue: 0,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    lineTotal: 0,
  };
}

export function computeLineTotal(line: OrderLineItem): number {
  const qty = Number(line.quantity) || 0;
  const price = Number(line.unitPrice) || 0;
  const rawSub = qty * price;
  
  let lineDiscount = 0;
  if (line.discountType === 'PERCENT' && line.discountValue) {
    lineDiscount = (rawSub * line.discountValue) / 100;
  } else if (line.discountValue) {
    lineDiscount = Number(line.discountValue);
  } else if (line.discountAmount) {
    lineDiscount = Number(line.discountAmount);
  }

  let lineTax = 0;
  if (line.taxRate) {
    lineTax = ((rawSub - lineDiscount) * line.taxRate) / 100;
  }

  return Math.max(0, Math.round((rawSub - lineDiscount + lineTax) * 100) / 100);
}

export function summarizeOrderLines(lines: OrderLineItem[]): string {
  return lines
    .filter((l) => l.productName.trim())
    .map((l) => `${l.productName}×${l.quantity}`)
    .join(', ')
    .slice(0, 240);
}

export function sumOrderLines(lines: OrderLineItem[]): number {
  return lines.reduce((s, l) => s + (l.lineTotal || computeLineTotal(l)), 0);
}

export function OrderLinesEditor({ lines, onChange, currency = 'VND' }: OrderLinesEditorProps) {
  const symbol = currency === 'VND' ? 'đ' : '$';
  const fmt = (n: number) =>
    currency === 'VND' ? `${Math.round(n).toLocaleString('vi-VN')} ${symbol}` : `${symbol}${n.toFixed(2)}`;

  const updateLine = (id: string, patch: Partial<OrderLineItem>) => {
    onChange(
      lines.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        next.lineTotal = computeLineTotal(next);
        return next;
      })
    );
  };

  const handleVariantSelect = (id: string, sel: SelectedVariantInfo) => {
    updateLine(id, {
      productVariantId: sel.variantId,
      productId: sel.productId,
      sku: sel.sku,
      barcode: sel.barcode,
      productName: sel.productName,
      unit: sel.unit,
      unitPrice: sel.unitPrice,
    });
  };

  const addRow = () => onChange([...lines, newLine()]);
  const removeRow = (id: string) => onChange(lines.filter((l) => l.id !== id));

  const total = sumOrderLines(lines);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chi tiết sản phẩm / biến thể báo giá</span>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm dòng
        </button>
      </div>

      {lines.length === 0 ? (
        <div className="p-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-xs text-gray-400 italic">Chưa có sản phẩm trong báo giá. Nhấn nút &quot;Thêm dòng&quot; để tạo dòng sản phẩm mới.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {lines.map((line, idx) => (
            <div
              key={line.id}
              className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/60 space-y-2 shadow-sm"
            >
              <div className="grid grid-cols-12 gap-2 items-center">
                {/* Variant Lookup */}
                <div className="col-span-12 sm:col-span-5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Sản phẩm / biến thể #{idx + 1} *</label>
                  <QuoteVariantSelector
                    value={String(line.productVariantId || line.productId || '')}
                    onChange={(sel) => handleVariantSelect(line.id, sel)}
                  />
                </div>

                {/* SKU */}
                <div className="col-span-6 sm:col-span-2">
                  <label className="text-[10px] text-gray-400 uppercase">SKU</label>
                  <input
                    value={line.sku}
                    onChange={(e) => updateLine(line.id, { sku: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-600 font-mono"
                    placeholder="SKU..."
                  />
                </div>

                {/* Barcode */}
                <div className="col-span-6 sm:col-span-2">
                  <label className="text-[10px] text-gray-400 uppercase">Mã vạch (Barcode)</label>
                  <input
                    value={line.barcode || ''}
                    onChange={(e) => updateLine(line.id, { barcode: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-600 font-mono"
                    placeholder="Mã vạch..."
                  />
                </div>

                {/* ĐVT */}
                <div className="col-span-6 sm:col-span-2">
                  <label className="text-[10px] text-gray-400 uppercase">ĐVT</label>
                  <input
                    value={line.unit || 'Cái'}
                    onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-600"
                    placeholder="Lon, chai, cái..."
                  />
                </div>

                <div className="col-span-6 sm:col-span-1 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => removeRow(line.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 transition-colors"
                    title="Xóa dòng sản phẩm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Numbers Row */}
              <div className="grid grid-cols-12 gap-2 items-center pt-1 border-t border-gray-200/60 dark:border-gray-800">
                {/* Quantity */}
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[10px] text-gray-400 uppercase">Số lượng *</label>
                  <input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) => updateLine(line.id, { quantity: Math.max(1, parseFloat(e.target.value) || 1) })}
                    className="w-full px-2 py-1 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-600 font-bold"
                  />
                </div>

                {/* Price */}
                <div className="col-span-4 sm:col-span-3">
                  <label className="text-[10px] text-gray-400 uppercase">Đơn giá *</label>
                  <input
                    type="number"
                    min={0}
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.id, { unitPrice: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-2 py-1 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-600 font-bold text-emerald-600"
                  />
                </div>

                {/* Line Discount */}
                <div className="col-span-4 sm:col-span-3">
                  <label className="text-[10px] text-gray-400 uppercase">Chiết khấu dòng</label>
                  <div className="flex gap-1">
                    <select
                      value={line.discountType || 'AMOUNT'}
                      onChange={(e) => updateLine(line.id, { discountType: e.target.value as any })}
                      className="px-1.5 py-1 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-600 shrink-0"
                    >
                      <option value="AMOUNT">Số tiền (đ)</option>
                      <option value="PERCENT">Tỷ lệ (%)</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={line.discountValue || 0}
                      onChange={(e) => updateLine(line.id, { discountValue: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-full px-2 py-1 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-600"
                    />
                  </div>
                </div>

                {/* VAT Tax */}
                <div className="col-span-4 sm:col-span-2">
                  <label className="text-[10px] text-gray-400 uppercase">Thuế VAT %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={line.taxRate || 0}
                    onChange={(e) => updateLine(line.id, { taxRate: Math.max(0, parseFloat(e.target.value) || 0) })}
                    className="w-full px-2 py-1 text-xs border rounded-lg dark:bg-gray-900 dark:border-gray-600"
                    placeholder="%"
                  />
                </div>

                {/* Line Subtotal */}
                <div className="col-span-8 sm:col-span-2 text-right">
                  <label className="text-[10px] text-gray-400 uppercase block">Thành tiền</label>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {fmt(line.lineTotal || computeLineTotal(line))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-sm font-bold text-gray-900 dark:text-white border-t pt-2 dark:border-gray-700">
        <span className="text-xs text-gray-500 font-normal">Tổng cộng {lines.length} sản phẩm</span>
        <span>Tổng tiền hàng: <span className="text-emerald-600 dark:text-emerald-400 text-base font-extrabold">{fmt(total)}</span></span>
      </div>
    </div>
  );
}
