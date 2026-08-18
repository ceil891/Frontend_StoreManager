import { useMemo, useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, DollarSign, Calendar, FileText, CheckCircle2, AlertTriangle, Building2, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export interface CodReconciliationRecord {
  id: string;
  reconciliationCode: string; // COD-REC-000001
  carrierName: string;
  reconciliationPeriod: string; // Tuần 32 - 2026
  fromDate: string;
  toDate: string;
  executorName: string;
  reconciliationDate: string;
  totalShipments: number;
  totalCodRequired: number;
  totalCodCollected: number;
  totalCodReconciled: number;
  totalShippingFee: number;
  totalCodFee: number;
  totalReturnFee: number;
  totalSurcharges: number;
  netPayoutAmount: number; // Số tiền Carrier phải chuyển về cho chủ shop
  paidAmount: number;
  paymentDate?: string;
  bankAccountInfo?: string;
  transactionRefNo?: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'DISPUTED';
  notes?: string;
}

const statusBadgeStyles: Record<CodReconciliationRecord['status'], string> = {
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  PARTIAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  DISPUTED: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200',
};

const statusLabels: Record<CodReconciliationRecord['status'], string> = {
  PENDING: 'Chờ đối soát / Thanh toán',
  PARTIAL: 'Thanh toán một phần',
  PAID: 'Đã hoàn tất thanh toán',
  DISPUTED: 'Đang khiếu nại cước/COD',
};

export function CodReconciliationPage() {
  const [records, setRecords] = useState<CodReconciliationRecord[]>([
    {
      id: '1',
      reconciliationCode: 'COD-REC-000001',
      carrierName: 'Viettel Post Express',
      reconciliationPeriod: 'Kỳ 1 - Tháng 08/2026',
      fromDate: '2026-08-01',
      toDate: '2026-08-07',
      executorName: 'Kế toán Nguyễn Thị Dung',
      reconciliationDate: '2026-08-08',
      totalShipments: 145,
      totalCodRequired: 185000000,
      totalCodCollected: 185000000,
      totalCodReconciled: 185000000,
      totalShippingFee: 6500000,
      totalCodFee: 450000,
      totalReturnFee: 0,
      totalSurcharges: 120000,
      netPayoutAmount: 177930000, // 185,000,000 - 6,500,000 - 450,000 - 120,000
      paidAmount: 177930000,
      paymentDate: '2026-08-09',
      bankAccountInfo: 'Techcombank - 19038888999012 (Chủ TK: CTY RETAILHUB)',
      transactionRefNo: 'FT26080998812',
      status: 'PAID',
      notes: 'Đã nhận đủ tiền chuyển khoản từ Viettel Post.',
    },
    {
      id: '2',
      reconciliationCode: 'COD-REC-000002',
      carrierName: 'Giao Hàng Tiết Kiệm (GHTK)',
      reconciliationPeriod: 'Kỳ 2 - Tháng 08/2026',
      fromDate: '2026-08-08',
      toDate: '2026-08-14',
      executorName: 'Kế toán Nguyễn Thị Dung',
      reconciliationDate: '2026-08-14',
      totalShipments: 98,
      totalCodRequired: 120000000,
      totalCodCollected: 118500000,
      totalCodReconciled: 118500000,
      totalShippingFee: 4200000,
      totalCodFee: 300000,
      totalReturnFee: 150000,
      totalSurcharges: 50000,
      netPayoutAmount: 113800000,
      paidAmount: 0,
      status: 'PENDING',
      notes: 'Chờ GHTK duyệt kỳ đối soát tuần 2.',
    },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<CodReconciliationRecord | null>(null);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.reconciliationCode.toLowerCase().includes(search.toLowerCase()) ||
        r.carrierName.toLowerCase().includes(search.toLowerCase()) ||
        r.reconciliationPeriod.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, search, statusFilter]);

  const columns = useMemo<ColumnDef<CodReconciliationRecord>[]>(
    () => [
      {
        accessorKey: 'reconciliationCode',
        header: 'Mã đối soát & Kỳ',
        cell: ({ row }) => (
          <div>
            <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
              {row.original.reconciliationCode}
            </span>
            <p className="text-xs text-gray-500 font-semibold mt-1">{row.original.reconciliationPeriod}</p>
          </div>
        ),
      },
      {
        accessorKey: 'carrierName',
        header: 'Hãng vận chuyển (Carrier)',
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{row.original.carrierName}</p>
            <p className="text-xs text-gray-500 font-mono">{row.original.fromDate} đến {row.original.toDate}</p>
          </div>
        ),
      },
      {
        accessorKey: 'totalShipments',
        header: 'Số đơn & COD',
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            <p className="font-bold text-gray-900 dark:text-white">{row.original.totalShipments} vận đơn</p>
            <p className="text-emerald-600 dark:text-emerald-400 font-bold">COD: {row.original.totalCodCollected.toLocaleString()} VNĐ</p>
          </div>
        ),
      },
      {
        accessorKey: 'netPayoutAmount',
        header: 'Thực nhận từ Carrier',
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            <p className="font-bold text-primary text-sm">{row.original.netPayoutAmount.toLocaleString()} VNĐ</p>
            <p className="text-gray-500">Tổng phí: {(row.original.totalShippingFee + row.original.totalCodFee).toLocaleString()} VNĐ</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái đối soát',
        cell: (info) => {
          const st = info.getValue() as CodReconciliationRecord['status'];
          return (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusBadgeStyles[st]}`}>
              {statusLabels[st] || st}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <button
            onClick={() => setSelectedRecord(row.original)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300"
            title="Xem bảng chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-primary" /> Đối Soát COD & Cước Phí Vận Chuyển
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý kỳ đối soát COD, tổng hợp cước vận chuyển, phụ phí và xác nhận dòng tiền chuyển khoản từ Hãng vận chuyển.
          </p>
        </div>
        <button
          onClick={() => toast.info('Chức năng tạo kỳ đối soát COD tự động được tổng hợp từ dữ liệu vận đơn thành công.')}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Kỳ Đối Soát Mới
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đối soát, tên hãng vận chuyển, kỳ đối soát..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ đối soát</option>
            <option value="PAID">Đã hoàn tất thanh toán</option>
            <option value="DISPUTED">Đang khiếu nại</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <ReusableDataTable columns={columns} data={filtered} />
      </div>

      {/* Modal Xem Chi Tiết Bảng Đối Soát COD */}
      <Modal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title={`Chi Tiết Kỳ Đối Soát COD: ${selectedRecord?.reconciliationCode}`}
        width="max-w-3xl"
      >
        {selectedRecord && (
          <div className="space-y-6 text-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">{selectedRecord.carrierName}</h3>
                  <p className="text-xs text-gray-500">Kỳ: {selectedRecord.reconciliationPeriod} ({selectedRecord.fromDate} đến {selectedRecord.toDate})</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${statusBadgeStyles[selectedRecord.status]}`}>
                  {statusLabels[selectedRecord.status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs pt-1">
                <div>
                  <p className="text-gray-500">Tổng số vận đơn đối soát:</p>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedRecord.totalShipments} vận đơn</p>
                </div>
                <div>
                  <p className="text-gray-500">Tổng COD đã thu từ khách:</p>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{selectedRecord.totalCodCollected.toLocaleString()} VNĐ</p>
                </div>
              </div>

              <div className="border-t pt-3 space-y-1 font-mono text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Trừ Phí Vận Chuyển:</span>
                  <span>- {selectedRecord.totalShippingFee.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Trừ Phí Thu Hộ COD:</span>
                  <span>- {selectedRecord.totalCodFee.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Trừ Phụ Phí Vùng Xa / Nhiên Liệu:</span>
                  <span>- {selectedRecord.totalSurcharges.toLocaleString()} VNĐ</span>
                </div>
                <div className="flex justify-between text-base font-bold text-primary pt-2 border-t">
                  <span>SỐ TIỀN CARRIER THANH TOÁN (NET PAYOUT):</span>
                  <span>{selectedRecord.netPayoutAmount.toLocaleString()} VNĐ</span>
                </div>
              </div>
            </div>

            {selectedRecord.bankAccountInfo && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                <p className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">Thông tin thanh toán ngân hàng:</p>
                <p className="font-mono text-emerald-700 dark:text-emerald-400">{selectedRecord.bankAccountInfo}</p>
                {selectedRecord.transactionRefNo && (
                  <p className="font-mono text-gray-500 mt-1">Mã giao dịch: {selectedRecord.transactionRefNo}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold"
              >
                Đóng Hộp Thoại
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
