import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Receipt, Printer, ArrowUpRight, ArrowDownLeft, Percent, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import { PrintInvoiceModal, type PrintInvoiceData } from '@/shared/components/ui/PrintInvoiceModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { usePurchaseStore } from '@/features/purchase/store/purchaseStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';
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
  paidAmount: number;
  remainingDebt: number;
  status: 'CHO_THANH_TOAN' | 'DA_THANH_TOAN' | 'PARTIAL_PAID' | 'DA_HUY' | string;
  notes?: string;
}

export function PurchaseInvoicesPage() {
  const { products, fetchProducts } = useInventoryStore();
  const { purchaseOrders, fetchPurchaseOrders, suppliers, fetchSuppliers } = usePurchaseStore();
  const { branches, fetchBranches } = useBranchStore();
  const [data, setData] = useState<PurchaseInvoiceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
  }[]>([]);

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
      const res = await axiosClient.get('/purchase/invoices');
      const list = extractPageContent<any>(res);
      const mapped: PurchaseInvoiceRecord[] = list.map((item: any) => {
        const tot = Number(item.totalAmount || item.totalCost || 0);
        const vat = Number(item.vatAmount || item.taxAmount || 0);
        const sub = Number(item.subTotal || item.subtotal || tot - vat);
        let paid = item.paidAmount !== undefined && item.paidAmount !== null ? Number(item.paidAmount) : undefined;
        let remaining = item.remainingDebt !== undefined && item.remainingDebt !== null ? Number(item.remainingDebt) : undefined;

        if (paid === undefined) {
          if (item.status === 'DA_THANH_TOAN' || item.status === 'PAID') {
            paid = tot;
            remaining = 0;
          } else {
            paid = 0;
            remaining = tot;
          }
        }
        if (remaining === undefined) {
          remaining = Math.max(0, tot - (paid || 0));
        }

        let st = item.status || 'CHO_THANH_TOAN';
        if (paid > 0 && remaining > 0 && st !== 'DA_THANH_TOAN' && st !== 'DA_HUY') {
          st = 'PARTIAL_PAID';
        }

        return {
          id: String(item.id),
          invoiceCode: item.invoiceCode || `INV-MH-${item.id}`,
          poCode: item.poCode || item.poNumber || `PO-${item.poId || item.id}`,
          supplierName: item.supplierName || item.supplier?.name || '',
          invoiceDate: item.invoiceDate ? String(item.invoiceDate).split('T')[0] : '',
          dueDate: item.dueDate ? String(item.dueDate).split('T')[0] : '',
          subTotal: sub,
          vatAmount: vat,
          totalAmount: tot,
          paidAmount: paid,
          remainingDebt: remaining,
          status: st,
          notes: item.note || '',
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
    fetchSuppliers();
    fetchBranches();
  }, [fetchInvoices, fetchProducts, fetchSuppliers, fetchBranches]);

  const stats = useMemo(() => {
    let totalInvoiceAmount = 0;
    let totalPaidAmount = 0;
    let totalRemainingDebt = 0;
    let partialCount = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    data.forEach((inv) => {
      if (inv.status === 'DA_HUY') return;
      totalInvoiceAmount += inv.totalAmount;
      totalPaidAmount += inv.paidAmount;
      totalRemainingDebt += inv.remainingDebt;

      if (inv.remainingDebt === 0 || inv.status === 'DA_THANH_TOAN') {
        paidCount += 1;
      } else if (inv.paidAmount > 0 && inv.remainingDebt > 0) {
        partialCount += 1;
      } else {
        unpaidCount += 1;
      }
    });

    return {
      totalInvoiceAmount,
      totalPaidAmount,
      totalRemainingDebt,
      partialCount,
      unpaidCount,
      paidCount,
    };
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((d) => {
      const matchSearch =
        !q ||
        d.invoiceCode.toLowerCase().includes(q) ||
        d.poCode.toLowerCase().includes(q) ||
        d.supplierName.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (statusFilter === 'DA_THANH_TOAN') return d.remainingDebt === 0 || d.status === 'DA_THANH_TOAN';
      if (statusFilter === 'PARTIAL_PAID') return d.paidAmount > 0 && d.remainingDebt > 0;
      if (statusFilter === 'CHO_THANH_TOAN') return d.paidAmount === 0 && d.status !== 'DA_HUY';
      if (statusFilter === 'DA_HUY') return d.status === 'DA_HUY';
      return true;
    });
  }, [search, statusFilter, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      invoiceCode: `INV-PUR-2026-${Date.now().toString().slice(-3)}`,
      poCode: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: suppliers[0]?.supplierName || '',
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
    if ((item as any).items && Array.isArray((item as any).items)) {
      setPurItems((item as any).items);
    } else {
      setPurItems([]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.invoiceCode || !editingItem.poCode || !editingItem.supplierName) {
      toast.error('Vui lòng nhập đầy đủ Mã hóa đơn, Mã đơn PO và Nhà cung cấp!');
      return;
    }

    const matchedSupplier = suppliers.find(
      (s) => s.supplierName.toLowerCase() === (editingItem.supplierName || '').toLowerCase() || String(s.id) === String(editingItem.supplierName)
    );
    const supplierId = matchedSupplier ? Number(matchedSupplier.id) : (suppliers[0] ? Number(suppliers[0].id) : 1);
    const branchId = branches[0] ? Number(branches[0].id) : 1;

    const orderDate = editingItem.invoiceDate
      ? (editingItem.invoiceDate.includes('T') ? editingItem.invoiceDate : `${editingItem.invoiceDate}T00:00:00`)
      : new Date().toISOString().substring(0, 19);

    const estDeliveryDate = editingItem.dueDate
      ? (editingItem.dueDate.includes('T') ? editingItem.dueDate : `${editingItem.dueDate}T00:00:00`)
      : orderDate;

    const payload = {
      invoiceCode: editingItem.invoiceCode,
      poCode: editingItem.poCode,
      supplierId,
      branchId,
      invoiceDate: orderDate,
      dueDate: estDeliveryDate,
      subTotal: Number(editingItem.subTotal || 0),
      vatAmount: Number(editingItem.vatAmount || 0),
      totalAmount: Number(editingItem.totalAmount || 0),
      status: editingItem.status || 'CHO_THANH_TOAN',
      note: editingItem.notes || '',
      items: purItems.map((i) => ({
        productVariantId: (i as any).productVariantId || (i as any).productId,
        productId: (i as any).productId || (i as any).productVariantId,
        productName: i.productName,
        sku: i.sku,
        unitName: (i as any).unitName || 'Cái',
        quantity: Number(i.quantity) || 1,
        unitPrice: Number(i.unitPrice) || 0,
        vatRate: Number((i as any).vatRate) || 0,
        vatAmount: Number((i as any).vatAmount) || 0,
        totalAmount: Number(i.quantity * i.unitPrice) || 0,
      })),
    };

    try {
      if (modalMode === 'create') {
        await axiosClient.post('/purchase/invoices', payload);
        toast.success('Tạo hóa đơn mua hàng thành công');
      } else {
        await axiosClient.put(`/purchase/invoices/${editingItem.id}`, payload);
        toast.success('Cập nhật hóa đơn mua hàng thành công');
      }
      setIsModalOpen(false);
      await fetchInvoices();
    } catch (err: any) {
      console.error(err);
      toast.error('Lưu hóa đơn thất bại: ' + (err?.response?.data?.message || err?.message || 'Lỗi dữ liệu'));
    }
  };

  const [deletingItem, setDeletingItem] = useState<PurchaseInvoiceRecord | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await axiosClient.delete(`/purchase/invoices/${deletingItem.id}`);
      toast.success(`Đã xóa hóa đơn mua hàng ${deletingItem.invoiceCode}`);
      setDeletingItem(null);
      await fetchInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Xóa hóa đơn thất bại');
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
      statusLabel: record.remainingDebt === 0 ? 'Đã thanh toán' : record.paidAmount > 0 ? `Đã trả: ${formatCurrency(record.paidAmount)} - Còn nợ: ${formatCurrency(record.remainingDebt)}` : 'Chờ thanh toán'
    });
  };

  const columns = useMemo<ColumnDef<PurchaseInvoiceRecord>[]>(
    () => [
      {
        accessorKey: 'invoiceCode',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'poCode',
        header: 'Mã PO',
        cell: (info) => <span className="font-mono text-blue-600 dark:text-blue-400 text-xs font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'invoiceDate',
        header: 'Ngày lập',
        cell: (info) => <span className="font-mono text-xs text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng tiền',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'paidAmount',
        header: 'Đã thanh toán',
        cell: (info) => {
          const val = (info.getValue() as number) || 0;
          return (
            <span className={`font-mono font-semibold ${val > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
              {val > 0 ? formatCurrency(val) : '0 ₫'}
            </span>
          );
        },
      },
      {
        id: 'progress',
        header: 'Tiến độ TT',
        cell: ({ row }) => {
          const tot = row.original.totalAmount || 0;
          const paid = row.original.paidAmount || 0;
          const pct = tot > 0 ? Math.min(100, Math.round((paid / tot) * 100)) : (row.original.remainingDebt === 0 ? 100 : 0);
          return (
            <div className="w-24">
              <div className="flex justify-between text-[11px] font-mono mb-1 text-gray-500">
                <span>{pct}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    pct >= 100 ? 'bg-emerald-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'remainingDebt',
        header: 'Còn nợ lại',
        cell: (info) => {
          const val = (info.getValue() as number) || 0;
          return (
            <span className={`font-mono font-bold ${val > 0 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
              {val > 0 ? formatCurrency(val) : '0 ₫'}
            </span>
          );
        },
      },
      {
        accessorKey: 'dueDate',
        header: 'Hạn TT',
        cell: (info) => {
          const dateStr = info.getValue() as string;
          if (!dateStr) return <span className="text-gray-400">-</span>;
          const today = new Date().toISOString().substring(0, 10);
          const isOverdue = dateStr < today;
          return (
            <span className={`text-xs font-mono ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500'}`}>
              {dateStr}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const st = row.original.status;
          const rem = row.original.remainingDebt;
          const paid = row.original.paidAmount;
          const tot = row.original.totalAmount;
          const pct = tot > 0 ? Math.round((paid / tot) * 100) : 0;

          if (st === 'DA_HUY') {
            return <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Đã hủy</span>;
          }
          if (rem === 0 || st === 'DA_THANH_TOAN') {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                <CheckCircle2 className="w-3 h-3" /> Đã thanh toán
              </span>
            );
          }
          if (paid > 0 && rem > 0) {
            return (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                <Percent className="w-3 h-3" /> Trả 1 phần ({pct}%)
              </span>
            );
          }
          return (
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              Chờ thanh toán
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
              onClick={() => setDeletingItem(row.original)}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
              title="Xóa"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hóa đơn mua hàng (nguồn vào)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý hóa đơn VAT đầu vào từ các nhà cung cấp, đối chiếu số tiền đã thanh toán và công nợ còn lại.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SecondaryButton
            onClick={() => {
              fetchInvoices();
              toast.success('Đã cập nhật lại danh sách hóa đơn!');
            }}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Làm mới
          </SecondaryButton>
          <CreateButton onClick={handleOpenCreate}>
            Nhận hóa đơn mới
          </CreateButton>
        </div>
      </div>

      {/* 4 Thẻ KPI Thống kê Hóa đơn Mua */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Tổng tiền hóa đơn mua</p>
            <p className="text-lg font-bold font-mono text-gray-900 dark:text-white">
              {formatCurrency(stats.totalInvoiceAmount)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đã thanh toán NCC</p>
            <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalPaidAmount)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Còn nợ lại NCC</p>
            <p className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
              {formatCurrency(stats.totalRemainingDebt)}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đang trả một phần ({stats.partialCount} HĐ)</p>
            <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              {formatCurrency(stats.totalRemainingDebt > 0 ? stats.totalRemainingDebt : 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Thanh lọc Tab & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'ALL', label: 'Tất cả', count: data.length },
            { key: 'DA_THANH_TOAN', label: 'Đã thanh toán', count: stats.paidCount },
            { key: 'PARTIAL_PAID', label: 'Trả một phần', count: stats.partialCount },
            { key: 'CHO_THANH_TOAN', label: 'Chờ thanh toán', count: stats.unpaidCount },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === tab.key ? 'bg-emerald-700 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

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

      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa hóa đơn mua hàng"
        description={`Bạn có chắc chắn muốn xóa hóa đơn "${deletingItem?.invoiceCode}" của nhà cung cấp "${deletingItem?.supplierName}" không?`}
      />
    </div>
  );
}
