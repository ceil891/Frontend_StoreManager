import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Printer, FileText, Code, CheckCircle2, Copy, Trash2, X, AlertTriangle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { useSystemStore, type PrintTemplateRecord } from '../store/systemStore';
import type { ColumnDef } from '@tanstack/react-table';

const docTypeStyles = {
  POS_RECEIPT_80MM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  A4_COMMERCIAL_INVOICE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  BARCODE_SHELF_LABEL_50X30: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 font-mono',
  PURCHASE_ORDER_MANIFEST: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  Z_REPORT_AUDIT_TAPE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
};

type SearchField = 'all' | 'templateCode' | 'templateName' | 'printerTarget' | 'formatSyntax';

export function PrintTemplatesPage() {
  const { printTemplates, addPrintTemplate, updatePrintTemplate, deletePrintTemplate } = useSystemStore();

  const [search, setSearch] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplateRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [syntaxFilter, setSyntaxFilter] = useState<string>('all');

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Omit<PrintTemplateRecord, 'id' | 'lastModifiedTimestamp' | 'author'>>({
    templateCode: '',
    templateName: '',
    documentType: 'POS_RECEIPT_80MM',
    printerTarget: 'EPSON_TM_T88VI',
    formatSyntax: 'ESC_POS_RAW_HEX',
    version: 'v1.0.0',
    isDefault: false,
    status: 'ACTIVE',
    sampleCodeSnippet: '',
  });

  // Action states
  const [deletingTemplate, setDeletingTemplate] = useState<PrintTemplateRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [spoolTestStatus, setSpoolTestStatus] = useState<string | null>(null); // State for spool test feedback

  const filtered = printTemplates.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      switch (searchField) {
        case 'templateCode':
          matchesSearch = item.templateCode.toLowerCase().includes(q);
          break;
        case 'templateName':
          matchesSearch = item.templateName.toLowerCase().includes(q);
          break;
        case 'printerTarget':
          matchesSearch = item.printerTarget.toLowerCase().includes(q);
          break;
        case 'formatSyntax':
          matchesSearch = item.formatSyntax.toLowerCase().includes(q);
          break;
        case 'all':
        default:
          matchesSearch = (
            item.templateCode.toLowerCase().includes(q) ||
            item.templateName.toLowerCase().includes(q) ||
            item.printerTarget.toLowerCase().includes(q) ||
            item.formatSyntax.toLowerCase().includes(q)
          );
      }
    }

    // 2. Syntax filter
    const matchesSyntax = syntaxFilter === 'all' || item.formatSyntax === syntaxFilter;

    // 3. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesSyntax && matchesStatus;
  });

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(printTemplates, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `Print_Templates_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setFormData({
      templateCode: '',
      templateName: '',
      documentType: 'POS_RECEIPT_80MM',
      printerTarget: 'EPSON_TM_T88VI',
      formatSyntax: 'ESC_POS_RAW_HEX',
      version: 'v1.0.0',
      isDefault: false,
      status: 'ACTIVE',
      sampleCodeSnippet: '',
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (tpl: PrintTemplateRecord) => {
    setSelectedTemplate(null);
    setFormMode('edit');
    setFormData({
      templateCode: tpl.templateCode,
      templateName: tpl.templateName,
      documentType: tpl.documentType,
      printerTarget: tpl.printerTarget,
      formatSyntax: tpl.formatSyntax,
      version: tpl.version,
      isDefault: tpl.isDefault,
      status: tpl.status,
      sampleCodeSnippet: tpl.sampleCodeSnippet,
    });
    (window as any).__editingTemplateId = tpl.id;
    setFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      lastModifiedTimestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
      author: 'Johnathan Vance',
    };

    if (formMode === 'create') {
      addPrintTemplate(payload);
    } else {
      const id = (window as any).__editingTemplateId;
      if (id) {
        updatePrintTemplate(id, payload);
      }
    }
    setFormOpen(false);
  };

  const handleDelete = (tpl: PrintTemplateRecord) => {
    setDeletingTemplate(tpl);
  };

  const handleDeleteConfirm = () => {
    if (!deletingTemplate) return;
    deletePrintTemplate(deletingTemplate.id);
    setDeletingTemplate(null);
    setSelectedTemplate(null);
  };

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const handleSpoolTest = (_tpl: PrintTemplateRecord) => {
    setSpoolTestStatus('CONNECTING');
    setTimeout(() => {
      setSpoolTestStatus('SPOOLING');
      setTimeout(() => {
        setSpoolTestStatus('SUCCESS');
        setTimeout(() => setSpoolTestStatus(null), 2000);
      }, 1000);
    }, 600);
  };

  const columns = useMemo<ColumnDef<PrintTemplateRecord>[]>(
    () => [
      {
        accessorKey: 'templateCode',
        header: 'Mã mẫu (template code)',
        cell: (info) => <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'templateName',
        header: 'Tên tài liệu & cổng máy in',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.templateName}</p>
            <p className="text-xs text-gray-500 font-mono">Target: {row.original.printerTarget.replace(/_/g, ' ')}</p>
          </div>
        ),
      },
      {
        accessorKey: 'documentType',
        header: 'Khổ giấy',
        cell: (info) => {
          const t = info.getValue() as keyof typeof docTypeStyles;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${docTypeStyles[t]}`}>
              {t.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'formatSyntax',
        header: 'Công nghệ layout',
        cell: (info) => <span className="font-mono text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'version',
        header: 'Phiên bản',
        cell: (info) => <span className="font-mono text-xs text-gray-600 dark:text-gray-400 font-bold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'isDefault',
        header: 'Hệ thống mặc định',
        cell: (info) => (
          <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
            info.getValue() as boolean ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200' : 'bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
          }`}>
            {info.getValue() as boolean ? 'MẶC ĐỊNH SỬ DỤNG' : 'TÙY CHỌN GHI ĐÈ'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'DEVELOPMENT_DRAFT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {status === 'ACTIVE' ? 'HIỆU LỰC' : status === 'DEVELOPMENT_DRAFT' ? 'ĐANG BIÊN SOẠN' : 'HẾT HIỆU LỰC'}
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
              onClick={() => setSelectedTemplate(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết & Spooler"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Sửa bản vẽ macro"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Xóa mẫu in"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mẫu in tài liệu & cấu hình spooler</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Định nghĩa cấu trúc in bill nhiệt POS 80mm ESC/POS, nhãn dán vạch Zebra ZPL II, hóa đơn đỏ VAT A4 HTML5 và biểu mẫu xuất kho Jasper.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Sao lưu bộ mẫu in (.json)
            </button>
            <button 
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thiết kế mẫu in mới
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
                <option value="all">Tất cả thông tin</option>
                <option value="templateCode">Mã mẫu in</option>
                <option value="templateName">Tên tài liệu</option>
                <option value="printerTarget">Cổng máy in</option>
                <option value="formatSyntax">Công nghệ layout</option>
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
                placeholder="Tìm kiếm mẫu thiết kế in ấn..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Layout:</span>
              <select
                value={syntaxFilter}
                onChange={(e) => setSyntaxFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả công nghệ</option>
                <option value="ESC_POS_RAW_HEX">ESC POS RAW HEX</option>
                <option value="MARKDOWN_HTML_HYBRID">MARKDOWN HTML HYBRID</option>
                <option value="ZPL_LABEL_ZEBRA">ZPL LABEL ZEBRA</option>
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
                <option value="DEPRECATED">DEPRECATED</option>
              </select>
            </div>

            {(syntaxFilter !== 'all' || statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setSyntaxFilter('all'); setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedTemplate(row)} />
      </div>

      {/* VIEW DRAWER WITH REALISTIC PREVIEW */}
      <Modal
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate ? `Mẫu in: ${selectedTemplate.templateCode}` : 'Chi tiết mẫu thiết kế'}
        width="max-w-2xl"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedTemplate.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedTemplate.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-amber-600'
                }`}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cổng truyền spooler vật lý</p>
                  <p className="text-sm font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                    {selectedTemplate.printerTarget.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedTemplate.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
              }`}>
                {selectedTemplate.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <FileText className="w-4 h-4 text-primary" /> Cú pháp biên soạn
                </div>
                <p className="text-xs font-mono font-bold text-gray-900 dark:text-white truncate">{selectedTemplate.formatSyntax}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Code className="w-4 h-4 text-emerald-500" /> Build phát hành
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate font-mono">{selectedTemplate.version}</p>
              </div>
            </div>

            {/* SIMULATED LAYOUT PREVIEW (VERY PREMIUM UX) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Bản vẽ thiết kế & Preview vật lý</span>
              
              {selectedTemplate.documentType === 'POS_RECEIPT_80MM' ? (
                <div className="bg-[#FAF9F6] dark:bg-gray-950 p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-800 shadow-inner flex flex-col items-center">
                  {/* Receipt roll appearance */}
                  <div className="w-full max-w-[280px] bg-white dark:bg-gray-900 p-4 shadow-xl border border-gray-200 dark:border-gray-800 text-black dark:text-gray-100 font-mono text-2xs leading-relaxed space-y-1 relative">
                    <div className="text-center font-bold text-xs uppercase tracking-tight">RETAILHUB POS TAPE</div>
                    <div className="text-center text-3xs text-gray-500 border-b border-dashed border-gray-400 dark:border-gray-600 pb-2">Branch #01 - Flagship Plaza</div>
                    <div className="flex justify-between pt-2">
                      <span>Item A (SKU-1)</span>
                      <span>$120.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Item B (SKU-2)</span>
                      <span>$45.50</span>
                    </div>
                    <div className="border-t border-dashed border-gray-400 dark:border-gray-600 my-1 pt-1 flex justify-between font-bold">
                      <span>SUBTOTAL</span>
                      <span>$165.50</span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-3xs">
                      <span>VAT (10.0%)</span>
                      <span>$16.55</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs border-t-2 border-double border-black dark:border-gray-100 pt-1">
                      <span>TOTAL DUE</span>
                      <span>$182.05</span>
                    </div>
                    <div className="text-center text-3xs text-gray-500 pt-3 italic">-- Thanks for shopping with us! --</div>
                  </div>
                </div>
              ) : selectedTemplate.documentType === 'BARCODE_SHELF_LABEL_50X30' ? (
                <div className="bg-[#FFFFCC] dark:bg-yellow-950/20 p-6 rounded-2xl border border-yellow-300 dark:border-yellow-900 flex justify-center shadow-inner">
                  <div className="w-64 bg-white dark:bg-gray-900 p-4 border-2 border-black rounded-lg text-black dark:text-white font-mono flex flex-col items-center justify-between h-36">
                    <p className="text-3xs font-bold self-start">RETAILHUB GLOBAL SKU</p>
                    <p className="text-xs font-bold tracking-widest mt-1">ADIDAS ULTRABOOST v2</p>
                    <div className="border-y border-black py-1 my-1 w-full text-center text-xs font-bold">$180.00</div>
                    <div className="w-full h-8 bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-bold text-3xs border border-gray-400 select-none">
                      |||| | || |||| | ||| |||| |
                    </div>
                    <p className="text-3xs">SKU-9921-2026</p>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-xs text-gray-500 italic text-center py-10">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  Mẫu in khổ lớn. Vui lòng mở Live IDE để hiển thị trình giả lập PDF A4.
                </div>
              )}
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tên tài liệu xuất bản</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedTemplate.templateName}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Chuẩn tài liệu:</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${docTypeStyles[selectedTemplate.documentType]}`}>
                    {selectedTemplate.documentType.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Mã code spooler / macro code</span>
                  <button 
                    onClick={() => handleCopySnippet(selectedTemplate.sampleCodeSnippet)}
                    className="text-xs flex items-center gap-1 text-primary font-semibold hover:underline"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copiedCode ? 'Đã sao chép!' : 'Copy mã'}
                  </button>
                </div>
                <pre className="text-xs font-mono bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-48 overflow-y-auto shadow-inner">
                  {selectedTemplate.sampleCodeSnippet}
                </pre>
              </div>

              <div className="flex justify-between items-center pt-2 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Kỹ sư thiết kế:</span>
                <span className="text-gray-800 dark:text-gray-200 font-semibold">{selectedTemplate.author}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-gray-700 text-xs font-mono">
                <span className="text-gray-500 dark:text-gray-400 font-sans">Thời điểm sửa đổi cuối:</span>
                <span className="text-gray-800 dark:text-gray-200 font-bold">{selectedTemplate.lastModifiedTimestamp}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button 
                onClick={() => handleOpenEdit(selectedTemplate)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm"
              >
                <Code className="w-4 h-4" /> Mở IDE chỉnh sửa Template
              </button>
              <button 
                onClick={() => handleSpoolTest(selectedTemplate)}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <Printer className="w-4 h-4 inline mr-1" /> Spooler Test Print
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* FORM DRAWER */}
      <Modal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Tạo mới bản vẽ mẫu in ấn' : 'Sửa đổi chi tiết bản vẽ mẫu in'}
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã mẫu (Template Code)</label>
              <input
                type="text"
                required
                disabled={formMode === 'edit'}
                placeholder="Ví dụ: TPL-POS-80MM"
                value={formData.templateCode}
                onChange={(e) => setFormData(p => ({ ...p, templateCode: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên bản vẽ</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Hóa đơn bán lẻ POS"
                value={formData.templateName}
                onChange={(e) => setFormData(p => ({ ...p, templateName: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Khổ giấy in ấn</label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData(p => ({ ...p, documentType: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="POS_RECEIPT_80MM">Hóa đơn nhiệt POS 80mm</option>
                <option value="A4_COMMERCIAL_INVOICE">Hóa đơn đỏ VAT A4</option>
                <option value="BARCODE_SHELF_LABEL_50X30">Nhãn vạch Zebra 50x30mm</option>
                <option value="PURCHASE_ORDER_MANIFEST">Vận đơn xuất kho A4</option>
                <option value="Z_REPORT_AUDIT_TAPE">Báo cáo cuối ngày (Z-Report)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Máy in định tuyến</label>
              <select
                value={formData.printerTarget}
                onChange={(e) => setFormData(p => ({ ...p, printerTarget: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="EPSON_TM_T88VI">Epson Thermal POS</option>
                <option value="ZEBRA_ZT411_DPI300">Zebra Label Printer</option>
                <option value="HP_LASERJET_ENTERPRISE">HP Enterprise A4 Office</option>
                <option value="PDF_VIRTUAL_EXPORT">Cổng máy in PDF ảo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Công nghệ Layout</label>
              <select
                value={formData.formatSyntax}
                onChange={(e) => setFormData(p => ({ ...p, formatSyntax: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-medium"
              >
                <option value="ESC_POS_RAW_HEX">ESC/POS Thermal Hex</option>
                <option value="ZPL_II_MACRO">Zebra ZPL II Macro</option>
                <option value="HTML5_CSS3_PRINT_MEDIA">HTML5 / CSS3 Layout</option>
                <option value="JASPER_REPORT_XML">Jasper Reports (XML)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phiên bản</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: v1.0.0"
                value={formData.version}
                onChange={(e) => setFormData(p => ({ ...p, version: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đoạn mã thiết kế (Raw Macro code)</label>
            <textarea
              required
              rows={4}
              placeholder="Nhập mã lệnh ESC/POS, HTML markup hoặc macro ZPL..."
              value={formData.sampleCodeSnippet}
              onChange={(e) => setFormData(p => ({ ...p, sampleCodeSnippet: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary font-mono text-xs"
            />
          </div>

          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData(p => ({ ...p, isDefault: e.target.checked }))}
                className="w-4.5 h-4.5 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">Chọn làm hằng số in ấn mặc định</span>
                <span className="text-2xs text-gray-500 block mt-0.5">Hệ thống sẽ tự động gọi mẫu này khi thực thi sự kiện in hóa đơn.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer pt-3 border-t border-gray-200 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-500 uppercase mr-2">Trạng thái phát triển:</span>
              <select
                value={formData.status}
                onChange={(e) => setFormData(p => ({ ...p, status: e.target.value as any }))}
                className="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-primary font-bold"
              >
                <option value="ACTIVE">KÍCH HOẠT (ACTIVE)</option>
                <option value="DEVELOPMENT_DRAFT">BIÊN SOẠN (DRAFT)</option>
                <option value="LEGACY_DEPRECATED">HẾT HIỆU LỰC (DEPRECATED)</option>
              </select>
            </label>
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
              Lưu bản vẽ mẫu in
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETION CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingTemplate}
        onClose={() => setDeletingTemplate(null)}
        title="Xóa mẫu in ấn tài liệu"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-red-300">CẢNH BÁO XÓA BẢN THIẾT KẾ BILL</p>
              <p className="text-2xs text-red-700 dark:text-red-400 mt-0.5">Xóa bản vẽ mẫu in mặc định có thể làm rỗng luồng spooler máy in đầu cuối tại các quầy thu ngân.</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Bạn có chắc chắn muốn xóa mẫu in <strong>{deletingTemplate?.templateName}</strong> khỏi cơ sở dữ liệu?</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setDeletingTemplate(null)} className="px-4 py-2 border rounded-lg text-sm dark:border-gray-700">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>

      {/* SIMULATED SPOOL PRINT TEST MODAL */}
      <Modal
        isOpen={!!spoolTestStatus}
        onClose={() => {}}
        title="Đang gửi lệnh Spooler test print..."
        width="max-w-xs"
      >
        <div className="space-y-4 py-2 flex flex-col items-center justify-center text-center">
          {spoolTestStatus === 'CONNECTING' ? (
            <>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 animate-pulse">
                <Printer className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-700">Đang ping máy in {selectedTemplate?.printerTarget}...</p>
            </>
          ) : spoolTestStatus === 'SPOOLING' ? (
            <>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 animate-spin">
                <Printer className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-700">Đang Spooler RAW Hex stream ({selectedTemplate?.formatSyntax})...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-emerald-700">In thử thành công! Thiết bị phản hồi OK [Status: READY]</p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
