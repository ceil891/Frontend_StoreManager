import { useState, useMemo, useEffect } from 'react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { exportToCsv } from '@/shared/utils/exportCsv';
import { Modal } from '@/shared/components/ui/Modal';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { AddressCascadeSelect } from '@/shared/components/ui/AddressCascadeSelect';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Eye, ShoppingBag, CreditCard, Clock, CheckCircle2, FileText, User, Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSalesStore, type SaleOrder, BRANCH_NAME_BY_ID, calcTotalAmount, formatMoney } from '../store/salesStore';
import { resolveCustomerName, WALK_IN_CUSTOMER_ID } from '../store/salesHelpers';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { usePermission } from '@/shared/hooks/usePermission';
import { OrderLinesEditor, sumOrderLines, summarizeOrderLines } from '@/shared/components/sales/OrderLinesEditor';
import { CustomerSelect } from '@/shared/components/sales/CustomerSelect';
import { OrderPricingFields } from '@/shared/components/sales/OrderPricingFields';

const ORIGIN_LABEL: Record<NonNullable<SaleOrder['origin']>, string> = {
  POS: 'POS',
  ONLINE: 'Online',
  MANUAL: 'Nhập tay',
};

const paymentMethodMap: Record<string, string> = {
  'Cash': 'Tiền mặt',
  'Credit Card': 'Thẻ tín dụng',
  'Bank Transfer': 'Chuyển khoản',
  'Apple Pay': 'Ví điện tử',
};

function formatOrderTotal(o: SaleOrder): string {
  return formatMoney(o.totalAmount, 'VND');
}

