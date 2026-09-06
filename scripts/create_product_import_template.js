import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const wb = XLSX.utils.book_new();

// ── SHEET 1: Danh sách sản phẩm ─────────────────────────────────────
const headers = [
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

const sampleData = [
  [
    'PRD-COCA-330',
    'Nước ngọt Coca-Cola Sleek 330ml',
    'Nước giải khát',
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
    'Nước giải khát',
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
    'Nước giải khát vị cola sảng khoái thơm ngon mát lạnh',
  ],
  [
    'PRD-LAVIE-500',
    'Nước khoáng thiên nhiên LaVie 500ml',
    'Nước giải khát',
    'LaVie',
    '8935004400012',
    'Chai',
    6000,
    4200,
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
    520,
    48,
    24,
    'Nước khoáng thiên nhiên đóng chai thanh khiết tốt cho sức khỏe',
  ],
  [
    'PRD-HAOHAO-TC',
    'Mì Hảo Hảo Tôm Chua Cay 75g',
    'Thực phẩm đóng gói',
    'Acecook',
    '8934563138164',
    'Gói',
    4500,
    3600,
    300,
    'Thùng',
    30,
    128000,
    '8934563138171',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    85,
    60,
    30,
    'Mì ăn liền vị tôm chua cay đậm đà thơm ngon nức tiếng',
  ],
  [
    'PRD-VNM-SUATUOI',
    'Sữa tươi tiệt trùng Vinamilk có đường 180ml',
    'Sữa & Chế phẩm sữa',
    'Vinamilk',
    '8934673123019',
    'Hộp',
    8500,
    6800,
    240,
    'Lốc',
    4,
    33000,
    '8934673123026',
    'Thùng',
    48,
    380000,
    '8934673123033',
    '',
    '',
    '',
    '',
    '',
    195,
    48,
    24,
    'Sữa tươi tiệt trùng nguyên chất thơm ngậy giàu canxi',
  ],
  [
    'PRD-CHOCOPIE-12',
    'Bánh ChocoPie Orion hộp 12 cái 396g',
    'Bánh kẹo & Ăn vặt',
    'Orion',
    '8936036010014',
    'Hộp',
    56000,
    46000,
    60,
    'Thùng',
    8,
    430000,
    '8936036010021',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    420,
    16,
    8,
    'Bánh phủ socola mềm nhân dẻo marshmallow truyền thống',
  ],
  [
    'PRD-OISHI-CORN',
    'Snack bắp ngọt Oishi Corn Snack 40g',
    'Bánh kẹo & Ăn vặt',
    'Oishi',
    '8935003300018',
    'Gói',
    6000,
    4300,
    180,
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
    'Snack ngô bắp ngọt sấy giòn tan thơm lừng',
  ],
  [
    'PRD-CAFE-G7-18',
    'Cà phê hòa tan G7 3in1 hộp 18 gói x 16g',
    'Đồ uống & Trà cà phê',
    'Trung Nguyên',
    '8935024110057',
    'Hộp',
    58000,
    47500,
    80,
    'Thùng',
    24,
    1350000,
    '8935024110064',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    320,
    24,
    12,
    'Cà phê hòa tan G7 đậm vị quyến rũ đánh thức sáng tạo',
  ],
  [
    'PRD-NAMNGU-900',
    'Nước mắm Nam Ngư Đệ Nhị 900ml',
    'Gia vị & Nấu ăn',
    'Masan',
    '8936017361110',
    'Chai',
    25000,
    19500,
    90,
    'Thùng',
    15,
    360000,
    '8936017361127',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    960,
    30,
    15,
    'Nước mắm cá cơm thơm ngon đậm đà cho bữa cơm tròn vị',
  ],
  [
    'PRD-SIMPLY-1L',
    'Dầu đậu nành Simply nguyên chất 1 Lít',
    'Gia vị & Nấu ăn',
    'Simply',
    '8934988010010',
    'Chai',
    55000,
    44000,
    100,
    'Thùng',
    12,
    630000,
    '8934988010027',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    1050,
    24,
    12,
    'Dầu ăn đậu nành nguyên chất giàu Omega 3-6-9 tốt cho tim mạch',
  ],
];

const wsProducts = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

wsProducts['!cols'] = [
  { wch: 18 }, // Mã SKU
  { wch: 42 }, // Tên SP
  { wch: 22 }, // Danh mục
  { wch: 16 }, // Thương hiệu
  { wch: 18 }, // Barcode cơ bản
  { wch: 16 }, // ĐVT cơ bản
  { wch: 20 }, // Giá bán lẻ
  { wch: 15 }, // Giá vốn
  { wch: 16 }, // Tồn kho ban đầu
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
  { wch: 50 }, // Mô tả
];

XLSX.utils.book_append_sheet(wb, wsProducts, 'Danh sách sản phẩm');

// ── SHEET 2: Hướng dẫn chi tiết ─────────────────────────────────────
const guideHeaders = ['Tên cột / Thuộc tính', 'Bắt buộc?', 'Định dạng dữ liệu', 'Ý nghĩa & Hướng dẫn cụ thể'];
const guideData = [
  ['Mã SKU', 'Tùy chọn', 'Chuỗi tối đa 50 ký tự', 'Mã quản lý sản phẩm. Nếu để trống, hệ thống RetailHub sẽ tự động tạo mã SKU.'],
  ['Tên sản phẩm (*)', 'BẮT BUỘC', 'Chuỗi tối đa 150 ký tự', 'Tên đầy đủ của sản phẩm hiển thị trên hóa đơn, POS và báo cáo bán hàng.'],
  ['Danh mục (*)', 'BẮT BUỘC', 'Tên danh mục', 'Phân loại hàng hóa (Xem sheet 3 để xem các danh mục gợi ý).'],
  ['Thương hiệu', 'Tùy chọn', 'Tên hãng / thương hiệu', 'Hãng sản xuất (VD: Coca-Cola, Vinamilk, Acecook, Orion...).'],
  ['Mã vạch cơ bản', 'Tùy chọn', 'Mã EAN-13, Barcode chuỗi', 'Mã vạch in trên sản phẩm để quét máy tính tiền POS. Nếu để trống hệ thống tự sinh mã nội bộ.'],
  ['Đơn vị cơ bản (*)', 'BẮT BUỘC', 'Lon, Chai, Gói, Hộp, Cái...', 'Đơn vị nhỏ nhất để kiểm đếm tồn kho trong kho hàng. Tỷ lệ quy đổi mặc định = 1.'],
  ['Giá bán lẻ cơ bản (*)', 'BẮT BUỘC', 'Số nguyên >= 0 (VNĐ)', 'Giá bán lẻ cho 1 Đơn vị cơ bản (Ví dụ: 10,000 đ / 1 Lon).'],
  ['Giá vốn', 'Tùy chọn', 'Số nguyên >= 0 (VNĐ)', 'Giá nhập mua vào ban đầu của 1 đơn vị cơ bản để tính lợi nhuận gộp.'],
  ['Tồn kho ban đầu', 'Tùy chọn', 'Số nguyên >= 0', 'Số lượng có sẵn trong kho khi bắt đầu sử dụng phần mềm.'],
  ['ĐVT cấp 2 (Tên)', 'Tùy chọn', 'Tên ĐVT quy đổi (Lốc, Hộp...)', 'Đơn vị bán sỉ hoặc đóng gói cấp 2 (Ví dụ: Lốc). Không trùng với ĐVT cơ bản.'],
  ['Tỷ lệ quy đổi ĐVT 2', 'Bắt buộc nếu có ĐVT 2', 'Số thực > 1', 'Số lượng ĐVT cơ bản trong 1 ĐVT cấp 2 (VD: 1 Lốc = 6 Lon -> điền 6).'],
  ['Giá bán ĐVT 2', 'Bắt buộc nếu có ĐVT 2', 'Số nguyên >= 0 (VNĐ)', 'Giá bán lẻ hoặc bán sỉ cho ĐVT 2 (VD: 58,000 đ / 1 Lốc).'],
  ['Mã vạch ĐVT 2', 'Tùy chọn', 'Mã vạch riêng của ĐVT 2', 'Mã vạch in trên bao bì lốc. Quét mã này tại POS sẽ tính giá lốc và tự trừ 6 lon trong kho.'],
  ['ĐVT cấp 3 (Tên)', 'Tùy chọn', 'Tên ĐVT cấp 3 (Thùng, Két...)', 'Đơn vị đóng gói cấp 3 (Ví dụ: Thùng, Két).'],
  ['Tỷ lệ quy đổi ĐVT 3', 'Bắt buộc nếu có ĐVT 3', 'Số thực > 1', 'Số lượng ĐVT cơ bản trong 1 ĐVT cấp 3 (VD: 1 Thùng = 24 Lon -> điền 24).'],
  ['Giá bán ĐVT 3', 'Bắt buộc nếu có ĐVT 3', 'Số nguyên >= 0 (VNĐ)', 'Giá bán nguyên thùng (VD: 225,000 đ / 1 Thùng).'],
  ['Mã vạch ĐVT 3', 'Tùy chọn', 'Mã vạch in trên thùng', 'Mã vạch carton để xuất bán sỉ hoặc nhập kho nhanh.'],
  ['ĐVT cấp 4 (Tên)', 'Tùy chọn', 'Tên ĐVT cấp 4 (Kiện, Pallet...)', 'Đơn vị bán buôn số lượng lớn.'],
  ['Tỷ lệ quy đổi ĐVT 4', 'Bắt buộc nếu có ĐVT 4', 'Số thực > 1', 'Số lượng ĐVT cơ bản trong 1 ĐVT cấp 4.'],
  ['Giá bán ĐVT 4', 'Bắt buộc nếu có ĐVT 4', 'Số nguyên >= 0 (VNĐ)', 'Giá bán cho ĐVT cấp 4.'],
  ['Mã vạch ĐVT 4', 'Tùy chọn', 'Mã vạch ĐVT 4', 'Mã vạch kiện hàng.'],
  ['ĐVT mở rộng', 'Tùy chọn', 'Cú pháp: Tên:Tỷ lệ:Giá:Barcode|...', 'Cách gõ tắt nhiều cấp ĐVT (VD: "Lốc:6:58000:893801 | Thùng:24:225000:893802").'],
  ['Trọng lượng (g)', 'Tùy chọn', 'Số gram', 'Trọng lượng vận chuyển tính cước giao hàng.'],
  ['Điểm đặt hàng lại', 'Tùy chọn', 'Số lượng', 'Mức tồn kho báo động cần đặt mua thêm từ nhà cung cấp.'],
  ['Tồn kho tối thiểu', 'Tùy chọn', 'Số lượng', 'Mức tồn an toàn dưới đáy kho.'],
  ['Mô tả sản phẩm', 'Tùy chọn', 'Đoạn văn bản', 'Mô tả công dụng, thành phần hoặc thông tin chi tiết.'],
];

const wsGuide = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideData]);
wsGuide['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 35 }, { wch: 65 }];
XLSX.utils.book_append_sheet(wb, wsGuide, 'Hướng dẫn & ĐVT đa cấp');

// ── SHEET 3: Danh mục & ĐVT gợi ý ──────────────────────────────────
const refHeaders = ['Danh mục hàng hóa gợi ý', 'Đơn vị tính cơ bản gợi ý', 'Đơn vị quy đổi gợi ý'];
const refData = [
  ['Nước giải khát', 'Lon', 'Lốc (x6)'],
  ['Thực phẩm đóng gói', 'Chai', 'Thùng (x24)'],
  ['Bánh kẹo & Ăn vặt', 'Gói', 'Két (x20)'],
  ['Sữa & Chế phẩm sữa', 'Hộp', 'Bịch (x10)'],
  ['Gia vị & Nấu ăn', 'Cái', 'Thùng (x30)'],
  ['Đồ uống & Trà cà phê', 'Viên', 'Thùng (x48)'],
  ['Hóa mỹ phẩm & Chăm sóc', 'Vỉ', 'Hộp (x12)'],
  ['Văn phòng phẩm', 'Cây', 'Hộp (x18)'],
  ['Đồ gia dụng & Kim khí', 'Kg', 'Kiện (x100)'],
  ['Dược phẩm & Y tế', 'Tuýp', 'Thùng (x60)'],
];

const wsRef = XLSX.utils.aoa_to_sheet([refHeaders, ...refData]);
wsRef['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 30 }];
XLSX.utils.book_append_sheet(wb, wsRef, 'Danh mục & ĐVT gợi ý');

// ── Lưu tệp ra các vị trí ──────────────────────────────────────────
const rootPath = 'd:\\DoAnCuoiKy\\mau_nhap_san_pham_excel.xlsx';
const publicPath = 'd:\\DoAnCuoiKy\\Frontend\\RetailHub\\public\\mau_nhap_san_pham.xlsx';

XLSX.writeFile(wb, rootPath);
XLSX.writeFile(wb, publicPath);

console.log(`Successfully generated Excel files:`);
console.log(`- Root workspace: ${rootPath}`);
console.log(`- Public static web: ${publicPath}`);
