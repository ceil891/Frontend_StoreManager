import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Search } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';

interface Campaign {
  id: string;
  code: string;
  name: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: 'ĐANG_LÊN_KẾ_HOẠCH' | 'ĐANG_CHẠY' | 'ĐÃ_KẾT_THÚC' | 'TẠM_DỪNG';
}

const statusStyles: Record<Campaign['status'], string> = {
  ĐANG_LÊN_KẾ_HOẠCH: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  ĐANG_CHẠY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  ĐÃ_KẾT_THÚC: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  TẠM_DỪNG: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

const statusLabels: Record<Campaign['status'], string> = {
  ĐANG_LÊN_KẾ_HOẠCH: 'Đang lên kế hoạch',
  ĐANG_CHẠY: 'Đang diễn ra',
  ĐÃ_KẾT_THÚC: 'Đã kết thúc',
  TẠM_DỪNG: 'Tạm dừng',
};

import { axiosClient } from '@/shared/lib/axiosClient';

export function MarketingCampaignsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const {
    marketingCampaigns: storeCampaigns,
    fetchMarketingCampaigns,
    addMarketingCampaign,
    updateMarketingCampaign,
    deleteMarketingCampaign,
  } = useCrmStore();

  useEffect(() => {
    setIsLoading(true);
    fetchMarketingCampaigns().finally(() => setIsLoading(false));
  }, [fetchMarketingCampaigns]);

  const data: Campaign[] = useMemo(() => {
    return (storeCampaigns || []).map((m: any) => ({
      id: String(m.id || ''),
      code: m.code || '',
      name: m.title || m.name || '',
      budget: Number(m.budget ?? 0),
      startDate: m.startDate ? String(m.startDate).split('T')[0] : (m.scheduledDate ? String(m.scheduledDate).split('T')[0] : ''),
      endDate: m.endDate ? String(m.endDate).split('T')[0] : '',
      status: m.status === 'ACTIVE' || m.status === 'RUNNING' ? 'ĐANG_CHẠY' as const : m.status === 'COMPLETED' ? 'ĐÃ_KẾT_THÚC' as const : m.status === 'CANCELLED' || m.status === 'PAUSED' ? 'TẠM_DỪNG' as const : 'ĐANG_LÊN_KẾ_HOẠCH' as const,
    }));
  }, [storeCampaigns]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEdit, setEdit] = useState(false);

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Bạn có chắc muốn xóa chiến dịch ${campaign.name}?`)) return;
    try {
      await deleteMarketingCampaign(campaign.id);
      toast.success(`Đã xóa chiến dịch ${campaign.name}`);
      fetchMarketingCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      toast.error('Lỗi khi xóa chiến dịch');
    }
  };

  const filtered = data.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.code || '').toLowerCase().includes(q) ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.status || '').toLowerCase().includes(q)
    );
  });

  const columns = useMemo<ColumnDef<Campaign>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã chiến dịch',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Tên chiến dịch',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'budget',
        header: 'Ngân sách',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-white font-mono">
            {Number(info.getValue() ?? 0).toLocaleString('vi-VN')} đ
          </span>
        ),
      },
      { accessorKey: 'startDate', header: 'Bắt đầu', cell: (info) => <span className="font-mono text-sm">{String(info.getValue() || '')}</span> },
      { accessorKey: 'endDate', header: 'Kết thúc', cell: (info) => <span className="font-mono text-sm">{String(info.getValue() || '')}</span> },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const val = info.getValue<Campaign['status']>();
          return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusStyles[val] || 'bg-gray-100 text-gray-800'}`}>
              {statusLabels[val] || val}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(row.original)} className="p-1 text-gray-400 hover:text-primary" title="Xem chi tiết"><Eye size={16} /></button>
            <button onClick={() => { setSelected(row.original); setEdit(true); setModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600" title="Chỉnh sửa"><Edit size={16} /></button>
            <button onClick={() => handleDelete(row.original)} className="p-1 text-gray-400 hover:text-red-600" title="Xóa"><Trash2 size={16} /></button>
          </div>
        ),
      },
    ],
    [data]
  );

  const openCreate = () => {
    setSelected({ id: '', code: `CAM${Math.floor(100 + Math.random() * 900)}`, name: '', budget: 0, startDate: '', endDate: '', status: 'ĐANG_LÊN_KẾ_HOẠCH' });
    setEdit(false);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.code || !selected?.name) return toast.error('Vui lòng nhập mã và tên chiến dịch');

    if (!selected.startDate) {
      return toast.error('Vui lòng chọn ngày bắt đầu chiến dịch!');
    }

    if (!selected.endDate) {
      return toast.error('Vui lòng chọn ngày kết thúc chiến dịch!');
    }

    // Validate: ngày kết thúc phải >= ngày bắt đầu
    if (selected.startDate && selected.endDate && selected.endDate < selected.startDate) {
      toast.error('Ngày kết thúc không thể nhỏ hơn ngày bắt đầu. Vui lòng kiểm tra lại.');
      return;
    }

    const statusMap: Record<string, string> = {
      ĐANG_LÊN_KẾ_HOẠCH: 'PLANNING',
      ĐANG_CHẠY: 'ACTIVE',
      ĐÃ_KẾT_THÚC: 'COMPLETED',
      TẠM_DỪNG: 'CANCELLED',
    };

    const payload = {
      code: selected.code,
      campaignCode: selected.code,
      title: selected.name,
      name: selected.name,
      budget: selected.budget,
      startDate: selected.startDate,
      endDate: selected.endDate,
      status: statusMap[selected.status] || 'PLANNING',
    };

    try {
      if (isEdit && selected.id) {
        await updateMarketingCampaign(selected.id, payload as any);
        toast.success(`Cập nhật chiến dịch ${selected.name} thành công!`);
      } else {
        await addMarketingCampaign(payload as any);
        toast.success(`Thêm mới chiến dịch ${selected.name} thành công!`);
      }
      setModalOpen(false);
      fetchMarketingCampaigns();
    } catch (err) {
      console.error('Error saving campaign:', err);
      toast.error('Không thể lưu chiến dịch');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chiến dịch marketing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổng số chiến dịch: {data.length}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm">
            <Plus size={16} /> Thêm mới chiến dịch
          </button>
        </div>
      </div>
      <div className="flex mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -mt-2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo mã, tên hoặc trạng thái..."
            className="w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      </div>
      <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row: any) => setSelected(row)} />

      {/* Drawer chi tiết */}
      <Modal isOpen={!!selected && !isModalOpen} onClose={() => setSelected(null)} title="Chi tiết chiến dịch" width="max-w-lg">
        {selected && (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs text-gray-500 block">Mã chiến dịch</span>
              <span className="font-mono font-bold text-primary">{selected.code}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Tên chiến dịch</span>
              <span className="font-medium text-gray-900 dark:text-white">{selected.name}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Ngân sách</span>
              <span className="font-bold text-gray-900 dark:text-white font-mono">{Number(selected.budget || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Thời gian diễn ra</span>
              <span className="font-mono text-gray-700 dark:text-gray-300">{selected.startDate} → {selected.endDate}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block">Trạng thái</span>
              <span className="font-semibold">{statusLabels[selected.status] || selected.status}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm / Sửa */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={isEdit ? 'Cập nhật chiến dịch' : 'Thêm mới chiến dịch'} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã chiến dịch *</label>
              <input
                type="text"
                value={selected?.code || ''}
                onChange={e => setSelected({ ...selected!, code: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                disabled={isEdit}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên chiến dịch *</label>
              <input
                type="text"
                value={selected?.name || ''}
                onChange={e => setSelected({ ...selected!, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngân sách (VNĐ) *</label>
              <input
                type="number"
                value={selected?.budget || 0}
                onChange={e => setSelected({ ...selected!, budget: Number(e.target.value) })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
              <select
                value={selected?.status || 'ĐANG_LÊN_KẾ_HOẠCH'}
                onChange={e => setSelected({ ...selected!, status: e.target.value as Campaign['status'] })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="ĐANG_LÊN_KẾ_HOẠCH">Đang lên kế hoạch</option>
                <option value="ĐANG_CHẠY">Đang diễn ra</option>
                <option value="ĐÃ_KẾT_THÚC">Đã kết thúc</option>
                <option value="TẠM_DỪNG">Tạm dừng</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày bắt đầu *</label>
              <input
                type="date"
                value={selected?.startDate || ''}
                onChange={e => setSelected({ ...selected!, startDate: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày kết thúc *</label>
              <input
                type="date"
                min={selected?.startDate || undefined}
                value={selected?.endDate || ''}
                onChange={e => setSelected({ ...selected!, endDate: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm">{isEdit ? 'Lưu thông tin' : 'Thêm mới'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MarketingCampaignsPage;
