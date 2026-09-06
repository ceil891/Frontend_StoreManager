import { useMemo, useState, useEffect } from 'react';
import {
  Plus, Search, Eye, Edit, Trash2, Phone, Mail, MapPin, Truck,
  Building2, Globe, CheckCircle2, XCircle, ShieldCheck, UserCheck,
  Filter, Sparkles, Car, Bike
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDeleteModal } from '@/shared/components/ui/ConfirmDeleteModal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

export type PartnerType = 'INTERNAL_SHIPPER' | 'CARRIER_3PL';

export interface UnifiedDeliveryPartner {
  id: string;
  rawId: number | string;
  type: PartnerType;
  partnerCode: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  vehicleOrWebsite?: string;
  vehicleType?: string;
  licensePlate?: string;
  contactPerson?: string;
  isActive: boolean;
  notes?: string;
}

const DEFAULT_SHIPPERS_DATA: UnifiedDeliveryPartner[] = [
  {
    id: 'shp_1',
    rawId: 1,
    type: 'INTERNAL_SHIPPER',
    partnerCode: 'SHP-001',
    name: 'Nguyễn Văn Tuấn',
    phone: '0912 345 678',
    email: 'tuan.nv@auramart.vn',
    address: 'Kho chính Hà Nội',
    vehicleOrWebsite: '29C-123.45',
    vehicleType: 'Xe máy',
    licensePlate: '29C-123.45',
    isActive: true,
    notes: 'Khu vực nội thành Cầu Giấy, Nam Từ Liêm',
  },
  {
    id: 'shp_2',
    rawId: 2,
    type: 'INTERNAL_SHIPPER',
    partnerCode: 'SHP-002',
    name: 'Trần Đình Trọng',
    phone: '0988 765 432',
    email: 'trong.td@auramart.vn',
    address: 'Kho tổng TP.HCM',
    vehicleOrWebsite: '59P1-889.99',
    vehicleType: 'Xe bán tải Ford Ranger',
    licensePlate: '59P1-889.99',
    isActive: true,
    notes: 'Chuyên hàng cồng kềnh, phân phối liên quận',
  },
  {
    id: 'shp_3',
    rawId: 3,
    type: 'INTERNAL_SHIPPER',
    partnerCode: 'SHP-003',
    name: 'Lê Hoàng Nam',
    phone: '0933 112 233',
    email: 'nam.lh@auramart.vn',
    address: 'Kho trung chuyển Đà Nẵng',
    vehicleOrWebsite: '43D-678.90',
    vehicleType: 'Xe tải 1.5 tấn',
    licensePlate: '43D-678.90',
    isActive: true,
    notes: 'Tuyến Đà Nẵng - Hội An',
  },
];

