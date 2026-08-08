import React, { useState, useMemo, useEffect, useCallback } from 'react';
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

const MOCK_CAMPAIGNS: Campaign[] = [];

const statusStyles: Record<Campaign['status'], string> = {
  ĐANG_LÊN_KẾ_HOẠCH: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  ĐANG_CHẠY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  ĐÃ_KẾT_THÚC: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  TẠM_DỪNG: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

import { axiosClient } from '@/shared/lib/axiosClient';

export function MarketingCampaignsPage() {
  const setData = (_fn: any) => {};
  const [isLoading, setIsLoading] = useState(false);
  const {
    marketingCampaigns: storeCampaigns,
    fetchMarketingCampaigns,
    addMarketingCampaign,
    updateMarketingCampaign,
    deleteMarketingCampaign,
  } = useCrmStore();

  useEffect(() => {
    fetchMarketingCampaigns();
  }, [fetchMarketingCampaigns]);

  const data: Campaign[] = useMemo(() => {
    return storeCampaigns.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.title,
      budget: 150000000,
      startDate: m.startDate,
      endDate: m.endDate,
      status: m.status === 'RUNNING' ? 'ĐANG_CHẠY' : m.status === 'COMPLETED' ? 'ĐÃ_KẾT_THÚC' : 'ĐANG_LÊN_KẾ_HOẠCH',
    }));
  }, [storeCampaigns]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEdit, setEdit] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await axiosClient.get('/crm/campaigns');
      const list = Array.isArray(res) ? res : res?.content || res?.data || [];
      if (list.length > 0) {
        const mapped: Campaign[] = list.map((item: any) => ({
          id: String(item.id),
          code: item.campaignCode || `CAM${item.id}`,
          name: item.name || 'Chiến dịch',
          budget: Number(item.budget || 0),
          startDate: item.startDate ? String(item.startDate).split('T')[0] : '2024-06-01',
          endDate: item.endDate ? String(item.endDate).split('T')[0] : '2024-12-31',
          status: item.status === 'ACTIVE' ? 'ĐANG_CHẠY' : item.status === 'COMPLETED' ? 'ĐÃ_KẾT_THÚC' : item.status === 'CANCELLED' ? 'TẠM_DỪNG' : 'ĐANG_LÊN_KẾ_HOẠCH',
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Bạn có chắc muốn xóa chiến dịch ${campaign.name}?`)) return;
    try {
      await axiosClient.delete(`/crm/campaigns/${campaign.id}`);
      toast.success(`Đã xóa chiến dịch ${campaign.name}`);
      setData((prev) => prev.filter((d) => d.id !== campaign.id));
    } catch (err) {
      console.error('Error deleting campaign:', err);
      toast.error('Lỗi khi xóa chiến dịch');
    }
  };

  const filtered = data.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  const columns = useMemo<ColumnDef<Campaign>[]>(
    () => [
      { accessorKey: 'code', header: 'Mã chiến dịch' },
      { accessorKey: 'name', header: 'Tên chiến dịch' },
      {
        accessorKey: 'budget',
        header: 'Ngân sách',
        cell: (info) => (
          <span className="font-medium text-gray-900 dark:text-white">
            {info.getValue<number>().toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
          </span>
        ),
      },
      { accessorKey: 'startDate', header: 'Bắt đầu', cell: (info) => <span>{info.getValue<string>()}</span> },
      { accessorKey: 'endDate', header: 'Kết thúc', cell: (info) => <span>{info.getValue<string>()}</span> },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => (
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[info.getValue<Campaign['status']>()] || 'bg-gray-100 text-gray-800'}`}>
            {info.getValue<string>().replace('_', ' ')}
          </span>
        ),
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
    if (!selected?.code || !selected?.name) return toast.error('Vui lòng nhập Mã và Tên chiến dịch');

    const statusMap: Record<string, string> = {
      ĐANG_LÊN_KẾ_HOẠCH: 'PLANNING',
      ĐANG_CHẠY: 'ACTIVE',
      ĐÃ_KẾT_THÚC: 'COMPLETED',
      TẠM_DỪNG: 'CANCELLED',
    };

    const payload = {
      campaignCode: selected.code,
      name: selected.name,
      budget: selected.budget,
      status: statusMap[selected.status] || 'PLANNING',
    };

    try {
      if (isEdit) {
        await axiosClient.put(`/crm/campaigns/${selected.id}`, payload);
        toast.success(`Cập nhật chiến dịch ${selected.name} thành công!`);
      } else {
        await axiosClient.post('/crm/campaigns', payload);
        toast.success(`Tạo Mới chiến dịch ${selected.name} thành công!`);
      }
      setModalOpen(false);
      fetchCampaigns();
    } catch (err) {
      console.error('Error saving campaign:', err);
      toast.error('Không thể lưu chiến dịch');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Chiến dịch Marketing</h1>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600 dark:text-gray-400">Tổng số chiến dịch: {data.length}</div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Thêm chiến dịch
        </button>
      </div>
      <div className="flex mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -mt-2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm mã, tên hoặc trạng thái..."
            className="w-full pl-10 pr-3 py-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
      <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row: any) => setSelected(row)} />

      {/* Drawer chi tiết */}
      <Modal isOpen={!!selected && !isModalOpen} onClose={() => setSelected(null)} title="Chi tiết chiến dịch" width="max-w-lg">
        {selected && (
          <div className="space-y-2 text-sm">
            <p><strong>Mã:</strong> {selected.code}</p>
            <p><strong>Tên:</strong> {selected.name}</p>
            <p><strong>Ngân sách:</strong> {selected.budget.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
            <p><strong>Thời gian:</strong> {selected.startDate} → {selected.endDate}</p>
            <p><strong>Trạng thái:</strong> {selected.status.replace('_', ' ')}</p>
          </div>
        )}
      </Modal>

      {/* Modal Thêm / Sửa */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={isEdit ? 'Chỉnh sửa chiến dịch' : 'Thêm chiến dịch'} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã chiến dịch *</label>
              <input
                type="text"
                value={selected?.code || ''}
                onChange={e => setSelected({ ...selected!, code: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                disabled={isEdit}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tên chiến dịch *</label>
              <input
                type="text"
                value={selected?.name || ''}
                onChange={e => setSelected({ ...selected!, name: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngân sách (VND) *</label>
              <input
                type="number"
                value={selected?.budget || 0}
                onChange={e => setSelected({ ...selected!, budget: Number(e.target.value) })}
                className="w-full border rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái *</label>
              <select
                value={selected?.status || 'ĐANG_LÊN_KẾ_HOẠCH'}
                onChange={e => setSelected({ ...selected!, status: e.target.value as Campaign['status'] })}
                className="w-full border rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="ĐANG_LÊN_KẾ_HOẠCH">ĐANG LÊN KẾ HOẠCH</option>
                <option value="ĐANG_CHẠY">ĐANG CHẠY</option>
                <option value="ĐÃ_KẾT_THÚC">ĐÃ KẾT THÚC</option>
                <option value="TẠM_DỪNG">TẠM DỪNG</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ngày bắt đầu *</label>
              <input
                type="date"
                value={selected?.startDate || ''}
                onChange={e => setSelected({ ...selected!, startDate: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày kết thúc *</label>
              <input
                type="date"
                value={selected?.endDate || ''}
                onChange={e => setSelected({ ...selected!, endDate: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100 text-sm">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-sm">Lưu</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MarketingCampaignsPage;

