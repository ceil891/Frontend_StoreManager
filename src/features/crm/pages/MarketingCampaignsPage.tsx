import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Eye, Search, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface Campaign {
  id: string;
  code: string;
  name: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: 'ĐANG_LÊN_KẾ_HOẠCH' | 'ĐANG_CHẠY' | 'ĐÃ_KẾT_THÚC' | 'TẠM_DỪNG';
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    code: 'CAM001',
    name: 'Khuyến mãi Mùa Hè 2024',
    budget: 250000000,
    startDate: '2024-06-01',
    endDate: '2024-09-30',
    status: 'ĐANG_CHẠY',
  },
  {
    id: '2',
    code: 'CAM002',
    name: 'Black Friday Siêu giảm giá',
    budget: 500000000,
    startDate: '2024-11-20',
    endDate: '2024-11-30',
    status: 'ĐANG_LÊN_KẾ_HOẠCH',
  },
];

const statusStyles: Record<Campaign['status'], string> = {
  ĐANG_LÊN_KẾ_HOẠCH: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  ĐANG_CHẠY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  ĐÃ_KẾT_THÚC: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  TẠM_DỪNG: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

export default function MarketingCampaignsPage() {
  const [data, setData] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEdit, setEdit] = useState(false);

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
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[info.getValue<Campaign['status']>()]}`}>
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
            <button onClick={() => setData(data.filter(d => d.id !== row.original.id))} className="p-1 text-gray-400 hover:text-red-600" title="Xóa"><Trash2 size={16} /></button>
          </div>
        ),
      },
    ],
    [data]
  );

  const openCreate = () => {
    setSelected({ id: '', code: '', name: '', budget: 0, startDate: '', endDate: '', status: 'ĐANG_LÊN_KẾ_HOẠCH' });
    setEdit(false);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected?.code || !selected?.name) return alert('Vui lòng nhập Mã và Tên chiến dịch');
    if (isEdit) {
      setData(data.map(d => (d.id === selected.id ? selected : d)));
    } else {
      if (data.some(d => d.code === selected.code)) return alert('Mã chiến dịch đã tồn tại');
      setData([...data, { ...selected, id: String(data.length + 1) }]);
    }
    setModalOpen(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Chiến dịch Marketing</h1>
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm text-gray-600">Tổng số chiến dịch: {data.length}</div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
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
            className="w-full pl-10 pr-3 py-2 border rounded bg-white dark:bg-gray-800 text-gray-900 focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row: any) => setSelected(row.original)} />

      {/* Drawer chi tiết */}
      <Drawer isOpen={!!selected && !isModalOpen} onClose={() => setSelected(null)} title="Chi tiết chiến dịch">
        {selected && (
          <div className="space-y-2 text-sm">
            <p><strong>Mã:</strong> {selected.code}</p>
            <p><strong>Tên:</strong> {selected.name}</p>
            <p><strong>Ngân sách:</strong> {selected.budget.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</p>
            <p><strong>Thời gian:</strong> {selected.startDate} → {selected.endDate}</p>
            <p><strong>Trạng thái:</strong> {selected.status.replace('_', ' ')}</p>
          </div>
        )}
      </Drawer>

      {/* Modal Thêm / Sửa */}
      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={isEdit ? 'Chỉnh sửa chiến dịch' : 'Thêm chiến dịch'} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mã chiến dịch *</label>
              <input
                type="text"
                value={selected?.code || ''}
                onChange={e => setSelected({ ...selected!, code: e.target.value })}
                className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
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
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái *</label>
              <select
                value={selected?.status || 'ĐANG_LÊN_KẾ_HOẠCH'}
                onChange={e => setSelected({ ...selected!, status: e.target.value as Campaign['status'] })}
                className="w-full border rounded px-3 py-2"
              >
                <option>ĐANG_LÊN_KẾ_HOẠCH</option>
                <option>ĐANG_CHẠY</option>
                <option>ĐÃ_KẾT_THÚC</option>
                <option>TẠM_DỪNG</option>
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
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ngày kết thúc *</label>
              <input
                type="date"
                value={selected?.endDate || ''}
                onChange={e => setSelected({ ...selected!, endDate: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">Lưu</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
