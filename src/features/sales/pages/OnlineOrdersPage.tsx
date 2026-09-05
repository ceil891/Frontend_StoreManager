import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { axiosClient } from '@/shared/lib/axiosClient';
import {
  ShoppingBag, Search, Eye, Filter, RefreshCw, CheckCircle2, Clock, Truck, Package, XCircle,
  TrendingUp, ArrowUpRight, DollarSign, Printer, User, Phone, MapPin, Building2
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';

import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useSalesStore } from '../store/salesStore';
import { usePermission } from '@/shared/hooks/usePermission';
import { useUserStore } from '@/features/hr/store/userStore';

export interface BranchOption {
  id: string | number;
  branchCode?: string;
  branchName: string;
  address?: string;
  phone?: string;
}

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
  branchId?: string | number;
  branchName?: string;
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
  const { user, canViewAllBranches, currentBranchId: userBranchId } = usePermission();
  const isSuperAdmin = canViewAllBranches;

  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedOrder, setSelectedOrder] = useState<OnlineOrder | null>(null);

  // Modal for assigning Branch / Warehouse
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [isAssignBranchOpen, setIsAssignBranchOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | number>('');
  const [branchPackingNote, setBranchPackingNote] = useState('');

  // Modal for assigning Shipper / Carrier
  const { users, fetchUsers } = useUserStore();
  const [isAssignShipperOpen, setIsAssignShipperOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [dynamicShippers, setDynamicShippers] = useState<any[]>([]);
  const [dynamicCarriers, setDynamicCarriers] = useState<string[]>([]);
  const [shipperForm, setShipperForm] = useState({
    carrier: '',
    trackingCode: '',
    shipperName: '',
    shipperPhone: ''
  });

  const fetchDynamicShippersAndCarriers = async () => {
    try {
      // 1. Shippers from API and local storage
      let shpList: any[] = [];
      try {
        const res = await axiosClient.get<any, any>('/logistics/shippers');
        const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.content) ? res.content : []));
        if (items && items.length > 0) {
          shpList = items.map((it: any) => ({
            id: String(it.id || it.shipperCode),
            name: it.fullName || it.companyName || it.contactPerson || 'Shipper',
            phone: it.phone || it.contactPhone || '',
            carrier: it.companyName || 'Đơn vị vận chuyển',
            label: `${it.fullName || it.companyName} — ${it.phone || it.contactPhone || ''}`
          }));
        }
      } catch {}

      if (shpList.length === 0) {
        try {
          const saved = localStorage.getItem('shippers_list_data');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              shpList = parsed.map((it: any) => ({
                id: String(it.id || it.partnerCode),
                name: it.companyName || it.contactPerson || 'Shipper',
                phone: it.contactPhone || '',
                carrier: it.companyName || 'Đơn vị vận chuyển',
                label: `${it.companyName} — ${it.contactPhone || ''}`
              }));
            }
          }
        } catch {}
      }
      setDynamicShippers(shpList);

      // 2. Carriers from API and local storage
      let carList: string[] = [];
      try {
        const res = await axiosClient.get<any, any>('/logistics/carriers');
        const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.content) ? res.content : []));
        if (items && items.length > 0) {
          carList = items.map((it: any) => it.carrierName).filter(Boolean);
        }
      } catch {}

      if (carList.length === 0) {
        try {
          const saved = localStorage.getItem('retailhub_carriers_list');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              carList = parsed.map((it: any) => it.carrierName).filter(Boolean);
            }
          }
        } catch {}
      }

      const defaultCarriers = ['Viettel Post', 'Giao Hàng Tiết Kiệm (GHTK)', 'Giao Hàng Nhanh (GHN)', 'Shopee Express', 'GrabExpress', 'Đội xe AuraMart (Nội bộ)'];
      const mergedCarriers = Array.from(new Set([...carList, ...defaultCarriers]));
      setDynamicCarriers(mergedCarriers);
    } catch (e) {
      console.warn('Failed to load dynamic shippers/carriers:', e);
    }
  };

  const availableShippers = useMemo(() => {
    const staffShippers = (users || [])
      .filter(u => u.status === 'ACTIVE' || !u.status)
      .map(u => ({
        id: `staff_${u.id}`,
        name: u.fullName || u.userCode,
        phone: u.contactPhone || '',
        carrier: 'Đội xe AuraMart (Nội bộ)',
        label: `${u.fullName} — ${u.contactPhone || '0912 345 678'} (${u.assignedRole || 'Nhân viên giao hàng'})`
      }));

    return [...dynamicShippers, ...staffShippers];
  }, [users, dynamicShippers]);

  useEffect(() => {
    fetchUsers();
    fetchDynamicShippersAndCarriers();
  }, [fetchUsers]);

  const fetchBranches = async () => {
    try {
      const res = await axiosClient.get<any, any>('/branches?includeDeleted=false');
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : []));
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((b: any) => ({
          id: String(b.id),
          branchCode: b.branchCode || `CN-${b.id}`,
          branchName: b.branchName || b.name || `Chi nhánh ${b.id}`,
          address: b.address || b.fullAddress || 'Địa chỉ chi nhánh',
          phone: b.phone || b.contactPhone || ''
        }));
        setBranches(mapped);
        setSelectedBranchId(userBranchId || String(mapped[0].id));
      }
    } catch (err) {
      console.error('Fetch branches from backend failed:', err);
    }
  };

  const fetchOrders = async (showToast = false) => {
    setIsLoading(true);
    let realOrders: OnlineOrder[] = [];

    try {
      const branchParam = (!isSuperAdmin && userBranchId) ? `?branchId=${userBranchId}` : '';
      const res = await axiosClient.get<any, any>(`/sales/orders${branchParam}`);
      const rawItems = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : []));
      if (Array.isArray(rawItems) && rawItems.length > 0) {
        // Chỉ lấy các đơn có nguồn Online (origin = ONLINE hoặc orderCode bắt đầu bằng ONLINE-)
        const onlineRaw = rawItems.filter((it: any) => {
          const origin = (it.origin || it.orderOrigin || '').toUpperCase();
          const code = (it.orderCode || it.code || '').toUpperCase();
          const isOnline = origin === 'ONLINE' || origin === 'WEB' || code.startsWith('ONLINE-') || code.startsWith('WEB-');
          if (!isOnline) return false;
          if (!isSuperAdmin && userBranchId) {
            return !it.branchId && !it.branch?.id ? true : String(it.branchId || it.branch?.id) === String(userBranchId);
          }
          return true;
        });

        realOrders = onlineRaw.map((item: any) => ({
          id: String(item.id),
          orderCode: item.orderCode || item.code || `ONLINE-${item.id}`,
          customerName: item.customerName || item.customer?.name || item.recipientName || 'Khách đặt Online',
          customerPhone: item.customerPhone || item.customer?.phone || item.recipientPhone || '—',
          shippingAddress: item.shippingAddress || item.address || 'Giao tận nơi',
          totalAmount: Number(item.totalAmount || item.finalAmount || 0),
          paymentMethod: (item.paymentMethod === 'MOMO' || item.paymentMethod === 'VIETQR') ? 'VietQR' : (item.paymentMethod || 'COD') as any,
          paymentStatus: (item.status === 'COMPLETED' || item.status === 'DELIVERED' || item.paymentStatus === 'PAID') ? 'Đã thanh toán' : 'Chờ thanh toán COD',
          fulfillmentStatus: mapBackendToFulfillmentStatus(item.status),
          branchId: item.branchId || item.branch?.id,
          branchName: item.branchName || item.branch?.branchName || (item.branchId ? `Chi nhánh ${item.branchId}` : undefined),
          carrier: item.carrier || (item.status === 'PENDING' ? '' : 'Viettel Post'),
          trackingCode: item.trackingCode || (item.status === 'PENDING' ? '' : `VTP-${item.id}`),
          shipperName: item.shipperName || '',
          shipperPhone: item.shipperPhone || '',
          createdDate: item.createdAt ? new Date(item.createdAt).toISOString().replace('T', ' ').substring(0, 16) : (item.orderDate ? String(item.orderDate).substring(0, 10) : new Date().toISOString().substring(0, 10)),
          itemsCount: item.details?.length || (item.items?.length || 1),
          items: (item.details || item.items || []).map((d: any) => ({
            productName: d.productNameSnapshot || d.productName || 'Sản phẩm',
            sku: d.variantCode || d.skuSnapshot || d.sku || 'SKU',
            quantity: Number(d.quantity || 1),
            price: Number(d.unitPriceSnapshot || d.unitPrice || d.price || 0)
          }))
        }));
      }
    } catch (err) {
      console.warn('Backend order list fetch failed:', err);
    }

    setIsLoading(false);
    setOrders(realOrders);

    if (showToast) {
      toast.success('Đã làm mới và đồng bộ danh sách đơn hàng từ Backend!');
    }
  };

  useEffect(() => {
    fetchOrders(false);
    fetchBranches();
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
        (o.branchName && o.branchName.toLowerCase().includes(search.toLowerCase())) ||
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
    extraData?: { branchId?: string | number; branchName?: string; carrier?: string; trackingCode?: string; shipperName?: string; shipperPhone?: string }
  ) => {
    const backendStatus = mapFulfillmentToBackendStatus(newStatus);

    try {
      const params: any = { status: backendStatus };
      if (extraData?.branchId) params.branchId = extraData.branchId;
      if (extraData?.carrier) params.carrier = extraData.carrier;
      if (extraData?.trackingCode) params.trackingCode = extraData.trackingCode;
      if (extraData?.shipperName) params.shipperName = extraData.shipperName;
      if (extraData?.shipperPhone) params.shipperPhone = extraData.shipperPhone;

      await axiosClient.put(`/sales/orders/${orderId}/status`, null, { params });
    } catch (err: any) {
      console.error('Backend status update request failed:', err);
      toast.error('Không thể cập nhật trạng thái đơn hàng: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
      return;
    }

    const isSuccess = newStatus === 'GIAO_THANH_CONG';

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            fulfillmentStatus: newStatus,
            paymentStatus: isSuccess ? 'Đã thanh toán' : o.paymentStatus,
            branchId: extraData?.branchId !== undefined ? extraData.branchId : o.branchId,
            branchName: extraData?.branchName || o.branchName,
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
              paymentStatus: isSuccess ? 'Đã thanh toán' : prev.paymentStatus,
              branchId: extraData?.branchId !== undefined ? extraData.branchId : prev.branchId,
              branchName: extraData?.branchName || prev.branchName,
              carrier: extraData?.carrier || (newStatus === 'CHO_XAC_NHAN' ? 'Chưa chọn (Chờ đóng gói)' : prev.carrier || 'Viettel Post'),
              trackingCode: extraData?.trackingCode || prev.trackingCode,
              shipperName: extraData?.shipperName || prev.shipperName,
              shipperPhone: extraData?.shipperPhone || prev.shipperPhone
            }
          : null
      );
    }

    try {
      useSalesStore.getState().fetchSaleOrders?.();
    } catch {}

    const labelMap: Record<OnlineOrder['fulfillmentStatus'], string> = {
      CHO_XAC_NHAN: 'Chờ xác nhận',
      DANG_DONG_GOI: 'Đang đóng gói',
      DA_GIAO_NTVC: 'Đã giao NTVC / Shipper',
      GIAO_THANH_CONG: 'Thành công',
      DA_HUY: 'Đã hủy'
    };

    toast.success(`Đã cập nhật trạng thái đơn hàng: ${labelMap[newStatus]}`);
  };

  const handleOpenAssignBranchModal = () => {
    if (!selectedOrder) return;
    if (selectedOrder.branchId) {
      setSelectedBranchId(String(selectedOrder.branchId));
    } else if (branches.length > 0) {
      setSelectedBranchId(String(branches[0].id));
    }
    setBranchPackingNote('');
    setIsAssignBranchOpen(true);
  };

  const handleConfirmAssignBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const branch = branches.find(b => String(b.id) === String(selectedBranchId));
    const branchName = branch ? branch.branchName : 'Chi nhánh AuraMart';

    await handleUpdateStatus(selectedOrder.id, 'DANG_DONG_GOI', {
      branchId: selectedBranchId,
      branchName: branchName
    });

    setIsAssignBranchOpen(false);
    toast.success(`Đã chọn ${branchName} thực hiện đóng gói đơn hàng!`);
  };

  const handleOpenAssignShipperModal = () => {
    if (!selectedOrder) return;
    const defaultCarrier = selectedOrder.carrier && selectedOrder.carrier !== 'Chưa chọn (Chờ đóng gói)'
      ? selectedOrder.carrier
      : (dynamicCarriers[0] || 'Viettel Post');

    setShipperForm({
      carrier: defaultCarrier,
      trackingCode: selectedOrder.trackingCode && selectedOrder.trackingCode !== 'Tự động tạo' ? selectedOrder.trackingCode : `VTP-${selectedOrder.id}`,
      shipperName: selectedOrder.shipperName || (availableShippers[0]?.name || ''),
      shipperPhone: selectedOrder.shipperPhone || (availableShippers[0]?.phone || '')
    });
    setIsAssignShipperOpen(true);
  };

  const handleConfirmAssignShipper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!shipperForm.shipperName.trim()) {
      toast.error('Vui lòng chọn hoặc nhập tên Shipper / Tài xế giao hàng!');
      return;
    }
    if (!shipperForm.shipperPhone.trim()) {
      toast.error('Vui lòng nhập số điện thoại Shipper!');
      return;
    }
    if (!shipperForm.carrier.trim()) {
      toast.error('Vui lòng chọn đơn vị vận chuyển!');
      return;
    }

    handleUpdateStatus(selectedOrder.id, 'DA_GIAO_NTVC', shipperForm);
    setIsAssignShipperOpen(false);
  };

  const getStatusBadge = (status: OnlineOrder['fulfillmentStatus']) => {
    switch (status) {
      case 'CHO_XAC_NHAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
            <Clock className="w-3 h-3" /> Chờ xác nhận & phân bổ kho
          </span>
        );
      case 'DANG_DONG_GOI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
            <Package className="w-3 h-3" /> Đang đóng gói tại chi nhánh
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
            <CheckCircle2 className="w-3 h-3" /> Giao thành công
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
            branchId: data.branchId || data.branch?.id || prev.branchId,
            branchName: data.branchName || data.branch?.branchName || prev.branchName,
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
      accessorKey: 'branchName',
      header: 'Chi nhánh đóng gói',
      cell: ({ row }) => {
        const isPending = row.original.fulfillmentStatus === 'CHO_XAC_NHAN';
        return (
          <div>
            {isPending ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                <Clock className="w-3 h-3" /> Chờ phân bổ
              </span>
            ) : (
              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[140px]" title={row.original.branchName || 'Chi nhánh AuraMart'}>
                  {row.original.branchName || 'Chi nhánh AuraMart'}
                </span>
              </span>
            )}
          </div>
        );
      },
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
            {row.original.fulfillmentStatus === 'CHO_XAC_NHAN' ? 'Chưa phân công' : row.original.carrier}
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
            Quản lý đơn hàng online
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tập trung các đơn hàng trực tuyến, phân bổ chi nhánh đóng gói và xuất giao
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
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tổng đơn hàng online</p>
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
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đơn chờ xác nhận</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pendingFulfillment}</h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Cần phân bổ chi nhánh đóng gói</p>
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
              placeholder="Tìm theo mã đơn, tên khách, SĐT, chi nhánh..."
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

            {/* Fulfillment Branch Section */}
            <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Chi nhánh xuất hàng & đóng gói
                </h4>
                {selectedOrder.fulfillmentStatus === 'CHO_XAC_NHAN' ? (
                  <button
                    onClick={handleOpenAssignBranchModal}
                    className="text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all"
                  >
                    Chọn chi nhánh đóng gói
                  </button>
                ) : (
                  <button
                    onClick={handleOpenAssignBranchModal}
                    className="text-xs px-2.5 py-1 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-all"
                  >
                    Đổi chi nhánh
                  </button>
                )}
              </div>
              <div>
                {selectedOrder.branchName ? (
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600 shrink-0" /> {selectedOrder.branchName}
                    </p>
                    <p className="text-xs text-indigo-700 dark:text-indigo-300">
                      Trạng thái: <strong className="font-semibold">{selectedOrder.fulfillmentStatus === 'DANG_DONG_GOI' ? 'Đang đóng gói và chuẩn bị hàng tại kho' : 'Đã xác nhận phân bổ chi nhánh'}</strong>
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-2 font-medium">
                    <Clock className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Đơn hàng chưa được phân bổ chi nhánh đóng gói. Vui lòng bấm <strong>"Xác nhận & Chọn chi nhánh đóng gói"</strong> để phân công kho xuất hàng.</span>
                  </div>
                )}
              </div>
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
                    <p className="text-xs text-amber-600 font-semibold">Chưa chọn (Chờ phân bổ chi nhánh & đóng gói)</p>
                    <p className="text-xs text-gray-400">Tài xế / Shipper: Chưa phân công</p>
                    <p className="text-xs font-mono text-gray-400">Mã vận đơn: Tự động tạo khi giao</p>
                  </div>
                ) : selectedOrder.fulfillmentStatus === 'DANG_DONG_GOI' ? (
                  <div className="space-y-1">
                    <p className="text-xs text-indigo-600 font-semibold">Đang đóng gói - Chờ bàn giao Shipper</p>
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

              {/* Step 1: Confirm & Choose Branch to Pack */}
              {selectedOrder.fulfillmentStatus === 'CHO_XAC_NHAN' && (
                <button
                  onClick={handleOpenAssignBranchModal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold cursor-pointer shadow-sm transition-all"
                >
                  <Building2 className="w-4 h-4" /> Xác nhận & Chọn chi nhánh đóng gói
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

      {/* Modal Chọn Chi Nhánh Đóng Gói */}
      {isAssignBranchOpen && (
        <Modal
          isOpen={isAssignBranchOpen}
          onClose={() => setIsAssignBranchOpen(false)}
          title="Chọn chi nhánh xuất hàng & đóng gói"
        >
          <form onSubmit={handleConfirmAssignBranch} className="space-y-4 p-1">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1 text-xs">
              <p><strong>Mã đơn hàng:</strong> <span className="font-mono text-emerald-600 font-bold">{selectedOrder?.orderCode}</span></p>
              <p><strong>Khách hàng:</strong> {selectedOrder?.customerName} ({selectedOrder?.customerPhone})</p>
              <p><strong>Địa chỉ nhận hàng:</strong> {selectedOrder?.shippingAddress}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Chọn chi nhánh thực hiện đóng gói & trừ tồn kho *
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {branches.map(branch => (
                  <label
                    key={branch.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      String(selectedBranchId) === String(branch.id)
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="branchSelect"
                      value={branch.id}
                      checked={String(selectedBranchId) === String(branch.id)}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" /> {branch.branchName}
                      </p>
                      <p className="text-gray-500 mt-0.5">{branch.address}</p>
                      {branch.phone && <p className="text-gray-400">Hotline: {branch.phone}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Ghi chú đóng gói / Lưu ý cho thủ kho
              </label>
              <textarea
                value={branchPackingNote}
                onChange={(e) => setBranchPackingNote(e.target.value)}
                placeholder="VD: Kiểm tra kỹ tem niêm phong, bọc xốp chống sốc..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsAssignBranchOpen(false)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                <Package className="w-4 h-4" /> Xác nhận & Chuyển sang đóng gói
              </button>
            </div>
          </form>
        </Modal>
      )}

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
                  if (val === 'custom') {
                    setShipperForm({ ...shipperForm, shipperName: '', shipperPhone: '' });
                    return;
                  }
                  const found = availableShippers.find(s => s.id === val);
                  if (found) {
                    setShipperForm({
                      ...shipperForm,
                      shipperName: found.name,
                      shipperPhone: found.phone,
                      carrier: found.carrier || shipperForm.carrier
                    });
                  }
                }}
                className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-sm font-semibold text-emerald-900 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Chọn Shipper / Tài xế từ Đội ngũ nhân sự --</option>
                {availableShippers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
                <option value="custom">-- Nhập tên & SĐT tùy chỉnh --</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Đơn vị vận chuyển *
              </label>
              <select
                value={shipperForm.carrier}
                onChange={(e) => setShipperForm({ ...shipperForm, carrier: e.target.value })}
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
              >
                <option value="">-- Chọn Đơn vị vận chuyển --</option>
                {dynamicCarriers.map(car => (
                  <option key={car} value={car}>{car}</option>
                ))}
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

