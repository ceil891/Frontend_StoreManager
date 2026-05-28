import { useMemo, useState } from 'react';
import { Download, AlertTriangle, TrendingDown, ArrowUpRight, ArrowDownRight, Archive } from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import type { ColumnDef } from '@tanstack/react-table';

// --- MOCK DATA ---
const CATEGORY_STOCK = [
  { name: 'Thực phẩm khô', value: 450000000, color: '#F59E0B' },
  { name: 'Đồ uống', value: 320000000, color: '#3B82F6' },
  { name: 'Gia vị', value: 150000000, color: '#10B981' },
  { name: 'Đồ gia dụng', value: 280000000, color: '#6366F1' },
];

const DEAD_STOCK = [
  { name: 'Hộp nhựa bảo quản', days: 120 },
  { name: 'Nước xả vải 5L', days: 95 },
  { name: 'Mì gói chay', days: 85 },
  { name: 'Sữa chua dâu', days: 60 },
  { name: 'Dầu ăn 5L', days: 45 },
];

interface LowStockItem {
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  supplier: string;
}

const LOW_STOCK_ITEMS: LowStockItem[] = [
  { sku: 'SP-101', name: 'Nước giải khát Coca-Cola 1.5L', category: 'Đồ uống', currentStock: 12, minStock: 50, supplier: 'NPP Nước Giải Khát' },
  { sku: 'SP-105', name: 'Bia Tiger Thùng 24', category: 'Đồ uống', currentStock: 5, minStock: 30, supplier: 'Đại lý Bia Sài Gòn' },
  { sku: 'SP-203', name: 'Gạo ST25 5kg', category: 'Thực phẩm khô', currentStock: 8, minStock: 20, supplier: 'Công ty Lương Thực' },
  { sku: 'SP-304', name: 'Bột giặt OMO 3kg', category: 'Đồ gia dụng', currentStock: 3, minStock: 15, supplier: 'Unilever VN' },
  { sku: 'SP-401', name: 'Nước mắm Chinsu', category: 'Gia vị', currentStock: 18, minStock: 40, supplier: 'Masan Consumer' },
];

const KPI_CARDS = [
  { title: 'Tổng Giá trị Tồn kho', value: '1.200.000.000đ', trend: '+2.5%', isUp: false, icon: Archive, color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-900/50' },
  { title: 'Sản phẩm sắp hết', value: '15 SKU', trend: '+3', isUp: false, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-900/30 dark:border-amber-900/50' },
  { title: 'Hàng tồn đọng (Dead stock)', value: '8 SKU', trend: '-2', isUp: true, icon: TrendingDown, color: 'text-rose-600 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-900/30 dark:border-rose-900/50' },
];

export function InventoryReportPage() {
  const [storeSelect, setStoreSelect] = useState('all');

  const columns = useMemo<ColumnDef<LowStockItem>[]>(
    () => [
      {
        accessorKey: 'sku',
        header: 'SKU',
        cell: (info) => <span className="font-mono text-xs font-semibold text-gray-500">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'name',
        header: 'Tên Sản phẩm',
        cell: (info) => <span className="font-medium text-gray-900 dark:text-white">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'category',
        header: 'Danh mục',
        cell: (info) => <span className="text-gray-600 dark:text-gray-400 text-sm">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'currentStock',
        header: 'Tồn hiện tại',
        cell: (info) => <span className="font-bold text-red-600 dark:text-red-400">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'minStock',
        header: 'Định mức tối thiểu',
        cell: (info) => <span className="text-gray-500">{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'supplier',
        header: 'Nhà cung cấp',
        cell: (info) => <span className="text-gray-500 text-sm">{info.getValue() as string}</span>,
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo Tồn kho</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Phân tích giá trị kho và cảnh báo hàng hóa.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={storeSelect}
            onChange={(e) => setStoreSelect(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">Tất cả chi nhánh</option>
            <option value="q1">CH Quận 1</option>
            <option value="tb">CH Tân Bình</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm">
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {KPI_CARDS.map((kpi, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                kpi.isUp ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {kpi.isUp ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                {kpi.trend}
              </div>
            </div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{kpi.title}</h3>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Giá trị tồn kho theo danh mục</h3>
          <p className="text-sm text-gray-500 mb-6">Tỷ trọng vốn lưu động đang nằm ở đâu?</p>
          <div className="h-[300px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_STOCK}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {CATEGORY_STOCK.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => `${(Number(value ?? 0) / 1000000).toFixed(0)} triệu VNĐ`}
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {CATEGORY_STOCK.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</p>
                  <p className="text-xs text-gray-500">{(item.value / 1000000).toFixed(0)} triệu</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hàng tồn đọng (Dead Stock)</h3>
          <p className="text-sm text-gray-500 mb-6">Top 5 sản phẩm có số ngày lưu kho cao nhất</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DEAD_STOCK} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" dark-stroke="#374151" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} />
                <RechartsTooltip 
                  formatter={(value) => `${Number(value ?? 0)} ngày`}
                  cursor={{fill: 'transparent'}} 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px' }} 
                />
                <Bar dataKey="days" name="Ngày lưu kho" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={40}>
                  {DEAD_STOCK.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#E11D48' : '#FB7185'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Danh sách cần nhập hàng (Low Stock)</h3>
          </div>
        </div>
        <ReusableDataTable columns={columns} data={LOW_STOCK_ITEMS} />
      </div>
    </div>
  );
}
