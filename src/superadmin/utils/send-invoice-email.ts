import { getEmailTransporter } from "../enrollments/email";
import * as fs from "fs";

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
  const transporter = getEmailTransporter();
  return transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject: "Your Karpi LMS Invoice",
    html,
    attachments: [
      {
        filename: "invoice.pdf",
        path: pdfPath,
      },
    ],
  });
}
