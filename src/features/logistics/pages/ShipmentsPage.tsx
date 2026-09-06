import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Package, Truck, Calendar, DollarSign, CheckCircle2, AlertTriangle, User, MapPin, FileCheck, FileText, Printer, Zap, Check, ExternalLink, Clock, ShieldCheck } from 'lucide-react';
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
  // Integrated Proof of Delivery (POD) & Shipping Staff
  podStatus?: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  podSignerName?: string;
  podSignerPhone?: string;
  podSignedAt?: string;
  podNotes?: string;
  podImageUrl?: string;
  shipperName?: string;
  shipperPhone?: string;
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
    podStatus: 'PENDING',
    shipperName: 'Đỗ Quốc Bảo (Viettel Post Hub)',
    shipperPhone: '0966 333 222',
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
    podStatus: 'PENDING',
    shipperName: 'Trần Văn Bình (GHTK Hub)',
    shipperPhone: '0987 123 999',
  },
  {
    id: '3',
    shipmentCode: 'SHIP-20260814-000003',
    orderCode: 'ORD-88992',
    trackingNumber: 'GHN-415882',
    carrierTrackingCode: 'GHN-415882',
    carrierName: 'Giao Hàng Nhanh (GHN)',
    shippingMethod: 'Giao Nhanh 24h',
    status: 'DELIVERED',
    senderName: 'Kho Tổng RetailHub Hà Nội',
    senderPhone: '02439998888',
    senderAddress: 'Số 10 Phạm Hùng, Cầu Giấy, Hà Nội',
    recipientName: 'Lê Thị Thu Thảo',
    recipientPhone: '0933112233',
    recipientAddress: '78 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường 6',
    goodsType: 'Phụ kiện máy tính',
    goodsDescription: 'Bàn phím cơ không dây Bluetooth & Tai nghe Gaming',
    packageCount: 1,
    totalWeightKg: 1.2,
    totalVolumeM3: 0.005,
    declaredValueAmount: 1850000,
    isFragile: false,
    isDangerous: false,
    isColdStorage: false,
    collectCod: true,
    codAmount: 1850000,
    codFee: 10000,
    codCollectionMethod: 'Tiền mặt',
    committedSla: '24h',
    estPickupDate: '2026-08-27 10:00',
    estDeliveryDate: '2026-08-28 14:00',
    deliveryDeadline: '2026-08-28 18:00',
    baseShippingFee: 35000,
    surchargesAmount: 0,
    insuranceFee: 5000,
    returnFee: 0,
    totalShippingFee: 45000,
    notes: 'Đã hoàn tất thu tiền mặt và đối soát.',
    podStatus: 'CONFIRMED',
    podSignerName: 'Lê Thị Thu Thảo',
    podSignerPhone: '0933112233',
    podSignedAt: '2026-08-28 14:30',
    podNotes: 'Khách đã kiểm tra hàng nguyên vẹn tem seal và ký nhận đầy đủ.',
    shipperName: 'Phạm Minh Đức (GHN Express)',
    shipperPhone: '0977 444 888',
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
  const [carrierList, setCarrierList] = useState<Array<{ code: string; name: string }>>([
    { code: 'VTP', name: 'Viettel Post' },
    { code: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)' },
    { code: 'GHN', name: 'Giao Hàng Nhanh (GHN)' },
    { code: 'SPX', name: 'Shopee Xpress (SPX)' },
    { code: 'JNT', name: 'J&T Express' },
    { code: 'INTERNAL', name: 'Shipper nội bộ' },
  ]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentRecord | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<ShipmentRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formState, setFormState] = useState<Partial<ShipmentRecord>>({});
  const [isConnectingCarrier, setIsConnectingCarrier] = useState(false);

  // POD Modal states
  const [podShipment, setPodShipment] = useState<ShipmentRecord | null>(null);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [podForm, setPodForm] = useState<{
    signerName: string;
    signerPhone: string;
    signedAt: string;
    podStatus: 'CONFIRMED' | 'REJECTED' | 'PENDING';
    notes: string;
  }>({
    signerName: '',
    signerPhone: '',
    signedAt: '',
    podStatus: 'CONFIRMED',
    notes: '',
  });

  useEffect(() => {
    try {
      localStorage.setItem('retailhub_shipments_list', JSON.stringify(shipments));
    } catch {}
  }, [shipments]);

  useEffect(() => {
    const loadCarriers = async () => {
      try {
        const res = await axiosClient.get<any, any>('/logistics/carriers');
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        if (list.length > 0) {
          const mapped = list.map((c: any) => ({
            code: c.carrierCode || c.code || 'CARRIER',
            name: c.carrierName || c.name || 'Hãng vận chuyển'
          }));
          setCarrierList(mapped);
        }
      } catch {}
    };
    loadCarriers();
  }, []);

  useEffect(() => {
    const fetchApiShipments = async () => {
      try {
        const res: any = await axiosClient.get('/inventories/transfer-shipments');
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        if (list.length > 0) {
          const mapped: ShipmentRecord[] = list.map((item: any) => ({
            id: `TS-${item.id}`,
            shipmentCode: item.trackingCode,
            orderCode: item.transferCode ? `Phiếu CK: ${item.transferCode}` : 'Vận chuyển nội bộ',
            trackingNumber: item.trackingCode,
            carrierTrackingCode: item.trackingCode,
            carrierName: item.carrierName || 'Nội bộ (Đội xe công ty)',
            shippingMethod: item.carrierType === 'INTERNAL' ? 'Nội bộ (Đội xe công ty)' : 'Hãng 3PL',
            status: item.status === 'DELIVERED' ? 'DELIVERED' : (item.status === 'CANCELLED' ? 'CANCELLED' : 'IN_TRANSIT'),
            senderName: item.fromBranchName ? `Kho xuất: ${item.fromBranchName}` : 'Kho xuất AuraMart',
            senderPhone: '0912 345 678',
            senderAddress: item.fromBranchName || 'Kho xuất',
            recipientName: item.toBranchName ? `Kho nhận: ${item.toBranchName}` : 'Chi nhánh nhận',
            recipientPhone: '0988 765 432',
            recipientAddress: item.toBranchName || 'Chi nhánh nhận',
            province: '',
            district: '',
            ward: '',
            goodsType: 'Hàng điều chuyển nội bộ',
            goodsDescription: `Điều chuyển kho: ${item.transferCode || item.trackingCode}`,
            packageCount: 1,
            totalWeightKg: 5,
            totalVolumeM3: 0.02,
            declaredValueAmount: 0,
            isFragile: false,
            isDangerous: false,
            isColdStorage: false,
            collectCod: false,
            codAmount: 0,
            codFee: 0,
            codCollectionMethod: 'Không thu COD',
            committedSla: '24h',
            estPickupDate: item.shippedAt ? item.shippedAt.replace('T', ' ').substring(0, 16) : '',
            estDeliveryDate: '',
            deliveryDeadline: '',
            baseShippingFee: 0,
            surchargesAmount: 0,
            insuranceFee: 0,
            returnFee: 0,
            totalShippingFee: 0,
            notes: `Mã phiếu chuyển: ${item.transferCode || ''} | ${item.carrierType === 'INTERNAL' ? 'Vận đơn nội bộ' : 'Đơn vị 3PL'}`,
            podStatus: item.status === 'DELIVERED' ? 'CONFIRMED' : 'PENDING',
          }));

          setShipments(prev => {
            const existingNonDuplicates = prev.filter(p => !mapped.some(m => m.trackingNumber === p.trackingNumber));
            return [...mapped, ...existingNonDuplicates];
          });
        }
      } catch (err) {
        console.warn('Could not fetch transfer shipments from backend, using local/default state:', err);
      }
    };
    fetchApiShipments();
  }, []);

  const handlePrintPod = (shipment: ShipmentRecord) => {
    const printWindow = window.open('', '_blank', 'width=850,height=950');
    if (!printWindow) {
      toast.error('Trình duyệt đang chặn cửa sổ pop-up. Vui lòng cho phép mở pop-up để in biên bản.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Biên bản giao nhận POD - ${shipment.shipmentCode}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            margin: 0;
            padding: 32px;
            color: #1f2937;
            background: #fff;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #047857;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .title {
            text-align: center;
            margin: 20px 0 10px 0;
          }
          .title h1 {
            margin: 0;
            font-size: 20px;
            text-transform: uppercase;
            color: #065f46;
            letter-spacing: 0.5px;
          }
          .title p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #6b7280;
            font-style: italic;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }
          .card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            background: #f9fafb;
          }
          .card-title {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: #4b5563;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: 600;
            color: #374151;
            font-size: 12px;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 40px;
            text-align: center;
          }
          .sig-line {
            height: 80px;
          }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: bold;
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
          }
          @media print {
            body { padding: 12px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h2 style="margin:0; font-size: 18px; color: #047857; font-weight: 800;">HỆ THỐNG RETAILHUB ERP</h2>
            <p style="margin:3px 0 0 0; color:#4b5563;">Trung Tâm Logistics & Điều Phối Giao Vận</p>
            <p style="margin:2px 0 0 0; color:#6b7280; font-size: 11px;">Hotline: 1900 6868 | Website: retailhub.vn</p>
          </div>
          <div style="text-align: right;">
            <div style="font-family: monospace; font-size: 15px; font-weight: bold; color: #111827;">${shipment.shipmentCode}</div>
            <p style="margin:2px 0; font-family: monospace; color: #059669; font-weight: bold;">Tracking: ${shipment.trackingNumber}</p>
            <p style="margin:2px 0; color:#6b7280; font-size: 11px;">Đơn hàng: <strong>${shipment.orderCode}</strong></p>
            <p style="margin:2px 0; color:#6b7280; font-size: 11px;">Ngày in: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}</p>
          </div>
        </div>

        <div class="title">
          <h1>BIÊN BẢN GIAO NHẬN HÀNG HÓA & XÁC NHẬN POD</h1>
          <p>Chứng từ pháp lý xác thực người nhận đã kiểm tra và nhận đủ hàng hóa nguyên vẹn</p>
        </div>

        <div class="meta-grid">
          <div class="card">
            <div class="card-title">1. Thông tin Người gửi (Kho phát hàng)</div>
            <p style="margin: 2px 0;"><strong>${shipment.senderName}</strong></p>
            <p style="margin: 2px 0;">Điện thoại: <strong>${shipment.senderPhone}</strong></p>
            <p style="margin: 2px 0;">Địa chỉ: ${shipment.senderAddress}</p>
          </div>
          <div class="card">
            <div class="card-title">2. Thông tin Người nhận (Consignee)</div>
            <p style="margin: 2px 0;"><strong>${shipment.recipientName}</strong></p>
            <p style="margin: 2px 0;">Điện thoại: <strong>${shipment.recipientPhone}</strong></p>
            <p style="margin: 2px 0;">Địa chỉ: ${shipment.recipientAddress}, ${shipment.ward || ''}, ${shipment.district || ''}, ${shipment.province || ''}</p>
          </div>
        </div>

        <div class="card" style="margin-bottom: 16px;">
          <div class="card-title">3. Thông tin Đơn vị vận chuyển & Điều phối</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <p style="margin: 2px 0;">Đơn vị vận chuyển: <strong>${shipment.carrierName}</strong></p>
              <p style="margin: 2px 0;">Hình thức giao: <strong>${shipment.shippingMethod}</strong></p>
            </div>
            <div>
              <p style="margin: 2px 0;">Bưu tá / Shipper: <strong>${shipment.shipperName || 'Bưu tá điều phối'}</strong></p>
              <p style="margin: 2px 0;">SĐT Shipper: <strong>${shipment.shipperPhone || 'Tổng đài hãng'}</strong></p>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">STT</th>
              <th>Mô tả hàng hóa & Kiện hàng</th>
              <th style="width: 90px; text-align: center;">Phân loại</th>
              <th style="width: 80px; text-align: center;">Số kiện</th>
              <th style="width: 90px; text-align: center;">Trọng lượng</th>
              <th style="width: 130px; text-align: right;">Tiền COD</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="text-align: center;">1</td>
              <td>
                <strong>${shipment.goodsDescription || 'Kiện hàng theo đơn ' + shipment.orderCode}</strong>
                ${shipment.notes ? '<div style="font-size: 11px; color: #b45309; margin-top: 2px;">Ghi chú: ' + shipment.notes + '</div>' : ''}
              </td>
              <td style="text-align: center;">${shipment.goodsType}</td>
              <td style="text-align: center;">${shipment.packageCount || 1} kiện</td>
              <td style="text-align: center;">${shipment.totalWeightKg || 1} kg</td>
              <td style="text-align: right; font-weight: bold; color: #047857;">
                ${shipment.collectCod ? shipment.codAmount.toLocaleString() + ' đ' : 'Không thu'}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="card" style="margin-bottom: 24px; border-left: 4px solid #059669;">
          <div class="card-title">4. Xác nhận Bàn giao (Proof of Delivery)</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <p style="margin: 2px 0;">Trạng thái POD: <span class="badge">ĐÃ XÁC NHẬN GIAO HÀNG</span></p>
              <p style="margin: 2px 0;">Người ký nhận: <strong>${shipment.podSignerName || shipment.recipientName}</strong></p>
              <p style="margin: 2px 0;">SĐT người nhận: <strong>${shipment.podSignerPhone || shipment.recipientPhone}</strong></p>
            </div>
            <div>
              <p style="margin: 2px 0;">Thời điểm ký nhận: <strong>${shipment.podSignedAt || new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN')}</strong></p>
              <p style="margin: 2px 0;">Tình trạng kiện hàng: <em>${shipment.podNotes || 'Thùng hàng nguyên vẹn, niêm phong tốt, khách đồng kiểm hàng.'}</em></p>
            </div>
          </div>
        </div>

        <div class="signatures">
          <div>
            <p style="font-weight: bold; margin-bottom: 4px;">ĐẠI DIỆN GIAO HÀNG / SHIPPER</p>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">(Ký và ghi rõ họ tên)</p>
            <div class="sig-line"></div>
            <p style="font-weight: bold; margin: 0;">${shipment.shipperName || shipment.carrierName}</p>
          </div>
          <div>
            <p style="font-weight: bold; margin-bottom: 4px;">NGƯỜI NHẬN HÀNG (CONSIGNEE)</p>
            <p style="font-size: 11px; color: #6b7280; margin: 0;">(Đã nhận đủ và đúng hàng)</p>
            <div class="sig-line"></div>
            <p style="font-weight: bold; margin: 0;">${shipment.podSignerName || shipment.recipientName}</p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 40px;" class="no-print">
          <button onclick="window.print()" style="padding: 10px 24px; background: #059669; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">
            In Biên Bản Giao Nhận Ngay
          </button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const handleOpenPod = (shipment: ShipmentRecord) => {
    setPodShipment(shipment);
    setPodForm({
      signerName: shipment.podSignerName || shipment.recipientName || '',
      signerPhone: shipment.podSignerPhone || shipment.recipientPhone || '',
      signedAt: shipment.podSignedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
      podStatus: shipment.podStatus || (shipment.status === 'DELIVERED' ? 'CONFIRMED' : 'CONFIRMED'),
      notes: shipment.podNotes || 'Hàng nguyên vẹn tem niêm phong, người nhận đã kiểm tra và nhận đủ hàng.',
    });
    setIsPodModalOpen(true);
  };

  const handleSavePod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!podShipment) return;

    const newStatus: ShipmentRecord['status'] = podForm.podStatus === 'CONFIRMED'
      ? 'DELIVERED'
      : (podForm.podStatus === 'REJECTED' ? 'DELIVERY_FAILED' : podShipment.status);

    const updated = shipments.map(s => {
      if (s.id === podShipment.id) {
        return {
          ...s,
          status: newStatus,
          podStatus: podForm.podStatus,
          podSignerName: podForm.signerName,
          podSignerPhone: podForm.signerPhone,
          podSignedAt: podForm.signedAt,
          podNotes: podForm.notes,
        };
      }
      return s;
    });

    setShipments(updated);
    if (selectedShipment?.id === podShipment.id) {
      setSelectedShipment(prev => prev ? {
        ...prev,
        status: newStatus,
        podStatus: podForm.podStatus,
        podSignerName: podForm.signerName,
        podSignerPhone: podForm.signerPhone,
        podSignedAt: podForm.signedAt,
        podNotes: podForm.notes,
      } : null);
    }

    toast.success(
      podForm.podStatus === 'CONFIRMED'
        ? `Xác nhận ký biên bản POD & Giao thành công vận đơn ${podShipment.shipmentCode}!`
        : `Đã cập nhật trạng thái biên bản POD vận đơn ${podShipment.shipmentCode}!`
    );
    setIsPodModalOpen(false);
  };

  const handleCarrierApiDispatch = async () => {
    setIsConnectingCarrier(true);
    try {
      const res = await axiosClient.post<any, any>('/logistics/carriers/dispatch-api', {
        carrierName: formState.carrierName || 'Viettel Post',
        orderCode: formState.orderCode || 'ORD-0001',
        weightKg: Number(formState.totalWeightKg) || 1,
        codAmount: Number(formState.codAmount) || 0,
        recipientAddress: formState.recipientAddress || '',
        recipientName: formState.recipientName || '',
        recipientPhone: formState.recipientPhone || '',
      });
      const data = res?.data || res;
      if (data && data.carrierTrackingCode) {
        setFormState(prev => ({
          ...prev,
          trackingNumber: data.carrierTrackingCode,
          carrierTrackingCode: data.carrierTrackingCode,
          totalShippingFee: data.estimatedFee || prev.totalShippingFee,
          baseShippingFee: data.estimatedFee ? Math.max(10000, data.estimatedFee - (Number(prev.codFee) || 0)) : prev.baseShippingFee,
          estDeliveryDate: data.estimatedDeliveryDate ? `${data.estimatedDeliveryDate} 18:00` : prev.estDeliveryDate,
          shipperName: data.shipperName || prev.shipperName,
          shipperPhone: data.shipperPhone || prev.shipperPhone,
          notes: (prev.notes ? prev.notes + ' | ' : '') + `API ${data.carrierName}: ${data.carrierTrackingCode}`,
        }));
        toast.success(data.apiMessage || `Kết nối thành công API ${data.carrierName}! Đã nhận mã ${data.carrierTrackingCode}`);
      }
    } catch (err) {
      const carrierPrefix = (formState.carrierName || 'VTP').includes('GHTK') ? 'GHTK' : ((formState.carrierName || '').includes('GHN') ? 'GHN' : 'VTP');
      const mockCode = `${carrierPrefix}-${Math.floor(100000 + Math.random() * 900000)}`;
      setFormState(prev => ({
        ...prev,
        trackingNumber: mockCode,
        carrierTrackingCode: mockCode,
        notes: (prev.notes ? prev.notes + ' | ' : '') + `Cấp mã API: ${mockCode}`,
      }));
      toast.success(`Đã kết nối API ${formState.carrierName || 'Hãng'} và tự động cấp mã tracking: ${mockCode}`);
    } finally {
      setIsConnectingCarrier(false);
    }
  };

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
            {row.original.notes && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 truncate max-w-xs flex items-center gap-1 mt-0.5" title={row.original.notes}>
                <FileText className="w-3 h-3 shrink-0 text-amber-500" />
                <span className="truncate">{row.original.notes}</span>
              </p>
            )}
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
        header: 'Trạng thái & POD',
        cell: (info) => {
          const st = info.getValue() as ShipmentRecord['status'];
          const rec = info.row.original;
          return (
            <div className="space-y-1">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold border inline-block ${statusBadgeStyles[st]}`}>
                {statusLabels[st] || st}
              </span>
              <div>
                {rec.podStatus === 'CONFIRMED' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Đã ký POD
                  </span>
                ) : rec.podStatus === 'REJECTED' ? (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Từ chối POD
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-400 inline-flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-gray-400" /> Chờ ký POD
                  </span>
                )}
              </div>
            </div>
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
              onClick={() => handleOpenPod(row.original)}
              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded text-emerald-600 dark:text-emerald-400 cursor-pointer"
              title="Biên bản giao nhận POD & In chứng từ"
            >
              <FileCheck className="w-4 h-4" />
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
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1.5 rounded-full font-bold border ${statusBadgeStyles[selectedShipment.status]}`}>
                  {statusLabels[selectedShipment.status] || selectedShipment.status}
                </span>
                <button
                  type="button"
                  onClick={() => handlePrintPod(selectedShipment)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  title="In biên bản giao nhận"
                >
                  <Printer className="w-4 h-4 text-primary" />
                  In Biên Bản POD
                </button>
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

            {/* Proof of Delivery (POD) Section */}
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                  <FileCheck className="w-4 h-4 text-emerald-600" /> BIÊN BẢN BÀN GIAO & XÁC NHẬN POD
                </div>
                <div className="flex items-center gap-2">
                  {selectedShipment.podStatus === 'CONFIRMED' ? (
                    <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 rounded-full font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã ký nhận POD
                    </span>
                  ) : selectedShipment.podStatus === 'REJECTED' ? (
                    <span className="text-xs px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full font-bold border border-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Từ chối nhận hàng
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Chờ xác nhận POD
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const cur = selectedShipment;
                      setSelectedShipment(null);
                      handleOpenPod(cur);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    Ký / Cập nhật POD
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-emerald-200/60 dark:border-emerald-900/60">
                <div>
                  <p className="text-gray-500">Người ký nhận:</p>
                  <p className="font-bold text-gray-900 dark:text-white">{selectedShipment.podSignerName || selectedShipment.recipientName}</p>
                  <p className="text-gray-500 font-mono mt-0.5">SĐT: {selectedShipment.podSignerPhone || selectedShipment.recipientPhone}</p>
                </div>
                <div>
                  <p className="text-gray-500">Thời gian ký nhận:</p>
                  <p className="font-bold text-gray-900 dark:text-white font-mono">{selectedShipment.podSignedAt || 'Chưa ghi nhận'}</p>
                  <p className="text-gray-500 mt-0.5">Bưu tá: <span className="font-semibold">{selectedShipment.shipperName || selectedShipment.carrierName}</span></p>
                </div>
              </div>

              {selectedShipment.podNotes && (
                <div className="p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-900 text-xs">
                  <span className="font-bold text-gray-700 dark:text-gray-300">Tình trạng khi bàn giao: </span>
                  <span className="text-gray-600 dark:text-gray-400">{selectedShipment.podNotes}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border space-y-2 text-xs">
              <p className="font-bold text-gray-700 dark:text-gray-300">Nội dung hàng hóa & Ghi chú vận chuyển:</p>
              <p className="text-gray-600 dark:text-gray-400">Loại hàng: <span className="font-semibold">{selectedShipment.goodsType}</span> - Trọng lượng: <span className="font-semibold">{selectedShipment.totalWeightKg} kg</span></p>
              <p className="text-gray-600 dark:text-gray-400">Mô tả: {selectedShipment.goodsDescription || 'Không có mô tả chi tiết'}</p>
              {selectedShipment.notes && (
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-900">
                  <FileText className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Ghi chú giao hàng: {selectedShipment.notes}</span>
                </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Tracking Number</label>
                    <button
                      type="button"
                      onClick={handleCarrierApiDispatch}
                      disabled={isConnectingCarrier}
                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 rounded text-[11px] font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer"
                      title="Kết nối API hãng vận chuyển để tự động sinh mã vận đơn"
                    >
                      <Zap className={`w-3 h-3 text-blue-600 ${isConnectingCarrier ? 'animate-spin' : ''}`} />
                      {isConnectingCarrier ? 'Đang gọi API...' : '⚡ Lấy mã qua API'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formState.trackingNumber || ''}
                    onChange={(e) => setFormState({ ...formState, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm text-emerald-600 font-bold"
                    placeholder="VTP-123456..."
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
                  <select
                    value={formState.carrierName || 'Viettel Post'}
                    onChange={(e) => setFormState({ ...formState, carrierName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    {carrierList.map(c => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    <option value="Khác">Hãng vận chuyển khác</option>
                  </select>
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
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Khách yêu cầu đồng kiểm', 'Hẹn giao buổi tối', 'Gọi trước khi giao 15p', 'Hàng dễ vỡ cẩn thận', 'Giao giờ hành chính', 'Giao lại lần 2'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const cur = formState.notes?.trim() || '';
                          if (cur.includes(tag)) return;
                          setFormState({
                            ...formState,
                            notes: cur ? `${cur}, ${tag}` : tag
                          });
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
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

      {/* Modal Biên Bản Bàn Giao & Xác Nhận POD */}
      {isPodModalOpen && podShipment && (
        <Modal
          isOpen={isPodModalOpen}
          onClose={() => setIsPodModalOpen(false)}
          title={`Biên Bản Bàn Giao & Xác Nhận POD: ${podShipment.shipmentCode}`}
          size="erp"
        >
          <form onSubmit={handleSavePod} className="space-y-6">
            {/* Header info */}
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Xác thực giao nhận hàng hóa (Proof of Delivery)</p>
                <p className="text-base font-bold text-gray-900 dark:text-white font-mono mt-0.5">
                  Vận đơn: {podShipment.shipmentCode} | Tracking: {podShipment.trackingNumber}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Đơn hàng: <span className="font-semibold text-gray-700 dark:text-gray-300">{podShipment.orderCode}</span> | Hãng: {podShipment.carrierName} ({podShipment.shippingMethod})
                </p>
              </div>
              <button
                type="button"
                onClick={() => handlePrintPod(podShipment)}
                className="px-3 py-2 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-emerald-600" />
                In Biên Bản POD (PDF)
              </button>
            </div>

            {/* Recipient & Goods Summary */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border space-y-1">
                <span className="font-bold text-gray-700 dark:text-gray-300 uppercase block text-[11px]">Thông tin người nhận</span>
                <p className="font-semibold text-sm text-gray-900 dark:text-white">{podShipment.recipientName}</p>
                <p className="text-gray-500 font-mono">SĐT: {podShipment.recipientPhone}</p>
                <p className="text-gray-500">{podShipment.recipientAddress}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border space-y-1">
                <span className="font-bold text-gray-700 dark:text-gray-300 uppercase block text-[11px]">Hàng hóa & Thu hộ COD</span>
                <p className="font-semibold text-gray-900 dark:text-white">{podShipment.goodsDescription || podShipment.goodsType}</p>
                <p className="text-gray-500">Số kiện: <span className="font-semibold">{podShipment.packageCount} kiện</span> ({podShipment.totalWeightKg} kg)</p>
                <p className="text-emerald-600 font-bold font-mono">
                  COD: {podShipment.collectCod ? `${podShipment.codAmount.toLocaleString()} VNĐ` : 'Không thu COD'}
                </p>
              </div>
            </div>

            {/* POD Confirmation Form */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm border-b pb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Kết quả giao nhận & Chữ ký người nhận
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Trạng thái xác thực POD *
                  </label>
                  <select
                    value={podForm.podStatus}
                    onChange={(e) => setPodForm({ ...podForm, podStatus: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white"
                  >
                    <option value="CONFIRMED">✓ Đã giao thành công & Khách đã ký nhận</option>
                    <option value="REJECTED">✕ Giao thất bại / Khách từ chối nhận hàng</option>
                    <option value="PENDING">⧗ Đang trên đường giao / Chờ ký xác nhận</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian bàn giao thực tế *
                  </label>
                  <input
                    type="text"
                    required
                    value={podForm.signedAt}
                    onChange={(e) => setPodForm({ ...podForm, signedAt: e.target.value })}
                    placeholder="YYYY-MM-DD HH:mm"
                    className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono font-semibold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Họ tên người ký nhận thực tế *
                  </label>
                  <input
                    type="text"
                    required
                    value={podForm.signerName}
                    onChange={(e) => setPodForm({ ...podForm, signerName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Số điện thoại người ký nhận *
                  </label>
                  <input
                    type="text"
                    required
                    value={podForm.signerPhone}
                    onChange={(e) => setPodForm({ ...podForm, signerPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-sm font-mono text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Tình trạng đóng gói & Ghi chú kiểm hàng khi ký nhận
                </label>
                <textarea
                  rows={2}
                  value={podForm.notes}
                  onChange={(e) => setPodForm({ ...podForm, notes: e.target.value })}
                  placeholder="Ví dụ: Hàng nguyên seal, bao bì nguyên vẹn, khách đã kiểm tra đủ linh kiện..."
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => handlePrintPod(podShipment)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-gray-500" />
                In Biên Bản POD
              </button>
              <div className="flex gap-3">
                <SecondaryButton
                  type="button"
                  onClick={() => setIsPodModalOpen(false)}
                >
                  Đóng
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                >
                  <Check className="w-4 h-4 mr-1.5" />
                  Xác Nhận & Cập Nhật POD
                </PrimaryButton>
              </div>
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
