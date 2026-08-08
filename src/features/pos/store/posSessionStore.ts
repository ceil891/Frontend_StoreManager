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
          const apiSessions: PosSessionRecord[] = Array.isArray(response)
            ? response
            : (Array.isArray(response?.data) ? response.data : (response?.content || []));
          
          if (Array.isArray(apiSessions) && apiSessions.length > 0) {
            const currentLocal = get().sessions || [];
            const merged = [...apiSessions];
            currentLocal.forEach((loc) => {
              if (!merged.some((m) => String(m.id) === String(loc.id) || m.sessionCode === loc.sessionCode)) {
                merged.push(loc);
              }
            });
            set({ sessions: merged });
          }
        } catch (error) {
          console.error('Failed to fetch pos sessions:', error);
        }
      },
      addSession: async (item) => {
        const tempId = `sess_${Date.now()}`;
        const newRecord: PosSessionRecord = {
          id: tempId,
          ...item,
        };
        set((state) => ({
          sessions: [newRecord, ...state.sessions.filter((s) => s.sessionCode !== item.sessionCode)],
        }));
        try {
          await axiosClient.post('/pos/sessions', item);
          await get().fetchSessions();
        } catch (e) {
          console.error('Failed to post pos session to backend, kept in local store:', e);
        }
      },
      updateSession: async (id, data) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...data } : s)),
        }));
        try {
          await axiosClient.put(`/pos/sessions/${id}`, data);
          await get().fetchSessions();
        } catch (e) {
          console.error('Failed to update pos session:', e);
        }
      },
      closeSession: async (id, actualCash) => {
        const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id === id) {
              const diff = actualCash - (s.expectedCash || s.openingCash || 0);
              return {
                ...s,
                actualCash,
                cashDifference: diff,
                closingTime: now,
                status: 'CLOSED'
              };
            }
            return s;
          })
        }));
        try {
          await axiosClient.put(`/pos/sessions/${id}/close`, null, {
            params: { actualClosingCash: actualCash }
          });
          await get().fetchSessions();
        } catch (e) {
          console.error('Failed to close pos session in API, kept in local state:', e);
        }
      },
      deleteSession: async (id) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        }));
        try {
          await axiosClient.delete(`/pos/sessions/${id}`);
          await get().fetchSessions();
        } catch (e) {
          console.error('Failed to delete pos session:', e);
        }
      },
    }),
    {
      name: 'retailhub-pos-session-storage-v2',
    }
  )
);
