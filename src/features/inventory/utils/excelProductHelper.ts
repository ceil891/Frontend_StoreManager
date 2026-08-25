import * as XLSX from 'xlsx';

export interface RawParsedProductRow {
  rowIndex: number;
  productCode: string;
  name: string;
  categoryName: string;
  brand: string;
  barcode: string;
  baseUnitName: string;
  basePrice: number;
  costPrice: number;
  initialStock: number;
  weight: number;
  reorderPoint: number;
  minStock: number;
  description: string;
  // Multi-tier unit level 2
  unit2Name?: string;
  unit2Rate?: number;
  unit2Price?: number;
  unit2Barcode?: string;
  // Multi-tier unit level 3
  unit3Name?: string;
  unit3Rate?: number;
  unit3Price?: number;
  unit3Barcode?: string;
  // Multi-tier unit level 4
  unit4Name?: string;
  unit4Rate?: number;
  unit4Price?: number;
  unit4Barcode?: string;
  // Flexible string syntax: "Lốc:6:58000:893801 | Thùng:24:225000:893802"
  customUnitsRaw?: string;
}

export interface ValidatedProductRow extends RawParsedProductRow {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  resolvedCategoryId?: number;
  resolvedBaseUnitId?: number;
  conversionUnits: {
    unitId?: number;
    unitName: string;
    conversionRate: number;
    price: number;
    barcode?: string;
  }[];
}

export interface UnitConversionPreset {
  id: string;
  name: string;
  industry: string;
  description: string;
  baseUnitName: string;
  tiers: {
    level: number;
    unitName: string;
    suggestedRate: number;
    priceMultiplier?: number; // e.g. 0.95 (5% wholesale discount)
  }[];
}

export const UNIT_CONVERSION_PRESETS: UnitConversionPreset[] = [
  {
    id: 'fmcg_beverage',
    name: 'Nước giải khát / Bia (Lon ➔ Lốc ➔ Thùng)',
    industry: 'Đồ uống, FMCG',
    description: 'Chuỗi quy đổi chuẩn 3 cấp cho lon nước ngọt, bia lon',
    baseUnitName: 'Lon',
    tiers: [
      { level: 2, unitName: 'Lốc', suggestedRate: 6, priceMultiplier: 5.8 },
      { level: 3, unitName: 'Thùng', suggestedRate: 24, priceMultiplier: 22.5 },
    ],
  },
  {
    id: 'fmcg_bottle',
    name: 'Nước đóng chai / Rượu (Chai ➔ Két / Thùng)',
    industry: 'Bia rượu, Đồ uống',
    description: 'Chuỗi quy đổi cho nước ngọt chai, bia chai, sữa chai',
    baseUnitName: 'Chai',
    tiers: [
      { level: 2, unitName: 'Lốc', suggestedRate: 6, priceMultiplier: 5.9 },
      { level: 3, unitName: 'Két', suggestedRate: 20, priceMultiplier: 19.0 },
      { level: 3, unitName: 'Thùng', suggestedRate: 24, priceMultiplier: 22.8 },
    ],
  },
  {
    id: 'pharmacy_pill',
    name: 'Dược phẩm / Thuốc viên (Viên ➔ Vỉ ➔ Hộp)',
    industry: 'Nhà thuốc, Dược phẩm',
    description: 'Chuỗi quy đổi 3 cấp thuốc viên tây y, thực phẩm chức năng',
    baseUnitName: 'Viên',
    tiers: [
      { level: 2, unitName: 'Vỉ', suggestedRate: 10, priceMultiplier: 9.5 },
      { level: 3, unitName: 'Hộp', suggestedRate: 100, priceMultiplier: 90.0 },
    ],
  },
  {
    id: 'pharmacy_sachet',
    name: 'Dược phẩm dạng gói (Gói ➔ Hộp ➔ Thùng)',
    industry: 'Dược phẩm, Mỹ phẩm',
    description: 'Chuỗi quy đổi thuốc bột, cốm, men vi sinh',
    baseUnitName: 'Gói',
    tiers: [
      { level: 2, unitName: 'Hộp', suggestedRate: 20, priceMultiplier: 19.0 },
      { level: 3, unitName: 'Thùng', suggestedRate: 400, priceMultiplier: 360.0 },
    ],
  },
  {
    id: 'grocery_snack',
    name: 'Bách hóa / Bánh kẹo (Gói ➔ Hộp / Bịch ➔ Thùng)',
    industry: 'Tạp hóa, Siêu thị mini',
    description: 'Chuỗi quy đổi snack, bánh mì tươi, gia vị đóng gói',
    baseUnitName: 'Gói',
    tiers: [
      { level: 2, unitName: 'Hộp', suggestedRate: 12, priceMultiplier: 11.5 },
      { level: 3, unitName: 'Thùng', suggestedRate: 48, priceMultiplier: 45.0 },
    ],
  },
  {
    id: 'hardware_piece',
    name: 'Đồ kim khí / Phụ kiện (Cái ➔ Hộp ➔ Thùng)',
    industry: 'Kim khí, Điện nước',
    description: 'Quy đổi ốc vít, bu lông, phụ kiện điện nước',
    baseUnitName: 'Cái',
    tiers: [
      { level: 2, unitName: 'Hộp', suggestedRate: 50, priceMultiplier: 48.0 },
      { level: 3, unitName: 'Thùng', suggestedRate: 500, priceMultiplier: 450.0 },
    ],
  },
];

