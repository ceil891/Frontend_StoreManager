import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  Plus, Download, Eye, Tag,
  MapPin, Image as ImageIcon, Edit, Trash2, AlertCircle, X,
  CircleDot, Package, Barcode, AlertTriangle, Package2, UploadCloud, Loader2
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { exportToCsv } from '@/shared/utils/exportCsv';
import { useInventoryStore, type ProductInventory, type ProductUnit } from '../store/inventoryStore';
import { useSettingsStore } from '@/shared/store/settingsStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { useColorStore } from '../store/colorStore';
import { useSizeStore } from '../store/sizeStore';

export function InventoryPage() {
  const {
    products: data, addProduct, updateProduct, deleteProduct, categories, fetchProducts, fetchCategories,
    unitsList, fetchUnits, fetchProductUnits, createProductUnit, updateProductUnit, deleteProductUnit,
  } = useInventoryStore();
  const { getLowStockThreshold } = useSettingsStore();
  const [selectedProduct, setSelectedProduct] = useState<ProductInventory | null>(null);

  const { colors, fetchColors } = useColorStore();
  const { sizes, fetchSizes } = useSizeStore();

  // Load real data from backend
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProducts(), fetchCategories(), fetchUnits()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchProducts, fetchCategories, fetchUnits]);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeModalTab, setActiveModalTab] = useState<'basic' | 'units' | 'images' | 'variants'>('basic');
  const [editingProduct, setEditingProduct] = useState<Partial<ProductInventory>>({ units: [], variants: [] });
  const [editingUnits, setEditingUnits] = useState<ProductUnit[]>([]);

  useEffect(() => {
    if (isModalOpen && activeModalTab === 'variants') {
      fetchColors();
      fetchSizes();
    }
  }, [isModalOpen, activeModalTab, fetchColors, fetchSizes]);

  const handleAddVariant = () => {
    const defaultColor = colors.length > 0 ? colors[0].colorName : 'Trắng';
    const defaultSize = sizes.length > 0 ? sizes[0].sizeName : 'M';
    const newVariant = {
      color: defaultColor,
      size: defaultSize,
      skuSuffix: `-${defaultColor.toUpperCase()}-${defaultSize.toUpperCase()}`.replace(/\s+/g, ''),
    };
    setEditingProduct({
      ...editingProduct,
      variants: [...(editingProduct.variants || []), newVariant],
    });
  };

  const handleUpdateVariant = (idx: number, field: string, value: any) => {
    const nextVariants = [...(editingProduct.variants || [])];
    nextVariants[idx] = {
      ...nextVariants[idx],
      [field]: value,
    };
    if (field === 'color' || field === 'size') {
      const colorVal = nextVariants[idx].color || '';
      const sizeVal = nextVariants[idx].size || '';
      nextVariants[idx].skuSuffix = `-${colorVal.toUpperCase()}-${sizeVal.toUpperCase()}`.replace(/\s+/g, '').replace(/Đ/g, 'D').replace(/đ/g, 'd');
    }
    setEditingProduct({
      ...editingProduct,
      variants: nextVariants,
    });
  };

  const handleRemoveVariant = (idx: number) => {
    setEditingProduct({
      ...editingProduct,
      variants: (editingProduct.variants || []).filter((_, i) => i !== idx),
    });
  };
  const [deletingProduct, setDeletingProduct] = useState<ProductInventory | null>(null);
  const [deletingBulkProducts, setDeletingBulkProducts] = useState<{ rows: ProductInventory[], clear: () => void } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const filtered = useMemo(() => {
    return data.filter((item) => {
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
        matchesDate = false;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesDate;
    });
  }, [data, categoryFilter, statusFilter, fromDate, toDate]);

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
      units: [],
      variants: []
    });
    setEditingUnits([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (product: ProductInventory) => {
    setModalMode('edit');
    setActiveModalTab('basic');
    setEditingProduct({ ...product, variants: product.variants || [] });
    try {
      const units = await fetchProductUnits(product.id);
      setEditingUnits(units.filter(u => !u.isBaseUnit));
    } catch {
      setEditingUnits((product.units || []).filter(u => !u.isBaseUnit));
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!isModalOpen || activeModalTab !== 'units' || !editingProduct.id) return;
    fetchProductUnits(editingProduct.id)
      .then(units => setEditingUnits(units.filter(u => !u.isBaseUnit)))
      .catch(() => setEditingUnits([]));
  }, [isModalOpen, activeModalTab, editingProduct.id, fetchProductUnits]);

  const handleSaveProduct = async (e: React.FormEvent) => {
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
      units: editingUnits,
      variants: editingProduct.variants || [],
    };

    try {
      if (modalMode === 'create') {
        await addProduct({ ...payload, units: editingUnits, variants: editingProduct.variants || [] });
        toast.success(`Đã thêm sản phẩm ${payload.name} thành công!`);
      } else if (editingProduct.id) {
        await updateProduct(editingProduct.id, payload);
        
        try {
          const dbUnits = await fetchProductUnits(editingProduct.id);
          const dbConversionUnits = dbUnits.filter(u => !u.isBaseUnit);

          const deletedUnits = dbConversionUnits.filter(dbU => !editingUnits.some(eu => String(eu.id) === String(dbU.id)));
          for (const u of deletedUnits) {
            await deleteProductUnit(editingProduct.id, u.id);
          }

          for (const eu of editingUnits) {
            const unitMaster = unitsList.find(x => x.code === eu.unitCode || x.unitName === eu.unitCode || x.unitName === eu.unitId);
            const unitId = unitMaster ? Number(unitMaster.id) : Number(eu.unitId || 0);
            if (unitId <= 0) continue;

            const apiPayload = {
              unitId: unitId,
              conversionRate: eu.conversionRate,
              price: eu.price,
              barcode: eu.barcode || undefined,
            };

            const isNew = String(eu.id).startsWith('temp-') || !dbConversionUnits.some(dbU => String(dbU.id) === String(eu.id));
            if (isNew) {
              await createProductUnit(editingProduct.id, apiPayload);
            } else {
              await updateProductUnit(editingProduct.id, eu.id, apiPayload);
            }
          }
        } catch (unitErr) {
          console.error('Failed to sync product units on update:', unitErr);
        }

        toast.success(`Đã cập nhật sản phẩm ${payload.name} thành công!`);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error?.message || 'Có lỗi xảy ra khi lưu sản phẩm');
    }
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

  const uploadToCloudinary = async (file: File) => {
    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh lên máy chủ...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'products');
      
      const response: any = await axiosClient.post('/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response && response.imageUrl) {
        setEditingProduct(prev => ({ ...prev, mainImage: response.imageUrl }));
        toast.success('Tải ảnh lên thành công!', { id: toastId });
      } else {
        throw new Error('Lỗi không xác định khi tải ảnh');
      }
    } catch (error: any) {
      toast.error(`Tải ảnh thất bại: ${error.message || 'Lỗi kết nối'}`, { id: toastId });
      // Fallback: show local preview if upload fails
      const objectUrl = URL.createObjectURL(file);
      setEditingProduct(prev => ({ ...prev, mainImage: objectUrl }));
    } finally {
      setIsUploading(false);
    }
  };

  // Unit management — nested API /products/{id}/units
  const handleAddUnit = () => {
    setEditingUnits([...editingUnits, {
      id: `temp-${Date.now()}`,
      unitId: '',
      unitCode: '',
      unitName: '',
      conversionRate: 1,
      barcode: '',
      price: 0,
      isBaseUnit: false,
    }]);
  };

  const handleUpdateUnit = (id: string, field: keyof ProductUnit, value: any) => {
    setEditingUnits(editingUnits.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  const handleUnitMasterChange = (id: string, unitCode: string) => {
    const master = unitsList.find(u => u.code === unitCode);
    setEditingUnits(editingUnits.map(u => u.id === id ? {
      ...u,
      unitCode,
      unitId: master ? master.id : u.unitId,
      unitName: master ? master.unitName : u.unitName,
    } : u));
  };

  const handlePersistUnit = async (unit: ProductUnit) => {
    if (!editingProduct.id) return;
    try {
      if (unit.id.startsWith('temp-')) {
        if (!unit.unitId || !unit.conversionRate || unit.price <= 0) return;
        const created = await createProductUnit(editingProduct.id, {
          unitId: Number(unit.unitId),
          conversionRate: unit.conversionRate,
          price: unit.price,
          barcode: unit.barcode || undefined,
        });
        setEditingUnits(prev => prev.map(u => u.id === unit.id ? created : u));
        toast.success('Đã thêm đơn vị quy đổi');
      } else {
        await updateProductUnit(editingProduct.id, unit.id, {
          conversionRate: unit.conversionRate,
          price: unit.price,
          barcode: unit.barcode || undefined,
        });
        toast.success('Đã cập nhật đơn vị quy đổi');
      }
    } catch {
      toast.error('Không thể lưu đơn vị quy đổi');
    }
  };

  const handleRemoveUnit = async (id: string) => {
    if (editingProduct.id && !id.startsWith('temp-')) {
      try {
        await deleteProductUnit(editingProduct.id, id);
        toast.success('Đã xóa đơn vị quy đổi');
      } catch {
        toast.error('Không thể xóa đơn vị quy đổi');
        return;
      }
    }
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
        header: 'Tên sản phẩm',
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
                  1 {u.unitName || u.unitCode} = {u.conversionRate} {baseUnit}
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

  const handleBulkActions = useCallback((selectedRows: ProductInventory[], clearSelection: () => void) => (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => setDeletingBulkProducts({ rows: selectedRows, clear: clearSelection })}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:hover:bg-red-900/60 dark:text-red-300 rounded-md text-xs font-semibold transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" /> Xóa đã chọn
      </button>
    </div>
  ), []);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh mục hàng hóa & tồn kho</h1>
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
            onRowClick={setSelectedProduct} 
            bulkActions={handleBulkActions}
          />
        )}
      </div>

      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct ? `Thông tin sản phẩm` : 'Sản phẩm'}
        width="max-w-3xl"
      >
        {selectedProduct && (
          <div className="space-y-8 animate-fade-in">
            {/* Hero Section */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Product Image */}
              <div className="w-full md:w-1/3 aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-center shrink-0 shadow-inner relative group">
                {selectedProduct.mainImage ? (
                  <img src={selectedProduct.mainImage} alt={selectedProduct.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ImageIcon className="w-10 h-10 opacity-50" />
                    <span className="text-xs font-medium">Chưa có ảnh</span>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-md shadow-sm ${
                    selectedProduct.status === 'ACTIVE' 
                      ? 'bg-emerald-500/90 text-white' 
                      : 'bg-gray-500/90 text-white'
                  }`}>
                    {selectedProduct.status === 'ACTIVE' ? 'Đang bán' : 'Ngừng KD'}
                  </span>
                </div>
              </div>

              {/* Product Info Summary */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50 uppercase tracking-widest">
                      {selectedProduct.category}
                    </span>
                    <span className="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Barcode className="w-3.5 h-3.5" /> {selectedProduct.sku}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                    <Tag className="w-4 h-4" /> Thương hiệu: <span className="text-gray-800 dark:text-gray-200">{selectedProduct.brand || 'Đang cập nhật'}</span>
                  </p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-2xl">
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Giá bán lẻ (Cơ sở)</p>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-500 tracking-tight">
                      {selectedProduct.price.toLocaleString('vi-VN')}₫
                    </p>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-500/70 font-medium mt-1">
                      Giá vốn: {selectedProduct.costPrice.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                  
                  <div className={`p-4 rounded-2xl border transition-all ${
                    selectedProduct.onHand <= getLowStockThreshold() 
                      ? 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 dark:from-red-950/30 dark:border-red-900/50' 
                      : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 shadow-sm'
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      selectedProduct.onHand <= getLowStockThreshold() ? 'text-red-800 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>Tồn kho khả dụng</p>
                    <p className={`text-3xl font-black tracking-tight ${
                      selectedProduct.onHand <= getLowStockThreshold() ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'
                    }`}>
                      {selectedProduct.onHand} <span className="text-lg font-bold text-gray-400">{selectedProduct.unit}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {selectedProduct.location || 'Chưa xếp kho'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Gallery Images List */}
            {selectedProduct.galleryImages && selectedProduct.galleryImages.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-3">Thư viện ảnh ({selectedProduct.galleryImages.length})</span>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                  {selectedProduct.galleryImages.map((img, idx) => (
                    <a 
                      key={idx}
                      href={img}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-20 h-20 rounded-xl overflow-hidden border border-gray-200/80 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0 hover:scale-105 hover:shadow-md hover:border-indigo-300 transition-all snap-start"
                    >
                      <img src={img} alt={`${selectedProduct.name} gallery ${idx}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Product Units & Conversion Diagram */}
            <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5">
              <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-4">
                Đơn vị quy đổi & Giá bán linh hoạt
              </span>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Base Unit */}
                <div className="relative group bg-white dark:bg-gray-800 border-2 border-emerald-400/50 dark:border-emerald-500/50 rounded-xl p-4 flex flex-col items-center min-w-[120px] shadow-sm hover:shadow-md hover:border-emerald-500 transition-all">
                  <div className="absolute -top-2.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">CƠ SỞ</div>
                  <CircleDot className="w-6 h-6 text-emerald-500 mb-2" />
                  <span className="font-black text-gray-900 dark:text-white text-lg">{selectedProduct.unit}</span>
                  <span className="text-xs font-mono font-medium text-gray-500 mt-1">{selectedProduct.price.toLocaleString('vi-VN')}₫</span>
                </div>

                {selectedProduct.units && selectedProduct.units.length > 0 ? (
                  [...selectedProduct.units]
                    .sort((a, b) => a.conversionRate - b.conversionRate)
                    .map((u) => (
                      <React.Fragment key={u.id}>
                        <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 px-2 shrink-0">
                          <span className="text-[11px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md mb-1 shadow-sm border border-indigo-100 dark:border-indigo-800/30">
                            x{u.conversionRate}
                          </span>
                          <span className="text-xl">➔</span>
                        </div>

                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center min-w-[120px] shadow-sm hover:shadow-md hover:border-indigo-400 transition-all group">
                          <Package className="w-6 h-6 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="font-black text-gray-900 dark:text-white text-lg">{u.unitCode}</span>
                          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1">{u.price.toLocaleString('vi-VN')}₫</span>
                        </div>
                      </React.Fragment>
                    ))
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-400 italic px-4">
                    Chỉ áp dụng kinh doanh đơn vị cơ sở.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Footer inside Modal */}
            <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-2">
                <button 
                  onClick={() => { setSelectedProduct(null); handleOpenEdit(selectedProduct); }}
                  className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Cập nhật
                </button>
              </div>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm sản phẩm mới' : 'Cập nhật sản phẩm'}
        width="max-w-3xl"
      >
        {/* Premium segmented tabs */}
        <div className="bg-gray-100/80 dark:bg-gray-900/50 p-1 rounded-xl flex items-center mb-8 border border-gray-200/50 dark:border-gray-800/50 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveModalTab('basic')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              activeModalTab === 'basic' 
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Thông tin cơ bản
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('units')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              activeModalTab === 'units' 
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Kho & Quy đổi
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('images')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              activeModalTab === 'images' 
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Hình ảnh
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('variants')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
              activeModalTab === 'variants' 
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Biến thể
          </button>
        </div>

        <form onSubmit={handleSaveProduct} className="space-y-6">
          {activeModalTab === 'basic' && (
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Mã SKU <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="VD: SP-001"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Tên Sản Phẩm <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="Nhập tên sản phẩm..."
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Danh mục</label>
                  <select
                    value={editingProduct.category || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                  >
                    {categories.map(c => <option key={c.id} value={c.categoryName}>{c.categoryName}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Thương hiệu</label>
                  <input
                    type="text"
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    placeholder="VD: Samsung, Nike..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Trạng thái</label>
                  <select
                    value={editingProduct.status || 'ACTIVE'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                  >
                    <option value="ACTIVE">Đang bán</option>
                    <option value="INACTIVE">Ngừng KD (tắt HĐ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Giá bán lẻ (₫)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₫</span>
                    <input
                      type="number"
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                      className="w-full pl-8 pr-4 py-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-sm font-black text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Giá vốn (₫)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₫</span>
                    <input
                      type="number"
                      value={editingProduct.costPrice || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, costPrice: parseFloat(e.target.value) })}
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-gray-500/50 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Mô tả chi tiết</label>
                <textarea
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm h-28 resize-none"
                  placeholder="Nhập thông tin mô tả sản phẩm..."
                />
              </div>
            </div>
          )}

          {activeModalTab === 'units' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wide">ĐV tính cơ sở (base unit)</label>
                  <select
                    value={editingProduct.unit || 'Cái'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-700 rounded-xl text-sm font-black text-indigo-700 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500/50 uppercase shadow-sm appearance-none"
                  >
                    {unitsList.length > 0 ? (
                      unitsList.map(u => <option key={u.id} value={u.unitName}>{u.unitName} ({u.code})</option>)
                    ) : (
                      <option value={editingProduct.unit}>{editingProduct.unit}</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Tồn kho hiện tại</label>
                  <input
                    type="number"
                    value={editingProduct.onHand || 0}
                    onChange={(e) => setEditingProduct({ ...editingProduct, onHand: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500/50 shadow-sm"
                  />
                </div>
              </div>

              {/* Product Units Sub-form */}
              <div>
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Đơn vị quy đổi phụ</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Thiết lập Hộp, Thùng, Lốc... và giá bán tương ứng.</p>
                  </div>
                  <button type="button" onClick={handleAddUnit} className="text-xs bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1.5 active:scale-95">
                    <Plus className="w-4 h-4" /> Thêm quy đổi
                  </button>
                </div>

                <div className="space-y-3">
                  {editingUnits.length === 0 && (
                    <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Package2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sản phẩm này chỉ bán theo Đơn vị cơ sở.</p>
                      <p className="text-xs text-gray-400 mt-1">Nhấn "Thêm quy đổi" để thiết lập bán theo thùng/hộp.</p>
                    </div>
                  )}
                  {editingUnits.map((u) => (
                    <div key={u.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-2xl flex flex-col gap-4 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                      <div className="flex gap-4 items-end">
                        <div className="flex-1 space-y-1.5">
                          <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Mã ĐV phụ</label>
                          <select 
                            value={u.unitCode} 
                            onChange={(e) => handleUnitMasterChange(u.id, e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                          >
                            <option value="">Chọn ĐV</option>
                            {unitsList.map(unit => (
                              <option key={unit.id} value={unit.code}>{unit.unitName} ({unit.code})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24 space-y-1.5">
                          <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider text-center">= Base</label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">x</span>
                            <input 
                              type="number" value={u.conversionRate} 
                              onChange={(e) => handleUpdateUnit(u.id, 'conversionRate', parseFloat(e.target.value) || 1)}
                              onBlur={() => editingProduct.id && handlePersistUnit(u)}
                              className="w-full pl-6 pr-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500/50"
                            />
                          </div>
                        </div>
                        <div className="w-32 space-y-1.5">
                          <label className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Giá bán (đ)</label>
                          <input 
                            type="number" value={u.price} 
                            onChange={(e) => handleUpdateUnit(u.id, 'price', parseFloat(e.target.value) || 0)}
                            onBlur={() => editingProduct.id && handlePersistUnit(u)}
                            className="w-full px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-700 dark:text-emerald-400 font-black text-right focus:ring-2 focus:ring-emerald-500/50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="flex-1 relative">
                          <Barcode className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" value={u.barcode || ''} placeholder="Mã vạch riêng cho quy cách đóng gói này..."
                            onChange={(e) => handleUpdateUnit(u.id, 'barcode', e.target.value)}
                            onBlur={() => editingProduct.id && handlePersistUnit(u)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/50"
                          />
                        </div>
                        {u.id.startsWith('temp-') && editingProduct.id && (
                          <button type="button" onClick={() => handlePersistUnit(u)} className="text-xs px-3 py-2 bg-indigo-600 text-white rounded-lg font-bold">
                            Lưu
                          </button>
                        )}
                        <button type="button" onClick={() => handleRemoveUnit(u.id)} className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors border border-red-100 dark:border-red-900/30" title="Xóa đơn vị">
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
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">Ảnh chính sản phẩm</label>
                <div 
                  className={`border-2 border-dashed rounded-2xl p-8 transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer group ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      uploadToCloudinary(file);
                    }
                  }}
                  onClick={() => !isUploading && document.getElementById('main-image-input')?.click()}
                >
                  <input
                    id="main-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        uploadToCloudinary(file);
                      }
                    }}
                  />
                  {editingProduct.mainImage ? (
                    <div className="relative w-40 h-40 rounded-xl overflow-hidden shadow-md">
                      <img src={editingProduct.mainImage} alt="Main preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-sm">Thay đổi ảnh</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct({ ...editingProduct, mainImage: '' });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 hover:scale-110 active:scale-95 transition-all shadow-lg"
                        title="Xóa ảnh"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-8 h-8 text-indigo-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          Nhấn để tải lên <span className="text-gray-500 dark:text-gray-400 font-medium">hoặc kéo thả ảnh vào đây</span>
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">
                          PNG, JPG, WEBP (Tối đa 5MB)
                        </div>
                      </div>
                    </>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Đang tải lên...</span>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Hoặc sử dụng URL hình ảnh trực tiếp</label>
                  <input
                    type="text"
                    value={editingProduct.mainImage?.startsWith('blob:') ? '' : (editingProduct.mainImage || '')}
                    onChange={(e) => setEditingProduct({ ...editingProduct, mainImage: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  />
                  {editingProduct.mainImage?.startsWith('blob:') && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      Ảnh từ máy tính chỉ xem trước tạm thời. Để lưu vào hệ thống, hãy tải lên dịch vụ lưu trữ (Cloudinary, Imgur...) và dán URL vào ô trên.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-bold text-gray-900 dark:text-white">Thư viện ảnh phụ</label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded-lg">{(editingProduct.galleryImages || []).length} / 5 ảnh</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {(editingProduct.galleryImages || []).map((img, idx) => (
                    <div key={idx} className="relative w-24 h-24 bg-gray-50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden group shadow-sm">
                      <img src={img} alt={`Gallery preview ${idx}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        type="button"
                        onClick={() => {
                          const nextGallery = (editingProduct.galleryImages || []).filter((_, i) => i !== idx);
                          setEditingProduct({ ...editingProduct, galleryImages: nextGallery });
                        }}
                        className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:scale-110 active:scale-95 transition-all shadow-lg"
                        title="Xóa ảnh phụ"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-indigo-400 transition-colors group">
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 group-hover:scale-110 transition-all mb-1" />
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-500">Thêm ảnh</span>
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
          )}

          {activeModalTab === 'variants' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Danh sách biến thể sản phẩm</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Thêm các phân loại sản phẩm như kích thước (Size) hoặc màu sắc (Color) để quản lý riêng biệt.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm biến thể
                  </button>
                </div>

                <div className="space-y-3">
                  {(editingProduct.variants || []).length === 0 ? (
                    <div className="text-center py-8 text-gray-400 border border-dashed rounded-xl dark:border-gray-800">
                      <p className="text-sm">Chưa có biến thể nào được tạo.</p>
                      <p className="text-xs mt-1">Sản phẩm này hiện đang được kinh doanh ở dạng đơn nhất (không có thuộc tính phân loại).</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 gap-3 px-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-4">Màu sắc</div>
                        <div className="col-span-4">Kích thước</div>
                        <div className="col-span-3">Hậu tố SKU (Suffix)</div>
                        <div className="col-span-1 text-center">Xóa</div>
                      </div>
                      
                      {(editingProduct.variants || []).map((variant, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-150 dark:border-gray-750">
                          {/* Color select or custom input */}
                          <div className="col-span-4">
                            <select
                              value={variant.color || ''}
                              onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {colors.map(c => <option key={c.id} value={c.colorName}>{c.colorName}</option>)}
                              <option value="Đỏ">Đỏ</option>
                              <option value="Xanh">Xanh</option>
                              <option value="Vàng">Vàng</option>
                              <option value="Trắng">Trắng</option>
                              <option value="Đen">Đen</option>
                            </select>
                          </div>

                          {/* Size select or custom input */}
                          <div className="col-span-4">
                            <select
                              value={variant.size || ''}
                              onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {sizes.map(s => <option key={s.id} value={s.sizeName}>{s.sizeName}</option>)}
                              <option value="S">S</option>
                              <option value="M">M</option>
                              <option value="L">L</option>
                              <option value="XL">XL</option>
                              <option value="XXL">XXL</option>
                            </select>
                          </div>

                          {/* SKU Suffix */}
                          <div className="col-span-3">
                            <input
                              type="text"
                              value={variant.skuSuffix || ''}
                              onChange={(e) => handleUpdateVariant(idx, 'skuSuffix', e.target.value)}
                              placeholder="-SUFFIX"
                              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          {/* Delete button */}
                          <div className="col-span-1 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveVariant(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Xóa biến thể"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-8">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
            >
              Lưu sản phẩm
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Xóa sản phẩm"
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
