import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, RefreshCw } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


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

  const [returnLines, setReturnLines] = useState<{
    id: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    condition: 'UNOPENED' | 'DEFECTIVE' | 'USED_DAMAGED';
  }>([
    { id: '1', sku: 'SP-IP15-256', productName: 'iPhone 15 Pro 256GB - Titan Tự Nhiên', quantity: 1, unitPrice: 28500000, condition: 'UNOPENED' }
  ]);

  const updateLinesAndTotals = (newLines: typeof returnLines) => {
    setReturnLines(newLines);
    const total = newLines.reduce((sum, l) => sum + ((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)), 0);
    setEditingItem(prev => ({
      ...prev,
      returnAmount: total,
      refundedAmount: total,
    }));
  };

  const handleAddReturnLine = () => {
    const newLine = {
      id: Date.now().toString(),
      sku: 'SKU-SP-TRA',
      productName: 'Sản phẩm trả mới',
      quantity: 1,
      unitPrice: 500000,
      condition: 'UNOPENED' as const,
    };
    updateLinesAndTotals([...returnLines, newLine]);
  };

  const handleRemoveReturnLine = (id: string) => {
    updateLinesAndTotals(returnLines.filter(l => l.id !== id));
  };

  const handleUpdateReturnLine = (id: string, field: string, value: any) => {
    const updated = returnLines.map(l => l.id === id ? { ...l, [field]: value } : l);
    updateLinesAndTotals(updated);
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    const defaultItem = {
      id: '1',
      sku: 'SP-IP15-256',
      productName: 'iPhone 15 Pro 256GB - Titan Tự Nhiên',
      quantity: 1,
      unitPrice: 28500000,
      condition: 'UNOPENED' as const,
    };
    setReturnLines([defaultItem]);
    setEditingItem({
      returnCode: `RT-2026-${Date.now().toString().slice(-4)}`,
      invoiceCode: 'INV-2026-8892',
      customerName: 'Nguyễn Văn An',
      returnDate: new Date().toISOString().split('T')[0],
      returnAmount: 28500000,
      refundedAmount: 28500000,
      receiver: 'Trần Văn Hùng',
      status: 'CHO_KIEM_TRA',
      notes: 'Khách trả nguyên seal chưa kích hoạt',
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
        returnLines: returnLines.map(l => ({
          productId: l.id,
          sku: l.sku,
          productName: l.productName,
          quantity: l.quantity,
          refundPrice: l.unitPrice,
          unitPrice: l.unitPrice,
          condition: l.condition
        })),
        details: returnLines.map(l => ({
          productId: Number(l.id) || 1,
          quantity: l.quantity,
          refundPrice: l.unitPrice
        }))
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

      <Modal
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
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '🚚 Tạo phiếu trả hàng mới (Khách Hàng)' : '⚙️ Sửa thông tin phiếu trả hàng'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã phiếu trả *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, returnCode: `RT-2026-${Date.now().toString().slice(-4)}` })}
                    className="text-[10px] text-emerald-600 font-bold hover:underline"
                  >
                    ⚡ Sinh mã
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingItem.returnCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, returnCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hóa đơn mua gốc *</label>
              <input
                type="text"
                value={editingItem.invoiceCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="INV-2026-XXX"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên khách hàng *</label>
              <input
                type="text"
                value={editingItem.customerName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Họ tên khách hàng"
                required
              />
            </div>
          </div>

          {/* TABLE SẢN PHẨM TRẢ HÀNG */}
          <div className="p-3 bg-gray-50/80 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                📦 Danh sách sản phẩm trả lại ({returnLines.length})
              </h4>
              <button
                type="button"
                onClick={handleAddReturnLine}
                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm SP trả
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold border-b dark:border-gray-700">
                  <tr>
                    <th className="p-2">Sản phẩm / SKU</th>
                    <th className="p-2 w-20 text-center">Số lượng</th>
                    <th className="p-2 w-28 text-right">Đơn giá hoàn</th>
                    <th className="p-2 w-32">Tình trạng SP</th>
                    <th className="p-2 w-28 text-right">Thành tiền</th>
                    <th className="p-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {returnLines.map((line) => (
                    <tr key={line.id}>
                      <td className="p-1.5 space-y-1">
                        <input
                          type="text"
                          value={line.productName}
                          onChange={(e) => handleUpdateReturnLine(line.id, 'productName', e.target.value)}
                          placeholder="Tên sản phẩm..."
                          className="w-full p-1 border rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={line.sku}
                          onChange={(e) => handleUpdateReturnLine(line.id, 'sku', e.target.value.toUpperCase())}
                          placeholder="Mã SKU..."
                          className="w-full p-1 border rounded text-[10px] font-mono bg-white dark:bg-gray-800 text-gray-500"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleUpdateReturnLine(line.id, 'quantity', Number(e.target.value))}
                          className="w-full p-1 border rounded text-center font-mono text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="number"
                          value={line.unitPrice}
                          onChange={(e) => handleUpdateReturnLine(line.id, 'unitPrice', Number(e.target.value))}
                          className="w-full p-1 border rounded text-right font-mono text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="p-1.5">
                        <select
                          value={line.condition}
                          onChange={(e) => handleUpdateReturnLine(line.id, 'condition', e.target.value)}
                          className="w-full p-1 border rounded text-[11px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value="UNOPENED">🟢 Chưa mở hộp</option>
                          <option value="DEFECTIVE">🟠 Lỗi nhà sản xuất</option>
                          <option value="USED_DAMAGED">🔴 Đã dùng / Hỏng</option>
                        </select>
                      </td>
                      <td className="p-1.5 text-right font-mono font-bold text-red-600">
                        {formatCurrency(line.quantity * line.unitPrice)}
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveReturnLine(line.id)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {returnLines.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-3 text-center text-gray-400 font-medium">
                        Chưa có sản phẩm trả lại. Bấm "+ Thêm SP trả" để chọn sản phẩm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Giá trị hàng trả (VND) *</label>
              <input
                type="number"
                value={editingItem.returnAmount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, returnAmount: Number(e.target.value) })}
                className="w-full p-2 border border-red-300 dark:border-red-900 rounded font-mono font-bold text-red-600 bg-white dark:bg-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Đã hoàn khách (VND) *</label>
              <input
                type="number"
                value={editingItem.refundedAmount || 0}
                onChange={(e) => setEditingItem({ ...editingItem, refundedAmount: Number(e.target.value) })}
                className="w-full p-2 border border-emerald-300 dark:border-emerald-900 rounded font-mono font-bold text-emerald-600 bg-white dark:bg-gray-900"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày trả hàng *</label>
              <input
                type="date"
                value={editingItem.returnDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, returnDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Thủ kho nhận hàng</label>
              <input
                type="text"
                value={editingItem.receiver || ''}
                onChange={(e) => setEditingItem({ ...editingItem, receiver: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Tên nhân viên nhận kho"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tình trạng xử lý *</label>
              <select
                value={editingItem.status || 'CHO_KIEM_TRA'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="CHO_KIEM_TRA">⏳ Chờ Kiểm Kho (Chưa nhập kho)</option>
                <option value="DA_NHAN_LAI">🟢 Đã nhập lại kho & Duyệt trả</option>
                <option value="DA_HUY">🔴 Đã hủy phiếu</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chi tiết lý do trả & Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Chi tiết lý do trả hàng, tình trạng phụ kiện đính kèm..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow transition-colors">
              {modalMode === 'create' ? 'Lưu phiếu trả hàng' : 'Cập nhật phiếu'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