/**
 * Generates and triggers download of a standardized Excel template with sample products & multi-level units.
 */
export function downloadProductExcelTemplate(
  categories: { id: string | number; categoryName: string; code?: string }[] = [],
  units: { id: string | number; unitName: string; code?: string }[] = []
) {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Danh sách sản phẩm mẫu ──────────────────────────
  const sampleHeaders = [
    'Mã SKU',
    'Tên sản phẩm (*)',
    'Danh mục (*)',
    'Thương hiệu',
    'Mã vạch cơ bản',
    'Đơn vị cơ bản (*)',
    'Giá bán lẻ cơ bản (*)',
    'Giá vốn',
    'Tồn kho ban đầu',
    'ĐVT cấp 2 (Tên)',
    'Tỷ lệ quy đổi ĐVT 2',
    'Giá bán ĐVT 2',
    'Mã vạch ĐVT 2',
    'ĐVT cấp 3 (Tên)',
    'Tỷ lệ quy đổi ĐVT 3',
    'Giá bán ĐVT 3',
    'Mã vạch ĐVT 3',
    'ĐVT cấp 4 (Tên)',
    'Tỷ lệ quy đổi ĐVT 4',
    'Giá bán ĐVT 4',
    'Mã vạch ĐVT 4',
    'ĐVT mở rộng (Tên:Tỷ lệ:Giá:Barcode|...)',
    'Trọng lượng (g)',
    'Điểm đặt hàng lại',
    'Tồn kho tối thiểu',
    'Mô tả sản phẩm',
  ];

  const sampleRows = [
    [
      'PRD-COCA-330',
      'Nước ngọt Coca-Cola Sleek 330ml',
      categories[0]?.categoryName || 'Nước giải khát',
      'Coca-Cola',
      '8935001800011',
      'Lon',
      10000,
      7500,
      120,
      'Lốc',
      6,
      58000,
      '8935001800028',
      'Thùng',
      24,
      225000,
      '8935001800035',
      '',
      '',
      '',
      '',
      '',
      350,
      24,
      12,
      'Nước giải khát có ga vị nguyên bản đóng lon 330ml tiện lợi',
    ],
    [
      'PRD-PEPSI-330',
      'Nước ngọt Pepsi Sleek 330ml',
      categories[0]?.categoryName || 'Nước giải khát',
      'Pepsi',
      '8935002200014',
      'Lon',
      10000,
      7400,
      96,
      'Lốc',
      6,
      57000,
      '8935002200021',
      'Thùng',
      24,
      220000,
      '8935002200038',
      '',
      '',
      '',
      '',
      '',
      350,
      24,
      12,
      'Nước giải khát vị cola thanh mát sảng khoái',
    ],
    [
      'PRD-PANADOL-EX',
      'Thuốc giảm đau hạ sốt Panadol Extra Đỏ',
      categories[1]?.categoryName || 'Dược phẩm',
      'GSK',
      '8936001000015',
      'Viên',
      2000,
      1400,
      500,
      'Vỉ',
      10,
      19000,
      '8936001000022',
      'Hộp',
      100,
      180000,
      '8936001000039',
      'Thùng',
      1000,
      1750000,
      '8936001000046',
      '',
      5,
      100,
      50,
      'Thuốc giảm đau hạ sốt paracetamol kết hợp caffeine',
    ],
    [
      'PRD-OISHI-SNACK',
      'Snack bắp ngọt Oishi Corn Snack 40g',
      categories[2]?.categoryName || 'Bánh kẹo & Ăn vặt',
      'Oishi',
      '8935003300018',
      'Gói',
      6000,
      4200,
      200,
      'Bịch',
      10,
      58000,
      '8935003300025',
      'Thùng',
      60,
      340000,
      '8935003300032',
      '',
      '',
      '',
      '',
      '',
      45,
      60,
      20,
      'Bánh snack ngô thơm ngon giòn rụm',
    ],
    [
      'PRD-AQUA-500',
      'Nước khoáng thiên nhiên Aquafina 500ml',
      categories[0]?.categoryName || 'Nước giải khát',
      'Aquafina',
      '8935004400012',
      'Chai',
      6000,
      3800,
      150,
      'Lốc',
      6,
      34000,
      '8935004400029',
      'Thùng',
      24,
      130000,
      '8935004400036',
      '',
      '',
      '',
      '',
      '',
      530,
      48,
      24,
      'Nước tinh khiết đóng chai 500ml thanh khiết mát lành',
    ],
    [
      'PRD-STABILO-PEN',
      'Bút bi gel nước Stabilo 0.5mm Đen',
      categories[3]?.categoryName || 'Văn phòng phẩm',
      'Stabilo',
      '8937005500019',
      'Cây',
      15000,
      10500,
      80,
      'Hộp',
      12,
      170000,
      '8937005500026',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      20,
      24,
      12,
      'Bút gel viết êm trơn mực đều nhanh khô',
    ],
  ];

  const wsProducts = XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]);

  // Set column widths
  wsProducts['!cols'] = [
    { wch: 18 }, // Mã SKU
    { wch: 38 }, // Tên SP
    { wch: 22 }, // Danh mục
    { wch: 16 }, // Thương hiệu
    { wch: 18 }, // Barcode cơ bản
    { wch: 18 }, // Đơn vị cơ bản
    { wch: 20 }, // Giá bán lẻ
    { wch: 14 }, // Giá vốn
    { wch: 16 }, // Tồn kho
    { wch: 16 }, // ĐVT 2
    { wch: 18 }, // Tỷ lệ 2
    { wch: 16 }, // Giá bán 2
    { wch: 18 }, // Barcode 2
    { wch: 16 }, // ĐVT 3
    { wch: 18 }, // Tỷ lệ 3
    { wch: 16 }, // Giá bán 3
    { wch: 18 }, // Barcode 3
    { wch: 16 }, // ĐVT 4
    { wch: 18 }, // Tỷ lệ 4
    { wch: 16 }, // Giá bán 4
    { wch: 18 }, // Barcode 4
    { wch: 30 }, // ĐVT mở rộng
    { wch: 15 }, // Trọng lượng
    { wch: 18 }, // Điểm đặt lại
    { wch: 18 }, // Tồn tối thiểu
    { wch: 45 }, // Mô tả
  ];

  XLSX.utils.book_append_sheet(wb, wsProducts, 'Danh sách sản phẩm');

  // ── Sheet 2: Hướng dẫn & Quy tắc ĐVT ────────────────────────
  const guideHeaders = ['Tên cột / Thuộc tính', 'Bắt buộc?', 'Định dạng / Quy tắc', 'Ý nghĩa & Ví dụ minh họa'];
  const guideRows = [
    ['Mã SKU', 'Tùy chọn', 'Chuỗi tối đa 50 ký tự', 'Nếu để trống, hệ thống RetailHub sẽ tự động sinh mã chuẩn (VD: PRD-20260823-123456).'],
    ['Tên sản phẩm (*)', 'BẮT BUỘC', 'Chuỗi tối đa 150 ký tự', 'Tên đầy đủ của sản phẩm hiển thị trên hóa đơn và POS.'],
    ['Danh mục (*)', 'BẮT BUỘC', 'Tên danh mục hoặc Mã danh mục', 'Tên danh mục có sẵn trong hệ thống (Xem sheet "Danh mục & ĐVT có sẵn").'],
    ['Đơn vị cơ bản (*)', 'BẮT BUỘC', 'Tên ĐVT nhỏ nhất (Lon, Chai, Viên...)', 'Đơn vị tính lưu kho và đếm tồn kho chính (Tỷ lệ mặc định là 1).'],
    ['Giá bán lẻ cơ bản (*)', 'BẮT BUỘC', 'Số >= 0 (VNĐ)', 'Giá bán lẻ cho 1 Đơn vị cơ bản (Ví dụ: 10,000 đ / 1 Lon).'],
    ['Giá vốn', 'Tùy chọn', 'Số >= 0 (VNĐ)', 'Giá nhập / chi phí mua hàng của 1 đơn vị cơ bản.'],
    ['Mã vạch cơ bản', 'Tùy chọn', 'EAN-13, UPC hoặc chuỗi ký tự', 'Nếu để trống, hệ thống tự động sinh mã vạch nội bộ 8938xxxxxxxxx.'],
    ['Tồn kho ban đầu', 'Tùy chọn', 'Số nguyên >= 0', 'Số lượng tồn kho ban đầu sẽ được ghi nhận vào kho chi nhánh mặc định.'],
    ['ĐVT cấp 2 (Tên)', 'Tùy chọn', 'Tên đơn vị quy đổi (Lốc, Hộp, Vỉ...)', 'Đơn vị bán sỉ hoặc gói cấp 2 (Ví dụ: Lốc). Không được trùng với ĐVT cơ bản.'],
    ['Tỷ lệ quy đổi ĐVT 2', 'Tùy chọn (Bắt buộc nếu có ĐVT 2)', 'Số thực > 1', 'Số lượng ĐVT cơ bản chứa trong 1 ĐVT cấp 2 (Ví dụ: 1 Lốc = 6 Lon -> điền 6).'],
    ['Giá bán ĐVT 2', 'Tùy chọn (Bắt buộc nếu có ĐVT 2)', 'Số >= 0 (VNĐ)', 'Giá bán lẻ / sỉ riêng cho ĐVT cấp 2 (Ví dụ: 58,000 đ / 1 Lốc).'],
    ['Mã vạch ĐVT 2', 'Tùy chọn', 'Chuỗi mã vạch riêng', 'Mã vạch in trên bao bì lốc để máy quét POS quét tự nhận giá lốc và trừ 6 lon.'],
    ['ĐVT cấp 3 (Tên)', 'Tùy chọn', 'Tên đơn vị quy đổi cấp 3 (Thùng, Két...)', 'Đơn vị bán sỉ cấp 3 (Ví dụ: Thùng).'],
    ['Tỷ lệ quy đổi ĐVT 3', 'Tùy chọn (Bắt buộc nếu có ĐVT 3)', 'Số thực > 1', 'Số lượng ĐVT cơ bản chứa trong 1 ĐVT cấp 3 (Ví dụ: 1 Thùng = 24 Lon -> điền 24).'],
    ['Giá bán ĐVT 3', 'Tùy chọn (Bắt buộc nếu có ĐVT 3)', 'Số >= 0 (VNĐ)', 'Giá bán riêng cho Thùng (Ví dụ: 225,000 đ / 1 Thùng).'],
    ['Mã vạch ĐVT 3', 'Tùy chọn', 'Chuỗi mã vạch riêng', 'Mã vạch in trên thùng carton.'],
    ['ĐVT mở rộng (Tùy biến)', 'Tùy chọn', 'Cú pháp: Tên:Tỷ lệ:Giá:Barcode|...', 'Cách nhập nhanh nhiều đơn vị quy đổi (VD: "Lốc:6:58000:893801 | Thùng:24:225000:893802").'],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideRows]);
  wsGuide['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 35 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Hướng dẫn & ĐVT đa cấp');

  // ── Sheet 3: Dữ liệu hệ thống tham chiếu ──────────────────────
  const refHeaders = ['Danh mục có sẵn trong hệ thống', 'Đơn vị tính có sẵn trong hệ thống'];
  const maxRows = Math.max(categories.length, units.length, 1);
  const refRows = [];

  for (let i = 0; i < maxRows; i++) {
    const catName = categories[i] ? `${categories[i].categoryName} (${categories[i].code || categories[i].id})` : '';
    const unitName = units[i] ? `${units[i].unitName} (${units[i].code || units[i].id})` : '';
    refRows.push([catName, unitName]);
  }

  const wsRef = XLSX.utils.aoa_to_sheet([refHeaders, ...refRows]);
  wsRef['!cols'] = [{ wch: 40 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Danh mục & ĐVT có sẵn');

  // Write file & trigger browser download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `RetailHub_Mau_Nhap_San_Pham_Da_Cap_${dateStr}.xlsx`);
}

/**
 * Normalizes header string for flexible column matching.
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Parses an uploaded Excel / CSV file buffer into raw product rows.
 */
export async function parseProductExcelFile(file: File): Promise<RawParsedProductRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) return [];

  const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });
  if (!rawJson || rawJson.length === 0) return [];

  return rawJson.map((row, idx) => {
    // Map columns flexibly
    const getVal = (...keys: string[]): any => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== '') return row[k];
      }
      // Check normalized matching
      for (const rawKey of Object.keys(row)) {
        const normKey = normalizeHeader(rawKey);
        for (const target of keys) {
          if (normKey === normalizeHeader(target)) {
            return row[rawKey];
          }
        }
      }
      return '';
    };

    const numVal = (v: any, def = 0): number => {
      if (typeof v === 'number') return isNaN(v) ? def : v;
      if (typeof v === 'string') {
        const clean = v.replace(/,/g, '').replace(/\./g, '').trim();
        const parsed = parseFloat(clean);
        return isNaN(parsed) ? def : parsed;
      }
      return def;
    };

    const strVal = (v: any): string => (v !== undefined && v !== null ? String(v).trim() : '');

    return {
      rowIndex: idx + 2, // Header is row 1, data starts at row 2
      productCode: strVal(getVal('Mã SKU', 'SKU', 'Mã sản phẩm', 'Product Code', 'productCode')),
      name: strVal(getVal('Tên sản phẩm (*)', 'Tên sản phẩm', 'Tên SP', 'Product Name', 'name')),
      categoryName: strVal(getVal('Danh mục (*)', 'Danh mục', 'Category', 'categoryName', 'category')),
      brand: strVal(getVal('Thương hiệu', 'Brand', 'Hãng', 'brand')),
      barcode: strVal(getVal('Mã vạch cơ bản', 'Mã vạch', 'Barcode', 'barcode')),
      baseUnitName: strVal(getVal('Đơn vị cơ bản (*)', 'Đơn vị cơ bản', 'Đơn vị tính', 'ĐVT', 'Base Unit', 'unit')),
      basePrice: numVal(getVal('Giá bán lẻ cơ bản (*)', 'Giá bán lẻ', 'Giá bán cơ bản', 'Giá bán', 'Base Price', 'price')),
      costPrice: numVal(getVal('Giá vốn', 'Giá nhập', 'Cost Price', 'costPrice')),
      initialStock: numVal(getVal('Tồn kho ban đầu', 'Tồn kho', 'Số lượng', 'Initial Stock', 'onHand', 'stock')),
      weight: numVal(getVal('Trọng lượng (g)', 'Trọng lượng', 'Weight', 'weight')),
      reorderPoint: numVal(getVal('Điểm đặt hàng lại', 'Reorder Point', 'reorderPoint')),
      minStock: numVal(getVal('Tồn kho tối thiểu', 'Min Stock', 'minStock')),
      description: strVal(getVal('Mô tả sản phẩm', 'Mô tả', 'Description', 'description')),

      // Tier 2
      unit2Name: strVal(getVal('ĐVT cấp 2 (Tên)', 'ĐVT cấp 2', 'ĐVT 2', 'Unit 2')),
      unit2Rate: numVal(getVal('Tỷ lệ quy đổi ĐVT 2', 'Tỷ lệ 2', 'Quy đổi 2', 'Rate 2')),
      unit2Price: numVal(getVal('Giá bán ĐVT 2', 'Giá ĐVT 2', 'Giá bán 2', 'Price 2')),
      unit2Barcode: strVal(getVal('Mã vạch ĐVT 2', 'Barcode 2', 'Mã vạch 2')),

      // Tier 3
      unit3Name: strVal(getVal('ĐVT cấp 3 (Tên)', 'ĐVT cấp 3', 'ĐVT 3', 'Unit 3')),
      unit3Rate: numVal(getVal('Tỷ lệ quy đổi ĐVT 3', 'Tỷ lệ 3', 'Quy đổi 3', 'Rate 3')),
      unit3Price: numVal(getVal('Giá bán ĐVT 3', 'Giá ĐVT 3', 'Giá bán 3', 'Price 3')),
      unit3Barcode: strVal(getVal('Mã vạch ĐVT 3', 'Barcode 3', 'Mã vạch 3')),

      // Tier 4
      unit4Name: strVal(getVal('ĐVT cấp 4 (Tên)', 'ĐVT cấp 4', 'ĐVT 4', 'Unit 4')),
      unit4Rate: numVal(getVal('Tỷ lệ quy đổi ĐVT 4', 'Tỷ lệ 4', 'Quy đổi 4', 'Rate 4')),
      unit4Price: numVal(getVal('Giá bán ĐVT 4', 'Giá ĐVT 4', 'Giá bán 4', 'Price 4')),
      unit4Barcode: strVal(getVal('Mã vạch ĐVT 4', 'Barcode 4', 'Mã vạch 4')),

      // Raw custom syntax
      customUnitsRaw: strVal(getVal('ĐVT mở rộng (Tên:Tỷ lệ:Giá:Barcode|...)', 'ĐVT mở rộng', 'Custom Units')),
    };
  });
}

