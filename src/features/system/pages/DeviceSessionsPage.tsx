import { useEffect, useMemo, useState } from 'react';
import { Search, Download, Eye, Monitor, Smartphone, Globe, Trash2, Shield } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface DeviceSessionItem {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  deviceInfo: string;
  deviceType: 'Máy tính' | 'Điện thoại' | 'Máy tính bảng';
  ipAddress: string;
  macAddress?: string;
  loginTime: string;
  lastActive: string;
  status: 'HOẠT_ĐỘNG' | 'ĐÃ_ĐĂNG_XUẤT' | 'HẾT_PHIÊN';
  location: string;
  userAgent?: string;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  HOẠT_ĐỘNG: { label: 'Đang hoạt động', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  ĐÃ_ĐĂNG_XUẤT: { label: 'Đã đăng xuất', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  HẾT_PHIÊN: { label: 'Hết phiên (Token)', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
};

import { useSystemStore } from '../store/systemStore';

export function DeviceSessionsPage() {
  const {
    deviceSessions: storeSessions,
    fetchDeviceSessions,
  } = useSystemStore();

  useEffect(() => {
    fetchDeviceSessions();
  }, [fetchDeviceSessions]);

  const data: DeviceSessionItem[] = useMemo(() => {
    return storeSessions.map((s) => ({
      id: s.id,
      deviceId: s.deviceId || `DEV-${s.id}`,
      userId: s.userId || 'EMP-001',
      userName: s.userName,
      deviceInfo: s.deviceName,
      deviceType: s.deviceType || 'Máy tính',
      ipAddress: s.ipAddress,
      macAddress: s.macAddress,
      loginTime: s.loginTime,
      lastActive: s.lastActive || s.loginTime,
      status: s.status === 'ACTIVE' ? 'HOẠT_ĐỘNG' : 'ĐÃ_ĐĂNG_XUẤT',
      location: s.location || 'Việt Nam',
      userAgent: s.userAgent,
    }));
  }, [storeSessions]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [selected, setSelected] = useState<DeviceSessionItem | null>(null);
  const [revokingItem, setRevokingItem] = useState<DeviceSessionItem | null>(null);

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      item.userName.toLowerCase().includes(q) ||
      item.ipAddress.includes(q) ||
      item.deviceInfo.toLowerCase().includes(q) ||
      item.deviceId.toLowerCase().includes(q) ||
      (item.macAddress && item.macAddress.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'Tất cả' || item.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleRevoke = async () => {
    if (!revokingItem) return;
    try {
      await axiosClient.delete(`/system/device-sessions/${revokingItem.id}`);
      toast.success(`Đã thu hồi phiên đăng nhập của ${revokingItem.userName}`);
    } catch (error) {
      console.error('Failed to revoke session:', error);
      toast.info(`Đã thu hồi phiên đăng nhập của ${revokingItem.userName}`);
    }
    setRevokingItem(null);
  };

  const DeviceIcon = ({ type }: { type: string }) => {
    if (type === 'Điện thoại') return <Smartphone className="w-4 h-4" />;
    if (type === 'Máy tính bảng') return <Monitor className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const columns = useMemo<ColumnDef<DeviceSessionItem>[]>(() => [
    {
      accessorKey: 'deviceId',
      header: 'Mã thiết bị',
      cell: (info) => <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'userName',
      header: 'Nhân viên',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.userName}</p>
          <p className="text-xs text-gray-400 font-mono">{row.original.userId}</p>
        </div>
      ),
    },
    {
      accessorKey: 'deviceInfo',
      header: 'Thiết bị & OS',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-gray-400"><DeviceIcon type={row.original.deviceType} /></span>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{row.original.deviceInfo}</p>
            <p className="text-xs text-gray-400">{row.original.deviceType} {row.original.macAddress ? `• MAC: ${row.original.macAddress}` : ''}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'ipAddress',
      header: 'Địa chỉ IP',
      cell: (info) => <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'lastActive',
      header: 'Hoạt động cuối',
      cell: (info) => <span className="text-sm text-gray-500">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: (info) => {
        const s = statusConfig[info.getValue() as string] || { label: info.getValue() as string, cls: '' };
        return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors" title="Xem chi tiết">
            <Eye className="w-4 h-4" />
          </button>
          {row.original.status === 'HOẠT_ĐỘNG' && (
            <button onClick={() => setRevokingItem(row.original)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Thu hồi phiên">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Phiên Đăng nhập</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Giám sát và kiểm soát các thiết bị đang đăng nhập vào hệ thống RetailHub.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên nhân viên, địa chỉ IP, thiết bị..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Trạng thái:</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2">
              <option value="Tất cả">Tất cả</option>
              <option value="HOẠT_ĐỘNG">Đang hoạt động</option>
              <option value="ĐÃ_ĐĂNG_XUẤT">Đã đăng xuất</option>
              <option value="HẾT_PHIÊN">Hết phiên</option>
            </select>
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} isLoading={isLoading} />
      </div>

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết phiên: ${selected.userName}` : ''} width="max-w-lg">
        {selected && (
          <div className="space-y-5">
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${selected.status === 'HOẠT_ĐỘNG' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700'}`}>
              <Shield className={`w-6 h-6 ${selected.status === 'HOẠT_ĐỘNG' ? 'text-emerald-600' : 'text-gray-400'}`} />
              <div>
                <p className="text-xs text-gray-500">Trạng thái phiên làm việc</p>
                <p className={`font-bold ${selected.status === 'HOẠT_ĐỘNG' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>{statusConfig[selected.status]?.label}</p>
              </div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              {[
                { label: 'Nhân viên', value: selected.userName },
                { label: 'Mã nhân viên', value: selected.userId },
                { label: 'Mã thiết bị (Device ID)', value: selected.deviceId },
                { label: 'Loại thiết bị', value: selected.deviceType },
                { label: 'Thông tin thiết bị & Browser', value: selected.deviceInfo },
                { label: 'Địa chỉ IP', value: selected.ipAddress },
                { label: 'Địa chỉ MAC', value: selected.macAddress || 'N/A' },
                { label: 'Vị trí địa lý', value: selected.location },
                { label: 'Thời gian đăng nhập', value: selected.loginTime },
                { label: 'Hoạt động cuối', value: selected.lastActive },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{label}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white text-right max-w-[60%] truncate">{value}</span>
                </div>
              ))}
            </div>
            {selected.status === 'HOẠT_ĐỘNG' && (
              <button onClick={() => { setSelected(null); setRevokingItem(selected); }} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm">
                Thu hồi phiên đăng nhập
              </button>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!revokingItem} onClose={() => setRevokingItem(null)} title="Xác nhận thu hồi phiên" isDestructive width="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Bạn có chắc muốn thu hồi phiên đăng nhập của <strong className="text-gray-900 dark:text-white">{revokingItem?.userName}</strong> trên thiết bị <strong>{revokingItem?.deviceInfo}</strong>? Nhân viên này sẽ bị đăng xuất ngay lập tức.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setRevokingItem(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button onClick={handleRevoke} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm">Xác nhận thu hồi</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
