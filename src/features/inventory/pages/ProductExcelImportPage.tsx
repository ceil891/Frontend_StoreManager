import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Edit3,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  BookOpen,
  Info,
  Check,
  Plus,
  Scale,
  Sparkles,
  ChevronRight,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { useInventoryStore } from '../store/inventoryStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { Modal } from '@/shared/components/ui/Modal';
import {
  downloadProductExcelTemplate,
  parseProductExcelFile,
  validateProductRows,
  UNIT_CONVERSION_PRESETS,
  type RawParsedProductRow,
  type ValidatedProductRow,
  type UnitConversionPreset,
} from '../utils/excelProductHelper';

export function ProductExcelImportPage() {
  const navigate = useNavigate();
  const { products, categories, unitsList, fetchProducts, fetchCategories, fetchUnits } = useInventoryStore();
  const { branches, fetchBranches } = useBranchStore();

  const [activeTab, setActiveTab] = useState<'import' | 'presets' | 'guide'>('import');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ValidatedProductRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('1');

  // Edit Unit Modal state
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editingUnitsTemp, setEditingUnitsTemp] = useState<ValidatedProductRow['conversionUnits']>([]);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Import Execution state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: { rowIndex: number; productCode?: string; productName?: string; errorMessage: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchUnits();
    fetchBranches();
  }, [fetchProducts, fetchCategories, fetchUnits, fetchBranches]);

  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(String(branches[0].id));
    }
  }, [branches, selectedBranchId]);

  // Handle File Selection
  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);
    try {
      const rawRows = await parseProductExcelFile(selectedFile);
      if (rawRows.length === 0) {
        toast.error('File Excel không có dữ liệu hoặc định dạng không đúng');
        setIsParsing(false);
        return;
      }
      const validated = validateProductRows(rawRows, products, categories, unitsList);
      setParsedRows(validated);
      toast.success(`Đã đọc ${validated.length} dòng sản phẩm từ file Excel`);
    } catch (err: any) {
      console.error('Failed to parse excel file:', err);
      toast.error(`Lỗi khi đọc file Excel: ${err.message || 'Không xác định'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Re-run validation whenever rows are updated inline
  const revalidateRows = (rows: RawParsedProductRow[]) => {
    const validated = validateProductRows(rows, products, categories, unitsList);
    setParsedRows(validated);
  };

  // Inline Cell Editing
  const handleCellChange = (rowIndex: number, field: keyof RawParsedProductRow, value: any) => {
    const updated = [...parsedRows];
    const targetIdx = updated.findIndex((r) => r.rowIndex === rowIndex);
    if (targetIdx !== -1) {
      (updated[targetIdx] as any)[field] = value;
      revalidateRows(updated);
    }
  };

  // Delete a Row from Preview
  const handleDeleteRow = (rowIndex: number) => {
    const filtered = parsedRows.filter((r) => r.rowIndex !== rowIndex);
    revalidateRows(filtered);
    toast.info('Đã xóa dòng khỏi danh sách nhập');
  };

  // Remove All Invalid Rows
  const handleRemoveAllInvalid = () => {
    const validOnly = parsedRows.filter((r) => r.isValid);
    setParsedRows(validOnly);
    toast.success(`Đã loại bỏ các dòng không hợp lệ. Còn lại ${validOnly.length} dòng.`);
  };

  // Open Multi-Level Units Modal
  const handleOpenUnitModal = (row: ValidatedProductRow) => {
    setEditingRowIndex(row.rowIndex);
    setEditingUnitsTemp(JSON.parse(JSON.stringify(row.conversionUnits || [])));
    setIsUnitModalOpen(true);
  };

  // Save Multi-Level Units Modal
  const handleSaveUnitModal = () => {
    if (editingRowIndex === null) return;
    const updated = [...parsedRows];
    const targetIdx = updated.findIndex((r) => r.rowIndex === editingRowIndex);
    if (targetIdx !== -1) {
      const row = updated[targetIdx];
      // Update individual unit columns based on modal items
      row.unit2Name = editingUnitsTemp[0]?.unitName || '';
      row.unit2Rate = editingUnitsTemp[0]?.conversionRate || 0;
      row.unit2Price = editingUnitsTemp[0]?.price || 0;
      row.unit2Barcode = editingUnitsTemp[0]?.barcode || '';

      row.unit3Name = editingUnitsTemp[1]?.unitName || '';
      row.unit3Rate = editingUnitsTemp[1]?.conversionRate || 0;
      row.unit3Price = editingUnitsTemp[1]?.price || 0;
      row.unit3Barcode = editingUnitsTemp[1]?.barcode || '';

      row.unit4Name = editingUnitsTemp[2]?.unitName || '';
      row.unit4Rate = editingUnitsTemp[2]?.conversionRate || 0;
      row.unit4Price = editingUnitsTemp[2]?.price || 0;
      row.unit4Barcode = editingUnitsTemp[2]?.barcode || '';

      revalidateRows(updated);
      toast.success('Đã cập nhật đơn vị tính nhiều cấp');
    }
    setIsUnitModalOpen(false);
  };

  // Apply Preset to all products that match base unit or to all products
  const handleApplyPresetToAll = (preset: UnitConversionPreset) => {
    if (parsedRows.length === 0) {
      toast.warning('Vui lòng tải file Excel trước khi áp dụng mẫu');
      return;
    }
    const updated = parsedRows.map((row) => {
      // If row has no conversion units or base unit matches
      const newRow = { ...row };
      if (!newRow.baseUnitName || newRow.baseUnitName === preset.baseUnitName) {
        newRow.baseUnitName = preset.baseUnitName;
      }
      if (preset.tiers[0]) {
        newRow.unit2Name = preset.tiers[0].unitName;
        newRow.unit2Rate = preset.tiers[0].suggestedRate;
        newRow.unit2Price = Math.round(newRow.basePrice * (preset.tiers[0].priceMultiplier || preset.tiers[0].suggestedRate));
      }
      if (preset.tiers[1]) {
        newRow.unit3Name = preset.tiers[1].unitName;
        newRow.unit3Rate = preset.tiers[1].suggestedRate;
        newRow.unit3Price = Math.round(newRow.basePrice * (preset.tiers[1].priceMultiplier || preset.tiers[1].suggestedRate));
      }
      return newRow;
    });

    revalidateRows(updated);
    toast.success(`Đã áp dụng mẫu "${preset.name}" cho ${updated.length} sản phẩm`);
    setActiveTab('import');
  };

  // Filtered Rows for Preview Table
  const filteredRows = useMemo(() => {
    return parsedRows.filter((row) => {
      if (filterStatus === 'valid' && !row.isValid) return false;
      if (filterStatus === 'invalid' && row.isValid) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          row.name.toLowerCase().includes(q) ||
          row.productCode.toLowerCase().includes(q) ||
          row.categoryName.toLowerCase().includes(q) ||
          row.baseUnitName.toLowerCase().includes(q) ||
          (row.barcode && row.barcode.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [parsedRows, filterStatus, searchQuery]);

  // Statistics
  const validCount = useMemo(() => parsedRows.filter((r) => r.isValid).length, [parsedRows]);
  const invalidCount = useMemo(() => parsedRows.filter((r) => !r.isValid).length, [parsedRows]);
  const totalConversionUnits = useMemo(
    () => parsedRows.reduce((acc, r) => acc + (r.conversionUnits ? r.conversionUnits.length : 0), 0),
    [parsedRows]
  );

  // Execute Bulk Import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error('Không có dòng sản phẩm hợp lệ nào để nhập.');
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    const branchIdNum = Number(selectedBranchId || '1');

    const payloadRequests = validRows.map((row) => {
      // Map conversion units
      const mappedConversionUnits = (row.conversionUnits || []).map((u) => {
        let uId = u.unitId;
        if (!uId) {
          const matched = unitsList.find(
            (item) => item.unitName.toLowerCase() === u.unitName.toLowerCase() || item.code.toLowerCase() === u.unitName.toLowerCase()
          );
          uId = matched ? Number(matched.id) : 1;
        }
        return {
          unitId: uId,
          conversionRate: u.conversionRate,
          price: u.price,
          barcode: u.barcode || null,
        };
      });

      const initialStocks =
        row.initialStock && row.initialStock > 0
          ? [{ branchId: branchIdNum, quantity: row.initialStock }]
          : [];

      return {
        productCode: row.productCode || null,
        name: row.name,
        description: row.description || '',
        basePrice: row.basePrice,
        costPrice: row.costPrice || 0,
        brand: row.brand || '',
        barcode: row.barcode || null,
        isActive: true,
        weight: row.weight || 0,
        reorderPoint: row.reorderPoint || 0,
        minStock: row.minStock || 0,
        categoryId: row.resolvedCategoryId || (categories[0] ? Number(categories[0].id) : 1),
        baseUnitId: row.resolvedBaseUnitId || (unitsList[0] ? Number(unitsList[0].id) : 1),
        conversionUnits: mappedConversionUnits,
        initialStocks: initialStocks,
      };
    });

    try {
      const res: any = await axiosClient.post('/products/bulk', payloadRequests);
      setImportProgress(100);

      const data = res?.data?.data || res?.data || res || {};
      const successCount = data?.successCount !== undefined ? data.successCount : validRows.length;
      const failedCount = data?.failedCount !== undefined ? data.failedCount : 0;
      const errors = data?.errors || [];


      setImportResult({
        total: validRows.length,
        success: successCount,
        failed: failedCount,
        errors: errors,
      });

      await fetchProducts();
      toast.success(`Nhập thành công ${successCount}/${validRows.length} sản phẩm vào hệ thống!`);
    } catch (err: any) {
      console.error('Bulk import error:', err);
      toast.error(`Lỗi trong quá trình nhập dữ liệu: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nhập sản phẩm từ file Excel</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Nhập hàng loạt sản phẩm kèm thiết lập Đơn vị tính nhiều cấp (Lon ➔ Lốc ➔ Thùng), giá vốn, giá bán lẻ và tồn kho ban đầu
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => downloadProductExcelTemplate(categories, unitsList)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-all text-sm font-semibold shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600" /> Tải file mẫu (.xlsx)
          </button>
          <button
            onClick={() => navigate('/inventory/products')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl transition-colors text-sm font-medium cursor-pointer"
          >
            Về danh sách SP
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'import'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Nhập dữ liệu & Rà soát (Preview)
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'presets'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Layers className="w-4 h-4" /> Mẫu Đơn vị nhiều cấp (Presets)
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'guide'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Hướng dẫn cấu trúc Excel
        </button>
      </div>

      {/* ── TAB 1: IMPORT & PREVIEW ────────────────────────────── */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* File Upload Dropzone */}
          {parsedRows.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-10 text-center cursor-pointer transition-all bg-emerald-50/20 dark:bg-emerald-950/10 group hover:shadow-md"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Kéo & thả file Excel (.xlsx, .xls) vào đây hoặc <span className="text-emerald-600 dark:text-emerald-400 underline">Chọn tệp</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                    Hỗ trợ file Excel chứa đầy đủ thông tin sản phẩm và các cấp đơn vị quy đổi (Cấp 2: Lốc, Cấp 3: Thùng, Cấp 4: Kiện)
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 pt-2">
                  <span>✓ Tự động kiểm tra trùng lặp SKU & Barcode</span>
                  <span>✓ Hỗ trợ sửa lỗi trực tiếp trên bảng</span>
                  <span>✓ Nhập tồn kho tức thì</span>
                </div>
              </div>
            </div>
          ) : (
            /* Upload Summary Bar when file loaded */
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{file?.name || 'Dữ liệu Excel'}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {parsedRows.length} sản phẩm
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Đã rà soát dữ liệu: {validCount} hợp lệ, {invalidCount} có cảnh báo/lỗi
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Chọn file khác
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          {parsedRows.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{parsedRows.length}</p>
                <p className="text-[11px] text-gray-400 mt-1">Từ file Excel đã tải</p>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-emerald-200 dark:border-emerald-900/40 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Hợp lệ sẵn sàng</p>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{validCount}</p>
                <p className="text-[11px] text-gray-400 mt-1">Sẽ được lưu vào kho</p>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-rose-200 dark:border-rose-900/40 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Chứa lỗi cần sửa</p>
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                </div>
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{invalidCount}</p>
                <p className="text-[11px] text-gray-400 mt-1">Sửa trực tiếp bên dưới</p>
              </div>

              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-indigo-200 dark:border-indigo-900/40 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Đơn vị quy đổi</p>
                  <Layers className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{totalConversionUnits}</p>
                <p className="text-[11px] text-gray-400 mt-1">Cấp 2, Cấp 3, Cấp 4</p>
              </div>
            </div>
          )}

          {/* Action Toolbar & Filters */}
          {parsedRows.length > 0 && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo mã SKU, tên, barcode..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg w-60 text-gray-900 dark:text-white focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-lg text-xs">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      filterStatus === 'all'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                    }`}
                  >
                    Tất cả ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('valid')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      filterStatus === 'valid'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    Hợp lệ ({validCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus('invalid')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                      filterStatus === 'invalid'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-rose-600 hover:text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    Lỗi ({invalidCount})
                  </button>
                </div>

                {/* Target Branch */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Chi nhánh nhập:</span>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 text-xs cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {invalidCount > 0 && (
                  <button
                    onClick={handleRemoveAllInvalid}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/40 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Bỏ {invalidCount} dòng lỗi
                  </button>
                )}

                <button
                  disabled={validCount === 0 || isImporting}
                  onClick={handleExecuteImport}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-sm cursor-pointer ${
                    validCount > 0 && !isImporting
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-emerald-600/20 hover:shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Check className="w-4 h-4" /> Xác nhận nhập {validCount} sản phẩm
                </button>
              </div>
            </div>
          )}

          {/* Interactive Preview Table */}
          {parsedRows.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200 font-semibold border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">Dòng</th>
                      <th className="py-3 px-3 w-28">Trạng thái</th>
                      <th className="py-3 px-3 w-36">Mã SKU</th>
                      <th className="py-3 px-3 min-w-[200px]">Tên sản phẩm (*)</th>
                      <th className="py-3 px-3 w-32">Danh mục</th>
                      <th className="py-3 px-3 w-28">ĐVT cơ bản (*)</th>
                      <th className="py-3 px-3 w-28 text-right">Giá bán lẻ (*)</th>
                      <th className="py-3 px-3 w-24 text-right">Giá vốn</th>
                      <th className="py-3 px-3 w-20 text-center">Tồn kho</th>
                      <th className="py-3 px-3 min-w-[280px]">Đơn vị nhiều cấp (Quy đổi)</th>
                      <th className="py-3 px-3 w-20 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {filteredRows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={`transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-700/40 ${
                          !row.isValid ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        {/* Row Index */}
                        <td className="py-2.5 px-3 text-center font-mono text-gray-400 text-[11px]">
                          #{row.rowIndex}
                        </td>

                        {/* Status / Errors Badge */}
                        <td className="py-2.5 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hợp lệ
                            </span>
                          ) : (
                            <div className="group relative cursor-pointer">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                                <XCircle className="w-3 h-3 text-rose-600" /> {row.errors.length} Lỗi
                              </span>
                              {/* Error Tooltip */}
                              <div className="absolute left-0 top-full mt-1 z-30 hidden group-hover:block bg-gray-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl min-w-[240px] max-w-[320px] space-y-1">
                                <p className="font-bold text-rose-400 border-b border-gray-700 pb-1">Chi tiết lỗi:</p>
                                {row.errors.map((err, i) => (
                                  <p key={i} className="text-gray-200">
                                    • {err}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* SKU */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.productCode}
                            onChange={(e) => handleCellChange(row.rowIndex, 'productCode', e.target.value)}
                            placeholder="Tự động sinh"
                            className="w-full px-2 py-1 bg-transparent hover:bg-white dark:hover:bg-gray-900 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded font-mono text-xs focus:bg-white dark:focus:bg-gray-900 focus:border-primary"
                          />
                        </td>

                        {/* Product Name */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handleCellChange(row.rowIndex, 'name', e.target.value)}
                            placeholder="Tên sản phẩm..."
                            className={`w-full px-2 py-1 bg-transparent hover:bg-white dark:hover:bg-gray-900 border rounded text-xs font-medium focus:bg-white dark:focus:bg-gray-900 focus:border-primary ${
                              !row.name ? 'border-rose-400 bg-rose-50/50' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          />
                        </td>

                        {/* Category */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.categoryName}
                            onChange={(e) => handleCellChange(row.rowIndex, 'categoryName', e.target.value)}
                            placeholder="Danh mục..."
                            className="w-full px-2 py-1 bg-transparent hover:bg-white dark:hover:bg-gray-900 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded text-xs focus:bg-white dark:focus:bg-gray-900 focus:border-primary"
                          />
                        </td>

                        {/* Base Unit */}
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={row.baseUnitName}
                            onChange={(e) => handleCellChange(row.rowIndex, 'baseUnitName', e.target.value)}
                            placeholder="Lon, Chai..."
                            className={`w-full px-2 py-1 bg-transparent hover:bg-white dark:hover:bg-gray-900 border rounded text-xs font-semibold focus:bg-white dark:focus:bg-gray-900 focus:border-primary ${
                              !row.baseUnitName ? 'border-rose-400 bg-rose-50/50' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          />
                        </td>

                        {/* Base Price */}
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            value={row.basePrice}
                            onChange={(e) => handleCellChange(row.rowIndex, 'basePrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-right bg-transparent hover:bg-white dark:hover:bg-gray-900 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded font-mono text-xs focus:bg-white dark:focus:bg-gray-900 focus:border-primary"
                          />
                        </td>

                        {/* Cost Price */}
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            value={row.costPrice}
                            onChange={(e) => handleCellChange(row.rowIndex, 'costPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-right bg-transparent hover:bg-white dark:hover:bg-gray-900 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded font-mono text-xs focus:bg-white dark:focus:bg-gray-900 focus:border-primary text-gray-500"
                          />
                        </td>

                        {/* Initial Stock */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="number"
                            value={row.initialStock}
                            onChange={(e) => handleCellChange(row.rowIndex, 'initialStock', parseInt(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1 text-center bg-transparent hover:bg-white dark:hover:bg-gray-900 border border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded font-mono text-xs focus:bg-white dark:focus:bg-gray-900 focus:border-primary"
                          />
                        </td>

                        {/* Multi-tier Units Visual Badges */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-[11px] font-bold">
                              1 {row.baseUnitName || 'Gốc'}
                            </span>

                            {row.conversionUnits && row.conversionUnits.length > 0 ? (
                              row.conversionUnits.map((u, i) => (
                                <React.Fragment key={i}>
                                  <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                  <span
                                    title={`1 ${u.unitName} = ${u.conversionRate} ${row.baseUnitName} | Giá: ${u.price.toLocaleString('vi-VN')} đ ${u.barcode ? `| Barcode: ${u.barcode}` : ''}`}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 text-[11px] font-semibold"
                                  >
                                    {u.unitName} (x{u.conversionRate})
                                    <span className="font-mono text-[10px] text-indigo-500">
                                      {(u.price || 0).toLocaleString('vi-VN')}đ
                                    </span>
                                  </span>
                                </React.Fragment>
                              ))
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Chưa có ĐVT quy đổi</span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenUnitModal(row)}
                              title="Tùy chỉnh đơn vị nhiều cấp cho sản phẩm này"
                              className="ml-auto p-1 text-primary hover:bg-primary/10 rounded transition-colors text-[10px] font-semibold flex items-center gap-0.5"
                            >
                              <Edit3 className="w-3 h-3" /> Cấu hình
                            </button>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.rowIndex)}
                            title="Xóa dòng"
                            className="p-1 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: PRESETS ─────────────────────────────────────── */}
      {activeTab === 'presets' && (
        <div className="space-y-6">
          <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                Bộ mẫu Đơn vị tính nhiều cấp theo ngành hàng (Presets)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Các quy chuẩn chuỗi quy đổi đóng gói phổ biến trong bán lẻ và phân phối sỉ. Bạn có thể bấm "Áp dụng cho danh sách" để gán nhanh chuỗi đơn vị này vào file Excel đang nhập.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {UNIT_CONVERSION_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:border-primary transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {preset.industry}
                    </span>
                    <Layers className="w-4 h-4 text-primary" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white mt-2.5">
                    {preset.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{preset.description}</p>

                  {/* Visual Hierarchy Chain */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                    <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cấu trúc chuỗi quy đổi:
                    </p>
                    <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        Cấp 1: {preset.baseUnitName} (Gốc)
                      </span>
                      {preset.tiers.map((t, idx) => (
                        <React.Fragment key={idx}>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                            Cấp {t.level}: {t.unitName} (x{t.suggestedRate})
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-mono">
                    {preset.tiers.length + 1} cấp đơn vị
                  </span>
                  <button
                    onClick={() => handleApplyPresetToAll(preset)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Áp dụng mẫu này <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: USER GUIDE ──────────────────────────────────── */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" /> Hướng dẫn điền file Excel & Quy tắc Đơn vị nhiều cấp
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Tính năng Nhập Excel của RetailHub được thiết kế đặc biệt cho các mô hình bán sỉ, bán lẻ, bách hóa và FMCG, nơi mà một sản phẩm có thể bán theo nhiều đơn vị đóng gói khác nhau.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Quy tắc Đơn vị cơ bản (Base Unit)
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 list-disc list-inside">
                  <li>Là đơn vị nhỏ nhất để kiểm đếm tồn kho (VD: Lon, Chai, Gói, Viên, Cái).</li>
                  <li>Tỷ lệ quy đổi mặc định là <strong>1</strong>.</li>
                  <li>Giá bán cơ bản là giá bán lẻ cho 1 đơn vị cơ bản này.</li>
                </ul>
              </div>

              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200 dark:border-indigo-900/40 space-y-2">
                <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Quy tắc Đơn vị quy đổi cấp 2, 3, 4
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 list-disc list-inside">
                  <li>Tên ĐVT quy đổi không được trùng với ĐVT cơ bản (VD: Lốc, Thùng, Hộp).</li>
                  <li><strong>Tỷ lệ quy đổi:</strong> Số lượng ĐVT cơ bản trong 1 ĐVT này (VD: 1 Lốc = 6 Lon ➔ điền 6).</li>
                  <li><strong>Giá bán riêng:</strong> Giá bán cho đơn vị quy đổi (VD: 58.000 đ / Lốc).</li>
                  <li><strong>Mã vạch riêng:</strong> Giúp máy quét POS nhận diện đúng đơn vị và tự động trừ kho tương ứng.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: MULTI-LEVEL UNITS EDITOR ───────────────────── */}
      <Modal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        title="Thiết lập Đơn vị tính nhiều cấp cho sản phẩm"
        width="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
            <span className="text-gray-500 dark:text-gray-400">Đơn vị cơ bản (Cấp 1): </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {parsedRows.find((r) => r.rowIndex === editingRowIndex)?.baseUnitName || 'Gốc'}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                Danh sách đơn vị quy đổi cấp cao:
              </label>
              <button
                type="button"
                onClick={() => {
                  setEditingUnitsTemp([
                    ...editingUnitsTemp,
                    {
                      unitName: '',
                      conversionRate: 6,
                      price: 0,
                      barcode: '',
                    },
                  ]);
                }}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm cấp quy đổi
              </button>
            </div>

            {editingUnitsTemp.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                Chưa có đơn vị quy đổi nào. Nhấn "+ Thêm cấp quy đổi" để tạo (VD: Lốc, Thùng).
              </div>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {editingUnitsTemp.map((unit, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Đơn vị cấp {idx + 2}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUnitsTemp(editingUnitsTemp.filter((_, i) => i !== idx));
                        }}
                        className="text-gray-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Tên ĐVT (*)</label>
                        <input
                          type="text"
                          value={unit.unitName}
                          onChange={(e) => {
                            const next = [...editingUnitsTemp];
                            next[idx].unitName = e.target.value;
                            setEditingUnitsTemp(next);
                          }}
                          placeholder="Lốc, Thùng, Hộp..."
                          className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Tỷ lệ quy đổi (*)</label>
                        <input
                          type="number"
                          value={unit.conversionRate}
                          onChange={(e) => {
                            const next = [...editingUnitsTemp];
                            next[idx].conversionRate = parseFloat(e.target.value) || 0;
                            setEditingUnitsTemp(next);
                          }}
                          placeholder="VD: 6, 24"
                          className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Giá bán riêng (*)</label>
                        <input
                          type="number"
                          value={unit.price}
                          onChange={(e) => {
                            const next = [...editingUnitsTemp];
                            next[idx].price = parseFloat(e.target.value) || 0;
                            setEditingUnitsTemp(next);
                          }}
                          placeholder="VNĐ"
                          className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Mã vạch Barcode</label>
                        <input
                          type="text"
                          value={unit.barcode || ''}
                          onChange={(e) => {
                            const next = [...editingUnitsTemp];
                            next[idx].barcode = e.target.value;
                            setEditingUnitsTemp(next);
                          }}
                          placeholder="Barcode riêng..."
                          className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsUnitModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveUnitModal}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Áp dụng thay đổi
            </button>
          </div>
        </div>
      </Modal>

      {/* ── MODAL: IMPORT RESULT SUMMARY ──────────────────────── */}
      <Modal
        isOpen={!!importResult}
        onClose={() => setImportResult(null)}
        title="Kết quả nhập dữ liệu Excel"
        width="max-w-lg"
      >
        {importResult && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-base">
                  Đã nhập {importResult.success} / {importResult.total} sản phẩm
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Toàn bộ đơn vị tính nhiều cấp và số dư kho ban đầu đã được thiết lập thành công.
                </p>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {importResult.failed} sản phẩm không nhập được do lỗi:
                </p>
                <div className="max-h-40 overflow-y-auto p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs space-y-1">
                  {importResult.errors.map((err, idx) => (
                    <p key={idx} className="text-rose-700 dark:text-rose-300">
                      • Dòng #{err.rowIndex} ({err.productName || err.productCode}): {err.errorMessage}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setImportResult(null);
                  setParsedRows([]);
                  setFile(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Nhập file khác
              </button>
              <button
                type="button"
                onClick={() => navigate('/inventory/products')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Xem danh sách sản phẩm
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ProductExcelImportPage;
