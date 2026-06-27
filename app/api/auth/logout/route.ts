import { NextResponse } from "next/server";

export const runtime = "nodejs";

const { AUTH_COOKIE } = require("../../../../server/services/authService");

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
