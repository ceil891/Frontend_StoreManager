import { useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Calendar, FileCheck, Landmark, ShieldAlert, Award, FileText, CheckCircle2, Clock, XCircle, UserCheck } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface SupplierContractItem {
  id: string;
  contractNumber: string;
  supplierName: string;
  signingDate: string;
  expirationDate: string;
  maxDebtLimit: number;
  status: 'ĐANG_HIỆU_LỰC' | 'THANH_LÝ' | 'CHỜ_KÝ';
  representative?: string;
  paymentTerms?: string;
  contractVal?: number;
  appendixText?: string;
}

const MOCK_DATA: SupplierContractItem[] = [
  {
    id: '1',
    contractNumber: 'HD-NCC-2026-001',
    supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    signingDate: '2026-01-01',
    expirationDate: '2027-01-01',
    maxDebtLimit: 500000000,
    status: 'ĐANG_HIỆU_LỰC',
    representative: 'Bà Mai Kiều Liên (Giám đốc)',
    paymentTerms: 'Gối đầu công nợ 30 ngày từ khi nhận hóa đơn tài chính.',
    contractVal: 2400000000,
    appendixText: 'Đảm bảo chiết khấu thương mại 5% nếu tổng sản lượng mua hàng vượt 200 triệu/tháng.'
  },
  {
    id: '2',
    contractNumber: 'HD-NCC-2025-089',
    supplierName: 'Công ty TNHH Unilever Việt Nam',
    signingDate: '2025-01-10',
    expirationDate: '2026-01-10',
    maxDebtLimit: 800000000,
    status: 'THANH_LÝ',
    representative: 'Ông Jean-Laurent Ingles (Tổng giám đốc)',
    paymentTerms: 'Thanh toán chuyển khoản 100% sau khi giao hàng 15 ngày.',
    contractVal: 5000000000,
    appendixText: 'Hợp đồng đã kết thúc kỳ hạn và các bên đã hoàn tất đối chiếu công nợ cuối kỳ.'
  },
  {
    id: '3',
    contractNumber: 'HD-NCC-2026-042',
    supplierName: 'Nhà máy Bia & Nước giải khát Heineken Việt Nam',
    signingDate: '2026-05-20',
    expirationDate: '2028-05-20',
    maxDebtLimit: 1200000000,
    status: 'CHỜ_KÝ',
    representative: 'Ông Alexander Koch (Giám đốc thương mại)',
    paymentTerms: 'Đặt cọc 20%, thanh toán 80% còn lại trong vòng 7 ngày làm việc sau khi nhận hàng.',
    contractVal: 8000000000,
    appendixText: 'Phụ lục về phân phối độc quyền dòng sản phẩm mới đang đợi phê duyệt từ ban lãnh đạo.'
  }
];

