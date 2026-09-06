import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router';
import {
  Plus, Search, Eye, Edit, Trash2, ArrowRightLeft, Calendar, FileText,
  Download, Printer, Package, Layers, AlertCircle, CheckCircle2, XCircle,
  Truck, Building2, User, ShieldAlert, PlusCircle, X, Check, RefreshCw,
  Lock, Unlock
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type StockTransferOrder, type StockTransferItem } from '../store/inventoryStore';
import { useBranchStore } from '@/features/system/store/branchStore';
import { useUserStore } from '@/features/hr/store/userStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { toast } from 'sonner';

export const StockTransferExecutionStatus = {
  DRAFT: 'DRAFT',
  READY_TO_SHIP: 'READY_TO_SHIP',
  IN_TRANSIT: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type StockTransferExecutionStatus = (typeof StockTransferExecutionStatus)[keyof typeof StockTransferExecutionStatus];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Bản nháp', cls: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-300' },
  PENDING_APPROVAL: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold' },
  APPROVED: { label: 'Đã duyệt (Chờ xuất)', cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold' },
  READY_TO_SHIP: { label: 'Chờ xuất kho', cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 font-semibold' },
  SHIPPED: { label: 'Đang vận chuyển (Đã xuất nguồn)', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 font-bold' },
  IN_TRANSIT: { label: 'Đang vận chuyển (Đã xuất nguồn)', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 font-bold' },
  RECEIVED: { label: 'Đã hoàn thành (Đã nhập đích)', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 font-bold' },
  COMPLETED: { label: 'Đã hoàn thành (Đã nhập đích)', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 font-bold' },
  CANCELLED: { label: 'Đã hủy', cls: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-200' },
};

export function StockTransferPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    stockTransfers: data,
    fetchStockTransfers,
    addStockTransfer,
    updateStockTransfer,
    deleteStockTransfer,
    shipStockTransfer,
    completeStockTransfer,
    products,
    fetchProducts,
    inventories,
    fetchInventories,
    transferRequests,
    fetchTransferRequests,
  } = useInventoryStore();

  const { branches, fetchBranches } = useBranchStore();
  const { users, fetchUsers } = useUserStore();
  const currentUser = useAuthStore((s) => s.user);

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selected, setSelected] = useState<StockTransferOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Editing state
  const [editingHeader, setEditingHeader] = useState<Partial<StockTransferOrder>>({});
  const [editingLines, setEditingLines] = useState<StockTransferItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Searchable Select state for Transfer Request in Modal
  const [requestSearch, setRequestSearch] = useState('');
  const [isRequestDropdownOpen, setIsRequestDropdownOpen] = useState(false);
  const requestDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (requestDropdownRef.current && !requestDropdownRef.current.contains(event.target as Node)) {
        setIsRequestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // User spec: Chỉ load danh sách các Yêu cầu Chuyển kho (TransferRequest) có trạng thái APPROVED (Đã duyệt) và PENDING_ISSUE (Chờ xuất).
  const eligibleRequests = useMemo(() => {
    return (transferRequests || []).filter((r) => {
      const st = (r.status || '').toUpperCase();
      return st === 'APPROVED' || st === 'PENDING_ISSUE';
    });
  }, [transferRequests]);

  const filteredEligibleRequests = useMemo(() => {
    const q = (requestSearch || '').toLowerCase().trim();
    if (!q) return eligibleRequests;
    return eligibleRequests.filter(
      (r) =>
        r.requestCode.toLowerCase().includes(q) ||
        (r.sourceHub && r.sourceHub.toLowerCase().includes(q)) ||
        (r.destinationHub && r.destinationHub.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q))
    );
  }, [eligibleRequests, requestSearch]);

  const isLinkedToRequest = Boolean(
    editingHeader.requestRefCode && editingHeader.requestRefCode.trim().length > 0
  );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchStockTransfers(),
          fetchTransferRequests(),
          fetchProducts(),
          fetchBranches(),
          fetchUsers(),
          fetchInventories(),
        ]);
      } catch (err) {
        console.error('API fetchStockTransfers error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchStockTransfers, fetchTransferRequests, fetchProducts, fetchBranches, fetchUsers, fetchInventories]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.transferNumber.toLowerCase().includes(q) ||
        (item.requestRefCode && item.requestRefCode.toLowerCase().includes(q)) ||
        item.sourceHub.toLowerCase().includes(q) ||
        item.destinationHub.toLowerCase().includes(q) ||
        (item.requestedBy && item.requestedBy.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, data]);

  const generateNextTransferCode = () => {
    const count = data.length + 501;
    const rand = Math.floor(Math.random() * 900 + 100);
    return `STX-${new Date().getFullYear()}-${count}-${rand}`;
  };

  const getAvailableStockForBranch = (productIdentifier: string | number, sourceBranchName?: string): number => {
    if (!productIdentifier) return 0;
    const targetProduct = products.find(
      (p) =>
        String(p.id) === String(productIdentifier) ||
        p.name === String(productIdentifier) ||
        p.sku === String(productIdentifier)
    );
    if (!targetProduct) return 0;
    if (!sourceBranchName) return targetProduct.onHand ?? 0;

    const cleanSource = sourceBranchName.toLowerCase().trim();
    const targetBranch = branches.find((b) => {
      const bName = (b.name || '').toLowerCase().trim();
      const bCode = (b.branchCode || '').toLowerCase().trim();
      return (
        bName === cleanSource ||
        cleanSource.includes(bName) ||
        bName.includes(cleanSource) ||
        (bCode && cleanSource.includes(bCode))
      );
    });

    const bId = targetBranch ? String(targetBranch.id) : '';

    // 1. Check branchStocks map (loaded directly from /inventories/balances)
    if (bId && targetProduct.branchStocks && targetProduct.branchStocks[bId] !== undefined) {
      return targetProduct.branchStocks[bId];
    }

    // 2. Check branchStockDetails
    if (targetProduct.branchStockDetails && targetProduct.branchStockDetails.length > 0) {
      const detail = targetProduct.branchStockDetails.find(
        (d) => (bId && String(d.branchId) === bId) || (d.branchName && d.branchName.toLowerCase().trim() === cleanSource)
      );
      if (detail) {
        return detail.available ?? detail.quantity ?? 0;
      }
    }

    // 3. Check inventories table
    if (inventories && inventories.length > 0) {
      const match = inventories.find((inv) => {
        const pMatch =
          String(inv.productId) === String(targetProduct.id) ||
          (inv.productCode && inv.productCode === targetProduct.sku) ||
          inv.productName === targetProduct.name;
        if (!pMatch) return false;
        if (bId && String(inv.branchId) === bId) return true;
        const invBranch = (inv.branchName || '').toLowerCase().trim();
        if (invBranch === cleanSource) return true;
        if (targetBranch && invBranch === (targetBranch.name || '').toLowerCase().trim()) return true;
        return false;
      });
      if (match) {
        return match.quantityAvailable ?? match.quantityOnHand ?? 0;
      }
    }

    // 4. If product has branchStocks map with other branches, but not this branch:
    if (targetProduct.branchStocks && Object.keys(targetProduct.branchStocks).length > 0) {
      return targetProduct.branchStocks[bId] || 0;
    }

    return targetProduct.onHand ?? 0;
  };

  // Handle URL param ?fromReq=STR-xxx to auto open modal with pre-selected request
  useEffect(() => {
    const fromReq = searchParams.get('fromReq') || searchParams.get('reqCode');
    if (fromReq && transferRequests.length > 0) {
      handleOpenCreateWithRequest(fromReq);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('fromReq');
          next.delete('reqCode');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, transferRequests]);

  // Event Trigger khi Chọn Đơn (onChange Transfer Request)
  const handleSelectTransferRequest = (requestCode: string) => {
    if (!requestCode) {
      // Bỏ chọn Đơn yêu cầu (Clear selection):
      // Reset Form về trạng thái Chuyển kho tự do (Mở khóa Kho xuất, Kho nhận, cho phép chọn/thêm sản phẩm thủ công)
      const defaultSource = branches.length > 0 ? branches[0].name : '';
      const defaultDest =
        branches.length > 1
          ? branches[1].name
          : branches.length > 0
          ? branches[0].name
          : '';
      const finalDest = defaultSource === defaultDest && branches.length > 1 ? branches[1].name : defaultDest;

      setEditingHeader((prev) => ({
        ...prev,
        requestRefCode: '',
        sourceHub: defaultSource,
        fromBranchId: branches[0] ? Number(branches[0].id) : undefined,
        destinationHub: finalDest,
        toBranchId: branches.length > 1 ? Number(branches[1].id) : (branches[0] ? Number(branches[0].id) : undefined),
        notes: 'Phiếu chuyển kho tự do.',
      }));
      setEditingLines([]);
      setRequestSearch('');
      setIsRequestDropdownOpen(false);
      toast.info('Đã hủy liên kết đơn yêu cầu. Mở khóa Kho xuất, Kho nhận và chuyển về chế độ Chuyển kho tự do.');
      return;
    }

    const req = transferRequests.find((r) => r.requestCode === requestCode);
    if (!req) {
      toast.error(`Không tìm thấy đơn yêu cầu ${requestCode}!`);
      return;
    }

    // Khi chọn một Mã yêu cầu:
    // 1. Clear toàn bộ Form State hiện tại.
    // 2. Auto-fill Kho xuất, Kho nhận từ Đơn yêu cầu và KHÓA (Read-only).
    // 3. Auto-fill danh sách Sản phẩm từ Đơn yêu cầu xuống Table.
    // 4. Disable/Ẩn nút + Thêm sản phẩm.
    const bSrc = branches.find(b => b.name === req.sourceHub || b.branchCode === req.sourceHub || String(b.id) === req.sourceHub);
    const bDest = branches.find(b => b.name === req.destinationHub || b.branchCode === req.destinationHub || String(b.id) === req.destinationHub);

    setEditingHeader({
      transferNumber: editingHeader.transferNumber || generateNextTransferCode(),
      requestRefCode: req.requestCode,
      sourceHub: bSrc ? bSrc.name : req.sourceHub,
      fromBranchId: bSrc ? Number(bSrc.id) : undefined,
      destinationHub: bDest ? bDest.name : req.destinationHub,
      toBranchId: bDest ? Number(bDest.id) : undefined,
      priority: req.priority || 'MEDIUM',
      reason: req.reason || 'Điều chuyển hàng theo yêu cầu đã duyệt',
      requestedBy: currentUser?.name || (users.length > 0 ? users[0].fullName : req.requestedBy),
      dispatchDate: new Date().toISOString().split('T')[0],
      estArrivalDate: req.expectedDate || '',
      logisticsPartner: 'Nội bộ (Đội xe công ty)',
      trackingRef: '',
      notes: req.notes
        ? `Thực hiện theo Yêu cầu ${req.requestCode}: ${req.notes}`
        : `Xuất chuyển kho theo Yêu cầu ${req.requestCode}`,
      status: StockTransferExecutionStatus.READY_TO_SHIP,
    });

    const loadedLines: StockTransferItem[] = (req.items || []).map((item) => {
      const matchedProduct = products.find(
        (p) => String(p.id) === item.productName || p.name === item.productName || p.sku === item.sku
      );
      const available = getAvailableStockForBranch(item.productName, req.sourceHub);
      const reqQty = Number(item.requestedQuantity || 1);
      const actualQty = Math.min(reqQty, available > 0 ? available : reqQty);
      const unitPrice = matchedProduct ? matchedProduct.costPrice || matchedProduct.price || 44000 : 44000;

      return {
        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        productName: item.productName,
        variant: item.variant || 'Mặc định',
        sku: item.sku || (matchedProduct ? matchedProduct.sku : 'SKU-AUTO'),
        availableQuantity: available,
        requestedQuantity: reqQty,
        quantity: actualQty,
        receivedQuantity: 0,
        unitPrice: unitPrice,
        amount: actualQty * unitPrice,
      };
    });

    setEditingLines(loadedLines);
    setRequestSearch('');
    setIsRequestDropdownOpen(false);
    toast.success(
      `Đã nạp ${loadedLines.length} sản phẩm từ Yêu Cầu Chuyển Kho ${req.requestCode}! Kho xuất (${req.sourceHub}) và Kho nhận (${req.destinationHub}) đã được khóa cố định.`
    );
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const defaultSource = branches.length > 0 ? branches[0].name : '';
    const defaultDest =
      branches.length > 1
        ? branches[1].name
        : branches.length > 0
        ? branches[0].name
        : '';
    const finalDest = defaultSource === defaultDest && branches.length > 1 ? branches[1].name : defaultDest;
    const defaultUser = currentUser?.name || (users.length > 0 ? users[0].fullName : 'Nguyễn Văn Hưng (Thủ kho)');

    setEditingHeader({
      transferNumber: generateNextTransferCode(),
      requestRefCode: '', // Mặc định chuyển tự do hoặc chọn từ dropdown
      sourceHub: defaultSource,
      fromBranchId: branches[0] ? Number(branches[0].id) : undefined,
      destinationHub: finalDest,
      toBranchId: branches.length > 1 ? Number(branches[1].id) : (branches[0] ? Number(branches[0].id) : undefined),
      priority: 'MEDIUM',
      reason: 'REBALANCE',
      requestedBy: defaultUser,
      dispatchDate: today,
      estArrivalDate: tomorrow.toISOString().split('T')[0],
      logisticsPartner: 'Nội bộ (Đội xe công ty)',
      trackingRef: '',
      notes: 'Phiếu chuyển kho mới.',
      status: StockTransferExecutionStatus.READY_TO_SHIP,
    });
    setEditingLines([]);
    setRequestSearch('');
    setIsRequestDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenCreateWithRequest = (reqCode: string) => {
    handleOpenCreate();
    setTimeout(() => {
      handleSelectTransferRequest(reqCode);
    }, 60);
  };

  const handleOpenEdit = (transfer: StockTransferOrder) => {
    setModalMode('edit');
    setEditingHeader(transfer);
    const linesWithStock = (transfer.items && transfer.items.length > 0 ? transfer.items : []).map((line) => ({
      ...line,
      availableQuantity: getAvailableStockForBranch(line.productName, transfer.sourceHub),
    }));
    setEditingLines(linesWithStock);
    setIsModalOpen(true);
  };

  const handleAddLineItem = () => {
    const inStockProduct = products.find((p) => getAvailableStockForBranch(p.id, editingHeader.sourceHub) > 0);
    const firstProduct = inStockProduct || (products.length > 0 ? products[0] : null);
    const available = firstProduct ? getAvailableStockForBranch(firstProduct.id, editingHeader.sourceHub) : 0;
    const defaultQty = available > 0 ? Math.min(10, available) : 1;
    const price = firstProduct ? (firstProduct.costPrice || firstProduct.price || 50000) : 50000;
    const newLine: StockTransferItem = {
      id: `line-${Date.now()}`,
      productName: firstProduct ? firstProduct.name : 'Sản phẩm mới',
      variant: firstProduct && firstProduct.variants && firstProduct.variants.length > 0 
        ? `${firstProduct.variants[0].color || ''} ${firstProduct.variants[0].size || ''}`.trim() 
        : 'Phiên bản chuẩn',
      sku: firstProduct ? firstProduct.sku : `SKU-TR-${Math.floor(100 + Math.random() * 900)}`,
      availableQuantity: available,
      requestedQuantity: defaultQty,
      quantity: defaultQty,
      receivedQuantity: 0,
      unitPrice: price,
      amount: price * defaultQty,
    };
    setEditingLines((prev) => [...prev, newLine]);
  };

  const handleSelectProductForLine = (index: number, selectedProductId: string) => {
    const p = products.find((prod) => String(prod.id) === selectedProductId);
    if (!p) return;
    const available = getAvailableStockForBranch(p.id, editingHeader.sourceHub);

    setEditingLines((prev) => {
      const next = [...prev];
      const qty = Number(next[index].quantity || 1);
      const price = Number(p.costPrice || p.price || 0);
      next[index] = {
        ...next[index],
        productName: p.name,
        sku: p.sku || next[index].sku,
        availableQuantity: available,
        variant: p.variants && p.variants.length > 0 
          ? `${p.variants[0].color || ''} ${p.variants[0].size || ''}`.trim() 
          : 'Mẫu tiêu chuẩn',
        unitPrice: price,
        amount: qty * price,
      };
      return next;
    });
  };

  const handleUpdateLine = (index: number, field: keyof StockTransferItem, value: any) => {
    setEditingLines((prev) => {
      const next = [...prev];
      const target = { ...next[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = Number(target.quantity || 0);
        const price = Number(target.unitPrice || 0);
        target.amount = qty * price;
      }
      next[index] = target;
      return next;
    });
  };

  const handleRemoveLine = (index: number) => {
    setEditingLines((prev) => prev.filter((_, i) => i !== index));
  };

  const formTotals = useMemo(() => {
    const totalVariants = editingLines.length;
    const totalUnits = editingLines.reduce((acc, line) => acc + Number(line.quantity || 0), 0);
    const totalValuation = editingLines.reduce((acc, line) => acc + Number(line.amount || 0), 0);
    return { totalVariants, totalUnits, totalValuation };
  }, [editingLines]);

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHeader.transferNumber || !editingHeader.sourceHub || !editingHeader.destinationHub) {
      toast.error('Vui lòng điền đầy đủ Mã phiếu, Kho xuất và Kho nhận!');
      return;
    }

    if (editingHeader.sourceHub === editingHeader.destinationHub) {
      toast.error('Kho xuất và Kho nhận không được giống nhau!');
      return;
    }

    if (!editingLines || editingLines.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 mặt hàng vào phiếu chuyển kho!');
      return;
    }

    const invalidLine = editingLines.find(l => !l.productName.trim() || Number(l.quantity) <= 0);
    if (invalidLine) {
      toast.error('Số lượng điều chuyển của tất cả các dòng phải lớn hơn 0!');
      return;
    }

    // Strict validation: Do not allow transfer quantity exceeding available inventory at sourceHub
    const exceededLine = editingLines.find((l) => {
      const available = l.availableQuantity !== undefined
        ? l.availableQuantity
        : getAvailableStockForBranch(l.productName, editingHeader.sourceHub);
      return Number(l.quantity) > available;
    });

    if (exceededLine) {
      const available = exceededLine.availableQuantity !== undefined
        ? exceededLine.availableQuantity
        : getAvailableStockForBranch(exceededLine.productName, editingHeader.sourceHub);
      toast.error(
        `Sản phẩm "${exceededLine.productName}" vượt quá tồn khả dụng tại kho xuất (${editingHeader.sourceHub || 'Kho xuất'}). Tồn khả dụng: ${available}, yêu cầu chuyển: ${exceededLine.quantity}! Vui lòng điều chỉnh lại.`
      );
      return;
    }

    const recordToSave: StockTransferOrder = {
      id: editingHeader.id || String(Date.now()),
      transferNumber: editingHeader.transferNumber || generateNextTransferCode(),
      requestRefCode: editingHeader.requestRefCode || '',
      fromBranchId: editingHeader.fromBranchId || (branches.find(b => b.name === editingHeader.sourceHub) ? Number(branches.find(b => b.name === editingHeader.sourceHub)!.id) : undefined),
      toBranchId: editingHeader.toBranchId || (branches.find(b => b.name === editingHeader.destinationHub) ? Number(branches.find(b => b.name === editingHeader.destinationHub)!.id) : undefined),
      sourceHub: editingHeader.sourceHub || (branches.length > 0 ? branches[0].name : ''),
      destinationHub: editingHeader.destinationHub || (branches.length > 1 ? branches[1].name : (branches[0]?.name || '')),
      dispatchDate: editingHeader.dispatchDate || new Date().toISOString().split('T')[0],
      estArrivalDate: editingHeader.estArrivalDate || '',
      totalUnits: formTotals.totalUnits,
      totalValuation: formTotals.totalValuation,
      status: editingHeader.status as any || StockTransferExecutionStatus.READY_TO_SHIP,
      logisticsPartner: editingHeader.logisticsPartner || 'Nội bộ (Đội xe công ty)',
      trackingRef: editingHeader.trackingRef || '',
      requestedBy: editingHeader.requestedBy || currentUser?.name || 'Nguyễn Văn Hưng',
      approvedBy: editingHeader.approvedBy || '',
      notes: editingHeader.notes || '',
      items: editingLines,
    };

    try {
      if (modalMode === 'create') {
        await addStockTransfer(recordToSave);
        toast.success(`Đã tạo Phiếu Chuyển Kho ${recordToSave.transferNumber}!`);
      } else if (editingHeader.id) {
        await updateStockTransfer(editingHeader.id, recordToSave);
        toast.success(`Đã cập nhật Phiếu Chuyển Kho ${recordToSave.transferNumber}!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('API save stock transfer error:', err);
      toast.error('Lỗi khi lưu phiếu chuyển kho.');
    }
  };

  const handleShipStock = async (item: StockTransferOrder) => {
    try {
      await shipStockTransfer(item.id);
      toast.success(`ĐÃ XUẤT KHO NGUỒN! Đã trừ tồn kho tại ${item.sourceHub} và chuyển trạng thái Đang vận chuyển.`);
      fetchStockTransfers();
      if (selected?.id === item.id) {
        setSelected({ ...item, status: 'IN_TRANSIT' });
      }
    } catch (err: any) {
      console.error('API ship stock error:', err);
      toast.error(err?.message || err?.reason || 'Lỗi khi thực hiện xuất kho nguồn.');
    }
  };

  const handleCompleteStock = async (item: StockTransferOrder) => {
    try {
      await completeStockTransfer(item.id, 'Đã nhận đủ hàng tại kho nhận');
      toast.success(`ĐÃ NHẬP KHO ĐÍCH! Đã cộng tồn kho tại ${item.destinationHub} và ghi nhận StockLedger.`);
      fetchStockTransfers();
      if (selected?.id === item.id) {
        setSelected({ ...item, status: 'COMPLETED' });
      }
    } catch (err: any) {
      console.error('API complete stock error:', err);
      toast.error(err?.message || err?.reason || 'Lỗi khi thực hiện nhập kho đích.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingId) {
      try {
        await deleteStockTransfer(deletingId);
        toast.success('Đã xóa phiếu chuyển kho!');
        setDeletingId(null);
        if (selected?.id === deletingId) setSelected(null);
      } catch (err) {
        console.error('API delete stock transfer error:', err);
        toast.error('Lỗi khi xóa phiếu chuyển kho.');
      }
    }
  };

  const formatCurrency = (val?: number) => {
    return (val || 0).toLocaleString('vi-VN') + ' ₫';
  };

  const columns = useMemo<ColumnDef<StockTransferOrder>[]>(
    () => [
      {
        accessorKey: 'transferNumber',
        header: 'Mã phiếu xuất',
        cell: (info) => (
          <div>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs block w-fit">
              {info.getValue() as string}
            </span>
            {info.row.original.requestRefCode && (
              <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                Từ YC: {info.row.original.requestRefCode}
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'sourceHub',
        header: 'Kho xuất (Nguồn)',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'destinationHub',
        header: 'Kho nhận (Đích)',
        cell: (info) => <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalUnits',
        header: 'Số lượng thực xuất',
        cell: ({ row }) => (
          <div className="text-xs">
            <span className="font-mono font-bold text-gray-900 dark:text-white">{row.original.totalUnits} sản phẩm</span>
            <span className="text-[11px] text-gray-400 block font-semibold">
              {row.original.items ? row.original.items.length : 1} variant
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'totalValuation',
        header: 'Tổng giá trị',
        cell: ({ row }) => {
          const val = row.original.totalValuation;
          if (val && Number(val) > 0) {
            return <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">{formatCurrency(Number(val))}</span>;
          }
          const itemsTotal = (row.original.items || []).reduce(
            (acc, it) => acc + (Number(it.amount) || Number(it.quantity || 0) * Number(it.unitPrice || 50000)),
            0
          );
          const fallback = itemsTotal > 0 ? itemsTotal : (Number(row.original.totalUnits) || 1) * 50000;
          return <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold text-sm">{formatCurrency(fallback)}</span>;
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const cfg = STATUS_MAP[status] || { label: status, cls: 'bg-gray-100 text-gray-800 border-gray-200' };
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${cfg.cls}`}>{cfg.label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác thực hiện',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors"
              title="Xem chi tiết chứng từ"
            >
              <Eye className="w-4 h-4" />
            </button>
            {((row.original.status as string) === 'READY_TO_SHIP' || (row.original.status as string) === 'PENDING_APPROVAL' || (row.original.status as string) === 'APPROVED' || (row.original.status as string) === 'DRAFT') && (
              <button
                onClick={(e) => { e.stopPropagation(); handleShipStock(row.original); }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Xuất kho nguồn (Trừ tồn nguồn)"
              >
                <Truck className="w-3.5 h-3.5" /> Xuất kho
              </button>
            )}
            {((row.original.status as string) === 'IN_TRANSIT' || (row.original.status as string) === 'SHIPPED') && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCompleteStock(row.original); }}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                title="Nhập kho đích (Cộng tồn đích)"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Nhập kho
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
              title="Chỉnh sửa phiếu"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingId(row.original.id); }}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Xóa phiếu"
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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="text-emerald-600" /> Quản lý Phiếu Chuyển Kho
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý danh sách phiếu chuyển kho thực tế giữa các chi nhánh, theo dõi tiến độ vận chuyển và nhập kho.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-xs font-bold shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Lập Phiếu Chuyển Kho Mới
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex items-center gap-3 w-full sm:w-2/3">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm phiếu chuyển kho theo Mã phiếu, Yêu cầu liên kết, Kho xuất, Kho nhận..."
            className="w-full bg-transparent outline-none text-xs text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-gray-400 whitespace-nowrap">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value={StockTransferExecutionStatus.READY_TO_SHIP}>Chờ xuất kho</option>
            <option value={StockTransferExecutionStatus.IN_TRANSIT}>Đang vận chuyển (Đã xuất nguồn)</option>
            <option value={StockTransferExecutionStatus.COMPLETED}>Đã hoàn thành (Đã nhập đích)</option>
            <option value={StockTransferExecutionStatus.CANCELLED}>Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 shadow-sm">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-500">Đang tải danh sách phiếu chuyển kho từ API...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      {/* ── Modal Xem Chi Tiết Phiếu Chuyển Kho Thực Hiện ──────────────────────── */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Chứng Từ Chuyển Kho: ${selected.transferNumber}` : 'Chi Tiết Phiếu'}
        width="max-w-3xl"
      >
        {selected && (
          <div className="space-y-6 text-xs text-gray-700 dark:text-gray-300">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {selected.transferNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_MAP[selected.status]?.cls}`}>
                  {STATUS_MAP[selected.status]?.label || selected.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {((selected.status as string) === 'READY_TO_SHIP' || (selected.status as string) === 'PENDING_APPROVAL' || (selected.status as string) === 'APPROVED' || (selected.status as string) === 'DRAFT') && (
                  <button
                    onClick={() => handleShipStock(selected)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Truck className="w-4 h-4" /> Xuất Kho Nguồn (Trừ Tồn Nguồn)
                  </button>
                )}
                {((selected.status as string) === 'IN_TRANSIT' || (selected.status as string) === 'SHIPPED') && (
                  <button
                    onClick={() => handleCompleteStock(selected)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Nhập Kho Đích (Cộng Tồn Đích)
                  </button>
                )}
                <button
                  onClick={() => toast.success(`Đang gửi lệnh in chứng từ ${selected.transferNumber}...`)}
                  className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold text-xs shadow-sm flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" /> In Chứng Từ
                </button>
              </div>
            </div>

            {/* 1. Header Information */}
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" /> 1. Thông tin chứng từ chuyển kho
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Mã phiếu xuất</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{selected.transferNumber}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Theo Yêu cầu số</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{selected.requestRefCode || 'Không có'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Kho / Chi nhánh xuất</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selected.sourceHub}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Kho / Chi nhánh nhận</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selected.destinationHub}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Ngày xuất hàng</span>
                  <span className="font-mono text-gray-900 dark:text-white">{selected.dispatchDate}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Người thực hiện xuất</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selected.shippedBy || selected.requestedBy}</span>
                </div>
              </div>
            </div>

            {/* 2. Item details table with Shipped & Received Qty */}
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" /> 2. Danh mục sản phẩm & Số lượng thực xuất / thực nhập
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 text-[11px] font-bold uppercase tracking-wider">
                      <th className="p-2.5 border-b">#</th>
                      <th className="p-2.5 border-b">Sản phẩm</th>
                      <th className="p-2.5 border-b">Variant / SKU</th>
                      <th className="p-2.5 border-b text-right">SL Yêu cầu</th>
                      <th className="p-2.5 border-b text-right">SL Thực xuất</th>
                      <th className="p-2.5 border-b text-right">SL Thực nhận</th>
                      <th className="p-2.5 border-b text-right">Đơn giá</th>
                      <th className="p-2.5 border-b text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                    {(selected.items || []).map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                        <td className="p-2.5 text-gray-400 font-mono">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-gray-900 dark:text-white">{item.productName}</td>
                        <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          <div>{item.variant}</div>
                          <div className="text-[10px] text-gray-400">{item.sku}</div>
                        </td>
                        <td className="p-2.5 text-right font-mono text-gray-500 font-semibold">
                          {item.requestedQuantity ?? item.quantity} sp
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.quantity} sp
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {selected.status === 'COMPLETED' ? item.quantity : (item.receivedQuantity || 0)} sp
                        </td>
                        <td className="p-2.5 text-right font-mono text-gray-600 dark:text-gray-400">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Totals summary */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-center">
              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số variant</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {selected.items ? selected.items.length : 0} variant
                </p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số lượng thực xuất</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 font-mono">
                  {selected.totalUnits} sản phẩm
                </p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng giá trị xuất kho</span>
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                  {formatCurrency(selected.totalValuation)}
                </p>
              </div>
            </div>

            {/* 4. Logistics */}
            <div>
              <h4 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600" /> 3. Thông tin vận chuyển & Tracking
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Đối tác vận chuyển</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selected.logisticsPartner || 'Nội bộ'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Mã vận đơn / Tracking</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{selected.trackingRef || 'Không có'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">ETA nhận hàng</span>
                  <span className="font-mono text-gray-900 dark:text-white">{selected.estArrivalDate || 'Chưa cập nhật'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[11px] block mb-0.5">Trạng thái tồn kho</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selected.status === 'COMPLETED' ? 'Đã tác động tồn kho' : 'Đang xử lý'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setSelected(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-xs"
              >
                Đóng Hộp Thoại
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal Lập / Chỉnh sửa Phiếu Chuyển Kho Thực Hiện ──────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Lập Phiếu Chuyển Kho Mới (Goods Transfer Note)' : 'Chỉnh Sửa Chứng Từ Chuyển Kho'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSaveTransfer} className="space-y-5 text-xs">
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] border-b pb-1">
              1. Thông tin chứng từ chuyển kho
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Mã phiếu xuất *</label>
                <input
                  type="text"
                  value={editingHeader.transferNumber || ''}
                  onChange={(e) => setEditingHeader({ ...editingHeader, transferNumber: e.target.value })}
                  required
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono font-bold text-emerald-600"
                />
              </div>

              {/* 1.2. Theo Yêu cầu số: Dropdown / Searchable Select */}
              <div className="relative" ref={requestDropdownRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-gray-700 dark:text-gray-300">
                    Theo Yêu cầu số
                  </label>
                  {isLinkedToRequest ? (
                    <button
                      type="button"
                      onClick={() => handleSelectTransferRequest('')}
                      className="text-[10px] text-red-500 hover:text-red-700 dark:text-red-400 font-semibold flex items-center gap-0.5 cursor-pointer"
                      title="Bỏ chọn đơn yêu cầu để chuyển tự do"
                    >
                      <X className="w-3 h-3" /> Bỏ chọn
                    </button>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-normal">
                      (Chỉ hiện Đã duyệt / Chờ xuất)
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={isRequestDropdownOpen ? requestSearch : (editingHeader.requestRefCode || '')}
                    onChange={(e) => {
                      setRequestSearch(e.target.value);
                      setIsRequestDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setRequestSearch('');
                      setIsRequestDropdownOpen(true);
                    }}
                    placeholder={
                      isLinkedToRequest
                        ? editingHeader.requestRefCode
                        : '🔍 Chọn hoặc tìm Mã yêu cầu (VD: STR-2026-001)...'
                    }
                    className={`w-full p-2 pr-8 bg-white dark:bg-gray-800 border-2 rounded-lg font-mono font-bold text-xs transition-all ${
                      isLinkedToRequest
                        ? 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/30'
                        : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'
                    }`}
                  />
                  {isLinkedToRequest ? (
                    <button
                      type="button"
                      onClick={() => handleSelectTransferRequest('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-0.5"
                      title="Hủy liên kết đơn"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsRequestDropdownOpen(!isRequestDropdownOpen)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown menu displaying only APPROVED & PENDING_ISSUE */}
                {isRequestDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/60">
                    <div
                      onClick={() => {
                        handleSelectTransferRequest('');
                      }}
                      className="p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-xs flex items-center justify-between text-gray-500"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        -- [Chuyển tự do] Không theo yêu cầu --
                      </span>
                      {!isLinkedToRequest && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>

                    {filteredEligibleRequests.length > 0 ? (
                      filteredEligibleRequests.map((req) => (
                        <div
                          key={req.id}
                          onClick={() => {
                            handleSelectTransferRequest(req.requestCode);
                          }}
                          className={`p-2.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer transition-colors ${
                            editingHeader.requestRefCode === req.requestCode
                              ? 'bg-amber-50 dark:bg-amber-950/50 font-bold border-l-4 border-amber-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                              {req.requestCode}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              {req.status === 'APPROVED' ? 'ĐÃ DUYỆT' : 'CHỜ XUẤT'}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium">{req.sourceHub}</span>
                            <span>➔</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              {req.destinationHub}
                            </span>
                            <span className="text-gray-400">({req.items?.length || 0} SP)</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-400">
                        Không tìm thấy đơn yêu cầu nào phù hợp (Chỉ hiển thị đơn ĐÃ DUYỆT / CHỜ XUẤT)
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>Người lập phiếu *</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium">
                    <Lock className="w-2.5 h-2.5" /> Khóa cố định theo tài khoản
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentUser?.name || currentUser?.fullName || editingHeader.requestedBy || 'System Admin'}
                    readOnly
                    disabled
                    className="w-full p-2 bg-gray-100 dark:bg-gray-900/80 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 cursor-not-allowed pl-8"
                  />
                  <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>Kho / Chi nhánh xuất *</span>
                  {isLinkedToRequest && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium">
                      <Lock className="w-2.5 h-2.5" /> Khóa theo Yêu cầu
                    </span>
                  )}
                </label>
                <select
                  value={editingHeader.sourceHub || ''}
                  disabled={isLinkedToRequest}
                  onChange={(e) => {
                    const newSource = e.target.value;
                    const bObj = branches.find((b) => b.name === newSource);
                    let newDest = editingHeader.destinationHub;
                    if (newDest === newSource) {
                      const other = branches.find((b) => b.name !== newSource);
                      newDest = other ? other.name : '';
                    }
                    const destObj = branches.find((b) => b.name === newDest);
                    setEditingHeader({
                      ...editingHeader,
                      sourceHub: newSource,
                      fromBranchId: bObj ? Number(bObj.id) : undefined,
                      destinationHub: newDest,
                      toBranchId: destObj ? Number(destObj.id) : undefined,
                    });
                    setEditingLines((prev) =>
                      prev.map((l) => ({
                        ...l,
                        availableQuantity: getAvailableStockForBranch(l.productName, newSource),
                      }))
                    );
                  }}
                  className={`w-full p-2 rounded-lg font-bold text-gray-900 dark:text-white ${
                    isLinkedToRequest
                      ? 'bg-gray-100 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 border border-amber-300 dark:border-amber-700 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.id} value={b.name} disabled={b.name === editingHeader.destinationHub}>
                        {b.name} ({b.branchCode}) {b.name === editingHeader.destinationHub ? '(Đang là kho nhận)' : ''}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Đang tải chi nhánh từ hệ thống...</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>Kho / Chi nhánh nhận *</span>
                  {isLinkedToRequest && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-medium">
                      <Lock className="w-2.5 h-2.5" /> Khóa theo Yêu cầu
                    </span>
                  )}
                </label>
                <select
                  value={editingHeader.destinationHub || ''}
                  disabled={isLinkedToRequest}
                  onChange={(e) => {
                    const newDest = e.target.value;
                    const destObj = branches.find((b) => b.name === newDest);
                    let newSource = editingHeader.sourceHub;
                    if (newSource === newDest) {
                      const other = branches.find((b) => b.name !== newDest);
                      newSource = other ? other.name : '';
                    }
                    const bObj = branches.find((b) => b.name === newSource);
                    setEditingHeader({
                      ...editingHeader,
                      destinationHub: newDest,
                      toBranchId: destObj ? Number(destObj.id) : undefined,
                      sourceHub: newSource,
                      fromBranchId: bObj ? Number(bObj.id) : undefined,
                    });
                  }}
                  className={`w-full p-2 rounded-lg font-bold text-emerald-600 dark:text-emerald-400 ${
                    isLinkedToRequest
                      ? 'bg-gray-100 dark:bg-gray-900/80 text-gray-600 dark:text-gray-300 border border-amber-300 dark:border-amber-700 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {branches.length > 0 ? (
                    branches.map((b) => (
                      <option key={b.id} value={b.name} disabled={b.name === editingHeader.sourceHub}>
                        {b.name} ({b.branchCode}) {b.name === editingHeader.sourceHub ? '(Đang là kho xuất)' : ''}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Đang tải chi nhánh từ hệ thống...</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Trạng thái xử lý</label>
                <select
                  value={editingHeader.status || StockTransferExecutionStatus.READY_TO_SHIP}
                  onChange={(e) => setEditingHeader({ ...editingHeader, status: e.target.value as StockTransferExecutionStatus })}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-bold"
                >
                  <option value={StockTransferExecutionStatus.READY_TO_SHIP}>Chờ xuất kho</option>
                  <option value={StockTransferExecutionStatus.IN_TRANSIT}>Đang vận chuyển (Đã xuất nguồn)</option>
                  <option value={StockTransferExecutionStatus.COMPLETED}>Đã hoàn thành (Đã nhập đích)</option>
                  <option value={StockTransferExecutionStatus.CANCELLED}>Đã hủy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Items list */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" /> 2. Chi tiết mặt hàng xuất chuyển kho
              </h4>
              {!isLinkedToRequest ? (
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Thêm sản phẩm
                </button>
              ) : (
                <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Danh mục sản phẩm cố định theo đơn yêu cầu ({editingHeader.requestRefCode})
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-500 text-[10px] font-bold uppercase tracking-wider border-b">
                    <th className="pb-1 w-48">Sản phẩm</th>
                    <th className="pb-1 w-32">Variant / SKU</th>
                    <th className="pb-1 text-right w-24">Tồn khả dụng</th>
                    <th className="pb-1 text-right w-24">SL Yêu cầu</th>
                    <th className="pb-1 text-right w-24">SL Thực xuất *</th>
                    <th className="pb-1 text-right w-28">Đơn giá (đ)</th>
                    <th className="pb-1 text-right w-32">Thành tiền (đ)</th>
                    <th className="pb-1 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {editingLines.map((line, idx) => {
                    const avail = line.availableQuantity !== undefined
                      ? line.availableQuantity
                      : getAvailableStockForBranch(line.productName, editingHeader.sourceHub);
                    const isExceeded = Number(line.quantity) > avail;

                    return (
                    <tr key={line.id || idx}>
                      <td className="py-2 pr-2">
                        {isLinkedToRequest ? (
                          <div className="py-1">
                            <span className="font-bold text-gray-900 dark:text-white block text-xs">
                              {line.productName}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              Mã: {line.sku || 'N/A'}
                            </span>
                          </div>
                        ) : products.length > 0 ? (
                          <select
                            value={products.find((p) => p.name === line.productName)?.id || ''}
                            onChange={(e) => handleSelectProductForLine(idx, e.target.value)}
                            className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-bold text-gray-900 dark:text-white"
                          >
                            <option value="">-- Chọn sản phẩm ({products.length} sp) --</option>
                            {[...products]
                              .sort((a, b) => {
                                const stockA = getAvailableStockForBranch(a.id, editingHeader.sourceHub);
                                const stockB = getAvailableStockForBranch(b.id, editingHeader.sourceHub);
                                return stockB - stockA;
                              })
                              .map((p) => {
                                const avail = getAvailableStockForBranch(p.id, editingHeader.sourceHub);
                                return (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.sku}) — Tồn: {avail} {p.unit || 'sp'}
                                  </option>
                                );
                              })}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={line.productName}
                            onChange={(e) => handleUpdateLine(idx, 'productName', e.target.value)}
                            className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-bold"
                            placeholder="Tên sản phẩm"
                            required
                          />
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        {isLinkedToRequest ? (
                          <div className="py-1">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
                              {line.variant || 'Mặc định'}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">
                              SKU: {line.sku || 'N/A'}
                            </span>
                          </div>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={line.variant}
                              onChange={(e) => handleUpdateLine(idx, 'variant', e.target.value)}
                              className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs text-emerald-600 font-semibold mb-1"
                              placeholder="Variant"
                              required
                            />
                            <input
                              type="text"
                              value={line.sku}
                              onChange={(e) => handleUpdateLine(idx, 'sku', e.target.value)}
                              className="w-full p-1 bg-white dark:bg-gray-800 border rounded text-[10px] font-mono text-gray-500"
                              placeholder="SKU"
                            />
                          </>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          isExceeded
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          {avail}
                        </span>
                      </td>
                      <td className="py-2 pr-2 text-right font-mono text-gray-500 font-semibold">
                        {line.requestedQuantity ?? line.quantity}
                      </td>
                      <td className="py-2 pr-2">
                        <div>
                          <input
                            type="number"
                            min={0.01}
                            step="any"
                            value={line.quantity}
                            onChange={(e) => handleUpdateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className={`w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-mono font-bold text-right ${
                              isExceeded ? 'border-rose-500 ring-1 ring-rose-500 text-rose-600 bg-rose-50 dark:bg-rose-950/20' : ''
                            }`}
                            required
                          />
                          {isExceeded && (
                            <p className="text-[10px] text-rose-600 font-semibold mt-0.5 text-right">Vượt tồn!</p>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={line.unitPrice}
                          onChange={(e) => handleUpdateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full p-1.5 bg-white dark:bg-gray-800 border rounded text-xs font-mono text-right"
                          required
                        />
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(line.amount)}
                      </td>
                      <td className="py-2 text-center">
                        {editingLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {editingLines.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-400 dark:text-gray-500">
                      <Package className="w-7 h-7 mx-auto mb-1 text-gray-300 dark:text-gray-600" />
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Chưa có sản phẩm nào trong phiếu chuyển kho
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {isLinkedToRequest
                          ? 'Đơn yêu cầu này không có mặt hàng nào.'
                          : 'Vui lòng chọn một Đơn yêu cầu ở trên hoặc bấm "+ Thêm sản phẩm" để thêm mặt hàng thủ công.'}
                      </p>
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-center">
              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số variant</span>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">
                  {formTotals.totalVariants} variant
                </p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng số lượng thực xuất</span>
                <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5 font-mono">
                  {formTotals.totalUnits} sản phẩm
                </p>
              </div>
              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng giá trị xuất kho</span>
                <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                  {formatCurrency(formTotals.totalValuation)}
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Logistics */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800">
            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] border-b pb-1">
              3. Vận chuyển & Tracking (Optional)
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Đối tác vận chuyển</label>
                <input
                  type="text"
                  value={editingHeader.logisticsPartner || ''}
                  onChange={(e) => setEditingHeader({ ...editingHeader, logisticsPartner: e.target.value })}
                  placeholder="Nội bộ / Viettel Post..."
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Mã vận đơn / Tracking</label>
                <input
                  type="text"
                  value={editingHeader.trackingRef || ''}
                  onChange={(e) => setEditingHeader({ ...editingHeader, trackingRef: e.target.value })}
                  placeholder="Nhập mã vận đơn..."
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Ngày xuất kho</label>
                <input
                  type="date"
                  value={editingHeader.dispatchDate || ''}
                  onChange={(e) => setEditingHeader({ ...editingHeader, dispatchDate: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer"
            >
              Lưu Phiếu Chuyển Kho
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Xác nhận xóa phiếu chuyển kho"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-700 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa phiếu chuyển kho này?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletingId(null)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 cursor-pointer"
            >
              Xóa phiếu
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
