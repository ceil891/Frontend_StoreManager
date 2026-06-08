import { useMemo, useState } from 'react';
import { Plus, Search, Download, Eye, Edit, Trash2, CalendarDays } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface LeaveItem {
  id: string; userId: string; userName: string;
  startDate: string; endDate: string; days: number;
  leaveType: 'Nghỉ phép năm' | 'Nghỉ ốm' | 'Việc riêng' | 'Nghỉ thai sản' | 'Nghỉ tang';
  reason: string; approvedBy: string;
  status: 'CHỜ_DUYỆT' | 'ĐÃ_DUYỆT' | 'TỪ_CHỐI';
}

const MOCK: LeaveItem[] = [
  { id:'1', userId:'U002', userName:'Trần Thị Bích', startDate:'2026-06-10', endDate:'2026-06-12', days:3, leaveType:'Nghỉ phép năm', reason:'Nghỉ hè gia đình', approvedBy:'Nguyễn Văn An', status:'ĐÃ_DUYỆT' },
  { id:'2', userId:'U003', userName:'Lê Hoàng Nam', startDate:'2026-06-15', endDate:'2026-06-15', days:1, leaveType:'Nghỉ ốm', reason:'Sốt virus, có giấy bác sĩ', approvedBy:'', status:'CHỜ_DUYỆT' },
  { id:'3', userId:'U004', userName:'Phạm Thị Lan', startDate:'2026-05-20', endDate:'2026-05-21', days:2, leaveType:'Việc riêng', reason:'Đăng ký hôn nhân', approvedBy:'Nguyễn Văn An', status:'ĐÃ_DUYỆT' },
  { id:'4', userId:'U001', userName:'Nguyễn Văn An', startDate:'2026-07-01', endDate:'2026-07-03', days:3, leaveType:'Nghỉ phép năm', reason:'Du lịch cá nhân', approvedBy:'', status:'CHỜ_DUYỆT' },
];

const sCfg: Record<string,{cls:string;label:string}> = {
  CHỜ_DUYỆT:{cls:'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',label:'Chờ phê duyệt'},
  ĐÃ_DUYỆT:{cls:'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',label:'Đã duyệt'},
  TỪ_CHỐI:{cls:'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',label:'Từ chối'},
};

