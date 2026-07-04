import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const { resetPassword } = require("../../../../server/services/authService");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await resetPassword(body?.email, body?.otp, body?.newPassword);
    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    return NextResponse.json(
      { success: false, message: err.message || "Password reset failed." },
      { status: err.status || 500 }
    );
  }
}
