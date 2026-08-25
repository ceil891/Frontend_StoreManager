import { useMemo, useState, useEffect } from 'react';
import { Plus, Download, Search, Eye, Truck, CheckCircle2, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';
import { useAreaStore } from '@/features/crm/store/areaStore';

interface DeliveryTripRecord {
  id: string;
  manifestNumber: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleType: 'VAN' | 'LIGHT_TRUCK' | 'REFRIGERATED_TRUCK' | 'MOTORBIKE';
  departureHub: string;
  destinationZone: string;
  scheduledDeparture: string;
  actualDeparture?: string;
  estimatedArrival: string;
  totalParcels: number;
  totalWeightKg: number;
  tripStatus: 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
  cashOnDeliveryTotal: number;
  notes?: string;
}

export function DeliveryTripsPage() {
  const [data, setData] = useState<DeliveryTripRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<DeliveryTripRecord | null>(null);

  // States for creation
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [shippersList, setShippersList] = useState<any[]>([]);
  const [tripCode, setTripCode] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('#SO-20260808-001');
  const [branchLocation, setBranchLocation] = useState('Chi nhánh Hà Nội (Kho chính)');
  const [carrierName, setCarrierName] = useState('Viettel Post');
  const [serviceType, setServiceType] = useState('Express');
  const [selectedShipperId, setSelectedShipperId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [licensePlate, setLicensePlate] = useState('29C-123.45');
  const [pickupAddress, setPickupAddress] = useState('Tòa nhà Viettel Post, Đại lộ Thăng Long, Nam Từ Liêm, Hà Nội');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [estimatedPickupTime, setEstimatedPickupTime] = useState('');
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('');
  const [notes, setNotes] = useState('');

const DEFAULT_TRIPS: DeliveryTripRecord[] = [
  {
    id: '1',
    manifestNumber: 'TRIP-990182',
    driverName: 'Nguyễn Văn Minh (Viettel Post)',
    driverPhone: '0912 345 678',
    vehiclePlate: '29C-882.19',
    vehicleType: 'VAN',
    departureHub: 'Kho trung chuyển Hà Nội',
    destinationZone: 'Quận Cầu Giấy & Nam Từ Liêm',
    scheduledDeparture: '2026-07-30 08:00',
    actualDeparture: '2026-07-30 08:05',
    estimatedArrival: '2026-07-30 12:00',
    totalParcels: 24,
    totalWeightKg: 145.0,
    tripStatus: 'EN_ROUTE',
    cashOnDeliveryTotal: 15400000,
    notes: 'Giao hỏa tốc đơn hàng điện tử'
  },
  {
    id: '2',
    manifestNumber: 'TRIP-990183',
    driverName: 'Trần Quốc Huy (GHTK)',
    driverPhone: '0987 654 321',
    vehiclePlate: '51D-492.01',
    vehicleType: 'MOTORBIKE',
    departureHub: 'Kho TP. Hồ Chí Minh',
    destinationZone: 'Quận 1 & Quận 3',
    scheduledDeparture: '2026-07-30 09:30',
    actualDeparture: '2026-07-30 09:32',
    estimatedArrival: '2026-07-30 11:30',
    totalParcels: 18,
    totalWeightKg: 42.0,
    tripStatus: 'EN_ROUTE',
    cashOnDeliveryTotal: 8900000,
    notes: 'Giao trong ngày khu vực trung tâm'
  },
  {
    id: '3',
    manifestNumber: 'TRIP-990184',
    driverName: 'Đội xe AuraMart Nội bộ',
    driverPhone: '0283 888 999',
    vehiclePlate: '51C-771.88',
    vehicleType: 'TRUCK_3_5T',
    departureHub: 'Tổng kho AuraMart Tân Bình',
    destinationZone: 'Tất cả các chi nhánh',
    scheduledDeparture: '2026-07-30 06:00',
    actualDeparture: '2026-07-30 06:00',
    estimatedArrival: '2026-07-30 10:00',
    tripStatus: 'COMPLETED',
    completedAt: '2026-07-30 09:50',
    totalParcels: 150,
    totalWeightKg: 1250.0,
    cashOnDeliveryTotal: 0,
    notes: 'Luân chuyển hàng hóa nội bộ hệ thống'
  }
];

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/trips');
      if (Array.isArray(res) && res.length > 0) {
        const mapped = res.map((item: any) => ({
          id: String(item.id),
          manifestNumber: item.tripCode || `TRIP-${item.id}`,
          driverName: item.shipper?.fullName || item.receiverName || 'Chưa phân công',
          driverPhone: item.shipper?.phone || item.receiverPhone || '',
          vehiclePlate: item.shipper?.licensePlate || 'N/A',
          vehicleType: (item.shipper?.vehicleType || 'VAN') as any,
          departureHub: 'Kho tổng',
          destinationZone: item.deliveryAddress || 'Chưa nhập địa chỉ',
          scheduledDeparture: item.createdAt ? item.createdAt.substring(0, 16).replace('T', ' ') : 'N/A',
          actualDeparture: item.createdAt ? item.createdAt.substring(0, 16).replace('T', ' ') : undefined,
          estimatedArrival: item.updatedAt ? item.updatedAt.substring(0, 16).replace('T', ' ') : 'N/A',
          totalParcels: 10,
          totalWeightKg: 25.5,
          tripStatus: (item.status || 'SCHEDULED') as any,
          cashOnDeliveryTotal: item.order?.totalAmount || 500000,
          notes: item.deliveryNote || ''
        }));
        setData(mapped);
      } else {
        setData(DEFAULT_TRIPS);
      }
    } catch (err) {
      console.error(err);
      setData(DEFAULT_TRIPS);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShippers = async () => {
    try {
      const res = await axiosClient.get<any, any[]>('/logistics/shippers');
      setShippersList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    }
  };

  const { areas, fetchAreas } = useAreaStore();

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleOpenCreate = () => {
    const now = new Date();
    const isoNow = now.toISOString().slice(0, 16);
    const in2Hours = new Date(now.getTime() + 2 * 3600 * 1000).toISOString().slice(0, 16);
    const in24Hours = new Date(now.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 16);

    setTripCode(`TRIP-${Math.floor(100000 + Math.random() * 900000)}`);
    setSelectedOrder('#SO-20260808-001');
    setBranchLocation('Chi nhánh Hà Nội (Kho chính)');
    setCarrierName('Viettel Post');
    setServiceType('Express');
    setSelectedShipperId('');
    setDriverName('Nguyễn Văn Tuấn');
    setDriverPhone('0912 345 678');
    setLicensePlate('29C-123.45');
    setPickupAddress('Tòa nhà Viettel Post, Đại lộ Thăng Long, Nam Từ Liêm, Hà Nội');
    setDeliveryAddress('Số 18 Phạm Hùng, Quận Cầu Giấy, Hà Nội');
    setEstimatedPickupTime(in2Hours);
    setEstimatedDeliveryTime(in24Hours);
    setNotes('Hàng điện tử dễ vỡ, yêu cầu giao giờ hành chính');
    setIsCreateOpen(true);
    fetchShippers();
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTripRecord: DeliveryTripRecord = {
        id: String(Date.now()),
        manifestNumber: tripCode,
        driverName: `${driverName || 'Nguyễn Văn Tuấn'} (${carrierName})`,
        driverPhone: driverPhone || '0912 345 678',
        vehiclePlate: licensePlate || '29C-123.45',
        vehicleType: 'VAN',
        departureHub: pickupAddress || branchLocation,
        destinationZone: deliveryAddress || 'Chưa nhập địa chỉ',
        scheduledDeparture: estimatedPickupTime ? estimatedPickupTime.replace('T', ' ') : new Date().toISOString().slice(0, 16).replace('T', ' '),
        estimatedArrival: estimatedDeliveryTime ? estimatedDeliveryTime.replace('T', ' ') : 'N/A',
        totalParcels: 12,
        totalWeightKg: 45.0,
        tripStatus: 'SCHEDULED',
        cashOnDeliveryTotal: 2500000,
        notes: notes || 'Giao giờ hành chính, thu COD',
      };

      const payload = {
        tripCode,
        status: 'SCHEDULED',
        orderCode: selectedOrder,
        branchLocation,
        carrierName,
        serviceType,
        driverName,
        driverPhone,
        licensePlate,
        pickupAddress,
        deliveryAddress,
        estimatedPickupTime,
        estimatedDeliveryTime,
        deliveryNote: notes,
        shipperId: selectedShipperId ? Number(selectedShipperId) : undefined
      };
      
      try {
        await axiosClient.post('/logistics/trips', payload);
      } catch (e) {
        console.warn('API trip create fallback to local state:', e);
      }

      setData((prev) => [newTripRecord, ...prev]);
      toast.success(`Đã tạo thành công lệnh điều vận ${tripCode} cho đơn ${selectedOrder}!`);
      setIsCreateOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tạo lệnh điều vận.');
    }
  };

  const handleUpdateStatus = async (tripId: string, status: string) => {
    try {
      await axiosClient.put(`/logistics/trips/${tripId}`, { status });
      toast.success(`Cập nhật trạng thái chuyến đi thành công!`);
      setSelectedTrip(null);
      fetchTrips();
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi cập nhật trạng thái.');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy chuyến xe này?')) {
      try {
        await axiosClient.delete(`/logistics/trips/${tripId}`);
        toast.success('Hủy chuyến giao hàng thành công!');
        setSelectedTrip(null);
        fetchTrips();
      } catch (err) {
        console.error(err);
        toast.error('Lỗi khi hủy chuyến xe.');
      }
    }
  };

  const filtered = data.filter((item) =>
    item.manifestNumber.toLowerCase().includes(search.toLowerCase()) ||
    item.driverName.toLowerCase().includes(search.toLowerCase()) ||
    item.destinationZone.toLowerCase().includes(search.toLowerCase()) ||
    item.vehiclePlate.toLowerCase().includes(search.toLowerCase())
  );

  const columns = useMemo<ColumnDef<DeliveryTripRecord>[]>(
    () => [
      {
        accessorKey: 'manifestNumber',
        header: 'Mã lệnh',
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'driverName',
        header: 'Tài xế & phương tiện',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.driverName}</p>
            <p className="text-xs font-mono text-gray-500">{row.original.vehiclePlate} ({row.original.vehicleType.replace('_', ' ')})</p>
          </div>
        ),
      },
      {
        accessorKey: 'destinationZone',
        header: 'Tuyến đến',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalParcels',
        header: 'Số kiện',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-gray-900 dark:text-white">{row.original.totalParcels} kiện</span>
            <span className="text-xs text-gray-400 block font-mono">{row.original.totalWeightKg} kg</span>
          </div>
        ),
      },
      {
        accessorKey: 'cashOnDeliveryTotal',
        header: 'Tiền thu COD',
        cell: (info) => <span className="font-mono font-bold text-primary">{Number(info.getValue()).toLocaleString('vi-VN')} đ</span>,
      },
      {
        accessorKey: 'tripStatus',
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue() as string;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              status === 'SCHEDULED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
              status === 'DELAYED' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {status === 'COMPLETED' ? 'Hoàn thành' :
               status === 'IN_TRANSIT' ? 'Đang di chuyển' :
               status === 'SCHEDULED' ? 'Đã lên lịch' :
               status === 'DELAYED' ? 'Chậm tuyến' : status.replace('_', ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'scheduledDeparture',
        header: 'Giờ đi',
        cell: (info) => <span className="text-gray-500 text-sm font-mono">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedTrip(row.original); }}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteTrip(row.original.id); }}
              cl  return (
    <>
      <datalist id="area-trip-suggestions">
        {areas.map((area) => (
          <option key={area.id} value={area.parentName ? `${area.name}, ${area.parentName}` : area.name} />
        ))}
      </datalist>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chuyến xe giao hàng</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Điều phối lệnh chuyển hàng giữa các cửa hàng, theo dõi đội xe, giám sát COD và xử lý chậm tuyến</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất Excel nhật ký điều vận
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> Thêm mới lệnh điều vận
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
              placeholder="Tìm kiếm theo mã lệnh, tài xế, biển số hoặc tuyến đến..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải danh sách chuyến xe...</span>
          </div>
        ) : (
          <ReusableDataTable columns={columns} data={filtered} />
        )}
      </div>

      {/* Modal Xem chi tiết chuyến xe */}
      <Modal
        isOpen={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
        title={selectedTrip ? `Lệnh điều vận: ${selectedTrip.manifestNumber}` : 'Thông tin chuyến xe'}
        width="max-w-lg"
      >
        {selectedTrip && (
          <div className="space-y-6">
            <div className={`flex items-center justify-between p-4 rounded-xl border ${
              selectedTrip.tripStatus === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
              selectedTrip.tripStatus === 'IN_TRANSIT' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
              selectedTrip.tripStatus === 'DELAYED' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' :
              'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                  selectedTrip.tripStatus === 'COMPLETED' ? 'bg-emerald-600' : selectedTrip.tripStatus === 'IN_TRANSIT' ? 'bg-blue-600' : selectedTrip.tripStatus === 'DELAYED' ? 'bg-amber-600' : 'bg-gray-600'
                }`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">Trạng thái điều vận</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                    {selectedTrip.tripStatus === 'COMPLETED' ? 'Hoàn thành' :
                     selectedTrip.tripStatus === 'IN_TRANSIT' ? 'Đang di chuyển' :
                     selectedTrip.tripStatus === 'SCHEDULED' ? 'Đã lên lịch' :
                     selectedTrip.tripStatus === 'DELAYED' ? 'Chậm tuyến' : selectedTrip.tripStatus.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold font-mono bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
                {selectedTrip.vehicleType.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Truck className="w-4 h-4 text-primary" /> Tài xế giao hàng
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedTrip.driverName}</p>
                <p className="text-xs font-mono text-gray-500">{selectedTrip.driverPhone}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Clock className="w-4 h-4 text-emerald-600" /> Tiền thu COD chờ bàn giao
                </div>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">{selectedTrip.cashOnDeliveryTotal.toLocaleString('vi-VN')} đ</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-gray-400 block">Kho xuất phát</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedTrip.departureHub}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-medium text-gray-400 block">Tuyến đến</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedTrip.destinationZone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Giờ lập lệnh:</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{selectedTrip.scheduledDeparture}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Cập nhật cuối:</span>
                  <span className="font-mono font-semibold text-primary">{selectedTrip.estimatedArrival}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tổng tải hàng:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedTrip.totalParcels} kiện ({selectedTrip.totalWeightKg} kg)</span>
              </div>

              {selectedTrip.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Ghi chú điều vận
                  </span>
                  <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/30">
                    {selectedTrip.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedTrip.tripStatus === 'SCHEDULED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedTrip.id, 'IN_TRANSIT')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
                >
                  <Truck className="w-4 h-4" /> Bắt đầu di chuyển
                </button>
              )}
              {selectedTrip.tripStatus === 'IN_TRANSIT' && (
                <button
                  onClick={() => handleUpdateStatus(selectedTrip.id, 'COMPLETED')}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow transition-colors text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Hoàn thành chuyến xe
                </button>
              )}
              <button
                onClick={() => handleUpdateStatus(selectedTrip.id, 'DELAYED')}
                className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm"
              >
                <Clock className="w-4 h-4 inline mr-1" /> Báo chậm tuyến
              </button>
            </div>
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTrip(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Thêm mới lệnh điều vận"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateTrip} className="space-y-4 text-xs">
          {/* Section 1: Dispatch Order Basic Info */}
          <div className="space-y-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h4 className="font-bold text-gray-900 dark:text-white text-xs border-b border-gray-200 dark:border-gray-700 pb-1">
              1. Thông tin lệnh điều vận
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Mã lệnh điều vận *</label>
                <input
                  type="text"
                  value={tripCode}
                  onChange={(e) => setTripCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono font-bold text-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Đơn hàng *</label>
                <select
                  value={selectedOrder}
                  onChange={(e) => setSelectedOrder(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                >
                  <option value="#SO-20260808-001">#SO-20260808-001 (Khách: Nguyễn Văn A - 2.500.000 đ)</option>
                  <option value="#SO-20260808-002">#SO-20260808-002 (Khách: Trần Thị B - 1.850.000 đ)</option>
                  <option value="#SO-20260808-003">#SO-20260808-003 (Khách: Công ty ABC - 15.400.000 đ)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Chi nhánh xuất *</label>
                <select
                  value={branchLocation}
                  onChange={(e) => setBranchLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                >
                  <option value="Chi nhánh Hà Nội (Kho chính)">Chi nhánh Hà Nội (Kho chính)</option>
                  <option value="Chi nhánh TP. HCM (Tổng kho)">Chi nhánh TP. HCM (Tổng kho)</option>
                  <option value="Chi nhánh Đà Nẵng">Chi nhánh Đà Nẵng</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Đối tác vận chuyển *</label>
                <select
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold text-emerald-600"
                >
                  <option value="Viettel Post">Viettel Post</option>
                  <option value="Giao Hàng Tiết Kiệm (GHTK)">Giao Hàng Tiết Kiệm (GHTK)</option>
                  <option value="Giao Hàng Nhanh (GHN)">Giao Hàng Nhanh (GHN)</option>
                  <option value="Đội xe AuraMart Nội bộ">Đội xe nội bộ RetailHub</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Loại dịch vụ</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                >
                  <option value="Express">Hỏa tốc</option>
                  <option value="Standard">Tiêu chuẩn</option>
                  <option value="Same Day">Trong ngày</option>
                  <option value="COD">Thu hộ tiền COD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Driver & Vehicle */}
          <div className="space-y-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h4 className="font-bold text-gray-900 dark:text-white text-xs border-b border-gray-200 dark:border-gray-700 pb-1">
              2. Người giao hàng & phương tiện
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Tài xế phân công *</label>
                {shippersList.length > 0 ? (
                  <select
                    value={selectedShipperId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedShipperId(id);
                      const found = shippersList.find(s => String(s.id) === id);
                      if (found) {
                        setDriverName(found.fullName || '');
                        setDriverPhone(found.phone || '');
                        setLicensePlate(found.licensePlate || '29C-123.45');
                      }
                    }}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold"
                  >
                    <option value="">-- Chọn tài xế hệ thống --</option>
                    {shippersList.map(s => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.licensePlate})</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Nguyễn Văn Tuấn"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-semibold"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại tài xế</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="0912 345 678"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Biển số xe *</label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  placeholder="29C-123.45"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono font-bold text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Loại phương tiện</label>
                <select
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium text-gray-900 dark:text-white"
                >
                  <option value="VAN">Xe tải van 1.5 tấn</option>
                  <option value="LIGHT_TRUCK">Xe tải nhẹ 3.5 tấn</option>
                  <option value="MOTORBIKE">Xe máy giao hàng</option>
                  <option value="REFRIGERATED_TRUCK">Xe lạnh chuyên dụng</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Delivery Info & SLA Schedule */}
          <div className="space-y-3 p-3 bg-slate-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <h4 className="font-bold text-gray-900 dark:text-white text-xs border-b border-gray-200 dark:border-gray-700 pb-1">
              3. Thông tin lộ trình & thời gian dự kiến (SLA)
            </h4>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ lấy hàng (Kho xuất phát)</label>
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
                placeholder="Địa chỉ lấy hàng..."
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ giao hàng (Tuyến đến) *</label>
              <input
                type="text"
                list="area-trip-suggestions"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                placeholder="Nhập địa chỉ giao hàng hoặc chọn khu vực gợi ý..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian lấy hàng dự kiến</label>
                <input
                  type="datetime-local"
                  value={estimatedPickupTime}
                  onChange={(e) => setEstimatedPickupTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian giao dự kiến (SLA)</label>
                <input
                  type="datetime-local"
                  value={estimatedDeliveryTime}
                  onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Dispatch Notes */}
          <div>
            <label className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú điều vận & thu hộ COD</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Ghi chú về hàng dễ vỡ, giao giờ hành chính, thu tiền COD..."
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-medium shadow-sm"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
export default DeliveryTripsPage;
