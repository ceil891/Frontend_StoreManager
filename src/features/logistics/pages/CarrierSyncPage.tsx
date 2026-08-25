import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Play, Settings, Clock, Activity, ShieldCheck, Database, Layers } from 'lucide-react';
import { toast } from 'sonner';

interface CarrierSyncJob {
  id: string;
  carrierName: string;
  dataType: 'SHIPMENT' | 'TRACKING' | 'ORDER' | 'COD' | 'RATE' | 'SERVICE';
  scope: 'TODAY' | '7_DAYS' | '30_DAYS' | 'CUSTOM';
  autoSync: boolean;
  cycleIntervalMinutes: number; // e.g. 5, 15, 30, 60, 360, 1440
  connectionStatus: 'CONNECTED' | 'ERROR' | 'DISCONNECTED';
  lastSync: string;
  nextSync: string;
  syncedRecords: number;
  errorRecords: number;
  lastApiError?: string;
}

export function CarrierSyncPage() {
  const [jobs, setJobs] = useState<CarrierSyncJob[]>([
    {
      id: '1',
      carrierName: 'Viettel Post API',
      dataType: 'TRACKING',
      scope: 'TODAY',
      autoSync: true,
      cycleIntervalMinutes: 15,
      connectionStatus: 'CONNECTED',
      lastSync: '14/08/2026 17:45:00',
      nextSync: '14/08/2026 18:00:00',
      syncedRecords: 1420,
      errorRecords: 0,
    },
    {
      id: '2',
      carrierName: 'Giao Hàng Tiết Kiệm (GHTK)',
      dataType: 'SHIPMENT',
      scope: '7_DAYS',
      autoSync: true,
      cycleIntervalMinutes: 30,
      connectionStatus: 'CONNECTED',
      lastSync: '14/08/2026 17:30:00',
      nextSync: '14/08/2026 18:00:00',
      syncedRecords: 890,
      errorRecords: 2,
      lastApiError: 'HTTP 429: Too Many Requests on batch tracking API',
    },
    {
      id: '3',
      carrierName: 'Giao Hàng Nhanh (GHN)',
      dataType: 'COD',
      scope: '30_DAYS',
      autoSync: false,
      cycleIntervalMinutes: 60,
      connectionStatus: 'CONNECTED',
      lastSync: '14/08/2026 12:00:00',
      nextSync: 'Thủ công',
      syncedRecords: 450,
      errorRecords: 0,
    },
  ]);

  const [selectedJob, setSelectedJob] = useState<CarrierSyncJob | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const handleTriggerSync = (jobId: string) => {
    setIsSyncing(jobId);
    setTimeout(() => {
      setJobs(prev =>
        prev.map(j =>
          j.id === jobId
            ? {
                ...j,
                lastSync: new Date().toLocaleString('vi-VN'),
                syncedRecords: j.syncedRecords + Math.floor(Math.random() * 15 + 1),
                connectionStatus: 'CONNECTED',
              }
            : j
        )
      );
      setIsSyncing(null);
      toast.success('Kích hoạt đồng bộ API đối tác vận chuyển thành công!');
    }, 1200);
  };

  const handleToggleAutoSync = (jobId: string) => {
    setJobs(prev =>
      prev.map(j => (j.id === jobId ? { ...j, autoSync: !j.autoSync } : j))
    );
    toast.info('Đã cập nhật trạng thái đồng bộ tự động.');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-7 h-7 text-primary" /> Đồng bộ đối tác vận chuyển
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Đồng bộ chủ động trạng thái vận đơn, đơn hàng và tiền thu COD qua API của đơn vị vận chuyển
          </p>
        </div>
        <button
          onClick={() => {
            setIsSyncing('ALL');
            setTimeout(() => {
              setIsSyncing(null);
              toast.success('Đã đồng bộ toàn bộ các đối tác vận chuyển!');
            }, 2000);
          }}
          disabled={Boolean(isSyncing)}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm flex items-center gap-2 text-sm disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing === 'ALL' ? 'animate-spin' : ''}`} /> Đồng bộ tất cả ngay
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Cơ chế đồng bộ</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">Active API Polling</p>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">Không sử dụng webhook</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Tổng bản ghi đã đồng bộ</p>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">
              {jobs.reduce((acc, j) => acc + j.syncedRecords, 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Chu kỳ polling trung bình</p>
            <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white">15 phút / lần</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white text-base">Danh sách tiến trình đồng bộ API đối tác vận chuyển</h2>
          <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            HTTP REST Polling Engine Active
          </span>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-800 text-sm">
          {jobs.map((job) => (
            <div key={job.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">{job.carrierName}</h3>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary font-mono font-bold rounded">
                    Dữ liệu: {job.dataType === 'TRACKING' ? 'Mã tracking' : job.dataType === 'SHIPMENT' ? 'Vận đơn' : job.dataType === 'COD' ? 'Tiền thu COD' : job.dataType}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold rounded">
                    Phạm vi: {job.scope === 'TODAY' ? 'Hôm nay' : job.scope === '7_DAYS' ? '7 ngày gần nhất' : job.scope === '30_DAYS' ? '30 ngày gần nhất' : job.scope}
                  </span>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-3 pt-1">
                  <span>Lần đồng bộ cuối: <strong className="font-mono text-gray-700 dark:text-gray-300">{job.lastSync}</strong></span>
                  <span>•</span>
                  <span>Lần kế tiếp: <strong className="font-mono text-primary">{job.nextSync}</strong></span>
                </p>
                {job.lastApiError && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-mono pt-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {job.lastApiError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right font-mono text-xs">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{job.syncedRecords.toLocaleString()} bản ghi thành công</p>
                  {job.errorRecords > 0 && (
                    <p className="text-red-500 font-bold">{job.errorRecords} bản ghi lỗi</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleAutoSync(job.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      job.autoSync
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    Tự động đồng bộ: {job.autoSync ? `Bật (${job.cycleIntervalMinutes} phút)` : 'Tắt'}
                  </button>

                  <button
                    onClick={() => handleTriggerSync(job.id)}
                    disabled={isSyncing === job.id}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-60 transition-colors"
                  >
                    <Play className={`w-3.5 h-3.5 ${isSyncing === job.id ? 'animate-spin' : ''}`} /> Đồng bộ ngay
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default CarrierSyncPage;
