import { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Send, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { useFinanceStore, type JournalEntry, type JournalLine } from '../store/financeStore';

const ACCOUNT_OPTIONS = [
  { code: '111', name: 'Tiền mặt' },
  { code: '1121', name: 'Tiền gửi ngân hàng VCB' },
  { code: '131', name: 'Phải thu khách hàng' },
  { code: '331', name: 'Phải trả nhà cung cấp' },
  { code: '334', name: 'Phải trả người lao động' },
  { code: '511', name: 'Doanh thu bán hàng' },
  { code: '642', name: 'Chi phí quản lý doanh nghiệp' },
];

function toCurrency(value: number) {
  return `${value.toLocaleString('vi-VN')} ₫`;
}

export function JournalEntriesPage() {
  const journalEntries = useFinanceStore((s) => s.journalEntries);
  const updateJournalEntry = useFinanceStore((s) => s.updateJournalEntry);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (journalEntries[0]) setEntry(journalEntries[0]);
  }, [journalEntries]);

  const saveDraft = () => {
    if (!entry) return;
    updateJournalEntry(entry.id, entry);
  };

  const totals = useMemo(() => {
    if (!entry) return { debit: 0, credit: 0, delta: 0, isBalanced: false };
    const debit = entry.lines.reduce((sum, line) => sum + (Number.isFinite(line.debit) ? line.debit : 0), 0);
    const credit = entry.lines.reduce((sum, line) => sum + (Number.isFinite(line.credit) ? line.credit : 0), 0);
    return {
      debit,
      credit,
      delta: debit - credit,
      isBalanced: debit === credit && debit > 0,
    };
  }, [entry]);

  const updateLine = (lineId: string, updater: (line: JournalLine) => JournalLine) => {
    setEntry((prev) => {
      if (!prev) return prev;
      return {
      ...prev,
      lines: prev.lines.map((line) => (line.id === lineId ? updater(line) : line)),
    };
    });
  };

  const addLine = () => {
    const fallback = ACCOUNT_OPTIONS[0];
    setEntry((prev) => {
      if (!prev) return prev;
      return {
      ...prev,
      lines: [
        ...prev.lines,
        {
          id: `line_${Date.now()}`,
          accountCode: fallback.code,
          accountName: fallback.name,
          description: '',
          debit: 0,
          credit: 0,
        },
      ],
    };
    });
  };

  const removeLine = () => {
    if (!pendingDeleteId) return;
    setEntry((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        lines: prev.lines.filter((line) => line.id !== pendingDeleteId),
      };
    });
    setPendingDeleteId(null);
  };

  const postEntry = () => {
    if (!totals.isBalanced || !entry) return;
    const posted = { ...entry, status: 'POSTED' as const };
    setEntry(posted);
    updateJournalEntry(entry.id, posted);
  };

  if (!entry) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        Chưa có bút toán nhật ký. Dữ liệu sẽ được tải từ kho tài chính.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sổ nhật ký kế toán</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Nhập bút toán nhiều dòng Nợ/Có, kiểm soát cân bằng tức thì trước khi hạch toán.
              </p>
            </div>
            <span
              className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                entry.status === 'POSTED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
              }`}
            >
              {entry.status === 'POSTED' ? 'Đã hạch toán' : 'Nháp'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <label className="text-xs font-semibold text-gray-500">
              Số chứng từ
              <input
                value={entry.code}
                onChange={(e) => setEntry((prev) => (prev ? { ...prev, code: e.target.value } : prev))}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="text-xs font-semibold text-gray-500">
              Ngày chứng từ
              <input
                type="date"
                value={entry.date}
                onChange={(e) => setEntry((prev) => (prev ? { ...prev, date: e.target.value } : prev))}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="text-xs font-semibold text-gray-500">
              Tham chiếu
              <input
                value={entry.reference}
                onChange={(e) => setEntry((prev) => (prev ? { ...prev, reference: e.target.value } : prev))}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
            <label className="text-xs font-semibold text-gray-500 md:col-span-1">
              Diễn giải
              <input
                value={entry.description}
                onChange={(e) => setEntry((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-3">TK</th>
                  <th className="px-3 py-3">Tên tài khoản</th>
                  <th className="px-3 py-3">Diễn giải dòng</th>
                  <th className="px-3 py-3 text-right">Nợ</th>
                  <th className="px-3 py-3 text-right">Có</th>
                  <th className="px-3 py-3 text-center">Xóa</th>
                </tr>
              </thead>
              <tbody>
                {entry.lines.map((line) => (
                  <tr key={line.id} className="border-t border-gray-100 dark:border-gray-700/70">
                    <td className="px-3 py-2">
                      <select
                        value={line.accountCode}
                        onChange={(e) => {
                          const selected = ACCOUNT_OPTIONS.find((opt) => opt.code === e.target.value);
                          if (!selected) return;
                          updateLine(line.id, (prev) => ({
                            ...prev,
                            accountCode: selected.code,
                            accountName: selected.name,
                          }));
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 font-mono text-xs focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
                      >
                        {ACCOUNT_OPTIONS.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            {opt.code}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{line.accountName}</td>
                    <td className="px-3 py-2">
                      <input
                        value={line.description}
                        onChange={(e) => updateLine(line.id, (prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
                        placeholder="Nhập diễn giải"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={line.debit || 0}
                        onChange={(e) =>
                          updateLine(line.id, (prev) => ({
                            ...prev,
                            debit: Number(e.target.value) || 0,
                            credit: Number(e.target.value) > 0 ? 0 : prev.credit,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-right font-mono text-xs focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={line.credit || 0}
                        onChange={(e) =>
                          updateLine(line.id, (prev) => ({
                            ...prev,
                            credit: Number(e.target.value) || 0,
                            debit: Number(e.target.value) > 0 ? 0 : prev.debit,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-right font-mono text-xs focus:border-emerald-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        onClick={() => setPendingDeleteId(line.id)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
            <button
              onClick={addLine}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
              Thêm dòng định khoản
            </button>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 mt-6 rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              Tổng Nợ: <span className="font-mono">{toCurrency(totals.debit)}</span>
            </span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              Tổng Có: <span className="font-mono">{toCurrency(totals.credit)}</span>
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${
                totals.isBalanced
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
              }`}
            >
              {!totals.isBalanced && <AlertCircle className="h-3.5 w-3.5" />}
              {totals.isBalanced ? 'Cân bằng Nợ/Có' : `Lệch ${toCurrency(Math.abs(totals.delta))}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={saveDraft}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Save className="h-4 w-4" />
              Lưu nháp
            </button>
            <button
              disabled={!totals.isBalanced}
              onClick={postEntry}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              <Send className="h-4 w-4" />
              Hạch toán
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        title="Xóa dòng định khoản"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn chắc chắn muốn xóa dòng định khoản này khỏi bút toán?
          </p>
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <button
              onClick={() => setPendingDeleteId(null)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={removeLine}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Xóa dòng
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
