import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

/**
 * Generates invoice PDF and returns the absolute file path.
 */
export async function generateInvoicePDF({
  invoiceNumber,
  clientId,
  academyName,
  planName,
  amount,
}: {
  invoiceNumber: string;
  clientId: number;
  academyName: string;
  planName: string;
  amount: number;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // 1️⃣ Make invoices folder if missing
      const invoicesDir = path.resolve(process.cwd(), "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir);
      }

      // 2️⃣ File path
      const filename = `invoice-${invoiceNumber}.pdf`;
      const filePath = path.join(invoicesDir, filename);

      // 3️⃣ Create PDF
      const doc = new PDFDocument();

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- Header ---
      doc.fontSize(22).text("Karpi LMS Invoice", { align: "center" });
      doc.moveDown();

      // --- Details ---
      doc.fontSize(14).text(`Invoice Number: ${invoiceNumber}`);
      doc.text(`Client ID: ${clientId}`);
      doc.text(`Academy: ${academyName}`);
      doc.text(`Plan: ${planName}`);
      doc.text(`Amount: ₹${amount}`);
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`);

      doc.moveDown();
      doc.fontSize(12).text("Thank you for choosing Karpi LMS!");

      doc.end();

      stream.on("finish", () => resolve(filePath));
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}
