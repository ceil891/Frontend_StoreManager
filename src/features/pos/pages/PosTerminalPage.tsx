import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search, ScanBarcode, UserPlus, CreditCard, Trash2, Plus, Minus, X,
  ArrowLeft, Image as ImageIcon, Gift, Smartphone, Landmark, Banknote,
  CheckCircle2, ShoppingCart as ShoppingCartIcon, Tag, ChevronDown, Clock,
  type LucideIcon, Loader2, RefreshCw, Layers, Printer, ShieldAlert, Keyboard,
  Percent, FileText, PauseCircle, Calculator, QrCode, Wallet, Receipt
} from 'lucide-react';
import { usePosCartStore } from '../store/posCartStore';
import type { PosProduct } from '../store/posCartStore';
import { usePosConfigStore, type PaymentMethodRecord } from '../store/posConfigStore';
import { usePosSessionStore } from '../store/posSessionStore';
import { Modal } from '@/shared/components/ui/Modal';
import { PrintInvoiceModal, type PrintInvoiceData } from '@/shared/components/ui/PrintInvoiceModal';
import { AddressCascadeSelect } from '@/shared/components/ui/AddressCascadeSelect';
import { useSalesStore, BRANCH_NAME_BY_ID, deriveShiftId, WALK_IN_CUSTOMER_ID } from '@/features/sales/store/salesStore';
import { useAuthStore, useAuthPermissions } from '@/features/auth/store/authStore';
import { Link } from 'react-router';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { useLoyaltyConfigStore } from '@/features/crm/store/loyaltyConfigStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

import { crmService } from '@/features/crm/services/crmService';
import type { CustomerVoucherRecord, VoucherRecord } from '@/features/crm/store/crmStore';

// ─── POS Vouchers ─────────────────────────────────────────────

const VOUCHERS: Record<string, { type: 'PERCENT' | 'FLAT'; value: number; minOrderValue?: number }> = {
  'SMART': { type: 'PERCENT', value: 10, minOrderValue: 100000 },
  'HELLOSUMMER': { type: 'PERCENT', value: 15, minOrderValue: 200000 },
  'RETAILHUB50K': { type: 'FLAT', value: 50000, minOrderValue: 300000 },
  'VIP10': { type: 'PERCENT', value: 10, minOrderValue: 100000 },
  'WELCOME': { type: 'FLAT', value: 20000, minOrderValue: 50000 },
};

type DisplayPayment = { id: string; label: string; icon: LucideIcon; isCash: boolean };