const DEFAULT_CARRIERS_DATA: UnifiedDeliveryPartner[] = [
  {
    id: 'car_1',
    rawId: 1,
    type: 'CARRIER_3PL',
    partnerCode: 'GHTK',
    name: 'Giao Hàng Tiết Kiệm (GHTK)',
    phone: '1900 6092',
    email: 'cskh@ghtk.vn',
    address: 'Tòa nhà GHTK Building, Phạm Hùng, Hà Nội',
    vehicleOrWebsite: 'https://giaohangtietkiem.vn',
    contactPerson: 'Phạm Thu Trang (Quản lý đối tác)',
    isActive: true,
    notes: 'Tích hợp API đẩy đơn tự động & Webhook hành trình',
  },
  {
    id: 'car_2',
    rawId: 2,
    type: 'CARRIER_3PL',
    partnerCode: 'GHN',
    name: 'Giao Hàng Nhanh (GHN)',
    phone: '1900 636677',
    email: 'cskh@ghn.vn',
    address: 'Tầng 3, Hải Âu Building, Tân Bình, TP.HCM',
    vehicleOrWebsite: 'https://ghn.vn',
    contactPerson: 'Vũ Minh Hoàng (Hỗ trợ kỹ thuật API)',
    isActive: true,
    notes: 'Giao hỏa tốc 24h toàn quốc, đối tác vận chuyển chính',
  },
  {
    id: 'car_3',
    rawId: 3,
    type: 'CARRIER_3PL',
    partnerCode: 'VTP',
    name: 'Viettel Post',
    phone: '1900 8095',
    email: 'cskh@viettelpost.com.vn',
    address: 'Tòa nhà Viettel Post, Nam Từ Liêm, Hà Nội',
    vehicleOrWebsite: 'https://viettelpost.com.vn',
    contactPerson: 'Đỗ Thị Hạnh',
    isActive: true,
    notes: 'Mạng lưới bưu cục phủ khắp 63 tỉnh thành',
  },
  {
    id: 'car_4',
    rawId: 4,
    type: 'CARRIER_3PL',
    partnerCode: 'SPX',
    name: 'Shopee Express (SPX)',
    phone: '1900 1221',
    email: 'support@spx.vn',
    address: 'Saigon Centre, Quận 1, TP.HCM',
    vehicleOrWebsite: 'https://spx.vn',
    contactPerson: 'Nguyễn Quốc Đạt',
    isActive: true,
    notes: 'Đối tác giao nhận đơn hàng đa kênh Omnichannel',
  },
];

