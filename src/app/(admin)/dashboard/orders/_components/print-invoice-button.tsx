"use client";

import { FileText } from "lucide-react";

interface PrintInvoiceButtonProps {
  order: any;
  settings: any;
}

export default function PrintInvoiceButton({
  order,
  settings,
}: PrintInvoiceButtonProps) {
  const handlePrintInvoice = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = 900; // Optimal width for A4 preview
    const h = 1000;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    // Open a blank popup window
    const printWindow = window.open(
      "",
      "PrintInvoicePopup",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=${w}, height=${h}, top=${top}, left=${left}`,
    );

    if (printWindow) {
      let shippingAddress: any = {};
      try {
        shippingAddress =
          typeof order.shippingAddress === "string"
            ? JSON.parse(order.shippingAddress)
            : order.shippingAddress || {};
      } catch (err) {}

      const storeName = settings?.storeName || "Nepal E-com";
      const storeAddress = settings?.storeAddress || "Kathmandu, Nepal";
      const storeEmail = settings?.storeEmail || "contact@nepalecom.com";
      const storePhone = settings?.storePhone || "+977 9800000000";

      const invoiceDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Inject professional A4 Invoice HTML
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice - Order #${order.id.slice(-6).toUpperCase()}</title>
            <style>
              @page { size: A4; margin: 15mm; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; line-height: 1.5; font-size: 14px; margin: 0; padding: 20px; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
              .logo-area h1 { margin: 0 0 5px 0; font-size: 28px; font-weight: 900; letter-spacing: -1px; }
              .logo-area p { margin: 0; color: #555; font-size: 13px; }
              .title-area { text-align: right; }
              .title-area h2 { margin: 0 0 5px 0; font-size: 36px; font-weight: 900; color: #ddd; text-transform: uppercase; letter-spacing: 2px; }
              .title-area p { margin: 0; font-weight: bold; font-size: 14px; }
              
              .info-row { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .bill-to h3 { margin: 0 0 10px 0; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
              .bill-to p { margin: 0 0 4px 0; font-weight: 500; }
              .bill-to strong { font-size: 16px; color: #000; }

              .meta-table { border-collapse: collapse; }
              .meta-table th { text-align: left; padding: 4px 16px 4px 0; font-size: 12px; color: #888; text-transform: uppercase; font-weight: normal; }
              .meta-table td { font-weight: bold; font-size: 13px; }

              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              .items-table th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #666; border-bottom: 2px solid #ddd; }
              .items-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 13px; }
              .text-right { text-align: right !important; }
              .text-center { text-align: center !important; }

              .summary-box { width: 300px; margin-left: auto; }
              .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
              .summary-row.total { font-size: 18px; font-weight: 900; border-bottom: none; border-top: 2px solid #000; padding-top: 12px; margin-top: 4px; }
              
              .footer { text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
              .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; border: 1px solid #000; }
              
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="no-print" style="text-align: center; margin-bottom: 20px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Print Invoice Again</button>
            </div>

            <div class="header">
              <div class="logo-area">
                <h1>${storeName}</h1>
                <p>${storeAddress}</p>
                <p>${storeEmail} • ${storePhone}</p>
                ${settings?.storeTaxId ? `<p>VAT/PAN: ${settings.storeTaxId}</p>` : ""}
              </div>
              <div class="title-area">
                <h2>INVOICE</h2>
                <p>#${order.id.slice(-8).toUpperCase()}</p>
              </div>
            </div>

            <div class="info-row">
              <div class="bill-to">
                <h3>Billed / Shipped To</h3>
                <p><strong>${shippingAddress.fullName || order.user?.name || "Customer"}</strong></p>
                <p>${shippingAddress.street || "N/A"} ${shippingAddress.ward ? `, Ward ${shippingAddress.ward}` : ""}</p>
                <p>${shippingAddress.city || "N/A"}, ${shippingAddress.district || "N/A"}</p>
                <p>${shippingAddress.province || "N/A"} ${shippingAddress.postalCode || ""}</p>
                <p>📞 ${shippingAddress.phone || order.phone || "N/A"}</p>
              </div>
              
              <div>
                <table class="meta-table">
                  <tr>
                    <th>Invoice Date</th>
                    <td>${invoiceDate}</td>
                  </tr>
                  <tr>
                    <th>Order Date</th>
                    <td>${orderDate}</td>
                  </tr>
                  <tr>
                    <th>Payment Method</th>
                    <td>${order.paymentMethod}</td>
                  </tr>
                  <tr>
                    <th>Payment Status</th>
                    <td><span class="status-badge">${order.paymentStatus}</span></td>
                  </tr>
                </table>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Item Description</th>
                  <th class="center">Qty</th>
                  <th class="right">Unit Price</th>
                  <th class="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${order.items
                  .map(
                    (item: any) => `
                  <tr>
                    <td>
                      <strong>${item.name || item.product?.name || "Product"}</strong>
                    </td>
                    <td class="center">${item.quantity}</td>
                    <td class="right">Rs. ${Number(item.price).toLocaleString("en-NP")}</td>
                    <td class="right"><strong>Rs. ${(Number(item.price) * item.quantity).toLocaleString("en-NP")}</strong></td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>Rs. ${Number(order.subTotal).toLocaleString("en-NP")}</span>
              </div>
              <div class="summary-row">
                <span>Shipping</span>
                <span>Rs. ${Number(order.shippingCost).toLocaleString("en-NP")}</span>
              </div>
              ${
                Number(order.discount) > 0
                  ? `
              <div class="summary-row">
                <span>Discount</span>
                <span>- Rs. ${Number(order.discount).toLocaleString("en-NP")}</span>
              </div>`
                  : ""
              }
              <div class="summary-row total">
                <span>Total</span>
                <span>Rs. ${Number(order.totalAmount).toLocaleString("en-NP")}</span>
              </div>
            </div>

            <div class="footer">
              <p><strong>Thank you for your business!</strong></p>
              <p>If you have any questions about this invoice, please contact us at ${storeEmail}.</p>
            </div>

            <script>
              window.onload = function() {
                setTimeout(() => { window.print(); }, 500);
              }
            </script>
          </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    }
  };

  return (
    <button
      onClick={handlePrintInvoice}
      className="btn bg-base-100 hover:bg-base-200 border-base-300 shadow-sm rounded-xl gap-2 w-full sm:w-auto"
    >
      <FileText size={18} className="text-primary" />
      Print Invoice
    </button>
  );
}
