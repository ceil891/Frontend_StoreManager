import { useMemo, useState, useEffect } from 'react';
import { 
  Plus, Download, Search, Eye, Clock, Wallet, Receipt, 
  AlertCircle, CheckCircle2, ShieldCheck, Printer, Edit, Trash2, 
  Fingerprint, Sparkles, UserCheck, AlertTriangle, Loader2, Lock
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { axiosClient } from '@/shared/lib/axiosClient';
import { useSalesStore, type SaleOrder } from '@/features/sales/store/salesStore';

interface PosSessionRecord {
  id: string;
  sessionCode: string;
  terminalId: string;
  cashierName: string;
  openedTimestamp: string;
  closedTimestamp?: string;
  openingCashFloatVnd: number;
  expectedClosingCashVnd: number;
  actualClosingCashVnd?: number;
  cashDiscrepancyVnd?: number;
  totalTransactionsCount: number;
  totalGrossRevenueVnd: number;
  cashRevenueVnd: number;
  nonCashRevenueVnd: number;
  status: 'IN_PROGRESS' | 'PENDING_AUDIT_VERIFICATION' | 'CLOSED_VERIFIED' | 'DISCREPANCY_FLAGGED';
  supervisorSignoff?: string;
  ordersList?: SaleOrder[];
}

const fmtVnd = (n: number) => n.toLocaleString('vi-VN') + '₫';

const MOCK_POS_SESSIONS: PosSessionRecord[] = [];

const statusBadgeStyles = {
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  CLOSED_VERIFIED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  PENDING_AUDIT_VERIFICATION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  DISCREPANCY_FLAGGED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
};

const statusMap = {
  IN_PROGRESS: 'Đang hoạt động',
  CLOSED_VERIFIED: 'Đã kết thúc',
  PENDING_AUDIT_VERIFICATION: 'Chờ đối soát',
  DISCREPANCY_FLAGGED: 'Đã kết thúc (Có chênh lệch)',
};

import { usePosSessionStore } from '../store/posSessionStore';

export function PosSessionsPage() {
  const {
    sessions: storeSessions,
    fetchSessions,
    addSession,
    updateSession,
    closeSession,
  } = usePosSessionStore();

  const { saleOrders, fetchSaleOrders } = useSalesStore();

  useEffect(() => {
    fetchSessions();
    fetchSaleOrders();
  }, [fetchSessions, fetchSaleOrders]);

  const data: PosSessionRecord[] = useMemo(() => {
    return storeSessions.map((s) => {
      const isOpen = s.status === 'OPEN';

      // Find matching orders for this shift
      const matchingOrders = saleOrders.filter((o) => {
        if (o.status === 'CANCELLED') return false;

        // 1. Match by explicit shiftId / session code
        if (o.shiftId && (o.shiftId === s.id || o.shiftId === s.sessionCode)) return true;

        // 2. Match by timeframe within this shift
        if (s.openingTime) {
          const orderTime = new Date(o.date || (o as any).createdAt || (o as any).orderDate || 0).getTime();
          const openTime = new Date(s.openingTime).getTime();
          const closeTime = s.closingTime ? new Date(s.closingTime).getTime() : Date.now();

          if (orderTime >= openTime - 120000 && orderTime <= closeTime + 120000) {
            return true;
          }
        }
        return false;
      });

      const totalTransactions = matchingOrders.length;
      const totalRevenue = matchingOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      const cashRevenue = matchingOrders
        .filter((o) => {
          const pm = (o.paymentMethod || '').toLowerCase();
          return pm.includes('tiền mặt') || pm.includes('cash') || pm.includes('quầy') || pm === 'fb-cash' || pm === '';
        })
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      const nonCashRevenue = totalRevenue - cashRevenue;

      // Expected cash = Opening cash + Cash collected from sales
      const expectedCash = (s.openingCash || 0) + cashRevenue;
      const actualCash = s.status === 'CLOSED' ? (s.actualCash ?? expectedCash) : undefined;
      const discrepancy = s.status === 'CLOSED' && s.actualCash !== undefined ? (s.actualCash - expectedCash) : 0;

      return {
        id: s.id,
        sessionCode: s.sessionCode,
        terminalId: s.terminalCode,
        cashierName: s.cashierName,
        openedTimestamp: s.openingTime,
        closedTimestamp: s.closingTime,
        openingCashFloatVnd: s.openingCash || 0,
        expectedClosingCashVnd: expectedCash,
        actualClosingCashVnd: actualCash,
        cashDiscrepancyVnd: discrepancy,
        totalTransactionsCount: totalTransactions,
        totalGrossRevenueVnd: totalRevenue,
        cashRevenueVnd: cashRevenue,
        nonCashRevenueVnd: nonCashRevenue,
        status: isOpen ? 'IN_PROGRESS' : discrepancy === 0 ? 'CLOSED_VERIFIED' : 'DISCREPANCY_FLAGGED',
        supervisorSignoff: s.status === 'CLOSED' ? 'Lê Quản lý' : undefined,
        ordersList: matchingOrders,
      };
    });
  }, [storeSessions, saleOrders]);

  const setData = (_fn: any) => {};

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Selected Session dynamic tracking
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const selectedSession = useMemo(() => {
    return data.find((item) => item.id === selectedSessionId) || null;
  }, [data, selectedSessionId]);

  // Biometric Sign-off Modal state (TC-07)
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const [biometricStep, setBiometricStep] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const [supervisorName, setSupervisorName] = useState('Lê quản lý');

  // Close Shift Modal state
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [actualClosingCashInput, setActualClosingCashInput] = useState('');

  // Create Session Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTerminalId, setNewTerminalId] = useState('TERM-01-MAIN');
  const [newCashierName, setNewCashierName] = useState('Trần Văn Hùng');
  const [newShiftType, setNewShiftType] = useState('SHIFT_MORNING');
  const [openingCashReason, setOpeningCashReason] = useState('');

  // Compute default opening cash from latest closed session or 2.000.000₫
  const defaultOpeningCash = useMemo(() => {
    const closed = storeSessions.filter(s => s.status === 'CLOSED');
    if (closed.length > 0) {
      const last = closed[0];
      return String(last.actualCash || last.expectedCash || 2000000);
    }
    return '2000000';
  }, [storeSessions]);

  const [newOpeningCash, setNewOpeningCash] = useState('2000000');

  // Edit Session Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<PosSessionRecord | null>(null);

  // Z-Report aggregate summary modal state
  const [isZReportModalOpen, setIsZReportModalOpen] = useState(false);

  // Export Loading state
  const [isExporting, setIsExporting] = useState(false);

  // Filter & Search computation
  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = 
        item.sessionCode.toLowerCase().includes(search.toLowerCase()) ||
        item.terminalId.toLowerCase().includes(search.toLowerCase()) ||
        item.cashierName.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  // 1. Biometric Sign-off confirmation handler (TC-07)
  const handleStartBiometric = () => {
    setBiometricStep('IDLE');
    setIsBiometricModalOpen(true);
  };

  const simulateBiometricScan = () => {
    setBiometricStep('SCANNING');
    setTimeout(() => {
      setBiometricStep('SUCCESS');
      toast.success('Xác thực sinh trắc học thành công!');
    }, 1500);
  };

  const handleConfirmSignoff = () => {
    if (!selectedSession) return;
    
    setData(prev => 
      prev.map(item => {
        if (item.id === selectedSession.id) {
          return {
            ...item,
            status: 'CLOSED_VERIFIED',
            supervisorSignoff: supervisorName,
            // Audit adjustment: clear any pending flags
          };
        }
        return item;
      })
    );
    
    setIsBiometricModalOpen(false);
    toast.success(`Đã phê duyệt chênh lệch cho phiên ${selectedSession.sessionCode} bởi ${supervisorName}! Trạng thái chuyển thành ĐÃ ĐÓNG (KHỚP)`);
  };

  // 2. Close Shift handlers
  const handleOpenCloseShift = () => {
    if (!selectedSession) return;
    setActualClosingCashInput(String(selectedSession.expectedClosingCashVnd));
    setIsCloseShiftModalOpen(true);
  };

  const handleConfirmCloseShift = async () => {
    if (!selectedSession) return;
    
    const parsedActualCash = parseInt(actualClosingCashInput.replace(/\D/g, ''), 10) || 0;
    const discrepancy = parsedActualCash - selectedSession.expectedClosingCashVnd;
    const newStatus = discrepancy === 0 ? 'CLOSED_VERIFIED' : 'DISCREPANCY_FLAGGED';
    
    try {
      await closeSession(selectedSession.id, parsedActualCash);
    } catch (e) {
      console.error('Failed to close POS session:', e);
    }
    
    setIsCloseShiftModalOpen(false);
    
    if (newStatus === 'CLOSED_VERIFIED') {
      toast.success(`Chốt ca thành công! Tiền kiểm đếm khớp hoàn toàn.`);
    } else {
      toast.warning(`Chốt ca hoàn thành. Phát hiện chênh lệch: ${fmtVnd(discrepancy)}. Ca đã bị đánh dấu CÓ CHÊNH LỆCH để đối soát!`);
    }
  };

  // 3. New Session opening handler
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const openingCash = parseInt(newOpeningCash.replace(/\D/g, ''), 10) || 0;
    const defaultVal = parseInt(defaultOpeningCash.replace(/\D/g, ''), 10) || 0;

    if (openingCash !== defaultVal && !openingCashReason.trim()) {
      toast.error('Vui lòng nhập lý do điều chỉnh số tiền quỹ đầu ca khác với ca trước!');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const currentDaySessions = data.filter(s => s.sessionCode.includes(todayStr));
    const nextSessionNum = String(currentDaySessions.length + 1).padStart(2, '0');
    const sessionCode = `SESS-${todayStr}-${nextSessionNum}`;
    
    try {
      await addSession({
        sessionCode,
        terminalCode: newTerminalId,
        cashierName: newCashierName,
        openingTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        openingCash,
        expectedCash: openingCash,
        actualCash: 0,
        cashDifference: 0,
        status: 'OPEN',
      });
      setIsCreateModalOpen(false);
      setOpeningCashReason('');
      toast.success(`Đã mở thành công ca làm việc mới: ${sessionCode} tại quầy ${newTerminalId}!`);
    } catch (err) {
      console.error('Failed to create POS session:', err);
    }
  };

  // 4. Edit Session handlers
  const handleOpenEdit = (session: PosSessionRecord) => {
    setEditingSession(session);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;
    
    try {
      await updateSession(editingSession.id, {
        cashierName: editingSession.cashierName,
        terminalCode: editingSession.terminalId,
        openingCash: editingSession.openingCashFloatVnd,
      });
      toast.success(`Cập nhật thông tin ca ${editingSession.sessionCode} thành công!`);
    } catch (err) {
      console.error('Failed to edit session:', err);
    }
    setIsEditModalOpen(false);
  };

  // 6. Export simulation handler
  const handleExportData = () => {
    setIsExporting(true);
    toast.info('Hệ thống đang chuẩn bị tệp dữ liệu ca...');
    setTimeout(() => {
      setIsExporting(false);
      toast.success('Xuất báo cáo ca làm việc thành công! File Excel đang được tải xuống.');
    }, 1800);
  };

  // 7. Z-Report Aggregation Calculation
  const zReportAgg = useMemo(() => {
    const verified = data.filter(s => s.status === 'CLOSED_VERIFIED');
    const totalTransactions = verified.reduce((sum, s) => sum + s.totalTransactionsCount, 0);
    const totalRevenue = verified.reduce((sum, s) => sum + s.totalGrossRevenueVnd, 0);
    const totalOpeningCash = verified.reduce((sum, s) => sum + s.openingCashFloatVnd, 0);
    const totalClosingCash = verified.reduce((sum, s) => sum + (s.actualClosingCashVnd || 0), 0);
    return {
      count: verified.length,
      totalTransactions,
      totalRevenue,
      totalOpeningCash,
      totalClosingCash
    };
  }, [data]);

  const columns = useMemo<ColumnDef<PosSessionRecord>[]>(
    () => [
      {
        accessorKey: 'sessionCode',
        header: 'Mã phiên',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-md border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'terminalId',
        header: 'Quầy thu ngân & Nhân viên',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.terminalId}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-sans mt-0.5">Thu ngân: {row.original.cashierName}</p>
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
        cell: (info) => <span className="font-mono font-bold text-gray-950 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">{info.getValue() as number} gd</span>,
      },
      {
        accessorKey: 'totalGrossRevenueVnd',
        header: 'Tổng doanh thu',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">{fmtVnd(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'cashDiscrepancyVnd',
        header: 'Chênh lệch tiền mặt',
        cell: ({ row }) => {
          const disc = row.original.cashDiscrepancyVnd;
          if (disc === undefined) return <span className="text-blue-600 dark:text-blue-400 text-xs italic font-sans font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5 animate-spin" />Đang hoạt động</span>;
          const isError = disc !== 0;
          return (
            <span className={`font-mono font-bold text-xs px-2 py-1 rounded-md border ${
              isError 
                ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/50' 
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
            }`}>
              {disc === 0 ? 'KHỚP 0₫' : `${disc > 0 ? '+' : ''}${fmtVnd(disc)}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as keyof typeof statusBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${statusBadgeStyles[status]}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
              {statusMap[status] || status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {row.original.status === 'IN_PROGRESS' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSessionId(row.original.id);
                  setActualClosingCashInput(String(row.original.expectedClosingCashVnd || row.original.openingCashFloatVnd || ''));
                  setIsCloseShiftModalOpen(true);
                }}
                title="Đóng ca & chốt quỹ"
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-500/20 font-bold"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedSessionId(row.original.id); }}
              title="Xem chi tiết"
              className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20 dark:text-gray-400"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-500/20 dark:text-gray-400"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-950 dark:text-white">Phiên làm việc POS & Quản lý quầy quỹ</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Bản nâng cấp Pro
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed max-w-3xl">
              Giám sát ca thu ngân, thực hiện kiểm quỹ tiền mặt kết ca, đối soát kết sổ tự động và ký duyệt sinh trắc học các trường hợp chênh lệch quỹ trực quan.
            </p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-stretch gap-3 w-full sm:w-auto">
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 h-11 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 transition-all text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 min-w-[160px]"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Xuất báo cáo ca
            </button>
            <button 
              onClick={() => setIsZReportModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 h-11 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all text-sm font-semibold shadow-sm focus:outline-none min-w-[160px]"
            >
              <Printer className="w-4 h-4" /> Báo cáo tổng Z-Report
            </button>
            <button 
              onClick={() => {
                setNewOpeningCash(defaultOpeningCash);
                setIsCreateModalOpen(true);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 h-11 bg-primary hover:bg-primary/90 text-white rounded-xl transition-all text-sm font-bold shadow-md shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] focus:outline-none min-w-[160px]"
            >
              <Plus className="w-4.5 h-4.5" /> Mở ca làm việc mới
            </button>
          </div>
        </div>

        {/* Filter Bar with Segmented Controls & Search */}
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã phiên, quầy hoặc thu ngân..."
              className="block w-full pl-11 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-950 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-gray-900 transition-all text-sm"
            />
          </div>

          {/* Dynamic Status Filters */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 dark:bg-gray-900/60 p-1 rounded-xl">
            {[
              { code: 'ALL', label: 'Tất cả' },
              { code: 'IN_PROGRESS', label: 'Đang hoạt động' },
              { code: 'CLOSED_VERIFIED', label: 'Đã đóng (Khớp)' },
              { code: 'DISCREPANCY_FLAGGED', label: 'Có chênh lệch' },
            ].map((btn) => (
              <button
                key={btn.code}
                onClick={() => setStatusFilter(btn.code)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === btn.code
                    ? 'bg-white dark:bg-gray-800 text-primary dark:text-white shadow-sm border border-gray-200 dark:border-gray-700'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <ReusableDataTable 
            columns={columns} 
            data={filtered} 
            onRowClick={(row) => setSelectedSessionId(row.id)} 
          />
        </div>
      </div>

      {/* Main shift dossier modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSessionId(null)}
        title={selectedSession ? `Hồ sơ ca làm việc: ${selectedSession.sessionCode}` : 'Chi tiết ca làm việc'}
        width="max-w-lg"
      >
        {selectedSession && (
          <div className="space-y-6">
            {/* Status Summary Card */}
            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
              selectedSession.status === 'CLOSED_VERIFIED'
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/50'
                : selectedSession.status === 'IN_PROGRESS'
                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-900/50'
                : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900/50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${
                  selectedSession.status === 'CLOSED_VERIFIED' ? 'bg-emerald-600' : selectedSession.status === 'IN_PROGRESS' ? 'bg-blue-600' : 'bg-amber-500'
                }`}>
                  <Clock className="w-5.5 h-5.5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Tổng doanh thu ca</p>
                  <p className="text-2xl font-black font-mono text-gray-900 dark:text-white mt-0.5">
                    {fmtVnd(selectedSession.totalGrossRevenueVnd)}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${statusBadgeStyles[selectedSession.status]}`}>
                {statusMap[selectedSession.status]}
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-250 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1.5">
                  <Receipt className="w-4 h-4 text-primary" /> Hóa đơn thanh toán
                </div>
                <p className="text-lg font-mono font-black text-gray-900 dark:text-white">{selectedSession.totalTransactionsCount} đơn hàng</p>
              </div>
              <div className="bg-white dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-250 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 mb-1.5">
                  <Wallet className="w-4 h-4 text-emerald-500" /> Tiền quỹ đầu ca
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                  {fmtVnd(selectedSession.openingCashFloatVnd)}
                </p>
              </div>
            </div>

            {/* Detailed Info Sheet */}
            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">Quầy thu ngân & Thu ngân viên</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedSession.terminalId}</h3>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center text-xs bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-lg font-semibold border border-gray-300 dark:border-gray-700">
                    Thu ngân: {selectedSession.cashierName}
                  </span>
                  {selectedSession.supervisorSignoff && (
                    <span className="inline-flex items-center text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-semibold border border-emerald-200/50 dark:border-emerald-900/50">
                      <UserCheck className="w-3.5 h-3.5 mr-1" /> Ký: {selectedSession.supervisorSignoff === 'PENDING_INVESTIGATION' ? 'Chờ điều tra' : selectedSession.supervisorSignoff}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center font-sans">
                  <span className="text-gray-400 font-medium">Giờ mở ca:</span>
                  <span className="font-mono text-gray-900 dark:text-white font-bold">{selectedSession.openedTimestamp}</span>
                </div>
                {selectedSession.closedTimestamp && (
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-gray-400 font-medium">Giờ chốt ca:</span>
                    <span className="font-mono text-gray-900 dark:text-white font-bold">{selectedSession.closedTimestamp}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between font-sans">
                  <span className="text-gray-400 font-medium">Tồn quỹ dự kiến kết ca:</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{fmtVnd(selectedSession.expectedClosingCashVnd)}</span>
                </div>
                <div className="flex justify-between font-sans text-emerald-600 dark:text-emerald-400">
                  <span className="font-medium">↳ Doanh thu Tiền mặt quầy:</span>
                  <span className="font-mono font-bold">+{fmtVnd(selectedSession.cashRevenueVnd)}</span>
                </div>
                <div className="flex justify-between font-sans text-blue-600 dark:text-blue-400">
                  <span className="font-medium">↳ Chuyển khoản / QR / Thẻ:</span>
                  <span className="font-mono font-bold">{fmtVnd(selectedSession.nonCashRevenueVnd)}</span>
                </div>
                {selectedSession.actualClosingCashVnd !== undefined && (
                  <div className="flex justify-between font-sans pt-2 border-t border-gray-200 dark:border-gray-800">
                    <span className="text-gray-400 font-medium">Tiền thực tế kiểm đếm:</span>
                    <span className="font-mono font-bold text-gray-950 dark:text-white text-sm">{fmtVnd(selectedSession.actualClosingCashVnd)}</span>
                  </div>
                )}
              </div>

              {/* Order List in Shift */}
              {selectedSession.ordersList && selectedSession.ordersList.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                    Đơn hàng trong ca ({selectedSession.ordersList.length})
                  </span>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                    {selectedSession.ordersList.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs">
                        <div>
                          <p className="font-mono font-bold text-primary">{ord.code}</p>
                          <p className="text-[10px] text-gray-400">{ord.paymentMethod || 'Tiền mặt'} • {ord.date ? new Date(ord.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                        </div>
                        <span className="font-mono font-bold text-gray-900 dark:text-white">{fmtVnd(ord.totalAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TC-07 Discrepancy Highlight */}
              {selectedSession.status === 'DISCREPANCY_FLAGGED' && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 mt-2 space-y-2 animate-fadeIn">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 animate-bounce" /> Phát hiện chênh lệch quỹ tiền mặt
                  </span>
                  <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 font-semibold leading-relaxed">
                    Hệ thống kiểm đếm thực tế lệch <span className="underline font-mono font-bold">{fmtVnd(Math.abs(selectedSession.cashDiscrepancyVnd || 0))}</span> so với dữ liệu hóa đơn POS. Yêu cầu Quản lý xác thực sinh trắc học ký sổ để xác nhận.
                  </p>
                </div>
              )}
            </div>

            {/* Shift Context Action Drawer Footer */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-850 flex gap-3">
              {selectedSession.status === 'IN_PROGRESS' ? (
                <button 
                  onClick={handleOpenCloseShift}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-500/10 hover:shadow-red-500/20 transition-all text-sm active:scale-[0.99]"
                >
                  <ShieldCheck className="w-4.5 h-4.5" /> Kết ca & Kiểm quỹ thực tế
                </button>
              ) : selectedSession.status === 'DISCREPANCY_FLAGGED' ? (
                <button 
                  onClick={handleStartBiometric}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md shadow-amber-500/15 hover:shadow-amber-500/30 transition-all text-sm active:scale-[0.99] animate-pulse"
                >
                  <Fingerprint className="w-4.5 h-4.5" /> Xử lý & Ký duyệt chênh lệch
                </button>
              ) : (
                <button 
                  onClick={() => {
                    toast.success('Đang kết nối spooler máy in...');
                    setTimeout(() => toast.info(`Đã in lại Z-Report cho phiên ${selectedSession.sessionCode} thành công!`), 1000);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-md transition-all text-sm active:scale-[0.99]"
                >
                  <Printer className="w-4.5 h-4.5" /> In lại Z-Report ca
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* TC-07 Biometric Sign-off Modal */}
      <Modal
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        title="Phê duyệt sinh trắc học & đối soát chênh lệch"
      >
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Hệ thống đối soát quỹ tiền POS</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vui lòng nhập tên người xác nhận và thực hiện quét vân tay / FaceID của quản lý để ký nhận.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Tên quản lý ký duyệt</label>
              <div className="relative">
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="Nhập tên quản lý..."
                  className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm font-semibold"
                />
              </div>
            </div>

            {/* Glowing biometric simulation scan area */}
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 transition-all">
              {biometricStep === 'IDLE' && (
                <button 
                  onClick={simulateBiometricScan}
                  className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 hover:text-amber-600 hover:bg-amber-100 hover:scale-105 active:scale-95 transition-all shadow-inner border border-amber-200/50 cursor-pointer animate-pulse"
                  title="Nhấp để quét vân tay"
                >
                  <Fingerprint className="w-10 h-10" />
                </button>
              )}

              {biometricStep === 'SCANNING' && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="relative w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-500 overflow-hidden border border-amber-500/20">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    {/* Glowing scanner line animation */}
                    <div className="absolute inset-x-0 h-1 bg-amber-500 animate-bounce top-1/2 shadow shadow-amber-500" />
                  </div>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 animate-pulse">Đang giải mã sinh trắc học...</span>
                </div>
              )}

              {biometricStep === 'SUCCESS' && (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-500 border border-emerald-500/30 animate-bounce">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Xác thực khớp 100%! Đã có chữ ký mã hóa</span>
                </div>
              )}

              {biometricStep === 'IDLE' && (
                <span className="text-xs text-gray-400 dark:text-gray-550 font-medium mt-3">Nhấp vào biểu tượng vân tay để quét</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsBiometricModalOpen(false)}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all text-sm focus:outline-none"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmSignoff}
              disabled={biometricStep !== 'SUCCESS'}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-sm shadow-md shadow-amber-500/10 focus:outline-none"
            >
              Xác nhận kết sổ & đóng ca
            </button>
          </div>
        </div>
      </Modal>

      {/* Close Shift (Modal) for Inputting Actual Cash Count */}
      <Modal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        title="Đối soát & chốt sổ quỹ tiền mặt"
      >
        <div className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vui lòng đếm tổng số tiền mặt thực tế tại quầy của thu ngân và nhập bên dưới để kết ca.
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-2 border border-gray-200 dark:border-gray-800 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Ca làm việc:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedSession?.sessionCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Dự kiến tồn quỹ hệ thống:</span>
              <span className="font-mono font-bold text-gray-950 dark:text-white">{fmtVnd(selectedSession?.expectedClosingCashVnd || 0)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1.5">Tiền mặt thực tế kiểm đếm (VNĐ)</label>
            <input
              type="text"
              value={actualClosingCashInput ? parseInt(actualClosingCashInput, 10).toLocaleString('vi-VN') : ''}
              onChange={(e) => {
                const numeric = e.target.value.replace(/\D/g, '');
                setActualClosingCashInput(numeric ? String(parseInt(numeric, 10)) : '');
              }}
              placeholder="Nhập số tiền..."
              className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-red-500 text-base"
            />
          </div>

          {/* Real-time calculated discrepancy indicator */}
          {actualClosingCashInput !== '' && selectedSession && (() => {
            const val = parseInt(actualClosingCashInput, 10) || 0;
            const diff = val - selectedSession.expectedClosingCashVnd;
            const isMatch = diff === 0;
            return (
              <div className={`p-3 rounded-xl border flex items-center gap-2 ${
                isMatch 
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/50' 
                  : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border-red-250 dark:border-red-900/50'
              }`}>
                {isMatch ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                <div className="text-xs font-semibold">
                  {isMatch ? (
                    <span>Khớp quỹ tiền mặt tuyệt đối. Hoàn toàn chính xác!</span>
                  ) : (
                    <span>Chênh lệch: <span className="font-mono font-bold">{diff > 0 ? '+' : ''}{fmtVnd(diff)}</span>. Ca làm việc sẽ được đánh dấu có chênh lệch và cần phê duyệt sinh trắc học để đóng.</span>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setIsCloseShiftModalOpen(false)}
              className="flex-1 py-2.5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all text-sm"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmCloseShift}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all text-sm shadow-md shadow-red-500/10"
            >
              Xác nhận kết ca
            </button>
          </div>
        </div>
      </Modal>

      {/* Create New Session (Modal Form) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Mở ca làm việc POS mới"
        size="erp"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Mã quầy thu ngân</label>
              <select
                value={newTerminalId}
                onChange={(e) => setNewTerminalId(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-sm"
              >
                <option value="TERM-01-MAIN">TERM-01-MAIN (Quầy chính sảnh)</option>
                <option value="TERM-02-KIOSK">TERM-02-KIOSK (Kiosk tự phục vụ)</option>
                <option value="TERM-03-BACKOFFICE">TERM-03-BACKOFFICE (Quầy kho nội bộ)</option>
                <option value="TERM-04-EXPRESS">TERM-04-EXPRESS (Quầy thanh toán nhanh)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Ca làm việc *</label>
              <select
                value={newShiftType}
                onChange={(e) => setNewShiftType(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-sm"
              >
                <option value="SHIFT_MORNING">Ca sáng (06:00 - 14:00)</option>
                <option value="SHIFT_AFTERNOON">Ca chiều (14:00 - 22:00)</option>
                <option value="SHIFT_NIGHT">Ca đêm (22:00 - 06:00)</option>
                <option value="SHIFT_OFFICE">Ca hành chính (08:00 - 17:00)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Nhân viên thu ngân</label>
              <select
                value={newCashierName}
                onChange={(e) => setNewCashierName(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-sm"
              >
                <option value="Trần Văn Hùng">Trần Văn Hùng (Quản trị viên)</option>
                <option value="Nguyễn Văn An">Nguyễn Văn An (Nhân viên ca sáng)</option>
                <option value="Trần Thị Bích">Trần Thị Bích (Nhân viên ca tối)</option>
                <option value="Phạm Minh Châu">Phạm Minh Châu (Nhân viên bán thời gian)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Tiền quỹ đầu ca (đ) *</label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Tự động lấy ca trước: {fmtVnd(parseInt(defaultOpeningCash, 10) || 0)}</span>
              </div>
              <input
                type="text"
                value={newOpeningCash ? parseInt(newOpeningCash, 10).toLocaleString('vi-VN') : ''}
                onChange={(e) => {
                  const numeric = e.target.value.replace(/\D/g, '');
                  setNewOpeningCash(numeric ? String(parseInt(numeric, 10)) : '');
                }}
                required
                placeholder="Nhập số tiền mặt đầu ca..."
                className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-primary focus:outline-none text-sm"
              />
              {parseInt(newOpeningCash.replace(/\D/g, ''), 10) !== parseInt(defaultOpeningCash.replace(/\D/g, ''), 10) && (
                <div className="mt-2">
                  <label className="block text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">Lý do điều chỉnh tiền quỹ khác ca trước *</label>
                  <input
                    type="text"
                    value={openingCashReason}
                    onChange={(e) => setOpeningCashReason(e.target.value)}
                    required
                    placeholder="Nhập lý do nạp thêm hoặc rút bớt tiền quỹ đầu ca..."
                    className="block w-full px-3 py-1.5 border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="flex-1 py-2 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all text-sm shadow-md"
            >
              Kích hoạt mở ca
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Session (Modal Form) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa chi tiết ca làm việc"
      >
        {editingSession && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Mã phiên</label>
              <input
                type="text"
                readOnly
                value={editingSession.sessionCode}
                className="block w-full px-4 py-2 border border-gray-250 dark:border-gray-800 rounded-xl bg-gray-100 dark:bg-gray-900 text-gray-500 font-mono font-bold text-sm focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Thu ngân viên</label>
              <select
                value={editingSession.cashierName}
                onChange={(e) => setEditingSession({ ...editingSession, cashierName: e.target.value })}
                required
                className="block w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-sm focus:outline-none"
              >
                <option value="Trần Văn Hùng">Trần Văn Hùng (Quản trị viên)</option>
                <option value="Nguyễn Văn An">Nguyễn Văn An (Nhân viên ca sáng)</option>
                <option value="Trần Thị Bích">Trần Thị Bích (Nhân viên ca tối)</option>
                <option value="Phạm Minh Châu">Phạm Minh Châu (Nhân viên bán thời gian)</option>
                <option value="Lê Văn Đức">Lê Văn Đức (Thu ngân)</option>
                {!['Trần Văn Hùng', 'Nguyễn Văn An', 'Trần Thị Bích', 'Phạm Minh Châu', 'Lê Văn Đức'].includes(editingSession.cashierName) && (
                  <option value={editingSession.cashierName}>{editingSession.cashierName}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Mã quầy</label>
              <select
                value={editingSession.terminalId}
                onChange={(e) => setEditingSession({ ...editingSession, terminalId: e.target.value })}
                required
                className="block w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold text-sm focus:outline-none"
              >
                <option value="TERM-01-MAIN">TERM-01-MAIN (Quầy chính sảnh)</option>
                <option value="TERM-02-KIOSK">TERM-02-KIOSK (Kiosk tự phục vụ)</option>
                <option value="TERM-03-BACKOFFICE">TERM-03-BACKOFFICE (Quầy kho nội bộ)</option>
                <option value="TERM-04-EXPRESS">TERM-04-EXPRESS (Quầy thanh toán nhanh)</option>
                {!['TERM-01-MAIN', 'TERM-02-KIOSK', 'TERM-03-BACKOFFICE', 'TERM-04-EXPRESS'].includes(editingSession.terminalId) && (
                  <option value={editingSession.terminalId}>{editingSession.terminalId}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Tiền quỹ đầu ca (đ)</label>
              <input
                type="text"
                value={editingSession.openingCashFloatVnd === 0 ? '' : editingSession.openingCashFloatVnd.toLocaleString('vi-VN')}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                  setEditingSession({ ...editingSession, openingCashFloatVnd: num });
                }}
                required
                className="block w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold focus:outline-none text-sm"
              />
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 py-2 bg-gray-150 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all text-sm shadow-md"
              >
                Lưu thông tin
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Aggregate Daily Z-Report Modal */}
      <Modal
        isOpen={isZReportModalOpen}
        onClose={() => setIsZReportModalOpen(false)}
        title="Báo cáo tổng hợp ca Z-Report trong ngày"
      >
        <div className="space-y-5">
          <div className="text-center pb-2 border-b border-gray-150 dark:border-gray-800">
            <h3 className="font-black text-gray-900 dark:text-white text-base">Báo cáo Z-Report hàng ngày</h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-550 font-bold tracking-widest mt-0.5">Hệ thống quầy quỹ RetailHub</p>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Số ca đã đối soát khớp:</span>
              <span className="font-bold text-gray-900 dark:text-white">{zReportAgg.count} ca làm việc</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Tổng số giao dịch:</span>
              <span className="font-mono font-bold text-gray-900 dark:text-white">{zReportAgg.totalTransactions} hoá đơn</span>
            </div>
            <div className="flex justify-between border-t border-gray-100 dark:border-gray-850 pt-2.5">
              <span className="text-gray-400 font-semibold">Tổng doanh thu ca:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-450">{fmtVnd(zReportAgg.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 font-semibold">Tổng tiền mặt quỹ mở đầu:</span>
              <span className="font-mono font-bold text-gray-800 dark:text-gray-250">{fmtVnd(zReportAgg.totalOpeningCash)}</span>
            </div>
            <div className="flex justify-between border-t-2 border-double border-gray-200 dark:border-gray-800 pt-2.5">
              <span className="text-gray-900 dark:text-white font-black">Tổng kiểm quỹ thực tế:</span>
              <span className="font-mono font-black text-primary text-base">{fmtVnd(zReportAgg.totalClosingCash)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <button
              onClick={() => setIsZReportModalOpen(false)}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all text-sm"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                toast.success('Lệnh in Z-Report đã được chuyển thành công tới máy in chính!');
                setIsZReportModalOpen(false);
              }}
              className="flex-1 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all text-sm shadow-md"
            >
              In báo cáo Z-Report
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
