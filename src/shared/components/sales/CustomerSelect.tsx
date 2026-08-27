import { useCrmStore } from '@/features/crm/store/crmStore';
import { WALK_IN_CUSTOMER_ID } from '@/features/sales/store/salesStore';

type Props = {
  value: string;
  onChange: (customerId: string) => void;
  allowWalkIn?: boolean;
  className?: string;
  required?: boolean;
};

export function CustomerSelect({ value, onChange, allowWalkIn = true, className = '', required }: Props) {
  const customers = useCrmStore((s) => s.customers);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className={
        className ||
        'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500'
      }
    >
      <option value="">— Chọn khách hàng (CRM) —</option>
      {allowWalkIn && <option value={WALK_IN_CUSTOMER_ID}>Khách lẻ (vãng lai)</option>}
      {customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.customerCode})
        </option>
      ))}
    </select>
  );
}
