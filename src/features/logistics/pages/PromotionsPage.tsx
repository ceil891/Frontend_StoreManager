import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Sparkles, Calendar, DollarSign, Tag, CheckCircle2, Copy, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface PromotionCampaignRecord {
  id: string;
  promoCode: string;
  campaignTitle: string;
  discountType: 'PERCENTAGE' | 'BUNDLE_DEAL' | 'BUY_X_GET_Y' | 'TIERED_BASKET_DISCOUNT';
  discountValue: string;
  startDate: string;
  endDate: string;
  minSpendRequired: number;
  totalOrdersApplied: number;
  totalDiscountGivenUsd: number;
  status: 'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'PAUSED';
  targetSegment: 'ALL_CUSTOMERS' | 'VIP_LOYALTY_ONLY' | 'NEW_REGISTRATIONS' | 'INACTIVE_WINBACK';
  marketingNotes?: string;
}


const segmentBadgeStyles: Record<PromotionCampaignRecord['targetSegment'], string> = {
  ALL_CUSTOMERS: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  VIP_LOYALTY_ONLY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  NEW_REGISTRATIONS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  INACTIVE_WINBACK: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
};

const EMPTY_PROMO: Omit<PromotionCampaignRecord, 'id'> = {
  promoCode: '',
  campaignTitle: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  minSpendRequired: 0,
  totalOrdersApplied: 0,
  totalDiscountGivenUsd: 0,
  status: 'UPCOMING',
  targetSegment: 'ALL_CUSTOMERS',
  marketingNotes: '',
};

import { useLogisticsStore } from '../store/logisticsStore';

