import Link from "next/link";
import { HiCheckCircle } from "react-icons/hi";

export default function PaymentSuccessPage() {
  return (
    <div className="container-main py-20 text-center">
      <div className="max-w-md mx-auto fade-in">
        <HiCheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-brand-400 text-sm mb-8 leading-relaxed">
          Terima kasih atas pesanan Anda. Konfirmasi pesanan telah dikirim ke email Anda.
          Anda dapat melacak status pesanan di halaman Track Order.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/order-status" className="btn-primary">
            Track Order
          </Link>
          <Link href="/products" className="btn-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
