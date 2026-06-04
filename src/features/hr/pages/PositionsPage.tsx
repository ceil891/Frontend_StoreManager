import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Briefcase, DollarSign, Award, Edit, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useHrStore, type JobPositionRecord } from '../store/hrStore';

const tierStyles = {
  EXECUTIVE_L6: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  DIRECTOR_L5: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200',
  SENIOR_MGR_L4: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  TEAM_LEAD_L3: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  ASSOCIATE_L2: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  ENTRY_L1: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

export function PositionsPage() {
  const { positions: data, departments, addPosition, updatePosition, deletePosition } = useHrStore();
  
  const [search, setSearch] = useState('');
  const [selectedPos, setSelectedPos] = useState<JobPositionRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPos, setEditingPos] = useState<Partial<JobPositionRecord>>({});
  
  const [deletingPos, setDeletingPos] = useState<JobPositionRecord | null>(null);

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.positionCode.toLowerCase().includes(q) ||
        item.positionTitle.toLowerCase().includes(q) ||
        item.departmentName.toLowerCase().includes(q) ||
        item.jobGradeTier.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    // 3. Grade filter
    const matchesGrade = gradeFilter === 'all' || item.jobGradeTier === gradeFilter;

    return matchesSearch && matchesStatus && matchesGrade;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingPos({
      positionCode: `POS-${Math.floor(1000 + Math.random() * 9000)}`,
      positionTitle: '',
      departmentName: departments.length > 0 ? departments[0].departmentName : '',
      jobGradeTier: 'ASSOCIATE_L2',
      salaryRangeMin: 0,
      salaryRangeMax: 0,
      activeHeadcount: 0,
      approvedHeadcountQuota: 1,
      isOvertimeEligible: true,
      status: 'OPEN_HIRING',
      lastReviewedDate: new Date().toISOString().split('T')[0],
      qualificationRequirement: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pos: JobPositionRecord) => {
    setModalMode('edit');
    setEditingPos(pos);
    setIsModalOpen(true);
  };

  const handleSavePos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPos.positionCode || !editingPos.positionTitle) return;

    const payload: Omit<JobPositionRecord, 'id'> = {
      positionCode: editingPos.positionCode,
      positionTitle: editingPos.positionTitle,
      departmentName: editingPos.departmentName || '',
      jobGradeTier: editingPos.jobGradeTier as any || 'ASSOCIATE_L2',
      salaryRangeMin: Number(editingPos.salaryRangeMin) || 0,
      salaryRangeMax: Number(editingPos.salaryRangeMax) || 0,
      activeHeadcount: Number(editingPos.activeHeadcount) || 0,
      approvedHeadcountQuota: Number(editingPos.approvedHeadcountQuota) || 0,
      isOvertimeEligible: Boolean(editingPos.isOvertimeEligible),
      status: editingPos.status as any || 'OPEN_HIRING',
      lastReviewedDate: editingPos.lastReviewedDate || '',
      qualificationRequirement: editingPos.qualificationRequirement || ''
    };

    if (modalMode === 'create') {
      addPosition(payload);
    } else if (editingPos.id) {
      updatePosition(editingPos.id, payload);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPos) return;
    deletePosition(deletingPos.id);
    setDeletingPos(null);
  };

  const jobGradeLabels = {
    EXECUTIVE_L6: 'Executive L6',
    DIRECTOR_L5: 'Director L5',
    SENIOR_MGR_L4: 'Senior Mgr L4',
    TEAM_LEAD_L3: 'Team Lead L3',
    ASSOCIATE_L2: 'Associate L2',
    ENTRY_L1: 'Entry L1',
  } as const;

  const hiringStatusLabels = {
    OPEN_HIRING: 'Mở tuyển',
    FULL_QUOTA: 'Đã đủ chỉ tiêu',
    FROZEN: 'Tạm dừng',
    CLOSED: 'Đóng',
  } as const;

  const overtimeLabels = {
    true: 'Không được miễn OT',
    false: 'Được miễn OT',
  } as const;

  const columns = useMemo<ColumnDef<JobPositionRecord>[]>(
    () => [
      {
        accessorKey: 'positionCode',
        header: 'Mã vị trí',
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'positionTitle',
        header: 'Tên chức danh & Phòng ban',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.positionTitle}</p>
            <p className="text-xs text-gray-500 font-mono">Bộ phận: {row.original.departmentName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'jobGradeTier',
        header: 'Bậc lương',
        cell: (info) => {
          const tier = info.getValue() as keyof typeof jobGradeLabels;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierStyles[tier]}`}>
              {jobGradeLabels[tier] ?? tier.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'salaryRangeMin',
        header: 'Khoảng lương',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200 text-xs">
            ${(row.original.salaryRangeMin / 1000).toFixed(0)}k - ${(row.original.salaryRangeMax / 1000).toFixed(0)}k USD
          </span>
        ),
      },
      {
        accessorKey: 'activeHeadcount',
        header: 'Chỉ tiêu nhân sự',
        cell: ({ row }) => {
          const active = row.original.activeHeadcount;
          const quota = row.original.approvedHeadcountQuota;
          const isOver = active > quota;
          return (
            <div>
              <span className={`font-mono font-bold ${isOver ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {active} / {quota} hiện có
              </span>
              <span className="text-xs text-gray-500 block font-mono">
                {isOver ? `+${active - quota} vượt chỉ tiêu` : `${quota - active} vị trí trống`}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'isOvertimeEligible',
        header: 'Quy tắc OT',
        cell: (info) => (
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
            info.getValue() as boolean ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
          }`}>
            {overtimeLabels[String(info.getValue() as boolean) as keyof typeof overtimeLabels]}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái tuyển dụng',
        cell: (info) => {
          const status = info.getValue() as keyof typeof hiringStatusLabels;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'OPEN_HIRING' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'FULL_QUOTA' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'FROZEN' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {hiringStatusLabels[status] ?? status.replace(/_/g, ' ')}
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
              onClick={(e) => { e.stopPropagation(); setSelectedPos(row.original); }}
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
              onClick={(e) => { e.stopPropagation(); setDeletingPos(row.original); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vị trí công việc & Hạn mức nhân sự</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý vị trí việc làm, đánh giá bậc lương, xem hạn mức nhân sự và kiểm soát quy tắc làm thêm giờ.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất bảng
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Tạo Vị trí
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
                placeholder="Tìm kiếm vị trí theo mã, chức danh, bộ phận hoặc bậc lương..."
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
                <option value="OPEN_HIRING">OPEN HIRING</option>
                <option value="FULL_QUOTA">FULL QUOTA</option>
                <option value="FROZEN">FROZEN</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Bậc lương:</span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả bậc lương</option>
                <option value="EXECUTIVE_L6">EXECUTIVE L6</option>
                <option value="DIRECTOR_L5">DIRECTOR L5</option>
                <option value="SENIOR_MGR_L4">SENIOR MGR L4</option>
                <option value="TEAM_LEAD_L3">TEAM LEAD L3</option>
                <option value="ASSOCIATE_L2">ASSOCIATE L2</option>
                <option value="ENTRY_L1">ENTRY L1</option>
              </select>
            </div>

            {(statusFilter !== 'all' || gradeFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setGradeFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedPos(row)} />
      </div>

      <Drawer
        isOpen={!!selectedPos}
        onClose={() => setSelectedPos(null)}
        title={selectedPos ? `Position Dossier: ${selectedPos.positionCode}` : 'Position Specification'}
        width="max-w-lg"
      >
        {selectedPos && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedPos.status === 'OPEN_HIRING'
                ? 'bg-emerald-50 border-emerald-200'
                : selectedPos.status === 'FROZEN'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedPos.status === 'OPEN_HIRING' ? 'bg-emerald-600' : selectedPos.status === 'FROZEN' ? 'bg-amber-600' : 'bg-blue-600'
                }`}>
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Approved Quota Status</p>
                  <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">
                    {selectedPos.activeHeadcount} / {selectedPos.approvedHeadcountQuota} Assigned
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedPos.status === 'OPEN_HIRING' ? 'bg-emerald-200 text-emerald-900' :
                selectedPos.status === 'FROZEN' ? 'bg-amber-200 text-amber-900' :
                'bg-blue-200 text-blue-900'
              }`}>
                {selectedPos.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Target Salary Band
                </div>
                <p className="text-sm font-mono font-bold text-gray-900 truncate">
                  ${(selectedPos.salaryRangeMin / 1000).toFixed(0)}k - ${(selectedPos.salaryRangeMax / 1000).toFixed(0)}k / yr
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <Award className="w-4 h-4 text-purple-500" /> Job Grade Hierarchy
                </div>
                <p className="text-xs font-bold text-gray-900 truncate font-mono">{selectedPos.jobGradeTier.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm">
              <div className="border-b border-gray-200 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Position Title & Department</span>
                <h3 className="text-base font-bold text-gray-900">{selectedPos.positionTitle}</h3>
                <span className="inline-block mt-1 text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-mono font-bold">
                  Department: {selectedPos.departmentName}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-gray-500">FLSA Exemption Rule:</span>
                <span className={`font-mono font-bold ${selectedPos.isOvertimeEligible ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                  {selectedPos.isOvertimeEligible ? 'NON-EXEMPT (Overtime)' : 'EXEMPT (Salaried)'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs font-mono">
                <span className="text-gray-500 font-sans">Last Salary Benchmark:</span>
                <span className="text-gray-800">{selectedPos.lastReviewedDate}</span>
              </div>

              {selectedPos.qualificationRequirement && (
                <div className="pt-3 border-t border-gray-200 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Mandatory Role Qualifications</span>
                  <p className="text-sm text-gray-700 italic">{selectedPos.qualificationRequirement}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Định Nghĩa Chức Vụ Mới' : 'Cập Nhật Chức Vụ'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSavePos} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mã Chức vụ (Position Code) *</label>
              <input
                type="text" required
                value={editingPos.positionCode || ''}
                onChange={(e) => setEditingPos({ ...editingPos, positionCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cấp bậc (Job Grade)</label>
              <select
                value={editingPos.jobGradeTier || 'ASSOCIATE_L2'}
                onChange={(e) => setEditingPos({ ...editingPos, jobGradeTier: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="ENTRY_L1">Entry Level (L1)</option>
                <option value="ASSOCIATE_L2">Associate (L2)</option>
                <option value="TEAM_LEAD_L3">Team Lead (L3)</option>
                <option value="SENIOR_MGR_L4">Senior Manager (L4)</option>
                <option value="DIRECTOR_L5">Director (L5)</option>
                <option value="EXECUTIVE_L6">Executive (L6)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tên Chức vụ *</label>
              <input
                type="text" required
                value={editingPos.positionTitle || ''}
                onChange={(e) => setEditingPos({ ...editingPos, positionTitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Thuộc Phòng ban</label>
              <select
                value={editingPos.departmentName || ''}
                onChange={(e) => setEditingPos({ ...editingPos, departmentName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
              >
                {departments.map(d => <option key={d.id} value={d.departmentName}>{d.departmentName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Lương Min ($)</label>
                <input
                  type="number"
                  value={editingPos.salaryRangeMin || 0}
                  onChange={(e) => setEditingPos({ ...editingPos, salaryRangeMin: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="w-1/2">
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Lương Max ($)</label>
                <input
                  type="number"
                  value={editingPos.salaryRangeMax || 0}
                  onChange={(e) => setEditingPos({ ...editingPos, salaryRangeMax: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-[10px] font-medium text-gray-700 mb-1">Quota Định biên</label>
                <input
                  type="number"
                  value={editingPos.approvedHeadcountQuota || 0}
                  onChange={(e) => setEditingPos({ ...editingPos, approvedHeadcountQuota: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="w-1/2 flex items-end">
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={!!editingPos.isOvertimeEligible}
                    onChange={(e) => setEditingPos({ ...editingPos, isOvertimeEligible: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-gray-700 font-bold">OT Eligible</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái tuyển dụng</label>
            <select
              value={editingPos.status || 'OPEN_HIRING'}
              onChange={(e) => setEditingPos({ ...editingPos, status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
            >
              <option value="OPEN_HIRING">Đang tuyển dụng (Open)</option>
              <option value="FULL_QUOTA">Đủ định biên (Full)</option>
              <option value="FROZEN">Đóng băng tuyển dụng (Frozen)</option>
              <option value="PHASING_OUT">Chờ tinh giảm (Phasing Out)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Yêu cầu chuyên môn (Qualification Requirements)</label>
            <textarea
              rows={2}
              value={editingPos.qualificationRequirement || ''}
              onChange={(e) => setEditingPos({ ...editingPos, qualificationRequirement: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary"
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
              Lưu Thông Tin
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingPos}
        onClose={() => setDeletingPos(null)}
        title="Xóa Chức Vụ"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa chức vụ <strong>{deletingPos?.positionTitle}</strong>?</p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setDeletingPos(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
