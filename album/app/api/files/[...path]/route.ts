import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

type Ctx = { params: { path: string[] } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const key = params.path.join("/");
  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const abs = path.join(process.cwd(), "data", "uploads", key);
  try {
    const data = await readFile(abs);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
