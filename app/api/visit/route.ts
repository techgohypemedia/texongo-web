import { NextResponse } from "next/server";
import { sendAlert } from "@/lib/alerts";

// One alert per new browser session (see components/visit-tracker.tsx).
// Off unless VISIT_ALERTS=true. Visit alerts go to Telegram only, never email, to avoid inbox flooding.

const BOT_PATTERN = /bot|crawler|spider|crawling|preview|headless|lighthouse|facebookexternalhit|whatsapp/i;

export async function POST(request: Request) {
  if (process.env.VISIT_ALERTS !== "true") {
    return NextResponse.json({ ok: true });
  }

  const userAgent = request.headers.get("user-agent") || "";
  if (BOT_PATTERN.test(userAgent)) {
    return NextResponse.json({ ok: true });
  }

  const { path, referrer } = await request.json().catch(() => ({}));
  const city = request.headers.get("x-vercel-ip-city");
  const region = request.headers.get("x-vercel-ip-country-region");
  const device = /mobile|android|iphone/i.test(userAgent) ? "Mobile" : "Desktop";

  await sendAlert({
    subject: "👀 New website visitor",
    lines: [
      `Page: ${String(path || "/").slice(0, 200)}`,
      city && `Location: ${decodeURIComponent(city)}${region ? `, ${region}` : ""}`,
      `Device: ${device}`,
      referrer && `Came from: ${String(referrer).slice(0, 200)}`,
    ].filter(Boolean) as string[],
    email: false,
  });

  return NextResponse.json({ ok: true });
}
