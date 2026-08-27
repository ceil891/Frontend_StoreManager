/**
 * Định dạng dữ liệu và kiểm tra dữ liệu chuẩn Việt Nam
 */

/**
 * Định dạng tiền tệ theo chuẩn Việt Nam: Phân cách hàng nghìn bằng dấu chấm '.', đơn vị 'đ' hoặc 'VNĐ'
 * Ví dụ: formatCurrency(1500000) => "1.500.000 đ"
 */
export function formatCurrency(
  val?: number | string | null,
  suffix: 'đ' | 'VNĐ' | '₫' = 'đ'
): string {
  if (val === undefined || val === null || val === '') return `0 ${suffix}`;
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val;
  if (isNaN(num)) return `0 ${suffix}`;

  const formatted = new Intl.NumberFormat('vi-VN').format(Math.round(num));
  return `${formatted} ${suffix}`;
}

/**
 * Định dạng số theo chuẩn Việt Nam (phân cách hàng nghìn bằng dấu chấm)
 * Ví dụ: formatNumber(12500) => "12.500"
 */
export function formatNumber(val?: number | string | null): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Định dạng ngày theo chuẩn Việt Nam: DD/MM/YYYY
 * Ví dụ: formatDate("2026-08-20T10:30:00Z") => "20/08/2026"
 */
export function formatDate(date?: string | Date | number | null): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
}

/**
 * Định dạng ngày giờ theo chuẩn Việt Nam: DD/MM/YYYY HH:mm
 * Ví dụ: formatDateTime("2026-08-20T10:30:00Z") => "20/08/2026 10:30"
 */
export function formatDateTime(
  date?: string | Date | number | null,
  includeSeconds: boolean = false
): string {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    if (isNaN(d.getTime())) return typeof date === 'string' ? date : '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    if (includeSeconds) {
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '—';
  }
}

/**
 * Định dạng số điện thoại hiển thị chuẩn Việt Nam (10 chữ số)
 * Ví dụ: formatPhoneNumber("0987654321") => "0987 654 321"
 */
export function formatPhoneNumber(phone?: string | null): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Kiểm tra số điện thoại hợp lệ chuẩn Việt Nam (10 chữ số bắt đầu từ số 0)
 */
export function isValidVietnamesePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.trim().replace(/\s+/g, '');
  return /^0[1-9][0-9]{8}$/.test(cleaned);
}

/**
 * Kiểm tra email hợp lệ
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Bộ thông báo lỗi validation chuẩn Tiếng Việt
 */
export const VALIDATION_MESSAGES = {
  required: 'Trường này không được để trống.',
  phone: 'Số điện thoại không đúng định dạng (phải có 10 chữ số bắt đầu từ số 0).',
  email: 'Email không hợp lệ (ví dụ: abc@domain.com).',
  passwordMin: 'Mật khẩu phải có ít nhất 6 ký tự.',
  numberMin: (min: number) => `Giá trị phải lớn hơn hoặc bằng ${formatNumber(min)}.`,
  numberMax: (max: number) => `Giá trị phải nhỏ hơn hoặc bằng ${formatNumber(max)}.`,
  dateInvalid: 'Ngày không hợp lệ (định dạng chuẩn: DD/MM/YYYY).',
} as const;

/**
 * Chuyển chuỗi sang Sentence case chuẩn tiếng Việt (chỉ viết hoa chữ cái đầu tiên)
 * Trừ khi đó là từ viết tắt kỹ thuật hoặc danh từ riêng.
 */
export function toSentenceCase(str: string): string {
  if (!str) return '';
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
