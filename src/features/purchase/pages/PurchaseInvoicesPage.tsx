import { Modal } from '@/shared/components/ui/Modal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Receipt, Printer } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import { PrintInvoiceModal, type PrintInvoiceData } from '@/shared/components/ui/PrintInvoiceModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { CreateButton, SecondaryButton, PrimaryButton, DangerButton } from '@/shared/components/ui/Button';

interface PurchaseInvoiceRecord {
  id: string;
  invoiceCode: string;
  poCode: string;
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  vatAmount: number;
  totalAmount: number;
  status: 'CHO_THANH_TOAN' | 'DA_THANH_TOAN' | 'DA_HUY';
  notes?: string;
}

export function PurchaseInvoicesPage() {
  const { products, fetchProducts } = useInventoryStore();
  const [data, setData] = useState<PurchaseInvoiceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PurchaseInvoiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<PurchaseInvoiceRecord>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [printData, setPrintData] = useState<PrintInvoiceData | null>(null);

  // Purchase Invoice Items State
  const [purItems, setPurItems] = useState<{
    id: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    vatPercent: number;
  }>([]);

  const updatePurItemsAndTotals = (newItems: typeof purItems) => {
    setPurItems(newItems);
    const subTotal = newItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)), 0);
    const vatAmount = newItems.reduce((sum, item) => sum + Math.round(((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) * (Number(item.vatPercent) || 0)) / 100), 0);
    const totalAmount = subTotal + vatAmount;
    setEditingItem(prev => ({
      ...prev,
      subTotal,
      vatAmount,
      totalAmount
    }));
  };

  const handleAddPurItem = () => {
    const p = products[0];
    const newItem = {
      id: Date.now().toString(),
      sku: p?.sku || 'SKU-NEW',
      productName: p?.name || 'Sản phẩm mới',
      quantity: 10,
      unitPrice: p?.price || 40000,
      vatPercent: 8
    };
    updatePurItemsAndTotals([...purItems, newItem]);
  };

  const handleRemovePurItem = (id: string) => {
    updatePurItemsAndTotals(purItems.filter(i => i.id !== id));
  };

  const handleUpdatePurItem = (id: string, field: string, value: any) => {
    const updated = purItems.map(item => {
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
    updatePurItemsAndTotals(updated);
  };

  const fetchInvoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/purchase/orders');
      const list = extractPageContent<any>(res);
      const mapped: PurchaseInvoiceRecord[] = list.map((item: any) => {
        const status: PurchaseInvoiceRecord['status'] =
          item.paymentStatus === 'PAID'
            ? 'DA_THANH_TOAN'
            : item.status === 'CANCELLED'
              ? 'DA_HUY'
              : 'CHO_THANH_TOAN';
        return {
          id: String(item.id),
          invoiceCode: `INV-MH-${item.id}`,
          poCode: item.poCode || item.poNumber || `PO-${item.id}`,
          supplierName: item.supplierName || item.supplier?.name || '',
          invoiceDate: item.poDate ? String(item.poDate).split('T')[0] : (item.orderDate ? String(item.orderDate).split('T')[0] : ''),
          dueDate: item.expectedDate ? String(item.expectedDate).split('T')[0] : (item.estDeliveryDate ? String(item.estDeliveryDate).split('T')[0] : ''),
          subTotal: Math.round((Number(item.totalAmount) || 0) * 0.9),
          vatAmount: Math.round((Number(item.totalAmount) || 0) * 0.1),
          totalAmount: Number(item.totalAmount) || 0,
          status,
        };
      });
      setData(mapped);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách hóa đơn mua hàng');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetchProducts();
  }, [fetchInvoices, fetchProducts]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.invoiceCode.toLowerCase().includes(q) ||
        d.poCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      invoiceCode: `INV-PUR-2026-${Date.now().toString().slice(-3)}`,
      poCode: '',
      supplierName: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      subTotal: 0,
      vatAmount: 0,
      totalAmount: 0,
      status: 'CHO_THANH_TOAN',
      notes: '',
    });
    setPurItems([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (item: PurchaseInvoiceRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);

    try {
      const res = await axiosClient.get<any, any>(`/purchase/orders/${item.id}`);
      const poData = res?.data || res;
      const rawLines = Array.isArray(poData.details) && poData.details.length > 0 ? poData.details : (Array.isArray(poData.poLines) ? poData.poLines : []);
      if (rawLines.length > 0) {
        const mapped = rawLines.map((l: any, idx: number) => ({
          id: String(l.id || idx + 1),
          sku: l.productSku || l.sku || `SKU-${l.productId || idx + 1}`,
          productName: l.productName || l.product?.name || 'Sản phẩm đặt mua',
          quantity: Number(l.quantity || 1),
          unitPrice: Number(l.unitPrice || 0),
          vatPercent: 10,
        }));
        setPurItems(mapped);
      } else {
        setPurItems([]);
      }
    } catch (err) {
      console.warn('Failed to load detailed PO lines for invoice:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.poCode || !editingItem.supplierName) return;

    const sub = Number(editingItem.subTotal || 0);
    const vat = Number(editingItem.vatAmount || 0);
    const total = sub + vat;

    try {
      if (modalMode === 'create') {
        await axiosClient.post('/purchase/orders', {
          poNumber: editingItem.poCode,
          supplierName: editingItem.supplierName,
          orderDate: editingItem.invoiceDate,
          estDeliveryDate: editingItem.dueDate || editingItem.invoiceDate,
          totalAmount: total,
          notes: editingItem.notes,
        });
        toast.success('Tạo hóa đơn mua hàng thành công');
      } else {
        await axiosClient.put(`/purchase/orders/${editingItem.id}`, {
          poNumber: editingItem.poCode,
          supplierName: editingItem.supplierName,
          orderDate: editingItem.invoiceDate,
          estDeliveryDate: editingItem.dueDate,
          totalAmount: total,
          notes: editingItem.notes,
        });
        toast.success('Cập nhật hóa đơn mua hàng thành công');
      }
      setIsModalOpen(false);
      await fetchInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Lưu hóa đơn thất bại');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      try {
        await axiosClient.delete(`/purchase/orders/${id}`);
        toast.success('Đã xóa hóa đơn mua hàng');
        await fetchInvoices();
      } catch (err) {
        console.error(err);
        toast.error('Xóa hóa đơn thất bại');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handlePrintPurchaseInvoice = (record: PurchaseInvoiceRecord) => {
    setPrintData({
      documentTitle: 'HÓA ĐƠN MUA HÀNG - NGUỒN VÀO',
      code: record.invoiceCode,
      date: record.invoiceDate,
      dueDate: record.dueDate,
      customerOrSupplierName: record.supplierName,
      branchName: 'Kho tổng RetailHub Central Logistics',
      createdByName: 'Bộ phận Mua Hàng & Kho',
      notes: record.notes || 'Hóa đơn mua hàng ghi nhận đầu vào sản phẩm.',
      items: purItems.map(i => ({
        sku: i.sku,
        name: i.productName,
        quantity: i.quantity,
        price: i.unitPrice,
        discount: 0,
        total: i.quantity * i.unitPrice
      })),
      subTotal: record.subTotal || record.totalAmount,
      taxAmount: record.vatAmount || 0,
      totalAmount: record.totalAmount,
      statusLabel: record.status === 'DA_THANH_TOAN' ? 'Đã thanh toán' : record.status === 'CHO_THANH_TOAN' ? 'Chờ thanh toán' : 'Đã hủy'
    });
  };

  const columns = useMemo<ColumnDef<PurchaseInvoiceRecord>[]>(
    () => [
      {
        accessorKey: 'invoiceCode',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'poCode',
        header: 'Mã PO',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Ngày hóa đơn',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng thanh toán',
        cell: (info) => <span className="font-mono font-bold text-blue-600">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const badgeClass =
            status === 'DA_THANH_TOAN'
              ? 'bg-emerald-100 text-emerald-800'
              : status === 'CHO_THANH_TOAN'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-red-100 text-red-800';
          const label = status === 'DA_THANH_TOAN' ? 'Đã thanh toán' : status === 'CHO_THANH_TOAN' ? 'Chờ thanh toán' : 'Đã hủy';
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePrintPurchaseInvoice(row.original)}
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="In hóa đơn / Tải PDF"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
            </button>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hóa đơn mua hàng (nguồn vào)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý hóa đơn VAT đầu vào từ các nhà cung cấp nhằm đối chiếu công nợ và kế toán tài chính.
          </p>
        </div>
        <CreateButton onClick={handleOpenCreate}>
          Nhận hóa đơn mới
        </CreateButton>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
        <SearchInput
          value={search}
          onValueChange={setSearch}
          placeholder="Tìm kiếm mã hóa đơn, mã PO, nhà cung cấp..."
          containerClassName="w-full sm:max-w-md"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Hóa Đơn Mua: ${selected?.invoiceCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã hóa đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã PO đơn mua:</span>
                <p className="font-mono font-semibold">{selected.poCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Nhà cung cấp:</span>
              <p className="font-semibold">{selected.supplierName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày hóa đơn:</span>
                <p className="font-mono">{selected.invoiceDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Ngày đến hạn:</span>
                <p className="font-mono">{selected.dueDate}</p>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền hàng (Subtotal):</span>
                <span className="font-mono">{formatCurrency(selected.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thuế VAT:</span>
                <span className="font-mono">{formatCurrency(selected.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Tổng cộng:</span>
                <span className="font-mono text-blue-600">{formatCurrency(selected.totalAmount)}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Trạng thái:</span>
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                    selected.status === 'DA_THANH_TOAN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selected.status === 'CHO_THANH_TOAN'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected.status === 'DA_THANH_TOAN' ? 'Đã thanh toán' : selected.status === 'CHO_THANH_TOAN' ? 'Chờ thanh toán' : 'Đã hủy'}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú:</span>
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
        title={modalMode === 'create' ? '🧾 Ghi nhận Hóa đơn mua hàng (Nguồn vào) mới' : '⚙️ Sửa thông tin hóa đơn mua hàng'}
        width="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã hóa đơn mua *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, invoiceCode: `INV-PUR-${Date.now().toString().slice(-4)}` })}
                    className="text-[10px] text-emerald-600 hover:underline font-bold"
                  >
                    ⚡ Sinh mã
                  </button>
                )}
              </div>
              <input
                type="text"
                value={editingItem.invoiceCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã PO Đơn mua hàng gốc *</label>
              <input
                type="text"
                value={editingItem.poCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, poCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="PO-2026-XXX"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nhà cung cấp xuất hóa đơn *</label>
              <input
                type="text"
                value={editingItem.supplierName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Tên công ty nhà cung cấp..."
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã số thuế NCC</label>
              <input
                type="text"
                value={(editingItem as any).supplierTaxCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, supplierTaxCode: e.target.value } as any)}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="0101234567"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày phát hành hóa đơn *</label>
              <input
                type="date"
                value={editingItem.invoiceDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hạn thanh toán công nợ *</label>
              <input
                type="date"
                value={editingItem.dueDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, dueDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* SECTION BẢNG CHỌN SẢN PHẨM HÓA ĐƠN MUA HÀNG */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                📦 Danh sách mặt hàng mua vào trên hóa đơn ({purItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddPurItem}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mặt hàng
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Sản phẩm / SKU</th>
                    <th className="p-2 w-24 text-center">Số lượng</th>
                    <th className="p-2 w-32 text-right">Đơn giá nhập</th>
                    <th className="p-2 w-24 text-center">VAT %</th>
                    <th className="p-2 w-32 text-right">Thành tiền</th>
                    <th className="p-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {purItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">
                        <select
                          value={item.sku}
                          onChange={(e) => handleUpdatePurItem(item.id, 'sku', e.target.value)}
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
                          onChange={(e) => handleUpdatePurItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-center font-bold"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdatePurItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-right font-mono"
                        />
                      </td>
                      <td className="p-2 text-center font-mono">
                        <input
                          type="number"
                          value={item.vatPercent}
                          onChange={(e) => handleUpdatePurItem(item.id, 'vatPercent', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-center font-mono"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 font-mono">
                        {Math.round((item.quantity || 0) * (item.unitPrice || 0) * (1 + (item.vatPercent || 0)/100)).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePurItem(item.id)}
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tiền hàng trước thuế (Subtotal)</label>
              <input
                type="number"
                value={editingItem.subTotal || 0}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-gray-100 dark:bg-gray-800 font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tổng thuế VAT (VND)</label>
              <input
                type="number"
                value={editingItem.vatAmount || 0}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-gray-100 dark:bg-gray-800 font-bold text-blue-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tổng tiền hóa đơn thanh toán</label>
              <input
                type="number"
                value={editingItem.totalAmount || 0}
                readOnly
                className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 font-bold text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái thanh toán công nợ</label>
            <select
              value={editingItem.status || 'CHO_THANH_TOAN'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="CHO_THANH_TOAN">⏳ Chờ thanh toán NCC</option>
              <option value="DA_THANH_TOAN">🟢 Đã thanh toán xong</option>
              <option value="DA_HUY">🔴 Đã hủy hóa đơn</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú & Số hóa đơn VAT điện tử gốc</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Số hóa đơn điện tử CQT, mẫu số, ký hiệu..."
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
              Lưu hóa đơn
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
