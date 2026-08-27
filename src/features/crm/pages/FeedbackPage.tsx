import { useMemo, useState, useEffect, useCallback } from 'react';
import { Plus, Download, Search, Filter, Eye, MessageSquareQuote, Building2, Calendar, Star, CheckCircle2, ThumbsUp, Send, Edit, Trash2, TrendingUp, AlertTriangle, Smile, Frown } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { useCrmStore } from '../store/crmStore';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { CreateButton, SecondaryButton, PrimaryButton, DangerButton } from '@/shared/components/ui/Button';

interface CustomerFeedbackRecord {
  id: string;
  feedbackRef: string;
  customerName: string;
  customerPhone?: string;
  customerEmail: string;
  storeLocation: string;
  rating: number; // 1 to 5
  category: 'PRODUCT_QUALITY' | 'STAFF_SERVICE' | 'STORE_AMBIENCE' | 'CHECKOUT_SPEED' | 'PRICING' | 'GENERAL';
  title: string;
  comments: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  status: 'NEW' | 'REVIEWED' | 'ACTION_TAKEN' | 'ESCALATED' | 'CLOSED';
  submittedAt: string;
  assignedManager?: string;
  resolutionNotes?: string;
  orderRef?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  channel: 'STORE' | 'HOTLINE' | 'WEBSITE' | 'SOCIAL_MEDIA';
  dueDate?: string;
}

const calculateDueDate = (priority: string) => {
  const now = new Date();
  switch (priority) {
    case 'URGENT': now.setHours(now.getHours() + 2); break;
    case 'HIGH': now.setHours(now.getHours() + 24); break;
    case 'MEDIUM': now.setHours(now.getHours() + 72); break;
    case 'LOW':
    default: now.setHours(now.getHours() + 168); break;
  }
  return now.toISOString().substring(0, 16).replace('T', ' ');
};

const MOCK_FEEDBACK: CustomerFeedbackRecord[] = [];

const catMapFull: Record<string, string> = {
  PRODUCT_QUALITY: 'Chất lượng sản phẩm',
  STAFF_SERVICE: 'Thái độ nhân viên',
  STORE_AMBIENCE: 'Không gian cửa hàng',
  CHECKOUT_SPEED: 'Tốc độ thanh toán',
  PRICING: 'Giá cả & Hóa đơn',
  GENERAL: 'Ý kiến chung',
};

const sentimentMapFull: Record<string, string> = {
  POSITIVE: 'Tích cực',
  NEUTRAL: 'Trung lập',
  NEGATIVE: 'Tiêu cực',
};

const statusMapFull: Record<string, string> = {
  NEW: 'Mới gửi',
  REVIEWED: 'Đã tiếp nhận',
  ACTION_TAKEN: 'Đã xử lý',
  ESCALATED: 'Đã chuyển cấp cao',
  CLOSED: 'Đóng / Hoàn tất',
};

