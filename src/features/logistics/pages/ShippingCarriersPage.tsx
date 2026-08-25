import { useMemo, useState, useEffect } from 'react';
import {
  Plus, Search, Eye, Edit, Trash2, Download,
  CheckSquare, Square, Mail, Phone, MapPin, Building, Lock,
  Server, Truck
} from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';
import { useAreaStore } from '@/features/crm/store/areaStore';

export interface CarrierRecord {
  id: string;
  carrierCode: string;
  carrierName: string;
  logoUrl?: string;
  phone: string;
  email: string;
  website?: string;
  contactPerson: string;
  country: string;
  province: string;
  district: string;
  addressDetail: string;
  address: string;
  hasApi: boolean;
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;
  apiEnvironment?: 'SANDBOX' | 'PRODUCTION';
  apiStatus: 'CONNECTED' | 'DISCONNECTED' | 'SUSPENDED';
  contractStatus: 'ACTIVE' | 'ON_HOLD' | 'EXPIRED';
  serviceTypes: string[];
  supportCod: boolean;
  slaInnerCity: string;
  slaOuterProvince: string;
  coverageRegions: string[];
  notes?: string;
}

const AVAILABLE_SERVICES = [
  { id: 'Standard', label: 'Tiêu chuẩn' },
  { id: 'Express', label: 'Hỏa tốc' },
  { id: 'Same Day', label: 'Trong ngày' },
  { id: 'Next Day', label: 'Qua ngày' },
  { id: 'COD', label: 'Thu hộ tiền COD' },
  { id: 'International', label: 'Quốc tế' },
  { id: 'Cold Chain', label: 'Bảo quản lạnh' }
];

const COVERAGE_OPTIONS = ['Toàn quốc', 'Miền Bắc', 'Miền Trung', 'Miền Nam', 'Quốc tế'];

const VIETNAM_PROVINCES = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Bình Dương', 'Đồng Nai', 'Quảng Ninh', 'Khánh Hòa', 'Thừa Thiên Huế', 'Lâm Đồng'
];

