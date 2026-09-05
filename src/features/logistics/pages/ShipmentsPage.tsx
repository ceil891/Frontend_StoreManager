import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Package, Truck, Calendar, DollarSign, CheckCircle2, AlertTriangle, User, MapPin } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { CreateButton, SecondaryButton, PrimaryButton, DangerButton } from '@/shared/components/ui/Button';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface ShipmentRecord {
  id: string;
  shipmentCode: string; // SHIP-20260814-000001
  orderCode: string; // ORD-88991
  trackingNumber: string; // VTP-88991122
  carrierTrackingCode: string;
  carrierName: string;
  shippingMethod: string;
  status: 'CREATED' | 'CONFIRMED' | 'PICKUP_PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'DELIVERY_FAILED' | 'RETURNING' | 'RETURNED' | 'CANCELLED';
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderNotes?: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  province: string;
  district: string;
  ward: string;
  recipientNotes?: string;
  goodsType: string;
  goodsDescription: string;
  packageCount: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  declaredValueAmount: number;
  isFragile: boolean;
  isDangerous: boolean;
  isColdStorage: boolean;
  collectCod: boolean;
  codAmount: number;
  codFee: number;
  codCollectionMethod: string;
  committedSla: string;
  estPickupDate: string;
  estDeliveryDate: string;
  deliveryDeadline: string;
  baseShippingFee: number;
  surchargesAmount: number;
  insuranceFee: number;
  returnFee: number;
  totalShippingFee: number;
  notes?: string;
}

export interface OrderLookupOption {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  province?: string;
  district?: string;
  ward?: string;
  totalAmount: number;
  carrier?: string;
  trackingCode?: string;
  goodsDescription?: string;
}

const statusBadgeStyles: Record<ShipmentRecord['status'], string> = {
  CREATED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  PICKUP_PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  PICKED_UP: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-200',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  DELIVERY_FAILED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200',
  RETURNING: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200',
  RETURNED: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
};

const statusLabels: Record<ShipmentRecord['status'], string> = {
  CREATED: 'Mới tạo',
  CONFIRMED: 'Đã xác nhận',
  PICKUP_PENDING: 'Chờ lấy hàng',
  PICKED_UP: 'Đã lấy hàng',
  IN_TRANSIT: 'Đang vận chuyển',
  OUT_FOR_DELIVERY: 'Đang giao hàng',
  DELIVERED: 'Giao thành công',
  DELIVERY_FAILED: 'Giao thất bại',
  RETURNING: 'Đang chuyển hoàn',
  RETURNED: 'Đã hoàn hàng',
  CANCELLED: 'Đã hủy',
};

