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
        const res = await axiosClient.get<any, any>('/catalog/variants');
        const data = res?.data?.content || res?.data || res || [];
        if (Array.isArray(data) && data.length > 0) {
          setVariants(data);
        } else {
          // Fallback mock variants if API is empty
          setVariants([
            { id: '1', variantCode: 'VAR-PEPSI-330', sku: 'SKU-PEP-330', barcode: '893000000001', productName: 'Pepsi 330ml - Lon', unit: 'Lon', price: 10000, productId: '10' },
            { id: '2', variantCode: 'VAR-PEPSI-15L', sku: 'SKU-PEP-15L', barcode: '893000000002', productName: 'Pepsi 1.5L - Chai', unit: 'Chai', price: 22000, productId: '10' },
            { id: '3', variantCode: 'VAR-COCA-330', sku: 'SKU-COC-330', barcode: '893000000003', productName: 'Coca Cola 330ml - Lon', unit: 'Lon', price: 10500, productId: '11' },
            { id: '4', variantCode: 'VAR-MILK-1L', sku: 'SKU-MILK-1L', barcode: '893000000004', productName: 'Sữa tươi Vinamilk 1L - Hộp', unit: 'Hộp', price: 35000, productId: '12' },
          ]);
        }
      } catch (err) {
        console.error(err);
        setVariants([
          { id: '1', variantCode: 'VAR-PEPSI-330', sku: 'SKU-PEP-330', barcode: '893000000001', productName: 'Pepsi 330ml - Lon', unit: 'Lon', price: 10000, productId: '10' },
          { id: '2', variantCode: 'VAR-PEPSI-15L', sku: 'SKU-PEP-15L', barcode: '893000000002', productName: 'Pepsi 1.5L - Chai', unit: 'Chai', price: 22000, productId: '10' },
          { id: '3', variantCode: 'VAR-COCA-330', sku: 'SKU-COC-330', barcode: '893000000003', productName: 'Coca Cola 330ml - Lon', unit: 'Lon', price: 10500, productId: '11' },
          { id: '4', variantCode: 'VAR-MILK-1L', sku: 'SKU-MILK-1L', barcode: '893000000004', productName: 'Sữa tươi Vinamilk 1L - Hộp', unit: 'Hộp', price: 35000, productId: '12' },
        ]);
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
    subtitle: `SKU: ${v.sku || 'N/A'} | Mã vạch: ${v.barcode || 'N/A'} | ĐVT: ${v.unit || 'Cái'} | Giá: ${Number(v.price || 0).toLocaleString('vi-VN')} đ`,
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
      title="Chọn Sản Phẩm / Variant (Biến thể)"
      iconType="package"
      placeholder={loading ? "Đang tải danh sách biến thể..." : "Tìm theo tên, SKU, barcode..."}
      value={value || ''}
      options={options}
      onChange={(selectedId) => handleSelect(selectedId)}
    />
  );
}
