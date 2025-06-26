import { writeFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary"; // ✅ Import the configured Cloudinary instance

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempFilePath = path.join("/tmp", file.name);
    await writeFile(tempFilePath, buffer);

    const uploadResponse = await cloudinary.uploader.upload(tempFilePath); // ✅ Use configured instance

    return NextResponse.json({ success: true, data: uploadResponse });
  } catch (error) {
    console.error("Unhandled upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed." }, { status: 500 });
  }
}