const DEFAULT_SHIPMENTS: ShipmentRecord[] = [
  {
    id: '1',
    shipmentCode: 'SHIP-20260814-000001',
    orderCode: 'ONLINE-241125',
    trackingNumber: 'VTP-241125',
    carrierTrackingCode: 'VTP-241125',
    carrierName: 'Viettel Post',
    shippingMethod: 'Giao Hỏa Tốc',
    status: 'OUT_FOR_DELIVERY',
    senderName: 'Kho Tổng RetailHub Hà Nội',
    senderPhone: '02439998888',
    senderAddress: 'Số 10 Phạm Hùng, Cầu Giấy, Hà Nội',
    recipientName: 'Nguyễn Huy Hoàng',
    recipientPhone: '0987654321',
    recipientAddress: '123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội',
    province: 'Hà Nội',
    district: 'Quận Cầu Giấy',
    ward: 'Phường Dịch Vọng',
    goodsType: 'Hàng công nghệ',
    goodsDescription: 'Chuột Không Dây Acer M501 & Phụ kiện',
    packageCount: 1,
    totalWeightKg: 0.5,
    totalVolumeM3: 0.002,
    declaredValueAmount: 350000,
    isFragile: true,
    isDangerous: false,
    isColdStorage: false,
    collectCod: true,
    codAmount: 350000,
    codFee: 15000,
    codCollectionMethod: 'Tài khoản ngân hàng / QR Pay',
    committedSla: '24h',
    estPickupDate: '2026-08-28 09:00',
    estDeliveryDate: '2026-08-29 10:00',
    deliveryDeadline: '2026-08-29 12:00',
    baseShippingFee: 30000,
    surchargesAmount: 5000,
    insuranceFee: 10000,
    returnFee: 0,
    totalShippingFee: 45000,
    notes: 'Khách yêu cầu kiểm hàng trước khi nhận.',
  },
  {
    id: '2',
    shipmentCode: 'SHIP-20260814-000002',
    orderCode: 'ORD-99881',
    trackingNumber: 'GHTK-889911',
    carrierTrackingCode: 'GHTK-889911',
    carrierName: 'Giao Hàng Tiết Kiệm (GHTK)',
    shippingMethod: 'Giao Tiêu Chuẩn',
    status: 'IN_TRANSIT',
    senderName: 'Kho Tổng RetailHub Hà Nội',
    senderPhone: '02439998888',
    senderAddress: 'Số 10 Phạm Hùng, Cầu Giấy, Hà Nội',
    recipientName: 'Trần Văn Nam',
    recipientPhone: '0912345678',
    recipientAddress: 'Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    goodsType: 'Điện thoại & Linh kiện',
    goodsDescription: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
    packageCount: 1,
    totalWeightKg: 0.5,
    totalVolumeM3: 0.002,
    declaredValueAmount: 32990000,
    isFragile: true,
    isDangerous: false,
    isColdStorage: false,
    collectCod: true,
    codAmount: 32990000,
    codFee: 15000,
    codCollectionMethod: 'Tài khoản ngân hàng / QR Pay',
    committedSla: '24h',
    estPickupDate: '2026-08-14 09:00',
    estDeliveryDate: '2026-08-15 10:00',
    deliveryDeadline: '2026-08-15 12:00',
    baseShippingFee: 45000,
    surchargesAmount: 10000,
    insuranceFee: 30000,
    returnFee: 0,
    totalShippingFee: 85000,
    notes: 'Hàng giá trị cao, yêu cầu khách đồng kiểm khi nhận.',
  },
];

