import { useMemo, useState, useEffect } from 'react';
import {
  Search, Eye, Printer, Globe, CreditCard, DollarSign,
  CheckCircle2, Clock, Truck, Package, XCircle, AlertCircle, RefreshCw,
  QrCode, User, Phone, MapPin, Receipt, ArrowUpRight, ShieldAlert,
  Download, Filter, CheckSquare, Square, FileSpreadsheet, Check
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { PrintInvoiceModal, type PrintInvoiceData } from '@/shared/components/ui/PrintInvoiceModal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

export interface OnlineInvoiceRecord {
  id: string;
  invoiceCode: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: 'VietQR' | 'COD' | 'Thẻ ATM/Visa' | 'Chuyển khoản';
  paymentStatus: 'DA_THANH_TOAN' | 'CHO_THU_COD' | 'CHO_XAC_NHAN' | 'DA_HOAN_TIEN';
  deliveryStatus: 'CHO_XAC_NHAN' | 'DANG_DONG_GOI' | 'DANG_GIAO' | 'GIAO_THANH_CONG' | 'DA_HUY' | 'HOAN_HANG_HU_HONG';
  channelName: string;
  platformFeeRate: number; // e.g. 0.08 for 8% Shopee fee
  carrierName?: string; // GHTK, GHN, SPX
  carrierClaimNote?: string;
  items: {
    sku?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  notes?: string;
}

const DEFAULT_ONLINE_INVOICES: OnlineInvoiceRecord[] = [
  {
    id: '1',
    invoiceCode: 'INV-ONL-2026-001',
    orderCode: 'WEB-00219',
    customerName: 'Nguyễn Văn An',
    customerPhone: '0912 345 678',
    shippingAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, P.22, Q.Bình Thạnh, TP.HCM',
    invoiceDate: '2026-09-07 09:30',
    totalAmount: 1250000,
    paidAmount: 1250000,
    remainingAmount: 0,
    paymentMethod: 'VietQR',
    paymentStatus: 'DA_THANH_TOAN',
    deliveryStatus: 'DANG_GIAO',
    channelName: 'Website RetailHub',
    platformFeeRate: 0.015,
    carrierName: 'Giao Hàng Nhanh (GHN)',
    items: [
      { sku: 'SP-001', productName: 'Áo thun nam Cotton Compact cao cấp', quantity: 2, unitPrice: 350000, total: 700000 },
      { sku: 'SP-002', productName: 'Quần Jeans Slimfit Co Giãn', quantity: 1, unitPrice: 550000, total: 550000 },
    ],
    notes: 'Khách yêu cầu giao giờ hành chính',
  },
  {
    id: '2',
    invoiceCode: 'INV-ONL-2026-002',
    orderCode: 'SP-88492019',
    customerName: 'Trần Thị Mai',
    customerPhone: '0988 765 432',
    shippingAddress: 'Số 45 Đường Cầu Giấy, P.Quan Hoa, Q.Cầu Giấy, Hà Nội',
    invoiceDate: '2026-09-07 10:15',
    totalAmount: 890000,
    paidAmount: 0,
    remainingAmount: 890000,
    paymentMethod: 'COD',
    paymentStatus: 'CHO_THU_COD',
    deliveryStatus: 'DANG_DONG_GOI',
    channelName: 'Shopee Mall',
    platformFeeRate: 0.08,
    carrierName: 'Shopee Xpress (SPX)',
    items: [
      { sku: 'SP-005', productName: 'Váy xòe hoa nhí Vintage thanh lịch', quantity: 1, unitPrice: 490000, total: 490000 },
      { sku: 'SP-008', productName: 'Túi xách nữ da mềm khóa kim loại', quantity: 1, unitPrice: 400000, total: 400000 },
    ],
    notes: 'Thu COD 890.000đ khi giao hàng',
  },
  {
    id: '3',
    invoiceCode: 'INV-ONL-2026-003',
    orderCode: 'TT-99210291',
    customerName: 'Lê Hoàng Long',
    customerPhone: '0933 221 100',
    shippingAddress: '120 Trần Phú, P.Hải Châu 1, Q.Hải Châu, Đà Nẵng',
    invoiceDate: '2026-09-06 15:45',
    totalAmount: 2150000,
    paidAmount: 2150000,
    remainingAmount: 0,
    paymentMethod: 'Thẻ ATM/Visa',
    paymentStatus: 'DA_THANH_TOAN',
    deliveryStatus: 'GIAO_THANH_CONG',
    channelName: 'TikTok Shop',
    platformFeeRate: 0.075,
    carrierName: 'Giao Hàng Tiết Kiệm (GHTK)',
    items: [
      { sku: 'SP-010', productName: 'Giày Sneaker thể thao thoáng khí', quantity: 1, unitPrice: 1200000, total: 1200000 },
      { sku: 'SP-012', productName: 'Balo laptop chống nước 15.6 inch', quantity: 1, unitPrice: 950000, total: 950000 },
    ],
    notes: 'Đã hoàn tất thanh toán cổng Stripe / PayOS',
  },
  {
    id: '4',
    invoiceCode: 'INV-ONL-2026-004',
    orderCode: 'LZD-441209',
    customerName: 'Phạm Minh Tuấn',
    customerPhone: '0909 112 233',
    shippingAddress: 'Khu đô thị Sala, P.An Lợi Đông, TP.Thủ Đức, TP.HCM',
    invoiceDate: '2026-09-06 18:20',
    totalAmount: 620000,
    paidAmount: 0,
    remainingAmount: 620000,
    paymentMethod: 'Chuyển khoản',
    paymentStatus: 'CHO_XAC_NHAN',
    deliveryStatus: 'CHO_XAC_NHAN',
    channelName: 'Lazada',
    platformFeeRate: 0.085,
    carrierName: 'Ninja Van',
    items: [
      { sku: 'SP-003', productName: 'Áo sơ mi Oxford dài tay form rộng', quantity: 1, unitPrice: 620000, total: 620000 },
    ],
    notes: 'Khách gửi bill chuyển khoản qua Zalo, chờ kế toán đối soát',
  },
];

const paymentBadgeStyles: Record<OnlineInvoiceRecord['paymentStatus'], string> = {
  DA_THANH_TOAN: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  CHO_THU_COD: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  CHO_XAC_NHAN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  DA_HOAN_TIEN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
};

const paymentStatusLabels: Record<OnlineInvoiceRecord['paymentStatus'], string> = {
  DA_THANH_TOAN: 'Sàn đã thanh toán',
  CHO_THU_COD: 'COD - Chưa thu',
  CHO_XAC_NHAN: 'Chờ xác nhận CK',
  DA_HOAN_TIEN: 'Đã hoàn tiền',
};

const deliveryBadgeStyles: Record<OnlineInvoiceRecord['deliveryStatus'], string> = {
  CHO_XAC_NHAN: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
  DANG_DONG_GOI: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200',
  DANG_GIAO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200',
  GIAO_THANH_CONG: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  DA_HUY: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
  HOAN_HANG_HU_HONG: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300',
};

const deliveryStatusLabels: Record<OnlineInvoiceRecord['deliveryStatus'], string> = {
  CHO_XAC_NHAN: 'Chờ xác nhận',
  DANG_DONG_GOI: 'Đang đóng gói',
  DANG_GIAO: 'Đang giao hàng',
  GIAO_THANH_CONG: 'Hoàn tất',
  DA_HUY: 'Đã hủy / Hoàn hàng',
  HOAN_HANG_HU_HONG: 'Hàng hoàn bể vỡ / ĐVVC đền bù',
};

export function OnlineInvoicesPage() {
  const [invoices, setInvoices] = useState<OnlineInvoiceRecord[]>(DEFAULT_ONLINE_INVOICES);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Row selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<OnlineInvoiceRecord | null>(null);
  const [printData, setPrintData] = useState<PrintInvoiceData | null>(null);

  // Modal Đối Soát Sàn TMĐT
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [customPlatformFeePercent, setCustomPlatformFeePercent] = useState<number>(8);

  // Modal Khiếu Nại ĐVVC (Edge Case 3)
  const [damageClaimModalInvoice, setDamageClaimModalInvoice] = useState<OnlineInvoiceRecord | null>(null);
  const [claimCourier, setClaimCourier] = useState<string>('Giao Hàng Tiết Kiệm (GHTK)');
  const [claimIncident, setClaimIncident] = useState<string>('Bưu kiện bị móp méo, ướt rách hộp trong quá trình trung chuyển.');
  const [claimAmount, setClaimAmount] = useState<number>(0);

  const fetchOnlineInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any>('/sales/orders');
      const rawOrders = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : []));

      if (Array.isArray(rawOrders) && rawOrders.length > 0) {
        const onlineOrders = rawOrders.filter((it: any) => {
          const origin = (it.origin || it.orderOrigin || '').toUpperCase();
          const code = (it.orderCode || it.code || '').toUpperCase();
          return origin === 'ONLINE' || origin === 'WEB' || code.startsWith('ONLINE-') || code.startsWith('WEB-') || code.startsWith('SP-') || code.startsWith('TT-');
        });

        if (onlineOrders.length > 0) {
          const mapped: OnlineInvoiceRecord[] = onlineOrders.map((item: any, idx: number) => {
            const rawPm = (item.paymentMethod || item.paymentMethodCode || '').toUpperCase();
            let pm: OnlineInvoiceRecord['paymentMethod'] = 'COD';
            if (rawPm.includes('VIETQR') || rawPm.includes('QR')) pm = 'VietQR';
            else if (rawPm.includes('BANK') || rawPm.includes('CK') || rawPm.includes('TRANSFER')) pm = 'Chuyển khoản';
            else if (rawPm.includes('ATM') || rawPm.includes('VISA') || rawPm.includes('CARD')) pm = 'Thẻ ATM/Visa';
            else pm = 'COD';

            const rawPs = (item.paymentStatus || '').toUpperCase();
            let ps: OnlineInvoiceRecord['paymentStatus'] = 'CHO_THU_COD';
            const total = Number(item.finalAmount || item.totalAmount || 0);
            let paid = 0;

            if (rawPs === 'PAID' || item.status === 'COMPLETED') {
              ps = 'DA_THANH_TOAN';
              paid = total;
            } else if (rawPs === 'REFUNDED') {
              ps = 'DA_HOAN_TIEN';
              paid = 0;
            } else if (pm === 'VietQR' || pm === 'Chuyển khoản') {
              ps = 'CHO_XAC_NHAN';
              paid = 0;
            } else {
              ps = 'CHO_THU_COD';
              paid = 0;
            }

            let ds: OnlineInvoiceRecord['deliveryStatus'] = 'CHO_XAC_NHAN';
            const st = (item.status || '').toUpperCase();
            if (st === 'COMPLETED' || st === 'DELIVERED') ds = 'GIAO_THANH_CONG';
            else if (st === 'DELIVERING' || st === 'SHIPPED') ds = 'DANG_GIAO';
            else if (st === 'CONFIRMED' || st === 'PACKING') ds = 'DANG_DONG_GOI';
            else if (st === 'CANCELLED') ds = 'DA_HUY';

            const items = Array.isArray(item.details || item.orderDetails || item.items)
              ? (item.details || item.orderDetails || item.items).map((d: any) => ({
                  sku: d.sku || d.productCode || 'SKU-ONL',
                  productName: d.productName || d.productNameSnapshot || d.product?.name || 'Sản phẩm đặt Online',
                  quantity: Number(d.quantity || 1),
                  unitPrice: Number(d.unitPrice || d.price || 0),
                  total: Number(d.totalAmount || d.subTotal || (Number(d.quantity || 1) * Number(d.unitPrice || d.price || 0))),
                }))
              : [
                  {
                    sku: 'SKU-DEFAULT',
                    productName: 'Hàng đặt trực tuyến',
                    quantity: 1,
                    unitPrice: total,
                    total: total,
                  }
                ];

            const invCode = `INV-ONL-${new Date(item.orderDate || item.createdAt || Date.now()).getFullYear()}-${String(item.id || idx + 1).padStart(4, '0')}`;
            const orderCode = item.orderCode || item.code || `ONLINE-${item.id}`;

            let channel = item.channelName || 'Website RetailHub';
            if (orderCode.startsWith('SP-')) channel = 'Shopee Mall';
            else if (orderCode.startsWith('TT-')) channel = 'TikTok Shop';
            else if (orderCode.startsWith('LZD-')) channel = 'Lazada';

            return {
              id: String(item.id),
              invoiceCode: invCode,
              orderCode: orderCode,
              customerName: item.customerName || item.customer?.name || item.recipientName || 'Khách đặt trực tuyến',
              customerPhone: item.customerPhone || item.customer?.phone || item.recipientPhone || '—',
              shippingAddress: item.shippingAddress || item.address || 'Giao tận nơi',
              invoiceDate: (item.orderDate || item.createdAt || new Date().toISOString()).replace('T', ' ').substring(0, 16),
              totalAmount: total,
              paidAmount: paid,
              remainingAmount: Math.max(0, total - paid),
              paymentMethod: pm,
              paymentStatus: ps,
              deliveryStatus: ds,
              channelName: channel,
              platformFeeRate: channel.includes('Shopee') ? 0.08 : (channel.includes('TikTok') ? 0.075 : (channel.includes('Lazada') ? 0.085 : 0.015)),
              items: items,
              notes: item.notes || item.note || '',
            };
          });

          // Merge with default mock list if not already present
          const existingCodes = new Set(mapped.map(m => m.orderCode));
          const preserved = DEFAULT_ONLINE_INVOICES.filter(d => !existingCodes.has(d.orderCode));
          setInvoices([...mapped, ...preserved]);
          return;
        }
      }
    } catch (err) {
      console.warn('Load online invoices from /sales/orders failed, using default dataset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineInvoices();
  }, []);

  // Filtered data
  const filteredInvoices = useMemo(() => {
    return invoices.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.invoiceCode.toLowerCase().includes(q) ||
        item.orderCode.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerPhone.toLowerCase().includes(q);

      const matchChannel =
        channelFilter === 'ALL' ||
        (channelFilter === 'SHOPEE' && item.channelName.toLowerCase().includes('shopee')) ||
        (channelFilter === 'TIKTOK' && item.channelName.toLowerCase().includes('tiktok')) ||
        (channelFilter === 'LAZADA' && item.channelName.toLowerCase().includes('lazada')) ||
        (channelFilter === 'WEBSITE' && item.channelName.toLowerCase().includes('website'));

      const matchPayment = paymentFilter === 'ALL' || item.paymentStatus === paymentFilter;
      const matchDelivery = deliveryFilter === 'ALL' || item.deliveryStatus === deliveryFilter;

      const itemDate = item.invoiceDate.substring(0, 10);
      const matchStart = !startDate || itemDate >= startDate;
      const matchEnd = !endDate || itemDate <= endDate;

      return matchSearch && matchChannel && matchPayment && matchDelivery && matchStart && matchEnd;
    });
  }, [invoices, search, channelFilter, paymentFilter, deliveryFilter, startDate, endDate]);

  // KPI calculations
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const paidAmount = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const pendingCodAmount = invoices
      .filter((i) => i.paymentStatus === 'CHO_THU_COD' || i.paymentStatus === 'CHO_XAC_NHAN')
      .reduce((s, i) => s + i.remainingAmount, 0);

    return { totalInvoices, totalAmount, paidAmount, pendingCodAmount };
  }, [invoices]);

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInvoices.map(it => it.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Reconcile calculations
  const reconcileInvoices = useMemo(() => {
    if (selectedIds.size > 0) {
      return invoices.filter(it => selectedIds.has(it.id));
    }
    // Default to completed or delivered orders if none selected
    return invoices.filter(it => it.deliveryStatus === 'GIAO_THANH_CONG' || it.paymentStatus === 'CHO_THU_COD');
  }, [invoices, selectedIds]);

  const reconcileTotals = useMemo(() => {
    const gross = reconcileInvoices.reduce((sum, it) => sum + it.totalAmount, 0);
    const fee = Math.round(gross * (customPlatformFeePercent / 100));
    const netPayout = Math.max(0, gross - fee);
    return { gross, fee, netPayout, count: reconcileInvoices.length };
  }, [reconcileInvoices, customPlatformFeePercent]);

  // Confirm Reconcile
  const handleConfirmReconcile = () => {
    const updated = invoices.map(it => {
      if (reconcileInvoices.some(r => r.id === it.id)) {
        return {
          ...it,
          paymentStatus: 'DA_THANH_TOAN' as const,
          paidAmount: it.totalAmount,
          remainingAmount: 0,
        };
      }
      return it;
    });

    setInvoices(updated);
    setIsReconcileModalOpen(false);
    setSelectedIds(new Set());
    toast.success(`Đã đối soát thành công ${reconcileTotals.count} đơn sàn TMĐT! Thực nhận: ${reconcileTotals.netPayout.toLocaleString('vi-VN')} đ`);
  };

  // Confirm Carrier Claim (Edge Case 3)
  const handleConfirmDamageClaim = () => {
    if (!damageClaimModalInvoice) return;

    const updated = invoices.map(it => {
      if (it.id === damageClaimModalInvoice.id) {
        return {
          ...it,
          deliveryStatus: 'HOAN_HANG_HU_HONG' as const,
          carrierName: claimCourier,
          carrierClaimNote: claimIncident,
          notes: `[BỒI THƯỜNG ĐVVC]: ${claimCourier} - Yêu cầu đền: ${claimAmount.toLocaleString('vi-VN')} đ. ${claimIncident}`,
        };
      }
      return it;
    });

    setInvoices(updated);
    toast.success(`Đã ghi nhận sự cố hư hỏng & chuyển bưu kiện ${damageClaimModalInvoice.orderCode} vào Kho Chờ Bồi Thường!`);
    setDamageClaimModalInvoice(null);
  };

  const handlePrint = (inv: OnlineInvoiceRecord) => {
    setPrintData({
      documentTitle: 'HÓA ĐƠN BÁN HÀNG ONLINE & TMĐT',
      code: inv.invoiceCode,
      date: inv.invoiceDate,
      customerOrSupplierName: inv.customerName,
      phone: inv.customerPhone,
      address: inv.shippingAddress,
      branchName: 'Tổng kho Thương Mại Điện Tử RetailHub',
      createdByName: 'Hệ thống Bán hàng Tự động (E-Commerce GW)',
      notes: `Đơn gốc: ${inv.orderCode} | Kênh: ${inv.channelName} | HTTT: ${inv.paymentMethod} (${paymentStatusLabels[inv.paymentStatus]})`,
      items: inv.items.map((it) => ({
        sku: it.sku,
        name: it.productName,
        quantity: it.quantity,
        price: it.unitPrice,
        total: it.total,
      })),
      subTotal: inv.totalAmount,
      totalAmount: inv.totalAmount,
      statusLabel: paymentStatusLabels[inv.paymentStatus],
    });
  };

  const columns: ColumnDef<OnlineInvoiceRecord>[] = [
    {
      id: 'select',
      header: () => (
        <button
          type="button"
          onClick={toggleSelectAll}
          className="p-1 hover:text-emerald-600 cursor-pointer"
        >
          {selectedIds.size > 0 && selectedIds.size === filteredInvoices.length ? (
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => toggleSelectOne(row.original.id)}
          className="p-1 hover:text-emerald-600 cursor-pointer"
        >
          {selectedIds.has(row.original.id) ? (
            <CheckSquare className="w-4 h-4 text-emerald-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
        </button>
      ),
    },
    {
      accessorKey: 'invoiceCode',
      header: 'MÃ HÓA ĐƠN',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            {row.original.invoiceCode}
          </div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">
            Mã đơn sàn: <span className="text-gray-800 dark:text-gray-200 font-bold">{row.original.orderCode}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'channelName',
      header: 'KÊNH BÁN',
      cell: ({ row }) => {
        const ch = row.original.channelName;
        let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
        if (ch.includes('Shopee')) badgeColor = 'bg-orange-50 text-orange-700 border-orange-200';
        else if (ch.includes('TikTok')) badgeColor = 'bg-gray-100 text-gray-900 border-gray-300 dark:bg-gray-800 dark:text-gray-100';
        else if (ch.includes('Lazada')) badgeColor = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        else if (ch.includes('Website')) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

        return (
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${badgeColor}`}>
            {ch}
          </span>
        );
      },
    },
    {
      accessorKey: 'customerName',
      header: 'KHÁCH HÀNG',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{row.original.customerName}</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
            <span>{row.original.customerPhone}</span>
          </div>
          <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 line-clamp-1" title={row.original.shippingAddress}>
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{row.original.shippingAddress}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'totalAmount',
      header: 'TỔNG TIỀN',
      cell: ({ row }) => (
        <div className="text-right font-bold text-gray-900 dark:text-white">
          {row.original.totalAmount.toLocaleString('vi-VN')} đ
        </div>
      ),
    },
    {
      id: 'platformFee',
      header: 'PHÍ SÀN / COD',
      cell: ({ row }) => {
        const feeAmt = Math.round(row.original.totalAmount * row.original.platformFeeRate);
        const net = row.original.totalAmount - feeAmt;
        return (
          <div className="text-xs space-y-0.5">
            <div className="font-medium text-gray-700 dark:text-gray-300">
              Phí sàn ({(row.original.platformFeeRate * 100).toFixed(1)}%): <span className="text-red-500">-{feeAmt.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Thực nhận: {net.toLocaleString('vi-VN')} đ
            </div>
            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-medium border ${paymentBadgeStyles[row.original.paymentStatus]}`}>
              {paymentStatusLabels[row.original.paymentStatus]}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'deliveryStatus',
      header: 'TRẠNG THÁI',
      cell: ({ row }) => (
        <div>
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${deliveryBadgeStyles[row.original.deliveryStatus]}`}>
            {deliveryStatusLabels[row.original.deliveryStatus]}
          </span>
          {row.original.carrierName && (
            <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <Truck className="w-3 h-3" />
              <span>{row.original.carrierName}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'THAO TÁC',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setSelectedInvoice(row.original)}
            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
            title="Xem chi tiết đơn hàng online"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePrint(row.original)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
            title="In hóa đơn bán hàng online"
          >
            <Printer className="w-4 h-4" />
          </button>
          {/* Edge Case 3: Action to claim damage from carrier */}
          <button
            onClick={() => {
              setDamageClaimModalInvoice(row.original);
              setClaimAmount(row.original.totalAmount);
              setClaimCourier(row.original.carrierName || 'Giao Hàng Tiết Kiệm (GHTK)');
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
            title="Khai báo hàng hoàn hư hỏng / Khiếu nại ĐVVC"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            Danh sách Hóa đơn Bán Online
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi hóa đơn từ Shopee, TikTok Shop, Lazada, Website Store; đối soát COD và phí sàn tự động
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReconcileModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Đối soát Sàn ({selectedIds.size > 0 ? `${selectedIds.size} đơn đã chọn` : 'Tất cả đơn'})
          </button>
          <button
            onClick={() => {
              fetchOnlineInvoices();
              toast.success('Đã cập nhật danh sách hóa đơn online');
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng hóa đơn Online</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {stats.totalInvoices} <span className="text-sm font-normal text-gray-500">hóa đơn</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng doanh số Online</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {stats.totalAmount.toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Đã thu tiền (QR/CK/Thẻ)</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {stats.paidAmount.toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cần thu hộ COD / Chờ CK</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {stats.pendingCodAmount.toLocaleString('vi-VN')} đ
          </div>
        </div>
      </div>

      {/* Filter Bar (Wireframe Layout) */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm mã HD, mã đơn sàn, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Channel Dropdown */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Tất cả Nguồn ▼</option>
            <option value="SHOPEE">Shopee Mall</option>
            <option value="TIKTOK">TikTok Shop</option>
            <option value="LAZADA">Lazada</option>
            <option value="WEBSITE">Website Store</option>
          </select>

          {/* Delivery Status Dropdown */}
          <select
            value={deliveryFilter}
            onChange={(e) => setDeliveryFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">Tất cả Trạng thái ▼</option>
            <option value="DANG_GIAO">Đang giao hàng</option>
            <option value="GIAO_THANH_CONG">Hoàn tất</option>
            <option value="DANG_DONG_GOI">Đang đóng gói</option>
            <option value="CHO_XAC_NHAN">Chờ xác nhận</option>
            <option value="DA_HUY">Đã hủy / Hoàn hàng</option>
            <option value="HOAN_HANG_HU_HONG">Hàng hoàn hư hỏng</option>
          </select>

          {/* Date range picker */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
            title="Từ ngày"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
            title="Đến ngày"
          />
        </div>
      </div>

      {/* Main Table */}
      <ReusableDataTable
        data={filteredInvoices}
        columns={columns}
        isLoading={isLoading}
      />

      {/* Modal Đối Soát Sàn TMĐT & COD */}
      {isReconcileModalOpen && (
        <Modal
          isOpen={isReconcileModalOpen}
          onClose={() => setIsReconcileModalOpen(false)}
          title="📥 ĐỐI SOÁT DOANH THU SÀN TMĐT & THANH TOÁN COD"
          width="max-w-2xl"
        >
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-sm space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <span className="text-gray-600 dark:text-gray-400">Số lượng đơn đối soát:</span>
                <span className="font-bold text-gray-900 dark:text-white">{reconcileTotals.count} đơn hàng</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <span className="text-gray-600 dark:text-gray-400">Tổng doanh thu đơn (Gross):</span>
                <span className="font-bold text-gray-900 dark:text-white">{reconcileTotals.gross.toLocaleString('vi-VN')} đ</span>
              </div>

              {/* Platform fee adjust */}
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">Tỷ lệ Phí sàn & Tiếp thị liên kết:</span>
                  <span className="text-xs text-gray-400">Cố định Shopee / TikTok / Lazada</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={customPlatformFeePercent}
                    onChange={(e) => setCustomPlatformFeePercent(Number(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-center text-sm font-bold bg-white dark:bg-gray-800 border rounded"
                  />
                  <span className="font-medium text-xs">% (-{reconcileTotals.fee.toLocaleString('vi-VN')} đ)</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-base font-bold text-emerald-600 dark:text-emerald-400">
                <span>DOANH THU RÒNG THỰC NHẬN VỀ TÀI KHOẢN:</span>
                <span>{reconcileTotals.netPayout.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
              <div className="font-bold text-blue-900 dark:text-blue-200">
                Tài khoản ngân hàng thụ hưởng đối soát:
              </div>
              <div className="text-gray-700 dark:text-gray-300">
                Ngân hàng TMCP Quân Đội (MBBank) - STK: <strong>9988776655</strong> - Chủ TK: <strong>CTY CP RETAILHUB VIETNAM</strong>
              </div>
              <div className="text-[11px] text-gray-500">
                * Sau khi xác nhận, toàn bộ các đơn được chọn sẽ chuyển trạng thái sang "Sàn đã thanh toán", gạch bỏ công nợ COD.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReconcileModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReconcile}
                className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Xác Nhận Đối Soát & Gạch Nợ
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Khai Báo Hàng Hoàn Hư Hỏng / Khiếu Nại ĐVVC (Edge Case 3) */}
      {damageClaimModalInvoice && (
        <Modal
          isOpen={Boolean(damageClaimModalInvoice)}
          onClose={() => setDamageClaimModalInvoice(null)}
          title="⚠️ KHAI BÁO HÀNG HOÀN HƯ HỎNG & KHIẾU NẠI ĐVVC"
          width="max-w-xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs">
              <span className="font-bold text-red-900 dark:text-red-200 block">
                Đơn hàng: {damageClaimModalInvoice.orderCode} ({damageClaimModalInvoice.channelName})
              </span>
              <span className="text-gray-700 dark:text-gray-300 mt-1 block">
                Khách nhận: {damageClaimModalInvoice.customerName} - Giá trị đơn: {damageClaimModalInvoice.totalAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Đơn vị vận chuyển chịu trách nhiệm (*):
              </label>
              <select
                value={claimCourier}
                onChange={(e) => setClaimCourier(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
              >
                <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
                <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                <option value="Shopee Xpress (SPX)">Shopee Xpress (SPX)</option>
                <option value="Viettel Post">Viettel Post</option>
                <option value="Ninja Van">Ninja Van</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Biên bản đồng kiểm & Chi tiết thiệt hại (*):
              </label>
              <textarea
                rows={3}
                value={claimIncident}
                onChange={(e) => setClaimIncident(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
                placeholder="Nhập số biên bản đồng kiểm, tình trạng bể vỡ hàng hóa..."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Số tiền yêu cầu bồi hoàn đền bù (VND) (*):
              </label>
              <input
                type="number"
                value={claimAmount}
                onChange={(e) => setClaimAmount(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-red-600"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                * Hàng hóa sẽ được tự động chuyển vào <strong>Kho Hàng Chờ Bồi Thường</strong> và ghi nhận công nợ phải thu ĐVVC thay vì tính vào lỗ mất mát của cửa hàng.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDamageClaimModalInvoice(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDamageClaim}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                Lập Hồ Sơ Khiếu Nại Bồi Thường
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={Boolean(selectedInvoice)}
          onClose={() => setSelectedInvoice(null)}
          title={`Chi tiết Hóa đơn: ${selectedInvoice.invoiceCode}`}
          width="max-w-3xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Mã đơn hàng liên kết:</span>
                <span className="font-semibold text-gray-900 dark:text-white font-mono">{selectedInvoice.orderCode}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Kênh đặt hàng:</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{selectedInvoice.channelName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Người nhận hàng:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedInvoice.customerName} - {selectedInvoice.customerPhone}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Thời gian lập hóa đơn:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedInvoice.invoiceDate}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-500 block text-xs">Địa chỉ nhận hàng:</span>
                <span className="text-gray-700 dark:text-gray-300">{selectedInvoice.shippingAddress}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Hình thức thanh toán:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedInvoice.paymentMethod}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Trạng thái thanh toán:</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mt-0.5 ${paymentBadgeStyles[selectedInvoice.paymentStatus]}`}>
                  {paymentStatusLabels[selectedInvoice.paymentStatus]}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Danh sách sản phẩm xuất bán</h4>
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">Mã SKU</th>
                      <th className="px-3 py-2.5">Tên sản phẩm</th>
                      <th className="px-3 py-2.5 text-center">SL</th>
                      <th className="px-3 py-2.5 text-right">Đơn giá</th>
                      <th className="px-3 py-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-500">{item.sku || '—'}</td>
                        <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{item.productName}</td>
                        <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-right">{item.unitPrice.toLocaleString('vi-VN')} đ</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{item.total.toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white">
                    <tr>
                      <td colSpan={4} className="px-3 py-2.5 text-right">Tổng thanh toán:</td>
                      <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400 text-base">
                        {selectedInvoice.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const inv = selectedInvoice;
                  setSelectedInvoice(null);
                  handlePrint(inv);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                In Hóa đơn này
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Print Modal */}
      <PrintInvoiceModal
        isOpen={Boolean(printData)}
        onClose={() => setPrintData(null)}
        data={printData}
      />
    </div>
  );
}

export default OnlineInvoicesPage;
