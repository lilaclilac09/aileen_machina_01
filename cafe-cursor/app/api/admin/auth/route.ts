import { NextRequest, NextResponse } from "next/server";
import {
  verifyCredentials,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
} from "@/lib/auth";

/**
 * POST /api/admin/auth — Login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log(`[ADMIN] Login attempt: ${username}`);

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "请输入用户名和密码" },
        { status: 400 }
      );
    }

    if (!verifyCredentials(username, password)) {
      console.log(`[ADMIN] Login failed: ${username}`);
      return NextResponse.json(
        { success: false, error: "用户名或密码错误" },
        { status: 401 }
      );
    }

    const token = createSessionToken();
    await setSessionCookie(token);

    console.log(`[ADMIN] Login success: ${username}`);

    return NextResponse.json({
      success: true,
      message: "登录成功",
    });
  } catch (error) {
    console.error("[ADMIN] Login error:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
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
      message: "已退出",
    });
  } catch (error) {
    console.error("[ADMIN] Logout error:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 }
    );
  }
}
