import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Truck, Star, Phone, Mail, MapPin, FileText, CheckCircle2, Trash2, Edit } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';
import { useAreaStore } from '@/features/crm/store/areaStore';

interface ShipperPartnerRecord {
  id: string;
  partnerCode: string;
  companyName: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  serviceTier: 'EXPRESS_AIR' | 'SAME_DAY_COURIER' | 'STANDARD_GROUND' | 'HEAVY_FREIGHT_PALLET';
  baseRatePerKg: number;
  activeFleetSize: number;
  averageDeliveryHours: number;
  slaComplianceRate: number; // e.g. 98.5 for 98.5%
  status: 'ACTIVE' | 'ON_HOLD' | 'TERMINATED' | 'CONTRACT_PENDING';
  headquarters: string;
  notes?: string;
}

const tierStyles = {
  EXPRESS_AIR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  SAME_DAY_COURIER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  STANDARD_GROUND: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
  HEAVY_FREIGHT_PALLET: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
};

const serviceTierLabels: Record<ShipperPartnerRecord['serviceTier'], string> = {
  EXPRESS_AIR: 'Giao Hỏa Tốc (Đường Hàng Không)',
  SAME_DAY_COURIER: 'Giao Trong Ngày (Chuyển Phát Nhanh)',
  STANDARD_GROUND: 'Giao Tiêu Chuẩn (Đường Bộ)',
  HEAVY_FREIGHT_PALLET: 'Vận Tải Hàng Nặng (Pallet)',
};

const shipperStatusLabels = {
  ACTIVE: 'Đang hoạt động',
  ON_HOLD: 'Tạm dừng',
  CONTRACT_PENDING: 'Chờ hợp đồng',
  TERMINATED: 'Đã chấm dứt',
} as const;

