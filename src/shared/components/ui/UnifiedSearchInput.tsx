import React from 'react';
import { SearchInput, type SearchInputProps, type SearchInputRef } from './SearchInput';

export interface UnifiedSearchInputProps extends SearchInputProps {}

/**
 * UnifiedSearchInput - Đồng bộ với SearchInput chuẩn hệ thống:
 * Chiều cao 40px (h-10), bo góc rounded-lg (8px), border #D9D9D9, icon Search trái & Clear X phải.
 */
export const UnifiedSearchInput = React.forwardRef<SearchInputRef, UnifiedSearchInputProps>(
  (props, ref) => <SearchInput ref={ref} {...props} />
);

UnifiedSearchInput.displayName = 'UnifiedSearchInput';

export { SearchInput } from './SearchInput';
export default UnifiedSearchInput;
