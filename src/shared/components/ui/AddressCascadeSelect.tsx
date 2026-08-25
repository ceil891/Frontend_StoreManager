import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressCascadeSelectProps {
  province?: string;
  district?: string;
  ward?: string;
  addressDetail?: string;
  onChange: (address: { province: string; district: string; ward: string; addressDetail: string }) => void;
  className?: string;
}

interface ApiWard {
  code: number;
  name: string;
}

interface ApiDistrict {
  code: number;
  name: string;
  wards?: ApiWard[];
}

interface ApiProvince {
  code: number;
  name: string;
  districts?: ApiDistrict[];
}

// ─── FULL 63 VIETNAM PROVINCES FALLBACK DATASET ────────────────────────────
const FALLBACK_PROVINCES: ApiProvince[] = [
  {
    code: 1,
    name: 'Thành phố Hà Nội',
    districts: [
      { code: 1, name: 'Quận Ba Đình', wards: [{ code: 1, name: 'Phường Phúc Xá' }, { code: 2, name: 'Phường Trúc Bạch' }, { code: 3, name: 'Phường Vĩnh Phúc' }, { code: 4, name: 'Phường Cống Vị' }, { code: 5, name: 'Phường Liễu Giai' }, { code: 6, name: 'Phường Kim Mã' }] },
      { code: 2, name: 'Quận Hoàn Kiếm', wards: [{ code: 7, name: 'Phường Hàng Bạc' }, { code: 8, name: 'Phường Hàng Buồm' }, { code: 9, name: 'Phường Hàng Đào' }, { code: 10, name: 'Phường Tràng Tiền' }, { code: 11, name: 'Phường Lý Thái Tổ' }] },
      { code: 3, name: 'Quận Cầu Giấy', wards: [{ code: 12, name: 'Phường Dịch Vọng' }, { code: 13, name: 'Phường Dịch Vọng Hậu' }, { code: 14, name: 'Phường Mai Dịch' }, { code: 15, name: 'Phường Nghĩa Đô' }, { code: 16, name: 'Phường Nghĩa Tân' }, { code: 17, name: 'Phường Quan Hoa' }, { code: 18, name: 'Phường Trung Hòa' }, { code: 19, name: 'Phường Yên Hòa' }] },
      { code: 4, name: 'Quận Đống Đa', wards: [{ code: 20, name: 'Phường Cát Linh' }, { code: 21, name: 'Phường Văn Miếu' }, { code: 22, name: 'Phường Quốc Tử Giám' }, { code: 23, name: 'Phường Láng Hạ' }, { code: 24, name: 'Phường Ô Chợ Dừa' }] },
      { code: 5, name: 'Quận Hai Bà Trưng', wards: [{ code: 25, name: 'Phường Bách Khoa' }, { code: 26, name: 'Phường Bạch Đằng' }, { code: 27, name: 'Phường Đồng Tâm' }, { code: 28, name: 'Phường Lê Đại Hành' }] },
      { code: 6, name: 'Quận Thanh Xuân', wards: [{ code: 29, name: 'Phường Hạ Đình' }, { code: 30, name: 'Phường Khương Đình' }, { code: 31, name: 'Phường Khương Mai' }, { code: 32, name: 'Phường Thanh Xuân Bắc' }, { code: 33, name: 'Phường Thanh Xuân Trung' }] },
      { code: 7, name: 'Quận Nam Từ Liêm', wards: [{ code: 34, name: 'Phường Cầu Diễn' }, { code: 35, name: 'Phường Mỹ Đình 1' }, { code: 36, name: 'Phường Mỹ Đình 2' }, { code: 37, name: 'Phường Mễ Trì' }] },
      { code: 8, name: 'Quận Bắc Từ Liêm', wards: [{ code: 38, name: 'Phường Cổ Nhuế 1' }, { code: 39, name: 'Phường Cổ Nhuế 2' }, { code: 40, name: 'Phường Xuân Đỉnh' }, { code: 41, name: 'Phường Phúc Diễn' }] },
      { code: 9, name: 'Quận Hà Đông', wards: [{ code: 42, name: 'Phường Quang Trung' }, { code: 43, name: 'Phường Hà Cầu' }, { code: 44, name: 'Phường Mộ Lao' }, { code: 45, name: 'Phường Vạn Phúc' }] },
      { code: 10, name: 'Quận Long Biên', wards: [{ code: 46, name: 'Phường Bồ Đề' }, { code: 47, name: 'Phường Gia Thụy' }, { code: 48, name: 'Phường Ngọc Lâm' }] },
      { code: 11, name: 'Quận Hoàng Mai', wards: [{ code: 49, name: 'Phường Hoàng Liệt' }, { code: 50, name: 'Phường Giáp Bát' }, { code: 51, name: 'Phường Định Công' }] },
      { code: 12, name: 'Quận Tây Hồ', wards: [{ code: 52, name: 'Phường Bưởi' }, { code: 53, name: 'Phường Thụy Khuê' }, { code: 54, name: 'Phường Quảng An' }, { code: 55, name: 'Phường Nhật Tân' }] },
    ],
  },
  {
    code: 79,
    name: 'Thành phố Hồ Chí Minh',
    districts: [
      { code: 760, name: 'Quận 1', wards: [{ code: 26734, name: 'Phường Bến Nghé' }, { code: 26737, name: 'Phường Bến Thành' }, { code: 26740, name: 'Phường Cầu Kho' }, { code: 26743, name: 'Phường Cầu Ông Lãnh' }, { code: 26746, name: 'Phường Cô Giang' }, { code: 26749, name: 'Phường Đa Kao' }, { code: 26752, name: 'Phường Nguyễn Cư Trinh' }, { code: 26755, name: 'Phường Nguyễn Thái Bình' }, { code: 26758, name: 'Phường Phạm Ngũ Lão' }, { code: 26761, name: 'Phường Tân Định' }] },
      { code: 761, name: 'Quận 3', wards: [{ code: 26764, name: 'Phường 1' }, { code: 26767, name: 'Phường 2' }, { code: 26770, name: 'Phường 3' }, { code: 26773, name: 'Phường 4' }, { code: 26776, name: 'Phường Võ Thị Sáu' }] },
      { code: 764, name: 'Quận 4', wards: [{ code: 26800, name: 'Phường 1' }, { code: 26803, name: 'Phường 2' }, { code: 26806, name: 'Phường 3' }, { code: 26809, name: 'Phường 4' }, { code: 26812, name: 'Phường 6' }] },
      { code: 765, name: 'Quận 5', wards: [{ code: 26830, name: 'Phường 1' }, { code: 26833, name: 'Phường 2' }, { code: 26836, name: 'Phường 3' }, { code: 26839, name: 'Phường 4' }, { code: 26842, name: 'Phường 5' }] },
      { code: 766, name: 'Quận 6', wards: [{ code: 26860, name: 'Phường 1' }, { code: 26863, name: 'Phường 2' }, { code: 26866, name: 'Phường 3' }, { code: 26869, name: 'Phường 4' }] },
      { code: 767, name: 'Quận 7', wards: [{ code: 26890, name: 'Phường Tân Thuận Đông' }, { code: 26893, name: 'Phường Tân Thuận Tây' }, { code: 26896, name: 'Phường Tân Kiểng' }, { code: 26899, name: 'Phường Tân Phong' }, { code: 26902, name: 'Phường Phú Mỹ' }] },
      { code: 768, name: 'Quận 8', wards: [{ code: 26920, name: 'Phường 1' }, { code: 26923, name: 'Phường 2' }, { code: 26926, name: 'Phường 3' }, { code: 26929, name: 'Phường 4' }] },
      { code: 769, name: 'Quận 10', wards: [{ code: 26950, name: 'Phường 1' }, { code: 26953, name: 'Phường 2' }, { code: 26956, name: 'Phường 4' }, { code: 26959, name: 'Phường 5' }, { code: 26962, name: 'Phường 6' }] },
      { code: 770, name: 'Quận 11', wards: [{ code: 26980, name: 'Phường 1' }, { code: 26983, name: 'Phường 2' }, { code: 26986, name: 'Phường 3' }] },
      { code: 771, name: 'Quận 12', wards: [{ code: 27010, name: 'Phường Tân Thới Nhất' }, { code: 27013, name: 'Phường Tân Chánh Hiệp' }, { code: 27016, name: 'Phường An Phú Đông' }] },
      { code: 7690, name: 'Thành phố Thủ Đức', wards: [{ code: 26780, name: 'Phường Thảo Điền' }, { code: 26783, name: 'Phường An Phú' }, { code: 26786, name: 'Phường An Khánh' }, { code: 26789, name: 'Phường Bình An' }, { code: 26792, name: 'Phường Hiệp Phú' }, { code: 26795, name: 'Phường Linh Trung' }, { code: 26798, name: 'Phường Linh Chiểu' }] },
      { code: 772, name: 'Quận Bình Thạnh', wards: [{ code: 27040, name: 'Phường 1' }, { code: 27043, name: 'Phường 2' }, { code: 27046, name: 'Phường 3' }, { code: 27049, name: 'Phường 15' }, { code: 27052, name: 'Phường 25' }] },
      { code: 773, name: 'Quận Tân Bình', wards: [{ code: 27070, name: 'Phường 1' }, { code: 27073, name: 'Phường 2' }, { code: 27076, name: 'Phường 4' }, { code: 27079, name: 'Phường 12' }, { code: 27082, name: 'Phường 15' }] },
      { code: 774, name: 'Quận Tân Phú', wards: [{ code: 27100, name: 'Phường Tân Sơn Nhì' }, { code: 27103, name: 'Phường Tây Thạnh' }, { code: 27106, name: 'Phường Sơn Kỳ' }, { code: 27109, name: 'Phường Tân Quý' }] },
      { code: 775, name: 'Quận Phú Nhuận', wards: [{ code: 27130, name: 'Phường 1' }, { code: 27133, name: 'Phường 2' }, { code: 27136, name: 'Phường 7' }, { code: 27139, name: 'Phường 9' }] },
      { code: 776, name: 'Quận Gò Vấp', wards: [{ code: 27160, name: 'Phường 1' }, { code: 27163, name: 'Phường 3' }, { code: 27166, name: 'Phường 5' }, { code: 27169, name: 'Phường 10' }] },
      { code: 777, name: 'Quận Bình Tân', wards: [{ code: 27190, name: 'Phường Bình Hưng Hòa' }, { code: 27193, name: 'Phường Bình Trị Đông' }, { code: 27196, name: 'Phường An Lạc' }] },
      { code: 783, name: 'Huyện Củ Chi', wards: [{ code: 27220, name: 'Thị trấn Củ Chi' }, { code: 27223, name: 'Xã Phú Hòa Đông' }] },
      { code: 784, name: 'Huyện Hóc Môn', wards: [{ code: 27250, name: 'Thị trấn Hóc Môn' }, { code: 27253, name: 'Xã Bà Điểm' }] },
      { code: 785, name: 'Huyện Bình Chánh', wards: [{ code: 27280, name: 'Thị trấn Tân Túc' }, { code: 27283, name: 'Xã Bình Hưng' }, { code: 27286, name: 'Xã Vĩnh Lộc A' }] },
      { code: 786, name: 'Huyện Nhà Bè', wards: [{ code: 27310, name: 'Thị trấn Nhà Bè' }, { code: 27313, name: 'Xã Phước Kiển' }] },
      { code: 787, name: 'Huyện Cần Giờ', wards: [{ code: 27340, name: 'Thị trấn Cần Thạnh' }, { code: 27343, name: 'Xã Long Hòa' }] },
    ],
  },
  {
    code: 48,
    name: 'Thành phố Đà Nẵng',
    districts: [
      { code: 490, name: 'Quận Hải Châu', wards: [{ code: 20194, name: 'Phường Hải Châu I' }, { code: 20197, name: 'Phường Hải Châu II' }, { code: 20200, name: 'Phường Thạch Thang' }, { code: 20203, name: 'Phường Thanh Bình' }, { code: 20206, name: 'Phường Thuận Phước' }] },
      { code: 491, name: 'Quận Thanh Khê', wards: [{ code: 20224, name: 'Phường Tam Thuận' }, { code: 20227, name: 'Phường Thanh Khê Tây' }, { code: 20230, name: 'Phường Thanh Khê Đông' }, { code: 20233, name: 'Phường Xuân Hà' }] },
      { code: 492, name: 'Quận Sơn Trà', wards: [{ code: 20245, name: 'Phường An Hải Bắc' }, { code: 20248, name: 'Phường An Hải Tây' }, { code: 20251, name: 'Phường Mân Thái' }, { code: 20254, name: 'Phường Phước Mỹ' }] },
      { code: 493, name: 'Quận Ngũ Hành Sơn', wards: [{ code: 20260, name: 'Phường Mỹ An' }, { code: 20263, name: 'Phường Khuê Mỹ' }, { code: 20266, name: 'Phường Hoà Hải' }, { code: 20269, name: 'Phường Hoà Quý' }] },
      { code: 494, name: 'Quận Liên Chiểu', wards: [{ code: 20272, name: 'Phường Hoà Hiệp Bắc' }, { code: 20275, name: 'Phường Hoà Hiệp Nam' }, { code: 20278, name: 'Phường Hoà Khánh Bắc' }] },
      { code: 495, name: 'Quận Cẩm Lệ', wards: [{ code: 20281, name: 'Phường Khuê Trung' }, { code: 20284, name: 'Phường Hoà Phát' }, { code: 20287, name: 'Phường Hoà An' }] },
      { code: 497, name: 'Huyện Hòa Vang', wards: [{ code: 20290, name: 'Xã Hoà Bắc' }, { code: 20293, name: 'Xã Hoà Liên' }] },
    ],
  },
  {
    code: 31,
    name: 'Thành phố Hải Phòng',
    districts: [
      { code: 303, name: 'Quận Hồng Bàng', wards: [{ code: 11335, name: 'Phường Quán Toan' }, { code: 11338, name: 'Phường Hùng Vương' }, { code: 11341, name: 'Phường Sở Dầu' }] },
      { code: 304, name: 'Quận Ngô Quyền', wards: [{ code: 11350, name: 'Phường Máy Chai' }, { code: 11353, name: 'Phường Máy Tơ' }, { code: 11356, name: 'Phường Vạn Mỹ' }] },
      { code: 305, name: 'Quận Lê Chân', wards: [{ code: 11370, name: 'Phường An Biên' }, { code: 11373, name: 'Phường An Dương' }] },
      { code: 306, name: 'Quận Hải An', wards: [{ code: 11390, name: 'Phường Đông Hải 1' }, { code: 11393, name: 'Phường Đông Hải 2' }] },
      { code: 307, name: 'Quận Kiến An', wards: [{ code: 11410, name: 'Phường Quán Trữ' }, { code: 11413, name: 'Phường Lãm Hà' }] },
    ],
  },
  {
    code: 92,
    name: 'Thành phố Cần Thơ',
    districts: [
      { code: 916, name: 'Quận Ninh Kiều', wards: [{ code: 31147, name: 'Phường Cái Khế' }, { code: 31150, name: 'Phường An Hòa' }, { code: 31153, name: 'Phường Thới Bình' }, { code: 31156, name: 'Phường An Nghiệp' }, { code: 31159, name: 'Phường An Cư' }] },
      { code: 917, name: 'Quận Bình Thủy', wards: [{ code: 31170, name: 'Phường Bình Thủy' }, { code: 31173, name: 'Phường Trà An' }] },
      { code: 918, name: 'Quận Cái Răng', wards: [{ code: 31190, name: 'Phường Lê Bình' }, { code: 31193, name: 'Phường Hưng Phú' }] },
      { code: 919, name: 'Quận Ô Môn', wards: [{ code: 31210, name: 'Phường Châu Văn Liêm' }, { code: 31213, name: 'Phường Thới Hòa' }] },
    ],
  },
  {
    code: 74,
    name: 'Tỉnh Bình Dương',
    districts: [
      { code: 718, name: 'Thành phố Thủ Dầu Một', wards: [{ code: 25687, name: 'Phường Phú Cường' }, { code: 25690, name: 'Phường Hiệp Thành' }, { code: 25693, name: 'Phường Chánh Nghĩa' }] },
      { code: 719, name: 'Thành phố Thuận An', wards: [{ code: 25714, name: 'Phường Lái Thiêu' }, { code: 25717, name: 'Phường An Phú' }, { code: 25720, name: 'Phường Bình Hòa' }] },
      { code: 720, name: 'Thành phố Dĩ An', wards: [{ code: 25735, name: 'Phường Dĩ An' }, { code: 25738, name: 'Phường Tân Đông Hiệp' }, { code: 25741, name: 'Phường Đông Hòa' }] },
      { code: 721, name: 'Thành phố Bến Cát', wards: [{ code: 25750, name: 'Phường Mỹ Phước' }, { code: 25753, name: 'Phường Thới Hòa' }] },
      { code: 722, name: 'Thành phố Tân Uyên', wards: [{ code: 25770, name: 'Phường Uyên Hưng' }, { code: 25773, name: 'Phường Tân Phước Khánh' }] },
    ],
  },
  {
    code: 75,
    name: 'Tỉnh Đồng Nai',
    districts: [
      { code: 731, name: 'Thành phố Biên Hòa', wards: [{ code: 26002, name: 'Phường Quyết Thắng' }, { code: 26005, name: 'Phường Thanh Bình' }, { code: 26008, name: 'Phường Trung Dũng' }, { code: 26011, name: 'Phường Tân Phong' }] },
      { code: 732, name: 'Thành phố Long Khánh', wards: [{ code: 26040, name: 'Phường Xuân An' }, { code: 26043, name: 'Phường Xuân Bình' }] },
      { code: 734, name: 'Huyện Long Thành', wards: [{ code: 26070, name: 'Thị trấn Long Thành' }, { code: 26073, name: 'Xã An Phước' }] },
      { code: 735, name: 'Huyện Nhơn Trạch', wards: [{ code: 26090, name: 'Thị trấn Hiệp Phước' }, { code: 26093, name: 'Xã Đại Phước' }] },
    ],
  },
  { code: 77, name: 'Tỉnh Bà Rịa - Vũng Tàu', districts: [{ code: 747, name: 'Thành phố Vũng Tàu', wards: [{ code: 26500, name: 'Phường 1' }, { code: 26503, name: 'Phường 2' }, { code: 26506, name: 'Phường Thắng Tam' }] }, { code: 748, name: 'Thành phố Bà Rịa', wards: [{ code: 26530, name: 'Phường Phước Trung' }] }] },
  { code: 56, name: 'Tỉnh Khánh Hòa', districts: [{ code: 568, name: 'Thành phố Nha Trang', wards: [{ code: 22400, name: 'Phường Lộc Thọ' }, { code: 22403, name: 'Phường Phước Tiến' }, { code: 22406, name: 'Phường Tân Lập' }] }, { code: 569, name: 'Thành phố Cam Ranh', wards: [{ code: 22430, name: 'Phường Cam Phú' }] }] },
  { code: 49, name: 'Tỉnh Quảng Nam', districts: [{ code: 502, name: 'Thành phố Tam Kỳ', wards: [{ code: 20500, name: 'Phường An Mỹ' }] }, { code: 503, name: 'Thành phố Hội An', wards: [{ code: 20530, name: 'Phường Minh An' }, { code: 20533, name: 'Phường Cẩm Phô' }] }] },
  { code: 46, name: 'Tỉnh Thừa Thiên Huế', districts: [{ code: 474, name: 'Thành phố Huế', wards: [{ code: 19800, name: 'Phường Vĩnh Ninh' }, { code: 19803, name: 'Phường Phú Nhuận' }, { code: 19806, name: 'Phường Thuận Lộc' }] }] },
  { code: 22, name: 'Tỉnh Quảng Ninh', districts: [{ code: 193, name: 'Thành phố Hạ Long', wards: [{ code: 6800, name: 'Phường Bãi Cháy' }, { code: 6803, name: 'Phường Hồng Gai' }] }, { code: 194, name: 'Thành phố Móng Cái', wards: [{ code: 6830, name: 'Phường Trần Phú' }] }] },
  { code: 24, name: 'Tỉnh Bắc Ninh', districts: [{ code: 215, name: 'Thành phố Bắc Ninh', wards: [{ code: 7600, name: 'Phường Tiền An' }, { code: 7603, name: 'Phường Suối Hoa' }] }, { code: 216, name: 'Thị xã Từ Sơn', wards: [{ code: 7630, name: 'Phường Đông Ngàn' }] }] },
  { code: 33, name: 'Tỉnh Hưng Yên', districts: [{ code: 323, name: 'Thành phố Hưng Yên', wards: [{ code: 12000, name: 'Phường Lê Lợi' }] }, { code: 325, name: 'Huyện Văn Giang', wards: [{ code: 12030, name: 'Thị trấn Văn Giang' }, { code: 12033, name: 'Xã Phụng Công' }] }] },
  { code: 68, name: 'Tỉnh Lâm Đồng', districts: [{ code: 672, name: 'Thành phố Đà Lạt', wards: [{ code: 24700, name: 'Phường 1' }, { code: 24703, name: 'Phường 2' }] }, { code: 673, name: 'Thành phố Bảo Lộc', wards: [{ code: 24730, name: 'Phường 1' }] }] },
  { code: 2, name: 'Tỉnh Hà Giang', districts: [{ code: 24, name: 'Thành phố Hà Giang', wards: [{ code: 700, name: 'Phường Trần Phú' }] }] },
  { code: 4, name: 'Tỉnh Cao Bằng', districts: [{ code: 40, name: 'Thành phố Cao Bằng', wards: [{ code: 1200, name: 'Phường Hợp Giang' }] }] },
  { code: 6, name: 'Tỉnh Bắc Kạn', districts: [{ code: 58, name: 'Thành phố Bắc Kạn', wards: [{ code: 1800, name: 'Phường Đức Xuân' }] }] },
  { code: 8, name: 'Tỉnh Tuyên Quang', districts: [{ code: 70, name: 'Thành phố Tuyên Quang', wards: [{ code: 2200, name: 'Phường Phan Thiết' }] }] },
  { code: 10, name: 'Tỉnh Lào Cai', districts: [{ code: 80, name: 'Thành phố Lào Cai', wards: [{ code: 2600, name: 'Phường Kim Tân' }] }, { code: 82, name: 'Thị xã Sa Pa', wards: [{ code: 2630, name: 'Phường Sa Pa' }] }] },
  { code: 11, name: 'Tỉnh Điện Biên', districts: [{ code: 94, name: 'Thành phố Điện Biên Phủ', wards: [{ code: 3100, name: 'Phường Mường Thanh' }] }] },
  { code: 12, name: 'Tỉnh Lai Châu', districts: [{ code: 104, name: 'Thành phố Lai Châu', wards: [{ code: 3400, name: 'Phường Quyết Thắng' }] }] },
  { code: 14, name: 'Tỉnh Sơn La', districts: [{ code: 116, name: 'Thành phố Sơn La', wards: [{ code: 3800, name: 'Phường Chiềng Lề' }] }] },
  { code: 15, name: 'Tỉnh Yên Bái', districts: [{ code: 132, name: 'Thành phố Yên Bái', wards: [{ code: 4300, name: 'Phường Đồng Tâm' }] }] },
  { code: 17, name: 'Tỉnh Hoà Bình', districts: [{ code: 148, name: 'Thành phố Hòa Bình', wards: [{ code: 4800, name: 'Phường Phương Lâm' }] }] },
  { code: 19, name: 'Tỉnh Thái Nguyên', districts: [{ code: 164, name: 'Thành phố Thái Nguyên', wards: [{ code: 5400, name: 'Phường Phan Đình Phùng' }] }] },
  { code: 20, name: 'Tỉnh Lạng Sơn', districts: [{ code: 178, name: 'Thành phố Lạng Sơn', wards: [{ code: 6000, name: 'Phường Hoàng Văn Thụ' }] }] },
  { code: 25, name: 'Tỉnh Phú Thọ', districts: [{ code: 227, name: 'Thành phố Việt Trì', wards: [{ code: 8100, name: 'Phường Gia Cẩm' }] }] },
  { code: 26, name: 'Tỉnh Vĩnh Phúc', districts: [{ code: 243, name: 'Thành phố Vĩnh Yên', wards: [{ code: 8700, name: 'Phường Tích Sơn' }] }] },
  { code: 27, name: 'Tỉnh Bắc Giang', districts: [{ code: 256, name: 'Thành phố Bắc Giang', wards: [{ code: 9200, name: 'Phường Hoàng Văn Thụ' }] }] },
  { code: 30, name: 'Tỉnh Hải Dương', districts: [{ code: 288, name: 'Thành phố Hải Dương', wards: [{ code: 10400, name: 'Phường Trần Phú' }] }] },
  { code: 34, name: 'Tỉnh Thái Bình', districts: [{ code: 336, name: 'Thành phố Thái Bình', wards: [{ code: 12500, name: 'Phường Lê Hồng Phong' }] }] },
  { code: 35, name: 'Tỉnh Hà Nam', districts: [{ code: 347, name: 'Thành phố Phủ Lý', wards: [{ code: 13000, name: 'Phường Minh Khai' }] }] },
  { code: 36, name: 'Tỉnh Nam Định', districts: [{ code: 356, name: 'Thành phố Nam Định', wards: [{ code: 13400, name: 'Phường Vị Hoàng' }] }] },
  { code: 37, name: 'Tỉnh Ninh Bình', districts: [{ code: 369, name: 'Thành phố Ninh Bình', wards: [{ code: 14000, name: 'Phường Vân Giang' }] }, { code: 370, name: 'Thành phố Tam Điệp', wards: [{ code: 14030, name: 'Phường Bắc Sơn' }] }] },
  { code: 38, name: 'Tỉnh Thanh Hóa', districts: [{ code: 380, name: 'Thành phố Thanh Hóa', wards: [{ code: 14500, name: 'Phường Ba Đình' }, { code: 14503, name: 'Phường Điện Biên' }] }, { code: 381, name: 'Thành phố Sầm Sơn', wards: [{ code: 14530, name: 'Phường Trường Sơn' }] }] },
  { code: 40, name: 'Tỉnh Nghệ An', districts: [{ code: 412, name: 'Thành phố Vinh', wards: [{ code: 16100, name: 'Phường Lê Mao' }, { code: 16103, name: 'Phường Quang Trung' }] }, { code: 413, name: 'Thị xã Cửa Lò', wards: [{ code: 16130, name: 'Phường Nghi Hương' }] }] },
  { code: 42, name: 'Tỉnh Hà Tĩnh', districts: [{ code: 436, name: 'Thành phố Hà Tĩnh', wards: [{ code: 17500, name: 'Phường Bắc Hà' }] }] },
  { code: 44, name: 'Tỉnh Quảng Bình', districts: [{ code: 450, name: 'Thành phố Đồng Hới', wards: [{ code: 18500, name: 'Phường Đồng Mỹ' }] }] },
  { code: 45, name: 'Tỉnh Quảng Trị', districts: [{ code: 461, name: 'Thành phố Đông Hà', wards: [{ code: 19100, name: 'Phường 1' }] }] },
  { code: 51, name: 'Tỉnh Quảng Ngãi', districts: [{ code: 522, name: 'Thành phố Quảng Ngãi', wards: [{ code: 21000, name: 'Phường Trần Phú' }] }] },
  { code: 52, name: 'Tỉnh Bình Định', districts: [{ code: 540, name: 'Thành phố Quy Nhơn', wards: [{ code: 21600, name: 'Phường Lê Lợi' }, { code: 21603, name: 'Phường Nguyễn Văn Cừ' }] }] },
  { code: 54, name: 'Tỉnh Phú Yên', districts: [{ code: 555, name: 'Thành phố Tuy Hòa', wards: [{ code: 22000, name: 'Phường 1' }] }] },
  { code: 58, name: 'Tỉnh Ninh Thuận', districts: [{ code: 582, name: 'Thành phố Phan Rang - Tháp Chàm', wards: [{ code: 22800, name: 'Phường Kinh Dinh' }] }] },
  { code: 60, name: 'Tỉnh Bình Thuận', districts: [{ code: 593, name: 'Thành phố Phan Thiết', wards: [{ code: 23200, name: 'Phường Đức Nghĩa' }] }] },
  { code: 62, name: 'Tỉnh Kon Tum', districts: [{ code: 608, name: 'Thành phố Kon Tum', wards: [{ code: 23600, name: 'Phường Quyết Thắng' }] }] },
  { code: 64, name: 'Tỉnh Gia Lai', districts: [{ code: 622, name: 'Thành phố Pleiku', wards: [{ code: 24000, name: 'Phường Diên Hồng' }] }] },
  { code: 66, name: 'Tỉnh Đắk Lắk', districts: [{ code: 643, name: 'Thành phố Buôn Ma Thuột', wards: [{ code: 24400, name: 'Phường Thắng Lợi' }, { code: 24403, name: 'Phường Tân Lợi' }] }] },
  { code: 67, name: 'Tỉnh Đắk Nông', districts: [{ code: 660, name: 'Thành phố Gia Nghĩa', wards: [{ code: 24600, name: 'Phường Nghĩa Đức' }] }] },
  { code: 70, name: 'Tỉnh Bình Phước', districts: [{ code: 688, name: 'Thành phố Đồng Xoài', wards: [{ code: 25000, name: 'Phường Tân Bình' }] }] },
  { code: 72, name: 'Tỉnh Tây Ninh', districts: [{ code: 703, name: 'Thành phố Tây Ninh', wards: [{ code: 25400, name: 'Phường 1' }] }] },
  { code: 80, name: 'Tỉnh Long An', districts: [{ code: 794, name: 'Thành phố Tân An', wards: [{ code: 27500, name: 'Phường 1' }] }] },
  { code: 82, name: 'Tỉnh Tiền Giang', districts: [{ code: 815, name: 'Thành phố Mỹ Tho', wards: [{ code: 28000, name: 'Phường 1' }] }] },
  { code: 83, name: 'Tỉnh Bến Tre', districts: [{ code: 829, name: 'Thành phố Bến Tre', wards: [{ code: 28500, name: 'Phường An Hội' }] }] },
  { code: 84, name: 'Tỉnh Trà Vinh', districts: [{ code: 842, name: 'Thành phố Trà Vinh', wards: [{ code: 29000, name: 'Phường 1' }] }] },
  { code: 86, name: 'Tỉnh Vĩnh Long', districts: [{ code: 855, name: 'Thành phố Vĩnh Long', wards: [{ code: 29500, name: 'Phường 1' }] }] },
  { code: 87, name: 'Tỉnh Đồng Tháp', districts: [{ code: 866, name: 'Thành phố Cao Lãnh', wards: [{ code: 30000, name: 'Phường 1' }] }, { code: 867, name: 'Thành phố Sa Đéc', wards: [{ code: 30030, name: 'Phường 1' }] }] },
  { code: 89, name: 'Tỉnh An Giang', districts: [{ code: 883, name: 'Thành phố Long Xuyên', wards: [{ code: 30500, name: 'Phường Mỹ Bình' }] }, { code: 884, name: 'Thành phố Châu Đốc', wards: [{ code: 30530, name: 'Phường Châu Phú A' }] }] },
  { code: 91, name: 'Tỉnh Kiên Giang', districts: [{ code: 899, name: 'Thành phố Rạch Giá', wards: [{ code: 30800, name: 'Phường Vĩnh Thanh Vân' }] }, { code: 900, name: 'Thành phố Phú Quốc', wards: [{ code: 30830, name: 'Phường Dương Đông' }, { code: 30833, name: 'Phường An Thới' }] }] },
  { code: 93, name: 'Tỉnh Hậu Giang', districts: [{ code: 930, name: 'Thành phố Vị Thanh', wards: [{ code: 31500, name: 'Phường 1' }] }] },
  { code: 94, name: 'Tỉnh Sóc Trăng', districts: [{ code: 941, name: 'Thành phố Sóc Trăng', wards: [{ code: 31800, name: 'Phường 1' }] }] },
  { code: 95, name: 'Tỉnh Bạc Liêu', districts: [{ code: 954, name: 'Thành phố Bạc Liêu', wards: [{ code: 32100, name: 'Phường 1' }] }] },
  { code: 96, name: 'Tỉnh Cà Mau', districts: [{ code: 964, name: 'Thành phố Cà Mau', wards: [{ code: 32400, name: 'Phường 1' }] }] },
];

