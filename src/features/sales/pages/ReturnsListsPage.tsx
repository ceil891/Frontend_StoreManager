import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, RefreshCw } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore } from '@/features/sales/store/salesStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface ReturnBillRecord {
  id: string;
  returnCode: string;
  invoiceCode: string;
  customerName: string;
  returnDate: string;
  returnAmount: number;
  refundedAmount: number;
  receiver: string;
  status: 'CHO_KIEM_TRA' | 'DA_NHAN_LAI' | 'DA_HUY';
  notes?: string;
}

export function ReturnsListsPage() {
  const { customerReturns, fetchCustomerReturns, addCustomerReturn, updateCustomerReturn, deleteCustomerReturn } = useSalesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ReturnBillRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ReturnBillRecord>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchCustomerReturns();
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách trả hàng');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchCustomerReturns]);

  const data = useMemo<ReturnBillRecord[]>(() => {
    return customerReturns.map((ret) => ({
      id: ret.id,
      returnCode: ret.returnCode,
      invoiceCode: ret.orderCode,
      customerName: ret.customerId || 'Khách lẻ',
      returnDate: ret.returnDate ? ret.returnDate.substring(0, 10) : '',
      returnAmount: ret.refundAmount,
      refundedAmount: ret.status === 'APPROVED_REFUNDED' ? ret.refundAmount : 0,
      receiver: ret.inspector || 'Nhân viên nhận',
      status: ret.status === 'APPROVED_REFUNDED' ? 'DA_NHAN_LAI' : ret.status === 'REJECTED' ? 'DA_HUY' : 'CHO_KIEM_TRA',
      notes: ret.reason || ret.notes || '',
    }));
  }, [customerReturns]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.returnCode.toLowerCase().includes(q) ||
        d.invoiceCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.receiver.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      returnCode: `RT-2026-${Date.now().toString().slice(-4)}`,
      invoiceCode: '',
      customerName: '',
      returnDate: new Date().toISOString().split('T')[0],
      returnAmount: 0,
      refundedAmount: 0,
      receiver: '',
      status: 'CHO_KIEM_TRA',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ReturnBillRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.returnCode || !editingItem.invoiceCode || !editingItem.customerName) return;

    try {
      const amt = Number(editingItem.returnAmount || 0);
      const apiStatus = editingItem.status === 'DA_NHAN_LAI' ? 'APPROVED_REFUNDED' : editingItem.status === 'DA_HUY' ? 'REJECTED' : 'PENDING_INSPECTION';

      const payload = {
        returnCode: editingItem.returnCode,
        orderCode: editingItem.invoiceCode,
        customerId: editingItem.customerName,
        refundAmount: amt,
        refundMethod: 'CASH' as any,
        isRestocked: true,
        returnBranchId: 'branch_001',
        returnDate: editingItem.returnDate || new Date().toISOString().split('T')[0],
        reason: editingItem.notes || '',
        condition: 'UNOPENED' as any,
        status: apiStatus as any,
        inspector: editingItem.receiver || 'Nhân viên kiểm tra',
        notes: editingItem.notes || '',
      };

      if (modalMode === 'create') {
        await addCustomerReturn(payload);
        toast.success('Thêm phiếu trả hàng thành công!');
      } else {
        await updateCustomerReturn(editingItem.id!, payload);
        toast.success('Cập nhật phiếu trả hàng thành công!');
      }
      setIsModalOpen(false);
      fetchCustomerReturns();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu phiếu trả hàng.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa biên bản trả hàng này?')) {
      try {
        await deleteCustomerReturn(id);
        toast.success('Đã xóa phiếu trả hàng thành công!');
        fetchCustomerReturns();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa phiếu trả hàng.');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<ReturnBillRecord>[]>(
    () => [
      {
        accessorKey: 'returnCode',
        header: 'Mã phiếu trả',
        cell: (info) => <span className="font-mono font-bold text-red-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceCode',
        header: 'Hóa đơn gốc',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'returnAmount',
        header: 'Giá trị hàng trả',
        cell: (info) => <span className="font-mono font-bold text-red-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'refundedAmount',
        header: 'Đã hoàn khách',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ kiểm kho';
          if (status === 'DA_NHAN_LAI') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã nhận lại';
          } else if (status === 'DA_HUY') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã hủy';
          }
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelected(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Lịch sử nhận hàng hoàn trả (khách hàng)</h1>
          <p className="text-sm text-gray-500">
            Xem và xử lý các yêu cầu trả lại hàng hóa của khách hàng, ghi nhận nhập kho lại và hoàn lại tiền.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Phiếu Trả Hàng
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã phiếu trả, mã hóa đơn gốc, khách hàng, thủ kho..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách trả hàng...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Phiếu Trả: ${selected?.returnCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã phiếu trả:</span>
                <p className="font-mono font-semibold text-red-600">{selected.returnCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Hóa đơn mua gốc:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày trả hàng:</span>
                <p className="font-mono">{selected.returnDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Thủ kho nhận hàng:</span>
                <p>{selected.receiver || 'Chưa nhận'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500">Giá trị trả lại:</span>
                <p className="font-mono font-bold text-red-600">{formatCurrency(selected.returnAmount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Đã hoàn trả khách:</span>
                <p className="font-mono font-bold text-emerald-600">{formatCurrency(selected.refundedAmount)}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái xử lý:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_NHAN_LAI'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_KIEM_TRA'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_NHAN_LAI'
                    ? 'Đã nhận lại kho'
                    : selected.status === 'CHO_KIEM_TRA'
                    ? 'Chờ kiểm kho'
                    : 'Đã hủy'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Chi tiết lý do trả:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo phiếu trả hàng mới' : 'Sửa thông tin phiếu trả'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã phiếu trả *</label>
              <input
                type="text"
                value={editingItem.returnCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, returnCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hóa đơn mua gốc *</label>
              <input
                type="text"
                value={editingItem.invoiceCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="INV-2026-XXX"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên khách hàng *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Họ tên khách hàng"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Giá trị hàng trả (VND) *</label>
              <input
                type="number"
                value={editingItem.returnAmount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, returnAmount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Đã hoàn khách (VND) *</label>
              <input
                type="number"
                value={editingItem.refundedAmount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, refundedAmount: Number(e.target.value) })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày trả hàng *</label>
              <input
                type="date"
                value={editingItem.returnDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, returnDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Thủ kho nhận hàng</label>
              <input
                type="text"
                value={editingItem.receiver || ''}
                onChange={(e) => setEditingItem({ ...editingItem, receiver: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên nhận kho"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tình trạng xử lý *</label>
            <select
              value={editingItem.status || 'CHO_KIEM_TRA'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_KIEM_TRA">Chờ Kiểm Kho (Chưa nhập kho)</option>
              <option value="DA_NHAN_LAI">Đã nhập lại kho & Duyệt trả</option>
              <option value="DA_HUY">Đã hủy phiếu</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Chi tiết lý do trả</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết lỗi sản phẩm, số lượng..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Lưu phiếu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
