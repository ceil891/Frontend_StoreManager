import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

interface AddressCascadeSelectProps {
  province?: string;
  district?: string;
  ward?: string;
  addressDetail?: string;
  onChange: (address: { province: string; district: string; ward: string; addressDetail: string }) => void;
  className?: string;
}

// Sample administrative data for Vietnam provinces
const PROVINCES = [
  {
    name: 'Thành phố Hà Nội',
    districts: [
      { name: 'Quận Ba Đình', wards: ['Phường Phúc Xá', 'Phường Trúc Bạch', 'Phường Vĩnh Phúc'] },
      { name: 'Quận Cầu Giấy', wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Quan Hoa'] },
      { name: 'Quận Đống Đa', wards: ['Phường Láng Hạ', 'Phường Ô Chợ Dừa', 'Phường Văn Miếu'] },
    ],
  },
  {
    name: 'Thành phố Hồ Chí Minh',
    districts: [
      { name: 'Quận 1', wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Tân Định'] },
      { name: 'Quận 3', wards: ['Phường Võ Thị Sáu', 'Phường 1', 'Phường 2'] },
      { name: 'Thành phố Thủ Đức', wards: ['Phường Thảo Điền', 'Phường An Phú', 'Phường Linh Trung'] },
    ],
  },
  {
    name: 'Thành phố Đà Nẵng',
    districts: [
      { name: 'Quận Hải Châu', wards: ['Phường Hải Châu I', 'Phường Hải Châu II', 'Phường Phước Ninh'] },
      { name: 'Quận Thanh Khê', wards: ['Phường An Khê', 'Phường Thanh Khê Đông', 'Phường Xuân Hà'] },
    ],
  },
];

export const AddressCascadeSelect: React.FC<AddressCascadeSelectProps> = ({
  province = '',
  district = '',
  ward = '',
  addressDetail = '',
  onChange,
  className = '',
}) => {
  const [selectedProvince, setSelectedProvince] = useState(province);
  const [selectedDistrict, setSelectedDistrict] = useState(district);
  const [selectedWard, setSelectedWard] = useState(ward);
  const [detail, setDetail] = useState(addressDetail);

  const currentProvinceObj = PROVINCES.find((p) => p.name === selectedProvince);
  const currentDistricts = currentProvinceObj ? currentProvinceObj.districts : [];
  const currentDistrictObj = currentDistricts.find((d) => d.name === selectedDistrict);
  const currentWards = currentDistrictObj ? currentDistrictObj.wards : [];

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = e.target.value;
    setSelectedProvince(p);
    setSelectedDistrict('');
    setSelectedWard('');
    onChange({ province: p, district: '', ward: '', addressDetail: detail });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const d = e.target.value;
    setSelectedDistrict(d);
    setSelectedWard('');
    onChange({ province: selectedProvince, district: d, ward: '', addressDetail: detail });
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const w = e.target.value;
    setSelectedWard(w);
    onChange({ province: selectedProvince, district: selectedDistrict, ward: w, addressDetail: detail });
  };

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const det = e.target.value;
    setDetail(det);
    onChange({ province: selectedProvince, district: selectedDistrict, ward: selectedWard, addressDetail: det });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tỉnh / Thành phố</label>
          <select
            value={selectedProvince}
            onChange={handleProvinceChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Chọn Tỉnh / Thành phố --</option>
            {PROVINCES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quận / Huyện</label>
          <select
            value={selectedDistrict}
            onChange={handleDistrictChange}
            disabled={!selectedProvince}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">-- Chọn Quận / Huyện --</option>
            {currentDistricts.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phường / Xã</label>
          <select
            value={selectedWard}
            onChange={handleWardChange}
            disabled={!selectedDistrict}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">-- Chọn Phường / Xã --</option>
            {currentWards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ chi tiết (Số nhà, Tên đường)</label>
        <div className="relative">
          <input
            type="text"
            value={detail}
            onChange={handleDetailChange}
            placeholder="Ví dụ: 123 Đường Nguyễn Huệ..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
          />
          <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default AddressCascadeSelect;
