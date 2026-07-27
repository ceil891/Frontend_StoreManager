import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Edit, Trash2, FileText } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useHrStore } from '../store/hrStore';

interface ContractItem {
  id: string; contractNumber: string; userName: string; userId: string;
  position: string; startDate: string; endDate: string;
  contractType: 'Thử việc' | 'Xác định thời hạn' | 'Vô thời hạn';
  status: 'ĐANG_HIỆU_LỰC' | 'HẾT_HẠN' | 'ĐÃ_HỦY';
}

const MOCK: ContractItem[] = [
  { id:'1', contractNumber:'HĐLĐ-2024-001', userName:'Nguyễn Văn an', userId:'U001', position:'Trưởng phòng Kinh doanh', startDate:'2024-01-01', endDate:'2026-01-01', contractType:'Xác định thời hạn', status:'ĐANG_HIỆU_LỰC' },
  { id:'2', contractNumber:'HĐLĐ-2024-002', userName:'Trần thị Bích', userId:'U002', position:'Nhân viên Kho', startDate:'2024-03-15', endDate:'2025-03-15', contractType:'Xác định thời hạn', status:'HẾT_HẠN' },
  { id:'3', contractNumber:'HĐLĐ-2025-003', userName:'Lê Hoàng Nam', userId:'U003', position:'Kế toán viên', startDate:'2025-01-01', endDate:'', contractType:'Vô thời hạn', status:'ĐANG_HIỆU_LỰC' },
  { id:'4', contractNumber:'HĐTV-2026-001', userName:'Phạm thị Lan', userId:'U004', position:'Lễ tân', startDate:'2026-04-01', endDate:'2026-07-01', contractType:'Thử việc', status:'ĐANG_HIỆU_LỰC' },
];

