import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileCode, Play, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useOmnichannelStore } from '../store/omnichannelStore';

export interface WebhookLogRecord {
  id: string;
  logId: string;
  channelName: string;
  eventType: string;
  receivedTime: string;
  httpStatus: number;
  payloadSummary: string;
  notes: string;
}

export function WebhookLogsPage() {
  const {
    webhookLogs: storeLogs,
    fetchWebhookLogs,
  } = useOmnichannelStore();

  useEffect(() => {
    fetchWebhookLogs();
  }, [fetchWebhookLogs]);

  const data: WebhookLogRecord[] = useMemo(() => {
    return storeLogs.map((w) => ({
      id: w.id,
      logId: w.logCode,
      channelName: w.channelName,
      eventType: (w.eventType === 'PRICE_CHANGED' ? 'STOCK_CHANGED' : w.eventType) as any,
      receivedTime: w.createdAt,
      httpStatus: w.responseCode,
      payloadSummary: w.payloadSummary,
      notes: w.status === 'SUCCESS' ? 'Xử lý thành công' : 'Thất bại',
    }));
  }, [storeLogs]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WebhookLogRecord | null>(null);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.logId.toLowerCase().includes(q) ||
        d.channelName.toLowerCase().includes(q) ||
        d.eventType.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleRetryWebhook = (item: WebhookLogRecord) => {
    alert(`Đang gửi lại yêu cầu xử lý Webhook ID: ${item.logId}...`);
  };

  const columns = useMemo<ColumnDef<WebhookLogRecord>[]>(
    () => [
      {
        accessorKey: 'logId',
        header: 'ID Webhook',
        cell: (info) => <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'channelName',
        header: 'Kênh gửi',
        cell: (info) => <span className="font-semibold text-blue-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'eventType',
        header: 'Sự kiện',
        cell: (info) => {
          const val = info.getValue() as string;
          let label = 'Đơn hàng mới';
          let color = 'text-blue-600 bg-blue-50';
          if (val === 'ORDER_CANCELLED') {
            label = 'Hủy đơn hàng';
            color = 'text-red-600 bg-red-50';
          } else if (val === 'STOCK_CHANGED') {
            label = 'Thay đổi tồn';
            color = 'text-amber-600 bg-amber-50';
          }
          return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>;
        },
      },
      {
        accessorKey: 'receivedTime',
        header: 'Thời gian nhận',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'httpStatus',
        header: 'HTTP Status',
        cell: (info) => {
          const val = info.getValue() as number;
          const isSuccess = val === 200;
          return (
            <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${isSuccess ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {val} {isSuccess ? 'OK' : 'Error'}
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
              className="p-1 text-gray-500 hover:text-emerald-600 rounded"
              title="Xem chi tiết payload"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleRetryWebhook(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Gửi lại webhook (retry)"
            >
              <Play className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    [data]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Nhật ký gọi webhook TMĐT (webhook logs)</h1>
          <p className="text-sm text-gray-500">
            Theo dõi, phân tích các cuộc gọi API Webhook từ Shopee, Lazada, TikTok Shop truyền dữ liệu về hệ thống bán hàng đa kênh POS.
          </p>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm ID Webhook, tên sàn, loại sự kiện..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết Webhook: ${selected?.logId}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">ID Webhook Log:</span>
                <p className="font-mono font-semibold">{selected.logId}</p>
              </div>
              <div>
                <span className="text-gray-500">Kênh phát:</span>
                <p className="font-semibold text-blue-600">{selected.channelName}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Thời gian nhận:</span>
                <p className="font-mono">{selected.receivedTime}</p>
              </div>
              <div>
                <span className="text-gray-500">Mã HTTP status:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.httpStatus === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.httpStatus} {selected.httpStatus === 200 ? 'SUCCESS' : 'FAILED'}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-gray-500 flex items-center gap-1">
                <FileCode className="w-4 h-4 text-gray-400" /> Nội dung dữ liệu (Payload JSON):
              </span>
              <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded font-mono text-xs overflow-x-auto text-gray-700 dark:text-gray-300">
                {JSON.stringify(JSON.parse(selected.payloadSummary), null, 2)}
              </pre>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Mô tả lỗi / hành động:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
            <div className="pt-2">
              <button
                onClick={() => handleRetryWebhook(selected)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
              >
                <Play className="w-4 h-4" /> Bắn Lại Webhook Để Xử Lý Lại
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default WebhookLogsPage;
