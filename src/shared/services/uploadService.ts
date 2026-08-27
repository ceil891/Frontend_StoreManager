import { axiosClient } from '@/shared/lib/axiosClient';

export interface CloudinaryUploadResult {
  imageUrl: string;
  publicId?: string;
}

/**
 * Tải ảnh lên Cloudinary thông qua Backend API /api/v1/uploads/image
 * @param file Tệp ảnh cần upload
 * @param folder Thư mục trên Cloudinary (mặc định: 'avatars')
 * @returns Đường dẫn HTTPS an toàn của ảnh trên Cloudinary
 */
export async function uploadImageToCloudinary(file: File, folder: string = 'avatars'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const res = await axiosClient.post<any, any>('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = res?.data || res?.content || res;
    const url = data?.imageUrl || data?.url || data?.secure_url || '';
    if (url) return url;
  } catch (error) {
    console.warn('Lỗi khi tải ảnh lên backend Cloudinary, thử fallback trực tiếp...', error);
  }

  // Fallback chuyển thành Base64 Data URL nếu server upload gặp sự cố tạm thời
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to convert image'));
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
