/**
 * Định dạng số thành chuỗi tiền tệ VND
 * @param amount Số tiền cần định dạng
 * @returns Chuỗi tiền tệ đã định dạng (vd: 1.234.567đ)
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '0đ';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
    .format(numericAmount)
    .replace('₫', 'đ');
};

/**
 * Định dạng ngày thành chuỗi DD/MM/YYYY
 * @param date Đối tượng Date hoặc chuỗi ngày
 * @returns Chuỗi ngày đã định dạng
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Chuyển đổi đối tượng Date thành chuỗi ngày ISO YYYY-MM-DD
 * @param date Đối tượng Date
 * @returns Chuỗi ngày dạng YYYY-MM-DD
 */
export const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}; 