import { useMemo, useState } from 'react';
import { Plus, Search, Download, Eye, Edit, DollarSign, CheckCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface PayrollItem {
  id: string; userId: string; userName: string; department: string;
  periodMonth: number; periodYear: number;
  baseSalary: number; allowance: number; deduction: number; netSalary: number;
  status: 'CHƯA_CHI_TRẢ' | 'ĐÃ_CHI_TRẢ';
}

const fmt = (n: number) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });

const MOCK: PayrollItem[] = [
  { id:'1', userId:'U001', userName:'Nguyễn Văn an', department:'Kinh doanh', periodMonth:5, periodYear:2026, baseSalary:15000000, allowance:2000000, deduction:500000, netSalary:16500000, status:'ĐÃ_CHI_TRẢ' },
  { id:'2', userId:'U002', userName:'Trần thị Bích', department:'Kho vận', periodMonth:5, periodYear:2026, baseSalary:10000000, allowance:1000000, deduction:300000, netSalary:10700000, status:'CHƯA_CHI_TRẢ' },
  { id:'3', userId:'U003', userName:'Lê Hoàng Nam', department:'Kế toán', periodMonth:5, periodYear:2026, baseSalary:12000000, allowance:1500000, deduction:400000, netSalary:13100000, status:'CHƯA_CHI_TRẢ' },
  { id:'4', userId:'U004', userName:'Phạm thị Lan', department:'Lễ tân', periodMonth:5, periodYear:2026, baseSalary:8000000, allowance:500000, deduction:200000, netSalary:8300000, status:'ĐÃ_CHI_TRẢ' },
];

export function PayrollPage() {
  const [data, setData] = useState<PayrollItem[]>(MOCK);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selected, setSelected] = useState<PayrollItem|null>(null);
  const [isModal, setIsModal] = useState(false);
  const [form, setForm] = useState<Partial<PayrollItem>>({});

  const filtered = data.filter(d => {
    const ms = d.userName.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'Tất cả' || d.status === statusFilter;
    return ms && mst;
  });

  const totalNet = filtered.reduce((s, d) => s + d.netSalary, 0);

  const openCreate = () => {
    setForm({ periodMonth: new Date().getMonth()+1, periodYear: 2026, baseSalary: 0, allowance: 0, deduction: 0, netSalary: 0, status: 'CHƯA_CHI_TRẢ' });
    setIsModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const net = (form.baseSalary||0) + (form.allowance||0) - (form.deduction||0);
    setData([...data, { ...form as PayrollItem, id: String(data.length+1), netSalary: net }]);
    setIsModal(false);
  };

  const markPaid = (id: string) => setData(data.map(d => d.id===id ? {...d, status:'ĐÃ_CHI_TRẢ' as const} : d));

  const columns = useMemo<ColumnDef<PayrollItem>[]>(() => [
    { accessorKey:'userName', header:'Nhân viên', cell:({row}) => <div><p className="font-medium text-gray-900 dark:text-white">{row.original.userName}</p><p className="text-xs text-gray-400">{row.original.department}</p></div> },
    { id:'period', header:'Kỳ lương', cell:({row}) => <span className="text-sm font-mono text-gray-700 dark:text-gray-300">Tháng {row.original.periodMonth}/{row.original.periodYear}</span> },
    { accessorKey:'baseSalary', header:'Lương cơ bản', cell:info => <span className="text-sm text-gray-700 dark:text-gray-300">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'allowance', header:'Phụ cấp', cell:info => <span className="text-sm text-emerald-600 dark:text-emerald-400">+{fmt(info.getValue() as number)}</span> },
    { accessorKey:'deduction', header:'Giảm trừ', cell:info => <span className="text-sm text-red-500">-{fmt(info.getValue() as number)}</span> },
    { accessorKey:'netSalary', header:'Thực lĩnh', cell:info => <span className="font-bold text-gray-900 dark:text-white">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'status', header:'Trạng thái', cell:info => {
      const paid = info.getValue() === 'ĐÃ_CHI_TRẢ';
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${paid?'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300':'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>{paid?'Đã chi trả':'Chưa chi trả'}</span>;
    }},
    { id:'actions', header:'Thao tác', cell:({row}) => (
      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button>
        {row.original.status==='CHƯA_CHI_TRẢ' && (
          <button onClick={()=>markPaid(row.original.id)} className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/>Chi lương</button>
        )}
      </div>
    )},
  ], [data]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng lương nhân viên</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lập và phê duyệt bảng lương hàng tháng cho toàn bộ nhân sự công ty.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-sm"><Download className="w-4 h-4"/>Xuất bảng lương</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"><Plus className="w-4 h-4"/>Lập lương mới</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Tổng quỹ lương kỳ này</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(MOCK.reduce((s,d)=>s+d.netSalary,0))}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Đã chi trả</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(MOCK.filter(d=>d.status==='ĐÃ_CHI_TRẢ').reduce((s,d)=>s+d.netSalary,0))}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Còn phải chi</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{fmt(MOCK.filter(d=>d.status==='CHƯA_CHI_TRẢ').reduce((s,d)=>s+d.netSalary,0))}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên nhân viên..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"/>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
            <option value="Tất cả">Tất cả</option>
            <option value="CHƯA_CHI_TRẢ">Chưa chi trả</option>
            <option value="ĐÃ_CHI_TRẢ">Đã chi trả</option>
          </select>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={setSelected}/>
      </div>

      <Drawer isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Phiếu lương: ${selected.userName}`:''} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600"/>
              <div><p className="text-xs text-gray-500">Thực lĩnh kỳ tháng {selected.periodMonth}/{selected.periodYear}</p><p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{fmt(selected.netSalary)}</p></div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              {[['Nhân viên',selected.userName],['Phòng ban',selected.department],['Kỳ lương',`Tháng ${selected.periodMonth}/${selected.periodYear}`],['Lương cơ bản',fmt(selected.baseSalary)],['Phụ cấp thêm',`+${fmt(selected.allowance)}`],['Khoản giảm trừ',`-${fmt(selected.deduction)}`]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}:</span><span className="font-semibold text-gray-900 dark:text-white">{v}</span></div>
              ))}
              <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 font-bold">
                <span className="text-gray-900 dark:text-white">Thực lĩnh:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">{fmt(selected.netSalary)}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal isOpen={isModal} onClose={()=>setIsModal(false)} title="Lập phiếu lương mới" width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhân viên *</label>
              <input required value={form.userName||''} onChange={e=>setForm({...form,userName:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phòng ban</label>
              <input value={form.department||''} onChange={e=>setForm({...form,department:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lương cơ bản</label>
              <input type="number" value={form.baseSalary||0} onChange={e=>setForm({...form,baseSalary:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phụ cấp</label>
              <input type="number" value={form.allowance||0} onChange={e=>setForm({...form,allowance:+e.target.value})} className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giảm trừ</label>
              <input type="number" value={form.deduction||0} onChange={e=>setForm({...form,deduction:+e.target.value})} className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
            <p className="text-xs text-gray-500">Dự tính thực lĩnh</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmt((form.baseSalary||0)+(form.allowance||0)-(form.deduction||0))}</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={()=>setIsModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">Lập phiếu lương</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
