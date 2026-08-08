import { useMemo, useState } from 'react';
import { Search, Download, Eye, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface AttendanceItem {
  id: string; userId: string; userName: string; workDate: string;
  checkIn: string; checkOut: string; gpsLocation: string;
  status: 'ĐÚNG_GIỜ' | 'ĐI_MUỘN' | 'VỀ_SỚM' | 'VẮNG_MẶT';
  hoursWorked: number; note?: string;
}

import { useAttendanceStore } from '../store/attendanceStore';
import { useEffect } from 'react';
const statusCfg: Record<string,{icon:React.ReactNode;cls:string;label:string}> = {
  ĐÚNG_GIỜ: { icon:<CheckCircle className="w-3.5 h-3.5"/>, cls:'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', label:'Đúng giờ' },
  ĐI_MUỘN: { icon:<AlertCircle className="w-3.5 h-3.5"/>, cls:'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', label:'Đi muộn' },
  VỀ_SỚM: { icon:<Clock className="w-3.5 h-3.5"/>, cls:'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', label:'Về sớm' },
  VẮNG_MẶT: { icon:<XCircle className="w-3.5 h-3.5"/>, cls:'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', label:'Vắng mặt' },
};

export function AttendancePage() {
  const { records, isLoading, fetchAttendances } = useAttendanceStore();
  
  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selected, setSelected] = useState<AttendanceItem|null>(null);

  const filtered = records.filter(d => {
    const q = search.toLowerCase();
    const ms = d.userName.toLowerCase().includes(q);
    const md = !dateFilter || d.workDate === dateFilter;
    const mst = statusFilter === 'Tất cả' || d.status === statusFilter;
    return ms && md && mst;
  });

  const columns = useMemo<ColumnDef<AttendanceItem>[]>(() => [
    { accessorKey:'userName', header:'Nhân viên', cell:({row})=>(
      <div><p className="font-medium text-gray-900 dark:text-white text-sm">{row.original.userName}</p><p className="text-xs text-gray-400">{row.original.userId}</p></div>
    )},
    { accessorKey:'workDate', header:'Ngày làm việc', cell:info=><span className="font-mono text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span> },
    { accessorKey:'checkIn', header:'Giờ vào', cell:info=><span className={`font-mono text-sm font-bold ${info.getValue()?'text-emerald-600 dark:text-emerald-400':'text-gray-400'}`}>{(info.getValue() as string)||'--:--'}</span> },
    { accessorKey:'checkOut', header:'Giờ ra', cell:info=><span className={`font-mono text-sm font-bold ${info.getValue()?'text-blue-600 dark:text-blue-400':'text-gray-400'}`}>{(info.getValue() as string)||'--:--'}</span> },
    { accessorKey:'hoursWorked', header:'Số giờ làm', cell:info=><span className="text-sm font-semibold text-gray-900 dark:text-white">{(info.getValue() as number)>0?`${info.getValue()} giờ`:'0 giờ'}</span> },
    { accessorKey:'status', header:'Trạng thái', cell:info=>{ const s=statusCfg[info.getValue() as string]; return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s?.cls}`}>{s?.icon}{s?.label}</span>; } },
    { id:'actions', header:'', cell:({row})=><button onClick={e=>{e.stopPropagation();setSelected(row.original)}} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button> },
  ], []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chấm công nhân viên</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi giờ vào/ra và trạng thái chấm công hàng ngày của toàn bộ nhân sự.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-sm"><Download className="w-4 h-4"/>Xuất bảng công</button>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(statusCfg).map(([key,cfg])=>{
            const count = records.filter(d=>d.status===key).length;
            return (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <p className="text-xs text-gray-500 mb-1">{cfg.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs text-gray-400">nhân viên hôm nay</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên nhân viên..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"/>
          </div>
          <input type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
            <option value="Tất cả">Tất cả trạng thái</option>
            {Object.entries(statusCfg).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} isLoading={isLoading}/>
      </div>

      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Chi tiết chấm công: ${selected.userName}`:''} width="max-w-lg">
        {selected&&(
          <div className="space-y-4">
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${statusCfg[selected.status]?.cls.includes('emerald')?'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200':'bg-gray-50 dark:bg-gray-900/30 border-gray-200'}`}>
              {statusCfg[selected.status]?.icon}
              <div><p className="text-xs text-gray-500">Trạng thái hôm nay</p><p className="font-bold text-gray-900 dark:text-white">{statusCfg[selected.status]?.label}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 text-center">
                <p className="text-xs text-gray-500 mb-1">Giờ vào</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{selected.checkIn||'--:--'}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
                <p className="text-xs text-gray-500 mb-1">Giờ ra</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selected.checkOut||'--:--'}</p>
              </div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              {[['Ngày làm việc',selected.workDate],['Tổng số giờ làm',`${selected.hoursWorked} giờ`],['Toạ độ GPS',selected.gpsLocation||'Không có dữ liệu']].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}:</span><span className="font-semibold text-gray-900 dark:text-white text-right max-w-[60%]">{v}</span></div>
              ))}
              {selected.note&&<div className="border-t border-gray-200 dark:border-gray-700 pt-2"><p className="text-xs text-gray-400 mb-1">Ghi chú:</p><p className="text-sm text-gray-700 dark:text-gray-300 italic">{selected.note}</p></div>}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
