import { useEffect, useMemo, useState } from 'react';
import { Plus, Download, Search, Eye, Calendar, Star, User, ClipboardList, CheckCircle2, Award, AwardIcon, TrendingUp } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface SupplierEvaluationItem {
  id: string;
  evaluationId: string;
  supplierName: string;
  evaluationDate: string;
  deliveryDelayScore: number; // Điểm độ trễ giao hàng (thang điểm 10)
  defectRateScore: number;    // Điểm hàng lỗi (thang điểm 10)
  priceScore: number;         // Điểm giá cả (thang điểm 10)
  finalScore: number;         // Điểm tổng kết (thang điểm 10)
  comments: string;
  evaluatedBy: string;
}

export function SupplierEvaluationsPage() {
  const [data, setData] = useState<SupplierEvaluationItem[]>([]);
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('Tất cả');
  const [selectedItem, setSelectedItem] = useState<SupplierEvaluationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<SupplierEvaluationItem>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvaluations = async () => {
    try {
      setIsLoading(true);
      const res = await axiosClient.get('/purchase/evaluations?size=500');
      const list = (res as any).content || res || [];
      const mapped: SupplierEvaluationItem[] = (Array.isArray(list) ? list : []).map((item: any) => {
        const delivery = item.deliveryScore || 0;
        const quality = item.qualityScore || 0;
        const price = item.priceScore || 0;
        const overall = item.overallScore || (delivery + quality + price > 0 ? parseFloat(((delivery + quality + price) / 3).toFixed(1)) : 0);
        return {
          id: String(item.id),
          evaluationId: `EV-${item.id}`,
          supplierName: item.supplier?.name || '',
          evaluationDate: item.evalDate || '',
          deliveryDelayScore: delivery,
          defectRateScore: quality,
          priceScore: price,
          finalScore: overall,
          comments: item.remarks || '',
          evaluatedBy: item.evaluatedBy?.username || '',
        };
      });
      setData(mapped);
    } catch (err) {
      console.error('Lỗi tải danh sách đánh giá:', err);
      toast.error('Không thể tải danh sách đánh giá nhà cung cấp');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const filtered = data.filter((item) => {
    const matchesSearch =
      item.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      item.evaluatedBy.toLowerCase().includes(search.toLowerCase()) ||
      item.comments.toLowerCase().includes(search.toLowerCase());
    
    let matchesScore = true;
    if (scoreFilter === 'XUAT_SAC') matchesScore = item.finalScore >= 9.0;
    else if (scoreFilter === 'KHA') matchesScore = item.finalScore >= 8.0 && item.finalScore < 9.0;
    else if (scoreFilter === 'TRUNG_BINH') matchesScore = item.finalScore < 8.0;

    return matchesSearch && matchesScore;
  });

  const handleOpenCreate = () => {
    setEditingItem({
      evaluationId: `DG-2026-00${data.length + 1}`,
      supplierName: '',
      evaluationDate: new Date().toISOString().split('T')[0],
      deliveryDelayScore: 8,
      defectRateScore: 8,
      priceScore: 8,
      comments: '',
      evaluatedBy: 'Quản lý thu mua'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.supplierName) return;

    const delay = Number(editingItem.deliveryDelayScore || 8);
    const defect = Number(editingItem.defectRateScore || 8);
    const price = Number(editingItem.priceScore || 8);
    const overall = parseFloat(((delay + defect + price) / 3).toFixed(1));

    try {
      const payload = {
        evalDate: editingItem.evaluationDate || new Date().toISOString().split('T')[0],
        deliveryScore: delay,
        qualityScore: defect,
        priceScore: price,
        overallScore: overall,
        remarks: editingItem.comments || 'Không có nhận xét chi tiết.',
      };
      await axiosClient.post('/purchase/evaluations', payload);
      toast.success('Tạo đánh giá nhà cung cấp thành công');
      await fetchEvaluations();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Lỗi tạo đánh giá:', err);
      toast.error('Không thể tạo đánh giá nhà cung cấp');
    }
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 9.0) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    if (score >= 8.0) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  };

  const getScoreText = (score: number) => {
    if (score >= 9.0) return 'Xuất sắc';
    if (score >= 8.0) return 'Khá / tốt';
    return 'Trung bình / Cần cải thiện';
  };

  const columns = useMemo<ColumnDef<SupplierEvaluationItem>[]>(
    () => [
      {
        accessorKey: 'evaluationId',
        header: 'Mã phiếu',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'supplierName',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'evaluationDate',
        header: 'Ngày đánh giá',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'detailedScores',
        header: 'Điểm chi tiết (giao - lỗi - giá)',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50">
              Giao: {row.original.deliveryDelayScore}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/50">
              Lỗi: {row.original.defectRateScore}
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border border-purple-200/50">
              Giá: {row.original.priceScore}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'finalScore',
        header: 'Điểm tổng kết',
        cell: (info) => {
          const score = info.getValue() as number;
          return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getScoreBadgeColor(score)}`}>
              <Star className="w-3.5 h-3.5 fill-current" />
              {score} / 10
            </span>
          );
        },
      },
      {
        accessorKey: 'evaluatedBy',
        header: 'Người chấm',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
              title="Xem tiêu chí chấm"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đánh giá nhà cung cấp (vendor evaluation)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Thực hiện xếp hạng, chấm điểm nhà cung cấp dựa trên các tiêu chí giao hàng trễ, chất lượng hàng hóa lỗi hỏng, và giá cả sản phẩm.
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
              <Plus className="w-4 h-4" /> Lập phiếu đánh giá mới
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
              placeholder="Tìm kiếm theo nhà cung cấp, người chấm hoặc nhận xét..."
              className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Phân loại điểm:</span>
            <select
              value={scoreFilter}
              onChange={(e) => setScoreFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
            >
              <option value="Tất cả">Tất cả xếp hạng</option>
              <option value="XUAT_SAC">Xuất sắc ( &gt;= 9.0 )</option>
              <option value="KHA">Khá / tốt ( 8.0 - 8.9 )</option>
              <option value="TRUNG_BINH">Trung bình ( &lt; 8.0 )</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedItem(row)} />
        )}
      </div>

      {/* Drawer Chi tiết tiêu chí chấm điểm */}
      <Drawer
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Chi tiết Đánh giá: ${selectedItem.supplierName}` : 'Thông tin chi tiết'}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <Star className="w-5 h-5 fill-current text-yellow-300" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Điểm tổng kết chất lượng</p>
                <p className="text-xl font-bold text-emerald-800 dark:text-emerald-400">
                  {selectedItem.finalScore} / 10 ({getScoreText(selectedItem.finalScore)})
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-emerald-500" /> Chi tiết tiêu chí chấm điểm
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Độ trễ giao hàng</p>
                    <p className="text-xs text-gray-500">Giao hàng đúng giờ, đầy đủ số lượng</p>
                  </div>
                  <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{selectedItem.deliveryDelayScore} / 10</span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Tỷ lệ hàng lỗi hỏng</p>
                    <p className="text-xs text-gray-500">Không móp méo, hư hỏng, đúng hạn sử dụng</p>
                  </div>
                  <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{selectedItem.defectRateScore} / 10</span>
                </div>

                <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Chính sách giá cả</p>
                    <p className="text-xs text-gray-500">Mức chiết khấu và sự ổn định giá sỉ</p>
                  </div>
                  <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{selectedItem.priceScore} / 10</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-xl shadow-sm">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Báo cáo & Nhận xét tổng kết</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed mt-1">{selectedItem.comments}</p>
              
              <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-3 flex justify-between items-center text-xs text-gray-500">
                <span>Người thực hiện đánh giá:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedItem.evaluatedBy}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span>Ngày hoàn tất chấm điểm:</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">{selectedItem.evaluationDate}</span>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal lập phiếu đánh giá nhà cung cấp */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lập phiếu đánh giá nhà cung cấp mới"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phiếu (Hệ thống) *</label>
              <input
                type="text"
                value={editingItem.evaluationId || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày đánh giá *</label>
              <input
                type="date"
                value={editingItem.evaluationDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, evaluationDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhà cung cấp cần đánh giá *</label>
            <input
              type="text"
              value={editingItem.supplierName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, supplierName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Ví dụ: Công ty Unilever Việt Nam"
              required
            />
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Chấm điểm tiêu chí (Thang điểm 1 - 10)</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giao trễ / Đúng hạn</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={editingItem.deliveryDelayScore || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, deliveryDelayScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tỷ lệ hàng lỗi</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={editingItem.defectRateScore || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, defectRateScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá cả cạnh tranh</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={editingItem.priceScore || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, priceScore: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người chấm điểm *</label>
            <input
              type="text"
              value={editingItem.evaluatedBy || ''}
              onChange={(e) => setEditingItem({ ...editingItem, evaluatedBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nhận xét tổng kết *</label>
            <textarea
              rows={3}
              value={editingItem.comments || ''}
              onChange={(e) => setEditingItem({ ...editingItem, comments: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Nhập ghi chú chi tiết về hiệu quả giao dịch và lý do chấm điểm..."
              required
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
              Lưu phiếu đánh giá
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
