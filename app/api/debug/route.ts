// Create this file: /app/api/debug/route.ts
// This will give us ALL the info we need in one go

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    platform: process.platform,
    node_version: process.version,
    checks: {}
  };

  // 1. Check Environment Variables
  diagnostics.checks.environment_variables = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? 
      { status: 'SET', value: process.env.CLOUDINARY_CLOUD_NAME } : 
      { status: 'MISSING', value: null },
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? 
      { status: 'SET', value: process.env.CLOUDINARY_API_KEY.substring(0, 6) + '...' } : 
      { status: 'MISSING', value: null },
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? 
      { status: 'SET', value: '***' } : 
      { status: 'MISSING', value: null },
    DATABASE_URL: process.env.DATABASE_URL ? 
      { status: 'SET', value: '***' } : 
      { status: 'MISSING', value: null }
  };

  // 2. Test Database Connection
  try {
    const categoryCount = await db.category.count();
    const imageCount = await db.image.count();
    diagnostics.checks.database = {
      status: 'SUCCESS',
      category_count: categoryCount,
      image_count: imageCount
    };
  } catch (dbError: any) {
    diagnostics.checks.database = {
      status: 'FAILED',
      error: dbError.message,
      code: dbError.code
    };
  }

  // 3. Test Cloudinary Configuration
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });

      // Test ping
      const pingResult = await cloudinary.api.ping();
      diagnostics.checks.cloudinary_ping = {
        status: 'SUCCESS',
        response: pingResult
      };

      // Test tiny upload
      const testBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'debug-test',
            public_id: `test_${Date.now()}`,
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(testBuffer);
      });

      diagnostics.checks.cloudinary_upload = {
        status: 'SUCCESS',
        public_id: (uploadResult as any).public_id,
        url: (uploadResult as any).secure_url
      };

      // Clean up test image
      try {
        await cloudinary.uploader.destroy((uploadResult as any).public_id);
        diagnostics.checks.cloudinary_cleanup = { status: 'SUCCESS' };
      } catch (cleanupError) {
        diagnostics.checks.cloudinary_cleanup = { 
          status: 'FAILED', 
          error: (cleanupError as any).message 
        };
      }

    } catch (cloudinaryError: any) {
      diagnostics.checks.cloudinary_ping = {
        status: 'FAILED',
        error: cloudinaryError.message,
        http_code: cloudinaryError.http_code,
        error_details: cloudinaryError.error
      };
    }
  } else {
    diagnostics.checks.cloudinary_ping = {
      status: 'SKIPPED',
      reason: 'Missing environment variables'
    };
  }

  // 4. Test File System (temp directory)
  try {
    const os = await import('os');
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const tempDir = os.tmpdir();
    const testFile = path.join(tempDir, `test_${Date.now()}.txt`);
    
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    
    diagnostics.checks.filesystem = {
      status: 'SUCCESS',
      temp_dir: tempDir
    };
  } catch (fsError: any) {
    diagnostics.checks.filesystem = {
      status: 'FAILED',
      error: fsError.message
    };
  }

  // 5. Overall Status
  const allChecks = Object.values(diagnostics.checks);
  const failedChecks = allChecks.filter((check: any) => check.status === 'FAILED');
  
  diagnostics.overall_status = failedChecks.length === 0 ? 'HEALTHY' : 'ISSUES_DETECTED';
  diagnostics.failed_checks = failedChecks.length;

  return NextResponse.json(diagnostics, {
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// Also create a simple POST test for upload simulation
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        error: 'No file provided',
        received_fields: Array.from(formData.keys())
      });
    }

    const fileInfo = {
      name: file.name,
      type: file.type,
      size: file.size,
      size_mb: (file.size / 1024 / 1024).toFixed(2)
    };

    // Try to read the file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return NextResponse.json({
      success: true,
      message: 'File processing test successful',
      file_info: fileInfo,
      buffer_size: buffer.length,
      first_bytes: Array.from(buffer.slice(0, 10))
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}