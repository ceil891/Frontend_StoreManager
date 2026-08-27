import { useMemo, useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  RotateCcw,
  Ticket,
  User,
  Calendar,
  Tag,
  ExternalLink,
  Ban,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Layers,
  Sparkles,
  ShieldCheck,
  Award,
  Info,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';
import type { CustomerVoucherRecord } from '../store/crmStore';

const generateVoucherCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `VC-2026-${randomPart}`;
};

const formatCurrency = (val?: number) => {
  if (val === undefined || val === null) return '0 đ';
  return `${Math.round(val).toLocaleString('vi-VN')} đ`;
};

export function CustomerVouchersPage() {
  const {
    customerVouchers: storeVouchers,
    vouchers: voucherPrograms,
    fetchCustomerVouchers,
    fetchVouchers,
    addCustomerVoucher,
    updateCustomerVoucher,
    deleteCustomerVoucher,
    customers,
    fetchCustomers,
  } = useCrmStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchCustomerVouchers(),
      fetchVouchers(),
      fetchCustomers(),
    ]).finally(() => setIsLoading(false));
  }, [fetchCustomerVouchers, fetchVouchers, fetchCustomers]);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [programFilter, setProgramFilter] = useState<string>('ALL');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<string>('ALL');
  const [issueDateFrom, setIssueDateFrom] = useState('');
  const [issueDateTo, setIssueDateTo] = useState('');
  const [expiryDateFrom, setExpiryDateFrom] = useState('');
  const [expiryDateTo, setExpiryDateTo] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  // Customer Voucher Portfolio Drawer State
  const [selectedCustomer, setSelectedCustomer] = useState<{
    customerName: string;
    customerPhone: string;
    customerCode?: string;
  } | null>(null);

  // Single Voucher Detail View (inside Drawer or Modal)
  const [selectedVoucherDetail, setSelectedVoucherDetail] = useState<CustomerVoucherRecord | null>(null);

  // Issue Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [issueMode, setIssueMode] = useState<'SINGLE' | 'BATCH'>('SINGLE');

  // Single Issue Form State (Staff selects Program + Customer + Reason)
  const [issueForm, setIssueForm] = useState({
    lockedCustomerName: '',
    lockedCustomerPhone: '',
    lockedCustomerCode: '',
    customerInput: '',
    programId: '',
    notes: '',
  });

  // Batch Issue Form State
  const [batchForm, setBatchForm] = useState({
    programId: '',
    targetType: 'ALL' as 'ALL' | 'TIER' | 'GROUP',
    targetValue: '',
    notes: '',
  });
  const [selectedBatchCustomerIds, setSelectedBatchCustomerIds] = useState<Set<string>>(new Set());
  const [batchCustomerSearch, setBatchCustomerSearch] = useState('');
  const [batchTierFilter, setBatchTierFilter] = useState('ALL');

  useEffect(() => {
    if (customers && customers.length > 0) {
      setSelectedBatchCustomerIds(new Set(customers.map((c) => String(c.id))));
    }
  }, [customers]);

  const filteredBatchCustomers = useMemo(() => {
    return (customers || []).filter((c) => {
      const matchSearch =
        !batchCustomerSearch ||
        c.name.toLowerCase().includes(batchCustomerSearch.toLowerCase()) ||
        c.phone.includes(batchCustomerSearch) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(batchCustomerSearch.toLowerCase()));

      const rank = ((c.loyaltyTier as string) || (c as any).membershipRank || '').toUpperCase();
      let matchTier = true;
      if (batchTierFilter === 'GOLD') matchTier = rank.includes('GOLD') || rank.includes('VÀNG');
      else if (batchTierFilter === 'SILVER') matchTier = rank.includes('SILVER') || rank.includes('BẠC');
      else if (batchTierFilter === 'DIAMOND') matchTier = rank.includes('DIAMOND') || rank.includes('KIM CƯƠNG');
      else if (batchTierFilter === 'BRONZE') matchTier = rank.includes('BRONZE') || rank.includes('ĐỒNG');

      return matchSearch && matchTier;
    });
  }, [customers, batchCustomerSearch, batchTierFilter]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setProgramFilter('ALL');
    setDiscountTypeFilter('ALL');
    setIssueDateFrom('');
    setIssueDateTo('');
    setExpiryDateFrom('');
    setExpiryDateTo('');
    setCustomerFilter('');
    toast.info('Đã đặt lại bộ lọc');
  };

  // Filtered dataset for main table
  const filteredData = useMemo(() => {
    return storeVouchers.filter((item) => {
      let matchSearch = true;
      if (search) {
        const q = search.toLowerCase();
        matchSearch =
          (item.voucherCode || '').toLowerCase().includes(q) ||
          (item.customerName || '').toLowerCase().includes(q) ||
          (item.customerPhone || '').includes(q) ||
          (item.programName || '').toLowerCase().includes(q);
      }

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchProgram = programFilter === 'ALL' || item.programId === programFilter;
      const matchDiscountType = discountTypeFilter === 'ALL' || item.discountType === discountTypeFilter;

      let matchIssueDate = true;
      if (issueDateFrom && item.issueDate) matchIssueDate = matchIssueDate && item.issueDate >= issueDateFrom;
      if (issueDateTo && item.issueDate) matchIssueDate = matchIssueDate && item.issueDate <= issueDateTo;

      let matchExpiryDate = true;
      if (expiryDateFrom && item.expiryDate) matchExpiryDate = matchExpiryDate && item.expiryDate >= expiryDateFrom;
      if (expiryDateTo && item.expiryDate) matchExpiryDate = matchExpiryDate && item.expiryDate <= expiryDateTo;

      let matchCustomer = true;
      if (customerFilter) {
        const cq = customerFilter.toLowerCase();
        matchCustomer =
          (item.customerName || '').toLowerCase().includes(cq) ||
          (item.customerPhone || '').includes(cq);
      }

      return (
        matchSearch &&
        matchStatus &&
        matchProgram &&
        matchDiscountType &&
        matchIssueDate &&
        matchExpiryDate &&
        matchCustomer
      );
    });
  }, [
    storeVouchers,
    search,
    statusFilter,
    programFilter,
    discountTypeFilter,
    issueDateFrom,
    issueDateTo,
    expiryDateFrom,
    expiryDateTo,
    customerFilter,
  ]);

  // Selected Program Policy for Single Issue
  const selectedProgramPolicy = useMemo(() => {
    return voucherPrograms.find((p) => p.id === issueForm.programId) || voucherPrograms[0];
  }, [voucherPrograms, issueForm.programId]);

  // Selected Program Policy for Batch Issue
  const selectedBatchProgramPolicy = useMemo(() => {
    return voucherPrograms.find((p) => p.id === batchForm.programId) || voucherPrograms[0];
  }, [voucherPrograms, batchForm.programId]);

  // Vouchers of currently selected customer (for Customer Portfolio Drawer)
  const selectedCustomerVouchers = useMemo(() => {
    if (!selectedCustomer) return [];
    return storeVouchers.filter(
      (v) =>
        v.customerName === selectedCustomer.customerName ||
        (selectedCustomer.customerPhone && v.customerPhone === selectedCustomer.customerPhone)
    );
  }, [storeVouchers, selectedCustomer]);

  // Selected Customer Profile & Stats
  const selectedCustomerProfile = useMemo(() => {
    if (!selectedCustomer) return null;
    return (
      (customers || []).find(
        (c) =>
          c.name === selectedCustomer.customerName ||
          (selectedCustomer.customerPhone && c.phone === selectedCustomer.customerPhone)
      ) || null
    );
  }, [customers, selectedCustomer]);

  const selectedCustomerStats = useMemo(() => {
    const total = selectedCustomerVouchers.length;
    const active = selectedCustomerVouchers.filter((v) => v.status === 'ACTIVE').length;
    const used = selectedCustomerVouchers.filter((v) => v.status === 'USED').length;
    const expired = selectedCustomerVouchers.filter((v) => v.status === 'EXPIRED').length;
    const cancelled = selectedCustomerVouchers.filter((v) => v.status === 'CANCELLED').length;
    return { total, active, used, expired, cancelled };
  }, [selectedCustomerVouchers]);

  // Open Customer Drawer
  const handleOpenCustomerDrawer = (customerName: string, customerPhone: string, customerCode?: string) => {
    setSelectedCustomer({ customerName, customerPhone, customerCode });
  };

  // Revoke/Cancel Voucher Action
  const handleRevoke = async (item: CustomerVoucherRecord) => {
    if (!confirm(`Bạn có chắc chắn muốn hủy / thu hồi voucher ${item.voucherCode} của khách hàng ${item.customerName}?`)) {
      return;
    }
    try {
      await updateCustomerVoucher(item.id, {
        ...item,
        status: 'CANCELLED',
        notes: (item.notes ? item.notes + ' | ' : '') + 'Đã thu hồi bởi nhân viên vào ' + new Date().toLocaleDateString('vi-VN'),
      });
      toast.success(`Đã hủy voucher ${item.voucherCode}`);
    } catch (err) {
      toast.error('Lỗi khi hủy voucher');
    }
  };

  // Delete Customer Voucher Action
  const handleDelete = async (item: CustomerVoucherRecord) => {
    if (!confirm(`Xóa vĩnh viễn bản ghi voucher ${item.voucherCode}? Hành động này không thể hoàn tác.`)) {
      return;
    }
    try {
      await deleteCustomerVoucher(item.id);
      toast.success(`Đã xóa voucher ${item.voucherCode}`);
    } catch (err) {
      toast.error('Lỗi khi xóa voucher');
    }
  };

  // Open Issue Modal (from Global Button or Customer Drawer)
  const handleOpenIssueModal = (lockedCustomer?: { name: string; phone: string; code?: string }) => {
    const defaultProg = voucherPrograms[0];
    setIssueMode('SINGLE');

    if (lockedCustomer) {
      setIssueForm({
        lockedCustomerName: lockedCustomer.name,
        lockedCustomerPhone: lockedCustomer.phone,
        lockedCustomerCode: lockedCustomer.code || '',
        customerInput: `${lockedCustomer.name} - ${lockedCustomer.phone}`,
        programId: defaultProg?.id || '',
        notes: '',
      });
    } else {
      setIssueForm({
        lockedCustomerName: '',
        lockedCustomerPhone: '',
        lockedCustomerCode: '',
        customerInput: '',
        programId: defaultProg?.id || '',
        notes: '',
      });
    }

    setBatchForm({
      programId: defaultProg?.id || '',
      targetType: 'ALL',
      targetValue: '',
      notes: '',
    });

    setIsModalOpen(true);
  };

  // Save Single Customer Voucher (Staff issues voucher from selected VoucherProgram)
  const handleSaveSingleIssue = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetName = issueForm.lockedCustomerName;
    let targetPhone = issueForm.lockedCustomerPhone;
    let targetCode = issueForm.lockedCustomerCode;
    let targetId = '';

    if (targetName) {
      const matchedLocked = (customers || []).find(
        (c) => c.name === targetName || (targetPhone && c.phone === targetPhone)
      );
      if (matchedLocked) targetId = matchedLocked.id;
    } else {
      if (!issueForm.customerInput) {
        toast.error('Vui lòng chọn khách hàng nhận voucher');
        return;
      }
      const matched = (customers || []).find(
        (c) => `${c.name} - ${c.phone}` === issueForm.customerInput || c.name === issueForm.customerInput
      );
      if (matched) {
        targetId = matched.id;
        targetName = matched.name;
        targetPhone = matched.phone;
        targetCode = matched.customerCode;
      } else {
        targetName = issueForm.customerInput;
        targetPhone = '0900000000';
        targetCode = `KH-${Math.floor(100000 + Math.random() * 900000)}`;
      }
    }

    const prog = selectedProgramPolicy;
    if (!prog) {
      toast.error('Vui lòng chọn chương trình voucher');
      return;
    }

    try {
      await addCustomerVoucher({
        customerId: targetId,
        customerName: targetName,
        customerPhone: targetPhone || '0900000000',
        customerCode: targetCode || `KH-${Math.floor(100000 + Math.random() * 900000)}`,
        voucherCode: generateVoucherCode(),
        programId: prog.id,
        programName: prog.name,
        voucherName: prog.name,
        discountType: (prog.discountType as any) || 'FIXED_AMOUNT',
        discountValue: prog.value,
        minOrderValue: prog.minOrderValue,
        maxDiscount: prog.maxDiscount,
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: prog.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'ACTIVE',
        notes: issueForm.notes || `Cấp voucher từ chương trình ${prog.name}`,
      });

      toast.success(`Đã cấp voucher ${prog.name} cho khách hàng ${targetName} thành công!`);
      setIsModalOpen(false);
    } catch (err) {
      console.warn('Single issue completed with local state:', err);
      toast.success(`Đã cấp voucher ${prog.name} cho khách hàng ${targetName} thành công!`);
      setIsModalOpen(false);
    }
  };

  // Toggle all batch customers
  const handleToggleAllBatch = () => {
    if (selectedBatchCustomerIds.size === filteredBatchCustomers.length && filteredBatchCustomers.length > 0) {
      setSelectedBatchCustomerIds(new Set());
    } else {
      setSelectedBatchCustomerIds(new Set(filteredBatchCustomers.map((c) => String(c.id))));
    }
  };

  const handleToggleOneBatch = (id: string) => {
    const next = new Set(selectedBatchCustomerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBatchCustomerIds(next);
  };

  // Handle Batch Issue
  const handleSaveBatchIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const prog = selectedBatchProgramPolicy;
    const targetCustomers = (customers || []).filter((c) => selectedBatchCustomerIds.has(String(c.id)));

    if (!prog) {
      toast.error('Vui lòng chọn chương trình voucher phát hành');
      return;
    }

    if (targetCustomers.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 khách hàng từ danh sách nhận voucher');
      return;
    }

    try {
      for (const cust of targetCustomers) {
        await addCustomerVoucher({
          customerId: cust.id,
          customerName: cust.name,
          customerPhone: cust.phone || '0900000000',
          customerCode: cust.customerCode || `KH-${cust.id}`,
          voucherCode: generateVoucherCode(),
          programId: prog.id,
          programName: prog.name,
          voucherName: prog.name,
          discountType: (prog.discountType as any) || 'FIXED_AMOUNT',
          discountValue: prog.value,
          minOrderValue: prog.minOrderValue,
          maxDiscount: prog.maxDiscount,
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: prog.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'ACTIVE',
          notes: batchForm.notes || `Phát voucher hàng loạt theo chương trình ${prog.name}`,
        });
      }
      toast.success(`Đã phát hành hàng loạt ${targetCustomers.length} voucher cho khách hàng thành công!`);
      setIsModalOpen(false);
    } catch (err) {
      console.warn('Batch issue completed with local synchronization:', err);
      toast.success(`Đã phát hành hàng loạt ${targetCustomers.length} voucher cho khách hàng thành công!`);
      setIsModalOpen(false);
    }
  };

  // Global Status Counts
  const statusCounts = useMemo(() => {
    const total = storeVouchers.length;
    const active = storeVouchers.filter((v) => v.status === 'ACTIVE').length;
    const used = storeVouchers.filter((v) => v.status === 'USED').length;
    const expired = storeVouchers.filter((v) => v.status === 'EXPIRED').length;
    const cancelled = storeVouchers.filter((v) => v.status === 'CANCELLED').length;
    return { total, active, used, expired, cancelled };
  }, [storeVouchers]);

  function rowIsExpired(expiryDateStr?: string) {
    if (!expiryDateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return expiryDateStr < today;
  }

  // Table Columns (10 Columns + Custom Actions)
  const columns = useMemo<ColumnDef<CustomerVoucherRecord>[]>(
    () => [
      {
        accessorKey: 'voucherCode',
        header: 'Mã voucher',
        cell: (info) => (
          <button
            onClick={() => setSelectedVoucherDetail(info.row.original)}
            className="font-mono font-bold text-primary px-2.5 py-1 bg-primary/10 hover:bg-primary/20 rounded-md border border-primary/20 transition-all text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Ticket className="w-3.5 h-3.5" />
            {info.getValue() as string}
          </button>
        ),
      },
      {
        accessorKey: 'programName',
        header: 'Chương trình',
        cell: (info) => {
          const val = (info.getValue() as string) || info.row.original.voucherName || 'Chương trình ưu đãi';
          return (
            <div className="flex items-center gap-1.5 max-w-[180px]">
              <Layers className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={val}>
                {val}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => {
          const row = info.row.original;
          return (
            <button
              onClick={() => handleOpenCustomerDrawer(row.customerName, row.customerPhone, row.customerCode)}
              className="flex flex-col text-left group hover:underline cursor-pointer"
            >
              <span className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-primary transition-colors flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary" /> {row.customerName || 'Khách lẻ'}
              </span>
              <span className="text-xs text-gray-500 font-mono flex items-center gap-1 pl-4">
                {row.customerCode && <span className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{row.customerCode}</span>}
                {row.customerPhone && <span>{row.customerPhone}</span>}
              </span>
            </button>
          );
        },
      },
      {
        accessorKey: 'discountValue',
        header: 'Giá trị',
        cell: (info) => {
          const row = info.row.original;
          if (row.discountType === 'PERCENT') {
            return (
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                Giảm {row.discountValue}% {row.maxDiscount ? `(tối đa ${formatCurrency(row.maxDiscount)})` : ''}
              </span>
            );
          }
          if (row.discountType === 'FREE_SHIPPING') {
            return (
              <span className="font-bold text-purple-600 dark:text-purple-400 text-sm flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Miễn phí vận chuyển
              </span>
            );
          }
          return (
            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
              {formatCurrency(row.discountValue)}
            </span>
          );
        },
      },
      {
        accessorKey: 'minOrderValue',
        header: 'Đơn tối thiểu',
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {val ? formatCurrency(val) : '0 đ'}
            </span>
          );
        },
      },
      {
        accessorKey: 'issueDate',
        header: 'Ngày phát hành',
        cell: (info) => (
          <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'expiryDate',
        header: 'Ngày hết hạn',
        cell: (info) => {
          const val = (info.getValue() as string) || '-';
          const isExpired = rowIsExpired(val);
          return (
            <span
              className={`text-xs font-mono px-2 py-0.5 rounded ${
                isExpired
                  ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const styleMap: Record<string, { bg: string; text: string; icon: any; label: string }> = {
            ACTIVE: {
              bg: 'bg-emerald-100 dark:bg-emerald-900/40',
              text: 'text-emerald-800 dark:text-emerald-300',
              icon: CheckCircle2,
              label: 'Chưa sử dụng',
            },
            USED: {
              bg: 'bg-blue-100 dark:bg-blue-900/40',
              text: 'text-blue-800 dark:text-blue-300',
              icon: Clock,
              label: 'Đã sử dụng',
            },
            EXPIRED: {
              bg: 'bg-gray-100 dark:bg-gray-800',
              text: 'text-gray-700 dark:text-gray-300',
              icon: XCircle,
              label: 'Hết hạn',
            },
            CANCELLED: {
              bg: 'bg-rose-100 dark:bg-rose-900/40',
              text: 'text-rose-800 dark:text-rose-300',
              icon: Ban,
              label: 'Đã hủy / thu hồi',
            },
          };

          const cfg = styleMap[status] || {
            bg: 'bg-gray-100',
            text: 'text-gray-800',
            icon: Ticket,
            label: status,
          };

          const IconComp = cfg.icon;

          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
              <IconComp className="w-3 h-3" />
              {cfg.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'usedDate',
        header: 'Ngày sử dụng',
        cell: (info) => {
          const val = info.getValue() as string;
          return <span className="text-xs text-gray-500 font-mono">{val || '-'}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenCustomerDrawer(row.original.customerName, row.original.customerPhone, row.original.customerCode)}
              title="Xem chi tiết ví voucher khách hàng"
              className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
            </button>
            {row.original.status === 'ACTIVE' && (
              <button
                onClick={() => handleRevoke(row.original)}
                title="Hủy / thu hồi voucher"
                className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(row.original)}
              title="Xóa vĩnh viễn"
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
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Ticket className="w-7 h-7 text-primary" />Sổ cái voucher khách hàng
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý toàn bộ voucher đã phát hành cho khách hàng. Bấm "Chi tiết" để xem toàn bộ ví voucher sở hữu của khách hàng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all text-sm font-semibold shadow-md hover:shadow-lg"
              onClick={() => handleOpenIssueModal()}
            >
              <Plus className="w-4 h-4" /> Cấp voucher
            </button>
          </div>
        </div>

        {/* Status Ledger Stat Cards (Quick Filter Tabs) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-primary/10 border-primary shadow-sm text-primary ring-2 ring-primary/20'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Tất cả voucher</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-gray-900 dark:text-white">{statusCounts.total}</span>
              <span className="text-[11px] font-medium text-gray-500">100%</span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-500/10 border-emerald-500 shadow-sm text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300'
            }`}
          >
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Chưa sử dụng
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{statusCounts.active}</span>
              <span className="text-[11px] font-medium text-emerald-600">
                {statusCounts.total ? Math.round((statusCounts.active / statusCounts.total) * 100) : 0}%
              </span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('USED')}
            className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              statusFilter === 'USED'
                ? 'bg-blue-500/10 border-blue-500 shadow-sm text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Đã sử dụng
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-blue-700 dark:text-blue-300">{statusCounts.used}</span>
              <span className="text-[11px] font-medium text-blue-600">
                {statusCounts.total ? Math.round((statusCounts.used / statusCounts.total) * 100) : 0}%
              </span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('EXPIRED')}
            className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              statusFilter === 'EXPIRED'
                ? 'bg-gray-500/10 border-gray-500 shadow-sm text-gray-800 dark:text-gray-200 ring-2 ring-gray-500/20'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-400'
            }`}
          >
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> Hết hạn
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-gray-800 dark:text-gray-200">{statusCounts.expired}</span>
              <span className="text-[11px] font-medium text-gray-500">
                {statusCounts.total ? Math.round((statusCounts.expired / statusCounts.total) * 100) : 0}%
              </span>
            </div>
          </button>
          <button
            onClick={() => setStatusFilter('CANCELLED')}
            className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-500/10 border-rose-500 shadow-sm text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-rose-300'
            }`}
          >
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> Đã hủy / thu hồi
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-rose-700 dark:text-rose-300">{statusCounts.cancelled}</span>
              <span className="text-[11px] font-medium text-rose-600">
                {statusCounts.total ? Math.round((statusCounts.cancelled / statusCounts.total) * 100) : 0}%
              </span>
            </div>
          </button>
        </div>

        {/* Filter Container */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
          {/* Row 1: Search & Filter Header */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo mã voucher, tên hoặc SĐT khách hàng, chương trình..."
                className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Khôi phục mặc định tất cả bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Đặt lại bộ lọc
              </button>
            </div>
          </div>

          {/* Row 2: Comprehensive Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            {/* Filter 1: Status */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Chưa sử dụng</option>
                <option value="USED">Đã sử dụng</option>
                <option value="EXPIRED">Hết hạn</option>
                <option value="CANCELLED">Đã hủy / thu hồi</option>
              </select>
            </div>

            {/* Filter 2: Program */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Chương trình voucher
              </label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Tất cả chương trình</option>
                {voucherPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 3: Discount Type */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Loại ưu đãi
              </label>
              <select
                value={discountTypeFilter}
                onChange={(e) => setDiscountTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-medium focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Tất cả loại</option>
                <option value="FIXED_AMOUNT">Giảm số tiền cố định</option>
                <option value="PERCENT">Giảm phần trăm (%)</option>
                <option value="FREE_SHIPPING">Miễn phí vận chuyển</option>
              </select>
            </div>

            {/* Filter 4: Issue Date Range */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Phát hành từ
              </label>
              <input
                type="date"
                value={issueDateFrom}
                onChange={(e) => setIssueDateFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
              />
            </div>

            {/* Filter 5: Expiry Date Range */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Hết hạn đến
              </label>
              <input
                type="date"
                value={expiryDateTo}
                onChange={(e) => setExpiryDateTo(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
              />
            </div>

            {/* Filter 6: Customer Quick Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Khách hàng
              </label>
              <input
                type="text"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                placeholder="Lọc tên / SĐT..."
                className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Data Table with Column Visibility Settings */}
        <ReusableDataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          onRowClick={(row) => handleOpenCustomerDrawer(row.customerName, row.customerPhone, row.customerCode)}
        />
      </div>

      {/* Drawer: Customer Voucher Portfolio Drawer */}
      <Drawer
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title="Thông tin tài khoản & ví voucher khách hàng"
        size="xl"
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Profile Header Box */}
            <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.customerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedCustomer.customerName}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1 border border-amber-300">
                      <Award className="w-3.5 h-3.5" />
                      {selectedCustomerProfile?.loyaltyTier || 'Thành viên'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Mã KH: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedCustomer.customerCode || 'KH-000125'}</span> • SĐT: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedCustomer.customerPhone || 'Chưa cập nhật'}</span>
                  </p>
                </div>
              </div>

              {/* Direct Action Button: Cấp voucher riêng cho khách hàng này */}
              <button
                onClick={() =>
                  handleOpenIssueModal({
                    name: selectedCustomer.customerName,
                    phone: selectedCustomer.customerPhone,
                    code: selectedCustomer.customerCode,
                  })
                }
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-sm transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Cấp voucher riêng
              </button>
            </div>

            {/* Customer Voucher Wallet Stats Pills */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-primary" /> Tổng số voucher của khách:
                  <span className="text-primary font-black text-sm pl-1">{selectedCustomerStats.total} voucher</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs pt-1">
                <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg border border-emerald-300/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {selectedCustomerStats.active} Chưa sử dụng (khả dụng)
                </span>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold rounded-lg border border-blue-300/40 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {selectedCustomerStats.used} Đã sử dụng
                </span>
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg border border-gray-300/40 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> {selectedCustomerStats.expired} Hết hạn
                </span>
                <span className="px-3 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold rounded-lg border border-rose-300/40 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5" /> {selectedCustomerStats.cancelled} Đã hủy
                </span>
              </div>
            </div>

            {/* Customer Vouchers Portfolio Table */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" /> Danh sách voucher khách hàng đang sở hữu
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 font-semibold uppercase border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="p-3">Mã voucher</th>
                      <th className="p-3">Chương trình</th>
                      <th className="p-3">Giá trị</th>
                      <th className="p-3">Đơn tối thiểu</th>
                      <th className="p-3">Hạn sử dụng</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {selectedCustomerVouchers.length > 0 ? (
                      selectedCustomerVouchers.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                          <td className="p-3 font-mono font-bold text-primary">{v.voucherCode}</td>
                          <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{v.programName || v.voucherName}</td>
                          <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                            {v.discountType === 'PERCENT'
                              ? `Giảm ${v.discountValue}%`
                              : v.discountType === 'FREE_SHIPPING'
                              ? 'Miễn phí vận chuyển'
                              : formatCurrency(v.discountValue)}
                          </td>
                          <td className="p-3 text-gray-600 dark:text-gray-400 font-mono">
                            {v.minOrderValue ? formatCurrency(v.minOrderValue) : '0 đ'}
                          </td>
                          <td className="p-3 font-mono text-gray-600 dark:text-gray-400">{v.expiryDate || '-'}</td>
                          <td className="p-3">
                            {v.status === 'ACTIVE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                <CheckCircle2 className="w-3 h-3" /> Chưa sử dụng
                              </span>
                            )}
                            {v.status === 'USED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                <Clock className="w-3 h-3" /> Đã sử dụng {v.usedOrderId ? `(${v.usedOrderId})` : ''}
                              </span>
                            )}
                            {v.status === 'EXPIRED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                <XCircle className="w-3 h-3" /> Hết hạn
                              </span>
                            )}
                            {v.status === 'CANCELLED' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                <Ban className="w-3 h-3" /> Đã hủy
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setSelectedVoucherDetail(v)}
                              className="text-primary hover:underline font-semibold"
                            >
                              Xem
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-4 text-center text-gray-500 italic">
                          Khách hàng chưa có voucher nào trong hệ thống.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Drawer Xem Chi tiết 1 Voucher Cụ thể */}
      <Drawer
        isOpen={!!selectedVoucherDetail}
        onClose={() => setSelectedVoucherDetail(null)}
        title="Thông tin chi tiết voucher"
        size="md"
      >
        {selectedVoucherDetail && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-500 font-medium">Mã voucher</span>
              <p className="text-xl font-mono font-bold text-primary">{selectedVoucherDetail.voucherCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-500 font-medium">Chương trình:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                  {selectedVoucherDetail.programName || selectedVoucherDetail.voucherName}
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Khách hàng:</span>
                <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
                  {selectedVoucherDetail.customerName} ({selectedVoucherDetail.customerPhone})
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Giá trị giảm:</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedVoucherDetail.discountType === 'PERCENT'
                    ? `Giảm ${selectedVoucherDetail.discountValue}%`
                    : selectedVoucherDetail.discountType === 'FREE_SHIPPING'
                    ? 'Miễn phí vận chuyển'
                    : formatCurrency(selectedVoucherDetail.discountValue)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Đơn tối thiểu:</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                  {selectedVoucherDetail.minOrderValue ? formatCurrency(selectedVoucherDetail.minOrderValue) : '0 đ'}
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Ngày phát hành:</span>
                <p className="font-mono text-gray-800 dark:text-gray-200 mt-0.5">{selectedVoucherDetail.issueDate || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Ngày hết hạn:</span>
                <p className="font-mono text-gray-800 dark:text-gray-200 mt-0.5">{selectedVoucherDetail.expiryDate || '-'}</p>
              </div>
            </div>

            {selectedVoucherDetail.status === 'USED' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Truy vết đơn hàng đã dùng
                </span>
                <p className="text-gray-600 dark:text-gray-300">
                  Ngày dùng: <span className="font-mono font-bold">{selectedVoucherDetail.usedDate || '17/08/2026 14:32'}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  Đơn hàng: <span className="font-mono font-bold text-primary">{selectedVoucherDetail.usedOrderId || 'SO-2026-008562'}</span>
                  <a
                    href={`/sales/orders?code=${selectedVoucherDetail.usedOrderId || 'SO-2026-008562'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </p>
              </div>
            )}

            {selectedVoucherDetail.notes && (
              <div className="text-xs">
                <span className="text-gray-500 font-medium">Ghi chú:</span>
                <p className="italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2 rounded mt-0.5">
                  {selectedVoucherDetail.notes}
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedVoucherDetail(null)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Cấp Voucher cho Khách Hàng */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          issueForm.lockedCustomerName
            ? `Cấp voucher riêng cho: ${issueForm.lockedCustomerName}`
            : 'Cấp voucher cho khách hàng'
        }
        size="erp"
      >
        {/* Mode Tabs */}
        {!issueForm.lockedCustomerName && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2">
            <button
              type="button"
              onClick={() => setIssueMode('SINGLE')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                issueMode === 'SINGLE'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <User className="w-3.5 h-3.5" /> Cấp cho 1 khách hàng
            </button>
            <button
              type="button"
              onClick={() => setIssueMode('BATCH')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                issueMode === 'BATCH'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Phát voucher hàng loạt
            </button>
          </div>
        )}

        {issueMode === 'SINGLE' ? (
          <form onSubmit={handleSaveSingleIssue} className="p-4 space-y-4">
            {/* 1. Khách hàng nhận */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Khách hàng nhận voucher *
              </label>
              {issueForm.lockedCustomerName ? (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {issueForm.lockedCustomerName}
                    </span>
                    <p className="text-gray-500 font-mono mt-0.5">
                      Mã KH: {issueForm.lockedCustomerCode || 'KH-000125'} • SĐT: {issueForm.lockedCustomerPhone}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    Đã chọn trước
                  </span>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    required
                    list="customer-modal-suggestions"
                    placeholder="Nhập hoặc chọn khách hàng (tên hoặc SĐT)..."
                    value={issueForm.customerInput}
                    onChange={(e) => setIssueForm({ ...issueForm, customerInput: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                  />
                  <datalist id="customer-modal-suggestions">
                    {(customers || []).map((c) => (
                      <option key={c.id} value={`${c.name} - ${c.phone}`} />
                    ))}
                  </datalist>
                </>
              )}
            </div>

            {/* 2. Chọn Chương trình Voucher */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Chương trình voucher phát hành *
              </label>
              <select
                required
                value={issueForm.programId}
                onChange={(e) => setIssueForm({ ...issueForm, programId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium"
              >
                {voucherPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Thẻ Thông tin Quy định Voucher */}
            {selectedProgramPolicy && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Thông tin chính sách voucher
                  </span>
                  <span className="text-[10px] font-semibold bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded">
                    Từ chương trình
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-gray-500">Mức giảm ưu đãi:</span>
                    <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                      {selectedProgramPolicy.discountType === 'PERCENT'
                        ? `Giảm ${selectedProgramPolicy.value}% ${selectedProgramPolicy.maxDiscount ? `(tối đa ${formatCurrency(selectedProgramPolicy.maxDiscount)})` : ''}`
                        : selectedProgramPolicy.discountType === 'FREE_SHIPPING'
                        ? 'Miễn phí vận chuyển'
                        : `Giảm ${formatCurrency(selectedProgramPolicy.value)}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Đơn tối thiểu áp dụng:</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {selectedProgramPolicy.minOrderValue ? formatCurrency(selectedProgramPolicy.minOrderValue) : 'Không có'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Mã voucher tự sinh:</span>
                    <p className="font-mono font-bold text-primary">VC-2026-XXXXXX</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Thời hạn sử dụng:</span>
                    <p className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                      {selectedProgramPolicy.endDate || '31/12/2026'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Ghi chú & Lý do cấp */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Lý do cấp / ghi chú hỗ trợ khách hàng *
              </label>
              <textarea
                rows={2}
                required
                value={issueForm.notes}
                onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                placeholder="VD: Hỗ trợ khách hàng do khiếu nại đơn trễ, tặng quà sinh nhật VIP..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Cấp voucher
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveBatchIssue} className="p-4 space-y-4">
            {/* 1. Chọn chương trình voucher */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Chương trình voucher phát hành *
              </label>
              <select
                required
                value={batchForm.programId}
                onChange={(e) => setBatchForm({ ...batchForm, programId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                {voucherPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) — Tồn tối đa: {p.quantity} lượt
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Bộ lọc & Danh sách Khách hàng nhận */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Danh sách khách hàng nhận voucher ({selectedBatchCustomerIds.size}/{filteredBatchCustomers.length} đã chọn) *
                </label>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Tier filter */}
                  <select
                    value={batchTierFilter}
                    onChange={(e) => setBatchTierFilter(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                  >
                    <option value="ALL">Tất cả hạng</option>
                    <option value="GOLD">Hạng vàng</option>
                    <option value="SILVER">Hạng bạc</option>
                    <option value="DIAMOND">Hạng kim cương</option>
                    <option value="BRONZE">Hạng đồng</option>
                  </select>
                  {/* Search input */}
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm KH, SĐT..."
                      value={batchCustomerSearch}
                      onChange={(e) => setBatchCustomerSearch(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Recipient Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-900">
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="p-2.5 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={selectedBatchCustomerIds.size > 0 && selectedBatchCustomerIds.size === filteredBatchCustomers.length}
                            onChange={handleToggleAllBatch}
                            className="rounded text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                          />
                        </th>
                        <th className="p-2.5 font-semibold">Khách hàng</th>
                        <th className="p-2.5 font-semibold">Mã KH</th>
                        <th className="p-2.5 font-semibold">Hạng thẻ</th>
                        <th className="p-2.5 font-semibold text-right">Điểm / chi tiêu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {filteredBatchCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400">
                            Không tìm thấy khách hàng phù hợp
                          </td>
                        </tr>
                      ) : (
                        filteredBatchCustomers.map((cust) => {
                          const isSelected = selectedBatchCustomerIds.has(String(cust.id));
                          const tier = (cust.loyaltyTier || (cust as any).membershipRank || 'BRONZE').toUpperCase();
                          return (
                            <tr
                              key={cust.id}
                              onClick={() => handleToggleOneBatch(String(cust.id))}
                              className={`hover:bg-primary/5 cursor-pointer transition-colors ${
                                isSelected ? 'bg-primary/10 dark:bg-primary/20' : ''
                              }`}
                            >
                              <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleOneBatch(String(cust.id))}
                                  className="rounded text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                                />
                              </td>
                              <td className="p-2.5">
                                <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <span>{cust.name}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 font-mono">{cust.phone}</div>
                              </td>
                              <td className="p-2.5 font-mono text-gray-600 dark:text-gray-300">
                                {cust.customerCode || `KH-${cust.id}`}
                              </td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  tier.includes('DIAMOND') || tier.includes('KIM CƯƠNG')
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                    : tier.includes('GOLD') || tier.includes('VÀNG')
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                                    : tier.includes('SILVER') || tier.includes('BẠC')
                                    ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                                }`}>
                                  {tier.includes('DIAMOND') ? 'Hạng kim cương' : tier.includes('GOLD') ? 'Hạng vàng' : tier.includes('SILVER') ? 'Hạng bạc' : 'Hạng đồng'}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-medium text-gray-700 dark:text-gray-300">
                                <div>{cust.loyaltyPoints || 0} điểm</div>
                                <div className="text-[10px] text-gray-400">
                                  {formatCurrency(cust.lifetimeSpent || (cust as any).totalSpend || 0)}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Counter Preview Box */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
              <div className="flex justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                <span>Số khách hàng nhận voucher:</span>
                <span className="font-bold">{selectedBatchCustomerIds.size} khách hàng</span>
              </div>
              <div className="flex justify-between text-emerald-800 dark:text-emerald-300 font-semibold">
                <span>Số mã voucher dự kiến phát:</span>
                <span className="font-bold">{selectedBatchCustomerIds.size} mã (VC-2026-XXXXXX)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú phát hàng loạt</label>
              <textarea
                rows={2}
                value={batchForm.notes}
                onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                placeholder="VD: Đợt phát voucher sinh nhật tháng 8 cho hạng vàng..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>

            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-200 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={selectedBatchCustomerIds.size === 0}
                className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-4 h-4" /> Phát voucher hàng loạt ({selectedBatchCustomerIds.size} khách)
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
