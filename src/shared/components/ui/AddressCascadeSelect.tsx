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

interface ApiProvince {
  code: number;
  name: string;
  districts?: ApiDistrict[];
}

interface ApiDistrict {
  code: number;
  name: string;
  wards?: ApiWard[];
}

interface ApiWard {
  code: number;
  name: string;
}

export const AddressCascadeSelect: React.FC<AddressCascadeSelectProps> = ({
  province = '',
  district = '',
  ward = '',
  addressDetail = '',
  onChange,
  className = '',
}) => {
  const [provincesList, setProvincesList] = useState<ApiProvince[]>([]);
  const [districtsList, setDistrictsList] = useState<ApiDistrict[]>([]);
  const [wardsList, setWardsList] = useState<ApiWard[]>([]);

  const [selectedProvinceName, setSelectedProvinceName] = useState(province);
  const [selectedDistrictName, setSelectedDistrictName] = useState(district);
  const [selectedWardName, setSelectedWardName] = useState(ward);
  const [detail, setDetail] = useState(addressDetail);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // 1. Fetch Provinces (63 Tỉnh Thành)
  useEffect(() => {
    let isMounted = true;
    setLoadingProvinces(true);
    fetch('https://provinces.open-api.vn/api/p/')
      .then((res) => res.json())
      .then((data: ApiProvince[]) => {
        if (isMounted && Array.isArray(data)) {
          setProvincesList(data);
        }
      })
      .catch((err) => console.warn('Failed to load provinces API:', err))
      .finally(() => {
        if (isMounted) setLoadingProvinces(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Districts when Province changes
  useEffect(() => {
    if (!selectedProvinceName) {
      setDistrictsList([]);
      setWardsList([]);
      return;
    }
    const foundProv = provincesList.find((p) => p.name === selectedProvinceName);
    if (!foundProv) return;

    let isMounted = true;
    setLoadingDistricts(true);
    fetch(`https://provinces.open-api.vn/api/p/${foundProv.code}?depth=2`)
      .then((res) => res.json())
      .then((data: ApiProvince) => {
        if (isMounted && data && Array.isArray(data.districts)) {
          setDistrictsList(data.districts);
        }
      })
      .catch((err) => console.warn('Failed to load districts API:', err))
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
    const foundDist = districtsList.find((d) => d.name === selectedDistrictName);
    if (!foundDist) return;

    let isMounted = true;
    setLoadingWards(true);
    fetch(`https://provinces.open-api.vn/api/d/${foundDist.code}?depth=2`)
      .then((res) => res.json())
      .then((data: ApiDistrict) => {
        if (isMounted && data && Array.isArray(data.wards)) {
          setWardsList(data.wards);
        }
      })
      .catch((err) => console.warn('Failed to load wards API:', err))
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
            <span>Tỉnh / Thành phố</span>
            {loadingProvinces && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
          </label>
          <select
            value={selectedProvinceName}
            onChange={handleProvinceChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Chọn Tỉnh / Thành phố --</option>
            {provincesList.map((p) => (
              <option key={p.code} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
            <span>Quận / Huyện</span>
            {loadingDistricts && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
          </label>
          <select
            value={selectedDistrictName}
            onChange={handleDistrictChange}
            disabled={!selectedProvinceName || loadingDistricts}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">-- Chọn Quận / Huyện --</option>
            {districtsList.map((d) => (
              <option key={d.code} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
            <span>Phường / Xã</span>
            {loadingWards && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
          </label>
          <select
            value={selectedWardName}
            onChange={handleWardChange}
            disabled={!selectedDistrictName || loadingWards}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            <option value="">-- Chọn Phường / Xã --</option>
            {wardsList.map((w) => (
              <option key={w.code} value={w.name}>
                {w.name}
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
