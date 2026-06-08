import { useMemo, useState } from 'react';
import { Search, Download, Eye, Edit, Trash2, Plus, CalendarDays, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface FixedAssetItem {
  id: string; assetCode: string; assetName: string; purchaseDate: string; originalValue: number; salvageValue: number; accumulatedDep: number; netValue: number; status: 'HOẠT_ĐỘNG' | 'NGỪNG_SỬ_DỤNG' | 'KHẢO_SÁT';
}

const fmt = (n:number)=>n.toLocaleString('vi-VN',{style:'currency',currency:'VND'});

const MOCK: FixedAssetItem[] = [
  { id:'1', assetCode:'FA-001', assetName:'Máy tính Dell XPS', purchaseDate:'2022-03-15', originalValue:20000000, salvageValue:2000000, accumulatedDep:8000000, netValue:10000000, status:'HOẠT_ĐỘNG' },
  { id:'2', assetCode:'FA-002', assetName:'Xe tải 2 tấn', purchaseDate:'2021-07-01', originalValue:600000000, salvageValue:50000000, accumulatedDep:300000000, netValue:250000000, status:'HOẠT_ĐỘNG' },
];

export function FixedAssetsPage() {
  const [data, setData] = useState<FixedAssetItem[]>(MOCK);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FixedAssetItem|null>(null);
  const [isModal, setIsModal] = useState(false);
  const [form, setForm] = useState<Partial<FixedAssetItem>>({});

  const filtered = data.filter(d=> d.assetName.toLowerCase().includes(search.toLowerCase()) || d.assetCode.toLowerCase().includes(search.toLowerCase()));

  const openCreate=()=>{ setForm({purchaseDate:new Date().toISOString().split('T')[0], status:'HOẠT_ĐỘNG'}); setIsModal(true); };
  const handleSave=(e:React.FormEvent)=>{ e.preventDefault(); const net = (form.originalValue||0)-(form.accumulatedDep||0); setData([...data,{...form as FixedAssetItem,id:String(data.length+1),netValue:net}]); setIsModal(false); };

  const columns = useMemo<ColumnDef<FixedAssetItem>[]>(()=>[
    { accessorKey:'assetCode', header:'Mã tài sản' },
    { accessorKey:'assetName', header:'Tên tài sản' },
    { accessorKey:'purchaseDate', header:'Ngày mua', cell:info=> <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{info.getValue() as string}</span> },
    { accessorKey:'originalValue', header:'Nguyên giá', cell:info=> <span className="text-sm text-gray-900 dark:text-white">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'accumulatedDep', header:'Khấu hao lũy kế', cell:info=> <span className="text-sm text-gray-900 dark:text-white">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'netValue', header:'Giá trị còn lại', cell:info=> <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'status', header:'Trạng thái', cell:info=> {
      const s = info.getValue() as string;
      const cfg = {
        HOẠT_ĐỘNG: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        NGỪNG_SỬ_DỤNG: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        KHẢO_SÁT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      }[s];
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg}`}>{s.replace('_',' ')}</span>;
    }},
    { id:'actions', header:'Thao Tác', cell:({row})=>(
      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg"><Eye className="w-4 h-4"/></button>
        <button onClick={()=>{setForm(row.original); setIsModal(true);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit className="w-4 h-4"/></button>
        <button onClick={()=>setData(data.filter(d=>d.id!==row.original.id))} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4"/></button>
      </div>
    )},
  ],[data]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tài Sản Cố Định</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý thông tin và khấu hao tài sản của công ty.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"><Download className="w-4 h-4"/>Xuất báo cáo</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"><Plus className="w-4 h-4"/>Thêm TSCĐ</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo mã hoặc tên tài sản..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"/>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={setSelected}/>
      </div>

      <Drawer isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Chi tiết: ${selected.assetName}`:''}>
        {selected && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              {[['Mã tài sản',selected.assetCode],['Tên tài sản',selected.assetName],['Ngày mua',selected.purchaseDate],['Nguyên giá',fmt(selected.originalValue)],['Khấu hao lũy kế',fmt(selected.accumulatedDep)],['Giá trị còn lại',fmt(selected.netValue)],['Trạng thái',selected.status.replace('_',' ')]]
                .map(([k,v])=>(
                  <div key={k} className="flex justify-between text-sm"><span className="text-gray-500">{k}:</span><span className="font-semibold text-gray-900 dark:text-white">{v}</span></div>
                ))}
            </div>
          </div>
        )}
      </Drawer>

      <Modal isOpen={isModal} onClose={()=>setIsModal(false)} title={form.id?`Cập nhật TSCĐ`:`Thêm TSCĐ mới`} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã tài sản *</label>
              <input required value={form.assetCode||''} onChange={e=>setForm({...form,assetCode:e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên tài sản *</label>
              <input required value={form.assetName||''} onChange={e=>setForm({...form,assetName:e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày mua *</label>
              <input type="date" required value={form.purchaseDate||''} onChange={e=>setForm({...form,purchaseDate:e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
              <select required value={form.status||'HOẠT_ĐỘNG'} onChange={e=>setForm({...form,status:e.target.value as any})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900">
                <option>HOẠT_ĐỘNG</option><option>NGỪNG_SỬ_DỤNG</option><option>KHẢO_SÁT</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nguyên giá *</label>
              <input type="number" required value={form.originalValue||0} onChange={e=>setForm({...form,originalValue:+e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khấu hao lũy kế</label>
              <input type="number" value={form.accumulatedDep||0} onChange={e=>setForm({...form,accumulatedDep:+e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"/></div>
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
