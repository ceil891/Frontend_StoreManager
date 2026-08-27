import { create } from 'zustand';
import { axiosClient } from '@/shared/lib/axiosClient';
import { extractPageContent } from '@/shared/lib/apiHelpers';

export type AttendanceUiStatus = 'ĐÚNG_GIỜ' | 'ĐI_MUỘN' | 'VỀ_SỚM' | 'VẮNG_MẶT';

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  workDate: string;
  checkIn: string;
  checkOut: string;
  gpsLocation: string;
  status: AttendanceUiStatus;
  hoursWorked: number;
  note?: string;
}

const STATUS_FROM_API: Record<string, AttendanceUiStatus> = {
  PRESENT: 'ĐÚNG_GIỜ',
  LATE: 'ĐI_MUỘN',
  ABSENT: 'VẮNG_MẶT',
  HALF_DAY: 'VỀ_SỚM',
};

function formatTime(value?: string | null): string {
  if (!value) return '';
  if (value.includes('T')) return value.split('T')[1]?.slice(0, 5) ?? '';
  return value.length >= 5 ? value.slice(0, 5) : value;
}

function calcHours(checkIn?: string | null, checkOut?: string | null): number {
  if (!checkIn || !checkOut) return 0;
  const inTime = formatTime(checkIn);
  const outTime = formatTime(checkOut);
  if (!inTime || !outTime) return 0;
  const [ih, im] = inTime.split(':').map(Number);
  const [oh, om] = outTime.split(':').map(Number);
  const diff = (oh * 60 + om - (ih * 60 + im)) / 60;
  return diff > 0 ? Math.round(diff * 10) / 10 : 0;
}

function mapAttendance(item: any): AttendanceRecord {
  const checkIn = formatTime(item.checkInTime);
  const checkOut = formatTime(item.checkOutTime);
  return {
    id: String(item.id),
    userId: String(item.userId ?? ''),
    userName: item.userName || `NV #${item.userId ?? ''}`,
    workDate: item.workDate ? String(item.workDate).split('T')[0] : '',
    checkIn,
    checkOut,
    gpsLocation: item.gpsLocation || '',
    status: STATUS_FROM_API[String(item.status || '').toUpperCase()] || 'ĐÚNG_GIỜ',
    hoursWorked: calcHours(item.checkInTime, item.checkOutTime),
    note: item.note || undefined,
  };
}

interface AttendanceState {
  records: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  fetchAttendances: (params?: { workDateFrom?: string; workDateTo?: string; search?: string }) => Promise<void>;
  recordCheckIn: (userId: string, userName: string) => Promise<void>;
}

export const useAttendanceStore = create<AttendanceState>()((set) => ({
  records: [],
  isLoading: false,
  error: null,

  fetchAttendances: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.workDateFrom) query.set('workDateFrom', params.workDateFrom);
      if (params?.workDateTo) query.set('workDateTo', params.workDateTo);
      if (params?.search) query.set('search', params.search);
      query.set('page', '0');
      query.set('size', '500');

      const suffix = query.toString() ? `?${query.toString()}` : '';
      const data = await axiosClient.get<any, unknown>(`/hrm/attendances${suffix}`);
      const content = extractPageContent(data);
      set({ records: content.map(mapAttendance), isLoading: false });
    } catch (err: any) {
      console.error('Failed to fetch attendances:', err);
      set({
        isLoading: false,
        error: err?.message || 'Lỗi khi tải dữ liệu chấm công',
      });
    }
  },

  recordCheckIn: async (userId: string, userName: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const dateStr = now.toISOString().split('T')[0];

    try {
      await axiosClient.post('/hrm/attendances', {
        userId: Number(userId) || 1,
        workDate: dateStr,
        checkInTime: `${dateStr}T${timeStr}:00`,
        status: 'PRESENT',
        gpsLocation: 'Văn phòng chính (Chi nhánh 1)',
        note: 'Chấm công khuôn mặt sinh trắc học AI',
      });
    } catch (e) {
      console.warn('API /hrm/attendances fallback:', e);
    }

    set((state) => {
      const existing = state.records.find(r => r.userId === userId && r.workDate === dateStr);
      if (existing) {
        return {
          records: state.records.map(r => r.id === existing.id ? { ...r, checkIn: r.checkIn || timeStr, checkOut: timeStr, hoursWorked: calcHours(r.checkIn || timeStr, timeStr) } : r)
        };
      } else {
        const newRecord: AttendanceRecord = {
          id: String(Date.now()),
          userId,
          userName,
          workDate: dateStr,
          checkIn: timeStr,
          checkOut: '',
          gpsLocation: 'Văn phòng chính (Chi nhánh 1)',
          status: 'ĐÚNG_GIỜ',
          hoursWorked: 0,
          note: 'Chấm công khuôn mặt sinh trắc học AI'
        };
        return { records: [newRecord, ...state.records] };
      }
    });
  },
}));
