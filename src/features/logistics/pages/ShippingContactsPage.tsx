import { useMemo, useState } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Phone, Mail, User, Truck, ShieldCheck } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export interface ShippingContactRecord {
  id: string;
  contactCode: string;
  fullName: string;
  phone: string;
  email: string;
  carrierCompany: string;
  role: 'TÀI_XẾ' | 'ĐIỀU_PHỐI_VIÊN' | 'QUẢN_LÝ_HỢP_ĐỒNG';
  vehiclePlate?: string;
  vehicleType?: string;
  status: 'HOẠT_ĐỘNG' | 'TẠM_NGƯNG';
  notes?: string;
}

const DEFAULT_CONTACTS: ShippingContactRecord[] = [
  {
    id: '1',
    contactCode: 'CT-001',
    fullName: 'Nguyễn Văn Minh',
    phone: '0912345678',
    email: 'minh.nguyen@viettelpost.vn',
    carrierCompany: 'Viettel Post',
    role: 'TÀI_XẾ',
    vehiclePlate: '29C-882.19',
    vehicleType: 'Xe tải 1.5 tấn',
    status: 'HOẠT_ĐỘNG',
    notes: 'Tài xế chạy tuyến Hà Nội - Bắc Ninh'
  },
  {
    id: '2',
    contactCode: 'CT-002',
    fullName: 'Trần Quốc Huy',
    phone: '0987654321',
    email: 'huy.tran@ghtk.vn',
    carrierCompany: 'Giao Hàng Tiết Kiệm',
    role: 'TÀI_XẾ',
    vehiclePlate: '51D-492.01',
    vehicleType: 'Xe máy nội thành',
    status: 'HOẠT_ĐỘNG',
    notes: 'Giao hàng hỏa tốc khu vực Q1, Q3 TP.HCM'
  },
  {
    id: '3',
    contactCode: 'CT-003',
    fullName: 'Lê Hoàng Nam',
    phone: '0905112233',
    email: 'nam.le@ghn.vn',
    carrierCompany: 'Giao Hàng Nhanh',
    role: 'ĐIỀU_PHỐI_VIÊN',
    vehiclePlate: 'N/A',
    vehicleType: 'N/A',
    status: 'HOẠT_ĐỘNG',
    notes: 'Đầu mối hỗ trợ xử lý khiếu nại đơn hàng GHN'
  },
];

