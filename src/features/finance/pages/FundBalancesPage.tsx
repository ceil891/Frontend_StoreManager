import { useMemo, useState, useEffect } from 'react';
import { Search, Download, Eye, Plus, Edit, Trash2, CalendarDays, Wallet } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore } from '../store/financeStore';

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

export function FundBalancesPage() {
  const setData = (_fn: any) => {};
  const {
    fundBalances: storeFunds,
    fetchFundBalances,
  } = useFinanceStore();

  useEffect(() => {
    fetchFundBalances();
  }, [fetchFundBalances]);

  const data: FundBalanceItem[] = useMemo(() => {
    return storeFunds.map((f) => ({
      id: f.id,
      balanceDate: new Date().toISOString().split('T')[0],
      cashOnHand: f.balance * 0.2,
      bankBalance: f.balance * 0.8,
      totalFund: f.balance,
      branch: f.fundName,
      manager: 'Thủ quỹ',
    }));
  }, [storeFunds]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FundBalanceItem|null>(null);
  const [isModal, setIsModal] = useState(false);
  const [form, setForm] = useState<Partial<FundBalanceItem>>({});

  const filtered = data.filter(d=> d.branch.toLowerCase().includes(search.toLowerCase()) || d.manager.toLowerCase().includes(search.toLowerCase()));

  const openCreate =()=>{ setForm({balanceDate:new Date().toISOString().split('T')[0], cashOnHand:0, bankBalance:0, totalFund:0, branch:'', manager:''}); setIsModal(true); };
  const handleSave=(e:React.FormEvent)=>{ e.preventDefault(); const total = (form.cashOnHand||0)+(form.bankBalance||0); setData([...data,{...(form as FundBalanceItem), id:String(data.length+1), totalFund: total}]); setIsModal(false); };

  const columns = useMemo<ColumnDef<FundBalanceItem>[]>(()=>[
    { accessorKey:'balanceDate', header:'Ngày chốt', cell:info=> <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span> },
    { accessorKey:'cashOnHand', header:'Tiền Mặt tại Két', cell:info=> <span className="text-sm text-gray-900 dark:text-white">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'bankBalance', header:'Số dư Ngân hàng', cell:info=> <span className="text-sm text-gray-900 dark:text-white">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'totalFund', header:'Tổng tồn quỹ', cell:info=> <span className="font-bold text-emerald-700 dark:text-emerald-400">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'branch', header:'Chi nhánh', cell:info=> <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span> },
    { accessorKey:'manager', header:'Người chốt', cell:info=> <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span> },
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chốt số dư quỹ</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi số dư tiền mặt và ngân hàng của từng chi nhánh.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-sm"><Download className="w-4 h-4"/>Xuất báo cáo</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"><Plus className="w-4 h-4"/>Thêm số dư mới</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo chi nhánh hoặc người chốt..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"/>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)}/>
      </div>

      <Drawer isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Chi tiết: ${selected.branch}`:''}>
        {selected && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              {[['Ngày chốt',selected.balanceDate],['Chi nhánh',selected.branch],['Người chốt',selected.manager],['Tiền mặt tại két',fmt(selected.cashOnHand)],['Số dư ngân hàng',fmt(selected.bankBalance)],['Tổng tồn quỹ',fmt(selected.totalFund)]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}:</span><span className="font-semibold text-gray-900 dark:text-white">{v}</span></div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      <Modal isOpen={isModal} onClose={()=>setIsModal(false)} title={form.id?`Cập nhật Số Dư Quỹ`:`Thêm Số Dư Quỹ`} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày chốt *</label>
              <input type="date" required value={form.balanceDate||''} onChange={e=>setForm({...form,balanceDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh *</label>
              <input required value={form.branch||''} onChange={e=>setForm({...form,branch:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tiền mặt tại két *</label>
              <input type="number" required value={form.cashOnHand||0} onChange={e=>setForm({...form,cashOnHand:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số dư ngân hàng *</label>
              <input type="number" required value={form.bankBalance||0} onChange={e=>setForm({...form,bankBalance:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người chốt *</label>
              <input required value={form.manager||''} onChange={e=>setForm({...form,manager:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"/></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={()=>setIsModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">Lưu</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
