/**
 * Utility nén ảnh siêu tốc trên trình duyệt bằng HTML5 Canvas.
 * Giúp giảm dung lượng từ 5-15MB xuống ~100-200KB trước khi gửi lên Server,
 * tăng tốc độ tải ảnh gấp 20-50 lần và tiết kiệm băng thông.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  // Nếu không phải là ảnh hoặc kích thước < 200KB thì giữ nguyên
  if (!file.type.startsWith('image/') || file.size <= 200 * 1024) {
    return file;
  }

  // SVG hoặc GIF động không nén qua canvas
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.82,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Tính tỷ lệ thu nhỏ giữ nguyên khung hình (Aspect Ratio)
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        // Vẽ ảnh lên canvas với chất lượng mượt
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Tạo File object mới nhẹ hơn nhiều
            const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], newName, {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
