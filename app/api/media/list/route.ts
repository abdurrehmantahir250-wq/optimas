import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const virtualFileService = require("../../../../server/services/virtualFileService");

function jsonError(error: unknown, fallback: string) {
  const err = error as { message?: string; status?: number };
  const payload = virtualFileService.serviceErrorResponse(err, fallback);
  return NextResponse.json({ ...payload, items: [] }, { status: payload.status || 500 });
}

export async function GET(request: NextRequest) {
  try {
    const payload = await virtualFileService.listDeviceMedia(request);
    return NextResponse.json(payload);
  } catch (error: unknown) {
    return jsonError(error, "Failed to fetch media from database.");
  }
}