/**
 * Validates parsed product rows against business constraints and existing database state.
 */
export function validateProductRows(
  rows: RawParsedProductRow[],
  existingProducts: { id: string | number; sku?: string; barcodes?: string[]; name?: string }[] = [],
  categories: { id: string | number; categoryName: string; code?: string }[] = [],
  units: { id: string | number; unitName: string; code?: string }[] = []
): ValidatedProductRow[] {
  const existingSkus = new Set(existingProducts.map((p) => (p.sku || '').toUpperCase()).filter(Boolean));
  const existingBarcodes = new Set(
    existingProducts
      .flatMap((p) => p.barcodes || [])
      .map((b) => b.toUpperCase())
      .filter(Boolean)
  );

  const seenSkusInFile = new Set<string>();
  const seenBarcodesInFile = new Set<string>();

  return rows.map((row) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Product Name
    if (!row.name || row.name.trim().length === 0) {
      errors.push('Tên sản phẩm không được để trống');
    }

    // 2. Validate SKU
    const cleanSku = (row.productCode || '').trim().toUpperCase();
    if (cleanSku) {
      if (existingSkus.has(cleanSku)) {
        errors.push(`Mã SKU "${cleanSku}" đã tồn tại trong cơ sở dữ liệu`);
      } else if (seenSkusInFile.has(cleanSku)) {
        errors.push(`Mã SKU "${cleanSku}" bị trùng lặp nhiều lần trong file Excel`);
      } else {
        seenSkusInFile.add(cleanSku);
      }
    }

    // 3. Validate Category
    let resolvedCategoryId: number | undefined;
    if (row.categoryName) {
      const matchCat = categories.find(
        (c) =>
          c.categoryName.toLowerCase() === row.categoryName.toLowerCase() ||
          (c.code && c.code.toLowerCase() === row.categoryName.toLowerCase())
      );
      if (matchCat) {
        resolvedCategoryId = Number(matchCat.id);
      } else {
        warnings.push(`Danh mục "${row.categoryName}" chưa có trong hệ thống (Sẽ gán danh mục mặc định)`);
        resolvedCategoryId = categories[0] ? Number(categories[0].id) : 1;
      }
    } else {
      warnings.push('Chưa chọn danh mục, hệ thống sẽ gán danh mục mặc định');
      resolvedCategoryId = categories[0] ? Number(categories[0].id) : 1;
    }

    // 4. Validate Base Unit
    let resolvedBaseUnitId: number | undefined;
    const baseUnitClean = (row.baseUnitName || '').trim();
    if (!baseUnitClean) {
      errors.push('Đơn vị tính cơ bản không được để trống');
      resolvedBaseUnitId = units[0] ? Number(units[0].id) : 1;
    } else {
      const matchUnit = units.find(
        (u) =>
          u.unitName.toLowerCase() === baseUnitClean.toLowerCase() ||
          (u.code && u.code.toLowerCase() === baseUnitClean.toLowerCase())
      );
      if (matchUnit) {
        resolvedBaseUnitId = Number(matchUnit.id);
      } else {
        warnings.push(`Đơn vị tính "${baseUnitClean}" chưa có trong danh mục Master (Sẽ tự động tạo mới khi nhập)`);
        resolvedBaseUnitId = units[0] ? Number(units[0].id) : 1;
      }
    }

    // 5. Validate Base Price & Cost Price
    if (isNaN(row.basePrice) || row.basePrice < 0) {
      errors.push('Giá bán lẻ cơ bản phải là số >= 0');
    }
    if (isNaN(row.costPrice) || row.costPrice < 0) {
      errors.push('Giá vốn phải là số >= 0');
    }

    // 6. Validate Base Barcode
    const cleanBarcode = (row.barcode || '').trim().toUpperCase();
    if (cleanBarcode) {
      if (existingBarcodes.has(cleanBarcode)) {
        errors.push(`Mã vạch "${cleanBarcode}" đã tồn tại trên sản phẩm khác`);
      } else if (seenBarcodesInFile.has(cleanBarcode)) {
        errors.push(`Mã vạch "${cleanBarcode}" bị trùng lặp trong file`);
      } else {
        seenBarcodesInFile.add(cleanBarcode);
      }
    }

    // 7. Validate Multi-Tier Conversion Units
    const conversionUnits: ValidatedProductRow['conversionUnits'] = [];
    const usedConversionUnitNames = new Set<string>();

    const checkAndAddConversionUnit = (
      tierLabel: string,
      uName?: string,
      uRate?: number,
      uPrice?: number,
      uBarcode?: string
    ) => {
      if (!uName || !uName.trim()) return;
      const cleanName = uName.trim();

      if (cleanName.toLowerCase() === baseUnitClean.toLowerCase()) {
        errors.push(`${tierLabel}: Tên ĐVT "${cleanName}" không được trùng với ĐVT cơ bản`);
        return;
      }

      if (usedConversionUnitNames.has(cleanName.toLowerCase())) {
        errors.push(`${tierLabel}: ĐVT quy đổi "${cleanName}" bị khai báo trùng lặp`);
        return;
      }
      usedConversionUnitNames.add(cleanName.toLowerCase());

      const rate = Number(uRate || 0);
      if (isNaN(rate) || rate <= 0) {
        errors.push(`${tierLabel} (${cleanName}): Tỷ lệ quy đổi phải là số > 0 (VD: 6, 24)`);
      } else if (rate === 1) {
        warnings.push(`${tierLabel} (${cleanName}): Tỷ lệ quy đổi bằng 1 (nên lớn hơn 1 để đóng vai trò ĐVT cấp cao)`);
      }

      const price = Number(uPrice !== undefined && !isNaN(uPrice) ? uPrice : 0);
      if (price < 0) {
        errors.push(`${tierLabel} (${cleanName}): Giá bán không được âm`);
      }

      const cBarcode = (uBarcode || '').trim().toUpperCase();
      if (cBarcode) {
        if (cBarcode === cleanBarcode) {
          errors.push(`${tierLabel} (${cleanName}): Mã vạch không được trùng với mã vạch ĐVT cơ bản`);
        } else if (existingBarcodes.has(cBarcode)) {
          errors.push(`${tierLabel} (${cleanName}): Mã vạch "${cBarcode}" đã tồn tại trong hệ thống`);
        } else if (seenBarcodesInFile.has(cBarcode)) {
          errors.push(`${tierLabel} (${cleanName}): Mã vạch "${cBarcode}" bị trùng trong file`);
        } else {
          seenBarcodesInFile.add(cBarcode);
        }
      }

      // Match unit master ID if available
      const matchedUnitMaster = units.find(
        (u) =>
          u.unitName.toLowerCase() === cleanName.toLowerCase() ||
          (u.code && u.code.toLowerCase() === cleanName.toLowerCase())
      );

      conversionUnits.push({
        unitId: matchedUnitMaster ? Number(matchedUnitMaster.id) : undefined,
        unitName: cleanName,
        conversionRate: rate > 0 ? rate : 1,
        price: price >= 0 ? price : row.basePrice * (rate > 0 ? rate : 1),
        barcode: cBarcode || undefined,
      });
    };

    checkAndAddConversionUnit('ĐVT Cấp 2', row.unit2Name, row.unit2Rate, row.unit2Price, row.unit2Barcode);
    checkAndAddConversionUnit('ĐVT Cấp 3', row.unit3Name, row.unit3Rate, row.unit3Price, row.unit3Barcode);
    checkAndAddConversionUnit('ĐVT Cấp 4', row.unit4Name, row.unit4Rate, row.unit4Price, row.unit4Barcode);

    // Parse customUnitsRaw syntax (e.g. "Lốc:6:58000:893801 | Thùng:24:225000:893802")
    if (row.customUnitsRaw && row.customUnitsRaw.trim()) {
      const parts = row.customUnitsRaw.split(/[|,;]+/).filter(Boolean);
      parts.forEach((p, idx) => {
        const segments = p.split(':').map((s) => s.trim());
        if (segments.length >= 2) {
          const uName = segments[0];
          const uRate = parseFloat(segments[1]);
          const uPrice = segments[2] ? parseFloat(segments[2]) : row.basePrice * uRate;
          const uBarcode = segments[3] || undefined;
          checkAndAddConversionUnit(`ĐVT mở rộng #${idx + 1}`, uName, uRate, uPrice, uBarcode);
        }
      });
    }

    return {
      ...row,
      isValid: errors.length === 0,
      errors,
      warnings,
      resolvedCategoryId,
      resolvedBaseUnitId,
      conversionUnits,
    };
  });
}
