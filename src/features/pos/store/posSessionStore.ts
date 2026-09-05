import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface PosSessionRecord {
  id: string;
  sessionCode: string;
  cashierName: string;
  terminalCode: string;
  openingTime: string;
  closingTime?: string;
  openingCash: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  status: 'OPEN' | 'CLOSED';
  totalOrders?: number;
  totalRevenue?: number;
  userId?: number | string;
  branchId?: number | string;
}

interface PosSessionState {
  sessions: PosSessionRecord[];
  fetchSessions: () => Promise<void>;
  addSession: (item: Omit<PosSessionRecord, 'id'>) => Promise<void>;
  updateSession: (id: string, data: Partial<PosSessionRecord>) => Promise<void>;
  closeSession: (id: string, actualCash: number) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

export const usePosSessionStore = create<PosSessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      fetchSessions: async () => {
        try {
          const response = await axiosClient.get<any, any>('/pos/sessions');
          const rawList = Array.isArray(response)
            ? response
            : (Array.isArray(response?.data) ? response.data : (response?.content || []));
          
          const apiSessions: PosSessionRecord[] = rawList.map((item: any) => ({
            id: String(item.id),
            sessionCode: item.sessionCode || `SES-${item.id}`,
            cashierName: item.cashierName || 'Thu ngân',
            terminalCode: item.terminalCode || 'POS-001',
            openingTime: item.startTime || item.openingTime || new Date().toISOString(),
            closingTime: item.endTime || item.closingTime,
            openingCash: Number(item.openingCash || 0),
            expectedCash: Number(item.expectedClosingCash ?? item.expectedCash ?? item.openingCash ?? 0),
            actualCash: Number(item.actualClosingCash ?? item.actualCash ?? 0),
            cashDifference: Number((item.actualClosingCash ?? item.actualCash ?? 0) - (item.expectedClosingCash ?? item.expectedCash ?? item.openingCash ?? 0)),
            status: (item.status === 'CLOSED' ? 'CLOSED' : 'OPEN') as 'OPEN' | 'CLOSED',
            totalOrders: item.totalOrders !== undefined ? Number(item.totalOrders) : undefined,
            totalRevenue: item.totalRevenue !== undefined ? Number(item.totalRevenue) : undefined,
            userId: item.userId,
            branchId: item.branchId,
          }));

          if (Array.isArray(apiSessions)) {
            set({ sessions: apiSessions });
          }
        } catch (error) {
          console.error('Failed to fetch pos sessions:', error);
        }
      },
      addSession: async (item) => {
        try {
          const authUser = (await import('@/features/auth/store/authStore')).useAuthStore.getState().user;
          const payload = {
            sessionCode: item.sessionCode,
            terminalCode: item.terminalCode || 'POS-001',
            openingCash: item.openingCash || 0,
            userId: item.userId ? Number(item.userId) : (authUser?.id ? Number(authUser.id) : null),
            branchId: item.branchId ? Number(item.branchId) : ((authUser as any)?.branchId ? Number((authUser as any).branchId) : 1),
          };
          await axiosClient.post('/pos/sessions', payload);
          await get().fetchSessions();
        } catch (e) {
          console.error('Failed to post pos session to backend:', e);
          throw e;
        }
      },
      updateSession: async (id, data) => {
        try {
          await axiosClient.put(`/pos/sessions/${id}`, data);
          await get().fetchSessions();
        } catch (e) {
          console.error('Failed to update pos session:', e);
          throw e;
        }
      },
      closeSession: async (id, actualCash) => {
        try {
          await axiosClient.put(`/pos/sessions/${id}/close`, null, {
            params: { actualClosingCash: actualCash }
          });
          await get().fetchSessions();
        } catch (e) {
          console.error('Failed to close pos session in API:', e);
          throw e;
        }
      },
      deleteSession: async (id) => {
        try {
          await axiosClient.delete(`/pos/sessions/${id}`);
          await get().fetchSessions();
        } catch (e) {
          console.error('Failed to delete pos session:', e);
          throw e;
        }
      },
    }),
    {
      name: 'retailhub-pos-session-storage-v2',
    }
  )
);
