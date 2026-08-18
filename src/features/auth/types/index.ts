// ============================================================
// LAYER 1: TYPES / DATA CONTRACT
// Đây là "bản hợp đồng" dữ liệu giữa Frontend và Backend.
// Khi API thật có, chỉ cần update types tại đây, không cần
// sửa UI hay Business Logic.
// ============================================================

export type RoleType =
  | 'SUPER_ADMIN'
  | 'STORE_MANAGER'
  | 'INVENTORY_STAFF'
  | 'STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  branchId?: string | null;
  branchCode?: string | null;
  branchName?: string | null;
  avatar: string;
  /** Danh sách permissionCode thực từ backend (được load sau khi login) */
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Exact shape of the API response — đây là cái backend sẽ trả về
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Error shape from API
export interface ApiError {
  code: string;   // e.g. 'INVALID_CREDENTIALS', 'ACCOUNT_LOCKED'
  message: string;
}
