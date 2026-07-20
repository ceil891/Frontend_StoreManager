import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, Download, Eye, Edit, Trash2, Plus, FileText, ChevronRight, HelpCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface ChartOfAccountItem {
  id: string;
  accountNumber: string;
  accountName: string;
  accountType: 'TÀI_SẢN' | 'NỢ_PHẢI_TRẢ' | 'VỐN_CHỦ_SỞ_HỮU' | 'DOANH_THU' | 'CHI_PHÍ' | 'KHÁC';
  description: string;
  parentAccountNumber?: string;
  status: 'HOẠT_ĐỘNG' | 'NGỪNG_HOẠT_ĐỘNG';
}

const ACCOUNT_TYPES = {
  TÀI_SẢN: 'Tài sản',
  NỢ_PHẢI_TRẢ: 'Nợ phải trả',
  VỐN_CHỦ_SỞ_HỮU: 'Vốn chủ sở hữu',
  DOANH_THU: 'Doanh thu',
  CHI_PHÍ: 'Chi phí',
  KHÁC: 'Khác',
};

export default function ChartOfAccountsPage() {
  const [data, setData] = useState<ChartOfAccountItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selected, setSelected] = useState<ChartOfAccountItem | null>(null);
  const [isModal, setIsModal] = useState(false);
  const [form, setForm] = useState<Partial<ChartOfAccountItem>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get('/accounting/chart-of-accounts');
      const list = res.content || res || [];
      const mapped: ChartOfAccountItem[] = (Array.isArray(list) ? list : []).map((item: any) => {
        const typeMap: Record<string, ChartOfAccountItem['accountType']> = {
          ASSET: 'TÀI_SẢN',
          LIABILITY: 'NỢ_PHẢI_TRẢ',
          EQUITY: 'VỐN_CHỦ_SỞ_HỮU',
          REVENUE: 'DOANH_THU',
          EXPENSE: 'CHI_PHÍ',
        };
        return {
          id: String(item.id),
          accountNumber: item.accountCode || '',
          accountName: item.accountName || '',
          accountType: typeMap[item.type] || 'KHÁC',
          description: item.description || item.note || '',
          parentAccountNumber: item.parent?.accountCode || '',
          status: item.isActive !== false ? 'HOẠT_ĐỘNG' : 'NGỪNG_HOẠT_ĐỘNG',
        };
      });
      setData(mapped);
    } catch (err) {
      console.error('Lỗi tải danh sách tài khoản:', err);
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filtered = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.accountName.toLowerCase().includes(search.toLowerCase()) || 
                            item.accountNumber.includes(search);
      const matchesType = selectedType === 'ALL' || item.accountType === selectedType;
      return matchesSearch && matchesType;
    });
  }, [data, search, selectedType]);

  const openCreate = () => {
    setForm({
      accountType: 'TÀI_SẢN',
      status: 'HOẠT_ĐỘNG',
      description: '',
    });
    setIsModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountNumber || !form.accountName) return;

    try {
      const typeMapInverse: Record<string, string> = {
        'TÀI_SẢN': 'ASSET',
        'NỢ_PHẢI_TRẢ': 'LIABILITY',
        'VỐN_CHỦ_SỞ_HỮU': 'EQUITY',
        'DOANH_THU': 'REVENUE',
        'CHI_PHÍ': 'EXPENSE',
        'KHÁC': 'EXPENSE',
      };
      
      const payload: any = {
        accountCode: form.accountNumber,
        accountName: form.accountName,
        type: typeMapInverse[form.accountType || 'TÀI_SẢN'] || 'ASSET',
        isActive: form.status === 'HOẠT_ĐỘNG',
        note: form.description || '',
      };

      if (form.parentAccountNumber) {
        // Gắn parent nếu có. Vì API nhận Object parent nên ta gửi tạm id hoặc code
        // Nhớ rằng backend AdvancedAccountingController.java chỉ save thẳng req nên
        // có thể parent sẽ lấy theo parent_id. Ta tìm parent từ data hiện tại
        const parentAccount = data.find(item => item.accountNumber === form.parentAccountNumber);
        if (parentAccount) {
          payload.parent = { id: Number(parentAccount.id) };
        }
      }

      if (form.id) {
        await axiosClient.put(`/accounting/chart-of-accounts/${form.id}`, payload);
        toast.success('Cập nhật tài khoản thành công');
      } else {
        await axiosClient.post('/accounting/chart-of-accounts', payload);
        toast.success('Thêm tài khoản thành công');
      }
      setIsModal(false);
      await fetchAccounts();
    } catch (err) {
      console.error('Lỗi khi lưu tài khoản:', err);
      toast.error('Lỗi khi lưu tài khoản');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này không?')) {
      try {
        await axiosClient.delete(`/accounting/chart-of-accounts/${id}`);
        toast.success('Xóa tài khoản thành công');
        await fetchAccounts();
      } catch (err) {
        console.error('Lỗi khi xóa tài khoản:', err);
        toast.error('Không thể xóa tài khoản');
      }
    }
  };

  const columns = useMemo<ColumnDef<ChartOfAccountItem>[]>(() => [
    {
      accessorKey: 'accountNumber',
      header: 'Số hiệu TK',
      cell: info => <span className="font-mono font-bold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'accountName',
      header: 'Tên tài khoản',
      cell: info => <span className="font-medium text-gray-800 dark:text-gray-200">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'accountType',
      header: 'Tính chất',
      cell: info => {
        const type = info.getValue() as keyof typeof ACCOUNT_TYPES;
        const colors = {
          TÀI_SẢN: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
          NỢ_PHẢI_TRẢ: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
          VỐN_CHỦ_SỞ_HỮU: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
          DOANH_THU: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
          CHI_PHÍ: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
          KHÁC: 'bg-gray-50 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300',
        }[type] || 'bg-gray-50 text-gray-700';

        return <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${colors}`}>{ACCOUNT_TYPES[type]}</span>;
      },
    },
    {
      accessorKey: 'parentAccountNumber',
      header: 'Tài khoản mẹ',
      cell: info => {
        const val = info.getValue() as string;
        return val ? <span className="font-mono text-gray-500">{val}</span> : <span className="text-gray-400">-</span>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: info => {
        const s = info.getValue() as string;
        const cfg = s === 'HOẠT_ĐỘNG' 
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300';
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg}`}>{s.replace('_', ' ')}</span>;
      },
    },
    {
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button onClick={() => setSelected(row.original)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg" title="Xem chi tiết">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => { setForm(row.original); setIsModal(true); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" title="Chỉnh sửa">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row.original.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Xóa">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], [data]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hệ thống tài khoản kế toán (chart of accounts)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Danh mục các tài khoản kế toán dùng để ghi nhận các nghiệp vụ kinh tế tài chính phát sinh.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all duration-200">
              <Plus className="w-4 h-4" /> Thêm Tài Khoản
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex-1 relative min-w-[280px] max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Tìm theo số hiệu hoặc tên tài khoản..." 
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Lọc theo tính chất:</span>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả</option>
              {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={setSelected} />
        )}
      </div>

      {/* Drawer Chi Tiết */}
      <Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `Tài khoản: ${selected.accountNumber} - ${selected.accountName}` : ''}>
        {selected && (
          <div className="space-y-6 p-5">
            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg flex items-start gap-3">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm">Mô tả tài khoản</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{selected.description || 'Không có mô tả chi tiết cho tài khoản này.'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b pb-2 text-sm">Thông tin tài khoản</h3>
              <div className="grid grid-cols-1 gap-3.5">
                {[
                  ['Số hiệu tài khoản', selected.accountNumber],
                  ['Tên tài khoản', selected.accountName],
                  ['Tính chất tài khoản', ACCOUNT_TYPES[selected.accountType]],
                  ['Tài khoản mẹ', selected.parentAccountNumber || '-'],
                  ['Trạng thái hoạt động', selected.status === 'HOẠT_ĐỘNG' ? 'Đang hoạt động' : 'Ngừng hoạt động']
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">{k}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Thêm / Sửa */}
      <Modal isOpen={isModal} onClose={() => setIsModal(false)} title={form.id ? `Cập nhật tài khoản kế toán` : `Thêm tài khoản mới`} width="max-w-lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số hiệu tài khoản *</label>
              <input 
                required 
                placeholder="Ví dụ: 1111"
                value={form.accountNumber || ''} 
                onChange={e => setForm({ ...form, accountNumber: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên tài khoản *</label>
              <input 
                required 
                placeholder="Ví dụ: tiền Việt Nam"
                value={form.accountName || ''} 
                onChange={e => setForm({ ...form, accountName: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tính chất tài khoản *</label>
              <select 
                required 
                value={form.accountType || 'TÀI_SẢN'} 
                onChange={e => setForm({ ...form, accountType: e.target.value as any })} 
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(ACCOUNT_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tài khoản mẹ</label>
              <input 
                placeholder="Ví dụ: 111"
                value={form.parentAccountNumber || ''} 
                onChange={e => setForm({ ...form, parentAccountNumber: e.target.value })} 
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả tài khoản</label>
            <textarea 
              rows={3}
              placeholder="Nhập mô tả về cách sử dụng tài khoản này..."
              value={form.description || ''} 
              onChange={e => setForm({ ...form, description: e.target.value })} 
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
            <select 
              required 
              value={form.status || 'HOẠT_ĐỘNG'} 
              onChange={e => setForm({ ...form, status: e.target.value as any })} 
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="HOẠT_ĐỘNG">HOẠT ĐỘNG</option>
              <option value="NGỪNG_HOẠT_ĐỘNG">NGỪNG HOẠT ĐỘNG</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={() => setIsModal(false)} 
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg text-sm"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-sm"
            >
              Lưu
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
