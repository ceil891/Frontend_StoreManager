import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Tag, DollarSign, Calendar, ShieldCheck, Trash2, Edit } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useLogisticsStore, type PriceListSchedule, type PriceListDetail } from '../store/logisticsStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { axiosClient } from '@/shared/lib/axiosClient';

type ProductUnitOption = {
  id: string;
  unitId: string;
  unitCode: string;
  unitName: string;
  isBaseUnit: boolean;
  price: number;
};

const mapUnitOption = (u: any): ProductUnitOption => ({
  id: String(u.id),
  unitId: String(u.unitId ?? u.id),
  unitCode: u.unitCode || '',
  unitName: u.unitName || u.unitCode || '',
  isBaseUnit: Boolean(u.isBaseUnit),
  price: Number(u.price || 0),
});

const tierBadgeStyles = {
  RETAIL_DEFAULT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  WHOLESALE_TIER1: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  DISTRIBUTOR_VIP: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  EMPLOYEE_COST: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

export function PriceListsPage() {
  const { priceLists: data, fetchPriceLists, addPriceList, updatePriceList, deletePriceList } = useLogisticsStore();
  const { products, fetchProducts, fetchProductUnits } = useInventoryStore();

  const [search, setSearch] = useState('');
  const [selectedList, setSelectedList] = useState<PriceListSchedule | null>(null);
  const [productUnitsCache, setProductUnitsCache] = useState<Record<string, ProductUnitOption[]>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    fetchPriceLists();
    fetchProducts();
  }, [fetchPriceLists, fetchProducts]);
  
  const [editingList, setEditingList] = useState<Partial<PriceListSchedule>>({ details: [] });
  const [editingDetails, setEditingDetails] = useState<PriceListDetail[]>([]);

  const [deletingList, setDeletingList] = useState<PriceListSchedule | null>(null);

  const filtered = data.filter((item) =>
    item.listCode.toLowerCase().includes(search.toLowerCase()) ||
    item.listName.toLowerCase().includes(search.toLowerCase()) ||
    item.applicableBranches.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingList({
      listCode: `PL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      listName: '',
      currency: 'USD',
      pricingTier: 'RETAIL_DEFAULT',
      effectiveDate: new Date().toISOString().split('T')[0],
      expirationDate: '',
      markupPercentage: 0,
      status: 'DRAFT',
      applicableBranches: 'All Branches',
      notes: '',
      details: []
    });
    setEditingDetails([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (list: PriceListSchedule) => {
    setModalMode('edit');
    setEditingList(list);
    const details = list.details || [];
    setEditingDetails(details);
    setIsModalOpen(true);
    for (const d of details) {
      const product = products.find(p => p.sku === d.sku);
      if (product) await loadProductUnits(product.id);
    }
  };

  const handleSaveList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList.listCode || !editingList.listName) return;

    const payload: Omit<PriceListSchedule, 'id'> = {
      listCode: editingList.listCode,
      listName: editingList.listName,
      currency: editingList.currency as any || 'USD',
      pricingTier: editingList.pricingTier as any || 'RETAIL_DEFAULT',
      effectiveDate: editingList.effectiveDate || '',
      expirationDate: editingList.expirationDate || '',
      markupPercentage: Number(editingList.markupPercentage) || 0,
      status: editingList.status as any || 'DRAFT',
      applicableBranches: editingList.applicableBranches || '',
      notes: editingList.notes || '',
      details: editingDetails
    };

    if (modalMode === 'create') {
      addPriceList(payload);
    } else if (editingList.id) {
      updatePriceList(editingList.id, payload);
    }
    setIsModalOpen(false);
  };

  const formatCurrencyVN = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '0 đ';
    return `${Math.round(amount).toLocaleString('vi-VN')} đ`;
  };

  const handleDeleteAttempt = (list: PriceListSchedule) => {
    setSelectedList(null);
    if (list.status === 'ACTIVE') {
      toast.error('Bảng giá đang ở trạng thái hoạt động. Vui lòng đổi trạng thái thành bản nháp hoặc tạm khóa trước khi xóa!');
      return;
    }
    setDeletingList(list);
  };

  const handleDeleteConfirm = () => {
    if (!deletingList) return;
    deletePriceList(deletingList.id);
    toast.success('Đã xóa bảng giá thành công!');
    setDeletingList(null);
  };

  // Details Handling
  const loadProductUnits = async (productId: string): Promise<ProductUnitOption[]> => {
    if (productUnitsCache[productId]) {
      return productUnitsCache[productId];
    }
    try {
      const data = await fetchProductUnits(productId);
      const mapped = data.map(u => ({
        id: u.id,
        unitId: u.unitId || u.id,
        unitCode: u.unitCode,
        unitName: u.unitName,
        isBaseUnit: Boolean(u.isBaseUnit),
        price: u.price,
      }));
      setProductUnitsCache(prev => ({ ...prev, [productId]: mapped }));
      return mapped;
    } catch {
      const data = await axiosClient.get<any, any[]>(`/products/${productId}/units`);
      const mapped = (data || []).map(mapUnitOption);
      setProductUnitsCache(prev => ({ ...prev, [productId]: mapped }));
      return mapped;
    }
  };

  const handleAddDetail = async () => {
    if (products.length === 0) {
      alert("Không có sản phẩm nào trong kho để tạo chi tiết giá.");
      return;
    }
    const firstProduct = products[0];
    const units = await loadProductUnits(firstProduct.id);
    const baseUnit = units.find(u => u.isBaseUnit) ?? units[0];
    setEditingDetails([...editingDetails, { 
      id: Date.now().toString(), 
      sku: firstProduct.sku, 
      productName: firstProduct.name, 
      basePrice: firstProduct.price, 
      overridePrice: baseUnit?.price ?? firstProduct.price,
      productUnitId: baseUnit?.id,
      unitName: baseUnit?.unitName,
    }]);
  };

  const handleDetailSkuChange = async (id: string, newSku: string) => {
    const product = products.find(p => p.sku === newSku);
    if (!product) return;

    const units = await loadProductUnits(product.id);
    const baseUnit = units.find(u => u.isBaseUnit) ?? units[0];
    
    setEditingDetails(editingDetails.map(d => 
      d.id === id ? {
        ...d,
        sku: product.sku,
        productName: product.name,
        basePrice: product.price,
        overridePrice: baseUnit?.price ?? product.price,
        productUnitId: baseUnit?.id,
        unitName: baseUnit?.unitName,
      } : d
    ));
  };

  const handleDetailUnitChange = (detailId: string, productUnitId: string) => {
    const detail = editingDetails.find(d => d.id === detailId);
    const product = products.find(p => p.sku === detail?.sku);
    if (!product) return;
    const units = productUnitsCache[product.id] || [];
    const unit = units.find(u => u.id === productUnitId);
    setEditingDetails(editingDetails.map(d =>
      d.id === detailId ? {
        ...d,
        productUnitId,
        unitName: unit?.unitName,
        basePrice: unit?.price ?? d.basePrice,
        overridePrice: unit?.price ?? d.overridePrice,
      } : d
    ));
  };

  const handleDetailPriceChange = (id: string, overridePrice: number) => {
    setEditingDetails(editingDetails.map(d => d.id === id ? { ...d, overridePrice: Math.max(0, overridePrice) } : d));
  };

  const handleRemoveDetail = (id: string) => {
    setEditingDetails(editingDetails.filter(d => d.id !== id));
  };

  const columns = useMemo<ColumnDef<PriceListSchedule>[]>(
    () => [
      {
        accessorKey: 'listCode',
        header: 'Mã bảng giá',
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'listName',
        header: 'Tên / phạm vi',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.listName}</p>
            <p className="text-xs text-gray-500 font-mono">Phạm vi: {row.original.applicableBranches}</p>
          </div>
        ),
      },
      {
        accessorKey: 'pricingTier',
        header: 'Cấp độ giá',
        cell: (info) => {
          const t = info.getValue() as keyof typeof tierBadgeStyles;
          const tierLabels: Record<string, string> = {
            RETAIL_DEFAULT: 'Bán lẻ',
            WHOLESALE_TIER1: 'Khách sỉ',
            DISTRIBUTOR_VIP: 'Đại lý',
            EMPLOYEE_COST: 'Nội bộ'
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${tierBadgeStyles[t]}`}>
              {tierLabels[t] || (t ? t.replace(/_/g, ' ') : 'Mặc định')}
            </span>
          );
        },
      },
      {
        accessorKey: 'markupPercentage',
        header: 'Biên độ lợi nhuận (markup)',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{info.getValue() as number}%</span>,
      },
      {
        accessorKey: 'details',
        header: 'Ghi đè giá theo SKU',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-gray-900 dark:text-white">{row.original.details?.length || 0} mục</span>
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
              status === 'FUTURE_SCHEDULED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'DRAFT' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }`}>
              {status === 'ACTIVE' ? 'Hoạt động' : status === 'DRAFT' ? 'Bản nháp' : status === 'FUTURE_SCHEDULED' ? 'Lên lịch trước' : status.replace('_', ' ')}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedList(row.original); }}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteAttempt(row.original); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
              title="Xóa bảng giá"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng giá sản phẩm & thiết lập định giá</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý bảng giá, chính sách giá sỉ (B2B) và ghi đè giá đặc biệt theo SKU</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Thêm mới bảng giá
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã bảng giá, tên hoặc phạm vi chi nhánh..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} />
      </div>

      {/* Modal Xem thông tin bảng giá */}
      <Modal
        isOpen={!!selectedList}
        onClose={() => setSelectedList(null)}
        title={selectedList ? `Bảng giá: ${selectedList.listCode}` : 'Thông tin bảng giá'}
        width="max-w-xl"
      >
        {selectedList && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedList.status === 'ACTIVE' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedList.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-gray-600'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Tỷ lệ markup mục tiêu</p>
                  <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">+{selectedList.markupPercentage}% trên giá vốn</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Tag className="w-4 h-4 text-primary" /> SKU ghi đè giá
                </div>
                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white truncate">{selectedList.details?.length || 0} mục</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Tiền tệ áp dụng
                </div>
                <p className="text-xl font-bold font-mono text-primary truncate">{selectedList.currency || 'VND'} ({formatCurrencyVN(100000)})</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-medium text-gray-400 block mb-1">Tên bảng giá</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedList.listName}</h3>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Áp dụng cho:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedList.applicableBranches}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-gray-500 font-sans dark:text-gray-400">Hiệu lực từ:</span>
                <span className="text-gray-800 dark:text-gray-200">{selectedList.effectiveDate}</span>
              </div>
              {selectedList.expirationDate && (
                <div className="flex justify-between font-mono">
                  <span className="text-gray-500 font-sans dark:text-gray-400">Đến ngày:</span>
                  <span className="text-red-500 font-semibold">{selectedList.expirationDate}</span>
                </div>
              )}
            </div>

            {/* Price Override Details View */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
               <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Các SKU được ghi đè giá
                </span>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {selectedList.details && selectedList.details.length > 0 ? (
                  selectedList.details.map(d => (
                    <div key={d.id} className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{d.productName}</p>
                        <p className="text-xs text-gray-500 font-mono">{d.sku}</p>
                      </div>
                      <div className="text-right font-mono">
                        <p className="text-xs text-gray-400 line-through">{formatCurrencyVN(d.basePrice)}</p>
                        <p className="font-bold text-primary text-sm">{formatCurrencyVN(d.overridePrice)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-2">Bảng giá này áp dụng tỷ lệ markup chung, không có sản phẩm ghi đè giá riêng.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setSelectedList(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium rounded-lg text-sm text-gray-700 dark:text-gray-300">
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới bảng giá' : 'Cập nhật bảng giá'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSaveList} className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Header Info */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase border-b border-gray-200 dark:border-gray-700 pb-1">Cấu hình bảng giá</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Mã bảng giá *</label>
                  <input
                    type="text"
                    value={editingList.listCode || ''}
                    onChange={(e) => setEditingList({ ...editingList, listCode: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono font-bold text-primary text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Cấp độ giá</label>
                  <select
                    value={editingList.pricingTier || 'RETAIL_DEFAULT'}
                    onChange={(e) => setEditingList({ ...editingList, pricingTier: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                  >
                    <option value="RETAIL_DEFAULT">Bán lẻ</option>
                    <option value="WHOLESALE_TIER1">Khách sỉ</option>
                    <option value="DISTRIBUTOR_VIP">Đại lý</option>
                    <option value="EMPLOYEE_COST">Nội bộ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Tên bảng giá *</label>
                <input
                  type="text"
                  value={editingList.listName || ''}
                  onChange={(e) => setEditingList({ ...editingList, listName: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Tỷ lệ markup (%)</label>
                  <input
                    type="text"
                    value={editingList.markupPercentage ?? 0}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/^0+(?=\d)/, '');
                      setEditingList({ ...editingList, markupPercentage: parseFloat(clean) || 0 });
                    }}
                    className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/30"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Tiền tệ</label>
                  <select
                    value={editingList.currency || 'VND'}
                    onChange={(e) => setEditingList({ ...editingList, currency: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                  >
                    <option value="VND">VNĐ (Việt Nam Đồng)</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Hiệu lực từ *</label>
                  <input
                    type="date"
                    value={editingList.effectiveDate || ''}
                    onChange={(e) => setEditingList({ ...editingList, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Đến ngày</label>
                  <input
                    type="date"
                    value={editingList.expirationDate || ''}
                    onChange={(e) => setEditingList({ ...editingList, expirationDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
                  <select
                    value={editingList.status || 'DRAFT'}
                    onChange={(e) => setEditingList({ ...editingList, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="FUTURE_SCHEDULED">Lên lịch trước</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh áp dụng</label>
                  <input
                    type="text"
                    value={editingList.applicableBranches || ''}
                    onChange={(e) => setEditingList({ ...editingList, applicableBranches: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
                    placeholder="Tất cả chi nhánh"
                  />
                </div>
              </div>
            </div>

            {/* Items Detail */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase border-b border-gray-200 dark:border-gray-700 pb-1">Chi tiết giá theo SKU</h3>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Giá riêng lẻ theo SKU:</span>
                  <button type="button" onClick={handleAddDetail} className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-3 py-1 rounded text-primary font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    + Thêm SKU
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {editingDetails.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">Chưa có SKU nào được chỉ định giá riêng.</p>}
                  
                  {editingDetails.map((d) => {
                    const product = products.find(p => p.sku === d.sku);
                    const unitOptions = product ? (productUnitsCache[product.id] || []) : [];
                    return (
                    <div key={d.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2.5 rounded-lg flex flex-col gap-2 shadow-sm">
                      <div>
                        <label className="block text-[10px] text-gray-500 dark:text-gray-400 font-medium">Sản phẩm (SKU)</label>
                        <select 
                          value={d.sku}
                          onChange={(e) => handleDetailSkuChange(d.id, e.target.value)}
                          className="w-full p-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
                        >
                          {products.map(p => <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="w-1/2">
                          <label className="block text-[10px] text-gray-400 font-medium">Giá chuẩn</label>
                          <input 
                            type="text" readOnly value={formatCurrencyVN(d.basePrice)} 
                            className="w-full p-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-500 bg-gray-100 dark:bg-gray-900 font-mono"
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-[10px] text-primary font-medium">Giá ghi đè *</label>
                          <input 
                            type="number" value={d.overridePrice} 
                            onChange={(e) => handleDetailPriceChange(d.id, parseFloat(e.target.value.replace(/^0+(?=\d)/, '')) || 0)}
                            className="w-full p-1.5 border border-primary/30 rounded text-xs text-primary font-bold bg-primary/5 text-right font-mono"
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveDetail(d.id)} className="text-red-500 hover:text-red-700 p-1.5 mb-0.5 transition-colors" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );})}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác nhận xóa */}
      <Modal
        isOpen={!!deletingList}
        onClose={() => setDeletingList(null)}
        title="Xác nhận xóa bảng giá"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4 text-sm">
          <p className="text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa bảng giá <strong className="text-gray-900 dark:text-white">{deletingList?.listName}</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setDeletingList(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Hủy bỏ
            </button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
export default PriceListsPage;
