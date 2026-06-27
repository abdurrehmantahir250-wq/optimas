import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const service = require("../../../../server/services/virtualFileService");

type RouteContext = { params: Promise<{ path?: string[] }> };

function jsonError(error: unknown, fallback: string, extras: Record<string, unknown> = {}) {
  const err = error as { message?: string; status?: number };
  const payload = service.serviceErrorResponse(err, fallback);
  return NextResponse.json({ ...payload, ...extras }, { status: payload.status || 500 });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const segments = (await context.params).path || [];

  try {
    if (segments.length === 1 && segments[0] === "browse") {
      return NextResponse.json(await service.browseVirtualFolder(request));
    }
    if (segments.length === 1 && segments[0] === "list") {
      return NextResponse.json(await service.browseVirtualFolder(request));
    }
    if (segments.length === 1 && segments[0] === "folders") {
      return NextResponse.json(await service.listVirtualFolders(request));
    }
    if (segments.length === 1 && segments[0] === "trash") {
      return NextResponse.json(await service.listTrashItems(request));
    }
    if (segments.length === 2 && segments[0] === "share") {
      return NextResponse.json(await service.lookupShareToken(request, segments[1]));
    }
    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  } catch (error) {
    if (segments[0] === "folders") {
      return jsonError(error, "Failed to list folders.", {
        folders: [{ label: "Cloud Drive (root)", value: "/" }],
      });
    }
    return jsonError(error, "Request failed.", { items: [] });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const segments = (await context.params).path || [];

  try {
    if (segments.length === 1 && segments[0] === "folders") {
      const body = await request.json();
      return NextResponse.json(await service.createVirtualFolder(body));
    }

    if (segments.length === 1 && segments[0] === "upload") {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ success: false, message: "No file received." }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const body = {
        deviceId: String(formData.get("deviceId") || "unknown-device"),
        virtualFolder: String(formData.get("virtualFolder") || "/"),
        originalPath: String(formData.get("originalPath") || ""),
      };

      return NextResponse.json(
        await service.uploadVirtualFile(
          { ...request, body },
          {
            buffer,
            originalname: file.name,
            mimetype: file.type || "application/octet-stream",
            size: file.size,
          }
        )
      );
    }

    if (segments.length === 2 && segments[1] === "share") {
      return NextResponse.json(await service.shareVirtualFile(request, segments[0]));
    }
    if (segments.length === 2 && segments[1] === "restore") {
      return NextResponse.json(await service.restoreVirtualFile(request, segments[0]));
    }

    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  } catch (error) {
    return jsonError(error, "Request failed.");
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const segments = (await context.params).path || [];

  try {
    const body = await request.json();

    if (segments.length === 2 && segments[1] === "rename") {
      return NextResponse.json(await service.renameVirtualFile(request, segments[0], body));
    }
    if (segments.length === 2 && segments[1] === "move") {
      return NextResponse.json(await service.moveVirtualFile(request, segments[0], body));
    }

    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  } catch (error) {
    return jsonError(error, "Request failed.");
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const segments = (await context.params).path || [];

  try {
    if (segments.length === 2 && segments[0] === "folders") {
      return NextResponse.json(await service.deleteVirtualFolder(segments[1]));
    }
    if (segments.length === 2 && segments[1] === "permanent") {
      return NextResponse.json(await service.purgeVirtualFile(segments[0]));
    }
    if (segments.length === 1) {
      return NextResponse.json(await service.deleteVirtualFile(segments[0]));
    }

    return NextResponse.json({ success: false, message: "Not found." }, { status: 404 });
  } catch (error) {
    return jsonError(error, "Request failed.");
  }
}