export function SaleOrdersPage() {
  const { saleOrders: data, addSaleOrder, updateSaleOrder, deleteSaleOrder, fetchSaleOrders } = useSalesStore();

  const customers = useCrmStore((s) => s.customers);
  const customerLabel = (id: string, name?: string) => resolveCustomerName(id, customers, name);
  const canManage = usePermission('sales:orders:create');
  const storeOrders = useMemo(() => {
    const list = data.filter((o) => o.origin !== 'ONLINE');
    return list.length > 0 ? list : data;
  }, [data]);

  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingOrder, setEditingOrder] = useState<Partial<SaleOrder>>({});
  const [deletingOrder, setDeletingOrder] = useState<SaleOrder | null>(null);
  const [deletingBulkOrders, setDeletingBulkOrders] = useState<{ rows: SaleOrder[], clear: () => void } | null>(null);

  // Fetch real data & manage loading state
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchSaleOrders();
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchSaleOrders]);

  const filtered = useMemo(() => {
    return storeOrders.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      
      if (paymentStatusFilter !== 'all' && item.paymentStatus !== paymentStatusFilter) {
        return false;
      }
      
      if (fromDate && item.date) {
        try {
          const itemDate = new Date(item.date.replace(' ', 'T'));
          itemDate.setHours(0, 0, 0, 0);
          const filterDate = new Date(fromDate);
          filterDate.setHours(0, 0, 0, 0);
          if (!isNaN(itemDate.getTime()) && !isNaN(filterDate.getTime()) && itemDate < filterDate) return false;
        } catch {}
      }
      
      if (toDate && item.date) {
        try {
          const itemDate = new Date(item.date.replace(' ', 'T'));
          itemDate.setHours(0, 0, 0, 0);
          const filterDate = new Date(toDate);
          filterDate.setHours(0, 0, 0, 0);
          if (!isNaN(itemDate.getTime()) && !isNaN(filterDate.getTime()) && itemDate > filterDate) return false;
        } catch {}
      }

      return matchesStatus;
    });
  }, [storeOrders, statusFilter, paymentStatusFilter, fromDate, toDate]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingOrder({
      code: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: WALK_IN_CUSTOMER_ID,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      subTotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 0,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'Cash',
      cashier: 'System Admin',
      createdByName: 'System Admin',
      createdByEmail: 'admin@system.local',
      branchId: 'BR-001',
      branchName: BRANCH_NAME_BY_ID['BR-001'],
      origin: 'MANUAL',
      currency: 'VND',
      orderLines: [],
    });
    setIsModalOpen(true);
  };

  const applyOrderLines = (lines: NonNullable<SaleOrder['orderLines']>) => {
    const subTotal = sumOrderLines(lines);
    setEditingOrder((prev) => {
      const taxAmount = prev.taxAmount ?? 0;
      const discountAmount = prev.discountAmount ?? 0;
      return {
        ...prev,
        orderLines: lines,
        subTotal,
        totalAmount: calcTotalAmount({ subTotal, taxAmount, discountAmount, shippingFee: prev.shippingFee }),
        itemsSummary: summarizeOrderLines(lines),
      };
    });
  };

  const handleOpenEdit = (order: SaleOrder) => {
    setModalMode('edit');
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder.customerId || !editingOrder.code) return;

    const lines = editingOrder.orderLines ?? [];
    const lineTotal = sumOrderLines(lines);
    const subTotal = lines.length ? lineTotal : Number(editingOrder.subTotal) || 0;
    const taxAmount = Number(editingOrder.taxAmount) || 0;
    const discountAmount = Number(editingOrder.discountAmount) || 0;
    const totalAmount = calcTotalAmount({ subTotal, taxAmount, discountAmount, shippingFee: editingOrder.shippingFee });
    const payload = {
      orderLines: lines,
      subTotal,
      taxAmount,
      discountAmount,
      totalAmount,
      itemsSummary: summarizeOrderLines(lines) || editingOrder.itemsSummary,
    };

    if (modalMode === 'create') {
      const newOrder: Omit<SaleOrder, 'id'> = {
        code: editingOrder.code,
        customerId: editingOrder.customerId,
        date: editingOrder.date || new Date().toISOString().slice(0, 16).replace('T', ' '),
        ...payload,
        status: editingOrder.status as any || 'PENDING',
        paymentStatus: editingOrder.paymentStatus as any || 'UNPAID',
        paymentMethod: editingOrder.paymentMethod || 'Cash',
        cashier: editingOrder.cashier || 'System Admin',
        createdByName: editingOrder.createdByName || editingOrder.cashier || 'System Admin',
        createdByEmail: editingOrder.createdByEmail,
        branchId: editingOrder.branchId ?? 'BR-001',
        branchName: editingOrder.branchName || (editingOrder.branchId ? (BRANCH_NAME_BY_ID[String(editingOrder.branchId)] ?? String(editingOrder.branchId)) : BRANCH_NAME_BY_ID['BR-001']),
        origin: (editingOrder.origin as SaleOrder['origin']) || 'MANUAL',
        currency: (editingOrder.currency as SaleOrder['currency']) || 'VND',
      };
      addSaleOrder(newOrder);
      toast.success(`Đã tạo đơn hàng ${newOrder.code} thành công!`);
    } else if (editingOrder.id) {
      updateSaleOrder(editingOrder.id, { ...editingOrder, ...payload });
      toast.success(`Đã cập nhật đơn hàng ${editingOrder.code} thành công!`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingOrder) return;
    deleteSaleOrder(deletingOrder.id);
    toast.success(`Đã xóa đơn hàng ${deletingOrder.code}`);
    setDeletingOrder(null);
  };

  const handleBulkDeleteConfirm = () => {
    if (!deletingBulkOrders) return;
    const { rows, clear } = deletingBulkOrders;
    const ids = rows.map(r => r.id);
    ids.forEach(id => deleteSaleOrder(id));
    toast.success(`Đã xóa ${ids.length} đơn hàng`);
    clear();
    setDeletingBulkOrders(null);
  };

  const handleExportCsv = () => {
    if (data.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    exportToCsv('danh-sach-don-hang', data, [
      { header: 'Mã đơn', accessor: (row) => row.code },
      { header: 'Khách hàng', accessor: (row) => customerLabel(row.customerId) },
      { header: 'Tổng tiền', accessor: (row) => row.totalAmount },
      { header: 'Thời gian', accessor: (row) => row.date ? new Date(row.date.replace(' ', 'T')).toLocaleString('vi-VN') : '' },
      { header: 'Chi nhánh', accessor: (row) => row.branchId || '' },
      { header: 'Nguồn', accessor: (row) => row.origin || '' },
      { header: 'Thanh toán', accessor: (row) => row.paymentStatus },
      { header: 'Giao hàng', accessor: (row) => row.deliveryStatus || '' },
      { header: 'Trạng thái', accessor: (row) => row.status },
    ]);
    toast.success('Đã Xuất File CSV');
  };

  const columns = useMemo<ColumnDef<SaleOrder>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
          />
        ),
        meta: { align: 'center' }
      },
      {
        id: 'stt',
        header: 'STT',
        cell: (info) => <span className="text-gray-500 font-medium">{info.row.index + 1}</span>,
        meta: { align: 'center' }
      },
      {
        accessorKey: 'code',
        header: 'Mã đơn hàng',
        cell: (info) => <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'origin',
        header: 'Nguồn',
        cell: ({ row }) => {
          const origin = row.original.origin ?? 'MANUAL';
          return (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
              origin === 'POS'
                ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800'
                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
            }`}>
              {ORIGIN_LABEL[origin] ?? origin}
            </span>
          );
        },
        meta: { align: 'center' }
      },
      {
        accessorKey: 'branchName',
        header: 'Cửa hàng',
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            {row.original.branchName || (row.original.branchId ? (BRANCH_NAME_BY_ID[String(row.original.branchId)] ?? String(row.original.branchId)) : 'N/A')}
          </span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Ngày tạo',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: ({ row }) => <span className="text-sm font-medium">{customerLabel(row.original.customerId, row.original.customerName)}</span>,
      },
      {
        accessorKey: 'createdByName',
        header: 'Người tạo',
        cell: ({ row }) => (
          <span className="text-sm text-gray-700 dark:text-gray-200">
            {row.original.createdByName || row.original.cashier || 'N/A'}
          </span>
        ),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng tiền',
        cell: (info) => {
          const row = info.row.original as SaleOrder;
          return <span className="font-bold text-gray-900 dark:text-white">{formatOrderTotal(row)}</span>;
        },
        meta: { align: 'right' }
      },
      {
        accessorKey: 'paymentStatus',
        header: 'Thanh toán',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            </span>
          );
        },
        meta: { align: 'center' }
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
              status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300' :
              status === 'PENDING' ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300' :
              'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
            }`}>
              {status === 'COMPLETED' ? 'Hoàn thành' : status === 'PENDING' ? 'Đang xử lý' : 'Đã hủy'}
            </span>
          );
        },
        meta: { align: 'center' }
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedOrder(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canManage && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
                title="Chỉnh sửa"
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canManage && (
              <button 
                onClick={(e) => { e.stopPropagation(); setDeletingOrder(row.original); }}
                title="Xóa"
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
        meta: { align: 'center' }
      }
    ],
    [canManage, customers]
  );

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn bán hàng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Đơn POS và nhập tay tại cửa hàng. Đơn online xem tại mục Đơn hàng Online.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-semibold shadow-sm hover:shadow active:scale-95 whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              Xuất Dữ Liệu
            </button>
            {canManage && (
              <button onClick={handleOpenCreate} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full transition-all text-sm font-bold shadow hover:shadow-lg active:scale-95 whitespace-nowrap shrink-0">
                <Plus className="w-4 h-4" />
                Tạo Đơn Hàng Mới
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Removed custom search input as it is now inside ReusableDataTable */}

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái đơn:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="PENDING">Đang xử lý</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Thanh toán:</span>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="PARTIALLY_PAID">Thanh toán một phần</option>
                <option value="UNPAID">Chưa thanh toán</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Từ:</span>
              <input 
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Đến:</span>
              <input 
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              />
            </div>

            {(statusFilter !== 'all' || paymentStatusFilter !== 'all' || fromDate || toDate) && (
              <button
                onClick={() => { setStatusFilter('all'); setPaymentStatusFilter('all'); setFromDate(''); setToDate(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Data Table */}
        <ReusableDataTable
          columns={columns}
          data={filtered}
          isLoading={isLoading}
          globalFilterPlaceholder="Tìm kiếm đơn hàng, khách hàng..."
          onRowClick={(row) => setSelectedOrder(row)}
          bulkActions={(selectedRows, clearSelection) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  exportToCsv('don-hang-da-chon', selectedRows, [
                    { header: 'Mã đơn', accessor: (row) => row.code },
                    { header: 'Khách hàng', accessor: (row) => customerLabel(row.customerId, row.customerName) },
                    { header: 'Tổng tiền', accessor: (row) => row.totalAmount },
                    { header: 'Ngày tạo', accessor: (row) => row.date },
                    { header: 'Thanh toán', accessor: (row) => row.paymentStatus },
                    { header: 'Trạng thái', accessor: (row) => row.status },
                  ]);
                  toast.success(`Đã xuất ${selectedRows.length} đơn hàng sang Excel`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Xuất Excel ({selectedRows.length})
              </button>

              <button 
                onClick={() => setDeletingBulkOrders({ rows: selectedRows, clear: clearSelection })}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 rounded-md text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa đã chọn ({selectedRows.length})
              </button>

              <button
                onClick={clearSelection}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-semibold underline ml-1 cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          )}
        />
      </div>

      {/* Order Details Modal */}
      <Modal 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Chi tiết đơn hàng: ${selectedOrder.code}` : 'Tóm tắt đơn hàng'}
        width="max-w-lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Tổng giá trị đơn</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatOrderTotal(selectedOrder)}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedOrder.status === 'COMPLETED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedOrder.status === 'PENDING' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedOrder.status === 'COMPLETED' ? 'Hoàn thành' : selectedOrder.status === 'PENDING' ? 'Đang xử lý' : 'Đã hủy'}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Khách hàng
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{customerLabel(selectedOrder.customerId, selectedOrder.customerName)}</p>
                <p className="text-[10px] font-mono text-gray-400">ID: {selectedOrder.customerId}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Thanh toán
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {selectedOrder.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'} ({paymentMethodMap[selectedOrder.paymentMethod || ''] || selectedOrder.paymentMethod || 'N/A'})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Cửa hàng
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {selectedOrder.branchName || (selectedOrder.branchId ? (BRANCH_NAME_BY_ID[String(selectedOrder.branchId)] ?? String(selectedOrder.branchId)) : 'N/A')}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <User className="w-4 h-4 text-blue-500" /> Người tạo
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {selectedOrder.createdByName || selectedOrder.cashier || 'N/A'}
                </p>
                {selectedOrder.createdByEmail && (
                  <p className="text-xs text-gray-500 font-mono mt-0.5 truncate">{selectedOrder.createdByEmail}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Tiền hàng</span><span className="font-mono">{formatMoney(selectedOrder.subTotal, 'VND')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Thuế / giảm</span><span className="font-mono">+{formatMoney(selectedOrder.taxAmount, 'VND')} / −{formatMoney(selectedOrder.discountAmount, 'VND')}</span></div>
              {selectedOrder.origin === 'POS' && selectedOrder.shiftId && (
                <div className="flex justify-between"><span className="text-gray-500">Ca làm việc</span><span className="font-mono text-xs">{selectedOrder.shiftId}</span></div>
              )}
              {selectedOrder.origin === 'POS' && selectedOrder.amountTendered != null && (
                <div className="flex justify-between"><span className="text-gray-500">Khách đưa / Thối</span><span className="font-mono">{formatMoney(selectedOrder.amountTendered, 'VND')} / {formatMoney(selectedOrder.changeAmount ?? 0, 'VND')}</span></div>
              )}
            </div>

            {selectedOrder.origin === 'POS' && selectedOrder.itemsSummary && (
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Chi tiết POS</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">{selectedOrder.itemsSummary}</p>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trạng thái đơn hàng</h3>
              <div className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-6 ml-2">
                <div className="relative">
                  <div className="absolute -left-[31px] p-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                    <Clock className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Đã khởi tạo đơn hàng</p>
                  <p className="text-xs text-gray-500 mt-0.5">Khởi tạo lúc {selectedOrder.date} bởi {selectedOrder.cashier || 'Hệ thống POS'}</p>
                </div>

                {selectedOrder.paymentStatus === 'PAID' && (
                  <div className="relative">
                    <div className="absolute -left-[31px] p-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Xác nhận thanh toán</p>
                    <p className="text-xs text-gray-500 mt-0.5">Phương thức: {paymentMethodMap[selectedOrder.paymentMethod || ''] || selectedOrder.paymentMethod || 'N/A'} — Mã giao dịch: TXN-{Math.floor(Math.random() * 80000 + 10000)}</p>
                  </div>
                )}

                {selectedOrder.status === 'COMPLETED' && (
                  <div className="relative">
                    <div className="absolute -left-[31px] p-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Hoàn tất giao dịch</p>
                    <p className="text-xs text-gray-500 mt-0.5">Đã bàn giao sản phẩm trực tiếp tại quầy thanh toán.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button 
                onClick={() => {
                  toast.success(`Đang gửi lệnh in hóa đơn nhiệt cho đơn hàng ${selectedOrder.code}...`);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <FileText className="w-4 h-4" /> In hóa đơn nhiệt (K80)
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo Đơn Hàng mới' : 'Cập nhật đơn hàng'}
        size="erp"
      >
        <form onSubmit={handleSaveOrder}>
          <div className="erp-form-body">
            {/* Section 1: Thông tin chung & Sản phẩm */}
            <div className="erp-form-section space-y-4" style={{ gridColumn: 'span 2' }}>
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Thông tin chung đơn hàng</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn hàng (SO) *</label>
                  <input
                    type="text"
                    value={editingOrder.code || ''}
                    onChange={(e) => setEditingOrder({ ...editingOrder, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng (CRM) *</label>
                  <SearchLookupModal
                    title="Chọn Khách Hàng"
                    iconType="user"
                    placeholder="Chọn khách hàng..."
                    value={editingOrder.customerId}
                    options={[
                      { id: 'CUST-001', code: 'CUST-001', name: 'Nguyễn Văn An', subtitle: 'SĐT: 0901234567 - VIP Gold' },
                      { id: 'CUST-002', code: 'CUST-002', name: 'Công ty TNHH Minh Phát', subtitle: 'MST: 0312456789 - Khách DN' },
                      { id: 'CUST-003', code: 'CUST-003', name: 'Trần Thị Bình', subtitle: 'SĐT: 0918889999 - Thường' },
                    ]}
                    onChange={(val) => setEditingOrder(prev => ({ ...prev, customerId: val }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh / Quầy xuất hàng *</label>
                  <SearchLookupModal
                    title="Chọn Chi Nhánh Xuất Hàng"
                    iconType="location"
                    placeholder="Chọn chi nhánh..."
                    value={String(editingOrder.branchId || '')}
                    options={[
                      { id: '1', code: 'STORE-HQ', name: 'Chi nhánh Flagship Q1 (TP.HCM)' },
                      { id: '2', code: 'STORE-HN', name: 'Chi nhánh Cầu Giấy (Hà Nội)' },
                      { id: '3', code: 'STORE-DN', name: 'Chi nhánh Hải Châu (Đà Nẵng)' },
                    ]}
                    onChange={(val) => setEditingOrder(prev => ({ ...prev, branchId: val }))}
                  />
                </div>
              </div>

              <div>
                <AddressCascadeSelect
                  label="Địa chỉ giao hàng (Delivery Address)"
                />
              </div>

              <OrderLinesEditor
                lines={editingOrder.orderLines ?? []}
                currency="VND"
                onChange={applyOrderLines}
              />

              <div>
                <FileDropzone
                  label="Tệp đính kèm Đơn đặt hàng / Hợp đồng mua bán (PO/DOC)"
                />
              </div>
            </div>

            {/* Section 2: Giá trị, Thanh toán & Trạng thái */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Thanh toán & Trạng thái</h3>
              
              <OrderPricingFields
                currency="VND"
                values={{
                  subTotal: editingOrder.subTotal ?? 0,
                  taxAmount: editingOrder.taxAmount ?? 0,
                  discountAmount: editingOrder.discountAmount ?? 0,
                  totalAmount: editingOrder.totalAmount ?? 0,
                }}
                onChange={(patch) => setEditingOrder((prev) => ({ ...prev, ...patch }))}
              />

              {editingOrder.origin === 'POS' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách đưa (Tendered)</label>
                    <input
                      type="text"
                      value={(editingOrder.amountTendered ?? 0) === 0 ? '' : Math.round(editingOrder.amountTendered ?? 0).toLocaleString('vi-VN')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const parsed = digits === '' ? 0 : parseInt(digits, 10);
                        setEditingOrder({ ...editingOrder, amountTendered: parsed });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tiền thối</label>
                    <input
                      type="text"
                      value={(editingOrder.changeAmount ?? 0) === 0 ? '' : Math.round(editingOrder.changeAmount ?? 0).toLocaleString('vi-VN')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        const parsed = digits === '' ? 0 : parseInt(digits, 10);
                        setEditingOrder({ ...editingOrder, changeAmount: parsed });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Shift ID</label>
                    <input
                      type="text"
                      value={editingOrder.shiftId ?? ''}
                      onChange={(e) => setEditingOrder({ ...editingOrder, shiftId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày tạo</label>
                <input
                  type="text"
                  value={editingOrder.date || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái đơn</label>
                  <select
                    value={editingOrder.status || 'PENDING'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PENDING">Đang xử lý</option>
                    <option value="COMPLETED">Hoàn thành</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thanh toán</label>
                  <select
                    value={editingOrder.paymentStatus || 'UNPAID'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, paymentStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="UNPAID">Chưa thanh toán</option>
                    <option value="PAID">Đã thanh toán</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phương thức</label>
                  <select
                    value={editingOrder.paymentMethod || 'Cash'}
                    onChange={(e) => setEditingOrder({ ...editingOrder, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cash">Tiền mặt</option>
                    <option value="Credit Card">Thẻ tín dụng</option>
                    <option value="Bank Transfer">Chuyển khoản</option>
                    <option value="Apple Pay">Ví điện tử</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="erp-form-footer">
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingOrder}
        onClose={() => setDeletingOrder(null)}
        title="Xác nhận xóa đơn hàng"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa đơn hàng <strong className="text-gray-900 dark:text-white">{deletingOrder?.code}</strong> của khách <strong className="text-gray-900 dark:text-white">{deletingOrder ? customerLabel(deletingOrder.customerId) : ''}</strong> không?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setDeletingOrder(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Xóa đơn hàng
            </button>
          </div>
        </div>
      </Modal>
      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingBulkOrders}
        onClose={() => setDeletingBulkOrders(null)}
        title="Xác nhận xóa hàng loạt"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa <strong className="text-gray-900 dark:text-white">{deletingBulkOrders?.rows.length}</strong> đơn hàng đã chọn không? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingBulkOrders(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Xóa {deletingBulkOrders?.rows.length} đơn hàng
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
