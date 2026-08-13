import { useState, useMemo } from 'react';
import { Plus, Search, Eye, CheckCircle2, XCircle, FileText, ArrowRight } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type ReturnRequestItem } from '@/features/sales/store/salesStore';
import { toast } from 'sonner';

const REQUEST_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  PENDING: { label: 'Chờ duyệt', style: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  APPROVED: { label: 'Đã duyệt', style: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  PARTIALLY_RETURNED: { label: 'Trả một phần', style: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
  COMPLETED: { label: 'Hoàn thành (100%)', style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  REJECTED: { label: 'Từ chối', style: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  CANCELLED: { label: 'Đã hủy', style: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

const REFUND_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  STORE_CREDIT: 'Ví / Credit',
};

export function ReturnsListsPage() {
  const { saleOrders, returnRequests, addReturnRequest, updateReturnRequestStatus, addCustomerReturn } = useSalesStore();

  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Partial<ReturnRequestItem>>({});

  const filteredRequests = useMemo(() => {
    if (!search) return returnRequests;
    const q = search.toLowerCase();
    return returnRequests.filter(
      (r) =>
        r.requestCode.toLowerCase().includes(q) ||
        r.orderCode.toLowerCase().includes(q) ||
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.customerPhone || '').includes(q)
    );
  }, [search, returnRequests]);

  const handleApproveAndCreateReturn = async (req: ReturnRequestItem) => {
    if (req.remainingQty <= 0) {
      toast.warning(`Yêu cầu ${req.requestCode} đã hoàn tất trả hàng (100%)`);
      return;
    }

    try {
      // 1. Update Request status to APPROVED or PARTIALLY_RETURNED
      if (req.status === 'PENDING') {
        updateReturnRequestStatus(req.id, 'APPROVED');
      }

      // 2. Auto Create Physical Customer Return (RET-XXXX) in status PENDING_RECEIPT
      const newRetCode = `RET-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const qtyToReturn = req.remainingQty;
      const firstItem = req.items && req.items[0];
      const itemPrice = firstItem?.price || 15000;
      const totalAmount = qtyToReturn * itemPrice;

      await addCustomerReturn({
        returnCode: newRetCode,
        returnRequestCode: req.requestCode,
        orderCode: req.orderCode,
        customerId: req.customerId,
        returnDate: new Date().toISOString().split('T')[0],
        refundAmount: totalAmount,
        deductionAmount: 0,
        reason: req.reason,
        status: 'PENDING_RECEIPT', // Standard: RET created in PENDING_RECEIPT state waiting for physical goods
        refundMethod: (req.requestedRefundMethod as any) || 'CASH',
        isRestocked: true,
        returnBranchId: '1',
        warehouseId: 'WH-01',
        locationId: 'BIN-A01',
        inspector: req.handlerName || 'Trần Văn Hưng',
        createdBy: 'Admin POS',
        notes: `Tạo từ Yêu cầu trả hàng ${req.requestCode} (SL: ${qtyToReturn})`,
        returnLines: (req.items || []).map((it, idx) => ({
          id: String(idx + 1),
          productId: it.productId,
          productName: it.productName,
          sku: it.sku,
          quantity: qtyToReturn,
          availableQty: qtyToReturn,
          originalQty: it.quantity,
          price: it.price,
          subTotal: qtyToReturn * it.price,
          reason: it.reason || req.reason,
          condition: 'UNOPENED',
          isRestocked: true,
        })),
      });

      toast.success(`✓ Đã tạo Phiếu Khách Hàng Trả Hàng ${newRetCode} (Trạng thái: Chờ nhận hàng)!`);
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tạo phiếu thực trả');
    }
  };

  const handleRejectRequest = (req: ReturnRequestItem) => {
    updateReturnRequestStatus(req.id, 'REJECTED');
    toast.info(`Đã từ chối Yêu cầu trả hàng ${req.requestCode}`);
  };

  const handleSaveNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest.orderCode) {
      toast.error('Vui lòng chọn Mã đơn gốc');
      return;
    }

    const qty = Number(editingRequest.requestedQty) || 1;

    const newReq: ReturnRequestItem = {
      id: String(Date.now()),
      requestCode: editingRequest.requestCode || `RR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderCode: editingRequest.orderCode,
      customerId: editingRequest.customerId || '1',
      customerName: editingRequest.customerName || 'Khách mua',
      customerPhone: editingRequest.customerPhone || '',
      requestDate: editingRequest.requestDate || new Date().toISOString().split('T')[0],
      reason: editingRequest.reason || 'Yêu cầu trả hàng',
      requestedRefundMethod: editingRequest.requestedRefundMethod || 'CASH',
      status: 'PENDING',
      handlerName: 'Quản trị viên',
      notes: editingRequest.notes || '',
      requestedQty: qty,
      returnedQty: 0,
      remainingQty: qty,
      items: [
        {
          productId: '1',
          productName: 'Sản phẩm từ đơn ' + editingRequest.orderCode,
          sku: 'SKU-' + editingRequest.orderCode,
          quantity: qty,
          returnedQty: 0,
          price: 100000,
          reason: editingRequest.reason || 'Yêu cầu trả hàng',
        },
      ],
    };

    addReturnRequest(newReq);
    setIsModalOpen(false);
    toast.success('Tạo Yêu cầu trả hàng thành công!');
  };

  const columns = useMemo<ColumnDef<ReturnRequestItem>[]>(
    () => [
      {
        accessorKey: 'requestCode',
        header: 'Mã yêu cầu (RR)',
        cell: (info) => (
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 text-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn gốc',
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300 font-semibold">{info.getValue() as string}</span>,
      },
      {
        id: 'customer',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-xs">{row.original.customerName || 'Khách vãng lai'}</p>
            {row.original.customerPhone && <p className="text-[11px] font-mono text-gray-500">{row.original.customerPhone}</p>}
          </div>
        ),
      },
      {
        id: 'qtyProgress',
        header: 'Tiến độ trả hàng',
        cell: ({ row }) => {
          const req = row.original;
          return (
            <div className="text-xs space-y-0.5">
              <div className="flex gap-2">
                <span className="text-gray-500">Yêu cầu: <strong>{req.requestedQty}</strong></span>
                <span className="text-emerald-600">Đã RET: <strong>{req.returnedQty}</strong></span>
              </div>
              <span className="inline-block font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded text-[11px]">
                Còn được tạo RET: {req.remainingQty}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: 'Lý do trả hàng',
        cell: (info) => <span className="text-xs text-gray-700 dark:text-gray-300 line-clamp-1">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'requestDate',
        header: 'Ngày yêu cầu',
        cell: (info) => <span className="text-xs font-mono text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const st = info.getValue() as string;
          const config = REQUEST_STATUS_CONFIG[st] || { label: st, style: 'bg-gray-100 text-gray-700' };
          return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${config.style}`}>
              {config.label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const req = row.original;
          const canCreateRET = (req.status === 'PENDING' || req.status === 'APPROVED' || req.status === 'PARTIALLY_RETURNED') && req.remainingQty > 0;

          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setSelectedRequest(req)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs flex items-center gap-1 font-medium"
                title="Xem chi tiết"
              >
                <Eye className="w-4 h-4" />
              </button>

              {canCreateRET && (
                <button
                  type="button"
                  onClick={() => handleApproveAndCreateReturn(req)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  title="Duyệt yêu cầu và Tạo phiếu RET ở trạng thái Chờ nhận hàng"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> + Tạo Phiếu RET
                </button>
              )}

              {req.status === 'PENDING' && (
                <button
                  type="button"
                  onClick={() => handleRejectRequest(req)}
                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
                  title="Từ chối"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Quản Lý Yêu Cầu Trả Hàng (Return Requests - RR)
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và tiếp nhận các yêu cầu / đề nghị đổi trả từ khách hàng (Mã Yêu Cầu: RR-XXXX | Hỗ trợ Trả từng phần 1:N)
          </p>
        </div>

        <button
          onClick={() => {
            setEditingRequest({
              requestCode: `RR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              orderCode: '',
              customerName: '',
              customerPhone: '',
              requestDate: new Date().toISOString().split('T')[0],
              reason: '',
              requestedRefundMethod: 'CASH',
              requestedQty: 1,
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Tạo Yêu Cầu Trả Hàng (RR)
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm theo Mã yêu cầu (RR-XXXX), Mã đơn gốc, Tên KH, SĐT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <ReusableDataTable data={filteredRequests} columns={columns} />
      </div>

      {/* MODAL XEM CHI TIẾT YÊU CẦU */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title={`📋 Chi Tiết Yêu Cầu Trả Hàng ${selectedRequest?.requestCode}`}
        width="max-w-2xl"
      >
        {selectedRequest && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
              <div>
                <p className="text-xs text-gray-500">Mã yêu cầu:</p>
                <p className="font-mono font-bold text-blue-600">{selectedRequest.requestCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Mã đơn gốc:</p>
                <p className="font-mono font-bold">{selectedRequest.orderCode}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Khách hàng:</p>
                <p className="font-bold text-gray-900 dark:text-white">{selectedRequest.customerName} ({selectedRequest.customerPhone})</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ngày yêu cầu:</p>
                <p className="font-mono">{selectedRequest.requestDate}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Số lượng yêu cầu trả:</p>
                <p className="font-bold text-blue-600">{selectedRequest.requestedQty} sản phẩm (Đã trả: {selectedRequest.returnedQty} | Còn lại: {selectedRequest.remainingQty})</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Hình thức mong muốn:</p>
                <p className="font-semibold">{REFUND_METHOD_LABELS[selectedRequest.requestedRefundMethod] || selectedRequest.requestedRefundMethod}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-gray-500 mb-1">Lý do yêu cầu trả:</p>
              <p className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-lg text-xs border border-amber-200 dark:border-amber-800">
                {selectedRequest.reason}
              </p>
            </div>

            {selectedRequest.items && selectedRequest.items.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Danh sách sản phẩm yêu cầu trả:</p>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      <tr>
                        <th className="p-2 text-left">Sản phẩm</th>
                        <th className="p-2 text-center">SKU</th>
                        <th className="p-2 text-center">SL yêu cầu</th>
                        <th className="p-2 text-center">SL đã trả</th>
                        <th className="p-2 text-right">Đơn giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRequest.items.map((it, idx) => (
                        <tr key={idx} className="border-t border-gray-200 dark:border-gray-800">
                          <td className="p-2 font-medium">{it.productName}</td>
                          <td className="p-2 text-center font-mono text-gray-500">{it.sku}</td>
                          <td className="p-2 text-center font-bold">{it.quantity}</td>
                          <td className="p-2 text-center font-bold text-emerald-600">{it.returnedQty || 0}</td>
                          <td className="p-2 text-right">{it.price.toLocaleString('vi-VN')} ₫</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedRequest.remainingQty > 0 && (
              <div className="pt-3 border-t flex justify-end gap-2">
                {selectedRequest.status === 'PENDING' && (
                  <button
                    onClick={() => handleRejectRequest(selectedRequest)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs"
                  >
                    ✕ Từ chối yêu cầu
                  </button>
                )}
                <button
                  onClick={() => {
                    handleApproveAndCreateReturn(selectedRequest);
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" /> + Tạo Phiếu RET (Còn {selectedRequest.remainingQty} SP)
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL TẠO YÊU CẦU TRẢ HÀNG MỚI */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="📋 Tạo Yêu Cầu Trả Hàng Từ Khách Hàng (RR)"
        width="max-w-lg"
      >
        <form onSubmit={handleSaveNewRequest} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Mã yêu cầu (Auto)</label>
            <input
              type="text"
              value={editingRequest.requestCode || ''}
              onChange={(e) => setEditingRequest({ ...editingRequest, requestCode: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono font-bold text-blue-600"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn gốc *</label>
            <select
              value={editingRequest.orderCode || ''}
              onChange={(e) => {
                const code = e.target.value;
                const foundSO = saleOrders.find((so) => so.code === code);
                setEditingRequest({
                  ...editingRequest,
                  orderCode: code,
                  customerName: foundSO?.customerName || editingRequest.customerName || 'Khách mua',
                  customerPhone: foundSO?.customerPhone || editingRequest.customerPhone || '',
                });
              }}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono font-bold"
              required
            >
              <option value="">-- Chọn đơn hàng gốc --</option>
              <option value="ONLINE-805391">ONLINE-805391 - Nguyễn Lưu Hoàng (0901234567)</option>
              <option value="ORD-POS-2026-818712">ORD-POS-2026-818712 - Trần Văn Nam (0988776655)</option>
              {saleOrders.map((so) => (
                <option key={so.id} value={so.code}>
                  {so.code} - {so.customerName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Tên khách hàng</label>
              <input
                type="text"
                value={editingRequest.customerName || ''}
                onChange={(e) => setEditingRequest({ ...editingRequest, customerName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"
              />
            </div>
            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={editingRequest.customerPhone || ''}
                onChange={(e) => setEditingRequest({ ...editingRequest, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng yêu cầu trả *</label>
            <input
              type="number"
              min={1}
              value={editingRequest.requestedQty || 1}
              onChange={(e) => setEditingRequest({ ...editingRequest, requestedQty: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-bold"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Hình thức hoàn tiền mong muốn</label>
            <select
              value={editingRequest.requestedRefundMethod || 'CASH'}
              onChange={(e) => setEditingRequest({ ...editingRequest, requestedRefundMethod: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"
            >
              <option value="CASH">Tiền mặt</option>
              <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
              <option value="STORE_CREDIT">Ví / Store Credit</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do yêu cầu trả *</label>
            <textarea
              rows={3}
              value={editingRequest.reason || ''}
              onChange={(e) => setEditingRequest({ ...editingRequest, reason: e.target.value })}
              placeholder="Nhập lý do khách báo trả hàng..."
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"
              required
            />
          </div>

          <div className="pt-3 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
            >
              Lưu Yêu Cầu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
