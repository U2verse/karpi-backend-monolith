import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

export async function generateInvoicePDF({
  invoiceNumber,
  clientId,
  academyName,
  planName,
  amount,
}) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `invoice_${invoiceNumber}.pdf`;
      const filePath = path.join(process.cwd(), "invoices", fileName);

      // Ensure invoices folder exists
      fs.mkdirSync(path.join(process.cwd(), "invoices"), { recursive: true });

      const pdf = new PDFDocument();
      pdf.pipe(fs.createWriteStream(filePath));

      // Header
      pdf.fontSize(20).text("Karpi LMS Invoice", { align: "center" });
      pdf.moveDown();

      pdf.fontSize(12).text(`Invoice Number: ${invoiceNumber}`);
      pdf.text(`Client ID: ${clientId}`);
      pdf.text(`Academy: ${academyName}`);
      pdf.text(`Plan: ${planName}`);
      pdf.text(`Amount: ₹${amount}`);
      pdf.text(`Date: ${new Date().toLocaleDateString("en-IN")}`);

      pdf.end();

      pdf.on("finish", () => resolve(filePath));
    } catch (err) {
      reject(err);
    }
  });
}
