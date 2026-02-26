import nodemailer from "nodemailer";
import { prisma } from "@/lib/db/prisma";

// -----------------------------------------------------
// 1. CORE ROUTER: GET ACTIVE MAILER
// -----------------------------------------------------
async function sendEmail(to: string, subject: string, html: string) {
    try {
        const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });

        if (!settings) {
            console.warn("⚠️ No system settings found for email configuration.");
            return false;
        }

        const fromAddress = `${settings.storeName || "Store"} <${settings.storeEmailFrom || "noreply@store.com"}>`;

        // --- STRATEGY A: SMTP (cPanel, Gmail, Outlook, AWS SES SMTP) ---
        if (settings.mailProvider === "SMTP") {
            if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPassword) {
                console.warn("⚠️ SMTP credentials missing. Email aborted.");
                return false;
            }

            const transporter = nodemailer.createTransport({
                host: settings.smtpHost,
                port: settings.smtpPort || 465,
                secure: settings.smtpPort === 465, // true for 465, false for other ports
                auth: {
                    user: settings.smtpUser,
                    pass: settings.smtpPassword,
                },
            });

            await transporter.sendMail({
                from: fromAddress,
                to,
                subject,
                html,
            });

            return true;
        }

        // --- STRATEGY B: RESEND (Future Expansion) ---
        else if (settings.mailProvider === "RESEND") {
            if (!settings.resendApiKey) {
                console.warn("⚠️ Resend API Key missing. Email aborted.");
                return false;
            }

            // If you ever install 'resend', the logic goes here.
            // const resend = new Resend(settings.resendApiKey);
            // await resend.emails.send({ from: fromAddress, to, subject, html });
            console.log("Resend implementation ready to be activated.");
            return true;
        }

        return false;
    } catch (error) {
        console.error("Critical Mail Routing Error:", error);
        return false;
    }
}

// -----------------------------------------------------
// 2. WOOCOMMERCE-STYLE HTML TEMPLATES
// -----------------------------------------------------

