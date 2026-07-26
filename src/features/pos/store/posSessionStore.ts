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
  deleteSession: (id: string) => Promise<void>;
}

export const usePosSessionStore = create<PosSessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      fetchSessions: async () => {
        try {
          const response = await axiosClient.get<any, any[]>('/pos/sessions');
          set({ sessions: response });
        } catch (error) {
          console.error('Failed to fetch pos sessions:', error);
        }
      },
      addSession: async (item) => {
        await axiosClient.post('/pos/sessions', item);
        await get().fetchSessions();
      },
      updateSession: async (id, data) => {
        await axiosClient.put(`/pos/sessions/${id}`, data);
        await get().fetchSessions();
      },
      deleteSession: async (id) => {
        await axiosClient.delete(`/pos/sessions/${id}`);
        await get().fetchSessions();
      },
    }),
    {
      name: 'retailhub-pos-session-storage',
    }
  )
);
