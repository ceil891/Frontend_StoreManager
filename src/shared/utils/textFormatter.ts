import React from 'react';

/**
 * Danh sách từ viết tắt chuyên môn (Whitelisted Acronyms & Codes)
 * Các từ này sẽ được giữ nguyên dạng viết hoa khi chuẩn hóa Sentence Case.
 */
export const ACRONYM_WHITELIST = new Set([
  // Logistics & Kho vận
  'COD', 'SKU', 'WMS', 'LTL', 'FTL', 'NXB', 'Lô', 'SLA',
  // Bán hàng & Doanh nghiệp
  'PO', 'MST', 'POS', 'VAT', 'KPI', 'ERP', 'CRM', 'VIP', 'B2B', 'B2C',
  // Công nghệ & Bảo mật
  'ID', 'QR', 'OTP', 'API', 'UI', 'UX', 'SMS', 'AI', 'URL', 'IP', 'MAC',
  'RAM', 'CPU', 'SSD', 'HDD', 'JSON', 'CSV', 'PDF', 'EXCEL',
  // Định danh & Tài chính
  'CCCD', 'CMND', 'STK', 'IBAN', 'SWIFT', 'TSCĐ', 'VND', 'USD', 'EUR',
  'VNPAY', 'MOMO', 'ZALOPAY', 'TCVN', 'ISO',
  // Đơn vị đo lường
  'KG', 'G', 'L', 'ML', 'M', 'CM', 'MM', 'GB', 'MB', 'TB'
]);

/**
 * Chuyển đổi chuỗi sang Sentence case (Chỉ viết hoa chữ cái đầu câu, các chữ sau viết thường)
 * Tự động bảo toàn các từ viết tắt chuyên ngành trong ACRONYM_WHITELIST.
 * 
 * @example
 * toSentenceCase('ĐỀ XUẤT MUA HÀNG PO') => 'Đề xuất mua hàng PO'
 * toSentenceCase('+ THÊM KHÁCH HÀNG VIP') => '+ Thêm khách hàng VIP'
 * toSentenceCase('DANH MỤC NHÀ CUNG CẤP') => 'Danh mục nhà cung cấp'
 */
export function toSentenceCase(text: string): string {
  if (!text || typeof text !== 'string') return text || '';
  
  const trimmed = text.trim();
  if (trimmed.length === 0) return text;

  // Giữ nguyên tiền tố ký hiệu như "+ ", "- ", "* ", "> " nếu có
  let prefix = '';
  let rest = trimmed;
  const prefixMatch = trimmed.match(/^([+\-*•>#\s]+)(.*)$/);
  if (prefixMatch) {
    prefix = prefixMatch[1];
    rest = prefixMatch[2];
  }

  if (rest.length === 0) return text;

  // Tách các từ theo khoảng trắng
  const words = rest.split(/\s+/);

  const formattedWords = words.map((word, index) => {
    // Tách phần ký tự chữ và dấu câu bao quanh (ví dụ: "(SKU)", "PO,", "POS:")
    const match = word.match(/^([^a-zA-ZÀ-ỹ0-9]*)([a-zA-ZÀ-ỹ0-9]+)([^a-zA-ZÀ-ỹ0-9]*)$/);
    if (!match) return word;

    const [, leadingPunct, coreWord, trailingPunct] = match;
    const upperCore = coreWord.toUpperCase();

    // Kiểm tra xem từ có nằm trong danh sách Acronym không
    if (ACRONYM_WHITELIST.has(upperCore) || ACRONYM_WHITELIST.has(coreWord)) {
      return `${leadingPunct}${coreWord.length > 2 && coreWord === 'Lô' ? 'Lô' : upperCore}${trailingPunct}`;
    }

    if (index === 0) {
      // Từ đầu tiên: Viết hoa chữ cái đầu tiên, các chữ sau viết thường
      const firstChar = coreWord.charAt(0).toLocaleUpperCase('vi-VN');
      const remainingChars = coreWord.slice(1).toLocaleLowerCase('vi-VN');
      return `${leadingPunct}${firstChar}${remainingChars}${trailingPunct}`;
    } else {
      // Các từ tiếp theo: Viết thường toàn bộ
      return `${leadingPunct}${coreWord.toLocaleLowerCase('vi-VN')}${trailingPunct}`;
    }
  });

  return prefix + formattedWords.join(' ');
}

/**
 * Helper format an toàn cho React Node:
 * - Nếu là string -> áp dụng toSentenceCase
 * - Nếu là React Node phức tạp (JSX element, component, icon) -> giữ nguyên để không phá hỏng DOM
 */
export function formatSafeSentenceCase(node: React.ReactNode, enabled = true): React.ReactNode {
  if (!enabled || node === null || node === undefined) return node;
  if (typeof node === 'string') {
    return toSentenceCase(node);
  }
  return node;
}
