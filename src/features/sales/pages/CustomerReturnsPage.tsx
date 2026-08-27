import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, User, Calendar, CheckCircle2, RefreshCw, AlertTriangle, Edit, Trash2, Box, Package, Building2, Wallet, CreditCard, ShieldCheck, Lock, FileText } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type CustomerReturnItem, type CustomerReturnLine, BRANCH_NAME_BY_ID } from '../store/salesStore';
import { resolveCustomerName, type RefundMethod } from '../store/salesHelpers';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { useUserStore } from '@/features/hr/store/userStore';
import { usePermission } from '@/shared/hooks/usePermission';
import { CustomerSelect } from '@/shared/components/sales/CustomerSelect';
import { toast } from 'sonner';

const REFUND_METHOD_LABELS: Record<RefundMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  STORE_CREDIT: 'Ví / Store credit',
  ORIGINAL_CARD: 'Hoàn thẻ gốc',
};

const ERP_STATUS_LABELS: Record<string, { label: string; style: string }> = {
  DRAFT: { label: 'Nháp', style: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  PENDING_RECEIPT: { label: 'Chờ nhận hàng', style: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  PENDING_INSPECTION: { label: 'Đang kiểm tra hàng', style: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  INSPECTING: { label: 'Đang kiểm tra hàng', style: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  APPROVED: { label: 'Đã duyệt', style: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  STOCK_IN: { label: 'Đã nhập kho WMS', style: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' },
  REFUND_PROCESSING: { label: 'Đang hoàn tiền', style: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
  REFUNDED: { label: 'Đã hoàn tiền & Nhập kho', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  COMPLETED: { label: 'Đã hoàn thành', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  REJECTED: { label: 'Từ chối', style: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
};

export function CustomerReturnsPage() {
  const canManage = usePermission('sales:returns:manage');
  const customers = useCrmStore((s) => s.customers);
  const currentUser = useAuthStore((s) => s.user);
  const currentAccountName = currentUser?.name || currentUser?.username || 'Admin POS';

  const { branches, fetchBranches } = useBranchStore();
  const { warehouseZones, fetchWarehouseZones, racks, fetchRacks } = useInventoryStore();
  const { users, fetchUsers } = useUserStore();

  const {
    saleOrders,
    fetchSaleOrders,
    customerReturns,
    returnRequests,
    addCustomerReturn,
    updateCustomerReturn,
    deleteCustomerReturn,
    fetchCustomerReturns,
  } = useSalesStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchCustomerReturns(),
          fetchSaleOrders(),
          fetchBranches(),
          fetchWarehouseZones(),
          fetchRacks(),
          fetchUsers(),
        ]);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải dữ liệu phiếu hoàn trả');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchCustomerReturns, fetchSaleOrders, fetchBranches, fetchWarehouseZones, fetchRacks, fetchUsers]);

  const [search, setSearch] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<CustomerReturnItem | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<Partial<CustomerReturnItem> & {
    bankName?: string;
    accountNumber?: string;
    transactionRef?: string;
    deductionAmount?: number;
  }>({});
  const [deleting, setDeleting] = useState<CustomerReturnItem | null>(null);

  // Helper check: Only the assigned inspector OR Super Admin can inspect and change status
  const canInspectOrApprove = (ret: CustomerReturnItem | Partial<CustomerReturnItem> | null) => {
    if (!ret) return false;
    if (!currentUser) return true;
    const inspectorName = (ret.inspector || '').trim().toLowerCase();
    const currentName = (currentUser.name || currentUser.username || '').trim().toLowerCase();
    const currentRole = (currentUser.role || '').toUpperCase();

    // Strictly ONLY SUPER_ADMIN has master override power!
    const isSuperAdmin = currentRole === 'SUPER_ADMIN';
    if (isSuperAdmin) return true;
    if (!inspectorName) return true;

    return inspectorName.includes(currentName) || currentName.includes(inspectorName);
  };

  const filtered = customerReturns.filter(
    (item) =>
      resolveCustomerName(item.customerId, customers).toLowerCase().includes(search.toLowerCase()) ||
      item.returnCode.toLowerCase().includes(search.toLowerCase()) ||
      (item.orderCode || '').toLowerCase().includes(search.toLowerCase())
  );

  const syncSelected = (updated: CustomerReturnItem) => {
    setSelectedReturn((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const availableZones = useMemo(() => {
    if (!editing.returnBranchId) return warehouseZones;
    return warehouseZones.filter((z) => !z.branchId || String(z.branchId) === String(editing.returnBranchId));
  }, [editing.returnBranchId, warehouseZones]);

  const availableRacks = useMemo(() => {
    if (!editing.warehouseId) return racks;
    return racks.filter((r) => !r.zoneId || String(r.zoneId) === String(editing.warehouseId));
  }, [editing.warehouseId, racks]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const defaultBranch = branches[0]?.id ? String(branches[0].id) : '1';
    const defaultZone = availableZones[0]?.id ? String(availableZones[0].id) : (warehouseZones[0]?.id ? String(warehouseZones[0].id) : 'WH-01');
    const defaultRack = availableRacks[0]?.id ? String(availableRacks[0].id) : (racks[0]?.id ? String(racks[0].id) : 'BIN-A01');
    const defaultInspector = users[0]?.fullName || users[0]?.username || currentAccountName;

    setEditing({
      returnCode: `RET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      orderCode: '',
      customerId: '',
      refundAmount: 0,
      deductionAmount: 0,
      refundMethod: 'CASH',
      isRestocked: true,
      returnBranchId: defaultBranch,
      warehouseId: defaultZone,
      locationId: defaultRack,
      returnDate: new Date().toISOString().split('T')[0],
      reason: 'Khách đổi trả / hàng lỗi',
      status: 'PENDING_INSPECTION',
      inspector: defaultInspector,
      createdBy: currentAccountName,
      notes: '',
      returnLines: [],
      bankName: '',
      accountNumber: '',
      transactionRef: '',
    });
    setIsModalOpen(true);
  };

  const handleSelectReturnRequest = (requestCode: string) => {
    if (!requestCode) {
      setEditing((prev) => ({
        ...prev,
        returnRequestCode: null,
        returnRequestId: null,
      }));
      return;
    }

    const matchedRR = returnRequests.find((rr) => rr.requestCode === requestCode);
    if (!matchedRR) return;

    setEditing((prev) => ({
      ...prev,
      returnRequestCode: matchedRR.requestCode,
      returnRequestId: matchedRR.id,
      orderCode: matchedRR.orderCode,
      customerId: matchedRR.customerId,
      reason: matchedRR.reason || prev.reason,
    }));

    handleSelectOriginalOrder(matchedRR.orderCode);
    toast.info(`Đã nạp Yêu cầu ${matchedRR.requestCode} (Còn được trả: ${matchedRR.remainingQty} sản phẩm)`);
  };

  const handleSelectOriginalOrder = (orderCode: string) => {
    const selectedSO = saleOrders.find((so) => so.code === orderCode || `SO-${so.id}` === orderCode || (so as any).orderCode === orderCode);

    if (!selectedSO) {
      setEditing((prev) => ({ ...prev, orderCode, returnLines: [] }));
      return;
    }

    // Auto match CRM customer by ID, phone, or name
    let matchedCustomerId = selectedSO.customerId;
    const targetPhone = selectedSO.customerPhone || (selectedSO as any).recipientPhone;
    const targetName = selectedSO.customerName || (selectedSO as any).recipientName;

    const matchedCrm = customers.find((c) => {
      if (selectedSO.customerId && String(c.id) === String(selectedSO.customerId)) return true;
      if (targetPhone && c.phone && c.phone.replace(/\D/g, '') === targetPhone.replace(/\D/g, '')) return true;
      if (targetName && c.name && c.name.toLowerCase().trim() === targetName.toLowerCase().trim()) return true;
      return false;
    });

    if (matchedCrm) {
      matchedCustomerId = String(matchedCrm.id);
    }

    const rawItems = (selectedSO as any).items?.length
      ? (selectedSO as any).items
      : selectedSO.orderLines?.length
      ? selectedSO.orderLines.map((ol: any) => ({
          productId: ol.id,
          productName: ol.productName,
          sku: ol.sku,
          quantity: ol.quantity,
          price: ol.unitPrice,
        }))
      : null;

    const mappedLines: CustomerReturnLine[] = rawItems
      ? rawItems.map((it: any, idx: number) => ({
          id: String(idx + 1),
          productId: String(it.productId || it.id || idx + 1),
          productName: it.productName || it.name || 'Sản phẩm ' + (idx + 1),
          sku: it.sku || `SKU-${idx + 1}`,
          originalQty: Number(it.quantity || 1),
          returnedQty: 0,
          availableQty: Number(it.quantity || 1),
          quantity: Number(it.quantity || 1),
          price: Number(it.price || it.unitPrice || 0),
          subTotal: Number((it.quantity || 1) * (it.price || it.unitPrice || 0)),
          reason: 'Đổi trả hàng',
          condition: 'UNOPENED',
          isRestocked: true,
        }))
      : [
          {
            id: '1',
            productId: '1',
            productName: `Sản phẩm đơn hàng ${selectedSO.code}`,
            sku: `SKU-${selectedSO.code}`,
            originalQty: 1,
            returnedQty: 0,
            availableQty: 1,
            quantity: 1,
            price: Number(selectedSO.totalAmount || 0),
            subTotal: Number(selectedSO.totalAmount || 0),
            reason: 'Lỗi sản phẩm',
            condition: 'UNOPENED',
            isRestocked: true,
          },
        ];

    const grossTotal = mappedLines.reduce((sum, line) => sum + (line.quantity * line.price), 0);
    const netRefund = Math.max(0, grossTotal - (editing.deductionAmount || 0));

    setEditing((prev) => ({
      ...prev,
      orderCode: selectedSO.code,
      customerId: matchedCustomerId || prev.customerId || '1',
      returnLines: mappedLines,
      refundAmount: netRefund,
      createdBy: currentAccountName,
    }));

    if (matchedCrm) {
      toast.success(`Đã tự động liên kết Khách hàng CRM: ${matchedCrm.name} ${matchedCrm.phone ? `(${matchedCrm.phone})` : ''}`);
    } else if (targetName || targetPhone) {
      toast.info(`Đã nạp thông tin đơn gốc: ${targetName || 'Khách hàng'} ${targetPhone ? `(SĐT: ${targetPhone})` : ''}`);
    }
  };

  const handleLineQtyChange = (lineIndex: number, newQty: number) => {
    if (!editing.returnLines) return;
    const updatedLines = [...editing.returnLines];
    const line = updatedLines[lineIndex];
    const maxQty = line.availableQty ?? line.originalQty ?? 999;
    const clampedQty = Math.max(0, Math.min(maxQty, newQty));

    updatedLines[lineIndex] = {
      ...line,
      quantity: clampedQty,
      subTotal: clampedQty * line.price,
    };

    const grossTotal = updatedLines.reduce((sum, l) => sum + l.quantity * l.price, 0);
    const netRefund = Math.max(0, grossTotal - (editing.deductionAmount || 0));

    setEditing((prev) => ({
      ...prev,
      returnLines: updatedLines,
      refundAmount: netRefund,
    }));
  };

  const handleDeductionChange = (deduction: number) => {
    const lines = editing.returnLines || [];
    const grossTotal = lines.reduce((sum, l) => sum + l.quantity * l.price, 0);
    const netRefund = Math.max(0, grossTotal - deduction);

    setEditing((prev) => ({
      ...prev,
      deductionAmount: deduction,
      refundAmount: netRefund,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing.returnCode || !editing.orderCode) {
      toast.error('Vui lòng nhập Mã hoàn trả và Mã đơn gốc');
      return;
    }

    if (modalMode === 'edit' && !canInspectOrApprove(editing)) {
      toast.error(`🔒 Chỉ duy nhất Người kiểm tra được phân công (${editing.inspector}) hoặc Admin mới có quyền cập nhật!`);
      return;
    }

    const lines = editing.returnLines ?? [];
    if (lines.length === 0 || lines.every((l) => l.quantity === 0)) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm với số lượng > 0 để hoàn trả');
      return;
    }

    try {
      if (modalMode === 'create') {
        await addCustomerReturn({
          returnCode: editing.returnCode,
          orderCode: editing.orderCode,
          customerId: editing.customerId || '1',
          refundAmount: editing.refundAmount || 0,
          deductionAmount: editing.deductionAmount || 0,
          refundMethod: (editing.refundMethod as RefundMethod) || 'CASH',
          isRestocked: editing.isRestocked ?? true,
          returnBranchId: editing.returnBranchId || (branches[0]?.id ? String(branches[0].id) : '1'),
          warehouseId: editing.warehouseId || (availableZones[0]?.id ? String(availableZones[0].id) : 'WH-01'),
          locationId: editing.locationId || (availableRacks[0]?.id ? String(availableRacks[0].id) : 'BIN-A01'),
          returnLines: lines.filter((l) => l.quantity > 0),
          returnDate: editing.returnDate || new Date().toISOString().split('T')[0],
          reason: editing.reason || 'Khách hoàn trả',
          status: (editing.status as any) || 'PENDING_INSPECTION',
          inspector: editing.inspector || currentAccountName,
          createdBy: currentAccountName,
          notes: editing.notes,
        });
        toast.success('Tạo phiếu hoàn trả thành công!');
      } else if (editing.id) {
        await updateCustomerReturn(editing.id, {
          ...editing,
          createdBy: editing.createdBy || currentAccountName,
          inspector: editing.inspector || currentAccountName,
        } as Partial<CustomerReturnItem>);
        toast.success('Cập nhật phiếu hoàn trả thành công!');
      }
      setIsModalOpen(false);
      fetchCustomerReturns();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu phiếu hoàn trả.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      await deleteCustomerReturn(deleting.id);
      toast.success('Đã xóa phiếu hoàn trả!');
      if (selectedReturn?.id === deleting.id) setSelectedReturn(null);
      setDeleting(null);
      fetchCustomerReturns();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa phiếu hoàn trả.');
    }
  };

  const handleUpdateStatus = async (newStatus: CustomerReturnItem['status']) => {
    if (!selectedReturn) return;
    if (!canInspectOrApprove(selectedReturn)) {
      toast.error(`🔒 Chỉ người kiểm tra được phân công (${selectedReturn.inspector}) hoặc Quản trị viên mới được phép chuyển trạng thái phiếu này!`);
      return;
    }

    try {
      await updateCustomerReturn(selectedReturn.id, { status: newStatus });
      syncSelected({ ...selectedReturn, status: newStatus });
      toast.success(`Đã chuyển trạng thái phiếu hoàn sang: ${ERP_STATUS_LABELS[newStatus]?.label || newStatus}`);
      fetchCustomerReturns();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật trạng thái.');
    }
  };

  const resolveBranchName = (branchId: string) => {
    const found = branches.find((b: any) => String(b.id) === String(branchId) || b.code === branchId);
    if (found) return found.name || found.branchName;
    return BRANCH_NAME_BY_ID[branchId] || `Chi nhánh ID ${branchId}`;
  };

  const columns = useMemo<ColumnDef<CustomerReturnItem>[]>(
    () => [
      {
        accessorKey: 'returnCode',
        header: 'Mã hoàn trả',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn gốc',
        cell: (info) => <span className="font-mono text-gray-500 font-semibold">{info.getValue() as string || '—'}</span>,
      },
      {
        accessorKey: 'returnRequestCode',
        header: 'Mã yêu cầu (RR)',
        cell: (info) => {
          const val = info.getValue() as string;
          if (!val) return <span className="text-gray-400 font-mono text-xs">- (Trực tiếp)</span>;
          return (
            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200">
              {val}
            </span>
          );
        },
      },
      {
        id: 'customer',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <span className="font-medium text-gray-900 dark:text-white">
            {resolveCustomerName(row.original.customerId, customers)}
          </span>
        ),
      },
      {
        accessorKey: 'inspector',
        header: 'Người kiểm tra',
        cell: (info) => <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">{info.getValue() as string || 'Chưa phân công'}</span>,
      },
      {
        accessorKey: 'refundAmount',
        header: 'Số tiền hoàn',
        cell: (info) => (
          <span className="font-bold text-red-600 dark:text-red-400">
            {Number(info.getValue() || 0).toLocaleString('vi-VN')} ₫
          </span>
        ),
      },
      {
        accessorKey: 'refundMethod',
        header: 'Hình thức',
        cell: (info) => <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{REFUND_METHOD_LABELS[info.getValue() as RefundMethod] || (info.getValue() as string)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const st = info.getValue() as string;
          const config = ERP_STATUS_LABELS[st] || { label: st, style: 'bg-gray-100 text-gray-800' };
          return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.style}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedReturn(row.original)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setDeleting(row.original)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                title="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [customers, canManage]
  );

  const grossItemsVal = (editing.returnLines || []).reduce((sum, l) => sum + l.quantity * l.price, 0);

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Khách hàng trả hàng & hoàn tiền</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý đổi trả hàng bán và hoàn tiền khách hàng. Phân quyền duyệt riêng cho Người kiểm tra.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => toast.success('Xuất báo cáo hoàn trả thành công!')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download className="w-4 h-4" /> Xuất file Log
            </button>
            {canManage && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
              >
                <Plus className="w-4 h-4" /> Tạo phiếu hoàn trả mới
              </button>
            )}
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
              placeholder="Tìm kiếm mã hoàn trả, mã đơn gốc, tên khách hàng..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải dữ liệu hoàn trả...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedReturn(row)} />
        )}
      </div>

      {/* MODAL XEM CHI TIẾT */}
      <Modal
        isOpen={!!selectedReturn}
        onClose={() => setSelectedReturn(null)}
        title={selectedReturn ? `Phiếu hoàn trả: ${selectedReturn.returnCode}` : 'Chi tiết phiếu hoàn'}
        width="max-w-2xl"
      >
        {selectedReturn && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div>
                <p className="text-xs text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Tổng tiền hoàn thực tế</p>
                <p className="text-2xl font-black text-red-600 dark:text-red-400">{selectedReturn.refundAmount.toLocaleString('vi-VN')} ₫</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${ERP_STATUS_LABELS[selectedReturn.status]?.style || 'bg-gray-100'}`}>
                {ERP_STATUS_LABELS[selectedReturn.status]?.label || selectedReturn.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <span className="text-gray-500 block text-xs">Mã đơn hàng gốc:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedReturn.orderCode || '—'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <span className="text-gray-500 block text-xs">Khách hàng CRM:</span>
                <span className="font-bold text-gray-900 dark:text-white">{resolveCustomerName(selectedReturn.customerId, customers)}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <span className="text-gray-500 block text-xs">Người kiểm tra được phân công:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedReturn.inspector || 'Chưa phân công'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                <span className="text-gray-500 block text-xs">Chi nhánh & Kho nhận:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{resolveBranchName(selectedReturn.returnBranchId)}</span>
              </div>
            </div>

            {/* Security Banner if User is NOT the assigned inspector */}
            {!canInspectOrApprove(selectedReturn) && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200">
                <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">Quyền hạn ERP: Chỉ Người kiểm tra được chỉ định hoặc SUPER_ADMIN mới được duyệt phiếu này!</p>
                  <p>Phiếu này được giao cho: <span className="font-bold underline">{selectedReturn.inspector}</span>. Tài khoản của bạn ({currentAccountName}) chỉ có quyền xem chi tiết.</p>
                </div>
              </div>
            )}

            {selectedReturn.returnLines && selectedReturn.returnLines.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Sản phẩm hoàn trả ({selectedReturn.returnLines.length})</h4>
                <div className="border rounded-lg overflow-hidden text-xs">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="p-2 text-left">Sản phẩm</th>
                        <th className="p-2 text-center">SL Hoàn</th>
                        <th className="p-2 text-right">Đơn giá</th>
                        <th className="p-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {selectedReturn.returnLines.map((l, i) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">{l.productName} <span className="text-gray-400 font-mono">({l.sku})</span></td>
                          <td className="p-2 text-center font-bold text-emerald-600">{l.quantity}</td>
                          <td className="p-2 text-right">{l.price.toLocaleString('vi-VN')} ₫</td>
                          <td className="p-2 text-right font-bold">{(l.quantity * l.price).toLocaleString('vi-VN')} ₫</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Workflow Action Buttons with Inspector Authorization Enforced */}
            <div className="pt-4 border-t flex flex-wrap gap-2">
              {selectedReturn.status === 'PENDING_RECEIPT' && (
                <button
                  type="button"
                  disabled={!canInspectOrApprove(selectedReturn)}
                  onClick={() => handleUpdateStatus('PENDING_INSPECTION')}
                  className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1"
                >
                  ➜ Tiếp nhận hàng thực tế & Chuyển Kiểm định
                </button>
              )}
              {(selectedReturn.status === 'PENDING_INSPECTION' || selectedReturn.status === 'INSPECTING') && (
                <>
                  <button
                    type="button"
                    disabled={!canInspectOrApprove(selectedReturn)}
                    onClick={() => handleUpdateStatus('APPROVED')}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    ✓ Duyệt phiếu
                  </button>
                  <button
                    type="button"
                    disabled={!canInspectOrApprove(selectedReturn)}
                    onClick={() => handleUpdateStatus('REJECTED')}
                    className="py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold rounded-lg text-xs transition-colors"
                  >
                    ✕ Từ chối
                  </button>
                </>
              )}
              {selectedReturn.status === 'APPROVED' && (
                <button
                  type="button"
                  disabled={!canInspectOrApprove(selectedReturn)}
                  onClick={() => handleUpdateStatus('REFUND_PROCESSING')}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold rounded-lg text-xs transition-colors"
                >
                  ➜ Xử lý hoàn tiền
                </button>
              )}
              {selectedReturn.status === 'REFUND_PROCESSING' && (
                <button
                  type="button"
                  disabled={!canInspectOrApprove(selectedReturn)}
                  onClick={() => handleUpdateStatus('REFUNDED')}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-bold rounded-lg text-xs transition-colors"
                >
                  ✓ Xác nhận Đã hoàn tiền & Nhập kho
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL TẠO PHIẾU HOÀN TRẢ CHUẨN ERP */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo phiếu hoàn trả khách hàng' : 'Chỉnh sửa phiếu hoàn trả'}
        width="max-w-4xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* SECTION 1: THÔNG TIN CHUNG */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Package className="w-4 h-4" /> 1. Thông tin chung phiếu hoàn
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã hoàn trả (Auto) *</label>
                <input
                  type="text"
                  value={editing.returnCode || ''}
                  onChange={(e) => setEditing({ ...editing, returnCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã yêu cầu (RR - Không bắt buộc)</label>
                <select
                  value={editing.returnRequestCode || ''}
                  onChange={(e) => handleSelectReturnRequest(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-mono font-bold text-blue-600"
                >
                  <option value="">-- Khách trả trực tiếp (Không qua Yêu cầu) --</option>
                  {returnRequests
                    .filter((rr) => (rr.status === 'APPROVED' || rr.status === 'PARTIALLY_RETURNED') && rr.remainingQty > 0)
                    .map((rr) => (
                      <option key={rr.id} value={rr.requestCode}>
                        {rr.requestCode} - {rr.customerName || 'Khách'} (Đơn: {rr.orderCode}) [Còn được trả: {rr.remainingQty} SP]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn gốc (Chọn từ hệ thống) *</label>
                <select
                  value={editing.orderCode || ''}
                  onChange={(e) => handleSelectOriginalOrder(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-mono font-bold text-emerald-600"
                  required
                >
                  <option value="">-- Chọn đơn hàng gốc --</option>
                  {saleOrders.map((so) => {
                    const phoneStr = so.customerPhone || (so as any).recipientPhone ? ` | SĐT: ${so.customerPhone || (so as any).recipientPhone}` : '';
                    const nameStr = so.customerName || (so as any).recipientName || 'Khách mua';
                    return (
                      <option key={so.id} value={so.code}>
                        {so.code} - {nameStr}{phoneStr} ({Number(so.totalAmount || 0).toLocaleString('vi-VN')} ₫)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hoàn trả *</label>
                <input
                  type="date"
                  value={editing.returnDate || ''}
                  onChange={(e) => setEditing({ ...editing, returnDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
                  required
                />
              </div>
            </div>

            {/* Banner hiển thị Tiến độ Yêu cầu trả hàng nếu chọn RR */}
            {(() => {
              if (!editing.returnRequestCode) return null;
              const matchedRR = returnRequests.find((rr) => rr.requestCode === editing.returnRequestCode);
              if (!matchedRR) return null;

              return (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" /> Theo Yêu Cầu Trả Hàng {matchedRR.requestCode} (Hỗ trợ trả từng phần 1:N)
                    </span>
                    <span className="text-[10px] bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100 font-bold px-2 py-0.5 rounded-full">
                      Trạng thái RR: {matchedRR.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-900 dark:text-white pt-1">
                    <div>
                      <span className="text-gray-500 font-normal">SL Yêu cầu: </span>
                      <span className="text-blue-700 dark:text-blue-300 font-extrabold">{matchedRR.requestedQty} SP</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-normal">SL Đã nhận lại: </span>
                      <span className="text-emerald-600 font-extrabold">{matchedRR.returnedQty} SP</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-normal">SL Còn được tạo RET: </span>
                      <span className="text-purple-600 font-extrabold">{matchedRR.remainingQty} SP</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Banner hiển thị Tên Khách hàng & SĐT từ Đơn Online / POS */}
            {(() => {
              const activeSO = saleOrders.find((so) => so.code === editing.orderCode || `SO-${so.id}` === editing.orderCode || (so as any).orderCode === editing.orderCode);

              if (!activeSO) return null;
              const name = activeSO.customerName || (activeSO as any).recipientName || 'Khách hàng';
              const phone = activeSO.customerPhone || (activeSO as any).recipientPhone || '';

              return (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" /> Thông tin khách mua từ đơn gốc ({activeSO.origin || 'ONLINE/POS'})
                    </span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100 font-bold px-2 py-0.5 rounded-full">
                      Mã đơn: {activeSO.code}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-900 dark:text-white pt-1">
                    <div>
                      <span className="text-gray-500 font-normal">Họ & Tên KH: </span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{name}</span>
                    </div>
                    {phone && (
                      <div>
                        <span className="text-gray-500 font-normal">Số điện thoại (SĐT POS/Online): </span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">{phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* SECTION 2: CHI TIẾT DÒNG HÀNG TRẢ */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Box className="w-4 h-4" /> 2. Chi tiết danh sách sản phẩm trả (Được giới hạn theo Đơn Gốc)
              </h3>
            </div>

            {(!editing.returnLines || editing.returnLines.length === 0) ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                <p className="text-sm font-semibold text-gray-500">Vui lòng chọn <span className="text-emerald-600 font-bold">Mã đơn gốc</span> ở trên để nạp danh sách sản phẩm mua!</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold uppercase">
                    <tr>
                      <th className="p-2.5">Sản phẩm / SKU</th>
                      <th className="p-2.5 text-center">SL Mua</th>
                      <th className="p-2.5 text-center">Đã trả</th>
                      <th className="p-2.5 text-center text-emerald-600">Có thể trả</th>
                      <th className="p-2.5 text-center w-24">SL Hoàn *</th>
                      <th className="p-2.5 text-right">Đơn giá</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {editing.returnLines.map((line, idx) => (
                      <tr key={line.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="p-2.5">
                          <p className="font-bold text-gray-900 dark:text-white">{line.productName}</p>
                          <span className="font-mono text-gray-400 text-[11px]">{line.sku}</span>
                        </td>
                        <td className="p-2.5 text-center font-medium">{line.originalQty || 1}</td>
                        <td className="p-2.5 text-center font-medium text-gray-400">{line.returnedQty || 0}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-600">{line.availableQty || line.originalQty || 1}</td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={line.availableQty || line.originalQty || 999}
                            value={line.quantity}
                            onChange={(e) => handleLineQtyChange(idx, parseInt(e.target.value, 10) || 0)}
                            className="w-16 px-2 py-1 text-center font-bold text-emerald-600 border border-emerald-500 rounded bg-emerald-50 dark:bg-emerald-950/40"
                          />
                        </td>
                        <td className="p-2.5 text-right font-medium">{line.price.toLocaleString('vi-VN')} ₫</td>
                        <td className="p-2.5 text-right font-bold text-gray-900 dark:text-white">
                          {(line.quantity * line.price).toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECTION 3: TÍNH TOÁN THANH TOÁN & KHẤU TRỪ */}
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Wallet className="w-4 h-4" /> 3. Tính toán hoàn tiền & Phí khấu trừ
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                <span className="text-xs text-gray-500 block">Tổng tiền hàng hoàn:</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{grossItemsVal.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                <label className="text-xs text-gray-500 block mb-1">Phí khấu trừ / Trả hàng (₫):</label>
                <input
                  type="number"
                  min={0}
                  value={editing.deductionAmount || 0}
                  onChange={(e) => handleDeductionChange(Number(e.target.value) || 0)}
                  className="w-full px-2 py-1 border rounded text-red-600 font-bold text-sm"
                />
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-red-200">
                <span className="text-xs text-red-600 font-semibold block">Số tiền thực hoàn trả:</span>
                <span className="text-xl font-black text-red-600 dark:text-red-400">
                  {(editing.refundAmount || 0).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {/* DYNAMIC PAYMENT METHOD FIELDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hình thức hoàn tiền *</label>
                <select
                  value={editing.refundMethod || 'CASH'}
                  onChange={(e) => setEditing({ ...editing, refundMethod: e.target.value as RefundMethod })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-semibold"
                >
                  {(Object.keys(REFUND_METHOD_LABELS) as RefundMethod[]).map((k) => (
                    <option key={k} value={k}>{REFUND_METHOD_LABELS[k]}</option>
                  ))}
                </select>
              </div>

              {editing.refundMethod === 'CASH' && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 text-xs text-amber-800 dark:text-amber-300">
                  <span className="font-bold">Quỹ tiền mặt:</span> Xuất tiền trực tiếp từ Quỹ tiền mặt POS Chi nhánh.
                </div>
              )}

              {editing.refundMethod === 'BANK_TRANSFER' && (
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <input
                    type="text"
                    placeholder="Tên ngân hàng (VD: Vietcombank)"
                    value={editing.bankName || ''}
                    onChange={(e) => setEditing({ ...editing, bankName: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-gray-900 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Số tài khoản nhận"
                    value={editing.accountNumber || ''}
                    onChange={(e) => setEditing({ ...editing, accountNumber: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-gray-900 text-xs"
                  />
                </div>
              )}

              {editing.refundMethod === 'STORE_CREDIT' && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 text-xs text-blue-800 dark:text-blue-300">
                  <span className="font-bold">Ví Store Credit:</span> Số tiền hoàn sẽ được tự động tích hợp vào ví tài khoản CRM của khách.
                </div>
              )}

              {editing.refundMethod === 'ORIGINAL_CARD' && (
                <div className="col-span-2 sm:col-span-1">
                  <input
                    type="text"
                    placeholder="Mã giao dịch hoàn thẻ gốc (Transaction Ref)"
                    value={editing.transactionRef || ''}
                    onChange={(e) => setEditing({ ...editing, transactionRef: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-xs font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: TIẾP NHẬN & PHÂN BỔ KHO */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 4. Tiếp nhận & Phân bổ kho nhập lại (API Branch, WMS Zone & Rack)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh nhận hoàn (API) *</label>
                <select
                  value={editing.returnBranchId || (branches[0]?.id ? String(branches[0].id) : '1')}
                  onChange={(e) => {
                    const branchId = e.target.value;
                    const matchingZones = warehouseZones.filter((z) => !z.branchId || String(z.branchId) === String(branchId));
                    setEditing({
                      ...editing,
                      returnBranchId: branchId,
                      warehouseId: matchingZones[0]?.id ? String(matchingZones[0].id) : editing.warehouseId,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-semibold text-emerald-600"
                  required
                >
                  {branches.map((b: any) => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name || b.branchName || `Chi nhánh ${b.code}`}
                    </option>
                  ))}
                  {branches.length === 0 && (
                    Object.entries(BRANCH_NAME_BY_ID).map(([id, name]) => (
                      <option key={id} value={id}>{name}</option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kho nhận hoàn (API Warehouse Zone) *</label>
                <select
                  value={editing.warehouseId || ''}
                  onChange={(e) => {
                    const zoneId = e.target.value;
                    const matchingRacks = racks.filter((r) => !r.zoneId || String(r.zoneId) === String(zoneId));
                    setEditing({
                      ...editing,
                      warehouseId: zoneId,
                      locationId: matchingRacks[0]?.id ? String(matchingRacks[0].id) : editing.locationId,
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-semibold"
                  required
                >
                  {availableZones.map((zone: any) => (
                    <option key={zone.id} value={String(zone.id)}>
                      {zone.zoneName || `Kho Zone ${zone.zoneCode || zone.id}`} ({zone.branchName || 'Kho tổng'})
                    </option>
                  ))}
                  {availableZones.length === 0 && (
                    <>
                      <option value="WH-01">Kho phân phối Trung tâm (Hà Nội)</option>
                      <option value="WH-02">Kho hoàn trả - CH Quận 1 (TP.HCM)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vị trí Kệ / Bin (API WMS Rack) *</label>
                <select
                  value={editing.locationId || ''}
                  onChange={(e) => setEditing({ ...editing, locationId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-semibold"
                  required
                >
                  {availableRacks.map((rack: any) => (
                    <option key={rack.id} value={String(rack.id)}>
                      {rack.rackName || `Kệ Bin ${rack.rackCode || rack.id}`} ({rack.areaName || 'Khu A'})
                    </option>
                  ))}
                  {availableRacks.length === 0 && (
                    <>
                      <option value="BIN-A01">Kệ A - Bin A01 (Hàng mới)</option>
                      <option value="BIN-R02">Kệ RTV - Bin R02 (Chờ trả NCC)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5: TRẠNG THÁI & HỆ THỐNG */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 5. Trạng thái & Phân quyền Người kiểm tra
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái phiếu *</label>
                <select
                  value={editing.status || 'PENDING_INSPECTION'}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-bold text-emerald-600"
                >
                  <option value="DRAFT">Nháp</option>
                  <option value="PENDING_INSPECTION">Chờ kiểm tra</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REFUND_PROCESSING">Đang xử lý hoàn tiền</option>
                  <option value="REFUNDED">Đã hoàn tiền & Nhập kho</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người tạo (Tài khoản hiện tại)</label>
                <input
                  type="text"
                  value={editing.createdBy || currentAccountName}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người kiểm tra được giao *</label>
                <select
                  value={editing.inspector || ''}
                  onChange={(e) => setEditing({ ...editing, inspector: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm font-bold text-emerald-600"
                  required
                >
                  {users.map((u: any) => (
                    <option key={u.id} value={u.fullName || u.username}>
                      {u.fullName || u.username} ({u.role || 'Nhân viên'})
                    </option>
                  ))}
                  {users.length === 0 && (
                    <>
                      <option value={currentAccountName}>{currentAccountName} (Tài khoản hiện tại)</option>
                      <option value="Quản lý kho">Quản lý kho</option>
                      <option value="Kiểm định viên POS">Kiểm định viên POS</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú nghiệp vụ</label>
              <textarea
                value={editing.notes || ''}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                rows={2}
                placeholder="Ghi chú chi tiết lý do hoàn trả hoặc yêu cầu kiểm định..."
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md transition-all"
            >
              Lưu dữ liệu phiếu hoàn
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL XÓA */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Xóa phiếu hoàn trả" width="max-w-md">
        {deleting && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bạn có chắc chắn muốn xóa phiếu hoàn <span className="font-bold font-mono text-red-600">{deleting.returnCode}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className="px-4 py-2 border rounded-lg text-sm">
                Hủy
              </button>
              <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold">
                Xóa ngay
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
