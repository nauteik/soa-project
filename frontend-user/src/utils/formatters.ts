/**
 * Format a number as Vietnamese Dong (VND) currency
 * @param amount - The amount to format (in VND)
 * @param showSymbol - Whether to show the currency symbol (đ)
 * @returns Formatted price string (e.g., "790.000 đ")
 */
export const formatVND = (amount: number, showSymbol = true): string => {
  // Handle null, undefined or invalid values
  if (amount == null || isNaN(amount)) {
    return showSymbol ? '0 đ' : '0';
  }

  // Format the number with dot as thousands separator
  const formattedValue = amount
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  // Return with or without the đ symbol
  return showSymbol ? `${formattedValue} đ` : formattedValue;
};

/**
 * Format a price range in VND
 * @param minPrice - The minimum price
 * @param maxPrice - The maximum price
 * @returns Formatted price range string (e.g., "790.000 đ - 1.500.000 đ")
 */
export const formatPriceRange = (minPrice: number, maxPrice: number): string => {
  return `${formatVND(minPrice)} - ${formatVND(maxPrice)}`;
};

/**
 * Format a price with a discount
 * @param originalPrice - The original price
 * @param discountPercent - The discount percentage (e.g., 10 for 10%)
 * @returns An object with formatted original price and discounted price
 */
export const formatDiscountedPrice = (
  originalPrice: number,
  discountPercent: number
): { original: string; discounted: string } => {
  const discountedPrice = originalPrice - (originalPrice * discountPercent) / 100;
  
  return {
    original: formatVND(originalPrice),
    discounted: formatVND(discountedPrice)
  };
};