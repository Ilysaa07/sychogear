const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@sychogear.com";
const SENDER_NAME = "SychoGear";
const WHATSAPP_NUMBER = "6283190138549";

interface EmailParams {
  to: string;
  subject: string;
  htmlContent: string;
}

export const emailService = {
  async sendEmail({ to, subject, htmlContent }: EmailParams) {
    if (!BREVO_API_KEY) {
      console.warn("BREVO_API_KEY is not set. Skipping email send.");
      return false;
    }

    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: SENDER_NAME, email: SENDER_EMAIL },
          to: [{ email: to }],
          subject: subject,
          htmlContent: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Brevo API Error:", errorData);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Failed to send email via Brevo:", error);
      return false;
    }
  },

  async sendInvoiceEmail(data: {
    to: string;
    customerName: string;
    invoiceNumber: string;
    totalAmount: number;
    expiredAt: Date;
    isInternational?: boolean;
    amountUSD?: number;
    country?: string;
    paymentUrl?: string;  // Xendit hosted payment URL
  }) {
    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    });

    const usdFormatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });

    const waMessage = encodeURIComponent(
      `Hello SychoGear, I would like to confirm my order payment for invoice ${data.invoiceNumber}.`
    );
    const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

    let htmlContent: string;

    if (data.isInternational) {
      // International order — English, WhatsApp confirmation
      const amountDisplay = data.amountUSD
        ? `${usdFormatter.format(data.amountUSD)} (≈ ${formatter.format(data.totalAmount)} IDR)`
        : formatter.format(data.totalAmount);

      htmlContent = `
        <h2>Hello ${data.customerName},</h2>
        <p>Thank you for shopping at SychoGear!</p>
        <p>Your order <strong>${data.invoiceNumber}</strong> has been created successfully.</p>
        <p>Please complete your payment of <strong>${amountDisplay}</strong> before <strong>${data.expiredAt.toLocaleString("en-US")}</strong>.</p>
        <br />
        <p><strong>Payment Gateway:</strong> DOKU</p>
        <p>Please click the button below to complete your payment.</p>
        ${data.paymentUrl ? `<br/><p><a href="${data.paymentUrl}" style="display:inline-block;padding:12px 24px;background-color:#1a1a2e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Pay Now via DOKU →</a></p>` : ""}
        <br />
        <p>If you have any questions, feel free to contact us via WhatsApp or email.</p>
      `;
    } else {
        htmlContent = `
        <h2>Halo ${data.customerName},</h2>
        <p>Terima kasih telah berbelanja di SychoGear.</p>
        <p>Pesanan Anda dengan nomor <strong>${data.invoiceNumber}</strong> telah berhasil dibuat.</p>
        <p>Silakan lakukan pembayaran sebesar <strong>${formatter.format(data.totalAmount)}</strong> sebelum <strong>${data.expiredAt.toLocaleString("id-ID")}</strong>.</p>
        <br />
        <p><strong>Metode Pembayaran:</strong> Otomatis via DOKU Payment Gateway</p>
        <p>Anda dapat membayar melalui Virtual Account, QRIS, E-Wallet, atau Kartu Kredit melalui link pembayaran yang tersedia.</p>
        <br />
        ${data.paymentUrl ? `<p><a href="${data.paymentUrl}" style="display:inline-block;padding:12px 24px;background-color:#E2202C;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Bayar Sekarang via DOKU →</a></p>` : ""}
        <br />
        <p><em>*Pembayaran Anda akan diverifikasi secara otomatis oleh sistem kami. Anda tidak perlu melakukan konfirmasi manual.</em></p>
      `;
    }

    return this.sendEmail({
      to: data.to,
      subject: data.isInternational
        ? `Payment Invoice - ${data.invoiceNumber}`
        : `Invoice Pembayaran - ${data.invoiceNumber}`,
      htmlContent,
    });
  },

  async sendConfirmationEmail(data: {
    to: string;
    customerName: string;
    invoiceNumber: string;
  }) {
    const htmlContent = `
      <h2>Hello ${data.customerName},</h2>
      <p>Payment for order <strong>${data.invoiceNumber}</strong> has been received.</p>
      <p>We will process your order shortly. Thank you for shopping with SychoGear!</p>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `Payment Confirmed - ${data.invoiceNumber}`,
      htmlContent,
    });
  },

  async sendExpiredEmail(data: {
    to: string;
    customerName: string;
    invoiceNumber: string;
  }) {
    const htmlContent = `
      <h2>Hello ${data.customerName},</h2>
      <p>The payment deadline for order <strong>${data.invoiceNumber}</strong> has passed.</p>
      <p>Your order has been automatically cancelled. Please create a new order if you're still interested.</p>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `Order Expired - ${data.invoiceNumber}`,
      htmlContent,
    });
  },

  async sendAdminNotification(data: {
    invoiceNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    country?: string;
    paymentMethod?: string;
    amountUSD?: number;
    items: Array<{ name: string; quantity: number; size: string; price: number }>;
  }) {
    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    });

    const usdFormatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    });

    const itemsHtml = data.items
      .map(
        (item) =>
          `<li>${item.name} (${item.size}) x ${item.quantity} - ${formatter.format(
            item.price * item.quantity
          )}</li>`
      )
      .join("");

    const isIntl = data.country && data.country !== "ID";
    const paymentBadge = `<span style="background:#E2202C;color:white;padding:2px 8px;border-radius:4px;font-size:12px;">${data.paymentMethod || "DOKU_CHECKOUT"}</span>`;

    const countryInfo = isIntl
      ? `<li>Country: ${data.country} (International)</li>`
      : `<li>Country: Indonesia (Domestic)</li>`;

    const amountInfo = data.amountUSD
      ? `<p><strong>Total: ${formatter.format(data.totalAmount)} (≈ ${usdFormatter.format(data.amountUSD)})</strong></p>`
      : `<p><strong>Total Bayar: ${formatter.format(data.totalAmount)}</strong></p>`;

    const htmlContent = `
      <h2>Pesanan Baru Masuk! ${paymentBadge}</h2>
      <p>Halo Admin, terdapat pesanan baru dengan nomor invoice: <strong>${data.invoiceNumber}</strong></p>
      <p><strong>Detail Pelanggan:</strong></p>
      <ul>
        <li>Nama: ${data.customerName}</li>
        <li>Email: ${data.customerEmail}</li>
        ${countryInfo}
      </ul>
      <p><strong>Detail Pesanan:</strong></p>
      <ul>
        ${itemsHtml}
      </ul>
      ${amountInfo}
      <br />
      <p>Silakan cek dashboard admin untuk proses lebih lanjut.</p>
    `;

    return this.sendEmail({
      to: "sychogear@gmail.com",
      subject: `[ADMIN NOTIF] Pesanan Baru - ${data.invoiceNumber} ${isIntl ? `(${data.country})` : ""}`,
      htmlContent,
    });
  },
};
