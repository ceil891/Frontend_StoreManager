import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, ScanBarcode, UserPlus, CreditCard, Trash2, Plus, Minus, X,
  ArrowLeft, Image as ImageIcon, Gift, Smartphone, Landmark, Banknote,
  CheckCircle2, ShoppingCart as ShoppingCartIcon, Tag, ChevronDown, Clock,
  type LucideIcon, Loader2
} from 'lucide-react';
import { usePosCartStore } from '../store/posCartStore';
import type { PosProduct } from '../store/posCartStore';
import { usePosConfigStore } from '../store/posConfigStore';
import { Modal } from '@/shared/components/ui/Modal';
import { PrintInvoiceModal, type PrintInvoiceData } from '@/shared/components/ui/PrintInvoiceModal';
import { AddressCascadeSelect } from '@/shared/components/ui/AddressCascadeSelect';
import { useSalesStore, BRANCH_NAME_BY_ID, deriveShiftId, WALK_IN_CUSTOMER_ID } from '@/features/sales/store/salesStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Link } from 'react-router';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { useLoyaltyConfigStore } from '@/features/crm/store/loyaltyConfigStore';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { toast } from 'sonner';

// ─── POS Vouchers ─────────────────────────────────────────────

const VOUCHERS: Record<string, { type: 'PERCENT' | 'FLAT'; value: number }> = {
  'HELLOSUMMER': { type: 'PERCENT', value: 15 },
  'RETAILHUB50K': { type: 'FLAT', value: 50000 },
  'VIP10': { type: 'PERCENT', value: 10 },
  'WELCOME': { type: 'FLAT', value: 20000 },
};

type DisplayPayment = { id: string; label: string; icon: LucideIcon; isCash: boolean };

function iconForProvider(t: PaymentMethodRecord['providerType']): LucideIcon {
  switch (t) {
    case 'CASH_DRAWER':
      return Banknote;
    case 'CREDIT_CARD_GATEWAY':
      return CreditCard;
    case 'BANK_TRANSFER_QR':
      return Landmark;
    case 'QR_EWALLET':
      return Smartphone;
    case 'BUY_NOW_PAY_LATER':
      return CreditCard;
    default:
      return CreditCard;
  }
}

const FALLBACK_PAYMENTS: DisplayPayment[] = [
  { id: 'fb-cash', label: 'Tiền mặt', icon: Banknote, isCash: true },
  { id: 'fb-card', label: 'Thẻ tín dụng/ghi nợ', icon: CreditCard, isCash: false },
  { id: 'fb-transfer', label: 'Chuyển khoản', icon: Landmark, isCash: false },
  { id: 'fb-ewallet', label: 'Ví điện tử (Momo/ZaloPay)', icon: Smartphone, isCash: false },
];

const fmt = (n: number) => n.toLocaleString('vi-VN') + 'đ';

