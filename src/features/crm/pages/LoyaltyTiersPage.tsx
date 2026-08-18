import { useState, useEffect } from 'react';
import {
  Crown, Diamond, Award, Star, Users, TrendingUp, Gift, Edit,
  Percent, Zap, Headphones, Shield, BadgeCheck, ChevronRight, Plus, Trash2,
} from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';

// ─── Types ───────────────────────────────────────────────────────────────────
type TierKey = string;

interface TierBenefit {
  icon: string | React.ReactNode;
  text: string;
}

const RenderBenefitIcon = ({ icon, className }: { icon: any; className?: string }) => {
  if (icon && typeof icon === 'object' && (icon as any).$$typeof) {
    return icon;
  }
  const typeStr = typeof icon === 'string' ? icon.toLowerCase() : '';
  if (typeStr.includes('percent')) return <Percent className={className || "w-3.5 h-3.5"} />;
  if (typeStr.includes('gift')) return <Gift className={className || "w-3.5 h-3.5"} />;
  if (typeStr.includes('shield')) return <Shield className={className || "w-3.5 h-3.5"} />;
  if (typeStr.includes('headphones')) return <Headphones className={className || "w-3.5 h-3.5"} />;
  if (typeStr.includes('crown')) return <Crown className={className || "w-3.5 h-3.5"} />;
  if (typeStr.includes('badge')) return <BadgeCheck className={className || "w-3.5 h-3.5"} />;
  return <Zap className={className || "w-3.5 h-3.5"} />;
};

interface LoyaltyTier {
  key: TierKey;
  name: string;
  nameEn: string;
  minSpend: number;
  maxSpend: number | null;
  pointRate: number;
  discountPct: number;
  customerCount: number;
  benefits: TierBenefit[];
  gradient: string;
  border: string;
  badge: string;
  iconColor: string;
  textAccent: string;
  bgCard: string;
  progressColor: string;
}

// ─── Mock initial data ────────────────────────────────────────────────────────
const INITIAL_TIERS: LoyaltyTier[] = [
  {
    key: 'BRONZE',
    name: 'Đồng',
    nameEn: 'Bronze',
    minSpend: 0,
    maxSpend: 1999999,
    pointRate: 1,
    discountPct: 0,
    customerCount: 128,
    gradient: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20',
    border: 'border-orange-200 dark:border-orange-800/50',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    iconColor: 'text-orange-500',
    textAccent: 'text-orange-600 dark:text-orange-400',
    bgCard: 'bg-orange-500',
    progressColor: 'bg-orange-400',
    benefits: [
      { icon: 'zap', text: 'Tích 1 điểm / 100.000đ chi tiêu' },
      { icon: 'gift', text: 'Quà sinh nhật cơ bản' },
      { icon: 'badge', text: 'Xem lịch sử đơn hàng' },
    ],
  },
  {
    key: 'SILVER',
    name: 'Bạc',
    nameEn: 'Silver',
    minSpend: 2000000,
    maxSpend: 9999999,
    pointRate: 2,
    discountPct: 3,
    customerCount: 85,
    gradient: 'from-slate-50 to-gray-100 dark:from-slate-900/40 dark:to-gray-900/30',
    border: 'border-slate-300 dark:border-slate-600/50',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    iconColor: 'text-slate-500',
    textAccent: 'text-slate-600 dark:text-slate-300',
    bgCard: 'bg-slate-500',
    progressColor: 'bg-slate-400',
    benefits: [
      { icon: 'zap', text: 'Tích 2 điểm / 100.000đ chi tiêu' },
      { icon: 'percent', text: 'Giảm 3% mọi đơn hàng' },
      { icon: 'gift', text: 'Quà sinh nhật nâng cấp' },
      { icon: 'shield', text: 'Bảo hành ưu tiên +3 tháng' },
    ],
  },
  {
    key: 'GOLD',
    name: 'Vàng',
    nameEn: 'Gold',
    minSpend: 10000000,
    maxSpend: 49999999,
    pointRate: 3,
    discountPct: 7,
    customerCount: 47,
    gradient: 'from-yellow-50 to-amber-100 dark:from-yellow-950/40 dark:to-amber-950/30',
    border: 'border-yellow-300 dark:border-yellow-700/50',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    iconColor: 'text-yellow-500',
    textAccent: 'text-yellow-600 dark:text-yellow-400',
    bgCard: 'bg-yellow-500',
    progressColor: 'bg-yellow-400',
    benefits: [
      { icon: 'zap', text: 'Tích 3 điểm / 100.000đ chi tiêu' },
      { icon: 'percent', text: 'Giảm 7% mọi đơn hàng' },
      { icon: 'headphones', text: 'Hỗ trợ ưu tiên 24/7' },
      { icon: 'gift', text: 'Quà tặng cao cấp hàng quý' },
      { icon: 'shield', text: 'Bảo hành ưu tiên +6 tháng' },
    ],
  },
  {
    key: 'DIAMOND',
    name: 'Kim Cương',
    nameEn: 'Diamond',
    minSpend: 50000000,
    maxSpend: null,
    pointRate: 5,
    discountPct: 15,
    customerCount: 12,
    gradient: 'from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/30',
    border: 'border-blue-300 dark:border-blue-700/50',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    iconColor: 'text-blue-500',
    textAccent: 'text-blue-600 dark:text-blue-400',
    bgCard: 'bg-blue-600',
    progressColor: 'bg-blue-500',
    benefits: [
      { icon: 'zap', text: 'Tích 5 điểm / 100.000đ chi tiêu' },
      { icon: 'percent', text: 'Giảm 15% mọi đơn hàng' },
      { icon: 'headphones', text: 'Quản lý tài khoản riêng' },
      { icon: 'crown', text: 'Sự kiện VIP độc quyền' },
      { icon: 'gift', text: 'Voucher cao cấp hàng tháng' },
      { icon: 'shield', text: 'Bảo hành trọn đời ưu tiên' },
    ],
  },
];

