import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Building2, Calendar, FileText, CheckCircle2, Box, Edit, Trash2, X, Package, Clock, TrendingUp, Ban } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { CurrencyInput } from '@/shared/components/ui/CurrencyInput';
import { FileDropzone } from '@/shared/components/ui/FileDropzone';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type ImportReceiptItem } from '../store/inventoryStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

const fmtVND = (n: number) => n.toLocaleString('vi-VN') + ' ₫';

export function ImportReceiptsPage() {
  const {
    importReceipts: data,
    fetchImportReceipts,
    addImportReceipt,
    updateImportReceipt,
    deleteImportReceipt,
    cancelImportReceipt,
    products,
    fetchProducts,
    warehouseBins,
    fetchWarehouseBins
  } = useInventoryStore();

  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<ImportReceiptItem | null>(null);
  const [cancellingReceipt, setCancellingReceipt] = useState<ImportReceiptItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingReceipt, setEditingReceipt] = useState<Partial<ImportReceiptItem>>({});
  const [deletingReceipt, setDeletingReceipt] = useState<ImportReceiptItem | null>(null);

  const [selectedPoDetails, setSelectedPoDetails] = useState<any | null>(null);
  
  useEffect(() => {
    if (selectedReceipt && selectedReceipt.poNumber) {
      axiosClient.get(`/purchase/orders?search=${selectedReceipt.poNumber}`)
        .then((res: any) => {
          const list = res.data?.content || res.content || res.data || [];
          if (Array.isArray(list) && list.length > 0) {
            const matched = list.find((o: any) => o.poCode === selectedReceipt.poNumber);
            if (matched) {
              setSelectedPoDetails(matched);
            }
          }
        })
        .catch(() => {});
    } else {
      setSelectedPoDetails(null);
    }
  }, [selectedReceipt]);

  const handleReceiveRemaining = () => {
    if (!selectedReceipt || !selectedPoDetails) return;
    
    const remainingLines = selectedReceipt.lines.map((line) => {
      const prod = products.find(p => String(p.id) === String(line.productVariantId)) ||
        products.find(p => p.sku === line.sku);
      const prodName = line.productName || prod?.name || `Biến thể #${line.productVariantId}`;
      const poLine = selectedPoDetails.details?.find((d: any) => d.productName === prodName || d.productCode === line.sku);
      const orderedQty = poLine ? Number(poLine.quantity) : 0;
      const receivedQty = Number(line.quantity);
      const missingQty = Math.max(0, orderedQty - receivedQty);
      return {
        ...line,
        quantity: missingQty,
      };
    }).filter(l => l.quantity > 0);

    if (remainingLines.length === 0) {
      toast.info('Tất cả các sản phẩm đã được nhận đủ so với PO!');
      return;
    }

    setModalMode('create');
    setEditingReceipt({
      grnNumber: `GRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      poNumber: selectedReceipt.poNumber,
      supplierName: selectedReceipt.supplierName,
      supplierId: (selectedReceipt as any).supplierId,
      receivingStore: selectedReceipt.receivingStore,
      branchId: (selectedReceipt as any).branchId,
      receivedDate: new Date().toISOString().split('T')[0],
      totalItems: remainingLines.reduce((acc, l) => acc + l.quantity, 0),
      acceptedItems: remainingLines.reduce((acc, l) => acc + l.quantity, 0),
      rejectedItems: 0,
      totalValuation: remainingLines.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0),
      status: 'PENDING_INSPECTION',
      inspectedBy: '',
      notes: `Nhận bổ sung cho phiếu ${selectedReceipt.grnNumber}`,
      lines: remainingLines.map(l => ({
        productVariantId: l.productVariantId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        targetBinId: l.targetBinId,
        batchCode: `BATCH-${Date.now().toString().slice(-4)}`,
        manufactureDate: new Date().toISOString().split('T')[0],
        expiryDate: l.expiryDate || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
      }))
    } as any);

    setSelectedReceipt(null);
    setIsModalOpen(true);
  };

  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [purchaseOrdersList, setPurchaseOrdersList] = useState<any[]>([]);

  useEffect(() => {
    fetchImportReceipts();
    fetchProducts();
    fetchWarehouseBins();

    // Fetch suppliers from API
    axiosClient.get('/partnerarea/suppliers?size=200')
      .then((res: any) => {
        const list = res.data?.content || res.content || res.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setSuppliersList(list);
        }
      })
      .catch(() => {});

    // Fetch branches from API
    axiosClient.get('/branches')
      .then((res: any) => {
        const list = res.data?.content || res.content || res.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setBranchesList(list);
        }
      })
      .catch(() => {});

    // Fetch active users for QA inspector dropdown
    axiosClient.get('/users?status=ACTIVE&size=200')
      .then((res: any) => {
        const list = res.data?.content || res.content || res.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setUsersList(list);
        }
      })
      .catch(() => {});

    // Fetch purchase orders for lookup
    axiosClient.get('/purchase/orders')
      .then((res: any) => {
        const list = res.data?.content || res.content || res.data || res || [];
        if (Array.isArray(list) && list.length > 0) {
          setPurchaseOrdersList(list);
        }
      })
      .catch(() => {});
  }, [fetchImportReceipts, fetchProducts, fetchWarehouseBins]);

  const availablePurchaseOrders = useMemo(() => {
    const existingPoNumbers = new Set(
      data
        .filter((d) => d.status !== 'CANCELLED' && d.status !== 'DA_HUY')
        .map((d) => d.poNumber?.trim().toLowerCase())
        .filter(Boolean)
    );

    return purchaseOrdersList.filter((po) => {
      const poCodeLower = (po.poCode || po.poNumber || '').trim().toLowerCase();
      const st = String(po.status || '').toUpperCase();
      const isDelivered =
        st === 'DELIVERED' ||
        st === 'RECEIVED' ||
        st === 'DA_NHAN' ||
        st === 'COMPLETED' ||
        st === 'COMPLETE' ||
        st === 'ĐÃ NHẬN HÀNG';

      if (isDelivered || existingPoNumbers.has(poCodeLower)) {
        return false;
      }
      return st !== 'CANCELLED' && st !== 'DRAFT' && st !== 'PENDING_APPROVAL';
    });
  }, [purchaseOrdersList, data]);

  const filtered = data.filter((item) => {
    // 1. Text search
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.supplierName.toLowerCase().includes(q) ||
        item.grnNumber.toLowerCase().includes(q) ||
        item.poNumber.toLowerCase().includes(q) ||
        item.receivingStore.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const allSelectableProducts = useMemo(() => {
    return (products || []).map((p: any) => ({
      id: String(p.id),
      name: p.name || p.productName || 'Sản phẩm',
      sku: p.sku || p.productCode || `SKU-${p.id}`,
      price: p.costPrice || p.price || 0,
    }));
  }, [products]);

  const handleSelectPo = (poCode: string) => {
    if (!poCode) {
      setEditingReceipt(prev => ({ ...prev, poNumber: '' }));
      return;
    }
    const matched = purchaseOrdersList.find(p => (p.poCode || p.poNumber) === poCode);
    if (matched) {
      const matchedSupplier = suppliersList.find(s =>
        (s.id && matched.supplierId && String(s.id) === String(matched.supplierId)) ||
        (s.name && matched.supplierName && s.name.toLowerCase() === matched.supplierName.toLowerCase())
      );
      const matchedBranch = branchesList.find(b =>
        (b.id && matched.branchId && String(b.id) === String(matched.branchId)) ||
        (b.name && matched.destinationStore && b.name.toLowerCase() === matched.destinationStore.toLowerCase())
      );

      const rawLines = Array.isArray(matched.details) ? matched.details : (Array.isArray(matched.items) ? matched.items : []);
      const newLines = rawLines.map((l: any, idx: number) => {
        const prod = products.find(p => String(p.id) === String(l.productId)) ||
                     products.find(p => p.sku === l.productCode || p.name === l.productName);
        const unitPrice = Number(l.unitPrice || l.price || prod?.costPrice || 0);
        const qty = Number(l.quantity || 1);
        return {
          productVariantId: prod?.id ? Number(prod.id) : (l.productId ? Number(l.productId) : idx + 1),
          quantity: qty,
          unitPrice: unitPrice,
          targetBinId: warehouseBins.length > 0 ? Number(warehouseBins[0].id) : 1,
          batchCode: `BATCH-${Date.now().toString().slice(-4)}`,
          manufactureDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
        };
      });

      const totalQty = newLines.reduce((sum: number, line: any) => sum + line.quantity, 0);
      const totalVal = newLines.reduce((sum: number, line: any) => sum + (line.quantity * line.unitPrice), 0);

      setEditingReceipt(prev => ({
        ...prev,
        poNumber: matched.poCode || matched.poNumber,
        supplierName: matched.supplierName || matchedSupplier?.name || prev.supplierName,
        supplierId: matched.supplierId || matchedSupplier?.id || prev.supplierId,
        receivingStore: matched.destinationStore || matchedBranch?.name || prev.receivingStore,
        branchId: matched.branchId || matchedBranch?.id || prev.branchId,
        totalItems: totalQty > 0 ? totalQty : prev.totalItems,
        acceptedItems: totalQty > 0 ? totalQty : prev.acceptedItems,
        totalValuation: totalVal > 0 ? totalVal : prev.totalValuation,
        lines: newLines.length > 0 ? newLines : prev.lines,
      }));
    }
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    const firstProd = products[0];
    const initialUnitPrice = firstProd ? Number(firstProd.costPrice || firstProd.price || 0) : 0;
    const initialQty = 1;
    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const firstSupplier = suppliersList.length > 0 ? suppliersList[0] : null;
    const firstBranch = branchesList.length > 0 ? branchesList[0] : null;
    const firstSupplierId = firstSupplier ? Number(firstSupplier.id) : undefined;
    const firstSupplierName = firstSupplier ? (firstSupplier.name || firstSupplier.supplierName || '') : '';
    const firstBranchId = firstBranch ? Number(firstBranch.id) : 1;
    const firstBranchName = firstBranch ? (firstBranch.branchName || firstBranch.name || 'Chi nhánh chính') : 'Chi nhánh chính';

    setEditingReceipt({
      grnNumber: `GRN-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      poNumber: '',
      supplierName: firstSupplierName,
      supplierId: firstSupplierId,
      receivingStore: firstBranchName,
      branchId: firstBranchId,
      receivedDate: today,
      totalItems: initialQty,
      acceptedItems: initialQty,
      rejectedItems: 0,
      totalValuation: initialQty * initialUnitPrice,
      status: 'PENDING_INSPECTION',
      inspectedBy: '',
      notes: '',
      lines: firstProd ? [
        {
          productVariantId: Number(firstProd.id),
          quantity: initialQty,
          unitPrice: initialUnitPrice,
          targetBinId: warehouseBins.length > 0 ? Number(warehouseBins[0].id) : 1,
          batchCode: `BATCH-${Date.now().toString().slice(-4)}`,
          manufactureDate: today,
          expiryDate: expiry
        }
      ] : []
    });
    setIsModalOpen(true);
  };

  const handleAddLine = () => {
    const lines = editingReceipt.lines || [];
    const firstProd = defaultProductsList[0];
    const unitPrice = (firstProd as any).price || (firstProd as any).costPrice || (firstProd as any).basePrice || 500000;
    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const updatedLines = [
      ...lines,
      {
        productVariantId: Number(firstProd.id),
        quantity: 1,
        unitPrice: unitPrice,
        targetBinId: Number(defaultBins[0].id),
        batchCode: `BATCH-${Date.now().toString().slice(-4)}`,
        manufactureDate: today,
        expiryDate: expiry
      }
    ];

    const totalQty = updatedLines.reduce((acc, l) => acc + Number(l.quantity), 0);
    const totalVal = updatedLines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);
    const rej = editingReceipt.rejectedItems || 0;

    setEditingReceipt({
      ...editingReceipt,
      lines: updatedLines,
      totalItems: totalQty,
      acceptedItems: Math.max(0, totalQty - rej),
      totalValuation: totalVal
    });
  };

  const handleLineChange = (index: number, field: string, val: any) => {
    const lines = [...(editingReceipt.lines || [])];
    lines[index] = { ...lines[index], [field]: val };

    if (field === 'productVariantId') {
      const found = defaultProductsList.find(p => Number(p.id) === Number(val));
      if (found) {
        lines[index].unitPrice = (found as any).price || (found as any).costPrice || (found as any).basePrice || lines[index].unitPrice;
      }
    }

    const totalQty = lines.reduce((acc, l) => acc + Number(l.quantity), 0);
    const totalVal = lines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);
    const rej = editingReceipt.rejectedItems || 0;

    setEditingReceipt({
      ...editingReceipt,
      lines,
      totalItems: totalQty,
      acceptedItems: Math.max(0, totalQty - rej),
      totalValuation: totalVal
    });
  };

  const handleRemoveLine = (index: number) => {
    const lines = (editingReceipt.lines || []).filter((_, i) => i !== index);
    const totalQty = lines.reduce((acc, l) => acc + Number(l.quantity), 0);
    const totalVal = lines.reduce((acc, l) => acc + (Number(l.quantity) * Number(l.unitPrice)), 0);
    const rej = editingReceipt.rejectedItems || 0;

    setEditingReceipt({
      ...editingReceipt,
      lines,
      totalItems: totalQty,
      acceptedItems: Math.max(0, totalQty - rej),
      totalValuation: totalVal
    });
  };

  const handleOpenEdit = (receipt: ImportReceiptItem) => {
    setModalMode('edit');
    const today = new Date().toISOString().split('T')[0];
    const expiry = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const firstProd = defaultProductsList[0];

    const lines = (receipt.lines && receipt.lines.length > 0)
      ? receipt.lines.map(l => ({ ...l, manufactureDate: l.manufactureDate || today }))
      : [
          {
            productVariantId: Number(firstProd.id),
            quantity: receipt.totalItems || 10,
            unitPrice: receipt.totalItems && receipt.totalItems > 0 ? Math.round(receipt.totalValuation / receipt.totalItems) : 500000,
            targetBinId: Number(defaultBins[0].id),
            batchCode: `BATCH-${Date.now().toString().slice(-4)}`,
            manufactureDate: today,
            expiryDate: expiry
          }
        ];

    // Resolve supplierId từ suppliersList nếu chưa có
    const resolvedSupplierId = (receipt as any).supplierId ||
      suppliersList.find((s: any) =>
        String(s.id) === String((receipt as any).supplierId) ||
        (s.name || s.supplierName || s.companyName) === receipt.supplierName
      )?.id || undefined;

    // Resolve branchId từ branchesList nếu chưa có
    const resolvedBranchId = (receipt as any).branchId ||
      branchesList.find((b: any) =>
        String(b.id) === String((receipt as any).branchId) ||
        (b.branchName || b.name) === receipt.receivingStore ||
        (b.branchCode || b.code) === receipt.receivingStore
      )?.id || undefined;

    setEditingReceipt({
      ...receipt,
      ...({
        supplierId: resolvedSupplierId,
        branchId: resolvedBranchId,
      } as any),
      lines
    });
    setIsModalOpen(true);
  };

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReceipt.grnNumber || !editingReceipt.supplierName) return;

    if (modalMode === 'create' && editingReceipt.poNumber?.trim()) {
      const targetPo = editingReceipt.poNumber.trim().toLowerCase();
      const existing = data.find(d => d.poNumber?.trim().toLowerCase() === targetPo && d.status !== 'CANCELLED' && d.status !== 'DA_HUY');
      if (existing) {
        toast.error(`Đơn mua ${editingReceipt.poNumber} đã có phiếu nhập kho (${existing.grnNumber})! Không thể tạo trùng.`);
        return;
      }
    }

    try {
      if (modalMode === 'create') {
        const newReceipt: Omit<ImportReceiptItem, 'id'> = {
          grnNumber: editingReceipt.grnNumber,
          poNumber: editingReceipt.poNumber || '',
          supplierName: editingReceipt.supplierName,
          supplierId: (editingReceipt as any).supplierId,
          receivingStore: editingReceipt.receivingStore || 'Main Flagship / HQ',
          branchId: (editingReceipt as any).branchId || 1,
          receivedDate: editingReceipt.receivedDate || new Date().toISOString().split('T')[0],
          totalItems: Number(editingReceipt.totalItems) || 0,
          acceptedItems: Number(editingReceipt.acceptedItems) || 0,
          rejectedItems: Number(editingReceipt.rejectedItems) || 0,
          totalValuation: Number(editingReceipt.totalValuation) || 0,
          status: editingReceipt.status as any || 'PENDING_INSPECTION',
          inspectedBy: editingReceipt.inspectedBy || 'Warehouse Staff',
          notes: editingReceipt.notes || '',
          lines: editingReceipt.lines || []
        };
        await addImportReceipt(newReceipt);
        toast.success(`Đã tạo phiếu nhập kho ${newReceipt.grnNumber} thành công!`);
      } else if (editingReceipt.id) {
        await updateImportReceipt(editingReceipt.id, editingReceipt);
        toast.success(`Đã cập nhật phiếu nhập kho ${editingReceipt.grnNumber} thành công!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu phiếu nhập kho';
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingReceipt) return;
    deleteImportReceipt(deletingReceipt.id);
    setDeletingReceipt(null);
  };

  const handleCancelConfirm = async () => {
    if (!cancellingReceipt || !cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy phiếu');
      return;
    }
    try {
      await cancelImportReceipt(cancellingReceipt.id, cancelReason.trim());
      toast.success(`Đã hủy phiếu ${cancellingReceipt.grnNumber}`);
      setCancellingReceipt(null);
      setCancelReason('');
      setSelectedReceipt(null);
    } catch {
      toast.error('Hủy phiếu nhập kho thất bại');
    }
  };

  const columns = useMemo<ColumnDef<ImportReceiptItem>[]>(
    () => [
      {
        accessorKey: 'grnNumber',
        header: 'Phiếu nhập kho (GRN)',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'poNumber',
        header: 'Mã PO đối chiếu',
        cell: (info) => <span className="font-mono text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'receivingStore',
        header: 'Kho / Chi nhánh nhận',
      },
      {
        accessorKey: 'totalItems',
        header: 'Số lượng nhập',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-gray-900 dark:text-white">{row.original.totalItems}</span>
            {row.original.rejectedItems > 0 && <span className="ml-1 text-xs text-red-600">(-{row.original.rejectedItems} lỗi)</span>}
          </div>
        ),
      },
      {
        accessorKey: 'receivedDate',
        header: 'Ngày nhận hàng',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái kiểm tra',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            INSPECTED_ACCEPTED: 'Đạt yêu cầu',
            PARTIAL_ACCEPTANCE: 'Nhận một phần',
            PENDING_INSPECTION: 'Chờ kiểm tra',
            REJECTED: 'Từ chối nhận',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'INSPECTED_ACCEPTED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'PARTIAL_ACCEPTANCE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'PENDING_INSPECTION' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
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
              onClick={(e) => { e.stopPropagation(); setSelectedReceipt(row.original); }}
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
              onClick={(e) => { e.stopPropagation(); setDeletingReceipt(row.original); }}
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

  // KPI summary
  const totalPending   = data.filter(r => r.status === 'PENDING_INSPECTION').length;
  const totalAccepted  = data.filter(r => r.status === 'INSPECTED_ACCEPTED').length;
  const totalValue     = data.reduce((s, r) => s + r.totalValuation, 0);
  const totalItems     = data.reduce((s, r) => s + r.acceptedItems, 0);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Phiếu nhập kho (GRN)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ghi nhận và kiểm duyệt các đợt hàng nhập kho từ nhà cung cấp. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => toast.success('Xuất Dữ Liệu Excel nhập kho thành công!')}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm whitespace-nowrap shrink-0">
              <Plus className="w-4 h-4" /> Tạo phiếu nhập kho
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Chờ kiểm tra</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{totalPending}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Đã nhập kho</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{totalAccepted}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Tổng SL đạt chuẩn</p>
              <p className="text-xl font-black text-gray-900 dark:text-white">{totalItems.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Tổng giá trị nhập</p>
              <p className="text-base font-black text-gray-900 dark:text-white">{(totalValue / 1000000).toFixed(0)}M</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm theo mã GRN, mã PO hoặc nhà cung cấp..."
                className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái phiếu:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="PENDING_INSPECTION">Chờ kiểm định (PENDING INSPECTION)</option>
                <option value="PARTIAL_ACCEPTANCE">Nhận một phần (PARTIAL ACCEPTANCE)</option>
                <option value="INSPECTED_ACCEPTED">Đã nhập kho (INSPECTED ACCEPTED)</option>
                <option value="REJECTED">Từ chối / Hủy (REJECTED)</option>
              </select>
            </div>

            {(statusFilter !== 'all' || search) && (
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedReceipt(row)} />
      </div>

      <Modal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt ? `Chi tiết Phiếu nhập: ${selectedReceipt.grnNumber}` : 'Chi tiết phiếu nhập kho'}
        width="max-w-2xl"
      >
        {selectedReceipt && (() => {
          const statusMap: Record<string, { label: string; cls: string }> = {
            INSPECTED_ACCEPTED: { label: 'Đã nhập kho', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
            PARTIAL_ACCEPTANCE: { label: 'Nhận một phần', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
            PENDING_INSPECTION: { label: 'Chờ kiểm tra', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
            REJECTED: { label: 'Từ chối nhận', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
          };
          const cfg = statusMap[selectedReceipt.status] || { label: selectedReceipt.status, cls: 'bg-gray-100 text-gray-700' };
          const acceptRate = selectedReceipt.totalItems > 0
            ? Math.round((selectedReceipt.acceptedItems / selectedReceipt.totalItems) * 100)
            : 0;
          return (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider">Tổng giá trị lô hàng</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{fmtVND(selectedReceipt.totalValuation)}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
            </div>

            {/* Supplier & date */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Building2 className="w-3.5 h-3.5" /> Nhà cung cấp</div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedReceipt.supplierName}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1"><Calendar className="w-3.5 h-3.5" /> Ngày nhận hàng</div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedReceipt.receivedDate}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 text-sm overflow-hidden">
              {[
                { label: 'Mã PO đối chiếu', value: <span className="font-mono text-emerald-600 dark:text-emerald-400">{selectedReceipt.poNumber}</span> },
                { label: 'Kho / Chi nhánh nhận', value: selectedReceipt.receivingStore },
                { label: 'Tổng SL giao đến', value: `${selectedReceipt.totalItems} sản phẩm` },
                { label: 'SL đạt chuẩn', value: <span className="text-emerald-600 font-semibold">{selectedReceipt.acceptedItems} sp</span> },
                { label: 'SL lỗi / trả lại', value: selectedReceipt.rejectedItems > 0 ? <span className="text-red-600 font-semibold">{selectedReceipt.rejectedItems} sp</span> : <span className="text-gray-400">Không có</span> },
                { label: 'Người kiểm tra (QA)', value: selectedReceipt.inspectedBy },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>

            {/* Detailed Line Items & Bin Allocation */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-emerald-600" />
                Chi tiết mặt hàng & Vị trí Ô kệ (Bin Location)
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold">
                    <tr>
                      <th className="p-2.5">Sản phẩm</th>
                      <th className="p-2.5">Vị trí Ô kệ (Bin)</th>
                      <th className="p-2.5">Mã lô (Batch)</th>
                      <th className="p-2.5 text-right">SL nhận</th>
                      {selectedPoDetails && <th className="p-2.5 text-right">SL đặt PO</th>}
                      {selectedPoDetails && <th className="p-2.5 text-right">Còn thiếu</th>}
                      <th className="p-2.5 text-right">Đơn giá</th>
                      <th className="p-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                    {selectedReceipt.lines && selectedReceipt.lines.length > 0 ? (
                      selectedReceipt.lines.map((line, idx) => {
                        const prod = products.find(p => String(p.id) === String(line.productVariantId)) ||
                          products.find(p => p.sku === line.sku);
                        const bin = warehouseBins.find(b => Number(b.id) === line.targetBinId);
                        const binLabel = line.targetBinCode || (bin ? `${bin.binCode} (${bin.areaName || bin.zoneCode || 'Kho'})` : `Ô kệ ID #${line.targetBinId}`);
                        const prodName = line.productName || prod?.name || `Biến thể #${line.productVariantId}`;
                        
                        const poLine = selectedPoDetails?.details?.find((d: any) => d.productName === prodName || d.productCode === line.sku);
                        const orderedQty = poLine ? Number(poLine.quantity) : undefined;
                        const missingQty = orderedQty !== undefined ? Math.max(0, orderedQty - line.quantity) : 0;
                        
                        return (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="p-2.5 font-medium text-gray-900 dark:text-white">
                              <div>{prodName}</div>
                              {line.sku && <div className="text-[10px] text-gray-400 font-mono">{line.sku}</div>}
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-mono font-medium text-[11px]">
                                {binLabel}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-gray-600 dark:text-gray-300">
                              {line.batchCode || '—'}
                              {line.expiryDate && <div className="text-[10px] text-amber-600">HSD: {line.expiryDate}</div>}
                            </td>
                            <td className="p-2.5 text-right font-bold text-gray-900 dark:text-white">{line.quantity}</td>
                            {selectedPoDetails && <td className="p-2.5 text-right text-gray-500 font-semibold">{orderedQty ?? '—'}</td>}
                            {selectedPoDetails && (
                              <td className="p-2.5 text-right font-bold text-red-500">
                                {missingQty > 0 ? `${missingQty} sp` : 'Đủ'}
                              </td>
                            )}
                            <td className="p-2.5 text-right text-gray-600 dark:text-gray-300">{fmtVND(line.unitPrice)}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-600">{fmtVND(line.quantity * line.unitPrice)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={selectedPoDetails ? 8 : 6} className="p-4 text-center text-gray-400 italic">
                          Không có thông tin dòng hàng chi tiết
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Accept rate bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-gray-600 dark:text-gray-400">Tỷ lệ chấp nhận hàng</span>
                <span className={`font-bold ${acceptRate >= 90 ? 'text-emerald-600' : acceptRate >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{acceptRate}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${acceptRate >= 90 ? 'bg-emerald-500' : acceptRate >= 60 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${acceptRate}%` }} />
              </div>
            </div>

            {selectedReceipt.notes && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Ghi chú kiểm hàng</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedReceipt.notes}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-3">
              {selectedReceipt.status === 'PENDING_INSPECTION' && (
                <>
                  <button
                    onClick={() => {
                      updateImportReceipt(selectedReceipt.id, { status: 'INSPECTED_ACCEPTED' });
                      setSelectedReceipt(null);
                      toast.success('Đã xác nhận nhập kho thành công!');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm min-w-[180px]"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Xác nhận đã nhập kho
                  </button>
                  <button
                    onClick={() => {
                      setCancellingReceipt(selectedReceipt);
                      setCancelReason('');
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow transition-colors text-sm"
                  >
                    <Ban className="w-4 h-4" /> Hủy phiếu GRN
                  </button>
                </>
              )}
              {selectedReceipt.status === 'PARTIAL_ACCEPTANCE' && selectedPoDetails && (
                <button
                  onClick={handleReceiveRemaining}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors text-sm min-w-[180px]"
                >
                  <Plus className="w-4 h-4" /> Nhận tiếp số lượng còn thiếu
                </button>
              )}
              <button
                onClick={() => toast.success('Đã gửi yêu cầu in phiếu GRN!')}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm font-semibold"
              >
                <FileText className="w-4 h-4 inline mr-1" /> In phiếu GRN
              </button>
            </div>
          </div>
          );
        })()}
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tạo phiếu nhập kho (GRN)' : 'Cập nhật phiếu nhập kho'}
        width="max-w-2xl"
      >
        <form onSubmit={handleSaveReceipt} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phiếu nhập (GRN) *</label>
              <input
                type="text"
                value={editingReceipt.grnNumber || ''}
                onChange={(e) => setEditingReceipt(prev => ({ ...prev, grnNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mã PO Đơn mua đối chiếu
              </label>
              <select
                value={editingReceipt.poNumber || ''}
                onChange={(e) => handleSelectPo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Tự do (Không theo PO) hoặc Chọn PO... --</option>
                {editingReceipt.poNumber && !availablePurchaseOrders.some(p => (p.poCode || p.poNumber) === editingReceipt.poNumber) && (
                  <option value={editingReceipt.poNumber}>{editingReceipt.poNumber} (Đơn hiện tại)</option>
                )}
                {availablePurchaseOrders.map(p => (
                  <option key={p.id || p.poCode} value={p.poCode || p.poNumber}>
                    {p.poCode || p.poNumber} - {p.supplierName} ({p.status} | {p.paymentStatus === 'PAID' ? 'Đã TT đủ' : 'Chưa TT'})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-0.5">* Chỉ hiển thị các đơn PO chưa có phiếu nhập</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp đối tác *</label>
              <SearchLookupModal
                title="Chọn Nhà Cung Cấp"
                iconType="building"
                placeholder="Chọn nhà cung cấp..."
                value={(() => {
                  const sId = (editingReceipt as any).supplierId;
                  if (sId) return String(sId);
                  const matched = suppliersList.find((s: any) =>
                    (s.name || s.supplierName || s.companyName) === editingReceipt.supplierName ||
                    (s.code || s.supplierCode) === editingReceipt.supplierName
                  );
                  return matched ? String(matched.id) : '';
                })()}
                options={suppliersList.map((s: any) => ({
                  id: String(s.id),
                  code: s.code || s.supplierCode || `SUP-${s.id}`,
                  name: s.name || s.supplierName || s.companyName || s.fullName,
                  subtitle: `SĐT: ${s.phone || 'N/A'}`
                }))}
                onChange={(val, opt) => {
                  const id = Number(val);
                  setEditingReceipt(prev => ({
                    ...prev,
                    supplierName: opt ? opt.name : '',
                    supplierId: id || undefined
                  } as any));
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh / Kho tiếp nhận *</label>
              <SearchLookupModal
                title="Chọn Kho Hàng Tiếp Nhận"
                iconType="location"
                placeholder="Chọn kho / chi nhánh..."
                value={(() => {
                  const bId = (editingReceipt as any).branchId;
                  if (bId) return String(bId);
                  const matched = branchesList.find((b: any) =>
                    (b.branchName || b.name) === editingReceipt.receivingStore ||
                    (b.branchCode || b.code) === editingReceipt.receivingStore
                  );
                  return matched ? String(matched.id) : '';
                })()}
                options={branchesList.length > 0
                  ? branchesList.map((b: any) => ({
                      id: String(b.id),
                      code: b.branchCode || b.code || `BRANCH-${b.id}`,
                      name: b.branchName || b.name || `Chi nhánh ${b.id}`,
                    }))
                  : [
                      { id: '1', code: 'STORE-HQ', name: 'Kho Tổng Trung Tâm (Hội Sở)' },
                      { id: '2', code: 'STORE-HN', name: 'Kho Chi Nhánh Hà Nội' },
                      { id: '3', code: 'STORE-HCM', name: 'Kho Chi Nhánh TP.HCM' },
                    ]
                }
                onChange={(val, opt) => {
                  const id = Number(val);
                  setEditingReceipt(prev => ({
                    ...prev,
                    receivingStore: opt ? opt.name : '',
                    branchId: id || 1
                  } as any));
                }}
              />
            </div>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày nhập thực tế</label>
              <input
                type="date"
                value={editingReceipt.receivedDate || ''}
                onChange={(e) => setEditingReceipt(prev => ({ ...prev, receivedDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người kiểm tra (QA)</label>
              <select
                value={editingReceipt.inspectedBy || ''}
                onChange={(e) => setEditingReceipt(prev => ({ ...prev, inspectedBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Chọn người kiểm tra --</option>
                {editingReceipt.inspectedBy && !usersList.some((u: any) => (u.fullName || u.username || u.name) === editingReceipt.inspectedBy) && (
                  <option value={editingReceipt.inspectedBy}>{editingReceipt.inspectedBy}</option>
                )}
                {usersList.length > 0 ? (
                  usersList.map((u: any) => {
                    const name = u.fullName || u.username || u.name;
                    const role = u.roleName || u.role?.roleName || '';
                    return (
                      <option key={u.id || u.username} value={name}>
                        {name}{role ? ` (${role})` : ''}
                      </option>
                    );
                  })
                ) : (
                  <option value="Warehouse Staff">Warehouse Staff</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng SL giao</label>
              <input
                type="number"
                value={editingReceipt.totalItems || 0}
                onChange={(e) => setEditingReceipt(prev => ({ ...prev, totalItems: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 text-emerald-600">SL Đạt chuẩn</label>
              <input
                type="number"
                value={editingReceipt.acceptedItems || 0}
                onChange={(e) => setEditingReceipt(prev => ({ ...prev, acceptedItems: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-emerald-300 dark:border-emerald-700 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 text-red-600">SL Lỗi / Trả lại</label>
              <input
                type="number"
                value={editingReceipt.rejectedItems || 0}
                onChange={(e) => setEditingReceipt(prev => ({ ...prev, rejectedItems: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/10 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái kiểm tra</label>
              <select
                value={editingReceipt.status || 'PENDING_INSPECTION'}
                onChange={(e) => setEditingReceipt(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="PENDING_INSPECTION">Chờ kiểm tra (QA)</option>
                <option value="INSPECTED_ACCEPTED">Đã kiểm và Nhận đủ</option>
                <option value="PARTIAL_ACCEPTANCE">Nhận một phần (Có lỗi)</option>
                <option value="REJECTED">Từ chối nhận toàn bộ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng giá trị nhập (₫)</label>
              <input
                type="number"
                step="1"
                value={editingReceipt.totalValuation || 0}
                onChange={(e) => setEditingReceipt(prev => ({ ...prev, totalValuation: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 font-bold"
              />
            </div>
          </div>

          {/* Section: Goods Receipt Details (WMS) - Grouped in Card layout */}
          <div className="bg-gray-50/50 dark:bg-gray-900/30 p-3 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600 animate-pulse" />
                Chi tiết mặt hàng & QC Phân bổ vị trí (WMS)
              </h3>
              <button
                type="button"
                onClick={handleAddLine}
                className="px-2.5 py-1 text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors font-semibold"
              >
                + Thêm mặt hàng
              </button>
            </div>

            {(!editingReceipt.lines || editingReceipt.lines.length === 0) ? (
              <p className="text-xs text-gray-400 italic bg-white dark:bg-gray-900/10 p-4 text-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                Chưa có mặt hàng nào. Vui lòng bấm nút phía trên để thêm sản phẩm nhập kho.
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {editingReceipt.lines.map((line, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-gray-950 rounded-lg border border-gray-200 dark:border-gray-800 space-y-2 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Xóa mặt hàng này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase">Sản phẩm *</label>
                        <select
                          value={line.productVariantId}
                          onChange={(e) => handleLineChange(idx, 'productVariantId', Number(e.target.value))}
                          className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        >
                          {allSelectableProducts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase">Vị trí Ô kệ (Bin Location) *</label>
                        <select
                          value={line.targetBinId}
                          onChange={(e) => handleLineChange(idx, 'targetBinId', Number(e.target.value))}
                          className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium"
                        >
                          {(warehouseBins.length > 0 ? warehouseBins : [{ id: '1', binCode: 'KHO-MAIN-A01', areaName: 'Kho chính' }]).map((b: any) => (
                            <option key={b.id} value={b.id}>
                              {b.binCode} {b.areaName ? `[${b.areaName}]` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase">Số lượng</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase">Đơn giá nhập</label>
                        <input
                          type="number"
                          min="0"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase">Mã lô (Lot/Batch)</label>
                        <input
                          type="text"
                          value={line.batchCode}
                          onChange={(e) => handleLineChange(idx, 'batchCode', e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                          placeholder="BATCH-01"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase">Ngày sản xuất (NSX)</label>
                        <input
                          type="date"
                          value={line.manufactureDate || ''}
                          onChange={(e) => handleLineChange(idx, 'manufactureDate', e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase">Hạn dùng (HSD)</label>
                        <input
                          type="date"
                          value={line.expiryDate || ''}
                          onChange={(e) => handleLineChange(idx, 'expiryDate', e.target.value)}
                          className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú (Biên bản lỗi, v.v.)</label>
            <textarea
              rows={2}
              value={editingReceipt.notes || ''}
              onChange={(e) => setEditingReceipt(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Ghi rõ lý do nếu có hàng lỗi, hàng thiếu..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {modalMode === 'create' ? 'Lưu phiếu nhập' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deletingReceipt}
        onClose={() => setDeletingReceipt(null)}
        title="Xác nhận xóa phiếu nhập kho"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa phiếu nhập kho <strong className="text-gray-900 dark:text-white">{deletingReceipt?.grnNumber}</strong> không? Hành động này sẽ ảnh hưởng đến lịch sử đối soát và không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setDeletingReceipt(null)}
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

      <Modal
        isOpen={!!cancellingReceipt}
        onClose={() => { setCancellingReceipt(null); setCancelReason(''); }}
        title="Hủy phiếu nhập kho (GRN)"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Hủy phiếu <strong className="text-gray-900 dark:text-white">{cancellingReceipt?.grnNumber}</strong> qua API backend. Vui lòng nhập lý do hủy.
          </p>
          <textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 resize-none"
            placeholder="Ví dụ: Nhà cung cấp giao sai PO, hàng không đạt chuẩn..."
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setCancellingReceipt(null); setCancelReason(''); }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleCancelConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              Xác nhận hủy phiếu
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
