import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, Calendar, CheckCircle2, CheckCircle, Send, Building2, FileText, Edit, Trash2, RotateCcw, AlertTriangle, Check, Wallet, CreditCard } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type ExportInvoiceItem, formatMoney } from '../store/salesStore';
import { resolveCustomerName, paymentTermsToDueDate } from '../store/salesHelpers';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { CustomerSelect } from '@/shared/components/sales/CustomerSelect';
import { usePermission } from '@/shared/hooks/usePermission';
import { useBranchStore } from '@/features/system/store/branchStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

export function isValidVietnameseTaxId(taxId?: string | null): boolean {
  if (!taxId || taxId.trim() === '' || taxId === '—') return true;
  const clean = taxId.trim();
  return /^\d{10}$/.test(clean) || /^\d{10}-\d{3}$/.test(clean) || /^\d{13}$/.test(clean);
}

export function ExportInvoicesPage() {
  const canManage = usePermission('sales:invoices:manage');
  const customers = useCrmStore((s) => s.customers);
  const currentBranch = useBranchStore((s) => s.currentBranch);
  const { exportInvoices, addExportInvoice, updateExportInvoice, deleteExportInvoice, fetchExportInvoices } = useSalesStore();
  const { products, fetchProducts } = useInventoryStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchExportInvoices(), fetchProducts()]);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách hóa đơn xuất');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchExportInvoices, fetchProducts]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ISSUED' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<ExportInvoiceItem | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Partial<ExportInvoiceItem>>({});
  const [deleting, setDeleting] = useState<ExportInvoiceItem | null>(null);

  // Helper to get default taxRate from product or category
  const getProductTaxRate = (prod?: ProductInventory): number => {
    if (!prod) return 0.08;
    if (prod.vatRate !== undefined) return Number(prod.vatRate);
    const tc = prod.taxClass;
    if (tc === 'VAT_0' || tc === 'EXEMPT') return 0;
    if (tc === 'VAT_5') return 0.05;
    if (tc === 'VAT_8') return 0.08;
    if (tc === 'VAT_10') return 0.10;
    const cat = categories.find(c => c.categoryName === prod.category || (prod.categoryId && String(c.id) === String(prod.categoryId)));
    if (cat?.taxClass === 'VAT_0' || cat?.taxClass === 'EXEMPT') return 0;
    if (cat?.taxClass === 'VAT_5') return 0.05;
    if (cat?.taxClass === 'VAT_8') return 0.08;
    if (cat?.taxClass === 'VAT_10') return 0.10;
    return 0.08;
  };

  // Line items state
  const [invoiceItems, setInvoiceItems] = useState<{
    id: string;
    productId: number;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
  }[]>([]);

  const recalculateTotals = (items: typeof invoiceItems) => {
    const sub = items.reduce((sum, it) => sum + ((it.quantity || 0) * (it.unitPrice || 0) - (it.discount || 0)), 0);
    const vat = items.reduce((sum, it) => {
      const lineSub = Math.max(0, (it.quantity || 0) * (it.unitPrice || 0) - (it.discount || 0));
      const rate = it.taxRate !== undefined ? it.taxRate : 0.08;
      return sum + Math.round(lineSub * rate);
    }, 0);
    setEditing(prev => ({
      ...prev,
      subtotal: sub,
      subTotal: sub,
      vatAmount: vat,
      taxAmount: vat,
      totalAmount: sub + vat,
    }));
  };

  const handleAddInvoiceItem = () => {
    const p = products[0];
    const initialRate = getProductTaxRate(p);
    const lineSub = Math.max(0, 1 * (p?.price || 100000) - 0);
    const newItem = {
      id: Date.now().toString(),
      productId: p ? Number(p.id) : 1,
      sku: p?.sku || 'SKU-001',
      productName: p?.name || 'Sản phẩm mới',
      quantity: 1,
      unitPrice: p?.price || 100000,
      discount: 0,
      taxRate: initialRate,
      taxAmount: Math.round(lineSub * initialRate),
    };
    const updated = [...invoiceItems, newItem];
    setInvoiceItems(updated);
    recalculateTotals(updated);
  };

  const handleRemoveInvoiceItem = (id: string) => {
    const updated = invoiceItems.filter(i => i.id !== id);
    setInvoiceItems(updated);
    recalculateTotals(updated);
  };

  const handleUpdateInvoiceItem = (id: string, field: string, value: any) => {
    const updated = invoiceItems.map(item => {
      if (item.id !== id) return item;
      let updatedItem = { ...item, [field]: value };
      if (field === 'sku') {
        const p = products.find(prod => prod.sku === value);
        const rate = getProductTaxRate(p);
        updatedItem = {
          ...updatedItem,
          sku: value,
          productId: p ? Number(p.id) : item.productId,
          productName: p?.name || item.productName,
          unitPrice: p?.price || item.unitPrice,
          taxRate: rate,
        };
      }
      const lineSub = Math.max(0, (updatedItem.quantity || 0) * (updatedItem.unitPrice || 0) - (updatedItem.discount || 0));
      const rate = updatedItem.taxRate !== undefined ? updatedItem.taxRate : 0.08;
      updatedItem.taxAmount = Math.round(lineSub * rate);
      return updatedItem;
    });
    setInvoiceItems(updated);
    recalculateTotals(updated);
  };

  const stats = useMemo(() => {
    let totalInvoiceAmount = 0;
    let totalPaidAmount = 0;
    let totalRemainingDebt = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    exportInvoices.forEach((inv) => {
      const total = inv.totalAmount || 0;
      const paid = typeof inv.paidAmount === 'number' ? inv.paidAmount : (inv.status === 'PAID' ? total : 0);
      const remaining = typeof inv.remainingDebt === 'number' ? inv.remainingDebt : Math.max(0, total - paid);

      totalInvoiceAmount += total;
      totalPaidAmount += paid;
      totalRemainingDebt += remaining;

      if (inv.status === 'PARTIAL_PAID' || (paid > 0 && remaining > 0)) {
        partialCount++;
      }
      if (remaining > 0 && inv.status !== 'CANCELLED') {
        unpaidCount++;
      }
    });

    return { totalInvoiceAmount, totalPaidAmount, totalRemainingDebt, partialCount, unpaidCount };
  }, [exportInvoices]);

  const counts = useMemo(() => {
    return {
      all: exportInvoices.length,
      issued: exportInvoices.filter((i) => i.status === 'ISSUED').length,
      paid: exportInvoices.filter((i) => i.status === 'PAID').length,
      partial: exportInvoices.filter((i) => i.status === 'PARTIAL_PAID' || ((i.paidAmount || 0) > 0 && (i.remainingDebt || 0) > 0)).length,
      overdue: exportInvoices.filter((i) => i.status === 'OVERDUE').length,
      cancelled: exportInvoices.filter((i) => i.status === 'CANCELLED').length,
    };
  }, [exportInvoices]);

  const filtered = useMemo(() => {
    return exportInvoices.filter((item) => {
      const q = search.trim().toLowerCase();
      if (q) {
        const custName = resolveCustomerName(item.customerId, customers).toLowerCase();
        const invNum = (item.invoiceNumber || '').toLowerCase();
        const taxId = (item.taxId || '').toLowerCase();
        if (!custName.includes(q) && !invNum.includes(q) && !taxId.includes(q)) {
          return false;
        }
      }

      if (statusFilter === 'PARTIAL') {
        const paid = item.paidAmount || 0;
        const rem = item.remainingDebt ?? (item.totalAmount - paid);
        if (item.status !== 'PARTIAL_PAID' && !(paid > 0 && rem > 0)) {
          return false;
        }
      } else if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      const itemDate = (item.issueDate || '').substring(0, 10);
      if (startDate && itemDate && itemDate < startDate) {
        return false;
      }
      if (endDate && itemDate && itemDate > endDate) {
        return false;
      }

      return true;
    });
  }, [exportInvoices, search, statusFilter, startDate, endDate, customers]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const p = products[0];
    const initialRate = getProductTaxRate(p);
    const lineSub = p ? (p.price || 100000) : 100000;
    const initialItems = p ? [{
      id: '1',
      productId: Number(p.id),
      sku: p.sku || 'SKU-001',
      productName: p.name || 'Sản phẩm mẫu',
      quantity: 1,
      unitPrice: p.price || 100000,
      discount: 0,
      taxRate: initialRate,
      taxAmount: Math.round(lineSub * initialRate),
    }] : [];
    setInvoiceItems(initialItems);
    const sub = initialItems.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
    const vat = initialItems.reduce((acc, it) => acc + (it.taxAmount || 0), 0);
    setEditing({
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      customerId: '',
      taxId: '',
      billingAddress: '',
      orderIds: [],
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: paymentTermsToDueDate(new Date().toISOString().split('T')[0], 'Net 30'),
      subtotal: sub,
      vatAmount: vat,
      totalAmount: sub + vat,
      status: 'ISSUED',
      paymentTerms: 'Net 30',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: ExportInvoiceItem) => {
    setModalMode('edit');
    setEditing(inv);
    const rawItems = (inv as any)?.items || (inv as any)?.invoiceItems || [];
    if (rawItems.length > 0) {
      setInvoiceItems(rawItems.map((it: any, idx: number) => {
        const prod = products.find(p => String(p.id) === String(it.productId) || p.sku === it.sku);
        const rate = it.taxRate !== undefined ? Number(it.taxRate) : getProductTaxRate(prod);
        const lineSub = Math.max(0, Number(it.quantity || 1) * Number(it.unitPrice || it.price || 0) - Number(it.discount || 0));
        return {
          id: String(it.id || idx + 1),
          productId: Number(it.productId || it.id || 1),
          sku: it.sku || `SKU-${idx + 1}`,
          productName: it.productName || it.name || 'Sản phẩm',
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.unitPrice || it.price || 0),
          discount: Number(it.discount || 0),
          taxRate: rate,
          taxAmount: it.taxAmount !== undefined ? Number(it.taxAmount) : Math.round(lineSub * rate),
        };
      }));
    } else {
      const p = products[0];
      const rate = getProductTaxRate(p);
      const lineSub = inv.subtotal || inv.totalAmount || 100000;
      setInvoiceItems([{
        id: '1',
        productId: p ? Number(p.id) : 1,
        sku: p?.sku || 'SKU-001',
        productName: 'Chi tiết sản phẩm / dịch vụ',
        quantity: 1,
        unitPrice: lineSub,
        discount: 0,
        taxRate: rate,
        taxAmount: Math.round(lineSub * rate),
      }]);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.invoiceNumber || !editing.customerId) return;
    if (editing.taxId && editing.taxId.trim() !== '' && editing.taxId !== '—' && !isValidVietnameseTaxId(editing.taxId)) {
      toast.error('Mã số thuế không đúng định dạng. Cần 10 chữ số (doanh nghiệp) hoặc 13 chữ số (VD: 0101234567-001)!');
      return;
    }
    const subtotal = Number(editing.subtotal) || 0;
    const vat = Number(editing.vatAmount) || 0;
    const total = Number(editing.totalAmount) || subtotal + vat;
    const issueDate = editing.issueDate || new Date().toISOString().split('T')[0];
    const paymentTerms = editing.paymentTerms || 'Net 30';
    const dueDate = editing.dueDate || paymentTermsToDueDate(issueDate, paymentTerms);

    const mappedItems = invoiceItems.map(it => ({
      productId: Number(it.productId || 1),
      sku: it.sku,
      productName: it.productName,
      quantity: Number(it.quantity || 1),
      unitPrice: Number(it.unitPrice || 0),
      discount: Number(it.discount || 0),
      taxRate: it.taxRate !== undefined ? Number(it.taxRate) : 0.08,
      taxAmount: it.taxAmount !== undefined ? Number(it.taxAmount) : Math.round(((it.quantity || 1) * (it.unitPrice || 0) - (it.discount || 0)) * (it.taxRate ?? 0.08)),
    }));

    try {
      if (modalMode === 'create') {
        await addExportInvoice({
          invoiceNumber: editing.invoiceNumber,
          customerId: editing.customerId,
          branchId: currentBranch?.id || 1,
          taxId: editing.taxId || '—',
          companyName: editing.billingAddress || resolveCustomerName(editing.customerId, customers),
          billingAddress: editing.billingAddress || '—',
          orderIds: editing.orderIds || [],
          issueDate,
          dueDate,
          subtotal,
          vatAmount: vat,
          subTotal: subtotal,
          taxAmount: vat,
          totalAmount: total,
          status: (editing.status as ExportInvoiceItem['status']) || 'ISSUED',
          paymentTerms: (paymentTerms as any),
          notes: editing.notes,
          items: mappedItems as any,
        } as any);
        toast.success('Thêm hóa đơn xuất thành công!');
      } else if (editing.id) {
        await updateExportInvoice(editing.id, {
          ...editing,
          branchId: currentBranch?.id || 1,
          subtotal,
          vatAmount: vat,
          subTotal: subtotal,
          taxAmount: vat,
          companyName: editing.billingAddress || resolveCustomerName(editing.customerId || '', customers),
          totalAmount: total,
          dueDate,
        } as Partial<ExportInvoiceItem>);
        toast.success('Cập nhật hóa đơn xuất thành công!');
      }
      setIsModalOpen(false);
      fetchExportInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu hóa đơn xuất.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      await deleteExportInvoice(deleting.id);
      toast.success('Đã xóa hóa đơn xuất!');
      if (selectedInvoice?.id === deleting.id) setSelectedInvoice(null);
      setDeleting(null);
      fetchExportInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa hóa đơn xuất.');
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedInvoice) return;
    try {
      await updateExportInvoice(selectedInvoice.id, { status: 'PAID' });
      setSelectedInvoice({ ...selectedInvoice, status: 'PAID' });
      toast.success('Đã đánh dấu đã thanh toán!');
      fetchExportInvoices();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật trạng thái thanh toán.');
    }
  };

  const columns = useMemo<ColumnDef<ExportInvoiceItem>[]>(
    () => [
      {
        accessorKey: 'invoiceNumber',
        header: 'Mã hóa đơn',
        cell: (info) => <span className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        id: 'customer',
        header: 'Khách hàng B2B',
        cell: ({ row }) => <span className="font-medium text-gray-900 dark:text-white">{resolveCustomerName(row.original.customerId, customers)}</span>,
      },
      {
        accessorKey: 'taxId',
        header: 'Mã số thuế',
        cell: (info) => <span className="font-mono text-gray-500 text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'issueDate',
        header: 'Ngày phát hành',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalAmount',
        header: 'Tổng tiền (gồm VAT)',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{formatMoney(info.getValue() as number, 'VND')}</span>,
      },
      {
        id: 'paymentProgress',
        header: 'Đã thanh toán',
        cell: ({ row }) => {
          const inv = row.original;
          const total = inv.totalAmount || 0;
          const paid = typeof inv.paidAmount === 'number' ? inv.paidAmount : (inv.status === 'PAID' ? total : 0);
          const percent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : (inv.status === 'PAID' ? 100 : 0);
          return (
            <div className="space-y-1 min-w-[120px]">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">{formatMoney(paid, 'VND')}</span>
                <span className="text-[10px] text-gray-500 font-bold">{percent}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    percent >= 100 ? 'bg-emerald-500' : percent > 0 ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        },
      },
      {
        id: 'remainingDebt',
        header: 'Còn nợ lại',
        cell: ({ row }) => {
          const inv = row.original;
          const total = inv.totalAmount || 0;
          const paid = typeof inv.paidAmount === 'number' ? inv.paidAmount : (inv.status === 'PAID' ? total : 0);
          const remaining = typeof inv.remainingDebt === 'number' ? inv.remainingDebt : Math.max(0, total - paid);
          const hasDebt = remaining > 0 && inv.status !== 'CANCELLED';
          return (
            <span
              className={`font-mono font-bold text-xs ${
                hasDebt ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {formatMoney(remaining, 'VND')}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
          let label = 'Đã phát hành';
          if (status === 'PAID') {
            badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
            label = 'Đã thanh toán';
          } else if (status === 'PARTIAL_PAID') {
            badgeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300';
            label = 'Trả một phần';
          } else if (status === 'OVERDUE') {
            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
            label = 'Quá hạn';
          } else if (status === 'CANCELLED') {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            label = 'Đã hủy';
          }
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
              {label}
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
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedInvoice(row.original);
              }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canManage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(row.original);
                }}
                title="Chỉnh sửa"
                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canManage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleting(row.original);
                }}
                title="Xóa"
                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canManage, customers]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hóa đơn xuất bán (Export Invoices)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý hóa đơn VAT điện tử xuất bán sỉ và doanh nghiệp. Nhấp vào dòng để xem chi tiết.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất Dữ Liệu
            </button>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" /> Thêm hóa đơn
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards: Thống kê xuất bán, Đã thu, Còn nợ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tổng tiền xuất bán</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">{formatMoney(stats.totalInvoiceAmount, 'VND')}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{exportInvoices.length} hóa đơn phát hành</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Đã thu tiền</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatMoney(stats.totalPaidAmount, 'VND')}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {stats.totalInvoiceAmount > 0 ? Math.round((stats.totalPaidAmount / stats.totalInvoiceAmount) * 100) : 0}% tỷ lệ thu hồi
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Còn nợ phải thu</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono">{formatMoney(stats.totalRemainingDebt, 'VND')}</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5">
                {stats.unpaidCount} hóa đơn còn nợ
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Nợ dở dang / 1 phần</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono">{stats.partialCount} HĐ</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Đã thu một phần tiền</p>
            </div>
          </div>
        </div>

        {/* Quick Filter Status Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <span>Tất cả</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'ALL' ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {counts.all}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ISSUED')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'ISSUED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <span>Đã phát hành</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'ISSUED' ? 'bg-blue-700 text-blue-100' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'}`}>
              {counts.issued}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PAID')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'PAID'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <span>Đã thanh toán</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'PAID' ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
              {counts.paid}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PARTIAL')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'PARTIAL'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <span>Trả một phần</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'PARTIAL' ? 'bg-purple-700 text-purple-100' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'}`}>
              {counts.partial}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OVERDUE')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'OVERDUE'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <span>Quá hạn</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'OVERDUE' ? 'bg-amber-700 text-amber-100' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'}`}>
              {counts.overdue}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === 'CANCELLED'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <span>Đã hủy</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'CANCELLED' ? 'bg-red-700 text-red-100' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
              {counts.cancelled}
            </span>
          </button>
        </div>

        {/* Filter Bar with Search and Date Pickers */}
        <div className="flex flex-col lg:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm items-stretch lg:items-center justify-between">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã hóa đơn, tên công ty hoặc MST..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium">Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs font-medium focus:ring-0 text-gray-900 dark:text-white cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="font-medium">Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-0 p-0 text-xs font-medium focus:ring-0 text-gray-900 dark:text-white cursor-pointer"
              />
            </div>

            {(search || statusFilter !== 'ALL' || startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-600 dark:text-gray-300 transition-colors text-xs font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Đặt lại
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải danh sách hóa đơn xuất...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedInvoice(row)} />
        )}
      </div>

      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Chi tiết hóa đơn: ${selectedInvoice.invoiceNumber}` : 'Chi tiết hóa đơn'}
        size="erp"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-blue-800 dark:text-blue-400 font-semibold uppercase tracking-wider">Tổng thanh toán</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{formatMoney(selectedInvoice.totalAmount, 'VND')}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedInvoice.status === 'PAID'
                    ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                    : selectedInvoice.status === 'PARTIAL_PAID'
                      ? 'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100'
                      : selectedInvoice.status === 'ISSUED'
                        ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                        : selectedInvoice.status === 'OVERDUE'
                          ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
                          : 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
                }`}
              >
                {selectedInvoice.status === 'PAID' ? 'Đã thanh toán' : selectedInvoice.status === 'PARTIAL_PAID' ? 'Trả một phần' : selectedInvoice.status === 'ISSUED' ? 'Đã phát hành' : selectedInvoice.status === 'OVERDUE' ? 'Quá hạn' : 'Đã hủy'}
              </span>
            </div>

            {/* Financial Reconciliation Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 uppercase">Tổng giá trị HĐ</p>
                <p className="text-base font-bold font-mono text-gray-900 dark:text-white mt-1">
                  {formatMoney(selectedInvoice.totalAmount, 'VND')}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Đã thanh toán (thu)</p>
                <p className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatMoney(typeof selectedInvoice.paidAmount === 'number' ? selectedInvoice.paidAmount : (selectedInvoice.status === 'PAID' ? selectedInvoice.totalAmount : 0), 'VND')}
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase">Còn nợ phải thu</p>
                <p className="text-base font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                  {formatMoney(typeof selectedInvoice.remainingDebt === 'number' ? selectedInvoice.remainingDebt : Math.max(0, selectedInvoice.totalAmount - (typeof selectedInvoice.paidAmount === 'number' ? selectedInvoice.paidAmount : (selectedInvoice.status === 'PAID' ? selectedInvoice.totalAmount : 0))), 'VND')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Khách B2B
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{resolveCustomerName(selectedInvoice.customerId, customers)}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Ngày & điều khoản
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {selectedInvoice.issueDate} (Due: {selectedInvoice.dueDate})
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Mã số thuế:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedInvoice.taxId}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Địa chỉ xuất HĐ:</span>
                <span className="font-semibold text-gray-900 dark:text-white text-right">{selectedInvoice.billingAddress}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tạm tính:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(selectedInvoice.subtotal, 'VND')}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-gray-500 dark:text-gray-400">Thuế VAT:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatMoney(selectedInvoice.vatAmount, 'VND')}</span>
              </div>
              <div className="flex justify-between items-center text-base font-bold pt-1">
                <span className="text-gray-900 dark:text-white">Tổng cộng:</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(selectedInvoice.totalAmount, 'VND')}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Đã thanh toán (thu):</span>
                <span className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatMoney(typeof selectedInvoice.paidAmount === 'number' ? selectedInvoice.paidAmount : (selectedInvoice.status === 'PAID' ? selectedInvoice.totalAmount : 0), 'VND')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Còn nợ lại:</span>
                <span className="font-semibold font-mono text-amber-600 dark:text-amber-400">
                  {formatMoney(typeof selectedInvoice.remainingDebt === 'number' ? selectedInvoice.remainingDebt : Math.max(0, selectedInvoice.totalAmount - (typeof selectedInvoice.paidAmount === 'number' ? selectedInvoice.paidAmount : (selectedInvoice.status === 'PAID' ? selectedInvoice.totalAmount : 0))), 'VND')}
                </span>
              </div>

              {selectedInvoice.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedInvoice.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {canManage && selectedInvoice.status !== 'PAID' && selectedInvoice.status !== 'CANCELLED' && (
                <button
                  type="button"
                  onClick={handleMarkPaid}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã thanh toán
                </button>
              )}
              <button
                type="button"
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <Send className="w-4 h-4 inline mr-1.5" /> Gửi PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm hóa đơn xuất' : 'Sửa hóa đơn'}
        size="erp"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số hóa đơn *</label>
              <input
                type="text"
                value={editing.invoiceNumber || ''}
                onChange={(e) => setEditing({ ...editing, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono font-bold text-emerald-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày phát hành *</label>
              <input
                type="date"
                value={editing.issueDate || ''}
                onChange={(e) => setEditing({ ...editing, issueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng (CRM) *</label>
            <CustomerSelect
              value={editing.customerId || ''}
              onChange={(customerId) => {
                const found = customers.find(c => String(c.id) === customerId || c.customerCode === customerId);
                setEditing(prev => ({
                  ...prev,
                  customerId,
                  taxId: found?.taxCode || prev.taxId,
                  billingAddress: found?.address || prev.billingAddress,
                }));
              }}
              allowWalkIn={false}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Mã số thuế (Tự động từ khách hàng)
                </label>
                {editing.taxId && editing.taxId !== '—' && (
                  isValidVietnameseTaxId(editing.taxId) ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> MST hợp lệ
                    </span>
                  ) : (
                    <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Sai chuẩn MST
                    </span>
                  )
                )}
              </div>
              <input
                type="text"
                value={editing.taxId || ''}
                onChange={(e) => setEditing({ ...editing, taxId: e.target.value.trim() })}
                placeholder="VD: 0101234567 hoặc 0101234567-001"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-mono font-semibold transition-colors ${
                  editing.taxId && editing.taxId !== '—' && !isValidVietnameseTaxId(editing.taxId)
                    ? 'border-red-500 text-red-600 focus:ring-red-400'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {editing.taxId && editing.taxId !== '—' && !isValidVietnameseTaxId(editing.taxId) && (
                <p className="text-[11px] text-red-500 mt-1">
                  MST chuẩn gồm 10 số (công ty) hoặc 13 số (chi nhánh, VD: 0101234567-001).
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ xuất hóa đơn (Tự động từ khách hàng)</label>
              <input
                type="text"
                value={editing.billingAddress || ''}
                onChange={(e) => setEditing({ ...editing, billingAddress: e.target.value })}
                placeholder="Địa chỉ xuất hóa đơn..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Order IDs tham chiếu</label>
            <input
              type="text"
              value={(editing.orderIds || []).join(', ')}
              onChange={(e) => setEditing({ ...editing, orderIds: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
              placeholder="SO-001, SO-002"
            />
          </div>

          {/* Line Items Editor */}
          <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px] flex items-center gap-1">
                📦 Danh sách dòng hàng ({invoiceItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddInvoiceItem}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Mặt Hàng
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-gray-900 text-gray-500 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Sản phẩm / SKU</th>
                    <th className="p-2 w-20 text-center">Số lượng</th>
                    <th className="p-2 w-28 text-right">Đơn giá bán</th>
                    <th className="p-2 w-24 text-right">Chiết khấu</th>
                    <th className="p-2 w-24 text-center">Thuế VAT</th>
                    <th className="p-2 w-28 text-right">Thành tiền</th>
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
                          {products.map((p) => (
                            <option key={p.id} value={p.sku}>{p.sku} - {p.name}</option>
                          ))}
                          {!products.some((p) => p.sku === item.sku) && (
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
                      <td className="p-2 text-center font-mono">
                        <select
                          value={item.taxRate !== undefined ? item.taxRate : 0.08}
                          onChange={(e) => handleUpdateInvoiceItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border rounded bg-white dark:bg-gray-900 text-xs font-semibold text-center"
                        >
                          <option value={0}>0%</option>
                          <option value={0.05}>5%</option>
                          <option value={0.08}>8%</option>
                          <option value={0.1}>10%</option>
                        </select>
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
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoiceItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-400">
                        Chưa có mặt hàng nào. Bấm "Thêm Mặt Hàng" để chọn sản phẩm.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tạm tính tiền hàng (₫)</label>
              <input
                type="text"
                value={(editing.subtotal ?? 0) === 0 ? '' : Math.round(editing.subtotal ?? 0).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const parsed = digits === '' ? 0 : parseInt(digits, 10);
                  const currentVat = editing.taxAmount ?? editing.vatAmount ?? 0;
                  setEditing((prev) => ({ ...prev, subtotal: parsed, subTotal: parsed, totalAmount: parsed + currentVat }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thuế VAT (₫)</label>
              <input
                type="text"
                value={(editing.taxAmount ?? editing.vatAmount ?? 0) === 0 ? '' : Math.round(editing.taxAmount ?? editing.vatAmount ?? 0).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const parsed = digits === '' ? 0 : parseInt(digits, 10);
                  setEditing((prev) => ({ ...prev, vatAmount: parsed, taxAmount: parsed, totalAmount: (prev.subTotal || prev.subtotal || 0) + parsed }));
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono text-blue-600 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng thanh toán (₫)</label>
              <input
                type="text"
                value={(editing.totalAmount ?? ((editing.subTotal ?? editing.subtotal ?? 0) + (editing.taxAmount ?? editing.vatAmount ?? 0))) === 0 ? '' : Math.round(editing.totalAmount ?? ((editing.subTotal ?? editing.subtotal ?? 0) + (editing.taxAmount ?? editing.vatAmount ?? 0))).toLocaleString('vi-VN')}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  const parsed = digits === '' ? 0 : parseInt(digits, 10);
                  setEditing({ ...editing, totalAmount: parsed });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm font-mono font-bold text-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={editing.status || 'ISSUED'}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as ExportInvoiceItem['status'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              >
                <option value="ISSUED">Đã phát hành</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="OVERDUE">Quá hạn</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điều khoản TT</label>
              <input
                type="text"
                value={editing.paymentTerms || ''}
                onChange={(e) => setEditing({ ...editing, paymentTerms: e.target.value as any, dueDate: paymentTermsToDueDate(editing.issueDate || new Date().toISOString().split('T')[0], e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn thanh toán</label>
              <input
                type="date"
                value={editing.dueDate || ''}
                onChange={(e) => setEditing({ ...editing, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              value={editing.notes || ''}
              onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold">
              Lưu
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Xóa hóa đơn" width="max-w-md">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Xóa hóa đơn {deleting.invoiceNumber}?</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className="px-4 py-2 border rounded-lg text-sm">
                Hủy
              </button>
              <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                Xóa
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

