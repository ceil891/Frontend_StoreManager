import { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, 
  Sparkles, Calendar, AlertTriangle, RefreshCw, ShoppingCart, Truck, ClipboardList, Plus
} from 'lucide-react';
import { Link } from 'react-router';
import { AIInsightsWidget } from '../components/AIInsightsWidget';
// ── Time-based Mock Datasets ─────────────────────────────────
const REVENUE_DATASET = {
  '7d': [
    { name: 'Thứ 2', total: 1200, orders: 24 },
    { name: 'Thứ 3', total: 2100, orders: 42 },
    { name: 'Thứ 4', total: 1800, orders: 36 },
    { name: 'Thứ 5', total: 2400, orders: 48 },
    { name: 'Thứ 6', total: 2800, orders: 56 },
    { name: 'Thứ 7', total: 3200, orders: 64 },
    { name: 'Chủ nhật', total: 2900, orders: 58 },
  ],
  '30d': [
    { name: 'Tuần 1', total: 14500, orders: 290 },
    { name: 'Tuần 2', total: 18900, orders: 380 },
    { name: 'Tuần 3', total: 17200, orders: 340 },
    { name: 'Tuần 4', total: 22200, orders: 450 },
  ],
  'ytd': [
    { name: 'Quý 1', total: 182000, orders: 3640 },
    { name: 'Quý 2', total: 215000, orders: 4300 },
    { name: 'Quý 3', total: 198000, orders: 3960 },
    { name: 'Quý 4', total: 249800, orders: 5010 },
  ]
};

const CATEGORY_DATASET = {
  '7d': [
    { name: 'Điện tử', value: 6560, color: '#6366F1' },   // Indigo
    { name: 'Thời trang', value: 4920, color: '#10B981' }, // Emerald
    { name: 'Thực phẩm', value: 3280, color: '#F59E0B' },  // Amber
    { name: 'Phụ kiện', value: 1640, color: '#FF6F61' },   // Coral
  ],
  '30d': [
    { name: 'Điện tử', value: 29120, color: '#6366F1' },
    { name: 'Thời trang', value: 21840, color: '#10B981' },
    { name: 'Thực phẩm', value: 14560, color: '#F59E0B' },
    { name: 'Phụ kiện', value: 7280, color: '#FF6F61' },
  ],
  'ytd': [
    { name: 'Điện tử', value: 338000, color: '#6366F1' },
    { name: 'Thời trang', value: 253500, color: '#10B981' },
    { name: 'Thực phẩm', value: 169000, color: '#F59E0B' },
    { name: 'Phụ kiện', value: 84500, color: '#FF6F61' },
  ]
};

