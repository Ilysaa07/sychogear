const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@sychogear.com";
const SENDER_NAME = "SychoGear";

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
  }) {
    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    });

    const htmlContent = `
      <h2>Halo ${data.customerName},</h2>
      <p>Terima kasih telah berbelanja di SychoGear.</p>
      <p>Pesanan Anda dengan nomor <strong>${data.invoiceNumber}</strong> telah berhasil dibuat.</p>
      <p>Silakan lakukan pembayaran sebesar <strong>${formatter.format(data.totalAmount)}</strong> sebelum <strong>${data.expiredAt.toLocaleString("id-ID")}</strong>.</p>
      <br />
      <p>Detail pembayaran:</p>
      <ul>
        <li>Bank: BCA</li>
        <li>No Rekening: 883190138549</li>
        <li>Atas Nama: PT SYCHOGEAR INDONESIA</li>
      </ul>
      <p>Harap konfirmasi pembayaran jika Anda sudah mentransfer.</p>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `Invoice Pembayaran - ${data.invoiceNumber}`,
      htmlContent,
    });
  },

  async sendConfirmationEmail(data: {
    to: string;
    customerName: string;
    invoiceNumber: string;
  }) {
    const htmlContent = `
      <h2>Halo ${data.customerName},</h2>
      <p>Pembayaran untuk pesanan <strong>${data.invoiceNumber}</strong> telah kami terima.</p>
      <p>Kami akan segera memproses pesanan Anda. Terima kasih telah berbelanja!</p>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `Pembayaran Diterima - ${data.invoiceNumber}`,
      htmlContent,
    });
  },

  async sendExpiredEmail(data: {
    to: string;
    customerName: string;
    invoiceNumber: string;
  }) {
    const htmlContent = `
      <h2>Halo ${data.customerName},</h2>
      <p>Batas waktu pembayaran untuk pesanan <strong>${data.invoiceNumber}</strong> telah habis.</p>
      <p>Pesanan Anda telah dibatalkan secara otomatis. Silakan buat pesanan baru jika Anda masih berminat.</p>
    `;

    return this.sendEmail({
      to: data.to,
      subject: `Pesanan Dibatalkan - ${data.invoiceNumber}`,
      htmlContent,
    });
  },

  async sendAdminNotification(data: {
    invoiceNumber: string;
    customerName: string;
    customerEmail: string;
    totalAmount: number;
    items: Array<{ name: string; quantity: number; size: string; price: number }>;
  }) {
    const formatter = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    });

    const itemsHtml = data.items
      .map(
        (item) =>
          `<li>${item.name} (${item.size}) x ${item.quantity} - ${formatter.format(
            item.price * item.quantity
          )}</li>`
      )
      .join("");

    const htmlContent = `
      <h2>Pesanan Baru Masuk!</h2>
      <p>Halo Admin, terdapat pesanan baru dengan nomor invoice: <strong>${data.invoiceNumber}</strong></p>
      <p><strong>Detail Pelanggan:</strong></p>
      <ul>
        <li>Nama: ${data.customerName}</li>
        <li>Email: ${data.customerEmail}</li>
      </ul>
      <p><strong>Detail Pesanan:</strong></p>
      <ul>
        ${itemsHtml}
      </ul>
      <p><strong>Total Bayar (Inc. Kode Unik): ${formatter.format(data.totalAmount)}</strong></p>
      <br />
      <p>Silakan cek dashboard admin untuk proses lebih lanjut.</p>
    `;

    return this.sendEmail({
      to: "sychogear@gmail.com",
      subject: `[ADMIN NOTIF] Pesanan Baru - ${data.invoiceNumber}`,
      htmlContent,
    });
  },
};