export function ShippingContactsPage() {
  const [data, setData] = useState<ShippingContactRecord[]>(DEFAULT_CONTACTS);
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<ShippingContactRecord | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShippingContactRecord>>({});

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      contactCode: `CT-${Date.now().toString().slice(-4)}`,
      fullName: '',
      phone: '',
      email: '',
      carrierCompany: 'Viettel Post',
      role: 'TÀI_XẾ',
      vehiclePlate: '',
      vehicleType: '',
      status: 'HOẠT_ĐỘNG',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShippingContactRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.fullName || !editingItem.phone) {
      toast.error('Vui lòng nhập tên và số điện thoại liên hệ!');
      return;
    }

    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test((editingItem.phone || '').replace(/\s+/g, ''))) {
      toast.error('Số điện thoại không đúng định dạng!');
      return;
    }

    const newRecord: ShippingContactRecord = {
      id: editingItem.id || String(Date.now()),
      contactCode: editingItem.contactCode || `CT-${Date.now().toString().slice(-4)}`,
      fullName: editingItem.fullName || '',
      phone: (editingItem.phone || '').replace(/\s+/g, ''),
      email: editingItem.email || '',
      carrierCompany: editingItem.carrierCompany || 'Nội bộ',
      role: editingItem.role || 'TÀI_XẾ',
      vehiclePlate: editingItem.vehiclePlate || '',
      vehicleType: editingItem.vehicleType || '',
      status: editingItem.status || 'HOẠT_ĐỘNG',
      notes: editingItem.notes || ''
    };

    if (modalMode === 'create') {
      setData(prev => [newRecord, ...prev]);
      toast.success('Thêm danh bạ liên hệ thành công!');
    } else {
      setData(prev => prev.map(item => item.id === newRecord.id ? newRecord : item));
      toast.success('Cập nhật liên hệ thành công!');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa liên hệ này khỏi danh bạ?')) {
      setData(prev => prev.filter(item => item.id !== id));
      toast.success('Đã xóa liên hệ khỏi danh bạ!');
      setSelectedContact(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      item =>
        item.fullName.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.carrierCompany.toLowerCase().includes(q) ||
        item.contactCode.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns = useMemo<ColumnDef<ShippingContactRecord>[]>(
    () => [
      {
        accessorKey: 'contactCode',
        header: 'Mã liên hệ',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'fullName',
        header: 'Họ tên & đơn vị',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.fullName}</p>
            <p className="text-xs text-gray-500 font-medium">{row.original.carrierCompany}</p>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Số điện thoại',
        cell: (info) => <span className="font-mono text-gray-900 dark:text-white font-semibold">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'role',
        header: 'Vai trò liên hệ',
        cell: (info) => {
          const role = info.getValue() as string;
          return (
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
              role === 'TÀI_XẾ' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300' :
              role === 'ĐIỀU_PHỐI_VIÊN' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300' :
              'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
            }`}>
              {role.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'vehiclePlate',
        header: 'Biển số xe',
        cell: (info) => <span className="font-mono text-xs">{info.getValue() as string || '—'}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => (
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            info.getValue() === 'HOẠT_ĐỘNG' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
          }`}>
            {info.getValue() === 'HOẠT_ĐỘNG' ? 'Hoạt động' : 'Tạm ngưng'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedContact(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Danh bạ vận chuyển</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý thông tin đầu mối liên hệ, tài xế giao hàng và chuyên viên điều phối của các đơn vị logistics</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm mới liên hệ
        </button>
      </div>

      <div className="flex gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm theo họ tên, số điện thoại, đơn vị vận chuyển..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          />
        </div>
      </div>

      <ReusableDataTable columns={columns} data={filtered} />

      {/* Modal Xem chi tiết */}
      <Modal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title={selectedContact ? `Chi tiết liên hệ: ${selectedContact.fullName}` : 'Thông tin liên hệ'}
        width="max-w-md"
      >
        {selectedContact && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <User className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{selectedContact.fullName}</h3>
                <p className="text-xs text-gray-500 font-mono">{selectedContact.contactCode} - {selectedContact.carrierCompany}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Số điện thoại</span>
                <span className="font-mono font-bold">{selectedContact.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Email</span>
                <span>{selectedContact.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Vai trò</span>
                <span className="font-semibold">{selectedContact.role.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Biển số xe</span>
                <span className="font-mono font-bold">{selectedContact.vehiclePlate || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-gray-500">Loại phương tiện</span>
                <span>{selectedContact.vehicleType || '—'}</span>
              </div>
            </div>

            {selectedContact.notes && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-xs text-gray-500 block mb-1">Ghi chú</span>
                <p className="text-xs italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-lg border border-gray-200 dark:border-gray-800">{selectedContact.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới liên hệ' : 'Cập nhật thông tin liên hệ'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên *</label>
            <input
              type="text"
              value={editingItem.fullName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, fullName: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              placeholder="Ví dụ: Nguyễn Văn A"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại *</label>
              <input
                type="text"
                value={editingItem.phone || ''}
                onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                placeholder="Ví dụ: 0912345678"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input
                type="email"
                value={editingItem.email || ''}
                onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                placeholder="email@domain.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị vận chuyển</label>
              <input
                type="text"
                value={editingItem.carrierCompany || ''}
                onChange={(e) => setEditingItem({ ...editingItem, carrierCompany: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                placeholder="Ví dụ: Viettel Post, GHN..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Vai trò</label>
              <select
                value={editingItem.role || 'TÀI_XẾ'}
                onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="TÀI_XẾ">Tài xế giao hàng</option>
                <option value="ĐIỀU_PHỐI_VIÊN">Điều phối viên</option>
                <option value="QUẢN_LÝ_HỢP_ĐỒNG">Quản lý hợp đồng</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Biển số xe</label>
              <input
                type="text"
                value={editingItem.vehiclePlate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, vehiclePlate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                placeholder="Ví dụ: 29C-123.45"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại phương tiện</label>
              <input
                type="text"
                value={editingItem.vehicleType || ''}
                onChange={(e) => setEditingItem({ ...editingItem, vehicleType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                placeholder="Ví dụ: Xe tải 1.5 tấn"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              placeholder="Ghi chú thêm..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg text-sm shadow-sm"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingContactsPage;