export function LogisticsPartnersPage() {
  const [data, setData] = useState<UnifiedDeliveryPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INTERNAL_SHIPPER' | 'CARRIER_3PL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [selectedPartner, setSelectedPartner] = useState<UnifiedDeliveryPartner | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<Partial<UnifiedDeliveryPartner>>({
    type: 'INTERNAL_SHIPPER',
    isActive: true,
  });
  const [deletingItem, setDeletingItem] = useState<UnifiedDeliveryPartner | null>(null);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const [shippersRes, carriersRes] = await Promise.allSettled([
        axiosClient.get<any, any>('/logistics/shippers'),
        axiosClient.get<any, any>('/logistics/carriers'),
      ]);

      let shipperList: UnifiedDeliveryPartner[] = [];
      let carrierList: UnifiedDeliveryPartner[] = [];

      if (shippersRes.status === 'fulfilled') {
        const raw = shippersRes.value;
        const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        if (items.length > 0) {
          shipperList = items.map((s: any) => ({
            id: `shp_${s.id}`,
            rawId: s.id,
            type: 'INTERNAL_SHIPPER',
            partnerCode: s.shipperCode || `SHP-${String(s.id).padStart(3, '0')}`,
            name: s.fullName || 'Tài xế nội bộ',
            phone: s.phone || '',
            email: s.email || '',
            address: s.address || '',
            vehicleOrWebsite: s.licensePlate || s.vehicleNumber || 'Xe máy',
            vehicleType: s.vehicleType || 'Xe máy',
            licensePlate: s.licensePlate || '',
            isActive: s.isActive !== false,
            notes: s.notes || (s.department?.departmentName ? `Thuộc: ${s.department.departmentName}` : ''),
          }));
        }
      }

      if (carriersRes.status === 'fulfilled') {
        const raw = carriersRes.value;
        const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
        if (items.length > 0) {
          carrierList = items.map((c: any) => ({
            id: `car_${c.id}`,
            rawId: c.id,
            type: 'CARRIER_3PL',
            partnerCode: c.carrierCode || `CAR-${c.id}`,
            name: c.carrierName || 'Hãng vận chuyển',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            vehicleOrWebsite: c.website || c.trackingUrlFormat || '',
            contactPerson: c.contactPerson || '',
            isActive: c.isActive !== false,
            notes: c.notes || '',
          }));
        }
      }

      const merged = [
        ...(shipperList.length > 0 ? shipperList : DEFAULT_SHIPPERS_DATA),
        ...(carrierList.length > 0 ? carrierList : DEFAULT_CARRIERS_DATA),
      ];
      setData(merged);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách đối tác vận chuyển.');
      setData([...DEFAULT_SHIPPERS_DATA, ...DEFAULT_CARRIERS_DATA]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        !search ||
        item.partnerCode.toLowerCase().includes(search.toLowerCase()) ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.phone.toLowerCase().includes(search.toLowerCase()) ||
        (item.vehicleOrWebsite && item.vehicleOrWebsite.toLowerCase().includes(search.toLowerCase())) ||
        (item.address && item.address.toLowerCase().includes(search.toLowerCase()));

      const matchType = typeFilter === 'ALL' || item.type === typeFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive);

      return matchSearch && matchType && matchStatus;
    });
  }, [data, search, typeFilter, statusFilter]);

  const counts = useMemo(() => {
    const total = data.length;
    const internal = data.filter((d) => d.type === 'INTERNAL_SHIPPER').length;
    const carrier3pl = data.filter((d) => d.type === 'CARRIER_3PL').length;
    return { total, internal, carrier3pl };
  }, [data]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setEditingItem({
      type: 'INTERNAL_SHIPPER',
      partnerCode: `SHP-${String(Math.floor(100 + Math.random() * 900))}`,
      name: '',
      phone: '',
      email: '',
      address: '',
      vehicleType: 'Xe máy',
      licensePlate: '',
      vehicleOrWebsite: '',
      contactPerson: '',
      isActive: true,
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: UnifiedDeliveryPartner) => {
    setModalMode('edit');
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name || !editingItem.phone) {
      toast.error('Vui lòng nhập đầy đủ tên và số điện thoại liên hệ (*)');
      return;
    }

    try {
      if (editingItem.type === 'INTERNAL_SHIPPER') {
        const payload = {
          shipperCode: editingItem.partnerCode || `SHP-${Date.now()}`,
          fullName: editingItem.name,
          phone: editingItem.phone,
          email: editingItem.email,
          licensePlate: editingItem.licensePlate,
          vehicleType: editingItem.vehicleType || 'Xe máy',
          vehicleNumber: editingItem.licensePlate,
          address: editingItem.address,
          isActive: editingItem.isActive !== false,
          notes: editingItem.notes,
        };

        if (modalMode === 'create') {
          await axiosClient.post('/logistics/shippers', payload);
          toast.success(`Đã thêm tài xế nội bộ ${editingItem.name}!`);
        } else if (editingItem.rawId) {
          await axiosClient.put(`/logistics/shippers/${editingItem.rawId}`, payload);
          toast.success(`Đã cập nhật tài xế ${editingItem.name}!`);
        }
      } else {
        const payload = {
          carrierCode: editingItem.partnerCode || `CAR-${Date.now()}`,
          carrierName: editingItem.name,
          phone: editingItem.phone,
          email: editingItem.email,
          website: editingItem.vehicleOrWebsite,
          contactPerson: editingItem.contactPerson,
          address: editingItem.address,
          isActive: editingItem.isActive !== false,
          notes: editingItem.notes,
        };

        if (modalMode === 'create') {
          await axiosClient.post('/logistics/carriers', payload);
          toast.success(`Đã thêm hãng vận chuyển ${editingItem.name}!`);
        } else if (editingItem.rawId) {
          await axiosClient.put(`/logistics/carriers/${editingItem.rawId}`, payload);
          toast.success(`Đã cập nhật hãng ${editingItem.name}!`);
        }
      }

      setIsModalOpen(false);
      await fetchPartners();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu đối tác vận chuyển: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.type === 'INTERNAL_SHIPPER' && deletingItem.rawId) {
        await axiosClient.delete(`/logistics/shippers/${deletingItem.rawId}`);
      } else if (deletingItem.type === 'CARRIER_3PL' && deletingItem.rawId) {
        await axiosClient.delete(`/logistics/carriers/${deletingItem.rawId}`);
      }
      toast.success(`Đã xóa đối tác ${deletingItem.name}!`);
      setDeletingItem(null);
      await fetchPartners();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xóa đối tác: ' + (err?.response?.data?.message || err?.message || 'Thất bại'));
    }
  };

  const columns = useMemo<ColumnDef<UnifiedDeliveryPartner>[]>(
    () => [
      {
        accessorKey: 'partnerCode',
        header: 'Mã đối tác',
        cell: ({ row }) => (
          <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700">
            {row.original.partnerCode}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Tên đối tác / Shipper',
        cell: ({ row }) => {
          const isInternal = row.original.type === 'INTERNAL_SHIPPER';
          return (
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isInternal
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                }`}
              >
                {isInternal ? <Bike className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                  {row.original.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isInternal
                    ? (row.original.vehicleType || 'Tài xế nội bộ')
                    : (row.original.contactPerson ? `LH: ${row.original.contactPerson}` : 'Đối tác 3PL')}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Loại hình',
        cell: ({ row }) => {
          const isInternal = row.original.type === 'INTERNAL_SHIPPER';
          return isInternal ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              <UserCheck className="w-3 h-3" /> Shipper nội bộ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              <Building2 className="w-3 h-3" /> Hãng 3PL (API)
            </span>
          );
        },
      },
      {
        accessorKey: 'phone',
        header: 'SĐT / Hotline',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
            <Phone className="w-3.5 h-3.5 text-gray-400" />
            <a href={`tel:${row.original.phone}`} className="hover:text-blue-600 hover:underline">
              {row.original.phone || 'Chưa cập nhật'}
            </a>
          </div>
        ),
      },
      {
        accessorKey: 'vehicleOrWebsite',
        header: 'Phương tiện / Tra cứu',
        cell: ({ row }) => {
          const isInternal = row.original.type === 'INTERNAL_SHIPPER';
          if (isInternal) {
            return (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {row.original.licensePlate || row.original.vehicleOrWebsite || 'Xe máy'}
                </span>
              </div>
            );
          }
          return row.original.vehicleOrWebsite ? (
            <a
              href={row.original.vehicleOrWebsite.startsWith('http') ? row.original.vehicleOrWebsite : `https://${row.original.vehicleOrWebsite}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 max-w-[180px] truncate"
            >
              <Globe className="w-3 h-3 shrink-0" />
              <span className="truncate">{row.original.vehicleOrWebsite.replace(/^https?:\/\//, '')}</span>
            </a>
          ) : (
            <span className="text-xs text-gray-400">N/A</span>
          );
        },
      },
      {
        accessorKey: 'address',
        header: 'Kho / Trụ sở',
        cell: ({ row }) => (
          <p className="text-xs text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={row.original.address}>
            {row.original.address || 'N/A'}
          </p>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              row.original.isActive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {row.original.isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {row.original.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedPartner(row.original)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300 cursor-pointer"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 cursor-pointer"
              title="Chỉnh sửa đối tác"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeletingItem(row.original)}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded text-rose-600 dark:text-rose-400 cursor-pointer"
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-600" />
            Đơn vị vận chuyển & Đối tác giao hàng
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tập trung đội ngũ tài xế nội bộ và các hãng vận chuyển đối tác 3PL (GHTK, GHN, Viettel Post...)
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm đối tác vận chuyển
        </button>
      </div>

      {/* KPI & Quick Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setTypeFilter('ALL')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === 'ALL'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Tất cả đối tác</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">{counts.total}</p>
          <p className="text-xs text-gray-400 mt-1">Tài xế nội bộ & Hãng ngoài</p>
        </button>

        <button
          onClick={() => setTypeFilter('INTERNAL_SHIPPER')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === 'INTERNAL_SHIPPER'
              ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Shipper nội bộ</span>
            <Bike className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{counts.internal}</p>
          <p className="text-xs text-gray-400 mt-1">Đội xe giao hàng AuraMart</p>
        </button>

        <button
          onClick={() => setTypeFilter('CARRIER_3PL')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            typeFilter === 'CARRIER_3PL'
              ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">Hãng 3PL (Đối tác ngoài)</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 mt-2">{counts.carrier3pl}</p>
          <p className="text-xs text-gray-400 mt-1">GHTK, GHN, Viettel Post, SPX</p>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên tài xế, hãng, SĐT, biển số xe, trụ sở..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Trạng thái:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm dừng</option>
            </select>
          </div>
        </div>

        <ReusableDataTable data={filteredData} columns={columns} isLoading={isLoading} />
      </div>

      {/* Detail Modal */}
      {selectedPartner && (
        <Modal
          isOpen={Boolean(selectedPartner)}
          onClose={() => setSelectedPartner(null)}
          title="CHI TIẾT ĐỐI TÁC VẬN CHUYỂN"
          width="max-w-2xl"
        >
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  selectedPartner.type === 'INTERNAL_SHIPPER'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                }`}
              >
                {selectedPartner.type === 'INTERNAL_SHIPPER' ? (
                  <Bike className="w-7 h-7" />
                ) : (
                  <Building2 className="w-7 h-7" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedPartner.name}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-bold">
                    {selectedPartner.partnerCode}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedPartner.type === 'INTERNAL_SHIPPER'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                    }`}
                  >
                    {selectedPartner.type === 'INTERNAL_SHIPPER' ? 'Shipper nội bộ AuraMart' : 'Hãng vận chuyển 3PL (API)'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      selectedPartner.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {selectedPartner.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <span className="text-xs text-gray-400 block">Số điện thoại / Hotline:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedPartner.phone || 'N/A'}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block">Email liên hệ:</span>
                <span className="font-medium text-gray-900 dark:text-white">{selectedPartner.email || 'N/A'}</span>
              </div>

              {selectedPartner.type === 'INTERNAL_SHIPPER' ? (
                <>
                  <div>
                    <span className="text-xs text-gray-400 block">Loại phương tiện:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedPartner.vehicleType || 'Xe máy'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Biển số xe:</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">
                      {selectedPartner.licensePlate || 'N/A'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-xs text-gray-400 block">Website tra cứu vận đơn:</span>
                    {selectedPartner.vehicleOrWebsite ? (
                      <a
                        href={selectedPartner.vehicleOrWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate block"
                      >
                        {selectedPartner.vehicleOrWebsite}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block">Người phụ trách đại diện:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedPartner.contactPerson || 'N/A'}
                    </span>
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <span className="text-xs text-gray-400 block">Khu vực / Trụ sở hoạt động:</span>
                <span className="text-gray-900 dark:text-white">{selectedPartner.address || 'N/A'}</span>
              </div>

              {selectedPartner.notes && (
                <div className="sm:col-span-2 border-t border-gray-100 dark:border-gray-800 pt-2 mt-2">
                  <span className="text-xs text-gray-400 block">Ghi chú:</span>
                  <p className="text-gray-600 dark:text-gray-300 text-xs mt-0.5">{selectedPartner.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setSelectedPartner(null)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const p = selectedPartner;
                  setSelectedPartner(null);
                  handleOpenEdit(p);
                }}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                Chỉnh sửa đối tác
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={modalMode === 'create' ? 'THÊM MỚI ĐỐI TÁC VẬN CHUYỂN' : 'CHỈNH SỬA ĐỐI TÁC VẬN CHUYỂN'}
          width="max-w-2xl"
        >
          <form onSubmit={handleSave} className="space-y-5">
            {/* Type selector */}
            <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Loại hình đối tác vận chuyển *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={modalMode === 'edit'}
                  onClick={() => setEditingItem({ ...editingItem, type: 'INTERNAL_SHIPPER' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                    editingItem.type === 'INTERNAL_SHIPPER'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                  } ${modalMode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <Bike className="w-4 h-4" />
                  Shipper nội bộ
                </button>

                <button
                  type="button"
                  disabled={modalMode === 'edit'}
                  onClick={() => setEditingItem({ ...editingItem, type: 'CARRIER_3PL' })}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                    editingItem.type === 'CARRIER_3PL'
                      ? 'border-purple-600 bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                  } ${modalMode === 'edit' ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <Building2 className="w-4 h-4" />
                  Hãng 3PL (API)
                </button>
              </div>
            </div>

            {/* Common fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Mã đối tác *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.partnerCode || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, partnerCode: e.target.value })}
                  placeholder={editingItem.type === 'INTERNAL_SHIPPER' ? 'SHP-001' : 'GHTK'}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {editingItem.type === 'INTERNAL_SHIPPER' ? 'Họ tên tài xế / Shipper *' : 'Tên hãng vận chuyển *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder={editingItem.type === 'INTERNAL_SHIPPER' ? 'Nguyễn Văn Tuấn...' : 'Giao Hàng Tiết Kiệm (GHTK)...'}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {editingItem.type === 'INTERNAL_SHIPPER' ? 'Số điện thoại tài xế *' : 'Hotline tổng đài *'}
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.phone || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, phone: e.target.value })}
                  placeholder="09xx..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Email liên hệ
                </label>
                <input
                  type="email"
                  value={editingItem.email || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, email: e.target.value })}
                  placeholder="email@example.com..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              {/* Specific fields for Internal Shipper */}
              {editingItem.type === 'INTERNAL_SHIPPER' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Loại phương tiện
                    </label>
                    <select
                      value={editingItem.vehicleType || 'Xe máy'}
                      onChange={(e) => setEditingItem({ ...editingItem, vehicleType: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                    >
                      <option value="Xe máy">Xe máy</option>
                      <option value="Xe bán tải">Xe bán tải</option>
                      <option value="Xe tải nhẹ 1.5 tấn">Xe tải nhẹ 1.5 tấn</option>
                      <option value="Xe tải 3.5 tấn">Xe tải 3.5 tấn</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Biển số xe
                    </label>
                    <input
                      type="text"
                      value={editingItem.licensePlate || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, licensePlate: e.target.value })}
                      placeholder="VD: 29C-123.45"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-mono"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Website tra cứu hành trình
                    </label>
                    <input
                      type="text"
                      value={editingItem.vehicleOrWebsite || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, vehicleOrWebsite: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Người phụ trách / Liên hệ đại diện
                    </label>
                    <input
                      type="text"
                      value={editingItem.contactPerson || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, contactPerson: e.target.value })}
                      placeholder="Họ tên người phụ trách..."
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {editingItem.type === 'INTERNAL_SHIPPER' ? 'Kho / Chi nhánh phụ trách' : 'Trụ sở chính hãng vận chuyển'}
                </label>
                <input
                  type="text"
                  value={editingItem.address || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, address: e.target.value })}
                  placeholder="Địa chỉ hoặc kho phụ trách..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Trạng thái hoạt động
                </label>
                <select
                  value={editingItem.isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.value === 'ACTIVE' })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Tạm dừng</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Ghi chú
                </label>
                <textarea
                  rows={2}
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  placeholder="Ghi chú thêm về năng lực giao hàng, tuyến đường hoặc thỏa thuận..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 font-bold cursor-pointer"
              >
                {modalMode === 'create' ? 'Tạo đối tác' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deletingItem && (
        <ConfirmDeleteModal
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleDelete}
          title="Xác nhận xóa đối tác vận chuyển"
          description={`Bạn có chắc chắn muốn xóa ${deletingItem.type === 'INTERNAL_SHIPPER' ? 'tài xế' : 'hãng vận chuyển'} "${deletingItem.name}" (${deletingItem.partnerCode})?`}
        />
      )}
    </div>
  );
}

export default LogisticsPartnersPage;
