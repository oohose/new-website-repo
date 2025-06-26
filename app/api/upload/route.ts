// api/upload/route.ts
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";
import { NextRequest, NextResponse } from "next/server"; // ✅ Make sure this is here
import cloudinary from "@/lib/cloudinary"; // ✅ Your configured instance

export const runtime = "nodejs"; // ✅ Ensures it's not an Edge function

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tempFilePath = path.join(os.tmpdir(), file.name); // ✅ Cross-platform
    await writeFile(tempFilePath, buffer);
    console.log("[DEBUG] Temp file written to:", tempFilePath);

    const uploadResponse = await cloudinary.uploader.upload(tempFilePath);
    console.log("[DEBUG] Cloudinary upload result:", uploadResponse);

    return NextResponse.json({ success: true, data: uploadResponse });
  } catch (error: any) {
    console.error("Unhandled upload error:", error?.message || error);
    console.error("Stack:", error?.stack || "none");
    return NextResponse.json({ success: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}
