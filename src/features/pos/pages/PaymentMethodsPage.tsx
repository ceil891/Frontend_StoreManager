import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Filter, Eye, CreditCard, Percent, Smartphone, Globe, RefreshCcw, Edit, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { usePosConfigStore, type PaymentMethodRecord } from '../store/posConfigStore';
import { useBranchStore } from '@/features/system/store/branchStore';

const typeBadgeStyles = {
  CREDIT_CARD_GATEWAY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  QR_EWALLET: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200',
  BANK_TRANSFER_QR: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  CASH_DRAWER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  BUY_NOW_PAY_LATER: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
};

const typeMap: Record<string, string> = {
  CREDIT_CARD_GATEWAY: 'Cổng thẻ tín dụng',
  QR_EWALLET: 'Ví điện tử & QR',
  BANK_TRANSFER_QR: 'Chuyển khoản QR',
  CASH_DRAWER: 'Hộp tiền mặt',
  BUY_NOW_PAY_LATER: 'Mua trước trả sau (BNPL)',
};

const settlementMap: Record<string, string> = {
  INSTANT: 'Tức thời',
  NEXT_DAY: 'Ngày hôm sau (T+1)',
  T_PLUS_3: 'Sau 3 ngày (T+3)',
};

export function PaymentMethodsPage() {
  const { paymentMethods: data, fetchPaymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = usePosConfigStore();
  const { branches, fetchBranches } = useBranchStore();
  const [search, setSearch] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodRecord | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
    fetchBranches();
  }, [fetchPaymentMethods, fetchBranches]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethodRecord>>({});
  const [deletingMethod, setDeletingMethod] = useState<PaymentMethodRecord | null>(null);

  const filtered = data.filter((item) =>
    (item.methodCode || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.methodName || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.providerType || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.configuredGateways || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingMethod({
      methodCode: `PM-${Math.floor(1000 + Math.random() * 9000)}`,
      methodName: '',
      providerType: 'CASH',
      processingFeePct: 0,
      fixedFeeUsd: 0,
      settlementTime: 'INSTANT',
      totalVolumeUsd: 0,
      supportedCurrencies: ['VND', 'USD'],
      status: 'ACTIVE',
      configuredGateways: '',
      sortOrder: 0,
      currency: 'VND',
      logoUrl: '',
      bankName: '',
      bankAccount: '',
      bankAccountName: '',
      transferSyntax: 'POS {order_code}',
      merchantId: '',
      apiKey: '',
      secretKey: '',
      checksumKey: '',
      allowPos: true,
      allowOnline: false,
      branchIds: [],
      applyToAllBranches: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (method: PaymentMethodRecord) => {
    setModalMode('edit');
    setEditingMethod(method);
    setIsModalOpen(true);
  };

  const handleSaveMethod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod.methodCode || !editingMethod.methodName) return;

    if (modalMode === 'create') {
      const newMethod: Omit<PaymentMethodRecord, 'id'> = {
        methodCode: editingMethod.methodCode,
        methodName: editingMethod.methodName,
        providerType: editingMethod.providerType as any || 'CASH',
        processingFeePct: Number(editingMethod.processingFeePct) || 0,
        fixedFeeUsd: Number(editingMethod.fixedFeeUsd) || 0,
        settlementTime: editingMethod.settlementTime as any || 'INSTANT',
        totalVolumeUsd: Number(editingMethod.totalVolumeUsd) || 0,
        supportedCurrencies: editingMethod.supportedCurrencies || ['VND'],
        status: editingMethod.status as any || 'ACTIVE',
        configuredGateways: editingMethod.configuredGateways || '',
        sortOrder: Number(editingMethod.sortOrder) || 0,
        currency: editingMethod.currency || 'VND',
        logoUrl: editingMethod.logoUrl || '',
        bankName: editingMethod.bankName || '',
        bankAccount: editingMethod.bankAccount || '',
        bankAccountName: editingMethod.bankAccountName || '',
        transferSyntax: editingMethod.transferSyntax || 'POS {order_code}',
        merchantId: editingMethod.merchantId || '',
        apiKey: editingMethod.apiKey || '',
        secretKey: editingMethod.secretKey || '',
        checksumKey: editingMethod.checksumKey || '',
        allowPos: (editingMethod.branchIds && editingMethod.branchIds.length > 0) ? true : (editingMethod.allowPos !== undefined ? editingMethod.allowPos : true),
        allowOnline: editingMethod.allowOnline !== undefined ? editingMethod.allowOnline : false,
        branchIds: editingMethod.branchIds || [],
        applyToAllBranches: editingMethod.applyToAllBranches !== false,
        ytdTotal: 0,
      };
      addPaymentMethod(newMethod);
    } else if (editingMethod.id) {
      updatePaymentMethod(editingMethod.id, editingMethod);
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingMethod) return;
    deletePaymentMethod(deletingMethod.id);
    setDeletingMethod(null);
  };

  const columns = useMemo<ColumnDef<PaymentMethodRecord>[]>(
    () => [
      {
        accessorKey: 'methodCode',
        header: 'Mã PT',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded border border-emerald-200 dark:border-emerald-800 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'methodName',
        header: 'Cổng thanh toán / kênh',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.methodName}</p>
            <p className="text-xs text-gray-500 font-mono">Động cơ: {row.original.configuredGateways}</p>
          </div>
        ),
      },
      {
        accessorKey: 'providerType',
        header: 'Loại hình',
        cell: (info) => {
          const t = info.getValue() as keyof typeof typeBadgeStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${typeBadgeStyles[t]}`}>
              {typeMap[t] || t}
            </span>
          );
        },
      },
      {
        accessorKey: 'processingFeePct',
        header: 'Biểu phí',
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-gray-800 dark:text-gray-200 text-xs">
            {row.original.processingFeePct}%{row.original.fixedFeeUsd ? ` + ${row.original.fixedFeeUsd.toLocaleString('vi-VN')} đ` : ''}
          </span>
        ),
      },
      {
        accessorKey: 'settlementTime',
        header: 'Thời gian đối soát (SLA)',
        cell: (info) => {
          const val = info.getValue() as string;
          return <span className="font-mono text-xs text-gray-700 dark:text-gray-300 font-bold">{settlementMap[val] || val}</span>;
        },
      },
      {
        accessorKey: 'ytdTotal',
        header: 'Tổng giao dịch',
        cell: (info) => {
          const val = (info.getValue() as number) || 0;
          return <span className="font-mono font-bold text-gray-900 dark:text-white">{val.toLocaleString('vi-VN')} đ</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            ACTIVE: 'Hoạt động',
            TESTING_MODE: 'Chế độ test',
            MAINTENANCE: 'Bảo trì',
            DISABLED: 'Vô hiệu hóa',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'TESTING_MODE' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-mono font-bold' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {statusMap[status] || status}
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
              onClick={(e) => { e.stopPropagation(); setSelectedMethod(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors shrink-0"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingMethod(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phương thức thanh toán POS & cổng kết nối</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cấu hình các kênh thanh toán đa phương thức, kiểm tra biểu phí giao dịch và quản lý thiết bị đầu cuối. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Thêm phương thức thanh toán
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã, tên phương thức hoặc nhà cung cấp..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button title="Bộ lọc" className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm whitespace-nowrap shrink-0">
            <Filter className="w-4 h-4" /> Lọc dữ liệu
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedMethod(row)} />
      </div>

      <Modal
        isOpen={!!selectedMethod}
        onClose={() => setSelectedMethod(null)}
        title={selectedMethod ? `Chi tiết cổng thanh toán: ${selectedMethod.methodCode}` : 'Chi tiết phương thức'}
        size="erp"
      >
        {selectedMethod && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedMethod.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedMethod.status === 'TESTING_MODE'
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedMethod.status === 'ACTIVE' ? 'bg-emerald-600' : selectedMethod.status === 'TESTING_MODE' ? 'bg-purple-600' : 'bg-red-600'
                }`}>
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Doanh số tích lũy</p>
                  <p className="text-xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                    {selectedMethod.totalVolumeUsd.toLocaleString('vi-VN')} đ
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedMethod.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedMethod.status === 'TESTING_MODE' ? 'bg-purple-200 text-purple-900 dark:bg-purple-800 dark:text-purple-100' :
                'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100'
              }`}>
                {selectedMethod.status === 'ACTIVE' ? 'Hoạt động' :
                 selectedMethod.status === 'TESTING_MODE' ? 'Chế độ test' :
                 selectedMethod.status === 'MAINTENANCE' ? 'Bảo trì' : 'Vô hiệu hóa'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Percent className="w-4 h-4 text-emerald-600" /> Biểu phí cổng thanh toán
                </div>
                <p className="text-base font-mono font-bold text-gray-900 dark:text-white truncate">
                  {selectedMethod.processingFeePct}%{selectedMethod.fixedFeeUsd ? ` + ${selectedMethod.fixedFeeUsd.toLocaleString('vi-VN')} đ` : ''}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <RefreshCcw className="w-4 h-4 text-blue-500" /> Thời gian đối soát (SLA)
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate font-mono">{settlementMap[selectedMethod.settlementTime] || selectedMethod.settlementTime}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Kênh & động cơ thanh toán</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedMethod.methodName}</h3>
                <span className="inline-block mt-1 text-xs bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-0.5 rounded font-mono font-bold">
                  Động cơ: {selectedMethod.configuredGateways}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Loại kênh thanh toán:</span>
                <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-bold border ${typeBadgeStyles[selectedMethod.providerType]}`}>
                  {typeMap[selectedMethod.providerType] || selectedMethod.providerType}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Đồng tiền hỗ trợ</span>
                <div className="flex gap-1.5 font-mono font-bold text-xs">
                  {selectedMethod.supportedCurrencies.map((curr) => (
                    <span key={curr} className="bg-white dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-800 shadow-2xs">
                      {curr}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              <button type="button" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                <Globe className="w-4 h-4" /> Cập nhật khóa API webhook
              </button>
              <button type="button" className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <Smartphone className="w-4 h-4 inline mr-1" /> Kiểm tra kết nối đầu cuối
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm phương thức thanh toán' : 'Cập nhật phương thức'}
        size="erp"
      >
        <form onSubmit={handleSaveMethod} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mã phương thức (mã cổng) *</label>
              <input
                type="text"
                value={editingMethod.methodCode || ''}
                onChange={(e) => setEditingMethod({ ...editingMethod, methodCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tên hiển thị *</label>
              <input
                type="text"
                value={editingMethod.methodName || ''}
                onChange={(e) => setEditingMethod({ ...editingMethod, methodName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Loại hình *</label>
              <select
                value={editingMethod.providerType || (data.some(d => d.providerType === 'CASH' || d.methodCode === 'CASH') ? 'BANK_TRANSFER' : 'CASH')}
                onChange={(e) => setEditingMethod({ ...editingMethod, providerType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              >
                {(!data.some(d => (d.providerType === 'CASH' || d.methodCode === 'CASH') && d.id !== editingMethod.id) || modalMode === 'edit') && (
                  <option value="CASH">Tiền mặt</option>
                )}
                <option value="BANK_TRANSFER">Chuyển khoản ngân hàng / VietQR</option>
                <option value="GATEWAY">Cổng thanh toán tự động</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Trạng thái</label>
              <select
                value={editingMethod.status || 'ACTIVE'}
                onChange={(e) => setEditingMethod({ ...editingMethod, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="TESTING_MODE">Môi trường thử nghiệm</option>
                <option value="MAINTENANCE">Bảo trì hệ thống</option>
                <option value="DISABLED">Đã vô hiệu hóa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phí phần trăm (%)</label>
              <input
                type="number"
                step="0.01"
                value={editingMethod.processingFeePct || 0}
                onChange={(e) => setEditingMethod({ ...editingMethod, processingFeePct: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phí cố định</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={editingMethod.fixedFeeUsd || 0}
                  onChange={(e) => setEditingMethod({ ...editingMethod, fixedFeeUsd: parseFloat(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={editingMethod.currency || 'VND'}
                  onChange={(e) => setEditingMethod({ ...editingMethod, currency: e.target.value })}
                  className="w-24 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="VND">VNĐ</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Thời gian đối soát (SLA)</label>
              <select
                value={editingMethod.settlementTime || 'INSTANT'}
                onChange={(e) => setEditingMethod({ ...editingMethod, settlementTime: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="INSTANT">Tức thời (tiền mặt / POS)</option>
                <option value="SAME_DAY_BATCH">Cùng ngày (T+0)</option>
                <option value="T_PLUS_1_BUSINESS_DAY">Ngày làm việc tiếp theo (T+1)</option>
                <option value="T_PLUS_3_BUSINESS_DAYS">Sau 3 ngày làm việc (T+3)</option>
              </select>
              <p className="text-[10px] text-gray-400 mt-1 italic">Thời gian tiền thực về tài khoản doanh nghiệp (phục vụ kế toán đối soát)</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Thứ tự hiển thị</label>
              <input
                type="number"
                value={editingMethod.sortOrder || 0}
                onChange={(e) => setEditingMethod({ ...editingMethod, sortOrder: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Đường dẫn logo / biểu tượng phương thức</label>
            <input
              type="text"
              value={editingMethod.logoUrl || ''}
              onChange={(e) => setEditingMethod({ ...editingMethod, logoUrl: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="https://image-url-momo-or-vietqr..."
            />
          </div>

          {/* Conditional Section: BANK_TRANSFER (VietQR Account info) */}
          {editingMethod.providerType === 'BANK_TRANSFER' && (
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl space-y-3">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Thông tin nhận tiền VietQR</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Mã ngân hàng *</label>
                  <select
                    value={editingMethod.bankName || 'VCB'}
                    onChange={(e) => setEditingMethod({ ...editingMethod, bankName: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500"
                    required
                  >
                    <option value="VCB">Vietcombank (VCB)</option>
                    <option value="TCB">Techcombank (TCB)</option>
                    <option value="ICB">VietinBank (ICB)</option>
                    <option value="BIDV">BIDV (BIDV)</option>
                    <option value="VBA">Agribank (VBA)</option>
                    <option value="MB">MBBank (MB)</option>
                    <option value="VPB">VPBank (VPB)</option>
                    <option value="ACB">ACB (ACB)</option>
                    <option value="STB">Sacombank (STB)</option>
                    <option value="TPB">TPBank (TPB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Số tài khoản *</label>
                  <input
                    type="text"
                    value={editingMethod.bankAccount || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, bankAccount: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                    placeholder="Nhập số tài khoản ngân hàng..."
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Tên chủ tài khoản *</label>
                  <input
                    type="text"
                    value={editingMethod.bankAccountName || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, bankAccountName: e.target.value.toUpperCase() })}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500"
                    placeholder="NGUYEN VAN A..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Cú pháp chuyển khoản</label>
                  <input
                    type="text"
                    value={editingMethod.transferSyntax || 'POS {order_code}'}
                    onChange={(e) => setEditingMethod({ ...editingMethod, transferSyntax: e.target.value })}
                    className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500"
                    placeholder="Mặc định: POS {order_code}"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional Section: GATEWAY (Momo, VNPay, Stripe...) */}
          {editingMethod.providerType === 'GATEWAY' && (
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/30 rounded-xl space-y-3">
              <p className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Cấu hình kết nối API cổng thanh toán</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Merchant ID *</label>
                  <input
                    type="text"
                    value={editingMethod.merchantId || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, merchantId: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                    placeholder="MOMO_12345..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">API Key *</label>
                  <input
                    type="password"
                    value={editingMethod.apiKey || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, apiKey: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Khóa bí mật (Secret Key) *</label>
                  <input
                    type="password"
                    value={editingMethod.secretKey || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, secretKey: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1">Khóa xác thực (Checksum Key)</label>
                  <input
                    type="password"
                    value={editingMethod.checksumKey || ''}
                    onChange={(e) => setEditingMethod({ ...editingMethod, checksumKey: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Đường dẫn cấu hình API (URL) *</label>
                <input
                  type="text"
                  value={editingMethod.configuredGateways || ''}
                  onChange={(e) => setEditingMethod({ ...editingMethod, configuredGateways: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://api.momo.vn/v2/pay/confirm..."
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Kênh áp dụng</label>
            <div className="flex flex-col gap-3">
              {/* Online Web toggle */}
              <label className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingMethod.allowOnline === true}
                  onChange={(e) => setEditingMethod({ ...editingMethod, allowOnline: e.target.checked })}
                  className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mr-2"
                />
                Cửa hàng trực tuyến (Web/Online)
              </label>
              {/* POS per-branch multi-select */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/30">
                <label className="inline-flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={editingMethod.applyToAllBranches !== false}
                    onChange={(e) => setEditingMethod({ ...editingMethod, applyToAllBranches: e.target.checked, branchIds: e.target.checked ? [] : (editingMethod.branchIds || []) })}
                    className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mr-2"
                  />
                  POS — Áp dụng tất cả chi nhánh
                </label>
                {editingMethod.applyToAllBranches === false && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Chọn chi nhánh được phép sử dụng phương thức này:</p>
                    {branches.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Chưa có chi nhánh nào. Vui lòng tạo chi nhánh trước.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                        {branches.map((branch: any) => (
                          <label key={branch.id} className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(editingMethod.branchIds || []).includes(String(branch.id))}
                              onChange={(e) => {
                                const currentIds = editingMethod.branchIds || [];
                                const branchId = String(branch.id);
                                const newIds = e.target.checked
                                  ? [...currentIds, branchId]
                                  : currentIds.filter((id: string) => id !== branchId);
                                setEditingMethod({ ...editingMethod, branchIds: newIds });
                              }}
                              className="rounded border-gray-350 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mr-2 shrink-0"
                            />
                            <span className="truncate">{branch.name || branch.branchName}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Thêm mới' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingMethod}
        onClose={() => setDeletingMethod(null)}
        title="Xác nhận gỡ phương thức"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn vô hiệu hóa và gỡ bỏ cấu hình của cổng thanh toán <strong className="text-gray-900 dark:text-white">{deletingMethod?.methodName}</strong> không?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingMethod(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Đồng ý xóa
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
