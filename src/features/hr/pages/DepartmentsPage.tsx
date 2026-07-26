import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Building2, Users, UserCheck, Briefcase, DollarSign, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import { TreeSelect } from '@/shared/components/ui/TreeSelect';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { useHrStore, type DepartmentRecord } from '../store/hrStore';
import { useUserStore, BRANCH_OPTIONS } from '../store/userStore';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';

const statusStyles = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  RESTRUCTURING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  MERGING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

export function DepartmentsPage() {
  const { departments: data, fetchDepartments, addDepartment, updateDepartment, deleteDepartment } = useHrStore();
  const { users, fetchUsers } = useUserStore();

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [fetchDepartments, fetchUsers]);

  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<DepartmentRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingDept, setEditingDept] = useState<Partial<DepartmentRecord>>({});
  
  const [deletingDept, setDeletingDept] = useState<DepartmentRecord | null>(null);

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.departmentCode.toLowerCase().includes(q) ||
        item.departmentName.toLowerCase().includes(q) ||
        !!(item.headUserId && users.find(u => u.id === item.headUserId)?.fullName.toLowerCase().includes(q)) ||
        !!(item.parentId && data.find(d => d.id === item.parentId)?.departmentName.toLowerCase().includes(q))
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingDept({
      departmentCode: `DPT-${Math.floor(1000 + Math.random() * 9000)}`,
      departmentName: '',
      headUserId: '',
      totalEmployees: 0,
      allocatedAnnualBudgetUsd: 0,
      ytdSpendUsd: 0,
      costCenterCode: '',
      status: 'ACTIVE',
      establishedDate: new Date().toISOString().split('T')[0],
      parentId: '',
      missionStatement: '',
      locationId: 'HQ'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: DepartmentRecord) => {
    setModalMode('edit');
    setEditingDept(dept);
    setIsModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept.departmentCode || !editingDept.departmentName) return;

    const payload: Omit<DepartmentRecord, 'id'> = {
      departmentCode: editingDept.departmentCode,
      departmentName: editingDept.departmentName,
      headUserId: editingDept.headUserId || undefined,
      totalEmployees: Number(editingDept.totalEmployees) || 0,
      allocatedAnnualBudgetUsd: Number(editingDept.allocatedAnnualBudgetUsd) || 0,
      ytdSpendUsd: Number(editingDept.ytdSpendUsd) || 0,
      costCenterCode: editingDept.costCenterCode || '',
      status: editingDept.status as any || 'ACTIVE',
      establishedDate: editingDept.establishedDate || '',
      parentId: editingDept.parentId || undefined,
      missionStatement: editingDept.missionStatement || '',
      locationId: editingDept.locationId || undefined,
      description: editingDept.description || '',
    };

    if (modalMode === 'create') {
      await addDepartment(payload);
    } else if (editingDept.id) {
      await updateDepartment(editingDept.id, payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDept) return;
    await deleteDepartment(deletingDept.id);
    setDeletingDept(null);
  };

  const statusLabels = {
    ACTIVE: 'Đang hoạt động',
    RESTRUCTURING: 'Đang tái cấu trúc',
    MERGING: 'Hợp nhất',
    INACTIVE: 'Không hoạt động',
  } as const;

  const columns = useMemo<ColumnDef<DepartmentRecord>[]>(
    () => [
      {
        accessorKey: 'departmentCode',
        header: 'Mã PB',
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'departmentName',
        header: 'Tên phòng ban & Phân khu',
        cell: ({ row }) => {
          const parent = data.find(d => d.id === row.original.parentId);
          return (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.departmentName}</p>
              <p className="text-xs text-gray-500 font-mono">Phân khu: {parent ? parent.departmentName : 'Không'}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'headUserId',
        header: 'Trưởng phòng',
        cell: ({ row }) => {
          const headUser = users.find(u => u.id === row.original.headUserId);
          return <span className="font-medium text-gray-900 dark:text-white text-sm">{headUser ? headUser.fullName : 'Chưa phân công'}</span>;
        },
      },
      {
        accessorKey: 'totalEmployees',
        header: 'Nhân sự',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{info.getValue() as number} FTE</span>,
      },
      {
        accessorKey: 'allocatedAnnualBudgetUsd',
        header: 'Ngân sách phân bổ',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">${(info.getValue() as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>,
      },
      {
        accessorKey: 'ytdSpendUsd',
        header: 'Chi tiêu lũy kế',
        cell: ({ row }) => {
          const budget = row.original.allocatedAnnualBudgetUsd ?? 0;
          const spend = row.original.ytdSpendUsd ?? 0;
          const pct = budget > 0 ? ((spend / budget) * 100).toFixed(1) : '0.0';
          return (
            <div>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              <span className="text-xs text-gray-500 block font-mono">{pct}% đã dùng</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'costCenterCode',
        header: 'Trung tâm chi phí',
        cell: (info) => <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as keyof typeof statusLabels;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyles[status]}`}>
              {statusLabels[status] ?? status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedDept(row.original); }}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingDept(row.original); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổ chức Phòng ban & Trung tâm chi phí</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý cơ cấu phòng ban, theo dõi phân bổ nhân sự, kiểm toán ngân sách bộ phận và theo dõi chi phí trung tâm.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                exportToCsv('danh_sach_phong_ban', filtered, [
                  { header: 'Mã phòng ban', accessor: r => r.departmentCode },
                  { header: 'Tên phòng ban', accessor: r => r.departmentName },
                  { header: 'Mã trung tâm chi phí', accessor: r => r.costCenterCode || '' },
                  { header: 'Số lượng nhân sự', accessor: r => r.totalEmployees || 0 },
                  { header: 'Ngân sách năm ($)', accessor: r => r.allocatedAnnualBudgetUsd || 0 },
                  { header: 'Trạng thái', accessor: r => r.status },
                  { header: 'Mô tả', accessor: r => r.description || '' },
                ]);
                toast.success('Đã xuất danh sách phòng ban dạng CSV!');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-95 whitespace-nowrap"
            >
              <Download className="w-4 h-4" /> Xuất sơ đồ tổ chức
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-full transition-all text-sm font-bold shadow hover:shadow-lg active:scale-95 whitespace-nowrap">
              <Plus className="w-4 h-4" /> Tạo Phòng Ban Mới
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm phòng ban theo mã, tên, trưởng bộ phận hoặc phân khu..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="RESTRUCTURING">Đang tái cấu trúc</option>
                <option value="MERGING">Hợp nhất</option>
                <option value="INACTIVE">Không hoạt động</option>
              </select>
            </div>

            {(statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedDept(row)} />
      </div>

      <Drawer
        isOpen={!!selectedDept}
        onClose={() => setSelectedDept(null)}
        title={selectedDept ? `Department Specification: ${selectedDept.departmentCode}` : 'Department Dossier'}
        width="max-w-lg"
      >
        {selectedDept && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedDept.status === 'ACTIVE'
                ? 'bg-emerald-50 border-emerald-200'
                : selectedDept.status === 'RESTRUCTURING'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedDept.status === 'ACTIVE' ? 'bg-emerald-600' : selectedDept.status === 'RESTRUCTURING' ? 'bg-amber-600' : 'bg-gray-600'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Allocated Annual Budget</p>
                  <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">
                    ${(selectedDept.allocatedAnnualBudgetUsd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedDept.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900' :
                selectedDept.status === 'RESTRUCTURING' ? 'bg-amber-200 text-amber-900' :
                'bg-gray-200 text-gray-900'
              }`}>
                {selectedDept.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <Users className="w-4 h-4 text-primary" /> Active Headcount
                </div>
                <p className="text-lg font-mono font-bold text-gray-900 truncate">{selectedDept.totalEmployees} FTEs assigned</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> YTD Spend Audit
                </div>
                <p className="text-base font-bold font-mono text-emerald-600 truncate">
                  ${(selectedDept.ytdSpendUsd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm">
              <div className="border-b border-gray-200 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Department Title & Division</span>
                <h3 className="text-base font-bold text-gray-900">{selectedDept.departmentName}</h3>
                <span className="inline-block mt-1 text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-mono font-bold">
                  Cost Center: {selectedDept.costCenterCode}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-gray-500">Department Head Executive:</span>
                <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-primary inline" /> {users.find(u => u.id === selectedDept.headUserId)?.fullName || 'Unassigned'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Parent Division:</span>
                <span className="font-medium text-gray-800">{data.find(d => d.id === selectedDept.parentId)?.departmentName || 'None'}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs font-mono">
                <span className="text-gray-500 font-sans">Location:</span>
                <span className="text-gray-800">{BRANCH_OPTIONS.find(b => b.id === selectedDept.locationId)?.label || selectedDept.locationId || 'N/A'}</span>
              </div>

              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-500 font-sans">Established Date:</span>
                <span className="text-gray-800">{selectedDept.establishedDate}</span>
              </div>

              {selectedDept.missionStatement && (
                <div className="pt-3 border-t border-gray-200 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Charter Mission Statement</span>
                  <p className="text-sm text-gray-700 italic">{selectedDept.missionStatement}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm">
                <Briefcase className="w-4 h-4" /> Manage Positions & Staff
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo Phòng ban Mới' : 'Cập nhật Phòng ban'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveDept} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mã Phòng ban *</label>
              <input
                type="text" required
                value={editingDept.departmentCode || ''}
                onChange={(e) => setEditingDept({ ...editingDept, departmentCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mã cost center</label>
              <input
                type="text"
                value={editingDept.costCenterCode || ''}
                onChange={(e) => setEditingDept({ ...editingDept, costCenterCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tên Phòng ban *</label>
            <input
              type="text" required
              value={editingDept.departmentName || ''}
              onChange={(e) => setEditingDept({ ...editingDept, departmentName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khối / Phòng ban cấp trên (Tree Hierarchy)</label>
              <TreeSelect
                value={editingDept.parentId}
                onChange={(val) => setEditingDept({ ...editingDept, parentId: val || undefined })}
                placeholder="-- Trực thuộc Ban Giám Đốc --"
                options={data
                  .filter(d => d.id !== editingDept.id)
                  .map(dept => ({
                    id: dept.id,
                    name: `${dept.departmentName} (${dept.departmentCode})`,
                  }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trưởng phòng / Trưởng bộ phận (Head User)</label>
              <SearchLookupModal
                title="Chọn Trưởng Phòng / Quản Lý"
                iconType="user"
                placeholder="Chọn nhân sự quản lý..."
                value={editingDept.headUserId}
                options={users.map(u => ({
                  id: u.id,
                  code: u.username,
                  name: u.fullName,
                  subtitle: `Email: ${u.email || 'N/A'} - Chức vụ: ${u.role}`
                }))}
                onChange={(val) => setEditingDept(prev => ({ ...prev, headUserId: val || undefined }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngân sách hoạt động hàng năm</label>
              <CurrencyInput
                value={editingDept.allocatedAnnualBudgetUsd || 0}
                onChange={(val) => setEditingDept(prev => ({ ...prev, allocatedAnnualBudgetUsd: val }))}
                currencySymbol="$"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái hoạt động</label>
              <select
                value={editingDept.status || 'ACTIVE'}
                onChange={(e) => setEditingDept({ ...editingDept, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="ACTIVE">Hoạt động (Active)</option>
                <option value="RESTRUCTURING">Tái cấu trúc (Restructuring)</option>
                <option value="MERGING">Đang sáp nhập (Merging)</option>
                <option value="INACTIVE">Ngừng hoạt động (Inactive)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh / Trụ sở phụ trách</label>
            <select
              value={editingDept.locationId || ''}
              onChange={(e) => setEditingDept({ ...editingDept, locationId: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Trụ sở chính --</option>
              {BRANCH_OPTIONS.map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </div>

          <div>
            <FileDropzone
              label="Quyết định thành lập & Quy chế vận hành phòng ban (PDF/Doc)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sứ mệnh & Nhiệm vụ chính (Mission Statement)</label>
            <textarea
              rows={2}
              value={editingDept.missionStatement || ''}
              onChange={(e) => setEditingDept({ ...editingDept, missionStatement: e.target.value })}
              placeholder="Mô tả chức năng, nhiệm vụ chính của phòng ban..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingDept}
        onClose={() => setDeletingDept(null)}
        title="Xóa Phòng ban"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa phòng ban <strong>{deletingDept?.departmentName}</strong>?</p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setDeletingDept(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
