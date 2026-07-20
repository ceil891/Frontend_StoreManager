/** Trích danh sách từ response phân trang Spring (PageResponse) hoặc mảng thuần. */
export function extractPageContent<T = unknown>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'content' in data) {
    const content = (data as { content?: unknown }).content;
    return Array.isArray(content) ? (content as T[]) : [];
  }
  return [];
}

/** Chuẩn hóa số điện thoại VN (10–11 chữ số) cho backend. */
export function normalizeVnPhone(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 11) return `0${digits.slice(2)}`;
  return digits.slice(0, 11);
}

/** Tạo FormData từ object — bỏ qua null/undefined/chuỗi rỗng. */
export function toFormData(values: Record<string, unknown>): FormData {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (value instanceof Blob) {
      form.append(key, value);
    } else {
      form.append(key, String(value));
    }
  });
  return form;
}

export const multipartHeaders = { 'Content-Type': 'multipart/form-data' } as const;
