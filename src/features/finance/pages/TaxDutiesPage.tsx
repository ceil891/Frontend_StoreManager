import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useMemo, useState, useEffect } from 'react';
import { Search, Download, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { financeService } from '../services/financeService';
import { toast } from 'sonner';

export interface TaxDutyItem {
  id: string;
  type: string;
  period: string;
  amountDue: number;
  amountPaid: number;
  status: string;
}

const fmt = (n: number) => (n || 0).toLocaleString('vi-VN') + ' ₫';

const statusCfg: Record<string, { label: string; cls: string }> = {
  ĐÃ_HOÀN_THÀNH: { label: 'Đã hoàn thành', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  CHƯA_HOÀN_THÀNH: { label: 'Chưa hoàn thành', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
};

import { useFinanceStore } from '../store/financeStore';

export function TaxDutiesPage() {
  const {
    taxDuties: storeTaxDuties,
    fetchTaxDuties,
    addTaxDuty,
    updateTaxDuty,
    deleteTaxDuty,
    isLoading,
  } = useFinanceStore();

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TaxDutyItem | null>(null);
  const [isModal, setIsModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<TaxDutyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<Partial<TaxDutyItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTaxDuties();
  }, [fetchTaxDuties]);

  const data: TaxDutyItem[] = useMemo(() => {
    return (storeTaxDuties || []).map((t: any) => ({
      id: String(t.id),
      type: t.type || t.taxType || 'Thuế GTGT (VAT)',
      period: t.period || t.declarationPeriod || 'Q3-2026',
      amountDue: Number(t.amountDue || t.taxAmount || 0),
      amountPaid: Number(t.amountPaid || 0),
      status: (t.status === 'DA_NOP' || t.status === 'COMPLETED' ? 'ĐÃ_HOÀN_THÀNH' : 'CHƯA_HOÀN_THÀNH') as any,
    }));
  }, [storeTaxDuties]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) => d.type.toLowerCase().includes(q) || d.period.toLowerCase().includes(q)
    );
  }, [data, search]);

  const openCreate = () => {
    setForm({
      type: 'Thuế GTGT (VAT)',
      period: 'Q3-2026',
      amountDue: 0,
      amountPaid: 0,
      status: 'CHƯA_HOÀN_THÀNH',
    });
    setIsModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        type: form.type || 'Thuế GTGT (VAT)',
        period: form.period || 'Q3-2026',
        amountDue: Number(form.amountDue || 0),
        amountPaid: Number(form.amountPaid || 0),
        status: form.status || 'CHƯA_HOÀN_THÀNH',
      };

      if (form.id) {
        await updateTaxDuty(form.id, payload);
        toast.success('Cập nhật nghĩa vụ thuế thành công!');
      } else {
        await addTaxDuty(payload);
        toast.success('Tạo nghĩa vụ thuế mới thành công!');
      }
      setIsModal(false);
    } catch (err: any) {
      console.error('Save tax error:', err);
      toast.error('Không thể lưu nghĩa vụ thuế. Vui lòng kiểm tra lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      setIsDeleting(true);
      await deleteTaxDuty(deleteItem.id);
      toast.success('Đã xóa nghĩa vụ thuế thành công!');
      setDeleteItem(null);
    } catch (err: any) {
      console.error('Delete tax error:', err);
      toast.error('Lỗi khi xóa nghĩa vụ thuế!');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<TaxDutyItem>[]>(
    () => [
      { accessorKey: 'type', header: 'Loại thuế', cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span> },
      { accessorKey: 'period', header: 'Kỳ kê khai', cell: (info) => <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span> },
      {
        accessorKey: 'amountDue',
        header: 'Số thuế phải nộp',
        cell: (info) => (
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {fmt(info.getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'amountPaid',
        header: 'Số thuế đã nộp',
        cell: (info) => (
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {fmt(info.getValue() as number)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const s = statusCfg[info.getValue() as string];
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s?.cls}`}>
              {s?.label || (info.getValue() as string)}
            </span>
          );
        },
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
              onClick={() => setDeleteItem(row.original)}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nghĩa vụ thuế & Ngân sách Nhà nước</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý và theo dõi các khoản thuế phải nộp và đã nộp theo kỳ kế toán
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
              <Plus className="w-4 h-4" /> Thêm nghĩa vụ
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
              placeholder="Tìm theo loại thuế, kỳ kê khai..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải nghĩa vụ thuế...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
        )}
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi tiết: ${selected.type}` : ''}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Loại thuế', selected.type],
                ['Kỳ kê khai', selected.period],
                ['Số thuế phải nộp', fmt(selected.amountDue)],
                ['Số thuế đã nộp', fmt(selected.amountPaid)],
                ['Trạng thái', statusCfg[selected.status]?.label || selected.status],
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
        title={form.id ? `Cập nhật Nghĩa Vụ Thuế` : `Thêm Nghĩa Vụ Thuế`}
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loại thuế *
              </label>
              <select
                required
                value={form.type || 'Thuế GTGT (VAT)'}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Thuế GTGT (VAT)">Thuế GTGT (VAT)</option>
                <option value="Thuế Thu nhập Doanh nghiệp (CIT)">Thuế Thu nhập Doanh nghiệp (CIT)</option>
                <option value="Thuế Thu nhập Cá nhân (PIT)">Thuế Thu nhập Cá nhân (PIT)</option>
                <option value="Thuế Môn bài">Thuế Môn bài</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kỳ kê khai *
              </label>
              <input
                required
                value={form.period || ''}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                placeholder="VD: Q3-2026 hoặc 08-2026"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số thuế phải nộp (VNĐ) *
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={form.amountDue || 0}
                onChange={(e) => setForm({ ...form, amountDue: +e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số thuế đã nộp (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={form.amountPaid || 0}
                onChange={(e) => setForm({ ...form, amountPaid: +e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono font-semibold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Trạng thái *
            </label>
            <select
              required
              value={form.status || 'CHƯA_HOÀN_THÀNH'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="CHƯA_HOÀN_THÀNH">Chưa hoàn thành</option>
              <option value="ĐÃ_HOÀN_THÀNH">Đã hoàn thành</option>
            </select>
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
              {isSubmitting ? 'Đang lưu...' : 'Lưu nghĩa vụ'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Xác nhận xóa nghĩa vụ thuế"
        description="Bạn có chắc chắn muốn xóa nghĩa vụ thuế này không? Thao tác này không thể hoàn tác."
        itemName={deleteItem ? `${deleteItem.type} (${deleteItem.period})` : ''}
      />
    </>
  );
}
