import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Download, Eye, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useHrStore } from '../store/hrStore';
import { toast } from 'sonner';

export interface KpiItem {
  id: string;
  userId: string;
  userName: string;
  department: string;
  periodMonth: number;
  periodYear: number;
  targetScore: number;
  achievedScore: number;
  rating: string;
  note: string;
}

const ratingCfg: Record<string, { label: string; cls: string }> = {
  XUẤT_SẮC: { label: 'Xuất sắc', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  TỐT: { label: 'Tốt', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  ĐẠT: { label: 'Đạt', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
};

const ratingToGrade: Record<string, string> = {
  'XUẤT_SẮC': 'A_EXCELLENT',
  'TỐT': 'B_GOOD',
  'ĐẠT': 'C_AVERAGE',
};

export function KpiRecordsPage() {
  const {
    kpiRecords: storeKpis,
    fetchKpiRecords,
    addKpiRecord,
    updateKpiRecord,
    deleteKpiRecord,
  } = useHrStore();

  useEffect(() => {
    fetchKpiRecords();
  }, [fetchKpiRecords]);

  const data: KpiItem[] = useMemo(() => {
    return storeKpis.map((k) => ({
      id: k.id,
      userId: 'U001',
      userName: k.employeeName,
      department: k.departmentName,
      periodMonth: Number(k.kpiMonth.split('-')[1] || 6),
      periodYear: Number(k.kpiMonth.split('-')[0] || 2026),
      targetScore: k.targetScore,
      achievedScore: k.achievedScore,
      rating: k.ratingGrade === 'A_EXCELLENT' ? 'XUẤT_SẮC' : k.ratingGrade === 'B_GOOD' ? 'TỐT' : 'ĐẠT',
      note: `Thưởng KPI: ${k.bonusAmount.toLocaleString()}đ`,
    }));
  }, [storeKpis]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<KpiItem|null>(null);
  const [isModal, setIsModal] = useState(false);
  const [mode, setMode] = useState<'create'|'edit'>('create');
  const [form, setForm] = useState<Partial<KpiItem>>({});
  const [deletingKpi, setDeletingKpi] = useState<KpiItem | null>(null);

  const filtered = data.filter(d=>d.userName.toLowerCase().includes(search.toLowerCase())||d.department.toLowerCase().includes(search.toLowerCase()));

  const openCreate = ()=>{ setMode('create'); setForm({periodMonth:new Date().getMonth()+1,periodYear:new Date().getFullYear(),targetScore:100,achievedScore:0,rating:'ĐẠT'}); setIsModal(true); };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userName) {
      toast.error('Vui lòng nhập tên nhân viên!');
      return;
    }
    const payload = {
      employeeName: form.userName || '',
      departmentName: form.department || '',
      kpiMonth: `${form.periodYear || new Date().getFullYear()}-${String(form.periodMonth || 1).padStart(2, '0')}`,
      targetScore: form.targetScore || 100,
      achievedScore: form.achievedScore || 0,
      ratingGrade: (ratingToGrade[form.rating || 'ĐẠT'] || 'C_AVERAGE') as any,
      bonusAmount: 0,
      status: 'APPROVED' as any,
    };
    try {
      if (mode === 'create') {
        await addKpiRecord(payload);
        toast.success('Ghi nhận đánh giá KPI thành công!');
      } else if (form.id) {
        await updateKpiRecord(form.id, payload);
        toast.success('Cập nhật đánh giá KPI thành công!');
      }
      setIsModal(false);
    } catch (err: any) {
      console.error('Lỗi lưu KPI:', err);
      toast.error('Lỗi khi lưu đánh giá KPI: ' + (err?.message || 'Thất bại'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingKpi) return;
    try {
      await deleteKpiRecord(deletingKpi.id);
      toast.success(`Đã xóa đánh giá KPI của ${deletingKpi.userName}!`);
      setDeletingKpi(null);
    } catch (err: any) {
      console.error('Lỗi xóa KPI:', err);
      toast.error('Lỗi khi xóa KPI: ' + (err?.message || 'Thất bại'));
    }
  };

  const columns = useMemo<ColumnDef<KpiItem>[]>(()=>[
    {accessorKey:'userName',header:'Nhân viên',cell:({row})=><div><p className="font-medium text-gray-900 dark:text-white">{row.original.userName}</p><p className="text-xs text-gray-400">{row.original.department}</p></div>},
    {id:'period',header:'Kỳ đánh giá',cell:({row})=><span className="text-sm font-mono text-gray-700 dark:text-gray-300">Tháng {row.original.periodMonth}/{row.original.periodYear}</span>},
    {accessorKey:'targetScore',header:'Mục tiêu',cell:info=><span className="font-bold text-gray-700 dark:text-gray-300">{info.getValue() as number} điểm</span>},
    {accessorKey:'achievedScore',header:'Thực đạt',cell:({row})=>{
      const ratio = row.original.achievedScore/row.original.targetScore;
      return (
        <div className="flex items-center gap-1.5">
          {ratio>=1?<TrendingUp className="w-4 h-4 text-emerald-500"/>:<TrendingDown className="w-4 h-4 text-red-500"/>}
          <span className={`font-bold ${ratio>=1?'text-emerald-600 dark:text-emerald-400':'text-red-600 dark:text-red-400'}`}>{row.original.achievedScore} điểm</span>
          <span className="text-xs text-gray-400">({Math.round(ratio*100)}%)</span>
        </div>
      );
    }},
    {accessorKey:'rating',header:'Xếp loại',cell:info=>{const r=ratingCfg[info.getValue() as string];return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${r?.cls}`}>{r?.label}</span>;}},
    {id:'actions',header:'',cell:({row})=>(
      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button>
        <button onClick={()=>{setForm(row.original);setIsModal(true);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
        <button onClick={()=>setDeletingKpi(row.original)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
      </div>
    )},
  ],[]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đánh giá KPI nhân viên</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi và chấm điểm hiệu suất làm việc của nhân sự theo từng kỳ.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-sm"><Download className="w-4 h-4"/>Xuất báo cáo</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"><Plus className="w-4 h-4"/>Chấm KPI mới</button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(ratingCfg).map(([k, v]) => {
            const count = data.filter((d) => d.rating === k).length;
            return <div key={k} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm text-center"><p className="text-xs text-gray-500 mb-1">{v.label}</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p></div>;
          })}
        </div>

        <div className="flex gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên nhân viên hoặc phòng ban..." className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"/>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)}/>
      </div>

      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`KPI: ${selected.userName}`:''} width="max-w-lg">
        {selected&&(
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border ${ratingCfg[selected.rating]?.cls.includes('purple')?'bg-purple-50 dark:bg-purple-900/20 border-purple-200':'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200'}`}>
              <p className="text-xs text-gray-500 mb-1">Xếp loại kỳ này</p>
              <p className={`text-xl font-bold ${ratingCfg[selected.rating]?.cls.split(' ').find(c=>c.startsWith('text-'))}`}>{ratingCfg[selected.rating]?.label}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-500">Tỷ lệ hoàn thành mục tiêu</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(selected.achievedScore/selected.targetScore*100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div className={`h-3 rounded-full transition-all ${selected.achievedScore>=selected.targetScore?'bg-emerald-500':'bg-red-500'}`} style={{width:`${Math.min(100,Math.round(selected.achievedScore/selected.targetScore*100))}%`}}/>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0</span><span>Mục tiêu: {selected.targetScore}</span></div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border">
              {[['Kỳ đánh giá',`Tháng ${selected.periodMonth}/${selected.periodYear}`],['Phòng ban',selected.department],['Điểm thực đạt',`${selected.achievedScore} điểm`]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}:</span><span className="font-semibold text-gray-900 dark:text-white">{v}</span></div>
              ))}
              {selected.note&&<div className="border-t pt-2"><p className="text-xs text-gray-400 mb-1">Nhận xét:</p><p className="text-sm italic text-gray-700 dark:text-gray-300">{selected.note}</p></div>}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModal} onClose={()=>setIsModal(false)} title="Chấm điểm KPI nhân viên" width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhân viên *</label>
              <input required value={form.userName||''} onChange={e=>setForm({...form,userName:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phòng ban</label>
              <input value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tháng</label>
              <input type="number" min={1} max={12} value={form.periodMonth||1} onChange={e=>setForm({...form,periodMonth:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Năm</label>
              <input type="number" value={form.periodYear||2026} onChange={e=>setForm({...form,periodYear:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điểm mục tiêu</label>
              <input type="number" value={form.targetScore||100} onChange={e=>setForm({...form,targetScore:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điểm đạt được</label>
              <input type="number" value={form.achievedScore||0} onChange={e=>setForm({...form,achievedScore:+e.target.value})} className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Xếp loại</label>
            <select value={form.rating||'ĐẠT'} onChange={e=>setForm({...form,rating:e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
              <option value="XUẤT_SẮC">Xuất sắc</option><option value="TỐT">Tốt</option><option value="ĐẠT">Đạt</option><option value="CHƯA_ĐẠT">Chưa đạt</option>
            </select></div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhận xét</label>
            <textarea rows={2} value={form.note||''} onChange={e=>setForm({...form,note:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"/></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={()=>setIsModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">Lưu đánh giá</button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deletingKpi}
        onClose={() => setDeletingKpi(null)}
        onConfirm={handleDeleteConfirm}
        title="Xóa đánh giá KPI"
        description="Bạn có chắc chắn muốn xóa bản ghi đánh giá KPI này không? Hành động này không thể hoàn tác."
        itemName={deletingKpi?.userName}
      />
    </>
  );
}