// ─── Tier icon map ────────────────────────────────────────────────────────────
const TierIcon = ({ tier, className }: { tier: TierKey; className?: string }) => {
  if (tier === 'DIAMOND') return <Diamond className={className} />;
  if (tier === 'GOLD')    return <Crown className={className} />;
  if (tier === 'SILVER')  return <Award className={className} />;
  return <Star className={className} />;
};

// ─── Edit Modal Form State ────────────────────────────────────────────────────
interface EditForm {
  name: string;
  nameEn: string;
  minSpend: number;
  maxSpend: number | null;
  pointRate: number;
  discountPct: number;
  customerCount: number;
}

const TIER_THEMES = [
  {
    gradient: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20',
    border: 'border-orange-200 dark:border-orange-800/50',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
    iconColor: 'text-orange-500',
    textAccent: 'text-orange-600 dark:text-orange-400',
    bgCard: 'bg-orange-500',
    progressColor: 'bg-orange-400',
  },
  {
    gradient: 'from-slate-50 to-gray-100 dark:from-slate-900/40 dark:to-gray-900/30',
    border: 'border-slate-300 dark:border-slate-600/50',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    iconColor: 'text-slate-500',
    textAccent: 'text-slate-600 dark:text-slate-300',
    bgCard: 'bg-slate-500',
    progressColor: 'bg-slate-400',
  },
  {
    gradient: 'from-yellow-50 to-amber-100 dark:from-yellow-950/40 dark:to-amber-950/30',
    border: 'border-yellow-300 dark:border-yellow-700/50',
    badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    iconColor: 'text-yellow-500',
    textAccent: 'text-yellow-600 dark:text-yellow-400',
    bgCard: 'bg-yellow-500',
    progressColor: 'bg-yellow-400',
  },
  {
    gradient: 'from-blue-50 to-indigo-100 dark:from-blue-950/40 dark:to-indigo-950/30',
    border: 'border-blue-300 dark:border-blue-700/50',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    iconColor: 'text-blue-500',
    textAccent: 'text-blue-600 dark:text-blue-400',
    bgCard: 'bg-blue-600',
    progressColor: 'bg-blue-500',
  },
];

