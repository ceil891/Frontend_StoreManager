import { useMemo, useState, useEffect } from 'react';
import { Search, Download, Eye, Edit, Trash2, Plus } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import type { ColumnDef } from '@tanstack/react-table';
import { useFinanceStore } from '../store/financeStore';
import { toast } from 'sonner';

export interface FixedAssetItem {
  id: string;
  assetCode: string;
  assetName: string;
  category: string;
  purchaseDate: string;
  originalValue: number;
  salvageValue: number;
  usefulLifeMonths: number;
  depreciationMethod: string;
  accumulatedDep: number;
  netValue: number;
  status: string;
  notes?: string;
  serialNumber?: string;
  vendorName?: string;
  warrantyExpiry?: string;
}

const fmt = (n: number) => (n || 0).toLocaleString('vi-VN') + ' ₫';

export function FixedAssetsPage() {
  const {
    fixedAssets: storeAssets,
    fetchFixedAssets,
    addFixedAsset,
    updateFixedAsset,
    deleteFixedAsset,
  } = useFinanceStore();

  useEffect(() => {
    fetchFixedAssets();
  }, [fetchFixedAssets]);

  const data: FixedAssetItem[] = useMemo(() => {
    return storeAssets.map((a: any) => ({
      id: String(a.id),
      assetCode: a.assetCode || `FA-${a.id}`,
      assetName: a.assetName || 'Tài sản',
      category: a.category || 'Thiết bị văn phòng',
      purchaseDate: a.purchaseDate || a.purchasedDate || '2024-01-15',
      originalValue: Number(a.purchasePrice || a.originalValue || 0),
      salvageValue: Number(a.salvageValue || 0),
      usefulLifeMonths: Number(a.usefulLifeMonths || 36),
      depreciationMethod: 'STRAIGHT_LINE',
      accumulatedDep: Number(a.accumulatedDepreciation || 0),
      netValue: Math.max(0, Number(a.purchasePrice || a.originalValue || 0) - Number(a.accumulatedDepreciation || 0)),
      status: a.status === 'ACTIVE' ? 'HOẠT_ĐỘNG' : 'NGỪNG_SỬ_DỤNG',
      notes: a.assetName,
    }));
  }, [storeAssets]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<FixedAssetItem | null>(null);
  const [isModal, setIsModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState<FixedAssetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState<Partial<FixedAssetItem>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.assetName.toLowerCase().includes(q) ||
        d.assetCode.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
    );
  }, [data, search]);

  const openCreate = () => {
    setForm({
      assetCode: `FA-${Math.floor(100 + Math.random() * 900)}`,
      assetName: '',
      category: 'Thiết bị CNTT',
      purchaseDate: new Date().toISOString().split('T')[0],
      originalValue: 0,
      salvageValue: 0,
      usefulLifeMonths: 36,
      depreciationMethod: 'STRAIGHT_LINE',
      accumulatedDep: 0,
      status: 'HOẠT_ĐỘNG',
    });
    setIsModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.assetCode || !form.assetName) {
      toast.error('Vui lòng nhập đầy đủ mã và tên tài sản!');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        assetCode: form.assetCode,
        assetName: form.assetName,
        category: form.category || 'Thiết bị CNTT',
        purchaseDate: form.purchaseDate || new Date().toISOString().split('T')[0],
        purchasedDate: form.purchaseDate || new Date().toISOString().split('T')[0],
        purchasePrice: Number(form.originalValue) || 0,
        originalValue: Number(form.originalValue) || 0,
        salvageValue: Number(form.salvageValue) || 0,
        accumulatedDepreciation: Number(form.accumulatedDep) || 0,
        usefulLifeMonths: Number(form.usefulLifeMonths) || 36,
        netBookValue: Math.max(0, (Number(form.originalValue) || 0) - (Number(form.accumulatedDep) || 0)),
        status: form.status === 'NGỪNG_SỬ_DỤNG' ? 'DISPOSED' : 'ACTIVE',
      };

      if (form.id) {
        await updateFixedAsset(form.id, payload);
        toast.success('Cập nhật tài sản cố định thành công!');
      } else {
        await addFixedAsset(payload);
        toast.success('Thêm mới tài sản cố định thành công!');
      }
      setIsModal(false);
      fetchFixedAssets();
    } catch (err: any) {
      console.error('Save asset error:', err);
      toast.error('Lỗi khi lưu tài sản cố định!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    try {
      setIsDeleting(true);
      await deleteFixedAsset(deleteItem.id);
      toast.success('Đã xóa tài sản cố định!');
      setDeleteItem(null);
      fetchFixedAssets();
    } catch (err: any) {
      console.error('Delete asset error:', err);
      toast.error('Lỗi khi xóa tài sản cố định!');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<FixedAssetItem>[]>(
    () => [
      { accessorKey: 'assetCode', header: 'Mã tài sản', cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span> },
      { accessorKey: 'assetName', header: 'Tên tài sản', cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span> },
      { accessorKey: 'purchaseDate', header: 'Ngày mua', cell: (info) => <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{info.getValue() as string}</span> },
      { accessorKey: 'originalValue', header: 'Nguyên giá', cell: (info) => <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(info.getValue() as number)}</span> },
      { accessorKey: 'accumulatedDep', header: 'Khấu hao lũy kế', cell: (info) => <span className="text-sm text-gray-900 dark:text-white">{fmt(info.getValue() as number)}</span> },
      { accessorKey: 'netValue', header: 'Giá trị còn lại', cell: (info) => <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(info.getValue() as number)}</span> },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const s = info.getValue() as string;
          const cfg = {
            HOẠT_ĐỘNG: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
            NGỪNG_SỬ_DỤNG: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
            KHẢO_SÁT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
          }[s] || 'bg-gray-100 text-gray-800';
          return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg}`}>{s.replace('_', ' ')}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setForm(row.original);
                setIsModal(true);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeleteItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tài sản cố định</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý thông tin và khấu hao tài sản của công ty.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium"><Download className="w-4 h-4"/>Xuất báo cáo</button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"><Plus className="w-4 h-4"/>Thêm TSCĐ</button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-4 w-4 text-gray-400"/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm theo mã hoặc tên tài sản..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"/>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)}/>
      </div>

      <Modal isOpen={!!selected} onClose={()=>setSelected(null)} title={selected?`Chi tiết: ${selected.assetName}`:''} width="max-w-lg">
        {selected && (
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-4">
              {[['Mã tài sản',selected.assetCode],['Tên tài sản',selected.assetName],['Danh mục',selected.category||'N/A'],['Ngày mua',selected.purchaseDate],['Nguyên giá',fmt(selected.originalValue)],['Khấu hao lũy kế',fmt(selected.accumulatedDep)],['Giá trị còn lại',fmt(selected.netValue)],['Số sê-ri',selected.serialNumber||'N/A'],['Nhà cung cấp',selected.vendorName||'N/A'],['Trạng thái',selected.status.replace('_',' ')]]
                .map(([k,v])=>(
                  <div key={k} className="flex justify-between text-sm"><span className="text-gray-500">{k}:</span><span className="font-semibold text-gray-900 dark:text-white">{v}</span></div>
                ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={isModal} onClose={()=>setIsModal(false)} title={form.id?`Cập nhật TSCĐ`:`Thêm TSCĐ mới`} size="erp">
        <form onSubmit={handleSave}>
          <div className="erp-form-body">
            {/* Section 1: Thông tin cơ bản */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Thông tin cơ bản tài sản</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã tài sản *</label>
                <input required value={form.assetCode||''} onChange={e=>setForm({...form,assetCode:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên tài sản *</label>
                <input required value={form.assetName||''} onChange={e=>setForm({...form,assetName:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục tài sản</label>
                <select value={form.category||'THIẾT_BỊ_CNTT'} onChange={e=>setForm({...form,category:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="THIẾT_BỊ_CNTT">Thiết bị CNTT & Máy tính</option>
                  <option value="PHƯƠNG_TIỆN">Phương tiện vận tải</option>
                  <option value="MÁY_MÓC">Máy móc & Thiết bị kho</option>
                  <option value="NỘI_THẤT">Nội thất văn phòng</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
                <select required value={form.status||'HOẠT_ĐỘNG'} onChange={e=>setForm({...form,status:e.target.value as any})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="HOẠT_ĐỘNG">HOẠT ĐỘNG</option>
                  <option value="NGỪNG_SỬ_DỤNG">NGỪNG SỬ DỤNG</option>
                  <option value="KHẢO_SÁT">KHẢO SÁT</option>
                </select>
              </div>
            </div>

            {/* Section 2: Nguyên giá & Khấu hao */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Hạch toán & Khấu hao</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày mua *</label>
                <input type="date" required value={form.purchaseDate||''} onChange={e=>setForm({...form,purchaseDate:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nguyên giá (₫) *</label>
                  <input type="number" required value={form.originalValue||0} onChange={e=>setForm({...form,originalValue:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá trị thu hồi (₫)</label>
                  <input type="number" value={form.salvageValue||0} onChange={e=>setForm({...form,salvageValue:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số tháng khấu hao</label>
                  <input type="number" value={form.usefulLifeMonths||36} onChange={e=>setForm({...form,usefulLifeMonths:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Khấu hao lũy kế (₫)</label>
                  <input type="number" value={form.accumulatedDep||0} onChange={e=>setForm({...form,accumulatedDep:+e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phương pháp khấu hao</label>
                <select value={form.depreciationMethod||'STRAIGHT_LINE'} onChange={e=>setForm({...form,depreciationMethod:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500">
                  <option value="STRAIGHT_LINE">Đường thẳng (Straight Line)</option>
                  <option value="DECLINING_BALANCE">Số giảm dần (Declining Balance)</option>
                </select>
              </div>
            </div>

            {/* Section 3: Bảo hành & Ghi chú */}
            <div className="erp-form-section space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">Bảo hành & Ghi chú</h3>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp / Hãng sản xuất</label>
                <input type="text" value={form.vendorName||''} onChange={e=>setForm({...form,vendorName:e.target.value})} placeholder="Tên hãng / đơn vị bán" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã sê-ri (Serial No)</label>
                  <input type="text" value={form.serialNumber||''} onChange={e=>setForm({...form,serialNumber:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn bảo hành</label>
                  <input type="date" value={form.warrantyExpiry||''} onChange={e=>setForm({...form,warrantyExpiry:e.target.value})} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú quản lý</label>
                <textarea rows={2} value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Ghi chú vị trí bàn giao, lịch bảo dưỡng..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"/>
              </div>
            </div>
          </div>

          <div className="erp-form-footer">
            <button type="button" onClick={()=>setIsModal(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm">Hủy bỏ</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm">Lưu thông tin</button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Xác nhận xóa tài sản cố định"
        description="Bạn có chắc chắn muốn xóa tài sản cố định này không? Thao tác này không thể hoàn tác."
        itemName={deleteItem ? `${deleteItem.assetCode} - ${deleteItem.assetName}` : ''}
      />
    </>
  );
}
