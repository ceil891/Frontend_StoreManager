import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';

import { useCallback } from 'react';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface ClaimRecord {
  id: string;
  warrantyCode: string;
  claimCode: string;
  description: string;
  reportedAt: string;
  handler: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  notes?: string;
}

export function WarrantyClaimsPage() {
  const setData = (_fn: any) => {};
  const {
    warrantyClaims: storeClaims,
    fetchWarrantyClaims,
    addWarrantyClaim,
    updateWarrantyClaim,
    deleteWarrantyClaim,
  } = useCrmStore();

  useEffect(() => {
    fetchWarrantyClaims();
  }, [fetchWarrantyClaims]);

  const data: ClaimRecord[] = useMemo(() => {
    return storeClaims.map((c) => ({
      id: c.id,
      warrantyCode: c.serialNumber,
      claimCode: c.claimCode,
      description: c.issueDescription,
      reportedAt: c.receivedDate,
      handler: c.repairedBy || 'Kỹ thuật viên',
      status: (c.status === 'COMPLETED' ? 'APPROVED' : c.status === 'REJECTED' ? 'REJECTED' : 'PENDING') as any,
      notes: c.notes || '',
    }));
  }, [storeClaims]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClaimRecord | null>(null);
  
  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClaimRecord | null>(null);
  const [form, setForm] = useState({
    warrantyCode: '',
    claimCode: '',
    description: '',
    handler: '',
    status: 'PENDING' as ClaimRecord['status'],
    notes: '',
  });

  const fetchClaims = useCallback(async () => {
    try {
      setIsLoading(true);
      const res: any = await axiosClient.get('/crm/warranty-claims');
      const list = Array.isArray(res) ? res : res?.content || res?.data || [];
      if (list.length > 0) {
        const mapped: ClaimRecord[] = list.map((item: any) => ({
          id: String(item.id),
          warrantyCode: item.productWarranty?.warrantyCode || item.warrantyCode || `W00${item.id}`,
          claimCode: item.claimCode || `CLM00${item.id}`,
          description: item.issueDescription || item.description || 'Yêu cầu bảo hành',
          reportedAt: item.createdDate ? String(item.createdDate).split('T')[0] : '2024-05-10',
          handler: item.handledBy?.name || item.handler || 'Nhân viên kỹ thuật',
          status: item.status === 'PROCESSING' ? 'PENDING' : item.status === 'COMPLETED' ? 'APPROVED' : (item.status || 'PENDING'),
          notes: item.resolutionNotes || item.notes || '',
        }));
        setData(mapped);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error fetching warranty claims:', err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setForm({
      warrantyCode: `W00${Math.floor(1 + Math.random() * 9)}`,
      claimCode: `CLM00${Math.floor(100 + Math.random() * 900)}`,
      description: '',
      handler: 'Nhân viên hỗ trợ',
      status: 'PENDING',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ClaimRecord) => {
    setEditingItem(item);
    setForm({
      warrantyCode: item.warrantyCode,
      claimCode: item.claimCode,
      description: item.description,
      handler: item.handler,
      status: item.status,
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      claimCode: form.claimCode,
      issueDescription: form.description,
      status: form.status === 'APPROVED' ? 'COMPLETED' : form.status === 'REJECTED' ? 'REJECTED' : 'PROCESSING',
      resolutionNotes: form.notes,
    };

    try {
      if (editingItem) {
        await axiosClient.put(`/crm/warranty-claims/${editingItem.id}`, payload);
        toast.success(`Cập nhật yêu cầu ${form.claimCode} thành công!`);
      } else {
        await axiosClient.post('/crm/warranty-claims', payload);
        toast.success(`Tạo mới yêu cầu bảo hành ${form.claimCode} thành công!`);
      }
      setIsModalOpen(false);
      fetchClaims();
    } catch (err) {
      console.error('Error saving warranty claim:', err);
      toast.error('Lỗi khi lưu yêu cầu bảo hành');
    }
  };

  const handleDelete = async (item: ClaimRecord) => {
    if (!confirm(`Bạn có chắc muốn xóa yêu cầu ${item.claimCode}?`)) return;
    try {
      await axiosClient.delete(`/crm/warranty-claims/${item.id}`);
      toast.success(`Đã xóa yêu cầu ${item.claimCode}`);
      setData((prev) => prev.filter((c) => c.id !== item.id));
    } catch (err) {
      console.error('Error deleting warranty claim:', err);
      toast.error('Lỗi khi xóa yêu cầu bảo hành');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (c) =>
        c.claimCode.toLowerCase().includes(q) ||
        c.warrantyCode.toLowerCase().includes(q) ||
        c.handler.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [search, data]);

  const columns = useMemo<ColumnDef<ClaimRecord>[]>(
    () => [
      {
        accessorKey: 'claimCode',
        header: 'Mã Yêu cầu',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'warrantyCode',
        header: 'Mã Bảo hành',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: (info) => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'reportedAt',
        header: 'Ngày báo cáo',
        cell: (info) => <span className="text-sm font-mono text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'handler',
        header: 'Người xử lý',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const styleMap: Record<string, string> = {
            PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
            APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
            REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
          };
          const labelMap: Record<string, string> = {
            PENDING: 'Đang chờ',
            APPROVED: 'Đã duyệt',
            REJECTED: 'Từ chối',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleMap[status] || 'bg-gray-100 text-gray-800'}`}>
              {labelMap[status] || status}
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
              onClick={() => setSelected(row.original)}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu cầu Bảo hành</h1>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
              onClick={handleOpenCreate}
            >
              <Plus className="w-4 h-4" /> Tạo mới
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm mã yêu cầu, mã bảo hành, người xử lý..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row) => setSelected(row)} />
      </div>

      {/* Drawer chi tiết */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết Yêu cầu: ${selected.claimCode}` : ''} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Mã Yêu cầu</p>
                <p className="font-mono font-bold text-primary">{selected.claimCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mã Bảo hành</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.warrantyCode}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Mô tả</p>
                <p className="italic text-gray-700 dark:text-gray-300">{selected.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ngày báo cáo</p>
                <p className="font-medium">{selected.reportedAt}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Người xử lý</p>
                <p className="font-medium">{selected.handler}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Trạng thái</p>
                <p>{selected.status}</p>
              </div>
            </div>
            {selected.notes && (
              <div>
                <p className="text-xs text-gray-500">Ghi chú</p>
                <p className="italic text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Modal tạo / sửa yêu cầu bảo hành */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Chỉnh sửa Yêu cầu Bảo hành' : 'Tạo Yêu cầu Bảo hành mới'} width="max-w-lg">
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã yêu cầu</label>
              <input
                type="text"
                required
                value={form.claimCode}
                onChange={(e) => setForm({ ...form, claimCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã bảo hành</label>
              <input
                type="text"
                required
                value={form.warrantyCode}
                onChange={(e) => setForm({ ...form, warrantyCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả sự cố</label>
            <input
              type="text"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người xử lý</label>
              <input
                type="text"
                value={form.handler}
                onChange={(e) => setForm({ ...form, handler: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="PENDING">Đang chờ</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Từ chối</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú giải quyết</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
            >
              Lưu Yêu cầu
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

