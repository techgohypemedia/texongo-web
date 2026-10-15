import crypto from "crypto";
import { NextResponse } from "next/server";
import { sendAlert } from "@/lib/alerts";

// Receives Shopify webhooks (Settings → Notifications → Webhooks) and forwards
// new-order / payment-received alerts to the team's phone and email.
// Subscribe these events to https://<site>/api/webhooks/shopify :
//   - Order creation        (orders/create)
//   - Order payment         (orders/paid)

function isValidSignature(rawBody: string, hmacHeader: string | null) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret || !hmacHeader) return false;

  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const expected = Buffer.from(digest);
  const received = Buffer.from(hmacHeader);
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function money(order: any) {
  const amount = order.current_total_price ?? order.total_price;
  return `${order.currency === "INR" ? "₹" : `${order.currency} `}${amount}`;
}

function orderLines(order: any) {
  const customer = [order.customer?.first_name, order.customer?.last_name].filter(Boolean).join(" ");
  const address = order.shipping_address;
  const items = (order.line_items || []).map((item: any) => `• ${item.title}${item.variant_title ? ` (${item.variant_title})` : ""} × ${item.quantity}`);

  return [
    `Order: ${order.name}`,
    `Amount: ${money(order)}`,
    `Payment status: ${order.financial_status}`,
    customer && `Customer: ${customer}`,
    (order.phone || address?.phone) && `Phone: ${order.phone || address.phone}`,
    address && `Ship to: ${[address.city, address.province, address.zip].filter(Boolean).join(", ")}`,
    ...items,
  ].filter(Boolean) as string[];
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get("x-shopify-hmac-sha256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic");
  const order = JSON.parse(rawBody);

  if (topic === "orders/create") {
    await sendAlert({ subject: `🛒 New order ${order.name} — ${money(order)}`, lines: orderLines(order) });
  } else if (topic === "orders/paid") {
    await sendAlert({ subject: `✅ Payment received ${order.name} — ${money(order)}`, lines: orderLines(order) });
  }

  return NextResponse.json({ ok: true });
}
