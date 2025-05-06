/**
 * Hàm định dạng giá tiền theo định dạng Việt Nam
 * @param amount Số tiền cần định dạng
 * @returns Chuỗi đã định dạng với đơn vị VND
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Hàm rút gọn văn bản nếu quá dài
 * @param text Văn bản cần rút gọn
 * @param maxLength Độ dài tối đa
 * @returns Chuỗi đã rút gọn
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}; 