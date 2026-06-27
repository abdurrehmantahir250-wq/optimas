import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const virtualFileService = require("../../../../server/services/virtualFileService");

function jsonError(error: unknown, fallback: string) {
  const err = error as { message?: string; status?: number };
  const payload = virtualFileService.serviceErrorResponse(err, fallback);
  return NextResponse.json(payload, { status: payload.status || 500 });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, message: "No media file received." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const body = {
      deviceId: String(formData.get("deviceId") || ""),
      mediaType: String(formData.get("type") || "image") === "video" ? "video" : "image",
      source: String(formData.get("source") || "camera"),
    };

    const payload = await virtualFileService.uploadDeviceMedia(
      { ...request, body },
      {
        buffer,
        originalname: file.name,
        mimetype: file.type || "application/octet-stream",
        size: file.size,
      }
    );

    return NextResponse.json(payload);
  } catch (error: unknown) {
    return jsonError(error, "Media upload to database failed.");
  }
}
