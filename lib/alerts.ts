import nodemailer from "nodemailer";

// Instant phone/email alerts for the Texongo team.
// Telegram is used when TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set (instant push on phone).
// Email is used when SMTP_USER/SMTP_PASS are set, sent to ALERT_EMAIL (defaults to connect@texongo.com).

type Alert = {
  subject: string;
  lines: string[];
  email?: boolean;
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function sendTelegram(alert: Alert) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatIds = (process.env.TELEGRAM_CHAT_ID || "").split(",").map(id => id.trim()).filter(Boolean);
  if (!token || chatIds.length === 0) return;

  const text = `<b>${escapeHtml(alert.subject)}</b>\n${alert.lines.map(escapeHtml).join("\n")}`;

  await Promise.all(
    chatIds.map(chatId =>
      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
      }).catch(err => console.error("Telegram alert failed:", err))
    )
  );
}

async function sendEmail(alert: Alert) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.in",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter
    .sendMail({
      from: `"Texongo Alerts" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL || "connect@texongo.com",
      subject: alert.subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; border-bottom: 2px solid #57AD43; padding-bottom: 10px;">${escapeHtml(alert.subject)}</h2>
          ${alert.lines.map(line => `<p>${escapeHtml(line)}</p>`).join("")}
        </div>
      `,
    })
    .catch(err => console.error("Email alert failed:", err));
}

export async function sendAlert(alert: Alert) {
  await Promise.all([sendTelegram(alert), alert.email === false ? null : sendEmail(alert)]);
}
