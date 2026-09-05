import { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight, 
  Sparkles, Calendar, AlertTriangle, RefreshCw, ShoppingCart, Truck, ClipboardList, Plus, Package
} from 'lucide-react';
import { Link } from 'react-router';
import { AIInsightsWidget } from '../components/AIInsightsWidget';
import { useSalesStore } from '@/features/sales/store/salesStore';
import { useInventoryStore } from '@/features/inventory/store/inventoryStore';
import { useCrmStore } from '@/features/crm/store/crmStore';

const CATEGORY_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#FF6F61', '#8B5CF6', '#EC4899', '#06B6D4'];

export function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'ytd'>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const saleOrders = useSalesStore((s) => s.saleOrders);
  const fetchSaleOrders = useSalesStore((s) => s.fetchSaleOrders);
  const products = useInventoryStore((s) => s.products);
  const categories = useInventoryStore((s) => s.categories);
  const fetchProducts = useInventoryStore((s) => s.fetchProducts);
  const fetchCategories = useInventoryStore((s) => s.fetchCategories);
  const customers = useCrmStore((s) => s.customers);
  const fetchCustomers = useCrmStore((s) => s.fetchCustomers);

  useEffect(() => {
    fetchSaleOrders();
    fetchProducts();
    fetchCategories();
    fetchCustomers();
  }, [fetchSaleOrders, fetchProducts, fetchCategories, fetchCustomers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      fetchSaleOrders(),
      fetchProducts(),
      fetchCategories(),
      fetchCustomers(),
    ]);
    setIsRefreshing(false);
  };

  const paidOrders = useMemo(() => {
    return saleOrders.filter(
      (o) => o.status === 'COMPLETED' || o.paymentStatus === 'PAID'
    );
  }, [saleOrders]);

  const totalRevenue = useMemo(() => {
    return paidOrders.reduce((sum, o) => sum + ((o as any).finalAmount || o.totalAmount || 0), 0);
  }, [paidOrders]);

  const kpis = useMemo(() => {
    const revenueFormatted = totalRevenue.toLocaleString('vi-VN') + 'đ';
    const totalOrders = saleOrders.length;
    const totalCust = customers.length;
    const totalProd = products.length;

    return [
      {
        title: 'Doanh thu thuần',
        value: revenueFormatted,
        valueSuffix: '',
        trend: `${paidOrders.length} đơn đã thu`,
        isUp: true,
        icon: DollarSign,
        color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/20'
      },
      {
        title: 'Tổng đơn hàng',
        value: totalOrders.toLocaleString('vi-VN'),
        valueSuffix: ' đơn',
        trend: `${saleOrders.filter(o => o.origin === 'POS').length} từ POS`,
        isUp: true,
        icon: ShoppingBag,
        color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/20'
      },
      {
        title: 'Khách hàng',
        value: totalCust.toLocaleString('vi-VN'),
        valueSuffix: ' người',
        trend: 'Hệ thống CRM',
        isUp: true,
        icon: Users,
        color: 'text-coral-500 bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/20'
      },
      {
        title: 'Danh mục & Sản phẩm',
        value: totalProd.toLocaleString('vi-VN'),
        valueSuffix: ' SKU',
        trend: `${categories.length} danh mục`,
        isUp: true,
        icon: Package,
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/20'
      },
    ];
  }, [totalRevenue, paidOrders, saleOrders, customers, products, categories]);

  // Real chart data aggregated from sale orders
  const revenueChartData = useMemo(() => {
    if (saleOrders.length === 0) {
      return [
        { name: 'Thứ 2', total: 0, orders: 0 },
        { name: 'Thứ 3', total: 0, orders: 0 },
        { name: 'Thứ 4', total: 0, orders: 0 },
        { name: 'Thứ 5', total: 0, orders: 0 },
        { name: 'Thứ 6', total: 0, orders: 0 },
        { name: 'Thứ 7', total: 0, orders: 0 },
        { name: 'CN', total: 0, orders: 0 },
      ];
    }

    const map = new Map<string, { total: number; orders: number }>();
    saleOrders.forEach((o) => {
      const dateKey = o.date ? o.date.slice(0, 10) : 'Hôm nay';
      const existing = map.get(dateKey) || { total: 0, orders: 0 };
      existing.total += ((o as any).finalAmount || o.totalAmount || 0);
      existing.orders += 1;
      map.set(dateKey, existing);
    });

    return Array.from(map.entries()).map(([date, d]) => ({
      name: date.slice(5).replace('-', '/'),
      total: d.total,
      orders: d.orders,
    }));
  }, [saleOrders]);

  // Real category data from products
  const categoryData = useMemo(() => {
    if (products.length === 0) {
      return categories.map((c, i) => ({
        name: c.categoryName || (c as any).name || 'Danh mục',
        value: 1,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));
    }

    const counts = new Map<string, number>();
    products.forEach((p) => {
      const cat = (p as any).categoryName || p.category || 'Khác';
      counts.set(cat, (counts.get(cat) || 0) + ((p as any).basePrice || p.price || 1000000));
    });

    return Array.from(counts.entries()).map(([name, val], idx) => ({
      name,
      value: val,
      color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
    }));
  }, [products, categories]);

  const totalValueSum = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString('vi-VN') + 'đ';
  }, [categoryData]);

  // Real live activity from recent sale orders
  const recentActivities = useMemo(() => {
    return saleOrders.slice(0, 5).map((o) => ({
      id: o.id || o.code,
      type: 'SALE',
      text: `Đơn hàng ${o.code} - ${o.customerName || 'Khách lẻ'}`,
      meta: `${((o as any).finalAmount || o.totalAmount || 0).toLocaleString('vi-VN')}đ • ${o.origin || 'POS'}`,
      time: o.date ? o.date.slice(11, 16) || o.date.slice(0, 10) : 'Vừa xong',
    }));
  }, [saleOrders]);

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
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dữ liệu thực tế</span>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11}} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}tr`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#818CF8' }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value) => [`${Number(value ?? 0).toLocaleString('vi-VN')}đ`, 'Doanh thu']}
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
                  formatter={(value) => `${Number(value ?? 0).toLocaleString('vi-VN')}đ`}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Total Metric Label */}
            <div className="absolute text-center select-none pointer-events-none">
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block">TỔNG GIÁ TRỊ</span>
              <span className="text-sm font-black text-gray-900 dark:text-white mt-0.5 block">{totalValueSum}</span>
            </div>
          </div>
          
          {/* Custom Sleek Legend Grid */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100 dark:border-gray-700/50">
            {categoryData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{item.name}</p>
                  <p className="text-[10px] font-semibold text-gray-400">{(item.value / 1000000).toFixed(1)}tr đ</p>
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
            {recentActivities.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">Chưa có giao dịch gần đây</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs leading-relaxed group">
                  <div className="relative flex flex-col items-center">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold border bg-indigo-50 border-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:border-indigo-900/20">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors">{act.text}</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">{act.meta}</p>
                  </div>
                  
                  <span className="text-[10px] text-gray-400 font-semibold shrink-0 font-mono self-start pt-0.5">{act.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
