"use client";

import { FileText, Printer, MoreVertical } from "lucide-react";

interface OrderPrintActionsProps {
  order: any;
  settings: any;
}

export default function OrderPrintActions({
  order,
  settings,
}: OrderPrintActionsProps) {
  // --- PRINT INVOICE LOGIC ---
  const handlePrintInvoice = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = 900;
    const h = 1000;
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

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

  // --- PRINT SHIPPING SLIP LOGIC ---
  const handlePrintSlip = (e: React.MouseEvent) => {
    e.preventDefault();
    const w = 400; // Optimal width for thermal labels (4 inches)
    const h = 600; // Optimal height for thermal labels (6 inches)
    const left = window.screen.width / 2 - w / 2;
    const top = window.screen.height / 2 - h / 2;

    const printWindow = window.open(
      "",
      "PrintLabelPopup",
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

      const amountToCollect =
        order.paymentMethod === "COD" && order.paymentStatus !== "PAID"
          ? Number(order.totalAmount)
          : 0;

      const storeName = settings?.storeName || "Nepal E-com";
      const storePhone = settings?.storePhone || "Contact Support";

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Label - Order #${order.id.slice(-6).toUpperCase()}</title>
            <style>
              @page { size: 4in 6in; margin: 0; }
              body { font-family: Arial, sans-serif; padding: 16px; margin: 0; color: #000; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
              .header h1 { font-size: 24px; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
              .header p { font-size: 12px; font-weight: bold; margin: 4px 0 0 0; }
              .cod-box { border: 4px solid #000; padding: 8px; margin-bottom: 12px; text-align: center; border-radius: 6px; }
              .cod-box p { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px 0; }
              .cod-box h2 { font-size: 32px; font-weight: 900; margin: 0; }
              .customer { margin-bottom: 16px; }
              .customer .label { font-size: 10px; font-weight: bold; text-transform: uppercase; border-bottom: 2px solid #000; display: inline-block; margin-bottom: 4px; }
              .customer h3 { font-size: 24px; font-weight: 900; text-transform: uppercase; margin: 4px 0; }
              .customer p { margin: 4px 0; font-size: 14px; font-weight: bold; line-height: 1.2; }
              .info-grid { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 8px 0; margin-bottom: 12px; display: flex; font-size: 12px; justify-content: space-between; }
              .info-col p { margin: 2px 0; }
              .info-label { font-weight: bold; opacity: 0.7; }
              .items { font-size: 12px; font-weight: bold; }
              .items .label { font-size: 10px; font-weight: 900; text-transform: uppercase; margin-bottom: 4px; }
              .item-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding-bottom: 4px; margin-bottom: 4px; }
              .footer { margin-top: 16px; padding-top: 8px; text-align: center; font-size: 10px; font-weight: bold; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${storeName}</h1>
              <p>${storePhone}</p>
            </div>
            <div class="cod-box">
              <p>Cash to Collect</p>
              <h2>${amountToCollect > 0 ? `Rs. ${amountToCollect.toLocaleString()}` : "PRE-PAID"}</h2>
            </div>
            <div class="customer">
              <span class="label">Deliver To:</span>
              <h3>${shippingAddress.fullName || order.user?.name || "Customer"}</h3>
              <p>📞 ${shippingAddress.phone || order.phone || "N/A"}</p>
              <p>${shippingAddress.street || "N/A"} ${shippingAddress.ward ? `, Ward ${shippingAddress.ward}` : ""}<br/>
              ${shippingAddress.city || "N/A"}, ${shippingAddress.district || "N/A"}<br/>
              ${shippingAddress.province || "N/A"} ${shippingAddress.postalCode ? `- ${shippingAddress.postalCode}` : ""}</p>
            </div>
            <div class="info-grid">
              <div class="info-col">
                <p class="info-label">Order ID:</p>
                <p style="font-family: monospace; font-weight: bold;">#${order.id.slice(-8).toUpperCase()}</p>
              </div>
              <div class="info-col" style="text-align: right;">
                <p class="info-label">Delivery Partner:</p>
                <p style="font-weight: bold;">${order.courier || order.rider?.name || "Store Courier"}</p>
              </div>
            </div>
            ${
              order.trackingCode
                ? `
            <div style="border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; font-size: 12px;">
              <p class="info-label" style="margin:0 0 2px 0;">Tracking / Consignment ID:</p>
              <p style="font-family: monospace; font-size: 16px; font-weight: 900; margin:0; letter-spacing: 2px;">${order.trackingCode}</p>
            </div>`
                : ""
            }
            <div class="items">
              <div class="label">Package Contents (${order.items?.length || 0})</div>
              ${
                order.items
                  ?.map(
                    (item: any) => `
                <div class="item-row">
                  <span style="padding-right: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name || item.product?.name || "Item"}</span>
                  <span style="flex-shrink: 0;">x${item.quantity}</span>
                </div>
              `,
                  )
                  .join("") || ""
              }
            </div>
            <div class="footer">
              <p>Date: ${new Date().toLocaleDateString()}</p>
              <p style="margin-top:4px;">Thank you for shopping with us!</p>
            </div>
            <div class="no-print" style="margin-top: 20px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #000; color: #fff; border: none; border-radius: 20px; font-weight: bold; cursor: pointer;">Print Label Again</button>
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
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-sm btn-square text-base-content/50 hover:bg-base-200 hover:text-base-content"
        title="Print Actions"
      >
        <Printer size={16} />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-50 menu p-2 shadow-xl bg-base-100 rounded-box w-44 border border-base-200"
      >
        <li>
          <button onClick={handlePrintInvoice} className="gap-3 font-medium">
            <FileText size={16} className="opacity-60" /> Print Invoice
          </button>
        </li>
        <li>
          <button onClick={handlePrintSlip} className="gap-3 font-medium">
            <Printer size={16} className="opacity-60" /> Shipping Slip
          </button>
        </li>
      </ul>
    </div>
  );
}
