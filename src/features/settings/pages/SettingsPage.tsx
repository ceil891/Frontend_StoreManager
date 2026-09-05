import { useState } from 'react';
import { Save, Building2, MapPin, Phone, Mail, Globe, Coins, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export interface EnterpriseBranchConfig {
  branchName: string;
  branchCode: string;
  registrationNumber: string;
  vatTaxNumber: string;
  primaryContactPhone: string;
  supportEmail: string;
  headquartersAddress: string;
  operatingCurrency: string;
  timezone: string;
  fiscalYearStartMonth: string;
  maxDailyCashDropLimitVnd: number;
  autoBatchSettlementHour: string;
}

export const INITIAL_CONFIG: EnterpriseBranchConfig = {
  branchName: 'Chi nhánh Trung tâm RetailHub Plaza',
  branchCode: 'RH-FLAGSHIP-001',
  registrationNumber: '0316892345',
  vatTaxNumber: '0316892345-001',
  primaryContactPhone: '1900 6868',
  supportEmail: 'hotro@retailhub.vn',
  headquartersAddress: 'Tòa nhà RetailHub, 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
  operatingCurrency: 'VND (₫)',
  timezone: 'Asia/Ho_Chi_Minh (GMT+7)',
  fiscalYearStartMonth: 'Tháng 1 (Bắt đầu Q1)',
  maxDailyCashDropLimitVnd: 50000000,
  autoBatchSettlementHour: '23:30 (Chốt sổ cuối ngày)',
};

export function SettingsPage() {
  const [config, setConfig] = useState<EnterpriseBranchConfig>(() => {
    try {
      const saved = localStorage.getItem('retailhub_enterprise_config');
      if (saved) {
        return { ...INITIAL_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to parse saved enterprise config', e);
    }
    return INITIAL_CONFIG;
  });

  const handleChange = (field: keyof EnterpriseBranchConfig, val: string | number) => {
    setConfig(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('retailhub_enterprise_config', JSON.stringify(config));
      toast.success('Đã lưu cấu hình chi nhánh và tham số vận hành thành công!');
    } catch {
      toast.error('Không thể lưu cấu hình.');
    }
  };

  const handleReset = () => {
    setConfig(INITIAL_CONFIG);
    localStorage.removeItem('retailhub_enterprise_config');
    toast.info('Đã khôi phục cài đặt mặc định chuẩn Việt Nam.');
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cấu hình Chi nhánh & Tham số Vận hành</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập hồ sơ pháp lý chi nhánh, thông tin in hóa đơn bán lẻ POS, cấu hình tiền tệ và múi giờ vận hành.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" /> Đặt lại mặc định
          </button>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-8">
        {/* Branch Profile Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" /> Hồ sơ Pháp nhân & Chi nhánh Cửa hàng
              </h3>
              <p className="text-xs text-gray-500 mt-1">Thông tin pháp lý chính thức, mã số thuế và thông tin liên lạc phục vụ in hóa đơn bán lẻ POS.</p>
            </div>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono font-bold text-xs rounded">
              MÃ KHO/CHI NHÁNH: {config.branchCode}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Tên chi nhánh / Đơn vị kinh doanh (In trên hóa đơn)
              </label>
              <input
                type="text"
                value={config.branchName}
                onChange={(e) => handleChange('branchName', e.target.value)}
                placeholder="Ví dụ: Chi nhánh Trung tâm RetailHub"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm font-semibold transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Mã chi nhánh hệ thống
              </label>
              <input
                type="text"
                value={config.branchCode}
                disabled
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-900/60 text-gray-500 sm:text-sm font-mono font-bold cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Số ĐKKD / Giấy phép kinh doanh
              </label>
              <input
                type="text"
                value={config.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                placeholder="Ví dụ: 0316892345"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Mã số thuế VAT / Tax ID (In trên hóa đơn)
              </label>
              <input
                type="text"
                value={config.vatTaxNumber}
                onChange={(e) => handleChange('vatTaxNumber', e.target.value)}
                placeholder="Ví dụ: 0316892345-001"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> Địa chỉ trụ sở / Chi nhánh (In trên hóa đơn)
              </label>
              <input
                type="text"
                value={config.headquartersAddress}
                onChange={(e) => handleChange('headquartersAddress', e.target.value)}
                placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> Hotline liên hệ chính (In trên hóa đơn)
              </label>
              <input
                type="text"
                value={config.primaryContactPhone}
                onChange={(e) => handleChange('primaryContactPhone', e.target.value)}
                placeholder="Ví dụ: 1900 6868 hoặc 0987 654 321"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> Email hỗ trợ vận hành & CSKH
              </label>
              <input
                type="text"
                value={config.supportEmail}
                onChange={(e) => handleChange('supportEmail', e.target.value)}
                placeholder="hotro@retailhub.vn"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        </div>

        {/* Operating Parameters Section */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-emerald-600" /> Tham số Vận hành & Mặc định Tài chính
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Định dạng tiền tệ hoạt động (Currency)
              </label>
              <select
                value={config.operatingCurrency}
                onChange={(e) => handleChange('operatingCurrency', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-bold"
              >
                <option value="VND (₫)">VND (₫) - Đồng Việt Nam (Mặc định)</option>
                <option value="USD ($)">USD ($) - Đô la Mỹ</option>
                <option value="EUR (€)">EUR (€) - Đồng Euro</option>
                <option value="JPY (¥)">JPY (¥) - Yên Nhật</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Múi giờ hệ thống (Timezone Offset Base)
              </label>
              <select
                value={config.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-bold"
              >
                <option value="Asia/Ho_Chi_Minh (GMT+7)">Asia/Ho_Chi_Minh (GMT+7) - Việt Nam (Mặc định)</option>
                <option value="Asia/Bangkok (GMT+7)">Asia/Bangkok (GMT+7) - Thái Lan</option>
                <option value="Asia/Singapore (GMT+8)">Asia/Singapore (GMT+8) - Singapore</option>
                <option value="Asia/Tokyo (GMT+9)">Asia/Tokyo (GMT+9) - Nhật Bản</option>
                <option value="America/New_York (EST/EDT)">America/New_York (EST/EDT) - Mỹ</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-600" /> Hạn mức tiền mặt lưu két tối đa (VNĐ)
              </label>
              <input
                type="number"
                step="1000000"
                value={config.maxDailyCashDropLimitVnd}
                onChange={(e) => handleChange('maxDailyCashDropLimitVnd', parseFloat(e.target.value) || 0)}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono font-bold sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                * Cảnh báo thu ngân nộp bớt tiền về quỹ chính khi tiền mặt tại két quầy POS vượt hạn mức này.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Giờ tự động kết ca / Chốt sổ ngày
              </label>
              <input
                type="text"
                value={config.autoBatchSettlementHour}
                onChange={(e) => handleChange('autoBatchSettlementHour', e.target.value)}
                placeholder="23:30 (Chốt sổ cuối ngày)"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                * Thời điểm hệ thống tự động tổng hợp báo cáo doanh thu và chốt phiên làm việc trong ngày.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            Lưu cấu hình chi nhánh & Tham số
          </button>
        </div>
      </div>
    </div>
  );
}
