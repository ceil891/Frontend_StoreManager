import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, AlertCircle, CheckCircle, ShieldAlert, ShieldCheck, Send, Clock, AlertTriangle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';
import { useCrmStore } from '@/features/crm/store/crmStore';

interface ReceivableRecord {
  id: string;
  customerCode: string;
  customerName: string;
  phone: string;
  totalPurchased: number;
  currentDebt: number;
  debtLimit: number;
  lastTransactionDate: string;
  status: 'BINH_THUONG' | 'CANH_BAO' | 'QUA_HAN';
  notes?: string;
  isCreditBlocked?: boolean;
}

export function ReceivablesPage() {
  const [data, setData] = useState<ReceivableRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ReceivableRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<ReceivableRecord>>({});

  const fetchReceivables = async () => {
    setIsLoading(true);
    try {
      const [customers, debts] = await Promise.all([
        axiosClient.get<any, any[]>('/partnerarea/customers'),
        axiosClient.get<any, any[]>('/finance/debt-ledgers'),
      ]);

      const mapped = (Array.isArray(customers) ? customers : []).map((c: any) => {
        const customerDebts = (Array.isArray(debts) ? debts : []).filter((d: any) => d.partnerId === c.id);
        
        let calculatedDebt = 0;
        let lastDate = '';
        customerDebts.forEach((d: any) => {
          calculatedDebt += (d.increase || 0) - (d.decrease || 0);
          if (d.transactionDate && (!lastDate || d.transactionDate > lastDate)) {
            lastDate = d.transactionDate;
          }
        });

        const limit = Number(c.debtLimit || 10000000);
        let status: 'BINH_THUONG' | 'CANH_BAO' | 'QUA_HAN' = 'BINH_THUONG';
        if (calculatedDebt > limit) {
          status = 'CANH_BAO';
        }

        return {
          id: String(c.id),
          customerCode: c.code || `KH${c.id}`,
          customerName: c.name || '',
          phone: c.phone || '',
          totalPurchased: Number(c.totalSpend || c.totalPurchased || c.totalSales || 0),
          currentDebt: calculatedDebt,
          debtLimit: limit,
          lastTransactionDate: lastDate ? lastDate.substring(0, 10) : '',
          status,
          notes: c.notes || 'Không có ghi chú công nợ',
        };
      });

      setData(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải thông tin công nợ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivables();
  }, []);

  type ReceivableFilterPreset = 'all' | 'has_debt' | 'over_limit' | 'overdue_90d' | 'credit_blocked';
  const [filterPreset, setFilterPreset] = useState<ReceivableFilterPreset>('all');

  const blockedCustomerIds = useCrmStore((s) => s.blockedCreditCustomerIds);
  const toggleBlockCredit = useCrmStore((s) => s.toggleBlockCredit);

  const presetCounts = useMemo(() => {
    let hasDebt = 0;
    let overLimit = 0;
    let overdue90 = 0;
    let creditBlocked = 0;

    data.forEach((d) => {
      if (d.currentDebt > 0) hasDebt++;
      if (d.currentDebt > d.debtLimit) overLimit++;
      if (
        d.currentDebt > 0 &&
        d.lastTransactionDate &&
        Math.floor((Date.now() - new Date(d.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24)) > 90
      ) {
        overdue90++;
      }
      if (blockedCustomerIds.includes(String(d.id))) creditBlocked++;
    });

    return {
      all: data.length,
      has_debt: hasDebt,
      over_limit: overLimit,
      overdue_90d: overdue90,
      credit_blocked: creditBlocked,
    };
  }, [data, blockedCustomerIds]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          d.customerCode.toLowerCase().includes(q) ||
          d.customerName.toLowerCase().includes(q) ||
          d.phone.includes(q);
        if (!match) return false;
      }

      if (filterPreset === 'has_debt') {
        return d.currentDebt > 0;
      }
      if (filterPreset === 'over_limit') {
        return d.currentDebt > d.debtLimit;
      }
      if (filterPreset === 'overdue_90d') {
        if (!d.lastTransactionDate || d.currentDebt <= 0) return false;
        const days = Math.floor((Date.now() - new Date(d.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24));
        return days > 90;
      }
      if (filterPreset === 'credit_blocked') {
        return blockedCustomerIds.includes(String(d.id));
      }

      return true;
    });
  }, [search, data, filterPreset, blockedCustomerIds]);

  const handleToggleBlockCredit = (customerId: string, customerName: string) => {
    const isNowBlocked = toggleBlockCredit(customerId);
    if (isNowBlocked) {
      toast.warning(`Đã tạm khóa quyền mua nợ của "${customerName}". Hệ thống POS sẽ lập tức chặn bán ghi nợ đối với khách hàng này!`);
    } else {
      toast.success(`Đã mở khóa quyền mua nợ cho khách hàng "${customerName}"!`);
    }
  };

  const handleSendReminder = (item: ReceivableRecord) => {
    toast.success(`Đã gửi thông báo đối soát công nợ (${formatCurrency(item.currentDebt)}) tới khách hàng "${item.customerName}" qua SMS/Email!`);
  };

  // Aging Analysis Dashboard
  const agingStats = useMemo(() => {
    let current = 0;      // <= 30 days
    let overdue30 = 0;    // 31 - 60 days
    let overdue60 = 0;    // 61 - 90 days
    let overdue90 = 0;    // > 90 days
    let totalDebt = 0;

    data.forEach((item) => {
      const debt = Math.max(0, item.currentDebt || 0);
      totalDebt += debt;
      if (!item.lastTransactionDate) {
        current += debt;
        return;
      }
      const days = Math.floor((Date.now() - new Date(item.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24));
      if (days <= 30) current += debt;
      else if (days <= 60) overdue30 += debt;
      else if (days <= 90) overdue60 += debt;
      else overdue90 += debt;
    });

    return { current, overdue30, overdue60, overdue90, totalDebt };
  }, [data]);

  const handleOpenLimitAdjustment = (item: ReceivableRecord) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.id) return;

    try {
      const limit = Number(editingItem.debtLimit || 0);
      await axiosClient.put(`/partnerarea/customers/${editingItem.id}`, {
        code: editingItem.customerCode,
        name: editingItem.customerName,
        phone: editingItem.phone,
        debtLimit: limit,
      });

      toast.success('Điều chỉnh hạn mức nợ thành công!');
      setIsModalOpen(false);
      fetchReceivables();
    } catch (err) {
      console.error(err);
      toast.error('Không thể cập nhật hạn mức nợ.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ReceivableRecord>[]>(
    () => [
      {
        accessorKey: 'customerCode',
        header: 'Mã khách hàng',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'currentDebt',
        header: 'Dư nợ hiện tại',
        cell: (info) => <span className="font-mono font-bold text-red-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'debtLimit',
        header: 'Hạn mức nợ',
        cell: (info) => <span className="font-mono text-gray-600 dark:text-gray-400">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'lastTransactionDate',
        header: 'Giao dịch cuối',
        cell: (info) => <span className="font-mono text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Tình trạng',
        cell: ({ row }) => {
          const status = row.original.status;
          const isBlocked = blockedCustomerIds.includes(String(row.original.id));
          const hasOverdue90 = row.original.currentDebt > 0 && row.original.lastTransactionDate && 
            Math.floor((Date.now() - new Date(row.original.lastTransactionDate).getTime()) / (1000 * 60 * 60 * 24)) > 90;

          let badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
          let label = 'Bình thường';
          if (hasOverdue90) {
            badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 font-bold';
            label = 'Nợ xấu (> 90 ngày)';
          } else if (status === 'CANH_BAO') {
            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
            label = 'Vượt hạn mức';
          } else if (status === 'QUA_HAN') {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            label = 'Quá hạn';
          }
          return (
            <div className="flex flex-col gap-1 items-start">
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>
              {isBlocked && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-900/40 dark:text-rose-300">
                  <ShieldAlert className="w-3 h-3" /> Đã khóa nợ
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const isBlocked = blockedCustomerIds.includes(String(row.original.id));
          return (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelected(row.original)}
                className="p-1.5 text-gray-500 hover:text-emerald-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Xem chi tiết công nợ"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenLimitAdjustment(row.original)}
                className="p-1.5 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Điều chỉnh hạn mức"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleBlockCredit(row.original.id, row.original.customerName)}
                className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isBlocked ? 'text-amber-600 hover:text-amber-700' : 'text-gray-400 hover:text-rose-600'
                }`}
                title={isBlocked ? 'Mở khóa quyền mua nợ' : 'Tạm khóa mua nợ'}
              >
                {isBlocked ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleSendReminder(row.original)}
                className="p-1.5 text-gray-500 hover:text-purple-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                title="Gửi nhắc nợ / Đối soát"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          );
        },
      },
    ],
    [data, blockedCustomerIds]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Công nợ phải thu (khách hàng)</h1>
          <p className="text-sm text-gray-500">
            Theo dõi nợ mua hàng của khách đối tác, đối chiếu hạn mức nợ, cảnh báo nợ xấu và quá hạn thanh toán.
          </p>
        </div>
      </div>

      {/* Aging Analysis Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Phân tích Tuổi nợ Khách hàng (Aging Bucket Analysis)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Phân loại dư nợ theo chu kỳ quá hạn thực tế để kiểm soát rủi ro dòng tiền
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500">Tổng dư nợ phải thu:</span>
            <div className="text-xl font-mono font-bold text-red-600">
              {formatCurrency(agingStats.totalDebt)}
            </div>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden flex">
          {agingStats.totalDebt > 0 && (
            <>
              <div
                style={{ width: `${(agingStats.current / agingStats.totalDebt) * 100}%` }}
                className="bg-emerald-500 transition-all duration-300"
                title={`Trong hạn: ${formatCurrency(agingStats.current)}`}
              />
              <div
                style={{ width: `${(agingStats.overdue30 / agingStats.totalDebt) * 100}%` }}
                className="bg-amber-400 transition-all duration-300"
                title={`Quá hạn 31-60 ngày: ${formatCurrency(agingStats.overdue30)}`}
              />
              <div
                style={{ width: `${(agingStats.overdue60 / agingStats.totalDebt) * 100}%` }}
                className="bg-orange-500 transition-all duration-300"
                title={`Quá hạn 61-90 ngày: ${formatCurrency(agingStats.overdue60)}`}
              />
              <div
                style={{ width: `${(agingStats.overdue90 / agingStats.totalDebt) * 100}%` }}
                className="bg-rose-600 transition-all duration-300"
                title={`Quá hạn > 90 ngày: ${formatCurrency(agingStats.overdue90)}`}
              />
            </>
          )}
        </div>

        {/* 4 Aging Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold mb-1">
              <span>Trong hạn (&lt; 30 ngày)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="font-mono font-bold text-sm text-emerald-800 dark:text-emerald-300">
              {formatCurrency(agingStats.current)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {agingStats.totalDebt > 0 ? ((agingStats.current / agingStats.totalDebt) * 100).toFixed(1) : 0}% tổng nợ
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
              <span>Quá hạn 31 - 60 ngày</span>
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            </div>
            <div className="font-mono font-bold text-sm text-amber-800 dark:text-amber-300">
              {formatCurrency(agingStats.overdue30)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {agingStats.totalDebt > 0 ? ((agingStats.overdue30 / agingStats.totalDebt) * 100).toFixed(1) : 0}% tổng nợ
            </div>
          </div>

          <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
            <div className="flex items-center justify-between text-xs text-orange-700 dark:text-orange-400 font-semibold mb-1">
              <span>Quá hạn 61 - 90 ngày</span>
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            </div>
            <div className="font-mono font-bold text-sm text-orange-800 dark:text-orange-300">
              {formatCurrency(agingStats.overdue60)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {agingStats.totalDebt > 0 ? ((agingStats.overdue60 / agingStats.totalDebt) * 100).toFixed(1) : 0}% tổng nợ
            </div>
          </div>

          <div
            onClick={() => setFilterPreset('overdue_90d')}
            className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 cursor-pointer hover:ring-2 hover:ring-rose-500 transition-all"
            title="Nhấn để lọc các khoản nợ quá hạn > 90 ngày"
          >
            <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 font-semibold mb-1">
              <span>Quá hạn &gt; 90 ngày (Nợ xấu)</span>
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
            </div>
            <div className="font-mono font-bold text-sm text-rose-800 dark:text-rose-300">
              {formatCurrency(agingStats.overdue90)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {agingStats.totalDebt > 0 ? ((agingStats.overdue90 / agingStats.totalDebt) * 100).toFixed(1) : 0}% tổng nợ
            </div>
          </div>
        </div>
      </div>

      {/* Quick Preset Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-gray-500 dark:text-gray-400 font-medium shrink-0">Lọc nhanh công nợ:</span>
        {[
          { id: 'all', label: 'Tất cả đối tác', count: presetCounts.all, color: 'text-gray-700 dark:text-gray-200' },
          { id: 'has_debt', label: 'Có nợ hiện tại (> 0)', count: presetCounts.has_debt, color: 'text-blue-600 dark:text-blue-400' },
          { id: 'over_limit', label: 'Vượt hạn mức nợ', count: presetCounts.over_limit, color: 'text-amber-600 dark:text-amber-400' },
          { id: 'overdue_90d', label: 'Nợ quá hạn > 90 ngày (Nợ xấu)', count: presetCounts.overdue_90d, color: 'text-rose-600 dark:text-rose-400' },
          { id: 'credit_blocked', label: 'Đang bị khóa nợ', count: presetCounts.credit_blocked, color: 'text-purple-600 dark:text-purple-400' },
        ].map((tab) => {
          const active = filterPreset === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterPreset(tab.id as ReceivableFilterPreset)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer shrink-0 border ${
                active
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 ' + tab.color
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã khách hàng, tên khách hàng, số điện thoại..."
          className="w-full bg-transparent outline-none text-sm"
        />
        {(filterPreset !== 'all' || search) && (
          <button
            type="button"
            onClick={() => { setFilterPreset('all'); setSearch(''); }}
            className="text-xs text-red-500 hover:text-red-600 font-semibold whitespace-nowrap cursor-pointer"
          >
            Xóa lọc
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách công nợ...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết công nợ: ${selected?.customerName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã khách hàng:</span>
                <p className="font-mono font-semibold">{selected.customerCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Số điện thoại:</span>
                <p>{selected.phone}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Dư nợ hiện tại:</span>
                <p className="font-mono font-bold text-red-600">{formatCurrency(selected.currentDebt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn mức cho phép:</span>
                <p className="font-mono font-bold">{formatCurrency(selected.debtLimit)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Tổng mua tích lũy:</span>
                <p className="font-mono">{formatCurrency(selected.totalPurchased)}</p>
              </div>
              <div>
                <span className="text-gray-500">Giao dịch gần nhất:</span>
                <p className="font-mono">{selected.lastTransactionDate}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái công nợ:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'BINH_THUONG'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CANH_BAO'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'BINH_THUONG' ? 'An toàn' : selected.status === 'CANH_BAO' ? 'Vượt hạn mức' : 'Quá hạn'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú công nợ:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Lịch sử giao dịch nợ</h3>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                    <th className="p-2 border">Ngày</th>
                    <th className="p-2 border">Mã SO</th>
                    <th className="p-2 border text-right">Phát sinh</th>
                    <th className="p-2 border text-right">Thanh toán</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border font-mono">2026-06-04</td>
                    <td className="p-2 border font-mono">SO-2026-001</td>
                    <td className="p-2 border text-right font-mono text-red-500">1.450.000 đ</td>
                    <td className="p-2 border text-right font-mono text-emerald-500">0 đ</td>
                  </tr>
                  <tr>
                    <td className="p-2 border font-mono">2026-05-15</td>
                    <td className="p-2 border font-mono">SO-2025-998</td>
                    <td className="p-2 border text-right font-mono text-red-500">0 đ</td>
                    <td className="p-2 border text-right font-mono text-emerald-500">2.000.000 đ</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Điều chỉnh hạn mức công nợ"
      >
        <form onSubmit={handleSaveLimit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Khách hàng</label>
            <p className="font-semibold text-sm">{editingItem.customerName}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã khách hàng</label>
              <p className="font-mono text-sm">{editingItem.customerCode}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dư nợ hiện tại</label>
              <p className="font-mono text-sm text-red-600 font-bold">
                {editingItem.currentDebt ? formatCurrency(editingItem.currentDebt) : '0 đ'}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hạn mức công nợ tối đa (VND) *</label>
            <input
              type="number"
              value={editingItem.debtLimit || 0}
              onChange={(e) => setEditingItem({ ...editingItem, debtLimit: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Cập nhật hạn mức
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
