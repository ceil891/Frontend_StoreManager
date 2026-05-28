// ============================================================
// LAYER 2: SERVICE / MOCK API
// ============================================================

import type {
  LoginCredentials,
  LoginResponse,
  ApiError,
} from '../types';
import { buildUserAvatarUrl } from '@/shared/utils/userAvatar';

interface FakeUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: LoginResponse['user']['role'];
  branchId?: string | null;
  avatar: string;
  phone: string;
}

/** Đồng bộ với userStore (HR) — mỗi tài khoản đủ ảnh + chi nhánh. */
const FAKE_USERS: FakeUser[] = [
  {
    id: 'usr_001',
    name: 'Nguyễn Minh Quân',
    email: 'admin@system.com',
    passwordHash: '123456',
    role: 'SUPER_ADMIN',
    branchId: null,
    avatar: buildUserAvatarUrl('admin@system.com'),
    phone: '0901234567',
  },
  {
    id: 'usr_002',
    name: 'Trần Thị Lan',
    email: 'manager@store.com',
    passwordHash: '123456',
    role: 'STORE_MANAGER',
    branchId: 'BR-001',
    avatar: buildUserAvatarUrl('manager@store.com'),
    phone: '0912345678',
  },
  {
    id: 'usr_003',
    name: 'Lê Hoàng Nam',
    email: 'staff@store.com',
    passwordHash: '123456',
    role: 'STAFF',
    branchId: 'BR-001',
    avatar: buildUserAvatarUrl('staff@store.com'),
    phone: '0923456789',
  },
  {
    id: 'usr_004',
    name: 'Phạm Thu Hà',
    email: 'inventory@retailhub.vn',
    passwordHash: '123456',
    role: 'INVENTORY_STAFF',
    branchId: 'BR-002',
    avatar: buildUserAvatarUrl('inventory@retailhub.vn'),
    phone: '0934567890',
  },
];

function generateMockToken(userId: string, role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
    })
  );
  const signature = btoa(`mock_signature_${userId}`);
  return `${header}.${payload}.${signature}`;
}

function simulateDelay(ms = 1000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const mockAuthApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    await simulateDelay(1200);

    const user = FAKE_USERS.find(
      (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
    );

    if (!user) {
      const error: ApiError = {
        code: 'USER_NOT_FOUND',
        message: 'No account found with this email address.',
      };
      throw error;
    }

    if (user.passwordHash !== credentials.password) {
      const error: ApiError = {
        code: 'INVALID_CREDENTIALS',
        message: 'Incorrect password. Please try again.',
      };
      throw error;
    }

    return {
      accessToken: generateMockToken(user.id, user.role),
      refreshToken: generateMockToken(user.id + '_refresh', user.role),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        avatar: user.avatar,
      },
    };
  },

  async logout(): Promise<void> {
    await simulateDelay(300);
  },
};
