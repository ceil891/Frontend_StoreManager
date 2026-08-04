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
        header: 'Họ tên & Đơn vị',
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
              role === 'TÀI_XẾ' ? 'bg-blue-100 text-blue-800' :
              role === 'ĐIỀU_PHỐI_VIÊN' ? 'bg-purple-100 text-purple-800' :
              'bg-emerald-100 text-emerald-800'
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
          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
            info.getValue() === 'HOẠT_ĐỘNG' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedContact(row.original)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-lg"
              title="Xem thông tin"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý thông tin đầu mối liên hệ, tài xế giao hàng và chuyên viên điều phối của các đơn vị logistics.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Thêm Liên Hệ Mới
        </button>
      </div>

      <div className="flex gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, số điện thoại, đơn vị vận chuyển..."
            className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-900 text-sm"
          />
        </div>
      </div>

      <ReusableDataTable columns={columns} data={filtered} />

      {/* Modal Xem chi tiết căn giữa (TC-ALL-1) */}
      <Modal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title={selectedContact ? `Chi tiết liên hệ: ${selectedContact.fullName}` : 'Thông tin liên hệ'}
        width="max-w-md"
      >
        {selectedContact && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <User className="w-8 h-8 text-emerald-600" />
              <div>
                <h3 className="font-bold text-gray-900">{selectedContact.fullName}</h3>
                <p className="text-xs text-gray-500 font-mono">{selectedContact.contactCode} - {selectedContact.carrierCompany}</p>
              </div>
            </div>

            <div className="space-y-2 border-t pt-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Số điện thoại:</span>
                <span className="font-mono font-bold">{selectedContact.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span>{selectedContact.email || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vai trò:</span>
                <span className="font-semibold">{selectedContact.role.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Biển số xe:</span>
                <span className="font-mono font-bold">{selectedContact.vehiclePlate || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Loại phương tiện:</span>
                <span>{selectedContact.vehicleType || 'N/A'}</span>
              </div>
            </div>

            {selectedContact.notes && (
              <div className="border-t pt-2">
                <span className="text-xs text-gray-400 block mb-1">Ghi chú:</span>
                <p className="italic text-gray-700 bg-gray-50 p-2 rounded">{selectedContact.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedContact(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold"
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
        title={modalMode === 'create' ? 'Thêm Liên Hệ Danh Bạ Mới' : 'Cập Nhật Thông Tin Liên Hệ'}
        width="max-w-md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Họ và tên *</label>
            <input
              type="text"
              value={editingItem.fullName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, fullName: e.target.value })}
              required
              className="w-full p-2.5 border rounded-lg"
              placeholder="VD: Nguyễn Văn A"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Số điện thoại *</label>
              <input
                type="text"
                value={editingItem.phone || ''}
                onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                required
                className="w-full p-2.5 border rounded-lg font-mono"
                placeholder="VD: 0912345678"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={editingItem.email || ''}
                onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
                placeholder="email@domain.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Đơn vị vận chuyển</label>
              <input
                type="text"
                value={editingItem.carrierCompany || ''}
                onChange={(e) => setEditingItem({ ...editingItem, carrierCompany: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
                placeholder="VD: Viettel Post, GHN..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Vai trò</label>
              <select
                value={editingItem.role || 'TÀI_XẾ'}
                onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value as any })}
                className="w-full p-2.5 border rounded-lg"
              >
                <option value="TÀI_XẾ">Tài xế giao hàng</option>
                <option value="ĐIỀU_PHỐI_VIÊN">Điều phối viên</option>
                <option value="QUẢN_LÝ_HỢP_ĐỒNG">Quản lý hợp đồng</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Biển số xe</label>
              <input
                type="text"
                value={editingItem.vehiclePlate || ''}
                onChange={(e) => setEditingItem({ ...editingItem, vehiclePlate: e.target.value })}
                className="w-full p-2.5 border rounded-lg font-mono"
                placeholder="VD: 29C-123.45"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Loại phương tiện</label>
              <input
                type="text"
                value={editingItem.vehicleType || ''}
                onChange={(e) => setEditingItem({ ...editingItem, vehicleType: e.target.value })}
                className="w-full p-2.5 border rounded-lg"
                placeholder="VD: Xe tải 1.5 tấn"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Ghi chú</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              rows={2}
              className="w-full p-2.5 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg"
            >
              Lưu Liên Hệ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default ShippingContactsPage;

