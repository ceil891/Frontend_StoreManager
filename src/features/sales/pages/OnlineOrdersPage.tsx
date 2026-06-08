import { useMemo, useState } from 'react';
import { Download, Filter, Eye, Globe, Smartphone, Store, Truck, User, MapPin, Phone, BadgeDollarSign, Edit, Trash2, Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { useSalesStore, type SaleOrder, calcTotalAmount, formatMoney } from '../store/salesStore';
import { resolveCustomerName } from '../store/salesHelpers';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { usePermission } from '@/shared/hooks/usePermission';
import { OrderLinesEditor, sumOrderLines, summarizeOrderLines } from '@/shared/components/sales/OrderLinesEditor';
import { CustomerSelect } from '@/shared/components/sales/CustomerSelect';
import { OrderPricingFields } from '@/shared/components/sales/OrderPricingFields';

const channelMeta = {
  WEB: { label: 'Web', icon: Globe, cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/30' },
  APP: { label: 'App', icon: Smartphone, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30' },
  MARKETPLACE: { label: 'Sàn TMĐT', icon: Store, cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30' },
} as const;

const deliveryMap: Record<NonNullable<SaleOrder['deliveryStatus']>, { label: string; cls: string }> = {
  CREATED: { label: 'Mới tạo', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  PICKING: { label: 'Đang soạn', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  SHIPPED: { label: 'Đang giao', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  DELIVERED: { label: 'Đã giao', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  FAILED: { label: 'Giao thất bại', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
};

export function OnlineOrdersPage() {
  const canManage = usePermission('sales:orders:create');
  const customers = useCrmStore((s) => s.customers);
  const saleOrders = useSalesStore((s) => s.saleOrders);
  const addSaleOrder = useSalesStore((s) => s.addSaleOrder);
  const updateSaleOrder = useSalesStore((s) => s.updateSaleOrder);
  const deleteSaleOrder = useSalesStore((s) => s.deleteSaleOrder);

  const onlineOrders = saleOrders.filter((o) => o.origin === 'ONLINE');

  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<'all' | NonNullable<SaleOrder['onlineChannel']>>('all');
  const [delivery, setDelivery] = useState<'all' | NonNullable<SaleOrder['deliveryStatus']>>('all');
  const [codOnly, setCodOnly] = useState<'all' | 'cod' | 'prepaid'>('all');

  const [selected, setSelected] = useState<SaleOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Partial<SaleOrder>>({});
  const [deleting, setDeleting] = useState<SaleOrder | null>(null);

  const filtered = onlineOrders.filter((o) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      o.code.toLowerCase().includes(q) ||
      resolveCustomerName(o.customerId, customers).toLowerCase().includes(q) ||
      (o.paymentGatewayRef || '').toLowerCase().includes(q) ||
      (o.promoCodeApplied || '').toLowerCase().includes(q) ||
      (o.recipientPhone || '').toLowerCase().includes(q) ||
      (o.shippingAddress || '').toLowerCase().includes(q) ||
      (o.trackingCode || '').toLowerCase().includes(q) ||
      (o.branchName || '').toLowerCase().includes(q);

    const matchChannel = channel === 'all' || o.onlineChannel === channel;
    const matchDelivery = delivery === 'all' || o.deliveryStatus === delivery;
    const matchCod =
      codOnly === 'all' ? true : codOnly === 'cod' ? !!o.isCod : !o.isCod;

    return matchQ && matchChannel && matchDelivery && matchCod;
  });

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditing({
      code: `ONL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: '',
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      subTotal: 0,
      taxAmount: 0,
      discountAmount: 0,
      shippingFee: 0,
      totalAmount: 0,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      paymentMethod: 'COD',
      origin: 'ONLINE',
      onlineChannel: 'WEB',
      currency: 'VND',
      branchId: 'BR-001',
      branchName: 'CH Quận 1',
      recipientName: '',
      recipientPhone: '',
      shippingAddress: '',
      province: 'TP.HCM',
      district: '',
      deliveryStatus: 'CREATED',
      shippingProvider: '',
      trackingCode: '',
      isCod: true,
      codAmount: 0,
      createdByName: 'System',
      orderLines: [],
    });
    setIsModalOpen(true);
  };

  const applyOrderLines = (lines: NonNullable<SaleOrder['orderLines']>) => {
    const subTotal = sumOrderLines(lines);
    const taxAmount = Number(editing.taxAmount) || 0;
    const discountAmount = Number(editing.discountAmount) || 0;
    const shippingFee = Number(editing.shippingFee) || 0;
    const totalAmount = calcTotalAmount({ subTotal, taxAmount, discountAmount, shippingFee });
    setEditing((prev) => ({
      ...prev,
      orderLines: lines,
      subTotal,
      totalAmount,
      itemsSummary: summarizeOrderLines(lines),
      codAmount: prev.isCod ? totalAmount : prev.codAmount,
    }));
  };

  const handleOpenEdit = (o: SaleOrder) => {
    setModalMode('edit');
    setEditing(o);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.code || !editing.customerId) return;
    const lines = editing.orderLines ?? [];
    const lineSub = sumOrderLines(lines);
    const subTotal = lines.length ? lineSub : Number(editing.subTotal) || 0;
    const taxAmount = Number(editing.taxAmount) || 0;
    const discountAmount = Number(editing.discountAmount) || 0;
    const shippingFee = Number(editing.shippingFee) || 0;
    const totalAmount = calcTotalAmount({ subTotal, taxAmount, discountAmount, shippingFee });
    const linePayload = {
      orderLines: lines,
      subTotal,
      taxAmount,
      discountAmount,
      shippingFee,
      totalAmount,
      itemsSummary: summarizeOrderLines(lines) || editing.itemsSummary,
    };
    const customerLabel = resolveCustomerName(editing.customerId, customers);
    if (modalMode === 'create') {
      addSaleOrder({
        code: editing.code,
        customerId: editing.customerId,
        date: editing.date || new Date().toISOString().slice(0, 16).replace('T', ' '),
        ...linePayload,
        status: (editing.status as any) || 'PENDING',
        paymentStatus: (editing.paymentStatus as any) || 'UNPAID',
        paymentMethod: editing.paymentMethod || (editing.isCod ? 'COD' : 'Online Card'),
        origin: 'ONLINE',
        onlineChannel: (editing.onlineChannel as any) || 'WEB',
        currency: (editing.currency as any) || 'VND',
        branchId: editing.branchId ?? 'BR-001',
        branchName: editing.branchName || 'CH Quận 1',
        createdByName: editing.createdByName || 'System',
        createdByEmail: editing.createdByEmail,
        recipientName: editing.recipientName || customerLabel,
        recipientPhone: editing.recipientPhone,
        shippingAddress: editing.shippingAddress,
        province: editing.province,
        district: editing.district,
        deliveryStatus: (editing.deliveryStatus as any) || 'CREATED',
        shippingProvider: editing.shippingProvider,
        trackingCode: editing.trackingCode,
        isCod: !!editing.isCod,
        codAmount: editing.isCod ? Number(editing.codAmount ?? totalAmount) : undefined,
        paymentGatewayRef: editing.paymentGatewayRef,
        promoCodeApplied: editing.promoCodeApplied,
      });
    } else if (editing.id) {
      updateSaleOrder(editing.id, { ...editing, ...linePayload } as Partial<SaleOrder>);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleting) return;
    deleteSaleOrder(deleting.id);
    if (selected?.id === deleting.id) setSelected(null);
    setDeleting(null);
  };

  const columns = useMemo<ColumnDef<SaleOrder>[]>(
    () => [
      {
        accessorKey: 'code',
        header: 'Mã đơn',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'onlineChannel',
        header: 'Kênh',
        cell: ({ row }) => {
          const ch = row.original.onlineChannel || 'WEB';
          const meta = channelMeta[ch];
          const Icon = meta.icon;
          return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold border ${meta.cls}`}>
              <Icon className="w-3.5 h-3.5" />
              {meta.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'branchName',
        header: 'Cửa hàng',
        cell: ({ row }) => <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{row.original.branchName || 'N/A'}</span>,
      },
      {
        id: 'customer',
        header: 'Khách',
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {resolveCustomerName(row.original.customerId, customers)}
            </p>
            <p className="text-xs text-gray-500 font-mono">{row.original.recipientPhone || '—'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'deliveryStatus',
        header: 'Vận chuyển',
        cell: ({ row }) => {
          const st = row.original.deliveryStatus || 'CREATED';
          const meta = deliveryMap[st];
          return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${meta.cls}`}>{meta.label}</span>;
        },
      },
      {
        accessorKey: 'totalAmount',
        header: 'Giá trị',
        cell: ({ row }) => (
          <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-white">
              {formatMoney(row.original.totalAmount, 'VND')}
            </p>
            <p className={`text-[11px] font-semibold ${row.original.isCod ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {row.original.isCod
                ? `COD ${formatMoney(row.original.codAmount ?? row.original.totalAmount, 'VND')}`
                : 'Thanh toán trước'}
            </p>
          </div>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Tạo lúc',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg"
              title="Xem"
            >
              <Eye className="w-4 h-4" />
            </button>            {canManage && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg"
                title="Sửa"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {canManage && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDeleting(row.original); }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                title="Xóa"
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg shrink-0">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn hàng Online (E-commerce)</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Đơn hàng tự động đồng bộ từ website bán hàng và sàn TMĐT. Nhấp vào dòng để xem chi tiết.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất dữ liệu
            </button>
            {canManage && (
              <button type="button" onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm">
                <Plus className="w-4 h-4" /> Tạo đơn online
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="lg:col-span-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã đơn, khách, SĐT, địa chỉ, tracking..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:col-span-2">
            <select value={channel} onChange={(e) => setChannel(e.target.value as any)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm">
              <option value="all">Tất cả kênh</option>
              <option value="WEB">Web</option>
              <option value="APP">App</option>
              <option value="MARKETPLACE">Sàn TMĐT</option>
            </select>
            <select value={delivery} onChange={(e) => setDelivery(e.target.value as any)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm">
              <option value="all">Tất cả vận chuyển</option>
              {Object.keys(deliveryMap).map((k) => (
                <option key={k} value={k}>{deliveryMap[k as NonNullable<SaleOrder['deliveryStatus']>].label}</option>
              ))}
            </select>
            <select value={codOnly} onChange={(e) => setCodOnly(e.target.value as any)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm col-span-2">
              <option value="all">COD + Prepaid</option>
              <option value="cod">Chỉ COD</option>
              <option value="prepaid">Chỉ Prepaid</option>
            </select>
          </div>
          <button type="button" className="hidden" aria-hidden><Filter className="w-4 h-4" /></button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chi tiết đơn hàng online: ${selected.code}` : 'Chi tiết đơn hàng'}
        width="max-w-lg"
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Người nhận
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                  {selected.recipientName || resolveCustomerName(selected.customerId, customers)}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selected.recipientPhone || '—'}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <BadgeDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Thanh toán
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selected.paymentMethod || '—'}</p>
                <p className={`text-xs font-semibold mt-1 ${selected.isCod ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {selected.isCod
                    ? `COD ${formatMoney(selected.codAmount ?? selected.totalAmount, 'VND')}`
                    : 'Thanh toán trước'}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tiền hàng</span>
                <span className="font-mono font-semibold">{formatMoney(selected.subTotal, 'VND')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ship / Thuế / Giảm</span>
                <span className="font-mono text-xs">
                  +{formatMoney(selected.shippingFee ?? 0, 'VND')} / +{formatMoney(selected.taxAmount, 'VND')} / −{formatMoney(selected.discountAmount, 'VND')}
                </span>
              </div>
              {selected.paymentGatewayRef && (
                <div className="flex justify-between">
                  <span className="text-gray-550">Mã cổng TT</span>
                  <span className="font-mono font-semibold">{selected.paymentGatewayRef}</span>
                </div>
              )}
              {selected.promoCodeApplied && (
                <div className="flex justify-between">
                  <span className="text-gray-550">Voucher</span>
                  <span className="font-semibold text-emerald-600">{selected.promoCodeApplied}</span>
                </div>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">Địa chỉ giao</p>
                  <p className="text-gray-600 dark:text-gray-300">{selected.shippingAddress || '—'}</p>
                  <p className="text-xs text-gray-500">{selected.district || '—'}, {selected.province || '—'}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Vận chuyển:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{deliveryMap[selected.deliveryStatus || 'CREATED'].label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ĐVVC:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selected.shippingProvider || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tracking:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selected.trackingCode || '—'}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Tạo đơn online' : 'Sửa đơn online'} width="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn *</label>
              <input value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 font-mono text-sm" required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng (CRM) *</label>
              <CustomerSelect
                value={editing.customerId || ''}
                onChange={(customerId) => setEditing({ ...editing, customerId })}
                allowWalkIn={false}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kênh</label>
              <select value={editing.onlineChannel || 'WEB'} onChange={(e) => setEditing({ ...editing, onlineChannel: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm">
                <option value="WEB">Web</option>
                <option value="APP">App</option>
                <option value="MARKETPLACE">Sàn TMĐT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái giao</label>
              <select value={editing.deliveryStatus || 'CREATED'} onChange={(e) => setEditing({ ...editing, deliveryStatus: e.target.value as any })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm">
                {Object.keys(deliveryMap).map((k) => (
                  <option key={k} value={k}>{deliveryMap[k as NonNullable<SaleOrder['deliveryStatus']>].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cửa hàng</label>
              <input value={editing.branchName || ''} onChange={(e) => setEditing({ ...editing, branchName: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người nhận</label>
              <input value={editing.recipientName || ''} onChange={(e) => setEditing({ ...editing, recipientName: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">SĐT nhận</label>
              <input value={editing.recipientPhone || ''} onChange={(e) => setEditing({ ...editing, recipientPhone: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ giao</label>
            <input value={editing.shippingAddress || ''} onChange={(e) => setEditing({ ...editing, shippingAddress: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ĐVVC</label>
              <input value={editing.shippingProvider || ''} onChange={(e) => setEditing({ ...editing, shippingProvider: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tracking</label>
              <input value={editing.trackingCode || ''} onChange={(e) => setEditing({ ...editing, trackingCode: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono text-sm" />
            </div>
          </div>

          <OrderLinesEditor
            lines={editing.orderLines ?? []}
            currency="VND"
            onChange={applyOrderLines}
          />

          <OrderPricingFields
            showShipping
            currency="VND"
            values={{
              subTotal: Number(editing.subTotal) || 0,
              taxAmount: Number(editing.taxAmount) || 0,
              discountAmount: Number(editing.discountAmount) || 0,
              shippingFee: Number(editing.shippingFee) || 0,
              totalAmount: Number(editing.totalAmount) || 0,
            }}
            onChange={(patch) => setEditing((prev) => ({ ...prev, ...patch, codAmount: prev.isCod ? (patch.totalAmount ?? prev.totalAmount) : prev.codAmount }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã cổng thanh toán</label>
              <input value={editing.paymentGatewayRef || ''} onChange={(e) => setEditing({ ...editing, paymentGatewayRef: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono text-sm" placeholder="VNPAY-TXN-..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã khuyến mãi</label>
              <input value={editing.promoCodeApplied || ''} onChange={(e) => setEditing({ ...editing, promoCodeApplied: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">COD?</label>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" checked={!!editing.isCod} onChange={(e) => setEditing({ ...editing, isCod: e.target.checked, codAmount: e.target.checked ? (editing.totalAmount ?? 0) : undefined })} />
                <span className="text-sm text-gray-600">Thu tiền khi giao</span>
              </div>
            </div>
            {editing.isCod && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền COD</label>
                <input
                  type="text"
                  value={(editing.codAmount ?? (Number(editing.totalAmount) || 0)) === 0 ? '' : Math.round(editing.codAmount ?? (Number(editing.totalAmount) || 0)).toLocaleString('vi-VN')}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '');
                    const parsed = digits === '' ? 0 : parseInt(digits, 10);
                    setEditing({ ...editing, codAmount: parsed });
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono text-sm"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow">Lưu</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Xóa đơn online" width="max-w-md">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Xóa đơn {deleting.code}?</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className="px-4 py-2 border rounded-lg text-sm">Hủy</button>
              <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Xóa</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

