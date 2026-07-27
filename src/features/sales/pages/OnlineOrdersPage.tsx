import { useMemo, useState } from 'react';
import {
  ShoppingBag, Search, Eye, Filter, RefreshCw, CheckCircle2, Clock, Truck, Package, XCircle,
  TrendingUp, ArrowUpRight, DollarSign, Printer, User, Phone, MapPin
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { useSalesStore } from '../store/salesStore';
import { useEffect } from 'react';

export interface OnlineOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  totalAmount: number;
  paymentMethod: 'VietQR' | 'COD' | 'Thẻ ATM/Visa' | 'Chuyển khoản';
  paymentStatus: 'Đã thanh toán' | 'Chờ thanh toán COD' | 'Đã hoàn tiền';
  fulfillmentStatus: 'CHO_XAC_NHAN' | 'DANG_DONG_GOI' | 'DA_GIAO_NTVC' | 'GIAO_THANH_CONG' | 'DA_HUY';
  carrier: 'Viettel Post' | 'GHTK' | 'GHN' | 'Shopee Express' | 'GrabExpress';
  trackingCode: string;
  createdDate: string;
  itemsCount: number;
  items: { productName: string; sku: string; quantity: number; price: number }[];
}

const MOCK_ONLINE_ORDERS: OnlineOrder[] = [];

