import { useEffect, useMemo, useState } from 'react';
import { Search, Download, Eye, KeyRound, ShieldCheck } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface PasswordHistoryItem {
  id: string;
  userId: string;
  userName: string;
  changedAt: string;
  changeReason: 'Tự thay đổi' | 'Reset bởi Admin' | 'Yêu cầu hệ thống' | 'Đổi định kỳ';
  ipAddress: string;
  deviceInfo: string;
}


const reasonConfig: Record<string, string> = {
  'Tự thay đổi': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Reset bởi Admin': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Yêu cầu hệ thống': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Đổi định kỳ': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
};

import { useSystemStore } from '../store/systemStore';

export function PasswordHistoryPage() {
  const {
    passwordHistories: storeHistories,
    fetchPasswordHistories,
  } = useSystemStore();

  useEffect(() => {
    fetchPasswordHistories();
  }, [fetchPasswordHistories]);

  const data: PasswordHistoryItem[] = useMemo(() => {
    return storeHistories.map((h) => ({
      id: h.id,
      userId: 'U001',
      userName: h.userName,
      changedAt: h.changedAt,
      changeReason: 'Tự thay đổi',
      ipAddress: '192.168.1.100',
      deviceInfo: `Thực hiện bởi ${h.changedBy} - ${h.reason}`,
    }));
  }, [storeHistories]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PasswordHistoryItem | null>(null);
  const [userFilter, setUserFilter] = useState('Tất cả');


  const users = useMemo(() => ['Tất cả', ...Array.from(new Set(data.map(d => d.userName)))], [data]);

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch = item.userName.toLowerCase().includes(q) || item.changeReason.toLowerCase().includes(q);
    const matchUser = userFilter === 'Tất cả' || item.userName === userFilter;
    return matchSearch && matchUser;
  });

  const columns = useMemo<ColumnDef<PasswordHistoryItem>[]>(() => [
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
      accessorKey: 'changedAt',
      header: 'Thời điểm thay đổi',
      cell: (info) => <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'changeReason',
      header: 'Lý do thay đổi',
      cell: (info) => {
        const reason = info.getValue() as string;
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${reasonConfig[reason] || ''}`}>{reason}</span>;
      },
    },
    {
      accessorKey: 'ipAddress',
      header: 'Địa chỉ IP',
      cell: (info) => <span className="font-mono text-sm text-gray-500">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'deviceInfo',
      header: 'Thiết bị',
      cell: (info) => <span className="text-sm text-gray-500">{info.getValue() as string}</span>,
    },
    {
      id: 'actions',
      header: 'Xem',
      cell: ({ row }) => (
        <button onClick={(e) => { e.stopPropagation(); setSelected(row.original); }} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors">
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ], []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lịch sử Mật khẩu</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ghi vết toàn bộ lần thay đổi mật khẩu của nhân viên trong hệ thống.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
            <Download className="w-4 h-4" /> Xuất nhật ký
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400" /></div>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên nhân viên hoặc lý do thay đổi..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 sm:text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Nhân viên:</span>
            <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2">
              {users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} isLoading={isLoading} />
      </div>

      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title="Chi tiết lần thay đổi mật khẩu">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"><KeyRound className="w-5 h-5 text-white" /></div>
              <div>
                <p className="text-xs text-gray-500">Lý do thay đổi</p>
                <p className="font-bold text-blue-800 dark:text-blue-300">{selected.changeReason}</p>
              </div>
            </div>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              {[
                { label: 'Nhân viên', value: selected.userName },
                { label: 'Mã nhân viên', value: selected.userId },
                { label: 'Thời điểm thay đổi', value: selected.changedAt },
                { label: 'Địa chỉ IP thực hiện', value: selected.ipAddress },
                { label: 'Thiết bị sử dụng', value: selected.deviceInfo },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">{label}:</span>
                  <span className="font-semibold text-gray-900 dark:text-white font-mono">{value}</span>
                </div>
              ))}
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-700 dark:text-emerald-400">Mật khẩu được lưu trữ dưới dạng hash BCrypt – không thể đọc ngược.</p>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
