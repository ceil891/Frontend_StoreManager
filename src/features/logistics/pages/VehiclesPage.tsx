import { useMemo, useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Truck, Shield, Calendar, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export interface VehicleRecord {
  id: string;
  vehicleCode: string; // VEH-000001
  licensePlate: string; // Biển số xe
  vehicleType: 'MOTORCYCLE' | 'VAN' | 'TRUCK' | 'PICKUP' | 'CONTAINER' | 'REFRIGERATED' | 'OTHER';
  vehicleName: string;
  brand: string;
  model: string;
  manufacturingYear: number;
  maxPayloadKg: number;
  maxVolumeM3: number;
  maxPackages: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  supportCold: boolean;
  supportFragile: boolean;
  supportCod: boolean;
  carrierName: string;
  branchName: string;
  assignedShipper: string;
  operatingArea: string;
  registrationDate: string;
  inspectionDate: string;
  inspectionExpiryDate: string;
  insuranceExpiryDate: string;
  inspectionNo: string;
  insuranceNo: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  notes?: string;
}

const typeLabels: Record<VehicleRecord['vehicleType'], string> = {
  MOTORCYCLE: 'Xe máy',
  VAN: 'Xe tải van',
  TRUCK: 'Xe tải',
  PICKUP: 'Xe bán tải',
  CONTAINER: 'Xe container',
  REFRIGERATED: 'Xe lạnh',
  OTHER: 'Khác',
};

const statusBadgeStyles = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  MAINTENANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
  INACTIVE: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200',
};

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([
    {
      id: '1',
      vehicleCode: 'VEH-000001',
      licensePlate: '29C-888.99',
      vehicleType: 'TRUCK',
      vehicleName: 'Isuzu QKR 270',
      brand: 'Isuzu',
      model: 'QKR77FE4',
      manufacturingYear: 2023,
      maxPayloadKg: 2490,
      maxVolumeM3: 15.5,
      maxPackages: 120,
      lengthMm: 4360,
      widthMm: 1870,
      heightMm: 1890,
      supportCold: false,
      supportFragile: true,
      supportCod: true,
      carrierName: 'Đội xe nội bộ',
      branchName: 'Chi nhánh Hà Nội',
      assignedShipper: 'Nguyễn Văn Minh',
      operatingArea: 'Nội thành Hà Nội & Lân cận',
      registrationDate: '2023-05-10',
      inspectionDate: '2024-05-10',
      inspectionExpiryDate: '2026-05-10',
      insuranceExpiryDate: '2026-05-10',
      inspectionNo: 'ĐK-889912',
      insuranceNo: 'BH-990011',
      status: 'ACTIVE',
      notes: 'Xe tải giao ca sáng tuyến trung tâm.',
    },
    {
      id: '2',
      vehicleCode: 'VEH-000002',
      licensePlate: '51D-777.66',
      vehicleType: 'REFRIGERATED',
      vehicleName: 'Hyundai Porter H150 Đông Lạnh',
      brand: 'Hyundai',
      model: 'H150',
      manufacturingYear: 2024,
      maxPayloadKg: 1450,
      maxVolumeM3: 9.8,
      maxPackages: 80,
      lengthMm: 3100,
      widthMm: 1620,
      heightMm: 1550,
      supportCold: true,
      supportFragile: true,
      supportCod: true,
      carrierName: 'Giao hàng Lạnh Express',
      branchName: 'Chi nhánh TP.HCM',
      assignedShipper: 'Trần Quốc Huy',
      operatingArea: 'Toàn TP.HCM & Đông Nam Bộ',
      registrationDate: '2024-01-15',
      inspectionDate: '2024-01-15',
      inspectionExpiryDate: '2026-01-15',
      insuranceExpiryDate: '2026-01-15',
      inspectionNo: 'ĐK-112233',
      insuranceNo: 'BH-445566',
      status: 'ACTIVE',
      notes: 'Khoang lạnh nhiệt độ từ -5°C đến +5°C.',
    },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formState, setFormState] = useState<Partial<VehicleRecord>>({});

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch =
        v.vehicleCode.toLowerCase().includes(search.toLowerCase()) ||
        v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
        v.vehicleName.toLowerCase().includes(search.toLowerCase()) ||
        v.assignedShipper.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, statusFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormState({
      vehicleCode: `VEH-${String(vehicles.length + 1).padStart(6, '0')}`,
      licensePlate: '',
      vehicleType: 'TRUCK',
      vehicleName: '',
      brand: '',
      model: '',
      manufacturingYear: new Date().getFullYear(),
      maxPayloadKg: 1000,
      maxVolumeM3: 8,
      maxPackages: 50,
      lengthMm: 3000,
      widthMm: 1600,
      heightMm: 1600,
      supportCold: false,
      supportFragile: true,
      supportCod: true,
      carrierName: 'Đội xe nội bộ',
      branchName: 'Chi nhánh Hà Nội',
      assignedShipper: '',
      operatingArea: 'Nội thành',
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VehicleRecord) => {
    setModalMode('edit');
    setFormState(v);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.licensePlate?.trim()) {
      toast.error('Biển số xe không được để trống!');
      return;
    }

    if (modalMode === 'create') {
      const newRec: VehicleRecord = {
        id: String(Date.now()),
        vehicleCode: formState.vehicleCode || `VEH-${Date.now()}`,
        licensePlate: formState.licensePlate,
        vehicleType: formState.vehicleType || 'TRUCK',
        vehicleName: formState.vehicleName || 'Phương tiện mới',
        brand: formState.brand || '',
        model: formState.model || '',
        manufacturingYear: Number(formState.manufacturingYear) || new Date().getFullYear(),
        maxPayloadKg: Number(formState.maxPayloadKg) || 1000,
        maxVolumeM3: Number(formState.maxVolumeM3) || 5,
        maxPackages: Number(formState.maxPackages) || 50,
        lengthMm: Number(formState.lengthMm) || 3000,
        widthMm: Number(formState.widthMm) || 1500,
        heightMm: Number(formState.heightMm) || 1500,
        supportCold: Boolean(formState.supportCold),
        supportFragile: Boolean(formState.supportFragile),
        supportCod: Boolean(formState.supportCod),
        carrierName: formState.carrierName || 'Nội bộ',
        branchName: formState.branchName || 'Chi nhánh',
        assignedShipper: formState.assignedShipper || 'Chưa phân công',
        operatingArea: formState.operatingArea || 'Toàn quốc',
        registrationDate: formState.registrationDate || new Date().toISOString().split('T')[0],
        inspectionDate: formState.inspectionDate || new Date().toISOString().split('T')[0],
        inspectionExpiryDate: formState.inspectionExpiryDate || '',
        insuranceExpiryDate: formState.insuranceExpiryDate || '',
        inspectionNo: formState.inspectionNo || '',
        insuranceNo: formState.insuranceNo || '',
        status: formState.status as any || 'ACTIVE',
        notes: formState.notes || '',
      };
      setVehicles([newRec, ...vehicles]);
      toast.success(`Đã thêm phương tiện ${newRec.licensePlate} thành công!`);
    } else {
      setVehicles(vehicles.map(v => v.id === formState.id ? { ...v, ...formState } as VehicleRecord : v));
      toast.success(`Đã cập nhật phương tiện ${formState.licensePlate}!`);
    }
    setIsModalOpen(false);
  };

  const columns = useMemo<ColumnDef<VehicleRecord>[]>(
    () => [
      {
        accessorKey: 'vehicleCode',
        header: 'Mã phương tiện',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'licensePlate',
        header: 'Biển số & Tên xe',
        cell: ({ row }) => (
          <div>
            <p className="font-mono font-bold text-gray-900 dark:text-white text-sm">{row.original.licensePlate}</p>
            <p className="text-xs text-gray-500">{row.original.vehicleName} ({typeLabels[row.original.vehicleType]})</p>
          </div>
        ),
      },
      {
        accessorKey: 'maxPayloadKg',
        header: 'Tải trọng & Thể tích',
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            <p className="font-bold text-emerald-700 dark:text-emerald-400">{row.original.maxPayloadKg.toLocaleString()} kg</p>
            <p className="text-gray-500">{row.original.maxVolumeM3} m³ | {row.original.maxPackages} kiện</p>
          </div>
        ),
      },
      {
        accessorKey: 'assignedShipper',
        header: 'Quản lý & Shipper',
        cell: ({ row }) => (
          <div className="text-xs">
            <p className="font-semibold text-gray-900 dark:text-white">{row.original.assignedShipper || 'Chưa phân công'}</p>
            <p className="text-gray-500">{row.original.branchName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const st = info.getValue() as VehicleRecord['status'];
          return (
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${statusBadgeStyles[st]}`}>
              {st === 'ACTIVE' ? 'Đang hoạt động' : st === 'MAINTENANCE' ? 'Đang bảo trì' : 'Ngừng hoạt động'}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedVehicle(row.original)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-600 dark:text-gray-300"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleOpenEdit(row.original)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-primary"
              title="Chỉnh sửa"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" /> Đội xe & phương tiện vận chuyển
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý đội xe, tải trọng, thể tích, giấy tờ đăng kiểm và bảo hiểm phương tiện giao hàng
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-sm flex items-center gap-2 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Thêm mới phương tiện
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo biển số xe, mã phương tiện, tên xe, shipper phụ trách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="MAINTENANCE">Đang bảo trì</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <ReusableDataTable columns={columns} data={filtered} />
      </div>

      {/* Modal Form Thêm/Sửa Phương Tiện */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới phương tiện vận chuyển' : 'Cập nhật thông tin phương tiện'}
        width="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-6 text-sm p-2">
          {/* Section 1: Thông tin phương tiện */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">1. Thông tin phương tiện</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã phương tiện *</label>
                <input
                  type="text"
                  required
                  value={formState.vehicleCode || ''}
                  onChange={(e) => setFormState({ ...formState, vehicleCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Biển số xe *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 29C-888.99"
                  value={formState.licensePlate || ''}
                  onChange={(e) => setFormState({ ...formState, licensePlate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loại phương tiện *</label>
                <select
                  value={formState.vehicleType || 'TRUCK'}
                  onChange={(e) => setFormState({ ...formState, vehicleType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="MOTORCYCLE">Xe máy</option>
                  <option value="VAN">Xe tải van</option>
                  <option value="TRUCK">Xe tải</option>
                  <option value="PICKUP">Xe bán tải</option>
                  <option value="CONTAINER">Xe container</option>
                  <option value="REFRIGERATED">Xe lạnh</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tên phương tiện</label>
                <input
                  type="text"
                  placeholder="Isuzu QKR 270"
                  value={formState.vehicleName || ''}
                  onChange={(e) => setFormState({ ...formState, vehicleName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hãng xe</label>
                <input
                  type="text"
                  placeholder="Isuzu / Hyundai"
                  value={formState.brand || ''}
                  onChange={(e) => setFormState({ ...formState, brand: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Dòng xe (model)</label>
                <input
                  type="text"
                  placeholder="QKR77FE4"
                  value={formState.model || ''}
                  onChange={(e) => setFormState({ ...formState, model: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Năm sản xuất</label>
                <input
                  type="number"
                  value={formState.manufacturingYear || 2024}
                  onChange={(e) => setFormState({ ...formState, manufacturingYear: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Khả năng vận chuyển */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">2. Khả năng vận chuyển</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tải trọng tối đa (kg) *</label>
                <input
                  type="number"
                  required
                  value={formState.maxPayloadKg || 1000}
                  onChange={(e) => setFormState({ ...formState, maxPayloadKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Thể tích tối đa (m³)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formState.maxVolumeM3 || 10}
                  onChange={(e) => setFormState({ ...formState, maxVolumeM3: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Số kiện tối đa</label>
                <input
                  type="number"
                  value={formState.maxPackages || 50}
                  onChange={(e) => setFormState({ ...formState, maxPackages: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Dài khoang (mm)</label>
                <input
                  type="number"
                  value={formState.lengthMm || 3000}
                  onChange={(e) => setFormState({ ...formState, lengthMm: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rộng khoang (mm)</label>
                <input
                  type="number"
                  value={formState.widthMm || 1600}
                  onChange={(e) => setFormState({ ...formState, widthMm: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cao khoang (mm)</label>
                <input
                  type="number"
                  value={formState.heightMm || 1600}
                  onChange={(e) => setFormState({ ...formState, heightMm: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formState.supportCold)}
                  onChange={(e) => setFormState({ ...formState, supportCold: e.target.checked })}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Có hỗ trợ hàng lạnh</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formState.supportFragile)}
                  onChange={(e) => setFormState({ ...formState, supportFragile: e.target.checked })}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Có hỗ trợ hàng dễ vỡ</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formState.supportCod)}
                  onChange={(e) => setFormState({ ...formState, supportCod: e.target.checked })}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Có hỗ trợ COD</span>
              </label>
            </div>
          </div>

          {/* Section 3: Đơn vị quản lý & Hồ sơ */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">3. Đơn vị quản lý & hồ sơ đăng kiểm</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn vị vận chuyển</label>
                <input
                  type="text"
                  value={formState.carrierName || ''}
                  onChange={(e) => setFormState({ ...formState, carrierName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh</label>
                <input
                  type="text"
                  value={formState.branchName || ''}
                  onChange={(e) => setFormState({ ...formState, branchName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tài xế / shipper phụ trách</label>
                <input
                  type="text"
                  placeholder="Họ tên tài xế..."
                  value={formState.assignedShipper || ''}
                  onChange={(e) => setFormState({ ...formState, assignedShipper: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn đăng kiểm</label>
                <input
                  type="date"
                  value={formState.inspectionExpiryDate || ''}
                  onChange={(e) => setFormState({ ...formState, inspectionExpiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày hết hạn bảo hiểm</label>
                <input
                  type="date"
                  value={formState.insuranceExpiryDate || ''}
                  onChange={(e) => setFormState({ ...formState, insuranceExpiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Trạng thái *</label>
                <select
                  value={formState.status || 'ACTIVE'}
                  onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="MAINTENANCE">Đang bảo trì</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow"
            >
              {modalMode === 'create' ? 'Thêm mới' : 'Lưu thông tin'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
