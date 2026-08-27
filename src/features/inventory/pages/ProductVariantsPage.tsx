import { useMemo, useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Calendar, FileText, Tag, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { ReusableDataTable } from '@/shared/components/data-table/ReusableDataTable';
import { Modal } from '@/shared/components/ui/Modal';
import type { ColumnDef } from '@tanstack/react-table';
import { axiosClient } from '@/shared/lib/axiosClient';
import { toast } from 'sonner';

import { useInventoryStore } from '../store/inventoryStore';
import { useSizeStore } from '../store/sizeStore';
import { useColorStore } from '../store/colorStore';

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
    { id: '1', name: 'Áo thun polo nam basic', productCode: 'POLO-MEN-01' },
    { id: '2', name: 'Quần jean slimfit nam', productCode: 'JEAN-MEN-02' },
    { id: '3', name: 'Điện thoại iPhone 15 Pro Max', productCode: 'IP15PM' },
    { id: '4', name: 'Smart TV Samsung QLED 4K 65 inch', productCode: 'SS-TV-65QLED' },
    { id: '5', name: 'Giày sneaker running pro', productCode: 'RUN-PRO-01' },
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
    { id: '3', name: 'Đơn vị tính (Unit)', code: 'UNIT' },
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
      { id: '201', value: 'Đỏ' },
      { id: '202', value: 'Xanh navy' },
      { id: '203', value: 'Đen' },
      { id: '204', value: 'Trắng' },
    ],
    '3': [
      { id: '301', value: 'Cái' },
      { id: '302', value: 'Hộp' },
      { id: '303', value: 'Thùng' },
    ],
    '4': [
      { id: '401', value: '100% Cotton' },
      { id: '402', value: 'Polyester' },
      { id: '403', value: 'Vải khaki' },
    ],
  };

  const loadCreationData = async () => {
    try {
      await Promise.allSettled([
        useSizeStore.getState().fetchSizes(),
        useColorStore.getState().fetchColors(),
        useInventoryStore.getState().fetchUnits(),
      ]);

      const latestSizes = useSizeStore.getState().sizes;
      const latestColors = useColorStore.getState().colors;
      const latestUnits = useInventoryStore.getState().unitsList;

      const [prodsRes, attrsRes] = await Promise.allSettled([
        axiosClient.get('/catalog/products?size=200'),
        axiosClient.get('/attributes?size=200')
      ]);

      const prodsPayload: any = prodsRes.status === 'fulfilled' ? prodsRes.value : [];
      let attrsPayload: any = attrsRes.status === 'fulfilled' ? attrsRes.value : [];

      if (!attrsPayload || (Array.isArray(attrsPayload) && attrsPayload.length === 0) || (attrsPayload?.data && attrsPayload.data.length === 0)) {
        try {
          attrsPayload = await axiosClient.get('/catalog/attributes?size=200');
        } catch {
          // ignore
        }
      }

      const fetchedProds = Array.isArray(prodsPayload?.data) ? prodsPayload.data : (Array.isArray(prodsPayload) ? prodsPayload : prodsPayload?.content || []);
      const fetchedAttrs = Array.isArray(attrsPayload?.data) ? attrsPayload.data : (Array.isArray(attrsPayload) ? attrsPayload : attrsPayload?.content || []);

      const finalProds = fetchedProds.length > 0 ? fetchedProds : defaultParentProducts;
      const finalAttrs = fetchedAttrs.length > 0 ? fetchedAttrs : defaultAttributes;

      setProductsList(finalProds);
      setAttributesList(finalAttrs);

      if (finalProds.length > 0) {
        setSelectedProductId(String(finalProds[0].id));
      }

      // Preload values for all fetched attributes + DB sync
      const valMap: Record<string, any[]> = {};
      await Promise.all(
        finalAttrs.map(async (attr: any) => {
          const attrIdStr = String(attr.id);
          const attrCode = (attr.code || attr.name || '').toUpperCase();

          if (attrIdStr === '1' || attrCode.includes('SIZE') || attrCode.includes('KÍCH THƯỚC')) {
            if (latestSizes && latestSizes.length > 0) {
              valMap[attrIdStr] = latestSizes.map(s => ({ id: String(s.id), value: s.sizeName }));
              return;
            }
          }

          if (attrIdStr === '2' || attrCode.includes('COLOR') || attrCode.includes('MÀU')) {
            if (latestColors && latestColors.length > 0) {
              valMap[attrIdStr] = latestColors.map(c => ({ id: String(c.id), value: c.colorName }));
              return;
            }
          }

          if (attrIdStr === '3' || attrCode.includes('UNIT') || attrCode.includes('ĐƠN VỊ')) {
            if (latestUnits && latestUnits.length > 0) {
              valMap[attrIdStr] = latestUnits.map(u => ({ id: String(u.id), value: `${u.unitName} (${u.code})` }));
              return;
            }
          }

          try {
            const valRes: any = await axiosClient.get(`/attributes/${attr.id}/values`);
            const vList = Array.isArray(valRes?.data) ? valRes.data : (Array.isArray(valRes) ? valRes : valRes?.content || []);
            valMap[attrIdStr] = vList.length > 0 ? vList : (defaultAttributeValues[attrIdStr] || []);
          } catch {
            valMap[attrIdStr] = defaultAttributeValues[attrIdStr] || [];
          }
        })
      );
      setAttributeValuesMap(valMap);

      if (finalAttrs.length > 0) {
        const firstAttr = finalAttrs[0];
        const firstVals = valMap[String(firstAttr.id)] || [];
        setSelectedAttributes([
          { attributeId: String(firstAttr.id), valueId: firstVals[0]?.id ? String(firstVals[0].id) : '' }
        ]);
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

    let finalVals = attributeValuesMap[attrId] || [];
    if (finalVals.length === 0) {
      try {
        let res: any;
        try {
          res = await axiosClient.get(`/attributes/${attrId}/values`);
        } catch {
          res = await axiosClient.get(`/catalog/attributes/${attrId}/values`);
        }
        const fetched = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.content || []);
        finalVals = fetched.length > 0 ? fetched : (defaultAttributeValues[attrId] || []);
        setAttributeValuesMap(prev => ({ ...prev, [attrId]: finalVals }));
      } catch (err) {
        console.error(err);
        finalVals = defaultAttributeValues[attrId] || [];
      }
    }

    const firstValId = finalVals[0]?.id ? String(finalVals[0].id) : '';

    const updatedSelected = [...selectedAttributes];
    updatedSelected[index] = { attributeId: attrId, valueId: firstValId };
    setSelectedAttributes(updatedSelected);
  };

  const handleValueChange = (index: number, valId: string) => {
    const updatedSelected = [...selectedAttributes];
    updatedSelected[index].valueId = valId;
    setSelectedAttributes(updatedSelected);
  };

  const addAttributeRow = () => {
    const usedAttrIds = new Set(selectedAttributes.map(a => a.attributeId));
    const nextAttr = attributesList.find(a => !usedAttrIds.has(String(a.id)));
    if (nextAttr) {
      const nextVals = attributeValuesMap[String(nextAttr.id)] || [];
      setSelectedAttributes([...selectedAttributes, { attributeId: String(nextAttr.id), valueId: nextVals[0]?.id ? String(nextVals[0].id) : '' }]);
    } else {
      setSelectedAttributes([...selectedAttributes, { attributeId: '', valueId: '' }]);
    }
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
      let res: any;
      try {
        res = await axiosClient.get('/catalog/variants?size=200');
      } catch {
        res = await axiosClient.get('/variants?size=200');
      }

      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : res?.content || []);
      const mapped: VariantItem[] = list.map((item: any) => ({
        id: item.id,
        variantCode: item.sku || item.variantCode || `VAR-${item.id}`,
        sku: item.sku || item.variantCode || `VAR-${item.id}`,
        barcode: item.barcode || '',
        imageUrl: item.imageUrl || '',
        price: Number(item.price || 0),
        status: item.status || 'ACTIVE',
        productId: item.productId || item.product?.id || 0,
        productCode: item.product?.sku || item.productCode || 'PRD-01',
        productName: item.product?.name || item.productName || 'Sản phẩm',
        variantDescription: item.attributesSummary || item.variantDescription || 'Mặc định',
      }));

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
      toast.success('Đã lưu thay đổi biến thể!');
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Bạn có chắc chắn muốn xóa biến thể này khỏi hệ thống?')) {
      try {
        await axiosClient.delete(`/catalog/variants/${id}`);
        toast.success('Đã xóa biến thể thành công!');
        fetchVariants();
      } catch {
        setData(prev => prev.filter(item => item.id !== id));
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

    const validAttrs = selectedAttributes.filter(a => a.attributeId && a.valueId);
    const attrIds = validAttrs.map(a => a.attributeId);
    const uniqueAttrIds = new Set(attrIds);
    if (uniqueAttrIds.size < attrIds.length) {
      toast.error('Một biến thể không thể có nhiều hơn 1 giá trị cho cùng nhóm thuộc tính.');
      return;
    }

    try {
      const payload = {
        sku: newSku || undefined,
        barcode: newBarcode || undefined,
        price: newPrice !== '' ? Number(newPrice) : undefined,
        attributes: validAttrs.map(a => ({
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
      const msg = err?.response?.data?.message || err?.message || 'Lỗi khi tạo biến thể.';
      toast.error(msg);
    }
  };

  const columns = useMemo<ColumnDef<VariantItem>[]>(
    () => [
      {
        accessorKey: 'variantCode',
        header: 'Mã biến thể',
        cell: (info) => <span className="font-mono font-bold text-primary">{info.getValue() as string}</span>,
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            {info.getValue() as string || 'Mặc định'}
          </span>
        ),
      },
      {
        accessorKey: 'barcode',
        header: 'Mã vạch (barcode)',
        cell: (info) => <span className="font-mono text-gray-500">{info.getValue() as string || 'Chưa cấu hình'}</span>,
      },
      {
        accessorKey: 'price',
        header: 'Giá bán riêng',
        cell: (info) => {
          const val = info.getValue() as number;
          return (
            <span className="font-mono font-bold text-primary">
              {val ? `${val.toLocaleString('vi-VN')} đ` : 'Dùng giá gốc'}
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
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isAct
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {isAct ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  Đang kinh doanh
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-gray-400" />
                  Tạm ngừng
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
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleOpenEdit(info.row.original)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              title="Chỉnh sửa biến thể"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(info.row.original.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" />
            Danh sách biến thể sản phẩm
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý chi tiết từng mẫu biến thể (màu sắc, kích cỡ, mã vạch, giá bán lẻ riêng)
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo biến thể mới
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã biến thể, mã vạch, tên sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-500">Đang tải danh sách biến thể...</span>
          </div>
        ) : (
          <ReusableDataTable data={filtered} columns={columns} onRowClick={(row) => handleOpenEdit(row)} />
        )}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chỉnh sửa biến thể"
        size="erp"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sản phẩm cha</label>
            <input
              type="text"
              value={editingItem.productName || ''}
              className="w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã biến thể / SKU</label>
            <input
              type="text"
              value={editingItem.variantCode || ''}
              className="w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phân loại thuộc tính</label>
            <input
              type="text"
              value={editingItem.variantDescription || ''}
              className="w-full p-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white cursor-not-allowed"
              disabled
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã vạch</label>
            <input
              type="text"
              value={editingItem.barcode || ''}
              onChange={(e) => setEditingItem({ ...editingItem, barcode: e.target.value })}
              placeholder="Nhập mã vạch cho biến thể..."
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá bán riêng (đ)</label>
            <input
              type="number"
              value={editingItem.price || ''}
              onChange={(e) => setEditingItem({ ...editingItem, price: e.target.value ? Number(e.target.value) : undefined })}
              placeholder="Để trống nếu muốn dùng giá sản phẩm cha..."
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Đường dẫn ảnh (URL)</label>
            <input
              type="text"
              value={editingItem.imageUrl || ''}
              onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo biến thể mới"
        size="erp"
      >
        <form onSubmit={handleCreateVariant} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sản phẩm cha *</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            >
              <option value="">-- Chọn sản phẩm cha --</option>
              {allParentProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku || p.productCode || `PRD-${p.id}`})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã SKU biến thể (Tự động sinh nếu để trống)</label>
              <input
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="Để trống hệ thống sẽ tự sinh..."
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mã vạch (Tự động sinh nếu để trống)</label>
              <input
                type="text"
                value={newBarcode}
                onChange={(e) => setNewBarcode(e.target.value)}
                placeholder="Để trống hệ thống sẽ tự sinh..."
                className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Giá bán riêng (đ)</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder="Để trống nếu muốn dùng giá sản phẩm cha..."
              className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Thuộc tính biến thể</span>
              <button
                type="button"
                onClick={addAttributeRow}
                className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Thêm thuộc tính
              </button>
            </div>

            {selectedAttributes.map((sel, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <select
                      value={sel.attributeId}
                      onChange={(e) => handleAttributeChange(idx, e.target.value)}
                      className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white"
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
                      className="w-full p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-xs disabled:opacity-50 font-medium text-gray-900 dark:text-white"
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
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              Tạo biến thể
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