export function FeedbackPage() {
  const {
    feedbacks: storeFeedbacks,
    fetchFeedbacks,
    addFeedback,
    updateFeedback,
    deleteFeedback,
  } = useCrmStore();

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const data: CustomerFeedbackRecord[] = useMemo(() => {
    return storeFeedbacks.map((f) => ({
      id: f.id,
      feedbackRef: `FB-${f.id}`,
      customerName: f.customerName,
      customerEmail: `${f.customerPhone}@email.com`,
      storeLocation: 'Chi nhánh chính',
      rating: f.rating || 5,
      category: f.category || 'GENERAL',
      title: `Đánh giá ${f.category}`,
      comments: f.content,
      sentiment: f.rating >= 4 ? 'POSITIVE' : f.rating <= 2 ? 'NEGATIVE' : 'NEUTRAL',
      status: (f.status === 'RESOLVED' ? 'CLOSED' : f.status === 'REJECTED' ? 'CLOSED' : 'NEW') as any,
      submittedAt: f.createdAt,
      resolutionNotes: f.resolutionNote || '',
    }));
  }, [storeFeedbacks]);

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<CustomerFeedbackRecord | null>(null);

  const [sentimentFilter, setSentimentFilter] = useState<'ALL' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'>('ALL');
  const [ratingFilter, setRatingFilter] = useState<'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'IN_PROGRESS' | 'CLOSED' | 'ESCALATED'>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingFeedback, setEditingFeedback] = useState<Partial<CustomerFeedbackRecord>>({});
  const [deletingFeedback, setDeletingFeedback] = useState<CustomerFeedbackRecord | null>(null);

  const handleOpenCreate = () => {
    setModalMode('create');
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const year = new Date().getFullYear();
    setEditingFeedback({
      feedbackRef: `FB-${year}-${randomHex}`,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      storeLocation: 'Chi nhánh chính',
      rating: 5,
      category: 'GENERAL',
      title: '',
      comments: '',
      sentiment: 'POSITIVE',
      status: 'NEW',
      submittedAt: new Date().toISOString().split('T')[0],
      assignedManager: '',
      resolutionNotes: '',
      priority: 'LOW',
      channel: 'STORE',
      dueDate: calculateDueDate('LOW'),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fb: CustomerFeedbackRecord) => {
    setModalMode('edit');
    setEditingFeedback(fb);
    setIsModalOpen(true);
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedback.title || !editingFeedback.customerName) return;

    const payload = {
      rating: editingFeedback.rating || 5,
      comment: editingFeedback.comments || '',
      title: editingFeedback.title || '',
      status: editingFeedback.status || 'PENDING',
      reply: editingFeedback.resolutionNotes || '',
    };

    try {
      if (modalMode === 'create') {
        await axiosClient.post('/crm/feedback', payload);
        toast.success('Ghi nhận phản hồi mới thành công!');
      } else {
        await axiosClient.put(`/crm/feedback/${editingFeedback.id}`, payload);
        toast.success('Cập nhật phản hồi thành công!');
      }
      setIsModalOpen(false);
      fetchFeedback();
    } catch (err) {
      console.error('Error saving feedback:', err);
      toast.error('Không thể lưu thông tin phản hồi!');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFeedback) return;
    try {
      await axiosClient.delete(`/crm/feedback/${deletingFeedback.id}`);
      toast.success(`Đã xóa phiếu phản hồi ${deletingFeedback.feedbackRef}`);
      setData((prev) => prev.filter((item) => item.id !== deletingFeedback.id));
    } catch (err) {
      console.error('Error deleting feedback:', err);
      toast.error('Không thể xóa phản hồi trên máy chủ');
    } finally {
      setDeletingFeedback(null);
    }
  };

  const columns = useMemo<ColumnDef<CustomerFeedbackRecord>[]>(
    () => [
      {
        accessorKey: 'feedbackRef',
        header: 'Mã phản hồi',
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.customerName}</p>
            <p className="text-xs text-gray-500">{row.original.customerEmail}</p>
          </div>
        ),
      },
      {
        accessorKey: 'rating',
        header: 'Đánh giá',
        cell: (info) => {
          const stars = info.getValue() as number;
          return (
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3.5 h-3.5 ${i < stars ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-700'}`} />
              ))}
              <span className="ml-1 text-xs font-bold text-gray-700 dark:text-gray-300 font-mono">{stars}/5</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Phân loại',
        cell: (info) => {
          const cat = info.getValue() as string;
          return (
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-1 rounded font-semibold">
              {catMapFull[cat] || cat}
            </span>
          );
        },
      },
      {
        accessorKey: 'title',
        header: 'Tiêu đề',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white truncate block max-w-xs">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'sentiment',
        header: 'Thái độ',
        cell: (info) => {
          const s = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
              s === 'POSITIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              s === 'NEGATIVE' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
              'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
            }`}>
              {sentimentMapFull[s] || s}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'CLOSED' || status === 'ACTION_TAKEN' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'ESCALATED' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' :
              status === 'REVIEWED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>
              {statusMapFull[status] || status}
            </span>
          );
        },
      },
      {
        accessorKey: 'submittedAt',
        header: 'Thời gian gửi',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedFeedback(row.original); }}
              title="Xem chi tiết"
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
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
              onClick={(e) => { e.stopPropagation(); setDeletingFeedback(row.original); }}
              title="Xóa"
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  const filtered = data.filter((item) => {
    const matchesSearch = !search || item.customerName.toLowerCase().includes(search.toLowerCase()) || item.title.toLowerCase().includes(search.toLowerCase()) || item.feedbackRef.toLowerCase().includes(search.toLowerCase());
    const matchesSentiment = sentimentFilter === 'ALL' || item.sentiment === sentimentFilter;
    let matchesRating = true;
    if (ratingFilter === 'LOW') matchesRating = item.rating <= 2;
    if (ratingFilter === 'MEDIUM') matchesRating = item.rating === 3;
    if (ratingFilter === 'HIGH') matchesRating = item.rating >= 4;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesSentiment && matchesRating && matchesStatus;
  });

  const totalCount = filtered.length;
  const avgRating = totalCount > 0 ? (filtered.reduce((sum, item) => sum + item.rating, 0) / totalCount).toFixed(1) : '0.0';
  const positiveCount = filtered.filter(item => item.sentiment === 'POSITIVE').length;
  const negativeCount = filtered.filter(item => item.sentiment === 'NEGATIVE').length;
  const newNegativeCount = filtered.filter(item => item.sentiment === 'NEGATIVE' && (item.status === 'NEW' || item.status === 'ESCALATED')).length;

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ý kiến phản hồi & khảo sát NPS (customer feedback)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi đánh giá chất lượng dịch vụ, giám sát mức độ hài lòng và xử lý khiếu nại khách hàng. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <SecondaryButton leftIcon={<Download className="w-4 h-4" />}>
              Xuất nhật ký khảo sát
            </SecondaryButton>
            <CreateButton
              onClick={handleOpenCreate}
            >
              Ghi nhận phản hồi mới
            </CreateButton>
          </div>
        </div>

        {/* NPS & sentiment summary strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Điểm hài lòng trung bình</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{avgRating}/5 sao</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <Smile className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100 uppercase tracking-wide">Tích cực</p>
              <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{positiveCount}</p>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-200/70">Feedback khen ngợi / đề xuất tích cực</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center">
              <Frown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-red-900 dark:text-red-100 uppercase tracking-wide">Tiêu cực</p>
              <p className="text-lg font-bold text-red-900 dark:text-red-100">{negativeCount}</p>
              <p className="text-[11px] text-red-700/80 dark:text-red-200/70">Cần xem xét & phản hồi lại khách hàng</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide">Case rủi ro cao</p>
              <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{newNegativeCount}</p>
              <p className="text-[11px] text-amber-700/80 dark:text-amber-200/70">Feedback tiêu cực mới / đã escalated</p>
            </div>
          </div>
        </div>

        {/* Filters & search row */}
        <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <SearchInput
              value={search}
              onValueChange={setSearch}
              placeholder="Tìm theo tiêu đề, khách hàng, mã phản hồi hoặc địa điểm..."
              containerClassName="flex-1 w-full"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSentimentFilter('ALL')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  sentimentFilter === 'ALL'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setSentimentFilter('NEGATIVE')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  sentimentFilter === 'NEGATIVE'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200'
                }`}
              >
                <Frown className="w-3.5 h-3.5" />
                Tiêu cực
              </button>
              <button
                type="button"
                onClick={() => setSentimentFilter('POSITIVE')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  sentimentFilter === 'POSITIVE'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                Tích cực
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">Lọc theo sao:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setRatingFilter('ALL')}
                  className={`px-2.5 py-1 rounded-full border ${
                    ratingFilter === 'ALL'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setRatingFilter('LOW')}
                  className={`px-2.5 py-1 rounded-full border ${
                    ratingFilter === 'LOW'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200'
                  }`}
                >
                  ≤ 2 sao
                </button>
                <button
                  type="button"
                  onClick={() => setRatingFilter('MEDIUM')}
                  className={`px-2.5 py-1 rounded-full border ${
                    ratingFilter === 'MEDIUM'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-200'
                  }`}
                >
                  3 sao
                </button>
                <button
                  type="button"
                  onClick={() => setRatingFilter('HIGH')}
                  className={`px-2.5 py-1 rounded-full border ${
                    ratingFilter === 'HIGH'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200'
                  }`}
                >
                  ≥ 4 sao
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400 w-28 flex-shrink-0">Trạng thái xử lý:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-full border ${
                    statusFilter === 'ALL'
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('NEW')}
                  className={`px-2.5 py-1 rounded-full border ${
                    statusFilter === 'NEW'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-200'
                  }`}
                >
                  Mới
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('IN_PROGRESS')}
                  className={`px-2.5 py-1 rounded-full border ${
                    statusFilter === 'IN_PROGRESS'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200'
                  }`}
                >
                  Đang xử lý
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ESCALATED')}
                  className={`px-2.5 py-1 rounded-full border ${
                    statusFilter === 'ESCALATED'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200'
                  }`}
                >
                  Escalated
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('CLOSED')}
                  className={`px-2.5 py-1 rounded-full border ${
                    statusFilter === 'CLOSED'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-200'
                  }`}
                >
                  Đã đóng
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Đang hiển thị <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span> / {totalCount} phản hồi
              </span>
            </div>
          </div>
        </div>

        <ReusableDataTable columns={columns} data={filtered} isLoading={isLoading} onRowClick={(row) => setSelectedFeedback(row)} />
      </div>

      <Modal
        isOpen={!!selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
        title={selectedFeedback ? `Hồ Sơ Phản Hồi: ${selectedFeedback.feedbackRef}` : 'Chi tiết phản hồi'}
        width="max-w-lg"
      >
        {selectedFeedback && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedFeedback.sentiment === 'POSITIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedFeedback.sentiment === 'NEGATIVE'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedFeedback.sentiment === 'POSITIVE' ? 'bg-emerald-600' : selectedFeedback.sentiment === 'NEGATIVE' ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                  <MessageSquareQuote className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Mức độ hài lòng</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < selectedFeedback.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-700'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedFeedback.status === 'CLOSED' || selectedFeedback.status === 'ACTION_TAKEN' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedFeedback.status === 'ESCALATED' ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100' :
                selectedFeedback.status === 'REVIEWED' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
              }`}>
                {statusMapFull[selectedFeedback.status] || selectedFeedback.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Building2 className="w-4 h-4 text-primary" /> Địa điểm tiếp nhận
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedFeedback.storeLocation}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="w-4 h-4 text-blue-500" /> Thời gian gửi
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedFeedback.submittedAt}</p>
              </div>
            </div>

            <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Nội dung tóm tắt</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedFeedback.title}</h3>
                <span className="inline-block mt-1 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs px-2 py-0.5 rounded font-mono font-semibold">
                  Danh mục: {catMapFull[selectedFeedback.category] || selectedFeedback.category}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Chi tiết đóng góp ý kiến</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800 shadow-inner">
                  "{selectedFeedback.comments}"
                </p>
              </div>

              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400">Tài khoản khách hàng:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedFeedback.customerName} ({selectedFeedback.customerEmail})</span>
              </div>
              {selectedFeedback.assignedManager && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Người quản lý phụ trách:</span>
                  <span className="font-semibold text-primary">{selectedFeedback.assignedManager}</span>
                </div>
              )}

              {selectedFeedback.resolutionNotes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú hướng xử lý</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded border border-emerald-200 dark:border-emerald-900/30">
                    {selectedFeedback.resolutionNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedFeedback.status === 'NEW' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Đánh dấu đã tiếp nhận
                </button>
              )}
              {selectedFeedback.status === 'REVIEWED' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <ThumbsUp className="w-4 h-4" /> Ghi nhận giải quyết khiếu nại
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <Send className="w-4 h-4 inline mr-1" /> Gửi email phản hồi
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Ghi nhận Ý kiến phản hồi' : 'Chỉnh sửa phản hồi'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveFeedback} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phản hồi *</label>
              <input
                type="text"
                value={editingFeedback.feedbackRef || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm focus:outline-none cursor-default"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh *</label>
              <input
                type="text"
                value={editingFeedback.storeLocation || ''}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, storeLocation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên khách hàng *</label>
              <input
                type="text"
                value={editingFeedback.customerName || ''}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại *</label>
              <input
                type="tel"
                value={editingFeedback.customerPhone || ''}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, customerPhone: e.target.value, customerEmail: e.target.value })}
                placeholder="0912 345 678"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đánh giá (1-5 sao)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={editingFeedback.rating ?? 5}
                onChange={(e) => {
                  const newRating = parseInt(e.target.value) || 5;
                  const newSentiment = newRating >= 4 ? 'POSITIVE' : newRating <= 2 ? 'NEGATIVE' : 'NEUTRAL';
                  setEditingFeedback({ ...editingFeedback, rating: newRating, sentiment: newSentiment });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phân loại</label>
              <select
                value={editingFeedback.category || 'GENERAL'}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="PRODUCT_QUALITY">Chất lượng sản phẩm</option>
                <option value="STAFF_SERVICE">Thái độ nhân viên</option>
                <option value="STORE_AMBIENCE">Không gian cửa hàng</option>
                <option value="CHECKOUT_SPEED">Tốc độ thanh toán</option>
                <option value="PRICING">Giá cả & Hóa đơn</option>
                <option value="GENERAL">Ý kiến chung</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tiêu đề phản hồi *</label>
            <input
              type="text"
              value={editingFeedback.title || ''}
              onChange={(e) => setEditingFeedback({ ...editingFeedback, title: e.target.value })}
              placeholder="Ví dụ: Hài lòng về sự hướng dẫn tận tình..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nội dung chi tiết</label>
            <textarea
              rows={3}
              value={editingFeedback.comments || ''}
              onChange={(e) => setEditingFeedback({ ...editingFeedback, comments: e.target.value })}
              placeholder="Ghi rõ chi tiết ý kiến hoặc tường thuật sự việc..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quản lý phụ trách xử lý</label>
              <input
                type="text"
                value={editingFeedback.assignedManager || ''}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, assignedManager: e.target.value })}
                placeholder="Họ tên quản lý/nhân viên..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái xử lý</label>
              <select
                value={editingFeedback.status || 'NEW'}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="NEW">Mới gửi</option>
                <option value="REVIEWED">Đã tiếp nhận</option>
                <option value="ACTION_TAKEN">Đã xử lý</option>
                <option value="ESCALATED">Đã chuyển cấp cao</option>
                <option value="CLOSED">Đóng / Hoàn tất</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú giải pháp xử lý</label>
            <textarea
              rows={2}
              value={editingFeedback.resolutionNotes || ''}
              onChange={(e) => setEditingFeedback({ ...editingFeedback, resolutionNotes: e.target.value })}
              placeholder="Đã gửi thư xin lỗi kèm voucher bồi thường..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn hàng liên quan (nếu có)</label>
              <input
                type="text"
                value={editingFeedback.orderRef || ''}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, orderRef: e.target.value })}
                placeholder="#DH-xxxxx"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Kênh tiếp nhận</label>
              <select
                value={editingFeedback.channel || 'STORE'}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, channel: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="STORE">Tại cửa hàng (STORE)</option>
                <option value="HOTLINE">Hotline</option>
                <option value="WEBSITE">Website</option>
                <option value="SOCIAL_MEDIA">Mạng xã hội (SOCIAL_MEDIA)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Độ ưu tiên</label>
              <select
                value={editingFeedback.priority || 'LOW'}
                onChange={(e) => {
                  const newPriority = e.target.value as any;
                  setEditingFeedback({
                    ...editingFeedback,
                    priority: newPriority,
                    dueDate: calculateDueDate(newPriority)
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="LOW">Thấp (LOW)</option>
                <option value="MEDIUM">Trung bình (MEDIUM)</option>
                <option value="HIGH">Cao (HIGH)</option>
                <option value="URGENT">Khẩn cấp (URGENT - SLA 2h)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hạn xử lý (SLA Due Date)</label>
              <input
                type="text"
                value={editingFeedback.dueDate || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none cursor-default"
              />
            </div>
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
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow transition-colors text-sm"
            >
              {modalMode === 'create' ? 'Tạo Mới' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Xác nhận xóa */}
      <Modal
        isOpen={!!deletingFeedback}
        onClose={() => setDeletingFeedback(null)}
        title="Xác nhận gỡ bỏ phiếu phản hồi"
        isDestructive
        width="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            Bạn có chắc chắn muốn xóa vĩnh viễn phiếu phản hồi <strong className="text-gray-900 dark:text-white">{deletingFeedback?.feedbackRef}</strong> của khách hàng <span className="font-semibold">{deletingFeedback?.customerName}</span>?
          </p>
          <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg border border-red-200 dark:border-red-800/40">
            Hành động này sẽ xóa hoàn toàn nội dung phản hồi, nhận xét và các ghi chú hướng xử lý đi kèm khỏi cơ sở dữ liệu.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setDeletingFeedback(null)}
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
    </>
  );
}
