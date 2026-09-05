import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Download, Search, Eye, Edit, Trash2, Scan, QrCode, Sparkles, CheckCircle2, ShieldCheck, Volume2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';
import { playBarcodeBeep } from '@/shared/utils/barcodeScanner';

export interface WarrantyRecord {
  id: string;
  warrantyCode: string;
  serialNumber?: string;
  serialOrIMEI: string;
  productName?: string;
  customerName: string;
  customerPhone?: string;
  startDate: string;
  durationMonths?: number;
  expiryDate: string;
  terms?: string;
  status: 'HOẠT_ĐỘNG' | 'HẾT_HẠN' | 'HỦY';
  notes?: string;
}

export function ProductWarrantiesPage() {
  const {
    productWarranties: storeWarranties,
    fetchProductWarranties,
    addProductWarranty,
    updateProductWarranty,
    deleteProductWarranty,
    isLoading,
  } = useCrmStore();

  useEffect(() => {
    fetchProductWarranties();
  }, [fetchProductWarranties]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedItem, setSelectedItem] = useState<WarrantyRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<WarrantyRecord>>({});
  const [deletingItem, setDeletingItem] = useState<WarrantyRecord | null>(null);

  // Barcode / Serial Scanner State
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [targetScanField, setTargetScanField] = useState<'search' | 'form-serial'>('search');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const data: WarrantyRecord[] = useMemo(() => {
    return (storeWarranties || []).map((item) => ({
      id: String(item.id),
      warrantyCode: `WRT-${String(item.id).padStart(4, '0')}`,
      customerName: item.customerName || 'Khách hàng',
      customerPhone: item.customerPhone || '',
      productName: item.productName || 'Sản phẩm',
      serialOrIMEI: item.serialNumber || 'N/A',
      startDate: item.purchaseDate ? String(item.purchaseDate).split('T')[0] : '2024-01-01',
      expiryDate: item.expiryDate ? String(item.expiryDate).split('T')[0] : '2025-01-01',
      terms: 'Bảo hành chính hãng',
      status: (item.status === 'EXPIRED' ? 'HẾT_HẠN' : item.status === 'VOIDED' ? 'HỦY' : 'HOẠT_ĐỘNG') as any,
    }));
  }, [storeWarranties]);

  // 1. Tự động bắt tín hiệu quét từ Máy quét mã vạch phần cứng (USB / Bluetooth / 2.4G)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      
      const now = Date.now();
      // Máy quét bắn ký tự rất nhanh (< 50ms giữa các ký tự)
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
            setEditingItem(prev => ({ ...prev, serialOrIMEI: scanned }));
          } else {
            setSearch(scanned);
            const matched = data.find(
              d => d.warrantyCode.toLowerCase() === scanned.toLowerCase() ||
                   (d.serialOrIMEI && d.serialOrIMEI.toLowerCase() === scanned.toLowerCase())
            );
            if (matched) {
              setSelectedItem(matched);
              toast.info(`Tìm thấy sổ bảo hành của khách hàng: ${matched.customerName}`);
            }
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
  }, [data, isModalOpen]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.warrantyCode.toLowerCase().includes(search.toLowerCase()) ||
        item.customerName.toLowerCase().includes(search.toLowerCase()) ||
        item.serialOrIMEI.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Tất cả' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      warrantyCode: `WRT-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: '',
      serialOrIMEI: '',
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      terms: 'Bảo hành chính hãng',
      status: 'HOẠT_ĐỘNG',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WarrantyRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.customerName) {
      toast.error('Vui lòng nhập tên khách hàng');
      return;
    }

    const payload: any = {
      serialNumber: editingItem.serialOrIMEI || '',
      productName: editingItem.productName || 'Sản phẩm',
      customerName: editingItem.customerName,
      customerPhone: editingItem.customerPhone || '',
      purchaseDate: editingItem.startDate || new Date().toISOString().split('T')[0],
      expiryDate: editingItem.expiryDate || new Date().toISOString().split('T')[0],
      warrantyMonths: 12,
      status: editingItem.status === 'HẾT_HẠN' ? 'EXPIRED' : editingItem.status === 'HỦY' ? 'VOIDED' : 'VALID',
    };

    try {
      if (modalMode === 'create') {
        await addProductWarranty(payload);
        toast.success(`Tạo sổ bảo hành cho ${editingItem.customerName} thành công!`);
      } else if (editingItem.id) {
        await updateProductWarranty(editingItem.id, payload);
        toast.success(`Cập nhật sổ bảo hành ${editingItem.warrantyCode || ''} thành công!`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Error saving warranty:', err);
      toast.error(err?.message || 'Lỗi khi lưu sổ bảo hành');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteProductWarranty(deletingItem.id);
      toast.success(`Đã xóa sổ bảo hành ${deletingItem.warrantyCode}`);
      if (selectedItem?.id === deletingItem.id) {
        setSelectedItem(null);
      }
      setDeletingItem(null);
    } catch (err: any) {
      console.error('Error deleting warranty:', err);
      toast.error(err?.message || 'Lỗi khi xóa sổ bảo hành');
    }
  };

  const columns = useMemo<ColumnDef<WarrantyRecord>[]>(
    () => [
      {
        accessorKey: 'warrantyCode',
        header: 'Mã sổ bảo hành',
        cell: (info) => (
          <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'serialOrIMEI',
        header: 'Serial / IMEI',
        cell: (info) => <span className="text-sm text-gray-600 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const labelMap: Record<string, string> = {
            HOẠT_ĐỘNG: 'Đang hoạt động',
            HẾT_HẠN: 'Hết hạn',
            HỦY: 'Đã hủy',
          };
          const badge = {
            HOẠT_ĐỘNG: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
            HẾT_HẠN: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
            HỦY: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
          }[status] || 'bg-gray-100 text-gray-800';
          return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge}`}>{labelMap[status] || status}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sổ bảo hành sản phẩm</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý hồ sơ bảo hành, tra cứu nhanh Serial/IMEI bằng máy quét mã vạch hoặc Camera.
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
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium">
              <Download className="w-4 h-4" /> Xuất Dữ Liệu
            </button>
            <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold">
              <Plus className="w-4 h-4" /> Thêm sổ bảo hành
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
              placeholder="Nhập hoặc quét mã bảo hành, serial, IMEI, tên khách hàng..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary text-sm"
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
          >
            <option value="Tất cả">Tất cả trạng thái</option>
            <option value="HOẠT_ĐỘNG">Đang hoạt động</option>
            <option value="HẾT_HẠN">Hết hạn</option>
            <option value="HỦY">Đã hủy</option>
          </select>
        </div>

        <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row) => setSelectedItem(row)} />
      </div>

      {/* Drawer chi tiết */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title={selectedItem ? `Chi tiết sổ bảo hành: ${selectedItem.warrantyCode}` : ''} width="max-w-lg">
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-gray-500">Mã bảo hành</span>
                <p className="font-mono font-bold text-gray-900 dark:text-white">{selectedItem.warrantyCode}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Khách hàng</span>
                <p className="font-medium text-gray-900 dark:text-white">{selectedItem.customerName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Serial / IMEI</span>
                <p className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{selectedItem.serialOrIMEI || 'N/A'}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ngày bắt đầu</span>
                <p className="font-medium text-gray-900 dark:text-white font-mono">{selectedItem.startDate}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Ngày hết hạn</span>
                <p className="font-medium text-gray-900 dark:text-white font-mono">{selectedItem.expiryDate}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Trạng thái</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${selectedItem.status === 'HOẠT_ĐỘNG' ? 'bg-emerald-100 text-emerald-800' : selectedItem.status === 'HẾT_HẠN' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                  {selectedItem.status === 'HOẠT_ĐỘNG' ? 'Đang hoạt động' : selectedItem.status === 'HẾT_HẠN' ? 'Hết hạn' : 'Đã hủy'}
                </span>
              </div>
            </div>
            <div className="border-t pt-4">
              <span className="text-xs font-semibold text-gray-400 uppercase">Điều khoản bảo hành</span>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{selectedItem.terms || 'Chưa cập nhật'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal tạo / sửa */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Thêm mới sổ bảo hành' : 'Cập nhật sổ bảo hành'}>
        <form onSubmit={handleSave} className="space-y-4 p-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Mã bảo hành *</label>
            <input
              type="text"
              value={editingItem.warrantyCode || ''}
              onChange={(e) => setEditingItem({ ...editingItem, warrantyCode: e.target.value })}
              className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
              required
              disabled={modalMode === 'edit'}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Khách hàng *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Serial / IMEI</label>
              <div className="relative">
                <input
                  type="text"
                  value={editingItem.serialOrIMEI || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, serialOrIMEI: e.target.value })}
                  placeholder="Quét hoặc nhập Serial..."
                  className="w-full pl-3 pr-9 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    setTargetScanField('form-serial');
                    setIsCameraScannerOpen(true);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Quét mã vạch Serial / IMEI"
                >
                  <Scan className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Ngày bắt đầu *</label>
              <input
                type="date"
                value={editingItem.startDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Ngày hết hạn *</label>
              <input
                type="date"
                value={editingItem.expiryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Trạng thái *</label>
              <select
                value={editingItem.status || 'HOẠT_ĐỘNG'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="HOẠT_ĐỘNG">Đang hoạt động</option>
                <option value="HẾT_HẠN">Hết hạn</option>
                <option value="HỦY">Đã hủy</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">Điều khoản bảo hành</label>
            <textarea
              rows={3}
              value={editingItem.terms || ''}
              onChange={(e) => setEditingItem({ ...editingItem, terms: e.target.value })}
              className="w-full px-3 py-2 border rounded text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded text-sm">
              Hủy bỏ
            </button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded text-sm font-medium">
              {modalMode === 'create' ? 'Thêm mới' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Quét mã vạch / Serial Number bằng Camera */}
      <Modal
        isOpen={isCameraScannerOpen}
        onClose={() => {
          stopCameraStream();
          setIsCameraScannerOpen(false);
        }}
        title="Quét mã vạch / Serial / QR Code bảo hành"
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Hướng camera về phía tem mã vạch Serial/IMEI trên thiết bị, hoặc chọn mã mô phỏng bên dưới để thử nghiệm:
          </p>

          {/* Khung ngắm Laser Barcode Scanner */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border-2 border-indigo-500 shadow-xl flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Tia Laser quét mã vạch đỏ chuyển động */}
            <div className="absolute inset-x-4 h-0.5 bg-red-500 shadow-[0_0_12px_#ef4444] animate-bounce pointer-events-none" />
            
            {/* Khung ngắm mã vạch */}
            <div className="w-56 h-28 border-2 border-dashed border-indigo-400/80 rounded-lg flex items-center justify-center relative pointer-events-none">
              <div className="w-3 h-3 border-t-2 border-l-2 border-indigo-400 absolute -top-1 -left-1" />
              <div className="w-3 h-3 border-t-2 border-r-2 border-indigo-400 absolute -top-1 -right-1" />
              <div className="w-3 h-3 border-b-2 border-l-2 border-indigo-400 absolute -bottom-1 -left-1" />
              <div className="w-3 h-3 border-b-2 border-r-2 border-indigo-400 absolute -bottom-1 -right-1" />
              <span className="text-[10px] text-indigo-300 font-mono tracking-wider bg-black/60 px-2 py-0.5 rounded">
                BARCODE / SERIAL ALIGN
              </span>
            </div>

            <div className="absolute bottom-2 left-3 bg-black/70 px-2.5 py-0.5 rounded text-[10px] text-white font-mono flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>SCANNER: READY (HID / CAM)</span>
            </div>
          </div>

          {/* Mã quét nhanh để test thử nghiệm */}
          <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-[11px] font-semibold text-gray-500 mb-2">Mã mẫu test thử (bấm để quét ngay):</p>
            <div className="flex flex-wrap gap-2">
              {['WRT-1001', 'SN-IP15PM-0982', 'IMEI-84930211', 'WRT-8821', 'SN-MACM3-9941'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    playBarcodeBeep();
                    toast.success(`Đã quét mã: ${code}`);
                    if (targetScanField === 'form-serial') {
                      setEditingItem(prev => ({ ...prev, serialOrIMEI: code }));
                    } else {
                      setSearch(code);
                      const matched = data.find(
                        d => d.warrantyCode.toLowerCase() === code.toLowerCase() ||
                             (d.serialOrIMEI && d.serialOrIMEI.toLowerCase() === code.toLowerCase())
                      );
                      if (matched) {
                        setSelectedItem(matched);
                      }
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
        title="Xác nhận xóa sổ bảo hành"
        description={`Bạn có chắc muốn xóa sổ bảo hành "${deletingItem?.warrantyCode}" của khách hàng "${deletingItem?.customerName}" không?`}
      />
    </>
  );
}

