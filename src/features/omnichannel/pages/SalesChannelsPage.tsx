import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, Link2, Share2, Download } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { toast } from 'sonner';

import type { ColumnDef } from '@tanstack/react-table';
import { useOmnichannelStore } from '../store/omnichannelStore';

interface SalesChannelRecord {
  id: string;
  channelCode: string;
  channelName: string;
  channelType: 'SHOPEE' | 'LAZADA' | 'TIKTOK' | 'WEBSITE' | 'SOCIAL';
  apiStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  connectedDate: string;
  notes?: string;
}

export function SalesChannelsPage() {
  const {
    salesChannels: storeChannels,
    fetchSalesChannels,
    addSalesChannel,
    updateSalesChannel,
    deleteSalesChannel,
  } = useOmnichannelStore();

  useEffect(() => {
    fetchSalesChannels();
  }, [fetchSalesChannels]);

  const data: SalesChannelRecord[] = useMemo(() => {
    return storeChannels.map((c) => ({
      id: c.id,
      channelCode: c.channelCode,
      channelName: c.channelName,
      channelType: (c.platform === 'TIKTOK_SHOP' ? 'TIKTOK' : c.platform) as any,
      apiStatus: (c.status === 'CONNECTED' ? 'CONNECTED' : 'DISCONNECTED') as any,
      connectedDate: c.lastSyncedAt,
      notes: `Shop ID: ${c.shopId} - Tồn kho đồng bộ ${c.productCount} sản phẩm`,
    }));
  }, [storeChannels]);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SalesChannelRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<SalesChannelRecord>>({});

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.channelCode.toLowerCase().includes(q) ||
        d.channelName.toLowerCase().includes(q) ||
        d.channelType.toLowerCase().includes(q)
    );
  }, [search, data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      channelCode: '',
      channelName: '',
      channelType: 'SHOPEE',
      apiStatus: 'DISCONNECTED',
      connectedDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const [deletingItem, setDeletingItem] = useState<SalesChannelRecord | null>(null);

  const handleOpenEdit = (item: SalesChannelRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.channelName?.trim()) {
      toast.error('Vui lòng nhập tên gian hàng / kênh bán!');
      return;
    }

    try {
      if (modalMode === 'create') {
        const platformMap: Record<string, any> = {
          SHOPEE: 'SHOPEE',
          LAZADA: 'LAZADA',
          TIKTOK: 'TIKTOK_SHOP',
          WEBSITE: 'WEBSITE',
          SOCIAL: 'SOCIAL',
        };
        await addSalesChannel({
          channelCode: editingItem.channelCode || `CH-${Date.now().toString().slice(-4)}`,
          channelName: editingItem.channelName.trim(),
          platform: platformMap[editingItem.channelType || 'SHOPEE'] || 'SHOPEE',
          shopId: `SHOP-${Math.floor(1000 + Math.random() * 9000)}`,
          status: (editingItem.apiStatus === 'ERROR' ? 'SYNC_ERROR' : (editingItem.apiStatus as any) || 'CONNECTED'),
          lastSyncedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          productCount: 0,
        });
        toast.success('Kết nối kênh bán hàng mới thành công!');
      } else if (editingItem.id) {
        await updateSalesChannel(editingItem.id, {
          channelName: editingItem.channelName.trim(),
        });
        toast.success('Cập nhật kênh bán hàng thành công!');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu kênh bán hàng: ' + (err?.message || 'Thất bại'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteSalesChannel(deletingItem.id);
      toast.success(`Đã ngắt kết nối và xóa kênh "${deletingItem.channelName}" thành công!`);
      if (selected?.id === deletingItem.id) setSelected(null);
      setDeletingItem(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xóa kênh bán hàng: ' + (err?.message || 'Thất bại'));
    }
  };

  const columns = useMemo<ColumnDef<SalesChannelRecord>[]>(
    () => [
      {
        accessorKey: 'channelCode',
        header: 'Mã kênh',
        cell: (info) => <span className="font-mono font-bold text-emerald-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'channelName',
        header: 'Tên gian hàng',
        cell: (info) => <span className="font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'channelType',
        header: 'Loại kênh',
        cell: (info) => {
          const val = info.getValue() as string;
          let label = 'Shopee';
          let color = 'text-orange-600 bg-orange-50';
          if (val === 'LAZADA') {
            label = 'Lazada';
            color = 'text-blue-600 bg-blue-50';
          } else if (val === 'TIKTOK') {
            label = 'TikTok Shop';
            color = 'text-black bg-gray-100 dark:text-white dark:bg-gray-700';
          } else if (val === 'WEBSITE') {
            label = 'Website WooCommerce';
            color = 'text-purple-600 bg-purple-50';
          } else if (val === 'SOCIAL') {
            label = 'Mạng xã hội';
            color = 'text-blue-500 bg-blue-50/50';
          }
          return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{label}</span>;
        },
      },
      {
        accessorKey: 'connectedDate',
        header: 'Ngày kết nối',
        cell: (info) => <span className="font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'apiStatus',
        header: 'Trạng thái API',
        cell: (info) => {
          const status = info.getValue() as string;
          let badgeClass = 'bg-gray-100 text-gray-800';
          let label = 'Chưa kết nối';
          if (status === 'CONNECTED') {
            badgeClass = 'bg-emerald-100 text-emerald-800';
            label = 'Hoạt động';
          } else if (status === 'ERROR') {
            badgeClass = 'bg-red-100 text-red-800';
            label = 'Lỗi kết nối';
          }
          return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${badgeClass}`}>{label}</span>;
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
              title="Xem chi tiết kênh"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded"
              title="Sửa cấu hình"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(row.original)}
              className="p-1 text-gray-500 hover:text-red-600 rounded"
              title="Ngắt kết nối"
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Quản lý kênh bán hàng đa kênh (sales channels)</h1>
          <p className="text-sm text-gray-500">
            Tích hợp, cấu hình đồng bộ gian hàng trực tuyến trên các sàn TMĐT (Shopee, Lazada, TikTok) hoặc Website bán hàng của doanh nghiệp.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Tích Hợp Kênh Mới
        </button>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center gap-4">
        <Link2 className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã kênh, tên gian hàng, loại sàn TMĐT..."
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>

      <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`Chi tiết kênh kết nối: ${selected?.channelName}`}
      >
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-500">Mã kênh kết nối:</span>
                <p className="font-mono font-semibold">{selected.channelCode}</p>
              </div>
              <div>
                <span className="text-gray-500">Loại gian hàng:</span>
                <p className="font-semibold text-emerald-600">{selected.channelType}</p>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Tên gian hàng / kênh:</span>
              <p className="font-semibold text-base">{selected.channelName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t pt-2">
              <div>
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" /> Ngày Tích Hợp:
                </span>
                <p className="font-mono">{selected.connectedDate}</p>
              </div>
              <div>
                <span className="text-gray-500">Trạng thái đồng bộ API:</span>
                <div>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                      selected.apiStatus === 'CONNECTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selected.apiStatus === 'DISCONNECTED'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selected.apiStatus === 'CONNECTED'
                      ? 'Đang kết nối hoạt động'
                      : selected.apiStatus === 'DISCONNECTED'
                      ? 'Đã ngắt kết nối'
                      : 'Lỗi đồng bộ sync'}
                  </span>
                </div>
              </div>
            </div>
            {selected.notes && (
              <div>
                <span className="text-gray-500">Ghi chú kênh:</span>
                <p className="bg-gray-50 dark:bg-gray-900 p-2 rounded text-gray-700 dark:text-gray-300">
                  {selected.notes}
                </p>
              </div>
            )}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Thông số kỹ thuật API</h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-900 font-mono text-xs space-y-1 rounded">
                <p><span className="text-gray-400">Endpoint:</span> https://api.shopee.vn/v2/shop/get_info</p>
                <p><span className="text-gray-400">Token Status:</span> ACTIVE (Expires in 15 days)</p>
                <p><span className="text-gray-400">Last Sync:</span> 2026-06-04 16:40:12</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Tích hợp kênh TMĐT mới' : 'Sửa thông tin kênh tích hợp'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mã kênh *</label>
              <input
                type="text"
                value={editingItem.channelCode || ''}
                onChange={(e) => setEditingItem({ ...editingItem, channelCode: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                placeholder="CH-XXXX"
                required
                disabled={modalMode === 'edit'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Loại kênh *</label>
              <select
                value={editingItem.channelType || 'SHOPEE'}
                onChange={(e) => setEditingItem({ ...editingItem, channelType: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="SHOPEE">Shopee Vietnam</option>
                <option value="LAZADA">Lazada Vietnam</option>
                <option value="TIKTOK">TikTok Shop Vietnam</option>
                <option value="WEBSITE">WooCommerce Website</option>
                <option value="SOCIAL">Mạng xã hội (Facebook/Zalo)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tên gian hàng hiển thị *</label>
            <input
              type="text"
              value={editingItem.channelName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, channelName: e.target.value })}
              className="w-full p-2 border rounded"
              placeholder="Tên shop trực tuyến"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ngày tích hợp *</label>
              <input
                type="date"
                value={editingItem.connectedDate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, connectedDate: e.target.value })}
                className="w-full p-2 border rounded font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Trạng thái API</label>
              <select
                value={editingItem.apiStatus || 'DISCONNECTED'}
                onChange={(e) => setEditingItem({ ...editingItem, apiStatus: e.target.value as any })}
                className="w-full p-2 border rounded"
              >
                <option value="DISCONNECTED">Chưa kết nối API</option>
                <option value="CONNECTED">Đang Hoạt Động (Đã ủy quyền)</option>
                <option value="ERROR">Gặp Lỗi (Cần cấp lại Token)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              className="w-full p-2 border rounded"
              rows={3}
              placeholder="Ghi chú cấu hình đồng bộ..."
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Hủy
            </button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Lưu cấu hình
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        title="Ngắt kết nối và xóa kênh bán hàng"
        description={`Bạn có chắc chắn muốn ngắt kết nối và xóa kênh bán hàng "${deletingItem?.channelName}" không?`}
      />
    </div>
  );
}
export default SalesChannelsPage;
