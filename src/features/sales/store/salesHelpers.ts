import type { CustomerProfile } from '@/features/crm/store/crmStore';

export const WALK_IN_CUSTOMER_ID = 'walk-in';

export type RefundMethod = 'CASH' | 'BANK_TRANSFER' | 'STORE_CREDIT' | 'ORIGINAL_CARD';

export function resolveCustomerName(
  customerId?: any,
  customers?: CustomerProfile[]
): string {
  if (!customerId) return 'Khách lẻ';

  if (typeof customerId === 'object' && customerId !== null) {
    if (customerId.name && typeof customerId.name === 'string') {
      return customerId.name;
    }
    if (customerId.fullName && typeof customerId.fullName === 'string') {
      return customerId.fullName;
    }
    if (customerId.id) customerId = String(customerId.id);
    else if (customerId._id) customerId = String(customerId._id);
    else return 'Khách lẻ';
  }

  const idStr = String(customerId);
  if (idStr === WALK_IN_CUSTOMER_ID) return 'Khách lẻ';

  if (Array.isArray(customers)) {
    const found = customers.find((c) => c && String(c.id) === idStr);
    if (found?.name) return String(found.name);
  }

  return idStr;
}

export function calcTotalAmount(parts: {
  subTotal: number;
  taxAmount?: number;
  discountAmount?: number;
  shippingFee?: number;
}): number {
  const { subTotal, taxAmount = 0, discountAmount = 0, shippingFee = 0 } = parts;
  return Math.max(0, subTotal + taxAmount + shippingFee - discountAmount);
}

export function formatMoney(amount: number, currency: 'VND' | 'USD' = 'VND'): string {
  if (currency === 'VND') return `${Math.round(amount).toLocaleString('vi-VN')}₫`;
  return `$${amount.toFixed(2)}`;
}

/** Map legacy mock names → CRM customer ids */
export const LEGACY_CUSTOMER_NAME_TO_ID: Record<string, string> = {
  'John Doe': '1',
  'Alice Smith': '2',
  'Bob Johnson': '3',
  'Charlie Brown': '4',
  'Walk-in Customer': WALK_IN_CUSTOMER_ID,
  'Khách lẻ': WALK_IN_CUSTOMER_ID,
  'Acme Corp': '5',
  'Global Logistics': '1',
  'Tech Startup Inc': '2',
  'Beta Retailers': '3',
  'Apex Hypermarkets': '1',
  'Metro Department Stores': '2',
  'Zenith Retails': '3',
  'Boutique Alpha': '4',
};

export function deriveShiftId(date = new Date()): string {
  const d = date.toISOString().slice(0, 10);
  const hour = date.getHours();
  const band = hour >= 6 && hour < 14 ? 'AM' : hour >= 14 && hour < 22 ? 'PM' : 'NIGHT';
  return `SHIFT-${d}-${band}`;
}

export function paymentTermsToDueDate(issueDate: string, paymentTerms: string): string {
  const base = new Date(issueDate);
  if (Number.isNaN(base.getTime())) return issueDate;
  const net = paymentTerms.match(/Net\s*(\d+)/i);
  if (net) {
    base.setDate(base.getDate() + Number(net[1]));
    return base.toISOString().slice(0, 10);
  }
  if (/due on receipt/i.test(paymentTerms)) return issueDate;
  return issueDate;
}
