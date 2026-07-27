import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Receipt, Printer } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import { PrintInvoiceModal, type PrintInvoiceData } from '@/shared/components/ui/PrintInvoiceModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, resolveCustomerName } from '@/features/sales/store/salesStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface SalesInvoiceRecord {
  id: string;
  invoiceCode: string;
  orderCode: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  discount: number;
  totalAmount: number;
  status: 'CHO_THANH_TOAN' | 'DA_THANH_TOAN' | 'DA_HUY';
  notes?: string;
}

export function SalesInvoicesPage() {
  const { exportInvoices, fetchExportInvoices, addExportInvoice, updateExportInvoice, deleteExportInvoice } = useSalesStore();
  const { products, fetchProducts } = useInventoryStore();
  const { customers, fetchCustomers } = useCrmStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SalesInvoiceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SalesInvoiceRecord>>({});
  const [printData, setPrintData] = useState<PrintInvoiceData | null>(null);

  // Product Line Items for Invoice Form
  const [invoiceItems, setInvoiceItems] = useState<{
    id: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>([
    { id: '1', sku: 'SKU-COFFEE-01', productName: 'Cà Phê Arabica Rang Xay 250g', quantity: 2, unitPrice: 125000, discount: 0 }
  ]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchExportInvoices(), fetchProducts()]);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách hóa đơn bán');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchExportInvoices, fetchProducts]);

  const updateInvoiceItemsAndTotals = (newItems: typeof invoiceItems, overallDiscount = editingItem.discount || 0) => {
    setInvoiceItems(newItems);
    const subTotal = newItems.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0) - (Number(item.discount) || 0)), 0);
    const totalAmount = Math.max(0, subTotal - overallDiscount);
    setEditingItem(prev => ({
      ...prev,
      subTotal,
      discount: overallDiscount,
      totalAmount
    }));
  };

  const handleAddInvoiceItem = () => {
    const p = products[0];
    const newItem = {
      id: Date.now().toString(),
      sku: p?.sku || 'SKU-NEW',
      productName: p?.name || 'Sản phẩm mới',
      quantity: 1,
      unitPrice: p?.price || 100000,
      discount: 0
    };
    updateInvoiceItemsAndTotals([...invoiceItems, newItem]);
  };

  const handleRemoveInvoiceItem = (id: string) => {
    updateInvoiceItemsAndTotals(invoiceItems.filter(i => i.id !== id));
  };

  const handleUpdateInvoiceItem = (id: string, field: string, value: any) => {
    const updated = invoiceItems.map(item => {
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
    updateInvoiceItemsAndTotals(updated);
  };

  const data = useMemo<SalesInvoiceRecord[]>(() => {
    return exportInvoices.map((inv: any) => {
      const code = inv.invoiceNumber || inv.invoiceCode || inv.code || `INV-2026-${String(inv.id).padStart(4, '0')}`;
      const orderCode = inv.orderIds?.[0] || inv.orderCode || inv.orderId || `SO-2026-${String(inv.id).padStart(4, '0')}`;
      const name = resolveCustomerName(inv.customerId || inv.customerName, customers, inv.customerName);
      const invoiceDate = inv.issueDate ? inv.issueDate.substring(0, 10) : (inv.createdDate ? inv.createdDate.substring(0, 10) : new Date().toISOString().substring(0, 10));
      const dueDate = inv.dueDate ? inv.dueDate.substring(0, 10) : invoiceDate;
      const subTotal = Number(inv.subtotal ?? inv.subTotal ?? inv.totalAmount ?? 0);
      const totalAmount = Number(inv.totalAmount ?? inv.subtotal ?? 0);
      const status = inv.status === 'PAID' || inv.status === 'DA_THANH_TOAN' ? 'DA_THANH_TOAN' : inv.status === 'CANCELLED' || inv.status === 'DA_HUY' ? 'DA_HUY' : 'CHO_THANH_TOAN';

      return {
        id: String(inv.id),
        invoiceCode: code,
        orderCode: orderCode,
        customerName: name,
        invoiceDate: invoiceDate,
        dueDate: dueDate,
        subTotal: subTotal,
        discount: Number(inv.discount || 0),
        totalAmount: totalAmount,
        status: status,
        notes: inv.notes || '',
      };
    });
  }, [exportInvoices, customers]);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.invoiceCode.toLowerCase().includes(q) ||
        d.orderCode.toLowerCase().includes(q) ||
        d.customerName.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      invoiceCode: `INV-2026-${Date.now().toString().slice(-4)}`,
      orderCode: '',
      customerName: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      subTotal: 0,
      discount: 0,
      totalAmount: 0,
      status: 'CHO_THANH_TOAN',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SalesInvoiceRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.orderCode || !editingItem.customerName) return;

    try {
      const sub = Number(editingItem.subTotal || 0);
      const disc = Number(editingItem.discount || 0);
      const tot = sub - disc;

      const payload = {
        invoiceNumber: editingItem.invoiceCode,
        customerId: editingItem.customerName,
        taxId: 'VAT10',
        billingAddress: 'Hà Nội, Việt Nam',
        orderIds: [editingItem.orderCode],
        issueDate: editingItem.invoiceDate || new Date().toISOString().split('T')[0],
        dueDate: editingItem.dueDate || new Date().toISOString().split('T')[0],
        subtotal: sub,
        vatAmount: sub * 0.1,
        totalAmount: tot,
        status: (editingItem.status === 'DA_THANH_TOAN' ? 'PAID' : editingItem.status === 'DA_HUY' ? 'CANCELLED' : 'ISSUED') as any,
        paymentTerms: 'COD',
        notes: editingItem.notes || '',
        invoiceItems: invoiceItems.map(i => ({
          id: i.id,
          sku: i.sku,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
          lineTotal: (i.quantity * i.unitPrice) - i.discount
        }))
      };

      if (modalMode === 'create') {
        await addExportInvoice(payload);
        toast.success('Tạo hóa đơn thành công!');
      } else {
        await updateExportInvoice(editingItem.id!, payload);
        toast.success('Cập nhật hóa đơn thành công!');
      }
      setIsModalOpen(false);
      fetchExportInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu hóa đơn.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
      try {
        await deleteExportInvoice(id);
        toast.success('Đã xóa hóa đơn thành công!');
        fetchExportInvoices();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi xóa hóa đơn.');
      }
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const handlePrintInvoice = (record: SalesInvoiceRecord) => {
    setPrintData({
      documentTitle: 'HÓA ĐƠN BÁN LẺ VAT',
      code: record.invoiceCode,
      date: record.invoiceDate,
      dueDate: record.dueDate,
      customerOrSupplierName: record.customerName,
      branchName: 'Chi nhánh Quận 1 (Flagship Store)',
      createdByName: 'Nhân viên thu ngân / Sales',
      notes: record.notes || 'Hóa đơn khởi tạo từ hệ thống bán lẻ RetailHub ERP.',
      items: invoiceItems.map(i => ({
        sku: i.sku,
        name: i.productName,
        quantity: i.quantity,
        price: i.unitPrice,
        discount: i.discount,
        total: (i.quantity * i.unitPrice) - i.discount
      })),
      subTotal: record.subTotal || record.totalAmount,
      discountAmount: record.discount || 0,
      totalAmount: record.totalAmount,
      statusLabel: record.status === 'DA_THANH_TOAN' ? 'Đã thanh toán' : record.status === 'CHO_THANH_TOAN' ? 'Chờ thanh toán' : 'Đã hủy'
    });
  };

  const columns = useMemo<ColumnDef<SalesInvoiceRecord>[]>(
    () => [
      {
        accessorKey: 'invoiceCode',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn SO',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Tên khách hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Ngày hóa đơn',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Thành tiền',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{formatCurrency(info.getValue() as number)}</span>,
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
              onClick={() => handlePrintInvoice(row.original)}
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hóa đơn bán hàng (đầu ra)</h1>
          <p className="text-sm text-gray-500">
            Quản lý và xuất hóa đơn bán hàng cho khách hàng, hỗ trợ in hóa đơn, ghi nhận doanh thu và báo cáo VAT.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Lập Hóa Đơn Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã hóa đơn, mã đơn hàng, tên khách hàng..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-bold text-gray-500">Đang tải danh sách hóa đơn...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      <Drawer
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Hóa Đơn Bán: ${selected?.invoiceCode}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã hóa đơn:</span>
                <p className="font-mono font-semibold">{selected.invoiceCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã đơn hàng (SO):</span>
                <p className="font-mono font-semibold">{selected.orderCode}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Khách hàng:</span>
              <p className="font-semibold">{selected.customerName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Ngày hóa đơn:</span>
                <p className="font-mono">{selected.invoiceDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Hạn thanh toán:</span>
                <p className="font-mono">{selected.dueDate}</p>
              </div>
            </div>
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Thành tiền hàng:</span>
                <span className="font-mono">{formatCurrency(selected.subTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Chiết khấu/Giảm giá:</span>
                <span className="font-mono text-red-500">-{formatCurrency(selected.discount)}</span>
              </div>
              <div className="flex justify-between border-t pt-1 font-bold">
                <span>Tổng phải trả:</span>
                <span className="font-mono text-emerald-600">{formatCurrency(selected.totalAmount)}</span>
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
      </Drawer>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '🧾 Lập hóa đơn bán lẻ mới' : '⚙️ Sửa thông tin hóa đơn bán lẻ'}
        width="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Mã hóa đơn *</label>
                {modalMode === 'create' && (
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, invoiceCode: `INV-2026-${Date.now().toString().slice(-4)}` })}
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
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mã đơn bán SO liên kết *</label>
              <input
                type="text"
                value={editingItem.orderCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, orderCode: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="SO-2026-XXX"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tên khách hàng *</label>
              <input
                type="text"
                value={editingItem.customerName || ''}
                onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                placeholder="Khách mua lẻ / Tên công ty..."
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Trạng thái thanh toán *</label>
              <select
                value={editingItem.status || 'CHO_THANH_TOAN'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="CHO_THANH_TOAN">⏳ Chờ thanh toán</option>
                <option value="DA_THANH_TOAN">✅ Đã thanh toán</option>
                <option value="DA_HUY">❌ Đã hủy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ngày lập hóa đơn *</label>
              <input
                type="date"
                value={editingItem.invoiceDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, invoiceDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hạn thanh toán *</label>
              <input
                type="date"
                value={editingItem.dueDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, dueDate: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* SECTION BẢNG CHỌN SẢN PHẨM HÓA ĐƠN */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                📦 Danh sách sản phẩm trên hóa đơn ({invoiceItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddInvoiceItem}
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
                    <th className="p-2 w-32 text-right">Đơn giá bán</th>
                    <th className="p-2 w-28 text-right">Giảm giá dòng</th>
                    <th className="p-2 w-32 text-right">Thành tiền</th>
                    <th className="p-2 w-10 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {invoiceItems.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">
                        <select
                          value={item.sku}
                          onChange={(e) => handleUpdateInvoiceItem(item.id, 'sku', e.target.value)}
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
                          onChange={(e) => handleUpdateInvoiceItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-center font-bold"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateInvoiceItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-right font-mono"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleUpdateInvoiceItem(item.id, 'discount', parseInt(e.target.value) || 0)}
                          className="w-full p-1 border rounded text-right font-mono text-red-500"
                        />
                      </td>
                      <td className="p-2 text-right font-bold text-emerald-600 font-mono">
                        {((item.quantity || 0) * (item.unitPrice || 0) - (item.discount || 0)).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveInvoiceItem(item.id)}
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
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tiền hàng (Subtotal tự động)</label>
              <input
                type="number"
                value={editingItem.subTotal || 0}
                readOnly
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-gray-100 dark:bg-gray-800 font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Chiết khấu tổng đơn (VND)</label>
              <input
                type="number"
                value={editingItem.discount || 0}
                onChange={(e) => {
                  const disc = Number(e.target.value) || 0;
                  updateInvoiceItemsAndTotals(invoiceItems, disc);
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tổng phải trả (Thực thu)</label>
              <input
                type="number"
                value={editingItem.totalAmount || Math.max(0, (editingItem.subTotal || 0) - (editingItem.discount || 0))}
                readOnly
                className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded font-mono bg-emerald-50 dark:bg-emerald-950/40 font-bold text-emerald-600 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ghi chú hóa đơn</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              rows={2}
              placeholder="Ghi chú hình thức thanh toán, hóa đơn VAT điện tử..."
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
