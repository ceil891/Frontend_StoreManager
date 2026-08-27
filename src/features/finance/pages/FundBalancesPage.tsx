import { useMemo, useState, useEffect } from 'react';
import { Search, Download, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { financeService } from '../services/financeService';
import { toast } from 'sonner';

export interface FundBalanceItem {
  id: string;
  balanceDate: string;
  cashOnHand: number;
  bankBalance: number;
  totalFund: number;
  branch: string;
  manager: string;
}

const fmt = (n: number) => (n || 0).toLocaleString('vi-VN') + ' ₫';

const BRANCH_OPTIONS = [
  'Hội Sở Chính Hà Nội',
  'Chi nhánh Quận 1 TP.HCM',
  'Chi nhánh Đà Nẵng',
  'Chi nhánh Cần Thơ',
  'Chi nhánh Hải Phòng',
  'Chi nhánh Cầu Giấy, Hà Nội',
];

export function FundBalancesPage() {
  const [data, setData] = useState<FundBalanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FundBalanceItem | null>(null);
  const [isModal, setIsModal] = useState(false);
  const [form, setForm] = useState<Partial<FundBalanceItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const items = await financeService.fetchFundBalances();
      setData(items);
    } catch (err: any) {
      console.error('Failed to load fund balances:', err);
      toast.error('Lỗi khi tải dữ liệu số dư quỹ!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.branch.toLowerCase().includes(q) ||
        d.manager.toLowerCase().includes(q) ||
        d.balanceDate.includes(q)
    );
  }, [data, search]);

  const openCreate = () => {
    setForm({
      balanceDate: new Date().toISOString().split('T')[0],
      cashOnHand: 0,
      bankBalance: 0,
      totalFund: 0,
      branch: BRANCH_OPTIONS[0],
      manager: 'Nguyễn Thị Lan (Thủ quỹ)',
    });
    setIsModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const total = (Number(form.cashOnHand) || 0) + (Number(form.bankBalance) || 0);
      const payload = {
        ...form,
        cashOnHand: Number(form.cashOnHand) || 0,
        bankBalance: Number(form.bankBalance) || 0,
        totalFund: total,
        branch: form.branch || BRANCH_OPTIONS[0],
        manager: form.manager || 'Thủ quỹ',
      };

      if (form.id) {
        await financeService.updateFundBalance(form.id, payload);
        setData((prev) =>
          prev.map((item) => (item.id === form.id ? ({ ...item, ...payload } as FundBalanceItem) : item))
        );
        toast.success('Cập nhật số dư quỹ thành công!');
      } else {
        const created = await financeService.addFundBalance(payload);
        setData((prev) => [{ ...payload, id: String(created.id) } as FundBalanceItem, ...prev]);
        toast.success('Tạo chốt số dư quỹ mới thành công!');
      }
      setIsModal(false);
    } catch (err: any) {
      console.error('Save fund balance error:', err);
      toast.error('Không thể lưu số dư quỹ. Vui lòng kiểm tra lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi chốt số dư quỹ này?')) {
      try {
        await financeService.deleteFundBalance(id);
        setData((prev) => prev.filter((d) => d.id !== id));
        toast.success('Đã xóa bản ghi số dư quỹ thành công!');
      } catch (err: any) {
        console.error('Delete fund balance error:', err);
        toast.error('Lỗi khi xóa bản ghi số dư quỹ!');
      }
    }
  };

  const columns = useMemo<ColumnDef<FundBalanceItem>[]>(
    () => [
      {
        accessorKey: 'balanceDate',
        header: 'Ngày chốt',
        cell: (info) => (
          <span className="font-mono text-sm text-gray-700 dark:text-gray-300 font-semibold">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'cashOnHand',
        header: 'Tiền Mặt tại Két',
        cell: (info) => (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {fmt(info.getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'bankBalance',
        header: 'Số dư Ngân hàng',
        cell: (info) => (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {fmt(info.getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'totalFund',
        header: 'Tổng tồn quỹ',
        cell: (info) => (
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            {fmt(info.getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'branch',
        header: 'Chi nhánh',
        cell: (info) => (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'manager',
        header: 'Người chốt',
        cell: (info) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setForm(row.original);
                setIsModal(true);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chốt số dư quỹ & Tiền mặt</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Theo dõi số dư tiền mặt tại két và số dư tài khoản ngân hàng của từng chi nhánh theo thời gian thực
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất báo cáo
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm số dư mới
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo chi nhánh, người chốt hoặc ngày chốt quỹ..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải danh sách số dư quỹ...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
        )}
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi tiết số dư: ${selected.branch}` : ''}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Ngày chốt', selected.balanceDate],
                ['Chi nhánh', selected.branch],
                ['Người chốt', selected.manager],
                ['Tiền mặt tại két', fmt(selected.cashOnHand)],
                ['Số dư ngân hàng', fmt(selected.bankBalance)],
                ['Tổng tồn quỹ', fmt(selected.totalFund)],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500">{l}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModal}
        onClose={() => setIsModal(false)}
        title={form.id ? `Cập nhật Số Dư Quỹ` : `Thêm Số Dư Quỹ`}
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ngày chốt *
              </label>
              <input
                type="date"
                required
                value={form.balanceDate || ''}
                onChange={(e) => setForm({ ...form, balanceDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Chi nhánh *
              </label>
              <select
                required
                value={form.branch || BRANCH_OPTIONS[0]}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tiền mặt tại két (VNĐ) *
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={form.cashOnHand || 0}
                onChange={(e) => setForm({ ...form, cashOnHand: +e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số dư ngân hàng (VNĐ) *
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={form.bankBalance || 0}
                onChange={(e) => setForm({ ...form, bankBalance: +e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Người chốt / Kiểm toán viên *
              </label>
              <input
                required
                value={form.manager || ''}
                placeholder="VD: Nguyễn Thị Lan (Thủ quỹ)"
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModal(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-sm shadow-sm"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu số dư'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