import { useLoyaltyConfigStore } from '../store/loyaltyConfigStore';
import { useCrmStore } from '../store/crmStore';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
export function LoyaltyTiersPage() {
  const { config, updateConfig } = useLoyaltyConfigStore();
  const { customers, fetchCustomers, fetchLoyaltyTiers, addLoyaltyTier, updateLoyaltyTier, deleteLoyaltyTier } = useCrmStore();
  const [localConfig, setLocalConfig] = useState(config);
  const [isConfigSaving, setIsConfigSaving] = useState(false);

  const handleSaveLoyaltyConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigSaving(true);
    updateConfig(localConfig);
    setTimeout(() => {
      setIsConfigSaving(false);
      toast.success('Đã cập nhật cấu hình quy tắc tích & đổi điểm thành công!');
    }, 400);
  };

  const [tiers, setTiers] = useState<LoyaltyTier[]>(() => {
    try {
      const saved = localStorage.getItem('retailhub-loyalty-tiers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((t: any) => ({
            ...t,
            benefits: Array.isArray(t.benefits)
              ? t.benefits.map((b: any) => ({
                  ...b,
                  icon: typeof b.icon === 'string' ? b.icon : 'zap',
                }))
              : [],
          }));
        }
      }
    } catch {
      localStorage.removeItem('retailhub-loyalty-tiers');
    }
    return INITIAL_TIERS;
  });

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchLoyaltyTiers().then((apiTiers) => {
      if (apiTiers && apiTiers.length > 0) {
        const mapped = apiTiers.map((t: any, idx: number) => {
          const theme = TIER_THEMES[idx % TIER_THEMES.length];
          return {
            key: String(t.tierCode || t.id || `TIER_${idx}`),
            name: t.tierName || t.name || 'Hạng',
            nameEn: t.tierCode || 'Tier',
            minSpend: Number(t.minSpend || 0),
            maxSpend: t.maxSpend ? Number(t.maxSpend) : null,
            pointRate: Number(t.pointMultiplier || 1),
            discountPct: Number(t.discountPercent || 0),
            customerCount: 0,
            benefits: [
              { icon: 'zap', text: `Tích ${t.pointMultiplier || 1} điểm / 100.000đ chi tiêu` },
              { icon: 'percent', text: `Giảm ${t.discountPercent || 0}% mọi đơn hàng` },
            ],
            ...theme,
          };
        });
        setTiers(mapped);
      }
    });
  }, [fetchLoyaltyTiers]);

  useEffect(() => {
    try {
      localStorage.setItem('retailhub-loyalty-tiers', JSON.stringify(tiers));
    } catch (e) {
      console.error('Failed to save loyalty tiers to localStorage', e);
    }
  }, [tiers]);

  const countCustomersForTier = (tier: LoyaltyTier) => {
    const key = (tier.key || '').toUpperCase();
    const name = (tier.name || '').toUpperCase();
    return customers.filter((c) => {
      const rank = ((c.loyaltyTier as string) || (c as any).membershipRank || '').toUpperCase();
      if ((key === 'DIAMOND' || name.includes('KIM CƯƠNG')) && (rank.includes('DIAMOND') || rank.includes('KIM CƯƠNG'))) return true;
      if ((key === 'PLATINUM' || key === 'ELITE_CLUB' || name.includes('BẠCH KIM')) && (rank.includes('PLATINUM') || rank.includes('BẠCH KIM') || rank.includes('ELITE'))) return true;
      if ((key === 'GOLD' || name.includes('VÀNG')) && (rank.includes('GOLD') || rank.includes('VÀNG'))) return true;
      if ((key === 'SILVER' || name.includes('BẠC')) && (rank.includes('SILVER') || rank.includes('BẠC'))) return true;
      if ((key === 'BRONZE' || name.includes('ĐỒNG')) && (rank.includes('BRONZE') || rank.includes('ĐỒNG') || rank === '')) return true;
      if ((key === 'NEW' || name.includes('MỚI')) && (rank.includes('NEW') || rank.includes('MỚI'))) return true;
      return rank.includes(name) || rank.includes(key);
    }).length;
  };

  const dynamicTiers = tiers.map((t) => ({
    ...t,
    customerCount: countCustomersForTier(t),
  }));

  const totalCustomers = customers.length > 0 ? customers.length : dynamicTiers.reduce((acc, t) => acc + t.customerCount, 0);

  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [deletingTier, setDeletingTier] = useState<LoyaltyTier | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    nameEn: '',
    minSpend: 0,
    maxSpend: null,
    pointRate: 1,
    discountPct: 0,
    customerCount: 0,
  });

  const handleOpenEdit = (tier: LoyaltyTier) => {
    setEditingTier(tier);
    setEditForm({
      name: tier.name,
      nameEn: tier.nameEn,
      minSpend: tier.minSpend,
      maxSpend: tier.maxSpend,
      pointRate: tier.pointRate,
      discountPct: tier.discountPct,
      customerCount: tier.customerCount,
    });
  };

  const openCreateModal = () => {
    setEditingTier(null);
    setEditForm({
      name: '',
      nameEn: '',
      minSpend: 0,
      maxSpend: null,
      pointRate: 1,
      discountPct: 0,
      customerCount: 0,
    });
    setIsCreateOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedName = editForm.name.trim();
    const normalizedNameEn = editForm.nameEn.trim();
    if (!normalizedName || !normalizedNameEn) return;

    if (editingTier) {
      setTiers((prev) =>
        prev.map((t) =>
          t.key === editingTier.key
            ? {
                ...t,
                name: normalizedName,
                nameEn: normalizedNameEn,
                minSpend: editForm.minSpend,
                maxSpend: editForm.maxSpend,
                pointRate: editForm.pointRate,
                discountPct: editForm.discountPct,
                customerCount: editForm.customerCount,
              }
            : t
        )
      );
      setEditingTier(null);
      return;
    }

    const theme = TIER_THEMES[tiers.length % TIER_THEMES.length];
    const newTier: LoyaltyTier = {
      key: `CUSTOM_${Date.now()}`,
      name: normalizedName,
      nameEn: normalizedNameEn,
      minSpend: editForm.minSpend,
      maxSpend: editForm.maxSpend,
      pointRate: editForm.pointRate,
      discountPct: editForm.discountPct,
      customerCount: editForm.customerCount,
      benefits: [
        { icon: <Zap className="w-3.5 h-3.5" />, text: `Tích ${editForm.pointRate} điểm / $1 chi tiêu` },
        { icon: <Percent className="w-3.5 h-3.5" />, text: `Giảm ${editForm.discountPct}% mỗi đơn hàng` },
      ],
      ...theme,
    };
    setTiers((prev) => [newTier, ...prev]);
    setIsCreateOpen(false);
  };

  const handleDeleteTier = () => {
    if (!deletingTier) return;
    setTiers((prev) => prev.filter((tier) => tier.key !== deletingTier.key));
    setDeletingTier(null);
  };

  return (
    <>
      <div className="space-y-8">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow">
                <Crown className="w-5 h-5 text-white" />
              </div>
              Quản lý hạng thành viên
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
              Cấu hình ngưỡng chi tiêu, quyền lợi và tỷ lệ tích điểm cho từng hạng thành viên.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-sm">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Tổng khách hàng:</span>
            <span className="font-bold text-gray-900 dark:text-white">{totalCustomers}</span>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo hạng thành viên
          </button>
        </div>

        {/* ── ⚙️ Point Configuration Card ─────────────────────────────────────── */}
        <form onSubmit={handleSaveLoyaltyConfig} className="bg-white dark:bg-gray-800 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                ⚙️
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Cấu Hình Quy Tắc Tích & Đổi Điểm POS/CRM</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Thiết lập tỷ lệ quy đổi số tiền chi tiêu ra điểm thưởng và giá trị giảm giá khi tiêu điểm.</p>
              </div>
            </div>
            <button
              type="submit"
              disabled={isConfigSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition-all active:scale-95 disabled:opacity-50"
            >
              {isConfigSaving ? 'Đang lưu...' : '✓ Lưu cấu hình điểm'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Chi tiêu tích 1 điểm (VNĐ)
              </label>
              <input
                type="number"
                min={100}
                step={100}
                value={localConfig.earnRateAmount}
                onChange={(e) => setLocalConfig({ ...localConfig, earnRateAmount: Math.max(100, Number(e.target.value)) })}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                Khách mua {localConfig.earnRateAmount.toLocaleString('vi-VN')}đ = +1 điểm
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Giá trị giảm giá của 1 điểm (VNĐ)
              </label>
              <input
                type="number"
                min={1}
                step={10}
                value={localConfig.redeemRateValue}
                onChange={(e) => setLocalConfig({ ...localConfig, redeemRateValue: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                1 điểm = {localConfig.redeemRateValue.toLocaleString('vi-VN')}đ giảm vào hóa đơn
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Giảm tối đa bằng điểm (% hóa đơn)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={localConfig.maxDiscountPercent}
                onChange={(e) => setLocalConfig({ ...localConfig, maxDiscountPercent: Math.min(100, Math.max(1, Number(e.target.value))) })}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                Được trừ tối đa {localConfig.maxDiscountPercent}% giá trị hóa đơn
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/30 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Hạn sử dụng điểm (Ngày)
              </label>
              <input
                type="number"
                min={30}
                value={localConfig.pointExpiryDays}
                onChange={(e) => setLocalConfig({ ...localConfig, pointExpiryDays: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Điểm hết hạn sau {localConfig.pointExpiryDays} ngày
              </p>
            </div>
          </div>
        </form>

        {/* ── Summary bar ──────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Phân bổ khách hàng theo hạng</h2>
          </div>

          {/* Stacked horizontal bar */}
          <div className="flex rounded-full overflow-hidden h-4 mb-4 gap-0.5">
            {dynamicTiers.map(t => (
              <div
                key={t.key}
                title={`${t.name}: ${t.customerCount} KH`}
                className={`${t.progressColor} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${totalCustomers ? (t.customerCount / totalCustomers) * 100 : 0}%` }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dynamicTiers.map(t => (
              <div key={t.key} className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${t.progressColor}`} />
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t.customerCount} KH ({totalCustomers ? Math.round((t.customerCount / totalCustomers) * 100) : 0}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tier Cards grid ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {dynamicTiers.map((tier) => (
            <TierCard
              key={tier.key}
              tier={tier}
              totalCustomers={totalCustomers}
              onEdit={() => handleOpenEdit(tier)}
              onDelete={() => setDeletingTier(tier)}
            />
          ))}
        </div>
      </div>

      {/* ── Edit Modal ────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={!!editingTier}
        onClose={() => setEditingTier(null)}
        title={`Chỉnh sửa hạng thành viên - ${editingTier?.name}`}
        width="max-w-md"
      >
        {editingTier && (
          <form onSubmit={handleSaveTier} className="space-y-5">
            {/* Tier badge preview */}
            <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${editingTier.gradient} border ${editingTier.border}`}>
              <div className={`w-10 h-10 rounded-lg ${editingTier.bgCard} flex items-center justify-center shadow`}>
                <TierIcon tier={editingTier.key} className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">Hạng {editingTier.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{editingTier.customerCount} khách hàng đang ở hạng này</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên hạng
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Tên tiếng Anh
                </label>
                <input
                  type="text"
                  value={editForm.nameEn}
                  onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Ngưỡng chi tiêu tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                step={100000}
                value={editForm.minSpend}
                onChange={(e) => setEditForm({ ...editForm, minSpend: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Ngưỡng chi tiêu tối đa (VNĐ)
                <span className="ml-1 font-normal text-gray-400">(để trống = không giới hạn)</span>
              </label>
              <input
                type="number"
                min={0}
                step={100000}
                value={editForm.maxSpend ?? ''}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  setEditForm({ ...editForm, maxSpend: raw === '' ? null : parseFloat(raw) || 0 });
                }}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tỷ lệ tích điểm
                <span className="ml-1 font-normal text-gray-400">(điểm / 100.000đ chi tiêu)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={editForm.pointRate}
                  onChange={(e) => setEditForm({ ...editForm, pointRate: parseInt(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <div className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-mono font-bold text-primary text-sm bg-primary/5">
                  x{editForm.pointRate}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Mỗi 100.000đ chi tiêu tích được {editForm.pointRate} điểm</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tỷ lệ giảm giá (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={editForm.discountPct}
                  onChange={(e) => setEditForm({ ...editForm, discountPct: parseInt(e.target.value) })}
                  className="flex-1 accent-primary"
                />
                <div className="w-16 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center font-mono font-bold text-emerald-600 text-sm bg-emerald-50 dark:bg-emerald-900/20">
                  {editForm.discountPct}%
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Giảm {editForm.discountPct}% trên tổng giá trị mỗi đơn hàng</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Số khách hàng hiện có
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={editForm.customerCount}
                onChange={(e) => setEditForm({ ...editForm, customerCount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setEditingTier(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Create Modal ──────────────────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo hạng thành viên mới"
        width="max-w-md"
      >
        <form onSubmit={handleSaveTier} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tên hạng
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Tên tiếng Anh
              </label>
              <input
                type="text"
                value={editForm.nameEn}
                onChange={(e) => setEditForm({ ...editForm, nameEn: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Chi tiêu tối thiểu (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                step={100000}
                value={editForm.minSpend}
                onChange={(e) => setEditForm({ ...editForm, minSpend: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Chi tiêu tối đa (VNĐ)
              </label>
              <input
                type="number"
                min={0}
                step={100000}
                value={editForm.maxSpend ?? ''}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  setEditForm({ ...editForm, maxSpend: raw === '' ? null : parseInt(raw, 10) || 0 });
                }}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Không giới hạn"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Điểm/100kđ</label>
              <input
                type="number"
                min={1}
                max={10}
                step={1}
                value={editForm.pointRate}
                onChange={(e) => setEditForm({ ...editForm, pointRate: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Giảm giá (%)</label>
              <input
                type="number"
                min={0}
                max={30}
                step={1}
                value={editForm.discountPct}
                onChange={(e) => setEditForm({ ...editForm, discountPct: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Số khách hàng</label>
              <input
                type="number"
                min={0}
                step={1}
                value={editForm.customerCount}
                onChange={(e) => setEditForm({ ...editForm, customerCount: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Tạo hạng
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation ──────────────────────────────────────────────── */}
      <Modal
        isOpen={!!deletingTier}
        onClose={() => setDeletingTier(null)}
        title="Xóa hạng thành viên"
        width="max-w-md"
      >
        {deletingTier && (
          <div className="space-y-5">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bạn chắc chắn muốn xóa hạng <span className="font-semibold">{deletingTier.name}</span>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setDeletingTier(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteTier}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
              >
                Xóa hạng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─── TierCard sub-component ───────────────────────────────────────────────────
interface TierCardProps {
  tier: LoyaltyTier;
  totalCustomers: number;
  onEdit: () => void;
  onDelete: () => void;
}

function TierCard({ tier, totalCustomers, onEdit, onDelete }: TierCardProps) {
  const pct = totalCustomers ? Math.round((tier.customerCount / totalCustomers) * 100) : 0;

  return (
    <div className={`relative flex flex-col rounded-2xl border ${tier.border} bg-gradient-to-br ${tier.gradient} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}>
      {/* Decorative background circle */}
      <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10 ${tier.bgCard}`} />

      {/* Card header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${tier.bgCard} flex items-center justify-center shadow-md`}>
            <TierIcon tier={tier.key} className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${tier.badge}`}>
            {tier.nameEn}
          </span>
        </div>

        <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
          {tier.name.startsWith('Hạng') || tier.name.startsWith('Thành viên') ? tier.name : `Hạng ${tier.name}`}
        </h3>

        {/* Spend range */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
          <ChevronRight className={`w-3 h-3 ${tier.iconColor}`} />
          {tier.minSpend === 0
            ? `Từ 0đ – ${tier.maxSpend ? tier.maxSpend.toLocaleString('vi-VN') + 'đ' : 'Không giới hạn'}`
            : tier.maxSpend === null
              ? `Từ ${tier.minSpend.toLocaleString('vi-VN')}đ trở lên`
              : `${tier.minSpend.toLocaleString('vi-VN')}đ – ${tier.maxSpend.toLocaleString('vi-VN')}đ`
          }
        </p>
      </div>

      {/* Stats row */}
      <div className="px-5 pb-4 grid grid-cols-2 gap-3">
        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3 text-center backdrop-blur-sm">
          <p className={`text-lg font-bold ${tier.textAccent}`}>x{tier.pointRate}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">điểm/100kđ</p>
        </div>
        <div className="bg-white/60 dark:bg-black/20 rounded-xl p-3 text-center backdrop-blur-sm">
          <p className={`text-lg font-bold ${tier.textAccent}`}>{tier.discountPct}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">giảm giá</p>
        </div>
      </div>

      {/* Benefits list */}
      <div className="px-5 pb-4 flex-1">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">Quyền lợi</p>
        <ul className="space-y-1.5">
          {tier.benefits.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              <div className={`flex-shrink-0 ${tier.textAccent}`}>
                <RenderBenefitIcon icon={b.icon} className="w-3.5 h-3.5" />
              </div>
              <span>{b.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer: customer count + edit */}
      <div className="px-5 pb-5 mt-auto">
        {/* Mini progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3" />
              <span>{tier.customerCount} khách hàng</span>
            </div>
            <span>{pct}% tổng</span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${tier.progressColor} rounded-full transition-all duration-700`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onEdit}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-90 active:scale-95 ${tier.badge} ${tier.border}`}
          >
            <Edit className="w-4 h-4" />
            Chỉnh sửa
          </button>
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-all active:scale-95 dark:bg-red-950/20 dark:border-red-800/50 dark:text-red-300 dark:hover:bg-red-900/30"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
