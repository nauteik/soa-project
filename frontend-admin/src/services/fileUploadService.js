import axios from 'axios';
import { API_URL } from '../config/constants';

const upload = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API_URL}/api/upload/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

const uploadWithName = async (file, filename) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', filename);
    
    const response = await axios.post(`${API_URL}/api/upload/image/named`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

const deleteFile = async (filename) => {
  try {
    const response = await axios.delete(`${API_URL}/api/upload/image/${filename}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

const getImageUrl = async (filename) => {
  try {
    const response = await axios.get(`${API_URL}/api/upload/image/${filename}`);
    return response.data.url;
  } catch (error) {
    // Nếu có lỗi, trả về URL tương đối
    return `${API_URL}/static/images/${filename}`;
  }
};

const FileUploadService = {
  upload,
  uploadWithName,
  deleteFile,
  getImageUrl,
};

export default FileUploadService; 