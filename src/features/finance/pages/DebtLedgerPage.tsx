import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Calendar, User, TrendingUp, TrendingDown, AlertCircle, Edit, Trash2, Layers, Clock, CheckCircle2, Percent, RefreshCw, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore, type DebtRecord } from '../store/financeStore';
import { usePurchaseStore } from '@/features/purchase/store/purchaseStore';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { CreateButton, SecondaryButton, PrimaryButton, DangerButton } from '@/shared/components/ui/Button';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';

const entityTypeMap: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  SUPPLIER: 'Nhà cung cấp',
  PARTNER: 'Đối tác',
};

const statusMapFull: Record<string, string> = {
  NORMAL: 'Chưa thanh toán',
  PARTIAL: 'Trả một phần',
  DUE_SOON: 'Sắp đến hạn',
  OVERDUE: 'Quá hạn',
  SETTLED: 'Đã tất toán',
};

export function DebtLedgerPage() {
  const data = useFinanceStore((s) => s.debts);
  const addDebt = useFinanceStore((s) => s.addDebt);
  const updateDebt = useFinanceStore((s) => s.updateDebt);
  const deleteDebt = useFinanceStore((s) => s.deleteDebt);
  const fetchDebts = useFinanceStore((s) => s.fetchDebts);

  // Lấy danh sách NCC, KH, NV cho dropdown
  const { suppliers, fetchSuppliers } = usePurchaseStore();
  const { customers, fetchCustomers } = useCrmStore();
  const [employeeList, setEmployeeList] = useState<{id: number; name: string}[]>([]);

  useEffect(() => {
    fetchDebts();
    fetchSuppliers();
    fetchCustomers();
    axiosClient.get<any, any>('/purchase/dropdowns/employees')
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.content || []);
        setEmployeeList(list);
      })
      .catch(() => {});
  }, [fetchDebts, fetchSuppliers, fetchCustomers]);

  const [search, setSearch] = useState('');
  const [tabFilter, setTabFilter] = useState<'ALL' | 'CUSTOMER' | 'SUPPLIER' | 'PARTIAL' | 'OVERDUE'>('ALL');
  const [selectedDebt, setSelectedDebt] = useState<DebtRecord | null>(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingDebt, setEditingDebt] = useState<Partial<DebtRecord>>({});
  const [deletingDebt, setDeletingDebt] = useState<DebtRecord | null>(null);

  // Danh sách đối tác tùy theo loại hình
  const partnerOptions = useMemo(() => {
    const type = editingDebt.entityType;
    if (type === 'SUPPLIER') return suppliers.map(s => s.supplierName);
    if (type === 'CUSTOMER') return customers.map(c => c.name);
    return [...suppliers.map(s => s.supplierName), ...customers.map(c => c.name)];
  }, [editingDebt.entityType, suppliers, customers]);

  // Thống kê nhanh KPI
  const stats = useMemo(() => {
    let customerDebt = 0;
    let supplierDebt = 0;
    let partialCount = 0;
    let partialDebt = 0;
    let overdueCount = 0;
    let overdueDebt = 0;
    const today = new Date().toISOString().substring(0, 10);

    data.forEach((item) => {
      const bal = Math.abs(item.totalDebt || 0);
      const paid = item.paidAmount || item.decrease || 0;
      const isOverdue = item.status === 'OVERDUE' || (Boolean(item.dueDate) && item.dueDate < today && bal > 0);
      const isPartial = (item.status as any) === 'PARTIAL' || (paid > 0 && bal > 0);

      if (item.entityType === 'CUSTOMER') {
        customerDebt += bal;
      } else if (item.entityType === 'SUPPLIER') {
        supplierDebt += bal;
      }

      if (isPartial) {
        partialCount += 1;
        partialDebt += bal;
      }

      if (isOverdue) {
        overdueCount += 1;
        overdueDebt += bal;
      }
    });

    return { customerDebt, supplierDebt, partialCount, partialDebt, overdueCount, overdueDebt };
  }, [data]);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().substring(0, 10);
    return data.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        item.entityName.toLowerCase().includes(q) ||
        item.debtCode.toLowerCase().includes(q) ||
        (item.referenceDoc && item.referenceDoc.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const bal = Math.abs(item.totalDebt || 0);
      const paid = item.paidAmount || item.decrease || 0;
      const isOverdue = item.status === 'OVERDUE' || (Boolean(item.dueDate) && item.dueDate < today && bal > 0);
      const isPartial = (item.status as any) === 'PARTIAL' || (paid > 0 && bal > 0);

      if (tabFilter === 'CUSTOMER') return item.entityType === 'CUSTOMER';
      if (tabFilter === 'SUPPLIER') return item.entityType === 'SUPPLIER';
      if (tabFilter === 'PARTIAL') return isPartial;
      if (tabFilter === 'OVERDUE') return isOverdue;
      return true;
    });
  }, [data, search, tabFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingDebt({
      debtCode: `DBT-2024-${Math.floor(100 + Math.random() * 900)}`,
      entityName: '',
      entityType: 'CUSTOMER',
      totalDebt: 0,
      dueAmount: 0,
      dueDate: '',
      status: 'NORMAL',
      lastPaymentDate: '',
      accountManager: '',
      branchId: 'BR-001',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: DebtRecord) => {
    setModalMode('edit');
    setEditingDebt(record);
    setIsModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDebt.debtCode || !editingDebt.entityName) return;

    const today = new Date().toISOString().substring(0, 10);
    if (editingDebt.dueDate && editingDebt.dueDate < today) {
      toast.error('Ngày đến hạn thanh toán phải từ hôm nay trở đi');
      return;
    }
    if (editingDebt.lastPaymentDate && editingDebt.lastPaymentDate > today) {
      toast.error('Ngày giao dịch gần nhất không được là ngày tương lai');
      return;
    }

    if (modalMode === 'create') {
      addDebt({
        debtCode: editingDebt.debtCode || `DBT-2024-${Math.floor(100 + Math.random() * 900)}`,
        entityName: editingDebt.entityName || 'Đối tác',
        entityType: editingDebt.entityType || 'CUSTOMER',
        totalDebt: Number(editingDebt.totalDebt) || 0,
        dueAmount: Number(editingDebt.dueAmount) || 0,
        dueDate: editingDebt.dueDate || new Date().toISOString().substring(0, 10),
        status: editingDebt.status || 'NORMAL',
        lastPaymentDate: editingDebt.lastPaymentDate,
        accountManager: editingDebt.accountManager || 'Quản lý viên',
        branchId: editingDebt.branchId || 'BR-001',
        notes: editingDebt.notes,
      });
    } else if (editingDebt.id) {
      updateDebt(editingDebt.id, editingDebt);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingDebt) return;
    deleteDebt(deletingDebt.id);
    setDeletingDebt(null);
  };

  const columns = useMemo<ColumnDef<DebtRecord>[]>(
    () => [
      {
        accessorKey: 'debtCode',
        header: 'Mã số',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'entityName',
        header: 'Đối tác / Doanh nghiệp',
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.original.entityName}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500">{row.original.accountManager || 'Chưa phân công'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'entityType',
        header: 'Loại hình',
        cell: (info) => {
          const type = info.getValue() as string;
          const isCust = type === 'CUSTOMER';
          return (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              isCust
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
            }`}>
              {entityTypeMap[type] || type}
            </span>
          );
        },
      },
      {
        accessorKey: 'referenceDoc',
        header: 'Chứng từ gốc',
        cell: (info) => <span className="font-mono text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer">{info.getValue() as string || '-'}</span>,
      },
      {
        id: 'originalAmount',
        header: 'Tổng phát sinh',
        cell: ({ row }) => {
          const bal = Math.abs(row.original.totalDebt || 0);
          const paid = row.original.paidAmount || row.original.decrease || 0;
          const orig = (row.original.increase || 0) > 0 ? row.original.increase! : (paid + bal);
          return <span className="font-mono font-medium text-gray-900 dark:text-white">{orig.toLocaleString('vi-VN')} ₫</span>;
        },
      },
      {
        id: 'paidAmount',
        header: 'Đã thanh toán',
        cell: ({ row }) => {
          const paid = row.original.paidAmount || row.original.decrease || 0;
          return (
            <span className={`font-mono font-medium ${paid > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400'}`}>
              {paid > 0 ? `${paid.toLocaleString('vi-VN')} ₫` : '0 ₫'}
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: 'Tiến độ TT',
        cell: ({ row }) => {
          const bal = Math.abs(row.original.totalDebt || 0);
          const paid = row.original.paidAmount || row.original.decrease || 0;
          const orig = (row.original.increase || 0) > 0 ? row.original.increase! : (paid + bal);
          const pct = orig > 0 ? Math.min(100, Math.round((paid / orig) * 100)) : (bal === 0 ? 100 : 0);
          return (
            <div className="w-24">
              <div className="flex justify-between text-[11px] font-mono mb-1 text-gray-500">
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'totalDebt',
        header: 'Còn nợ lại',
        cell: ({ row }) => {
          const val = row.original.totalDebt;
          const curr = row.original.currency || 'VND';
          const prefix = curr === 'USD' ? '$' : '';
          const suffix = curr === 'VND' ? ' ₫' : curr !== 'USD' ? ` ${curr}` : '';
          if (val === 0) {
            return <span className="font-mono text-gray-400">0 ₫</span>;
          }
          return (
            <span className={`font-bold font-mono ${val >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {val >= 0 ? `+${prefix}${val.toLocaleString('vi-VN')}${suffix}` : `-${prefix}${Math.abs(val).toLocaleString('vi-VN')}${suffix}`}
            </span>
          );
        },
      },
      {
        accessorKey: 'dueDate',
        header: 'Hạn thanh toán',
        cell: (info) => {
          const dateStr = info.getValue() as string;
          if (!dateStr) return <span className="text-gray-400">-</span>;
          const today = new Date().toISOString().substring(0, 10);
          const isOverdue = dateStr < today;
          return (
            <span className={`text-xs font-mono ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500'}`}>
              {dateStr}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const bal = Math.abs(row.original.totalDebt || 0);
          const paid = row.original.paidAmount || row.original.decrease || 0;
          const orig = (row.original.increase || 0) > 0 ? row.original.increase! : (paid + bal);
          const pct = orig > 0 ? Math.round((paid / orig) * 100) : 0;
          const today = new Date().toISOString().substring(0, 10);
          const isOverdue = row.original.status === 'OVERDUE' || (Boolean(row.original.dueDate) && row.original.dueDate < today && bal > 0);

          if (bal === 0 || row.original.status === 'SETTLED') {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Đã tất toán
              </span>
            );
          }
          if (paid > 0 && bal > 0) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                <Percent className="w-3 h-3" /> Trả một phần ({pct}%)
              </span>
            );
          }
          if (isOverdue) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                <Clock className="w-3 h-3" /> Quá hạn
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              Chưa thanh toán
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
              onClick={(e) => { e.stopPropagation(); setSelectedDebt(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingDebt(row.original); }}
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sổ công nợ & Đối trừ quyết toán</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Giám sát công nợ phải thu của Khách hàng và phải trả Nhà cung cấp, theo dõi chi tiết thanh toán một phần và dư nợ lũy kế.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SecondaryButton
              onClick={() => {
                fetchDebts();
                toast.success('Đã đồng bộ lại dữ liệu công nợ mới nhất!');
              }}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Đồng bộ hệ thống
            </SecondaryButton>
            <SecondaryButton
              onClick={() => {
                exportToCsv('so_cong_no', filtered, [
                  { header: 'Mã công nợ', accessor: r => r.debtCode },
                  { header: 'Tên đối tác', accessor: r => r.entityName },
                  { header: 'Loại đối tác', accessor: r => entityTypeMap[r.entityType] || r.entityType },
                  { header: 'Chứng từ gốc', accessor: r => r.referenceDoc || '' },
                  { header: 'Tổng phát sinh', accessor: r => (r.increase || 0) > 0 ? r.increase : ((r.paidAmount || 0) + Math.abs(r.totalDebt)) },
                  { header: 'Đã thanh toán', accessor: r => r.paidAmount || r.decrease || 0 },
                  { header: 'Còn nợ lại (VND)', accessor: r => r.totalDebt },
                  { header: 'Hạn thanh toán', accessor: r => r.dueDate },
                  { header: 'Trạng thái', accessor: r => statusMapFull[r.status] || r.status },
                  { header: 'Phụ trách', accessor: r => r.accountManager },
                ]);
                toast.success('Đã xuất sổ công nợ dạng CSV!');
              }}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Xuất CSV
            </SecondaryButton>
            <CreateButton onClick={handleOpenCreate}>
              Ghi nhận nợ mới
            </CreateButton>
          </div>
        </div>

        {/* 4 Thẻ KPI Tóm tắt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Phải thu Khách hàng</p>
              <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +{stats.customerDebt.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Phải trả Nhà cung cấp</p>
              <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                -{stats.supplierDebt.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đang trả một phần ({stats.partialCount} ĐH)</p>
              <p className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                {stats.partialDebt.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Công nợ quá hạn ({stats.overdueCount} khoản)</p>
              <p className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
                {stats.overdueDebt.toLocaleString('vi-VN')} ₫
              </p>
            </div>
          </div>
        </div>

        {/* Thanh lọc Tab & Tìm kiếm */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'Tất cả', count: data.length },
              { key: 'CUSTOMER', label: 'Phải thu KH', count: data.filter(d => d.entityType === 'CUSTOMER').length },
              { key: 'SUPPLIER', label: 'Phải trả NCC', count: data.filter(d => d.entityType === 'SUPPLIER').length },
              { key: 'PARTIAL', label: 'Trả một phần', count: stats.partialCount },
              { key: 'OVERDUE', label: 'Quá hạn', count: stats.overdueCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setTabFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  tabFilter === tab.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  tabFilter === tab.key ? 'bg-emerald-700 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Tìm kiếm mã nợ, đối tác, số chứng từ..."
            containerClassName="w-full sm:w-72"
          />
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedDebt(row)} />
      </div>

      {/* Modal xem chi tiết */}
      <Modal
        isOpen={!!selectedDebt}
        onClose={() => setSelectedDebt(null)}
        title={selectedDebt ? `Hồ Sơ Công Nợ: ${selectedDebt.debtCode}` : 'Chi tiết công nợ'}
        size="erp"
      >
        {selectedDebt && (() => {
          const bal = Math.abs(selectedDebt.totalDebt || 0);
          const paid = selectedDebt.paidAmount || selectedDebt.decrease || 0;
          const orig = (selectedDebt.increase || 0) > 0 ? selectedDebt.increase! : (paid + bal);
          const pct = orig > 0 ? Math.min(100, Math.round((paid / orig) * 100)) : (bal === 0 ? 100 : 0);

          return (
            <div className="space-y-6">
              <div className={`flex items-center justify-between p-4 rounded-xl border ${
                selectedDebt.totalDebt >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                    selectedDebt.totalDebt >= 0 ? 'bg-emerald-600' : 'bg-purple-600'
                  }`}>
                    {selectedDebt.totalDebt >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${
                      selectedDebt.totalDebt >= 0 ? 'text-emerald-800 dark:text-emerald-400' : 'text-purple-800 dark:text-purple-400'
                    }`}>
                      {selectedDebt.totalDebt >= 0 ? 'Khoản phải thu (Khách hàng)' : 'Khoản phải trả (Nhà cung cấp)'}
                    </p>
                    <p className={`text-xl font-bold font-mono mt-0.5 ${
                      selectedDebt.totalDebt >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-purple-700 dark:text-purple-400'
                    }`}>
                      {selectedDebt.totalDebt >= 0
                        ? `+${selectedDebt.totalDebt.toLocaleString('vi-VN')} ₫`
                        : `-${Math.abs(selectedDebt.totalDebt).toLocaleString('vi-VN')} ₫`}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  bal === 0 || selectedDebt.status === 'SETTLED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                  paid > 0 && bal > 0 ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                  selectedDebt.status === 'DUE_SOON' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                  'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                }`}>
                  {bal === 0 || selectedDebt.status === 'SETTLED' ? 'Đã tất toán' :
                   paid > 0 && bal > 0 ? `Trả một phần (${pct}%)` :
                   statusMapFull[selectedDebt.status] || selectedDebt.status}
                </span>
              </div>

              {/* Tiến độ thanh toán */}
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tiến độ thanh toán lũy kế</span>
                  <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">{pct}% hoàn thành</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-gray-400 mb-1">Tổng phát sinh</p>
                    <p className="font-bold font-mono text-gray-900 dark:text-white">{orig.toLocaleString('vi-VN')} ₫</p>
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-emerald-700 dark:text-emerald-400 mb-1">Đã thanh toán</p>
                    <p className="font-bold font-mono text-emerald-600 dark:text-emerald-400">{paid.toLocaleString('vi-VN')} ₫</p>
                  </div>
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-red-700 dark:text-red-400 mb-1">Còn nợ lại</p>
                    <p className="font-bold font-mono text-red-600 dark:text-red-400">{bal.toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    <User className="w-4 h-4 text-blue-500" /> Tên đối tác
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedDebt.entityName}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    <Calendar className="w-4 h-4 text-amber-500" /> Ngày đáo hạn
                  </div>
                  <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedDebt.dueDate || 'Không thời hạn'}</p>
                </div>
              </div>

              <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Phân loại đối tác:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{entityTypeMap[selectedDebt.entityType] || selectedDebt.entityType}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Chứng từ gốc liên quan:</span>
                  <span className="font-semibold font-mono text-blue-600 dark:text-blue-400">{selectedDebt.referenceDoc || 'Không có'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Giao dịch gần nhất:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedDebt.lastPaymentDate || 'Chưa ghi nhận'}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-500 dark:text-gray-400">Nhân viên phụ trách:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedDebt.accountManager}</span>
                </div>

                {selectedDebt.notes && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú & Thỏa thuận</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedDebt.notes}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDebt(null)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Ghi nhận công nợ mới' : 'Chỉnh sửa thông tin công nợ'}
        size="erp"
      >
        <form onSubmit={handleSaveDebt} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã số công nợ *</label>
              <input
                type="text"
                value={editingDebt.debtCode || ''}
                onChange={(e) => setEditingDebt({ ...editingDebt, debtCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại hình đối tác</label>
              <select
                value={editingDebt.entityType || 'CUSTOMER'}
                onChange={(e) => setEditingDebt({ ...editingDebt, entityType: e.target.value as any, entityName: '' })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="CUSTOMER">Khách hàng (Khoản phải thu)</option>
                <option value="SUPPLIER">Nhà cung cấp (Khoản phải trả)</option>
                <option value="PARTNER">Đối tác liên doanh / Dịch vụ</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên đối tác / Doanh nghiệp *</label>
            <input
              type="text"
              list="partnerNameList"
              value={editingDebt.entityName || ''}
              onChange={(e) => setEditingDebt({ ...editingDebt, entityName: e.target.value })}
              placeholder="Gõ để tìm kiếm đối tác từ danh sách hệ thống..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              required
            />
            <datalist id="partnerNameList">
              {partnerOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tổng dư nợ (₫) (Dương: Phải thu, Âm: Phải trả)
              </label>
              <input
                type="text"
                value={editingDebt.totalDebt === undefined || editingDebt.totalDebt === null ? '' : String(editingDebt.totalDebt)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === '-') {
                    setEditingDebt({ ...editingDebt, totalDebt: val as any });
                  } else {
                    const clean = val.replace(/[^0-9.-]/g, '');
                    const parsed = parseFloat(clean);
                    if (!isNaN(parsed)) {
                      setEditingDebt({ ...editingDebt, totalDebt: parsed });
                    }
                  }
                }}
                placeholder="VD: 5000000 hoặc -2000000"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền thanh toán đợt này (₫)</label>
              <input
                type="text"
                value={editingDebt.dueAmount === undefined || editingDebt.dueAmount === null ? '' : String(editingDebt.dueAmount)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || val === '-') {
                    setEditingDebt({ ...editingDebt, dueAmount: val as any });
                  } else {
                    const clean = val.replace(/[^0-9.-]/g, '');
                    const parsed = parseFloat(clean);
                    if (!isNaN(parsed)) {
                      setEditingDebt({ ...editingDebt, dueAmount: parsed });
                    }
                  }
                }}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày đến hạn thanh toán</label>
              <input
                type="date"
                min={new Date().toISOString().substring(0, 10)}
                value={editingDebt.dueDate || ''}
                onChange={(e) => setEditingDebt({ ...editingDebt, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái công nợ</label>
              <select
                value={editingDebt.status || 'NORMAL'}
                onChange={(e) => setEditingDebt({ ...editingDebt, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="NORMAL">Bình thường (Normal)</option>
                <option value="DUE_SOON">Sắp đến hạn (Due soon)</option>
                <option value="OVERDUE">Quá hạn (Overdue)</option>
                <option value="SETTLED">Đã tất toán (Settled)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày giao dịch gần nhất</label>
              <input
                type="date"
                max={new Date().toISOString().substring(0, 10)}
                value={editingDebt.lastPaymentDate || ''}
                onChange={(e) => setEditingDebt({ ...editingDebt, lastPaymentDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhân viên phụ trách đối tác</label>
            <input
              type="text"
              list="employeeList"
              value={editingDebt.accountManager || ''}
              onChange={(e) => setEditingDebt({ ...editingDebt, accountManager: e.target.value })}
              placeholder="Gõ để tìm nhân viên phụ trách..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <datalist id="employeeList">
              {employeeList.map((emp) => (
                <option key={emp.id} value={emp.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú & Thỏa thuận thanh toán</label>
            <textarea
              rows={2}
              value={editingDebt.notes || ''}
              onChange={(e) => setEditingDebt({ ...editingDebt, notes: e.target.value })}
              placeholder="Ghi chú về hạn mức, thỏa thuận gia hạn hoặc thông tin giao dịch cụ thể..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo Mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <ConfirmDeleteModal
        isOpen={!!deletingDebt}
        onClose={() => setDeletingDebt(null)}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận gỡ bỏ hồ sơ công nợ"
        description="Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ công nợ này không? Hãy đảm bảo khoản nợ đã được tất toán hoặc có biên bản đồng ý hợp lệ."
        itemName={`${deletingDebt?.debtCode} (${deletingDebt?.entityName})`}
      />
    </>
  );
}
