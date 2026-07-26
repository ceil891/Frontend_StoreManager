import React, { useState } from 'react';
import { Modal } from './Modal';
import { Search, Check, Building2, User, Package, MapPin, X } from 'lucide-react';

export interface LookupOption {
  id: string;
  code?: string;
  name: string;
  subtitle?: string;
  tag?: string;
  [key: string]: any;
}

interface SearchLookupModalProps {
  title: string;
  options: LookupOption[];
  value?: string;
  onChange: (value: string, selectedOption?: LookupOption) => void;
  placeholder?: string;
  iconType?: 'user' | 'building' | 'package' | 'location';
  disabled?: boolean;
  className?: string;
}

export const SearchLookupModal: React.FC<SearchLookupModalProps> = ({
  title,
  options,
  value,
  onChange,
  placeholder = 'Chọn đối tượng...',
  iconType = 'user',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.id === value || opt.code === value);

  const filteredOptions = options.filter(
    (opt) =>
      opt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opt.code && opt.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opt.subtitle && opt.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelect = (option: LookupOption) => {
    onChange(option.id, option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', undefined);
  };

  const renderIcon = () => {
    switch (iconType) {
      case 'building':
        return <Building2 className="w-4 h-4 text-gray-400" />;
      case 'package':
        return <Package className="w-4 h-4 text-gray-400" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-gray-400" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <>
      <div
        onClick={() => !disabled && setIsOpen(true)}
        className={`relative flex items-center justify-between w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm cursor-pointer hover:border-primary transition-colors ${
          disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-gray-800' : ''
        } ${className}`}
      >
        <div className="flex items-center gap-2 overflow-hidden mr-2">
          {renderIcon()}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.code && (
                <span className="font-mono text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded font-semibold">
                  {selectedOption.code}
                </span>
              )}
              <span className="font-medium text-gray-900 dark:text-white truncate">
                {selectedOption.name}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 select-none">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <Search className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={title} size="lg">
        <div className="space-y-4 p-1">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập từ khóa tìm kiếm (Tên, Mã, SĐT...)..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value === opt.id || value === opt.code;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {renderIcon()}
                      <div>
                        <div className="flex items-center gap-2">
                          {opt.code && (
                            <span className="font-mono text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-semibold text-gray-700 dark:text-gray-300">
                              {opt.code}
                            </span>
                          )}
                          <span className="font-semibold text-sm">{opt.name}</span>
                          {opt.tag && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-medium">
                              {opt.tag}
                            </span>
                          )}
                        </div>
                        {opt.subtitle && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {opt.subtitle}
                          </div>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-gray-500">
                Không tìm thấy dữ liệu phù hợp
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SearchLookupModal;
