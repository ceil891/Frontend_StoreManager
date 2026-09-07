import { axiosClient } from '@/shared/lib/axiosClient';
import type {
  SalesReportData,
  InventoryReportData,
  FinanceReportData,
  CrmReportData,
} from '../types/reports';

export const reportsApi = {
  getSalesReport: async (params?: { period?: string; branchId?: string }): Promise<SalesReportData> => {
    const res = await axiosClient.get<any, any>('/reports/sales', { params });
    return (res?.data || res) as SalesReportData;
  },

  getInventoryReport: async (params?: { branchId?: string }): Promise<InventoryReportData> => {
    const res = await axiosClient.get<any, any>('/reports/inventory', { params });
    return (res?.data || res) as InventoryReportData;
  },

  getFinanceReport: async (params?: { year?: string }): Promise<FinanceReportData> => {
    const res = await axiosClient.get<any, any>('/reports/finance', { params });
    return (res?.data || res) as FinanceReportData;
  },

  getProfitLossReport: async (): Promise<Array<{ month: string; income: number; expense: number; profit: number }>> => {
    const res = await axiosClient.get<any, any>('/reports/profit-loss');
    return (res?.data || res) as Array<{ month: string; income: number; expense: number; profit: number }>;
  },

  getCrmReport: async (): Promise<CrmReportData> => {
    const res = await axiosClient.get<any, any>('/reports/crm');
    return (res?.data || res) as CrmReportData;
  },
};
