import { useMemo, useState } from 'react';
import { Plus, Download, Search, Filter, Eye, Truck, CheckCircle2, Clock, Navigation, AlertTriangle, UserCheck, DollarSign, MapPin } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Drawer } from '@/shared/components/ui/Drawer';
import type { ColumnDef } from '@tanstack/react-table';

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

const MOCK_TRIPS: DeliveryTripRecord[] = [
  { id: '1', manifestNumber: 'TRIP-2024-001', driverName: 'Marcus Aurelius', driverPhone: '+1 (555) 912-3456', vehiclePlate: '59C-881.02', vehicleType: 'REFRIGERATED_TRUCK', departureHub: 'Central Distribution Warehouse', destinationZone: 'Downtown Retail Stores (Zone A)', scheduledDeparture: '2024-05-18 06:00', actualDeparture: '2024-05-18 06:15', estimatedArrival: '2024-05-18 10:30', totalParcels: 42, totalWeightKg: 1850.5, tripStatus: 'IN_TRANSIT', cashOnDeliveryTotal: 4500.00, notes: 'Carrying temperature-sensitive dairy and beverage stock. Cabin cooling unit verified at 4°C.' },
  { id: '2', manifestNumber: 'TRIP-2024-002', driverName: 'Lucius Vorenus', driverPhone: '+1 (555) 819-2034', vehiclePlate: '29D-445.19', vehicleType: 'LIGHT_TRUCK', departureHub: 'North Suburb Annex', destinationZone: 'Industrial Park (Zone D)', scheduledDeparture: '2024-05-18 08:30', estimatedArrival: '2024-05-18 12:00', totalParcels: 18, totalWeightKg: 920.0, tripStatus: 'SCHEDULED', cashOnDeliveryTotal: 1200.00 },
  { id: '3', manifestNumber: 'TRIP-2024-003', driverName: 'Titus Pullo', driverPhone: '+1 (555) 777-8811', vehiclePlate: '61A-901.55', vehicleType: 'VAN', departureHub: 'Westside Logistics Hub', destinationZone: 'Metro Airport Strip (Zone B)', scheduledDeparture: '2024-05-17 14:00', actualDeparture: '2024-05-17 14:05', estimatedArrival: '2024-05-17 17:45', totalParcels: 55, totalWeightKg: 640.0, tripStatus: 'COMPLETED', cashOnDeliveryTotal: 8900.50, notes: 'All cash on delivery receipts handed over to HQ treasury desk successfully.' },
  { id: '4', manifestNumber: 'TRIP-2024-004', driverName: 'Gaius Julius', driverPhone: '+1 (555) 333-4444', vehiclePlate: '59B-112.99', vehicleType: 'MOTORBIKE', departureHub: 'Central Distribution Warehouse', destinationZone: 'Highland Ridge (Zone C)', scheduledDeparture: '2024-05-18 09:00', estimatedArrival: '2024-05-18 14:00', totalParcels: 8, totalWeightKg: 45.0, tripStatus: 'DELAYED', cashOnDeliveryTotal: 340.00, notes: 'Heavy monsoon downpour reported along mountainous pass. Driver sheltering at rest stop.' },
];

export function DeliveryTripsPage() {
  const [data] = useState<DeliveryTripRecord[]>(MOCK_TRIPS);
  const [search, setSearch] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<DeliveryTripRecord | null>(null);

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
        header: 'Manifest ID',
        cell: (info) => <span className="font-mono font-bold text-primary hover:underline">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'driverName',
        header: 'Assigned Driver & Vehicle',
        cell: ({ row }) => (
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.original.driverName}</p>
            <p className="text-xs font-mono text-gray-500">{row.original.vehiclePlate} ({row.original.vehicleType.replace('_', ' ')})</p>
          </div>
        ),
      },
      {
        accessorKey: 'destinationZone',
        header: 'Destination Route',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white truncate max-w-xs block">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'totalParcels',
        header: 'Parcels',
        cell: ({ row }) => (
          <div>
            <span className="font-bold text-gray-900 dark:text-white">{row.original.totalParcels} boxes</span>
            <span className="text-xs text-gray-400 block font-mono">{row.original.totalWeightKg} kg</span>
          </div>
        ),
      },
      {
        accessorKey: 'cashOnDeliveryTotal',
        header: 'COD Collection',
        cell: (info) => <span className="font-mono font-bold text-primary">${(info.getValue() as number).toFixed(2)}</span>,
      },
      {
        accessorKey: 'tripStatus',
        header: 'Status',
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
              {status.replace('_', ' ')}
            </span>
          );
        },
      },
      {
        accessorKey: 'scheduledDeparture',
        header: 'Departure Time',
        cell: (info) => <span className="text-gray-500 text-sm font-mono">{info.getValue() as string}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedTrip(row.original); }}
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery Route Trips Manifest</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Coordinate inter-store transit manifests, track courier fleet vehicles, monitor COD collections and manage route delays. Click any trip for details.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm">
              <Download className="w-4 h-4" /> Export Dispatch Log
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
              <Plus className="w-4 h-4" /> Dispatch New manifest
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
              placeholder="Search by manifest ID, driver name, vehicle plate or destination..."
              className="block w-full sm:max-w-xs pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Filter Routes
          </button>
        </div>

        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelectedTrip(row)} />
      </div>

      <Drawer
        isOpen={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
        title={selectedTrip ? `Fleet Manifest: ${selectedTrip.manifestNumber}` : 'Manifest Dossier'}
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
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Fleet Dispatch Status</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white uppercase mt-0.5">{selectedTrip.tripStatus.replace('_', ' ')}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                selectedTrip.tripStatus === 'COMPLETED' ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100' :
                selectedTrip.tripStatus === 'IN_TRANSIT' ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' :
                'bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100'
              }`}>
                {selectedTrip.vehicleType.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <UserCheck className="w-4 h-4 text-primary" /> Courier Assigned
                </div>
                <p className="text-base font-bold text-gray-900 dark:text-white truncate">{selectedTrip.driverName}</p>
                <p className="text-xs font-mono text-gray-500">{selectedTrip.driverPhone}</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> Pending COD Handover
                </div>
                <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">${selectedTrip.cashOnDeliveryTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-sm">
              <div className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Departure Hub</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedTrip.departureHub}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-gray-700 dark:text-gray-300 pt-2 border-t border-gray-200 dark:border-gray-700">
                <Navigation className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Destination Zone</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedTrip.destinationZone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Scheduled Departure:</span>
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{selectedTrip.scheduledDeparture}</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Estimated Arrival:</span>
                  <span className="font-mono font-semibold text-primary">{selectedTrip.estimatedArrival}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Total Cargo Load:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedTrip.totalParcels} boxes ({selectedTrip.totalWeightKg} kg net)</span>
              </div>

              {selectedTrip.notes && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Operations Dispatch Notes
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-amber-50 dark:bg-amber-900/10 p-2 rounded border border-amber-200 dark:border-amber-900/30">
                    {selectedTrip.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
              {selectedTrip.tripStatus === 'IN_TRANSIT' && (
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow transition-colors text-sm">
                  <CheckCircle2 className="w-4 h-4" /> Confirm Hub Arrival
                </button>
              )}
              <button className="px-4 py-2.5 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 transition-colors text-sm">
                <Clock className="w-4 h-4 inline mr-1" /> Log Transit Delay
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
