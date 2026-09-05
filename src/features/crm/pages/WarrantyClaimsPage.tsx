import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Scan, Sparkles, ShieldCheck } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';
import { playBarcodeBeep } from '@/shared/utils/barcodeScanner';

export interface ClaimRecord {
  id: string;
  warrantyCode: string;
  claimCode: string;
  description: string;
  reportedAt: string;
  handler: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  notes?: string;
  conditionOnReceive?: string;
  estimatedReturnDate?: string;
  repairCost?: number;
  approvalStatus?: string;
  progressStatus?: string;
}

export function WarrantyClaimsPage() {
  const {
    warrantyClaims: storeClaims,
    productWarranties,
    fetchProductWarranties,
    fetchWarrantyClaims,
    addWarrantyClaim,
    updateWarrantyClaim,
    deleteWarrantyClaim,
  } = useCrmStore();

  useEffect(() => {
    fetchWarrantyClaims();
    if (fetchProductWarranties) fetchProductWarranties();
  }, [fetchWarrantyClaims, fetchProductWarranties]);

  const [deletingItem, setDeletingItem] = useState<ClaimRecord | null>(null);

  const lookupCustomerByCode = useCallback((code: string) => {
    if (!code) return null;
    const found = (productWarranties || []).find((w: any) => 
      (w.serialNumber && w.serialNumber.toLowerCase() === code.toLowerCase()) ||
      (w.warrantyCode && w.warrantyCode.toLowerCase() === code.toLowerCase()) ||
      (w.productName && w.productName.toLowerCase().includes(code.toLowerCase()))
    );
    if (found) {
      return {
        name: (found as any).customerName || 'Khách hàng có bảo hành',
        phone: (found as any).customerPhone || (found as any).phone || '',
        product: (found as any).productName || 'Thiết bị điện tử',
      };
    }
    return {
      name: 'Khách mang máy trực tiếp',
      phone: 'Tại quầy POS',
      product: `Thiết bị (${code})`,
    };
  }, [productWarranties]);

  const data: ClaimRecord[] = useMemo(() => {
    return storeClaims.map((c: any) => ({
      id: c.id,
      warrantyCode: c.serialNumber || c.warrantyCode || '',
      claimCode: c.claimCode || '',
      description: c.issueDescription || c.description || '',
      reportedAt: c.receivedDate || c.createdDate || '',
      handler: c.repairedBy || c.handler || 'Kỹ thuật viên',
      status: (c.status === 'COMPLETED' ? 'APPROVED' : c.status === 'REJECTED' ? 'REJECTED' : 'PENDING') as any,
      notes: c.notes || c.resolutionNotes || '',
      conditionOnReceive: c.conditionOnReceive,
      estimatedReturnDate: c.estimatedReturnDate,
      repairCost: c.repairCost,
      approvalStatus: c.approvalStatus,
      progressStatus: c.progressStatus || (c.status === 'COMPLETED' ? 'DONE' : 'NEW'),
    }));
  }, [storeClaims]);

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClaimRecord | null>(null);
  
  // Barcode scanner modal
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [targetScanField, setTargetScanField] = useState<'search' | 'form-warranty'>('search');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClaimRecord | null>(null);
  const [form, setForm] = useState({
    warrantyCode: '',
    claimCode: '',
    description: '',
    handler: '',
    status: 'PENDING' as ClaimRecord['status'],
    notes: '',
    conditionOnReceive: '',
    estimatedReturnDate: '',
    repairCost: 0,
    approvalStatus: 'PENDING_CHECK',
    progressStatus: 'NEW',
  });

  const [mockCustomer, setMockCustomer] = useState<{name: string, phone: string, product: string} | null>(null);

  const handleWarrantyCodeBlur = () => {
    const code = form.warrantyCode?.trim();
    if (code) {
      const info = lookupCustomerByCode(code);
      setMockCustomer(info);
      if (info?.name && info.name !== 'Khách mang máy trực tiếp') {
        toast.info(`Đã tìm thấy thông tin bảo hành: ${info.product || code}`);
      }
    } else {
      setMockCustomer(null);
    }
  };

  // Hardware Barcode Scanner listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (now - lastKeyTime > 65) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          const scanned = buffer.trim();
          buffer = '';
          playBarcodeBeep();
          toast.success(`Máy quét mã vạch: Đã nhận diện mã [${scanned}]`);

          if (isModalOpen) {
            setForm(prev => ({ ...prev, warrantyCode: scanned }));
            setMockCustomer(lookupCustomerByCode(scanned));
          } else {
            setSearch(scanned);
          }
        }
        return;
      }

      if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, lookupCustomerByCode]);

  const generateClaimCode = () => {
    const today = new Date();
    const yymmdd = today.getFullYear().toString().slice(-2) + 
      String(today.getMonth() + 1).padStart(2, '0') + 
      String(today.getDate()).padStart(2, '0');
    const pad4 = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    setForm(prev => ({ ...prev, claimCode: `YCBH-${yymmdd}-${pad4}` }));
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setMockCustomer(null);
    setForm({
      warrantyCode: '',
      claimCode: '',
      description: '',
      handler: 'Nhân viên hỗ trợ',
      status: 'PENDING',
      notes: '',
      conditionOnReceive: '',
      estimatedReturnDate: '',
      repairCost: 0,
      approvalStatus: 'PENDING_CHECK',
      progressStatus: 'NEW',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ClaimRecord) => {
    setEditingItem(item);
    setMockCustomer(null);
    setForm({
      warrantyCode: item.warrantyCode,
      claimCode: item.claimCode,
      description: item.description,
      handler: item.handler,
      status: item.status,
      notes: item.notes || '',
      conditionOnReceive: item.conditionOnReceive || '',
      estimatedReturnDate: item.estimatedReturnDate || '',
      repairCost: item.repairCost || 0,
      approvalStatus: item.approvalStatus || 'PENDING_CHECK',
      progressStatus: item.progressStatus || 'NEW',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      claimCode: form.claimCode,
      warrantyCode: form.warrantyCode,
      serialNumber: form.warrantyCode,
      customerName: mockCustomer?.name,
      customerPhone: mockCustomer?.phone,
      productName: mockCustomer?.product,
      issueDescription: form.description,
      status: form.status === 'APPROVED' ? 'COMPLETED' : form.status === 'REJECTED' ? 'REJECTED' : 'PROCESSING',
      resolutionNotes: form.notes,
      conditionOnReceive: form.conditionOnReceive,
      estimatedReturnDate: form.estimatedReturnDate,
      repairCost: form.repairCost,
      approvalStatus: form.approvalStatus,
      progressStatus: form.progressStatus,
    };

    try {
      if (editingItem) {
        await updateWarrantyClaim(editingItem.id, payload as any);
        toast.success(`Cập nhật yêu cầu ${form.claimCode} thành công!`);
      } else {
        await addWarrantyClaim(payload as any);
        toast.success(`Tạo mới yêu cầu bảo hành ${form.claimCode} thành công!`);
      }
      setIsModalOpen(false);
      fetchWarrantyClaims();
    } catch (err) {
      console.error('Error saving warranty claim:', err);
      toast.error('Lỗi khi lưu yêu cầu bảo hành');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteWarrantyClaim(deletingItem.id);
      toast.success(`Đã xóa yêu cầu ${deletingItem.claimCode}`);
      setDeletingItem(null);
      fetchWarrantyClaims();
    } catch (err) {
      console.error('Error deleting warranty claim:', err);
      toast.error('Lỗi khi xóa yêu cầu bảo hành');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (c) =>
        c.claimCode.toLowerCase().includes(q) ||
        c.warrantyCode.toLowerCase().includes(q) ||
        c.handler.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [search, data]);

  const columns = useMemo<ColumnDef<ClaimRecord>[]>(
    () => [
      {
        accessorKey: 'claimCode',
        header: 'Mã yêu cầu',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20 hover:underline">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'warrantyCode',
        header: 'Mã bảo hành',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: (info) => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'reportedAt',
        header: 'Ngày báo cáo',
        cell: (info) => <span className="text-sm font-mono text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'handler',
        header: 'Người xử lý',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'progressStatus',
        header: 'Tiến độ',
        cell: (info) => {
          const status = info.getValue() as string;
          const styleMap: Record<string, string> = {
            NEW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
            CHECKING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
            REPAIRING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
            WAITING_PARTS: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
            DONE: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
            RETURNED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
          };
          const labelMap: Record<string, string> = {
            NEW: 'Mới tiếp nhận',
            CHECKING: 'Đang kiểm tra',
            REPAIRING: 'Đang sửa chữa',
            WAITING_PARTS: 'Chờ linh kiện',
            DONE: 'Đã sửa xong',
            RETURNED: 'Đã trả khách',
          };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleMap[status] || 'bg-gray-100 text-gray-800'}`}>
              {labelMap[status] || status}
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
              onClick={() => setSelected(row.original)}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(row.original)}
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
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yêu cầu Bảo hành</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tiếp nhận, xử lý và tra cứu phiếu bảo hành bằng máy quét mã vạch hoặc Camera.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setTargetScanField('search');
                setIsCameraScannerOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              title="Quét mã vạch / Serial / QR Code bằng Camera"
            >
              <Scan className="w-4 h-4" /> Quét mã vạch / Serial
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
              onClick={handleOpenCreate}
            >
              <Plus className="w-4 h-4" /> Thêm mới yêu cầu
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập hoặc quét mã yêu cầu, mã bảo hành, serial, người xử lý..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
            <button
              onClick={() => {
                setTargetScanField('search');
                setIsCameraScannerOpen(true);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Mở Camera quét mã"
            >
              <Scan className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row) => setSelected(row)} />
      </div>

      {/* Drawer chi tiết */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Chi tiết yêu cầu: ${selected.claimCode}` : ''} width="max-w-lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Mã yêu cầu</p>
                <p className="font-mono font-bold text-primary">{selected.claimCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mã bảo hành</p>
                <p className="font-medium text-gray-900 dark:text-white">{selected.warrantyCode}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Mô tả</p>
                <p className="italic text-gray-700 dark:text-gray-300">{selected.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tình trạng nhận</p>
                <p className="text-gray-700 dark:text-gray-300">{selected.conditionOnReceive || '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Người xử lý</p>
                <p className="font-medium">{selected.handler}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tiến độ</p>
                <p>{selected.progressStatus}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Kết quả duyệt</p>
                <p>{selected.approvalStatus}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Chi phí sửa (nếu có)</p>
                <p>{selected.repairCost ? selected.repairCost.toLocaleString('vi-VN') + ' đ' : '-'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Ngày hẹn trả</p>
                <p>{selected.estimatedReturnDate || '-'}</p>
              </div>
            </div>

            {selected.notes && (
              <div>
                <p className="text-xs text-gray-500">Ghi chú</p>
                <p className="italic text-gray-700 dark:text-gray-300">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal tạo / sửa yêu cầu bảo hành */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'Cập nhật yêu cầu bảo hành' : 'Thêm mới yêu cầu bảo hành'} width="max-w-2xl">
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã yêu cầu</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={form.claimCode}
                  onChange={(e) => setForm({ ...form, claimCode: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
                />
                <button type="button" onClick={generateClaimCode} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm border border-gray-300 dark:border-gray-600 whitespace-nowrap">
                  Tạo mã tự động
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã bảo hành / Serial</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={form.warrantyCode}
                  onBlur={handleWarrantyCodeBlur}
                  onChange={(e) => setForm({ ...form, warrantyCode: e.target.value })}
                  placeholder="Quét hoặc nhập mã bảo hành/Serial..."
                  className="w-full pl-3 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    setTargetScanField('form-warranty');
                    setIsCameraScannerOpen(true);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Quét mã vạch bảo hành"
                >
                  <Scan className="w-4 h-4" />
                </button>
              </div>
              {mockCustomer && (
                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/30 text-sm">
                  <p><strong>Khách hàng:</strong> {mockCustomer.name} - {mockCustomer.phone}</p>
                  <p><strong>Sản phẩm:</strong> {mockCustomer.product}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tình trạng ngoại quan khi nhận máy *</label>
              <textarea
                required
                rows={2}
                placeholder="Máy trầy nhẹ 4 góc, màn hình không xước..."
                value={form.conditionOnReceive}
                onChange={(e) => setForm({ ...form, conditionOnReceive: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả sự cố khách báo *</label>
              <textarea
                required
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kết quả duyệt</label>
              <select
                value={form.approvalStatus}
                onChange={(e) => setForm({ ...form, approvalStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="PENDING_CHECK">Đang chờ kiểm tra</option>
                <option value="APPROVED">Bảo hành hợp lệ</option>
                <option value="REJECTED">Từ chối - Lỗi người dùng</option>
                <option value="PAID_REPAIR">Sửa tính phí</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tiến độ thực tế</label>
              <select
                value={form.progressStatus}
                onChange={(e) => setForm({ ...form, progressStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="NEW">Mới tiếp nhận</option>
                <option value="CHECKING">Đang kiểm tra</option>
                <option value="REPAIRING">Đang sửa chữa</option>
                <option value="WAITING_PARTS">Chờ linh kiện</option>
                <option value="DONE">Đã sửa xong</option>
                <option value="RETURNED">Đã trả khách</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi phí sửa chữa (nếu từ chối bảo hành)</label>
              <input
                type="number"
                placeholder="0"
                value={form.repairCost}
                onChange={(e) => setForm({ ...form, repairCost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hẹn trả dự kiến</label>
              <input
                type="date"
                value={form.estimatedReturnDate}
                onChange={(e) => setForm({ ...form, estimatedReturnDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú thêm</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            />
          </div>
          
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium"
            >
              {editingItem ? 'Lưu thông tin' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Quét mã vạch bằng Camera */}
      <Modal
        isOpen={isCameraScannerOpen}
        onClose={() => {
          stopCameraStream();
          setIsCameraScannerOpen(false);
        }}
        title="Quét mã vạch / Serial tiếp nhận bảo hành"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Hướng camera về phía tem mã vạch Serial / Mã sổ bảo hành hoặc chọn mã mô phỏng để test nhanh:
          </p>

          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border-2 border-indigo-500 shadow-xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            <div className="absolute inset-x-4 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-bounce pointer-events-none" />
            
            <div className="w-56 h-28 border-2 border-dashed border-indigo-400/80 rounded-lg flex items-center justify-center relative pointer-events-none">
              <div className="w-3 h-3 border-t-2 border-l-2 border-indigo-400 absolute -top-1 -left-1" />
              <div className="w-3 h-3 border-t-2 border-r-2 border-indigo-400 absolute -top-1 -right-1" />
              <div className="w-3 h-3 border-b-2 border-l-2 border-indigo-400 absolute -bottom-1 -left-1" />
              <div className="w-3 h-3 border-b-2 border-r-2 border-indigo-400 absolute -bottom-1 -right-1" />
              <span className="text-[10px] text-indigo-300 font-mono tracking-wider bg-black/60 px-2 py-0.5 rounded">
                CLAIM / SERIAL ALIGN
              </span>
            </div>

            <div className="absolute bottom-2 left-3 bg-black/70 px-2.5 py-0.5 rounded text-[10px] text-white font-mono flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SCANNER: READY</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-[11px] font-semibold text-gray-500 mb-2">Mã mẫu test thử (bấm để quét ngay):</p>
            <div className="flex flex-wrap gap-2">
              {['WRT-1001', 'YCBH-240827-1001', 'SN-IP15PM-0982', 'WRT-8821'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    playBarcodeBeep();
                    toast.success(`Đã quét mã: ${code}`);
                    if (targetScanField === 'form-warranty') {
                      setForm(prev => ({ ...prev, warrantyCode: code }));
                      setMockCustomer(lookupCustomerByCode(code));
                    } else {
                      setSearch(code);
                    }
                    stopCameraStream();
                    setIsCameraScannerOpen(false);
                  }}
                  className="px-2.5 py-1 text-xs font-mono font-semibold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setIsCameraScannerOpen(false);
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa yêu cầu bảo hành"
        description={`Bạn có chắc chắn muốn xóa yêu cầu bảo hành "${deletingItem?.claimCode}" không?`}
      />
    </>
  );
}
