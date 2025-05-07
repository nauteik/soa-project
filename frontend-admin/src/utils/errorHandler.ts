/**
 * Hàm xử lý lỗi API để hiển thị thông báo lỗi thân thiện cho người dùng
 * 
 * @param error Lỗi từ API hoặc fetch
 * @returns Thông báo lỗi đã được xử lý
 */
export const handleApiError = (error: any): string => {
  if (error?.response?.data) {
    // Nếu lỗi từ axios
    if (error.response.data.error) {
      return error.response.data.error;
    }
    return JSON.stringify(error.response.data);
  } else if (error instanceof Error) {
    // Nếu lỗi JavaScript thông thường
    return error.message;
  } else if (typeof error === 'object' && error.error) {
    // Nếu đối tượng lỗi có trường error
    return error.error;
  } else if (typeof error === 'string') {
    // Nếu là một chuỗi
    return error;
  }

  // Nếu không xác định rõ loại lỗi
  return 'Đã xảy ra lỗi không xác định';
}; 