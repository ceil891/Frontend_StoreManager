import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, DollarSign, Download, Clock, ArrowRight, CheckCircle2, User, FileText, Phone, Mail, Building, AlertCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, formatMoney } from '@/features/sales/store/salesStore';
import { useCrmStore } from '@/features/crm/store/crmStore';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export interface QuoteSurveyRecord {
  id: string;
  surveyCode: string;
  customerId: string;
  customerName?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  salespersonId?: string;
  salespersonName?: string;
  surveyDate: string;
  responseDeadline?: string;
  requestedProducts?: string;
  expectedQuantity?: string;
  expectedBudget?: number;
  technicalRequirements?: string;
  deliveryRequirements?: string;
  paymentRequirements?: string;
  potentialLevel?: 'THAP' | 'TRUNG_BINH' | 'CAO' | 'RAT_CAO';
  note?: string;
  attachments?: string;
  status: 'NEW' | 'IN_PROGRESS' | 'INFO_COMPLETED' | 'QUOTED' | 'CLOSED';
  quoteId?: string;
  createdAt?: string;
  createdBy?: string;
}

export function SaleOffersPage() {
  const { surveys, fetchSurveys, addSurvey, updateSurvey, deleteSurvey, convertSurveyToQuote } = useSalesStore();
  const customers = useCrmStore((s) => s.customers);
  const fetchCustomers = useCrmStore((s) => s.fetchCustomers);
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedSurvey, setSelectedSurvey] = useState<QuoteSurveyRecord | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<QuoteSurveyRecord>>({});
  const [deletingItem, setDeletingItem] = useState<QuoteSurveyRecord | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchSurveys(), fetchCustomers()]);
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách khảo sát báo giá');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchSurveys, fetchCustomers]);

  const data = useMemo<QuoteSurveyRecord[]>(() => {
    return (surveys || []).map((s: any) => ({
      id: String(s.id),
      surveyCode: s.surveyCode || `KS-${s.id}`,
      customerId: String(s.customerId || s.customer?.id || '1'),
      customerName: s.customerName || s.customer?.name || 'Khách hàng',
      contactPerson: s.contactPerson || '',
      contactPhone: s.contactPhone || '',
      contactEmail: s.contactEmail || '',
      salespersonId: s.salespersonId ? String(s.salespersonId) : undefined,
      salespersonName: s.salespersonName || 'Sale phụ trách',
      surveyDate: s.surveyDate ? s.surveyDate.split('T')[0] : '',
      responseDeadline: s.responseDeadline ? s.responseDeadline.split('T')[0] : '',
      requestedProducts: s.requestedProducts || '',
      expectedQuantity: s.expectedQuantity || '',
      expectedBudget: Number(s.expectedBudget || 0),
      technicalRequirements: s.technicalRequirements || '',
      deliveryRequirements: s.deliveryRequirements || '',
      paymentRequirements: s.paymentRequirements || '',
      potentialLevel: s.potentialLevel || 'TRUNG_BINH',
      note: s.note || '',
      attachments: s.attachments || '',
      status: s.status || 'NEW',
      quoteId: s.quoteId ? String(s.quoteId) : undefined,
      createdAt: s.createdAt || '',
      createdBy: s.createdBy || '',
    }));
  }, [surveys]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const matchSearch =
        !search ||
        d.surveyCode.toLowerCase().includes(search.toLowerCase()) ||
        (d.customerName && d.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (d.contactPerson && d.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
        (d.contactPhone && d.contactPhone.toLowerCase().includes(search.toLowerCase())) ||
        (d.requestedProducts && d.requestedProducts.toLowerCase().includes(search.toLowerCase()));

      const matchStatus = selectedStatusFilter === 'ALL' || d.status === selectedStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [search, selectedStatusFilter, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const firstCust = customers.length > 0 ? customers[0] : null;

    setEditingItem({
      surveyCode: `KS-${new Date().getFullYear()}${(new Date().getMonth()+1).toString().padStart(2,'0')}${new Date().getDate().toString().padStart(2,'0')}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: firstCust ? String(firstCust.id) : '1',
      customerName: firstCust?.name || 'Nguyễn Văn A',
      contactPerson: (firstCust as any)?.contactPerson || firstCust?.name || 'Nguyễn Văn A',
      contactPhone: firstCust?.phone || '0987654321',
      contactEmail: firstCust?.email || 'nguyenvana@gmail.com',
      salespersonName: 'Nguyễn Văn A (Sales)',
      surveyDate: today,
      responseDeadline: nextWeek,
      requestedProducts: '',
      expectedQuantity: '1',
      expectedBudget: 0,
      technicalRequirements: '',
      deliveryRequirements: '',
      paymentRequirements: '',
      potentialLevel: 'TRUNG_BINH',
      note: '',
      attachments: '',
      status: 'NEW',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: QuoteSurveyRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem.customerId) {
      toast.error('Vui lòng chọn Khách hàng / Công ty');
      return;
    }
    if (!editingItem.surveyDate) {
      toast.error('Vui lòng chọn Ngày khảo sát');
      return;
    }

    try {
      if (modalMode === 'create') {
        await addSurvey(editingItem);
        toast.success('Tạo khảo sát báo giá thành công!');
      } else if (editingItem.id) {
        await updateSurvey(editingItem.id, editingItem);
        toast.success('Cập nhật khảo sát báo giá thành công!');
      }
      setIsModalOpen(false);
      fetchSurveys();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu khảo sát báo giá');
    }
  };

  const handleConvertToQuote = async (survey: QuoteSurveyRecord) => {
    if (survey.status !== 'INFO_COMPLETED' && survey.status !== 'IN_PROGRESS' && survey.status !== 'NEW') {
      toast.warning(`Khảo sát ở trạng thái ${survey.status} không thể tạo báo giá`);
      return;
    }

    setIsConverting(true);
    try {
      toast.info(`Đang chuyển đổi khảo sát ${survey.surveyCode} thành Báo giá...`);
      await convertSurveyToQuote(survey.id);
      toast.success(`Đã tạo Báo giá mới từ khảo sát ${survey.surveyCode}!`);
      setIsModalOpen(false);
      setSelectedSurvey(null);
      navigate('/sales/quotes');
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tạo báo giá từ khảo sát.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteSurvey(deletingItem.id);
      toast.success('Đã xóa khảo sát báo giá!');
      setDeletingItem(null);
      fetchSurveys();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi xóa khảo sát báo giá.');
    }
  };

  const statusMap: Record<string, { label: string; cls: string }> = {
    NEW: { label: 'Mới', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
    IN_PROGRESS: { label: 'Đang khảo sát', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
    INFO_COMPLETED: { label: 'Đã đủ thông tin', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
    QUOTED: { label: 'Đã chuyển báo giá', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
    CLOSED: { label: 'Đã đóng', cls: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400' },
  };

  const potentialMap: Record<string, { label: string; cls: string }> = {
    THAP: { label: 'Thấp', cls: 'bg-gray-100 text-gray-600' },
    TRUNG_BINH: { label: 'Trung bình', cls: 'bg-blue-50 text-blue-600 border border-blue-200' },
    CAO: { label: 'Cao', cls: 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300' },
    RAT_CAO: { label: 'Rất cao', cls: 'bg-amber-100 text-amber-900 font-extrabold border border-amber-400' },
  };

  const columns = useMemo<ColumnDef<QuoteSurveyRecord>[]>(
    () => [
      {
        accessorKey: 'surveyCode',
        header: 'Mã khảo sát',
        cell: (info) => (
          <div>
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">{info.getValue() as string}</span>
            <p className="text-[10px] text-gray-400">{info.row.original.surveyDate}</p>
          </div>
        ),
      },
      {
        id: 'customer',
        header: 'Khách hàng / Công ty',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white truncate max-w-xs">{row.original.customerName}</p>
            {row.original.contactPerson && (
              <p className="text-xs text-gray-500">Liên hệ: {row.original.contactPerson} {row.original.contactPhone ? `(${row.original.contactPhone})` : ''}</p>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'requestedProducts',
        header: 'Nhu cầu khảo sát',
        cell: ({ row }) => (
          <div className="max-w-xs truncate">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{row.original.requestedProducts || '—'}</p>
            {row.original.expectedBudget ? (
              <p className="text-xs text-emerald-600 font-semibold">Ngân sách: {formatMoney(row.original.expectedBudget, 'VND')}</p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'potentialLevel',
        header: 'Mức độ tiềm năng',
        cell: (info) => {
          const val = info.getValue() as string || 'TRUNG_BINH';
          const conf = potentialMap[val] || { label: val, cls: 'bg-gray-100' };
          return (
            <span className={`px-2 py-0.5 rounded text-xs ${conf.cls}`}>
              {conf.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'salespersonName',
        header: 'Sale phụ trách',
        cell: (info) => <span className="text-sm text-gray-700 dark:text-gray-300">{info.getValue() as string || '—'}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          const conf = statusMap[status] || { label: status, cls: 'bg-gray-100 text-gray-800' };
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${conf.cls}`}>
              {conf.label}
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
              onClick={(e) => { e.stopPropagation(); setSelectedSurvey(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              title="Chỉnh sửa"
              className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            {row.original.status === 'INFO_COMPLETED' && (
              <button
                onClick={(e) => { e.stopPropagation(); handleConvertToQuote(row.original); }}
                title="Tạo Báo Giá từ khảo sát này"
                className="px-2 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 shadow transition-all"
              >
                <ArrowRight className="w-3.5 h-3.5" /> Tạo báo giá
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setDeletingItem(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [customers]
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Khảo sát báo giá</h1>
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-semibold rounded-full">
              Tầng 1: Thu thập nhu cầu
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Khảo sát nhu cầu khách hàng → Đủ thông tin → [Tạo báo giá] → Đơn bán hàng
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Tạo Khảo Sát Báo Giá
          </button>
        </div>
      </div>

      {/* Filter Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { key: 'ALL', label: 'Tất cả', count: data.length, color: 'text-gray-700' },
          { key: 'NEW', label: 'Mới', count: data.filter(d => d.status === 'NEW').length, color: 'text-blue-600' },
          { key: 'IN_PROGRESS', label: 'Đang khảo sát', count: data.filter(d => d.status === 'IN_PROGRESS').length, color: 'text-amber-600' },
          { key: 'INFO_COMPLETED', label: 'Đã đủ thông tin', count: data.filter(d => d.status === 'INFO_COMPLETED').length, color: 'text-emerald-600 font-bold' },
          { key: 'QUOTED', label: 'Đã chuyển báo giá', count: data.filter(d => d.status === 'QUOTED').length, color: 'text-purple-600' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedStatusFilter(item.key)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedStatusFilter === item.key
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 shadow-sm'
                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300'
            }`}
          >
            <p className="text-xs text-gray-500 font-medium">{item.label}</p>
            <p className={`text-lg font-extrabold ${item.color}`}>{item.count}</p>
          </button>
        ))}
      </div>

      {/* Search and Table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã KS, tên KH, SĐT, nhu cầu sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <ReusableDataTable
          data={filtered}
          columns={columns}
          isLoading={isLoading}
          onRowClick={(row) => setSelectedSurvey(row)}
        />
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'create' ? '📋 TẠO KHẢO SÁT BÁO GIÁ' : '✏️ CHỈNH SỬA KHẢO SÁT BÁO GIÁ'}
          width="max-w-5xl"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
            {/* Header info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã khảo sát *
                </label>
                <input
                  type="text"
                  value={editingItem.surveyCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, surveyCode: e.target.value })}
                  placeholder="KS-2026-XXXX"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Khách hàng / Công ty *
                </label>
                <select
                  value={editingItem.customerId || ''}
                  onChange={(e) => {
                    const selectedVal = e.target.value;
                    const cust = customers.find(c => String(c.id) === selectedVal || String((c as any).customerCode) === selectedVal);
                    setEditingItem((prev) => ({
                      ...prev,
                      customerId: selectedVal,
                      customerName: cust?.name || 'Nguyễn Văn A',
                      contactPerson: (cust as any)?.contactPerson || cust?.name || 'Nguyễn Văn A',
                      contactPhone: cust?.phone || (cust as any)?.phoneNumber || '0987654321',
                      contactEmail: cust?.email || 'nguyenvana@gmail.com',
                    }));
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold"
                >
                  <option value="">-- Chọn Khách hàng --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nhân viên Sale phụ trách *
                </label>
                <input
                  type="text"
                  value={editingItem.salespersonName || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, salespersonName: e.target.value })}
                  placeholder="Nguyễn Văn A (Sales)"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Người liên hệ</label>
                <input
                  type="text"
                  value={editingItem.contactPerson || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, contactPerson: e.target.value })}
                  placeholder="Anh / Chị..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={editingItem.contactPhone || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, contactPhone: e.target.value })}
                  placeholder="09xx..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email liên hệ</label>
                <input
                  type="email"
                  value={editingItem.contactEmail || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, contactEmail: e.target.value })}
                  placeholder="email@company.com"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ngày khảo sát *</label>
                <input
                  type="date"
                  value={editingItem.surveyDate || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, surveyDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Hạn phản hồi</label>
                <input
                  type="date"
                  value={editingItem.responseDeadline || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, responseDeadline: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Trạng thái khảo sát</label>
                <select
                  value={editingItem.status || 'NEW'}
                  onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                >
                  <option value="NEW">Mới (NEW)</option>
                  <option value="IN_PROGRESS">Đang khảo sát (IN_PROGRESS)</option>
                  <option value="INFO_COMPLETED">Đã đủ thông tin (INFO_COMPLETED)</option>
                  <option value="QUOTED">Đã chuyển báo giá (QUOTED)</option>
                  <option value="CLOSED">Đã đóng (CLOSED)</option>
                </select>
              </div>
            </div>

            {/* Section 2: Nhu cầu khách hàng */}
            <div className="border border-blue-200 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/20 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Nhu cầu khách hàng
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sản phẩm / Dịch vụ cần báo giá</label>
                  <textarea
                    rows={2}
                    value={editingItem.requestedProducts || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, requestedProducts: e.target.value })}
                    placeholder="Mô tả chi tiết loại sản phẩm, mã hàng, hoặc gói dịch vụ khách hàng mong muốn..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng dự kiến</label>
                  <input
                    type="text"
                    value={editingItem.expectedQuantity || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, expectedQuantity: e.target.value })}
                    placeholder="VD: 50 bộ, 1000 lon..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                  
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mt-2 mb-1">Ngân sách dự kiến (VND)</label>
                  <input
                    type="number"
                    value={editingItem.expectedBudget || 0}
                    onChange={(e) => setEditingItem({ ...editingItem, expectedBudget: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Yêu cầu kỹ thuật</label>
                  <textarea
                    rows={2}
                    value={editingItem.technicalRequirements || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, technicalRequirements: e.target.value })}
                    placeholder="Kích thước, chất liệu, tiêu chuẩn ISO, bảo hành..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Yêu cầu giao hàng</label>
                  <textarea
                    rows={2}
                    value={editingItem.deliveryRequirements || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, deliveryRequirements: e.target.value })}
                    placeholder="Địa điểm, thời gian giao, đóng gói..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Yêu cầu thanh toán</label>
                  <textarea
                    rows={2}
                    value={editingItem.paymentRequirements || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, paymentRequirements: e.target.value })}
                    placeholder="Trả góp, công nợ 30 ngày, gối đầu..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Kết quả khảo sát */}
            <div className="border border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/20 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" /> Kết quả khảo sát & Đánh giá
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mức độ tiềm năng</label>
                  <select
                    value={editingItem.potentialLevel || 'TRUNG_BINH'}
                    onChange={(e) => setEditingItem({ ...editingItem, potentialLevel: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-bold"
                  >
                    <option value="THAP">Thấp</option>
                    <option value="TRUNG_BINH">Trung bình</option>
                    <option value="CAO">Cao (Tiềm năng mua ngay)</option>
                    <option value="RAT_CAO">Rất cao (Cần chốt Báo giá gấp)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ghi chú chi tiết khảo sát</label>
                  <textarea
                    rows={2}
                    value={editingItem.note || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                    placeholder="Ghi chú thêm về tâm lý khách hàng, lý do khảo sát, đối thủ cạnh tranh..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              {editingItem.id && editingItem.status === 'INFO_COMPLETED' ? (
                <button
                  type="button"
                  onClick={() => handleConvertToQuote(editingItem as QuoteSurveyRecord)}
                  disabled={isConverting}
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <ArrowRight className="w-4 h-4" /> [Tạo Báo Giá] Ngay
                </button>
              ) : <div />}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/20"
                >
                  Lưu Khảo Sát
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {selectedSurvey && (
        <Modal
          isOpen={!!selectedSurvey}
          onClose={() => setSelectedSurvey(null)}
          title={`📌 CHI TIẾT KHẢO SÁT BÁO GIÁ: ${selectedSurvey.surveyCode}`}
          width="max-w-4xl"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 text-sm">
              <div>
                <span className="text-xs text-gray-400 block">Khách hàng</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedSurvey.customerName}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Liên hệ</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSurvey.contactPerson || '—'} {selectedSurvey.contactPhone ? `(${selectedSurvey.contactPhone})` : ''}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Ngày khảo sát</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{selectedSurvey.surveyDate}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block">Trạng thái</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 text-xs font-bold rounded-full ${statusMap[selectedSurvey.status]?.cls || 'bg-gray-100'}`}>
                  {statusMap[selectedSurvey.status]?.label || selectedSurvey.status}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-1">Nhu cầu sản phẩm & Ngân sách</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedSurvey.requestedProducts || 'Chưa ghi nhận nhu cầu sản phẩm cụ thể.'}</p>
              {selectedSurvey.expectedBudget ? (
                <p className="text-sm font-bold text-emerald-600">Ngân sách dự kiến: {formatMoney(selectedSurvey.expectedBudget, 'VND')}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div>
                <span className="font-bold block text-gray-700 dark:text-gray-300">Yêu cầu kỹ thuật:</span>
                <span>{selectedSurvey.technicalRequirements || 'Không có'}</span>
              </div>
              <div>
                <span className="font-bold block text-gray-700 dark:text-gray-300">Yêu cầu giao hàng:</span>
                <span>{selectedSurvey.deliveryRequirements || 'Không có'}</span>
              </div>
              <div>
                <span className="font-bold block text-gray-700 dark:text-gray-300">Yêu cầu thanh toán:</span>
                <span>{selectedSurvey.paymentRequirements || 'Không có'}</span>
              </div>
            </div>

            {selectedSurvey.note && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-300 rounded-lg">
                <strong>Ghi chú:</strong> {selectedSurvey.note}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setSelectedSurvey(null)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(selectedSurvey);
                    setSelectedSurvey(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl"
                >
                  Sửa khảo sát
                </button>
                <button
                  onClick={() => handleConvertToQuote(selectedSurvey)}
                  disabled={isConverting}
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <ArrowRight className="w-4 h-4" /> [Tạo Báo Giá]
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation modal */}
      {deletingItem && (
        <Modal
          isOpen={!!deletingItem}
          onClose={() => setDeletingItem(null)}
          title="⚠️ Xác nhận xóa khảo sát báo giá"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Bạn có chắc chắn muốn xóa khảo sát <strong className="text-red-600">{deletingItem.surveyCode}</strong> của <strong>{deletingItem.customerName}</strong> không?
            </p>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
