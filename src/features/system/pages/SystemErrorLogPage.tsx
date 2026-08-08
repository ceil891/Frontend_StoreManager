import { useEffect, useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, AlertOctagon, Terminal, ShieldAlert, Cpu, CheckCircle2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface SystemErrorLogRecord {
  id: string;
  errorHash: string;
  timestamp: string;
  severity: 'FATAL_PANIC' | 'CRITICAL_EXCEPTION' | 'ERROR_TIMEOUT' | 'WARNING_DEPRECATION' | 'AUTH_VIOLATION';
  subsystem: 'POSTGRES_MASTER' | 'REDIS_CACHE_CLUSTER' | 'STRIPE_WEBHOOK_GW' | 'BBPOS_SLED_UART' | 'OMNICHANNEL_SYNC';
  errorCode: string; // e.g. "ERR-PG-503"
  errorMessage: string;
  stackTraceSnippet: string;
  nodeHostname: string;
  resolved: boolean;
  resolvedTimestamp?: string;
  assignedEngineer?: string;
}


const severityBadgeStyles = {
  FATAL_PANIC: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 animate-pulse font-mono font-bold',
  CRITICAL_EXCEPTION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 font-bold',
  ERROR_TIMEOUT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  AUTH_VIOLATION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 font-mono',
  WARNING_DEPRECATION: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

const subsystemStyles = {
  POSTGRES_MASTER: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 font-mono',
  REDIS_CACHE_CLUSTER: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 font-mono',
  STRIPE_WEBHOOK_GW: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 font-mono',
  BBPOS_SLED_UART: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 font-mono',
  OMNICHANNEL_SYNC: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 font-mono',
};

type SearchField = 'all' | 'errorHash' | 'errorCode' | 'errorMessage' | 'subsystem' | 'nodeHostname';

import { useSystemStore } from '../store/systemStore';

export function SystemErrorLogPage() {
  const {
    systemErrorLogs: storeLogs,
    fetchSystemErrorLogs,
  } = useSystemStore();

  useEffect(() => {
    fetchSystemErrorLogs();
  }, [fetchSystemErrorLogs]);

  const data: SystemErrorLogRecord[] = useMemo(() => {
    return storeLogs.map((l) => ({
      id: l.id,
      errorHash: l.logCode,
      timestamp: l.timestamp,
      severity: l.severity === 'CRITICAL' ? 'FATAL_PANIC' : 'ERROR_TIMEOUT',
      subsystem: 'POSTGRES_MASTER',
      errorCode: l.logCode,
      errorMessage: `${l.serviceName}: ${l.errorMessage}`,
      stackTraceSnippet: l.stackTrace,
      nodeHostname: 'server-node-01',
      resolved: false,
    }));
  }, [storeLogs]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [selectedError, setSelectedError] = useState<SystemErrorLogRecord | null>(null);

  // Filter states
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      switch (searchField) {
        case 'errorHash':
          matchesSearch = item.errorHash.toLowerCase().includes(q);
          break;
        case 'errorCode':
          matchesSearch = item.errorCode.toLowerCase().includes(q);
          break;
        case 'errorMessage':
          matchesSearch = item.errorMessage.toLowerCase().includes(q);
          break;
        case 'subsystem':
          matchesSearch = item.subsystem.toLowerCase().includes(q);
          break;
        case 'nodeHostname':
          matchesSearch = item.nodeHostname.toLowerCase().includes(q);
          break;
        case 'all':
        default:
          matchesSearch = (
            item.errorHash.toLowerCase().includes(q) ||
            item.errorCode.toLowerCase().includes(q) ||
            item.errorMessage.toLowerCase().includes(q) ||
            item.subsystem.toLowerCase().includes(q) ||
            item.nodeHostname.toLowerCase().includes(q)
          );
      }
    }

    // 2. Severity filter
    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;

    // 3. Status filter
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      matchesStatus = statusFilter === 'RESOLVED' ? item.resolved : !item.resolved;
    }

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const searchPlaceholder = useMemo(() => {
    switch (searchField) {
      case 'errorHash':
        return 'Tìm theo mã băm lỗi (ví dụ: ERR-20240518)...';
      case 'errorCode':
        return 'Tìm theo mã lỗi hệ thống (ví dụ: PG-08006)...';
      case 'errorMessage':
        return 'Tìm theo nội dung thông báo ngoại lệ...';
      case 'subsystem':
        return 'Tìm theo phân hệ lỗi (ví dụ: POSTGRES)...';
      case 'nodeHostname':
        return 'Tìm theo máy chủ vật lý chứa tiến trình...';
      case 'all':
      default:
        return 'Nhập từ khóa tìm kiếm theo mọi thuộc tính nhật ký lỗi...';
    }
  }, [searchField]);

  const handleToggleResolve = (error: SystemErrorLogRecord) => {
    const isResolved = !error.resolved;
    const timestamp = isResolved ? new Date().toISOString().replace('T', ' ').substring(0, 19) : undefined;
    
    // TODO: update store
    // setData(prev => prev.map(item => item.id === error.id ? { ... } : item));

    setSelectedError(prev => prev && prev.id === error.id ? {
      ...prev,
      resolved: isResolved,
      resolvedTimestamp: timestamp
    } : null);
  };

  const handleExportCSV = () => {
    const headers = ['Mã băm lỗi', 'Thời gian xảy ra', 'Độ nghiêm trọng', 'Phân hệ lỗi', 'Mã lỗi', 'Thông điệp lỗi', 'Máy chủ', 'Trạng thái', 'Kỹ sư phụ trách'];
    const rows = data.map(r => [
      r.errorHash,
      r.timestamp,
      r.severity,
      r.subsystem,
      r.errorCode,
      r.errorMessage,
      r.nodeHostname,
      r.resolved ? 'RESOLVED' : 'UNRESOLVED',
      r.assignedEngineer || 'UNASSIGNED'
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `System_Errors_Telemetry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = useMemo<ColumnDef<SystemErrorLogRecord>[]>(
    () => [
      {
        accessorKey: 'errorHash',
        header: 'Mã băm lỗi (Hash)',
        cell: (info) => <span className="font-mono font-bold text-red-600 dark:text-red-400 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-900/40 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'timestamp',
        header: 'Thời gian xảy ra',
        cell: (info) => <span className="font-mono text-xs text-gray-600 dark:text-gray-400 font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'severity',
        header: 'Mức độ nghiêm trọng',
        cell: (info) => {
          const s = info.getValue() as keyof typeof severityBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${severityBadgeStyles[s]}`}>
              {s.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'subsystem',
        header: 'Phân hệ & Máy chủ',
        cell: ({ row }) => (
          <div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${subsystemStyles[row.original.subsystem]}`}>
              {row.original.subsystem}
            </span>
            <span className="text-xs text-gray-500 block font-mono mt-0.5">{row.original.nodeHostname}</span>
          </div>
        ),
      },
      {
        accessorKey: 'errorMessage',
        header: 'Thông điệp ngoại lệ',
        cell: ({ row }) => (
          <div>
            <p className="font-mono font-bold text-gray-900 dark:text-white text-xs">{row.original.errorCode}</p>
            <p className="text-xs text-gray-500 truncate max-w-xs font-sans">{row.original.errorMessage}</p>
          </div>
        ),
      },
      {
        accessorKey: 'resolved',
        header: 'Trạng thái',
        cell: (info) => (
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border ${
            info.getValue() as boolean 
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200' 
              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 animate-pulse'
          }`}>
            {info.getValue() as boolean ? 'ĐÃ KHẮC PHỤC' : 'CHƯA XỬ LÝ'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedError(row.original); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Giám sát & Báo cáo Lỗi hệ thống Core</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi thời gian thực các ngoại lệ phần cứng POS, sự cố tràn kết nối CSDL và các cuộc tấn công giả mạo chữ ký thanh toán.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none shrink-0">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" /> Xuất nhật ký sự cố (Dumps)
            </button>
            <button 
              onClick={() => alert('Đã gửi xung nhịp khẩn cấp (Heartbeat pulse) tới cụm máy chủ Redis/Database!')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" /> Gửi kiểm tra nhịp cụm (Heartbeat)
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Vietnamese Attribute Dropdown */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Tìm kiếm theo:</span>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent border-none py-1 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả nhật ký</option>
                <option value="errorHash">Mã băm lỗi (Hash)</option>
                <option value="errorCode">Mã lỗi</option>
                <option value="errorMessage">Nội dung lỗi</option>
                <option value="subsystem">Phân hệ lỗi</option>
                <option value="nodeHostname">Tên máy chủ</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Mức độ lỗi:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả mức độ</option>
                <option value="FATAL_PANIC">FATAL PANIC</option>
                <option value="CRITICAL_EXCEPTION">CRITICAL EXCEPTION</option>
                <option value="ERROR_TIMEOUT">ERROR TIMEOUT</option>
                <option value="AUTH_VIOLATION">AUTH VIOLATION</option>
                <option value="WARNING_DEPRECATION">WARNING DEPRECATION</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="UNRESOLVED">Chưa khắc phục</option>
                <option value="RESOLVED">Đã xử lý</option>
              </select>
            </div>

            {(severityFilter !== 'all' || statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setSeverityFilter('all'); setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedError(row)} isLoading={isLoading} />
      </div>

      <Modal
        isOpen={!!selectedError}
        onClose={() => setSelectedError(null)}
        title={selectedError ? `Chi tiết sự cố: ${selectedError.errorHash}` : 'Exception Specification'}
        width="max-w-2xl"
      >
        {selectedError && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedError.resolved
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedError.resolved ? 'bg-emerald-600' : 'bg-red-600 animate-pulse'
                }`}>
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Trạng thái khắc phục sự cố</p>
                  <p className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                    {selectedError.resolved ? `ĐÃ ĐƯỢC XỬ LÝ LÚC @ ${selectedError.resolvedTimestamp}` : '🚨 SỰ CỐ ĐANG MỞ / CHƯA ĐƯỢC KHẮC PHỤC'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedError.resolved ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedError.resolved ? 'ĐÃ ĐÓNG' : 'ĐANG MỞ'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Terminal className="w-4 h-4 text-primary" /> Phân hệ xảy ra lỗi
                </div>
                <p className="text-xs font-mono font-bold text-gray-900 dark:text-white truncate">{selectedError.subsystem}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedError.nodeHostname}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Cpu className="w-4 h-4 text-red-500" /> Kỹ sư điều phối ứng cứu
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate font-sans">
                  {selectedError.assignedEngineer || 'CHƯA ĐIỀU PHỐI KỸ SƯ'}
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Mã Lỗi & Thông điệp ngoại lệ</span>
                <div className="flex items-center gap-2 mb-1 font-mono">
                  <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 font-bold px-2 py-0.5 rounded text-xs border border-red-200 dark:border-red-800">
                    {selectedError.errorCode}
                  </span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${severityBadgeStyles[selectedError.severity]}`}>
                    {selectedError.severity.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white font-sans mt-2">{selectedError.errorMessage}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Thông tin ngăn xếp chi tiết (Raw Stacktrace)</span>
                <pre className="text-xs font-mono bg-gray-900 text-red-300 p-3.5 rounded-lg border border-gray-800 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-64 overflow-y-auto shadow-inner">
                  {selectedError.stackTraceSnippet}
                </pre>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Thời điểm ghi nhận sự cố:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{selectedError.timestamp}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button 
                onClick={() => handleToggleResolve(selectedError)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white font-semibold rounded-lg shadow transition-colors text-sm ${
                  selectedError.resolved ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedError.resolved ? (
                  <>
                    <ShieldAlert className="w-4 h-4" /> Mở lại cuộc điều tra sự cố
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã khắc phục thành công
                  </>
                )}
              </button>
              <button 
                onClick={() => alert(`Kết nối SSH tới máy chủ ${selectedError.nodeHostname} thành công! Đang thiết lập đường truyền shell bảo mật...`)}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <Terminal className="w-4 h-4 inline mr-1" /> Mở SSH Core Shell
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