export function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem('retailhub_shipments_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_SHIPMENTS;
  });

  const [availableOrders, setAvailableOrders] = useState<OrderLookupOption[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<ShipmentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formState, setFormState] = useState<Partial<ShipmentRecord>>({});

  useEffect(() => {
    try {
      localStorage.setItem('retailhub_shipments_list', JSON.stringify(shipments));
    } catch {}
  }, [shipments]);

  useEffect(() => {
    const fetchOrders = async () => {
      const defaultOptions: OrderLookupOption[] = [
        {
          orderCode: 'ONLINE-241125',
          customerName: 'Nguyễn Huy Hoàng',
          customerPhone: '0987654321',
          shippingAddress: '123 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
          province: 'Hà Nội',
          district: 'Quận Cầu Giấy',
          ward: 'Phường Dịch Vọng',
          totalAmount: 350000,
          carrier: 'Viettel Post',
          trackingCode: 'VTP-241125',
          goodsDescription: 'Chuột Không Dây Acer M501 (AMR800)'
        },
        {
          orderCode: 'ORD-99881',
          customerName: 'Trần Văn Nam',
          customerPhone: '0912345678',
          shippingAddress: 'Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM',
          province: 'TP. Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Bến Nghé',
          totalAmount: 32990000,
          carrier: 'Viettel Post Express',
          trackingCode: 'VTP-88991122',
          goodsDescription: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên'
        },
        {
          orderCode: 'ORD-88992',
          customerName: 'Lê Thị Thu Thảo',
          customerPhone: '0933112233',
          shippingAddress: '78 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM',
          province: 'TP. Hồ Chí Minh',
          district: 'Quận 3',
          ward: 'Phường 6',
          totalAmount: 1850000,
          carrier: 'Giao Hàng Tiết Kiệm (GHTK)',
          trackingCode: 'GHTK-992211',
          goodsDescription: 'Bàn phím cơ không dây Bluetooth & Tai nghe Gaming'
        },
        {
          orderCode: 'ORD-41588',
          customerName: 'Phạm Minh Trí',
          customerPhone: '0977889900',
          shippingAddress: '56 Hoàng Diệu, Phường 5, TP. Đà Nẵng',
          province: 'Đà Nẵng',
          district: 'Hải Châu',
          ward: 'Phường Thạch Thang',
          totalAmount: 5200000,
          carrier: 'Giao Hàng Nhanh (GHN)',
          trackingCode: 'GHN-41588',
          goodsDescription: 'Màn hình Dell UltraSharp 27 inch 4K'
        }
      ];

      try {
        const res = await axiosClient.get<any, any>('/sales/orders?size=100');
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.content) ? res.content : []));
        if (list && list.length > 0) {
          const apiOrders: OrderLookupOption[] = list.map((o: any) => ({
            orderCode: o.orderCode || o.code || `ORD-${o.id}`,
            customerName: o.customerName || o.customer?.name || o.recipientName || 'Khách hàng',
            customerPhone: o.customerPhone || o.customer?.phone || o.recipientPhone || '0900000000',
            shippingAddress: o.shippingAddress || o.address || o.customer?.address || 'Hà Nội',
            province: o.province || 'Hà Nội',
            district: o.district || '',
            ward: o.ward || '',
            totalAmount: Number(o.totalAmount || o.finalAmount || 0),
            carrier: o.carrier || 'Viettel Post',
            trackingCode: o.trackingCode || `TRK-${o.id}`,
            goodsDescription: o.items?.map((it: any) => it.productName).join(', ') || 'Hàng hóa'
          }));
          setAvailableOrders([...apiOrders, ...defaultOptions]);
          return;
        }
      } catch {}

      setAvailableOrders(defaultOptions);
    };

    fetchOrders();
  }, []);

  const filtered = useMemo(() => {
    return shipments.filter((s) => {
      const matchSearch =
        s.shipmentCode.toLowerCase().includes(search.toLowerCase()) ||
        s.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        s.recipientPhone.includes(search);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [shipments, search, statusFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormState({
      shipmentCode: `SHIP-20260814-${String(shipments.length + 1).padStart(6, '0')}`,
      orderCode: availableOrders[0]?.orderCode || 'ONLINE-241125',
      trackingNumber: `VTP-${Math.floor(100000 + Math.random() * 900000)}`,
      carrierName: 'Viettel Post',
      shippingMethod: 'Giao Tiêu Chuẩn',
      status: 'CREATED',
      senderName: 'Kho Tổng RetailHub',
      senderPhone: '02439998888',
      senderAddress: 'Số 10 Phạm Hùng, Cầu Giấy, Hà Nội',
      recipientName: availableOrders[0]?.customerName || '',
      recipientPhone: availableOrders[0]?.customerPhone || '',
      recipientAddress: availableOrders[0]?.shippingAddress || '',
      province: availableOrders[0]?.province || 'Hà Nội',
      district: availableOrders[0]?.district || 'Cầu Giấy',
      ward: availableOrders[0]?.ward || 'Dịch Vọng',
      goodsType: 'Hàng điện tử',
      goodsDescription: availableOrders[0]?.goodsDescription || '',
      packageCount: 1,
      totalWeightKg: 1,
      totalVolumeM3: 0.005,
      declaredValueAmount: availableOrders[0]?.totalAmount || 500000,
      isFragile: false,
      isDangerous: false,
      isColdStorage: false,
      collectCod: true,
      codAmount: availableOrders[0]?.totalAmount || 500000,
      codFee: 10000,
      codCollectionMethod: 'Tiền mặt',
      baseShippingFee: 30000,
      surchargesAmount: 0,
      insuranceFee: 0,
      returnFee: 0,
      totalShippingFee: 40000,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shipment: ShipmentRecord) => {
    setModalMode('edit');
    setFormState({ ...shipment });
    setIsModalOpen(true);
  };

  const handleOrderSelect = (orderCode: string) => {
    const found = availableOrders.find(o => o.orderCode === orderCode);
    if (found) {
      setFormState(prev => ({
        ...prev,
        orderCode: found.orderCode,
        recipientName: found.customerName,
        recipientPhone: found.customerPhone,
        recipientAddress: found.shippingAddress,
        province: found.province || prev.province || 'Hà Nội',
        district: found.district || prev.district || '',
        ward: found.ward || prev.ward || '',
        codAmount: found.totalAmount,
        declaredValueAmount: found.totalAmount,
        carrierName: found.carrier || prev.carrierName || 'Viettel Post',
        trackingNumber: found.trackingCode || prev.trackingNumber || `VTP-${Math.floor(100000 + Math.random() * 900000)}`,
        goodsDescription: found.goodsDescription || prev.goodsDescription || '',
      }));
      toast.info(`Đã tự động điền thông tin người nhận từ đơn: ${found.orderCode}`);
    } else {
      setFormState(prev => ({ ...prev, orderCode }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.recipientName?.trim() || !formState.recipientPhone?.trim()) {
      toast.error('Tên và số điện thoại người nhận không được để trống!');
      return;
    }

    if (modalMode === 'edit' && formState.id) {
      const updatedList = shipments.map(s => {
        if (s.id === formState.id) {
          return {
            ...s,
            ...(formState as ShipmentRecord),
            totalShippingFee: (Number(formState.baseShippingFee) || 30000) + (Number(formState.codFee) || 0)
          };
        }
        return s;
      });
      setShipments(updatedList);
      toast.success(`Cập nhật vận đơn ${formState.shipmentCode} thành công!`);
    } else {
      const newRec: ShipmentRecord = {
        id: String(Date.now()),
        shipmentCode: formState.shipmentCode || `SHIP-${Date.now()}`,
        orderCode: formState.orderCode || 'ORD-0000',
        trackingNumber: formState.trackingNumber || 'TRK-0000',
        carrierTrackingCode: formState.trackingNumber || 'TRK-0000',
        carrierName: formState.carrierName || 'Viettel Post',
        shippingMethod: formState.shippingMethod || 'Giao tiêu chuẩn',
        status: formState.status as any || 'CREATED',
        senderName: formState.senderName || 'Kho tổng',
        senderPhone: formState.senderPhone || '0900000000',
        senderAddress: formState.senderAddress || 'Hà Nội',
        recipientName: formState.recipientName!,
        recipientPhone: formState.recipientPhone!,
        recipientAddress: formState.recipientAddress || 'Việt Nam',
        province: formState.province || 'Hà Nội',
        district: formState.district || 'Quận',
        ward: formState.ward || 'Phường',
        goodsType: formState.goodsType || 'Hàng hóa chung',
        goodsDescription: formState.goodsDescription || '',
        packageCount: Number(formState.packageCount) || 1,
        totalWeightKg: Number(formState.totalWeightKg) || 1,
        totalVolumeM3: Number(formState.totalVolumeM3) || 0.01,
        declaredValueAmount: Number(formState.declaredValueAmount) || 0,
        isFragile: Boolean(formState.isFragile),
        isDangerous: Boolean(formState.isDangerous),
        isColdStorage: Boolean(formState.isColdStorage),
        collectCod: Boolean(formState.collectCod),
        codAmount: Number(formState.codAmount) || 0,
        codFee: Number(formState.codFee) || 0,
        codCollectionMethod: formState.codCollectionMethod || 'Tiền mặt',
        committedSla: formState.committedSla || '24h',
        estPickupDate: formState.estPickupDate || '',
        estDeliveryDate: formState.estDeliveryDate || '',
        deliveryDeadline: formState.deliveryDeadline || '',
        baseShippingFee: Number(formState.baseShippingFee) || 30000,
        surchargesAmount: Number(formState.surchargesAmount) || 0,
        insuranceFee: Number(formState.insuranceFee) || 0,
        returnFee: Number(formState.returnFee) || 0,
        totalShippingFee: (Number(formState.baseShippingFee) || 30000) + (Number(formState.codFee) || 0),
        notes: formState.notes || '',
      };

      setShipments([newRec, ...shipments]);
      toast.success(`Tạo vận đơn ${newRec.shipmentCode} thành công!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingShipment) return;
    setShipments(prev => prev.filter(s => s.id !== deletingShipment.id));
    toast.success(`Đã xóa vận đơn ${deletingShipment.shipmentCode}`);
    setDeletingShipment(null);
  };

  const columns = useMemo<ColumnDef<ShipmentRecord>[]>(
    () => [
      {
        accessorKey: 'shipmentCode',
        header: 'Mã vận đơn & Đơn hàng',
        cell: ({ row }) => (
          <div>
            <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
              {row.original.shipmentCode}
            </span>
            <p className="text-xs text-gray-500 font-mono mt-1">Đơn: {row.original.orderCode}</p>
          </div>
        ),
      },
      {
        accessorKey: 'trackingNumber',
        header: 'Mã Tracking & Hãng',
        cell: ({ row }) => (
          <div>
            <p className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">{row.original.trackingNumber}</p>
            <p className="text-xs text-gray-500">{row.original.carrierName} ({row.original.shippingMethod})</p>
          </div>
        ),
      },
      {
        accessorKey: 'recipientName',
        header: 'Người nhận & Địa chỉ',
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{row.original.recipientName} - {row.original.recipientPhone}</p>
            <p className="text-xs text-gray-500 truncate max-w-xs">{row.original.recipientAddress}</p>
          </div>
        ),
      },
      {
        accessorKey: 'codAmount',
        header: 'Tiền thu COD & Phí',
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              {row.original.collectCod ? `${row.original.codAmount.toLocaleString()} VNĐ` : 'Không thu COD'}
            </p>
            <p className="text-gray-500">Cước phí: {row.original.totalShippingFee.toLocaleString()} VNĐ</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái vận đơn',
        cell: (info) => {
          const st = info.getValue() as ShipmentRecord['status'];
          return (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusBadgeStyles[st]}`}>
              {statusLabels[st] || st}
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
              onClick={() => setSelectedShipment(row.original)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300 cursor-pointer"
              title="Xem chi tiết vận đơn"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 cursor-pointer"
              title="Chỉnh sửa vận đơn"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingShipment(row.original)}
              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-600 dark:text-red-400 cursor-pointer"
              title="Xóa vận đơn"
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
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" /> Quản lý danh sách vận đơn (Shipments)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý vận đơn hàng hóa, mã tracking, thông tin người gửi/nhận, tiền thu hộ COD và cước phí.
          </p>
        </div>
        <CreateButton onClick={handleOpenCreate}>
          Tạo vận đơn mới
        </CreateButton>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <SearchInput
          placeholder="Tìm theo mã vận đơn, mã đơn hàng, mã tracking, tên hoặc SĐT người nhận..."
          value={search}
          onValueChange={setSearch}
          containerClassName="flex-1 w-full"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="CREATED">Mới tạo</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="PICKUP_PENDING">Chờ lấy hàng</option>
            <option value="PICKED_UP">Đã lấy hàng</option>
            <option value="IN_TRANSIT">Đang vận chuyển</option>
            <option value="OUT_FOR_DELIVERY">Đang giao hàng</option>
            <option value="DELIVERED">Giao thành công</option>
            <option value="DELIVERY_FAILED">Giao thất bại</option>
            <option value="RETURNING">Đang chuyển hoàn</option>
            <option value="RETURNED">Đã hoàn hàng</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
        </div>
      </div>

      <ReusableDataTable
        data={filtered}
        columns={columns}
      />

      {/* Modal Xem chi tiết */}
      {selectedShipment && (
        <Modal
          isOpen={Boolean(selectedShipment)}
          onClose={() => setSelectedShipment(null)}
          title={`Chi tiết Vận đơn: ${selectedShipment.shipmentCode}`}
          size="erp"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold">Mã vận đơn & Tracking</p>
                <p className="text-lg font-mono font-bold text-primary">{selectedShipment.shipmentCode}</p>
                <p className="text-sm font-mono text-emerald-600 font-bold mt-0.5">Tracking: {selectedShipment.trackingNumber} ({selectedShipment.carrierName})</p>
              </div>
              <div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${statusBadgeStyles[selectedShipment.status]}`}>
                  {statusLabels[selectedShipment.status] || selectedShipment.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <User className="w-4 h-4" /> THÔNG TIN NGƯỜI GỬI
                </div>
                <p className="font-semibold text-sm">{selectedShipment.senderName}</p>
                <p className="text-xs text-gray-500 font-mono">SĐT: {selectedShipment.senderPhone}</p>
                <p className="text-xs text-gray-500">{selectedShipment.senderAddress}</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <MapPin className="w-4 h-4" /> THÔNG TIN NGƯỜI NHẬN
                </div>
                <p className="font-semibold text-sm">{selectedShipment.recipientName}</p>
                <p className="text-xs text-gray-500 font-mono">SĐT: {selectedShipment.recipientPhone}</p>
                <p className="text-xs text-gray-500">{selectedShipment.recipientAddress}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <p className="text-xs text-gray-500 font-semibold">Thu hộ COD</p>
                <p className="text-base font-bold text-emerald-600 font-mono">
                  {selectedShipment.collectCod ? `${selectedShipment.codAmount.toLocaleString()} VNĐ` : 'Không thu COD'}
                </p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <p className="text-xs text-gray-500 font-semibold">Tổng cước phí</p>
                <p className="text-base font-bold text-gray-900 dark:text-white font-mono">{selectedShipment.totalShippingFee.toLocaleString()} VNĐ</p>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
                <p className="text-xs text-gray-500 font-semibold">Thời gian giao dự kiến</p>
                <p className="text-xs font-bold text-blue-600 mt-1">{selectedShipment.estDeliveryDate || 'Trong vòng 24-48 giờ'}</p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border space-y-2 text-xs">
              <p className="font-bold text-gray-700 dark:text-gray-300">Nội dung hàng hóa & Ghi chú:</p>
              <p className="text-gray-600 dark:text-gray-400">Loại hàng: <span className="font-semibold">{selectedShipment.goodsType}</span> - Trọng lượng: <span className="font-semibold">{selectedShipment.totalWeightKg} kg</span></p>
              <p className="text-gray-600 dark:text-gray-400">Mô tả: {selectedShipment.goodsDescription || 'Không có mô tả chi tiết'}</p>
              {selectedShipment.notes && (
                <p className="text-amber-600 font-medium">Ghi chú giao hàng: {selectedShipment.notes}</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Tạo / Sửa Vận Đơn */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'create' ? 'Tạo Vận Đơn Mới' : `Chỉnh Sửa Vận Đơn ${formState.shipmentCode}`}
          size="erp"
        >
          <form onSubmit={handleSave} className="space-y-6">
            {/* Section 1: Thông tin vận đơn */}
            <div className="erp-form-section space-y-3">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm border-b pb-2">1. Thông tin vận đơn & Đơn hàng liên kết</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã vận đơn *</label>
                  <input
                    type="text"
                    required
                    value={formState.shipmentCode || ''}
                    onChange={(e) => setFormState({ ...formState, shipmentCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã đơn hàng (Chọn để tự động điền) *</label>
                  <div className="relative">
                    <select
                      value={formState.orderCode || ''}
                      onChange={(e) => handleOrderSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg font-mono text-sm font-bold text-emerald-900 dark:text-emerald-200 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Chọn đơn hàng để truy xuất thông tin --</option>
                      {availableOrders.map(o => (
                        <option key={o.orderCode} value={o.orderCode}>
                          {o.orderCode} — {o.customerName} ({o.totalAmount.toLocaleString()} ₫)
                        </option>
                      ))}
                      <option value="custom">-- Nhập mã đơn tùy chỉnh --</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={formState.trackingNumber || ''}
                    onChange={(e) => setFormState({ ...formState, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm text-emerald-600 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trạng thái *</label>
                  <select
                    value={formState.status || 'CREATED'}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-bold"
                  >
                    <option value="CREATED">CREATED - Mới tạo</option>
                    <option value="CONFIRMED">CONFIRMED - Đã xác nhận</option>
                    <option value="PICKUP_PENDING">PICKUP_PENDING - Chờ lấy hàng</option>
                    <option value="PICKED_UP">PICKED_UP - Đã lấy hàng</option>
                    <option value="IN_TRANSIT">IN_TRANSIT - Đang vận chuyển</option>
                    <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY - Đang giao hàng</option>
                    <option value="DELIVERED">DELIVERED - Giao thành công</option>
                    <option value="DELIVERY_FAILED">DELIVERY_FAILED - Giao thất bại</option>
                    <option value="CANCELLED">CANCELLED - Đã hủy</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Carrier đối tác *</label>
                  <input
                    type="text"
                    required
                    value={formState.carrierName || 'Viettel Post'}
                    onChange={(e) => setFormState({ ...formState, carrierName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phương thức vận chuyển *</label>
                  <input
                    type="text"
                    required
                    value={formState.shippingMethod || 'Giao Hỏa Tốc'}
                    onChange={(e) => setFormState({ ...formState, shippingMethod: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Section 2 & 3: Người gửi & Người nhận */}
            <div className="grid grid-cols-2 gap-6">
              <div className="erp-form-section space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm border-b pb-2">2. Thông tin Người gửi</h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Tên người gửi / Kho *</label>
                  <input
                    type="text"
                    required
                    value={formState.senderName || 'Kho Tổng RetailHub'}
                    onChange={(e) => setFormState({ ...formState, senderName: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">SĐT Người gửi *</label>
                  <input
                    type="text"
                    required
                    value={formState.senderPhone || '02439998888'}
                    onChange={(e) => setFormState({ ...formState, senderPhone: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Địa chỉ kho gửi *</label>
                  <input
                    type="text"
                    required
                    value={formState.senderAddress || 'Số 10 Phạm Hùng, Cầu Giấy, Hà Nội'}
                    onChange={(e) => setFormState({ ...formState, senderAddress: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs"
                  />
                </div>
              </div>

              <div className="erp-form-section space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900">
                <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm border-b border-emerald-200 dark:border-emerald-900 pb-2">
                  3. Thông tin Người nhận (Tự động điền)
                </h4>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Họ và tên người nhận *</label>
                  <input
                    type="text"
                    required
                    value={formState.recipientName || ''}
                    onChange={(e) => setFormState({ ...formState, recipientName: e.target.value })}
                    placeholder="Tự động điền khi chọn đơn..."
                    className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={formState.recipientPhone || ''}
                    onChange={(e) => setFormState({ ...formState, recipientPhone: e.target.value })}
                    placeholder="Tự động điền..."
                    className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Địa chỉ giao hàng *</label>
                  <input
                    type="text"
                    required
                    value={formState.recipientAddress || ''}
                    onChange={(e) => setFormState({ ...formState, recipientAddress: e.target.value })}
                    placeholder="Tự động điền địa chỉ..."
                    className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 4 & 5: Hàng hóa & COD */}
            <div className="grid grid-cols-2 gap-6">
              <div className="erp-form-section space-y-3">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm border-b pb-2">4. Thông tin hàng hóa</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Loại hàng *</label>
                    <input
                      type="text"
                      required
                      value={formState.goodsType || 'Hàng điện tử'}
                      onChange={(e) => setFormState({ ...formState, goodsType: e.target.value })}
                      className="w-full px-3 py-1.5 border rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Tổng trọng lượng (kg) *</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={formState.totalWeightKg || 1}
                      onChange={(e) => setFormState({ ...formState, totalWeightKg: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border rounded text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Mô tả sản phẩm</label>
                  <input
                    type="text"
                    value={formState.goodsDescription || ''}
                    onChange={(e) => setFormState({ ...formState, goodsDescription: e.target.value })}
                    placeholder="Ví dụ: Chuột Acer M501..."
                    className="w-full px-3 py-1.5 border rounded text-xs"
                  />
                </div>
              </div>

              <div className="erp-form-section space-y-3">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm border-b pb-2">5. Thu hộ COD & SLA</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Số tiền COD (VNĐ)</label>
                    <input
                      type="number"
                      value={formState.codAmount || 0}
                      onChange={(e) => setFormState({ ...formState, codAmount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 border rounded text-xs font-mono font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">SLA Cam kết</label>
                    <input
                      type="text"
                      value={formState.committedSla || '24h'}
                      onChange={(e) => setFormState({ ...formState, committedSla: e.target.value })}
                      className="w-full px-3 py-1.5 border rounded text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Ghi chú vận chuyển</label>
                  <input
                    type="text"
                    value={formState.notes || ''}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    placeholder="Ví dụ: Khách xem hàng trước khi nhận..."
                    className="w-full px-3 py-1.5 border rounded text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <SecondaryButton
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                Hủy
              </SecondaryButton>
              <PrimaryButton
                type="submit"
              >
                {modalMode === 'create' ? 'Lưu Vận Đơn' : 'Cập Nhật Vận Đơn'}
              </PrimaryButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingShipment && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingShipment)}
          onClose={() => setDeletingShipment(null)}
          onConfirm={handleDeleteConfirm}
          title="Xác nhận xóa vận đơn"
          description={`Bạn có chắc chắn muốn xóa vận đơn ${deletingShipment.shipmentCode} (Đơn hàng: ${deletingShipment.orderCode}) không? Hành động này không thể hoàn tác.`}
        />
      )}
    </div>
  );
}

export default ShipmentsPage;
