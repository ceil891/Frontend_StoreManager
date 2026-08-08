import { Modal } from '@/shared/components/ui/Modal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, MapPin, Calendar, User, DollarSign, Tag, CheckCircle2, Clock, XCircle, Trash2, Edit } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';


import type { ColumnDef } from '@tanstack/react-table';
import { useSalesStore } from '@/features/sales/store/salesStore';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

interface MarketOrderItem {
  id: string;
  orderCode: string;
  customerName: string;
  gpsCoordinates: string;
  orderValue: number;
  deliveryDate: string;
  createdBy: string;
  status: 'ĐÃ_DUYỆT' | 'CHỜ_DUYỆT' | 'TỪ_CHỐI';
  notes?: string;
  address?: string;
  productList?: { productName: string; quantity: number; price: number }[];
}

export function MarketOrdersPage() {
  const { saleOrders, fetchSaleOrders, addSaleOrder, updateSaleOrder, deleteSaleOrder } = useSalesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [selectedItem, setSelectedItem] = useState<MarketOrderItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MarketOrderItem>>({});

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchSaleOrders();
      } catch (err) {
        console.error(err);
        toast.error('Không thể tải danh sách đơn thị trường');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [fetchSaleOrders]);

  const data = useMemo<MarketOrderItem[]>(() => {
    return saleOrders.map((o) => ({
      id: o.id,
      orderCode: o.code,
      customerName: o.customerId || 'Khách lẻ',
      gpsCoordinates: '10.762622, 106.660172',
      orderValue: o.totalAmount,
      deliveryDate: o.date ? o.date.substring(0, 10) : '',
      createdBy: o.createdByName || 'NVKD tuyến',
      status: o.status === 'COMPLETED' ? 'ĐÃ_DUYỆT' : o.status === 'CANCELLED' ? 'TỪ_CHỐI' : 'CHỜ_DUYỆT',
      notes: o.paymentMethod || '',
      address: o.shippingAddress || 'Hà Nội, Việt Nam',
      productList: o.orderLines?.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.unitPrice,
      })) || [],
    }));
  }, [saleOrders]);

  const filtered = data.filter((item) => {
    const matchesSearch =
      item.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.createdBy.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'Tất cả' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenCreate = () => {
    setEditingItem({
      orderCode: `MDO-00${data.length + 1}`,
      customerName: '',
      gpsCoordinates: '10.776889, 106.700806', // Mặc định Quận 1
      orderValue: 0,
      deliveryDate: new Date().toISOString().split('T')[0],
      createdBy: 'Quản trị viên',
      status: 'CHỜ_DUYỆT',
      notes: '',
      address: '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.customerName || !editingItem.orderValue) return;

    try {
      const payload = {
        code: editingItem.orderCode || `MDO-00${data.length + 1}`,
        customerId: editingItem.customerName,
        date: editingItem.deliveryDate || new Date().toISOString().split('T')[0],
        subTotal: Number(editingItem.orderValue),
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: Number(editingItem.orderValue),
        status: (editingItem.status === 'ĐÃ_DUYỆT' ? 'COMPLETED' : editingItem.status === 'TỪ_CHỐI' ? 'CANCELLED' : 'PENDING') as any,
        paymentStatus: 'PAID' as any,
        createdByName: editingItem.createdBy || 'Quản trị viên',
        shippingAddress: editingItem.address || '',
        paymentMethod: editingItem.notes || '',
        origin: 'POS' as any,
      };
      await addSaleOrder(payload);
      toast.success('Tạo đơn thị trường thành công!');
      setIsModalOpen(false);
      fetchSaleOrders();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi lưu đơn thị trường.');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const columns = useMemo<ColumnDef<MarketOrderItem>[]>(
    () => [
      {
        accessorKey: 'orderCode',
        header: 'Mã đơn thị trường',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'customerName',
        header: 'Khách hàng',
        cell: (info) => <span className="font-semibold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'gpsCoordinates',
        header: 'Tọa độ GPS',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            <MapPin className="w-3.5 h-3.5 text-red-500" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'orderValue',
        header: 'Giá trị đơn hàng',
        cell: (info) => <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(info.getValue() as number)}</span>,
      },
      {
        accessorKey: 'deliveryDate',
        header: 'Ngày hẹn giao',
        cell: (info) => (
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="w-4 h-4 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'createdBy',
        header: 'Người lập',
        cell: (info) => (
          <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <User className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = '';
          let icon = null;

          if (status === 'ĐÃ_DUYỆT') {
            badgeClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
            icon = <CheckCircle2 className="w-3.5 h-3.5" />;
          } else if (status === 'CHỜ_DUYỆT') {
            badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
            icon = <Clock className="w-3.5 h-3.5" />;
          } else {
            badgeClass = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
            icon = <XCircle className="w-3.5 h-3.5" />;
          }

          return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${badgeClass}`}>
              {icon}
              {status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedItem(row.original)}
              className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors shrink-0"
              title="Chi tiết đơn hàng"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn Thị Trường (Sale đi tuyến)</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Quản lý các đơn hàng do nhân viên Sale lập trực tiếp tại các tuyến đại lý/khách hàng qua GPS.
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
              <Plus className="w-4 h-4" /> Lên đơn đi tuyến mới
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
              placeholder="Tìm kiếm theo mã đơn, khách hàng hoặc người lập..."
              className="block w-full sm:max-w-md pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-2"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="ĐÃ_DUYỆT">ĐÃ DUYỆT</option>
              <option value="CHỜ_DUYỆT">CHỜ DUYỆT</option>
              <option value="TỪ_CHỐI">TỪ CHỐI</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải danh sách đơn thị trường...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedItem(row)} />
        )}
      </div>

      {/* Drawer Chi tiết đơn hàng và tọa độ */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem ? `Chi tiết Đơn thị trường: ${selectedItem.orderCode}` : 'Thông tin chi tiết'}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="p-2 bg-emerald-500 text-white rounded-lg">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Tổng giá trị thanh toán</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(selectedItem.orderValue)}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Mã đơn thị trường:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{selectedItem.orderCode}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tên khách hàng:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.customerName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Địa chỉ khách hàng:</span>
                <span className="text-gray-700 dark:text-gray-300 text-right">{selectedItem.address || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Tọa độ GPS lập đơn:</span>
                <span className="font-mono text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                  <MapPin className="w-3 h-3" />
                  {selectedItem.gpsCoordinates}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Ngày hẹn giao hàng:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.deliveryDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Nhân viên sale đi tuyến:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.createdBy}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Trạng thái duyệt:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    selectedItem.status === 'ĐÃ_DUYỆT'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : selectedItem.status === 'CHỜ_DUYỆT'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                  }`}
                >
                  {selectedItem.status}
                </span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedItem.notes || 'Không có ghi chú'}</p>
              </div>
            </div>

            {/* Chi tiết mặt hàng */}
            {selectedItem.productList && selectedItem.productList.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Danh sách sản phẩm order:</h3>
                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 text-xs">
                      <tr>
                        <th className="p-3">Sản phẩm</th>
                        <th className="p-3 text-center">SL</th>
                        <th className="p-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {selectedItem.productList.map((prod, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                          <td className="p-3 font-medium text-gray-900 dark:text-white">{prod.productName}</td>
                          <td className="p-3 text-center text-gray-600 dark:text-gray-400">{prod.quantity}</td>
                          <td className="p-3 text-right font-bold text-gray-700 dark:text-gray-300">{formatCurrency(prod.quantity * prod.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Lên đơn đi tuyến mới */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Lên đơn đi tuyến thị trường mới"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã đơn thị trường *</label>
              <input
                type="text"
                value={editingItem.orderCode || ''}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tọa độ GPS (Tự động lấy) *</label>
              <input
                type="text"
                value={editingItem.gpsCoordinates || ''}
                onChange={(e) => setEditingItem({ ...editingItem, gpsCoordinates: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên khách hàng / Đại lý *</label>
            <input
              type="text"
              value={editingItem.customerName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Ví dụ: Tạp hóa Minh Thư"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ khách hàng</label>
            <input
              type="text"
              value={editingItem.address || ''}
              onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              placeholder="Ví dụ: 154 Trần Hưng Đạo, Quận 1, TP. HCM"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tổng giá trị đơn hàng (VND) *</label>
              <input
                type="number"
                value={editingItem.orderValue || ''}
                onChange={(e) => setEditingItem({ ...editingItem, orderValue: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                placeholder="Ví dụ: 1250000"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hẹn giao *</label>
              <input
                type="date"
                value={editingItem.deliveryDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, deliveryDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Người lập đơn *</label>
              <input
                type="text"
                value={editingItem.createdBy || ''}
                onChange={(e) => setEditingItem({ ...editingItem, createdBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái duyệt ban đầu</label>
              <select
                value={editingItem.status || 'CHỜ_DUYỆT'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
              >
                <option value="CHỜ_DUYỆT">CHỜ DUYỆT</option>
                <option value="ĐÃ_DUYỆT">ĐÃ DUYỆT</option>
                <option value="TỪ_CHỐI">TỪ CHỐI</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú chi tiết</label>
            <textarea
              rows={3}
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Nhập thông tin hướng dẫn giao nhận, liên lạc, ..."
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
              Tạo Đơn Hàng
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