const statusCfg: Record<string,{cls:string;label:string}> = {
  ĐANG_HIỆU_LỰC: { cls:'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', label:'Đang hiệu lực' },
  HẾT_HẠN: { cls:'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', label:'Đã hết hạn' },
  ĐÃ_HỦY: { cls:'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300', label:'Đã huỷ' },
};
const typeCfg: Record<string,string> = {
  'Thử việc':'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Xác định thời hạn':'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Vô thời hạn':'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export function EmployeeContractsPage() {
  const {
    contracts: storeContracts,
    fetchContracts,
    addContract,
    updateContract,
    deleteContract,
  } = useHrStore();

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const data: ContractItem[] = useMemo(() => {
    return storeContracts.map((c) => ({
      id: c.id,
      contractNumber: c.contractCode,
      userName: c.employeeName,
      userId: c.employeePhone,
      position: 'Nhân viên chính thức',
      startDate: c.startDate,
      endDate: c.endDate || 'Vô thời hạn',
      contractType: c.contractType === 'PROBATION' ? 'Thử việc' : c.contractType === 'DEFINITE' ? 'Xác định thời hạn' : 'Vô thời hạn',
      status: c.status === 'ACTIVE' ? 'ĐANG_HIỆU_LỰC' : 'HẾT_HẠN',
    }));
  }, [storeContracts]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ContractItem|null>(null);
  const [isModal, setIsModal] = useState(false);
  const [mode, setMode] = useState<'create'|'edit'>('create');
  const setData = (_fn: any) => {};
  const [form, setForm] = useState<Partial<ContractItem>>({});
  const [deleting, setDeleting] = useState<ContractItem|null>(null);

  const filtered = data.filter(d => d.userName.toLowerCase().includes(search.toLowerCase()) || d.contractNumber.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setMode('create'); setForm({ contractType:'Xác định thời hạn', status:'ĐANG_HIỆU_LỰC' }); setIsModal(true); };
  const openEdit = (item: ContractItem) => { setMode('edit'); setForm(item); setIsModal(true); };
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode==='create') setData([...data, { ...form as ContractItem, id: String(data.length+1) }]);
    else setData(data.map(d => d.id===form.id ? form as ContractItem : d));
    setIsModal(false);
  };

  const columns = useMemo<ColumnDef<ContractItem>[]>(() => [
    { accessorKey:'contractNumber', header:'Số hợp đồng', cell:info=><span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span> },
    { accessorKey:'userName', header:'Nhân viên', cell:({row})=>(
      <div><p className="font-medium text-gray-900 dark:text-white">{row.original.userName}</p><p className="text-xs text-gray-400">{row.original.position}</p></div>
    )},
    { accessorKey:'contractType', header:'Loại HĐ', cell:info=><span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${typeCfg[info.getValue() as string]}`}>{info.getValue() as string}</span> },
    { accessorKey:'startDate', header:'Ngày bắt đầu', cell:info=><span className="text-sm text-gray-500">{info.getValue() as string}</span> },
    { accessorKey:'endDate', header:'Ngày kết thúc', cell:info=><span className="text-sm text-gray-500">{(info.getValue() as string)||'Vô thời hạn'}</span> },
    { accessorKey:'status', header:'Trạng thái', cell:info=>{ const s=statusCfg[info.getValue() as string]; return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s?.cls}`}>{s?.label}</span>; }},
    { id:'actions', header:'Thao tác', cell:({row})=>(
      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button>
        <button onClick={()=>openEdit(row.original)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
        <button onClick={()=>setDeleting(row.original)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
      </div>
    )},
  ], [data]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hợp đồng lao động</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý và theo dõi hợp đồng lao động của toàn bộ nhân viên.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium shadow-sm"><Download className="w-4 h-4"/>Xuất excel</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm"><Plus className="w-4 h-4"/>Lập hợp đồng mới</button>
          </div>
        </div>
        <div className="flex gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên nhân viên hoặc số hợp đồng..." className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"/>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)}/>
      </div>

      <Drawer isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Chi tiết: ${selected.contractNumber}`:''}>
        {selected&&(
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <FileText className="w-6 h-6 text-emerald-600"/>
              <div><p className="text-xs text-gray-500">Loại hợp đồng</p><p className="font-bold text-emerald-800 dark:text-emerald-300">{selected.contractType}</p></div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              {[['Nhân viên', selected.userName],['Mã NV', selected.userId],['Chức vụ', selected.position],['Ngày bắt đầu', selected.startDate],['Ngày kết thúc', selected.endDate||'Vô thời hạn']].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}:</span><span className="font-semibold text-gray-900 dark:text-white">{v}</span></div>
              ))}
            </div>
          </div>
        )}
      </Drawer>

      <Modal isOpen={isModal} onClose={()=>setIsModal(false)} title={mode==='create'?'Lập hợp đồng lao động mới':'Cập nhật hợp đồng'} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số hợp đồng *</label>
              <input required value={form.contractNumber||''} onChange={e=>setForm({...form,contractNumber:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhân viên *</label>
              <input required value={form.userName||''} onChange={e=>setForm({...form,userName:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chức vụ</label>
            <input value={form.position||''} onChange={e=>setForm({...form,position:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày bắt đầu</label>
              <input type="date" value={form.startDate||''} onChange={e=>setForm({...form,startDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày kết thúc</label>
              <input type="date" value={form.endDate||''} onChange={e=>setForm({...form,endDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại hợp đồng</label>
              <select value={form.contractType||'Xác định thời hạn'} onChange={e=>setForm({...form,contractType:e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
                <option>Thử việc</option><option>Xác định thời hạn</option><option>Vô thời hạn</option>
              </select></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select value={form.status||'ĐANG_HIỆU_LỰC'} onChange={e=>setForm({...form,status:e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
                <option value="ĐANG_HIỆU_LỰC">Đang hiệu lực</option><option value="HẾT_HẠN">Đã hết hạn</option><option value="ĐÃ_HỦY">Đã huỷ</option>
              </select></div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={()=>setIsModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">{mode==='create'?'Tạo hợp đồng':'Lưu cập nhật'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleting} onClose={()=>setDeleting(null)} title="Xác nhận hủy hợp đồng" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Bạn có chắc muốn xóa hợp đồng <strong className="text-gray-900 dark:text-white">{deleting?.contractNumber}</strong> của nhân viên <strong>{deleting?.userName}</strong>?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={()=>setDeleting(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Quay lại</button>
            <button onClick={()=>{setData(data.filter(d=>d.id!==deleting!.id));setDeleting(null);}} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm">Xác nhận xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
