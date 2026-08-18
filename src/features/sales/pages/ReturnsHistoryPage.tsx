import { useMemo, useState, useEffect } from 'react';
import {
  Search,
  Eye,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Printer,
  RotateCcw,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  DollarSign,
  User,
  CreditCard,
  Layers,
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type CustomerReturnItem, formatMoney, BRANCH_NAME_BY_ID } from '../store/salesStore';
import { resolveCustomerName, type RefundMethod } from '../store/salesHelpers';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { toast } from 'sonner';

const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  STORE_CREDIT: 'Ví / Store credit',
  ORIGINAL_CARD: 'Hoàn thẻ gốc',
};

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  DRAFT: { label: 'Nháp', style: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  PENDING_RECEIPT: { label: 'Chờ nhận hàng', style: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  PENDING_INSPECTION: { label: 'Đang kiểm tra', style: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  INSPECTING: { label: 'Đang kiểm tra', style: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  APPROVED: { label: 'Đã duyệt', style: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  STOCK_IN: { label: 'Đã nhập kho WMS', style: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' },
  REFUNDED: { label: 'Đã hoàn tiền & Nhập kho', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  COMPLETED: { label: 'Đã hoàn thành', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  REJECTED: { label: 'Từ chối', style: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
};

export function ReturnsHistoryPage() {
  const customers = useCrmStore((s) => s.customers);
  const fetchCustomers = useCrmStore((s) => s.fetchCustomers);
  const { branches, fetchBranches } = useBranchStore();
  const { customerReturns, fetchCustomerReturns } = useSalesStore();

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedRefundMethod, setSelectedRefundMethod] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [viewingDetail, setViewingDetail] = useState<CustomerReturnItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchCustomerReturns(), fetchCustomers(), fetchBranches()]);
    } catch (err) {
      console.error(err);
      toast.error('Không thể nạp lịch sử khách trả hàng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return customerReturns.filter((item) => {
      // Search text
      if (search) {
        const q = search.toLowerCase().trim();
        const codeMatch = item.returnCode.toLowerCase().includes(q);
        const orderMatch = (item.orderCode || '').toLowerCase().includes(q);
        const reqMatch = (item.returnRequestCode || '').toLowerCase().includes(q);
        const custName = resolveCustomerName(item.customerId, customers).toLowerCase();
        const custMatch = custName.includes(q);
        if (!codeMatch && !orderMatch && !reqMatch && !custMatch) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;

      // Branch filter
      if (selectedBranch !== 'ALL' && String(item.returnBranchId || '') !== selectedBranch) return false;

      // Refund method filter
      if (selectedRefundMethod !== 'ALL' && item.refundMethod !== selectedRefundMethod) return false;

      // Date range filter
      if (fromDate && item.returnDate < fromDate) return false;
      if (toDate && item.returnDate > toDate) return false;

      return true;
    });
  }, [customerReturns, search, selectedStatus, selectedBranch, selectedRefundMethod, fromDate, toDate, customers]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = filteredData.length;
    const totalRefund = filteredData.reduce((sum, i) => sum + (i.refundAmount || 0), 0);
    const completedCount = filteredData.filter((i) => i.status === 'REFUNDED' || i.status === 'COMPLETED').length;
    const pendingCount = filteredData.filter((i) => i.status === 'PENDING_RECEIPT' || i.status === 'PENDING_INSPECTION').length;

    return { totalCount, totalRefund, completedCount, pendingCount };
  }, [filteredData]);

  const columns = useMemo<ColumnDef<CustomerReturnItem>[]>(
    () => [
      {
        accessorKey: 'returnCode',
        header: 'Mã hoàn trả',
        cell: (info) => (
          <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'orderCode',
        header: 'Đơn gốc',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="text-xs space-y-0.5">
              <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                {item.orderCode || '—'}
              </span>
              {item.returnRequestCode && (
                <div className="text-[11px] text-purple-600 dark:text-purple-400">
                  Req: {item.returnRequestCode}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'customerId',
        header: 'Khách hàng',
        cell: ({ row }) => {
          const item = row.original;
          const custName = resolveCustomerName(item.customerId, customers);
          const matchedCust = customers.find((c) => String(c.id) === String(item.customerId));
          return (
            <div>
              <div className="font-bold text-gray-900 dark:text-white text-xs">{custName}</div>
              {matchedCust?.phone && (
                <div className="text-[11px] text-gray-500 dark:text-gray-400">{matchedCust.phone}</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'returnDate',
        header: 'Ngày trả',
        cell: (info) => (
          <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'refundAmount',
        header: 'Số tiền hoàn',
        cell: ({ row }) => {
          const amount = row.original.refundAmount || 0;
          return (
            <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
              {formatMoney(amount, 'VND')}
            </div>
          );
        },
      },
      {
        accessorKey: 'refundMethod',
        header: 'Hình thức hoàn',
        cell: (info) => {
          const m = (info.getValue() as RefundMethod) || 'CASH';
          return (
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {REFUND_METHOD_LABELS[m] || m}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const st = info.getValue() as string;
          const cfg = STATUS_CONFIG[st] || { label: st, style: 'bg-gray-100 text-gray-700' };
          return (
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg.style}`}>
              {cfg.label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <button
              type="button"
              onClick={() => setViewingDetail(item)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs flex items-center gap-1 font-medium transition-colors"
              title="Xem chi tiết phiếu hoàn trả"
            >
              <Eye className="w-4 h-4 text-blue-600" />
            </button>
          );
        },
      },
    ],
    [customers]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            Lịch sử khách trả hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Tra cứu và giám sát toàn bộ lịch sử đổi trả hàng, hoàn tiền và nhập kho từ khách hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-xs rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tổng phiếu trả hàng</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.totalCount}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tổng tiền đã hoàn</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {formatMoney(stats.totalRefund, 'VND')}
            </h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đã hoàn thành</p>
            <h3 className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">{stats.completedCount}</h3>
          </div>
          <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/40 text-teal-600 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đang chờ xử lý</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pendingCount}</h3>
          </div>
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filters & Data Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Mã hoàn trả, Đơn gốc, Yêu cầu, Khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING_RECEIPT">Chờ nhận hàng</option>
              <option value="PENDING_INSPECTION">Đang kiểm tra</option>
              <option value="STOCK_IN">Đã nhập kho WMS</option>
              <option value="REFUNDED">Đã hoàn tiền & Nhập kho</option>
              <option value="REJECTED">Từ chối</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
            >
              <option value="ALL">Tất cả chi nhánh</option>
              {branches.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
              title="Từ ngày"
            />
          </div>

          {/* To Date */}
          <div>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium"
              title="Đến ngày"
            />
          </div>
        </div>

        {/* Data Table */}
        <ReusableDataTable
          data={filteredData}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(row) => setViewingDetail(row)}
        />
      </div>

      {/* DETAIL MODAL (READ ONLY) */}
      {viewingDetail && (
        <Modal
          isOpen={!!viewingDetail}
          onClose={() => setViewingDetail(null)}
          title={`📌 CHI TIẾT PHIẾU HOÀN TRẢ: ${viewingDetail.returnCode}`}
          width="max-w-4xl"
        >
          <div className="space-y-6 text-xs">
            {/* Top Summary Box */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <span className="text-gray-400 block text-[11px]">Mã hoàn trả</span>
                <span className="font-mono font-bold text-blue-600 text-sm">{viewingDetail.returnCode}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Đơn bán gốc</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{viewingDetail.orderCode || '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Mã Yêu cầu</span>
                <span className="font-mono font-bold text-purple-600">{viewingDetail.returnRequestCode || '— (Trực tiếp)'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[11px]">Ngày trả</span>
                <span className="font-mono font-semibold">{viewingDetail.returnDate}</span>
              </div>
            </div>

            {/* Customer & Warehouse Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/20 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900">
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" /> Thông tin khách hàng
                </h4>
                <p><strong>Họ & Tên:</strong> {resolveCustomerName(viewingDetail.customerId, customers)}</p>
                <p className="mt-1">
                  <strong>Số điện thoại:</strong> {customers.find((c) => String(c.id) === String(viewingDetail.customerId))?.phone || 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" /> Kho nhận & Người xử lý
                </h4>
                <p>
                  <strong>Chi nhánh kho:</strong>{' '}
                  {BRANCH_NAME_BY_ID[viewingDetail.returnBranchId || '1'] || 'Chi nhánh chính'}
                </p>
                <p className="mt-1">
                  <strong>Người tạo / Kiểm tra:</strong> {viewingDetail.inspector || viewingDetail.createdBy || 'Hệ thống'}
                </p>
              </div>
            </div>

            {/* Returned Products Table */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-gray-600" /> Chi tiết danh sách sản phẩm thực trả
              </h4>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold border-b">
                      <th className="p-2.5">Sản phẩm / SKU</th>
                      <th className="p-2.5 text-center">SL Thực trả</th>
                      <th className="p-2.5 text-right">Đơn giá</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(viewingDetail.returnLines || []).map((line, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="p-2.5">
                          <div className="font-bold text-gray-900 dark:text-white">{line.productName}</div>
                          <div className="font-mono text-[11px] text-gray-400">{line.sku}</div>
                        </td>
                        <td className="p-2.5 text-center font-bold text-blue-600">{line.quantity}</td>
                        <td className="p-2.5 text-right font-mono">{formatMoney(line.price, 'VND')}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-600 font-mono">
                          {formatMoney(line.subTotal || line.quantity * line.price, 'VND')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 bg-emerald-50/20 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900 flex justify-between items-center">
              <div>
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">Hình thức hoàn tiền</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {REFUND_METHOD_LABELS[viewingDetail.refundMethod as RefundMethod] || viewingDetail.refundMethod}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">Tổng tiền hoàn trả khách</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatMoney(viewingDetail.refundAmount, 'VND')}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-between items-center pt-3 border-t">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> In phiếu hoàn trả
              </button>
              <button
                type="button"
                onClick={() => setViewingDetail(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
