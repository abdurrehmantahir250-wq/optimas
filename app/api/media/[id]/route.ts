import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const virtualFileService = require("../../../../../server/services/virtualFileService");

type RouteContext = { params: Promise<{ id: string }> };

function jsonError(error: unknown, fallback: string) {
  const err = error as { message?: string; status?: number };
  const payload = virtualFileService.serviceErrorResponse(err, fallback);
  return NextResponse.json(payload, { status: payload.status || 500 });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = await virtualFileService.deleteVirtualFile(id);
    return NextResponse.json(payload);
  } catch (error: unknown) {
    return jsonError(error, "Failed to move media to trash.");
  }
}
