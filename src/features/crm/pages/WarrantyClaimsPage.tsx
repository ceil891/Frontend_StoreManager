import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';
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
  conditionOnReceive?: string;
  estimatedReturnDate?: string;
  repairCost?: number;
  approvalStatus?: string;
  progressStatus?: string;
}

export function WarrantyClaimsPage() {
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
    return storeClaims.map((c: any) => ({
      id: c.id,
      warrantyCode: c.serialNumber || c.warrantyCode || '',
      claimCode: c.claimCode || '',
      description: c.issueDescription || c.description || '',
      reportedAt: c.receivedDate || c.createdDate || '',
      handler: c.repairedBy || c.handler || 'Kỹ thuật viên',
      status: (c.status === 'COMPLETED' ? 'APPROVED' : c.status === 'REJECTED' ? 'REJECTED' : 'PENDING') as any,
      notes: c.notes || c.resolutionNotes || '',
      conditionOnReceive: c.conditionOnReceive,
      estimatedReturnDate: c.estimatedReturnDate,
      repairCost: c.repairCost,
      approvalStatus: c.approvalStatus,
      progressStatus: c.progressStatus || (c.status === 'COMPLETED' ? 'DONE' : 'NEW'),
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
    conditionOnReceive: '',
    estimatedReturnDate: '',
    repairCost: 0,
    approvalStatus: 'PENDING_CHECK',
    progressStatus: 'NEW',
  });

  const [mockCustomer, setMockCustomer] = useState<{name: string, phone: string, product: string} | null>(null);

  const handleWarrantyCodeBlur = () => {
    if (form.warrantyCode && form.warrantyCode.trim() !== '') {
      setMockCustomer({
        name: 'Nguyễn Văn A',
        phone: '0988123456',
        product: 'iPhone 15 Pro Max',
      });
    } else {
      setMockCustomer(null);
    }
  };

  const generateClaimCode = () => {
    const today = new Date();
    const yymmdd = today.getFullYear().toString().slice(-2) + 
      String(today.getMonth() + 1).padStart(2, '0') + 
      String(today.getDate()).padStart(2, '0');
    const pad4 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    setForm(prev => ({ ...prev, claimCode: `YCBH-${yymmdd}-${pad4}` }));
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setMockCustomer(null);
    setForm({
      warrantyCode: '',
      claimCode: '',
      description: '',
      handler: 'Nhân viên hỗ trợ',
      status: 'PENDING',
      notes: '',
      conditionOnReceive: '',
      estimatedReturnDate: '',
      repairCost: 0,
      approvalStatus: 'PENDING_CHECK',
      progressStatus: 'NEW',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ClaimRecord) => {
    setEditingItem(item);
    setMockCustomer(null);
    setForm({
      warrantyCode: item.warrantyCode,
      claimCode: item.claimCode,
      description: item.description,
      handler: item.handler,
      status: item.status,
      notes: item.notes || '',
      conditionOnReceive: item.conditionOnReceive || '',
      estimatedReturnDate: item.estimatedReturnDate || '',
      repairCost: item.repairCost || 0,
      approvalStatus: item.approvalStatus || 'PENDING_CHECK',
      progressStatus: item.progressStatus || 'NEW',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      claimCode: form.claimCode,
      warrantyCode: form.warrantyCode,
      issueDescription: form.description,
      status: form.status === 'APPROVED' ? 'COMPLETED' : form.status === 'REJECTED' ? 'REJECTED' : 'PROCESSING',
      resolutionNotes: form.notes,
      conditionOnReceive: form.conditionOnReceive,
      estimatedReturnDate: form.estimatedReturnDate,
      repairCost: form.repairCost,
      approvalStatus: form.approvalStatus,
      progressStatus: form.progressStatus,
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
      fetchWarrantyClaims();
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
      fetchWarrantyClaims();
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
        accessorKey: 'progressStatus',
        header: 'Tiến độ',
        cell: (info) => {
          const status = info.getValue() as string;
          const styleMap: Record<string, string> = {
            NEW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            CHECKING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            REPAIRING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
            WAITING_PARTS: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
            DONE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
            RETURNED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
          };
          const labelMap: Record<string, string> = {
            NEW: 'Mới tiếp nhận',
            CHECKING: 'Đang kiểm tra',
            REPAIRING: 'Đang sửa chữa',
            WAITING_PARTS: 'Chờ linh kiện',
            DONE: 'Đã sửa xong',
            RETURNED: 'Đã trả khách',
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
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết Yêu cầu: ${selected.claimCode}` : ''} width="max-w-lg">
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
                <p className="text-xs text-gray-500">Tình trạng nhận</p>
                <p className="text-gray-700 dark:text-gray-300">{selected.conditionOnReceive || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Người xử lý</p>
                <p className="font-medium">{selected.handler}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tiến độ</p>
                <p>{selected.progressStatus}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Kết quả duyệt</p>
                <p>{selected.approvalStatus}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Chi phí sửa (nếu có)</p>
                <p>{selected.repairCost ? selected.repairCost.toLocaleString() + ' đ' : '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Ngày hẹn trả</p>
                <p>{selected.estimatedReturnDate || '-'}</p>
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
      </Modal>

      {/* Modal tạo / sửa yêu cầu bảo hành */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Chỉnh sửa Yêu cầu Bảo hành' : 'Tạo Yêu cầu Bảo hành mới'} width="max-w-2xl">
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã yêu cầu</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={form.claimCode}
                  onChange={(e) => setForm({ ...form, claimCode: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
                <button type="button" onClick={generateClaimCode} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm border border-gray-300 dark:border-gray-600 whitespace-nowrap">
                  🎲 Tạo mã
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã bảo hành</label>
              <input
                type="text"
                required
                value={form.warrantyCode}
                onBlur={handleWarrantyCodeBlur}
                onChange={(e) => setForm({ ...form, warrantyCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
              {mockCustomer && (
                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/30 text-sm">
                  <p><strong>Khách hàng:</strong> {mockCustomer.name} - {mockCustomer.phone}</p>
                  <p><strong>Sản phẩm:</strong> {mockCustomer.product}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tình trạng ngoại quan khi nhận máy (*)</label>
              <textarea
                required
                rows={2}
                placeholder="Máy trày nhẹ 4 góc, màn hình không xước..."
                value={form.conditionOnReceive}
                onChange={(e) => setForm({ ...form, conditionOnReceive: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả sự cố khách báo</label>
              <textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kết quả duyệt</label>
              <select
                value={form.approvalStatus}
                onChange={(e) => setForm({ ...form, approvalStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="PENDING_CHECK">Đang chờ kiểm tra</option>
                <option value="APPROVED">Bảo hành hợp lệ</option>
                <option value="REJECTED">Từ chối - Lỗi người dùng</option>
                <option value="PAID_REPAIR">Sửa tính phí</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tiến độ thực tế</label>
              <select
                value={form.progressStatus}
                onChange={(e) => setForm({ ...form, progressStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="NEW">Mới tiếp nhận</option>
                <option value="CHECKING">Đang kiểm tra</option>
                <option value="REPAIRING">Đang sửa chữa</option>
                <option value="WAITING_PARTS">Chờ linh kiện</option>
                <option value="DONE">Đã sửa xong</option>
                <option value="RETURNED">Đã trả khách</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi phí sửa chữa (Nếu từ chối bảo hành)</label>
              <input
                type="number"
                placeholder="0"
                value={form.repairCost}
                onChange={(e) => setForm({ ...form, repairCost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hẹn trả dự kiến</label>
              <input
                type="date"
                value={form.estimatedReturnDate}
                onChange={(e) => setForm({ ...form, estimatedReturnDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú thêm</label>
            <textarea
              rows={2}
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