export const AddressCascadeSelect: React.FC<AddressCascadeSelectProps> = ({
  province = '',
  district = '',
  ward = '',
  addressDetail = '',
  onChange,
  className = '',
}) => {
  const [provincesList, setProvincesList] = useState<ApiProvince[]>(FALLBACK_PROVINCES);
  const [districtsList, setDistrictsList] = useState<ApiDistrict[]>([]);
  const [wardsList, setWardsList] = useState<ApiWard[]>([]);

  const [selectedProvinceName, setSelectedProvinceName] = useState(province);
  const [selectedDistrictName, setSelectedDistrictName] = useState(district);
  const [selectedWardName, setSelectedWardName] = useState(ward);
  const [detail, setDetail] = useState(addressDetail);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    setSelectedProvinceName(province);
  }, [province]);

  useEffect(() => {
    setSelectedDistrictName(district);
  }, [district]);

  useEffect(() => {
    setSelectedWardName(ward);
  }, [ward]);

  useEffect(() => {
    setDetail(addressDetail);
  }, [addressDetail]);

  // 1. Fetch Provinces from online API with fallback
  useEffect(() => {
    let isMounted = true;
    setLoadingProvinces(true);
    fetch('https://provinces.open-api.vn/api/p/')
      .then((res) => res.json())
      .then((data: ApiProvince[]) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setProvincesList(data);
        }
      })
      .catch((err) => {
        console.warn('Provinces online API unavailable, using offline dataset:', err);
        if (isMounted) {
          setProvincesList(FALLBACK_PROVINCES);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingProvinces(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const normalize = (s?: string) => (s || '').toLowerCase().replace(/^(tỉnh|thành phố|tp\.|quận|huyện|thị xã|phường|xã|thị trấn)\s+/i, '').trim();

  // 2. Fetch Districts when Province changes
  useEffect(() => {
    if (!selectedProvinceName) {
      setDistrictsList([]);
      setWardsList([]);
      return;
    }
    const foundProv = provincesList.find((p) => p.name.toLowerCase().trim() === selectedProvinceName.toLowerCase().trim() || normalize(p.name) === normalize(selectedProvinceName))
      || FALLBACK_PROVINCES.find((p) => p.name.toLowerCase().trim() === selectedProvinceName.toLowerCase().trim() || normalize(p.name) === normalize(selectedProvinceName));
    
    if (!foundProv) {
      // Fallback generic districts if custom entered
      setDistrictsList([
        { code: 9901, name: 'Quận / Huyện trung tâm', wards: [{ code: 99001, name: 'Phường / Xã trung tâm' }] }
      ]);
      return;
    }

    if (foundProv.districts && foundProv.districts.length > 0) {
      setDistrictsList(foundProv.districts);
    }

    let isMounted = true;
    setLoadingDistricts(true);
    fetch(`https://provinces.open-api.vn/api/p/${foundProv.code}?depth=2`)
      .then((res) => res.json())
      .then((data: ApiProvince) => {
        if (isMounted && data && Array.isArray(data.districts) && data.districts.length > 0) {
          setDistrictsList(data.districts);
        }
      })
      .catch((err) => {
        console.warn('Districts API unavailable, using fallback:', err);
        if (isMounted && foundProv.districts) {
          setDistrictsList(foundProv.districts);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingDistricts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProvinceName, provincesList]);

  // 3. Fetch Wards when District changes
  useEffect(() => {
    if (!selectedDistrictName) {
      setWardsList([]);
      return;
    }
    const foundDist = districtsList.find((d) => d.name.toLowerCase().trim() === selectedDistrictName.toLowerCase().trim() || normalize(d.name) === normalize(selectedDistrictName));
    if (!foundDist) {
      setWardsList([{ code: 99001, name: 'Phường / Xã trung tâm' }]);
      return;
    }

    if (foundDist.wards && foundDist.wards.length > 0) {
      setWardsList(foundDist.wards);
    } else {
      setWardsList([
        { code: 99001, name: 'Phường 1' },
        { code: 99002, name: 'Phường 2' },
        { code: 99003, name: 'Thị trấn trung tâm' },
        { code: 99004, name: 'Xã trung tâm' },
      ]);
    }

    let isMounted = true;
    setLoadingWards(true);
    fetch(`https://provinces.open-api.vn/api/d/${foundDist.code}?depth=2`)
      .then((res) => res.json())
      .then((data: ApiDistrict) => {
        if (isMounted && data && Array.isArray(data.wards) && data.wards.length > 0) {
          setWardsList(data.wards);
        }
      })
      .catch((err) => {
        console.warn('Wards API unavailable, using fallback:', err);
        if (isMounted && foundDist.wards && foundDist.wards.length > 0) {
          setWardsList(foundDist.wards);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingWards(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDistrictName, districtsList]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pName = e.target.value;
    setSelectedProvinceName(pName);
    setSelectedDistrictName('');
    setSelectedWardName('');
    setDistrictsList([]);
    setWardsList([]);
    onChange({ province: pName, district: '', ward: '', addressDetail: detail });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dName = e.target.value;
    setSelectedDistrictName(dName);
    setSelectedWardName('');
    setWardsList([]);
    onChange({ province: selectedProvinceName, district: dName, ward: '', addressDetail: detail });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wName = e.target.value;
    setSelectedWardName(wName);
    onChange({ province: selectedProvinceName, district: selectedDistrictName, ward: wName, addressDetail: detail });
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const det = e.target.value;
    setDetail(det);
    onChange({ province: selectedProvinceName, district: selectedDistrictName, ward: selectedWardName, addressDetail: det });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
            <span>Tỉnh / thành phố</span>
            {loadingProvinces && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
          </label>
          <select
            value={selectedProvinceName}
            onChange={handleProvinceChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Chọn tỉnh / thành phố --</option>
            {provincesList.map((p) => (
              <option key={p.code} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
            <span>Quận / huyện</span>
            {loadingDistricts && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
          </label>
          <select
            value={selectedDistrictName}
            onChange={handleDistrictChange}
            disabled={!selectedProvinceName || loadingDistricts}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">-- Chọn quận / huyện --</option>
            {districtsList.map((d) => (
              <option key={d.code} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
            <span>Phường / xã</span>
            {loadingWards && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
          </label>
          <select
            value={selectedWardName}
            onChange={handleWardChange}
            disabled={!selectedDistrictName || loadingWards}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">-- Chọn phường / xã --</option>
            {wardsList.map((w) => (
              <option key={w.code} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ chi tiết (số nhà, tên đường)</label>
        <div className="relative">
          <input
            type="text"
            value={detail}
            onChange={handleDetailChange}
            placeholder="Ví dụ: Số 123 đường Nguyễn Huệ..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
          />
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default AddressCascadeSelect;
