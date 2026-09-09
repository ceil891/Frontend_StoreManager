import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Download, Eye, Edit, Trash2, DollarSign, CheckCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useHrStore } from '../store/hrStore';
import { useUserStore } from '../store/userStore';
import { useAttendanceStore } from '../store/attendanceStore';
import { toast } from 'sonner';

export interface PayrollItem {
  id: string;
  userId: string;
  userName: string;
  department: string;
  branchName?: string;
  periodMonth: number;
  periodYear: number;
  baseSalary: number;
  allowance: number;
  deduction: number;
  kpiBonus?: number;
  workingDays?: number;
  leaveDays?: number;
  netSalary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

export function PayrollPage() {
  const {
    payrolls: storePayrolls,
    fetchPayrolls,
    addPayroll,
    updatePayroll,
    deletePayroll,
    departments,
    fetchDepartments,
    leaveRequests,
    fetchLeaveRequests,
  } = useHrStore();

  const { users, fetchUsers } = useUserStore();
  const { records: attendanceRecords, fetchAttendances } = useAttendanceStore();

  useEffect(() => {
    fetchPayrolls();
    fetchUsers();
    fetchDepartments();
    fetchLeaveRequests();
  }, [fetchPayrolls, fetchUsers, fetchDepartments, fetchLeaveRequests]);

  const data: PayrollItem[] = useMemo(() => {
    return storePayrolls.map((p) => {
      const parts = (p.payrollMonth || '').split('-');
      const pYear = (p as any).periodYear || Number(parts[0]) || new Date().getFullYear();
      const pMonth = (p as any).periodMonth || Number(parts[1]) || (new Date().getMonth() + 1);
      return {
        id: p.id,
        userId: (p as any).userId ? String((p as any).userId) : (p.employeeName || 'U001'),
        userName: p.employeeName || 'Nhân viên',
        department: (p as any).department || 'Nhân sự / Kinh doanh',
        branchName: (p as any).branchName || 'Tất cả chi nhánh',
        periodMonth: pMonth,
        periodYear: pYear,
        baseSalary: Number(p.baseSalary) || 0,
        allowance: Number(p.allowances) || 0,
        deduction: Number(p.deductions) || 0,
        kpiBonus: Number(p.kpiBonus) || 0,
        workingDays: Number((p as any).workingDays) || 0,
        leaveDays: Number((p as any).leaveDays) || 0,
        // Không tự tính lại: backend là nguồn dữ liệu duy nhất của lương thực lĩnh.
        netSalary: Number(p.netSalary) || 0,
        status: p.status === 'PAID' ? 'PAID' : p.status === 'APPROVED' ? 'APPROVED' : 'DRAFT',
      };
    });
  }, [storePayrolls]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selected, setSelected] = useState<PayrollItem|null>(null);
  const [isModal, setIsModal] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState<Partial<PayrollItem>>({});
  const [deletingPayroll, setDeletingPayroll] = useState<PayrollItem | null>(null);

  useEffect(() => {
    if (!form.userId || !form.periodMonth || !form.periodYear) return;
    const month = String(form.periodMonth).padStart(2, '0');
    const lastDay = new Date(Number(form.periodYear), Number(form.periodMonth), 0).getDate();
    fetchAttendances({
      workDateFrom: `${form.periodYear}-${month}-01`,
      workDateTo: `${form.periodYear}-${month}-${String(lastDay).padStart(2, '0')}`,
    });
  }, [form.userId, form.periodMonth, form.periodYear, fetchAttendances]);

  const payrollPeriodPrefix = `${form.periodYear || new Date().getFullYear()}-${String(form.periodMonth || new Date().getMonth() + 1).padStart(2, '0')}`;
  const previewWorkingDays = attendanceRecords
    .filter(record => String(record.userId) === String(form.userId) && record.workDate.startsWith(payrollPeriodPrefix))
    .reduce((sum, record) => sum + (record.status === 'ĐÚNG_GIỜ' ? 1 : record.status === 'ĐI_MUỘN' || record.status === 'VỀ_SỚM' ? 0.5 : 0), 0);
  const previewLeaveDays = leaveRequests
    .filter((leave: any) => String(leave.userId) === String(form.userId) && leave.status === 'APPROVED')
    .reduce((sum, leave: any) => {
      const start = String(leave.startDate || '');
      const end = String(leave.endDate || '');
      return (start.startsWith(payrollPeriodPrefix) || end.startsWith(payrollPeriodPrefix)) ? sum + Number(leave.totalDays || 1) : sum;
    }, 0);

  const filtered = data.filter(d => {
    const ms = (d.userName || '').toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'Tất cả' || d.status === statusFilter;
    return ms && mst;
  });

  const totalNet = filtered.reduce((s, d) => s + d.netSalary, 0);

  const openCreate = () => {
    setMode('create');
    const defaultUser = users[0];
    setForm({
      userName: defaultUser ? (defaultUser.fullName || defaultUser.email || (defaultUser as any).username) : '',
      userId: defaultUser ? String(defaultUser.id) : '1',
      department: (defaultUser as any)?.departmentName || 'Nhân sự / Kinh doanh',
      branchName: defaultUser?.branchLocation || 'Tất cả chi nhánh',
      periodMonth: new Date().getMonth() + 1,
      periodYear: new Date().getFullYear(),
      baseSalary: 0,
      allowance: 0,
      deduction: 0,
      status: 'DRAFT'
    });
    setIsModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const pMonth = Number(form.periodMonth) || (new Date().getMonth() + 1);
    const pYear = Number(form.periodYear) || new Date().getFullYear();
    const monthStr = `${pYear}-${String(pMonth).padStart(2, '0')}`;
    
    const payload = {
      payrollCode: form.id ? undefined : `PR-${Date.now().toString().slice(-4)}`,
      userId: form.userId ? Number(form.userId) : (users[0]?.id || 1),
      employeeName: form.userName || 'Nhân viên',
      department: form.department || 'Nhân sự / Kinh doanh',
      payrollMonth: monthStr,
      periodMonth: pMonth,
      periodYear: pYear,
      baseSalary: form.baseSalary || 0,
      allowance: form.allowance || 0,
      kpiBonus: form.kpiBonus || 0,
      deduction: form.deduction || 0,
      status: form.status || 'DRAFT',
    };

    try {
      if (mode === 'create') {
        await addPayroll(payload as any);
        toast.success('Lập phiếu lương thành công. Backend đã tính số thực lĩnh.');
      } else if (form.id) {
        await updatePayroll(form.id, payload as any);
        toast.success('Cập nhật phiếu lương thành công');
      }
      setIsModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu bảng lương: ' + (err?.message || 'Thất bại'));
    }
  };

  const markPaid = async (id: string) => {
    try {
      await updatePayroll(id, { status: 'PAID' } as any);
      toast.success('Đã chi lương và tự động tạo phiếu chi');
    } catch (err: any) {
      toast.error('Không thể chi lương: ' + (err?.message || 'Lỗi máy chủ'));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPayroll) return;
    try {
      await deletePayroll(deletingPayroll.id);
      toast.success(`Đã xóa phiếu lương của ${deletingPayroll.userName}!`);
      setDeletingPayroll(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xóa bảng lương: ' + (err?.message || 'Thất bại'));
    }
  };

  const columns = useMemo<ColumnDef<PayrollItem>[]>(() => [
    { accessorKey:'userName', header:'Nhân viên', cell:({row}) => <div><p className="font-medium text-gray-900 dark:text-white">{row.original.userName}</p><p className="text-xs text-gray-400">{row.original.department}</p></div> },
    { id:'period', header:'Kỳ lương', cell:({row}) => <span className="text-sm font-mono text-gray-700 dark:text-gray-300">Tháng {row.original.periodMonth}/{row.original.periodYear}</span> },
    { accessorKey:'baseSalary', header:'Lương theo ngày', cell:info => <span className="text-sm text-gray-700 dark:text-gray-300">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'workingDays', header:'Ngày làm việc', cell:info => <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{info.getValue() as number} công</span> },
    { accessorKey:'leaveDays', header:'Ngày nghỉ', cell:info => <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{info.getValue() as number} ngày</span> },
    { accessorKey:'allowance', header:'Phụ cấp', cell:info => <span className="text-sm text-emerald-600 dark:text-emerald-400">+{fmt(info.getValue() as number)}</span> },
    { accessorKey:'deduction', header:'Giảm trừ', cell:info => <span className="text-sm text-red-500">-{fmt(info.getValue() as number)}</span> },
    { accessorKey:'netSalary', header:'Thực lĩnh', cell:info => <span className="font-bold text-gray-900 dark:text-white">{fmt(info.getValue() as number)}</span> },
    { accessorKey:'status', header:'Trạng thái', cell:info => {
      const value = info.getValue() as PayrollItem['status'];
      const paid = value === 'PAID';
      const approved = value === 'APPROVED';
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${paid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : approved ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'}`}>{paid ? 'Đã chi trả' : approved ? 'Đã duyệt' : 'Nháp'}</span>;
    }},
    { id:'actions', header:'Thao tác', cell:({row}) => (
      <div className="flex gap-1" onClick={e=>e.stopPropagation()}>
        <button onClick={()=>setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"><Eye className="w-4 h-4"/></button>
        <button onClick={()=>{setMode('edit');setForm(row.original);setIsModal(true);}} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"><Edit className="w-4 h-4"/></button>
        <button onClick={()=>setDeletingPayroll(row.original)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
        {row.original.status !== 'PAID' && (
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
            <p className="text-xl font-bold text-gray-900 dark:text-white">{fmt(data.reduce((s,d)=>s+d.netSalary,0))}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Đã chi trả</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(data.filter(d=>d.status==='PAID').reduce((s,d)=>s+d.netSalary,0))}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Còn phải chi</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{fmt(data.filter(d=>d.status!=='PAID').reduce((s,d)=>s+d.netSalary,0))}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo tên nhân viên..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm"/>
          </div>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
            <option value="Tất cả">Tất cả</option>
            <option value="DRAFT">Nháp</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="PAID">Đã chi trả</option>
          </select>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)}/>
      </div>

      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Phiếu lương: ${selected.userName}`:''} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600"/>
              <div><p className="text-xs text-gray-500">Thực lĩnh kỳ tháng {selected.periodMonth}/{selected.periodYear}</p><p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{fmt(selected.netSalary)}</p></div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              {[['Nhân viên',selected.userName],['Phòng ban',selected.department],['Kỳ lương',`Tháng ${selected.periodMonth}/${selected.periodYear}`],['Lương theo ngày',fmt(selected.baseSalary)],['Phụ cấp thêm',`+${fmt(selected.allowance)}`],['Khoản giảm trừ',`-${fmt(selected.deduction)}`]].map(([l,v])=>(
                <div key={l} className="flex justify-between text-sm"><span className="text-gray-500">{l}:</span><span className="font-semibold text-gray-900 dark:text-white">{v}</span></div>
              ))}
              <div className="flex justify-between text-sm border-t border-gray-200 dark:border-gray-700 pt-2 font-bold">
                <span className="text-gray-900 dark:text-white">Thực lĩnh:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">{fmt(selected.netSalary)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModal} onClose={()=>setIsModal(false)} title="Lập phiếu lương mới" width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhân viên *</label>
              {users.length > 0 ? (
                <select
                  required
                  value={form.userName || ''}
                  onChange={(e) => {
                    const u = users.find(usr => (usr.fullName || usr.email || (usr as any).username) === e.target.value);
                    const department = u ? departments.find(d => String(d.id) === String(u.departmentId)) : undefined;
                    setForm({
                      ...form,
                      userName: e.target.value,
                      userId: u ? String(u.id) : '',
                      branchName: u?.branchLocation || 'Tất cả chi nhánh',
                      department: department?.departmentName || (u as any)?.departmentName || 'Phòng Kinh Doanh & Bán Hàng'
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.fullName || u.email || (u as any).username}>
                      {u.fullName || u.email || (u as any).username} ({u.email || (u as any).username})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  value={form.userName || ''}
                  onChange={e => setForm({ ...form, userName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bộ phận / Phòng ban</label>
              <input value={form.department || 'Phòng Kinh Doanh & Bán Hàng'} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày làm việc</label>
              <input value={`${previewWorkingDays} công`} readOnly className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 text-sm font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày nghỉ đã duyệt</label>
              <input value={`${previewLeaveDays} ngày`} readOnly className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300 text-sm font-semibold" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh làm việc</label>
            <input value={form.branchName || 'Tất cả chi nhánh'} readOnly className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kỳ lương (Tháng) *</label>
              <select
                value={form.periodMonth || (new Date().getMonth() + 1)}
                onChange={e => setForm({ ...form, periodMonth: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Năm *</label>
              <input
                type="number"
                value={form.periodYear || new Date().getFullYear()}
                onChange={e => setForm({ ...form, periodYear: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Lương theo ngày</label>
              <input type="number" value={form.baseSalary||0} onChange={e=>setForm({...form,baseSalary:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phụ cấp</label>
              <input type="number" value={form.allowance||0} onChange={e=>setForm({...form,allowance:+e.target.value})} className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
            <div><label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giảm trừ</label>
              <input type="number" value={form.deduction||0} onChange={e=>setForm({...form,deduction:+e.target.value})} className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/></div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center">
            <p className="text-xs text-gray-500">Thực lĩnh tự động</p>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Hệ thống tính từ chấm công, nghỉ không lương và ca trực thay sau khi lưu.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={()=>setIsModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">
              {mode === 'create' ? 'Lập phiếu lương' : 'Cập nhật phiếu lương'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deletingPayroll}
        onClose={() => setDeletingPayroll(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa phiếu lương"
        description="Bạn có chắc chắn muốn xóa bản ghi phiếu lương này không? Hành động này không thể hoàn tác."
        itemName={deletingPayroll?.userName}
      />
    </>
  );
}