export function PromotionsPage() {
  const {
    promotions: storePromos,
    fetchPromotions,
    addPromotion,
    updatePromotion,
    deletePromotion,
  } = useLogisticsStore();

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const data: PromotionCampaignRecord[] = useMemo(() => {
    return storePromos.map((p) => ({
      id: p.id,
      promoCode: p.promoCode,
      campaignTitle: p.promoName,
      discountType: 'PERCENTAGE',
      discountValue: p.discountType === 'PERCENT' ? `${p.discountValue}%` : `${p.discountValue.toLocaleString('vi-VN')} đ`,
      startDate: p.startDate,
      endDate: p.endDate,
      minSpendRequired: 100000,
      totalOrdersApplied: 50,
      totalDiscountGivenUsd: 2500000,
      status: p.status === 'ACTIVE' ? 'ACTIVE' : 'EXPIRED',
      targetSegment: 'ALL_CUSTOMERS',
      marketingNotes: p.promoName,
    }));
  }, [storePromos]);
  const [search, setSearch] = useState('');
  const [selectedPromo, setSelectedPromo] = useState<PromotionCampaignRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingPromo, setEditingPromo] = useState<Partial<PromotionCampaignRecord>>({});

  const filtered = data.filter((item) =>
    item.promoCode.toLowerCase().includes(search.toLowerCase()) ||
    item.campaignTitle.toLowerCase().includes(search.toLowerCase()) ||
    item.targetSegment.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingPromo({ ...EMPTY_PROMO });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: PromotionCampaignRecord) => {
    setModalMode('edit');
    setEditingPromo({ ...promo });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numericVal = parseFloat(editingPromo.discountValue || '10') || 10;
      if (modalMode === 'create') {
        await addPromotion({
          promoCode: editingPromo.promoCode || 'PROMO-2026',
          promoName: editingPromo.campaignTitle || 'Chương trình khuyến mãi mới',
          discountType: 'PERCENT',
          discountValue: numericVal,
          startDate: editingPromo.startDate || new Date().toISOString().slice(0, 10),
          endDate: editingPromo.endDate || '',
          status: editingPromo.status === 'EXPIRED' ? 'EXPIRED' : 'ACTIVE',
        });
        toast.success('Thêm mới chương trình khuyến mãi thành công!');
      } else if (editingPromo.id) {
        await updatePromotion(editingPromo.id, {
          promoCode: editingPromo.promoCode,
          promoName: editingPromo.campaignTitle,
          discountValue: numericVal,
          startDate: editingPromo.startDate,
          endDate: editingPromo.endDate,
        });
        toast.success('Cập nhật khuyến mãi thành công!');
      }
      setIsModalOpen(false);
      fetchPromotions();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu chương trình khuyến mãi!');
    }
  };

  const handleDelete = async (id: string) => {
    await deletePromotion(id);
  };

  const columns = useMemo<ColumnDef<PromotionCampaignRecord>[]>(
    () => [
      {
        accessorKey: 'promoCode',
        header: 'Mã khuyến mãi',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'campaignTitle',
        header: 'Chiến dịch & loại',
        cell: ({ row }) => {
          const typeMap: Record<string, string> = {
            PERCENTAGE: 'Giảm theo %',
            BUNDLE_DEAL: 'Mua combo',
            BUY_X_GET_Y: 'Mua X tặng Y',
            TIERED_BASKET_DISCOUNT: 'Giảm theo tầng đơn hàng'
          };
          return (
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.campaignTitle}</p>
              <p className="text-xs text-gray-500 font-medium">Loại: {typeMap[row.original.discountType] || row.original.discountType}</p>
            </div>
          );
        },
      },
      {
        accessorKey: 'discountValue',
        header: 'Mức giảm giá',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'minSpendRequired',
        header: 'Đơn tối thiểu',
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300">{(info.getValue() as number).toLocaleString('vi-VN')} đ</span>,
      },
      {
        accessorKey: 'targetSegment',
        header: 'Phân khúc khách hàng',
        cell: (info) => {
          const segment = info.getValue() as PromotionCampaignRecord['targetSegment'];
          const segmentLabels: Record<string, string> = {
            ALL_CUSTOMERS: 'Tất cả khách hàng',
            VIP_LOYALTY_ONLY: 'Khách VIP / thân thiết',
            NEW_REGISTRATIONS: 'Khách hàng mới',
            INACTIVE_WINBACK: 'Khách hàng cũ'
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${segmentBadgeStyles[segment]}`}>
              {segmentLabels[segment] || segment.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const cfg: Record<string, { cls: string; label: string }> = {
            ACTIVE: { cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'Đang chạy' },
            UPCOMING: { cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', label: 'Sắp diễn ra' },
            EXPIRED: { cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', label: 'Đã kết thúc' },
            PAUSED: { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', label: 'Tạm dừng' },
          };
          const item = cfg[status] || { cls: 'bg-gray-100 text-gray-800', label: status };
          return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.cls}`}>{item.label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPromo(row.original)} title="Xem chi tiết" className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => handleOpenEdit(row.original)} title="Chỉnh sửa" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
              <Edit className="w-4 h-4" />
            </button>
            <button onClick={() => handleDelete(row.original.id)} title="Xóa" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý khuyến mãi và chiến dịch tiếp thị</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cấu hình chương trình giảm giá, khuyến mãi combo, mua tặng và theo dõi hiệu quả chiết khấu</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất nhật ký chiến dịch
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm">
              <Plus className="w-4 h-4" /> Thêm mới chương trình
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã, tên chiến dịch hoặc phân khúc khách hàng..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Lọc dữ liệu
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedPromo(row)} />
      </div>

      {/* Detail Drawer */}
      {/* Modal Xem chi tiết khuyến mãi */}
      <Modal
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        title={selectedPromo ? `Thông tin chương trình: ${selectedPromo.promoCode}` : 'Thông tin chương trình'}
        width="max-w-lg"
      >
        {selectedPromo && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedPromo.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedPromo.status === 'UPCOMING'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedPromo.status === 'ACTIVE' ? 'bg-emerald-600' : selectedPromo.status === 'UPCOMING' ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Công thức chiết khấu</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{selectedPromo.discountValue}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                selectedPromo.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedPromo.status === 'UPCOMING' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {selectedPromo.status === 'ACTIVE' ? 'Đang chạy' : selectedPromo.status === 'UPCOMING' ? 'Sắp diễn ra' : selectedPromo.status === 'PAUSED' ? 'Tạm dừng' : 'Đã kết thúc'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Tag className="w-4 h-4 text-primary" /> Tổng số đơn áp dụng
                </div>
                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white truncate">{selectedPromo.totalOrdersApplied} đơn</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Tổng tiền chiết khấu
                </div>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">{selectedPromo.totalDiscountGivenUsd.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-medium text-gray-400 block mb-1">Tên chiến dịch</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedPromo.campaignTitle}</h3>
              </div>

              <div className="grid grid-cols-2 pt-2 text-xs font-mono">
                <div>
                  <span className="text-gray-400 block mb-0.5 font-sans font-medium">Bắt đầu từ:</span>
                  <span className="text-gray-800 dark:text-gray-200">{selectedPromo.startDate}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5 font-sans font-medium">Kết thúc vào:</span>
                  <span className="text-red-500 font-semibold">{selectedPromo.endDate}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedPromo(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 font-medium rounded-lg text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới chương trình khuyến mãi' : `Cập nhật chương trình: ${editingPromo.promoCode}`}
        size="erp"
      >
        <form onSubmit={handleSave}>
          <div className="erp-form-body">

            {/* Section 1: Định danh chiến dịch */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Định danh chiến dịch</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã khuyến mãi *</label>
                <input
                  required
                  type="text"
                  value={editingPromo.promoCode || ''}
                  onChange={e => setEditingPromo({ ...editingPromo, promoCode: e.target.value.toUpperCase() })}
                  placeholder="VD: SUMMER-DEAL-20"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên chiến dịch *</label>
                <input
                  required
                  type="text"
                  value={editingPromo.campaignTitle || ''}
                  onChange={e => setEditingPromo({ ...editingPromo, campaignTitle: e.target.value })}
                  placeholder="Tên chiến dịch marketing..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
                <select
                  value={editingPromo.status || 'UPCOMING'}
                  onChange={e => setEditingPromo({ ...editingPromo, status: e.target.value as PromotionCampaignRecord['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="UPCOMING">Sắp diễn ra</option>
                  <option value="ACTIVE">Đang chạy</option>
                  <option value="PAUSED">Tạm dừng</option>
                  <option value="EXPIRED">Đã kết thúc</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phân khúc khách hàng</label>
                <select
                  value={editingPromo.targetSegment || 'ALL_CUSTOMERS'}
                  onChange={e => setEditingPromo({ ...editingPromo, targetSegment: e.target.value as PromotionCampaignRecord['targetSegment'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="ALL_CUSTOMERS">Tất cả khách hàng</option>
                  <option value="VIP_LOYALTY_ONLY">Khách VIP / thân thiết</option>
                  <option value="NEW_REGISTRATIONS">Khách hàng mới</option>
                  <option value="INACTIVE_WINBACK">Khách hàng cũ</option>
                </select>
              </div>
            </div>

            {/* Section 2: Cơ cấu giảm giá */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Cơ cấu giảm giá</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại khuyến mãi</label>
                <select
                  value={editingPromo.discountType || 'PERCENTAGE'}
                  onChange={e => setEditingPromo({ ...editingPromo, discountType: e.target.value as PromotionCampaignRecord['discountType'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                >
                  <option value="PERCENTAGE">Giảm theo %</option>
                  <option value="BUNDLE_DEAL">Mua combo</option>
                  <option value="BUY_X_GET_Y">Mua X tặng Y</option>
                  <option value="TIERED_BASKET_DISCOUNT">Giảm theo tầng đơn hàng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả giá trị giảm *</label>
                <input
                  required
                  type="text"
                  value={editingPromo.discountValue || ''}
                  onChange={e => setEditingPromo({ ...editingPromo, discountValue: e.target.value })}
                  placeholder="VD: 20%, Mua 2 tặng 1, 50.000 đ"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá trị đơn tối thiểu (đ)</label>
                <input
                  type="number"
                  min="0"
                  value={editingPromo.minSpendRequired ?? 0}
                  onChange={e => setEditingPromo({ ...editingPromo, minSpendRequired: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng đơn áp dụng</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPromo.totalOrdersApplied ?? 0}
                    onChange={e => setEditingPromo({ ...editingPromo, totalOrdersApplied: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng tiền chiết khấu (đ)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPromo.totalDiscountGivenUsd ?? 0}
                    onChange={e => setEditingPromo({ ...editingPromo, totalDiscountGivenUsd: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Thời hạn & Ghi chú */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Thời hạn & ghi chú</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày bắt đầu *</label>
                <input
                  required
                  type="date"
                  value={editingPromo.startDate || ''}
                  onChange={e => setEditingPromo({ ...editingPromo, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày kết thúc *</label>
                <input
                  required
                  type="date"
                  value={editingPromo.endDate || ''}
                  onChange={e => setEditingPromo({ ...editingPromo, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú chiến dịch</label>
                <textarea
                  rows={6}
                  value={editingPromo.marketingNotes || ''}
                  onChange={e => setEditingPromo({ ...editingPromo, marketingNotes: e.target.value })}
                  placeholder="Chiến lược quảng bá, kênh phân phối, đối tượng mục tiêu..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>

          </div>

          <div className="erp-form-footer border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
export default PromotionsPage;
