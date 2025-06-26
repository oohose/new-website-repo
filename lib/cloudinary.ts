import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
}

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  transformation?: any[];
  tags?: string[];
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
  quality?: string | number;
  format?: string;
}

/**
 * Upload an image to Cloudinary with automatic optimization
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  
  const defaultOptions: UploadApiOptions = {
    folder: 'portfolio', // Default folder if none specified
    quality: 'auto:good',
    resource_type: 'auto',
    transformation: [
      {
        width: 2048,
        height: 2048,
        crop: 'limit',
        quality: 'auto:good'
      }
    ]
  };

  // Merge options - the passed options will override defaults
  const finalOptions: UploadApiOptions = { 
    ...defaultOptions, 
    ...options 
  };

  console.log('Cloudinary upload options:', {
    folder: finalOptions.folder,
    public_id: finalOptions.public_id,
    tags: finalOptions.tags
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      finalOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          console.log('✅ Cloudinary upload successful:', {
            publicId: result.public_id,
            url: result.secure_url,
            size: `${Math.round(result.bytes / 1024)}KB`,
            format: result.format,
            dimensions: `${result.width}x${result.height}`,
            folder: result.folder
          });
          resolve(result as CloudinaryUploadResult);
        } else {
          reject(new Error('Upload failed - no result returned'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Cloudinary delete result:', result);
    
    if (result.result !== 'ok') {
      throw new Error(`Failed to delete image: ${result.result}`);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

/**
 * Generate a Cloudinary URL with transformations
 */
export function generateCloudinaryUrl(
  publicId: string,
  transformations: any[] = []
): string {
  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
    quality: 'auto:good',
    fetch_format: 'auto'
  });
}

/**
 * Get optimized thumbnail URL
 */
export function getThumbnailUrl(
  publicId: string,
  width: number = 400,
  height: number = 300
): string {
  return generateCloudinaryUrl(publicId, [
    {
      width,
      height,
      crop: 'fill',
      gravity: 'center',
      quality: 'auto:good'
    }
  ]);
}

/**
 * Get high-quality display URL
 */
export function getDisplayUrl(
  publicId: string,
  maxWidth: number = 1920
): string {
  return generateCloudinaryUrl(publicId, [
    {
      width: maxWidth,
      crop: 'limit',
      quality: 'auto:good'
    }
  ]);
}

export default cloudinary;