import { useState, useEffect } from 'react';
import { SearchLookupModal } from '@/shared/components/ui/SearchLookupModal';
import { axiosClient } from '@/shared/lib/axiosClient';

export interface SelectedVariantInfo {
  variantId?: string;
  productId?: string;
  sku: string;
  barcode: string;
  productName: string;
  unit: string;
  unitPrice: number;
}

interface QuoteVariantSelectorProps {
  value?: string;
  onChange: (selected: SelectedVariantInfo) => void;
}

export function QuoteVariantSelector({ value, onChange }: QuoteVariantSelectorProps) {
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVariants = async () => {
      setLoading(true);
      try {
        // First try fetching products
        const res = await axiosClient.get<any, any>('/products?size=500');
        const list = res?.data?.content || res?.content || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        if (Array.isArray(list) && list.length > 0) {
          const mapped = list.map((p: any) => ({
            id: String(p.id),
            variantCode: p.productCode || p.barcode || `VAR-${p.id}`,
            sku: p.productCode || p.sku || `SKU-${p.id}`,
            barcode: p.barcode || '',
            productName: p.name || p.productName || 'Sản phẩm',
            unit: p.baseUnit?.unitName || p.unit || 'Cái',
            price: Number(p.costPrice || p.importPrice || p.retailPrice || p.price || 0),
            productId: String(p.id),
          }));
          setVariants(mapped);
          return;
        }

        // Fallback to catalog variants if available
        const varRes = await axiosClient.get<any, any>('/catalog/variants');
        const varList = varRes?.data?.content || varRes?.data || varRes || [];
        if (Array.isArray(varList) && varList.length > 0) {
          setVariants(varList);
        }
      } catch (err) {
        console.error('Error fetching variants in QuoteVariantSelector:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVariants();
  }, []);

  const options = variants.map((v) => ({
    id: String(v.id),
    code: v.sku || v.variantCode || `VAR-${v.id}`,
    name: v.productName || v.product?.name || v.name || 'Biến thể sản phẩm',
    subtitle: `SKU: ${v.sku || 'Không có'} | Mã vạch: ${v.barcode || 'Không có'} | ĐVT: ${v.unit || 'Cái'} | Giá: ${Number(v.price || 0).toLocaleString('vi-VN')} đ`,
  }));

  const handleSelect = (selectedId: string) => {
    const found = variants.find((v) => String(v.id) === selectedId);
    if (found) {
      onChange({
        variantId: String(found.id),
        productId: found.productId ? String(found.productId) : (found.product?.id ? String(found.product.id) : undefined),
        sku: found.sku || found.variantCode || '',
        barcode: found.barcode || '',
        productName: found.productName || found.product?.name || found.name || 'Sản phẩm',
        unit: found.unit || 'Cái',
        unitPrice: Number(found.price || 0),
      });
    }
  };

  return (
    <SearchLookupModal
      title="Chọn sản phẩm / biến thể"
      iconType="package"
      placeholder={loading ? "Đang tải danh sách biến thể..." : "Tìm theo tên, SKU, mã vạch..."}
      value={value || ''}
      options={options}
      onChange={(selectedId) => handleSelect(selectedId)}
    />
  );
}
