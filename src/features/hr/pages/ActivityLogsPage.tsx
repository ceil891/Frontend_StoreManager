import { useMemo, useState } from 'react';
import { Download, Search, Eye, Monitor, X, FileText, Building2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import type { ColumnDef } from '@tanstack/react-table';
import {
  useActivityLogStore,
  ACTION_LABEL,
  ACTION_STYLES,
  type ActivityLogRecord,
  type ActivityActionType,
} from '../store/activityLogStore';

const STATUS_LABEL: Record<ActivityLogRecord['status'], string> = {
  SUCCESS: 'Thành công',
  DENIED: 'Từ chối',
  FAILED: 'Thất bại',
};

export function ActivityLogsPage() {
  const logs = useActivityLogStore((s) => s.logs);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLogRecord | null>(null);
  const [actionFilter, setActionFilter] = useState<'all' | ActivityActionType>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const moduleOptions = useMemo(
    () => [...new Set(logs.map((l) => l.moduleName))].sort(),
    [logs]
  );

  const filtered = logs.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.userName.toLowerCase().includes(q) ||
      item.userEmail.toLowerCase().includes(q) ||
      item.entityLabel.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.pageName.toLowerCase().includes(q) ||
      item.moduleName.toLowerCase().includes(q) ||
      (item.userCode || '').toLowerCase().includes(q);

    const matchAction = actionFilter === 'all' || item.actionType === actionFilter;
    const matchModule = moduleFilter === 'all' || item.moduleName === moduleFilter;
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchSearch && matchAction && matchModule && matchStatus;
  });

  const columns = useMemo<ColumnDef<ActivityLogRecord>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Thời gian',
        cell: (info) => (
          <span className="font-mono text-xs text-gray-500 whitespace-nowrap">{info.getValue() as string}</span>
        ),
      },
      {
        id: 'actor',
        header: 'Người thực hiện',
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5 min-w-[160px]">
            <UserAvatar name={row.original.userName} seed={row.original.userEmail} size="sm" />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.userName}</p>
              <p className="text-xs text-gray-500 font-mono truncate max-w-[180px]">{row.original.userEmail}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'actionType',
        header: 'Hành động',
        cell: (info) => {
          const action = info.getValue() as ActivityActionType;
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${ACTION_STYLES[action]}`}
            >
              {ACTION_LABEL[action]}
            </span>
          );
        },
      },
      {
        id: 'context',
        header: 'Phân hệ / Trang',
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{row.original.moduleName}</p>
            <p className="text-xs text-gray-500">{row.original.pageName}</p>
          </div>
        ),
      },
      {
        id: 'entity',
        header: 'Đối tượng',
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
              {row.original.entityLabel}
            </p>
            <p className="text-xs font-mono text-gray-400">{row.original.entityId}</p>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: (info) => (
          <span className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'branchName',
        header: 'Chi nhánh',
        cell: (info) => (
          <span className="text-xs text-gray-600 dark:text-gray-400">{info.getValue() as string || '—'}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Kết quả',
        cell: (info) => {
          const status = info.getValue() as ActivityLogRecord['status'];
          return (
            <span
              className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                status === 'SUCCESS'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {STATUS_LABEL[status]}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedLog(row.original);
            }}
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      },
    ],
    []
  );

  const stats = useMemo(() => {
    const byAction = (t: ActivityActionType) => logs.filter((l) => l.actionType === t).length;
    return {
      total: logs.length,
      view: byAction('VIEW'),
      create: byAction('CREATE'),
      update: byAction('UPDATE'),
      delete: byAction('DELETE'),
    };
  }, [logs]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch sử hoạt động</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Theo dõi ai đã <strong>Xem / Thêm / Sửa / Xóa</strong> trên từng màn hình — kèm tên người, tài khoản,
              đối tượng và chi nhánh.
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Tổng sự kiện', value: stats.total, cls: 'border-gray-200 dark:border-gray-700' },
            { label: 'Xem', value: stats.view, cls: 'border-blue-200 dark:border-blue-800' },
            { label: 'Thêm', value: stats.create, cls: 'border-emerald-200 dark:border-emerald-800' },
            { label: 'Sửa', value: stats.update, cls: 'border-amber-200 dark:border-amber-800' },
            { label: 'Xóa', value: stats.delete, cls: 'border-red-200 dark:border-red-800' },
          ].map((s) => (
            <div key={s.label} className={`p-3 rounded-xl border bg-white dark:bg-gray-800 ${s.cls}`}>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên người, email tài khoản, mô tả, đối tượng, trang..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Hành động:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as typeof actionFilter)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 text-xs"
              >
                <option value="all">Tất cả</option>
                <option value="VIEW">Xem</option>
                <option value="CREATE">Thêm</option>
                <option value="UPDATE">Sửa</option>
                <option value="DELETE">Xóa</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Phân hệ:</span>
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 text-xs"
              >
                <option value="all">Tất cả</option>
                {moduleOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Kết quả:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 text-xs"
              >
                <option value="all">Tất cả</option>
                <option value="SUCCESS">Thành công</option>
                <option value="DENIED">Từ chối</option>
                <option value="FAILED">Thất bại</option>
              </select>
            </div>
            {(actionFilter !== 'all' || moduleFilter !== 'all' || statusFilter !== 'all' || search) && (
              <button
                type="button"
                onClick={() => {
                  setActionFilter('all');
                  setModuleFilter('all');
                  setStatusFilter('all');
                  setSearch('');
                }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedLog(row)} />
      </div>

      <Drawer
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title={selectedLog ? `Chi tiết hoạt động` : ''}
        width="max-w-lg"
      >
        {selectedLog && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <span
                className={`inline-flex px-3 py-1 rounded-full text-sm font-bold border ${ACTION_STYLES[selectedLog.actionType]}`}
              >
                {ACTION_LABEL[selectedLog.actionType]}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  selectedLog.status === 'SUCCESS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {STATUS_LABEL[selectedLog.status]}
              </span>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
              <UserAvatar name={selectedLog.userName} seed={selectedLog.userEmail} size="lg" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Người thực hiện</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedLog.userName}</p>
                <p className="text-sm font-mono text-primary">{selectedLog.userEmail}</p>
                {selectedLog.userCode && (
                  <p className="text-xs text-gray-500 mt-0.5">Mã NV: {selectedLog.userCode}</p>
                )}
                <p className="text-xs text-gray-500">Vai trò: {selectedLog.role}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <FileText className="w-3.5 h-3.5" /> Phân hệ / Trang
                </div>
                <p className="text-sm font-semibold">{selectedLog.moduleName}</p>
                <p className="text-xs text-gray-500">{selectedLog.pageName}</p>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Building2 className="w-3.5 h-3.5" /> Chi nhánh
                </div>
                <p className="text-sm font-semibold">{selectedLog.branchName || '—'}</p>
                <p className="text-xs font-mono text-gray-400">{selectedLog.branchId || ''}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">Đối tượng tác động</p>
              <p className="font-bold text-gray-900 dark:text-white">{selectedLog.entityLabel}</p>
              <p className="text-xs font-mono text-gray-500">
                {selectedLog.entityType} · {selectedLog.entityId}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 pt-2 border-t border-gray-100 dark:border-gray-800">
                {selectedLog.description}
              </p>
              {selectedLog.changedFields && selectedLog.changedFields.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-1">Trường thay đổi:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedLog.changedFields.map((f) => (
                      <span
                        key={f}
                        className="text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {(selectedLog.oldValues || selectedLog.newValues) && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Truy vết dữ liệu (JSON Diff)</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-2 rounded overflow-x-auto text-red-800 dark:text-red-300">
                      <p className="font-bold border-b border-red-200 dark:border-red-800/50 pb-1 mb-1">Trước khi sửa</p>
                      <pre>{selectedLog.oldValues ? JSON.stringify(selectedLog.oldValues, null, 2) : 'N/A'}</pre>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-2 rounded overflow-x-auto text-emerald-800 dark:text-emerald-300">
                      <p className="font-bold border-b border-emerald-200 dark:border-emerald-800/50 pb-1 mb-1">Sau khi sửa</p>
                      <pre>{selectedLog.newValues ? JSON.stringify(selectedLog.newValues, null, 2) : 'N/A'}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3 text-sm">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-gray-500">
                  <Monitor className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs">{selectedLog.ipAddress}</span>
                </div>
                {selectedLog.userAgent && (
                  <div className="flex text-gray-500 text-[10px] font-mono">
                    <span className="truncate" title={selectedLog.userAgent}>{selectedLog.userAgent}</span>
                  </div>
                )}
                {selectedLog.sessionId && (
                  <div className="flex text-gray-500 text-[10px] font-mono font-semibold">
                    Session: {selectedLog.sessionId}
                  </div>
                )}
              </div>
              <div className="text-right flex flex-col justify-end">
                <p className="text-xs text-gray-500">Thời gian ghi nhận</p>
                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white">{selectedLog.timestamp}</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
