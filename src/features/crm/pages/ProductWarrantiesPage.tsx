import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';

import { useCallback } from 'react';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface WarrantyRecord {
  id: string;
  warrantyCode: string;
  serialNumber: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  startDate: string;
  durationMonths: number;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'VOID';
  notes?: string;
}

export function ProductWarrantiesPage() {
  const {
    productWarranties: storeWarranties,
    fetchProductWarranties,
    addProductWarranty,
    updateProductWarranty,
    deleteProductWarranty,
  } = useCrmStore();

  useEffect(() => {
    fetchProductWarranties();
  }, [fetchProductWarranties]);

  const [data, setData] = useState<WarrantyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedItem, setSelectedItem] = useState<WarrantyRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<WarrantyRecord>>({});

  const fetchWarranties = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await axiosClient.get('/crm/warranties');
      const list = Array.isArray(res) ? res : res?.content || res?.data || [];
      if (list.length > 0) {
        const mapped: WarrantyRecord[] = list.map((item: any) => ({
          id: String(item.id),
          warrantyCode: item.warrantyCode || `WRT-${item.id}`,
          customerName: item.customerName || item.customer?.name || 'Khách hàng',
          serialOrIMEI: item.serialNumber || item.serialOrIMEI || 'N/A',
          startDate: item.startDate ? String(item.startDate).split('T')[0] : '2024-01-01',
          expiryDate: item.endDate ? String(item.endDate).split('T')[0] : '2025-01-01',
          terms: item.terms || item.notes || 'Bảo hành tiêu chuẩn',
          status: item.status === 'EXPIRED' ? 'HẾT_HẠN' : item.status === 'CANCELLED' ? 'HỦY' : 'HOẠT_ĐỘNG',
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching warranties:', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarranties();
  }, [fetchWarranties]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.warrantyCode.toLowerCase().includes(search.toLowerCase()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.serialOrIMEI.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Tất cả' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      warrantyCode: `WRT-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: '',
      serialOrIMEI: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      terms: 'Bảo hành chính hãng',
      status: 'HOẠT_ĐỘNG',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WarrantyRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.warrantyCode || !editingItem.customerName) return;

    const payload = {
      warrantyCode: editingItem.warrantyCode,
      customerName: editingItem.customerName,
      serialNumber: editingItem.serialOrIMEI,
      terms: editingItem.terms,
      status: editingItem.status === 'HẾT_HẠN' ? 'EXPIRED' : editingItem.status === 'HỦY' ? 'CANCELLED' : 'ACTIVE',
    };

    try {
      if (modalMode === 'create') {
        await axiosClient.post('/crm/warranties', payload);
        toast.success(`Tạo sổ bảo hành ${editingItem.warrantyCode} thành công!`);
      } else if (editingItem.id) {
        await axiosClient.put(`/crm/warranties/${editingItem.id}`, payload);
        toast.success(`Cập nhật sổ bảo hành ${editingItem.warrantyCode} thành công!`);
      }
      setIsModalOpen(false);
      fetchWarranties();
    } catch (err) {
      console.error('Error saving warranty:', err);
      toast.error('Lỗi khi lưu sổ bảo hành');
    }
  };

  const handleDelete = async (item: WarrantyRecord) => {
    if (!confirm(`Bạn có chắc muốn xóa sổ bảo hành ${item.warrantyCode}?`)) return;
    try {
      await axiosClient.delete(`/crm/warranties/${item.id}`);
      toast.success(`Đã xóa sổ bảo hành ${item.warrantyCode}`);
      setData((prev) => prev.filter((d) => d.id !== item.id));
    } catch (err) {
      console.error('Error deleting warranty:', err);
      toast.error('Lỗi khi xóa sổ bảo hành');
    } finally {
      setSelectedItem(null);
    }
  };

  const columns = useMemo<ColumnDef<WarrantyRecord>[]>(
    () => [
      {
        accessorKey: 'warrantyCode',
        header: 'Mã sổ bảo hành',
        cell: (info) => (
          <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'serialOrIMEI',
        header: 'Serial / IMEI',
        cell: (info) => <span className="text-sm text-gray-600 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const labelMap: Record<string, string> = {
            HOẠT_ĐỘNG: 'Đang hoạt động',
            HẾT_HẠN: 'Hết hạn',
            HỦY: 'Đã hủy',
          };
          const badge = {
            HOẠT_ĐỘNG: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
            HẾT_HẠN: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
            HỦY: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          }[status] || 'bg-gray-100 text-gray-800';
          return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>{labelMap[status] || status}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa"
            >
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sổ bảo hành sản phẩm</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý các hồ sơ bảo hành, theo dõi thời gian và điều kiện bảo hành sản phẩm.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg">
              <Plus className="w-4 h-4" /> Thêm mới sổ bảo hành
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
              placeholder="Tìm kiếm theo mã, khách hàng, serial/IMEI…"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="HOẠT_ĐỘNG">Đang hoạt động</option>
            <option value="HẾT_HẠN">Hết hạn</option>
            <option value="HỦY">Đã hủy</option>
          </select>
        </div>
        <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row) => setSelectedItem(row)} />
      </div>

      {/* Drawer chi tiết */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={selectedItem ? `Chi tiết sổ bảo hành: ${selectedItem.warrantyCode}` : ''} width="max-w-lg">
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Mã bảo hành</span>
                <p className="font-mono font-bold text-gray-900 dark:text-white">{selectedItem.warrantyCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Khách hàng</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedItem.customerName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Serial / IMEI</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">{selectedItem.serialOrIMEI}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ngày bắt đầu</span>
                <p className="font-medium text-gray-900 dark:text-white font-mono">{selectedItem.startDate}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ngày hết hạn</span>
                <p className="font-medium text-gray-900 dark:text-white font-mono">{selectedItem.expiryDate}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Trạng thái</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedItem.status === 'HOẠT_ĐỘNG' ? 'bg-emerald-100 text-emerald-800' : selectedItem.status === 'HẾT_HẠN' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedItem.status === 'HOẠT_ĐỘNG' ? 'Đang hoạt động' : selectedItem.status === 'HẾT_HẠN' ? 'Hết hạn' : 'Đã hủy'}
                </span>
              </div>
            </div>
            <div className="border-t pt-4">
              <span className="text-xs font-semibold text-gray-400 uppercase">Điều khoản bảo hành</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedItem.terms || 'Chưa cập nhật'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal tạo / sửa */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Thêm mới sổ bảo hành' : 'Cập nhật sổ bảo hành'}>
        <form onSubmit={handleSave} className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Mã bảo hành *</label>
            <input
              type="text"
              value={editingItem.warrantyCode || ''}
              onChange={(e) => setEditingItem({ ...editingItem, warrantyCode: e.target.value })}
              className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold"
              required
              disabled={modalMode === 'edit'}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Khách hàng *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Serial / IMEI</label>
              <input
                type="text"
                value={editingItem.serialOrIMEI || ''}
                onChange={(e) => setEditingItem({ ...editingItem, serialOrIMEI: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Ngày bắt đầu *</label>
              <input
                type="date"
                value={editingItem.startDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Ngày hết hạn *</label>
              <input
                type="date"
                value={editingItem.expiryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Trạng thái *</label>
              <select
                value={editingItem.status || 'HOẠT_ĐỘNG'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="HOẠT_ĐỘNG">Đang hoạt động</option>
                <option value="HẾT_HẠN">Hết hạn</option>
                <option value="HỦY">Đã hủy</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Điều khoản bảo hành</label>
            <textarea
              rows={3}
              value={editingItem.terms || ''}
              onChange={(e) => setEditingItem({ ...editingItem, terms: e.target.value })}
              className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-sm">
              Hủy bỏ
            </button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-sm font-medium">
              {modalMode === 'create' ? 'Thêm mới' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

