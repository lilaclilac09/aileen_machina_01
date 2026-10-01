export async function POST(req: Request) {
  const url = process.env.EVOLVEMENT_URL;
  if (!url) {
    return Response.json({ error: "EVOLVEMENT_URL is unset" }, { status: 503 });
  }
  const body = await req.json();
  const r = await fetch(`${url.replace(/\/$/, "")}/v1/turn`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return new Response(await r.text(), {
    status: r.status,
    headers: { "content-type": "application/json" },
  });
}
