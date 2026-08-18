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

export function SerialNumbersPage() {
  const {
    serialItems: data,
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

  // 1. FILTER PRODUCTS (Chỉ lấy sản phẩm có has_serial = true hoặc thiết bị công nghệ, loại bỏ hàng FMCG)
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
        supplierName: po.supplierName || po.supplier?.name || 'Công ty Công Nghệ Việt',
        locationName: po.destinationStore || 'Kho trung tâm',
        skus: Array.isArray(po.poLines) && po.poLines.length > 0 ? po.poLines.map((l: any) => ({
          sku: l.sku || `SKU-${idx + 1}`,
          name: l.productName || 'Sản phẩm đặt mua',
          unitCost: Number(l.unitPrice || 15000000),
        })) : [
          { sku: 'SKU-IP15-128', name: 'iPhone 15 Pro Max 256GB', unitCost: 28500000 },
          { sku: 'SKU-XPRINTER-Q200', name: 'Máy in hóa đơn nhiệt Xprinter Q200', unitCost: 1850000 },
        ]
      }));

      if (mapped.length === 0) {
        setPoList([
          {
            poNumber: 'PO-2026-7394416',
            supplierName: 'Công ty Công Nghệ Việt (VTP)',
            locationName: 'Kho tổng Trung tâm (Hà Nội)',
            skus: [
              { sku: 'SKU-IP15-128', name: 'iPhone 15 Pro Max 256GB', unitCost: 28500000 },
              { sku: 'SKU-DELL-XPS', name: 'Laptop Dell XPS 15 9530', unitCost: 35000000 },
            ]
          },
          {
            poNumber: 'PO-2026-6756535',
            supplierName: 'Công ty TNHH Thiết Bị Số FPT',
            locationName: 'Kho Chi nhánh Quận 1 (TP.HCM)',
            skus: [
              { sku: 'SKU-SS-S24', name: 'Samsung Galaxy S24 Ultra', unitCost: 26900000 },
              { sku: 'SKU-XPRINTER-Q200', name: 'Máy in hóa đơn nhiệt Xprinter Q200', unitCost: 1850000 },
            ]
          }
        ]);
      } else {
        setPoList(mapped);
      }
    } catch (err) {
      setPoList([
        {
          poNumber: 'PO-2026-7394416',
          supplierName: 'Công ty Công Nghệ Việt (VTP)',
          locationName: 'Kho tổng Trung tâm (Hà Nội)',
          skus: [
            { sku: 'SKU-IP15-128', name: 'iPhone 15 Pro Max 256GB', unitCost: 28500000 },
            { sku: 'SKU-DELL-XPS', name: 'Laptop Dell XPS 15 9530', unitCost: 35000000 },
          ]
        },
        {
          poNumber: 'PO-2026-6756535',
          supplierName: 'Công ty TNHH Thiết Bị Số FPT',
          locationName: 'Kho Chi nhánh Quận 1 (TP.HCM)',
          skus: [
            { sku: 'SKU-SS-S24', name: 'Samsung Galaxy S24 Ultra', unitCost: 26900000 },
          ]
        }
      ]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchPOReferences();
  }, [fetchProducts]);

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
      currentLocation: 'Kho tổng Trung tâm',
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

  // 3. PO AUTO-FILL LOGIC
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

      toast.info(`Tự động điền theo PO ${poNum}: ${matched.supplierName} - Kho: ${matched.locationName}`);
    } else {
      setEditingSerial(prev => ({ ...prev, poReference: poNum }));
    }
  };

  // Filter available product dropdown based on PO reference
  const availableFormProducts = useMemo(() => {
    if (!editingSerial.poReference) return serialManagedProducts;
    const poMatch = poList.find(p => p.poNumber === editingSerial.poReference);
    if (!poMatch || poMatch.skus.length === 0) return serialManagedProducts;
    const poSkuList = poMatch.skus.map(s => s.sku);
    const filtered = serialManagedProducts.filter(p => poSkuList.includes(p.sku));
    return filtered.length > 0 ? filtered : serialManagedProducts;
  }, [editingSerial.poReference, serialManagedProducts, poList]);

  // 2. BARCODE SCANNER HANDLER
  const handleBarcodeScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = barcodeInput.trim();
    if (!clean) return;

    // Check duplicate in current scanned batch
    if (scannedSerials.includes(clean)) {
      toast.error(`Số Serial/IMEI [${clean}] đã có trong danh sách quét!`);
      setBarcodeInput('');
      return;
    }
    // Check duplicate in system database
    const existing = data.find(d => d.serialNumber === clean || d.imei1 === clean || d.imei2 === clean);
    if (existing) {
      toast.error(`⚠️ Cảnh báo: Số Serial/IMEI [${clean}] đã tồn tại ở sản phẩm ${existing.productName}!`);
      setBarcodeInput('');
      return;
    }

    setScannedSerials([clean, ...scannedSerials]);
    toast.success(`✓ Đã quét thành công: ${clean}`);
    setBarcodeInput('');
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  // 4. VALIDATION (UNIQUE & IMEI 15 DIGITS)
  const validateForm = (): boolean => {
    const sn = (editingSerial.serialNumber || '').trim();
    const imei1 = (editingSerial.imei1 || '').trim();
    const imei2 = (editingSerial.imei2 || '').trim();
    const mac = (editingSerial.macAddress || '').trim();

    if (!sn) {
      toast.error('Vui lòng nhập Số Serial!');
      return false;
    }

    // UNIQUE CHECK
    const duplicateSN = data.find(d => d.id !== editingSerial.id && d.serialNumber.toLowerCase() === sn.toLowerCase());
    if (duplicateSN) {
      toast.error(`Trùng lặp: Số Serial [${sn}] đã tồn tại ở sản phẩm ${duplicateSN.productName}!`);
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

    if (mac) {
      const duplicateMAC = data.find(d => d.id !== editingSerial.id && d.macAddress?.toLowerCase() === mac.toLowerCase());
      if (duplicateMAC) {
        toast.error(`Trùng lặp: Địa chỉ MAC [${mac}] đã tồn tại trong hệ thống!`);
        return false;
      }
    }

    return true;
  };

  const handleSaveSerial = async (e: React.FormEvent) => {
    e.preventDefault();

    const prod = products.find(p => p.sku === editingSerial.sku) || serialManagedProducts[0];
    if (!prod) return;

    if (registrationType === 'single') {
      if (!validateForm()) return;

      if (formMode === 'create') {
        await addProductSerials(Number(prod.id), [editingSerial.serialNumber!], editingSerial.notes);
        toast.success(`Đã đăng ký thành công Serial [${editingSerial.serialNumber}]`);
      } else if (editingSerial.id) {
        updateSerialItem(editingSerial.id, editingSerial);
        toast.success('Cập nhật thông tin Serial thành công');
      }
    } else if (registrationType === 'barcode') {
      if (scannedSerials.length === 0) {
        toast.error('Vui lòng quét ít nhất 1 mã vạch Serial/IMEI');
        return;
      }
      await addProductSerials(Number(prod.id), scannedSerials, editingSerial.notes || 'Nhập kho bằng máy quét mã vạch Barcode');
      toast.success(`Đã nhập hàng loạt ${scannedSerials.length} mã Serial cho sản phẩm ${prod.name}!`);
    } else if (registrationType === 'bulk') {
      const lines = bulkTextInput.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
      if (lines.length === 0) {
        toast.error('Vui lòng dán danh sách số Serial/IMEI');
        return;
      }
      await addProductSerials(Number(prod.id), lines, editingSerial.notes || 'Import hàng loạt danh sách Excel/CSV');
      toast.success(`Đã Import thành công lô ${lines.length} thiết bị Serial!`);
    }

    setIsFormOpen(false);
    if (selectedProductId !== prod.id) {
      setSelectedProductId(prod.id);
    } else {
      await fetchSerialsByProduct(Number(prod.id));
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingSerial) return;
    deleteSerialItem(deletingSerial.id);
    toast.success(`Đã xóa số Serial ${deletingSerial.serialNumber}`);
    setDeletingSerial(null);
    if (selectedSerial?.id === deletingSerial.id) {
      setSelectedSerial(null);
    }
  };

  const columns = useMemo<ColumnDef<SerialItemRecord>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: 'Số Serial',
        cell: (info) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Sản phẩm / SKU',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900 dark:text-white text-sm">{row.original.productName}</p>
            <p className="text-xs font-mono text-gray-500">{row.original.sku}</p>
          </div>
        ),
      },
      {
        accessorKey: 'imei1',
        header: 'Thông số IMEI 1 / IMEI 2',
        cell: ({ row }) => (
          <div className="text-xs font-mono">
            {row.original.imei1 ? (
              <div className="text-gray-900 dark:text-white">IMEI 1: <strong>{row.original.imei1}</strong></div>
            ) : <span className="text-gray-400">---</span>}
            {row.original.imei2 && (
              <div className="text-blue-600 dark:text-blue-400">IMEI 2: <strong>{row.original.imei2}</strong></div>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const statusMap: Record<string, string> = {
            IN_STOCK: 'Trong kho',
            SOLD: 'Đã bán',
            RESERVED: 'Đã đặt trước',
            RMA_REPAIR: 'Đang bảo hành',
            WRITTEN_OFF: 'Thanh lý / Hủy',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'IN_STOCK' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'SOLD' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'RESERVED' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' :
              status === 'RMA_REPAIR' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {statusMap[status] || status}
            </span>
          );
        },
      },
      {
        accessorKey: 'currentLocation',
        header: 'Vị trí hiện tại',
      },
      {
        accessorKey: 'unitCost',
        header: 'Giá trị tài sản',
        cell: (info) => <span className="font-bold font-mono text-gray-900 dark:text-white">{(info.getValue() as number).toLocaleString('vi-VN')} ₫</span>,
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedSerial(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingSerial(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý số Serial & IMEI thiết bị</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Định danh từng thiết bị điện tử, smartphone (IMEI 1/2), laptop, máy in bằng barcode & quét hàng loạt.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Dữ Liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Đăng ký Serial / IMEI
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
                placeholder="Tìm kiếm theo số Serial, IMEI 1/2, SKU, tên sản phẩm..."
                className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/60">
            {/* 1. TINH LỌC DANH SÁCH SẢN PHẨM DROPDOWN */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Sản phẩm (Chỉ lọc hàng Serial):</span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="">-- Tất cả sản phẩm có Serial --</option>
                {serialManagedProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500 font-medium">Trạng thái serial:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="font-semibold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="IN_STOCK">Trong kho (IN STOCK)</option>
                <option value="SOLD">Đã bán (SOLD)</option>
                <option value="RESERVED">Đã giữ chỗ (RESERVED)</option>
                <option value="RMA_REPAIR">Bảo hành (RMA REPAIR)</option>
                <option value="WRITTEN_OFF">Đã hủy kho (WRITTEN OFF)</option>
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
        title={selectedSerial ? `📱 Hồ sơ Kỹ Thuật Serial: ${selectedSerial.serialNumber}` : 'Hồ sơ Serial'}
        width="max-w-lg"
      >
        {selectedSerial && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold uppercase tracking-wider">Giá trị tài sản thiết bị</p>
                  <p className="text-xl font-bold font-mono text-gray-900 dark:text-white">{selectedSerial.unitCost.toLocaleString('vi-VN')} ₫</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedSerial.status === 'IN_STOCK' ? 'bg-emerald-200 text-emerald-900' :
                selectedSerial.status === 'SOLD' ? 'bg-blue-200 text-blue-900' : 'bg-amber-200 text-amber-900'
              }`}>
                {selectedSerial.status === 'IN_STOCK' ? 'Trong kho' : selectedSerial.status === 'SOLD' ? 'Đã bán' : 'Bảo hành'}
              </span>
            </div>

            {/* THÔNG SỐ KỸ THUẬT IMEI & MAC ADDRESS */}
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-2">
              <span className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-1">
                <Cpu className="w-4 h-4 text-blue-600" /> THÔNG SỐ ĐỊNH DANH KỸ THUẬT (SMARTPHONE / DUAL SIM)
              </span>

              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div className="p-2 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-900">
                  <span className="text-gray-400 text-[10px] block font-sans">SỐ IMEI 1:</span>
                  <span className="font-bold text-gray-900 dark:text-white text-xs">{selectedSerial.imei1 || '---'}</span>
                </div>
                <div className="p-2 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-900">
                  <span className="text-gray-400 text-[10px] block font-sans">SỐ IMEI 2 (DUAL SIM / eSIM):</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{selectedSerial.imei2 || '---'}</span>
                </div>
              </div>

              {selectedSerial.macAddress && (
                <div className="p-2 bg-white dark:bg-gray-900 rounded border border-blue-200 dark:border-blue-900 font-mono text-xs">
                  <span className="text-gray-400 text-[10px] block font-sans">ĐỊA CHỈ MAC:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{selectedSerial.macAddress}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                  <Building2 className="w-4 h-4 text-emerald-600" /> Vị trí kho
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{selectedSerial.currentLocation}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Hạn bảo hành
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{selectedSerial.warrantyExpiry}</p>
              </div>
            </div>

            <div className="space-y-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Tên sản phẩm:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedSerial.productName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Mã SKU:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{selectedSerial.sku}</span>
              </div>
              {selectedSerial.vendorName && (
                <div className="flex justify-between items-center text-xs border-t pt-1.5">
                  <span className="text-gray-500">Nhà cung cấp:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedSerial.vendorName}</span>
                </div>
              )}
              {selectedSerial.poReference && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Phiếu nhập gốc (PO):</span>
                  <span className="font-mono font-bold text-emerald-600">{selectedSerial.poReference}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* FORM MODAL (ADD / EDIT / BARCODE / BULK IMPORT) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'create' ? '📦 Đăng ký Số Serial / IMEI mới' : '⚙️ Cập nhật thông tin Serial'}
        width="max-w-3xl"
      >
        <div className="space-y-4 text-xs">
          {/* TAB CHỌN PHƯƠNG THỨC ĐĂNG KÝ HÀNG LOẠT */}
          {formMode === 'create' && (
            <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2">
              <button
                type="button"
                onClick={() => setRegistrationType('single')}
                className={`pb-2 px-3 font-bold border-b-2 transition ${
                  registrationType === 'single' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'
                }`}
              >
                1. Đăng ký Đơn lẻ (Kèm IMEI/MAC)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegistrationType('barcode');
                  setTimeout(() => barcodeInputRef.current?.focus(), 100);
                }}
                className={`pb-2 px-3 font-bold border-b-2 transition flex items-center gap-1 ${
                  registrationType === 'barcode' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'
                }`}
              >
                <Barcode className="w-4 h-4" /> 2. ⚡ Quét Mã Vạch Barcode
              </button>
              <button
                type="button"
                onClick={() => setRegistrationType('bulk')}
                className={`pb-2 px-3 font-bold border-b-2 transition flex items-center gap-1 ${
                  registrationType === 'bulk' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'
                }`}
              >
                <Upload className="w-4 h-4" /> 3. 📁 Import Hàng Loạt Excel/CSV
              </button>
            </div>
          )}

          <form onSubmit={handleSaveSerial} className="space-y-4">
            {/* 3. TỰ ĐỘNG HÓA LIÊN KẾT PHIẾU NHẬP (PO AUTO-FILL) */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-2">
              <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase flex items-center gap-1">
                🔗 LIÊN KẾT PHIẾU NHẬP (PO AUTO-FILL) & SẢN PHẨM HÀNG THIẾT BỊ
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Phiếu nhập tham chiếu (PO) *</label>
                  <select
                    value={editingSerial.poReference || ''}
                    onChange={(e) => handleSelectPO(e.target.value)}
                    className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono font-bold"
                  >
                    <option value="">-- Tự nhập không theo PO --</option>
                    {poList.map((po) => (
                      <option key={po.poNumber} value={po.poNumber}>
                        {po.poNumber} - {po.supplierName} ({po.locationName})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1. TINH LỌC DANH SÁCH SẢN PHẨM DROPDOWN */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Chọn Sản Phẩm (Chỉ hàng Serial/Thiết bị) *</label>
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
                    className="w-full p-2 border border-emerald-300 dark:border-emerald-700 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                    required
                  >
                    <option value="">-- Chọn sản phẩm có quản lý Serial --</option>
                    {availableFormProducts.map(p => (
                      <option key={p.id} value={p.sku}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* TỰ ĐỘNG ĐIỀN KHÓA CỐ ĐỊNH NHÀ CUNG CẤP & VỊ TRÍ KHO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-semibold">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Nhà cung cấp (Tự động):</span>
                  <input
                    type="text"
                    value={editingSerial.vendorName || ''}
                    onChange={(e) => setEditingSerial({ ...editingSerial, vendorName: e.target.value })}
                    readOnly={!!editingSerial.poReference}
                    placeholder="Tự động điền..."
                    className={`w-full p-1.5 border rounded text-xs ${editingSerial.poReference ? 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-gray-900'}`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Giá trị tài sản (₫):</span>
                  <input
                    type="number"
                    value={editingSerial.unitCost || 0}
                    onChange={(e) => setEditingSerial({ ...editingSerial, unitCost: parseFloat(e.target.value) || 0 })}
                    readOnly={!!editingSerial.poReference}
                    className={`w-full p-1.5 border rounded text-xs font-mono font-bold ${editingSerial.poReference ? 'bg-gray-100 dark:bg-gray-900 text-emerald-600' : 'bg-white dark:bg-gray-900'}`}
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase block">Vị trí kho nhận:</span>
                  <input
                    type="text"
                    value={editingSerial.currentLocation || 'Kho tổng Trung tâm'}
                    onChange={(e) => setEditingSerial({ ...editingSerial, currentLocation: e.target.value })}
                    readOnly={!!editingSerial.poReference}
                    className={`w-full p-1.5 border rounded text-xs ${editingSerial.poReference ? 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200' : 'bg-white dark:bg-gray-900'}`}
                  />
                </div>
              </div>
            </div>

            {/* CHẾ ĐỘ 1: ĐĂNG KÝ ĐƠN LẺ */}
            {registrationType === 'single' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Số Serial thiết bị *</label>
                    <input
                      type="text"
                      value={editingSerial.serialNumber || ''}
                      onChange={(e) => setEditingSerial({ ...editingSerial, serialNumber: e.target.value })}
                      placeholder="VD: SN1029384756..."
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono font-bold bg-white dark:bg-gray-900 text-emerald-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Địa chỉ MAC (Nếu có)</label>
                    <input
                      type="text"
                      value={editingSerial.macAddress || ''}
                      onChange={(e) => setEditingSerial({ ...editingSerial, macAddress: e.target.value })}
                      placeholder="VD: 00:1A:2B:3C:4D:5E"
                      className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* 4. TRƯỜNG KỸ THUẬT IMEI 1 VÀ IMEI 2 */}
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 space-y-2">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase flex items-center gap-1">
                    <Smartphone className="w-4 h-4 text-blue-600" /> ĐỊNH DANH SỐ IMEI 1 VÀ IMEI 2 (Chuẩn GSMA 15 chữ số)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Số IMEI 1 (SIM 1 / Khay SIM chính)</label>
                      <input
                        type="text"
                        maxLength={15}
                        value={editingSerial.imei1 || ''}
                        onChange={(e) => setEditingSerial({ ...editingSerial, imei1: e.target.value.replace(/\D/g, '') })}
                        placeholder="Nhập 15 chữ số IMEI 1..."
                        className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-900 text-blue-900 dark:text-blue-200 font-bold"
                      />
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
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHẾ ĐỘ 2: QUÉT MÃ VẠCH MÁY QUÉT BARCODE SCANNER */}
            {registrationType === 'barcode' && (
              <div className="p-4 bg-gray-900 text-white rounded-xl border border-gray-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-400 text-xs flex items-center gap-1">
                    <Barcode className="w-4 h-4" /> BẮT ĐẦU CẮM MÁY QUÉT MÃ VẠCH VÀ QUÉT LIÊN TỤC
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
                    placeholder="Đặt con trỏ ở đây và quét mã vạch Barcode/IMEI..."
                    className="w-full p-2.5 bg-black border border-emerald-500 rounded font-mono font-bold text-emerald-400 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={handleBarcodeScanSubmit}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
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

            {/* CHẾ ĐỘ 3: IMPORT HÀNG LOẠT EXCEL / CSV */}
            {registrationType === 'bulk' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                  📁 DÁN HOẶC IMPORT DANH SÁCH SỐ SERIAL / IMEI (1 dòng 1 mã)
                </label>
                <textarea
                  rows={5}
                  value={bulkTextInput}
                  onChange={(e) => setBulkTextInput(e.target.value)}
                  placeholder="Dán danh sách từ Excel vào đây...
SN1029384756
SN1029384757
SN1029384758"
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded font-mono text-xs bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4" /> {formMode === 'create' ? 'Đăng ký & Lưu dữ liệu' : 'Lưu Cập Nhật'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={!!deletingSerial}
        onClose={() => setDeletingSerial(null)}
        title="Xóa số serial"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa số serial <strong>{deletingSerial?.serialNumber}</strong> của sản phẩm {deletingSerial?.productName}? Thao tác này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setDeletingSerial(null)} className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300">Hủy</button>
            <button type="button" onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold">Đồng ý xóa</button>
          </div>
        </div>
      </Modal>
    </>
  );
}