export async function sendWelcomeEmail(toEmail: string, name: string) {
    const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    const storeName = settings?.storeName || "Our Store";
    const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const html = `
    <div style="background-color: #f4f4f5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #374151; line-height: 1.6;">
      <table width="100%" max-width="600" align="center" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-collapse: collapse;">
        <tr>
          <td style="background-color: #111827; padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">Welcome to ${storeName}!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="margin-top: 0; font-size: 16px;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 16px;">Thanks for creating an account on ${storeName}. Your account lets you keep track of your orders, save your favorite items, and enjoy a faster checkout process.</p>
            
            <table width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <a href="${storeUrl}/products" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Start Shopping Now</a>
                </td>
              </tr>
            </table>

            <p style="font-size: 16px; margin-bottom: 0;">We look forward to seeing you soon.</p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">© ${new Date().getFullYear()} ${storeName}. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

    await sendEmail(toEmail, `Welcome to ${storeName}!`, html);
}

export async function sendPasswordResetEmail(toEmail: string, resetToken: string) {
    const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    const storeName = settings?.storeName || "Our Store";
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/new-password?token=${resetToken}`;

    const html = `
    <div style="background-color: #f4f4f5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #374151; line-height: 1.6;">
      <table width="100%" max-width="600" align="center" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-collapse: collapse;">
        <tr>
          <td style="background-color: #111827; padding: 30px; text-align: center;">
             <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Password Reset Request</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="margin-top: 0; font-size: 16px;">Someone has requested a new password for your ${storeName} account.</p>
            <p style="font-size: 16px;">If you didn't make this request, just ignore this email. If you'd like to proceed, click the button below to reset your password:</p>
            
            <table width="100%" style="margin: 30px 0;">
              <tr>
                <td align="center">
                  <a href="${resetLink}" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Click here to reset your password</a>
                </td>
              </tr>
            </table>

            <p style="font-size: 14px; color: #6b7280; margin-bottom: 0; text-align: center;">This link will expire in 1 hour.</p>
          </td>
        </tr>
        <tr>
          <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">© ${new Date().getFullYear()} ${storeName}.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

    await sendEmail(toEmail, "Reset your password", html);
}

export async function sendOrderConfirmationEmail(toEmail: string, orderDetails: any) {
    const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    const storeName = settings?.storeName || "Our Store";
    const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { id, subTotal, shippingCost, discount, totalAmount, items, shippingAddress } = orderDetails;
    const orderUrl = `${storeUrl}/orders/${id}`;

    // Format items into robust HTML table rows (WooCommerce style)
    const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">
        <strong>${item.name}</strong>
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px; text-align: right;">
        Rs. ${(Number(item.price) * item.quantity).toLocaleString('en-NP')}
      </td>
    </tr>
  `).join('');

    const html = `
    <div style="background-color: #f4f4f5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #374151; line-height: 1.6;">
      <table width="100%" max-width="600" align="center" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-collapse: collapse;">
        
        <!-- Header -->
        <tr>
          <td style="background-color: #10b981; padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Thank you for your order</h1>
          </td>
        </tr>

        <!-- Intro -->
        <tr>
          <td style="padding: 30px 30px 10px 30px;">
            <p style="margin-top: 0; font-size: 16px;">Hi <strong>${shippingAddress.fullName}</strong>,</p>
            <p style="font-size: 16px;">Just to let you know — we've received your order <strong>#${id.slice(-6).toUpperCase()}</strong>, and it is now being processed.</p>
            
            <table width="100%" style="margin: 20px 0;">
              <tr>
                <td align="center">
                  <a href="${orderUrl}" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 15px;">View Your Order Online</a>
                </td>
              </tr>
            </table>

            <h2 style="font-size: 18px; color: #111827; margin-top: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">[Order #${id.slice(-6).toUpperCase()}] (${new Date().toLocaleDateString()})</h2>
          </td>
        </tr>

        <!-- Order Items Table -->
        <tr>
          <td style="padding: 0 30px;">
            <table width="100%" style="border-collapse: collapse; text-align: left;">
              <thead>
                <tr>
                  <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase;">Product</th>
                  <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; text-align: center;">Quantity</th>
                  <th style="padding: 10px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="2" style="padding: 12px 10px; text-align: right; color: #6b7280; font-size: 14px; font-weight: normal;">Subtotal:</th>
                  <td style="padding: 12px 10px; text-align: right; color: #374151; font-size: 14px;">Rs. ${Number(subTotal).toLocaleString('en-NP')}</td>
                </tr>
                <tr>
                  <th colspan="2" style="padding: 8px 10px; text-align: right; color: #6b7280; font-size: 14px; font-weight: normal;">Shipping:</th>
                  <td style="padding: 8px 10px; text-align: right; color: #374151; font-size: 14px;">Rs. ${Number(shippingCost).toLocaleString('en-NP')}</td>
                </tr>
                ${Number(discount) > 0 ? `
                <tr>
                  <th colspan="2" style="padding: 8px 10px; text-align: right; color: #10b981; font-size: 14px; font-weight: normal;">Discount:</th>
                  <td style="padding: 8px 10px; text-align: right; color: #10b981; font-size: 14px;">- Rs. ${Number(discount).toLocaleString('en-NP')}</td>
                </tr>` : ''}
                <tr>
                  <th colspan="2" style="padding: 16px 10px; text-align: right; color: #111827; font-size: 16px; font-weight: bold; border-top: 2px solid #e5e7eb;">Total:</th>
                  <td style="padding: 16px 10px; text-align: right; color: #111827; font-size: 16px; font-weight: bold; border-top: 2px solid #e5e7eb;">Rs. ${Number(totalAmount).toLocaleString('en-NP')}</td>
                </tr>
              </tfoot>
            </table>
          </td>
        </tr>

        <!-- Addresses -->
        <tr>
          <td style="padding: 30px;">
            <table width="100%" style="border-collapse: collapse;">
              <tr>
                <td valign="top" style="width: 50%; padding-right: 10px;">
                  <h3 style="font-size: 16px; color: #111827; margin-top: 0;">Billing & Shipping Address</h3>
                  <div style="border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; background-color: #f9fafb;">
                    <p style="margin: 0 0 5px 0; font-size: 14px; color: #374151;"><strong>${shippingAddress.fullName}</strong></p>
                    <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">${shippingAddress.street}${shippingAddress.ward ? `, Ward ${shippingAddress.ward}` : ''}</p>
                    <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">${shippingAddress.city}, ${shippingAddress.district}</p>
                    <p style="margin: 0 0 5px 0; font-size: 14px; color: #6b7280;">${shippingAddress.province}${shippingAddress.postalCode ? ` - ${shippingAddress.postalCode}` : ''}</p>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #374151;">📞 ${shippingAddress.phone}</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">Thanks for shopping with us.</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">© ${new Date().getFullYear()} ${storeName}.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

    await sendEmail(toEmail, `Your ${storeName} order receipt from ${new Date().toLocaleDateString()}`, html);
}

// -----------------------------------------------------
// 4. ORDER STATUS UPDATE EMAIL (NEW!)
// -----------------------------------------------------
export async function sendOrderStatusEmail(toEmail: string, orderDetails: { id: string, status: string, trackingCode?: string | null, courier?: string | null, customerName: string }) {
    const settings = await prisma.systemSetting.findUnique({ where: { id: "default" } });
    const storeName = settings?.storeName || "Our Store";
    const storeUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { id, status, trackingCode, courier, customerName } = orderDetails;
    const orderUrl = `${storeUrl}/orders/${id}`;

    let headerColor = "#2563eb"; // Blue for general
    let statusHeadline = "Order Update";
    let statusMessage = `Your order status has been updated to: <strong>${status}</strong>.`;

    if (status === "PROCESSING") {
        headerColor = "#f59e0b"; // Warning/Yellow
        statusHeadline = "We're working on your order!";
        statusMessage = "We've started preparing your items for shipment. We will notify you again once it has been dispatched.";
    } else if (status === "SHIPPED") {
        headerColor = "#3b82f6"; // Primary Blue
        statusHeadline = "Great news! Your order has shipped.";
        statusMessage = "Your package has been handed over to our delivery partner and is on its way to you!";
    } else if (status === "DELIVERED") {
        headerColor = "#10b981"; // Success Green
        statusHeadline = "Your order has been delivered!";
        statusMessage = "Your package has been successfully delivered. We hope you love your items!";
    } else if (status === "CANCELLED") {
        headerColor = "#ef4444"; // Danger Red
        statusHeadline = "Order Cancelled";
        statusMessage = "Your order has been cancelled. If you believe this was a mistake, please contact our support team.";
    }

    const html = `
    <div style="background-color: #f4f4f5; padding: 40px 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #374151; line-height: 1.6;">
      <table width="100%" max-width="600" align="center" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-collapse: collapse;">
        <tr>
          <td style="background-color: ${headerColor}; padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">${statusHeadline}</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">Order #${id.slice(-6).toUpperCase()}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="margin-top: 0; font-size: 16px;">Hi <strong>${customerName}</strong>,</p>
            <p style="font-size: 16px;">${statusMessage}</p>
            
            ${trackingCode ? `
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Tracking Information</p>
              <p style="margin: 0; font-size: 16px;">Delivery Partner: <strong>${courier || "Standard Courier"}</strong></p>
              <div style="margin-top: 15px; padding: 10px; background-color: #ffffff; border: 1px dashed #d1d5db; border-radius: 6px; display: inline-block;">
                <code style="font-size: 18px; color: #111827; font-weight: bold;">${trackingCode}</code>
              </div>
            </div>
            ` : ''}

            <table width="100%" style="margin: 30px 0 10px 0;">
              <tr>
                <td align="center">
                  <a href="${orderUrl}" style="background-color: #111827; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Track Order Online</a>
                </td>
              </tr>
            </table>

          </td>
        </tr>
        <tr>
          <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; color: #6b7280;">Thanks for shopping with us.</p>
            <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">© ${new Date().getFullYear()} ${storeName}.</p>
          </td>
        </tr>
      </table>
    </div>
  `;

    await sendEmail(toEmail, `Update on your ${storeName} order #${id.slice(-6).toUpperCase()}`, html);
}