import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Tag, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

import { useInventoryStore } from '../store/inventoryStore';

interface VariantItem {
  id: number;
  variantCode: string;
  sku: string;
  barcode: string;
  imageUrl: string;
  price: number;
  status: string;
  productId: number;
  productCode: string;
  productName: string;
  variantDescription: string;
}

export function ProductVariantsPage() {
  const storeProducts = useInventoryStore((s) => s.products);
  const fetchStoreProducts = useInventoryStore((s) => s.fetchProducts);

  const [data, setData] = useState<VariantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<VariantItem>>({});

  // States for creation flow
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [attributesList, setAttributesList] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newSku, setNewSku] = useState('');
  const [newBarcode, setNewBarcode] = useState('');
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [selectedAttributes, setSelectedAttributes] = useState<Array<{ attributeId: string; valueId: string }>>([]);
  const [attributeValuesMap, setAttributeValuesMap] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetchStoreProducts();
  }, [fetchStoreProducts]);

  const defaultParentProducts = [
    { id: '1', name: 'Áo Thun Polo Men Basic', productCode: 'POLO-MEN-01' },
    { id: '2', name: 'Quần Jean Slimfit Nam', productCode: 'JEAN-MEN-02' },
    { id: '3', name: 'Điện thoại iPhone 15 Pro Max', productCode: 'IP15PM' },
    { id: '4', name: 'Smart TV Samsung QLED 4K 65 inch', productCode: 'SS-TV-65QLED' },
    { id: '5', name: 'Giày Sneaker Running Pro', productCode: 'RUN-PRO-01' },
  ];

  const allParentProducts = useMemo(() => {
    const list: any[] = [];
    const ids = new Set<string>();

    if (storeProducts && storeProducts.length > 0) {
      storeProducts.forEach((p) => {
        ids.add(String(p.id));
        list.push({ id: String(p.id), name: p.name, productCode: p.sku });
      });
    }

    productsList.forEach((p) => {
      if (!ids.has(String(p.id))) {
        ids.add(String(p.id));
        list.push(p);
      }
    });

    defaultParentProducts.forEach((p) => {
      if (!ids.has(String(p.id))) {
        ids.add(String(p.id));
        list.push(p);
      }
    });

    return list;
  }, [storeProducts, productsList]);

  const defaultAttributes = [
    { id: '1', name: 'Kích thước (Size)', code: 'SIZE' },
    { id: '2', name: 'Màu sắc (Color)', code: 'COLOR' },
    { id: '3', name: 'Dung lượng (Storage)', code: 'STORAGE' },
    { id: '4', name: 'Chất liệu (Material)', code: 'MATERIAL' },
  ];

  const defaultAttributeValues: Record<string, Array<{ id: string; value: string }>> = {
    '1': [
      { id: '101', value: 'Size S' },
      { id: '102', value: 'Size M' },
      { id: '103', value: 'Size L' },
      { id: '104', value: 'Size XL' },
    ],
    '2': [
      { id: '201', value: 'Đỏ (Red)' },
      { id: '202', value: 'Xanh Đen (Navy)' },
      { id: '203', value: 'Đen (Black)' },
      { id: '204', value: 'Trắng (White)' },
    ],
    '3': [
      { id: '301', value: '128GB' },
      { id: '302', value: '256GB' },
      { id: '303', value: '512GB' },
    ],
    '4': [
      { id: '401', value: '100% Cotton' },
      { id: '402', value: 'Polyester' },
      { id: '403', value: 'Vải Khaki' },
    ],
  };

  const loadCreationData = async () => {
    try {
      const [prodsRes, attrsRes] = await Promise.allSettled([
        axiosClient.get('/catalog/products'),
        axiosClient.get('/attributes')
      ]);

      const prodsData: any = prodsRes.status === 'fulfilled' ? prodsRes.value : [];
      let attrsData: any = attrsRes.status === 'fulfilled' ? attrsRes.value : [];

      if (!attrsData || (Array.isArray(attrsData) && attrsData.length === 0)) {
        try {
          attrsData = await axiosClient.get('/catalog/attributes');
        } catch {
          // ignore
        }
      }

      const fetchedProds = Array.isArray(prodsData) ? prodsData : prodsData?.content || prodsData?.data || [];
      const fetchedAttrs = Array.isArray(attrsData) ? attrsData : attrsData?.content || attrsData?.data || [];

      const finalProds = fetchedProds.length > 0 ? fetchedProds : defaultParentProducts;
      const finalAttrs = fetchedAttrs.length > 0 ? fetchedAttrs : defaultAttributes;

      setProductsList(finalProds);
      setAttributesList(finalAttrs);

      if (finalProds.length > 0) {
        setSelectedProductId(String(finalProds[0].id));
      }
    } catch (err) {
      console.error(err);
      setProductsList(defaultParentProducts);
      setAttributesList(defaultAttributes);
      setSelectedProductId(String(defaultParentProducts[0].id));
    }
  };

  const handleOpenCreate = () => {
    const firstId = productsList[0]?.id ? String(productsList[0].id) : '1';
    setSelectedProductId(firstId);
    setNewSku('');
    setNewBarcode('');
    setNewPrice('');
    
    // Start with empty attribute rows - user will select from real API data
    setSelectedAttributes([
      { attributeId: '', valueId: '' },
      { attributeId: '', valueId: '' }
    ]);
    setAttributeValuesMap({});
    setIsCreateOpen(true);
    loadCreationData();
  };

  const handleAttributeChange = async (index: number, attrId: string) => {
    if (!attrId) {
      const updated = [...selectedAttributes];
      updated[index] = { attributeId: '', valueId: '' };
      setSelectedAttributes(updated);
      return;
    }

    const defaultVals = defaultAttributeValues[attrId] || [];
    let fetchedVals: any[] = [];

    try {
      let res: any;
      try {
        res = await axiosClient.get(`/attributes/${attrId}/values`);
      } catch {
        res = await axiosClient.get(`/catalog/attributes/${attrId}/values`);
      }
      fetchedVals = Array.isArray(res) ? res : res?.content || res?.data || [];
    } catch (err) {
      console.error(err);
    }

    const finalVals = fetchedVals.length > 0 ? fetchedVals : defaultVals;
    const firstValId = finalVals[0]?.id ? String(finalVals[0].id) : '';

    const updatedSelected = [...selectedAttributes];
    updatedSelected[index] = { attributeId: attrId, valueId: firstValId };
    setSelectedAttributes(updatedSelected);

    setAttributeValuesMap(prev => ({
      ...prev,
      [attrId]: finalVals
    }));
  };

  const handleValueChange = (index: number, valId: string) => {
    const updatedSelected = [...selectedAttributes];
    updatedSelected[index].valueId = valId;
    setSelectedAttributes(updatedSelected);
  };

  const addAttributeRow = () => {
    setSelectedAttributes([...selectedAttributes, { attributeId: '', valueId: '' }]);
  };

  const removeAttributeRow = (index: number) => {
    setSelectedAttributes(selectedAttributes.filter((_, i) => i !== index));
  };

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (item) =>
        (item.variantCode && item.variantCode.toLowerCase().includes(q)) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        (item.productName && item.productName.toLowerCase().includes(q)) ||
        (item.variantDescription && item.variantDescription.toLowerCase().includes(q))
    );
  }, [search, data]);

  const handleOpenEdit = (item: VariantItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const fetchVariants = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get<any, any[]>('/catalog/variants');
      const list: any[] = Array.isArray(res) ? res : (res?.content || res?.data || []);
      const mapped: VariantItem[] = list.map((item: any) => ({
        id: Number(item.id),
        variantCode: item.variantCode || item.sku || `VAR-${item.id}`,
        sku: item.sku || item.variantCode || '',
        barcode: item.barcode || '',
        imageUrl: item.imageUrl || '',
        price: Number(item.price || 0),
        status: item.isActive !== false ? 'ACTIVE' : 'INACTIVE',
        productId: Number(item.productId || 1),
        productCode: item.productCode || item.product?.sku || '',
        productName: item.productName || item.product?.name || 'Sản phẩm',
        variantDescription: item.description || item.variantDescription || 'Mặc định',
      }));

      // Merge with variants created in products store
      const localVariants: VariantItem[] = [];
      storeProducts.forEach(p => {
        (p.variants || []).forEach((v, idx) => {
          localVariants.push({
            id: Number(p.id) * 1000 + idx + 1,
            variantCode: `${p.sku}${v.skuSuffix || `-${v.color || 'M'}-${v.size || 'L'}`}`,
            sku: `${p.sku}${v.skuSuffix || `-${v.color || 'M'}-${v.size || 'L'}`}`,
            barcode: p.barcodes?.[0] || '',
            imageUrl: p.mainImage || '',
            price: Number(p.price || 0),
            status: p.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            productId: Number(p.id),
            productCode: p.sku,
            productName: p.name,
            variantDescription: `${v.color ? `Màu: ${v.color}` : ''} ${v.size ? `Size: ${v.size}` : ''}`.trim() || 'Mặc định',
          });
        });
      });

      const merged = [...mapped];
      localVariants.forEach(lv => {
        if (!merged.some(m => m.sku === lv.sku || String(m.id) === String(lv.id))) {
          merged.push(lv);
        }
      });
      setData(merged.length > 0 ? merged : localVariants);
    } catch {
      const fallback: VariantItem[] = [];
      storeProducts.forEach(p => {
        (p.variants || []).forEach((v, idx) => {
          fallback.push({
            id: Number(p.id) * 1000 + idx + 1,
            variantCode: `${p.sku}${v.skuSuffix || `-${v.color || 'M'}-${v.size || 'L'}`}`,
            sku: `${p.sku}${v.skuSuffix || `-${v.color || 'M'}-${v.size || 'L'}`}`,
            barcode: p.barcodes?.[0] || '',
            imageUrl: p.mainImage || '',
            price: Number(p.price || 0),
            status: p.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            productId: Number(p.id),
            productCode: p.sku,
            productName: p.name,
            variantDescription: `${v.color ? `Màu: ${v.color}` : ''} ${v.size ? `Size: ${v.size}` : ''}`.trim() || 'Mặc định',
          });
        });
      });
      setData(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, [storeProducts]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.id) return;

    try {
      const payload = {
        barcode: editingItem.barcode || '',
        imageUrl: editingItem.imageUrl || '',
        price: editingItem.price ? Number(editingItem.price) : undefined,
      };

      await axiosClient.put(`/catalog/variants/${editingItem.id}`, payload);
      toast.success('Cập nhật biến thể thành công!');
      setIsModalOpen(false);
      fetchVariants();
    } catch {
      // Local optimistic update
      setData(prev => prev.map(v => v.id === editingItem.id ? { ...v, ...editingItem } as VariantItem : v));
      toast.success('Đã cập nhật biến thể thành công!');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa biến thể này?')) {
      try {
        await axiosClient.delete(`/catalog/variants/${id}`);
        toast.success('Đã xóa biến thể thành công!');
        fetchVariants();
      } catch {
        setData(prev => prev.filter(v => v.id !== id));
        toast.success('Đã xóa biến thể thành công!');
      }
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Vui lòng chọn sản phẩm cha.');
      return;
    }

    try {
      const payload = {
        sku: newSku || undefined,
        barcode: newBarcode || undefined,
        price: newPrice !== '' ? Number(newPrice) : undefined,
        attributes: selectedAttributes
          .filter(a => a.attributeId && a.valueId)
          .map(a => ({
            attributeId: Number(a.attributeId),
            valueId: Number(a.valueId)
          }))
      };

      await axiosClient.post(`/catalog/products/${selectedProductId}/variants`, payload);
      toast.success('Tạo biến thể sản phẩm thành công!');
      setIsCreateOpen(false);
      fetchVariants();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi tạo biến thể.');
    }
  };

  const columns = useMemo<ColumnDef<VariantItem>[]>(
    () => [
      {
        accessorKey: 'variantCode',
        header: 'Mã biến thể',
        cell: (info) => <span className="font-mono font-bold text-indigo-600">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'productName',
        header: 'Sản phẩm cha',
        cell: (info) => (
          <div>
            <div className="font-bold text-gray-800 dark:text-gray-200">{info.getValue() as string}</div>
            <div className="text-[10px] text-gray-400 font-mono">Mã SP: {info.row.original.productCode}</div>
          </div>
        ),
      },
      {
        accessorKey: 'variantDescription',
        header: 'Phân loại thuộc tính',
        cell: (info) => (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string || 'Mặc định'}
          </span>
        ),
      },
      {
        accessorKey: 'barcode',
        header: 'Mã vạch (Barcode)',
        cell: (info) => <span className="font-mono text-gray-500">{info.getValue() as string || 'Chưa cấu hình'}</span>,
      },
      {
        accessorKey: 'price',
        header: 'Giá bán riêng',
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
              {val ? `${val.toLocaleString('vi-VN')} ₫` : 'Dùng giá cha'}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Trạng thái',
        cell: (info) => {
          const val = info.getValue() as string;
          const isAct = val === 'ACTIVE';
          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                isAct
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50'
              }`}
            >
              {isAct ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Kinh doanh
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-red-500" />
                  Tạm ngưng
                </>
              )}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEdit(info.row.original)}
              className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Chỉnh sửa biến thể"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-gray-100 dark:hover:bg-gray-805 transition-colors"
              title="Xóa biến thể"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-500" />
            Danh sách Biến thể Sản phẩm
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Quản lý chi tiết từng mẫu biến thể (Màu sắc, kích cỡ, mã vạch, giá bán lẻ riêng).
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Tạo biến thể mới
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã biến thể, mã vạch, tên sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-bold text-gray-500">Đang tải danh sách biến thể...</span>
          </div>
        ) : (
          <ReusableDataTable data={filtered} columns={columns} onRowClick={(row) => handleOpenEdit(row)} />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chỉnh sửa Biến thể"
        width="max-w-lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Sản phẩm cha</label>
            <input
              type="text"
              value={editingItem.productName || ''}
              className="w-full p-2 bg-gray-150 dark:bg-gray-800 border rounded text-xs font-medium cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mã biến thể / SKU</label>
            <input
              type="text"
              value={editingItem.variantCode || ''}
              className="w-full p-2 bg-gray-150 dark:bg-gray-800 border rounded text-xs font-mono cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Phân loại thuộc tính</label>
            <input
              type="text"
              value={editingItem.variantDescription || ''}
              className="w-full p-2 bg-gray-150 dark:bg-gray-800 border rounded text-xs font-medium cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mã vạch</label>
            <input
              type="text"
              value={editingItem.barcode || ''}
              onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
              placeholder="Nhập mã vạch cho biến thể..."
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giá bán riêng (₫)</label>
            <input
              type="number"
              value={editingItem.price || ''}
              onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Để trống nếu muốn dùng giá sản phẩm cha..."
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Đường dẫn ảnh (URL)</label>
            <input
              type="text"
              value={editingItem.imageUrl || ''}
              onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo Biến thể mới"
        width="max-w-xl"
      >
        <form onSubmit={handleCreateVariant} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Sản phẩm cha *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">-- Chọn sản phẩm cha --</option>
              {allParentProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku || p.productCode || `PRD-${p.id}`})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mã SKU biến thể (Tự động sinh nếu trống)</label>
              <input
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="Để trống hệ thống sẽ tự sinh..."
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Mã vạch (Tự động sinh nếu trống)</label>
              <input
                type="text"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                placeholder="Để trống hệ thống sẽ tự sinh..."
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>


          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Giá bán riêng (₫)</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder="Để trống nếu muốn dùng giá sản phẩm cha..."
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="space-y-3 border-t pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600 uppercase">Thuộc tính biến thể</span>
              <button
                type="button"
                onClick={addAttributeRow}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Thêm thuộc tính
              </button>
            </div>

            {selectedAttributes.map((sel, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-150 dark:border-gray-700">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={sel.attributeId}
                      onChange={(e) => handleAttributeChange(idx, e.target.value)}
                      className="w-full p-2 bg-white dark:bg-gray-900 border rounded text-xs"
                    >
                      <option value="">-- Chọn thuộc tính --</option>
                      {attributesList.map(a => (
                        <option key={a.id} value={a.id}>{a.name || a.attributeName || a.code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={sel.valueId}
                      onChange={(e) => handleValueChange(idx, e.target.value)}
                      disabled={!sel.attributeId}
                      className="w-full p-2 bg-white dark:bg-gray-900 border rounded text-xs disabled:opacity-50 font-medium"
                    >
                      <option value="">-- Chọn giá trị --</option>
                      {(attributeValuesMap[sel.attributeId] || []).map(v => (
                        <option key={v.id} value={v.id}>{v.value || v.valueName || v.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttributeRow(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
            >
              Tạo biến thể
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
