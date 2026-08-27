import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { toast } from 'sonner';

export function InventorySettingsPanel() {
  const { inventorySettings, setLowStockThreshold } = useSettingsStore();
  const [tempThreshold, setTempThreshold] = useState(inventorySettings.lowStockThreshold);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    if (tempThreshold < 0) {
      toast.error('Ngưỡng cảnh báo không thể âm');
      setTempThreshold(inventorySettings.lowStockThreshold);
      return;
    }
    setLowStockThreshold(tempThreshold);
    setIsSaved(true);
    toast.success(`Đã cập nhật ngưỡng cảnh báo tồn kho: ${tempThreshold}`);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleReset = () => {
    setTempThreshold(inventorySettings.lowStockThreshold);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
          <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cảnh báo tồn kho</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập ngưỡng tối thiểu để nhận cảnh báo khi tồn kho sắp hết
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Ngưỡng tồn kho thấp
          </label>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <input
                type="number"
                min="0"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 Nếu tồn kho ≤ {tempThreshold}, sẽ hiển thị cảnh báo <AlertTriangle className="w-3 h-3 inline text-red-600" />
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{tempThreshold}</span>
              <p className="text-xs text-gray-500">cái</p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Xem trước ví dụ hiển thị</p>
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg text-center ${tempThreshold >= 5 ? 'bg-red-50 border border-red-200' : 'bg-gray-100 border border-gray-200'}`}>
              <p className="text-2xl font-bold text-red-600">5</p>
              <p className="text-xs text-gray-600 mt-1">
                {tempThreshold >= 5 ? '⚠️ Cảnh báo' : '✓ Đạt yêu cầu'}
              </p>
            </div>
            <div className={`p-3 rounded-lg text-center ${tempThreshold >= 10 ? 'bg-red-50 border border-red-200' : 'bg-gray-100 border border-gray-200'}`}>
              <p className="text-2xl font-bold text-red-600">10</p>
              <p className="text-xs text-gray-600 mt-1">
                {tempThreshold >= 10 ? '⚠️ Cảnh báo' : '✓ Đạt yêu cầu'}
              </p>
            </div>
            <div className={`p-3 rounded-lg text-center ${tempThreshold >= 20 ? 'bg-red-50 border border-red-200' : 'bg-gray-100 border border-gray-200'}`}>
              <p className="text-2xl font-bold text-red-600">20</p>
              <p className="text-xs text-gray-600 mt-1">
                {tempThreshold >= 20 ? '⚠️ Cảnh báo' : '✓ Đạt yêu cầu'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleReset}
            disabled={tempThreshold === inventorySettings.lowStockThreshold}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            disabled={tempThreshold === inventorySettings.lowStockThreshold}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" /> Đã lưu
              </>
            ) : (
              'Lưu cài đặt'
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Lưu ý:</strong> Cài đặt này sẽ tác động tới toàn bộ hệ thống. Sản phẩm có tồn kho ≤ {tempThreshold} sẽ được cảnh báo màu đỏ trong danh mục hàng hóa.
        </p>
      </div>
    </div>
  );
}
