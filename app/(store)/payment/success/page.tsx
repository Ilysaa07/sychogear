import Link from "next/link";
import { HiCheckCircle } from "react-icons/hi";
import { orderRepository } from "@/repositories/order.repository";

interface Props {
  searchParams: Promise<{ external_id?: string; invoice_id?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const invoiceNumber = params.external_id;

  // Xendit redirects with ?external_id=INV-xxx — try to auto-confirm
  if (invoiceNumber) {
    // Order confirmation is done via webhook, not here.
    // This page is just a UX landing — webhook handles actual stock deduction.
  }

  return (
    <div className="container-main py-20 text-center">
      <div className="max-w-md mx-auto fade-in">
        <HiCheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-brand-400 text-sm mb-2 leading-relaxed">
          Terima kasih atas pesanan Anda. Konfirmasi pesanan telah dikirim ke email Anda.
        </p>
        {invoiceNumber && (
          <p className="font-mono text-xs text-white/50 mb-6 bg-white/5 px-3 py-2 rounded inline-block">
            {invoiceNumber}
          </p>
        )}
        <p className="text-brand-400 text-xs mb-8">
          Pesanan akan segera diproses setelah pembayaran dikonfirmasi oleh sistem.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {invoiceNumber && (
            <Link href={`/order-success/${invoiceNumber}`} className="btn-primary">
              Lihat Detail Pesanan
            </Link>
          )}
          <Link href="/order-status" className="btn-secondary">
            Track Order
          </Link>
          <Link href="/products" className="btn-ghost">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
