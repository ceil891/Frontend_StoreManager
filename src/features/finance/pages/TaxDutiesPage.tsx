import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Search, Download, Eye, Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore } from '../store/financeStore';

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

export function TaxDutiesPage() {
  const setData = (_fn: any) => {};
  const {
    taxDuties: storeTaxes,
    fetchTaxDuties,
  } = useFinanceStore();

  useEffect(() => {
    fetchTaxDuties();
  }, [fetchTaxDuties]);

  const data: TaxDutyItem[] = useMemo(() => {
    return storeTaxes.map((t) => ({
      id: t.id,
      type: t.taxName.includes('VAT') ? 'Thuế GTGT' : 'Thuế TNDN',
      period: t.taxPeriod,
      amountDue: t.payableAmount,
      amountPaid: t.paidAmount,
      status: t.status === 'PAID' ? 'ĐÃ_HOÀN_THÀNH' : 'CHƯA_HOÀN_THÀNH',
    }));
  }, [storeTaxes]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TaxDutyItem|null>(null);
  const [isModal, setIsModal] = useState(false);
  const [form, setForm] = useState<Partial<TaxDutyItem>>({});

  const filtered = data.filter(d=> d.type.toLowerCase().includes(search.toLowerCase()) || d.period.toLowerCase().includes(search.toLowerCase()));

  const openCreate = ()=>{ setForm({type:'Thuế GTGT', period:'', amountDue:0, amountPaid:0, status:'CHƯA_HOÀN_THÀNH'}); setIsModal(true); };
  const handleSave = (e:React.FormEvent)=>{ e.preventDefault(); setData([{...form as TaxDutyItem, id:String(data.length+1)}, ...data]); setIsModal(false); };

  const columns = useMemo<ColumnDef<TaxDutyItem>[]>(()=>[
    { accessorKey:'type', header:'Loại thuế' },
    { accessorKey:'period', header:'Kỳ kê khai' },
    { accessorKey:'amountDue', header:'Số thuế phải nộp', cell:info=> <span className="text-sm font-medium text-gray-900 dark:text-white">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'amountPaid', header:'Số thuế đã nộp', cell:info=> <span className="text-sm text-gray-700 dark:text-gray-300">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'status', header:'Trạng thái', cell:info=>{ const s=statusCfg[info.getValue() as string]; return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s?.cls}`}>{s?.label}</span>; }},
    { id:'actions', header:'Thao tác', cell:({row})=>(
      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button>
        <button onClick={()=>{setForm(row.original); setIsModal(true);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
        <button onClick={()=>setData(data.filter(d=>d.id!==row.original.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
      </div>
    )},
  ], [data]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nghĩa vụ thuế</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý và theo dõi các nghĩa vụ thuế của công ty.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-sm"><Download className="w-4 h-4"/>Xuất báo cáo</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"><Plus className="w-4 h-4"/>Thêm nghĩa vụ</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo loại thuế hoặc kỳ..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"/>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)}/>
      </div>

      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Chi tiết: ${selected.type}`:''} width="max-w-lg">
        {selected && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              {[['Loại thuế',selected.type],['Kỳ kê khai',selected.period],['Số thuế phải nộp',fmt(selected.amountDue)],['Số thuế đã nộp',fmt(selected.amountPaid)],['Trạng thái',statusCfg[selected.status].label]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}:</span><span className="font-semibold text-gray-900 dark:text-white">{v}</span></div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModal} onClose={()=>setIsModal(false)} title={form.id?`Cập nhật Nghĩa Vụ Thuế`:`Thêm Nghĩa Vụ Thuế`} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại thuế *</label>
              <select required value={form.type||'Thuế GTGT'} onChange={e=>setForm({...form,type:e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
                <option>Thuế GTGT</option><option>Thuế TNDN</option><option>Thuế TNCN</option>
              </select></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kỳ kê khai *</label>
              <input required value={form.period||''} onChange={e=>setForm({...form,period:e.target.value})} placeholder="Tháng 05/2026 hoặc Quý 2/2026" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số thuế phải nộp *</label>
              <input type="number" required value={form.amountDue||0} onChange={e=>setForm({...form,amountDue:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số thuế đã nộp</label>
              <input type="number" value={form.amountPaid||0} onChange={e=>setForm({...form,amountPaid:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
            <select required value={form.status||'CHƯA_HOÀN_THÀNH'} onChange={e=>setForm({...form,status:e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
              <option>CHƯA_HOÀN_THÀNH</option><option>ĐÃ_HOÀN_THÀNH</option>
            </select></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={()=>setIsModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">Lưu</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