export function ShippersPage() {
  const [data, setData] = useState<ShipperPartnerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedShipper, setSelectedShipper] = useState<ShipperPartnerRecord | null>(null);

  // States for creation/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<ShipperPartnerRecord>>({});

  const { areas, fetchAreas } = useAreaStore();

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const defaultShipperList: ShipperPartnerRecord[] = [
    {
      id: '1',
      partnerCode: 'SHP-001',
      companyName: 'Nguyễn Văn Minh (Viettel Post)',
      contactPerson: 'Nguyễn Văn Minh',
      contactPhone: '0912345678',
      contactEmail: 'minh.nguyen@viettelpost.vn',
      serviceTier: 'EXPRESS_AIR',
      baseRatePerKg: 15000,
      activeFleetSize: 120,
      averageDeliveryHours: 12,
      slaComplianceRate: 99.2,
      status: 'ACTIVE',
      headquarters: 'TP. Hà Nội',
      notes: 'Tài xế hỏa tốc Viettel Post'
    },
    {
      id: '2',
      partnerCode: 'SHP-002',
      companyName: 'Trần Quốc Huy (GHTK)',
      contactPerson: 'Trần Quốc Huy',
      contactPhone: '0987654321',
      contactEmail: 'huy.tran@ghtk.vn',
      serviceTier: 'SAME_DAY_COURIER',
      baseRatePerKg: 12000,
      activeFleetSize: 85,
      averageDeliveryHours: 24,
      slaComplianceRate: 98.5,
      status: 'ACTIVE',
      headquarters: 'TP. Hồ Chí Minh',
      notes: 'Tài xế giao hàng tiết kiệm'
    },
    {
      id: '3',
      partnerCode: 'SHP-003',
      companyName: 'Lê Hoàng Nam (GHN)',
      contactPerson: 'Lê Hoàng Nam',
      contactPhone: '0905112233',
      contactEmail: 'nam.le@ghn.vn',
      serviceTier: 'SAME_DAY_COURIER',
      baseRatePerKg: 14000,
      activeFleetSize: 60,
      averageDeliveryHours: 18,
      slaComplianceRate: 97.9,
      status: 'ACTIVE',
      headquarters: 'TP. Đà Nẵng',
      notes: 'Tài xế Giao Hàng Nhanh'
    },
    {
      id: '4',
      partnerCode: 'SHP-004',
      companyName: 'Phạm Đức Anh (Shopee Express)',
      contactPerson: 'Phạm Đức Anh',
      contactPhone: '0933445566',
      contactEmail: 'ducanh.pham@spx.vn',
      serviceTier: 'STANDARD_GROUND',
      baseRatePerKg: 11000,
      activeFleetSize: 95,
      averageDeliveryHours: 24,
      slaComplianceRate: 98.1,
      status: 'ACTIVE',
      headquarters: 'TP. Hồ Chí Minh',
      notes: 'Tài xế SPX'
    },
    {
      id: '5',
      partnerCode: 'SHP-005',
      companyName: 'Vũ Thanh Sơn (GrabExpress)',
      contactPerson: 'Vũ Thanh Sơn',
      contactPhone: '0977889900',
      contactEmail: 'son.vu@grab.com',
      serviceTier: 'EXPRESS_AIR',
      baseRatePerKg: 20000,
      activeFleetSize: 200,
      averageDeliveryHours: 2,
      slaComplianceRate: 99.8,
      status: 'ACTIVE',
      headquarters: 'TP. Hà Nội',
      notes: 'GrabExpress Hỏa tốc trong 2h'
    },
  ];

  const fetchShippers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any>('/logistics/shippers');
      const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (items.length > 0) {
        const mapped = items.map((item: any) => ({
          id: String(item.id),
          partnerCode: item.shipperCode || `SHP-${item.id}`,
          companyName: item.fullName || 'Đơn vị giao hàng',
          contactPerson: item.fullName || 'Người liên hệ',
          contactPhone: item.phone || '',
          contactEmail: item.email || '',
          serviceTier: (item.vehicleType || 'STANDARD_GROUND') as any,
          baseRatePerKg: item.baseRatePerKg || 15000,
          activeFleetSize: item.activeFleetSize || 50,
          averageDeliveryHours: item.averageDeliveryHours || 24,
          slaComplianceRate: item.slaComplianceRate || 98.8,
          status: (item.isActive !== false ? 'ACTIVE' : 'TERMINATED') as ShipperPartnerRecord['status'],
          headquarters: item.address || 'TP. Hà Nội',
          notes: item.note || ''
        }));
        setData(mapped);
        saveShippersList(mapped);
      } else {
        const local = getSavedShippers();
        const fallback = local.length > 0 ? local : defaultShipperList;
        setData(fallback);
      }
    } catch (err) {
      console.error('Fetch shippers from backend failed:', err);
      const local = getSavedShippers();
      const fallback = local.length > 0 ? local : defaultShipperList;
      setData(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShippers();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      partnerCode: `SHP-${Date.now().toString().slice(-6)}`,
      companyName: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      serviceTier: 'STANDARD_GROUND',
      baseRatePerKg: 15000,
      activeFleetSize: 10,
      averageDeliveryHours: 24,
      slaComplianceRate: 95.0,
      status: 'ACTIVE',
      headquarters: areas.length > 0 ? areas[0].name : 'TP. Hà Nội',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ShipperPartnerRecord) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const validateInputs = () => {
    if (!editingItem.companyName || !editingItem.contactPhone) {
      toast.error('Vui lòng nhập tên công ty và số điện thoại liên hệ!');
      return false;
    }

    // Phone validation (Vietnamese phone regex)
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    const cleanPhone = (editingItem.contactPhone || '').replace(/\s+/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Số điện thoại không đúng định dạng (Ví dụ hợp lệ: 0912345678, 10 chữ số bắt đầu bằng 03,05,07,08,09)!');
      return false;
    }

    // Email validation (if provided)
    if (editingItem.contactEmail && editingItem.contactEmail.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editingItem.contactEmail.trim())) {
        toast.error('Email không đúng định dạng (Ví dụ: ten@domain.com)!');
        return false;
      }
    }

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    const newRecord: ShipperPartnerRecord = {
      id: editingItem.id || `SHP-${Date.now()}`,
      partnerCode: editingItem.partnerCode || `SHP-${Date.now().toString().slice(-6)}`,
      companyName: editingItem.companyName || '',
      contactPerson: editingItem.contactPerson || editingItem.companyName || '',
      contactPhone: (editingItem.contactPhone || '').replace(/\s+/g, ''),
      contactEmail: (editingItem.contactEmail || '').trim(),
      serviceTier: editingItem.serviceTier || 'STANDARD_GROUND',
      baseRatePerKg: Number(editingItem.baseRatePerKg) || 0,
      activeFleetSize: Number(editingItem.activeFleetSize) || 0,
      averageDeliveryHours: Number(editingItem.averageDeliveryHours) || 0,
      slaComplianceRate: Number(editingItem.slaComplianceRate) || 95,
      status: editingItem.status || 'ACTIVE',
      headquarters: editingItem.headquarters || '',
      notes: editingItem.notes || ''
    };

    try {
      const payload = {
        shipperCode: newRecord.partnerCode,
        fullName: newRecord.companyName,
        phone: newRecord.contactPhone,
        email: newRecord.contactEmail,
        vehicleType: newRecord.serviceTier,
        address: newRecord.headquarters,
        isActive: newRecord.status === 'ACTIVE',
        note: newRecord.notes
      };

      if (modalMode === 'create') {
        await axiosClient.post('/logistics/shippers', payload);
      } else {
        await axiosClient.put(`/logistics/shippers/${newRecord.id}`, payload);
      }
    } catch (err) {
      console.warn('API save shipper failed, applying local state update:', err);
    }

    if (modalMode === 'create') {
      setData(prev => {
        const next = [newRecord, ...prev];
        saveShippersList(next);
        return next;
      });
      toast.success('Tạo đối tác giao hàng thành công!');
    } else {
      setData(prev => {
        const next = prev.map(item => item.id === newRecord.id ? newRecord : item);
        saveShippersList(next);
        return next;
      });
      toast.success('Cập nhật đối tác thành công!');
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const target = data.find(item => item.id === id);
    if (target && target.status === 'ACTIVE') {
      toast.error('Không thể xóa đối tác đang hoạt động! Vui lòng chuyển trạng thái sang Tạm dừng/Chấm dứt hợp đồng trước khi xóa.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa đối tác này?')) {
      try {
        await axiosClient.delete(`/logistics/shippers/${id}`);
      } catch (err) {
        console.warn('API delete shipper failed, applying local state update:', err);
      }
      setData(prev => {
        const next = prev.filter(item => item.id !== id);
        saveShippersList(next);
        return next;
      });
      toast.success('Đã xóa đối tác thành công!');
      setSelectedShipper(null);
    }
  };

  const filtered = data.filter((item) =>
    item.partnerCode.toLowerCase().includes(search.toLowerCase()) ||
    item.companyName.toLowerCase().includes(search.toLowerCase()) ||
    item.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    item.headquarters.toLowerCase().includes(search.toLowerCase())
  );

  const columns = useMemo<ColumnDef<ShipperPartnerRecord>[]>(
    () => [
      {
        accessorKey: 'partnerCode',
        header: 'Mã đối tác',
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'companyName',
        header: 'Công ty đối tác & Liên hệ',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.companyName}</p>
            <p className="text-xs text-gray-500 font-mono">{row.original.contactPerson} ({row.original.contactPhone})</p>
          </div>
        ),
      },
      {
        accessorKey: 'serviceTier',
        header: 'Loại dịch vụ',
        cell: (info) => {
          const t = info.getValue() as keyof typeof tierStyles;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierStyles[t] || tierStyles.STANDARD_GROUND}`}>
              {serviceTierLabels[t] || 'Giao Tiêu Chuẩn (Đường Bộ)'}
            </span>
          );
        },
      },
      {
        accessorKey: 'baseRatePerKg',
        header: 'Cước cơ bản',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">{Number(info.getValue()).toLocaleString('vi-VN')} VNĐ / kg</span>,
      },
      {
        accessorKey: 'slaComplianceRate',
        header: 'Đánh giá SLA',
        cell: (info) => {
          const rate = info.getValue() as number;
          return (
            <span className={`font-mono font-bold ${rate >= 98 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400'}`}>
              {rate.toFixed(1)}%
            </span>
          );
        },
      },
      {
        accessorKey: 'activeFleetSize',
        header: 'Đội xe',
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300">{info.getValue() as number} xe</span>,
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái hợp đồng',
        cell: (info) => {
          const status = info.getValue() as keyof typeof shipperStatusLabels;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'ON_HOLD' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              status === 'CONTRACT_PENDING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {shipperStatusLabels[status] ?? status}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedShipper(row.original); }}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem hồ sơ đối tác"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
              title="Chỉnh sửa thông tin"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Xóa đối tác"
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
    <>
      <datalist id="area-suggestions">
        {areas.map((area) => (
          <option key={area.id} value={area.parentName ? `${area.name}, ${area.parentName}` : area.name} />
        ))}
      </datalist>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đối tác giao hàng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý đối tác giao hàng (3PL), đánh giá chỉ số SLA và lịch cước vận chuyển.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất File Excel
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm Đối Tác Mới
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
              placeholder="Tìm kiếm đối tác theo mã, công ty, liên hệ hoặc trụ sở..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-750 shadow-sm">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải danh sách đối tác...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} />
        )}
      </div>

      {/* Modal Xem hồ sơ đối tác căn giữa màn hình (TC-SHIP-2 & TC-ALL-1) */}
      <Modal
        isOpen={!!selectedShipper}
        onClose={() => setSelectedShipper(null)}
        title={selectedShipper ? `Hồ sơ đối tác giao hàng: ${selectedShipper.partnerCode}` : 'Thông tin đối tác'}
        width="max-w-xl"
      >
        {selectedShipper && (
          <div className="space-y-6 text-sm">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedShipper.status === 'ACTIVE'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : selectedShipper.status === 'ON_HOLD'
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedShipper.status === 'ACTIVE' ? 'bg-emerald-600' : selectedShipper.status === 'ON_HOLD' ? 'bg-amber-600' : 'bg-gray-600'
                }`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tỷ lệ tuân thủ SLA</p>
                  <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">{selectedShipper.slaComplianceRate.toFixed(1)}%</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedShipper.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedShipper.status === 'ON_HOLD' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {shipperStatusLabels[selectedShipper.status] || selectedShipper.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Star className="w-4 h-4 text-emerald-500" /> Quy mô đội xe
                </div>
                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white truncate">{selectedShipper.activeFleetSize} phương tiện</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <FileText className="w-4 h-4 text-primary" /> Thời gian giao trung bình
                </div>
                <p className="text-xl font-bold font-mono text-primary truncate">~{selectedShipper.averageDeliveryHours} giờ</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Đơn vị giao hàng</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedShipper.companyName}</h3>
                <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-bold border ${tierStyles[selectedShipper.serviceTier] || tierStyles.STANDARD_GROUND}`}>
                  Dịch vụ: {serviceTierLabels[selectedShipper.serviceTier] || 'Giao Tiêu Chuẩn'}
                </span>
              </div>

              <div className="space-y-2 pt-1 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-mono">{selectedShipper.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{selectedShipper.contactEmail || 'Chưa cập nhật email'}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>Trụ sở chính: <strong className="text-gray-900 dark:text-white">{selectedShipper.headquarters}</strong></span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Cước phí giao hàng cơ bản:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">{Number(selectedShipper.baseRatePerKg).toLocaleString('vi-VN')} VNĐ / kg</span>
              </div>

              {selectedShipper.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú & Thỏa thuận</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedShipper.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setSelectedShipper(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
              >
                Đóng Hộp Thoại
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm/Sửa đối tác giao hàng */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm Đối Tác Giao Hàng Mới' : 'Cập Nhật Đối Tác Giao Hàng'}
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mã đối tác *</label>
            <input
              type="text"
              value={editingItem.partnerCode || ''}
              onChange={(e) => setEditingItem({ ...editingItem, partnerCode: e.target.value })}
              required
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Tên đối tác / Công ty *</label>
            <input
              type="text"
              value={editingItem.companyName || ''}
              onChange={(e) => setEditingItem({ ...editingItem, companyName: e.target.value })}
              required
              placeholder="VD: Viettel Post, Giao Hàng Tiết Kiệm..."
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Số điện thoại *</label>
              <input
                type="text"
                value={editingItem.contactPhone || ''}
                onChange={(e) => setEditingItem({ ...editingItem, contactPhone: e.target.value })}
                required
                placeholder="VD: 0912345678"
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email (Đúng định dạng)</label>
              <input
                type="email"
                value={editingItem.contactEmail || ''}
                onChange={(e) => setEditingItem({ ...editingItem, contactEmail: e.target.value })}
                placeholder="VD: contact@partner.com"
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Loại dịch vụ</label>
              <select
                value={editingItem.serviceTier || 'STANDARD_GROUND'}
                onChange={(e) => setEditingItem({ ...editingItem, serviceTier: e.target.value as any })}
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
              >
                <option value="STANDARD_GROUND">Giao Tiêu Chuẩn (Đường Bộ)</option>
                <option value="EXPRESS_AIR">Giao Hỏa Tốc (Hàng Không)</option>
                <option value="SAME_DAY_COURIER">Giao Trong Ngày (Nội Thành)</option>
                <option value="HEAVY_FREIGHT_PALLET">Vận Tải Hàng Nặng (Pallet)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Trạng thái hợp đồng</label>
              <select
                value={editingItem.status || 'ACTIVE'}
                onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as any })}
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
              >
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="ON_HOLD">Tạm dừng</option>
                <option value="CONTRACT_PENDING">Chờ hợp đồng</option>
                <option value="TERMINATED">Đã chấm dứt</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Cước/Kg (VNĐ)</label>
              <input
                type="number"
                min="0"
                value={editingItem.baseRatePerKg ?? 15000}
                onChange={(e) => setEditingItem({ ...editingItem, baseRatePerKg: Number(e.target.value) })}
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Đội xe (phương tiện)</label>
              <input
                type="number"
                min="0"
                value={editingItem.activeFleetSize ?? 50}
                onChange={(e) => setEditingItem({ ...editingItem, activeFleetSize: Number(e.target.value) })}
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Thời gian (giờ)</label>
              <input
                type="number"
                min="0"
                value={editingItem.averageDeliveryHours ?? 24}
                onChange={(e) => setEditingItem({ ...editingItem, averageDeliveryHours: Number(e.target.value) })}
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Trụ sở chính / Địa chỉ (Có gợi ý)</label>
            <input
              type="text"
              list="area-suggestions"
              value={editingItem.headquarters || ''}
              onChange={(e) => setEditingItem({ ...editingItem, headquarters: e.target.value })}
              placeholder="Nhập hoặc chọn địa chỉ khu vực gợi ý..."
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Ghi chú đối tác</label>
            <textarea
              value={editingItem.notes || ''}
              onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
              rows={2}
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

