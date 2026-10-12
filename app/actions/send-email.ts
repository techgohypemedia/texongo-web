"use server";

import nodemailer from "nodemailer";

export async function sendContactEmail(formData: FormData) {
  // 1. Honeypot check: Bots auto-fill hidden decoy inputs
  const honeypotCompany = (formData.get("hp_company") as string) || "";
  const honeypotWebsite = (formData.get("website") as string) || "";
  if (honeypotCompany.trim() !== "" || honeypotWebsite.trim() !== "") {
    console.warn("[ANTI-SPAM] Bot caught by honeypot trap. Silently dropped.");
    // Return success so the bot script believes it worked and does not adapt
    return { success: true };
  }

  // 2. Velocity check: Humans take at least 2 seconds to complete the form
  const formTimestamp = formData.get("_ts");
  if (formTimestamp) {
    const elapsedMs = Date.now() - Number(formTimestamp);
    if (!isNaN(elapsedMs) && elapsedMs > 0 && elapsedMs < 2000) {
      console.warn(`[ANTI-SPAM] Bot caught by submission velocity (${elapsedMs}ms). Silently dropped.`);
      return { success: true };
    }
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return { error: "Name, email, and message are required." };
  }

  // Basic email structure validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.zoho.in",
      port: Number(process.env.SMTP_PORT || 465),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Texongo Contact" <${process.env.SMTP_USER}>`,
      to: "connect@texongo.com",
      subject: `New Contact Form Submission from ${name}`,
      replyTo: email,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333; border-bottom: 2px solid #57AD43; padding-bottom: 10px;">New Inquiry</h2>
          <div style="margin-top: 20px;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "N/A"}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #57AD43;">
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          <p style="margin-top: 30px; font-size: 12px; color: #999;">This email was sent from the Texongo website contact form.</p>
        </div>
      `,
    });

    return { success: true, id: info.messageId };
  } catch (err: any) {
    console.error("Server Action Error (Nodemailer):", err);
    return { error: err.message || "Something went wrong. Please try again later." };
  }
}
