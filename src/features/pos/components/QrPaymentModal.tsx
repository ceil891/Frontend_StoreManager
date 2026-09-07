import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import type { PaymentMethodRecord } from '../store/posConfigStore';
import type { CorporateBankAccount } from '@/features/finance/store/financeStore';
import { playCopySound } from '@/shared/utils/soundEffects';

interface QrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: () => void;
  amount: number;
  orderCode: string;
  paymentConfig?: PaymentMethodRecord | null;
  methodLabel?: string;
  branchName?: string;
  customerName?: string;
  corporateBankAccounts?: CorporateBankAccount[];
}

const BANK_CLEAN_CODES: Record<string, string> = {
  MB: 'MB',
  MBBANK: 'MB',
  VCB: 'VCB',
  VIETCOMBANK: 'VCB',
  TCB: 'TCB',
  TECHCOMBANK: 'TCB',
  CTG: 'ICB',
  ICB: 'ICB',
  VIETINBANK: 'ICB',
  BIDV: 'BIDV',
  ACB: 'ACB',
  TPB: 'TPB',
  TPBANK: 'TPB',
  VPB: 'VPB',
  VPBANK: 'VPB',
  STB: 'STB',
  SACOMBANK: 'STB',
  HDB: 'HDB',
  HDBANK: 'HDB',
  VIB: 'VIB',
  MSB: 'MSB',
  SHB: 'SHB',
  OCB: 'OCB',
  SEAB: 'SEAB',
  SEABANK: 'SEAB',
};