function SafeProductImage({ src, alt, className, iconClassName }: { src?: string; alt?: string; className?: string; iconClassName?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <ImageIcon className={iconClassName || "w-8 h-8 text-gray-300"} />;
  }

  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function PosTerminalPage() {
  const { items, addItem, removeItem, updateQuantity, getTotal, clearCart, tabs, activeTabId, createTab, switchTab, closeTab } = usePosCartStore();
  const paymentMethodsFromConfig = usePosConfigStore((s) => s.paymentMethods);
  const addSaleOrder = useSalesStore((s) => s.addSaleOrder);
  const { products, fetchProducts, categories, fetchCategories } = useInventoryStore();
  const { customers, fetchCustomers, addCustomer } = useCrmStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, [fetchProducts, fetchCategories, fetchCustomers]);

  const productsList = useMemo(() => {
    return (products || []).map((p) => {
      const cat = (categories || []).find((c) => c.categoryName === p.category);
      const tc = (cat?.taxClass || 'VAT_8') as string;
      let rate = 0.08;
      if (tc === 'VAT_5') rate = 0.05;
      else if (tc === 'VAT_10') rate = 0.10;
      else if (tc === 'EXEMPT') rate = 0.00;
      return {
        id: String(p.id),
        name: p.name || '',
        price: Number(p.price || 0),
        image: p.mainImage || (p as any).mainImageUrl || 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80',
        sku: p.sku || '',
        category: p.category || 'Tất cả',
        unit: p.unit || 'Cái',
        stock: Number(p.onHand || 0),
        taxRate: rate,
      };
    });
  }, [products, categories]);

  const categoryTabs = useMemo(() => {
    const dbCats = (categories || []).map((c) => c.categoryName).filter(Boolean);
    if (dbCats.length > 0) {
      return Array.from(new Set(['Tất cả', ...dbCats]));
    }
    const productCats = productsList.map((p) => p.category).filter((c) => Boolean(c) && c !== 'Tất cả');
    return Array.from(new Set(['Tất cả', ...productCats]));
  }, [categories, productsList]);

  const displayPayments = useMemo<DisplayPayment[]>(() => {
    const active = paymentMethodsFromConfig.filter((m) => m.status === 'ACTIVE');
    if (active.length === 0) return FALLBACK_PAYMENTS;
    return active.map((m) => ({
      id: m.id,
      label: m.methodName.length > 40 ? `${m.methodName.slice(0, 38)}…` : m.methodName,
      icon: iconForProvider(m.providerType),
      isCash: m.providerType === 'CASH_DRAWER',
    }));
  }, [paymentMethodsFromConfig]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');

  // Customer
  const [customerPhone, setCustomerPhone] = useState('');
  const [activeCustomer, setActiveCustomer] = useState<{ id: string; name: string; phone: string; points: number } | null>(null);
  const [usedPoints, setUsedPoints] = useState(0);

  // Quick Create Customer Modal State
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerShortName, setNewCustomerShortName] = useState('');
  const [newCustomerPhoneInput, setNewCustomerPhoneInput] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerTaxCode, setNewCustomerTaxCode] = useState('');
  const [newCustomerType, setNewCustomerType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
  const [isSubmittingQuickCustomer, setIsSubmittingQuickCustomer] = useState(false);
  const [newCustomerNotes, setNewCustomerNotes] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState({
    province: '',
    district: '',
    ward: '',
    addressDetail: '',
  });

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingQuickCustomer) return;
    setIsSubmittingQuickCustomer(true);
    try {
      const cleanName = newCustomerName.trim();
      const cleanPhone = newCustomerPhoneInput.trim().replace(/\s+/g, '');

    if (!cleanName) {
      toast.error('Vui lòng nhập Họ & Tên khách hàng!');
      return;
    }

    if (!/^[0-9]{10,11}$/.test(cleanPhone)) {
      toast.error('Số điện thoại không hợp lệ! Vui lòng nhập từ 10 đến 11 chữ số.');
      return;
    }

    // Nếu SĐT đã tồn tại -> Chọn ngay khách hàng đó
    const existing = customers.find(c => c.phone === cleanPhone);
    if (existing) {
      setActiveCustomer({
        id: existing.id,
        name: existing.name,
        phone: existing.phone,
        points: existing.loyaltyPoints || 0,
      });
      setIsQuickCustomerOpen(false);
      toast.info(`SĐT đã tồn tại trong hệ thống! Đã chọn khách hàng: ${existing.name}`);
      return;
    }

    const customerId = 'CUST-POS-' + Math.floor(10000 + Math.random() * 90000);
    const newCust = {
      id: customerId,
      name: cleanName,
      phone: cleanPhone,
      points: 100, // Điểm thưởng tặng khi mở thẻ mới tại POS
    };

    try {
      await addCustomer({
        customerCode: customerId,
        name: newCustomerName.trim(),
        phone: newCustomerPhoneInput.trim(),
        email: newCustomerEmail.trim(),
        address: fullAddress,
        taxCode: newCustomerTaxCode.trim(),
        notes: newCustomerNotes.trim(),
        status: 'ACTIVE',
        registeredDate: new Date().toISOString().split('T')[0],
        loyaltyTier: 'BRONZE',
        loyaltyPoints: 100,
        lifetimeSpent: 0,
        lastActive: new Date().toISOString().split('T')[0],
        avatarUrl: '',
      });
    } catch (err) {
      console.error('Failed to persist customer to CRM backend:', err);
    }

    setActiveCustomer(newCust);
    setUsedPoints(0);
    setIsQuickCustomerOpen(false);
    toast.success(`Đã tạo thành công khách hàng "${newCust.name}" & lưu vào CRM hệ thống!`);
    // Reset form
    setNewCustomerName('');
    setNewCustomerShortName('');
    setNewCustomerPhoneInput('');
    setNewCustomerEmail('');
    setNewCustomerTaxCode('');
    setNewCustomerNotes('');
    setNewCustomerAddress({ province: '', district: '', ward: '', addressDetail: '' });
    } finally {
      setIsSubmittingQuickCustomer(false);
    }
  };

  // Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; type: 'PERCENT' | 'FLAT'; value: number } | null>(null);
  const [voucherError, setVoucherError] = useState('');

  // Payment modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(FALLBACK_PAYMENTS[0].id);
  const [cashGiven, setCashGiven] = useState('');
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success'>('idle');
  const [currentOrderCode, setCurrentOrderCode] = useState('');

  // Print Invoice Modal
  const [isPrintInvoiceOpen, setIsPrintInvoiceOpen] = useState(false);
  const [completedPrintInvoice, setCompletedPrintInvoice] = useState<PrintInvoiceData | null>(null);

  const paymentTimerRef = useRef<any>(null);
  const onCompleteRef = useRef<() => void>(() => {});

  const handleForceCompletePayment = () => {
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
    onCompleteRef.current();
  };

  // Time & Shift logic
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const getShift = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 14) return 'Ca sáng (06:00 - 14:00)';
    if (hour >= 14 && hour < 22) return 'Ca chiều (14:00 - 22:00)';
    return 'Ca đêm (22:00 - 06:00)';
  };

  useEffect(() => {
    const ids = displayPayments.map((d) => d.id);
    setSelectedPaymentId((prev) => (ids.includes(prev) ? prev : ids[0] ?? FALLBACK_PAYMENTS[0].id));
  }, [displayPayments]);

  const selectedPayment = displayPayments.find((d) => d.id === selectedPaymentId) ?? displayPayments[0];
  const isCashPayment = selectedPayment?.isCash ?? true;

  const stockById = useMemo(() => {
    const map = new Map<string, number>();
    productsList.forEach((p) => map.set(p.id, p.stock));
    return map;
  }, [productsList]);

  const getStock = (id: string) => stockById.get(id) ?? 0;

  const handleAddProduct = (product: (PosProduct & { stock: number })) => {
    const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;
    if (inCart >= product.stock) return;
    addItem(product);
  };

  const handleInc = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const stock = getStock(id);
    if (item.quantity >= stock) return;
    updateQuantity(id, item.quantity + 1);
  };

  const handleDec = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const next = item.quantity - 1;
    if (next <= 0) removeItem(id);
    else updateQuantity(id, next);
  };

  // ── Filtered products ───────────────────────────────────────────────────────
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchCat = activeCategory === 'Tất cả' || p.category === activeCategory;
      const matchQ =
        p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchCat && matchQ;
    });
  }, [productsList, activeCategory, debouncedSearchQuery]);

  // ── Customer ────────────────────────────────────────────────────────────────
  const handleSearchCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const q = customerPhone.trim().toLowerCase();
    if (!q) return;
    const found = customers.find(c =>
      c.phone.includes(q) ||
      (c.customerCode && c.customerCode.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q))
    );
    if (found) {
      setActiveCustomer({
        id: found.id,
        name: found.name,
        phone: found.phone,
        points: found.loyaltyPoints || 0,
      });
      setUsedPoints(0);
      toast.success(`Đã chọn thành viên: ${found.name} (${found.phone})`);
    } else {
      toast.error('Không tìm thấy khách hàng. Vui lòng bấm "+ Thêm KH" để đăng ký mới!');
    }
  };

  // ── Voucher ─────────────────────────────────────────────────────────────────
  const handleApplyVoucher = () => {
    const code = voucherCode.trim().toUpperCase();
    if (!code) { setVoucherError('Vui lòng nhập mã!'); return; }
    if (VOUCHERS[code]) {
      setAppliedVoucher({ code, ...VOUCHERS[code] });
      setVoucherCode('');
      setVoucherError('');
    } else {
      setVoucherError('Mã không hợp lệ hoặc đã hết hạn!');
      setAppliedVoucher(null);
    }
  };

  // ── Calculations ─────────────────────────────────────────────────────────────
  const loyaltyConfig = useLoyaltyConfigStore((s) => s.config);
  const subtotal = getTotal();
  const pointsDiscount = usedPoints * (loyaltyConfig?.redeemRateValue || 100);
  let voucherDiscount = 0;
  if (appliedVoucher) {
    voucherDiscount = appliedVoucher.type === 'PERCENT'
      ? subtotal * (appliedVoucher.value / 100)
      : appliedVoucher.value;
  }
  voucherDiscount = Math.min(voucherDiscount, subtotal);
  const taxableAmount = Math.max(0, subtotal - voucherDiscount - pointsDiscount);
  
  // Calculate VAT dynamically based on each item's tax rate
  const vatAmount = items.reduce((acc, item) => {
    const p = productsList.find((x) => x.id === item.id);
    const itemRate = p?.taxRate ?? 0.08;
    const itemSubtotal = (item.price * item.quantity) - (item.discount || 0);
    const discountRatio = subtotal > 0 ? taxableAmount / subtotal : 1;
    const itemTaxableAmount = itemSubtotal * discountRatio;
    return acc + (itemTaxableAmount * itemRate);
  }, 0);

  const totalAmount = taxableAmount + vatAmount;

  const cashGivenNum = parseFloat(cashGiven.replace(/\./g, '')) || 0;
  const changeAmount = Math.max(0, cashGivenNum - totalAmount);

  // ── Confirm payment ──────────────────────────────────────────────────────────
  const handleConfirmPayment = () => {
    const user = useAuthStore.getState().user;
    const pay = displayPayments.find((d) => d.id === selectedPaymentId);
    const payLabel = pay?.label ?? 'Tiền mặt';
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const code = currentOrderCode || `ORD-POS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
    const orderLines = items.map((i, idx) => ({
      id: `pos_${now.getTime()}_${idx}`,
      productVariantId: Number(i.id),
      sku: i.sku || String(i.id),
      productName: i.name,
      quantity: i.quantity,
      unitPrice: i.price,
      lineTotal: Math.round(i.quantity * i.price),
    }));
    const itemsSummary = orderLines
      .map((l) => `${l.productName}×${l.quantity}`)
      .join(', ')
      .slice(0, 240);

    const branchId = user?.branchId ?? null;
    const branchName = branchId ? (BRANCH_NAME_BY_ID[branchId] ?? branchId) : 'N/A';
    const cashierName = user?.name || 'Thu ngân POS';
    const customerDisplayName = activeCustomer
      ? activeCustomer.name
      : `${cashierName} (Khách vãng lai)`;

    const performOrderCreation = () => {
      addSaleOrder({
        code,
        customerId: activeCustomer?.id ?? WALK_IN_CUSTOMER_ID,
        customerName: customerDisplayName,
        date: dateStr,
        subTotal: Math.round(subtotal),
        taxAmount: Math.round(vatAmount),
        discountAmount: Math.round(voucherDiscount + pointsDiscount),
        totalAmount: Math.round(totalAmount),
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        paymentMethod: payLabel,
        cashier: user?.name ?? 'Thu ngân',
        createdByName: user?.name ?? 'Thu ngân',
        createdByEmail: user?.email,
        branchId,
        branchName,
        origin: 'POS',
        currency: 'VND',
        itemsSummary,
        orderLines,
        amountTendered: isCashPayment ? Math.round(cashGivenNum) : Math.round(totalAmount),
        changeAmount: isCashPayment ? Math.round(changeAmount) : 0,
        shiftId: deriveShiftId(now),
        promoCodeApplied: appliedVoucher?.code,
      });

      // Tự động trừ tồn kho hiển thị (onHand) trên POS ngay lập tức & đồng bộ toàn hệ thống
      try {
        const deductions = items.map((it) => ({ productId: String(it.id), qty: it.quantity }));
        (useInventoryStore.getState() as any).deductProductStock(deductions);
      } catch (err) {
        console.error('Failed to deduct local POS inventory state:', err);
      }

      const printInvoicePayload: PrintInvoiceData = {
        documentTitle: 'HÓA ĐƠN BÁN LẺ (VAT)',
        code,
        date: dateStr,
        customerOrSupplierName: customerDisplayName,
        phone: activeCustomer?.phone || 'N/A',
        branchName: branchName || 'Chi nhánh Trung Tâm POS',
        createdByName: cashierName,
        subTotal: Math.round(subtotal),
        taxAmount: Math.round(vatAmount),
        discountAmount: Math.round(voucherDiscount + pointsDiscount),
        totalAmount: Math.round(totalAmount),
        items: items.map((i) => ({
          sku: i.sku || String(i.id),
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          total: Math.round(i.quantity * i.price),
        })),
      };

      setCompletedPrintInvoice(printInvoicePayload);
      setPaymentState('success');

      setTimeout(() => {
        clearCart();
        setAppliedVoucher(null);
        setVoucherError('');
        setActiveCustomer(null);
        setCustomerPhone('');
        setUsedPoints(0);
        setPaymentState('idle');
        setIsPaymentOpen(false);
        setCashGiven('');
        setIsPrintInvoiceOpen(true);
      }, 1000);
    };

    onCompleteRef.current = performOrderCreation;
    setPaymentState('processing');
    const delay = isCashPayment ? 1200 : 3500;
    paymentTimerRef.current = setTimeout(performOrderCreation, delay);
  };

  // ── Quick cash buttons ────────────────────────────────────────────────────────
  const QUICK_CASH = [50000, 100000, 200000, 500000];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden font-sans">

      {/* ═══ LEFT PANEL: Products ═══ */}
      <div className="flex flex-col w-[68%] h-full">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 justify-between shrink-0 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <ShoppingCartIcon className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight hidden sm:block">RetailHub POS</h1>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm sản phẩm theo tên hoặc SKU... (F2)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ScanBarcode className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="text-right shrink-0 hidden lg:flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{currentTime.toLocaleDateString('vi-VN')} {currentTime.toLocaleTimeString('vi-VN')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1" title="Phiên làm việc giỏ hàng của máy POS này được cô lập độc lập">
                💻 Máy POS 01 (Độc lập)
              </span>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800">
                {getShift(currentTime)}
              </p>
            </div>
          </div>
        </header>

        {/* Category Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex gap-2 overflow-x-auto shrink-0">
          {categoryTabs.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Search className="w-10 h-10 opacity-20 mb-2" />
              <p className="text-sm">Không tìm thấy sản phẩm</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
              {filteredProducts.map(product => {
                const cartItem = items.find(i => i.id === product.id);
                const inCart = cartItem?.quantity ?? 0;
                const outOfStock = product.stock <= 0;
                const atLimit = inCart >= product.stock && product.stock > 0;
                const disabled = outOfStock || atLimit;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={disabled}
                    aria-label={`Thêm sản phẩm ${product.name}. Giá ${fmt(product.price)}. Tồn kho ${product.stock}. Đang chọn ${inCart}.`}
                    onClick={() => handleAddProduct(product)}
                    className={`relative bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all shadow-sm select-none flex flex-col group text-left ${
                      cartItem
                        ? 'border-emerald-400 dark:border-emerald-500 ring-1 ring-emerald-300 dark:ring-emerald-600'
                        : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md active:scale-95'}`}
                  >
                    {cartItem && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center z-10 shadow">
                        {cartItem.quantity}
                      </div>
                    )}
                    {outOfStock && (
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black z-10">
                        HẾT
                      </div>
                    )}
                    {atLimit && !outOfStock && (
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black z-10">
                        TỐI ĐA
                      </div>
                    )}
                    <div className="h-20 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-center p-2 shrink-0">
                      <SafeProductImage src={product.image} alt={product.name} className="h-full object-contain rounded" />
                    </div>
                    <div className="p-2 flex-1 flex flex-col justify-between">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h3>
                      <div>
                        <p className="text-[10px] text-gray-400 font-mono mb-0.5">{product.sku}</p>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{fmt(product.price)}</span>
                          <span className="text-[9px] text-gray-400">Tồn: {product.stock}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT PANEL: Cart & Customer ═══ */}
      <div className="flex flex-col w-[32%] h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        {/* Multi-Tab Order Holding Bar (Lưu tạm đơn bán dở) */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-x-auto shrink-0">
          {tabs.map((t) => {
            const isActive = t.id === activeTabId;
            return (
              <div
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <span>{t.name}</span>
                {t.items.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-white text-emerald-700' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {t.items.length}
                  </span>
                )}
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(t.id);
                    }}
                    className="opacity-60 hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-opacity"
                    title="Hủy đơn tạm này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => createTab()}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
            title="⚡ Mở giỏ/đơn bán dở mới"
          >
            <Plus className="w-3.5 h-3.5" /> Mở đơn
          </button>
        </div>

        {/* Customer Section */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 shrink-0 space-y-2 bg-gray-50 dark:bg-gray-900/20">
          {!activeCustomer ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <form onSubmit={handleSearchCustomer} className="flex-1 flex gap-2">
                  <input
                    type="text" placeholder="🔍 Nhập SĐT / Mã khách..."
                    value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button type="submit" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                    Tìm
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => {
                    setNewCustomerPhoneInput(customerPhone);
                    setIsQuickCustomerOpen(true);
                  }}
                  className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  title="➕ Đăng ký khách hàng mới tại POS"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Đăng ký
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] bg-slate-100 dark:bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                <span className="font-semibold">👤 Đang chọn: Khách vãng lai</span>
                <span className="text-[10px] italic text-slate-400">(Khách lẻ - Không tích điểm)</span>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">{activeCustomer.name}</h4>
                  <p className="text-xs text-gray-400 font-mono">{activeCustomer.phone}</p>
                </div>
                <button onClick={() => { setActiveCustomer(null); setCustomerPhone(''); setUsedPoints(0); }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 mt-1.5">
                <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" />
                    {activeCustomer.points} điểm khả dụng
                  </span>
                  <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                    (~{fmt(activeCustomer.points * (loyaltyConfig?.redeemRateValue || 100))})
                  </span>
                </div>
                {activeCustomer.points > 0 ? (
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={usedPoints === 0 ? '' : usedPoints}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        const num = val === '' ? 0 : parseInt(val, 10);
                        const maxAllowedPoints = Math.min(
                          activeCustomer.points,
                          Math.floor((subtotal * ((loyaltyConfig?.maxDiscountPercent || 50) / 100)) / (loyaltyConfig?.redeemRateValue || 100))
                        );
                        setUsedPoints(Math.min(num, maxAllowedPoints));
                      }}
                      placeholder="Gõ số điểm muốn đổi..."
                      className="flex-1 px-2.5 py-1 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs bg-emerald-50 dark:bg-emerald-900/10 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const maxAllowedPoints = Math.min(
                          activeCustomer.points,
                          Math.floor((subtotal * ((loyaltyConfig?.maxDiscountPercent || 50) / 100)) / (loyaltyConfig?.redeemRateValue || 100))
                        );
                        setUsedPoints(maxAllowedPoints);
                      }}
                      className="px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm shrink-0"
                    >
                      Dùng hết
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] italic text-gray-400 mt-1">Chưa có điểm khả dụng (Sẽ tự động tích điểm sau khi hoàn tất đơn hàng)</p>
                )}
              </div>
              {usedPoints > 0 && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-900/40">
                  <span>Trừ điểm thưởng ({usedPoints} điểm):</span>
                  <span>-{fmt(pointsDiscount)}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
              <ShoppingCartIcon className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Giỏ hàng trống</p>
              <p className="text-xs mt-1">Click vào sản phẩm để thêm</p>
            </div>
          ) : items.map(item => (
            <div key={item.id} className="flex gap-2.5 bg-gray-50 dark:bg-gray-700/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 shrink-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden flex items-center justify-center">
                <SafeProductImage src={item.image} alt={item.name} className="w-full h-full object-contain" iconClassName="w-4 h-4 text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-1 mb-1">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.name}</h4>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleDec(item.id)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg text-gray-600 dark:text-gray-400 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-gray-900 dark:text-white select-none">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleInc(item.id)}
                      disabled={item.quantity >= getStock(item.id) && getStock(item.id) > 0}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg text-gray-600 dark:text-gray-400 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-xs font-black text-gray-900 dark:text-white">{fmt(item.price * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shrink-0">
          {/* Voucher input */}
          <div className="mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text" placeholder="Nhập mã voucher..."
                  value={voucherCode} onChange={e => setVoucherCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
                  className="w-full pl-8 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <button onClick={handleApplyVoucher}
                className="px-3 py-1.5 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition-colors">
                Áp dụng
              </button>
            </div>
            {voucherError && <p className="text-[10px] text-red-500 mt-1 font-semibold">{voucherError}</p>}
            {appliedVoucher && (
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg px-2 py-1 mt-1.5 text-xs">
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  🏷️ {appliedVoucher.code} — {appliedVoucher.type === 'PERCENT' ? `-${appliedVoucher.value}%` : `-${fmt(appliedVoucher.value)}`}
                </span>
                <button onClick={() => { setAppliedVoucher(null); setVoucherError(''); }}
                  className="text-gray-400 hover:text-red-500 font-bold ml-2">✕</button>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs mb-3">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
              <span>{fmt(subtotal)}</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Giảm (Voucher)</span>
                <span>-{fmt(voucherDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Giảm (Điểm thưởng)</span>
                <span>-{fmt(pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Thuế VAT (8%)</span>
              <span>{fmt(vatAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Tổng cộng</span>
              <span className="text-emerald-600 dark:text-emerald-400">{fmt(totalAmount)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { clearCart(); setAppliedVoucher(null); setVoucherError(''); setUsedPoints(0); }}
              disabled={items.length === 0}
              className="p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Xóa giỏ hàng"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsPaymentOpen(true)}
              disabled={items.length === 0}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow"
            >
              <CreditCard className="w-5 h-5" />
              Thanh toán {fmt(totalAmount)}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Create Customer Modal for POS (Tối ưu siêu nhanh: Chỉ cần SĐT & Tên) */}
      <Modal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        title="⚡ Đăng ký Nhanh Khách Hàng Tại Quầy POS"
        width="max-w-md"
      >
        <form onSubmit={handleQuickCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Số điện thoại liên hệ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              autoFocus
              value={newCustomerPhoneInput}
              onChange={(e) => setNewCustomerPhoneInput(e.target.value)}
              placeholder="0901234567..."
              className="w-full px-3 py-2 border-2 border-emerald-300 dark:border-emerald-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-base focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Họ & Tên khách hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="Nguyễn Văn A..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsQuickCustomerOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmittingQuickCustomer}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingQuickCustomer && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <UserPlus className="w-4 h-4" /> ✓ Đăng ký & Chọn ngay
            </button>
          </div>
        </form>
      </Modal>

      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-scaleIn flex flex-col max-h-[90vh]">
            {paymentState === 'success' ? (
              /* SUCCESS SCREEN */
              <div className="flex flex-col items-center justify-center p-10 gap-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Thanh toán thành công!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Đơn hàng đã được xác nhận. Cảm ơn quý khách!</p>
                {isCashPayment && cashGivenNum > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4 text-center w-full">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tiền thối lại</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{fmt(changeAmount)}</p>
                  </div>
                )}
              </div>
            ) : paymentState === 'processing' ? (
              /* PROCESSING/QR WAITING SCREEN */
              <div className="flex flex-col items-center justify-center p-10 gap-4 animate-fadeIn">
                {isCashPayment ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Đang xử lý thanh toán tiền mặt...</h3>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-4 w-full">
                    <div className="text-center space-y-1">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">Quét mã QR thanh toán</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Vui lòng quét mã QR hoặc chạm thiết bị di động để thanh toán
                      </p>
                    </div>

                    <div className="relative border-2 border-dashed border-gray-250 dark:border-gray-700 p-3 bg-white rounded-2xl shadow-sm w-44 h-44 flex items-center justify-center overflow-hidden shrink-0">
                      <svg className="w-full h-full text-emerald-600" viewBox="0 0 100 100">
                        <path d="M10 25 V10 H25 M75 10 H90 V25 M90 75 V90 H75 M25 90 H10 V75" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        {selectedPayment.id.includes('ewallet') || selectedPayment.id.includes('transfer') || selectedPayment.id.includes('qr') ? (
                          <>
                            <rect x="20" y="20" width="15" height="15" fill="currentColor" />
                            <rect x="65" y="20" width="15" height="15" fill="currentColor" />
                            <rect x="20" y="65" width="15" height="15" fill="currentColor" />
                            <rect x="45" y="45" width="10" height="10" fill="currentColor" />
                            <rect x="55" y="65" width="10" height="10" fill="currentColor" />
                            <rect x="65" y="55" width="10" height="10" fill="currentColor" />
                            <rect x="45" y="65" width="5" height="5" fill="currentColor" />
                            <rect x="65" y="45" width="5" height="5" fill="currentColor" />
                          </>
                        ) : (
                          <>
                            <rect x="22" y="32" width="56" height="36" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
                            <circle cx="50" cy="50" r="5" fill="currentColor" />
                            <path d="M36 50 Q43 42 50 50 T64 50" fill="none" stroke="currentColor" strokeWidth="3" />
                          </>
                        )}
                      </svg>
                      <div className="absolute inset-x-0 h-0.5 bg-emerald-500 animate-bounce top-1/2 shadow shadow-emerald-500" />
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-400">Số tiền cần thu</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{fmt(totalAmount)}</p>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 text-center w-full">
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold animate-pulse flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang chờ cổng thanh toán phản hồi...
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleForceCompletePayment}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow active:scale-[0.98]"
                    >
                      Xác nhận đã nhận tiền (Ghi đè thủ công)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* PAYMENT FORM */
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Xác nhận Thanh toán</h2>
                  <button onClick={() => setIsPaymentOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 pt-4 pb-2">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 text-center mb-4">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-1">Số tiền cần thu</p>
                    <p className="text-4xl font-black text-gray-900 dark:text-white">{fmt(totalAmount)}</p>
                  </div>

                  {/* Payment method selection */}
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phương thức thanh toán</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {displayPayments.map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedPaymentId(m.id)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-colors ${
                            selectedPaymentId === m.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:bg-gray-650'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs leading-tight text-left">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cash input */}
                  {isCashPayment && (
                    <div className="mb-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Tiền khách đưa</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cashGiven}
                        onChange={e => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setCashGiven(digits === '' ? '' : parseInt(digits, 10).toLocaleString('vi-VN'));
                        }}
                        placeholder="Nhập số tiền..."
                        className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xl font-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      />
                      <div className="flex gap-2 mt-2">
                        {QUICK_CASH.map(q => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => {
                              const currentNum = cashGivenNum || 0;
                              const newTotal = currentNum + q;
                              setCashGiven(newTotal.toLocaleString('vi-VN'));
                            }}
                            className="flex-1 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-650 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            + {fmt(q)}
                          </button>
                        ))}
                      </div>
                      {cashGivenNum >= totalAmount && cashGivenNum > 0 && (
                        <div className="mt-2 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/40 rounded-lg px-3 py-2">
                          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Tiền thối lại:</span>
                          <span className="text-sm font-black text-blue-700 dark:text-blue-400">{fmt(changeAmount)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-6 pb-5 pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                  <button onClick={() => setIsPaymentOpen(false)}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold rounded-xl text-sm transition-colors">
                    Quay lại
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isCashPayment && cashGivenNum < totalAmount}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition-colors shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✓ Xác nhận
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PRINT INVOICE / RECEIPT MODAL */}
      <PrintInvoiceModal
        isOpen={isPrintInvoiceOpen}
        onClose={() => setIsPrintInvoiceOpen(false)}
        data={completedPrintInvoice}
      />
    </div>
  );
}
