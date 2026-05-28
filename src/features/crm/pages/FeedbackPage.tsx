import { useMemo, useState } from 'react';
import { Plus, Download, Search, Filter, Eye, MessageSquareQuote, Building2, Calendar, Star, CheckCircle2, ThumbsUp, Send, Edit, Trash2, TrendingUp, AlertTriangle, Smile, Frown } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';

interface CustomerFeedbackRecord {
  id: string;
  feedbackRef: string;
  customerName: string;
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
}

const MOCK_FEEDBACK: CustomerFeedbackRecord[] = [
  { id: '1', feedbackRef: 'FB-2024-819', customerName: 'Johnathan Vance', customerEmail: 'j.vance@enterprise-group.org', storeLocation: 'Main Flagship / HQ', rating: 5, category: 'STAFF_SERVICE', title: 'Exceptional POS setup assistance', comments: 'The technical account manager was incredibly thorough when walking our cashiers through the dual-screen POS interface.', sentiment: 'POSITIVE', status: 'CLOSED', submittedAt: '2024-05-17 14:20', assignedManager: 'Michael Chang', resolutionNotes: 'Sent personalized thank you note with a 10% accessory voucher.' },
  { id: '2', feedbackRef: 'FB-2024-820', customerName: 'Alice Smith-Bauer', customerEmail: 'alice@smithbauer-design.com', storeLocation: 'Downtown Branch', rating: 2, category: 'CHECKOUT_SPEED', title: 'Long queues during lunchtime rush', comments: 'Only two registers were open during peak hours. Had to wait over 15 minutes just to purchase commercial display samples.', sentiment: 'NEGATIVE', status: 'NEW', submittedAt: '2024-05-17 12:45' },
  { id: '3', feedbackRef: 'FB-2024-821', customerName: 'Anonymous Retail Buyer', customerEmail: 'noreply@retailhub.local', storeLocation: 'Central Distribution Warehouse', rating: 4, category: 'PRODUCT_QUALITY', title: 'Sturdy packaging but delayed intake confirmation', comments: 'Pallet wrappers were flawless, though the warehouse intake receipt took a while to sync to my customer dashboard.', sentiment: 'NEUTRAL', status: 'REVIEWED', submittedAt: '2024-05-16 16:10', assignedManager: 'David Ross' },
  { id: '4', feedbackRef: 'FB-2024-822', customerName: 'Robert Jenkins Junior', customerEmail: 'rob.jenkins@outlook.com', storeLocation: 'Northside Store', rating: 1, category: 'PRICING', title: 'Price discrepancy on shelf tag vs POS barcode', comments: 'The shelf tag listed the item at $12.50 but scanned as $14.50 at checkout. Cashier refused to honor the shelf tag.', sentiment: 'NEGATIVE', status: 'ESCALATED', submittedAt: '2024-05-15 09:30', assignedManager: 'Super Admin', resolutionNotes: 'Escalated to regional manager for immediate pricing tag audit across all aisles.' },
];

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
  const [data, setData] = useState<CustomerFeedbackRecord[]>(MOCK_FEEDBACK);
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

  const filtered = data.filter((item) => {
    const term = search.toLowerCase();
    const matchText =
      item.title.toLowerCase().includes(term) ||
      item.customerName.toLowerCase().includes(term) ||
      item.feedbackRef.toLowerCase().includes(term) ||
      item.storeLocation.toLowerCase().includes(term);

    const matchSentiment = sentimentFilter === 'ALL' ? true : item.sentiment === sentimentFilter;
    const matchRating =
      ratingFilter === 'ALL'
        ? true
        : ratingFilter === 'LOW'
          ? item.rating <= 2
          : ratingFilter === 'MEDIUM'
            ? item.rating === 3
            : item.rating >= 4;

    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'IN_PROGRESS'
          ? item.status === 'REVIEWED' || item.status === 'ACTION_TAKEN'
          : statusFilter === 'CLOSED'
            ? item.status === 'CLOSED'
            : item.status === statusFilter;

    return matchText && matchSentiment && matchRating && matchStatus;
  });

  const totalCount = data.length;
  const positiveCount = data.filter((f) => f.sentiment === 'POSITIVE').length;
  const negativeCount = data.filter((f) => f.sentiment === 'NEGATIVE').length;
  const newNegativeCount = data.filter((f) => f.sentiment === 'NEGATIVE' && (f.status === 'NEW' || f.status === 'ESCALATED')).length;
  const avgRating = totalCount ? (data.reduce((acc, f) => acc + f.rating, 0) / totalCount).toFixed(1) : '0.0';

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingFeedback({
      feedbackRef: `FB-${Math.floor(2024000 + Math.random() * 9000)}`,
      customerName: '',
      customerEmail: '',
      storeLocation: 'Main Flagship / HQ',
      rating: 5,
      category: 'GENERAL',
      title: '',
      comments: '',
      sentiment: 'POSITIVE',
      status: 'NEW',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      assignedManager: '',
      resolutionNotes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (fb: CustomerFeedbackRecord) => {
    setModalMode('edit');
    setEditingFeedback(fb);
    setIsModalOpen(true);
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedback.title || !editingFeedback.customerName) return;

    if (modalMode === 'create') {
      const newRecord: CustomerFeedbackRecord = {
        id: Date.now().toString(),
        feedbackRef: editingFeedback.feedbackRef || `FB-${Math.floor(2024000 + Math.random() * 9000)}`,
        customerName: editingFeedback.customerName || 'Khách hàng ẩn danh',
        customerEmail: editingFeedback.customerEmail || 'noreply@retailhub.local',
        storeLocation: editingFeedback.storeLocation || 'Main Flagship / HQ',
        rating: Number(editingFeedback.rating) || 5,
        category: editingFeedback.category || 'GENERAL',
        title: editingFeedback.title || '',
        comments: editingFeedback.comments || '',
        sentiment: editingFeedback.sentiment || 'POSITIVE',
        status: editingFeedback.status || 'NEW',
        submittedAt: editingFeedback.submittedAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
        assignedManager: editingFeedback.assignedManager,
        resolutionNotes: editingFeedback.resolutionNotes
      };
      setData([newRecord, ...data]);
    } else {
      setData(data.map(item => item.id === editingFeedback.id ? { ...item, ...editingFeedback } as CustomerFeedbackRecord : item));
    }
    setIsModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deletingFeedback) return;
    setData(data.filter(item => item.id !== deletingFeedback.id));
    setDeletingFeedback(null);
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

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ý Kiến Phản Hồi & Khảo Sát NPS (Customer Feedback)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi đánh giá chất lượng dịch vụ, giám sát mức độ hài lòng và xử lý khiếu nại khách hàng. Nhấp vào dòng để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất nhật ký khảo sát
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Ghi nhận phản hồi mới
            </button>
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
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề, khách hàng, mã phản hồi hoặc địa điểm..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
              />
            </div>
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

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedFeedback(row)} />
      </div>

      <Drawer
        isOpen={!!selectedFeedback}
        onClose={() => setSelectedFeedback(null)}
        title={selectedFeedback ? `Hồ Sơ Phản Hồi: ${selectedFeedback.feedbackRef}` : 'Chi Tiết Phản Hồi'}
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
      </Drawer>

      {/* Modal: Thêm / Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Ghi Nhận Ý Kiến Phản Hồi' : 'Chỉnh Sửa Phản Hồi'}
        width="max-w-xl"
      >
        <form onSubmit={handleSaveFeedback} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phản hồi *</label>
              <input
                type="text"
                value={editingFeedback.feedbackRef || ''}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, feedbackRef: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
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
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email liên hệ *</label>
              <input
                type="email"
                value={editingFeedback.customerEmail || ''}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, customerEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đánh giá (1-5 sao)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={editingFeedback.rating ?? 5}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, rating: parseInt(e.target.value) || 5 })}
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
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mức độ hài lòng</label>
              <select
                value={editingFeedback.sentiment || 'POSITIVE'}
                onChange={(e) => setEditingFeedback({ ...editingFeedback, sentiment: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="POSITIVE">Tích cực (Positive)</option>
                <option value="NEUTRAL">Trung lập (Neutral)</option>
                <option value="NEGATIVE">Tiêu cực (Negative)</option>
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
              {modalMode === 'create' ? 'Tạo mới' : 'Lưu thay đổi'}
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