const KPI_DATASET = {
  '7d': [
    { title: 'Doanh thu thuần', value: '16.400đ', valueSuffix: 'K', trend: '+12.5%', isUp: true, icon: DollarSign, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/20' },
    { title: 'Đơn hàng mới', value: '342', valueSuffix: 'đơn', trend: '+8.2%', isUp: true, icon: ShoppingBag, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/20' },
    { title: 'Khách hàng mới', value: '1.204', valueSuffix: 'user', trend: '-2.4%', isUp: false, icon: Users, color: 'text-coral-500 bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/20' },
    { title: 'Tỷ lệ chốt đơn', value: '3.4%', valueSuffix: '', trend: '+1.1%', isUp: true, icon: TrendingUp, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/20' },
  ],
  '30d': [
    { title: 'Doanh thu thuần', value: '72.800đ', valueSuffix: 'K', trend: '+18.4%', isUp: true, icon: DollarSign, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/20' },
    { title: 'Đơn hàng mới', value: '1.580', valueSuffix: 'đơn', trend: '+11.3%', isUp: true, icon: ShoppingBag, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/20' },
    { title: 'Khách hàng mới', value: '4.890', valueSuffix: 'user', trend: '+5.6%', isUp: true, icon: Users, color: 'text-coral-500 bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/20' },
    { title: 'Tỷ lệ chốt đơn', value: '3.6%', valueSuffix: '', trend: '+1.8%', isUp: true, icon: TrendingUp, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/20' },
  ],
  'ytd': [
    { title: 'Doanh thu thuần', value: '845.000đ', valueSuffix: 'K', trend: '+24.1%', isUp: true, icon: DollarSign, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/20' },
    { title: 'Đơn hàng mới', value: '18.290', valueSuffix: 'đơn', trend: '+15.7%', isUp: true, icon: ShoppingBag, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/20' },
    { title: 'Khách hàng mới', value: '12.450', valueSuffix: 'user', trend: '+14.2%', isUp: true, icon: Users, color: 'text-coral-500 bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/20' },
    { title: 'Tỷ lệ chốt đơn', value: '3.9%', valueSuffix: '', trend: '+2.5%', isUp: true, icon: TrendingUp, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/20' },
  ]
};

const MOCK_RECENT_ACTIVITIES = [
  { id: 'act-1', type: 'SALE', text: 'Đơn hàng POS #1024 hoàn tất giao dịch', meta: 'Tổng cộng: 1.250.000đ', time: '5 phút trước' },
  { id: 'act-2', type: 'INVENTORY', text: 'Nhập kho thành công Lô Bánh Ngọt Pháp #204', meta: 'SKU-FOOD-102 • Qty: 200', time: '18 phút trước' },
  { id: 'act-3', type: 'WARNING', text: 'Cảnh báo: Sản phẩm Samsung Galaxy S24 sắp hết hàng', meta: 'Còn lại trong kho: 5 đơn vị', time: '1 giờ trước' },
  { id: 'act-4', type: 'CUSTOMER', text: 'Khách hàng VIP Nguyễn Văn A nâng hạng kim cương', meta: 'Chi tiêu tích lũy vượt 50.000.000đ', time: '2 giờ trước' },
];

export function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'ytd'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const kpis = useMemo(() => KPI_DATASET[timeRange], [timeRange]);
  const revenue = useMemo(() => REVENUE_DATASET[timeRange], [timeRange]);
  const categoryData = useMemo(() => CATEGORY_DATASET[timeRange], [timeRange]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const totalValueSum = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString();
  }, [categoryData]);

  return (
    <div className="space-y-6">
      {/* 1. Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tổng quan Vận hành & Doanh thu</h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Sparkles className="w-3 h-3 text-emerald-500" /> Real-time Analytics
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Chào mừng bạn quay lại hệ thống! Dưới đây là báo cáo nhanh về tình hình bán hàng và tồn kho hôm nay.
          </p>
        </div>

        {/* Dynamic Period Selectors */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-inner select-none">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === '7d' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            7 ngày qua
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === '30d' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setTimeRange('ytd')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === 'ytd' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            Năm nay
          </button>

          {/* Quick Refresh Icon */}
          <button 
            onClick={handleRefresh} 
            title="Làm mới dữ liệu"
            className="p-1.5 text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-gray-700/50 rounded-lg transition-all ml-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. KPI Section with Glassmorphism Card Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div 
            key={kpi.title} 
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm hover:shadow-md dark:hover:shadow-indigo-950/20 hover:scale-[1.01] transition-all relative overflow-hidden group"
          >
            {/* Ambient Background Gradient for Premium Aesthetics */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <div className={`flex items-center text-xs font-black px-2 py-0.5 rounded-full ${
                kpi.isUp 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20' 
                  : 'bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900/20'
              }`}>
                {kpi.isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {kpi.trend}
              </div>
            </div>
            <div>
              <h3 className="text-gray-400 dark:text-gray-500 text-xs font-extrabold uppercase tracking-widest">{kpi.title}</h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-1.5 tracking-tight">
                {kpi.value}<span className="text-sm font-semibold text-gray-400 dark:text-gray-500 ml-0.5">{kpi.valueSuffix}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Widget */}
      <div className="grid grid-cols-1 gap-6">
        <AIInsightsWidget />
      </div>

      {/* 3. Core Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Xu hướng Doanh thu & Đơn hàng</h3>
              <p className="text-xs text-gray-400 mt-0.5">Biểu đồ tổng hợp dữ liệu biến động tài chính của cửa hàng</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Dữ liệu giả lập</span>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" dark-stroke="#374151" opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#818CF8' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" name="Doanh thu" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Pie/Donut Chart Sales by Category */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tỷ trọng Phân hệ</h3>
            <p className="text-xs text-gray-400 mt-0.5">Cơ cấu doanh thu đóng góp theo danh mục sản phẩm</p>
          </div>

          <div className="relative h-60 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={6}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(value) => `${Number(value ?? 0).toLocaleString()}đ`}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Total Metric Label */}
            <div className="absolute text-center select-none pointer-events-none">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block">TỔNG GIÁ TRỊ</span>
              <span className="text-xl font-black text-gray-900 dark:text-white mt-0.5 block">${totalValueSum}</span>
            </div>
          </div>
          
          {/* Custom Sleek Legend Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{item.name}</p>
                  <p className="text-[10px] font-semibold text-gray-400">${item.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Quick Actions Panel & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Quick Actions Grid (2/3 col-span) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Phím tắt Thao tác Nhanh</h3>
            <p className="text-xs text-gray-400 mt-0.5">Truy cập tức thì vào các hành động nghiệp vụ khẩn cấp thường dùng</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <Link 
              to="/pos"
              className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100/70 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 hover:scale-[1.03] transition-all group"
            >
              <ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 mt-2.5">Bán hàng POS</span>
            </Link>

            <Link 
              to="/inventory"
              className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100/70 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 hover:scale-[1.03] transition-all group"
            >
              <Plus className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-2.5">Thêm SKU</span>
            </Link>

            <Link 
              to="/inventory/imports"
              className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/30 hover:scale-[1.03] transition-all group"
            >
              <Truck className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 mt-2.5">Nhập kho GRN</span>
            </Link>

            <Link 
              to="/inventory/cancel"
              className="flex flex-col items-center justify-center p-4 bg-rose-50 hover:bg-rose-100/70 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-2xl border border-rose-100 dark:border-rose-900/30 hover:scale-[1.03] transition-all group"
            >
              <ClipboardList className="w-6 h-6 text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-2.5">Phiếu hủy hàng</span>
            </Link>
          </div>
        </div>

        {/* Right: Operational Live Activity Feed (1/3 col-span) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Hoạt động Giao dịch</h3>
            <p className="text-xs text-gray-400 mt-0.5">Dòng thời gian các sự kiện vận hành kho và bán hàng</p>
          </div>

          <div className="space-y-4 mt-6">
            {MOCK_RECENT_ACTIVITIES.map((act) => (
              <div key={act.id} className="flex gap-3 text-xs leading-relaxed group">
                {/* Indicator Line Left icon */}
                <div className="relative flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold border ${
                    act.type === 'SALE' ? 'bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900/20' :
                    act.type === 'INVENTORY' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/20' :
                    act.type === 'WARNING' ? 'bg-red-50 border-red-100 text-red-500 dark:bg-red-950/30 dark:border-red-900/20 animate-pulse' :
                    'bg-amber-50 border-amber-100 text-amber-500 dark:bg-amber-950/30 dark:border-amber-900/20'
                  }`}>
                    {act.type === 'SALE' ? <ShoppingCart className="w-3.5 h-3.5" /> :
                     act.type === 'INVENTORY' ? <Truck className="w-3.5 h-3.5" /> :
                     act.type === 'WARNING' ? <AlertTriangle className="w-3.5 h-3.5" /> :
                     <Users className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors">{act.text}</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">{act.meta}</p>
                </div>
                
                <span className="text-[10px] text-gray-400 font-semibold shrink-0 font-mono self-start pt-0.5">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