export function QrPaymentModal({
  isOpen,
  onClose,
  onConfirmPayment,
  amount,
  orderCode,
  paymentConfig,
  methodLabel = 'Chuyển khoản VietQR',
  branchName = 'Chi nhánh RetailHub',
  customerName = 'Khách vãng lai',
  corporateBankAccounts = [],
}: QrPaymentModalProps) {
  // Countdown timer in seconds (10 minutes = 600 seconds)
  const INITIAL_COUNTDOWN = 600;
  const [timeLeft, setTimeLeft] = useState(INITIAL_COUNTDOWN);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCustomerDisplay, setIsCustomerDisplay] = useState(false);
  const [isSimulatingCheck, setIsSimulatingCheck] = useState(false);
  const [qrRefreshKey, setQrRefreshKey] = useState(0);

  // Timer countdown
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(INITIAL_COUNTDOWN);
      setIsCustomerDisplay(false);
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, qrRefreshKey]);

  // Keyboard shortcut listener (F9: confirm, Esc: close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isCustomerDisplay) {
          setIsCustomerDisplay(false);
        } else {
          onClose();
        }
      } else if (e.key === 'F9') {
        e.preventDefault();
        onConfirmPayment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCustomerDisplay, onClose, onConfirmPayment]);

  // Determine provider brand
  const providerType = String(paymentConfig?.providerType || '').toUpperCase();
  const mCode = String(paymentConfig?.methodCode || '').toUpperCase();
  const mName = String(paymentConfig?.methodName || methodLabel || '').toLowerCase();

  const isMoMo = mCode.includes('MOMO') || mName.includes('momo');
  const isVnPay = mCode.includes('VNPAY') || mName.includes('vnpay');
  const isZaloPay = mCode.includes('ZALO') || mName.includes('zalo');

  // Extract / resolve bank account details with smart fallback
  const resolvedBankInfo = useMemo(() => {
    // 1. Check from paymentConfig
    const configBankName = paymentConfig?.bankName?.trim();
    const configAccount = paymentConfig?.bankAccount?.trim();
    const configAccountName = paymentConfig?.bankAccountName?.trim();
    const configSyntax = paymentConfig?.transferSyntax?.trim();

    // 2. Check from corporateBankAccounts fallback
    const corpPrimary = corporateBankAccounts.find(
      (a) => a.accountType === 'PRIMARY_OPERATING' && a.status === 'ACTIVE'
    ) || corporateBankAccounts[0];

    const bankName = configBankName || corpPrimary?.bankName || 'MBBank (Ngân hàng Quân Đội)';
    const bankAccount = configAccount || corpPrimary?.accountNumber || '0383868888';
    const bankAccountName = configAccountName || corpPrimary?.accountName || 'CONG TY CP BAN LE RETAILHUB';
    const syntaxTemplate = configSyntax || 'POS {order_code}';
    const transferSyntax = syntaxTemplate.replace('{order_code}', orderCode || 'DONHANG');

    // Clean bank code for VietQR API
    const upper = bankName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    let cleanCode = 'MB';
    for (const [k, v] of Object.entries(BANK_CLEAN_CODES)) {
      if (upper.includes(k)) {
        cleanCode = v;
        break;
      }
    }

    return {
      bankName,
      bankAccount,
      bankAccountName: bankAccountName.toUpperCase(),
      transferSyntax,
      cleanCode,
    };
  }, [paymentConfig, corporateBankAccounts, orderCode]);

  // Generate dynamic QR URL
  const qrImageUrl = useMemo(() => {
    const { cleanCode, bankAccount, bankAccountName, transferSyntax } = resolvedBankInfo;

    if (isMoMo) {
      // MoMo QR format fallback
      const momoData = `2|99|${bankAccount}|${encodeURIComponent(bankAccountName)}|${amount}|0|0|${encodeURIComponent(transferSyntax)}`;
      return `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(momoData)}&bgcolor=FFFFFF&color=A50064&margin=2`;
    }

    // Standard VietQR Dynamic QR
    const addInfo = encodeURIComponent(transferSyntax);
    const accName = encodeURIComponent(bankAccountName);
    return `https://img.vietqr.io/image/${cleanCode}-${bankAccount}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accName}&k=${qrRefreshKey}`;
  }, [resolvedBankInfo, amount, isMoMo, qrRefreshKey]);

  // 1-Click Copy helper
  const handleCopy = useCallback((text: string, label: string, key: string) => {
    if (!navigator.clipboard) {
      toast.error('Trình duyệt không hỗ trợ sao chép tự động');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    playCopySound();
    toast.success(`Đã sao chép ${label}: ${text}`);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  }, []);

  // Format currency
  const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

  // Format countdown minutes:seconds
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Handle refresh
  const handleRefreshQr = () => {
    setTimeLeft(INITIAL_COUNTDOWN);
    setQrRefreshKey((k) => k + 1);
    toast.success('Đã làm mới mã QR thanh toán!');
  };

  // Simulate payment
  const handleSimulatePayment = () => {
    setIsSimulatingCheck(true);
    setTimeout(() => {
      setIsSimulatingCheck(false);
      toast.success('⚡ Giả lập thanh toán: Nhận thành công giao dịch từ khách hàng!');
      onConfirmPayment();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
      {/* ── CUSTOMER FULLSCREEN DISPLAY MODE ──────────────────────────── */}
      {isCustomerDisplay ? (
        <div className="fixed inset-0 z-60 bg-slate-950 flex flex-col items-center justify-between p-6 sm:p-10 text-white animate-scaleIn">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{branchName}</h2>
              <p className="text-xs text-slate-400">Màn hình thanh toán quét mã QR</p>
            </div>
            <button
              onClick={() => setIsCustomerDisplay(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              Thu nhỏ
            </button>
          </div>

          <div className="flex flex-col items-center justify-center text-center my-auto space-y-5">
            <div className="space-y-1">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Mã QR động VietQR Napas 247
              </span>
              <p className="text-slate-400 text-sm mt-2">Vui lòng quét mã bên dưới để thanh toán đơn hàng</p>
              <h1 className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight mt-1">
                {fmt(amount)}
              </h1>
            </div>

            {/* Giant QR Card */}
            <div className="relative p-4 bg-white rounded-3xl shadow-2xl shadow-emerald-500/10 border-4 border-slate-700 max-w-sm sm:max-w-md w-full">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white flex items-center justify-center">
                <img
                  src={qrImageUrl}
                  alt="VietQR Customer Display"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse top-1/2 shadow-lg shadow-emerald-500" />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700 font-medium">
                <span>Nội dung: <strong className="font-mono text-slate-900">{resolvedBankInfo.transferSyntax}</strong></span>
                <span className="text-slate-500">Mã đơn: <strong>{orderCode}</strong></span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-md">
              Hỗ trợ quét qua ứng dụng của hơn 50 Ngân hàng (Vietcombank, MB, BIDV, Techcombank, VPBank, ACB...) và các Ví điện tử (MoMo, ZaloPay, ShopeePay, Viettel Money).
            </p>
          </div>

          <div className="w-full flex items-center justify-between text-xs text-slate-500 border-t border-slate-800 pt-4">
            <span>Hiệu lực mã: <strong className="text-emerald-400 font-mono">{timeFormatted}</strong></span>
            <span>Khách hàng: <strong>{customerName}</strong></span>
          </div>
        </div>
      ) : null}

      {/* ── MAIN MODAL (2 COLUMNS) ────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-scaleIn flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/70 dark:bg-gray-850">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                {isMoMo ? 'Thanh toán Ví MoMo' : isVnPay ? 'Cổng thanh toán VNPAY-QR' : 'Chuyển khoản VietQR'}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                Napas 247
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Mã đơn hàng: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{orderCode}</span>
              {customerName && customerName !== 'Khách vãng lai' && ` • ${customerName}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomerDisplay(true)}
              className="hidden sm:inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition"
              title="Phóng to cho khách xem"
            >
              Màn hình khách
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition text-sm font-bold"
              title="Đóng (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* ══ LEFT COLUMN: QR CODE CARD (Col 5) ══ */}
          <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
            {/* The QR Container */}
            <div className="relative w-full max-w-[270px] bg-white rounded-2xl p-3 border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-xl shadow-emerald-500/5 group">
              {/* Header inside QR Frame */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                <span className="text-[11px] font-bold text-gray-800">VietQR Pro</span>
                <span className="text-[10px] font-mono text-gray-400">Napas247</span>
              </div>

              {/* QR Image Box */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white flex items-center justify-center">
                <img
                  src={qrImageUrl}
                  alt="VietQR Code"
                  className="w-full h-full object-contain select-none"
                />

                {/* Laser scan animation beam */}
                {timeLeft > 0 && (
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-pulse top-1/2 shadow-md shadow-emerald-500 pointer-events-none" />
                )}

                {/* Expired overlay */}
                {timeLeft === 0 && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center text-white space-y-2 animate-fadeIn">
                    <p className="text-xs font-bold text-amber-400">Mã QR đã hết hạn</p>
                    <button
                      type="button"
                      onClick={handleRefreshQr}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow"
                    >
                      Tạo lại mã mới
                    </button>
                  </div>
                )}
              </div>

              {/* Footer inside QR Frame */}
              <div className="mt-2 pt-2 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-500">Quét bằng App Ngân hàng hoặc Ví MoMo</p>
              </div>
            </div>

            {/* Countdown timer badge */}
            <div className="flex items-center justify-between w-full max-w-[270px] px-2 text-xs">
              <div className="text-gray-500 dark:text-gray-400 text-[11px]">
                <span>Hiệu lực: </span>
                <strong className={`font-mono ${timeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {timeFormatted}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleRefreshQr}
                className="text-[11px] text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold transition"
                title="Làm mới lại mã QR"
              >
                Làm mới
              </button>
            </div>

            {/* Action buttons under QR */}
            <div className="flex items-center gap-2 w-full max-w-[270px]">
              <button
                type="button"
                onClick={() => setIsCustomerDisplay(true)}
                className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition text-center"
              >
                Phóng to
              </button>
              <a
                href={qrImageUrl}
                download={`QR_${orderCode}.png`}
                target="_blank"
                rel="noreferrer"
                className="py-1.5 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition text-center"
                title="Tải ảnh mã QR"
              >
                Tải ảnh
              </a>
            </div>
          </div>

          {/* ══ RIGHT COLUMN: PAYMENT DETAILS & ACTIONS (Col 7) ══ */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-4">
            {/* Amount Banner */}
            <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/30 p-4 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Tổng số tiền thanh toán
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(String(amount), 'Số tiền', 'amount')}
                  className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  {copiedKey === 'amount' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1 tracking-tight">
                {fmt(amount)}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Số tiền đã được nhúng trực tiếp vào mã QR. Khách không cần nhập tay.
              </p>
            </div>

            {/* Transfer Information Card with 1-Click Copy */}
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Thông tin nhận chuyển khoản
                </span>
                <span className="text-[10px] text-gray-400">Bấm để sao chép nhanh</span>
              </div>

              {/* Bank Name */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Ngân hàng:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-900 dark:text-white">{resolvedBankInfo.bankName}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(resolvedBankInfo.bankName, 'Ngân hàng', 'bank')}
                    className="px-2 py-0.5 text-xs text-gray-500 hover:text-emerald-600 font-semibold rounded transition"
                    title="Sao chép tên ngân hàng"
                  >
                    {copiedKey === 'bank' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              {/* Account Number */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                    {resolvedBankInfo.bankAccount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(resolvedBankInfo.bankAccount, 'Số tài khoản', 'accNum')}
                    className="px-2 py-0.5 text-xs text-blue-600 hover:text-blue-800 font-semibold rounded transition"
                    title="Sao chép số tài khoản"
                  >
                    {copiedKey === 'accNum' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              {/* Beneficiary */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Chủ tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-800 dark:text-gray-200">{resolvedBankInfo.bankAccountName}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(resolvedBankInfo.bankAccountName, 'Tên chủ TK', 'accName')}
                    className="px-2 py-0.5 text-xs text-gray-500 hover:text-emerald-600 font-semibold rounded transition"
                    title="Sao chép tên chủ tài khoản"
                  >
                    {copiedKey === 'accName' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>

              {/* Transfer Content */}
              <div className="flex items-center justify-between text-xs bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                <div>
                  <span className="block text-[10px] text-amber-800 dark:text-amber-400 font-bold uppercase">
                    Nội dung chuyển khoản (bắt buộc):
                  </span>
                  <span className="font-mono font-black text-amber-950 dark:text-amber-200 text-sm">
                    {resolvedBankInfo.transferSyntax}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(resolvedBankInfo.transferSyntax, 'Nội dung CK', 'syntax')}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  {copiedKey === 'syntax' ? 'Đã chép' : 'Chép'}
                </button>
              </div>
            </div>

            {/* Waiting Radar Indicator */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                </div>
                <span className="text-xs text-blue-900 dark:text-blue-300 font-semibold">
                  Đang đợi tín hiệu thanh toán từ khách hàng...
                </span>
              </div>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulatingCheck}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                title="Dùng cho kiểm thử quầy hoặc khi khách vừa chuyển khoản xong"
              >
                {isSimulatingCheck ? 'Đang kiểm tra...' : 'Giả lập nhận tiền'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-4 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-xs sm:text-sm transition text-center"
              >
                Đổi phương thức
              </button>
              <button
                type="button"
                onClick={onConfirmPayment}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm transition shadow-lg shadow-emerald-600/30 text-center active:scale-[0.98] cursor-pointer"
              >
                XÁC NHẬN ĐÃ NHẬN TIỀN (F9)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
