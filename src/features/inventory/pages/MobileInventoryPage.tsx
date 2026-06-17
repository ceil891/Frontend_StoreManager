import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Home, 
  Folder, 
  BarChart2, 
  Settings as SettingsIcon,
  Tag,
  MapPin,
  Boxes,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Smartphone,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';
import { useInventoryStore, type MobileProduct } from '../store/inventoryStore';

export function MobileInventoryPage() {
  const { products: rawProducts, addProduct, updateProduct, deleteProduct, fetchProducts } = useInventoryStore();
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const products = useMemo<MobileProduct[]>(() => {
    return rawProducts.map((p) => ({
      id: p.id,
      sku: p.sku || '',
      name: p.name || '',
      category: p.category || '',
      price: p.price || 0,
      costPrice: p.costPrice || 0,
      brand: p.brand || '',
      unit: p.unit || 'Cái',
      weight: p.weight || '0 kg',
      location: p.location || '',
      onHand: p.onHand || 0,
      status: p.status || 'ACTIVE',
      imageUrl: p.mainImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      barcodes: p.barcodes || [],
      reorderPoint: p.reorderPoint ?? 5,
      minStock: p.minStock ?? 2,
      maxStock: p.maxStock ?? 50,
      variants: p.variants || [],
    }));
  }, [rawProducts]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // UI Preview states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MobileProduct | null>(null);
  
  // CRUD states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MobileProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<MobileProduct | null>(null);
  
  // Bottom Tab active state
  const [activeTab, setActiveTab] = useState('inventory');
  
  // Form states
  const [formData, setFormData] = useState<Partial<MobileProduct>>({
    sku: '',
    name: '',
    category: 'Footwear',
    price: 0,
    costPrice: 0,
    brand: '',
    unit: 'Cái',
    weight: '0.0 kg',
    location: 'Kệ kho',
    onHand: 0,
    status: 'ACTIVE',
    imageUrl: '',
    barcodes: [],
    reorderPoint: 5,
    minStock: 2,
    maxStock: 50,
    variants: [],
  });

  // Filter categories
  const categories = ['All', 'Footwear', 'Electronics', 'Accessories'];

  // Handle live search & filtering
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const openCreateForm = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      category: 'Footwear',
      price: 0,
      costPrice: 0,
      brand: '',
      unit: 'Chiếc',
      weight: '0.5 kg',
      location: 'Kệ A3-01',
      onHand: 10,
      status: 'ACTIVE',
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' // default premium watch image
    });
    setIsFormOpen(true);
  };

  const openEditForm = (prod: MobileProduct) => {
    setEditingProduct(prod);
    setFormData({ ...prod });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      sku: formData.sku?.toUpperCase() || `SKU-${Date.now().toString().slice(-4)}`,
      name: formData.name || 'Sản phẩm mới',
      category: formData.category || 'Footwear',
      price: formData.price || 0,
      costPrice: formData.costPrice || 0,
      brand: formData.brand || 'Unbranded',
      unit: formData.unit || 'Cái',
      weight: formData.weight || '0.0 kg',
      location: formData.location || 'Kệ kho',
      onHand: formData.onHand || 0,
      status: formData.status || 'ACTIVE',
      imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
      barcodes: formData.barcodes?.length ? formData.barcodes : [formData.sku || ''],
      reorderPoint: formData.reorderPoint ?? 5,
      minStock: formData.minStock ?? 2,
      maxStock: formData.maxStock ?? 50,
      variants: formData.variants ?? [],
    };

    const mappedPayload = {
      sku: payload.sku,
      name: payload.name,
      category: payload.category,
      price: payload.price,
      costPrice: payload.costPrice,
      brand: payload.brand,
      unit: payload.unit,
      weight: payload.weight,
      location: payload.location,
      onHand: payload.onHand,
      status: payload.status,
      mainImage: payload.imageUrl,
      barcodes: payload.barcodes,
      reorderPoint: payload.reorderPoint,
      minStock: payload.minStock,
      maxStock: payload.maxStock,
      variants: payload.variants,
      units: [],
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, mappedPayload);
      if (selectedProduct && selectedProduct.id === editingProduct.id) {
        setSelectedProduct({ ...selectedProduct, ...payload } as MobileProduct);
      }
    } else {
      addProduct(mappedPayload);
    }
    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      if (selectedProduct && selectedProduct.id === productToDelete.id) {
        setSelectedProduct(null);
      }
      setProductToDelete(null);
    }
  };

  const isLowStock = (prod: MobileProduct) => prod.onHand <= prod.reorderPoint;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mobile UI Live Preview</h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Interactive Mockup
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Mô phỏng giao diện ứng dụng di động tối giản, nền gradient hoa oải hương với bố cục hai cột gọn gàng và khả năng tương tác trực tiếp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-sm"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" /> Thu nhỏ
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" /> Toàn màn hình di động
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={`flex items-center justify-center p-4 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md p-6 overflow-y-auto' : ''}`}>
        
        {/* Device Frame */}
        <div className={`relative bg-gray-950 rounded-[40px] border-[12px] border-gray-800 shadow-2xl transition-all duration-300 ${
          isFullscreen 
            ? 'w-full max-w-[420px] aspect-[9/19.5] h-[90vh] min-h-[750px] shadow-indigo-500/20 shadow-2xl' 
            : 'w-full max-w-[390px] aspect-[9/19.5] h-[780px]'
        } overflow-hidden flex flex-col font-sans select-none`}>
          
          {/* Notch / Dynamic Island */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-900 absolute right-4"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-950 absolute left-4"></div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 bg-gradient-to-tr from-sky-100 via-indigo-50 to-purple-100 dark:from-slate-900 dark:via-indigo-950/20 dark:to-purple-950/30 overflow-hidden flex flex-col relative">
            
            {/* Status Bar Mockup */}
            <div className="h-11 pt-1.5 px-6 flex items-center justify-between text-[11px] font-bold text-gray-700 dark:text-gray-300 z-30">
              <span>9:41 AM</span>
              <div className="flex items-center gap-1.5">
                <span>5G</span>
                <div className="w-5 h-2.5 border border-gray-700 dark:border-gray-300 rounded-[3px] p-[1px] flex items-center">
                  <div className="w-3 h-full bg-gray-700 dark:bg-gray-300 rounded-[1px]"></div>
                </div>
              </div>
            </div>

            {/* Screen Header */}
            <div className="px-5 pt-3 pb-2 z-20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">RETAIL HUB</span>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">Kho hàng di động</h2>
                </div>
                {/* Micro-interactive Notification bell / Sparkle */}
                <button 
                  onClick={() => alert("Chế độ lọc thông minh (AI Smart Filter) đã được kích hoạt!")}
                  className="w-9 h-9 rounded-full bg-white/70 dark:bg-slate-800/80 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-300 shadow-sm border border-white/50 dark:border-slate-700/50 active:scale-95 transition-transform"
                >
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-3.5 relative">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên, SKU, hãng..."
                  className="w-full bg-white/70 dark:bg-slate-800/80 backdrop-blur-md border border-white/60 dark:border-slate-700/60 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all font-semibold"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              {/* Category Scrollbar (Accessibility: high contrast) */}
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-white border border-white/40 dark:border-slate-700/40'
                    }`}
                  >
                    {cat === 'All' ? 'Tất cả' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid (Two-column layout, rounded cards, dropshadow) */}
            <div className="flex-1 overflow-y-auto px-5 pb-24 z-10 no-scrollbar">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 gap-3.5 pt-2">
                  {filteredProducts.map((prod) => (
                    <div 
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-white/60 dark:border-slate-700/60 rounded-[20px] p-2.5 shadow-md shadow-slate-200/50 dark:shadow-none hover:shadow-lg dark:hover:bg-slate-800 active:scale-98 transition-all duration-200 cursor-pointer flex flex-col group"
                    >
                      {/* Product Image */}
                      <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-100 mb-2 shadow-sm">
                        <img 
                          src={prod.imageUrl} 
                          alt={prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className={`absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[8px] font-extrabold tracking-wider uppercase ${
                          prod.status === 'ACTIVE' 
                            ? 'bg-emerald-500/90 text-white' 
                            : 'bg-slate-500/95 text-white'
                        }`}>
                          {prod.status === 'ACTIVE' ? 'Còn hàng' : 'Ngừng bán'}
                        </span>
                      </div>

                      {/* Product Specs */}
                      <span className="text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">{prod.brand}</span>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 mt-0.5 group-hover:text-indigo-600 transition-colors">{prod.name}</h3>
                      
                      {/* Pricing and Stock */}
                      <div className="flex items-baseline justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/50">
                        <span className="text-xs font-black text-slate-900 dark:text-white">${prod.price.toFixed(2)}</span>
                        <span className={`text-[10px] font-extrabold flex items-center gap-0.5 ${
                          isLowStock(prod) ? 'text-red-500' :
                          prod.onHand > 10 ? 'text-emerald-600 dark:text-emerald-400' :
                          prod.onHand > 0 ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {isLowStock(prod) && <AlertTriangle className="w-3 h-3" />}
                          {prod.onHand} {prod.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Smartphone className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Không tìm thấy sản phẩm</p>
                  <p className="text-xs text-slate-400 mt-1">Vui lòng thử tìm kiếm khác</p>
                </div>
              )}
            </div>

            {/* Floating Action Button (FAB) (Coral orange accent color, micro-interactive) */}
            <button
              onClick={openCreateForm}
              className="absolute bottom-20 right-5 w-12 h-12 rounded-full bg-gradient-to-tr from-coral-500 to-orange-500 hover:from-coral-600 hover:to-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 active:scale-90 hover:scale-105 active:rotate-90 transition-all z-20"
              style={{ backgroundColor: '#ff6f61' }} // Coral orange accent
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Screen Bottom Navigation (Simple outline icons) */}
            <div className="absolute bottom-0 inset-x-0 bg-white/70 dark:bg-slate-950/80 backdrop-blur-md border-t border-white/50 dark:border-slate-800/80 px-6 py-3 flex items-center justify-between z-20">
              <button 
                onClick={() => setActiveTab('home')}
                className={`flex flex-col items-center gap-0.5 transition-transform active:scale-90 ${activeTab === 'home' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <Home className="w-5 h-5 stroke-[2]" />
                <span className="text-[8px] font-bold">Tổng quan</span>
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`flex flex-col items-center gap-0.5 transition-transform active:scale-90 ${activeTab === 'inventory' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <Folder className="w-5 h-5 stroke-[2]" />
                <span className="text-[8px] font-bold">Danh mục</span>
              </button>
              <button 
                onClick={() => setActiveTab('stats')}
                className={`flex flex-col items-center gap-0.5 transition-transform active:scale-90 ${activeTab === 'stats' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <BarChart2 className="w-5 h-5 stroke-[2]" />
                <span className="text-[8px] font-bold">Báo cáo</span>
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex flex-col items-center gap-0.5 transition-transform active:scale-90 ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
              >
                <SettingsIcon className="w-5 h-5 stroke-[2]" />
                <span className="text-[8px] font-bold">Cài đặt</span>
              </button>
            </div>

            {/* Virtual Slide-in Bottom Detail Drawer (Within Mobile screen container) */}
            {selectedProduct && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-30 animate-fade-in flex flex-col justify-end">
                <div 
                  onClick={() => setSelectedProduct(null)} 
                  className="absolute inset-0 z-0"
                />
                <div className="bg-white dark:bg-slate-900 rounded-t-[32px] p-5 pb-6 border-t border-slate-100 dark:border-slate-800 z-10 animate-slide-up max-h-[90%] overflow-y-auto">
                  
                  {/* Slider indicator */}
                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />
                  
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{selectedProduct.brand}</span>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white mt-0.5 leading-tight">{selectedProduct.name}</h3>
                      <p className="text-[11px] font-bold text-slate-400 font-mono mt-1">SKU: {selectedProduct.sku}</p>
                      {selectedProduct.barcodes?.[0] && (
                        <p className="text-[10px] text-slate-500 font-mono">Barcode: {selectedProduct.barcodes.join(', ')}</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-105 active:scale-95 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Image and Primary stats */}
                  <div className="flex gap-4 mt-4">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm bg-slate-100 shrink-0">
                      <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Giá Bán</span>
                        <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">${selectedProduct.price.toFixed(2)}</p>
                      </div>
                      <div className={`p-2.5 rounded-xl border ${isLowStock(selectedProduct) ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'}`}>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tồn Kho</span>
                        <p className={`text-base font-black mt-0.5 ${isLowStock(selectedProduct) ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                          {selectedProduct.onHand} {selectedProduct.unit}
                          {isLowStock(selectedProduct) && <span className="text-[9px] block">Dưới định mức ({selectedProduct.reorderPoint})</span>}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Attributes Grid List */}
                  <div className="mt-5 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-1">Thuộc tính đầy đủ</h4>
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold">Danh mục</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedProduct.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold">Giá vốn</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">${selectedProduct.costPrice.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 shrink-0">
                          <Boxes className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold">Trọng lượng</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedProduct.weight}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold">Vị trí kho</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{selectedProduct.location}</p>
                        </div>
                      </div>
                    </div>
                    {selectedProduct.variants.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Biến thể (Size/Color)</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProduct.variants.map((v, i) => (
                            <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                              {[v.size, v.color].filter(Boolean).join(' / ') || v.skuSuffix}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions (Premium Edit/Delete integration inside mobile preview) */}
                  <div className="flex gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => openEditForm(selectedProduct)}
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                    >
                      <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                    </button>
                    <button
                      onClick={() => setProductToDelete(selectedProduct)}
                      className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-transform border border-red-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Virtual Create / Edit Form Modal (Within Mobile screen container) */}
            {isFormOpen && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-[340px] p-5 shadow-xl border border-slate-100 dark:border-slate-800 max-h-[85%] overflow-y-auto animate-fade-in no-scrollbar">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white">
                      {editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm di động'}
                    </h3>
                    <button 
                      onClick={() => setIsFormOpen(false)}
                      className="text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="space-y-3 mt-3.5 text-left">
                    {/* SKU */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Mã SKU *</label>
                      <input 
                        type="text"
                        required
                        disabled={!!editingProduct}
                        value={formData.sku || ''}
                        onChange={(e) => setFormData(p => ({ ...p, sku: e.target.value.toUpperCase() }))}
                        placeholder="Ví dụ: NK-AM24"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-mono disabled:opacity-50 text-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Tên */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Tên sản phẩm *</label>
                      <input 
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                        placeholder="Nike Air Max..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-semibold text-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Hàng & Danh mục */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Thương hiệu</label>
                        <input 
                          type="text"
                          value={formData.brand || ''}
                          onChange={(e) => setFormData(p => ({ ...p, brand: e.target.value }))}
                          placeholder="Nike, Apple..."
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-semibold text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Danh mục *</label>
                        <select 
                          required
                          value={formData.category || 'Footwear'}
                          onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-semibold text-slate-800 dark:text-white"
                        >
                          <option value="Footwear">Footwear</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>
                    </div>

                    {/* Giá & Giá vốn */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Giá bán *</label>
                        <input 
                          type="number"
                          step="0.01"
                          required
                          value={formData.price ?? ''}
                          onChange={(e) => setFormData(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-semibold text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Giá vốn *</label>
                        <input 
                          type="number"
                          step="0.01"
                          required
                          value={formData.costPrice ?? ''}
                          onChange={(e) => setFormData(p => ({ ...p, costPrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-semibold text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Mã vạch (Barcode)</label>
                      <input
                        type="text"
                        value={(formData.barcodes ?? []).join(', ')}
                        onChange={(e) => setFormData(p => ({ ...p, barcodes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                        placeholder="893..., nhiều mã cách nhau bởi dấu phẩy"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Điểm đặt lại</label>
                        <input type="number" value={formData.reorderPoint ?? 0} onChange={(e) => setFormData(p => ({ ...p, reorderPoint: parseInt(e.target.value, 10) || 0 }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Min</label>
                        <input type="number" value={formData.minStock ?? 0} onChange={(e) => setFormData(p => ({ ...p, minStock: parseInt(e.target.value, 10) || 0 }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-semibold" />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Max</label>
                        <input type="number" value={formData.maxStock ?? 0} onChange={(e) => setFormData(p => ({ ...p, maxStock: parseInt(e.target.value, 10) || 0 }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-semibold" />
                      </div>
                    </div>

                    {/* Tồn kho & Vị trí */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Số lượng *</label>
                        <input 
                          type="number"
                          required
                          value={formData.onHand ?? ''}
                          onChange={(e) => setFormData(p => ({ ...p, onHand: parseInt(e.target.value, 10) || 0 }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-semibold text-slate-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Vị trí</label>
                        <input 
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none font-semibold text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Image URL */}
                    <div>
                      <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Đường dẫn ảnh sản phẩm</label>
                      <input 
                        type="text"
                        value={formData.imageUrl || ''}
                        onChange={(e) => setFormData(p => ({ ...p, imageUrl: e.target.value }))}
                        placeholder="https://unsplash..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none text-slate-800 dark:text-white"
                      />
                    </div>

                    {/* Status */}
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                        <input 
                          type="radio" 
                          name="mobile_status" 
                          checked={formData.status === 'ACTIVE'}
                          onChange={() => setFormData(p => ({ ...p, status: 'ACTIVE' }))}
                          className="text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span>Còn hàng</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
                        <input 
                          type="radio" 
                          name="mobile_status" 
                          checked={formData.status === 'INACTIVE'}
                          onChange={() => setFormData(p => ({ ...p, status: 'INACTIVE' }))}
                          className="text-indigo-600 focus:ring-indigo-500" 
                        />
                        <span>Ngừng bán</span>
                      </label>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-sm"
                      >
                        {editingProduct ? 'Cập nhật' : 'Tạo mới'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Virtual Delete Confirmation Modal (Within Mobile screen container) */}
            {productToDelete && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-5">
                <div className="bg-white dark:bg-slate-900 rounded-[28px] w-full max-w-[320px] p-5 shadow-2xl border border-red-100 dark:border-red-950/20 text-center animate-fade-in">
                  <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500 mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white">Xác nhận xóa sản phẩm?</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-900 dark:text-white font-bold">{productToDelete.name}</strong> khỏi kho di động?
                  </p>
                  <p className="text-[10px] font-semibold text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-100 p-2 rounded-xl mt-3 leading-tight">
                    Lưu ý: Hành động này là hủy diệt và không thể hoàn tác!
                  </p>
                  
                  <div className="flex gap-2.5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setProductToDelete(null)}
                      className="flex-1 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      Bỏ qua
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md shadow-red-600/10 active:scale-95 transition-transform"
                    >
                      Đồng ý xóa
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
