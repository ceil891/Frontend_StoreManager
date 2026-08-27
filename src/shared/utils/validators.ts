/**
 * src/shared/utils/validators.ts
 * Validation Utilities for RetailHub (Vietnamese Phone, RFC Email, Customer Data)
 */

/**
 * Regex kiểm tra SĐT Việt Nam: Đúng 10 chữ số, bắt đầu bằng các đầu số nhà mạng 03, 05, 07, 08, 09
 */
export const VN_PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;

/**
 * Regex kiểm tra Email theo tiêu chuẩn RFC 5322 cơ bản
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface CustomerValidationInput {
  fullName?: string;
  name?: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
}

export const validateCustomerForm = (data: CustomerValidationInput) => {
  const errors: Record<string, string> = {};

  // 1. Kiểm tra Họ & Tên
  const rawName = data.fullName !== undefined ? data.fullName : data.name;
  if (rawName !== undefined) {
    const cleanName = rawName.trim();
    if (!cleanName) {
      errors.name = 'Họ và tên khách hàng không được để trống';
    } else if (cleanName.length < 2) {
      errors.name = 'Họ và tên phải có tối thiểu 2 ký tự';
    } else if (!/^[a-zA-ZÀ-ỹ\s'.-]+$/u.test(cleanName)) {
      errors.name = 'Họ và tên không được chứa chữ số hoặc ký tự đặc biệt';
    }
  }

  // 2. Kiểm tra Số điện thoại
  if (data.phone !== undefined) {
    const cleanPhone = data.phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (!VN_PHONE_REGEX.test(cleanPhone)) {
      errors.phone = 'SĐT không hợp lệ (Bắt buộc 10 số, bắt đầu bằng 03, 05, 07, 08, 09)';
    }
  }

  // 3. Kiểm tra Email (nếu có nhập)
  if (data.email && data.email.trim() !== '') {
    if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = 'Email không đúng định dạng chuẩn (VD: nguyenvana@gmail.com)';
    }
  }

  // 4. Kiểm tra Ngày sinh (không được ở tương lai)
  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    const today = new Date();
    if (dob > today) {
      errors.dateOfBirth = 'Ngày sinh không thể lớn hơn ngày hiện tại';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
