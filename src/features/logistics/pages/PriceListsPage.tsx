import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Tag, DollarSign, Calendar, ShieldCheck, Trash2, Edit } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useLogisticsStore, type PriceListSchedule, type PriceListDetail } from '../store/logisticsStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';

const tierBadgeStyles = {
  RETAIL_DEFAULT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  WHOLESALE_TIER1: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  DISTRIBUTOR_VIP: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  EMPLOYEE_COST: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

export function PriceListsPage() {
  const { priceLists: data, addPriceList, updatePriceList, deletePriceList } = useLogisticsStore();
  const { products } = useInventoryStore(); // Fetch available products to map prices

  const [search, setSearch] = useState('');
  const [selectedList, setSelectedList] = useState<PriceListSchedule | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
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

  const handleOpenEdit = (list: PriceListSchedule) => {
    setModalMode('edit');
    setEditingList(list);
    setEditingDetails(list.details || []);
    setIsModalOpen(true);
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

  const handleDeleteConfirm = () => {
    if (!deletingList) return;
    deletePriceList(deletingList.id);
    setDeletingList(null);
  };

  // Details Handling
  const handleAddDetail = () => {
    if (products.length === 0) {
      alert("Không có sản phẩm nào trong Inventory để tạo chi tiết giá.");
      return;
    }
    const firstProduct = products[0];
    setEditingDetails([...editingDetails, { 
      id: Date.now().toString(), 
      sku: firstProduct.sku, 
      productName: firstProduct.name, 
      basePrice: firstProduct.price, 
      overridePrice: firstProduct.price 
    }]);
  };

  const handleDetailSkuChange = (id: string, newSku: string) => {
    const product = products.find(p => p.sku === newSku);
    if (!product) return;
    
    setEditingDetails(editingDetails.map(d => 
      d.id === id ? { ...d, sku: product.sku, productName: product.name, basePrice: product.price, overridePrice: product.price } : d
    ));
  };

  const handleDetailPriceChange = (id: string, overridePrice: number) => {
    setEditingDetails(editingDetails.map(d => d.id === id ? { ...d, overridePrice } : d));
  };

  const handleRemoveDetail = (id: string) => {
    setEditingDetails(editingDetails.filter(d => d.id !== id));
  };

  const columns = useMemo<ColumnDef<PriceListSchedule>[]>(
    () => [
      {
        accessorKey: 'listCode',
        header: 'Mã Bảng Giá',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'listName',
        header: 'Tên / Phạm vi',
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
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierBadgeStyles[t]}`}>
              {t.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'markupPercentage',
        header: 'Biên độ (Markup)',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{info.getValue() as number}%</span>,
      },
      {
        accessorKey: 'details',
        header: 'Ghi đè giá',
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
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
              status === 'FUTURE_SCHEDULED' ? 'bg-blue-100 text-blue-800' :
              status === 'DRAFT' ? 'bg-amber-100 text-amber-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {status.replace('_', ' ')}
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
              onClick={(e) => { e.stopPropagation(); setDeletingList(row.original); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh sách giá và lịch trình định giá</h1>
            <p className="text-sm text-gray-500 mt-1">Quản lý bảng giá, chính sách giá sỉ (B2B) và ghi đè giá đặc biệt theo SKU.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border text-gray-700 rounded-lg text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Tạo Bảng Giá
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border shadow-sm">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã bảng giá, tên hoặc phạm vi chi nhánh..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} />
      </div>

      {/* VIEW DRAWER */}
      <Drawer
        isOpen={!!selectedList}
        onClose={() => setSelectedList(null)}
        title={selectedList ? `Bảng giá: ${selectedList.listCode}` : 'Thông tin bảng giá'}
        width="max-w-xl"
      >
        {selectedList && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedList.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedList.status === 'ACTIVE' ? 'bg-emerald-600' : 'bg-gray-600'
                }`}>
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Tỷ lệ Markup mục tiêu</p>
                  <p className="text-2xl font-bold font-mono text-emerald-600 mt-0.5">+{selectedList.markupPercentage}% trên chi phí</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <Tag className="w-4 h-4 text-emerald-600" /> SKU ghi đè giá
                </div>
                <p className="text-xl font-mono font-bold text-gray-900 truncate">{selectedList.details?.length || 0} mục</p>
              </div>
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Tiền tệ áp dụng
                </div>
                <p className="text-xl font-bold font-mono text-gray-900 truncate">{selectedList.currency}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-xl border text-sm">
              <div className="border-b pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Tiêu đề Bảng giá</span>
                <h3 className="text-base font-bold text-gray-900">{selectedList.listName}</h3>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Áp dụng cho:</span>
                <span className="font-semibold">{selectedList.applicableBranches}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-gray-500 font-sans">Hiệu lực từ:</span>
                <span className="text-gray-800">{selectedList.effectiveDate}</span>
              </div>
              {selectedList.expirationDate && (
                <div className="flex justify-between font-mono">
                  <span className="text-gray-500 font-sans">Đến ngày:</span>
                  <span className="text-red-500 font-semibold">{selectedList.expirationDate}</span>
                </div>
              )}
            </div>

            {/* Price Override Details View */}
            <div className="bg-white border rounded-xl overflow-hidden">
               <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Các SKU được ghi đè giá
                </span>
              </div>
              <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                {selectedList.details && selectedList.details.length > 0 ? (
                  selectedList.details.map(d => (
                    <div key={d.id} className="flex justify-between items-center pb-2 border-b last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{d.productName}</p>
                        <p className="text-xs text-gray-500 font-mono">{d.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 line-through">${d.basePrice.toFixed(2)}</p>
                        <p className="font-bold text-emerald-700 text-sm">${d.overridePrice.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-2">Bảng giá này đang áp dụng chung cho tất cả sản phẩm theo tỷ lệ Markup, không có ngoại lệ.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo Bảng Giá Mới' : 'Cập Nhật Bảng Giá'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSaveList} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Header Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-700 uppercase border-b pb-1">Cấu hình Bảng giá (Header)</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mã Bảng Giá *</label>
                  <input
                    type="text"
                    value={editingList.listCode || ''}
                    onChange={(e) => setEditingList({ ...editingList, listCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cấp độ (Tier)</label>
                  <select
                    value={editingList.pricingTier || 'RETAIL_DEFAULT'}
                    onChange={(e) => setEditingList({ ...editingList, pricingTier: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="RETAIL_DEFAULT">Bán lẻ (Retail)</option>
                    <option value="WHOLESALE_TIER1">Khách sỉ (Wholesale)</option>
                    <option value="DISTRIBUTOR_VIP">Đại lý VIP (Distributor)</option>
                    <option value="EMPLOYEE_COST">Nội bộ (Employee)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên Bảng Giá *</label>
                <input
                  type="text"
                  value={editingList.listName || ''}
                  onChange={(e) => setEditingList({ ...editingList, listName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Markup mặc định (%)</label>
                  <input
                    type="number" step="0.1"
                    value={editingList.markupPercentage || 0}
                    onChange={(e) => setEditingList({ ...editingList, markupPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-emerald-700 font-bold bg-emerald-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tiền tệ</label>
                  <select
                    value={editingList.currency || 'USD'}
                    onChange={(e) => setEditingList({ ...editingList, currency: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="USD">USD</option>
                    <option value="VND">VND</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Hiệu lực từ</label>
                  <input
                    type="date"
                    value={editingList.effectiveDate || ''}
                    onChange={(e) => setEditingList({ ...editingList, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
                  <select
                    value={editingList.status || 'DRAFT'}
                    onChange={(e) => setEditingList({ ...editingList, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ACTIVE">Đang kích hoạt</option>
                    <option value="DRAFT">Bản nháp</option>
                    <option value="FUTURE_SCHEDULED">Lên lịch tương lai</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phạm vi áp dụng (Branches)</label>
                <input
                  type="text"
                  value={editingList.applicableBranches || ''}
                  onChange={(e) => setEditingList({ ...editingList, applicableBranches: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Items Detail */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-700 uppercase border-b pb-1">Chi tiết Giá theo SKU (Ghi đè)</h3>
              
              <div className="border rounded-lg bg-gray-50 p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-700 text-balance">Thiết lập giá đặc biệt, bỏ qua Markup mặc định.</span>
                  <button type="button" onClick={handleAddDetail} className="text-xs shrink-0 bg-white border px-2 py-1 rounded text-emerald-600 font-semibold hover:bg-gray-100">
                    + Thêm dòng
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {editingDetails.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">Chưa có SKU nào được chỉ định giá riêng.</p>}
                  
                  {editingDetails.map((d) => (
                    <div key={d.id} className="bg-white border p-2 rounded relative flex flex-col gap-2 shadow-sm">
                      <div>
                        <label className="block text-[10px] text-gray-500 font-bold">Chọn Sản phẩm (SKU)</label>
                        <select 
                          value={d.sku}
                          onChange={(e) => handleDetailSkuChange(d.id, e.target.value)}
                          className="w-full p-1 border rounded text-xs"
                        >
                          {products.map(p => <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>)}
                        </select>
                      </div>
                      <div className="flex gap-2 items-end">
                        <div className="w-1/2">
                          <label className="block text-[10px] text-gray-400 font-bold">Giá bán gốc (Retail)</label>
                          <input 
                            type="number" readOnly value={d.basePrice} 
                            className="w-full p-1 border rounded text-xs text-gray-500 bg-gray-100 font-mono"
                          />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-[10px] text-emerald-700 font-bold">Giá Ghi Đè Mới ($)</label>
                          <input 
                            type="number" step="0.01" value={d.overridePrice} 
                            onChange={(e) => handleDetailPriceChange(d.id, parseFloat(e.target.value) || 0)}
                            className="w-full p-1 border rounded text-xs text-emerald-700 font-bold bg-emerald-50 text-right"
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveDetail(d.id)} className="text-red-500 hover:text-red-700 p-1 mb-0.5">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
              Lưu Bảng Giá
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingList}
        onClose={() => setDeletingList(null)}
        title="Xóa Bảng Giá"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Bạn có chắc chắn muốn xóa Bảng giá <strong>{deletingList?.listName}</strong>? Thao tác này sẽ gỡ bỏ bảng giá khỏi mọi chi nhánh đang được áp dụng.</p>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={() => setDeletingList(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
