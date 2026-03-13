import * as nodemailer from "nodemailer";
import * as fs from "fs";

// -----------------------------------------------------
// 1️⃣ Your ORIGINAL EMAIL TRANSPORTER (unchanged)
// -----------------------------------------------------
let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: "SSLv3",
        minVersion: "TLSv1",
      },
    });

    console.log("📨 SMTP transporter initialized");
  }

  return transporter;
}

// -----------------------------------------------------
// 2️⃣ NEW FUNCTION — Invoice Email Sender
// (USE YOUR EXISTING TRANSPORTER)
// -----------------------------------------------------
export async function sendInvoiceEmail({
  to,
  name,
  html,
  pdfPath,
}: {
  to: string;
  name: string;
  html: string;
  pdfPath: string;
}) {
  return transporter!.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: "Your Karpi LMS Invoice",
    html,
    attachments: [
      {
        filename: "invoice.pdf",
        path: pdfPath, // absolute path created during PDF generation
      },
    ],
  });
}
