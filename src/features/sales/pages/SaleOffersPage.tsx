import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Clock } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore } from '@/features/sales/store/salesStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface SaleOfferRecord {
  id: string;
  offerCode: string;
  customerName: string;
  offerDate: string;
  expiryDate: string;
  totalAmount: number;
  salesperson: string;
  status: 'CHO_DUYET' | 'DA_CHAP_NHAN' | 'DA_TU_CHOI' | 'HET_HAN';
  notes?: string;
}

export function SaleOffersPage() {
  const { quotes, fetchQuotes, addQuote, updateQuote, deleteQuote } = useSalesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SaleOfferRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SaleOfferRecord>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchQuotes();
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách báo giá');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchQuotes]);

  const data = useMemo<SaleOfferRecord[]>(() => {
    return quotes.map((q) => ({
      id: q.id,
      offerCode: q.code,
      customerName: q.customerId || 'Khách lẻ',
      offerDate: q.issueDate ? q.issueDate.substring(0, 10) : '',
      expiryDate: q.validUntil ? q.validUntil.substring(0, 10) : '',
      totalAmount: q.totalAmount,
      salesperson: q.salesRep || 'Nhân viên chào hàng',
      status: q.status === 'ACCEPTED' ? 'DA_CHAP_NHAN' : q.status === 'EXPIRED' ? 'HET_HAN' : 'CHO_DUYET',
      notes: q.notes || '',
    }));
  }, [quotes]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.offerCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q) ||
        d.salesperson.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      offerCode: `OF-2026-${Date.now().toString().slice(-4)}`,
      customerName: '',
      offerDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalAmount: 0,
      salesperson: '',
      status: 'CHO_DUYET',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SaleOfferRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.offerCode || !editingItem.customerName) return;

    try {
      const amt = Number(editingItem.totalAmount || 0);
      const apiStatus = editingItem.status === 'DA_CHAP_NHAN' ? 'ACCEPTED' : editingItem.status === 'HET_HAN' ? 'EXPIRED' : 'SENT';

      const payload = {
        code: editingItem.offerCode,
        customerId: editingItem.customerName,
        issueDate: editingItem.offerDate || new Date().toISOString().split('T')[0],
        revision: 1,
        subTotal: amt,
        taxAmount: amt * 0.1,
        discountAmount: 0,
        totalAmount: amt * 1.1,
        validUntil: editingItem.expiryDate || new Date().toISOString().split('T')[0],
        status: apiStatus as any,
        salesRep: editingItem.salesperson || '',
        notes: editingItem.notes || '',
        itemsCount: 1,
      };

      if (modalMode === 'create') {
        await addQuote(payload);
        toast.success('Thêm chào hàng thành công!');
      } else {
        await updateQuote(editingItem.id!, payload);
        toast.success('Cập nhật chào hàng thành công!');
      }
      setIsModalOpen(false);
      fetchQuotes();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu chào hàng.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa chào hàng này?')) {
      try {
        await deleteQuote(id);
        toast.success('Đã xóa chào hàng thành công!');
        fetchQuotes();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa chào hàng.');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<SaleOfferRecord>[]>(
    () => [
      {
        accessorKey: 'offerCode',
        header: 'Mã báo giá',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'offerDate',
        header: 'Ngày báo giá',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng báo giá',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'salesperson',
        header: 'Nhân viên lập',
        cell: (info) => <span>{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-amber-100 text-amber-800';
          let label = 'Chờ Duyệt';
          if (status === 'DA_CHAP_NHAN') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Đã chấp nhận';
          } else if (status === 'DA_TU_CHOI') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Đã từ chối';
          } else if (status === 'HET_HAN') {
            badgeClass = 'bg-gray-100 text-gray-800';
            label = 'Hết hạn';
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
              title="Xem chi tiết báo giá"
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
          <h1 className="text-2xl font-bold">Báo giá khách hàng (sale offers)</h1>
          <p className="text-sm text-gray-500">
            Tạo và theo dõi các báo giá bán sỉ/hợp đồng gửi cho khách hàng, quản lý vòng đời duyệt báo giá.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tạo Báo Giá Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã báo giá, tên khách hàng, nhân viên lập..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách báo giá...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Báo Giá: ${selected?.offerCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã báo giá:</span>
                <p className="font-mono font-semibold">{selected.offerCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Nhân viên kinh doanh:</span>
                <p>{selected.salesperson}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày tạo báo giá:</span>
                <p className="font-mono">{selected.offerDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn hiệu lực:</span>
                <p className="font-mono">{selected.expiryDate}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tổng giá trị dự kiến:</span>
              <p className="font-mono font-bold text-emerald-600 text-lg">{formatCurrency(selected.totalAmount)}</p>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái báo giá:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_CHAP_NHAN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_DUYET'
                      ? 'bg-amber-100 text-amber-800'
                      : selected.status === 'DA_TU_CHOI'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selected.status === 'DA_CHAP_NHAN'
                    ? 'Đã chấp nhận'
                    : selected.status === 'CHO_DUYET'
                    ? 'Chờ Duyệt'
                    : selected.status === 'DA_TU_CHOI'
                    ? 'Đã từ chối'
                    : 'Hết hạn'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú chi tiết:</span>
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
        title={modalMode === 'create' ? 'Tạo báo giá bán hàng mới' : 'Sửa báo giá'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã báo giá *</label>
              <input
                type="text"
                value={editingItem.offerCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, offerCode: e.target.value })}
                className="w-full p-2 border rounded font-mono bg-gray-50"
                required
                disabled
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nhân viên kinh doanh *</label>
              <input
                type="text"
                value={editingItem.salesperson || ''}
                onChange={(e) => setEditingItem({ ...editingItem, salesperson: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="Tên nhân viên"
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
              placeholder="Công ty, tổ chức hoặc khách mua sỉ"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày báo giá *</label>
              <input
                type="date"
                value={editingItem.offerDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, offerDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hạn hiệu lực báo giá *</label>
              <input
                type="date"
                value={editingItem.expiryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tổng giá trị dự kiến (VND) *</label>
            <input
              type="number"
              value={editingItem.totalAmount || 0}
              onChange={(e) => setEditingItem({ ...editingItem, totalAmount: Number(e.target.value) })}
              className="w-full p-2 border rounded font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trạng thái *</label>
            <select
              value={editingItem.status || 'CHO_DUYET'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border rounded"
            >
              <option value="CHO_DUYET">Chờ Duyệt</option>
              <option value="DA_CHAP_NHAN">Đã chấp nhận</option>
              <option value="DA_TU_CHOI">Đã từ chối</option>
              <option value="HET_HAN">Hết hiệu lực</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú chi tiết</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Chi tiết sản phẩm, mức chiết khấu..."
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
              Lưu báo giá
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
