import { Plus, Trash2 } from 'lucide-react';
import type { OrderLineItem } from '@/features/sales/store/salesStore';

interface OrderLinesEditorProps {
  lines: OrderLineItem[];
  onChange: (lines: OrderLineItem[]) => void;
  currency?: 'VND' | 'USD';
}

function newLine(): OrderLineItem {
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sku: '',
    productName: '',
    quantity: 1,
    unitPrice: 0,
    lineTotal: 0,
  };
}

export function computeLineTotal(qty: number, unitPrice: number) {
  return Math.round(qty * unitPrice * 100) / 100;
}

export function summarizeOrderLines(lines: OrderLineItem[]): string {
  return lines
    .filter((l) => l.productName.trim())
    .map((l) => `${l.productName}×${l.quantity}`)
    .join(', ')
    .slice(0, 240);
}

export function sumOrderLines(lines: OrderLineItem[]): number {
  return lines.reduce((s, l) => s + (l.lineTotal || computeLineTotal(l.quantity, l.unitPrice)), 0);
}
export function OrderLinesEditor({ lines, onChange, currency = 'VND' }: OrderLinesEditorProps) {
  const symbol = currency === 'VND' ? 'đ' : '$';
  const fmt = (n: number) =>
    currency === 'VND' ? `${Math.round(n).toLocaleString('vi-VN')}${symbol}` : `${symbol}${n.toFixed(2)}`;

  const updateLine = (id: string, patch: Partial<OrderLineItem>) => {
    onChange(
      lines.map((l) => {
        if (l.id !== id) return l;
        const next = { ...l, ...patch };
        const qty = Number(next.quantity) || 0;
        const price = Number(next.unitPrice) || 0;
        next.lineTotal = computeLineTotal(qty, price);
        return next;
      })
    );
  };

  const addRow = () => onChange([...lines, newLine()]);
  const removeRow = (id: string) => onChange(lines.filter((l) => l.id !== id));

  const total = sumOrderLines(lines);

  const formatInputVal = (val: number) => {
    if (currency === 'VND') {
      return val === 0 ? '' : Math.round(val).toLocaleString('vi-VN');
    }
    return String(val);
  };

  const handlePriceChange = (id: string, rawVal: string) => {
    if (currency === 'VND') {
      const digits = rawVal.replace(/\D/g, '');
      const parsed = digits === '' ? 0 : parseInt(digits, 10);
      updateLine(id, { unitPrice: parsed });
    } else {
      updateLine(id, { unitPrice: parseFloat(rawVal) || 0 });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500 uppercase">Chi tiết dòng hàng</span>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm dòng
        </button>
      </div>

      {lines.length === 0 ? (
        <p className="text-xs text-gray-400 italic py-2">Chưa có sản phẩm. Nhấn &quot;Thêm dòng&quot;.</p>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {lines.map((line, idx) => (
            <div
              key={line.id}
              className="grid grid-cols-12 gap-2 items-end p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-55 dark:bg-gray-900/40"
            >
              <div className="col-span-4 sm:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase">SKU</label>
                <input
                  value={line.sku}
                  onChange={(e) => updateLine(line.id, { sku: e.target.value })}
                  className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-900 dark:border-gray-600"
                  placeholder="SV-001"
                />
              </div>
              <div className="col-span-8 sm:col-span-4">
                <label className="text-[10px] text-gray-400 uppercase">Tên SP #{idx + 1}</label>
                <input
                  required
                  value={line.productName}
                  onChange={(e) => updateLine(line.id, { productName: e.target.value })}
                  className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-900 dark:border-gray-600"
                  placeholder="Tên sản phẩm"
                />
              </div>
              <div className="col-span-4 sm:col-span-2">
                <label className="text-[10px] text-gray-400 uppercase">SL</label>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(line.id, { quantity: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-900 dark:border-gray-65"
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label className="text-[10px] text-gray-400 uppercase">Đơn giá</label>
                <input
                  type={currency === 'VND' ? 'text' : 'number'}
                  min={0}
                  step={currency === 'VND' ? 1 : 0.01}
                  value={formatInputVal(line.unitPrice)}
                  onChange={(e) => handlePriceChange(line.id, e.target.value)}
                  className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-900 dark:border-gray-600"
                />
              </div>
              <div className="col-span-2 sm:col-span-1 flex items-center justify-end pb-0.5">
                <button
                  type="button"
                  onClick={() => removeRow(line.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded shrink-0"
                  title="Xóa dòng"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end text-sm font-bold text-gray-900 dark:text-white border-t pt-2 dark:border-gray-700">
        Tổng dòng: {fmt(total)}
      </div>
    </div>
  );
}
