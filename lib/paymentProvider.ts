export interface PaymentProvider {
  createPayment(data: any): Promise<any>;
  verifyPayment(externalId: string): Promise<any>;
  cancelPayment(externalId: string): Promise<any>;
}

export class ManualTransferProvider implements PaymentProvider {
  async createPayment(data: {
    invoiceNumber: string;
    amount: number;
    customerEmail: string;
    customerName: string;
  }): Promise<any> {
    // Untuk transfer manual, kita tidak perlu memanggil API pihak ke-3 untuk membuat payment link.
    // Cukup mengembalikan data yang diperlukan atau mensimulasikan respons pembuatan invoice.
    return {
      success: true,
      externalId: data.invoiceNumber,
      amount: data.amount,
      status: "UNPAID",
      paymentMethod: "MANUAL_TRANSFER",
    };
  }

  async verifyPayment(externalId: string): Promise<any> {
    // Pada transfer manual, verifikasi dilakukan oleh admin
    throw new Error("Verifikasi untuk manual transfer dilakukan melalui dashboard admin.");
  }

  async cancelPayment(externalId: string): Promise<any> {
    return {
      success: true,
      externalId,
      status: "CANCELLED",
    };
  }
}
