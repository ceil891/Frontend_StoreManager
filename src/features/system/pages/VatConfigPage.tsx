import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Percent, FileText, Globe, FileSpreadsheet, Trash2, X } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { useVatStore, type VatRuleRecord } from '../store/vatStore';
import type { ColumnDef } from '@tanstack/react-table';

const jurisdictionStyles = {
  NATIONAL_FEDERAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  STATE_PROVINCIAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  MUNICIPAL_LOCAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  SPECIAL_ECONOMIC_ZONE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 font-mono',
};

type SearchField = 'all' | 'taxCode' | 'taxTitle' | 'countryScope' | 'glAccountBinding';

export function VatConfigPage() {
  const { vatRules, addVatRule, updateVatRule, deleteVatRule } = useVatStore();

  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [selectedVat, setSelectedVat] = useState<VatRuleRecord | null>(null);
  const [deletingVat, setDeletingVat] = useState<VatRuleRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all');
  
  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Omit<VatRuleRecord, 'id'>>({
    taxCode: '',
    taxTitle: '',
    ratePercentage: 10,
    countryScope: 'Việt Nam (VND)',
    jurisdiction: 'NATIONAL_FEDERAL',
    effectiveDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    isCompoundTax: false,
    status: 'ACTIVE',
    glAccountBinding: 'GL-2311-VAT-OUTPUT',
    exemptionNotes: '',
  });

  const filtered = vatRules.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      switch (searchField) {
        case 'taxCode':
          matchesSearch = item.taxCode.toLowerCase().includes(q);
          break;
        case 'taxTitle':
          matchesSearch = item.taxTitle.toLowerCase().includes(q);
          break;
        case 'countryScope':
          matchesSearch = item.countryScope.toLowerCase().includes(q);
          break;
        case 'glAccountBinding':
          matchesSearch = item.glAccountBinding.toLowerCase().includes(q);
          break;
        case 'all':
        default:
          matchesSearch = (
            item.taxCode.toLowerCase().includes(q) ||
            item.taxTitle.toLowerCase().includes(q) ||
            item.countryScope.toLowerCase().includes(q) ||
            item.glAccountBinding.toLowerCase().includes(q)
          );
      }
    }

    // 2. Jurisdiction filter
    const matchesJurisdiction = jurisdictionFilter === 'all' || item.jurisdiction === jurisdictionFilter;

    // 3. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesJurisdiction && matchesStatus;
  });

  const searchPlaceholder = useMemo(() => {
    switch (searchField) {
      case 'taxCode':
        return 'Tìm theo mã số thuế (ví dụ: VAT-STD-10)...';
      case 'taxTitle':
        return 'Tìm theo tên mô tả loại thuế...';
      case 'countryScope':
        return 'Tìm theo phạm vi quốc gia...';
      case 'glAccountBinding':
        return 'Tìm theo tài khoản sổ cái GL...';
      case 'all':
      default:
        return 'Nhập từ khóa tìm kiếm theo mọi thuộc tính thuế...';
    }
  }, [searchField]);

  const handleExportCSV = () => {
    const headers = ['Mã số thuế', 'Tên loại thuế', 'Tỷ lệ (%)', 'Quốc gia', 'Cấp tài phán', 'Ngày hiệu lực', 'Ngày hết hạn', 'Thuế kép', 'Trạng thái', 'Tài khoản sổ cái GL', 'Ghi chú miễn trừ'];
    const rows = vatRules.map(r => [
      r.taxCode,
      r.taxTitle,
      r.ratePercentage.toString(),
      r.countryScope,
      r.jurisdiction,
      r.effectiveDate,
      r.expirationDate || '',
      r.isCompoundTax ? 'Có' : 'Không',
      r.status,
      r.glAccountBinding,
      r.exemptionNotes || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bieu_Thue_VAT_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData({
      taxCode: '',
      taxTitle: '',
      ratePercentage: 10,
      countryScope: 'Việt Nam (VND)',
      jurisdiction: 'NATIONAL_FEDERAL',
      effectiveDate: new Date().toISOString().split('T')[0],
      expirationDate: '',
      isCompoundTax: false,
      status: 'ACTIVE',
      glAccountBinding: 'GL-2311-VAT-OUTPUT',
      exemptionNotes: '',
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (rule: VatRuleRecord) => {
    setSelectedVat(null);
    setFormMode('edit');
    setFormData({
      taxCode: rule.taxCode,
      taxTitle: rule.taxTitle,
      ratePercentage: rule.ratePercentage,
      countryScope: rule.countryScope,
      jurisdiction: rule.jurisdiction,
      effectiveDate: rule.effectiveDate,
      expirationDate: rule.expirationDate || '',
      isCompoundTax: rule.isCompoundTax,
      status: rule.status,
      glAccountBinding: rule.glAccountBinding,
      exemptionNotes: rule.exemptionNotes || '',
    });
    // Store id temporarily in a state
    (window as any).__editingId = rule.id;
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formMode === 'create') {
      addVatRule(formData);
    } else {
      const id = (window as any).__editingId;
      if (id) {
        updateVatRule({ ...formData, id });
      }
    }
    setFormOpen(false);
  };

  const handleDelete = (rule: VatRuleRecord) => {
    setDeletingVat(rule);
  };

  const handleDeleteConfirm = () => {
    if (!deletingVat) return;
    deleteVatRule(deletingVat.id);
    setDeletingVat(null);
    setSelectedVat(null);
  };

  const columns = useMemo<ColumnDef<VatRuleRecord>[]>(
    () => [
      {
        accessorKey: 'taxCode',
        header: 'Mã thuế',
        cell: (info) => <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'taxTitle',
        header: 'Mô tả loại thuế & Phạm vi',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.taxTitle}</p>
            <p className="text-xs text-gray-500 font-mono">Quốc gia: {row.original.countryScope}</p>
          </div>
        ),
      },
      {
        accessorKey: 'jurisdiction',
        header: 'Cấp tài phán',
        cell: (info) => {
          const j = info.getValue() as keyof typeof jurisdictionStyles;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${jurisdictionStyles[j]}`}>
              {j.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'ratePercentage',
        header: 'Thuế suất (%)',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white text-sm">{((info.getValue() as number)).toFixed(3)}%</span>,
      },
      {
        accessorKey: 'isCompoundTax',
        header: 'Thuế suất kép',
        cell: (info) => (
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
            info.getValue() as boolean ? 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}>
            {info.getValue() as boolean ? 'THUẾ KÉP' : 'THUẾ ĐƠN'}
          </span>
        ),
      },
      {
        accessorKey: 'glAccountBinding',
        header: 'Tài khoản kế toán GL',
        cell: (info) => <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded font-semibold border border-gray-200 dark:border-gray-700">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold' :
              status === 'PENDING_ENACTMENT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 font-mono'
            }`}>
              {status === 'ACTIVE' ? 'HIỆU LỰC' : status === 'PENDING_ENACTMENT' ? 'CHỜ AP DỤNG' : 'HẾT HẠN'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedVat(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Sửa thông số"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Xóa thuế"
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng cấu hình biểu thuế & Luật tài phán (VAT)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cấu hình biểu thuế suất giá trị gia tăng đa vùng miền, tích hợp tài khoản kế toán ghi nợ GL và xuất bản biểu thuế nội bộ doanh nghiệp.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-none shrink-0">
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" /> Xuất Dữ Liệu biểu thuế
            </button>
            <button 
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" /> Thiết lập quy tắc thuế mới
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Vietnamese Attribute Dropdown Selector */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-2 shrink-0">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Tìm kiếm theo:</span>
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value as SearchField)}
                className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent border-none py-1 focus:ring-0 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả thuộc tính</option>
                <option value="taxCode">Mã số thuế</option>
                <option value="taxTitle">Tên loại thuế</option>
                <option value="countryScope">Phạm vi quốc gia</option>
                <option value="glAccountBinding">Tài khoản sổ cái GL</option>
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
                placeholder={searchPlaceholder}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Thuế suất:</span>
              <select
                value={jurisdictionFilter}
                onChange={(e) => setJurisdictionFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả phân loại</option>
                <option value="NATIONAL_FEDERAL">NATIONAL FEDERAL</option>
                <option value="REGIONAL_PROVINCIAL">REGIONAL PROVINCIAL</option>
                <option value="ZERO_RATED_EXEMPT">ZERO RATED EXEMPT</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {(jurisdictionFilter !== 'all' || statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setJurisdictionFilter('all'); setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedVat(row)} />
      </div>

      {/* Details View Modal */}
      <Modal
        isOpen={!!selectedVat}
        onClose={() => setSelectedVat(null)}
        title={selectedVat ? `Thông tin chi tiết biểu thuế: ${selectedVat.taxCode}` : 'Chi tiết thuế'}
        width="max-w-2xl"
      >
        {selectedVat && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedVat.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedVat.status === 'PENDING_ENACTMENT'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedVat.status === 'ACTIVE' ? 'bg-emerald-600' : selectedVat.status === 'PENDING_ENACTMENT' ? 'bg-amber-600' : 'bg-gray-600'
                }`}>
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tỷ lệ thuế suất danh nghĩa</p>
                  <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                    {selectedVat.ratePercentage.toFixed(3)}%
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedVat.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedVat.status === 'PENDING_ENACTMENT' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {selectedVat.status === 'ACTIVE' ? 'ĐANG HOẠT ĐỘNG' : selectedVat.status === 'PENDING_ENACTMENT' ? 'CHỜ HIỆU LỰC' : 'ĐÃ HẾT HẠN'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Globe className="w-4 h-4 text-primary" /> Phạm vi lãnh thổ
                </div>
                <p className="text-xs font-mono font-bold text-gray-900 dark:text-white truncate">{selectedVat.countryScope}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <FileText className="w-4 h-4 text-emerald-500" /> Liên kết Tài khoản GL
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate font-mono">{selectedVat.glAccountBinding}</p>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Quy chuẩn Thuế quan pháp lý</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedVat.taxTitle}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Cấp tài phán quản lý:</span>
                  <span className="inline-block px-2.5 py-0.5 rounded text-xs font-bold border bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800">
                    {selectedVat.jurisdiction === 'NATIONAL_FEDERAL' ? 'Quốc gia - Liên bang' :
                     selectedVat.jurisdiction === 'STATE_PROVINCIAL' ? 'Tỉnh - bang' :
                     selectedVat.jurisdiction === 'MUNICIPAL_LOCAL' ? 'Thành phố - Quận huyện' : 'Khu kinh tế đặc quyền'}
                  </span>
                </div>
              </div>

              <div className="font-mono text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                <div className="flex justify-between items-center font-sans">
                  <span className="text-gray-500">Ngày có hiệu lực:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedVat.effectiveDate}</span>
                </div>
                {selectedVat.expirationDate && (
                  <div className="flex justify-between items-center font-sans">
                    <span className="text-gray-500">Ngày hết hạn quy định:</span>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">{selectedVat.expirationDate}</span>
                  </div>
                )}
              </div>

              {selectedVat.exemptionNotes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú miễn trừ & Hướng dẫn thi hành</span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 leading-relaxed">
                    {selectedVat.exemptionNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button 
                onClick={() => handleOpenEdit(selectedVat)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <FileSpreadsheet className="w-4 h-4" /> Chỉnh sửa thông số
              </button>
              <button 
                onClick={() => handleDelete(selectedVat)}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-700 dark:text-gray-300 hover:text-red-600 rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4 inline mr-1" /> Gỡ bỏ quy tắc thuế
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Modal Form */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Tạo Mới quy tắc thuế quan' : 'Cập nhật thông số quy tắc thuế'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã định danh thuế *</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: VAT-STD-10"
              value={formData.taxCode}
              onChange={(e) => setFormData(p => ({ ...p, taxCode: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả/Tên quy tắc thuế *</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Thuế giá trị gia tăng tiêu chuẩn hàng hóa phổ thông"
              value={formData.taxTitle}
              onChange={(e) => setFormData(p => ({ ...p, taxTitle: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tỷ lệ thuế suất (%) *</label>
              <input
                type="number"
                step="0.001"
                min="0"
                max="100"
                required
                value={formData.ratePercentage}
                onChange={(e) => setFormData(p => ({ ...p, ratePercentage: parseFloat(e.target.value) || 0 }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phạm vi quốc gia *</label>
              <input
                type="text"
                required
                value={formData.countryScope}
                onChange={(e) => setFormData(p => ({ ...p, countryScope: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cấp tài phán quản lý *</label>
              <select
                value={formData.jurisdiction}
                onChange={(e) => setFormData(p => ({ ...p, jurisdiction: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="NATIONAL_FEDERAL">Quốc gia - Liên bang</option>
                <option value="STATE_PROVINCIAL">Bang - tỉnh</option>
                <option value="MUNICIPAL_LOCAL">Thành phố - Quận huyện</option>
                <option value="SPECIAL_ECONOMIC_ZONE">Khu kinh tế đặc biệt</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tài khoản kế toán GL *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: GL-2311-VAT-OUTPUT"
                value={formData.glAccountBinding}
                onChange={(e) => setFormData(p => ({ ...p, glAccountBinding: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày bắt đầu hiệu lực *</label>
              <input
                type="date"
                required
                value={formData.effectiveDate}
                onChange={(e) => setFormData(p => ({ ...p, effectiveDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày hết hiệu lực (Nếu có)</label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData(p => ({ ...p, expirationDate: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 py-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCompoundTax}
                onChange={(e) => setFormData(p => ({ ...p, isCompoundTax: e.target.checked }))}
                className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4"
              />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 select-none">Hợp thuế (Compound Tax)?</span>
            </label>

            <div>
              <span className="text-xs font-bold text-gray-500 uppercase mr-2">Trạng thái:</span>
              <select
                value={formData.status}
                onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as any }))}
                className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-primary font-bold"
              >
                <option value="ACTIVE">KÍCH HOẠT (ACTIVE)</option>
                <option value="PENDING_ENACTMENT">CHỜ HIỆU LỰC (PENDING)</option>
                <option value="ARCHIVED_EXPIRED">LƯU TRỮ/HẾT HẠN (EXPIRED)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ghi chú & Căn cứ pháp lý</label>
            <textarea
              rows={3}
              placeholder="Nhập ghi chú miễn trừ, nghị quyết chính phủ, quy chuẩn hướng dẫn..."
              value={formData.exemptionNotes}
              onChange={(e) => setFormData(p => ({ ...p, exemptionNotes: e.target.value }))}
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
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingVat}
        onClose={() => setDeletingVat(null)}
        title="Xóa quy tắc thuế"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Bạn có chắc chắn muốn xóa quy tắc thuế <strong>{deletingVat?.taxTitle}</strong> ({deletingVat?.taxCode}) khỏi hệ thống? Hành động này không thể hoàn tác.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setDeletingVat(null)} className="px-4 py-2 border rounded-lg text-sm dark:border-gray-700">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
