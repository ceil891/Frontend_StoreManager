import { useMemo } from 'react';

export interface ComboDetailItemLike {
  id?: string;
  sku: string;
  quantity: number;
}

export function useComboStockCalculator(
  comboDetails: ComboDetailItemLike[],
  branchStockMap: Record<string, number> = {}
) {
  return useMemo(() => {
    if (!comboDetails || comboDetails.length === 0) {
      return { availableStock: 0, isOutOfStock: true, bottleneckSku: null };
    }

    let minUnits = Infinity;
    let bottleneckSku: string | null = null;

    for (const item of comboDetails) {
      const available = branchStockMap[item.sku] ?? branchStockMap[item.id || ''] ?? 0;
      const required = Math.max(1, Number(item.quantity) || 1);
      const possibleUnits = Math.floor(available / required);

      if (possibleUnits < minUnits) {
        minUnits = possibleUnits;
        bottleneckSku = item.sku;
      }
    }

    const finalStock = minUnits === Infinity ? 0 : Math.max(0, minUnits);

    return {
      availableStock: finalStock,
      isOutOfStock: finalStock === 0,
      bottleneckSku,
    };
  }, [comboDetails, branchStockMap]);
}