function iconForProvider(t?: string): LucideIcon {
  switch (t) {
    case 'CASH_DRAWER':
    case 'CASH':
      return Banknote;
    case 'CREDIT_CARD_GATEWAY':
    case 'CARD':
      return CreditCard;
    case 'BANK_TRANSFER_QR':
    case 'BANK_TRANSFER':
      return Landmark;
    case 'QR_EWALLET':
    case 'E_WALLET':
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
  const user = useAuthStore((s) => s.user);
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    getTotal,
    clearCart,
    tabs,
    activeTabId,
    createTab,
    switchTab,
    closeTab,
    customer: activeCustomer,
    setCustomer: setActiveCustomer,
    customerPhone,
    setCustomerPhone,
    appliedVoucher,
    setAppliedVoucher,
    usedPoints,
    setUsedPoints,
    cashGiven,
    setCashGiven,
    orderDiscountType,
    orderDiscountValue,
    orderNote,
    setOrderDiscount,
    setOrderNote,
  } = usePosCartStore();

  const selectedPaymentId = usePosCartStore((s) => s.selectedPaymentId);
  const setSelectedPaymentId = usePosCartStore((s) => s.setSelectedPaymentId);
  const paymentMethodsFromConfig = usePosConfigStore((s) => s.paymentMethods);
  const fetchPaymentMethods = usePosConfigStore((s) => s.fetchPaymentMethods);
  const addSaleOrder = useSalesStore((s) => s.addSaleOrder);
  const { products, fetchProducts, categories, fetchCategories, combos, fetchCombos } = useInventoryStore();
  const { customers, fetchCustomers, addCustomer, isCustomerCreditBlocked } = useCrmStore();
  const { branches, fetchBranches } = useBranchStore();

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncPosData = async () => {
    setIsSyncing(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchCombos(),
        fetchCategories(),
        fetchCustomers(),
        fetchBranches(),
        fetchPaymentMethods(),
      ]);
      toast.success('Đã đồng bộ toàn bộ Danh mục, Sản phẩm & Combo từ máy chủ!');
    } catch (err) {
      toast.error('Lỗi khi đồng bộ dữ liệu POS.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCombos();
    fetchCategories();
    fetchCustomers();
    fetchBranches();
    fetchPaymentMethods();
  }, [fetchProducts, fetchCombos, fetchCategories, fetchCustomers, fetchBranches, fetchPaymentMethods]);

  const [selectedPosBranchId, setSelectedPosBranchId] = useState<string>('');

  const permissions = useAuthPermissions();
  const canChangeBranch = user?.role === 'SUPER_ADMIN' || permissions.includes('pos:branch:change');

  const { activeBranchId, activeBranchName, isBranchUnassigned } = useMemo(() => {
    // Ưu tiên: 1) user chọn thủ công trên POS, 2) branchId từ hồ sơ đăng nhập, 3) chi nhánh đầu tiên
    const userBranchId = user?.branchId ? String(user.branchId) : '';
    const defaultBranchId = userBranchId || (branches.length > 0 ? String(branches[0].id) : '1');
    const targetId = selectedPosBranchId || defaultBranchId;

    // Match chính xác bằng id hoặc branchCode — KHÔNG match theo tên
    const matched = (branches || []).find(
      (b) => String(b.id) === targetId || b.branchCode === targetId
    );
    const resolvedId = matched ? String(matched.id) : targetId;
    const resolvedName = matched?.name || (userBranchId === resolvedId ? (user?.branchName || '') : '') || BRANCH_NAME_BY_ID[resolvedId] || `Chi nhánh ${resolvedId}`;

    return {
      activeBranchId: resolvedId,
      activeBranchName: resolvedName,
      isBranchUnassigned: !userBranchId && !selectedPosBranchId && user?.role !== 'SUPER_ADMIN',
    };
  }, [branches, user, selectedPosBranchId]);

  // POS Sessions link
  const sessions = usePosSessionStore((s) => s.sessions);
  const fetchSessions = usePosSessionStore((s) => s.fetchSessions);
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);
  const activeSession = useMemo(() => {
    // 1. Ưu tiên ca OPEN của chi nhánh đang chọn
    const branchMatch = sessions.find(
      (s) => s.status === 'OPEN' && s.branchId && String(s.branchId) === String(activeBranchId)
    );
    if (branchMatch) return branchMatch;

    // 2. Fallback: Ca OPEN không phân định chi nhánh hoặc ca mở mới nhất
    return sessions.find((s) => s.status === 'OPEN') || null;
  }, [sessions, activeBranchId]);

  // Branch stock mapping for POS
  const [branchStockMap, setBranchStockMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!activeBranchId) return;
    fetchPaymentMethods(activeBranchId);
    axiosClient.get<any, any>(`/inventories/branches/${activeBranchId}/inventory`)
      .then((res) => {
        const list: any[] = Array.isArray(res) ? res : (res?.data || res?.content || res || []);
        const map: Record<string, number> = {};

        list.forEach((b: any) => {
          const rawQty = Number(b.availableQuantity ?? b.onHandQuantity ?? 0);
          const pId = b.productId ? String(b.productId) : '';
          const vId = b.productVariantId ? String(b.productVariantId) : '';
          const sku = b.sku ? String(b.sku) : '';

          // Cộng dồn tồn kho theo productId, variantId và sku qua các lô/kệ khác nhau
          if (pId) map[pId] = (map[pId] || 0) + rawQty;
          if (vId) map[vId] = (map[vId] || 0) + rawQty;
          if (sku) map[sku] = (map[sku] || 0) + rawQty;
        });
        setBranchStockMap(map);
      })
      .catch((err) => {
        console.warn('Failed to fetch POS branch inventory:', err);
      });
  }, [activeBranchId]);

  const productsList = useMemo(() => {
    let posDeductionsMap: Record<string, number> = {};
    try {
      const saved = localStorage.getItem('retailhub_pos_stock_deductions');
      if (saved) posDeductionsMap = JSON.parse(saved);
    } catch {}

    const isOffline = usePosConfigStore.getState().enableOfflineMode;

    const singleList = (products || [])
      .filter((p) => p.status !== 'INACTIVE' && (p as any).isActive !== false)
      .map((p) => {
        const cat = (categories || []).find((c) => 
          (c.categoryName && p.category && c.categoryName.trim().toLowerCase() === p.category.trim().toLowerCase()) ||
          (p.categoryId && String(c.id) === String(p.categoryId))
        );
        const tc = ((p as any).taxClass || cat?.taxClass || 'VAT_8') as string;
        let rate = (p as any).vatRate !== undefined ? Number((p as any).vatRate) : 0.08;
        if ((p as any).vatRate === undefined) {
          if (tc === 'VAT_0' || tc === 'EXEMPT') rate = 0.00;
          else if (tc === 'VAT_5') rate = 0.05;
          else if (tc === 'VAT_8') rate = 0.08;
          else if (tc === 'VAT_10') rate = 0.10;
        }
        const barcode = p.barcodes && p.barcodes.length > 0 ? p.barcodes[0] : (p.sku || String(p.id));

        let branchSpecificStock = 0;
        if (branchStockMap[String(p.id)] !== undefined) {
          branchSpecificStock = branchStockMap[String(p.id)];
        } else if (branchStockMap[p.sku] !== undefined) {
          branchSpecificStock = branchStockMap[p.sku];
        } else if (p.branchStocks && p.branchStocks[activeBranchId] !== undefined) {
          branchSpecificStock = Number(p.branchStocks[activeBranchId]);
        } else if (p.onHand !== undefined && Number(p.onHand) > 0) {
          branchSpecificStock = Number(p.onHand);
        }
        const stock = Math.max(0, branchSpecificStock);

        return {
          id: String(p.id),
          name: p.name || '',
          price: Number(p.price || 0),
          image: p.mainImage || (p as any).mainImageUrl || 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=80',
          sku: p.sku || '',
          barcode,
          category: p.category || 'Tất cả',
          unit: p.unit || 'Cái',
          stock,
          taxRate: rate,
        };
      });

    const comboList = (combos || [])
      .filter((c) => {
        if (c.status !== 'ACTIVE') return false;

        // Nếu combo áp dụng cho Tất cả chi nhánh
        const isAllBranches = !c.branchId || c.branchId === 'ALL' || !c.branchName || c.branchName === 'Tất cả chi nhánh';
        if (isAllBranches) return true;

        // So sánh theo branchId
        if (String(c.branchId) === String(activeBranchId)) return true;

        // So sánh theo mã chi nhánh hoặc đối tượng branch
        const currentBranchObj = branches.find(b => String(b.id) === String(activeBranchId));
        if (currentBranchObj) {
          if (c.branchId && (String(c.branchId) === String(currentBranchObj.id) || c.branchId === currentBranchObj.branchCode)) {
            return true;
          }
          if (c.branchName && (
            currentBranchObj.name.toLowerCase().includes(c.branchName.toLowerCase()) ||
            c.branchName.toLowerCase().includes(currentBranchObj.name.toLowerCase())
          )) {
            return true;
          }
        }

        // So sánh theo tên chi nhánh (ví dụ: "Hà Nội" trong "Chi nhánh Hà Nội (BR-001)")
        if (c.branchName && activeBranchName) {
          const cName = c.branchName.toLowerCase().trim();
          const curName = activeBranchName.toLowerCase().trim();
          if (curName.includes(cName) || cName.includes(curName)) {
            return true;
          }
        }

        return false;
      })
      .map((c) => {
        let calculatedStock = 999999;
        const details = c.details || [];

        if (details.length === 0) {
          calculatedStock = 0;
        } else {
          for (const item of details) {
            const itemStock = branchStockMap[item.sku] ?? branchStockMap[item.id] ?? 0;
            const requiredQty = Math.max(1, Number(item.quantity) || 1);
            const possibleUnits = Math.floor(itemStock / requiredQty);

            if (possibleUnits < calculatedStock) {
              calculatedStock = possibleUnits;
            }
          }
        }

        const finalStock = calculatedStock === 999999 ? 0 : Math.max(0, calculatedStock);

        return {
          id: `combo-${c.id}`,
          name: `[Combo] ${c.comboName}`,
          price: Number(c.comboPrice || 0),
          image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=200&auto=format&fit=crop&q=80',
          sku: c.comboCode || `CB-${c.id}`,
          barcode: c.comboBarcode || c.comboCode || `CB-${c.id}`,
          category: 'Combo / Gói sản phẩm',
          unit: 'Combo',
          stock: finalStock,
          isOutOfStock: finalStock === 0,
          taxRate: 0.08,
        };
      });

    return [...singleList, ...comboList];
  }, [products, combos, categories, branchStockMap, activeBranchId, activeBranchName, branches]);

  const categoryTabs = useMemo(() => {
    const dbCats = (categories || []).map((c) => c.categoryName).filter(Boolean);
    const hasCombos = productsList.some(p => p.category === 'Combo / Gói sản phẩm');
    const comboTab = hasCombos ? ['Combo / Gói sản phẩm'] : [];
    if (dbCats.length > 0) {
      return Array.from(new Set(['Tất cả', ...comboTab, ...dbCats]));
    }
    const productCats = productsList.map((p) => p.category).filter((c) => Boolean(c) && c !== 'Tất cả');
    return Array.from(new Set(['Tất cả', ...comboTab, ...productCats]));
  }, [categories, productsList]);

  const displayPayments = useMemo<DisplayPayment[]>(() => {
    // 1. Lọc phương thức thanh toán ACTIVE và áp dụng cho chi nhánh hiện tại
    const active = paymentMethodsFromConfig.filter((m) => {
      if (m.status !== 'ACTIVE') return false;
      // Nếu phương thức cấu hình riêng theo chi nhánh (applyToAllBranches = false)
      if (m.applyToAllBranches === false) {
        if (!m.branchIds || m.branchIds.length === 0) return false;
        return m.branchIds.some((bId) => String(bId) === String(activeBranchId));
      }
      return true;
    });

    // 2. Safeguard chống quên cấu hình cho chi nhánh mới:
    // Nếu chi nhánh này chưa được cấu hình phương thức nào, tự động fallback về Tiền mặt
    // để thu ngân vẫn thu tiền và xuất hóa đơn được, không bao giờ bị nghẽn thanh toán!
    if (active.length === 0) {
      const cashMethod = paymentMethodsFromConfig.find(
        (m) => m.providerType === 'CASH_DRAWER' || (m.providerType as any) === 'CASH'
      );
      if (cashMethod) {
        return [{
          id: String(cashMethod.id),
          label: cashMethod.methodName,
          icon: iconForProvider(cashMethod.providerType),
          isCash: true,
        }];
      }
      return FALLBACK_PAYMENTS;
    }

    return active.map((m) => ({
      id: String(m.id),
      label: m.methodName,
      icon: iconForProvider(m.providerType),
      isCash: m.providerType === 'CASH_DRAWER' || (m.providerType as any) === 'CASH',
    }));
  }, [paymentMethodsFromConfig, activeBranchId]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tất cả');

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

    const addressParts = [
      newCustomerAddress.addressDetail,
      newCustomerAddress.ward,
      newCustomerAddress.district,
      newCustomerAddress.province,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : 'Tại quầy POS';

    const customerId = 'CUST-POS-' + Math.floor(10000 + Math.random() * 90000);
    const newCust = {
      id: customerId,
      name: cleanName,
      phone: cleanPhone,
      points: 0,
    };

    try {
      const saved = await addCustomer({
        customerCode: customerId,
        name: cleanName,
        phone: cleanPhone,
        email: newCustomerEmail.trim(),
        address: fullAddress,
        taxCode: newCustomerTaxCode.trim(),
        notes: newCustomerNotes.trim(),
        status: 'ACTIVE',
        registeredDate: new Date().toISOString().split('T')[0],
        loyaltyTier: 'BRONZE',
        loyaltyPoints: 0,
        lifetimeSpent: 0,
        lastActive: new Date().toISOString().split('T')[0],
        avatarUrl: '',
      });
      await fetchCustomers();
      const actualId = (saved && saved.id) ? String(saved.id) : customerId;
      setActiveCustomer({
        id: actualId,
        name: saved?.name || cleanName,
        phone: saved?.phone || cleanPhone,
        points: saved?.loyaltyPoints || 0,
      });
      setUsedPoints(0);
      setIsQuickCustomerOpen(false);
      toast.success(`Đã tạo thành công khách hàng "${saved?.name || cleanName}" & lưu vào CRM hệ thống!`);
      // Reset form
      setNewCustomerName('');
      setNewCustomerShortName('');
      setNewCustomerPhoneInput('');
      setNewCustomerEmail('');
      setNewCustomerTaxCode('');
      setNewCustomerNotes('');
      setNewCustomerAddress({ province: '', district: '', ward: '', addressDetail: '' });
    } catch (err) {
      console.error('Failed to persist customer to CRM backend:', err);
      toast.error('Không thể lưu khách hàng vào hệ thống.');
    } finally {
      setIsSubmittingQuickCustomer(false);
    }
  };

  // Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [customerVouchersList, setCustomerVouchersList] = useState<CustomerVoucherRecord[]>([]);
  const [campaignVouchersList, setCampaignVouchersList] = useState<VoucherRecord[]>([]);

  useEffect(() => {
    crmService.fetchCustomerVouchers().then((res) => {
      if (Array.isArray(res)) setCustomerVouchersList(res);
    }).catch((e) => console.warn('POS fetch customer vouchers err:', e));

    crmService.fetchVouchers().then((res) => {
      if (Array.isArray(res)) setCampaignVouchersList(res);
    }).catch((e) => console.warn('POS fetch campaign vouchers err:', e));
  }, []);

  // Payment modal
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // POS Shortcuts state
  const [isShortcutsGuideOpen, setIsShortcutsGuideOpen] = useState(false);

  // Order Discount Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [tempDiscountType, setTempDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [tempDiscountValue, setTempDiscountValue] = useState<string>('');

  // Order Note Modal State
  const [isOrderNoteModalOpen, setIsOrderNoteModalOpen] = useState(false);
  const [tempOrderNote, setTempOrderNote] = useState<string>('');

  const getShift = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 6 && hour < 14) return 'Ca sáng (06:00 - 14:00)';
    if (hour >= 14 && hour < 22) return 'Ca chiều (14:00 - 22:00)';
    return 'Ca đêm (22:00 - 06:00)';
  };

  useEffect(() => {
    const ids = displayPayments.map((d) => String(d?.id ?? ''));
    const currId = usePosCartStore.getState().selectedPaymentId;
    if (!ids.includes(String(currId))) {
      setSelectedPaymentId(displayPayments[0]?.id ?? FALLBACK_PAYMENTS[0].id);
    }
  }, [displayPayments]);

  useEffect(() => {
    if (activeCustomer && isCustomerCreditBlocked(activeCustomer.id)) {
      const curr = displayPayments.find(p => String(p.id) === String(selectedPaymentId));
      if (curr && (curr.label.toLowerCase().includes('nợ') || curr.label.toLowerCase().includes('debt'))) {
        const cashPay = displayPayments.find(p => p.isCash) || displayPayments[0];
        if (cashPay) {
          setSelectedPaymentId(cashPay.id);
          toast.warning(`Khách hàng "${activeCustomer.name}" đang bị TẠM KHÓA MUA NỢ! Đã chuyển về phương thức "${cashPay.label}".`);
        }
      }
    }
  }, [activeCustomer, isCustomerCreditBlocked, displayPayments, selectedPaymentId, setSelectedPaymentId]);

  const selectedPayment = displayPayments.find((d) => String(d?.id) === String(selectedPaymentId)) ?? displayPayments[0];
  const isCashPayment = selectedPayment?.isCash ?? true;

  const stockById = useMemo(() => {
    const map = new Map<string, number>();
    productsList.forEach((p) => map.set(p.id, p.stock));
    return map;
  }, [productsList]);

  const getStock = (id: string) => stockById.get(id) ?? 0;

  const [variantPickerProduct, setVariantPickerProduct] = useState<(PosProduct & { stock: number }) | null>(null);
  const [productVariants, setProductVariants] = useState<any[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);

  const handleAddProduct = async (product: (PosProduct & { stock: number })) => {
    if (product.category === 'Combo / Gói sản phẩm') {
      const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;
      if (inCart >= product.stock) return;
      addItem(product);
      return;
    }

    try {
      setIsLoadingVariants(true);
      const res = await axiosClient.get<any, any>(`/catalog/variants?productId=${product.id}`);
      const vList: any[] = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (vList && vList.length > 1) {
        setVariantPickerProduct(product);
        setProductVariants(vList);
        return;
      } else if (vList && vList.length === 1) {
        const v = vList[0];
        const vId = String(v.id);
        const cartId = `${product.id}_var_${vId}`;
        const inCart = items.find((i) => i.id === cartId || i.id === product.id)?.quantity ?? 0;
        if (inCart >= product.stock) return;
        addItem({
          ...product,
          id: cartId,
          productVariantId: v.id,
          price: v.price && Number(v.price) > 0 ? Number(v.price) : product.price,
          sku: v.sku || product.sku,
          variantName: v.variantDescription || v.variantCode || v.sku,
        });
        return;
      }
    } catch {
      // fallback if API has issue
    } finally {
      setIsLoadingVariants(false);
    }

    const inCart = items.find((i) => i.id === product.id)?.quantity ?? 0;
    if (inCart >= product.stock) return;
    addItem(product);
  };

  const handleSelectVariant = (variant: any) => {
    if (!variantPickerProduct) return;
    const vId = String(variant.id);
    const cartItemId = `${variantPickerProduct.id}_var_${vId}`;
    const inCart = items.find((i) => i.id === cartItemId)?.quantity ?? 0;
    const maxStock = variant.stock !== undefined ? Number(variant.stock) : variantPickerProduct.stock;
    if (inCart >= maxStock) {
      toast.warning('Số lượng trong giỏ đã đạt giới hạn tồn kho của biến thể này');
      return;
    }
    const variantDesc = variant.variantDescription || variant.variantCode || variant.sku || 'Biến thể';
    addItem({
      ...variantPickerProduct,
      id: cartItemId,
      productVariantId: variant.id,
      name: `${variantPickerProduct.name} (${variantDesc})`,
      price: variant.price && Number(variant.price) > 0 ? Number(variant.price) : variantPickerProduct.price,
      sku: variant.sku || variantPickerProduct.sku,
      variantName: variantDesc,
    });
    setVariantPickerProduct(null);
    setProductVariants([]);
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
    const q = debouncedSearchQuery.trim().toLowerCase();
    return productsList.filter(p => {
      const matchCat = activeCategory === 'Tất cả' || p.category === activeCategory;
      const matchQ =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [productsList, activeCategory, debouncedSearchQuery]);

  // ── Customer ────────────────────────────────────────────────────────────────
  const handleSearchCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const q = customerPhone.trim().toLowerCase();
    if (!q) return;
    const found = customers.find(c =>
      (c.phone && String(c.phone).includes(q)) ||
      (c.customerCode && String(c.customerCode).toLowerCase().includes(q)) ||
      (c.name && String(c.name).toLowerCase().includes(q))
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
    if (!code) { setVoucherError('Vui lòng nhập mã voucher!'); return; }

    const currentSubtotal = getTotal();

    // 1. Check Personal Customer Vouchers in database
    const matchedCustVoucher = customerVouchersList.find(
      (v) => (v.voucherCode || '').toUpperCase() === code
    );

    if (matchedCustVoucher) {
      if (matchedCustVoucher.status === 'USED') {
        setVoucherError(`Mã voucher ${code} đã được sử dụng trước đó!`);
        setAppliedVoucher(null);
        return;
      }
      if (matchedCustVoucher.status === 'EXPIRED') {
        setVoucherError(`Mã voucher ${code} đã hết hạn sử dụng!`);
        setAppliedVoucher(null);
        return;
      }

      // Customer Ownership Verification Security Check
      if (!activeCustomer || activeCustomer.name === 'Khách vãng lai') {
        setVoucherError(`Mã voucher này được cấp riêng cho Khách hàng [${matchedCustVoucher.customerName}]. Vui lòng chọn đúng khách hàng trước khi dùng!`);
        setAppliedVoucher(null);
        return;
      }

      const custPhone = (activeCustomer.phone || '').trim();
      const ownerPhone = (matchedCustVoucher.customerPhone || '').trim();
      const custName = (activeCustomer.name || '').toLowerCase().trim();
      const ownerName = (matchedCustVoucher.customerName || '').toLowerCase().trim();

      const isMatch = (custPhone && ownerPhone && custPhone === ownerPhone) ||
                      (ownerName && custName && (custName.includes(ownerName) || ownerName.includes(custName)));

      if (!isMatch) {
        setVoucherError(`Mã ${code} thuộc sở hữu của KH [${matchedCustVoucher.customerName} - ${matchedCustVoucher.customerPhone || 'SĐT'}]. Khách hàng hiện tại không có quyền sử dụng!`);
        setAppliedVoucher(null);
        return;
      }

      if (matchedCustVoucher.minOrderValue && currentSubtotal < matchedCustVoucher.minOrderValue) {
        setVoucherError(`Đơn hàng tối thiểu ${matchedCustVoucher.minOrderValue.toLocaleString('vi-VN')}đ mới áp dụng được mã này!`);
        setAppliedVoucher(null);
        return;
      }

      const dType = matchedCustVoucher.discountType === 'PERCENT' ? 'PERCENT' : 'FLAT';
      setAppliedVoucher({
        code,
        type: dType,
        value: matchedCustVoucher.discountValue,
      });
      setVoucherCode('');
      setVoucherError('');
      toast.success(`Áp dụng voucher cá nhân thành công cho KH ${matchedCustVoucher.customerName}!`);
      return;
    }

    // 2. Check Campaign / Public Vouchers from API
    const matchedCampaign = campaignVouchersList.find((v) => (v.code || '').toUpperCase() === code);
    if (matchedCampaign) {
      if (matchedCampaign.status !== 'ACTIVE') {
        setVoucherError('Chương trình khuyến mãi này đã tạm ngưng hoặc hết hạn!');
        setAppliedVoucher(null);
        return;
      }
      if (matchedCampaign.minOrderValue && currentSubtotal < matchedCampaign.minOrderValue) {
        setVoucherError(`Đơn hàng tối thiểu ${matchedCampaign.minOrderValue.toLocaleString('vi-VN')}đ mới áp dụng được!`);
        setAppliedVoucher(null);
        return;
      }

      const dType = matchedCampaign.discountType === 'PERCENT' ? 'PERCENT' : 'FLAT';
      setAppliedVoucher({
        code,
        type: dType,
        value: matchedCampaign.value,
      });
      setVoucherCode('');
      setVoucherError('');
      toast.success(`Đã áp dụng mã giảm giá ${code}!`);
      return;
    }

    // 3. Fallback dictionary (SMART, HELLOSUMMER, RETAILHUB50K, VIP10, WELCOME)
    if (VOUCHERS[code]) {
      const v = VOUCHERS[code];
      if (v.minOrderValue && currentSubtotal < v.minOrderValue) {
        setVoucherError(`Đơn hàng tối thiểu ${v.minOrderValue.toLocaleString('vi-VN')}đ mới dùng được mã ${code}!`);
        setAppliedVoucher(null);
        return;
      }
      setAppliedVoucher({ code, ...v });
      setVoucherCode('');
      setVoucherError('');
      toast.success(`Đã áp dụng mã giảm giá ${code}!`);
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

  // Chiết khấu đơn hàng (% hoặc số tiền trực tiếp)
  let orderDiscountAmount = 0;
  if (orderDiscountValue > 0) {
    orderDiscountAmount = orderDiscountType === 'PERCENT'
      ? Math.round(subtotal * (orderDiscountValue / 100))
      : Math.min(orderDiscountValue, subtotal);
  }
  const totalDiscount = voucherDiscount + pointsDiscount + orderDiscountAmount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  
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

  // Cấu hình phí phụ thu của phương thức thanh toán
  const selectedPaymentConfig = paymentMethodsFromConfig.find((m) => String(m.id) === String(selectedPaymentId));
  let paymentFee = 0;
  if (selectedPaymentConfig) {
    const feeVal = selectedPaymentConfig.feeValue !== undefined ? selectedPaymentConfig.feeValue : 
                   (selectedPaymentConfig.feeType === 'PERCENT' ? selectedPaymentConfig.processingFeePct : selectedPaymentConfig.fixedFeeUsd);
    const feeT = selectedPaymentConfig.feeType || 
                 (selectedPaymentConfig.processingFeePct > 0 ? 'PERCENT' : 'FIXED');

    if (feeVal > 0) {
      if (feeT === 'PERCENT') {
        paymentFee = Math.round(totalAmount * (feeVal / 100));
      } else {
        paymentFee = Math.round(feeVal);
      }
    }
  }

  const totalAmountToPay = totalAmount + paymentFee;

  const cashGivenNum = parseFloat(cashGiven.replace(/\./g, '')) || 0;
  const changeAmount = Math.max(0, cashGivenNum - totalAmountToPay);

  // Danh sách mệnh giá tờ tiền Polymer Việt Nam chuẩn
  const polymerDenominations = useMemo(() => {
    const base = [50000, 100000, 200000, 500000];
    if (totalAmountToPay > 500000) {
      return [...base, 1000000, 2000000];
    }
    return base;
  }, [totalAmountToPay]);

  // ── Confirm payment ──────────────────────────────────────────────────────────
  const handleConfirmPayment = (directImmediate = false, withPrint = true) => {
    try {
      const user = useAuthStore.getState().user;
      const pay = displayPayments.find((d) => String(d?.id ?? '') === String(selectedPaymentId ?? ''));
      const payLabel = pay?.label ?? 'Tiền mặt';
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const code = currentOrderCode || `ORD-POS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
      const orderLines = items.map((i, idx) => ({
        id: `pos_${now.getTime()}_${idx}`,
        productVariantId: Number(i.id) || 1,
        sku: String(i.sku || i.id || ''),
        productName: i.name || 'Sản phẩm',
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.price) || 0,
        lineTotal: Math.round((Number(i.quantity) || 1) * (Number(i.price) || 0)),
      }));
      const itemsSummary = orderLines
        .map((l) => `${l.productName}×${l.quantity}`)
        .join(', ')
        .slice(0, 240);

      const branchId = activeBranchId;
      const branchName = activeBranchName;
      const cashierName = user?.name || 'Thu ngân POS';
      const customerDisplayName = activeCustomer
        ? activeCustomer.name
        : `${cashierName} (Khách vãng lai)`;

      const effectiveCashGiven = cashGivenNum > 0 ? cashGivenNum : totalAmountToPay;
      const effectiveChange = Math.max(0, effectiveCashGiven - totalAmountToPay);

      const performOrderCreation = async () => {
        try {
          await addSaleOrder({
            code,
            orderCode: code,
            orderDate: new Date().toISOString(),
            customerId: activeCustomer?.id && !isNaN(Number(activeCustomer.id)) ? Number(activeCustomer.id) : null,
            branchId: Number(branchId) || 1,
            customerName: customerDisplayName,
            date: dateStr,
            subTotal: Math.round(subtotal),
            taxAmount: Math.round(vatAmount),
            discountAmount: Math.round(voucherDiscount + pointsDiscount + orderDiscountAmount),
            totalAmount: Math.round(totalAmountToPay),
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            paymentMethod: payLabel,
            cashier: user?.name ?? 'Thu ngân',
            createdByName: user?.name ?? 'Thu ngân',
            createdByEmail: user?.email,
            branchName,
            origin: 'POS',
            currency: 'VND',
            itemsSummary,
            orderLines,
            note: orderNote || undefined,
            details: items.map(i => {
              const p = productsList.find((x) => x.id === i.id);
              const itemRate = p?.taxRate ?? 0.08;
              const itemSubtotal = (i.price * i.quantity) - (i.discount || 0);
              const discountRatio = subtotal > 0 ? taxableAmount / subtotal : 1;
              const itemTax = Math.round(itemSubtotal * discountRatio * itemRate);
              return {
                productVariantId: (i as any).productVariantId ? Number((i as any).productVariantId) : (i.id.includes('_var_') ? Number(i.id.split('_var_')[1]) : (Number(i.id) || 1)),
                quantity: Number(i.quantity) || 1,
                unitPriceSnapshot: Number(i.price) || 0,
                taxRate: itemRate,
                taxAmount: itemTax,
                discountAmount: Number(i.discount) || 0,
              };
            }),
            amountTendered: isCashPayment ? Math.round(effectiveCashGiven) : Math.round(totalAmountToPay),
            changeAmount: isCashPayment ? Math.round(effectiveChange) : 0,
            shiftId: activeSession ? activeSession.sessionCode : deriveShiftId(now),
            posSessionId: activeSession ? Number(activeSession.id) : null,
            promoCodeApplied: appliedVoucher?.code,
            paymentMethodId: selectedPaymentConfig ? Number(selectedPaymentConfig.id) : null,
            paymentMethodCode: selectedPaymentConfig ? selectedPaymentConfig.methodCode : null,
          } as any);

          // Tự động trừ tồn kho hiển thị (onHand) trên POS ngay lập tức & đồng bộ toàn hệ thống
          try {
            const savedD = localStorage.getItem('retailhub_pos_stock_deductions');
            const posDeductionsMap: Record<string, number> = savedD ? JSON.parse(savedD) : {};

            const deductions: { productId?: string; sku?: string; qty: number; branchId?: string }[] = [];
            items.forEach((it) => {
              const combo = (combos || []).find((c) => String(c.id) === String(it.id) || c.comboCode === it.sku);
              if (combo && combo.details && combo.details.length > 0) {
                combo.details.forEach((cd) => {
                  const qty = (Number(cd.quantity) || 1) * it.quantity;
                  deductions.push({
                    productId: String(cd.id || ''),
                    sku: cd.sku,
                    qty,
                    branchId: activeBranchId,
                  });
                  if (cd.id) posDeductionsMap[String(cd.id)] = (posDeductionsMap[String(cd.id)] || 0) + qty;
                  if (cd.sku) posDeductionsMap[cd.sku] = (posDeductionsMap[cd.sku] || 0) + qty;
                });
              } else {
                deductions.push({
                  productId: String(it.id),
                  sku: it.sku,
                  qty: it.quantity,
                  branchId: activeBranchId,
                });
                const pId = String(it.id);
                posDeductionsMap[pId] = (posDeductionsMap[pId] || 0) + it.quantity;
                if (it.sku) posDeductionsMap[it.sku] = (posDeductionsMap[it.sku] || 0) + it.quantity;
              }
            });
            localStorage.setItem('retailhub_pos_stock_deductions', JSON.stringify(posDeductionsMap));

            (useInventoryStore.getState() as any).deductProductStock(deductions);
            setBranchStockMap((prev) => {
              const nextMap = { ...prev };
              deductions.forEach((d) => {
                const pId = d.productId;
                if (pId && nextMap[pId] !== undefined) {
                  nextMap[pId] = Math.max(0, nextMap[pId] - d.qty);
                }
                if (d.sku && nextMap[d.sku] !== undefined) {
                  nextMap[d.sku] = Math.max(0, nextMap[d.sku] - d.qty);
                }
              });
              return nextMap;
            });
          } catch (err) {
            console.error('Failed to deduct local POS inventory state:', err);
          }

          // Tự động tích điểm cho Khách hàng & Ghi nhật ký Lịch sử Loyalty CRM
          if (activeCustomer) {
            try {
              const earnedPoints = Math.floor((totalAmount / (loyaltyConfig?.earnRateAmount || 10000)) * (activeCustomer?.membershipRank === 'Thành viên Vàng' ? 1.5 : activeCustomer?.membershipRank === 'Thành viên Bạc' ? 1.2 : 1.0));

              if (earnedPoints > 0) {
                useCrmStore.getState().addCustomerPoints(String(activeCustomer.id), earnedPoints, {
                  code: `TX-EARN-${Date.now().toString().slice(-6)}`,
                  customerId: String(activeCustomer.id),
                  customerName: activeCustomer.name,
                  phone: activeCustomer.phone || '',
                  pointsChange: earnedPoints,
                  transactionType: 'TÍCH ĐIỂM BÁN HÀNG POS',
                  refDocument: code,
                  date: dateStr,
                  balanceAfter: (activeCustomer.loyaltyPoints || 0) + earnedPoints,
                  amount: Math.round(totalAmount),
                  actionType: 'EARN',
                  createdAt: dateStr,
                });
              }

              if (usedPoints > 0) {
                useCrmStore.getState().addCustomerPoints(String(activeCustomer.id), -usedPoints, {
                  code: `TX-REDEEM-${Date.now().toString().slice(-6)}`,
                  customerId: String(activeCustomer.id),
                  customerName: activeCustomer.name,
                  phone: activeCustomer.phone || '',
                  pointsChange: -usedPoints,
                  transactionType: 'TIÊU ĐIỂM BÁN HÀNG POS',
                  refDocument: code,
                  date: dateStr,
                  balanceAfter: Math.max(0, (activeCustomer.loyaltyPoints || 0) - usedPoints),
                  amount: Math.round(pointsDiscount),
                  actionType: 'REDEEM',
                  createdAt: dateStr,
                });
              }
            } catch (err) {
              console.error('Failed to update CRM customer loyalty points:', err);
            }
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
            discountAmount: Math.round(voucherDiscount + pointsDiscount + orderDiscountAmount),
            totalAmount: Math.round(totalAmountToPay),
            notes: orderNote || undefined,
            items: items.map((i) => {
              const p = productsList.find((x) => x.id === i.id);
              const itemRate = p?.taxRate ?? 0.08;
              const itemSubtotal = (i.price * i.quantity) - (i.discount || 0);
              const discountRatio = subtotal > 0 ? taxableAmount / subtotal : 1;
              const itemTax = Math.round(itemSubtotal * discountRatio * itemRate);
              return {
                sku: String(i.sku || i.id),
                name: i.name,
                unit: (i as any).unit || 'Cái',
                quantity: i.quantity,
                price: i.price,
                discount: i.discount,
                taxRate: itemRate,
                taxAmount: itemTax,
                total: Math.round(i.quantity * i.price - (i.discount || 0)),
              };
            }),
          };

          setCompletedPrintInvoice(printInvoicePayload);
          setPaymentState(directImmediate ? 'idle' : 'success');
          toast.success(`Thanh toán thành công đơn hàng ${code}!`);
          if (withPrint) {
            setIsPrintInvoiceOpen(true);
          }
          if (directImmediate) {
            if (tabs.length > 1) {
              closeTab(activeTabId);
            } else {
              clearCart();
            }
            setVoucherError('');
            setIsPaymentOpen(false);
            setCurrentOrderCode('');
          }
        } catch (err: any) {
          console.error('Lỗi khi thực hiện lưu đơn hàng POS:', err);
          toast.error(err?.message || 'Có lỗi xảy ra khi tạo đơn hàng');
          setPaymentState('idle');
        }
      };

      onCompleteRef.current = performOrderCreation;
      if (directImmediate) {
        performOrderCreation();
      } else {
        setPaymentState('processing');
        if (isCashPayment) {
          paymentTimerRef.current = setTimeout(performOrderCreation, 1200);
        }
      }
    } catch (globalErr: any) {
      console.error('Crash Handler POS Checkout:', globalErr);
      toast.error('Lỗi xử lý xác nhận thanh toán. Giỏ hàng được giữ nguyên.');
      setPaymentState('idle');
    }
  };

  const handleDirectCashCheckout = (withPrint = true) => {
    if (items.length === 0) {
      toast.warning('Giỏ hàng đang trống! Vui lòng chọn sản phẩm trước.');
      return;
    }

    if (isCashPayment) {
      if (!cashGiven || cashGivenNum === 0) {
        setCashGiven(totalAmountToPay.toLocaleString('vi-VN'));
      } else if (cashGivenNum < totalAmountToPay) {
        toast.warning(`Khách đưa chưa đủ tiền mặt! Còn thiếu ${fmt(totalAmountToPay - cashGivenNum)}.`);
        return;
      }
    }

    handleConfirmPayment(true, withPrint);
  };

  const handlePrePrintBill = () => {
    if (items.length === 0) {
      toast.warning('Giỏ hàng đang trống, không thể in tạm tính!');
      return;
    }
    const user = useAuthStore.getState().user;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const code = currentOrderCode || `ORD-POS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
    const cashierName = user?.name || 'Thu ngân POS';
    const customerDisplayName = activeCustomer ? activeCustomer.name : 'Khách vãng lai';

    const printInvoicePayload: PrintInvoiceData = {
      documentTitle: 'PHIẾU TẠM TÍNH (Chưa thanh toán)',
      code,
      date: dateStr,
      customerOrSupplierName: customerDisplayName,
      phone: activeCustomer?.phone || 'N/A',
      branchName: activeBranchName || 'Chi nhánh POS RetailHub',
      createdByName: cashierName,
      subTotal: Math.round(subtotal),
      taxAmount: Math.round(vatAmount),
      discountAmount: Math.round(voucherDiscount + pointsDiscount + orderDiscountAmount),
      totalAmount: Math.round(totalAmountToPay),
      notes: orderNote ? `Ghi chú: ${orderNote}` : 'Quý khách vui lòng kiểm tra kỹ số lượng & giá tiền trước khi thanh toán.',
      items: items.map((i) => {
        const p = productsList.find((x) => x.id === i.id);
        const itemRate = p?.taxRate ?? 0.08;
        const itemSubtotal = (i.price * i.quantity) - (i.discount || 0);
        const discountRatio = subtotal > 0 ? taxableAmount / subtotal : 1;
        const itemTax = Math.round(itemSubtotal * discountRatio * itemRate);
        return {
          sku: String(i.sku || i.id),
          name: i.name,
          unit: (i as any).unit || 'Cái',
          quantity: i.quantity,
          price: i.price,
          discount: i.discount,
          taxRate: itemRate,
          taxAmount: itemTax,
          total: Math.round(i.quantity * i.price - (i.discount || 0)),
        };
      }),
    };

    setCompletedPrintInvoice(printInvoicePayload);
    setIsPrintInvoiceOpen(true);
  };

  // Enhanced Keyboard shortcuts (F1/F2: search, F3: customer, F4: discount, F6: note, F7: pre-print, F8: QR/modal, F9: checkout & print, Esc: close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1' || e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setIsQuickCustomerOpen(true);
      } else if (e.key === 'F4') {
        e.preventDefault();
        setTempDiscountType(orderDiscountType);
        setTempDiscountValue(orderDiscountValue > 0 ? String(orderDiscountValue) : '');
        setIsDiscountModalOpen(true);
      } else if (e.key === 'F6') {
        e.preventDefault();
        setTempOrderNote(orderNote);
        setIsOrderNoteModalOpen(true);
      } else if (e.key === 'F7') {
        e.preventDefault();
        handlePrePrintBill();
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (items.length > 0) {
          const now = new Date();
          const code = currentOrderCode || `ORD-POS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
          setCurrentOrderCode(code);
          setIsPaymentOpen(true);
        } else {
          toast.warning('Giỏ hàng đang trống! Vui lòng chọn sản phẩm trước.');
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (isPaymentOpen && paymentState === 'idle') {
          handleConfirmPayment(false, true);
        } else if (!isPaymentOpen && items.length > 0) {
          if (isCashPayment) {
            handleDirectCashCheckout(true);
          } else {
            const now = new Date();
            const code = currentOrderCode || `ORD-POS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
            setCurrentOrderCode(code);
            setIsPaymentOpen(true);
          }
        }
      } else if (e.key === 'Escape') {
        if (isShortcutsGuideOpen) {
          setIsShortcutsGuideOpen(false);
        } else if (isDiscountModalOpen) {
          setIsDiscountModalOpen(false);
        } else if (isOrderNoteModalOpen) {
          setIsOrderNoteModalOpen(false);
        } else if (isPaymentOpen && paymentState === 'idle') {
          setIsPaymentOpen(false);
        } else if (isQuickCustomerOpen) {
          setIsQuickCustomerOpen(false);
        } else {
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    items.length, isPaymentOpen, paymentState, isShortcutsGuideOpen,
    isQuickCustomerOpen, isDiscountModalOpen, isOrderNoteModalOpen,
    isCashPayment, cashGiven, cashGivenNum, totalAmountToPay, orderDiscountType,
    orderDiscountValue, orderNote
  ]);



  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden font-sans">

      {/* ═══ LEFT PANEL: Products ═══ */}
      <div className="flex flex-col w-[64%] h-full">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 justify-between shrink-0 gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/" className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
                <ShoppingCartIcon className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-base font-black text-gray-900 dark:text-white tracking-tight hidden sm:block">RetailHub POS</h1>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-lg">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Nhập tên sản phẩm, SKU hoặc quét Barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    e.preventDefault();
                    const q = searchQuery.trim().toLowerCase();
                    const matched = filteredProducts.find(
                      p => (p.barcode && p.barcode.toLowerCase() === q) || (p.sku && p.sku.toLowerCase() === q)
                    ) || filteredProducts[0];
                    if (matched) {
                      handleAddProduct(matched);
                      setSearchQuery('');
                    }
                  }
                }}
                className="h-9 block w-full pl-9 pr-16 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs transition-all shadow-xs outline-none"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5 pointer-events-none">
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-500">
                  F1/F2
                </span>
                <ScanBarcode className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Shortcuts Cheatsheet Button */}
          <button
            type="button"
            onClick={() => setIsShortcutsGuideOpen(true)}
            title="Xem danh sách phím tắt thu ngân"
            className="h-9 flex items-center gap-1.5 px-3 text-xs font-bold rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Phím tắt</span>
          </button>

          {/* Sync Data Button */}
          <button
            type="button"
            onClick={handleSyncPosData}
            disabled={isSyncing}
            title="Đồng bộ lại danh mục sản phẩm & combo từ máy chủ"
            className="h-9 flex items-center gap-1.5 px-3 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Đang tải...' : 'Đồng bộ'}</span>
          </button>

          {/* Right Header Info: Chi nhánh, Ca làm việc, Đồng hồ thời gian thực — Thẳng hàng 100% */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Chi nhánh POS Dropdown */}
            <div className="h-9 flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 px-2.5 rounded-xl text-xs font-bold shadow-xs">
              <span className="hidden sm:inline">💻 POS 01 •</span>
              {canChangeBranch ? (
                <select
                  value={activeBranchId || ''}
                  onChange={(e) => {
                    setSelectedPosBranchId(e.target.value);
                    const bName = branches.find(b => String(b.id) === e.target.value)?.name || e.target.value;
                    toast.info(`Đã chuyển kho POS sang: ${bName}`);
                  }}
                  className="bg-transparent font-bold outline-none cursor-pointer text-indigo-900 dark:text-indigo-200 text-xs"
                >
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.id} value={String(b.id)} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                        {b.name} ({b.branchCode || `CN-${b.id}`})
                      </option>
                    ))
                  ) : (
                    <option value="">Chi nhánh chính RetailHub</option>
                  )}
                </select>
              ) : (
                <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">
                  {activeBranchName}
                </span>
              )}
            </div>

            {/* Ca làm việc Badge */}
            {activeSession ? (
              <div 
                title={`Mã ca: ${activeSession.sessionCode} • Quầy: ${activeSession.terminalCode} • Tiền quỹ đầu ca: ${fmt(activeSession.openingCash)}`}
                className="h-9 px-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shadow-xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{activeSession.sessionCode}</span>
              </div>
            ) : (
              <Link
                to="/pos/sessions"
                title="Chưa có ca làm việc nào đang mở! Bấm để chuyển tới trang Quản lý ca để mở ca"
                className="h-9 px-2.5 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 rounded-xl border border-amber-300 dark:border-amber-800 whitespace-nowrap shadow-xs transition-colors"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Chưa mở ca</span>
              </Link>
            )}

            {/* Đồng hồ thời gian thực */}
            <div className="h-9 px-2.5 hidden lg:flex items-center gap-1.5 text-xs font-mono font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/60 rounded-xl border border-gray-200 dark:border-gray-600 whitespace-nowrap shadow-xs">
              <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span>{currentTime.toLocaleDateString('vi-VN')} {currentTime.toLocaleTimeString('vi-VN')}</span>
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
                    aria-label={`Thêm Sản Phẩm ${product.name}. Giá ${fmt(product.price)}. Tồn kho ${product.stock}. Đang chọn ${inCart}.`}
                    onClick={() => handleAddProduct(product)}
                    className={`relative bg-white dark:bg-gray-800 rounded-xl border overflow-hidden transition-all duration-150 select-none flex flex-col group text-left ${
                      cartItem
                        ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-400/30 dark:ring-emerald-500/40 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:scale-[1.01] hover:shadow-md'
                    } ${outOfStock ? 'opacity-70 grayscale-[25%] bg-gray-50 dark:bg-gray-900/60 cursor-not-allowed' : disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                  >
                    {cartItem && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center z-10 shadow-sm">
                        {cartItem.quantity}
                      </div>
                    )}
                    {outOfStock && (
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black z-10 tracking-wider shadow-sm">
                        HẾT HÀNG
                      </div>
                    )}
                    {atLimit && !outOfStock && (
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black z-10 shadow-sm">
                        TỐI ĐA
                      </div>
                    )}
                    {/* Compact Image 96x96 centered */}
                    <div className="h-24 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-center p-1.5 shrink-0 border-b border-gray-100 dark:border-gray-750">
                      <SafeProductImage src={product.image} alt={product.name} className="h-full max-h-24 w-full object-contain rounded-lg" />
                    </div>
                    <div className="p-2 flex-1 flex flex-col justify-between">
                      <h3 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="mt-1">
                        <p className="text-[10px] text-gray-400 font-mono leading-none mb-1">
                          SKU: {product.sku} {product.barcode && product.barcode !== product.sku ? `• Barcode: ${product.barcode}` : ''}
                        </p>
                        <div className="flex items-baseline justify-between gap-1 flex-wrap">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{fmt(product.price)}</span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">• Tồn: {product.stock}</span>
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
      <div className="flex flex-col w-[36%] h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        {/* Multi-Tab Order Holding Bar (Lưu tạm đơn bán dở) */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-x-auto shrink-0">
          {tabs.map((t) => {
            const isActive = t.id === activeTabId;
            const isHeld = !isActive && t.items.length > 0;
            return (
              <div
                key={t.id}
                onClick={() => {
                  if (isPaymentOpen) {
                    setIsPaymentOpen(false);
                    setPaymentState('idle');
                  }
                  switchTab(t.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all select-none ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                    : isHeld
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-2 border-amber-400 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
                title={isHeld ? `Đơn "${t.name}" đang tạm giữ (${t.items.length} món). Click để mở lại thanh toán!` : `Chuyển sang ${t.name}`}
              >
                {isHeld && <span className="text-[11px]">⏸️</span>}
                <span>{t.name}</span>
                {t.items.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-white text-emerald-700'
                        : isHeld
                        ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100 font-bold'
                        : 'bg-emerald-100 text-emerald-800'
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
                      if (isPaymentOpen && isActive) {
                        setIsPaymentOpen(false);
                        setPaymentState('idle');
                      }
                      closeTab(t.id);
                    }}
                    className="opacity-60 hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-opacity"
                    title="Đóng / Hủy đơn này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => {
              if (isPaymentOpen) {
                setIsPaymentOpen(false);
                setPaymentState('idle');
              }
              createTab();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            title="⚡ Mở giỏ/đơn bán dở mới"
          >
            <Plus className="w-3.5 h-3.5" /> Mở đơn
          </button>
          <button
            type="button"
            onClick={() => {
              if (items.length === 0) {
                toast.info('Giỏ hàng hiện tại đang trống, không có món để giữ.');
                return;
              }
              const currentTab = tabs.find(t => t.id === activeTabId);
              const currentName = currentTab?.name || 'Đơn hiện tại';
              createTab();
              toast.success(
                `Đã tạm giữ "${currentName}" (${items.length} món)! Đơn mới đã mở sẵn để tiếp khách. Khi khách cũ quay lại, bạn chỉ cần bấm vào tab [${currentName}] để thanh toán tiếp.`,
                { duration: 6000 }
              );
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
            title="Tạm giữ giỏ hàng hiện tại và tự động mở đơn mới để tiếp khách sau"
          >
            <PauseCircle className="w-3.5 h-3.5" /> Giữ đơn
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

              {isCustomerCreditBlocked(activeCustomer.id) && (
                <div className="mb-2 p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-300 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Khách hàng đang bị TẠM KHÓA MUA NỢ do cảnh báo công nợ!</span>
                </div>
              )}
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
            <div className="h-full flex flex-col items-center justify-center p-4 text-center text-gray-400 dark:text-gray-500 select-none">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 border border-emerald-100 dark:border-emerald-900/40 shadow-sm">
                <ShoppingCartIcon className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-1">Giỏ hàng đang trống</h3>
              <p className="text-xs text-gray-400 mb-4">Thực hiện 1 trong các cách sau để lên đơn:</p>

              <div className="w-full bg-gray-50 dark:bg-gray-900/60 rounded-xl p-3 border border-gray-200 dark:border-gray-700/60 text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Click chọn sản phẩm bên trái</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Quét mã vạch bằng đầu đọc Barcode</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>Nhấn <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">F2</kbd> để tìm kiếm nhanh</span>
                </div>
              </div>
            </div>
          ) : items.map(item => (
            <div key={item.id} className="flex gap-2.5 bg-gray-50 dark:bg-gray-700/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 shrink-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden flex items-center justify-center">
                <SafeProductImage src={item.image} alt={item.name} className="w-full h-full object-contain" iconClassName="w-4 h-4 text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-1 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">{item.name}</h4>
                    {(() => {
                      const prod = productsList.find(x => x.id === item.id);
                      const taxPct = Math.round((prod?.taxRate ?? 0.08) * 100);
                      return (
                        <span className="text-[10px] font-mono px-1 py-0.2 bg-gray-200/80 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 rounded shrink-0" title={`Thuế suất VAT của sản phẩm: ${taxPct}%`}>
                          VAT {taxPct}%
                        </span>
                      );
                    })()}
                  </div>
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
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (isNaN(val) || val <= 0) return;
                        const maxStock = getStock(item.id);
                        const validQty = Math.min(val, maxStock > 0 ? maxStock : val);
                        updateQuantity(item.id, validQty);
                      }}
                      className="w-10 text-center text-xs font-bold text-gray-900 dark:text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded p-0 border-0"
                    />
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

        {/* ═══ CASHIER ACTION TOOLBAR ═══ */}
        <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border-t border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-1.5 shrink-0 select-none">
          {/* Chiết khấu / Giảm giá */}
          <button
            type="button"
            onClick={() => {
              setTempDiscountType(orderDiscountType);
              setTempDiscountValue(orderDiscountValue > 0 ? String(orderDiscountValue) : '');
              setIsDiscountModalOpen(true);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              orderDiscountValue > 0
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:text-emerald-600'
            }`}
            title="Phím tắt: F4 — Chiết khấu đơn hàng"
          >
            <Percent className="w-3.5 h-3.5" />
            <span className="truncate">
              {orderDiscountValue > 0 ? (orderDiscountType === 'PERCENT' ? `-${orderDiscountValue}%` : `-${fmt(orderDiscountValue)}`) : '% Giảm giá (F4)'}
            </span>
          </button>

          {/* Ghi chú đơn */}
          <button
            type="button"
            onClick={() => {
              setTempOrderNote(orderNote);
              setIsOrderNoteModalOpen(true);
            }}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              orderNote.trim().length > 0
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600'
            }`}
            title="Phím tắt: F6 — Ghi chú đơn hàng"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate">{orderNote.trim().length > 0 ? 'Có ghi chú' : 'Ghi chú (F6)'}</span>
          </button>

          {/* In tạm tính */}
          <button
            type="button"
            onClick={handlePrePrintBill}
            disabled={items.length === 0}
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Phím tắt: F7 — In phiếu tạm tính cho khách xem"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Tạm tính (F7)</span>
          </button>

          {/* Xóa giỏ */}
          <button
            type="button"
            onClick={() => {
              if (items.length === 0) return;
              clearCart();
              setAppliedVoucher(null);
              setVoucherError('');
              setUsedPoints(0);
              setOrderDiscount('PERCENT', 0);
              setOrderNote('');
              toast.info('Đã xóa toàn bộ giỏ hàng');
            }}
            disabled={items.length === 0}
            className="p-1.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 border border-gray-200 dark:border-gray-700 hover:border-red-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Xóa giỏ hàng"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* ═══ PAYMENT METHODS SELECTOR DIRECT ON SIDEBAR ═══ */}
        <div className="p-2.5 pb-2 bg-gray-50/90 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-700 shrink-0 select-none">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Phương thức thanh toán
            </span>
            {selectedPayment && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {selectedPayment.label}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {displayPayments.map((m) => {
              const Icon = m.icon;
              const isDebtMethod = m.id.toLowerCase().includes('debt') || m.id.toLowerCase().includes('no') || m.label.toLowerCase().includes('nợ') || m.label.toLowerCase().includes('công nợ');
              const isBlocked = !!(activeCustomer && isCustomerCreditBlocked(activeCustomer.id) && isDebtMethod);
              const isSelected = selectedPaymentId === m.id;

              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isBlocked}
                  onClick={() => {
                    if (isBlocked) {
                      toast.error(`Khách hàng "${activeCustomer?.name}" đang bị TẠM KHÓA MUA NỢ!`);
                      return;
                    }
                    setSelectedPaymentId(m.id);
                  }}
                  className={`flex items-center gap-2 py-2 px-2 rounded-xl border text-left transition-all cursor-pointer min-h-[46px] ${
                    isBlocked
                      ? 'opacity-40 bg-gray-100 dark:bg-gray-800 border-gray-200 text-gray-400 cursor-not-allowed'
                      : isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  title={isBlocked ? 'Khách hàng bị khóa nợ' : m.label}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] leading-tight font-semibold line-clamp-2 break-words whitespace-normal block">
                      {m.label}
                    </span>
                    {isBlocked && (
                      <span className="text-[9px] text-red-500 font-bold leading-none block mt-0.5">Khóa nợ</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ PAYMENT DETAIL / CASH CALCULATOR ═══ */}
        {isCashPayment ? (
          <div className="p-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/40 shrink-0 space-y-2">
            {/* Input tiền khách đưa */}
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Calculator className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Khách đưa tiền mặt..."
                  value={cashGiven}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '');
                    setCashGiven(digits === '' ? '' : parseInt(digits, 10).toLocaleString('vi-VN'));
                  }}
                  className="w-full pl-8 pr-2.5 py-1.5 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-mono font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setCashGiven(totalAmountToPay.toLocaleString('vi-VN'))}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
                title="Khách đưa vừa đúng số tiền đơn hàng"
              >
                ✓ Đủ tiền
              </button>
              {cashGivenNum > 0 && (
                <button
                  type="button"
                  onClick={() => setCashGiven('')}
                  className="px-2 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-bold transition-colors shrink-0 cursor-pointer"
                  title="Xóa số tiền đã nhập"
                >
                  ✕ Xóa
                </button>
              )}
            </div>

            {/* Dãy nút mệnh giá tiền Polymer chuẩn */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-gray-500 font-semibold px-0.5">
                <span>Mệnh giá tờ tiền Polymer:</span>
                {cashGivenNum > 0 && (
                  <span className="font-mono text-emerald-600 font-bold">
                    Đã chọn: {fmt(cashGivenNum)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[50000, 100000, 200000, 500000].map((amt) => {
                  const isMatch = cashGivenNum === amt;
                  return (
                    <button
                      key={`polymer-${amt}`}
                      type="button"
                      onClick={() => setCashGiven(amt.toLocaleString('vi-VN'))}
                      className={`py-1.5 px-1 text-xs font-mono font-bold rounded-lg border text-center transition-all cursor-pointer ${
                        isMatch
                          ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-gray-750'
                      }`}
                      title={`Khách đưa tờ ${amt.toLocaleString('vi-VN')} ₫`}
                    >
                      {amt.toLocaleString('vi-VN')}
                    </button>
                  );
                })}
              </div>
              {totalAmountToPay > 500000 && (
                <div className="grid grid-cols-2 gap-1 pt-0.5">
                  {[1000000, 2000000].map((amt) => {
                    const isMatch = cashGivenNum === amt;
                    return (
                      <button
                        key={`polymer-lg-${amt}`}
                        type="button"
                        onClick={() => setCashGiven(amt.toLocaleString('vi-VN'))}
                        className={`py-1 px-1.5 text-xs font-mono font-bold rounded-lg border text-center transition-all cursor-pointer ${
                          isMatch
                            ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-gray-750'
                        }`}
                        title={`Khách đưa ${amt.toLocaleString('vi-VN')} ₫`}
                      >
                        {amt.toLocaleString('vi-VN')} ₫
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Khung Tiền thối lại / Còn thiếu */}
            {cashGivenNum > 0 && (
              <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs ${
                cashGivenNum >= totalAmountToPay
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 font-bold'
                  : 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-100 font-bold'
              }`}>
                <span>{cashGivenNum >= totalAmountToPay ? '💵 Tiền thừa thối khách:' : '⚠️ Khách đưa chưa đủ:'}</span>
                <span className="text-sm font-black font-mono">
                  {cashGivenNum >= totalAmountToPay ? fmt(changeAmount) : fmt(totalAmountToPay - cashGivenNum)}
                </span>
              </div>
            )}
          </div>
        ) : selectedPayment?.id.toLowerCase().includes('qr') || (selectedPaymentConfig?.providerType as string) === 'BANK_TRANSFER' ? (
          <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Chuyển khoản VietQR</p>
                <p className="text-[10px] text-gray-500">Mã QR động tự động điền số tiền</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const code = currentOrderCode || `ORD-POS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
                setCurrentOrderCode(code);
                setIsPaymentOpen(true);
              }}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Mở mã QR (F8)
            </button>
          </div>
        ) : (
          <div className="p-2 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 shrink-0 text-center text-xs text-gray-500 font-medium">
            Sẵn sàng ghi nhận thanh toán qua <span className="font-bold text-gray-800 dark:text-gray-200">{selectedPayment?.label}</span>
          </div>
        )}

        {/* ═══ PAYMENT SUMMARY & TOTALS ═══ */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800 shrink-0 space-y-2">
          {/* Voucher input */}
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
              className="px-3 py-1.5 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer">
              Áp dụng
            </button>
          </div>
          {voucherError && <p className="text-[10px] text-red-500 font-semibold">{voucherError}</p>}
          {appliedVoucher && (
            <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-lg px-2 py-1 text-xs">
              <span className="font-bold text-emerald-700 dark:text-emerald-300">
                🏷️ {appliedVoucher.code} — {appliedVoucher.type === 'PERCENT' ? `-${appliedVoucher.value}%` : `-${fmt(appliedVoucher.value)}`}
              </span>
              <button onClick={() => { setAppliedVoucher(null); setVoucherError(''); }}
                className="text-gray-400 hover:text-red-500 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Totals Breakdown */}
          <div className="space-y-1 text-xs pt-1 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Tạm tính ({items.reduce((s, i) => s + i.quantity, 0)} sản phẩm)</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            {orderDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Chiết khấu đơn ({orderDiscountType === 'PERCENT' ? `${orderDiscountValue}%` : 'VNĐ'})</span>
                <span className="font-mono">-{fmt(orderDiscountAmount)}</span>
              </div>
            )}
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Giảm (Voucher)</span>
                <span className="font-mono">-{fmt(voucherDiscount)}</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Giảm (Điểm thưởng)</span>
                <span className="font-mono">-{fmt(pointsDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Thuế VAT ({taxableAmount > 0 ? Math.round((vatAmount / taxableAmount) * 100) : 8}%)</span>
              <span className="font-mono">{fmt(vatAmount)}</span>
            </div>
            {paymentFee > 0 && (
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                <span>Phí thanh toán ({selectedPaymentConfig?.methodName})</span>
                <span className="font-mono">+{fmt(paymentFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 mt-1 border-t-2 border-dashed border-gray-200 dark:border-gray-700">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">TỔNG CỘNG</span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt(totalAmountToPay)}</span>
            </div>
            {activeCustomer && (
              <div className="flex justify-between items-center text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 mt-1">
                <span className="flex items-center gap-1">🎁 Tích điểm:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">+{Math.floor((totalAmount / (loyaltyConfig?.earnRateAmount || 10000)) * (activeCustomer?.membershipRank === 'Thành viên Vàng' ? 1.5 : activeCustomer?.membershipRank === 'Thành viên Bạc' ? 1.2 : 1.0))} điểm</span>
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex gap-2 pt-1">
            {isCashPayment ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const code = currentOrderCode || `ORD-POS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
                    setCurrentOrderCode(code);
                    setIsPaymentOpen(true);
                  }}
                  disabled={items.length === 0}
                  className="px-3.5 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 font-bold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                  title="Mở bảng thanh toán chi tiết (F8)"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>F8</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDirectCashCheckout(true)}
                  disabled={items.length === 0}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-emerald-600/30 cursor-pointer"
                  title="Thanh toán tiền mặt & in hóa đơn ngay lập tức (F9)"
                >
                  <Printer className="w-4 h-4" />
                  THANH TOÁN & IN (F9)
                </button>
              </>
            ) : selectedPayment?.id.toLowerCase().includes('qr') || (selectedPaymentConfig?.providerType as string) === 'BANK_TRANSFER' ? (
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const code = currentOrderCode || `ORD-POS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
                  setCurrentOrderCode(code);
                  setIsPaymentOpen(true);
                }}
                disabled={items.length === 0}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                <QrCode className="w-5 h-5" />
                HIỂN THỊ MÃ QR THANH TOÁN (F8)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const code = currentOrderCode || `ORD-POS-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
                  setCurrentOrderCode(code);
                  setIsPaymentOpen(true);
                }}
                disabled={items.length === 0}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                XÁC NHẬN THANH TOÁN (F8)
              </button>
            )}
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
              <div className="flex flex-col items-center justify-center p-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">Thanh toán thành công!</h2>
                <p className="text-gray-500 dark:text-gray-400 text-xs text-center">Đơn hàng {currentOrderCode} đã được ghi nhận vào hệ thống.</p>
                {isCashPayment && cashGivenNum > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 text-center w-full">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Tiền thối lại</p>
                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{fmt(changeAmount)}</p>
                  </div>
                )}
                <div className="flex gap-3 w-full pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPrintInvoiceOpen(true);
                    }}
                    className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> 🖨️ In hóa đơn bán lẻ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (tabs.length > 1) {
                        closeTab(activeTabId);
                      } else {
                        clearCart();
                      }
                      setVoucherError('');
                      setPaymentState('idle');
                      setIsPaymentOpen(false);
                      setCurrentOrderCode('');
                    }}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    ✓ Tạo đơn mới
                  </button>
                </div>
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

                    <div className="relative border-2 border-dashed border-gray-250 dark:border-gray-700 p-2 bg-white rounded-2xl shadow-sm w-60 h-60 flex items-center justify-center overflow-hidden shrink-0">
                      {(selectedPaymentConfig?.providerType as string) === 'BANK_TRANSFER' ? (() => {
                        const rawBank = ((selectedPaymentConfig as any)?.bankCode || selectedPaymentConfig?.bankName || 'MB').trim();
                        const upper = rawBank.toUpperCase();
                        let cleanCode = 'MB';
                        if (upper.includes('MBBANK') || upper.includes('QUÂN ĐỘI') || upper.startsWith('MB')) cleanCode = 'MB';
                        else if (upper.includes('VIETCOMBANK') || upper.startsWith('VCB')) cleanCode = 'VCB';
                        else if (upper.includes('TECHCOMBANK') || upper.startsWith('TCB')) cleanCode = 'TCB';
                        else if (upper.includes('VIETINBANK') || upper.startsWith('CTG') || upper.startsWith('ICB')) cleanCode = 'ICB';
                        else if (upper.includes('BIDV')) cleanCode = 'BIDV';
                        else if (upper.includes('ACB')) cleanCode = 'ACB';
                        else if (upper.includes('TPBANK') || upper.startsWith('TPB')) cleanCode = 'TPB';
                        else if (upper.includes('VPBANK') || upper.startsWith('VPB')) cleanCode = 'VPB';
                        else cleanCode = rawBank.split(' ')[0].replace(/[^A-Za-z0-9]/g, '') || 'MB';

                        return (
                          <img
                            src={`https://img.vietqr.io/image/${cleanCode}-${selectedPaymentConfig.bankAccount}-compact2.png?amount=${totalAmountToPay}&addInfo=${encodeURIComponent((selectedPaymentConfig.transferSyntax || 'POS {order_code}').replace('{order_code}', currentOrderCode))}&accountName=${encodeURIComponent(selectedPaymentConfig.bankAccountName || '')}`}
                            alt="VietQR Payment"
                            className="w-full h-full object-contain"
                          />
                        );
                      })() : (
                        <svg className="w-full h-full text-emerald-600" viewBox="0 0 100 100">
                          <path d="M10 25 V10 H25 M75 10 H90 V25 M90 75 V90 H75 M25 90 H10 V75" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                          {String(selectedPayment?.id || '').toLowerCase().includes('ewallet') ||
                           String(selectedPayment?.id || '').toLowerCase().includes('transfer') ||
                           String(selectedPayment?.id || '').toLowerCase().includes('qr') ||
                           (selectedPaymentConfig?.providerType as string) === 'GATEWAY' ||
                           (selectedPaymentConfig?.providerType as string) === 'BANK_TRANSFER' ? (
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
                      )}
                      <div className="absolute inset-x-0 h-0.5 bg-emerald-500 animate-bounce top-1/2 shadow shadow-emerald-500" />
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-gray-400">Số tiền cần thu</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{fmt(totalAmountToPay)}</p>
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
                    <p className="text-4xl font-black text-gray-900 dark:text-white">{fmt(totalAmountToPay)}</p>
                    {paymentFee > 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">
                        (Bao gồm phí {selectedPaymentConfig?.methodName}: +{fmt(paymentFee)})
                      </p>
                    )}
                  </div>

                  {/* Payment method selection */}
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phương thức thanh toán</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {displayPayments.map((m) => {
                      const Icon = m.icon;
                      const isDebtMethod = m.id.toLowerCase().includes('debt') || m.id.toLowerCase().includes('no') || m.label.toLowerCase().includes('nợ') || m.label.toLowerCase().includes('công nợ');
                      const isBlocked = !!(activeCustomer && isCustomerCreditBlocked(activeCustomer.id) && isDebtMethod);

                      return (
                        <button
                          key={m.id}
                          type="button"
                          disabled={isBlocked}
                          onClick={() => {
                            if (isBlocked) {
                              toast.error(`Khách hàng "${activeCustomer?.name}" đang bị TẠM KHÓA MUA NỢ! Vui lòng chọn Tiền mặt hoặc Chuyển khoản.`);
                              return;
                            }
                            setSelectedPaymentId(m.id);
                          }}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-colors ${
                            isBlocked
                              ? 'opacity-40 bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                              : selectedPaymentId === m.id
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:bg-gray-650'
                          }`}
                          title={isBlocked ? 'Khách hàng bị khóa quyền mua nợ' : m.label}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <div className="flex flex-col text-left flex-1 min-w-0">
                            <span className="text-xs leading-tight font-semibold line-clamp-2 break-words whitespace-normal">{m.label}</span>
                            {isBlocked && (
                              <span className="text-[9px] text-red-500 font-bold uppercase mt-0.5">Bị khóa nợ</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cash input */}
                  {isCashPayment && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Tiền khách đưa</label>
                        {cashGivenNum > 0 && (
                          <button
                            type="button"
                            onClick={() => setCashGiven('')}
                            className="text-xs text-red-500 hover:underline font-semibold cursor-pointer"
                          >
                            ✕ Xóa
                          </button>
                        )}
                      </div>
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
                      <div className="space-y-1.5 mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
                          <span>Mệnh giá Polymer chuẩn:</span>
                          <button
                            type="button"
                            onClick={() => setCashGiven(totalAmountToPay.toLocaleString('vi-VN'))}
                            className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                          >
                            ✓ Khách đưa đủ tiền
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[50000, 100000, 200000, 500000].map(amt => {
                            const isSelected = cashGivenNum === amt;
                            return (
                              <button
                                key={`modal-polymer-${amt}`}
                                type="button"
                                onClick={() => setCashGiven(amt.toLocaleString('vi-VN'))}
                                className={`py-2 px-1 text-xs font-mono font-bold rounded-lg border text-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30'
                                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 hover:text-emerald-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                                }`}
                              >
                                {amt.toLocaleString('vi-VN')}
                              </button>
                            );
                          })}
                        </div>
                        {totalAmountToPay > 500000 && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            {[1000000, 2000000].map(amt => {
                              const isSelected = cashGivenNum === amt;
                              return (
                                <button
                                  key={`modal-polymer-lg-${amt}`}
                                  type="button"
                                  onClick={() => setCashGiven(amt.toLocaleString('vi-VN'))}
                                  className={`py-1.5 px-2 text-xs font-mono font-bold rounded-lg border text-center transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30'
                                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 hover:text-emerald-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
                                  }`}
                                >
                                  {amt.toLocaleString('vi-VN')} ₫
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {cashGivenNum >= totalAmountToPay && cashGivenNum > 0 && (
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
                    onClick={() => handleConfirmPayment()}
                    disabled={isCashPayment && cashGivenNum < totalAmountToPay}
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

      {/* ORDER DISCOUNT MODAL (F4) */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title="🏷️ Chiết khấu / Giảm giá đơn hàng (F4)"
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setTempDiscountType('PERCENT');
                setTempDiscountValue('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tempDiscountType === 'PERCENT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              % Theo phần trăm
            </button>
            <button
              type="button"
              onClick={() => {
                setTempDiscountType('FLAT');
                setTempDiscountValue('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                tempDiscountType === 'FLAT'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              VNĐ Số tiền mặt
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Giá trị giảm ({tempDiscountType === 'PERCENT' ? '%' : 'VNĐ'})
            </label>
            <input
              type="text"
              autoFocus
              inputMode="numeric"
              placeholder={tempDiscountType === 'PERCENT' ? 'Ví dụ: 10' : 'Ví dụ: 50.000'}
              value={tempDiscountValue}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                if (tempDiscountType === 'PERCENT') {
                  const num = parseInt(digits, 10) || 0;
                  setTempDiscountValue(digits === '' ? '' : String(Math.min(100, num)));
                } else {
                  setTempDiscountValue(digits === '' ? '' : parseInt(digits, 10).toLocaleString('vi-VN'));
                }
              }}
              className="w-full px-4 py-2.5 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-lg font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Gợi ý nhanh</span>
            <div className="flex flex-wrap gap-1.5">
              {tempDiscountType === 'PERCENT' ? (
                [5, 10, 15, 20, 30].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTempDiscountValue(String(pct))}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 hover:text-emerald-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                  >
                    {pct}%
                  </button>
                ))
              ) : (
                [20000, 50000, 100000, 200000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTempDiscountValue(amt.toLocaleString('vi-VN'))}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-emerald-50 hover:text-emerald-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                  >
                    {fmt(amt)}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-500">
              <span>Tạm tính đơn hàng:</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Số tiền giảm:</span>
              <span className="font-mono">
                -{fmt(
                  tempDiscountType === 'PERCENT'
                    ? Math.round(subtotal * ((parseFloat(tempDiscountValue) || 0) / 100))
                    : Math.min(subtotal, parseFloat(tempDiscountValue.replace(/\./g, '')) || 0)
                )}
              </span>
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setOrderDiscount('PERCENT', 0);
                setIsDiscountModalOpen(false);
                toast.info('Đã hủy chiết khấu đơn hàng');
              }}
              className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy chiết khấu
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsDiscountModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const rawVal = tempDiscountType === 'PERCENT'
                    ? parseFloat(tempDiscountValue) || 0
                    : parseFloat(tempDiscountValue.replace(/\./g, '')) || 0;
                  setOrderDiscount(tempDiscountType, rawVal);
                  setIsDiscountModalOpen(false);
                  toast.success(`Đã áp dụng chiết khấu đơn hàng: ${tempDiscountType === 'PERCENT' ? `${rawVal}%` : fmt(rawVal)}`);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ORDER NOTE MODAL (F6) */}
      <Modal
        isOpen={isOrderNoteModalOpen}
        onClose={() => setIsOrderNoteModalOpen(false)}
        title="📝 Ghi chú đơn hàng (F6)"
        width="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Nội dung ghi chú (sẽ in lên hóa đơn & lưu hệ thống)
            </label>
            <textarea
              autoFocus
              rows={3}
              value={tempOrderNote}
              onChange={(e) => setTempOrderNote(e.target.value)}
              placeholder="Nhập ghi chú cho đơn hàng này..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Quick chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Mẫu ghi chú nhanh</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Khách lấy hóa đơn đỏ VAT',
                'Giao hàng sau 17:00',
                'Khách thân thiết VIP',
                'Hàng dễ vỡ - gói kỹ',
                'Đổi hàng trong 7 ngày',
                'Đã thanh toán trước 50%',
              ].map((noteSample) => (
                <button
                  key={noteSample}
                  type="button"
                  onClick={() => {
                    setTempOrderNote((prev) => (prev ? `${prev}, ${noteSample}` : noteSample));
                  }}
                  className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-blue-50 hover:text-blue-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
                >
                  + {noteSample}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setTempOrderNote('');
                setOrderNote('');
                setIsOrderNoteModalOpen(false);
                toast.info('Đã xóa ghi chú đơn hàng');
              }}
              className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Xóa ghi chú
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOrderNoteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrderNote(tempOrderNote.trim());
                  setIsOrderNoteModalOpen(false);
                  toast.success('Đã lưu ghi chú đơn hàng');
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* KEYBOARD SHORTCUTS GUIDE MODAL */}
      <Modal
        isOpen={isShortcutsGuideOpen}
        onClose={() => setIsShortcutsGuideOpen(false)}
        title="Danh mục phím tắt bán hàng (POS Shortcuts)"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Hệ thống hỗ trợ phím tắt chuẩn quầy thu ngân bán lẻ, giúp tăng tốc tối đa tốc độ quét mã và in bill:
          </p>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">Tìm kiếm sản phẩm & Quét Barcode</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-emerald-600 dark:text-emerald-400 shadow-2xs">F1 / F2</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">Tạo nhanh khách hàng mới</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-blue-600 dark:text-blue-400 shadow-2xs">F3</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">Chiết khấu / Giảm giá đơn</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-purple-600 dark:text-purple-400 shadow-2xs">F4</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">Ghi chú đơn hàng</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-cyan-600 dark:text-cyan-400 shadow-2xs">F6</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">In phiếu tạm tính cho khách</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-indigo-600 dark:text-indigo-400 shadow-2xs">F7</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">Mở bảng Chọn thanh toán / Quét QR</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-amber-600 dark:text-amber-400 shadow-2xs">F8</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">Thanh toán tiền mặt & In hóa đơn</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 rounded-md text-emerald-700 dark:text-emerald-300 shadow-2xs">F9</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
              <span className="text-gray-700 dark:text-gray-300 font-medium text-xs">Đóng popup / Thoát tìm kiếm</span>
              <kbd className="px-2 py-0.5 text-xs font-mono font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-red-600 dark:text-red-400 shadow-2xs">Esc</kbd>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsShortcutsGuideOpen(false)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Chọn Biến Thể Sản Phẩm POS (Variant Picker) */}
      {variantPickerProduct && (
        <Modal
          isOpen={Boolean(variantPickerProduct)}
          onClose={() => {
            setVariantPickerProduct(null);
            setProductVariants([]);
          }}
          title={`Chọn biến thể: ${variantPickerProduct.name}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">
              Vui lòng chọn phân loại hàng (Màu sắc / Kích cỡ) để thêm vào đơn hàng POS:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {productVariants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSelectVariant(v)}
                  className="p-3 border border-slate-200 dark:border-gray-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all text-left flex flex-col justify-between space-y-2 group shadow-xs bg-white dark:bg-gray-800 cursor-pointer"
                >
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-gray-100 text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                      {v.variantDescription || v.variantCode || v.sku}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">SKU: {v.sku}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-gray-700 w-full text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {Number(v.price || variantPickerProduct.price).toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded-full font-medium">
                      Tồn: {v.stock !== undefined ? v.stock : variantPickerProduct.stock}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setVariantPickerProduct(null);
                  setProductVariants([]);
                }}
                className="px-4 py-2 border border-slate-300 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
