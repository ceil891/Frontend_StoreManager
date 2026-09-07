/**
 * src/shared/utils/validators.ts
 * Validation Utilities for RetailHub (Vietnamese Phone, RFC Email, Customer Data)
 */

/**
 * Regex kiểm tra SĐT Việt Nam: Bắt đầu bằng 0 hoặc +84, từ 9 đến 11 chữ số (di động hoặc cố định)
 */
export const VN_PHONE_REGEX = /^(\+84|0)[0-9]{9,10}$/;

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

  // 1. Kiểm tra Họ & Tên (chấp nhận chữ cái, số, khoảng trắng và các ký tự thường dùng trong tên doanh nghiệp/cá nhân)
  const rawName = data.fullName !== undefined ? data.fullName : data.name;
  if (rawName !== undefined) {
    const cleanName = rawName.trim();
    if (!cleanName) {
      errors.name = 'Họ và tên khách hàng không được để trống';
    } else if (cleanName.length < 2) {
      errors.name = 'Họ và tên phải có tối thiểu 2 ký tự';
    } else if (!/^[a-zA-Z0-9À-ỹ\s'.,()&/#-]+$/u.test(cleanName)) {
      errors.name = 'Họ và tên chứa ký tự không hợp lệ';
    }
  }

  // 2. Kiểm tra Số điện thoại
  if (data.phone !== undefined) {
    const cleanPhone = data.phone.trim().replace(/[\s\-.()]/g, '');
    if (!cleanPhone) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (!VN_PHONE_REGEX.test(cleanPhone)) {
      errors.phone = 'SĐT không hợp lệ (Bắt đầu bằng 0 hoặc +84, từ 10 chữ số)';
    }
  }

  // 3. Kiểm tra Email (chỉ kiểm tra nếu có nhập dữ liệu)
  if (data.email && data.email.trim() !== '') {
    if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = 'Email không đúng định dạng chuẩn (VD: nguyenvana@gmail.com)';
    }
  }

  // 4. Kiểm tra Ngày sinh (không được ở tương lai)
  if (data.dateOfBirth && data.dateOfBirth.trim() !== '') {
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