export function SupplierContractsPage() {
  const [data, setData] = useState<SupplierContractItem[]>(MOCK_DATA);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedItem, setSelectedItem] = useState<SupplierContractItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<SupplierContractItem>>({});

  const filtered = data.filter((item) => {
    const matchesSearch =
      item.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      (item.representative && item.representative.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'Tất cả' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingItem({
      contractNumber: `HD-NCC-2026-0${data.length + 1}`,
      supplierName: '',
      signingDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      maxDebtLimit: 100000000,
      status: 'CHỜ_KÝ',
      representative: '',
      paymentTerms: 'Thanh toán 100% trong vòng 30 ngày.',
      contractVal: 0,
      appendixText: ''
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.supplierName || !editingItem.maxDebtLimit) return;

    const newItem: SupplierContractItem = {
      id: String(data.length + 1),
      contractNumber: editingItem.contractNumber || `HD-NCC-2026-0${data.length + 1}`,
      supplierName: editingItem.supplierName,
      signingDate: editingItem.signingDate || new Date().toISOString().split('T')[0],
      expirationDate: editingItem.expirationDate || new Date().toISOString().split('T')[0],
      maxDebtLimit: Number(editingItem.maxDebtLimit),
      status: (editingItem.status as any) || 'CHỜ_KÝ',
      representative: editingItem.representative || 'Chưa cập nhật',
      paymentTerms: editingItem.paymentTerms || '',
      contractVal: Number(editingItem.contractVal || 0),
      appendixText: editingItem.appendixText || ''
    };
    setData([newItem, ...data]);
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<SupplierContractItem>[]>(
    () => [
      {
        accessorKey: 'contractNumber',
        header: 'Số Hợp Đồng',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà Cung Cấp',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'signingDate',
        header: 'Ngày Ký Kết',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'expirationDate',
        header: 'Ngày Hết Hạn',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-red-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'maxDebtLimit',
        header: 'Hạn Mức Nợ Tối Đa',
        cell: (info) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng Thái Hiệu Lực',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = '';
          let icon = null;

          if (status === 'ĐANG_HIỆU_LỰC') {
            badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
            icon = <CheckCircle2 className="w-3.5 h-3.5" />;
          } else if (status === 'CHỜ_KÝ') {
            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
            icon = <Clock className="w-3.5 h-3.5" />;
          } else {
            badgeClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
            icon = <XCircle className="w-3.5 h-3.5" />;
          }

          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
              {icon}
              {status === 'ĐANG_HIỆU_LỰC' ? 'ĐANG HIỆU LỰC' : status === 'CHỜ_KÝ' ? 'CHỜ KÝ' : 'THANH LÝ'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao Tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
              title="Xem chi tiết hợp đồng"
            >
              <Eye className="w-4 h-4" />
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hợp Đồng Nhà Cung Cấp (Supplier Contract)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Lưu trữ hợp đồng pháp lý, điều khoản thanh toán, hạn mức nợ và sản lượng chiết khấu cam kết với đối tác phân phối.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Lập hợp đồng mới
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
              placeholder="Tìm kiếm theo số hợp đồng, nhà cung cấp hoặc người đại diện..."
              className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Trạng thái hiệu lực:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="ĐANG_HIỆU_LỰC">ĐANG HIỆU LỰC</option>
              <option value="CHỜ_KÝ">CHỜ KÝ</option>
              <option value="THANH_LÝ">THANH LÝ</option>
            </select>
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={setSelectedItem} />
      </div>

      {/* Drawer chi tiết hợp đồng */}
      <Drawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Chi tiết Hợp đồng: ${selectedItem.contractNumber}` : 'Thông tin chi tiết'}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Giá trị hợp đồng quy đổi</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                  {selectedItem.contractVal ? formatCurrency(selectedItem.contractVal) : 'Không ghi nhận giá trị tổng'}
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-gray-400" /> Số hợp đồng:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedItem.contractNumber}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Landmark className="w-3.5 h-3.5 text-gray-400" /> Nhà cung cấp:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.supplierName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-gray-400" /> Người đại diện ký:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.representative || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> Ngày ký kết:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.signingDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-red-400" /> Ngày hết hạn:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.expirationDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Hạn mức nợ (Max):</span>
                <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(selectedItem.maxDebtLimit)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Trạng thái:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    selectedItem.status === 'ĐANG_HIỆU_LỰC'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : selectedItem.status === 'CHỜ_KÝ'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-350'
                  }`}
                >
                  {selectedItem.status === 'ĐANG_HIỆU_LỰC' ? 'ĐANG HIỆU LỰC' : selectedItem.status === 'CHỜ_KÝ' ? 'CHỜ KÝ' : 'THANH LÝ'}
                </span>
              </div>
            </div>

            {/* Chi tiết điều khoản */}
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800 shadow-sm space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-4 h-4 text-emerald-500" /> Điều khoản thanh toán & Giao nhận
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                  {selectedItem.paymentTerms || 'Không quy định điều khoản thanh toán riêng.'}
                </p>
              </div>

              {selectedItem.appendixText && (
                <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 rounded-xl border border-amber-100 dark:border-amber-900/40 space-y-2">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Phụ lục & Chiết khấu bổ sung
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                    {selectedItem.appendixText}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal lập hợp đồng mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lập hợp đồng nhà cung cấp mới"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số hợp đồng *</label>
              <input
                type="text"
                value={editingItem.contractNumber || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người đại diện ký bên B *</label>
              <input
                type="text"
                value={editingItem.representative || ''}
                onChange={(e) => setEditingItem({ ...editingItem, representative: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: Ông Nguyễn Văn A (Giám đốc)"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên nhà cung cấp *</label>
            <input
              type="text"
              value={editingItem.supplierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Ví dụ: Công ty Unilever Việt Nam"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày ký kết hợp đồng *</label>
              <input
                type="date"
                value={editingItem.signingDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, signingDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn hợp đồng *</label>
              <input
                type="date"
                value={editingItem.expirationDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, expirationDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn mức nợ tối đa (VND) *</label>
              <input
                type="number"
                value={editingItem.maxDebtLimit || ''}
                onChange={(e) => setEditingItem({ ...editingItem, maxDebtLimit: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: 500000000"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng giá trị hợp đồng (nếu có)</label>
              <input
                type="number"
                value={editingItem.contractVal || ''}
                onChange={(e) => setEditingItem({ ...editingItem, contractVal: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: 2000000000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái hiệu lực</label>
            <select
              value={editingItem.status || 'CHỜ_KÝ'}
              onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
            >
              <option value="CHỜ_KÝ">CHỜ KÝ</option>
              <option value="ĐANG_HIỆU_LỰC">ĐANG HIỆU LỰC</option>
              <option value="THANH_LÝ">THANH LÝ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Điều khoản thanh toán công nợ</label>
            <textarea
              rows={2}
              value={editingItem.paymentTerms || ''}
              onChange={(e) => setEditingItem({ ...editingItem, paymentTerms: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Quy định gối đầu nợ 30 ngày, trả chuyển khoản..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú phụ lục chiết khấu</label>
            <textarea
              rows={2}
              value={editingItem.appendixText || ''}
              onChange={(e) => setEditingItem({ ...editingItem, appendixText: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Quy định chiết khấu đặc biệt theo doanh số mua hàng..."
            />
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
              Tạo hợp đồng
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
