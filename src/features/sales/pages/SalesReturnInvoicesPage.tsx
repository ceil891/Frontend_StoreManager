import { useMemo, useState, useEffect } from 'react';
import {
  RotateCcw, Search, Eye, Printer, AlertTriangle, CheckCircle2,
  Clock, DollarSign, Package, ShieldAlert, ArrowRightLeft,
  Building2, User, Phone, Receipt, RefreshCw, XCircle, FileText,
  CreditCard, Wallet, Plus, ChevronRight, Check, AlertCircle, ShoppingBag
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { PrintInvoiceModal, type PrintInvoiceData } from '@/shared/components/ui/PrintInvoiceModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type CustomerReturnItem, type CustomerReturnLine } from '../store/salesStore';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { resolveCustomerName } from '../store/salesHelpers';
import { toast } from 'sonner';

export interface ReturnInvoiceRecord {
  id: string;
  returnCode: string; // e.g. RET-2026-9613
  originalInvoiceCode: string; // e.g. INV-2026-583, ORD-POS-2026-792432
  channel: 'POS' | 'ONLINE' | 'B2B';
  channelDetail?: string; // Shopee Mall, TikTok Shop, Direct POS, B2B
  customerId: string;
  customerName: string;
  customerPhone: string;
  returnDate: string;
  // Financial breakdown
  grossReturnAmount: number; // Tổng giá trị hàng trả gốc
  vatRate: number; // 0.08, 0.10, 0
  vatAmount: number; // Tiền thuế VAT điều chỉnh giảm
  preTaxAmount: number; // Tiền hàng trước thuế
  voucherDeduction: number; // Phân bổ voucher giảm giá đơn gốc
  restockingFee: number; // Phí trả hàng / kiểm định
  loyaltyPointsDeducted: number; // Điểm thưởng thu hồi
  netRefundAmount: number; // Tiền thực hoàn cho khách hoặc trừ nợ
  refundMethod: 'DEBT_DEDUCTION' | 'VNPAY_GATEWAY' | 'CASH' | 'BANK_TRANSFER' | 'STORE_CREDIT' | 'EXCHANGE';
  reason: string;
  condition: 'UNOPENED' | 'OPENED_GOOD' | 'DAMAGED_CARRIER' | 'DEFECTIVE_FACTORY';
  stockDestination: 'RESTOCK_SELLABLE' | 'DEFECTIVE_WAREHOUSE' | 'CARRIER_CLAIM_WAREHOUSE';
  carrierClaim?: {
    carrierName: string; // GHTK, GHN, Shopee Xpress, Viettel Post
    claimAmount: number;
    incidentReport: string;
  };
  exchangeDetails?: {
    newProductSku: string;
    newProductName: string;
    newProductPrice: number;
    newProductVat: number;
    differenceAmount: number; // >0: Khách bù thêm, <0: Cửa hàng hoàn lại
  };
  status: 'COMPLETED' | 'PENDING_REFUND' | 'DEBT_DEDUCTED' | 'CARRIER_CLAIM_PENDING';
  notes?: string;
  items: {
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

const DEFAULT_RETURN_RECORDS: ReturnInvoiceRecord[] = [
  {
    id: '1',
    returnCode: 'RET-2026-9613',
    originalInvoiceCode: 'INV-2026-583',
    channel: 'POS',
    channelDetail: 'Cửa hàng RetailHub - Quầy POS 01',
    customerId: '1',
    customerName: 'Nguyễn Huy Hoàng',
    customerPhone: '0901 234 567',
    returnDate: '2026-09-07 11:20',
    grossReturnAmount: 15999999,
    vatRate: 0.10,
    vatAmount: 1454545,
    preTaxAmount: 14545454,
    voucherDeduction: 0,
    restockingFee: 0,
    loyaltyPointsDeducted: 160,
    netRefundAmount: 15999999,
    refundMethod: 'CASH',
    reason: 'Sản phẩm không vừa nhu cầu thực tế',
    condition: 'UNOPENED',
    stockDestination: 'RESTOCK_SELLABLE',
    status: 'COMPLETED',
    notes: 'Đã hoàn tiền mặt và nhập lại kho bán nguyên vẹn',
    items: [
      { sku: 'SP-HIGH-01', productName: 'Laptop Ultrabook Gen 14 16GB 512GB', quantity: 1, unitPrice: 15999999, total: 15999999 }
    ]
  },
  {
    id: '2',
    returnCode: 'RET-2026-3057',
    originalInvoiceCode: 'ORD-POS-2026-792432',
    channel: 'POS',
    channelDetail: 'Cửa hàng RetailHub - Quầy POS 02',
    customerId: '2',
    customerName: 'Nguyễn Hoàng Huy',
    customerPhone: '0988 112 233',
    returnDate: '2026-09-06 14:15',
    grossReturnAmount: 702000,
    vatRate: 0.08,
    vatAmount: 52000,
    preTaxAmount: 650000,
    voucherDeduction: 0,
    restockingFee: 0,
    loyaltyPointsDeducted: 7,
    netRefundAmount: 702000,
    refundMethod: 'DEBT_DEDUCTION',
    reason: 'Khách hàng đổi ý, trừ vào công nợ chưa trả',
    condition: 'UNOPENED',
    stockDestination: 'RESTOCK_SELLABLE',
    status: 'DEBT_DEDUCTED',
    notes: 'Trừ trực tiếp vào công nợ của đơn hàng INV-2026-583',
    items: [
      { sku: 'SP-002', productName: 'Quần Jeans Slimfit Co Giãn Nam', quantity: 1, unitPrice: 702000, total: 702000 }
    ]
  },
  {
    id: '3',
    returnCode: 'RET-2026-1102',
    originalInvoiceCode: 'ONLINE-241102',
    channel: 'ONLINE',
    channelDetail: 'Shopee Mall (SP-88492019)',
    customerId: '3',
    customerName: 'Trần Thị Mai',
    customerPhone: '0988 765 432',
    returnDate: '2026-09-06 16:40',
    grossReturnAmount: 490000,
    vatRate: 0.08,
    vatAmount: 36296,
    preTaxAmount: 453704,
    voucherDeduction: 40000,
    restockingFee: 0,
    loyaltyPointsDeducted: 5,
    netRefundAmount: 450000,
    refundMethod: 'CARRIER_CLAIM_PENDING' as any,
    reason: 'Hàng bị đè bẹp móp méo trong quá trình vận chuyển',
    condition: 'DAMAGED_CARRIER',
    stockDestination: 'CARRIER_CLAIM_WAREHOUSE',
    carrierClaim: {
      carrierName: 'Giao Hàng Tiết Kiệm (GHTK)',
      claimAmount: 450000,
      incidentReport: 'BB-GHTK-9921: Thùng hàng bị dập nát góc, rách bao bì niêm phong'
    },
    status: 'CARRIER_CLAIM_PENDING',
    notes: 'Đã lập biên bản đồng kiểm với bưu tá GHTK, chờ Shopee duyệt bồi thường',
    items: [
      { sku: 'SP-005', productName: 'Váy xòe hoa nhí Vintage thanh lịch', quantity: 1, unitPrice: 490000, total: 490000 }
    ]
  }
];

export function SalesReturnInvoicesPage() {
  const { exportInvoices, saleOrders, customerReturns, updateExportInvoice } = useSalesStore();
  const { customers } = useCrmStore();
  const { products } = useInventoryStore();
  const { currentBranch } = useBranchStore();
  const currentUser = useAuthStore((s) => s.user);

  const [records, setRecords] = useState<ReturnInvoiceRecord[]>(DEFAULT_RETURN_RECORDS);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'POS' | 'ONLINE' | 'B2B'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING_REFUND' | 'DEBT_DEDUCTED' | 'CARRIER_CLAIM_PENDING'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ReturnInvoiceRecord | null>(null);
  const [printData, setPrintData] = useState<PrintInvoiceData | null>(null);

  // Form states for New Return Modal
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [foundOrder, setFoundOrder] = useState<any | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<{
    productId: string;
    sku: string;
    name: string;
    originalQty: number;
    alreadyReturnedQty: number;
    availableQty: number;
    returnQty: number;
    unitPrice: number;
    taxRate: number;
    selected: boolean;
  }[]>([]);

  // Form calculations & edge cases
  const [restockingFeePercent, setRestockingFeePercent] = useState<number>(0);
  const [restockingFeeAmount, setRestockingFeeAmount] = useState<number>(0);
  const [useManualRestockingFee, setUseManualRestockingFee] = useState<boolean>(false);
  const [returnReason, setReturnReason] = useState<string>('Khách đổi ý không muốn mua');
  const [stockDestination, setStockDestination] = useState<'RESTOCK_SELLABLE' | 'DEFECTIVE_WAREHOUSE' | 'CARRIER_CLAIM_WAREHOUSE'>('RESTOCK_SELLABLE');
  const [carrierName, setCarrierName] = useState<string>('Giao Hàng Tiết Kiệm (GHTK)');
  const [carrierReport, setCarrierReport] = useState<string>('');
  const [refundMethod, setRefundMethod] = useState<'DEBT_DEDUCTION' | 'VNPAY_GATEWAY' | 'CASH' | 'BANK_TRANSFER' | 'STORE_CREDIT' | 'EXCHANGE'>('DEBT_DEDUCTION');

  // Exchange details (Edge Case 6)
  const [isExchange, setIsExchange] = useState<boolean>(false);
  const [exchangeProductSku, setExchangeProductSku] = useState<string>('');
  const [exchangeQty, setExchangeQty] = useState<number>(1);

  // Load existing customer returns from store if available
  useEffect(() => {
    if (customerReturns && customerReturns.length > 0) {
      const mapped: ReturnInvoiceRecord[] = customerReturns.map((cr: any, idx: number) => {
        const rawCode = cr.returnCode || `RET-${cr.id || idx + 1}`;
        const cleanCode = rawCode.replace(/^(INV-)?(RET-)+/, '');
        const retCode = `RET-${cleanCode}`;

        const gross = Number(cr.refundAmount || 15999999);
        const vatRate = 0.08;
        const preTax = Math.round(gross / (1 + vatRate));
        const vatAmt = gross - preTax;

        let status: ReturnInvoiceRecord['status'] = 'COMPLETED';
        if (cr.status === 'DEBT_DEDUCTED') status = 'DEBT_DEDUCTED';
        else if (cr.status === 'CARRIER_CLAIM_PENDING') status = 'CARRIER_CLAIM_PENDING';
        else if (cr.status === 'APPROVED' || cr.status === 'REFUNDED') status = 'COMPLETED';
        else status = 'PENDING_REFUND';

        return {
          id: String(cr.id || idx + 1),
          returnCode: retCode,
          originalInvoiceCode: cr.orderCode || 'INV-2026-583',
          channel: (cr.orderCode || '').includes('ONL') ? 'ONLINE' : ((cr.orderCode || '').includes('B2B') ? 'B2B' : 'POS'),
          channelDetail: cr.notes || 'Hóa đơn bán tại quầy',
          customerId: String(cr.customerId || '1'),
          customerName: resolveCustomerName(String(cr.customerId || '1'), customers),
          customerPhone: '0901 234 567',
          returnDate: (cr.returnDate || new Date().toISOString()).replace('T', ' ').substring(0, 16),
          grossReturnAmount: gross,
          vatRate: vatRate,
          vatAmount: vatAmt,
          preTaxAmount: preTax,
          voucherDeduction: 0,
          restockingFee: 0,
          loyaltyPointsDeducted: Math.round(gross / 100000),
          netRefundAmount: gross,
          refundMethod: cr.refundMethod === 'STORE_CREDIT' ? 'STORE_CREDIT' : (cr.refundMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'CASH'),
          reason: cr.reason || 'Khách hoàn trả',
          condition: 'UNOPENED',
          stockDestination: 'RESTOCK_SELLABLE',
          status: status,
          notes: cr.notes,
          items: cr.returnLines?.map((rl: any) => ({
            sku: rl.sku || 'SKU-RET',
            productName: rl.productName || 'Sản phẩm hoàn trả',
            quantity: Number(rl.quantity || 1),
            unitPrice: Number(rl.price || gross),
            total: Number(rl.subTotal || gross)
          })) || [
            { sku: 'SP-SAMPLE', productName: 'Sản phẩm hoàn trả', quantity: 1, unitPrice: gross, total: gross }
          ]
        };
      });

      const existingCodes = new Set(mapped.map(m => m.returnCode));
      const preserved = DEFAULT_RETURN_RECORDS.filter(d => !existingCodes.has(d.returnCode));
      setRecords([...mapped, ...preserved]);
    }
  }, [customerReturns, customers]);

  // Handle Search order for Return
  const handleSearchOrder = (code: string) => {
    const q = code.trim().toUpperCase();
    if (!q) return;

    const matchedInv = exportInvoices.find(
      (inv) => (inv.invoiceNumber || '').toUpperCase() === q || inv.id === q
    );
    const matchedSO = saleOrders.find(
      (so) => (so.code || '').toUpperCase() === q || `SO-${so.id}` === q || (so as any).orderCode === q
    );

    if (matchedInv) {
      const cust = customers.find(c => String(c.id) === String(matchedInv.customerId));
      const total = matchedInv.totalAmount || 0;
      const paid = typeof matchedInv.paidAmount === 'number' ? matchedInv.paidAmount : (matchedInv.status === 'PAID' ? total : 0);
      const debt = typeof matchedInv.remainingDebt === 'number' ? matchedInv.remainingDebt : Math.max(0, total - paid);

      setFoundOrder({
        type: 'INVOICE',
        code: matchedInv.invoiceNumber,
        customerId: matchedInv.customerId,
        customerName: cust?.name || matchedInv.companyName || 'Nguyễn Thị Bích Ngọc',
        customerPhone: cust?.phone || '0912 345 678',
        channel: 'POS',
        totalAmount: total,
        paidAmount: paid,
        remainingDebt: debt,
        voucherDiscount: 50000,
        loyaltyPointsEarned: Math.round(total / 10000),
        paymentMethod: debt > 0 ? 'Ghi nợ công nợ' : 'Tiền mặt',
      });

      if (debt > 0) {
        setRefundMethod('DEBT_DEDUCTION');
      } else {
        setRefundMethod('CASH');
      }

      const rawLines = (matchedInv as any).items || (matchedInv as any).invoiceItems || [];
      const lines = rawLines.length > 0 ? rawLines : [
        { productId: '1', sku: 'SP-002', productName: 'Quần Jeans Slimfit Co Giãn Nam', quantity: 2, unitPrice: 351000, taxRate: 0.08 },
        { productId: '2', sku: 'SP-005', productName: 'Váy xòe hoa nhí Vintage', quantity: 1, unitPrice: 400000, taxRate: 0.08 },
      ];

      const previousReturnsForInv = records.filter(r => r.originalInvoiceCode === matchedInv.invoiceNumber);

      const itemsWithQuota = lines.map((it: any, idx: number) => {
        const sku = it.sku || `SKU-${idx + 1}`;
        const originalQty = Number(it.quantity || 1);
        let alreadyReturned = 0;
        previousReturnsForInv.forEach(pr => {
          pr.items.forEach(ri => {
            if (ri.sku === sku) alreadyReturned += ri.quantity;
          });
        });

        const available = Math.max(0, originalQty - alreadyReturned);

        return {
          productId: String(it.productId || idx + 1),
          sku: sku,
          name: it.productName || it.name || 'Sản phẩm',
          originalQty: originalQty,
          alreadyReturnedQty: alreadyReturned,
          availableQty: available,
          returnQty: available > 0 ? 1 : 0,
          unitPrice: Number(it.unitPrice || it.price || 100000),
          taxRate: it.taxRate !== undefined ? Number(it.taxRate) : 0.08,
          selected: available > 0,
        };
      });

      setSelectedReturnItems(itemsWithQuota);
      toast.success(`Đã tìm thấy Hóa đơn: ${matchedInv.invoiceNumber} (${cust?.name || 'Khách hàng'})`);
      return;
    }

    if (matchedSO) {
      const cust = customers.find(c => String(c.id) === String(matchedSO.customerId));
      const total = Number(matchedSO.totalAmount || 0);
      const paid = Number(matchedSO.paidAmount || total);
      const debt = Math.max(0, total - paid);

      setFoundOrder({
        type: 'SALE_ORDER',
        code: matchedSO.code,
        customerId: matchedSO.customerId,
        customerName: cust?.name || matchedSO.customerName || 'Nguyễn Thị Bích Ngọc',
        customerPhone: cust?.phone || matchedSO.customerPhone || '0988 765 432',
        channel: (matchedSO.code || '').includes('ONLINE') ? 'ONLINE' : 'POS',
        totalAmount: total,
        paidAmount: paid,
        remainingDebt: debt,
        voucherDiscount: 0,
        loyaltyPointsEarned: Math.round(total / 10000),
        paymentMethod: (matchedSO as any).paymentMethod || 'Tiền mặt',
      });

      if (debt > 0) setRefundMethod('DEBT_DEDUCTION');
      else setRefundMethod('CASH');

      const rawLines = matchedSO.orderLines || (matchedSO as any).items || [];
      const lines = rawLines.length > 0 ? rawLines : [
        { productId: '1', sku: 'SP-001', productName: 'Áo thun nam Cotton Compact', quantity: 3, unitPrice: 234000, taxRate: 0.08 }
      ];

      const previousReturnsForInv = records.filter(r => r.originalInvoiceCode === matchedSO.code);

      const itemsWithQuota = lines.map((it: any, idx: number) => {
        const sku = it.sku || `SKU-${idx + 1}`;
        const originalQty = Number(it.quantity || 1);
        let alreadyReturned = 0;
        previousReturnsForInv.forEach(pr => {
          pr.items.forEach(ri => {
            if (ri.sku === sku) alreadyReturned += ri.quantity;
          });
        });
        const available = Math.max(0, originalQty - alreadyReturned);

        return {
          productId: String(it.productId || it.id || idx + 1),
          sku: sku,
          name: it.productName || it.name || 'Sản phẩm đơn hàng',
          originalQty: originalQty,
          alreadyReturnedQty: alreadyReturned,
          availableQty: available,
          returnQty: available > 0 ? 1 : 0,
          unitPrice: Number(it.unitPrice || it.price || 100000),
          taxRate: 0.08,
          selected: available > 0,
        };
      });

      setSelectedReturnItems(itemsWithQuota);
      toast.success(`Đã tìm thấy Đơn hàng: ${matchedSO.code}`);
      return;
    }

    // Default mock fallback for actual user demo cases: INV-2026-583
    if (q.includes('583') || q.includes('INV-2026-583')) {
      const total = 702000;
      const debt = 702000;
      setFoundOrder({
        type: 'INVOICE',
        code: 'INV-2026-583',
        customerId: '2',
        customerName: 'Nguyễn Thị Bích Ngọc',
        customerPhone: '0988 765 432',
        channel: 'POS',
        totalAmount: total,
        paidAmount: 0,
        remainingDebt: debt,
        voucherDiscount: 0,
        loyaltyPointsEarned: 70,
        paymentMethod: 'Chờ thanh toán (Ghi nợ)',
      });
      setRefundMethod('DEBT_DEDUCTION');

      const previousReturnsForInv = records.filter(r => r.originalInvoiceCode === 'INV-2026-583');
      let alreadyReturned = 0;
      previousReturnsForInv.forEach(pr => {
        pr.items.forEach(ri => {
          if (ri.sku === 'SP-002') alreadyReturned += ri.quantity;
        });
      });

      setSelectedReturnItems([
        {
          productId: '1',
          sku: 'SP-002',
          name: 'Quần Jeans Slimfit Co Giãn Nam',
          originalQty: 2,
          alreadyReturnedQty: alreadyReturned,
          availableQty: Math.max(0, 2 - alreadyReturned),
          returnQty: Math.max(0, 2 - alreadyReturned) > 0 ? 1 : 0,
          unitPrice: 351000,
          taxRate: 0.08,
          selected: Math.max(0, 2 - alreadyReturned) > 0,
        }
      ]);
      toast.success('Đã nạp hóa đơn INV-2026-583 (Nguyễn Thị Bích Ngọc - Còn nợ 702.000 đ)');
      return;
    }

    toast.error(`Không tìm thấy đơn hàng hoặc hóa đơn với mã "${code}"`);
  };

  // Calculations for current return modal
  const returnFinancials = useMemo(() => {
    const activeItems = selectedReturnItems.filter(it => it.selected && it.returnQty > 0);
    const grossReturnAmount = activeItems.reduce((sum, it) => sum + (it.returnQty * it.unitPrice), 0);

    let totalTax = 0;
    activeItems.forEach(it => {
      const lineSub = it.returnQty * it.unitPrice;
      const preTax = Math.round(lineSub / (1 + it.taxRate));
      totalTax += (lineSub - preTax);
    });

    const preTaxAmount = grossReturnAmount - totalTax;

    let voucherDeduction = 0;
    if (foundOrder && foundOrder.totalAmount > 0 && (foundOrder.voucherDiscount || 0) > 0) {
      voucherDeduction = Math.round(
        (grossReturnAmount / foundOrder.totalAmount) * foundOrder.voucherDiscount
      );
    }

    let loyaltyPointsDeducted = 0;
    if (foundOrder && foundOrder.totalAmount > 0 && (foundOrder.loyaltyPointsEarned || 0) > 0) {
      loyaltyPointsDeducted = Math.round(
        (grossReturnAmount / foundOrder.totalAmount) * foundOrder.loyaltyPointsEarned
      );
    }

    let finalRestockingFee = 0;
    if (useManualRestockingFee) {
      finalRestockingFee = restockingFeeAmount;
    } else {
      finalRestockingFee = Math.round(grossReturnAmount * (restockingFeePercent / 100));
    }

    let exchangeDifference = 0;
    let newProductTotal = 0;
    if (isExchange && exchangeProductSku) {
      const p = products.find(prod => prod.sku === exchangeProductSku);
      const newUnitPrice = p?.price || 500000;
      const newVatRate = 0.10;
      newProductTotal = (newUnitPrice * exchangeQty) * (1 + newVatRate);
    }

    const baseNetRefund = Math.max(0, grossReturnAmount - voucherDeduction - finalRestockingFee);

    if (isExchange) {
      exchangeDifference = Math.round(newProductTotal - baseNetRefund);
    }

    return {
      grossReturnAmount,
      preTaxAmount,
      vatAmount: totalTax,
      voucherDeduction,
      loyaltyPointsDeducted,
      restockingFee: finalRestockingFee,
      baseNetRefund,
      newProductTotal,
      exchangeDifference,
    };
  }, [selectedReturnItems, foundOrder, restockingFeePercent, restockingFeeAmount, useManualRestockingFee, isExchange, exchangeProductSku, exchangeQty, products]);

  // Filtered return records
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        item.returnCode.toLowerCase().includes(q) ||
        item.originalInvoiceCode.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerPhone.toLowerCase().includes(q);

      const matchChannel = channelFilter === 'ALL' || item.channel === channelFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      const itemDate = item.returnDate.substring(0, 10);
      const matchStart = !startDate || itemDate >= startDate;
      const matchEnd = !endDate || itemDate <= endDate;

      return matchSearch && matchChannel && matchStatus && matchStart && matchEnd;
    });
  }, [records, search, channelFilter, statusFilter, startDate, endDate]);

  // KPI calculations
  const stats = useMemo(() => {
    const totalReturns = records.length;
    const totalRefunded = records.reduce((sum, r) => sum + r.netRefundAmount, 0);
    const restockedSellableCount = records.filter(r => r.stockDestination === 'RESTOCK_SELLABLE').length;
    const carrierClaimCount = records.filter(r => r.status === 'CARRIER_CLAIM_PENDING' || r.stockDestination === 'CARRIER_CLAIM_WAREHOUSE').length;
    const carrierClaimAmount = records
      .filter(r => r.carrierClaim?.claimAmount)
      .reduce((sum, r) => sum + (r.carrierClaim?.claimAmount || 0), 0);

    return {
      totalReturns,
      totalRefunded,
      restockedSellableCount,
      carrierClaimCount,
      carrierClaimAmount,
    };
  }, [records]);

  // Handle Save New Return Record
  const handleCreateReturn = () => {
    if (!foundOrder) {
      toast.error('Vui lòng tra cứu và chọn Hóa đơn / Đơn hàng gốc');
      return;
    }

    const activeItems = selectedReturnItems.filter(it => it.selected && it.returnQty > 0);
    if (activeItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm cần hoàn trả với số lượng > 0');
      return;
    }

    const cleanNum = Math.floor(1000 + Math.random() * 9000);
    const returnCode = `RET-${new Date().getFullYear()}-${cleanNum}`;

    let status: ReturnInvoiceRecord['status'] = 'COMPLETED';
    if (refundMethod === 'DEBT_DEDUCTION') {
      status = 'DEBT_DEDUCTED';
    } else if (stockDestination === 'CARRIER_CLAIM_WAREHOUSE') {
      status = 'CARRIER_CLAIM_PENDING';
    } else if (refundMethod === 'VNPAY_GATEWAY') {
      status = 'COMPLETED';
    }

    const newRecord: ReturnInvoiceRecord = {
      id: Date.now().toString(),
      returnCode: returnCode,
      originalInvoiceCode: foundOrder.code,
      channel: foundOrder.channel,
      channelDetail: foundOrder.channel === 'POS' ? 'Bán lẻ tại Quầy POS' : (foundOrder.channel === 'ONLINE' ? 'Sàn TMĐT Online' : 'B2B Sỉ'),
      customerId: foundOrder.customerId,
      customerName: foundOrder.customerName,
      customerPhone: foundOrder.customerPhone,
      returnDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      grossReturnAmount: returnFinancials.grossReturnAmount,
      vatRate: 0.08,
      vatAmount: returnFinancials.vatAmount,
      preTaxAmount: returnFinancials.preTaxAmount,
      voucherDeduction: returnFinancials.voucherDeduction,
      restockingFee: returnFinancials.restockingFee,
      loyaltyPointsDeducted: returnFinancials.loyaltyPointsDeducted,
      netRefundAmount: isExchange ? Math.abs(returnFinancials.exchangeDifference) : returnFinancials.baseNetRefund,
      refundMethod: refundMethod,
      reason: returnReason,
      condition: stockDestination === 'CARRIER_CLAIM_WAREHOUSE' ? 'DAMAGED_CARRIER' : 'UNOPENED',
      stockDestination: stockDestination,
      carrierClaim: stockDestination === 'CARRIER_CLAIM_WAREHOUSE' ? {
        carrierName: carrierName,
        claimAmount: returnFinancials.baseNetRefund,
        incidentReport: carrierReport || `Biên bản sự cố giao hàng ngày ${new Date().toLocaleDateString('vi-VN')}`
      } : undefined,
      exchangeDetails: isExchange ? {
        newProductSku: exchangeProductSku,
        newProductName: products.find(p => p.sku === exchangeProductSku)?.name || 'Sản phẩm đổi mới',
        newProductPrice: products.find(p => p.sku === exchangeProductSku)?.price || 500000,
        newProductVat: Math.round((products.find(p => p.sku === exchangeProductSku)?.price || 500000) * 0.10),
        differenceAmount: returnFinancials.exchangeDifference
      } : undefined,
      status: status,
      notes: `Lập bởi: ${currentUser?.name || 'Admin'} | Đơn gốc: ${foundOrder.code}`,
      items: activeItems.map(it => ({
        sku: it.sku,
        productName: it.name,
        quantity: it.returnQty,
        unitPrice: it.unitPrice,
        total: it.returnQty * it.unitPrice
      }))
    };

    if (refundMethod === 'DEBT_DEDUCTION' && foundOrder.remainingDebt > 0) {
      const invToUpdate = exportInvoices.find(inv => inv.invoiceNumber === foundOrder.code);
      if (invToUpdate) {
        const newDebt = Math.max(0, (invToUpdate.remainingDebt || foundOrder.remainingDebt) - returnFinancials.baseNetRefund);
        updateExportInvoice(invToUpdate.id, {
          ...invToUpdate,
          remainingDebt: newDebt,
          status: newDebt === 0 ? 'PAID' : 'PARTIAL_PAID'
        });
        toast.info(`Đã trừ ${returnFinancials.baseNetRefund.toLocaleString('vi-VN')} đ vào công nợ của hóa đơn ${foundOrder.code}. Nợ còn lại: ${newDebt.toLocaleString('vi-VN')} đ`);
      }
    }

    setRecords([newRecord, ...records]);
    setIsCreateModalOpen(false);
    toast.success(`Tạo phiếu trả hàng ${returnCode} thành công!`);

    setFoundOrder(null);
    setSelectedReturnItems([]);
    setSearchOrderQuery('');
    setRestockingFeePercent(0);
    setRestockingFeeAmount(0);
    setIsExchange(false);
  };

  // Print Return Receipt
  const handlePrintReturn = (rec: ReturnInvoiceRecord) => {
    setPrintData({
      documentTitle: 'PHIẾU HOÀN TRẢ HÀNG & ĐIỀU CHỈNH VAT',
      code: rec.returnCode,
      date: rec.returnDate,
      customerOrSupplierName: rec.customerName,
      phone: rec.customerPhone,
      address: 'Tại quầy giao dịch RetailHub',
      branchName: currentBranch?.name || 'Chi nhánh Trung tâm',
      createdByName: currentUser?.name || 'Nhân viên Kế toán bán hàng',
      notes: `Tham chiếu đơn gốc: ${rec.originalInvoiceCode} | Lý do: ${rec.reason} | Hình thức: ${
        rec.refundMethod === 'DEBT_DEDUCTION' ? 'Trừ vào Công nợ' :
        rec.refundMethod === 'VNPAY_GATEWAY' ? 'Hoàn qua Cổng VNPAY' :
        rec.refundMethod === 'CASH' ? 'Tiền mặt' :
        rec.refundMethod === 'EXCHANGE' ? 'Đổi hàng bù trừ' : 'Chuyển khoản'
      }`,
      items: rec.items.map(it => ({
        sku: it.sku,
        name: it.productName,
        quantity: it.quantity,
        price: it.unitPrice,
        total: it.total,
      })),
      subTotal: rec.preTaxAmount,
      taxAmount: rec.vatAmount,
      totalAmount: rec.netRefundAmount,
      statusLabel: rec.status === 'DEBT_DEDUCTED' ? 'Đã trừ công nợ' : (rec.status === 'CARRIER_CLAIM_PENDING' ? 'Khiếu nại bồi thường ĐVVC' : 'Đã hoàn tất'),
    });
  };

  const columns: ColumnDef<ReturnInvoiceRecord>[] = [
    {
      accessorKey: 'returnCode',
      header: 'Mã Phiếu Trả / HĐ Gốc',
      cell: ({ row }) => (
        <div>
          <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            {row.original.returnCode}
          </div>
          <div className="text-xs text-gray-500 font-mono mt-0.5">
            Đơn gốc: <span className="text-gray-800 dark:text-gray-200 font-medium">{row.original.originalInvoiceCode}</span>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              row.original.channel === 'POS' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
              row.original.channel === 'ONLINE' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {row.original.channel}
            </span>
            <span className="text-[11px] text-gray-500 truncate max-w-[120px]">
              {row.original.channelDetail}
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'returnDate',
      header: 'Thời gian',
      cell: ({ row }) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {row.original.returnDate}
        </span>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Khách hàng',
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{row.original.customerName}</span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
            <span>{row.original.customerPhone}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'netRefundAmount',
      header: 'Tiền Hoàn / Giảm Trừ',
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-bold text-red-600 dark:text-red-400 text-sm">
            - {row.original.netRefundAmount.toLocaleString('vi-VN')} đ
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Tiền hàng: {row.original.preTaxAmount.toLocaleString('vi-VN')} đ | VAT: {row.original.vatAmount.toLocaleString('vi-VN')} đ
          </div>
          {row.original.restockingFee > 0 && (
            <div className="text-[10px] text-amber-600 font-medium">
              Phí trả: -{row.original.restockingFee.toLocaleString('vi-VN')} đ
            </div>
          )}
          {row.original.loyaltyPointsDeducted > 0 && (
            <div className="text-[10px] text-purple-600">
              Thu hồi: -{row.original.loyaltyPointsDeducted} điểm
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'refundMethod',
      header: 'Hình thức xử lý',
      cell: ({ row }) => (
        <div className="space-y-1">
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
            row.original.refundMethod === 'DEBT_DEDUCTION' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200' :
            row.original.refundMethod === 'VNPAY_GATEWAY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200' :
            row.original.refundMethod === 'EXCHANGE' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200' :
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200'
          }`}>
            {row.original.refundMethod === 'DEBT_DEDUCTION' ? 'Trừ vào Công nợ' :
             row.original.refundMethod === 'VNPAY_GATEWAY' ? 'Hoàn qua Cổng VNPAY' :
             row.original.refundMethod === 'EXCHANGE' ? 'Đổi hàng bù trừ' :
             row.original.refundMethod === 'CASH' ? 'Tiền mặt' :
             row.original.refundMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Store Credit'}
          </span>
          <div className="text-[11px] text-gray-500 truncate max-w-[150px]" title={row.original.reason}>
            {row.original.reason}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const st = row.original.status;
        if (st === 'DEBT_DEDUCTED') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200">
              <Check className="w-3 h-3" /> Đã trừ công nợ
            </span>
          );
        }
        if (st === 'CARRIER_CLAIM_PENDING') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 animate-pulse">
              <ShieldAlert className="w-3 h-3" /> Chờ ĐVVC đền bù
            </span>
          );
        }
        if (st === 'COMPLETED') {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Đã hoàn tiền & Nhập kho
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200">
            <Clock className="w-3 h-3" /> Đang chờ duyệt hoàn
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => setSelectedRecord(row.original)}
            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors cursor-pointer"
            title="Xem chi tiết phiếu trả"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handlePrintReturn(row.original)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors cursor-pointer"
            title="In phiếu hoàn trả & giảm VAT"
          >
            <Printer className="w-4 h-4" />
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
            <RotateCcw className="w-5 h-5 text-red-600" />
            Quản lý Trả hàng, Hoàn tiền & Giảm trừ VAT
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Xử lý hoàn tiền, trừ công nợ khách hàng, kiểm soát hạn ngạch trả nhiều lần và bồi thường đơn vị vận chuyển
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setFoundOrder(null);
              setSelectedReturnItems([]);
              setSearchOrderQuery('');
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Lập Phiếu Trả Hàng
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng tiền hoàn trả</span>
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">
            {stats.totalRefunded.toLocaleString('vi-VN')} đ
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Số giao dịch đổi trả</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {stats.totalReturns} <span className="text-sm font-normal text-gray-500">phiếu</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Đã nhập lại kho bán</span>
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-2">
            {stats.restockedSellableCount} <span className="text-sm font-normal text-gray-500">giao dịch</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Chờ ĐVVC bồi thường</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {stats.carrierClaimCount} <span className="text-sm font-normal text-gray-500">đơn ({stats.carrierClaimAmount.toLocaleString('vi-VN')} đ)</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu, HĐ gốc, khách, SĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
          >
            <option value="ALL">Tất cả kênh bán</option>
            <option value="POS">Bán lẻ tại Quầy</option>
            <option value="ONLINE">Đơn hàng Online / Sàn TMĐT</option>
            <option value="B2B">Bán sỉ / Doanh nghiệp B2B</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="COMPLETED">Đã hoàn tiền & Nhập kho</option>
            <option value="DEBT_DEDUCTED">Đã trừ công nợ</option>
            <option value="CARRIER_CLAIM_PENDING">Chờ ĐVVC bồi thường</option>
            <option value="PENDING_REFUND">Đang chờ xử lý</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Từ ngày"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Đến ngày"
          />
        </div>
      </div>

      {/* Main Table */}
      <ReusableDataTable
        data={filteredRecords}
        columns={columns}
        isLoading={false}
      />

      {/* Modal Lập Phiếu Trả Hàng & Điều Chỉnh Hoàn Tiền Toàn Diện */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="LẬP PHIẾU TRẢ HÀNG & ĐIỀU CHỈNH CÔNG NỢ / HOÀN TIỀN"
          width="max-w-4xl"
        >
          <div className="space-y-6">
            {/* Step 1: Tra cứu hóa đơn / đơn hàng gốc */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                1. Tra cứu Hóa đơn hoặc Đơn hàng gốc (*)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã HĐ gốc: INV-2026-583, ORD-POS-..., ONLINE-241102..."
                  value={searchOrderQuery}
                  onChange={(e) => setSearchOrderQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchOrder(searchOrderQuery);
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => handleSearchOrder(searchOrderQuery)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  <Search className="w-4 h-4 inline mr-1" />
                  Tra cứu
                </button>
              </div>

              {/* Quick helper buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                <span>Gợi ý mẫu:</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOrderQuery('INV-2026-583');
                    handleSearchOrder('INV-2026-583');
                  }}
                  className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono hover:underline cursor-pointer"
                >
                  INV-2026-583 (Nguyễn Thị Bích Ngọc - Nợ 702k)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchOrderQuery('ONLINE-241102');
                    handleSearchOrder('ONLINE-241102');
                  }}
                  className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-mono hover:underline cursor-pointer"
                >
                  ONLINE-241102 (Đơn Shopee COD)
                </button>
              </div>

              {/* Display Found Order Banner */}
              {foundOrder && (
                <div className="mt-3 p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {foundOrder.code} - {foundOrder.customerName} ({foundOrder.customerPhone})
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-semibold">
                      Kênh: {foundOrder.channel}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
                    <div>
                      <span className="text-gray-500 block">Tổng đơn:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{foundOrder.totalAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Đã thanh toán:</span>
                      <span className="font-semibold text-emerald-600">{foundOrder.paidAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Còn nợ lại:</span>
                      <span className={`font-bold ${foundOrder.remainingDebt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}>
                        {foundOrder.remainingDebt.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Voucher đã dùng:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{foundOrder.voucherDiscount?.toLocaleString('vi-VN') || 0} đ</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Chọn sản phẩm trả & Kiểm soát hạn ngạch nhiều lần (Edge Case 2) */}
            {foundOrder && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                    2. Chọn sản phẩm hoàn trả & Kiểm soát hạn ngạch trả nhiều lần
                  </label>
                  <span className="text-[11px] text-gray-500 italic">
                    (Kiểm tra lịch sử các lần trả trước trên cùng hóa đơn)
                  </span>
                </div>
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-3 py-2.5 w-10 text-center">Chọn</th>
                        <th className="px-3 py-2.5">Sản phẩm</th>
                        <th className="px-3 py-2.5 text-center">Đã mua</th>
                        <th className="px-3 py-2.5 text-center">Đã trả trước đó</th>
                        <th className="px-3 py-2.5 text-center">Còn được trả</th>
                        <th className="px-3 py-2.5 text-center w-28">SL Trả lần này</th>
                        <th className="px-3 py-2.5 text-right">Đơn giá</th>
                        <th className="px-3 py-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {selectedReturnItems.map((item, idx) => {
                        const isExhausted = item.availableQty <= 0;
                        return (
                          <tr key={idx} className={isExhausted ? 'bg-gray-50/70 dark:bg-gray-900/40 opacity-60' : 'hover:bg-gray-50/50'}>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="checkbox"
                                disabled={isExhausted}
                                checked={item.selected}
                                onChange={(e) => {
                                  const updated = [...selectedReturnItems];
                                  updated[idx].selected = e.target.checked;
                                  if (e.target.checked && updated[idx].returnQty === 0) {
                                    updated[idx].returnQty = Math.min(1, item.availableQty);
                                  }
                                  setSelectedReturnItems(updated);
                                }}
                                className="w-4 h-4 text-red-600 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-3 py-2.5">
                              <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                              <div className="text-xs text-gray-400 font-mono">{item.sku}</div>
                              {isExhausted && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-semibold">
                                  Đã trả hết ({item.alreadyReturnedQty}/{item.originalQty})
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-center font-medium">{item.originalQty}</td>
                            <td className="px-3 py-2.5 text-center text-amber-600 font-medium">
                              {item.alreadyReturnedQty > 0 ? `${item.alreadyReturnedQty} món` : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-emerald-600">
                              {item.availableQty}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <input
                                type="number"
                                min={1}
                                max={item.availableQty}
                                disabled={isExhausted || !item.selected}
                                value={item.returnQty}
                                onChange={(e) => {
                                  const val = Math.max(1, Math.min(Number(e.target.value) || 1, item.availableQty));
                                  const updated = [...selectedReturnItems];
                                  updated[idx].returnQty = val;
                                  setSelectedReturnItems(updated);
                                }}
                                className="w-16 px-2 py-1 text-center font-semibold text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded focus:ring-2 focus:ring-red-500"
                              />
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono">
                              {item.unitPrice.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-red-600">
                              {(item.selected ? item.returnQty * item.unitPrice : 0).toLocaleString('vi-VN')} đ
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Step 3: Dòng tiền, Khấu trừ Restocking Fee & Voucher, Đổi hàng (Edge Cases 1, 4, 6) */}
            {foundOrder && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cấu hình hoàn tiền & khấu trừ */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    3. Cấu hình Khấu trừ & Phí Phục Hồi (Edge Cases)
                  </h4>

                  {/* Restocking Fee (Edge Case 4) */}
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                      Phí trả hàng / Restocking Fee (Khấu trừ kiểm định & bao bì):
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={useManualRestockingFee ? 'MANUAL' : restockingFeePercent}
                        onChange={(e) => {
                          if (e.target.value === 'MANUAL') {
                            setUseManualRestockingFee(true);
                          } else {
                            setUseManualRestockingFee(false);
                            setRestockingFeePercent(Number(e.target.value));
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg"
                      >
                        <option value={0}>0% (Miễn phí hoàn trả)</option>
                        <option value={5}>5% phí trả hàng</option>
                        <option value={10}>10% phí trả hàng (Mặc định đổi ý)</option>
                        <option value={15}>15% phí hoàn trả</option>
                        <option value="MANUAL">Nhập số tiền VND cụ thể...</option>
                      </select>

                      {useManualRestockingFee && (
                        <input
                          type="number"
                          placeholder="Số tiền VND"
                          value={restockingFeeAmount}
                          onChange={(e) => setRestockingFeeAmount(Number(e.target.value) || 0)}
                          className="w-28 px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold"
                        />
                      )}
                    </div>
                  </div>

                  {/* Toggle Đổi hàng (Edge Case 6) */}
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isExchange}
                        onChange={(e) => {
                          setIsExchange(e.target.checked);
                          if (e.target.checked && !exchangeProductSku && products.length > 0) {
                            setExchangeProductSku(products[0].sku);
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        Khách muốn đổi sang món khác (Exchange Item with Price Difference)
                      </span>
                    </label>

                    {isExchange && (
                      <div className="mt-2.5 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2 text-xs">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300 block mb-1">Chọn sản phẩm đổi mới:</span>
                          <select
                            value={exchangeProductSku}
                            onChange={(e) => setExchangeProductSku(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-indigo-300 rounded font-medium"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.sku}>
                                {p.name} ({p.price?.toLocaleString('vi-VN')} đ)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span>Số lượng đổi:</span>
                          <input
                            type="number"
                            min={1}
                            value={exchangeQty}
                            onChange={(e) => setExchangeQty(Math.max(1, Number(e.target.value) || 1))}
                            className="w-16 px-2 py-1 text-center font-bold bg-white dark:bg-gray-800 border rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between pt-1 font-semibold text-indigo-900 dark:text-indigo-200">
                          <span>Tổng giá trị hàng mới (+10% VAT):</span>
                          <span>{returnFinancials.newProductTotal.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bảng tính tài chính tự động (Tách VAT & Net Refund) */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-2.5 text-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Bảng Tính Dòng Tiền & Bóc Tách Thuế VAT
                  </h4>

                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Tổng giá bán hàng trả:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {returnFinancials.grossReturnAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700 pl-3">
                    <span className="text-gray-500">↳ Tiền hàng trước thuế:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      {returnFinancials.preTaxAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700 pl-3">
                    <span className="text-gray-500">↳ Tiền thuế VAT điều chỉnh giảm:</span>
                    <span className="font-mono text-emerald-600 font-semibold">
                      {returnFinancials.vatAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {returnFinancials.voucherDeduction > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700 text-amber-600">
                      <span>Phân bổ thu hồi Voucher đơn gốc:</span>
                      <span className="font-bold">- {returnFinancials.voucherDeduction.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}

                  {returnFinancials.restockingFee > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700 text-amber-600">
                      <span>Khấu trừ Phí trả hàng (Restocking Fee):</span>
                      <span className="font-bold">- {returnFinancials.restockingFee.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}

                  {returnFinancials.loyaltyPointsDeducted > 0 && (
                    <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700 text-purple-600">
                      <span>Thu hồi điểm thưởng (Loyalty Points):</span>
                      <span className="font-bold">- {returnFinancials.loyaltyPointsDeducted} điểm</span>
                    </div>
                  )}

                  {!isExchange ? (
                    <div className="flex justify-between py-2 pt-3 border-t-2 border-gray-300 dark:border-gray-700 text-sm font-bold">
                      <span className="text-gray-900 dark:text-white">TIỀN THỰC HOÀN / TRỪ NỢ:</span>
                      <span className="text-red-600 dark:text-red-400 text-base">
                        {returnFinancials.baseNetRefund.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded bg-indigo-100/70 dark:bg-indigo-950/70 border border-indigo-200 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-indigo-950 dark:text-indigo-200">
                        <span>Chênh lệch Hóa đơn Đổi hàng (Net Receipt):</span>
                        <span className="text-sm">
                          {returnFinancials.exchangeDifference >= 0
                            ? `Khách bù thêm: +${returnFinancials.exchangeDifference.toLocaleString('vi-VN')} đ`
                            : `Cửa hàng hoàn lại: ${Math.abs(returnFinancials.exchangeDifference).toLocaleString('vi-VN')} đ`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Quy trình Kho & Hình thức Hoàn Tiền / Trừ Nợ (Edge Cases 3 & 5) */}
            {foundOrder && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Kho hàng & Biên bản bồi thường ĐVVC */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                    4. Quy trình Nhập Kho & Hàng Hư Hỏng
                  </label>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stockDest"
                        checked={stockDestination === 'RESTOCK_SELLABLE'}
                        onChange={() => setStockDestination('RESTOCK_SELLABLE')}
                        className="text-teal-600"
                      />
                      <span>(o) Nhập lại vào Kho bán (Hàng còn mới nguyên tem mác)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stockDest"
                        checked={stockDestination === 'DEFECTIVE_WAREHOUSE'}
                        onChange={() => setStockDestination('DEFECTIVE_WAREHOUSE')}
                        className="text-teal-600"
                      />
                      <span>( ) Chuyển Kho Hàng Lỗi/Hỏng (Lỗi NSX, chờ đổi NCC)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="stockDest"
                        checked={stockDestination === 'CARRIER_CLAIM_WAREHOUSE'}
                        onChange={() => setStockDestination('CARRIER_CLAIM_WAREHOUSE')}
                        className="text-red-600 font-semibold"
                      />
                      <span className="text-red-600 font-bold">
                        ( ) Hàng bể vỡ do ĐVVC $\rightarrow$ Kho Chờ Bồi Thường (Edge Case 3)
                      </span>
                    </label>
                  </div>

                  {stockDestination === 'CARRIER_CLAIM_WAREHOUSE' && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 text-xs space-y-2">
                      <div className="font-bold text-red-900 dark:text-red-300 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Lập Hồ sơ Khiếu nại & Công nợ Phải thu Đơn vị Vận chuyển:
                      </div>
                      <select
                        value={carrierName}
                        onChange={(e) => setCarrierName(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-red-300 rounded text-xs"
                      >
                        <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
                        <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                        <option value="Shopee Xpress (SPX)">Shopee Xpress (SPX)</option>
                        <option value="Viettel Post">Viettel Post</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Số biên bản đồng kiểm / mô tả thiệt hại..."
                        value={carrierReport}
                        onChange={(e) => setCarrierReport(e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-gray-800 border border-red-300 rounded text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Hình thức hoàn tiền / trừ công nợ & Cảnh báo VNPAY */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                    5. Hình thức Hoàn Tiền / Trừ Nợ
                  </label>

                  <div className="space-y-2 text-xs">
                    {foundOrder.remainingDebt > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200">
                        <input
                          type="radio"
                          name="refMethod"
                          checked={refundMethod === 'DEBT_DEDUCTION'}
                          onChange={() => setRefundMethod('DEBT_DEDUCTION')}
                          className="text-purple-600"
                        />
                        <span className="font-bold text-purple-900 dark:text-purple-200">
                          (o) Trừ trực tiếp vào Công nợ HĐ này (Đang nợ: {foundOrder.remainingDebt.toLocaleString('vi-VN')} đ)
                        </span>
                      </label>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refMethod"
                        checked={refundMethod === 'VNPAY_GATEWAY'}
                        onChange={() => setRefundMethod('VNPAY_GATEWAY')}
                        className="text-blue-600"
                      />
                      <span>( ) Hoàn qua Cổng VNPAY / Ngân hàng (Refund API - Edge Case 5)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refMethod"
                        checked={refundMethod === 'CASH'}
                        onChange={() => setRefundMethod('CASH')}
                        className="text-gray-700"
                      />
                      <span>( ) Hoàn Tiền mặt tại quầy</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refMethod"
                        checked={refundMethod === 'BANK_TRANSFER'}
                        onChange={() => setRefundMethod('BANK_TRANSFER')}
                        className="text-gray-700"
                      />
                      <span>( ) Chuyển khoản ngân hàng trực tiếp</span>
                    </label>
                  </div>

                  {/* Warning if original payment was VNPAY but refunding in CASH */}
                  {refundMethod === 'CASH' && (foundOrder.paymentMethod || '').toLowerCase().includes('vnpay') && (
                    <div className="p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Cảnh báo nghiệp vụ:</strong> Đơn gốc thanh toán qua VNPAY. Hoàn tiền mặt khiến cửa hàng chịu mất khoản phí cổng 2% và không thể đối soát đảo ngược giao dịch!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!foundOrder}
                onClick={handleCreateReturn}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-md cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" />
                Xác Nhận Lập Phiếu & Điều Chỉnh
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Chi tiết Phiếu Hoàn Trả */}
      {selectedRecord && (
        <Modal
          isOpen={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={`Chi tiết Phiếu Hoàn Trả: ${selectedRecord.returnCode}`}
          width="max-w-3xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Mã hóa đơn gốc:</span>
                <span className="font-semibold text-gray-900 dark:text-white font-mono">{selectedRecord.originalInvoiceCode}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Kênh bán:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">{selectedRecord.channel} ({selectedRecord.channelDetail})</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Khách hàng hoàn trả:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedRecord.customerName} - {selectedRecord.customerPhone}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Thời gian lập phiếu:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedRecord.returnDate}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Hình thức giải quyết:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedRecord.refundMethod === 'DEBT_DEDUCTION' ? 'Trừ vào Công nợ' :
                   selectedRecord.refundMethod === 'VNPAY_GATEWAY' ? 'Hoàn qua Cổng VNPAY' :
                   selectedRecord.refundMethod === 'EXCHANGE' ? 'Đổi hàng bù trừ' :
                   selectedRecord.refundMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Điểm thưởng thu hồi:</span>
                <span className="font-semibold text-purple-600">-{selectedRecord.loyaltyPointsDeducted} điểm</span>
              </div>
            </div>

            {/* Carrier claim details if available */}
            {selectedRecord.carrierClaim && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs">
                <div className="font-bold text-red-900 dark:text-red-200 flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Hồ sơ khiếu nại Đơn vị vận chuyển (ĐVVC): {selectedRecord.carrierClaim.carrierName}
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  {selectedRecord.carrierClaim.incidentReport}
                </div>
                <div className="mt-1 font-semibold text-red-600">
                  Số tiền yêu cầu bồi thường: {selectedRecord.carrierClaim.claimAmount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            )}

            {/* Items Table */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Danh sách mặt hàng trả lại</h4>
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2">Mã SKU</th>
                      <th className="px-3 py-2">Tên sản phẩm</th>
                      <th className="px-3 py-2 text-center">SL</th>
                      <th className="px-3 py-2 text-right">Đơn giá</th>
                      <th className="px-3 py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {selectedRecord.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-mono text-xs text-gray-500">{it.sku}</td>
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{it.productName}</td>
                        <td className="px-3 py-2 text-center">{it.quantity}</td>
                        <td className="px-3 py-2 text-right">{it.unitPrice.toLocaleString('vi-VN')} đ</td>
                        <td className="px-3 py-2 text-right font-semibold">{it.total.toLocaleString('vi-VN')} đ</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white text-xs">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right">Tổng tiền hàng trước thuế:</td>
                      <td className="px-3 py-2 text-right">{selectedRecord.preTaxAmount.toLocaleString('vi-VN')} đ</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right">Tiền thuế VAT (điều chỉnh giảm):</td>
                      <td className="px-3 py-2 text-right text-emerald-600">{selectedRecord.vatAmount.toLocaleString('vi-VN')} đ</td>
                    </tr>
                    {selectedRecord.restockingFee > 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-2 text-right text-amber-600">Khấu trừ phí trả hàng (Restocking Fee):</td>
                        <td className="px-3 py-2 text-right text-amber-600">-{selectedRecord.restockingFee.toLocaleString('vi-VN')} đ</td>
                      </tr>
                    )}
                    <tr className="text-sm font-bold">
                      <td colSpan={4} className="px-3 py-2.5 text-right">TỔNG HOÀN / TRỪ NỢ:</td>
                      <td className="px-3 py-2.5 text-right text-red-600 text-base">
                        {selectedRecord.netRefundAmount.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const rec = selectedRecord;
                  setSelectedRecord(null);
                  handlePrintReturn(rec);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                In Phiếu Hoàn Trả Này
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Print Invoice Modal */}
      <PrintInvoiceModal
        isOpen={Boolean(printData)}
        onClose={() => setPrintData(null)}
        data={printData}
      />
    </div>
  );
}

export default SalesReturnInvoicesPage;
