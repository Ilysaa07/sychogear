import Link from "next/link";
import { HiXCircle } from "react-icons/hi";

export default function PaymentFailedPage() {
  return (
    <div className="container-main py-20 text-center">
      <div className="max-w-md mx-auto fade-in">
        <HiXCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Payment Failed</h1>
        <p className="text-brand-400 text-sm mb-8 leading-relaxed">
          Pembayaran gagal atau telah dibatalkan. Silakan coba lagi atau hubungi
          customer service kami untuk bantuan.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/order-status" className="btn-primary">
            Check Order Status
          </Link>
          <Link href="/products" className="btn-secondary">
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
