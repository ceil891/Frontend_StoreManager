import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Eye, Edit, Trash2, Search, TrendingDown, BarChart3, Package } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore } from '../store/financeStore';

interface DepreciationRecord {
  id: string;
  depCode: string;
  assetCode: string;
  assetName: string;
  depPeriod: string;
  depMethod: 'STRAIGHT_LINE' | 'DECLINING_BALANCE' | 'UNITS_OF_PRODUCTION';
  originalValue: number;
  depAmount: number;
  accumulatedDep: number;
  netBookValue: number;
  depDate: string;
  accountingPeriod: string;
  status: 'POSTED' | 'DRAFT' | 'REVERSED';
  notes?: string;
}

const fmt = (n: number) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const methodLabels: Record<string, string> = {
  STRAIGHT_LINE: 'Đường thẳng',
  DECLINING_BALANCE: 'Số dư giảm dần',
  UNITS_OF_PRODUCTION: 'Sản lượng',
};

const statusConfig: Record<string, { label: string; className: string }> = {
  POSTED:   { label: 'Đã ghi sổ',   className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  DRAFT:    { label: 'Nháp',         className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  REVERSED: { label: 'Đảo ngược',   className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
};

export function DepreciationHistoryPage() {
  const setData = (_fn: any) => {};
  const {
    depreciations: storeDepreciations,
    fetchDepreciations,
  } = useFinanceStore();

  useEffect(() => {
    fetchDepreciations();
  }, [fetchDepreciations]);

  const data: DepreciationRecord[] = useMemo(() => {
    return storeDepreciations.map((d) => ({
      id: d.id,
      depCode: `DEP-${d.id}`,
      assetCode: d.assetCode,
      assetName: d.assetName,
      depPeriod: d.depreciationMonth,
      depMethod: 'STRAIGHT_LINE',
      originalValue: d.monthlyAmount * 36,
      depAmount: d.monthlyAmount,
      accumulatedDep: d.accumulatedTotal,
      netBookValue: d.monthlyAmount * 36 - d.accumulatedTotal,
      depDate: d.depreciationMonth,
      accountingPeriod: d.depreciationMonth,
      status: 'POSTED',
      notes: d.assetName,
    }));
  }, [storeDepreciations]);
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selected, setSelected] = useState<DepreciationRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingRec, setEditingRec] = useState<Partial<DepreciationRecord>>({});
  const [deletingRec, setDeletingRec] = useState<DepreciationRecord | null>(null);

  const periods = [...new Set(data.map((d) => d.depPeriod))].sort();

  const filtered = data.filter((r) => {
    const matchSearch =
      r.depCode.toLowerCase().includes(search.toLowerCase()) ||
      r.assetCode.toLowerCase().includes(search.toLowerCase()) ||
      r.assetName.toLowerCase().includes(search.toLowerCase());
    const matchPeriod = periodFilter === 'all' || r.depPeriod === periodFilter;
    const matchMethod = methodFilter === 'all' || r.depMethod === methodFilter;
    return matchSearch && matchPeriod && matchMethod;
  });

  const totalDep = data.filter((r) => r.status === 'POSTED').reduce((s, r) => s + r.depAmount, 0);
  const totalAccumulated = Math.max(...data.map((r) => r.accumulatedDep), 0);
  const uniqueAssets = new Set(data.map((r) => r.assetCode)).size;

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingRec({ depPeriod: '2024-Q4', depMethod: 'STRAIGHT_LINE', status: 'DRAFT', depDate: new Date().toISOString().split('T')[0], accountingPeriod: 'Q4-2024' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: DepreciationRecord) => {
    setModalMode('edit');
    setEditingRec(rec);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const netBook = (editingRec.originalValue || 0) - (editingRec.accumulatedDep || 0);
    if (modalMode === 'create') {
      setData([{ id: Date.now().toString(), ...editingRec, netBookValue: netBook } as DepreciationRecord, ...data]);
    } else {
      setData(data.map((r) => (r.id === editingRec.id ? { ...r, ...editingRec, netBookValue: netBook } as DepreciationRecord : r)));
    }
    setIsModalOpen(false);
  };

  const columns = useMemo<ColumnDef<DepreciationRecord>[]>(
    () => [
      {
        accessorKey: 'depCode',
        header: 'Mã khấu hao',
        cell: (info) => <span className="font-mono font-bold text-xs text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        id: 'asset',
        header: 'Tài sản',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.assetName}</p>
            <p className="text-xs font-mono text-gray-500">{row.original.assetCode}</p>
          </div>
        ),
      },
      {
        accessorKey: 'depPeriod',
        header: 'Kỳ khấu hao',
        cell: (info) => <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'depMethod',
        header: 'Phương pháp',
        cell: (info) => <span className="text-xs text-gray-600 dark:text-gray-400">{methodLabels[info.getValue() as string] || info.getValue() as string}</span>,
      },
      {
        accessorKey: 'depAmount',
        header: 'Khấu hao kỳ này',
        cell: (info) => <span className="font-bold text-orange-600 dark:text-orange-400">{fmt(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'accumulatedDep',
        header: 'Lũy kế KH',
        cell: (info) => <span className="text-sm text-red-600 dark:text-red-400">{fmt(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'netBookValue',
        header: 'Giá trị còn lại',
        cell: (info) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const s = info.getValue() as string;
          const cfg = statusConfig[s];
          return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg?.className}`}>{cfg?.label || s}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4" /></button>
            <button onClick={() => handleOpenEdit(row.original)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
            <button onClick={() => setDeletingRec(row.original)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-orange-500" />
              Lịch sử khấu hao tài sản
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi lịch sử khấu hao theo từng kỳ kế toán cho tất cả tài sản cố định.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm"><Download className="w-4 h-4" /> Xuất báo cáo</button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"><Plus className="w-4 h-4" /> Ghi khấu hao</button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Khấu hao đã ghi sổ', value: fmt(totalDep), Icon: TrendingDown, color: 'text-orange-600 dark:text-orange-400' },
            { label: 'Tổng lũy kế (max)', value: fmt(totalAccumulated), Icon: BarChart3, color: 'text-red-600 dark:text-red-400' },
            { label: 'Số tài sản đang KH', value: `${uniqueAssets} tài sản`, Icon: Package, color: 'text-blue-600 dark:text-blue-400' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo mã KH, mã tài sản, tên tài sản..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>
          <select value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
            <option value="all">Tất cả kỳ</option>
            {periods.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
            <option value="all">Tất cả phương pháp</option>
            {Object.entries(methodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      </div>

      {/* Drawer */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết: ${selected.depCode}` : ''} width="max-w-lg">
        {selected && (
          <div className="space-y-4 p-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-1">Tài sản</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{selected.assetName}</p>
              <p className="text-sm font-mono text-gray-500">{selected.assetCode} · {selected.depPeriod}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nguyên giá', value: fmt(selected.originalValue), color: 'text-gray-900 dark:text-white' },
                { label: 'KH kỳ này', value: fmt(selected.depAmount), color: 'text-orange-600 dark:text-orange-400' },
                { label: 'Lũy kế KH', value: fmt(selected.accumulatedDep), color: 'text-red-600 dark:text-red-400' },
                { label: 'Giá trị còn lại', value: fmt(selected.netBookValue), color: 'text-emerald-600 dark:text-emerald-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
              {[['Phương pháp', methodLabels[selected.depMethod]], ['Ngày ghi sổ', selected.depDate], ['Kỳ kế toán', selected.accountingPeriod], ['Ghi chú', selected.notes || '—']].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{k}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Ghi khấu hao mới' : 'Chỉnh sửa khấu hao'} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã tài sản *</label>
              <input required value={editingRec.assetCode || ''} onChange={(e) => setEditingRec({ ...editingRec, assetCode: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono focus:ring-2 focus:ring-emerald-500" placeholder="FA-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên tài sản *</label>
              <input required value={editingRec.assetName || ''} onChange={(e) => setEditingRec({ ...editingRec, assetName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="Tên tài sản..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kỳ khấu hao *</label>
              <input required value={editingRec.depPeriod || ''} onChange={(e) => setEditingRec({ ...editingRec, depPeriod: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" placeholder="2024-Q1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phương pháp *</label>
              <select value={editingRec.depMethod || 'STRAIGHT_LINE'} onChange={(e) => setEditingRec({ ...editingRec, depMethod: e.target.value as DepreciationRecord['depMethod'] })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500">
                {Object.entries(methodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nguyên giá *</label>
              <input type="number" min={0} required value={editingRec.originalValue || 0} onChange={(e) => setEditingRec({ ...editingRec, originalValue: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">KH kỳ này *</label>
              <input type="number" min={0} required value={editingRec.depAmount || 0} onChange={(e) => setEditingRec({ ...editingRec, depAmount: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lũy kế KH *</label>
              <input type="number" min={0} required value={editingRec.accumulatedDep || 0} onChange={(e) => setEditingRec({ ...editingRec, accumulatedDep: +e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày ghi sổ *</label>
              <input type="date" required value={editingRec.depDate || ''} onChange={(e) => setEditingRec({ ...editingRec, depDate: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select value={editingRec.status || 'DRAFT'} onChange={(e) => setEditingRec({ ...editingRec, status: e.target.value as DepreciationRecord['status'] })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500">
                <option value="DRAFT">Nháp</option>
                <option value="POSTED">Đã ghi sổ</option>
                <option value="REVERSED">Đảo ngược</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea rows={2} value={editingRec.notes || ''} onChange={(e) => setEditingRec({ ...editingRec, notes: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Ghi chú về bút toán khấu hao..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">{modalMode === 'create' ? 'Ghi nhận' : 'Lưu thay đổi'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal xóa */}
      <Modal isOpen={!!deletingRec} onClose={() => setDeletingRec(null)} title="Xác nhận xóa bút toán khấu hao" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Xóa bút toán <strong>{deletingRec?.depCode}</strong> — {deletingRec?.assetName} ({deletingRec?.depPeriod})?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setDeletingRec(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button onClick={() => { setData(data.filter((r) => r.id !== deletingRec?.id)); setDeletingRec(null); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
