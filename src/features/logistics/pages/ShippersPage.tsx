import { useMemo, useState } from 'react';
import { Plus, Download, Search, Filter, Eye, Truck, Star, Phone, Mail, MapPin, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';

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

const MOCK_SHIPPERS: ShipperPartnerRecord[] = [
  { id: '1', partnerCode: 'SHP-DHL-EXP', companyName: 'DHL Global Express logistics', contactPerson: 'Heinrich Zimmer', contactPhone: '+1 (800) 225-5345', contactEmail: 'h.zimmer@dhl-partners.com', serviceTier: 'EXPRESS_AIR', baseRatePerKg: 12.50, activeFleetSize: 450, averageDeliveryHours: 24, slaComplianceRate: 99.4, status: 'ACTIVE', headquarters: 'Bonn, Germany / Americas HQ Miami', notes: 'Preferred partner for high-value enterprise serial electronics and urgent cross-border replacement parts.' },
  { id: '2', partnerCode: 'SHP-FEDEX-GND', companyName: 'FedEx Freight Standard Ground', contactPerson: 'Sarah Jenkins', contactPhone: '+1 (800) 463-3339', contactEmail: 'dispatch@fedex-commercial.net', serviceTier: 'STANDARD_GROUND', baseRatePerKg: 4.25, activeFleetSize: 1200, averageDeliveryHours: 72, slaComplianceRate: 98.1, status: 'ACTIVE', headquarters: 'Memphis, TN', notes: 'Handles heavy retail shelving fixtures and bulk packaging supply distribution across North America.' },
  { id: '3', partnerCode: 'SHP-SWIFT-SAME', companyName: 'Swift Same-Day Metro Dispatch', contactPerson: 'Alex Rivera', contactPhone: '+1 (555) 312-9900', contactEmail: 'ops@swift-sameday.org', serviceTier: 'SAME_DAY_COURIER', baseRatePerKg: 18.00, activeFleetSize: 85, averageDeliveryHours: 4, slaComplianceRate: 96.8, status: 'ACTIVE', headquarters: 'Downtown Logistics Strip, NY', notes: 'Guarantees 4-hour local fulfillment for premium VIP loyalty client cart orders.' },
  { id: '4', partnerCode: 'SHP-HEAVY-X', companyName: 'Titan Freight & Rigging', contactPerson: 'Bruce Banner', contactPhone: '+1 (555) 888-1122', contactEmail: 'logistics@titan-heavy.com', serviceTier: 'HEAVY_FREIGHT_PALLET', baseRatePerKg: 2.10, activeFleetSize: 40, averageDeliveryHours: 120, slaComplianceRate: 92.5, status: 'ON_HOLD', headquarters: 'Industrial District, Chicago', notes: 'Account currently on hold pending annual SLA performance review and insurance bond renewal.' },
];

const tierStyles = {
  EXPRESS_AIR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200',
  SAME_DAY_COURIER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200',
  STANDARD_GROUND: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
  HEAVY_FREIGHT_PALLET: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200',
};

const shipperStatusLabels = {
  ACTIVE: 'Đang hoạt động',
  ON_HOLD: 'Tạm dừng',
  CONTRACT_PENDING: 'Chờ hợp đồng',
  TERMINATED: 'Đã chấm dứt',
} as const;

export function ShippersPage() {
  const [data] = useState<ShipperPartnerRecord[]>(MOCK_SHIPPERS);
  const [search, setSearch] = useState('');
  const [selectedShipper, setSelectedShipper] = useState<ShipperPartnerRecord | null>(null);

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
        header: 'Công ty đối tác & Người phụ trách',
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierStyles[t]}`}>
              {t.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'baseRatePerKg',
        header: 'Cước cơ bản',
        cell: (info) => <span className="font-mono font-bold text-gray-900 dark:text-white">${(info.getValue() as number).toFixed(2)} / kg</span>,
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
        cell: (info) => <span className="font-mono text-gray-700 dark:text-gray-300">{info.getValue() as number} units</span>,
      },
      {
        accessorKey: 'status',
        header: 'Tình trạng hợp đồng',
        cell: (info) => {
          const status = info.getValue() as keyof typeof shipperStatusLabels;
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
              status === 'ON_HOLD' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
              status === 'CONTRACT_PENDING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {shipperStatusLabels[status] ?? status.replace(/_/g, ' ')}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Hành động',
        cell: ({ row }) => (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedShipper(row.original); }}
            className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đối tác vận chuyển & SLA</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quản lý đối tác logistics (3PL), đánh giá tỷ lệ SLA và xem lịch cước vận chuyển. Nhấn vào đối tác để xem chi tiết.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Xuất ma trận đối tác
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Thêm đối tác 3PL
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
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Lọc SLA
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} />
      </div>

      <Drawer
        isOpen={!!selectedShipper}
        onClose={() => setSelectedShipper(null)}
        title={selectedShipper ? `Hồ sơ đối tác: ${selectedShipper.partnerCode}` : 'Thông tin đối tác'}
        width="max-w-lg"
      >
        {selectedShipper && (
          <div className="space-y-6">
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Tỷ lệ SLA</p>
                  <p className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">{selectedShipper.slaComplianceRate.toFixed(1)}%</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                selectedShipper.status === 'ACTIVE' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedShipper.status === 'ON_HOLD' ? 'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100' :
                'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              }`}>
                {selectedShipper.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <Star className="w-4 h-4 text-emerald-500" /> Tài sản đội xe
                </div>
                <p className="text-xl font-mono font-bold text-gray-900 dark:text-white truncate">{selectedShipper.activeFleetSize} xe</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <FileText className="w-4 h-4 text-primary" /> Tốc độ thực hiện
                </div>
                <p className="text-xl font-bold font-mono text-primary truncate">~{selectedShipper.averageDeliveryHours} giờ</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Đơn vị logistics</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{selectedShipper.companyName}</h3>
                <span className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full font-bold border ${tierStyles[selectedShipper.serviceTier]}`}>
                  Loại dịch vụ: {selectedShipper.serviceTier.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-2 pt-1 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="font-mono">{selectedShipper.contactPhone}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{selectedShipper.contactEmail}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>Trụ sở: <strong className="text-gray-900 dark:text-white">{selectedShipper.headquarters}</strong></span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Cước vận chuyển:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">${selectedShipper.baseRatePerKg.toFixed(2)} / kg</span>
              </div>

              {selectedShipper.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Ghi chú đánh giá hợp đồng</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">{selectedShipper.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedShipper.status !== 'ACTIVE' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Activate Carrier Contract
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <ShieldCheck className="w-4 h-4 inline mr-1" /> Review Insurance Bond
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
