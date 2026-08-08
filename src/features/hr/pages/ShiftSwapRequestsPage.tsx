import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Trash2, CalendarDays, CheckCircle2, XCircle, RefreshCw, ArrowLeftRight, UserCheck } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useHrStore, type ShiftSwapRequestRecord } from '../store/hrStore';
import { useUserStore } from '@/features/hr/store/userStore';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: '⏳ Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50' },
  APPROVED: { label: '🟢 Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50' },
  REJECTED: { label: '🔴 Từ chối', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50' },
};

const SHIFT_OPTIONS = [
  'Ca sáng (08:00 - 12:00)',
  'Ca chiều (13:00 - 17:00)',
  'Ca tối (17:00 - 21:00)',
  'Ca đêm (21:00 - 05:00)',
  'Ca gãy (10:00 - 14:00 & 17:00 - 21:00)',
];

export function ShiftSwapRequestsPage() {
  const {
    shiftSwapRequests,
    fetchShiftSwapRequests,
    addShiftSwapRequest,
    updateShiftSwapRequest,
    deleteShiftSwapRequest,
  } = useHrStore();

  const { users, fetchUsers } = useUserStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selected, setSelected] = useState<ShiftSwapRequestRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<ShiftSwapRequestRecord | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<ShiftSwapRequestRecord>>({
    requestCode: '',
    requesterName: '',
    requesterShift: SHIFT_OPTIONS[0],
    targetUserName: '',
    targetUserShift: SHIFT_OPTIONS[1],
    swapDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: '',
  });

  useEffect(() => {
    fetchShiftSwapRequests();
    fetchUsers();
  }, [fetchShiftSwapRequests, fetchUsers]);

  // Derived user options
  const userOptions = useMemo(() => {
    if (users && users.length > 0) {
      return users.map((u) => u.fullName || u.username);
    }
    return ['Nguyễn Văn Hưng', 'Trần Thị Mai', 'Lưu Hữu Phước', 'Lê Hoàng Nam', 'Phạm Minh Tuấn'];
  }, [users]);

  // Filtered List
  const filteredData = useMemo(() => {
    return shiftSwapRequests.filter((item) => {
      const matchSearch =
        search === '' ||
        item.requestCode.toLowerCase().includes(search.toLowerCase()) ||
        item.requesterName.toLowerCase().includes(search.toLowerCase()) ||
        item.targetUserName.toLowerCase().includes(search.toLowerCase()) ||
        item.reason.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === 'Tất cả' ||
        (statusFilter === 'Chờ duyệt' && item.status === 'PENDING') ||
        (statusFilter === 'Đã duyệt' && item.status === 'APPROVED') ||
        (statusFilter === 'Từ chối' && item.status === 'REJECTED');

      return matchSearch && matchStatus;
    });
  }, [shiftSwapRequests, search, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = shiftSwapRequests.length;
    const pending = shiftSwapRequests.filter((r) => r.status === 'PENDING').length;
    const approved = shiftSwapRequests.filter((r) => r.status === 'APPROVED').length;
    const rejected = shiftSwapRequests.filter((r) => r.status === 'REJECTED').length;
    return { total, pending, approved, rejected };
  }, [shiftSwapRequests]);

  const handleOpenCreate = () => {
    setForm({
      requestCode: `DC-2026-${Math.floor(100 + Math.random() * 900)}`,
      requesterName: userOptions[0] || 'Nguyễn Văn Hưng',
      requesterShift: SHIFT_OPTIONS[0],
      targetUserName: userOptions[1] || 'Trần Thị Mai',
      targetUserShift: SHIFT_OPTIONS[1],
      swapDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requesterName || !form.targetUserName || !form.swapDate || !form.reason) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }
    if (form.requesterName === form.targetUserName) {
      toast.error('Nhân viên đề xuất và Nhân viên đổi ca không được trùng nhau');
      return;
    }

    await addShiftSwapRequest({
      requestCode: form.requestCode || `DC-2026-${Date.now().toString().slice(-4)}`,
      requesterName: form.requesterName!,
      requesterShift: form.requesterShift || SHIFT_OPTIONS[0],
      targetUserName: form.targetUserName!,
      targetUserShift: form.targetUserShift || SHIFT_OPTIONS[1],
      swapDate: form.swapDate!,
      reason: form.reason!,
      status: 'PENDING',
      approvedBy: 'Chưa duyệt',
      notes: form.notes || '',
    });

    toast.success(`Đã gửi yêu cầu đổi ca ${form.requestCode} thành công!`);
    setIsModalOpen(false);
  };

  const handleApprove = async (item: ShiftSwapRequestRecord) => {
    await updateShiftSwapRequest(item.id, {
      status: 'APPROVED',
      approvedBy: 'Giám đốc HR (System Admin)',
    });
    toast.success(`Đã phê duyệt thành công Yêu cầu đổi ca ${item.requestCode}!`);
    if (selected?.id === item.id) {
      setSelected({ ...selected, status: 'APPROVED', approvedBy: 'Giám đốc HR (System Admin)' });
    }
  };

  const handleReject = async (item: ShiftSwapRequestRecord) => {
    await updateShiftSwapRequest(item.id, {
      status: 'REJECTED',
      approvedBy: 'Từ chối bởi Admin',
    });
    toast.error(`Đã từ chối Yêu cầu đổi ca ${item.requestCode}!`);
    if (selected?.id === item.id) {
      setSelected({ ...selected, status: 'REJECTED', approvedBy: 'Từ chối bởi Admin' });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteShiftSwapRequest(id);
    toast.success('Đã xóa yêu cầu đổi ca');
    setDeletingItem(null);
    if (selected?.id === id) setSelected(null);
  };

  // Table Columns
  const columns = useMemo<ColumnDef<ShiftSwapRequestRecord>[]>(
    () => [
      {
        accessorKey: 'requestCode',
        header: 'Mã Yêu Cầu',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'requesterName',
        header: 'Người Đề Xuất (Ca Gốc)',
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-gray-900 dark:text-white">{row.original.requesterName}</div>
            <span className="text-[11px] text-gray-500 block">{row.original.requesterShift}</span>
          </div>
        ),
      },
      {
        accessorKey: 'targetUserName',
        header: 'Người Đổi Cùng (Ca Đích)',
        cell: ({ row }) => (
          <div>
            <div className="font-bold text-blue-600 dark:text-blue-400">{row.original.targetUserName}</div>
            <span className="text-[11px] text-gray-500 block">{row.original.targetUserShift}</span>
          </div>
        ),
      },
      {
        accessorKey: 'swapDate',
        header: 'Ngày Đổi Ca',
        cell: (info) => (
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Lý Do Đổi Ca',
        cell: (info) => (
          <span className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 max-w-[200px]" title={info.getValue() as string}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const cfg = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.cls}`}>{cfg.label}</span>;
        },
      },
      {
        accessorKey: 'approvedBy',
        header: 'Người Duyệt',
        cell: (info) => <span className="text-xs text-gray-500 italic">{info.getValue() as string || 'Chưa duyệt'}</span>,
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
              title="Xem chi tiết phiếu đổi ca"
            >
              <Eye className="w-4 h-4" />
            </button>

            {row.original.status === 'PENDING' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); handleApprove(row.original); }}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center gap-1"
                  title="Phê duyệt yêu cầu đổi ca"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReject(row.original); }}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center gap-1"
                  title="Từ chối yêu cầu đổi ca"
                >
                  <XCircle className="w-3.5 h-3.5" /> Từ chối
                </button>
              </>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); setDeletingItem(row.original); }}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Xóa yêu cầu"
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
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ArrowLeftRight className="text-emerald-600" /> Quản lý & Phê Duyệt Yêu Cầu Đổi Ca
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Ghi nhận và phê duyệt yêu cầu luân chuyển ca làm việc giữa các nhân viên trong chi nhánh.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-xs font-bold shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo Yêu Cầu Đổi Ca Mới
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng số yêu cầu</span>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.total} phiếu</div>
        </div>
        <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
          <span className="text-xs text-amber-700 dark:text-amber-300 font-bold">Chờ phê duyệt</span>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending} phiếu</div>
        </div>
        <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">Đã phê duyệt</span>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.approved} phiếu</div>
        </div>
        <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/50 shadow-sm">
          <span className="text-xs text-rose-700 dark:text-rose-300 font-bold">Từ chối</span>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.rejected} phiếu</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã phiếu, tên nhân viên đề xuất, người đổi cùng, lý do..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-transparent dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-xs bg-white dark:bg-gray-900 dark:text-white font-medium"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Đã duyệt">Đã duyệt</option>
            <option value="Từ chối">Từ chối</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <ReusableDataTable columns={columns} data={filteredData} onRowClick={(row) => setSelected(row)} />

      {/* Drawer Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Yêu Cầu Đổi Ca: ${selected?.requestCode}`}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-4 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex justify-between items-center pb-3 border-b dark:border-gray-800">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Mã phiếu:</span>
                <p className="font-mono font-bold text-emerald-600 text-base">{selected.requestCode}</p>
              </div>
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${STATUS_MAP[selected.status]?.cls}`}>
                {STATUS_MAP[selected.status]?.label}
              </span>
            </div>

            {/* Shift Swap Comparison Box */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between font-bold text-sm text-gray-900 dark:text-white">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <UserCheck className="w-4 h-4" /> Nhân viên đề xuất
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <UserCheck className="w-4 h-4" /> Đồng nghiệp trao đổi
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <p className="font-bold text-gray-900 dark:text-white">{selected.requesterName}</p>
                  <span className="text-[11px] text-emerald-600 font-medium block mt-1">
                    Ca gốc: {selected.requesterShift}
                  </span>
                </div>
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <p className="font-bold text-blue-600 dark:text-blue-400">{selected.targetUserName}</p>
                  <span className="text-[11px] text-blue-600 font-medium block mt-1">
                    Ca nhận: {selected.targetUserShift}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Ngày thực hiện đổi ca:</span>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">{selected.swapDate}</p>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Người phê duyệt:</span>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">{selected.approvedBy || 'Chưa duyệt'}</p>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase">Lý do xin đổi ca:</span>
              <p className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-800 dark:text-gray-200 italic mt-1 border border-dashed dark:border-gray-800">
                "{selected.reason}"
              </p>
            </div>

            {selected.notes && (
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Ghi chú thêm:</span>
                <p className="p-2 text-gray-600 dark:text-gray-400">{selected.notes}</p>
              </div>
            )}

            {/* Modal Approval Action Buttons */}
            {selected.status === 'PENDING' && (
              <div className="flex gap-2 pt-4 border-t dark:border-gray-800">
                <button
                  onClick={() => handleApprove(selected)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Phê Duyệt Đổi Ca
                </button>
                <button
                  onClick={() => handleReject(selected)}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Từ Chối Đổi Ca
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Create Shift Swap Request */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="📝 Tạo Yêu Cầu Đổi Ca Mới"
        width="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã Yêu Cầu *</label>
              <input
                type="text"
                value={form.requestCode || ''}
                readOnly
                className="w-full p-2 border rounded font-mono font-bold text-emerald-600 bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày Đổi Ca *</label>
              <input
                type="date"
                value={form.swapDate || ''}
                onChange={(e) => setForm({ ...form, swapDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h4 className="font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-600" /> Thông tin đổi ca 2 bên
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">1. Nhân viên đề xuất *</label>
                <select
                  value={form.requesterName || ''}
                  onChange={(e) => setForm({ ...form, requesterName: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                  required
                >
                  {userOptions.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">2. Đồng nghiệp đổi cùng *</label>
                <select
                  value={form.targetUserName || ''}
                  onChange={(e) => setForm({ ...form, targetUserName: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                  required
                >
                  {userOptions.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ca làm việc gốc *</label>
                <select
                  value={form.requesterShift || ''}
                  onChange={(e) => setForm({ ...form, requesterShift: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ca muốn đổi sang *</label>
                <select
                  value={form.targetUserShift || ''}
                  onChange={(e) => setForm({ ...form, targetUserShift: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  {SHIFT_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Lý do xin đổi ca *</label>
            <textarea
              rows={2}
              value={form.reason || ''}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Nhập lý do chi tiết..."
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú thêm</label>
            <input
              type="text"
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Đã thỏa thuận 2 bên..."
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded text-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md"
            >
              Gửi Yêu Cầu Đổi Ca
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        title="⚠️ Xóa Yêu Cầu Đổi Ca"
        width="max-w-sm"
      >
        {deletingItem && (
          <div className="space-y-4 text-xs">
            <p className="text-gray-700 dark:text-gray-300">
              Bạn có chắc chắn muốn xóa yêu cầu đổi ca <strong className="text-rose-600">{deletingItem.requestCode}</strong> của {deletingItem.requesterName}?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t dark:border-gray-800">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded text-gray-700 dark:text-gray-300 font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => handleDelete(deletingItem.id)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow"
              >
                Xóa
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
