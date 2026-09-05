import { useMemo, useState, useEffect, useRef } from 'react';
import { Plus, Download, Search, Eye, QrCode, Building2, Calendar, FileText, Wrench, RefreshCw, Edit, Trash2, X, Barcode, Upload, ShieldCheck, CheckCircle2, Smartphone, Cpu } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { useInventoryStore, type SerialItemRecord } from '../store/inventoryStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';
import { toast } from 'sonner';

interface POLookupOption {
  poNumber: string;
  supplierName: string;
  locationName: string;
  skus: { sku: string; name: string; unitCost: number }[];
}

// Validate IMEI using Luhn algorithm (15 digits)
function isValidIMEI(imei?: string): boolean {
  if (!imei) return false;
  const cleaned = imei.trim();
  if (!/^\d{15}$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

// Validate alphanumeric Serial (6 - 32 chars, letters, numbers, dashes)
function isValidSerial(serial?: string): boolean {
  if (!serial) return false;
  return /^[A-Za-z0-9\-_]{6,32}$/.test(serial.trim());
}

export function SerialNumbersPage() {
  const {
    serialItems: data,
    fetchSerialItems,
    addSerialItem,
    updateSerialItem,
    deleteSerialItem,
    products,
    fetchProducts,
    fetchSerialsByProduct,
    addProductSerials
  } = useInventoryStore();

  const [search, setSearch] = useState('');
  const [selectedSerial, setSelectedSerial] = useState<SerialItemRecord | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [registrationType, setRegistrationType] = useState<'single' | 'barcode' | 'bulk'>('single');

  const [editingSerial, setEditingSerial] = useState<Partial<SerialItemRecord>>({});
  const [deletingSerial, setDeletingSerial] = useState<SerialItemRecord | null>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Barcode & Bulk import states
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [bulkTextInput, setBulkTextInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // PO Lookup List
  const [poList, setPoList] = useState<POLookupOption[]>([]);

  // 1. FILTER PRODUCTS (Chỉ lấy sản phẩm có has_serial = true hoặc thiết bị công nghệ)
  const serialManagedProducts = useMemo(() => {
    return products.filter((p) => {
      if ((p as any).hasSerial === true || (p as any).isSerialManaged === true || (p as any).hasImei === true) return true;
      const lowerCategory = (p.category || '').toLowerCase();
      const lowerName = (p.name || '').toLowerCase();
      const isFMCG =
        lowerName.includes('coca') ||
        lowerName.includes('pepsi') ||
        lowerName.includes('sữa') ||
        lowerCategory.includes('thực phẩm') ||
        lowerCategory.includes('đồ uống') ||
        p.sku.startsWith('SKU-MILK') ||
        p.sku.startsWith('SKU-COCA');
      return !isFMCG;
    });
  }, [products]);

  // Load PO references
  const fetchPOReferences = async () => {
    try {
      const res = await axiosClient.get('/purchase/orders?size=500');
      const list = extractPageContent<any>(res);
      const mapped: POLookupOption[] = list.map((po: any, idx: number) => ({
        poNumber: po.poNumber || `PO-2026-${String(po.id).padStart(4, '0')}`,
        supplierName: po.supplierName || po.supplier?.name || 'Công ty Công nghệ Việt',
        locationName: po.destinationStore || po.branch?.name || 'Kho Chi Nhánh',
        skus: Array.isArray(po.poLines) ? po.poLines.map((l: any) => ({
          sku: l.sku || `SKU-${idx + 1}`,
          name: l.productName || 'Sản phẩm đặt mua',
          unitCost: Number(l.unitPrice || 0),
        })) : []
      }));

      setPoList(mapped);
    } catch (err) {
      setPoList([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSerialItems();
    fetchPOReferences();
  }, [fetchProducts, fetchSerialItems]);

  useEffect(() => {
    if (serialManagedProducts.length > 0 && !selectedProductId) {
      setSelectedProductId(serialManagedProducts[0].id);
    }
  }, [serialManagedProducts, selectedProductId]);

  useEffect(() => {
    if (selectedProductId) {
      fetchSerialsByProduct(Number(selectedProductId));
    }
  }, [selectedProductId, fetchSerialsByProduct]);

  const filtered = data.filter((item) => {
    let matchesSearch = true;
    const q = search.toLowerCase();
    if (q) {
      matchesSearch = (
        item.serialNumber.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (!!item.imei1 && item.imei1.toLowerCase().includes(q)) ||
        (!!item.imei2 && item.imei2.toLowerCase().includes(q)) ||
        (!!item.associatedCustomer && item.associatedCustomer.toLowerCase().includes(q))
      );
    }
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setFormMode('create');
    setRegistrationType('single');
    const firstProduct = serialManagedProducts.find(p => p.id === selectedProductId) || serialManagedProducts[0] || products[0];
    setEditingSerial({
      serialNumber: '',
      sku: firstProduct?.sku || '',
      productName: firstProduct?.name || '',
      category: firstProduct?.category || 'Thiết bị điện tử',
      unitCost: firstProduct?.costPrice || 15000000,
      status: 'IN_STOCK',
      currentLocation: 'Kho tổng trung tâm',
      receivedDate: new Date().toISOString().split('T')[0],
      warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      imei1: '',
      imei2: '',
      macAddress: '',
      vendorName: '',
      poReference: '',
    });
    setScannedSerials([]);
    setBarcodeInput('');
    setBulkTextInput('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (serial: SerialItemRecord) => {
    setFormMode('edit');
    setRegistrationType('single');
    setEditingSerial(serial);
    setIsFormOpen(true);
  };

  const handleSelectPO = (poNum: string) => {
    const matched = poList.find(p => p.poNumber === poNum);
    if (matched) {
      const firstSku = matched.skus[0];
      const matchedProd = serialManagedProducts.find(p => p.sku === firstSku?.sku) || products.find(p => p.sku === firstSku?.sku);
      
      setEditingSerial(prev => ({
        ...prev,
        poReference: poNum,
        vendorName: matched.supplierName,
        currentLocation: matched.locationName,
        sku: firstSku?.sku || prev.sku,
        productName: matchedProd?.name || firstSku?.name || prev.productName,
        unitCost: firstSku?.unitCost || prev.unitCost,
      }));

      toast.info(`Tự động điền theo đơn đặt hàng ${poNum}: ${matched.supplierName} - Kho: ${matched.locationName}`);
    } else {
      setEditingSerial(prev => ({ ...prev, poReference: poNum }));
    }
  };

  const availableFormProducts = useMemo(() => {
    if (!editingSerial.poReference) return serialManagedProducts;
    const poMatch = poList.find(p => p.poNumber === editingSerial.poReference);
    if (!poMatch || poMatch.skus.length === 0) return serialManagedProducts;
    const poSkuList = poMatch.skus.map(s => s.sku);
    const filtered = serialManagedProducts.filter(p => poSkuList.includes(p.sku));
    return filtered.length > 0 ? filtered : serialManagedProducts;
  }, [editingSerial.poReference, serialManagedProducts, poList]);

  const handleBarcodeScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = barcodeInput.trim();
    if (!clean) return;

    if (scannedSerials.includes(clean)) {
      toast.error(`Số serial/IMEI [${clean}] đã có trong danh sách quét!`);
      setBarcodeInput('');
      return;
    }
    const existing = data.find(d => d.serialNumber === clean || d.imei1 === clean || d.imei2 === clean);
    if (existing) {
      toast.error(`Cảnh báo: Số serial/IMEI [${clean}] đã tồn tại ở sản phẩm ${existing.productName}!`);
      setBarcodeInput('');
      return;
    }

    setScannedSerials([clean, ...scannedSerials]);
    toast.success(`Đã quét thành công: ${clean}`);
    setBarcodeInput('');
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  const validateForm = (): boolean => {
    const sn = (editingSerial.serialNumber || '').trim();
    const imei1 = (editingSerial.imei1 || '').trim();
    const imei2 = (editingSerial.imei2 || '').trim();

    if (!sn) {
      toast.error('Vui lòng nhập số serial!');
      return false;
    }

    const duplicateSN = data.find(d => d.id !== editingSerial.id && d.serialNumber.toLowerCase() === sn.toLowerCase());
    if (duplicateSN) {
      toast.error(`Trùng lặp: Số serial [${sn}] đã tồn tại ở sản phẩm ${duplicateSN.productName}!`);
      return false;
    }

    if (imei1) {
      if (!/^\d{15}$/.test(imei1)) {
        toast.error(`Số IMEI 1 [${imei1}] phải có độ dài đúng 15 chữ số theo chuẩn GSMA!`);
        return false;
      }
      const duplicateIMEI1 = data.find(d => d.id !== editingSerial.id && (d.imei1 === imei1 || d.imei2 === imei1));
      if (duplicateIMEI1) {
        toast.error(`Trùng lặp: Số IMEI 1 [${imei1}] đã được đăng ký trong hệ thống!`);
        return false;
      }
    }

    if (imei2) {
      if (!/^\d{15}$/.test(imei2)) {
        toast.error(`Số IMEI 2 [${imei2}] phải có độ dài đúng 15 chữ số theo chuẩn GSMA!`);
        return false;
      }
      const duplicateIMEI2 = data.find(d => d.id !== editingSerial.id && (d.imei1 === imei2 || d.imei2 === imei2));
      if (duplicateIMEI2) {
        toast.error(`Trùng lặp: Số IMEI 2 [${imei2}] đã được đăng ký trong hệ thống!`);
        return false;
      }
    }

    return true;
  };

  const handleSaveSerial = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registrationType === 'barcode') {
      if (scannedSerials.length === 0) {
        toast.error('Vui lòng quét ít nhất một số serial/IMEI!');
        return;
      }
      const targetProd = serialManagedProducts.find(p => p.sku === editingSerial.sku) || products.find(p => p.sku === editingSerial.sku);
      const prodId = targetProd ? Number(targetProd.id) : 1;

      await addProductSerials(prodId, scannedSerials);
      toast.success(`Đã đăng ký thành công ${scannedSerials.length} serial/IMEI cho sản phẩm ${editingSerial.productName}!`);
      setIsFormOpen(false);
      return;
    }

    if (registrationType === 'bulk') {
      const lines = bulkTextInput.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        toast.error('Vui lòng dán danh sách số serial!');
        return;
      }
      const targetProd = serialManagedProducts.find(p => p.sku === editingSerial.sku) || products.find(p => p.sku === editingSerial.sku);
      const prodId = targetProd ? Number(targetProd.id) : 1;

      await addProductSerials(prodId, lines);
      toast.success(`Đã đăng ký thành công ${lines.length} thiết bị từ danh sách nhập!`);
      setIsFormOpen(false);
      return;
    }

    if (!validateForm()) return;

    if (formMode === 'create') {
      const newRecord: Omit<SerialItemRecord, 'id'> = {
        serialNumber: (editingSerial.serialNumber || '').trim(),
        sku: editingSerial.sku || '',
        productName: editingSerial.productName || '',
        category: editingSerial.category || 'Thiết bị điện tử',
        unitCost: Number(editingSerial.unitCost) || 0,
        status: editingSerial.status as SerialItemRecord['status'] || 'IN_STOCK',
        currentLocation: editingSerial.currentLocation || 'Kho tổng',
        receivedDate: editingSerial.receivedDate || new Date().toISOString().split('T')[0],
        warrantyExpiry: editingSerial.warrantyExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: editingSerial.notes || '',
        imei1: editingSerial.imei1?.trim() || undefined,
        imei2: editingSerial.imei2?.trim() || undefined,
        macAddress: editingSerial.macAddress?.trim() || undefined,
        vendorName: editingSerial.vendorName || undefined,
        poReference: editingSerial.poReference || undefined,
      };
      addSerialItem(newRecord);
      toast.success(`Đã đăng ký thành công serial ${newRecord.serialNumber}`);
    } else if (editingSerial.id) {
      updateSerialItem(editingSerial.id, editingSerial);
      toast.success(`Đã cập nhật thông tin serial ${editingSerial.serialNumber}`);
    }
    setIsFormOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (deletingSerial) {
      deleteSerialItem(deletingSerial.id);
      toast.success(`Đã xóa số serial ${deletingSerial.serialNumber}!`);
      setDeletingSerial(null);
    }
  };

  const columns = useMemo<ColumnDef<SerialItemRecord>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: 'Số serial / IMEI',
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-mono font-bold text-primary block">{row.original.serialNumber}</span>
            {row.original.imei1 && (
              <span className="text-[10px] text-gray-500 font-mono block">IMEI: {row.original.imei1}</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'productName',
        header: 'Tên thiết bị',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.productName}</p>
            <p className="text-xs text-gray-400 font-mono">Mã SKU: {row.original.sku}</p>
          </div>
        ),
      },
      {
        accessorKey: 'currentLocation',
        header: 'Vị trí kho',
        cell: (info) => <span className="text-gray-700 dark:text-gray-300 text-xs font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'warrantyExpiry',
        header: 'Hạn bảo hành',
        cell: (info) => <span className="font-mono text-gray-600 dark:text-gray-400 text-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const map: Record<string, { label: string; class: string }> = {
            IN_STOCK: { label: 'Trong kho', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
            SOLD: { label: 'Đã bán', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
            RESERVED: { label: 'Đã giữ chỗ', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
            RMA_REPAIR: { label: 'Bảo hành / sửa chữa', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
            WRITTEN_OFF: { label: 'Đã hủy kho', class: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
          };
          const badge = map[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
          return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.class}`}>{badge.label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            {row.original.status === 'IN_STOCK' && (
              <button
                onClick={() => {
                  updateSerialItem(row.original.id, { status: 'RMA_REPAIR' });
                  toast.info(`Thiết bị ${row.original.serialNumber} đã chuyển sang trạng thái Bảo hành/Sửa chữa`);
                }}
                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                title="Chuyển sang Bảo hành / Sửa chữa"
              >
                <Wrench className="w-4 h-4" />
              </button>
            )}
            {row.original.status === 'RMA_REPAIR' && (
              <button
                onClick={() => {
                  updateSerialItem(row.original.id, { status: 'IN_STOCK' });
                  toast.success(`Thiết bị ${row.original.serialNumber} đã hoàn tất bảo hành và nhập lại kho`);
                }}
                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                title="Hoàn tất bảo hành -> Trở lại Trong kho"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setSelectedSerial(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingSerial(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý số serial / IMEI</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý định danh từng chiếc thiết bị theo số serial, mã IMEI kép và theo dõi bảo hành
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm">
              <Plus className="w-4 h-4" /> Đăng ký serial / IMEI
            </button>
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
                placeholder="Tìm kiếm theo số serial, IMEI 1/2, SKU, tên sản phẩm..."
                className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Sản phẩm:</span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="">-- Tất cả sản phẩm có serial --</option>
                {serialManagedProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Trạng thái serial:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="IN_STOCK">Trong kho</option>
                <option value="SOLD">Đã bán</option>
                <option value="RESERVED">Đã giữ chỗ</option>
                <option value="RMA_REPAIR">Bảo hành</option>
                <option value="WRITTEN_OFF">Đã hủy kho</option>
              </select>
            </div>

            {(statusFilter !== 'all' || search || selectedProductId) && (
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); if(serialManagedProducts.length > 0) setSelectedProductId(serialManagedProducts[0].id); }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 ml-auto transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedSerial(row)} />
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={!!selectedSerial}
        onClose={() => setSelectedSerial(null)}
        title={selectedSerial ? `Hồ sơ thiết bị serial: ${selectedSerial.serialNumber}` : 'Hồ sơ serial'}
        width="max-w-lg"
      >
        {selectedSerial && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">Giá trị tài sản thiết bị</p>
                  <p className="text-xl font-bold font-mono text-gray-900 dark:text-white">{(selectedSerial.unitCost || 0).toLocaleString('vi-VN')} đ</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedSerial.status === 'IN_STOCK' ? 'bg-emerald-200 text-emerald-900' :
                selectedSerial.status === 'SOLD' ? 'bg-blue-200 text-blue-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {selectedSerial.status === 'IN_STOCK' ? 'Trong kho' : selectedSerial.status === 'SOLD' ? 'Đã bán' : 'Bảo hành'}
              </span>
            </div>

            {/* IMEI & MAC INFO */}
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
              <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-1">
                <Cpu className="w-4 h-4 text-blue-600" /> Thông số định danh kỹ thuật
              </span>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div className="p-2 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-900">
                  <span className="text-gray-400 text-[10px] block font-sans">Số IMEI 1:</span>
                  <span className="font-bold text-gray-900 dark:text-white text-xs">{selectedSerial.imei1 || '—'}</span>
                </div>
                <div className="p-2 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-900">
                  <span className="text-gray-400 text-[10px] block font-sans">Số IMEI 2:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{selectedSerial.imei2 || '—'}</span>
                </div>
              </div>

              {selectedSerial.macAddress && (
                <div className="p-2 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-900 font-mono text-xs">
                  <span className="text-gray-400 text-[10px] block font-sans">Địa chỉ MAC:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{selectedSerial.macAddress}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Tên sản phẩm</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSerial.productName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Mã SKU</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedSerial.sku}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Vị trí kho hiện tại</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedSerial.currentLocation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Hạn bảo hành</span>
                <span className="font-mono font-semibold text-primary">{selectedSerial.warrantyExpiry}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400">Đơn đặt hàng (PO)</span>
                <span className="font-mono text-gray-900 dark:text-white">{selectedSerial.poReference || 'Nhập thủ công'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedSerial(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors text-sm"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const s = selectedSerial;
                  setSelectedSerial(null);
                  handleOpenEdit(s);
                }}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium shadow-sm transition-colors text-sm flex items-center gap-1.5"
              >
                <Edit className="w-4 h-4" /> Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* FORM MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'create' ? 'Đăng ký số serial / IMEI thiết bị' : 'Cập nhật thông tin serial'}
        size="erp"
      >
        <div className="space-y-4">
          {formMode === 'create' && (
            <div className="flex rounded-xl bg-gray-100 dark:bg-gray-900 p-1 border border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setRegistrationType('single')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  registrationType === 'single'
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Nhập từng máy
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegistrationType('barcode');
                  setTimeout(() => barcodeInputRef.current?.focus(), 50);
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  registrationType === 'barcode'
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Barcode className="w-4 h-4" /> Quét máy quét mã vạch
              </button>
              <button
                type="button"
                onClick={() => setRegistrationType('bulk')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  registrationType === 'bulk'
                    ? 'bg-white dark:bg-gray-800 text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" /> Dán danh sách Excel
              </button>
            </div>
          )}

          <form onSubmit={handleSaveSerial} className="space-y-4">
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Chọn đơn đặt hàng (PO)</label>
                  <select
                    value={editingSerial.poReference || ''}
                    onChange={(e) => handleSelectPO(e.target.value)}
                    className="w-full p-2 border border-primary/30 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-semibold text-xs focus:ring-2 focus:ring-primary"
                  >
                    <option value="">-- Tự nhập không theo PO --</option>
                    {poList.map((po) => (
                      <option key={po.poNumber} value={po.poNumber}>
                        {po.poNumber} - {po.supplierName} ({po.locationName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Chọn sản phẩm (hàng serial / thiết bị) *</label>
                  <select
                    value={editingSerial.sku || ''}
                    onChange={(e) => {
                      const prod = availableFormProducts.find(p => p.sku === e.target.value) || products.find(p => p.sku === e.target.value);
                      setEditingSerial({
                        ...editingSerial,
                        sku: e.target.value,
                        productName: prod?.name || '',
                        category: prod?.category || 'Thiết bị điện tử',
                        unitCost: prod?.costPrice || editingSerial.unitCost || 15000000
                      });
                    }}
                    className="w-full p-2 border border-primary/30 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">-- Chọn sản phẩm có quản lý serial --</option>
                    {availableFormProducts.map(p => (
                      <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-medium">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Nhà cung cấp:</span>
                  <input
                    type="text"
                    value={editingSerial.vendorName || ''}
                    onChange={(e) => setEditingSerial({ ...editingSerial, vendorName: e.target.value })}
                    readOnly={!!editingSerial.poReference}
                    placeholder="Tự động điền..."
                    className={`w-full p-1.5 border border-gray-300 dark:border-gray-700 rounded text-xs ${editingSerial.poReference ? 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-gray-900'}`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Giá trị tài sản (đ):</span>
                  <input
                    type="number"
                    value={editingSerial.unitCost || 0}
                    onChange={(e) => setEditingSerial({ ...editingSerial, unitCost: parseFloat(e.target.value) || 0 })}
                    readOnly={!!editingSerial.poReference}
                    className={`w-full p-1.5 border border-gray-300 dark:border-gray-700 rounded text-xs font-mono font-bold ${editingSerial.poReference ? 'bg-gray-100 dark:bg-gray-900 text-primary' : 'bg-white dark:bg-gray-900'}`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Vị trí kho nhận:</span>
                  <input
                    type="text"
                    value={editingSerial.currentLocation || 'Kho tổng trung tâm'}
                    onChange={(e) => setEditingSerial({ ...editingSerial, currentLocation: e.target.value })}
                    readOnly={!!editingSerial.poReference}
                    className={`w-full p-1.5 border border-gray-300 dark:border-gray-700 rounded text-xs ${editingSerial.poReference ? 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-gray-900'}`}
                  />
                </div>
              </div>
            </div>

            {/* CHẾ ĐỘ 1: ĐĂNG KÝ ĐƠN LẺ */}
            {registrationType === 'single' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Số serial thiết bị *</label>
                    <input
                      type="text"
                      value={editingSerial.serialNumber || ''}
                      onChange={(e) => setEditingSerial({ ...editingSerial, serialNumber: e.target.value })}
                      placeholder="Ví dụ: SN1029384756..."
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono font-bold bg-white dark:bg-gray-900 text-primary"
                      required
                    />
                    {editingSerial.serialNumber && (
                      <p className={`text-[10px] mt-1 flex items-center gap-1 font-medium ${isValidSerial(editingSerial.serialNumber) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {isValidSerial(editingSerial.serialNumber) ? '✓ Định dạng Serial hợp lệ (6-32 ký tự)' : '⚠ Serial nên có từ 6 đến 32 ký tự chữ/số'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Địa chỉ MAC (nếu có)</label>
                    <input
                      type="text"
                      value={editingSerial.macAddress || ''}
                      onChange={(e) => setEditingSerial({ ...editingSerial, macAddress: e.target.value })}
                      placeholder="Ví dụ: 00:1A:2B:3C:4D:5E"
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* IMEI 1 & IMEI 2 */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 space-y-2">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-1">
                    <Smartphone className="w-4 h-4 text-blue-600" /> Định danh số IMEI 1 và IMEI 2 (chuẩn GSMA 15 chữ số)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Số IMEI 1 (SIM 1 / khay chính)</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={editingSerial.imei1 || ''}
                        onChange={(e) => setEditingSerial({ ...editingSerial, imei1: e.target.value.replace(/\D/g, '') })}
                        placeholder="Nhập 15 chữ số IMEI 1..."
                        className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-900 text-blue-900 dark:text-blue-200 font-bold"
                      />
                      {editingSerial.imei1 && (
                        <p className={`text-[10px] mt-1 flex items-center gap-1 font-medium ${isValidIMEI(editingSerial.imei1) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {isValidIMEI(editingSerial.imei1) ? '✓ IMEI 1 hợp lệ (Chuẩn Luhn GSMA 15 số)' : `⚠ IMEI 1 chưa đúng chuẩn Luhn (Hiện có ${editingSerial.imei1.length}/15 số)`}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Số IMEI 2 (SIM 2 / eSIM)</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={editingSerial.imei2 || ''}
                        onChange={(e) => setEditingSerial({ ...editingSerial, imei2: e.target.value.replace(/\D/g, '') })}
                        placeholder="Nhập 15 chữ số IMEI 2..."
                        className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-900 text-blue-900 dark:text-blue-200 font-bold"
                      />
                      {editingSerial.imei2 && (
                        <p className={`text-[10px] mt-1 flex items-center gap-1 font-medium ${isValidIMEI(editingSerial.imei2) ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                          {isValidIMEI(editingSerial.imei2) ? '✓ IMEI 2 hợp lệ (Chuẩn Luhn GSMA 15 số)' : `⚠ IMEI 2 chưa đúng chuẩn Luhn (Hiện có ${editingSerial.imei2.length}/15 số)`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHẾ ĐỘ 2: QUÉT MÃ VẠCH */}
            {registrationType === 'barcode' && (
              <div className="p-4 bg-gray-900 text-white rounded-xl border border-gray-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                    <Barcode className="w-4 h-4" /> Bắt đầu quét mã vạch và quét liên tục
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-900/60 text-emerald-300 font-mono font-bold rounded text-xs">
                    Đã quét: {scannedSerials.length} thiết bị
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleBarcodeScanSubmit(e);
                      }
                    }}
                    placeholder="Đặt con trỏ ở đây và quét mã vạch barcode/IMEI..."
                    className="w-full p-2.5 bg-black border border-emerald-500 rounded font-mono font-bold text-emerald-400 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={handleBarcodeScanSubmit}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded"
                  >
                    Thêm
                  </button>
                </div>

                {scannedSerials.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-black/60 rounded border border-gray-800">
                    {scannedSerials.map((sn, idx) => (
                      <div key={idx} className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950 text-emerald-300 font-mono font-bold rounded text-xs border border-emerald-800">
                        <span>{sn}</span>
                        <button
                          type="button"
                          onClick={() => setScannedSerials(scannedSerials.filter((_, i) => i !== idx))}
                          className="hover:text-red-400 ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CHẾ ĐỘ 3: IMPORT HÀNG LOẠT */}
            {registrationType === 'bulk' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Dán hoặc nhập danh sách số serial / IMEI (1 dòng 1 mã)
                </label>
                <textarea
                  rows={5}
                  value={bulkTextInput}
                  onChange={(e) => setBulkTextInput(e.target.value)}
                  placeholder={`Dán danh sách từ file vào đây...
SN1029384756
SN1029384757
SN1029384758`}
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded font-mono text-xs bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4" /> {formMode === 'create' ? 'Đăng ký & lưu dữ liệu' : 'Lưu cập nhật'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={!!deletingSerial}
        onClose={() => setDeletingSerial(null)}
        title="Xác nhận xóa số serial"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa số serial <strong>{deletingSerial?.serialNumber}</strong> của sản phẩm {deletingSerial?.productName}? Thao tác này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={() => setDeletingSerial(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium">Hủy bỏ</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
