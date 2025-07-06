import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';

console.log("[DEBUG] CLOUDINARY CONFIG:", {
  CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  API_KEY: process.env.CLOUDINARY_API_KEY,
  API_SECRET: process.env.CLOUDINARY_API_SECRET ? "***" : "undefined",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure: true
})

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  resource_type: string;
  // Video-specific properties
  duration?: number;
  bit_rate?: number;
  frame_rate?: number;
  // Thumbnail for videos
  thumbnail_url?: string;
}

export interface UploadOptions {
  folder?: string;
  public_id?: string;
  transformation?: any[];
  tags?: string[];
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
  quality?: string | number;
  format?: string;
  // Video-specific options
  video_codec?: string;
  audio_codec?: string;
  eager?: any[]; // For generating thumbnails
}

/**
 * Upload media (image or video) to Cloudinary with automatic optimization
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  options: UploadOptions = {},
  mediaType: 'image' | 'video' = 'image'
): Promise<CloudinaryUploadResult> {
  
  const defaultImageOptions: UploadApiOptions = {
    // Remove default folder - let the caller specify the exact folder
    quality: 'auto:good',
    resource_type: 'image',
    transformation: [
      {
        width: 2048,
        height: 2048,
        crop: 'limit',
        quality: 'auto:good'
      }
    ]
  };

  const defaultVideoOptions: UploadApiOptions = {
    // Remove default folder - let the caller specify the exact folder
    resource_type: 'video',
    quality: 'auto:good',
    // Generate thumbnail at 1 second mark
    eager: [
      {
        width: 400,
        height: 300,
        crop: 'fill',
        gravity: 'center',
        format: 'jpg',
        start_offset: '1'
      }
    ],
    // Video optimization settings
    video_codec: 'h264',
    audio_codec: 'aac',
    transformation: [
      {
        quality: 'auto:good',
        video_codec: 'h264',
        audio_codec: 'aac'
      }
    ]
  };

  // Choose default options based on media type
  const defaultOptions = mediaType === 'video' ? defaultVideoOptions : defaultImageOptions;

  // Merge options - the passed options will override defaults
  // Make sure the folder from options takes precedence
  const finalOptions: UploadApiOptions = { 
    ...defaultOptions, 
    ...options 
  };

  console.log(`Cloudinary ${mediaType} upload options:`, {
    folder: finalOptions.folder,
    public_id: finalOptions.public_id,
    tags: finalOptions.tags,
    resource_type: finalOptions.resource_type
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      finalOptions,
      (error, result) => {
        if (error) {
          console.error(`Cloudinary ${mediaType} upload error:`, error);
          reject(error);
        } else if (result) {
          console.log(`✅ Cloudinary ${mediaType} upload successful:`, {
            publicId: result.public_id,
            url: result.secure_url,
            size: `${Math.round(result.bytes / 1024)}KB`,
            format: result.format,
            dimensions: `${result.width}x${result.height}`,
            folder: result.folder,
            duration: result.duration,
            resource_type: result.resource_type
          });

          // For videos, get the thumbnail URL if eager transformation was applied
          let thumbnailUrl: string | undefined;
          if (mediaType === 'video' && result.eager && result.eager.length > 0) {
            thumbnailUrl = result.eager[0].secure_url;
          }

          const uploadResult: CloudinaryUploadResult = {
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            resource_type: result.resource_type,
            duration: result.duration,
            bit_rate: result.bit_rate,
            frame_rate: result.frame_rate,
            thumbnail_url: thumbnailUrl
          };

          resolve(uploadResult);
        } else {
          reject(new Error('Upload failed - no result returned'));
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Upload image to Cloudinary (backwards compatibility)
 */
export async function uploadImageToCloudinary(
  fileBuffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(fileBuffer, options, 'image');
}

/**
 * Upload video to Cloudinary
 */
export async function uploadVideoToCloudinary(
  fileBuffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(fileBuffer, options, 'video');
}

/**
 * Delete media from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    console.log(`🗑️ Cloudinary ${resourceType} delete result:`, result);
    
    if (result.result !== 'ok') {
      throw new Error(`Failed to delete ${resourceType}: ${result.result}`);
    }
  } catch (error) {
    console.error(`Cloudinary ${resourceType} delete error:`, error);
    throw error;
  }
}

/**
 * Generate a Cloudinary URL with transformations
 */
export function generateCloudinaryUrl(
  publicId: string,
  transformations: any[] = [],
  resourceType: 'image' | 'video' = 'image'
): string {
  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
    quality: 'auto:good',
    fetch_format: 'auto',
    resource_type: resourceType
  });
}

/**
 * Get optimized thumbnail URL for images
 */
export function getImageThumbnailUrl(
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
  ], 'image');
}

/**
 * Get video thumbnail URL
 */
export function getVideoThumbnailUrl(
  publicId: string,
  width: number = 400,
  height: number = 300,
  startOffset: string = '1'
): string {
  return generateCloudinaryUrl(publicId, [
    {
      width,
      height,
      crop: 'fill',
      gravity: 'center',
      format: 'jpg',
      start_offset: startOffset,
      quality: 'auto:good'
    }
  ], 'video');
}

/**
 * Get high-quality display URL for images
 */
export function getImageDisplayUrl(
  publicId: string,
  maxWidth: number = 1920
): string {
  return generateCloudinaryUrl(publicId, [
    {
      width: maxWidth,
      crop: 'limit',
      quality: 'auto:good'
    }
  ], 'image');
}

/**
 * Get optimized video URL with quality settings
 */
export function getVideoDisplayUrl(
  publicId: string,
  quality: string = 'auto:good'
): string {
  return generateCloudinaryUrl(publicId, [
    {
      quality,
      video_codec: 'h264',
      audio_codec: 'aac'
    }
  ], 'video');
}

/**
 * Generate video poster/thumbnail for HTML video element
 */
export function getVideoPosterUrl(publicId: string): string {
  return getVideoThumbnailUrl(publicId, 800, 600, '1');
}

export default cloudinary;