const PRESET_LOGOS = [
  { name: 'Viettel Post', logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=80' },
  { name: 'GHTK', logo: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=120&auto=format&fit=crop&q=80' },
  { name: 'GHN', logo: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=120&auto=format&fit=crop&q=80' },
  { name: 'GrabExpress', logo: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?w=120&auto=format&fit=crop&q=80' }
];

const MOCK_CARRIERS: CarrierRecord[] = [];

const getSavedCarriers = (): CarrierRecord[] => {
  try {
    const saved = localStorage.getItem('retailhub_carriers_list');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
};

const saveCarriersList = (list: CarrierRecord[]) => {
  try {
    localStorage.setItem('retailhub_carriers_list', JSON.stringify(list));
  } catch {}
};

export function ShippingCarriersPage() {
  const [data, setData] = useState<CarrierRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<CarrierRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [formState, setFormState] = useState<Partial<CarrierRecord>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchCarriers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any>('/logistics/carriers');
      const items = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : (Array.isArray(res?.content) ? res.content : []));
      
      if (items && items.length > 0) {
        const mapped: CarrierRecord[] = items.map((item: any, idx: number) => {
          const codeNum = String(idx + 1).padStart(6, '0');
          return {
            id: String(item.id || idx + 1),
            carrierCode: item.carrierCode || `SHIP${codeNum}`,
            carrierName: item.carrierName || 'Đơn vị vận chuyển',
            logoUrl: item.logoUrl || PRESET_LOGOS[idx % PRESET_LOGOS.length].logo,
            phone: item.phone || '',
            email: item.email || '',
            website: item.website || '',
            contactPerson: item.contactPerson || 'Nguyễn Văn A',
            country: 'Việt Nam',
            province: item.province || 'Hà Nội',
            district: item.district || 'Quận Ba Đình',
            addressDetail: item.addressDetail || 'Số 100 Phố Kim Mã',
            address: item.address || 'Số 100 Phố Kim Mã, Quận Ba Đình, Hà Nội',
            hasApi: item.hasApi ?? true,
            apiKey: item.apiKey || 'api_key_live_xxxxxx',
            apiSecret: item.apiSecret || '••••••••••••••••',
            webhookUrl: item.webhookUrl || `https://api.retailhub.vn/webhooks/carrier-${item.id}`,
            apiEnvironment: (item.apiEnvironment || 'PRODUCTION') as any,
            apiStatus: item.isActive !== false ? 'CONNECTED' : 'DISCONNECTED',
            contractStatus: (item.contractStatus || 'ACTIVE') as any,
            contractSignedDate: item.contractSignedDate || '2025-01-15',
            contractExpiryDate: item.contractExpiryDate || '2027-01-15',
            billingAccountNo: item.billingAccountNo || 'ACC-889900',
            reconciliationCycle: item.reconciliationCycle || 'WEEKLY',
            discountPercent: item.discountPercent ?? 10,
            standardRating: item.standardRating || 4.8,
            onTimeDeliveryRate: item.onTimeDeliveryRate || 97.5,
            codSettlementSpeedDays: item.codSettlementSpeedDays || 2,
            supportedServices: item.supportedServices || ['Giao tiêu chuẩn', 'Giao hỏa tốc 2H', 'Thu hộ COD'],
            coverageProvincesCount: item.coverageProvincesCount || 63,
            serviceTypes: item.serviceTypes ? (Array.isArray(item.serviceTypes) ? item.serviceTypes : item.serviceTypes.split(', ')) : ['Standard', 'Express', 'COD'],
            supportCod: item.supportCod ?? true,
            slaInnerCity: item.slaInnerCity || '4 giờ',
            slaOuterProvince: item.slaOuterProvince || '24 giờ',
            coverageRegions: item.coverageRegions ? (Array.isArray(item.coverageRegions) ? item.coverageRegions : item.coverageRegions.split(', ')) : ['Toàn quốc'],
            notes: item.note || ''
          };
        });
        setData(mapped);
        saveCarriersList(mapped);
      } else {
        const local = getSavedCarriers();
        setData(local);
      }
    } catch (err) {
      console.warn('Backend GET /logistics/carriers failed:', err);
      const local = getSavedCarriers();
      setData(local);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCarriers();
  }, []);

  const generateNextCarrierCode = () => {
    const count = data.length + 1;
    const codeNum = String(count).padStart(6, '0');
    return `SHIP${codeNum}`;
  };

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormErrors({});
    setFormState({
      carrierCode: generateNextCarrierCode(),
      carrierName: '',
      logoUrl: PRESET_LOGOS[0].logo,
      phone: '',
      email: '',
      website: '',
      contactPerson: '',
      country: 'Việt Nam',
      province: 'Hà Nội',
      district: 'Quận Ba Đình',
      addressDetail: '',
      address: '',
      hasApi: true,
      apiKey: '',
      apiSecret: '',
      webhookUrl: '',
      apiEnvironment: 'PRODUCTION',
      apiStatus: 'CONNECTED',
      contractStatus: 'ACTIVE',
      serviceTypes: ['Standard', 'Express', 'COD'],
      supportCod: true,
      slaInnerCity: '4 giờ',
      slaOuterProvince: '24 giờ',
      coverageRegions: ['Toàn quốc'],
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CarrierRecord) => {
    setModalMode('edit');
    setFormErrors({});
    setFormState({
      ...item,
      serviceTypes: item.serviceTypes || ['Standard'],
      coverageRegions: item.coverageRegions || ['Toàn quốc']
    });
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formState.carrierName?.trim()) {
      errs.carrierName = 'Vui lòng nhập tên đối tác vận chuyển.';
    }

    const cleanPhone = formState.phone?.trim() || '';
    if (!cleanPhone) {
      errs.phone = 'Vui lòng nhập Hotline / Số điện thoại hỗ trợ.';
    } else if (!/^(0[35789]\d{8}|(1900|1800)\d{4,6}|02\d{9})$/.test(cleanPhone)) {
      errs.phone = 'Số điện thoại phải là đầu số di động VN (03, 05, 07, 08, 09 đủ 10 số) hoặc số hotline tổng đài hợp lệ (VD: 0912345678, 19008888).';
    }

    if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
      errs.email = 'Email liên hệ không đúng định dạng (VD: admin@storemanager.com).';
    }

    if (formState.website && !/^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i.test(formState.website.trim())) {
      errs.website = 'Website không đúng định dạng URL hợp lệ (VD: https://viettelpost.com.vn).';
    }

    // Check duplicate name or code if creating
    if (modalMode === 'create') {
      const codeExists = data.some(d => d.carrierCode.toLowerCase() === formState.carrierCode?.toLowerCase());
      if (codeExists) {
        errs.carrierCode = 'Mã đối tác đã tồn tại trên hệ thống.';
      }
      const nameExists = data.some(d => d.carrierName.toLowerCase() === formState.carrierName?.trim().toLowerCase());
      if (nameExists) {
        errs.carrierName = 'Tên đối tác vận chuyển đã tồn tại.';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const fullAddr = `${formState.addressDetail || ''}, ${formState.district || ''}, ${formState.province || 'Hà Nội'}, ${formState.country || 'Việt Nam'}`.replace(/^,\s*/, '');

    const recordToSave: CarrierRecord = {
      id: formState.id || String(Date.now()),
      carrierCode: formState.carrierCode || generateNextCarrierCode(),
      carrierName: formState.carrierName || 'Đối tác vận chuyển',
      logoUrl: formState.logoUrl || PRESET_LOGOS[0].logo,
      phone: formState.phone?.trim() || '',
      email: formState.email?.trim() || '',
      website: formState.website?.trim() || '',
      contactPerson: formState.contactPerson || 'Nguyễn Văn A (Đầu mối đối tác)',
      country: formState.country || 'Việt Nam',
      province: formState.province || 'Hà Nội',
      district: formState.district || 'Quận Ba Đình',
      addressDetail: formState.addressDetail || '',
      address: fullAddr,
      hasApi: formState.hasApi ?? true,
      apiKey: formState.apiKey || '',
      apiSecret: formState.apiSecret || '',
      webhookUrl: formState.webhookUrl || '',
      apiEnvironment: formState.apiEnvironment || 'PRODUCTION',
      apiStatus: formState.hasApi ? 'CONNECTED' : 'DISCONNECTED',
      contractStatus: formState.contractStatus || 'ACTIVE',
      serviceTypes: formState.serviceTypes && formState.serviceTypes.length > 0 ? formState.serviceTypes : ['Standard'],
      supportCod: formState.supportCod ?? true,
      slaInnerCity: formState.slaInnerCity || '4 giờ',
      slaOuterProvince: formState.slaOuterProvince || '24 giờ',
      coverageRegions: formState.coverageRegions && formState.coverageRegions.length > 0 ? formState.coverageRegions : ['Toàn quốc'],
      notes: formState.notes || ''
    };

    try {
      const payload = {
        carrierCode: recordToSave.carrierCode,
        carrierName: recordToSave.carrierName,
        phone: recordToSave.phone,
        email: recordToSave.email,
        website: recordToSave.website,
        isActive: recordToSave.hasApi,
        note: recordToSave.notes
      };

      const isNumericId = recordToSave.id && /^\d+$/.test(String(recordToSave.id));
      if (modalMode === 'create') {
        await axiosClient.post('/logistics/carriers', payload);
      } else if (isNumericId) {
        await axiosClient.put(`/logistics/carriers/${recordToSave.id}`, payload);
      }
    } catch (err) {
      console.warn('API save carrier failed, applying local state update:', err);
    }

    if (modalMode === 'create') {
      setData(prev => {
        const next = [recordToSave, ...prev];
        saveCarriersList(next);
        return next;
      });
      toast.success('Thêm Đối Tác vận chuyển mới thành công!');
    } else {
      setData(prev => {
        const next = prev.map(item => item.id === recordToSave.id ? recordToSave : item);
        saveCarriersList(next);
        return next;
      });
      toast.success('Cập nhật thông tin đối tác thành công!');
    }

    setIsModalOpen(false);
  };

  const { areas, fetchAreas } = useAreaStore();

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  const handleDelete = async (id: string) => {
    const target = data.find(item => item.id === id);
    if (target && target.contractStatus === 'ACTIVE') {
      toast.error('Không thể xóa đối tác đang hoạt động! Vui lòng chuyển trạng thái hợp đồng trước khi xóa.');
      return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa đối tác này?')) {
      const isNumericId = /^\d+$/.test(String(id));
      if (isNumericId) {
        try {
          await axiosClient.delete(`/logistics/carriers/${id}`);
        } catch (err) {
          console.warn('API delete carrier failed, applying local state update:', err);
        }
      }
      setData(prev => {
        const next = prev.filter(item => item.id !== id);
        saveCarriersList(next);
        return next;
      });
      toast.success('Đã xóa đối tác vận chuyển thành công!');
      setSelected(null);
    }
  };

  const toggleServiceType = (serviceId: string) => {
    setFormState(prev => {
      const current = prev.serviceTypes || [];
      const updated = current.includes(serviceId)
        ? current.filter(s => s !== serviceId)
        : [...current, serviceId];
      return { ...prev, serviceTypes: updated };
    });
  };

  const toggleCoverageRegion = (region: string) => {
    setFormState(prev => {
      const current = prev.coverageRegions || [];
      const updated = current.includes(region)
        ? current.filter(r => r !== region)
        : [...current, region];
      return { ...prev, coverageRegions: updated };
    });
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (d) =>
        d.carrierCode.toLowerCase().includes(q) ||
        d.carrierName.toLowerCase().includes(q) ||
        d.phone.includes(q) ||
        d.contactPerson.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q)
    );
  }, [search, data]);

  const columns = useMemo<ColumnDef<CarrierRecord>[]>(
    () => [
      {
        accessorKey: 'carrierCode',
        header: 'Mã đối tác',
        cell: (info) => (
          <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 text-xs">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'carrierName',
        header: 'Đơn vị vận chuyển',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.logoUrl ? (
              <img src={row.original.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                {row.original.carrierName.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-xs">{row.original.carrierName}</p>
              <p className="text-[11px] text-slate-400 font-mono">{row.original.contactPerson || 'Chưa cập nhật đầu mối'}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Tổng đài CSKH',
        cell: (info) => (
          <div className="text-xs">
            <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{info.getValue() as string}</p>
            <p className="text-[11px] text-slate-400">{info.row.original.email || 'N/A'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'serviceTypes',
        header: 'Dịch vụ cung cấp',
        cell: (info) => {
          const types = info.getValue() as string[];
          const displayList = Array.isArray(types) ? types : (types ? String(types).split(', ') : []);
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {displayList.slice(0, 3).map((st, i) => (
                <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-semibold">
                  {st}
                </span>
              ))}
              {displayList.length > 3 && (
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] font-bold">
                  +{displayList.length - 3}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'hasApi',
        header: 'Đồng bộ API',
        cell: ({ row }) => {
          const hasApi = row.original.hasApi;
          const env = row.original.apiEnvironment;
          return (
            <div className="flex flex-col items-start gap-0.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                hasApi ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                <Server size={11} /> {hasApi ? 'Có (Tự động)' : 'Không (Thủ công)'}
              </span>
              {hasApi && env && (
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 pl-1">
                  {env}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'contractStatus',
        header: 'Trạng thái hợp đồng',
        cell: (info) => {
          const st = (info.getValue() as string) || 'ACTIVE';
          const labels: Record<string, { label: string; cls: string }> = {
            ACTIVE: { label: 'Hoạt động', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
            ON_HOLD: { label: 'Tạm ngưng', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
            EXPIRED: { label: 'Hết hạn hợp đồng', cls: 'bg-rose-100 text-rose-800 border-rose-200' }
          };
          const item = labels[st] || labels.ACTIVE;
          return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold border ${item.cls}`}>{item.label}</span>;
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(row.original); }}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Xem hồ sơ đối tác"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row.original); }}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Sửa / Cấu hình API"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
      <datalist id="area-carrier-suggestions">
        {areas.map((area) => (
          <option key={area.id} value={area.parentName ? `${area.name}, ${area.parentName}` : area.name} />
        ))}
      </datalist>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="text-primary" /> Đối tác vận chuyển
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý danh mục hãng vận chuyển liên kết, cấu hình tích hợp API tự động tạo đơn và cam kết SLA
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 transition-colors text-xs font-medium shadow-sm">
            <Download className="w-4 h-4" /> Xuất Excel ma trận đối tác
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm mới đối tác vận chuyển
          </button>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm theo mã đối tác, tên công ty, hotline, đầu mối liên hệ, email..."
          className="w-full bg-transparent outline-none text-xs text-slate-800 dark:text-slate-200"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-slate-500">Đang tải danh sách đối tác vận chuyển...</span>
        </div>
      ) : (
        <ReusableDataTable columns={columns} data={filtered} onRowClick={(row) => setSelected(row)} />
      )}

      {/* Modal Xem hồ sơ đối tác vận chuyển */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Hồ sơ đối tác: ${selected.carrierName} (${selected.carrierCode})` : 'Thông tin đối tác'}
        width="max-w-xl"
      >
        {selected && (
          <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
            {/* Header info card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
              {selected.logoUrl && (
                <img src={selected.logoUrl} alt="" className="w-14 h-14 rounded-xl object-cover border border-emerald-200 bg-white" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{selected.carrierName}</h3>
                  <span className="font-mono font-bold text-emerald-600">{selected.carrierCode}</span>
                </div>
                <p className="text-slate-500 mt-0.5">{selected.contactPerson || 'Chưa cập nhật người phụ trách'}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] font-semibold text-slate-600">
                  <span>📞 {selected.phone}</span>
                  <span>✉️ {selected.email}</span>
                </div>
              </div>
            </div>

            {/* Address & SLA */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Địa chỉ trụ sở</span>
                <p className="font-medium text-slate-800 dark:text-slate-200">{selected.address}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Website chính thức</span>
                {selected.website ? (
                  <a href={selected.website} target="_blank" rel="noreferrer" className="text-primary underline font-medium">
                    {selected.website}
                  </a>
                ) : (
                  <p className="text-slate-400">Chưa cập nhật</p>
                )}
              </div>
            </div>

            {/* SLA & COD */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SLA giao nội thành</span>
                <p className="text-sm font-extrabold text-emerald-600 mt-1">{selected.slaInnerCity}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">SLA giao ngoại tỉnh</span>
                <p className="text-sm font-extrabold text-blue-600 mt-1">{selected.slaOuterProvince}</p>
              </div>
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hỗ trợ COD</span>
                <p className="text-sm font-extrabold text-purple-600 mt-1">{selected.supportCod ? 'Có (Thu hộ)' : 'Không'}</p>
              </div>
            </div>

            {/* API Config details */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Server size={14} className="text-emerald-400" /> Cấu hình tích hợp API
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${selected.hasApi ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {selected.hasApi ? `API kích hoạt (${selected.apiEnvironment})` : 'Tắt kết nối API'}
                </span>
              </div>
              {selected.hasApi ? (
                <div className="space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[11px]">API Key:</span>
                    <p className="text-emerald-300">{selected.apiKey || 'vtp_live_sample_key'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Cơ chế đồng bộ:</span>
                    <p className="text-emerald-400 font-semibold">Chủ động API polling (không dùng webhook)</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa kích hoạt kết nối API tự động cho đối tác này.</p>
              )}
            </div>

            {selected.notes && (
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú & tài khoản đối soát</span>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 text-slate-700 dark:text-slate-300">
                  {selected.notes}
                </div>
              </div>
            )}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 font-medium rounded-lg text-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Thêm/Sửa đối tác */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Thêm mới đơn vị vận chuyển đối tác' : 'Cập nhật đơn vị vận chuyển đối tác'}
      >
        <form onSubmit={handleSave} className="space-y-5 text-xs">
          {/* Section 1: Basic Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building size={16} className="text-primary" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                1. Thông tin cơ bản & đầu mối liên hệ
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Mã đối tác *</span>
                  <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5">
                    <Lock size={10} /> Tự động tạo
                  </span>
                </label>
                <input
                  type="text"
                  value={formState.carrierCode || ''}
                  readOnly
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-600 dark:text-slate-400 cursor-not-allowed text-xs"
                />
                {formErrors.carrierCode && <p className="text-[11px] text-rose-500 mt-1">{formErrors.carrierCode}</p>}
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Hotline hỗ trợ / CSKH *</label>
                <input
                  type="text"
                  value={formState.phone || ''}
                  onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                  className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-xs focus:outline-none focus:border-slate-900 ${
                    formErrors.phone ? 'border-rose-500 bg-rose-50' : 'border-slate-200 dark:border-slate-700'
                  }`}
                  placeholder="1900 8888 hoặc 0988123456"
                />
                {formErrors.phone && <p className="text-[11px] text-rose-500 mt-1">{formErrors.phone}</p>}
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tên đối tác vận chuyển *</label>
              <input
                type="text"
                value={formState.carrierName || ''}
                onChange={(e) => setFormState({ ...formState, carrierName: e.target.value })}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs focus:outline-none focus:border-slate-900 ${
                  formErrors.carrierName ? 'border-rose-500 bg-rose-50' : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="Ví dụ: Viettel Post, Giao Hàng Tiết Kiệm, GHN..."
              />
              {formErrors.carrierName && <p className="text-[11px] text-rose-500 mt-1">{formErrors.carrierName}</p>}
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Email đối soát / liên hệ</label>
              <input
                type="email"
                value={formState.email || ''}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-xs focus:outline-none focus:border-slate-900 ${
                  formErrors.email ? 'border-rose-500 bg-rose-50' : 'border-slate-200 dark:border-slate-700'
                }`}
                placeholder="cskh@viettelpost.com.vn"
              />
              {formErrors.email && <p className="text-[11px] text-rose-500 mt-1">{formErrors.email}</p>}
            </div>
          </div>

          {/* Section 2: Address */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <MapPin size={16} className="text-primary" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                2. Địa chỉ trụ sở
              </h4>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Quốc gia</label>
                <input
                  type="text"
                  value="Việt Nam"
                  readOnly
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Tỉnh / thành phố</label>
                <select
                  value={formState.province || 'Hà Nội'}
                  onChange={(e) => setFormState({ ...formState, province: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-slate-900 font-semibold text-slate-900 dark:text-white"
                >
                  {VIETNAM_PROVINCES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Quận / huyện</label>
                <input
                  type="text"
                  value={formState.district || ''}
                  onChange={(e) => setFormState({ ...formState, district: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-slate-900 text-slate-900 dark:text-white"
                  placeholder="Quận Ba Đình, Cầu Giấy..."
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Địa chỉ trụ sở chính *</label>
              <input
                type="text"
                list="area-carrier-suggestions"
                value={formState.addressDetail || formState.address || ''}
                onChange={(e) => setFormState({ ...formState, addressDetail: e.target.value, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-slate-900 text-slate-900 dark:text-white"
                placeholder="Nhập địa chỉ hoặc chọn gợi ý khu vực..."
              />
            </div>
          </div>

          {/* Section 3: Services & SLA */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Truck size={16} className="text-primary" />
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                3. Dịch vụ cung cấp, SLA & trạng thái hợp đồng
              </h4>
            </div>

            {/* Service Multi Select */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-2">Dịch vụ cung cấp *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_SERVICES.map(srv => {
                  const isChecked = (formState.serviceTypes || []).includes(srv.id);
                  return (
                    <div
                      key={srv.id}
                      onClick={() => toggleServiceType(srv.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {isChecked ? <CheckSquare size={16} className="text-primary" /> : <Square size={16} className="text-slate-400" />}
                      <span className="text-xs">{srv.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coverage Regions & Status */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Vùng giao hàng khả dụng</label>
                <div className="flex flex-wrap gap-1.5">
                  {COVERAGE_OPTIONS.map(reg => {
                    const isSelected = (formState.coverageRegions || []).includes(reg);
                    return (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => toggleCoverageRegion(reg)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {reg}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Trạng thái hợp đồng *</label>
                <select
                  value={formState.contractStatus || 'ACTIVE'}
                  onChange={(e) => setFormState({ ...formState, contractStatus: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="ON_HOLD">Tạm ngưng</option>
                  <option value="EXPIRED">Hết hạn hợp đồng</option>
                </select>
              </div>
            </div>

            {/* SLA & Vehicles */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Số lượng phương tiện</label>
                <input
                  type="text"
                  value={formState.slaInnerCity || ''}
                  onChange={(e) => setFormState({ ...formState, slaInnerCity: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="10 phương tiện"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Thời gian giao tối đa (giờ)</label>
                <input
                  type="text"
                  value={formState.slaOuterProvince || ''}
                  onChange={(e) => setFormState({ ...formState, slaOuterProvince: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  placeholder="24 giờ"
                />
              </div>

              <div className="flex items-center pt-5">
                <label
                  onClick={() => setFormState({ ...formState, supportCod: !formState.supportCod })}
                  className="flex items-center gap-2 cursor-pointer select-none font-medium text-slate-800 dark:text-slate-200"
                >
                  {formState.supportCod ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} className="text-slate-400" />}
                  <span>Thu hộ tiền COD</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: API Integration Toggle & Sub-fields */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Server size={16} className="text-primary" />
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  4. Đồng bộ API & cấu hình kỹ thuật
                </h4>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Kết nối API:</span>
                <button
                  type="button"
                  onClick={() => setFormState({ ...formState, hasApi: !formState.hasApi })}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    formState.hasApi ? 'bg-primary text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {formState.hasApi ? 'Có (Tự động)' : 'Không (Thủ công)'}
                </button>
              </div>
            </div>

            {/* Conditional API Fields */}
            {formState.hasApi ? (
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">API Key *</label>
                    <input
                      type="text"
                      value={formState.apiKey || ''}
                      onChange={(e) => setFormState({ ...formState, apiKey: e.target.value })}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                      placeholder="vtp_live_xxxxxx"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">API Secret / Token *</label>
                    <input
                      type="password"
                      value={formState.apiSecret || ''}
                      onChange={(e) => setFormState({ ...formState, apiSecret: e.target.value })}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">API Base URL / Endpoint</label>
                    <input
                      type="text"
                      value={formState.website || ''}
                      onChange={(e) => setFormState({ ...formState, website: e.target.value })}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                      placeholder="https://partner-api.carrier.com/v2"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">Môi trường</label>
                    <select
                      value={formState.apiEnvironment || 'PRODUCTION'}
                      onChange={(e) => setFormState({ ...formState, apiEnvironment: e.target.value as any })}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-medium text-emerald-400 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="PRODUCTION">Vận hành (Production)</option>
                      <option value="SANDBOX">Kiểm thử (Sandbox)</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                Khi chọn "Không", đơn hàng sẽ được xử lý giao dịch thủ công qua bưu cục mà không tự động gửi lệnh tạo đơn qua API.
              </p>
            )}
          </div>

          {/* Section 5: Notes */}
          <div className="space-y-2 pt-2">
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú đối tác</label>
            <textarea
              value={formState.notes || ''}
              onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-slate-900 text-slate-900 dark:text-white"
              rows={2}
              placeholder="Ghi chú đối tác vận chuyển..."
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-all shadow-md cursor-pointer"
            >
              Lưu thông tin
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
