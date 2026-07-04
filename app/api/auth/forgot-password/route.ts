import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const { requestPasswordReset } = require("../../../../server/services/authService");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await requestPasswordReset(body?.email);
    const response: Record<string, unknown> = {
      success: result.success,
      message: result.message,
    };

    if (process.env.NODE_ENV !== "production" && typeof result.otp === "string") {
      response.debugOtp = result.otp;
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    return NextResponse.json(
      { success: false, message: err.message || "Password reset request failed." },
      { status: err.status || 500 }
    );
  }
}
