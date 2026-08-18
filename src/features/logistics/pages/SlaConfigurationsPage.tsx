import { useMemo, useState } from 'react';
import { Plus, Search, Filter, Eye, Edit, Trash2, Clock, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

export interface SlaConfigRecord {
  id: string;
  slaCode: string; // SLA-000001
  slaName: string;
  carrierName: string;
  shippingMethod: string;
  areaType: string;
  slaType: 'PICKUP' | 'DELIVERY' | 'RETURN';
  minDuration: number;
  maxDuration: number;
  durationUnit: 'HOURS' | 'DAYS';
  cutoffTime: string; // 16:00
  isBusinessDaysOnly: boolean;
  includeHolidays: boolean;
  warningThresholdPercent: number; // e.g. 80%
  breachThresholdPercent: number; // e.g. 100%
  status: 'ACTIVE' | 'LOCKED';
}

export function SlaConfigurationsPage() {
  const [slas, setSlas] = useState<SlaConfigRecord[]>([
    {
      id: '1',
      slaCode: 'SLA-000001',
      slaName: 'SLA Giao Hỏa Tốc Nội Thành 4H',
      carrierName: 'Viettel Post Express',
      shippingMethod: 'Giao Hỏa Tốc',
      areaType: 'Nội thành Hà Nội & TP.HCM',
      slaType: 'DELIVERY',
      minDuration: 2,
      maxDuration: 4,
      durationUnit: 'HOURS',
      cutoffTime: '17:00',
      isBusinessDaysOnly: false,
      includeHolidays: false,
      warningThresholdPercent: 80,
      breachThresholdPercent: 100,
      status: 'ACTIVE',
    },
    {
      id: '2',
      slaCode: 'SLA-000002',
      slaName: 'SLA Chuyển Phát Tiêu Chuẩn Liên Tỉnh',
      carrierName: 'GHTK Tiết Kiệm',
      shippingMethod: 'Giao Tiêu Chuẩn',
      areaType: 'Liên tỉnh',
      slaType: 'DELIVERY',
      minDuration: 2,
      maxDuration: 3,
      durationUnit: 'DAYS',
      cutoffTime: '16:00',
      isBusinessDaysOnly: true,
      includeHolidays: false,
      warningThresholdPercent: 85,
      breachThresholdPercent: 100,
      status: 'ACTIVE',
    },
  ]);

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<Partial<SlaConfigRecord>>({});

  const filtered = useMemo(() => {
    return slas.filter(
      (s) =>
        s.slaCode.toLowerCase().includes(search.toLowerCase()) ||
        s.slaName.toLowerCase().includes(search.toLowerCase()) ||
        s.carrierName.toLowerCase().includes(search.toLowerCase())
    );
  }, [slas, search]);

  const handleOpenCreate = () => {
    setFormState({
      slaCode: `SLA-${String(slas.length + 1).padStart(6, '0')}`,
      slaName: '',
      carrierName: 'Viettel Post',
      shippingMethod: 'Giao Hỏa Tốc',
      areaType: 'Nội thành',
      slaType: 'DELIVERY',
      minDuration: 4,
      maxDuration: 24,
      durationUnit: 'HOURS',
      cutoffTime: '16:00',
      isBusinessDaysOnly: true,
      includeHolidays: false,
      warningThresholdPercent: 80,
      breachThresholdPercent: 100,
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.slaName?.trim()) {
      toast.error('Tên cấu hình SLA không được để trống!');
      return;
    }

    const newRec: SlaConfigRecord = {
      id: String(Date.now()),
      slaCode: formState.slaCode || `SLA-${Date.now()}`,
      slaName: formState.slaName,
      carrierName: formState.carrierName || 'Carrier',
      shippingMethod: formState.shippingMethod || 'Giao hàng',
      areaType: formState.areaType || 'Toàn quốc',
      slaType: formState.slaType as any || 'DELIVERY',
      minDuration: Number(formState.minDuration) || 1,
      maxDuration: Number(formState.maxDuration) || 24,
      durationUnit: formState.durationUnit as any || 'HOURS',
      cutoffTime: formState.cutoffTime || '16:00',
      isBusinessDaysOnly: Boolean(formState.isBusinessDaysOnly),
      includeHolidays: Boolean(formState.includeHolidays),
      warningThresholdPercent: Number(formState.warningThresholdPercent) || 80,
      breachThresholdPercent: Number(formState.breachThresholdPercent) || 100,
      status: formState.status as any || 'ACTIVE',
    };

    setSlas([newRec, ...slas]);
    toast.success(`Đã lưu cấu hình SLA ${newRec.slaCode}!`);
    setIsModalOpen(false);
  };

  const columns = useMemo<ColumnDef<SlaConfigRecord>[]>(
    () => [
      {
        accessorKey: 'slaCode',
        header: 'Mã SLA',
        cell: (info) => (
          <span className="font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'slaName',
        header: 'Tên SLA & Loại',
        cell: ({ row }) => (
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{row.original.slaName}</p>
            <p className="text-xs text-gray-500">{row.original.carrierName} ({row.original.shippingMethod})</p>
          </div>
        ),
      },
      {
        accessorKey: 'maxDuration',
        header: 'Thời gian cam kết',
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              {row.original.minDuration} - {row.original.maxDuration} {row.original.durationUnit === 'HOURS' ? 'Giờ' : 'Ngày'}
            </p>
            <p className="text-gray-500">Cut-off: {row.original.cutoffTime}</p>
          </div>
        ),
      },
      {
        accessorKey: 'warningThresholdPercent',
        header: 'Cảnh báo Breach %',
        cell: ({ row }) => (
          <div className="font-mono text-xs">
            <p className="text-amber-600 font-bold">Warning: {row.original.warningThresholdPercent}% SLA</p>
            <p className="text-rose-600 font-bold">Breach: {row.original.breachThresholdPercent}% SLA</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => (
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${info.getValue() === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200'}`}>
            {info.getValue() === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm khóa'}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-7 h-7 text-primary" /> Cấu Hình SLA Vận Chuyển
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Thiết lập thời gian cam kết lấy hàng, giao hàng và ngưỡng cảnh báo quá hạn SLA cho đối tác.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Thêm SLA Mới
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên SLA, mã SLA, tên hãng vận chuyển..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <ReusableDataTable columns={columns} data={filtered} />
      </div>

      {/* Modal Form Thêm SLA (Form 16) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cấu Hình Quy Tắc SLA Mới"
        width="max-w-2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã SLA *</label>
              <input
                type="text"
                required
                value={formState.slaCode || ''}
                onChange={(e) => setFormState({ ...formState, slaCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên quy tắc SLA *</label>
              <input
                type="text"
                required
                placeholder="SLA Giao Hỏa Tốc..."
                value={formState.slaName || ''}
                onChange={(e) => setFormState({ ...formState, slaName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại SLA *</label>
              <select
                value={formState.slaType || 'DELIVERY'}
                onChange={(e) => setFormState({ ...formState, slaType: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
              >
                <option value="PICKUP">PICKUP - Lấy hàng</option>
                <option value="DELIVERY">DELIVERY - Giao hàng</option>
                <option value="RETURN">RETURN - Hoàn hàng</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thời gian cam kết (Max)</label>
              <input
                type="number"
                value={formState.maxDuration || 24}
                onChange={(e) => setFormState({ ...formState, maxDuration: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Đơn vị *</label>
              <select
                value={formState.durationUnit || 'HOURS'}
                onChange={(e) => setFormState({ ...formState, durationUnit: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 text-sm"
              >
                <option value="HOURS">Giờ</option>
                <option value="DAYS">Ngày</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-semibold shadow"
            >
              Lưu Cấu Hình SLA
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
