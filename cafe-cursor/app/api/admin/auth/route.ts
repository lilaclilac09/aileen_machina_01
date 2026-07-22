import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
} from "@/lib/auth";

/** Soft in-memory rate limit (best-effort on serverless). */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

function clientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const row = loginAttempts.get(key);
  if (!row || now > row.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  row.count += 1;
  return row.count > MAX_ATTEMPTS;
}

/**
 * POST /api/admin/auth — Login
 */
export async function POST(request: NextRequest) {
  try {
    const key = clientKey(request);
    if (isRateLimited(key)) {
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    console.log(`[ADMIN] Login attempt from ${key}`);

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (!verifyCredentials(username, password)) {
      console.log(`[ADMIN] Login failed from ${key}`);
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = createSessionToken();
    await setSessionCookie(token);

    console.log(`[ADMIN] Login success from ${key}`);

    return NextResponse.json({
      success: true,
      message: "Logged in",
    });
  } catch (error) {
    console.error("[ADMIN] Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/auth — Check session
 */
export async function GET() {
  try {
    const authenticated = await isAuthenticated();

    return NextResponse.json({
      authenticated,
    });
  } catch (error) {
    console.error("[ADMIN] Session check error:", error);
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth — Logout
 */
export async function DELETE() {
  try {
    await clearSessionCookie();
    console.log(`[ADMIN] Logout`);

    return NextResponse.json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    console.error("[ADMIN] Logout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
