// Cart types – mirror backend DTOs
export interface CartItem {
  itemId: number;
  variantId: number;
  productName: string;
  variantName: string | null;
  sku: string;
  thumbnail: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CartResponse {
  cartId: number | null;
  status: 'ACTIVE' | 'MERGED' | 'ORDERED' | 'EXPIRED';
  items: CartItem[];
  totalItems: number;
  totalQuantity: number;
  totalAmount: number;
}

export interface AddCartItemRequest {
  productVariantId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface PriceChangeAlert {
  variantId: number;
  productName: string;
  variantName: string | null;
  sku: string;
  cartPrice: number;
  currentPrice: number;
  priceDiff: number;
}

export interface CheckoutValidationResult {
  valid: boolean;
  priceChanges: PriceChangeAlert[];
  unavailableVariantIds: number[];
  outOfStockVariantIds: number[];
}
