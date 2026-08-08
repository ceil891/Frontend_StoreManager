import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any rapidly changing value (e.g. search input).
 * @param value The target value to debounce.
 * @param delay Delay in milliseconds (default: 300ms).
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
