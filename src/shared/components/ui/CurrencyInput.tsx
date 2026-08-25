import React, { useState, useEffect } from 'react';

interface CurrencyInputProps {
  value?: number;
  onChange?: (value: number) => void;
  placeholder?: string;
  currencySymbol?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  name?: string;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value = 0,
  onChange,
  placeholder = '0',
  currencySymbol = 'đ',
  className = '',
  disabled = false,
  required = false,
  id,
  name,
}) => {
  const formatDisplayValue = (val: number | undefined): string => {
    if (val === undefined || val === null || isNaN(val)) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const [displayValue, setDisplayValue] = useState<string>(formatDisplayValue(value));

  useEffect(() => {
    setDisplayValue(formatDisplayValue(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\./g, '').replace(/,/g, '');
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      const numVal = rawValue === '' ? 0 : parseInt(rawValue, 10);
      setDisplayValue(formatDisplayValue(numVal));
      if (onChange) {
        onChange(numVal);
      }
    }
  };

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        id={id}
        name={name}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 pr-9 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-60 ${className}`}
      />
      {currencySymbol && (
        <span className="absolute right-3 text-xs font-semibold text-gray-400 pointer-events-none select-none">
          {currencySymbol}
        </span>
      )}
    </div>
  );
};

export default CurrencyInput;
