import { useMemo, useState } from 'react';
import { Plus, Download, Search, Filter, Eye, Clock, DollarSign, Receipt, AlertCircle, CheckCircle2, ShieldCheck, Printer, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';

interface PosSessionRecord {
  id: string;
  sessionCode: string;
  terminalId: string; // e.g. "TERM-01-MAIN"
  cashierName: string;
  openedTimestamp: string;
  closedTimestamp?: string;
  openingCashFloatUsd: number;
  expectedClosingCashUsd: number;
  actualClosingCashUsd?: number;
  cashDiscrepancyUsd?: number;
  totalTransactionsCount: number;
  totalGrossRevenueUsd: number;
  status: 'IN_PROGRESS' | 'PENDING_AUDIT_VERIFICATION' | 'CLOSED_VERIFIED' | 'DISCREPANCY_FLAGGED';
  supervisorSignoff?: string;
}

const MOCK_POS_SESSIONS: PosSessionRecord[] = [
  { id: '1', sessionCode: 'SESS-20240518-01', terminalId: 'TERM-01-MAIN', cashierName: 'Marcus Aurelius', openedTimestamp: '2024-05-18 07:00:00', openingCashFloatUsd: 500.00, expectedClosingCashUsd: 2150.50, totalTransactionsCount: 42, totalGrossRevenueUsd: 1650.50, status: 'IN_PROGRESS' },
  { id: '2', sessionCode: 'SESS-20240517-04', terminalId: 'TERM-04-EXPRESS', cashierName: 'Sarah Jenkins', openedTimestamp: '2024-05-17 14:30:00', closedTimestamp: '2024-05-17 22:30:00', openingCashFloatUsd: 300.00, expectedClosingCashUsd: 1840.00, actualClosingCashUsd: 1840.00, cashDiscrepancyUsd: 0.00, totalTransactionsCount: 85, totalGrossRevenueUsd: 1540.00, status: 'CLOSED_VERIFIED', supervisorSignoff: 'Johnathan Vance' },
  { id: '3', sessionCode: 'SESS-20240517-02', terminalId: 'TERM-02-KIOSK', cashierName: 'Elena Rostova', openedTimestamp: '2024-05-17 08:00:00', closedTimestamp: '2024-05-17 16:00:00', openingCashFloatUsd: 500.00, expectedClosingCashUsd: 1420.00, actualClosingCashUsd: 1390.00, cashDiscrepancyUsd: -30.00, totalTransactionsCount: 31, totalGrossRevenueUsd: 920.00, status: 'DISCREPANCY_FLAGGED', supervisorSignoff: 'PENDING_INVESTIGATION' },
  { id: '4', sessionCode: 'SESS-20240516-01', terminalId: 'TERM-01-MAIN', cashierName: 'Marcus Aurelius', openedTimestamp: '2024-05-16 07:00:00', closedTimestamp: '2024-05-16 15:30:00', openingCashFloatUsd: 500.00, expectedClosingCashUsd: 3410.00, actualClosingCashUsd: 3410.00, cashDiscrepancyUsd: 0.00, totalTransactionsCount: 112, totalGrossRevenueUsd: 2910.00, status: 'CLOSED_VERIFIED', supervisorSignoff: 'Johnathan Vance' },
];

const statusBadgeStyles = {
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  CLOSED_VERIFIED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  PENDING_AUDIT_VERIFICATION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  DISCREPANCY_FLAGGED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
};

export function PosSessionsPage() {
  const [data] = useState<PosSessionRecord[]>(MOCK_POS_SESSIONS);
  const [search, setSearch] = useState('');
  const [selectedSession, setSelectedSession] = useState<PosSessionRecord | null>(null);

  const filtered = data.filter((item) =>
    item.sessionCode.toLowerCase().includes(search.toLowerCase()) ||
    item.terminalId.toLowerCase().includes(search.toLowerCase()) ||
    item.cashierName.toLowerCase().includes(search.toLowerCase())
  );

  const columns = useMemo<ColumnDef<PosSessionRecord>[]>(
    () => [
      {
        accessorKey: 'sessionCode',
        header: 'Mã phiên',
        cell: (info) => <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'terminalId',
        header: 'Quầy thu ngân & Nhân viên',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.terminalId}</p>
            <p className="text-xs text-gray-500 font-sans">Thu ngân: {row.original.cashierName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'openedTimestamp',
        header: 'Thời gian mở',
        cell: (info) => <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalTransactionsCount',
        header: 'Số hóa đơn',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{info.getValue() as number} gd</span>,
      },
      {
        accessorKey: 'totalGrossRevenueUsd',
        header: 'Tổng doanh thu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">${(info.getValue() as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>,
      },
      {
        accessorKey: 'cashDiscrepancyUsd',
        header: 'Chênh lệch tiền mặt',
        cell: ({ row }) => {
          const disc = row.original.cashDiscrepancyUsd;
          if (disc === undefined) return <span className="text-gray-400 text-xs italic font-sans">Đang hoạt động</span>;
          const isError = disc !== 0;
          return (
            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
              isError ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              {disc === 0 ? 'KHỚP $0.00' : `${disc > 0 ? '+' : ''}$${disc.toFixed(2)}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as keyof typeof statusBadgeStyles;
          const statusMap = {
            IN_PROGRESS: 'Đang hoạt động',
            CLOSED_VERIFIED: 'Đã đóng (Khớp)',
            PENDING_AUDIT_VERIFICATION: 'Chờ đối soát',
            DISCREPANCY_FLAGGED: 'Có chênh lệch',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeStyles[status]}`}>
              {statusMap[status] || status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedSession(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); alert(`Chỉnh sửa phiên: ${row.original.sessionCode}`); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); confirm(`Bạn có chắc muốn xóa phiên ${row.original.sessionCode}?`); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phiên làm việc POS & Quản lý quầy quỹ (POS Sessions)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Giám sát ca thu ngân, kiểm quỹ tiền mặt, đối soát kết sổ và xử lý chênh lệch. Nhấp vào dòng để kiểm tra sổ sách chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất báo cáo ca
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Chốt ca khẩn cấp (Z-Report)
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã phiên, quầy thu ngân hoặc tên nhân viên..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button title="Bộ lọc" className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Bộ lọc
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedSession(row)} />
      </div>

      <Drawer
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession ? `Cashier Shift Dossier: ${selectedSession.sessionCode}` : 'Shift Specification'}
        width="max-w-lg"
      >
        {selectedSession && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedSession.status === 'CLOSED_VERIFIED'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedSession.status === 'IN_PROGRESS'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedSession.status === 'CLOSED_VERIFIED' ? 'bg-emerald-600' : selectedSession.status === 'IN_PROGRESS' ? 'bg-blue-600' : 'bg-red-600'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Gross Shift Revenue</p>
                  <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                    ${selectedSession.totalGrossRevenueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedSession.status === 'CLOSED_VERIFIED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedSession.status === 'IN_PROGRESS' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedSession.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Receipt className="w-4 h-4 text-primary" /> Total Shift Receipts
                </div>
                <p className="text-lg font-mono font-bold text-gray-900 dark:text-white truncate">{selectedSession.totalTransactionsCount} transactions</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Opening Cash Float
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate font-mono">
                  ${selectedSession.openingCashFloatUsd.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Terminal & Cashier Identity</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedSession.terminalId}</h3>
                <span className="inline-block mt-1 text-xs bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-0.5 rounded font-mono font-bold">
                  Cashier Operator: {selectedSession.cashierName}
                </span>
              </div>

              <div className="pt-1 font-mono text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                <div className="flex justify-between items-center font-sans">
                  <span className="text-gray-500">Shift Opened Stamp:</span>
                  <span className="font-mono text-gray-900 dark:text-white font-semibold">{selectedSession.openedTimestamp}</span>
                </div>
                {selectedSession.closedTimestamp && (
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-gray-500">Shift Closed Stamp:</span>
                    <span className="font-mono text-gray-900 dark:text-white font-semibold">{selectedSession.closedTimestamp}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 font-mono text-xs">
                <div className="flex justify-between font-sans">
                  <span className="text-gray-500">Expected Closing Tender:</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">${selectedSession.expectedClosingCashUsd.toFixed(2)}</span>
                </div>
                {selectedSession.actualClosingCashUsd !== undefined && (
                  <div className="flex justify-between font-sans">
                    <span className="text-gray-500">Actual Counted Drawer:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">${selectedSession.actualClosingCashUsd.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {selectedSession.status === 'DISCREPANCY_FLAGGED' && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Cash Drawer Discrepancy Investigation
                  </span>
                  <p className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/10 p-2.5 rounded border border-red-200 dark:border-red-900/30 font-mono">
                    Variance of ${(selectedSession.cashDiscrepancyUsd || 0).toFixed(2)} detected against register sales tape. Manager biometric signoff pending audit override.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedSession.status === 'IN_PROGRESS' ? (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <ShieldCheck className="w-4 h-4" /> Trigger Z-Report Close
                </button>
              ) : selectedSession.status === 'DISCREPANCY_FLAGGED' ? (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Resolve & Signoff Ledger Variance
                </button>
              ) : (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <Printer className="w-4 h-4" /> Re-print Z-Report Summary Tape
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
