/**
 * Image compression utility for optimizing photo uploads
 * Reduces file size while maintaining acceptable quality for mobile uploads
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  maxSizeKB: 1024 // 1MB
};

/**
 * Compress an image file using Canvas API
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - Compressed image file
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Return original file if it's already small enough
  if (file.size <= (opts.maxSizeKB! * 1024)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Clean up object URL immediately
        URL.revokeObjectURL(objectUrl);
        
        // Calculate new dimensions while maintaining aspect ratio
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          opts.maxWidth!,
          opts.maxHeight!
        );

        canvas.width = width;
        canvas.height = height;

        // Draw and compress the image
        ctx!.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new file with compressed blob
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: blob.type || file.type,
                lastModified: Date.now()
              }
            );

            // If still too large, try with lower quality
            if (compressedFile.size > (opts.maxSizeKB! * 1024) && opts.quality! > 0.3) {
              const lowerQualityOptions = {
                ...opts,
                quality: Math.max(0.3, opts.quality! - 0.2)
              };
              compressImage(file, lowerQualityOptions)
                .then(resolve)
                .catch(reject);
            } else {
              resolve(compressedFile);
            }
          },
          file.type.startsWith('image/') ? file.type : 'image/jpeg',
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL and set source
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Get human-readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate if file is an image
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};