import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { axiosClient } from '@/shared/lib/axiosClient';
import {
  ShoppingBag, Search, Eye, Filter, RefreshCw, CheckCircle2, Clock, Truck, Package, XCircle,
  TrendingUp, ArrowUpRight, DollarSign, Printer, User, Phone, MapPin
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';



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
  carrier: string;
  trackingCode: string;
  shipperName?: string;
  shipperPhone?: string;
  createdDate: string;
  itemsCount: number;
  items: { productName: string; sku: string; quantity: number; price: number }[];
}

export const mapBackendToFulfillmentStatus = (status: string): OnlineOrder['fulfillmentStatus'] => {
  const st = (status || '').toUpperCase();
  if (st === 'CONFIRMED' || st === 'PROCESSING') return 'DANG_DONG_GOI';
  if (st === 'SHIPPED' || st === 'DELIVERING') return 'DA_GIAO_NTVC';
  if (st === 'COMPLETED' || st === 'DELIVERED') return 'GIAO_THANH_CONG';
  if (st === 'CANCELLED') return 'DA_HUY';
  return 'CHO_XAC_NHAN';
};

export function OnlineOrdersPage() {
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);

  // Modal for assigning Shipper / Carrier
  const [isAssignShipperOpen, setIsAssignShipperOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [shipperForm, setShipperForm] = useState({
    carrier: 'Viettel Post',
    trackingCode: '',
    shipperName: 'Nguyễn Văn Minh',
    shipperPhone: '0912 345 678'
  });

  const fetchOrders = async (showToast = false) => {
    setIsLoading(true);
    let realOrders: OnlineOrder[] = [];

    try {
      const res = await axiosClient.get<any, any>('/sales/orders');
      const rawItems = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : []));
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        realOrders = rawItems.map((item: any) => ({
          id: String(item.id),
          orderCode: item.orderCode || `ONLINE-${item.id}`,
          customerName: item.customerName || 'Khách hàng Online',
          customerPhone: item.customerPhone || '0988 123 456',
          shippingAddress: item.shippingAddress || 'Việt Nam',
          totalAmount: Number(item.totalAmount || 0),
          paymentMethod: item.paymentMethod === 'MOMO' ? 'VietQR' : 'COD',
          paymentStatus: (item.status === 'COMPLETED' || item.status === 'DELIVERED') ? 'Đã thanh toán' : 'Chờ thanh toán COD',
          fulfillmentStatus: mapBackendToFulfillmentStatus(item.status),
          carrier: item.carrier || (item.status === 'PENDING' ? 'Chưa chọn (Chờ đóng gói)' : 'Viettel Post'),
          trackingCode: item.trackingCode || (item.status === 'PENDING' ? 'Tự động tạo' : `VTP-${item.id}`),
          shipperName: item.shipperName || (item.status === 'PENDING' ? 'Chưa chọn (Chờ đóng gói)' : 'Nguyễn Văn Minh'),
          shipperPhone: item.shipperPhone || (item.status === 'PENDING' ? 'Chưa chọn' : '0912 345 678'),
          createdDate: item.createdAt ? new Date(item.createdAt).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16),
          itemsCount: item.details?.length || 1,
          items: item.details ? item.details.map((d: any) => ({
            productName: d.productNameSnapshot || d.productName || 'Sản phẩm',
            sku: d.variantCode || d.skuSnapshot || 'SKU',
            quantity: Number(d.quantity || 1),
            price: Number(d.unitPriceSnapshot || d.unitPrice || 0)
          })) : []
        }));
      }
    } catch (err) {
      console.warn('Backend order list fetch failed:', err);
    }

    setIsLoading(false);

    try {
      const localSaved = localStorage.getItem('user_local_orders');
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mappedLocal: OnlineOrder[] = parsed.map((lo: any, idx: number) => ({
            id: lo.id || `local-${idx}`,
            orderCode: lo.id || `ONLINE-${Date.now()}`,
            customerName: lo.shippingAddress?.fullName || 'Khách hàng Online',
            customerPhone: lo.shippingAddress?.phone || '0988123456',
            shippingAddress: lo.shippingAddress?.street || 'TP. Hồ Chí Minh',
            totalAmount: Number(lo.total || 0),
            paymentMethod: lo.paymentMethod === 'MOMO' ? 'VietQR' : 'COD',
            paymentStatus: lo.status === 'delivered' ? 'Đã thanh toán' : 'Chờ thanh toán COD',
            fulfillmentStatus: lo.status === 'delivered' ? 'GIAO_THANH_CONG' : lo.status === 'cancelled' ? 'DA_HUY' : 'CHO_XAC_NHAN',
            carrier: 'Viettel Post',
            trackingCode: lo.trackingNumber || `VTP-${lo.id}`,
            createdDate: lo.date || new Date().toISOString().substring(0, 10),
            itemsCount: lo.items?.length || 1,
            items: lo.items ? lo.items.map((it: any) => ({
              productName: it.productName || 'Sản phẩm',
              sku: `SKU-${it.productId}`,
              quantity: it.quantity || 1,
              price: it.price || 0
            })) : []
          }));

          mappedLocal.forEach(m => {
            if (!realOrders.some(r => r.orderCode === m.orderCode)) {
              realOrders.unshift(m);
            }
          });
        }
      }
    } catch { }

    setOrders(realOrders);

    if (showToast) {
      toast.success('Đã làm mới và đồng bộ danh sách đơn hàng từ Backend!');
    }
  };

  useEffect(() => {
    fetchOrders(false);
  }, []);

  // Reset assignmentHistory when a new order is selected
  useEffect(() => {
    if (selectedOrder) {
      setAssignmentHistory([]);
    }
  }, [selectedOrder?.id]);

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

  const mapFulfillmentToBackendStatus = (fStatus: OnlineOrder['fulfillmentStatus']): string => {
    switch (fStatus) {
      case 'DANG_DONG_GOI':
        return 'CONFIRMED';
      case 'DA_GIAO_NTVC':
        return 'SHIPPED';
      case 'GIAO_THANH_CONG':
        return 'DELIVERED';
      case 'DA_HUY':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OnlineOrder['fulfillmentStatus'],
    extraData?: { carrier?: string; trackingCode?: string; shipperName?: string; shipperPhone?: string }
  ) => {
    const backendStatus = mapFulfillmentToBackendStatus(newStatus);

    try {
      const params: any = { status: backendStatus };
      if (extraData?.carrier) params.carrier = extraData.carrier;
      if (extraData?.trackingCode) params.trackingCode = extraData.trackingCode;
      if (extraData?.shipperName) params.shipperName = extraData.shipperName;
      if (extraData?.shipperPhone) params.shipperPhone = extraData.shipperPhone;

      await axiosClient.put(`/sales/orders/${orderId}/status`, null, { params });
    } catch (err) {
      console.warn('Backend status update request failed:', err);
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            fulfillmentStatus: newStatus,
            carrier: extraData?.carrier || (newStatus === 'CHO_XAC_NHAN' ? 'Chưa chọn (Chờ đóng gói)' : o.carrier || 'Viettel Post'),
            trackingCode: extraData?.trackingCode || o.trackingCode,
            shipperName: extraData?.shipperName || o.shipperName,
            shipperPhone: extraData?.shipperPhone || o.shipperPhone
          };
        }
        return o;
      })
    );

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              fulfillmentStatus: newStatus,
              carrier: extraData?.carrier || (newStatus === 'CHO_XAC_NHAN' ? 'Chưa chọn (Chờ đóng gói)' : prev.carrier || 'Viettel Post'),
              trackingCode: extraData?.trackingCode || prev.trackingCode,
              shipperName: extraData?.shipperName || prev.shipperName,
              shipperPhone: extraData?.shipperPhone || prev.shipperPhone
            }
          : null
      );
    }

    const labelMap: Record<OnlineOrder['fulfillmentStatus'], string> = {
      CHO_XAC_NHAN: 'Chờ xác nhận',
      DANG_DONG_GOI: 'Đang đóng gói',
      DA_GIAO_NTVC: 'Đã giao NTVC / Shipper',
      GIAO_THANH_CONG: 'Thành công',
      DA_HUY: 'Đã hủy'
    };

    toast.success(`Đã cập nhật trạng thái đơn hàng: ${labelMap[newStatus]}`);
  };

  const handleOpenAssignShipperModal = () => {
    if (!selectedOrder) return;
    setShipperForm({
      carrier: selectedOrder.carrier && selectedOrder.carrier !== 'Chưa chọn (Chờ đóng gói)' ? selectedOrder.carrier : 'Viettel Post',
      trackingCode: selectedOrder.trackingCode && selectedOrder.trackingCode !== 'Tự động tạo' ? selectedOrder.trackingCode : `VTP-${selectedOrder.id}`,
      shipperName: selectedOrder.shipperName || 'Nguyễn Văn Minh',
      shipperPhone: selectedOrder.shipperPhone || '0912 345 678'
    });
    setIsAssignShipperOpen(true);
  };

  const handleConfirmAssignShipper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    handleUpdateStatus(selectedOrder.id, 'DA_GIAO_NTVC', shipperForm);
    setIsAssignShipperOpen(false);
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
            <Truck className="w-3 h-3" /> Đã giao NTVC / Shipper
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

  useEffect(() => {
    if (selectedOrder && selectedOrder.id) {
      axiosClient.get<any, any>(`/sales/orders/${selectedOrder.id}`).then((res) => {
        const data = res?.data || res;
        if (data) {
          const fetchedItems = data.details && Array.isArray(data.details) && data.details.length > 0
            ? data.details.map((d: any) => ({
                productName: d.productNameSnapshot || d.productName || 'Sản phẩm Online',
                sku: d.skuSnapshot || d.sku || `SKU-${d.productVariantId || d.productId || 1}`,
                quantity: Number(d.quantity || 1),
                price: Number(d.unitPriceSnapshot || d.unitPrice || 0)
              }))
            : [];
          setSelectedOrder(prev => prev && prev.id === selectedOrder.id ? {
            ...prev,
            customerName: data.customerName || prev.customerName,
            customerPhone: data.customerPhone || prev.customerPhone,
            shippingAddress: data.shippingAddress || prev.shippingAddress,
            totalAmount: Number(data.totalAmount || prev.totalAmount),
            items: fetchedItems.length > 0 ? fetchedItems : prev.items
          } : prev);
        }
      }).catch((err) => {
        console.warn('Failed to fetch detail for order:', selectedOrder.id, err);
      });
    }
  }, [selectedOrder?.id]);

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
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {row.original.fulfillmentStatus === 'CHO_XAC_NHAN' ? 'Chưa chọn' : row.original.carrier}
          </div>
          <div className="text-[11px] text-gray-400 font-mono">
            {row.original.fulfillmentStatus === 'CHO_XAC_NHAN' ? 'Chờ đóng gói' : row.original.trackingCode}
          </div>
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
            onClick={() => fetchOrders(true)}
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
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <ReusableDataTable columns={columns} data={filteredOrders} onRowClick={(row) => setSelectedOrder(row)} />
      </div>

      {/* Order Detail Drawer */}
      <Modal
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
                  <Truck className="w-3.5 h-3.5" /> Đơn vị vận chuyển & Người giao hàng
                </h4>
                {selectedOrder.fulfillmentStatus === 'CHO_XAC_NHAN' ? (
                  <div className="space-y-1">
                    <p className="text-xs text-amber-600 font-semibold">Chưa chọn (Chờ đóng gói)</p>
                    <p className="text-xs text-gray-400">Tài xế / Shipper: Chưa phân công</p>
                    <p className="text-xs font-mono text-gray-400">Mã vận đơn: Tự động tạo khi giao</p>
                  </div>
                ) : selectedOrder.fulfillmentStatus === 'DANG_DONG_GOI' ? (
                  <div className="space-y-1">
                    <p className="text-xs text-indigo-600 font-semibold">Đã đóng gói - Chờ bàn giao Shipper</p>
                    <p className="text-xs text-gray-500">Hãy bấm nút "Chọn người giao hàng" phía dưới để gán Shipper</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.carrier || 'Viettel Post'}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      🚚 Shipper: <strong className="text-gray-900 dark:text-white">{selectedOrder.shipperName || 'Nguyễn Văn Minh'} ({selectedOrder.shipperPhone || '0912 345 678'})</strong>
                    </p>
                    <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Mã vận đơn: {selectedOrder.trackingCode}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800">
                  Thanh toán: {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                </p>
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
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-medium text-gray-900 dark:text-white">{item.productName}</td>
                          <td className="p-3 text-center font-mono text-xs text-gray-500">{item.sku}</td>
                          <td className="p-3 text-center font-bold">{item.quantity}</td>
                          <td className="p-3 text-right text-gray-600 dark:text-gray-300">{item.price.toLocaleString('vi-VN')} đ</td>
                          <td className="p-3 text-right font-bold text-gray-900 dark:text-white">
                            {(item.quantity * item.price).toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-3 font-medium text-gray-900 dark:text-white">Sản phẩm đặt hàng Online</td>
                        <td className="p-3 text-center font-mono text-xs text-gray-500">ONLINE-ITEM</td>
                        <td className="p-3 text-center font-bold">1</td>
                        <td className="p-3 text-right text-gray-600 dark:text-gray-300">{selectedOrder.totalAmount.toLocaleString('vi-VN')} đ</td>
                        <td className="p-3 text-right font-bold text-gray-900 dark:text-white">{selectedOrder.totalAmount.toLocaleString('vi-VN')} đ</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Audit Trail Timeline */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" /> Lịch sử phân công & Vận chuyển (Audit Trail)
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                {assignmentHistory && assignmentHistory.length > 0 ? (
                  assignmentHistory.map((hist: any, hIdx: number) => (
                    <div key={hIdx} className="text-xs border-b border-gray-200 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                      <div className="flex justify-between items-center font-bold text-gray-800 dark:text-gray-200">
                        <span>{hist.actionType || 'PHÂN CÔNG'} — {hist.carrierName || 'Giao hàng'}</span>
                        <span className="text-[11px] text-gray-400">{hist.assignedAt ? new Date(hist.assignedAt).toLocaleString('vi-VN') : ''}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                        🚚 Tài xế: <strong>{hist.shipperName || 'N/A'}</strong> ({hist.shipperPhone || 'N/A'})
                      </p>
                      <p className="text-[11px] text-gray-400">
                        Người thực hiện: <span className="text-emerald-600 font-semibold">{hist.assignedBy || 'Admin'}</span> {hist.note ? `— ${hist.note}` : ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic">Chưa có lịch sử thay đổi phân công.</p>
                )}
              </div>
            </div>

            {/* Total Amount Footer */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">Tổng cộng thanh toán:</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {selectedOrder.totalAmount.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            {/* Actions Workflow */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => toast.success(`Đã in phiếu đóng gói cho đơn ${selectedOrder.orderCode}`)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> In phiếu đóng gói
              </button>

              {/* Step 1: Confirm & move to packing */}
              {selectedOrder.fulfillmentStatus === 'CHO_XAC_NHAN' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'DANG_DONG_GOI')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium cursor-pointer shadow-sm transition-all"
                >
                  <Package className="w-4 h-4" /> Xác nhận & Chuyển đóng gói
                </button>
              )}

              {/* Step 2: Select Shipper & Carrier */}
              {selectedOrder.fulfillmentStatus === 'DANG_DONG_GOI' && (
                <button
                  onClick={handleOpenAssignShipperModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium cursor-pointer shadow-sm transition-all"
                >
                  <Truck className="w-4 h-4" /> Chọn người giao hàng & Bàn giao NTVC
                </button>
              )}

              {/* Step 3: Shipper Delivering -> Mark Delivered */}
              {selectedOrder.fulfillmentStatus === 'DA_GIAO_NTVC' && (
                <>
                  <button
                    onClick={handleOpenAssignShipperModal}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    Sửa thông tin Shipper
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'GIAO_THANH_CONG')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium cursor-pointer shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Xác nhận Giao thành công
                  </button>
                </>
              )}

              {/* Cancel option */}
              {selectedOrder.fulfillmentStatus !== 'GIAO_THANH_CONG' && selectedOrder.fulfillmentStatus !== 'DA_HUY' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'DA_HUY')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" /> Hủy đơn hàng
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Chọn Người Giao Hàng & Đơn Vị Vận Chuyển */}
      {isAssignShipperOpen && (
        <Modal
          isOpen={isAssignShipperOpen}
          onClose={() => setIsAssignShipperOpen(false)}
          title="Phân công người giao hàng & Đơn vị vận chuyển"
        >
          <form onSubmit={handleConfirmAssignShipper} className="space-y-4 p-1">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Chọn Shipper từ Danh sách Hệ thống
              </label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'minh') {
                    setShipperForm({ ...shipperForm, shipperName: 'Nguyễn Văn Minh', shipperPhone: '0912 345 678', carrier: 'Viettel Post' });
                  } else if (val === 'huy') {
                    setShipperForm({ ...shipperForm, shipperName: 'Trần Quốc Huy', shipperPhone: '0987 654 321', carrier: 'Giao Hàng Tiết Kiệm (GHTK)' });
                  } else if (val === 'nam') {
                    setShipperForm({ ...shipperForm, shipperName: 'Lê Hoàng Nam', shipperPhone: '0905 112 233', carrier: 'Giao Hàng Nhanh (GHN)' });
                  } else if (val === 'anh') {
                    setShipperForm({ ...shipperForm, shipperName: 'Phạm Đức Anh', shipperPhone: '0933 445 566', carrier: 'Shopee Express' });
                  } else if (val === 'son') {
                    setShipperForm({ ...shipperForm, shipperName: 'Vũ Thanh Sơn', shipperPhone: '0977 889 900', carrier: 'GrabExpress' });
                  } else if (val === 'auramart') {
                    setShipperForm({ ...shipperForm, shipperName: 'Đội xe AuraMart Nội bộ', shipperPhone: '0283 888 999', carrier: 'Đội xe AuraMart (Nội bộ)' });
                  } else if (val === 'custom') {
                    setShipperForm({ ...shipperForm, shipperName: '', shipperPhone: '' });
                  }
                }}
                className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="minh">Nguyễn Văn Minh — 0912 345 678 (Viettel Post)</option>
                <option value="huy">Trần Quốc Huy — 0987 654 321 (GHTK)</option>
                <option value="nam">Lê Hoàng Nam — 0905 112 233 (GHN)</option>
                <option value="anh">Phạm Đức Anh — 0933 445 566 (Shopee Express)</option>
                <option value="son">Vũ Thanh Sơn — 0977 889 900 (GrabExpress)</option>
                <option value="auramart">Đội xe AuraMart Nội bộ — 0283 888 999</option>
                <option value="custom">-- Nhập tên & SĐT tùy chỉnh --</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Đơn vị vận chuyển
              </label>
              <select
                value={shipperForm.carrier}
                onChange={(e) => setShipperForm({ ...shipperForm, carrier: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
              >
                <option value="Viettel Post">Viettel Post</option>
                <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
                <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                <option value="Shopee Express">Shopee Express</option>
                <option value="GrabExpress">GrabExpress</option>
                <option value="Đội xe AuraMart (Nội bộ)">Đội xe AuraMart (Nội bộ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mã vận đơn
              </label>
              <input
                type="text"
                value={shipperForm.trackingCode}
                onChange={(e) => setShipperForm({ ...shipperForm, trackingCode: e.target.value })}
                placeholder="Ví dụ: VTP-599226"
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-mono font-semibold text-emerald-600 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tên Shipper / Tài xế giao hàng
              </label>
              <input
                type="text"
                value={shipperForm.shipperName}
                onChange={(e) => setShipperForm({ ...shipperForm, shipperName: e.target.value })}
                placeholder="Nhập tên tài xế (VD: Nguyễn Văn Minh)"
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Số điện thoại Shipper
              </label>
              <input
                type="text"
                value={shipperForm.shipperPhone}
                onChange={(e) => setShipperForm({ ...shipperForm, shipperPhone: e.target.value })}
                placeholder="VD: 0912 345 678"
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsAssignShipperOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm cursor-pointer"
              >
                Xác nhận bàn giao & Gửi Shipper
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default OnlineOrdersPage;

