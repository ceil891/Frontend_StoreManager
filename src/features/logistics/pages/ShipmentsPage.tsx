import { useMemo, useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Package, Truck, Calendar, DollarSign, CheckCircle2, AlertTriangle, User, MapPin } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { CreateButton, SecondaryButton, PrimaryButton, DangerButton } from '@/shared/components/ui/Button';

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

export function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentRecord[]>([
    {
      id: '1',
      shipmentCode: 'SHIP-20260814-000001',
      orderCode: 'ORD-99881',
      trackingNumber: 'VTP-88991122',
      carrierTrackingCode: 'VTP-88991122',
      carrierName: 'Viettel Post Express',
      shippingMethod: 'Giao Hỏa Tốc',
      status: 'OUT_FOR_DELIVERY',
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
      totalShippingFee: 100000,
      notes: 'Hàng giá trị cao, yêu cầu khách đồng kiểm khi nhận.',
    },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<Partial<ShipmentRecord>>({});

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
    setFormState({
      shipmentCode: `SHIP-20260814-${String(shipments.length + 1).padStart(6, '0')}`,
      orderCode: `ORD-${Math.floor(10000 + Math.random() * 90000)}`,
      trackingNumber: `VTP-${Math.floor(100000 + Math.random() * 900000)}`,
      carrierName: 'Viettel Post',
      shippingMethod: 'Giao Tiêu Chuẩn',
      status: 'CREATED',
      senderName: 'Kho Tổng RetailHub',
      senderPhone: '02439998888',
      senderAddress: 'Số 10 Phạm Hùng, Cầu Giấy, Hà Nội',
      recipientName: '',
      recipientPhone: '',
      recipientAddress: '',
      province: 'Hà Nội',
      district: 'Cầu Giấy',
      ward: 'Dịch Vọng',
      goodsType: 'Hàng điện tử',
      goodsDescription: '',
      packageCount: 1,
      totalWeightKg: 1,
      totalVolumeM3: 0.005,
      declaredValueAmount: 500000,
      isFragile: false,
      isDangerous: false,
      isColdStorage: false,
      collectCod: true,
      codAmount: 500000,
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.recipientName?.trim() || !formState.recipientPhone?.trim()) {
      toast.error('Tên và số điện thoại người nhận không được để trống!');
      return;
    }

    const newRec: ShipmentRecord = {
      id: String(Date.now()),
      shipmentCode: formState.shipmentCode || `SHIP-${Date.now()}`,
      orderCode: formState.orderCode || 'ORD-0000',
      trackingNumber: formState.trackingNumber || 'TRK-0000',
      carrierTrackingCode: formState.trackingNumber || 'TRK-0000',
      carrierName: formState.carrierName || 'Carrier',
      shippingMethod: formState.shippingMethod || 'Giao tiêu chuẩn',
      status: formState.status as any || 'CREATED',
      senderName: formState.senderName || 'Kho tổng',
      senderPhone: formState.senderPhone || '0900000000',
      senderAddress: formState.senderAddress || 'Hà Nội',
      recipientName: formState.recipientName,
      recipientPhone: formState.recipientPhone,
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
    setIsModalOpen(false);
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
          <button
            onClick={() => setSelectedShipment(row.original)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300"
            title="Xem chi tiết vận đơn"
          >
            <Eye className="w-4 h-4" />
          </button>
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
        <CreateButton
          onClick={handleOpenCreate}
        >
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
            <option value="OUT_FOR_DELIVERY">Đang giao hàng</option>
            <option value="DELIVERED">Giao thành công</option>
            <option value="DELIVERY_FAILED">Giao thất bại</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <ReusableDataTable columns={columns} data={filtered} />
      </div>

      {/* Form Tạo Vận Đơn (Form 9) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Form Tạo Vận Đơn Mới (Shipment Form)"
        width="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-6 text-sm">
          {/* Section 1: Thông tin vận đơn */}
          <div className="erp-form-section space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white border-b pb-2">1. Thông tin vận đơn</h3>
            <div className="grid grid-cols-4 gap-4">
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã đơn hàng *</label>
                <input
                  type="text"
                  required
                  value={formState.orderCode || ''}
                  onChange={(e) => setFormState({ ...formState, orderCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                />
              </div>
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
              <h4 className="font-bold text-gray-900 dark:text-white text-sm border-b pb-2">2. Người gửi (Sender)</h4>
              <div>
                <label className="block text-xs font-semibold text-gray-500">Tên người gửi *</label>
                <input
                  type="text"
                  required
                  value={formState.senderName || ''}
                  onChange={(e) => setFormState({ ...formState, senderName: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={formState.senderPhone || ''}
                  onChange={(e) => setFormState({ ...formState, senderPhone: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500">Địa chỉ lấy hàng *</label>
                <input
                  type="text"
                  required
                  value={formState.senderAddress || ''}
                  onChange={(e) => setFormState({ ...formState, senderAddress: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs"
                />
              </div>
            </div>

            <div className="erp-form-section space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm border-b pb-2">3. Người nhận (Recipient)</h4>
              <div>
                <label className="block text-xs font-semibold text-gray-500">Tên người nhận *</label>
                <input
                  type="text"
                  required
                  value={formState.recipientName || ''}
                  onChange={(e) => setFormState({ ...formState, recipientName: e.target.value })}
                  className="w-full px-3 py-1.5 border rounded bg-white dark:bg-gray-800 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500">Số điện thoại *</label>
                <input
                  type="text"
                  required
                  value={formState.recipientPhone || ''}
                  onChange={(e) => setFormState({ ...formState, recipientPhone: e.target.value })}
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
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow"
            >
              Lưu Vận Đơn
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
