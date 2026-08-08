const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

const featuresDir = path.join(__dirname, '..', 'src', 'features');
const files = getAllFiles(featuresDir);

const replacements = [
  // Common action buttons
  { from: /\bThêm mới\b/g, to: 'Thêm Mới' },
  { from: /\bTạo mới\b/g, to: 'Tạo Mới' },
  { from: /\bTạo danh mục\b/g, to: 'Tạo Danh Mục' },
  { from: /\bThêm danh mục\b/g, to: 'Thêm Danh Mục' },
  { from: /\bThêm sản phẩm\b/g, to: 'Thêm Sản Phẩm' },
  { from: /\bThêm khách hàng\b/g, to: 'Thêm Khách Hàng' },
  { from: /\bThêm nhân viên\b/g, to: 'Thêm Nhân Viên' },
  { from: /\bThêm chi nhánh\b/g, to: 'Thêm Chi Nhánh' },
  { from: /\bThêm đơn hàng\b/g, to: 'Thêm Đơn Hàng' },
  { from: /\bTạo đơn hàng\b/g, to: 'Tạo Đơn Hàng' },
  { from: /\bTạo đơn bán\b/g, to: 'Tạo Đơn Bán' },
  { from: /\bThêm phiếu thu\b/g, to: 'Thêm Phiếu Thu' },
  { from: /\bThêm phiếu chi\b/g, to: 'Thêm Phiếu Chi' },
  { from: /\bThêm tài khoản\b/g, to: 'Thêm Tài Khoản' },
  { from: /\bThêm bảng giá\b/g, to: 'Thêm Bảng Giá' },
  { from: /\bThêm nhà cung cấp\b/g, to: 'Thêm Nhà Cung Cấp' },
  { from: /\bThêm biến thể\b/g, to: 'Thêm Biến Thể' },
  { from: /\bThêm combo\b/g, to: 'Thêm Combo' },
  { from: /\bThêm màu sắc\b/g, to: 'Thêm Màu Sắc' },
  { from: /\bThêm kích thước\b/g, to: 'Thêm Kích Thước' },
  { from: /\bThêm đơn vị\b/g, to: 'Thêm Đơn Vị' },
  { from: /\bThêm kho hàng\b/g, to: 'Thêm Kho Hàng' },
  { from: /\bThêm kho\b/g, to: 'Thêm Kho' },
  { from: /\bThêm khu vực\b/g, to: 'Thêm Khu Vực' },
  { from: /\bThêm đối tác\b/g, to: 'Thêm Đối Tác' },
  { from: /\bThêm hợp đồng\b/g, to: 'Thêm Hợp Đồng' },
  { from: /\bThêm vai trò\b/g, to: 'Thêm Vai Trò' },
  { from: /\bThêm chức danh\b/g, to: 'Thêm Chức Danh' },
  { from: /\bThêm phòng ban\b/g, to: 'Thêm Phòng Ban' },
  { from: /\bThêm bảo hành\b/g, to: 'Thêm Bảo Hành' },
  { from: /\bThêm phản hồi\b/g, to: 'Thêm Phản Hồi' },
  { from: /\bThêm voucher\b/g, to: 'Thêm Voucher' },
  { from: /\bThêm yêu cầu\b/g, to: 'Thêm Yêu Cầu' },
  { from: /\bThêm báo giá\b/g, to: 'Thêm Báo Giá' },
  { from: /\bThêm phiếu\b/g, to: 'Thêm Phiếu' },
  { from: /\bXuất file csv\b/gi, to: 'Xuất File CSV' },
  { from: /\bXuất excel\b/gi, to: 'Xuất Excel' },
  { from: /\bXuất dữ liệu\b/gi, to: 'Xuất Dữ Liệu' },
  { from: /\bNhập excel\b/gi, to: 'Nhập Excel' },
];

let modifiedCount = 0;
files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  }
});

console.log(`Updated casing in ${modifiedCount} files.`);
