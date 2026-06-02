import Link from "next/link";
import { HiXCircle } from "react-icons/hi";

interface Props {
  searchParams: Promise<{ external_id?: string }>;
}

export default async function PaymentFailedPage({ searchParams }: Props) {
  const params = await searchParams;
  const invoiceNumber = params.external_id;

  return (
    <div className="container-main py-20 text-center">
      <div className="max-w-md mx-auto fade-in">
        <HiXCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Payment Failed</h1>
        <p className="text-brand-400 text-sm mb-2 leading-relaxed">
          Pembayaran gagal atau telah dibatalkan. Pesanan Anda belum diproses.
        </p>
        {invoiceNumber && (
          <p className="font-mono text-xs text-white/50 mb-6 bg-white/5 px-3 py-2 rounded inline-block">
            {invoiceNumber}
          </p>
        )}
        <p className="text-brand-400 text-xs mb-8">
          Silakan coba lagi atau hubungi customer service kami via WhatsApp untuk bantuan.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {invoiceNumber && (
            <Link href={`/order-success/${invoiceNumber}`} className="btn-primary">
              Coba Bayar Lagi
            </Link>
          )}
          <a
            href={`https://wa.me/6283190138549?text=${encodeURIComponent(`Halo SychoGear, pembayaran saya gagal untuk invoice ${invoiceNumber || ""}. Mohon bantuannya.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            Hubungi CS via WhatsApp
          </a>
          <Link href="/products" className="btn-ghost">
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
