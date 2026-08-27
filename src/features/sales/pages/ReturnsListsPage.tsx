import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Eye, CheckCircle2, XCircle, FileText, ArrowRight, Upload, Package, DollarSign, User } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore, type ReturnRequestItem, formatMoney } from '@/features/sales/store/salesStore';
import { useUserStore } from '@/features/hr/store/userStore';
import { useAuthStore } from '@/features/auth/store/authStore';
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
  const { saleOrders, returnRequests, addReturnRequest, updateReturnRequestStatus, addCustomerReturn, fetchSaleOrders, fetchCustomerReturns, fetchReturnRequests } = useSalesStore();
  const { users, fetchUsers } = useUserStore();
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchSaleOrders();
    fetchCustomerReturns();
    fetchReturnRequests();
    fetchUsers();
  }, [fetchSaleOrders, fetchCustomerReturns, fetchReturnRequests, fetchUsers]);

  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequestItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<Partial<ReturnRequestItem>>({});
  const [isCustomOrderCode, setIsCustomOrderCode] = useState(false);
  const [proofFileName, setProofFileName] = useState<string>('');

  // Master list of all available sale orders (Backend API + Local Storage + Standard System Orders)
  const masterSaleOrders = useMemo(() => {
    let localOrders: any[] = [];
    try {
      const stored = localStorage.getItem('user_local_orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localOrders = parsed.map((lo: any, idx: number) => ({
            id: lo.id || `local-${idx}`,
            code: lo.id || `ONLINE-${idx + 100}`,
            customerId: '1',
            customerName: lo.shippingAddress?.fullName || 'Khách mua Online',
            customerPhone: lo.shippingAddress?.phone || '0901234567',
            date: new Date().toISOString().split('T')[0],
            subTotal: Number(lo.subtotal || lo.total || 0),
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: Number(lo.total || 0),
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            paymentMethod: 'ONLINE',
            branchId: 'BR-001',
            branchName: 'Chi nhánh Chính',
            origin: 'ONLINE',
            items: Array.isArray(lo.items) ? lo.items.map((it: any, iIdx: number) => ({
              id: String(iIdx + 1),
              productId: String(it.id || iIdx + 1),
              productName: it.name || it.productName || 'Sản phẩm',
              sku: it.sku || `SKU-${iIdx + 1}`,
              quantity: Number(it.quantity || 1),
              price: Number(it.price || 0),
              subTotal: Number(it.price || 0) * Number(it.quantity || 1),
            })) : [],
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse local orders', e);
    }

    const map = new Map<string, any>();
    [...localOrders, ...saleOrders].forEach((so) => {
      if (so && (so.code || (so as any).orderCode)) {
        const c = so.code || (so as any).orderCode;
        map.set(c, { ...so, code: c });
      }
    });

    return Array.from(map.values());
  }, [saleOrders]);

  const selectedSO = useMemo(() => {
    if (!editingRequest.orderCode) return null;
    return masterSaleOrders.find((so) => so.code === editingRequest.orderCode) || null;
  }, [editingRequest.orderCode, masterSaleOrders]);

  const selectedOrderItems = useMemo(() => {
    if (!selectedSO) return [];
    const rawItems = (selectedSO as any).details || (selectedSO as any).items || (selectedSO as any).orderLines || [];
    if (!Array.isArray(rawItems)) return [];
    return rawItems.map((it: any, idx: number) => ({
      id: String(it.id || idx + 1),
      productName: it.productNameSnapshot || it.productName || it.name || `Sản phẩm ${idx + 1}`,
      sku: it.skuSnapshot || it.sku || `SKU-${idx + 1}`,
      quantity: Number(it.quantity || 1),
      unitPrice: Number(it.unitPriceSnapshot || it.price || it.unitPrice || 0),
    }));
  }, [selectedSO]);

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
    setSelectedRequest(null);
    toast.info(`Đã từ chối Yêu cầu trả hàng ${req.requestCode}`);
  };

  const handleSaveNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequest.orderCode) {
      toast.error('Vui lòng chọn Mã đơn gốc');
      return;
    }

    if (!proofFileName && !editingRequest.proofImages?.length) {
      toast.error('Bắt buộc phải tải lên tệp hình ảnh / video minh chứng sản phẩm lỗi!');
      return;
    }

    const qty = Number(editingRequest.requestedQty) || 1;
    const foundSO = saleOrders.find((so) => so.code === editingRequest.orderCode);
    const soItems = (foundSO as any)?.items || (foundSO as any)?.orderLines || (foundSO as any)?.details || [];
    const matchedItem = soItems.find((it: any) => (it.productName || it.name || it.sku) === editingRequest.selectedProduct) || soItems[0];

    const prodName = editingRequest.selectedProduct || matchedItem?.productName || matchedItem?.name || ('Sản phẩm từ đơn ' + editingRequest.orderCode);
    const prodSku = matchedItem?.sku || ('SKU-' + editingRequest.orderCode);
    const prodPrice = Number(matchedItem?.price || matchedItem?.unitPrice || (editingRequest.requestedRefundAmount ? editingRequest.requestedRefundAmount / qty : 100000));

    const newReq: ReturnRequestItem = {
      id: String(Date.now()),
      requestCode: editingRequest.requestCode || `RR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      orderCode: editingRequest.orderCode,
      customerId: editingRequest.customerId || foundSO?.customerId || '1',
      customerName: editingRequest.customerName || foundSO?.customerName || 'Khách mua',
      customerPhone: editingRequest.customerPhone || foundSO?.customerPhone || '',
      requestDate: new Date().toISOString().split('T')[0],
      reason: editingRequest.reason || 'Yêu cầu trả hàng',
      requestedRefundMethod: editingRequest.requestedRefundMethod || 'CASH',
      status: (editingRequest.status as any) || 'PENDING',
      handlerName: editingRequest.handlerName || currentUser?.name || currentUser?.username || 'Nhân viên hệ thống',
      notes: editingRequest.notes || '',
      requestedQty: qty,
      returnedQty: 0,
      remainingQty: qty,
      proofImages: proofFileName ? [proofFileName] : (editingRequest.proofImages || []),
      items: [
        {
          productId: String(matchedItem?.productId || matchedItem?.id || '1'),
          productName: prodName,
          sku: prodSku,
          quantity: qty,
          returnedQty: 0,
          price: prodPrice,
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
                <span className="text-emerald-600">Đã trả: <strong>{req.returnedQty}</strong></span>
              </div>
              <span className="inline-block font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded text-[11px]">
                Còn được trả: {req.remainingQty}
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
                  title="Duyệt yêu cầu và Tạo phiếu nhập trả hàng ở trạng thái Chờ nhận hàng"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> + Tạo Phiếu Trả Hàng
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
            <FileText className="w-6 h-6 text-blue-600" /> Quản lý yêu cầu trả hàng
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Quản lý và tiếp nhận các yêu cầu / đề nghị đổi trả từ khách hàng (Hỗ trợ Trả từng phần)
          </p>
        </div>

        <button
          onClick={() => {
            const firstSO = saleOrders.length > 0 ? saleOrders[0] : null;
            setEditingRequest({
              requestCode: `RR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              orderCode: firstSO?.code || '',
              customerName: firstSO?.customerName || '',
              customerPhone: firstSO?.customerPhone || '',
              customerId: firstSO?.customerId || '1',
              requestDate: new Date().toISOString().split('T')[0],
              reason: '',
              requestedRefundMethod: 'CASH',
              requestedQty: 1,
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Tạo Yêu Cầu Trả Hàng
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
        size="erp"
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
        title="Tạo yêu cầu trả hàng từ khách hàng"
        size="erp"
      >
        <form onSubmit={handleSaveNewRequest} className="space-y-5 text-xs max-h-[75vh] overflow-y-auto pr-2">
          {/* 1. THÔNG TIN YÊU CẦU */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 dark:border-gray-700">
              <FileText className="w-4 h-4 text-blue-600" /> 1. Thông tin yêu cầu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Mã yêu cầu (Tự động)</label>
                <input
                  type="text"
                  value={editingRequest.requestCode || ''}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 font-mono font-bold text-blue-600 cursor-not-allowed"
                  readOnly
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-gray-700 dark:text-gray-300">Đơn bán hàng gốc *</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomOrderCode(!isCustomOrderCode)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    {isCustomOrderCode ? '← Chọn từ hệ thống' : '+ Tự gõ mã đơn'}
                  </button>
                </div>

                {isCustomOrderCode ? (
                  <input
                    type="text"
                    value={editingRequest.orderCode || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, orderCode: e.target.value })}
                    placeholder="Nhập mã đơn gốc (VD: SO-2026-001)..."
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono font-bold"
                    required
                  />
                ) : (
                  <select
                    value={editingRequest.orderCode || ''}
                    onChange={(e) => {
                      const code = e.target.value;
                      const foundSO = masterSaleOrders.find((so) => so.code === code);
                      const rawItems = (foundSO as any)?.details || (foundSO as any)?.items || (foundSO as any)?.orderLines || [];
                      const firstItem = rawItems.length > 0 ? rawItems[0] : null;
                      const firstItemName = firstItem ? (firstItem.productNameSnapshot || firstItem.productName || firstItem.name || firstItem.skuSnapshot || firstItem.sku || '') : '';
                      const firstItemPrice = firstItem ? Number(firstItem.unitPriceSnapshot || firstItem.price || firstItem.unitPrice || 0) : 0;
                      const qty = editingRequest.requestedQty || 1;

                      setEditingRequest({
                        ...editingRequest,
                        orderCode: code,
                        customerName: foundSO?.customerName || 'Khách mua',
                        customerPhone: foundSO?.customerPhone || '',
                        customerId: foundSO?.customerId || '1',
                        selectedProduct: firstItemName,
                        requestedRefundAmount: firstItemPrice * qty,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono font-bold"
                    required
                  >
                    <option value="">-- Chọn đơn hàng gốc --</option>
                    {masterSaleOrders.map((so) => (
                      <option key={so.id || so.code} value={so.code}>
                        {so.code} - {so.customerName} {so.customerPhone ? `(${so.customerPhone})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Khách hàng *</label>
                <input
                  type="text"
                  value={editingRequest.customerName || ''}
                  placeholder="Tự động điền từ đơn hàng"
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 font-medium cursor-not-allowed"
                  readOnly
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={editingRequest.customerPhone || ''}
                  placeholder="Tự động điền"
                  className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 font-mono cursor-not-allowed"
                  readOnly
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày yêu cầu *</label>
                <input
                  type="date"
                  value={editingRequest.requestDate || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, requestDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* 2. SẢN PHẨM YÊU CẦU TRẢ */}
          <div className="p-4 bg-blue-50/30 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900 space-y-3">
            <h3 className="font-bold text-blue-900 dark:text-blue-300 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 dark:border-blue-900">
              <Package className="w-4 h-4 text-blue-600" /> 2. Sản phẩm yêu cầu trả
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Sản phẩm / Biến thể *</label>
                {selectedOrderItems.length > 0 ? (
                  <select
                    value={editingRequest.selectedProduct || ''}
                    onChange={(e) => {
                      const prodName = e.target.value;
                      const foundItem = selectedOrderItems.find((it: any) => it.productName === prodName || it.sku === prodName);
                      const itemPrice = Number(foundItem?.unitPrice || 0);
                      const qty = Number(editingRequest.requestedQty || 1);
                      setEditingRequest({
                        ...editingRequest,
                        selectedProduct: prodName,
                        requestedRefundAmount: itemPrice * qty,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-medium"
                    required
                  >
                    <option value="">-- Chọn sản phẩm từ đơn hàng gốc --</option>
                    {selectedOrderItems.map((it: any, idx: number) => {
                      const pName = it.productName;
                      const pSku = it.sku;
                      const pQty = it.quantity;
                      const pPrice = it.unitPrice;
                      return (
                        <option key={idx} value={pName}>
                          {pName} ({pSku}) - SL mua: {pQty} - Đơn giá: {formatMoney(pPrice, 'VND')}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={editingRequest.selectedProduct || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, selectedProduct: e.target.value })}
                    placeholder="Nhập tên sản phẩm hoặc mã SKU..."
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-medium"
                    required
                  />
                )}
              </div>

              {/* Badges Thống kê số lượng */}
              {selectedOrderItems.length > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
                    <span className="block text-[10px] text-gray-400 font-normal">Đã mua</span>
                    {selectedOrderItems.find((it: any) => it.productName === editingRequest.selectedProduct)?.quantity || selectedOrderItems[0]?.quantity || 1}
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-700 dark:text-purple-300">
                    <span className="block text-[10px] text-purple-400 font-normal">Đã trả trước</span>
                    0
                  </div>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-emerald-700 dark:text-emerald-300">
                    <span className="block text-[10px] text-emerald-400 font-normal">Có thể yêu cầu trả</span>
                    {selectedOrderItems.find((it: any) => it.productName === editingRequest.selectedProduct)?.quantity || selectedOrderItems[0]?.quantity || 1}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Số lượng yêu cầu trả *</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedOrderItems.find((it: any) => (it.productName || it.name) === editingRequest.selectedProduct)?.quantity || 100}
                    value={editingRequest.requestedQty || 1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const maxAvailable = selectedOrderItems.find((it: any) => (it.productName || it.name) === editingRequest.selectedProduct)?.quantity || 100;
                      if (val > maxAvailable) {
                        toast.warning(`Số lượng trả không thể vượt quá số lượng đã mua (${maxAvailable})`);
                      }
                      const foundItem = selectedOrderItems.find((it: any) => (it.productName || it.name) === editingRequest.selectedProduct) || selectedOrderItems[0];
                      const itemPrice = Number(foundItem?.price || foundItem?.unitPrice || 0);

                      setEditingRequest({
                        ...editingRequest,
                        requestedQty: val,
                        requestedRefundAmount: itemPrice * val,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Lý do trả hàng *</label>
                  <select
                    value={editingRequest.reason || ''}
                    onChange={(e) => setEditingRequest({ ...editingRequest, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"
                    required
                  >
                    <option value="">-- Chọn lý do --</option>
                    <option value="Hàng lỗi / hỏng">Hàng lỗi / hỏng</option>
                    <option value="Giao sai sản phẩm">Giao sai sản phẩm</option>
                    <option value="Thiếu sản phẩm">Thiếu sản phẩm</option>
                    <option value="Sản phẩm không đúng mô tả">Sản phẩm không đúng mô tả</option>
                    <option value="Sản phẩm không còn nhu cầu">Sản phẩm không còn nhu cầu</option>
                    <option value="Bao bì / đóng gói bị hư hỏng">Bao bì / đóng gói bị hư hỏng</option>
                    <option value="Đặt nhầm sản phẩm">Đặt nhầm sản phẩm</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Tình trạng sản phẩm khách báo *</label>
                <select
                  value={editingRequest.itemCondition || 'CHUA_MO'}
                  onChange={(e) => setEditingRequest({ ...editingRequest, itemCondition: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-medium"
                >
                  <option value="CHUA_MO">Chưa mở / Nguyên tem niêm phong</option>
                  <option value="DA_MO">Đã mở</option>
                  <option value="LOI_HANG">Lỗi / Hỏng</option>
                  <option value="DA_SU_DUNG">Đã sử dụng / Trầy xước</option>
                  <option value="KHAC">Khác</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Chi tiết lý do {editingRequest.reason === 'Khác' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={2}
                  value={editingRequest.reasonDetails || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, reasonDetails: e.target.value })}
                  placeholder="Nhập mô tả chi tiết lý do khách báo..."
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"
                  required={editingRequest.reason === 'Khác'}
                />
              </div>
            </div>
          </div>

          {/* 3. HÌNH THỨC HOÀN TIỀN */}
          <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900 space-y-3">
            <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 dark:border-emerald-900">
              <DollarSign className="w-4 h-4 text-emerald-600" /> 3. Hình thức hoàn tiền
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Hình thức hoàn tiền mong muốn *</label>
                <select
                  value={editingRequest.requestedRefundMethod || 'CASH'}
                  onChange={(e) => setEditingRequest({ ...editingRequest, requestedRefundMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-medium"
                  required
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK_TRANSFER">Chuyển khoản</option>
                  <option value="STORE_CREDIT">Ví / Store Credit</option>
                  <option value="ORIGINAL_CARD">Hoàn về phương thức thanh toán ban đầu</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Số tiền dự kiến hoàn</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formatMoney(editingRequest.requestedRefundAmount || 0, 'VND')}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 font-bold text-emerald-600 text-sm cursor-not-allowed font-mono"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. MINH CHỨNG & GHI CHÚ KHÁCH */}
          <div className="p-4 bg-purple-50/30 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900 space-y-3">
            <h3 className="font-bold text-purple-900 dark:text-purple-300 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 dark:border-purple-900">
              <Upload className="w-4 h-4 text-purple-600" /> 4. Minh chứng hình ảnh sản phẩm lỗi <span className="text-red-500">*</span>
            </h3>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Hình ảnh / Video minh chứng lỗi *</label>
              <label className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-xl p-4 text-center bg-white dark:bg-gray-900 space-y-1 block cursor-pointer hover:bg-purple-50/50 transition">
                <Upload className="w-6 h-6 mx-auto text-purple-500" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                  {proofFileName ? `✓ Đã chọn: ${proofFileName}` : 'Bấm để tải tệp minh chứng lên *'}
                </span>
                <span className="text-[11px] text-gray-400 block font-mono">JPG, JPEG, PNG, WEBP, MP4 - Tối đa 10MB/tệp</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setProofFileName(f.name);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú của khách hàng</label>
              <textarea
                rows={2}
                value={editingRequest.customerNotes || ''}
                onChange={(e) => setEditingRequest({ ...editingRequest, customerNotes: e.target.value })}
                placeholder="Nhập ghi chú hoặc phản hồi từ khách..."
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"
              />
            </div>
          </div>

          {/* 5. XỬ LÝ YÊU CẦU NỘI BỘ */}
          <div className="p-4 bg-amber-50/30 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 space-y-3">
            <h3 className="font-bold text-amber-900 dark:text-amber-300 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2 dark:border-amber-900">
              <User className="w-4 h-4 text-amber-600" /> 5. Xử lý yêu cầu nội bộ
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái xử lý</label>
                <select
                  value={editingRequest.status || 'PENDING'}
                  onChange={(e) => setEditingRequest({ ...editingRequest, status: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-bold text-amber-600"
                >
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Người tiếp nhận *</label>
                <select
                  value={editingRequest.handlerName || currentUser?.name || currentUser?.username || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, handlerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 font-medium"
                >
                  {currentUser && (
                    <option value={currentUser.name || currentUser.username}>
                      {currentUser.name || currentUser.username}
                    </option>
                  )}
                  {users.map((u) => (
                    <option key={u.id} value={u.fullName || u.userCode}>
                      {u.fullName} ({u.userCode || u.assignedRole || 'Nhân viên'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú xử lý nội bộ</label>
                <textarea
                  rows={2}
                  value={editingRequest.notes || ''}
                  onChange={(e) => setEditingRequest({ ...editingRequest, notes: e.target.value })}
                  placeholder="Nhập ghi chú xử lý nội bộ..."
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900"
                />
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="pt-4 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-bold text-xs transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tạo yêu cầu trả hàng
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
