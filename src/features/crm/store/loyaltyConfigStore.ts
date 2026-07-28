import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LoyaltyConfig {
  enabled: boolean;
  earnRateAmount: number;       // Số tiền (VNĐ) chi tiêu để tích 1 điểm (mặc định: 1.000 VNĐ = 1 điểm)
  redeemRateValue: number;      // Giá trị giảm giá (VNĐ) của 1 điểm khi tiêu (mặc định: 1 điểm = 100 VNĐ)
  maxDiscountPercent: number;   // % Giảm giá tối đa bằng điểm cho 1 đơn hàng (mặc định: 50%)
  minPointsToRedeem: number;    // Số điểm tối thiểu để bắt đầu đổi (mặc định: 10 điểm)
  pointExpiryDays: number;      // Hạn sử dụng điểm (mặc định: 365 ngày)
}

interface LoyaltyConfigState {
  config: LoyaltyConfig;
  updateConfig: (newConfig: Partial<LoyaltyConfig>) => void;
}

const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: true,
  earnRateAmount: 1000,
  redeemRateValue: 100,
  maxDiscountPercent: 50,
  minPointsToRedeem: 10,
  pointExpiryDays: 365,
};

export const useLoyaltyConfigStore = create<LoyaltyConfigState>()(
  persist(
    (set) => ({
      config: DEFAULT_LOYALTY_CONFIG,
      updateConfig: (newConfig) =>
        set((state) => ({
          config: { ...state.config, ...newConfig },
        })),
    }),
    {
      name: 'retailhub-loyalty-config-storage',
    }
  )
);