export function LeaveRequestsPage() {
  const [data, setData] = useState<LeaveItem[]>(MOCK);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selected, setSelected] = useState<LeaveItem|null>(null);
  const [isModal, setIsModal] = useState(false);
  const [form, setForm] = useState<Partial<LeaveItem>>({});
  const [deleting, setDeleting] = useState<LeaveItem|null>(null);

  const filtered = data.filter(d=>{
    const ms = d.userName.toLowerCase().includes(search.toLowerCase())||d.reason.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter==='Tất cả'||d.status===statusFilter;
    return ms&&mst;
  });

  const openCreate = ()=>{ setForm({leaveType:'Nghỉ phép năm',status:'CHỜ_DUYỆT',days:1}); setIsModal(true); };
  const handleSave=(e:React.FormEvent)=>{ e.preventDefault(); setData([...data,{...form as LeaveItem,id:String(data.length+1)}]); setIsModal(false); };
  const approve=(id:string)=>setData(data.map(d=>d.id===id?{...d,status:'ĐÃ_DUYỆT' as const,approvedBy:'Admin hệ thống'}:d));
  const reject=(id:string)=>setData(data.map(d=>d.id===id?{...d,status:'TỪ_CHỐI' as const}:d));

  const columns = useMemo<ColumnDef<LeaveItem>[]>(()=>[
    {accessorKey:'userName',header:'Nhân Viên',cell:({row})=><div><p className="font-medium text-gray-900 dark:text-white">{row.original.userName}</p><p className="text-xs text-gray-400">{row.original.userId}</p></div>},
    {accessorKey:'leaveType',header:'Loại Nghỉ',cell:info=><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>},
    {accessorKey:'startDate',header:'Từ Ngày',cell:info=><span className="text-sm text-gray-500 font-mono">{info.getValue() as string}</span>},
    {accessorKey:'endDate',header:'Đến Ngày',cell:info=><span className="text-sm text-gray-500 font-mono">{info.getValue() as string}</span>},
    {accessorKey:'days',header:'Số Ngày',cell:info=><span className="font-bold text-gray-900 dark:text-white">{info.getValue() as number} ngày</span>},
    {accessorKey:'status',header:'Trạng Thái',cell:info=>{const s=sCfg[info.getValue() as string];return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s?.cls}`}>{s?.label}</span>;}},
    {id:'actions',header:'Thao Tác',cell:({row})=>(
      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button>
        {row.original.status==='CHỜ_DUYỆT'&&<>
          <button onClick={()=>approve(row.original.id)} className="px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">Duyệt</button>
          <button onClick={()=>reject(row.original.id)} className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Từ chối</button>
        </>}
        <button onClick={()=>setDeleting(row.original)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
      </div>
    )},
  ],[data]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn Xin Nghỉ Phép</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tiếp nhận và xét duyệt đơn xin nghỉ phép của nhân viên toàn công ty.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-sm"><Download className="w-4 h-4"/>Xuất Excel</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"><Plus className="w-4 h-4"/>Tạo Đơn Nghỉ</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên nhân viên..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"/>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
            <option value="Tất cả">Tất cả trạng thái</option>
            {Object.entries(sCfg).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={setSelected}/>
      </div>

      <Drawer isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Chi tiết đơn: ${selected.userName}`:''}>
        {selected&&(
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <CalendarDays className="w-6 h-6 text-blue-600"/>
              <div><p className="text-xs text-gray-500">Loại nghỉ phép</p><p className="font-bold text-blue-800 dark:text-blue-300">{selected.leaveType}</p></div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border">
              {[['Nhân viên',selected.userName],['Từ ngày',selected.startDate],['Đến ngày',selected.endDate],['Số ngày nghỉ',`${selected.days} ngày`],['Người phê duyệt',selected.approvedBy||'Chưa duyệt']].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}:</span><span className="font-semibold text-gray-900 dark:text-white">{v}</span></div>
              ))}
              <div className="border-t pt-2"><p className="text-xs text-gray-400 mb-1">Lý do xin nghỉ:</p><p className="text-sm text-gray-700 dark:text-gray-300 italic">{selected.reason}</p></div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal isOpen={isModal} onClose={()=>setIsModal(false)} title="Tạo Đơn Xin Nghỉ Phép" width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên Nhân Viên *</label>
            <input required value={form.userName||''} onChange={e=>setForm({...form,userName:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại Nghỉ</label>
            <select value={form.leaveType||'Nghỉ phép năm'} onChange={e=>setForm({...form,leaveType:e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
              <option>Nghỉ phép năm</option><option>Nghỉ ốm</option><option>Việc riêng</option><option>Nghỉ thai sản</option><option>Nghỉ tang</option>
            </select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Từ Ngày</label>
              <input type="date" value={form.startDate||''} onChange={e=>setForm({...form,startDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đến Ngày</label>
              <input type="date" value={form.endDate||''} onChange={e=>setForm({...form,endDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lý Do</label>
            <textarea rows={3} value={form.reason||''} onChange={e=>setForm({...form,reason:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"/></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={()=>setIsModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">Gửi đơn</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleting} onClose={()=>setDeleting(null)} title="Xác nhận xóa đơn" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Bạn có chắc muốn xóa đơn xin nghỉ của <strong className="text-gray-900 dark:text-white">{deleting?.userName}</strong>?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={()=>setDeleting(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Quay lại</button>
            <button onClick={()=>{setData(data.filter(d=>d.id!==deleting!.id));setDeleting(null);}} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm">Xác nhận xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
