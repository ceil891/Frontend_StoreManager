import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface SalesChannelRecord {
  id: string;
  channelCode: string;
  channelName: string;
  platform: 'SHOPEE' | 'LAZADA' | 'TIKTOK_SHOP' | 'TIKI' | 'WEBSITE';
  shopId: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'SYNC_ERROR';
  lastSyncedAt: string;
  productCount: number;
}

export interface ChannelProductMappingRecord {
  id: string;
  internalSku: string;
  productName: string;
  channelName: string;
  channelSku: string;
  channelPrice: number;
  syncStatus: 'SYNCED' | 'OUT_OF_SYNC' | 'FAILED';
  lastSyncedAt: string;
}

export interface WebhookLogRecord {
  id: string;
  logCode: string;
  channelName: string;
  eventType: 'ORDER_CREATED' | 'STOCK_UPDATED' | 'PRICE_CHANGED';
  payloadSummary: string;
  responseCode: number;
  status: 'SUCCESS' | 'FAILED';
  createdAt: string;
}

interface OmnichannelState {
  salesChannels: SalesChannelRecord[];
  productMappings: ChannelProductMappingRecord[];
  webhookLogs: WebhookLogRecord[];

  fetchSalesChannels: () => Promise<void>;
  addSalesChannel: (item: Omit<SalesChannelRecord, 'id'>) => Promise<void>;
  updateSalesChannel: (id: string, data: Partial<SalesChannelRecord>) => Promise<void>;
  deleteSalesChannel: (id: string) => Promise<void>;

  fetchProductMappings: () => Promise<void>;
  addProductMapping: (item: Omit<ChannelProductMappingRecord, 'id'>) => Promise<void>;
  updateProductMapping: (id: string, data: Partial<ChannelProductMappingRecord>) => Promise<void>;
  deleteProductMapping: (id: string) => Promise<void>;

  fetchWebhookLogs: () => Promise<void>;
}

export const useOmnichannelStore = create<OmnichannelState>()(
  persist(
    (set, get) => ({
      salesChannels: [],
      productMappings: [],
      webhookLogs: [],

      fetchSalesChannels: async () => {
        try {
          const response = await axiosClient.get<any, any[]>('/omnichannel/channels');
          set({ salesChannels: response });
        } catch (error) {
          console.error('Failed to fetch sales channels:', error);
        }
      },
      addSalesChannel: async (item) => {
        await axiosClient.post('/omnichannel/channels', item);
        await get().fetchSalesChannels();
      },
      updateSalesChannel: async (id, data) => {
        await axiosClient.put(`/omnichannel/channels/${id}`, data);
        await get().fetchSalesChannels();
      },
      deleteSalesChannel: async (id) => {
        await axiosClient.delete(`/omnichannel/channels/${id}`);
        await get().fetchSalesChannels();
      },

      fetchProductMappings: async () => {
        try {
          const response = await axiosClient.get<any, any[]>('/omnichannel/mappings');
          set({ productMappings: response });
        } catch (error) {
          console.error('Failed to fetch product mappings:', error);
        }
      },
      addProductMapping: async (item) => {
        await axiosClient.post('/omnichannel/mappings', item);
        await get().fetchProductMappings();
      },
      updateProductMapping: async (id, data) => {
        await axiosClient.put(`/omnichannel/mappings/${id}`, data);
        await get().fetchProductMappings();
      },
      deleteProductMapping: async (id) => {
        await axiosClient.delete(`/omnichannel/mappings/${id}`);
        await get().fetchProductMappings();
      },

      fetchWebhookLogs: async () => {
        try {
          const response = await axiosClient.get<any, any[]>('/omnichannel/webhook-logs');
          set({ webhookLogs: response });
        } catch (error) {
          console.error('Failed to fetch webhook logs:', error);
        }
      },
    }),
    {
      name: 'retailhub-omnichannel-storage',
    }
  )
);
