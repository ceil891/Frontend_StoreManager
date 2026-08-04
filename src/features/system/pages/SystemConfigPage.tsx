import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Settings, RefreshCw, Key, Cpu, Trash2, X, AlertTriangle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { useSystemStore, type SystemConfigParameter } from '../store/systemStore';
import type { ColumnDef } from '@tanstack/react-table';

const categoryBadgeStyles = {
  SECURITY_POLICIES: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
  DATABASE_TUNING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 font-mono',
  API_GATEWAY_THROTTLING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  OMNICHANNEL_SYNC: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  CACHE_STRATEGY: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
};

type SearchField = 'all' | 'configKey' | 'category' | 'value' | 'description';

export function SystemConfigPage() {
  const { configs, addConfig, updateConfig, deleteConfig } = useSystemStore();

  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [selectedParam, setSelectedParam] = useState<SystemConfigParameter | null>(null);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Omit<SystemConfigParameter, 'id' | 'lastUpdatedTimestamp' | 'updatedByRole'>>({
    configKey: '',
    category: 'SECURITY_POLICIES',
    value: '',
    dataType: 'STRING',
    isEncrypted: false,
    requiresRebootToApply: false,
    description: '',
  });

  // Action states
  const [deletingConfig, setDeletingConfig] = useState<SystemConfigParameter | null>(null);
  const [rebootingConfig, setRebootingConfig] = useState<SystemConfigParameter | null>(null);
  const [rebootProgress, setRebootProgress] = useState<number>(-1); // -1 means inactive, 0-100 is progress

  const filtered = configs.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      switch (searchField) {
        case 'configKey':
          matchesSearch = item.configKey.toLowerCase().includes(q);
          break;
        case 'category':
          matchesSearch = item.category.toLowerCase().includes(q);
          break;
        case 'value':
          matchesSearch = item.value.toLowerCase().includes(q);
          break;
        case 'description':
          matchesSearch = item.description.toLowerCase().includes(q);
          break;
        case 'all':
        default:
          matchesSearch = (
            item.configKey.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.value.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
          );
      }
    }

    // 2. Category filter
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configs, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `System_Parameters_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData({
      configKey: '',
      category: 'SECURITY_POLICIES',
      value: '',
      dataType: 'STRING',
      isEncrypted: false,
      requiresRebootToApply: false,
      description: '',
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (config: SystemConfigParameter) => {
    setSelectedParam(null);
    setFormMode('edit');
    setFormData({
      configKey: config.configKey,
      category: config.category,
      value: config.value,
      dataType: config.dataType,
      isEncrypted: config.isEncrypted,
      requiresRebootToApply: config.requiresRebootToApply,
      description: config.description,
    });
    (window as any).__editingConfigId = config.id;
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      lastUpdatedTimestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      updatedByRole: 'ROLE-SUPERADMIN',
    };

    if (formMode === 'create') {
      addConfig(payload);
    } else {
      const id = (window as any).__editingConfigId;
      if (id) {
        updateConfig(id, payload);
      }
    }
    setFormOpen(false);
  };

  const handleDelete = (config: SystemConfigParameter) => {
    setDeletingConfig(config);
  };

  const handleDeleteConfirm = () => {
    if (!deletingConfig) return;
    deleteConfig(deletingConfig.id);
    setDeletingConfig(null);
    setSelectedParam(null);
  };

  const handleStartReboot = (config: SystemConfigParameter) => {
    setRebootingConfig(config);
    setRebootProgress(0);

    const interval = setInterval(() => {
      setRebootProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setRebootProgress(-1);
            setRebootingConfig(null);
          }, 800);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const columns = useMemo<ColumnDef<SystemConfigParameter>[]>(
    () => [
      {
        accessorKey: 'configKey',
        header: 'Khóa tham số (Parameter Key)',
        cell: (info) => <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Phân hệ (Domain)',
        cell: (info) => {
          const c = info.getValue() as keyof typeof categoryBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${categoryBadgeStyles[c]}`}>
              {c.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'value',
        header: 'Giá trị (Value)',
        cell: ({ row }) => {
          const val = row.original.value;
          const enc = row.original.isEncrypted;
          return (
            <span className={`font-mono text-xs px-2 py-0.5 rounded ${
              enc ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 font-bold border border-amber-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }`}>
              {enc ? '🔒 [ĐÃ MÃ HÓA KEYSTORE]' : val}
            </span>
          );
        },
      },
      {
        accessorKey: 'dataType',
        header: 'Kiểu dữ liệu',
        cell: (info) => <span className="font-mono text-xs text-gray-600 dark:text-gray-400 font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'requiresRebootToApply',
        header: 'Khởi động lại',
        cell: (info) => (
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
            info.getValue() as boolean ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
          }`}>
            {info.getValue() as boolean ? 'CẦN KHỞI ĐỘNG LẠI' : 'TỰ ĐỘNG CẬP NHẬT'}
          </span>
        ),
      },
      {
        accessorKey: 'lastUpdatedTimestamp',
        header: 'Cập nhật cuối',
        cell: (info) => <span className="font-mono text-xs text-gray-600 dark:text-gray-400">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedParam(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Sửa tham số"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Xóa tham số"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cấu hình tham số & hệ thống kiến trúc</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Thiết lập các hằng số vận hành cốt lõi, cơ chế mã hóa keystore, giới hạn API gateway và chính sách đồng bộ hóa cache Redis đa phân hệ.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất tập tin cấu hình (.json)
            </button>
            <button 
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm tham số mới
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Vietnamese Attribute Dropdown */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Tìm kiếm theo:</span>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent border-none py-1 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả tham số</option>
                <option value="configKey">Khóa tham số</option>
                <option value="category">Phân hệ</option>
                <option value="value">Giá trị</option>
                <option value="description">Mô tả chi tiết</option>
              </select>
            </div>

            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nhập từ khóa tìm kiếm tham số hệ thống..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Phân nhóm cấu hình:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả phân hệ</option>
                <option value="SECURITY_POLICIES">SECURITY POLICIES</option>
                <option value="DATABASE_TUNING">DATABASE TUNING</option>
                <option value="API_GATEWAY_THROTTLING">API GATEWAY THROTTLING</option>
                <option value="OMNICHANNEL_SYNC">OMNICHANNEL SYNC</option>
                <option value="CACHE_STRATEGY">CACHE STRATEGY</option>
              </select>
            </div>

            {(categoryFilter !== 'all' || search) && (
              <button
                onClick={() => { setCategoryFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedParam(row)} />
      </div>

      {/* VIEW DRAWER */}
      <Modal
        isOpen={!!selectedParam}
        onClose={() => setSelectedParam(null)}
        title={selectedParam ? `Thông tin tham số: ${selectedParam.configKey}` : 'Chi tiết tham số'}
        width="max-w-2xl"
      >
        {selectedParam && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedParam.requiresRebootToApply
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedParam.requiresRebootToApply ? 'bg-red-600 font-mono' : 'bg-emerald-600'
                }`}>
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Khả năng Hot-Reload</p>
                  <p className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                    {selectedParam.requiresRebootToApply ? '⚠️ CẦN KHỞI ĐỘNG LẠI CỤM MÁY CHỦ' : '⚡ TỰ ĐỘNG DYNAMIC HOT RELOAD'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedParam.requiresRebootToApply ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100' :
                'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
              }`}>
                {selectedParam.requiresRebootToApply ? 'PENDING REBOOT' : 'SYNCHRONIZED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Cpu className="w-4 h-4 text-primary" /> Kiểu dữ liệu tham số
                </div>
                <p className="text-sm font-mono font-bold text-gray-900 dark:text-white truncate">{selectedParam.dataType}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Key className="w-4 h-4 text-amber-500" /> Trạng thái bảo mật mã hóa
                </div>
                <p className={`text-xs font-bold truncate font-mono ${selectedParam.isEncrypted ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                  {selectedParam.isEncrypted ? 'MÃ HÓA PHẦN CỨNG VAULT' : 'BIẾN ĐỌC TRỰC TIẾP (CLEAR-TEXT)'}
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Phân hệ & Định danh khóa tham số</span>
                <h3 className="text-base font-bold font-mono text-gray-900 dark:text-white">{selectedParam.configKey}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Phân hệ quản lý:</span>
                  <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${categoryBadgeStyles[selectedParam.category]}`}>
                    {selectedParam.category.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Mô tả ý nghĩa kiến trúc</span>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  {selectedParam.description}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Giá trị hiện tại đang áp dụng</span>
                <div className="font-mono text-sm bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 font-bold text-primary break-all">
                  {selectedParam.isEncrypted ? '•••••••••••••••••••••••••••••••• [ĐÃ KHÓA VAULT SYSTEM]' : selectedParam.value}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Tài khoản sửa đổi cuối:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{selectedParam.updatedByRole}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-gray-700 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Thời điểm cập nhật cuối:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{selectedParam.lastUpdatedTimestamp}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button 
                onClick={() => handleOpenEdit(selectedParam)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <Settings className="w-4 h-4" /> Thay đổi giá trị tham số
              </button>
              {selectedParam.requiresRebootToApply && (
                <button 
                  onClick={() => handleStartReboot(selectedParam)}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4 inline mr-1" /> Drain Cluster & Hot-Reload
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* FORM DRAWER */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Định nghĩa tham số hệ thống mới' : 'Cập nhật giá trị tham số'}
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Khóa định danh (Config Key)</label>
            <input
              type="text"
              required
              disabled={formMode === 'edit'}
              placeholder="Ví dụ: SECURITY.MFA_TOTP.ISSUER_NAME"
              value={formData.configKey}
              onChange={(e) => setFormData(p => ({ ...p, configKey: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phân hệ kiến trúc</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(p => ({ ...p, category: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="SECURITY_POLICIES">Chính sách bảo mật (Security)</option>
                <option value="DATABASE_TUNING">Cấu hình CSDL (Database)</option>
                <option value="API_GATEWAY_THROTTLING">Giới hạn API (Gateway)</option>
                <option value="OMNICHANNEL_SYNC">Đồng bộ Kênh (Sync)</option>
                <option value="CACHE_STRATEGY">Bộ nhớ đệm (Cache)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kiểu dữ liệu schema</label>
              <select
                value={formData.dataType}
                onChange={(e) => setFormData(p => ({ ...p, dataType: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="STRING">Chuỗi ký tự (STRING)</option>
                <option value="INTEGER">Số nguyên (INTEGER)</option>
                <option value="BOOLEAN">Bật/Tắt (BOOLEAN)</option>
                <option value="JSON">Tập tin dữ liệu (JSON)</option>
                <option value="ENUM">Liệt kê tĩnh (ENUM)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giá trị gán áp dụng (Assigned Value)</label>
            <textarea
              required
              rows={3}
              placeholder="Nhập giá trị hằng số, địa chỉ endpoint IP hoặc file JSON cấu hình..."
              value={formData.value}
              onChange={(e) => setFormData(p => ({ ...p, value: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono text-xs"
            />
          </div>

          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEncrypted}
                onChange={(e) => setFormData(p => ({ ...p, isEncrypted: e.target.checked }))}
                className="w-4.5 h-4.5 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Kích hoạt mã hóa Keystore (Encrypt Value)</span>
                <span className="text-2xs text-gray-500 block mt-0.5">Hệ thống sẽ lưu trữ giá trị dưới dạng khóa mã hóa phần cứng SHA-256 an toàn.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer pt-3 border-t border-gray-200 dark:border-gray-800">
              <input
                type="checkbox"
                checked={formData.requiresRebootToApply}
                onChange={(e) => setFormData(p => ({ ...p, requiresRebootToApply: e.target.checked }))}
                className="w-4.5 h-4.5 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Bắt buộc khởi động lại cluster (Reboot Required)</span>
                <span className="text-2xs text-gray-500 block mt-0.5">Thay đổi giá trị này sẽ không áp dụng ngay mà chờ rút cạn cụm máy chủ và reload CSDL.</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả chức năng & Tác động kiến trúc</label>
            <textarea
              rows={3}
              required
              placeholder="Nhập vai trò thiết lập của tham số đối với cấu trúc vận hành chung..."
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow"
            >
              Lưu cấu hình tham số
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETION CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingConfig}
        onClose={() => setDeletingConfig(null)}
        title="Xóa tham số cấu hình hệ thống"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-red-300">CẢNH BÁO RỦI RO KHI XÓA THAM SỐ CẤU HÌNH</p>
              <p className="text-2xs text-red-700 dark:text-red-400 mt-0.5">Xóa các tham số hệ thống cốt lõi có thể gây gián đoạn kết nối CSDL, làm hỏng Spooler API Gateway hoặc khóa quyền đăng nhập MFA.</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Bạn có chắc chắn muốn xóa tham số <strong>{deletingConfig?.configKey}</strong> khỏi tập cấu hình môi trường?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setDeletingConfig(null)} className="px-4 py-2 border rounded-lg text-sm dark:border-gray-700">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>

      {/* SIMULATED CLUSTER REBOOT MODAL */}
      <Modal
        isOpen={rebootProgress >= 0}
        onClose={() => {}}
        title="Đang khởi động lại cụm máy chủ & Refresh Cấu hình"
        width="max-w-md"
      >
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-spin">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Thực thi lệnh Drain Cluster & Spooler Reload</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">Target Key: {rebootingConfig?.configKey}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-gray-500">Tiến trình triển khai:</span>
              <span className="text-primary font-bold">{rebootProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-150 rounded-full shadow-lg shadow-primary/30" 
                style={{ width: `${rebootProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-900 dark:bg-black p-4 rounded-xl border border-gray-800 text-3xs font-mono text-emerald-400 space-y-1 max-h-36 overflow-y-auto leading-relaxed scrollbar-none">
            <p className="text-gray-500">[2026-05-18 UTC] Initiating hot-drain on cluster nodes...</p>
            {rebootProgress >= 20 && <p className="text-gray-500">[2026-05-18 UTC] Evacuating cache sessions and routing requests to backup cluster...</p>}
            {rebootProgress >= 40 && <p className="text-amber-400">[2026-05-18 UTC] Sealed Keystore vault retrieved. Overriding system property value...</p>}
            {rebootProgress >= 60 && <p className="text-emerald-400">[2026-05-18 UTC] Hot reloading HikariCP database connections pooling [Active: 250]</p>}
            {rebootProgress >= 80 && <p className="text-emerald-400">[2026-05-18 UTC] Flashing global memory states & resetting API Rate Limiter endpoints...</p>}
            {rebootProgress === 100 && <p className="text-primary font-bold">[2026-05-18 UTC] SUCCESS: Cluster synchronization complete! Hot reload active.</p>}
          </div>
        </div>
      </Modal>
    </>
  );
}
