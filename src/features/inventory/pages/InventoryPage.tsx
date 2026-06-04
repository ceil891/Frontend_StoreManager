import React, { useMemo, useState, useEffect } from 'react';
import { 
  Plus, Download, Eye, Tag,
  MapPin, Image as ImageIcon, Edit, Trash2, AlertCircle, X,
  CircleDot, Package, Barcode, AlertTriangle, Package2
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';
import { useInventoryStore, type ProductInventory, type ProductUnit } from '../store/inventoryStore';
import { useSettingsStore } from '@/shared/store/settingsStore';

export function InventoryPage() {
  const { products: data, addProduct, updateProduct, deleteProduct, categories } = useInventoryStore();
  const { getLowStockThreshold } = useSettingsStore();
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null);

  // Simulate loading state
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeModalTab, setActiveModalTab] = useState<'basic' | 'units' | 'images'>('basic');
  const [editingProduct, setEditingProduct] = useState<Partial<ProductInventory>>({ units: [] });
  const [editingUnits, setEditingUnits] = useState<ProductUnit[]>([]);
  const [deletingProduct, setDeletingProduct] = useState<ProductInventory | null>(null);
  const [deletingBulkProducts, setDeletingBulkProducts] = useState<{ rows: ProductInventory[], clear: () => void } | null>(null);

  const filtered = data.filter((item) => {
    // 1. Text search is now handled internally by ReusableDataTable via globalFilter
    let matchesSearch = true;

    // 2. Category filter
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

    // 3. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    // 4. Date filter
    let matchesDate = true;
    if (item.lastUpdated && (fromDate || toDate)) {
      const itemDate = new Date(item.lastUpdated.replace(' ', 'T'));
      itemDate.setHours(0, 0, 0, 0);
      
      if (fromDate) {
        const filterFrom = new Date(fromDate);
        filterFrom.setHours(0, 0, 0, 0);
        if (itemDate < filterFrom) matchesDate = false;
      }
      if (toDate) {
        const filterTo = new Date(toDate);
        filterTo.setHours(0, 0, 0, 0);
        if (itemDate > filterTo) matchesDate = false;
      }
    } else if (fromDate || toDate) {
      // If filtering by date but item has no date, maybe hide it? Or show it? Let's hide it.
      matchesDate = false;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setActiveModalTab('basic');
    setEditingProduct({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: categories.length > 0 ? categories[0].categoryName : 'General',
      price: 0,
      costPrice: 0,
      brand: '',
      unit: 'Cái',
      weight: '1 kg',
      location: 'Central',
      onHand: 0,
      status: 'ACTIVE',
      description: '',
      mainImage: '',
      galleryImages: [],
      units: []
    });
    setEditingUnits([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: ProductInventory) => {
    setModalMode('edit');
    setActiveModalTab('basic');
    setEditingProduct({ ...product });
    setEditingUnits(product.units || []);
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct.sku || !editingProduct.name) return;

    const payload: Omit<ProductInventory, 'id'> = {
      sku: editingProduct.sku,
      name: editingProduct.name,
      category: editingProduct.category || 'General',
      price: Number(editingProduct.price) || 0,
      costPrice: Number(editingProduct.costPrice) || 0,
      brand: editingProduct.brand || '',
      unit: editingProduct.unit || 'PCS',
      weight: editingProduct.weight || '',
      location: editingProduct.location || '',
      onHand: Number(editingProduct.onHand) || 0,
      status: editingProduct.status as any || 'ACTIVE',
      description: editingProduct.description || '',
      mainImage: editingProduct.mainImage || '',
      galleryImages: editingProduct.galleryImages || [],
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
      units: editingUnits // Attached configured units
    };

    if (modalMode === 'create') {
      addProduct(payload);
      toast.success(`Đã thêm sản phẩm ${payload.name} thành công!`);
    } else if (editingProduct.id) {
      updateProduct(editingProduct.id, payload);
      toast.success(`Đã cập nhật sản phẩm ${payload.name} thành công!`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingProduct) return;
    deleteProduct(deletingProduct.id);
    toast.success(`Đã xóa sản phẩm ${deletingProduct.name}`);
    setDeletingProduct(null);
  };

  const handleBulkDeleteConfirm = () => {
    if (!deletingBulkProducts) return;
    const { rows, clear } = deletingBulkProducts;
    const ids = rows.map(r => r.id);
    ids.forEach(id => deleteProduct(id));
    toast.success(`Đã xóa ${ids.length} sản phẩm`);
    clear();
    setDeletingBulkProducts(null);
  };

  const handleExportCsv = () => {
    if (data.length === 0) {
      toast.error('Không có dữ liệu để xuất');
      return;
    }
    exportToCsv('danh-muc-san-pham', data, [
      { header: 'Mã hàng', accessor: (row) => row.sku },
      { header: 'Tên hàng hóa', accessor: (row) => row.name },
      { header: 'Nhóm hàng', accessor: (row) => row.category },
      { header: 'Giá bán', accessor: (row) => row.price },
      { header: 'Giá vốn', accessor: (row) => row.costPrice },
      { header: 'Tồn kho', accessor: (row) => row.onHand },
      { header: 'Trạng thái', accessor: (row) => row.status },
    ]);
    toast.success('Đã xuất file CSV');
  };

  // Unit management logic inside modal
  const handleAddUnit = () => {
    setEditingUnits([...editingUnits, { id: Date.now().toString(), unitCode: 'BOX', conversionFactor: 12, barcode: '', price: 0 }]);
  };
  const handleUpdateUnit = (id: string, field: keyof ProductUnit, value: any) => {
    setEditingUnits(editingUnits.map(u => u.id === id ? { ...u, [field]: value } : u));
  };
  const handleRemoveUnit = (id: string) => {
    setEditingUnits(editingUnits.filter(u => u.id !== id));
  };

  const columns = useMemo<ColumnDef<ProductInventory>[]>(
    () => [
      {
        id: 'stt',
        header: 'STT',
        cell: (info) => <span className="text-gray-500 font-medium">{info.row.index + 1}</span>,
        meta: { align: 'center' }
      },
      {
        accessorKey: 'sku',
        header: 'SKU / Mã SP',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Tên Sản Phẩm',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-700 shrink-0 flex items-center justify-center shadow-inner">
              {row.original.mainImage ? (
                <img src={row.original.mainImage} alt={row.original.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-5 h-5 text-gray-400 opacity-50" />
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{row.original.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{row.original.brand}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Danh mục',
        cell: (info) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/20">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'price',
        header: 'Giá Bán lẻ',
        cell: (info) => (
          <span className="font-bold text-emerald-700 dark:text-emerald-400 text-right block">
            {(info.getValue() as number).toLocaleString('vi-VN')}₫
          </span>
        ),
        meta: { align: 'right' }
      },
      {
        accessorKey: 'onHand',
        header: 'Tồn kho',
        cell: ({ row }) => {
          const threshold = getLowStockThreshold();
          const isLowStock = row.original.onHand <= threshold;
          return (
            <div className="text-right">
              <span className={`font-bold inline-flex items-center gap-1 ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                {row.original.onHand}
              </span>
              <span className="text-gray-500 ml-1 text-xs">{row.original.unit}</span>
            </div>
          );
        },
        meta: { align: 'right' }
      },
      {
        accessorKey: 'units',
        header: 'Đơn vị quy đổi',
        cell: ({ row }) => {
          const baseUnit = row.original.unit;
          const alternateUnits = row.original.units || [];
          
          if (alternateUnits.length === 0) {
            return (
              <span className="inline-flex items-center text-[11px] font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded-md w-fit">
                Chỉ {baseUnit}
              </span>
            );
          }
          
          return (
            <div className="flex flex-col gap-1">
              {alternateUnits.map((u) => (
                <span 
                  key={u.id}
                  className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/20 px-2 py-0.5 rounded-md w-fit"
                >
                  1 {u.unitCode} = {u.conversionFactor} {baseUnit}
                </span>
              ))}
            </div>
          );
        }
      },
      {
        accessorKey: 'lastUpdated',
        header: 'Cập nhật',
        cell: (info) => <span className="text-xs text-gray-500">{info.getValue() as string || 'N/A'}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {status === 'ACTIVE' ? 'Đang bán' : 'Ngừng KD'}
            </span>
          );
        },
        meta: { align: 'center' }
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedProduct(row.original); }}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingProduct(row.original); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
        meta: { align: 'center' }
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh Mục Hàng Hóa & Tồn Kho</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý danh mục hàng hóa, giá vốn, giá bán lẻ và các đơn vị tính quy đổi.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất file CSV
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Thêm Sản Phẩm Mới
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Danh mục:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.categoryName}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Lọc Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang kinh doanh</option>
                <option value="INACTIVE">Ngừng kinh doanh</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Cập nhật từ (dd/mm/yyyy):</span>
              <input 
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Đến (dd/mm/yyyy):</span>
              <input 
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              />
            </div>

            {(categoryFilter !== 'all' || statusFilter !== 'all' || fromDate || toDate) && (
              <button
                onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setFromDate(''); setToDate(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-100 dark:bg-gray-900 p-6 rounded-full mb-4">
              <Package2 className="w-12 h-12 text-gray-400 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Không có sản phẩm</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-sm">
              {data.length === 0 
                ? 'Chưa có sản phẩm nào trong hệ thống. Hãy thêm sản phẩm mới để bắt đầu quản lý kho hàng.'
                : 'Không tìm thấy sản phẩm nào phù hợp với tiêu chí tìm kiếm hiện tại.'}
            </p>
            {data.length === 0 && (
              <button 
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm Sản Phẩm Mới
              </button>
            )}
          </div>
        ) : (
          <ReusableDataTable 
            columns={columns} 
            data={filtered} 
            isLoading={isLoading}
            globalFilterPlaceholder="Tìm kiếm sản phẩm (Tên, SKU, Thương hiệu)..."
            onRowClick={(row) => setSelectedProduct(row)} 
            bulkActions={(selectedRows, clearSelection) => (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setDeletingBulkProducts({ rows: selectedRows, clear: clearSelection })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 rounded-md text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa đã chọn
                </button>
              </div>
            )}
          />
        )}
      </div>

      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct ? `Thông tin sản phẩm: ${selectedProduct.sku}` : 'Sản phẩm'}
        width="max-w-xl"
      >
        {selectedProduct && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden">
                {selectedProduct.mainImage ? (
                  <img src={selectedProduct.mainImage} alt={selectedProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{selectedProduct.category}</span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mt-1">{selectedProduct.name}</h2>
                <div className="flex gap-3 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Tag className="w-4 h-4" /> {selectedProduct.brand}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedProduct.location}</span>
                </div>
              </div>
            </div>

            {/* Gallery Images List */}
            {selectedProduct.galleryImages && selectedProduct.galleryImages.length > 0 && (
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-950/40 rounded-xl border border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Thư viện ảnh phụ</span>
                <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                  {selectedProduct.galleryImages.map((img, idx) => (
                    <a 
                      key={idx}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0 hover:scale-105 active:scale-95 transition-all shadow-sm"
                    >
                      <img src={img} alt={`${selectedProduct.name} gallery ${idx}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Barcode / SKU Block */}
              <div className="col-span-full md:col-span-1 bg-white dark:bg-gray-800 border p-4 rounded-xl flex flex-col items-center justify-center space-y-1 shadow-sm">
                <Barcode className="w-16 h-12 text-gray-800 dark:text-gray-200" strokeWidth={1} />
                <span className="font-mono text-xs font-bold tracking-widest text-gray-600 dark:text-gray-400">{selectedProduct.sku}</span>
              </div>
              
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl">
                <p className="text-xs text-emerald-800 font-semibold uppercase">Giá bán lẻ cơ sở</p>
                <p className="text-2xl font-bold text-emerald-700">{selectedProduct.price.toLocaleString('vi-VN')}đ</p>
                <p className="text-xs text-emerald-600 mt-1">Giá vốn: {selectedProduct.costPrice.toLocaleString('vi-VN')}đ</p>
              </div>
              <div className={`border p-4 rounded-xl ${selectedProduct.onHand <= getLowStockThreshold() ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs font-semibold uppercase ${selectedProduct.onHand <= getLowStockThreshold() ? 'text-red-800' : 'text-gray-600'}`}>Tồn kho khả dụng</p>
                <p className={`text-2xl font-bold ${selectedProduct.onHand <= getLowStockThreshold() ? 'text-red-700' : 'text-gray-900'}`}>{selectedProduct.onHand} {selectedProduct.unit}</p>
                {selectedProduct.onHand <= getLowStockThreshold() && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Cảnh báo sắp hết hàng ({'<' }{getLowStockThreshold() + 1})
                  </p>
                )}
              </div>
            </div>

            {/* PRODUCT UNITS LISTING - High-Fidelity Visual Tree Diagram */}
            <div className="space-y-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Sơ đồ quy đổi đóng gói & Giá bán</span>
              
              <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-100 dark:border-gray-850 shadow-inner">
                {/* Base Unit Node */}
                <div className="bg-white dark:bg-gray-900 border border-emerald-350 p-2.5 rounded-lg text-center flex flex-col items-center gap-1 shadow-sm shrink-0 min-w-[100px]">
                  <CircleDot className="w-5 h-5 text-emerald-600 animate-pulse" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{selectedProduct.unit}</span>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">Gốc</span>
                  <span className="text-[10px] font-mono text-gray-400 mt-0.5">{selectedProduct.price.toLocaleString('vi-VN')}đ</span>
                </div>

                {selectedProduct.units && selectedProduct.units.length > 0 ? (
                  [...selectedProduct.units]
                    .sort((a, b) => a.conversionFactor - b.conversionFactor)
                    .map((u) => (
                      <React.Fragment key={u.id}>
                        {/* Connect arrow with conversion ratio factor badge */}
                        <div className="flex flex-col items-center justify-center text-gray-400 px-1 shrink-0 font-mono">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 px-1 py-0.5 rounded">x{u.conversionFactor}</span>
                          <span className="text-sm">➔</span>
                        </div>

                        {/* High-level packaging node */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 p-2.5 rounded-lg text-center flex flex-col items-center gap-1 shadow-sm shrink-0 min-w-[110px] hover:scale-105 transition-transform duration-200">
                          <Package className="w-5 h-5 text-blue-500" />
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{u.unitCode}</span>
                          <span className="text-[9px] text-gray-500 font-semibold bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                            1 {u.unitCode} = {u.conversionFactor} {selectedProduct.unit}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 font-bold mt-0.5">{u.price.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </React.Fragment>
                    ))
                ) : (
                  <p className="text-xs text-gray-400 italic py-2 ml-4">Chỉ sử dụng đơn vị cơ sở.</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t flex gap-3">
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2.5 rounded-lg text-sm transition-colors">
                Xem Lịch sử Giao dịch
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Sản Phẩm Mới' : 'Cập Nhật Sản Phẩm'}
        width="max-w-2xl"
      >
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            type="button"
            onClick={() => setActiveModalTab('basic')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeModalTab === 'basic' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Thông tin cơ bản
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('units')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeModalTab === 'units' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Kho & Quy đổi
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('images')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeModalTab === 'images' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Hình ảnh
          </button>
        </div>

        <form onSubmit={handleSaveProduct} className="space-y-6">
          {activeModalTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mã SKU *</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tên Sản Phẩm *</label>
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Danh Mục</label>
                  <select
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map(c => <option key={c.id} value={c.categoryName}>{c.categoryName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Thương Hiệu</label>
                  <input
                    type="text"
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giá Bán (đ)</label>
                  <input
                    type="number"
                    value={editingProduct.price || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-emerald-700 font-bold bg-emerald-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Giá Vốn (đ)</label>
                  <input
                    type="number"
                    value={editingProduct.costPrice || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả chi tiết</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 h-24"
                  placeholder="Nhập mô tả sản phẩm..."
                />
              </div>
            </div>
          )}

          {activeModalTab === 'units' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ĐV Tính Cơ Sở (Base Unit)</label>
                  <input
                    type="text"
                    value={editingProduct.unit || 'PCS'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono font-bold bg-gray-100"
                    placeholder="e.g. PCS, CAI"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tồn kho hiện tại</label>
                  <input
                    type="number"
                    value={editingProduct.onHand || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, onHand: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Product Units Sub-form */}
              <div className="border border-gray-200 rounded-lg bg-gray-50 p-3">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-700">Các đơn vị quy đổi (Hộp, Lốc, Thùng)</span>
                  <button type="button" onClick={handleAddUnit} className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-emerald-600 font-semibold hover:bg-gray-100 shadow-sm transition-colors flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Thêm quy đổi
                  </button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {editingUnits.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">Chưa có đơn vị quy đổi nào.</p>}
                  {editingUnits.map((u) => (
                    <div key={u.id} className="bg-white border p-3 rounded-lg relative flex flex-col gap-3 shadow-sm">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Mã ĐV</label>
                          <input 
                            type="text" value={u.unitCode} 
                            onChange={(e) => handleUpdateUnit(u.id, 'unitCode', e.target.value)}
                            className="w-full p-1.5 border rounded text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                            placeholder="vd: BOX"
                          />
                        </div>
                        <div className="w-20">
                          <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">= Base</label>
                          <input 
                            type="number" value={u.conversionFactor} 
                            onChange={(e) => handleUpdateUnit(u.id, 'conversionFactor', parseFloat(e.target.value))}
                            className="w-full p-1.5 border rounded text-xs text-center focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="w-28">
                          <label className="block text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">Giá bán (đ)</label>
                          <input 
                            type="number" value={u.price} 
                            onChange={(e) => handleUpdateUnit(u.id, 'price', parseFloat(e.target.value))}
                            className="w-full p-1.5 border rounded text-xs text-emerald-700 font-bold text-right focus:ring-1 focus:ring-emerald-500 bg-emerald-50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <input 
                          type="text" value={u.barcode} placeholder="Mã vạch riêng cho đơn vị này..."
                          onChange={(e) => handleUpdateUnit(u.id, 'barcode', e.target.value)}
                          className="flex-1 p-1.5 border rounded text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                        />
                        <button type="button" onClick={() => handleRemoveUnit(u.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Xóa đơn vị">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeModalTab === 'images' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ảnh chính sản phẩm</label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 border rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                    {editingProduct.mainImage ? (
                      <img src={editingProduct.mainImage} alt="Main preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400 opacity-50" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editingProduct.mainImage || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, mainImage: e.target.value })}
                      placeholder="Nhập URL hình ảnh..."
                      className="w-full px-3 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-250 font-semibold hover:bg-emerald-100 transition-colors">
                        Chọn tệp ảnh
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditingProduct({ ...editingProduct, mainImage: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {editingProduct.mainImage && (
                        <button
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct, mainImage: '' })}
                          className="text-xs text-red-650 hover:bg-red-50 px-2 py-1.5 rounded-lg border border-red-200 transition-colors"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ảnh phụ (Thư viện ảnh)</label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {(editingProduct.galleryImages || []).map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 bg-gray-50 border rounded-lg overflow-hidden group shadow-xs">
                        <img src={img} alt={`Gallery preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const nextGallery = (editingProduct.galleryImages || []).filter((_, i) => i !== idx);
                            setEditingProduct({ ...editingProduct, galleryImages: nextGallery });
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 hover:bg-red-700 shadow"
                          title="Xóa ảnh phụ"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <label className="w-16 h-16 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <Plus className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] text-gray-400">Thêm ảnh</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach((file) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setEditingProduct((prev) => ({
                                ...prev,
                                galleryImages: [...(prev.galleryImages || []), reader.result as string],
                              }));
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow"
            >
              Lưu Sản Phẩm
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Xóa Sản Phẩm"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa sản phẩm <strong>{deletingProduct?.name}</strong>?</p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setDeletingProduct(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingBulkProducts}
        onClose={() => setDeletingBulkProducts(null)}
        title="Xác nhận xóa hàng loạt"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa <strong className="text-gray-900 dark:text-white">{deletingBulkProducts?.rows.length}</strong> sản phẩm đã chọn không? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingBulkProducts(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleBulkDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Xóa {deletingBulkProducts?.rows.length} sản phẩm
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
