import * as nodemailer from "nodemailer";

// -----------------------------------------------------
// 1️⃣ Your ORIGINAL EMAIL TRANSPORTER (unchanged)
// -----------------------------------------------------
let transporter: nodemailer.Transporter | null = null;

function isFalseLike(value: string | undefined): boolean {
  if (!value) return false;
  return ["0", "false", "no", "off"].includes(value.trim().toLowerCase());
}

export function getEmailTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = port === 465;
    const rejectUnauthorized = !isFalseLike(
      process.env.SMTP_TLS_REJECT_UNAUTHORIZED,
    );

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      requireTLS: !secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        minVersion: "TLSv1.2",
        rejectUnauthorized,
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
  html,
  pdfPath,
}: {
  to: string;
  name: string;
  html: string;
  pdfPath: string;
}) {
  return getEmailTransporter().sendMail({
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
