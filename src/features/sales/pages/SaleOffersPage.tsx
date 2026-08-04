import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Clock, Printer } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import { PrintInvoiceModal, type PrintInvoiceData } from '@/shared/components/ui/PrintInvoiceModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore } from '@/features/sales/store/salesStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
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
  const { products, fetchProducts } = useInventoryStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SaleOfferRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SaleOfferRecord>>({});
  const [printData, setPrintData] = useState<PrintInvoiceData | null>(null);

  // Product Line Items for Offer Creation Modal
  const [offerItems, setOfferItems] = useState<{
    id: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>([
    { id: '1', sku: 'SKU-COFFEE-01', productName: 'Cà Phê Arabica Rang Xay 250g', quantity: 10, unitPrice: 120000, discount: 50000 }
  ]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchQuotes(), fetchProducts()]);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách báo giá');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchQuotes, fetchProducts]);

  const updateOfferItemsAndTotal = (newItems: typeof offerItems) => {
    setOfferItems(newItems);
    const totalAmount = newItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0)), 0);
    setEditingItem(prev => ({
      ...prev,
      totalAmount: Math.max(0, totalAmount)
    }));
  };

  const handleAddOfferItem = () => {
    const p = products[0];
    const newItem = {
      id: Date.now().toString(),
      sku: p?.sku || 'SKU-NEW',
      productName: p?.name || 'Sản phẩm mới',
      quantity: 1,
      unitPrice: p?.price || 100000,
      discount: 0
    };
    updateOfferItemsAndTotal([...offerItems, newItem]);
  };

  const handleRemoveOfferItem = (id: string) => {
    updateOfferItemsAndTotal(offerItems.filter(i => i.id !== id));
  };

  const handleUpdateOfferItem = (id: string, field: string, value: any) => {
    const updated = offerItems.map(item => {
      if (item.id !== id) return item;
      if (field === 'sku') {
        const p = products.find(prod => prod.sku === value);
        return {
          ...item,
          sku: value,
          productName: p?.name || item.productName,
          unitPrice: p?.price || item.unitPrice
        };
      }
      return { ...item, [field]: value };
    });
    updateOfferItemsAndTotal(updated);
  };

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
        itemsCount: offerItems.length,
        orderLines: offerItems.map(i => ({
          id: i.id,
          sku: i.sku,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineTotal: (i.quantity * i.unitPrice) - i.discount
        }))
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

  const handlePrintOffer = (record: SaleOfferRecord) => {
    setPrintData({
      documentTitle: 'BẢNG BÁO GIÁ SẢN PHẨM & DỊCH VỤ',
      code: record.offerCode,
      date: record.offerDate,
      dueDate: record.expiryDate,
      customerOrSupplierName: record.customerName,
      branchName: 'Phòng Kinh Doanh - RetailHub HQ',
      createdByName: record.salesperson || 'Nhân viên kinh doanh',
      notes: record.notes || 'Báo giá có hiệu lực trong vòng 14 ngày kể từ ngày ban hành.',
      items: offerItems.map(i => ({
        sku: i.sku,
        name: i.productName,
        quantity: i.quantity,
        price: i.unitPrice,
        discount: i.discount,
        total: (i.quantity * i.unitPrice) - i.discount
      })),
      subTotal: record.totalAmount,
      totalAmount: record.totalAmount,
      statusLabel: record.status === 'DA_CHAP_NHAN' ? 'Đã chấp nhận' : record.status === 'HET_HAN' ? 'Hết hạn' : 'Chờ duyệt'
    });
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
              onClick={() => handlePrintOffer(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="In báo giá / Tải PDF"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
            </button>
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

      <Modal
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
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '📋 Tạo báo giá bán hàng mới' : '⚙️ Chỉnh sửa báo giá bán hàng'}
        width="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã báo giá *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, offerCode: `OF-2026-${Date.now().toString().slice(-4)}` })}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    ⚡ Sinh mã
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingItem.offerCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, offerCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhân viên kinh doanh phụ trách *</label>
              <input
                type="text"
                value={editingItem.salesperson || ''}
                onChange={(e) => setEditingItem({ ...editingItem, salesperson: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Nhập tên nhân viên Sale..."
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên khách hàng / Công ty *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              placeholder="Công ty, tổ chức hoặc khách mua sỉ..."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày lập báo giá *</label>
              <input
                type="date"
                value={editingItem.offerDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, offerDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hạn hiệu lực báo giá *</label>
              <input
                type="date"
                value={editingItem.expiryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* SECTION BẢNG CHỌN SẢN PHẨM BÁO GIÁ */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                📦 Danh sách sản phẩm báo giá ({offerItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddOfferItem}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm sản phẩm
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Sản phẩm / SKU</th>
                    <th className="p-2 w-24 text-center">Số lượng</th>
                    <th className="p-2 w-32 text-right">Đơn giá chào</th>
                    <th className="p-2 w-28 text-right">Chiết khấu</th>
                    <th className="p-2 w-32 text-right">Thành tiền</th>
                    <th className="p-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {offerItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">
                        <select
                          value={item.sku}
                          onChange={(e) => handleUpdateOfferItem(item.id, 'sku', e.target.value)}
                          className="w-full p-1 border rounded bg-white dark:bg-gray-900 text-xs font-medium"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>
                          ))}
                          {!products.some(p => p.sku === item.sku) && (
                            <option value={item.sku}>{item.sku} - {item.productName}</option>
                          )}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleUpdateOfferItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-center font-bold"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateOfferItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-right font-mono"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleUpdateOfferItem(item.id, 'discount', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-right font-mono text-red-500"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 font-mono">
                        {((item.quantity || 0) * (item.unitPrice || 0) - (item.discount || 0)).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveOfferItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tổng giá trị báo giá dự kiến (VND tự động) *</label>
              <input
                type="number"
                value={editingItem.totalAmount || 0}
                readOnly
                className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái phê duyệt *</label>
              <select
                value={editingItem.status || 'CHO_DUYET'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="CHO_DUYET">⏳ Chờ Duyệt</option>
                <option value="DA_CHAP_NHAN">✅ Đã chấp nhận</option>
                <option value="DA_TU_CHOI">❌ Đã từ chối</option>
                <option value="HET_HAN">⚪ Hết hiệu lực</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú chi tiết & Điều khoản báo giá</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Chi tiết sản phẩm, mức chiết khấu, điều kiện thanh toán..."
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

      <PrintInvoiceModal
        isOpen={!!printData}
        onClose={() => setPrintData(null)}
        data={printData}
      />
    </div>
  );
}