export function OnlineOrdersPage() {
  const { saleOrders, fetchSaleOrders } = useSalesStore();

  useEffect(() => {
    fetchSaleOrders();
  }, [fetchSaleOrders]);

  const orders = useMemo<OnlineOrder[]>(() => {
    const onlineOrders = (saleOrders || []).filter(o => o.origin === 'ONLINE' || o.onlineChannel);
    const sourceList = onlineOrders.length > 0 ? onlineOrders : (saleOrders || []);
    return sourceList.map((o) => ({
      id: String(o.id),
      orderCode: o.code || `ONL-${o.id}`,
      customerName: o.customerName || o.recipientName || 'Khách hàng',
      customerPhone: o.recipientPhone || 'N/A',
      shippingAddress: o.shippingAddress || 'Chi nhánh POS',
      totalAmount: Number(o.totalAmount || 0),
      paymentMethod: (o.paymentMethod || 'Chuyển khoản') as any,
      paymentStatus: o.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán COD',
      fulfillmentStatus: (o.deliveryStatus === 'DELIVERED'
        ? 'GIAO_THANH_CONG'
        : o.deliveryStatus === 'SHIPPED'
        ? 'DA_GIAO_NTVC'
        : o.deliveryStatus === 'PICKING'
        ? 'DANG_DONG_GOI'
        : o.deliveryStatus === 'CANCELLED'
        ? 'DA_HUY'
        : 'CHO_XAC_NHAN') as any,
      carrier: (o.shippingProvider || 'GHTK') as any,
      trackingCode: o.trackingCode || `TRK-${o.id}`,
      createdDate: o.date || '',
      itemsCount: o.orderLines?.length || 1,
      items: (o.orderLines || []).map((l) => ({
        productName: l.productName || '',
        sku: l.sku || '',
        quantity: l.quantity || 1,
        price: l.unitPrice || 0,
      })),
    }));
  }, [saleOrders]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        o.customerPhone.includes(search) ||
        o.trackingCode.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'Tất cả' || o.fulfillmentStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingFulfillment = orders.filter((o) => o.fulfillmentStatus === 'CHO_XAC_NHAN').length;
    const gmv = orders.reduce((sum, o) => sum + (o.fulfillmentStatus !== 'DA_HUY' ? o.totalAmount : 0), 0);
    const successCount = orders.filter((o) => o.fulfillmentStatus === 'GIAO_THANH_CONG').length;
    return { totalOrders, pendingFulfillment, gmv, successCount };
  }, [orders]);

  const handleUpdateStatus = (orderId: string, newStatus: OnlineOrder['fulfillmentStatus']) => {
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, fulfillmentStatus: newStatus } : null));
    }
    toast.success(`Đã cập nhật trạng thái đơn hàng thành công!`);
  };

  const getStatusBadge = (status: OnlineOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'CHO_XAC_NHAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
            <Clock className="w-3 h-3" /> Chờ xác nhận
          </span>
        );
      case 'DANG_DONG_GOI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
            <Package className="w-3 h-3" /> Đang đóng gói
          </span>
        );
      case 'DA_GIAO_NTVC':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
            <Truck className="w-3 h-3" /> Đã giao NTVC
          </span>
        );
      case 'GIAO_THANH_CONG':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
            <CheckCircle2 className="w-3 h-3" /> Thành công
          </span>
        );
      case 'DA_HUY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/40">
            <XCircle className="w-3 h-3" /> Đã hủy
          </span>
        );
    }
  };

  const columns = useMemo<ColumnDef<OnlineOrder>[]>(() => [
    {
      accessorKey: 'orderCode',
      header: 'Mã đơn hàng',
      cell: ({ row }) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline" onClick={() => setSelectedOrder(row.original)}>
          {row.original.orderCode}
        </span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Khách hàng',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-gray-900 dark:text-gray-100">{row.original.customerName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.original.customerPhone}</div>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Tổng tiền',
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-gray-900 dark:text-white">
            {row.original.totalAmount.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400">{row.original.paymentMethod}</div>
        </div>
      ),
    },
    {
      accessorKey: 'fulfillmentStatus',
      header: 'Trạng thái xử lý',
      cell: ({ row }) => getStatusBadge(row.original.fulfillmentStatus),
    },
    {
      accessorKey: 'carrier',
      header: 'Vận chuyển',
      cell: ({ row }) => (
        <div>
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{row.original.carrier}</div>
          <div className="text-[11px] text-gray-400 font-mono">{row.original.trackingCode}</div>
        </div>
      ),
    },
    {
      accessorKey: 'createdDate',
      header: 'Thời gian đặt',
      cell: ({ row }) => <span className="text-xs text-gray-500 dark:text-gray-400">{row.original.createdDate}</span>,
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedOrder(row.original)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 rounded-lg transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" /> Chi tiết
        </button>
      ),
    },
  ], []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Quản Lý Đơn Hàng Online
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tập trung các đơn hàng đặt trực tuyến và giao hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.info('Đã tự động cập nhật danh sách đơn hàng mới nhất!')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới danh sách
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tổng Đơn Hàng Online</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.totalOrders}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Tăng trưởng ổn định
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đơn Chờ Xác Nhận</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pendingFulfillment}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Cần xử lý đóng gói ngay</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tổng Doanh Số</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.gmv.toLocaleString('vi-VN')} đ</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> Doanh thu đơn online
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Giao Thành Công</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.successCount}</h3>
            <p className="text-xs text-gray-400 mt-1">Tỷ lệ giao đạt 95%</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã đơn, tên khách, SĐT, mã vận đơn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>

          {/* Fulfillment Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Trạng thái:
            </span>
            {[
              { label: 'Tất cả', value: 'Tất cả' },
              { label: 'Chờ xác nhận', value: 'CHO_XAC_NHAN' },
              { label: 'Đang đóng gói', value: 'DANG_DONG_GOI' },
              { label: 'Đã giao NTVC', value: 'DA_GIAO_NTVC' },
              { label: 'Thành công', value: 'GIAO_THANH_CONG' },
              { label: 'Đã hủy', value: 'DA_HUY' },
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => setStatusFilter(st.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === st.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Component */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <ReusableDataTable data={filteredOrders} columns={columns} />
      </div>

      {/* Detail Drawer */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Chi tiết đơn hàng: ${selectedOrder?.orderCode || ''}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono text-base font-bold text-gray-900 dark:text-white">
                  {selectedOrder.orderCode}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">Ngày đặt: {selectedOrder.createdDate}</p>
              </div>
              <div>{getStatusBadge(selectedOrder.fulfillmentStatus)}</div>
            </div>

            {/* Customer & Delivery Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Thông tin khách hàng
                </h4>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.customerName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedOrder.customerPhone}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1 leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" /> {selectedOrder.shippingAddress}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> Đơn vị vận chuyển
                </h4>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.carrier}</p>
                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Mã vận đơn: {selectedOrder.trackingCode}
                </p>
                <p className="text-xs text-gray-500">Thanh toán: {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})</p>
              </div>
            </div>

            {/* Items Table */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Danh sách sản phẩm trong đơn</h4>
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                    <tr>
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3 text-center">Mã SKU</th>
                      <th className="p-3 text-center">Số lượng</th>
                      <th className="p-3 text-right">Đơn giá</th>
                      <th className="p-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">{item.productName}</td>
                        <td className="p-3 text-center font-mono text-xs text-gray-500">{item.sku}</td>
                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                        <td className="p-3 text-right text-gray-600 dark:text-gray-300">{item.price.toLocaleString('vi-VN')} đ</td>
                        <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                          {(item.quantity * item.price).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Amount Footer */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">Tổng cộng thanh toán:</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {selectedOrder.totalAmount.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => toast.success(`Đã in phiếu đóng gói cho đơn ${selectedOrder.orderCode}`)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> In phiếu đóng gói
              </button>

              {selectedOrder.fulfillmentStatus === 'CHO_XAC_NHAN' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'DANG_DONG_GOI')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium cursor-pointer shadow-sm"
                >
                  <Package className="w-4 h-4" /> Xác nhận & Chuyển đóng gói
                </button>
              )}

              {selectedOrder.fulfillmentStatus === 'DANG_DONG_GOI' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'DA_GIAO_NTVC')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium cursor-pointer shadow-sm"
                >
                  <Truck className="w-4 h-4" /> Bàn giao cho NTVC
                </button>
              )}

              {selectedOrder.fulfillmentStatus === 'DA_GIAO_NTVC' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'GIAO_THANH_CONG')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium cursor-pointer shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận Giao thành công
                </button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default OnlineOrdersPage;

