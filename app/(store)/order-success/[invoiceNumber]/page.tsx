import { orderRepository } from "@/repositories/order.repository";
import { formatCurrency } from "@/lib/utils";
import { OrderWithRelations } from "@/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineInformationCircle } from "react-icons/hi";
import OrderStatusPoller from "@/components/store/OrderStatusPoller";
import CopyButton from "@/components/store/CopyButton";
import TrackingWidget from "@/components/TrackingWidget";

function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;
  const order = (await orderRepository.findByInvoiceNumber(invoiceNumber)) as any as OrderWithRelations & {
    country?: string;
    paymentMethod?: string;
    shippingCost?: number;
  };

  if (!order) {
    notFound();
  }

  const isExpired = new Date() > order.expiredAt || order.status === "EXPIRED";
  const isPaid = order.status === "PAID";
  const isShipped = ["SHIPPED", "DELIVERED"].includes(order.status);
  const isInternational = order.country && order.country !== "ID";
  const trackingNumber = (order as any).trackingNumber as string | null | undefined;

  return (
    <div className="container-main pt-32 pb-20 max-w-2xl">
      <OrderStatusPoller invoiceNumber={invoiceNumber} initialStatus={order.status} />
      
      <div className="fade-in">
        <div className={`card glass border-white/5 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500`}>
          {/* Header Status */}
          <div className={`py-12 px-8 text-center bg-gradient-to-b ${
            isPaid ? "from-green-500/10 to-transparent" : 
            isExpired ? "from-red-500/10 to-transparent" : 
            "from-yellow-500/10 to-transparent"
          }`}>
            <div className="relative inline-block mb-6">
              {isPaid ? (
                <HiOutlineCheckCircle className="w-24 h-24 text-green-500 animate-pulse-once" />
              ) : isExpired ? (
                <HiOutlineClock className="w-24 h-24 text-red-500" />
              ) : (
                <div className="relative">
                  <HiOutlineClock className="w-24 h-24 text-yellow-500 animate-red-glow-continuous" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-ping" />
                </div>
              )}
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight mb-3">
              {isPaid 
                ? (isInternational ? "Payment Successful" : "Pembayaran Berhasil")
                : isExpired 
                  ? (isInternational ? "Order Expired" : "Pesanan Kedaluwarsa")
                  : (isInternational ? "Awaiting Payment" : "Menunggu Pembayaran")}
            </h1>
            
            <p className="text-brand-400 max-w-md mx-auto">
              {isInternational ? "Invoice Number" : "Nomor Invoice"}: <span className="font-mono text-white tracking-widest bg-white/5 px-2 py-1 rounded">{order.invoiceNumber}</span>
            </p>

            {/* Country Badge */}
            {isInternational && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="w-4 h-3 relative rounded-sm overflow-hidden inline-block flex-shrink-0">
                  <img
                    src={`https://flagcdn.com/w20/${(order.country || "ID").toLowerCase()}.png`}
                    alt={order.country || "ID"}
                    className="w-full h-full object-cover"
                  />
                </span>
                <span className="text-xs text-brand-400">{order.country}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Worldwide</span>
              </div>
            )}
          </div>

          <div className="px-8 pb-12 space-y-8">
            {/* Payment Instructions / Success Message */}
            {isPaid ? (
              <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 text-center">
                <p className="text-green-400 font-medium">
                  {isInternational
                    ? "Thank you! Your payment has been received."
                    : "Terima kasih! Pembayaran Anda telah kami terima."}
                </p>
                <p className="text-sm text-brand-400 mt-2">
                  {isInternational
                    ? "Your order will be processed and shipped soon."
                    : "Pesanan Anda segera kami proses dan kirim."}
                </p>
              </div>
            ) : isExpired ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
                <p className="text-red-400 font-medium">
                  {isInternational
                    ? "Sorry, the payment deadline has passed."
                    : "Maaf, waktu pembayaran telah habis."}
                </p>
                <p className="text-sm text-brand-400 mt-2">
                  {isInternational
                    ? "Please create a new order if you're still interested."
                    : "Silakan buat pesanan baru jika Anda masih ingin membeli produk ini."}
                </p>
              </div>
            ) : isInternational ? (
              /* International Pending Payment */
              <div className="space-y-6">
                <div className="bg-brand-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <HiOutlineInformationCircle className="w-20 h-20" />
                  </div>

                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                    Payment Details
                  </h2>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <p className="text-xs text-brand-500 uppercase tracking-widest mb-2 font-bold">Total Amount</p>
                      <div className="bg-black/40 p-4 border border-white/5 rounded-xl">
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-bold text-white tracking-tight">
                            {order.payment?.currencyAmount
                              ? formatUSD(order.payment.currencyAmount)
                              : formatCurrency(order.totalWithCode)}
                          </span>
                          {order.payment?.currencyAmount && (
                            <span className="text-sm text-brand-500">
                              ({formatCurrency(order.totalWithCode)} IDR)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/40 p-4 border border-white/5 rounded-xl">
                        <p className="text-[10px] text-brand-500 uppercase tracking-widest mb-1 font-bold">Bank</p>
                        <p className="font-bold text-lg">BCA</p>
                      </div>
                      <div className="bg-black/40 p-4 border border-white/5 rounded-xl">
                        <p className="text-[10px] text-brand-500 uppercase tracking-widest mb-1 font-bold">Account Name</p>
                        <p className="font-bold text-brand-200 text-sm">PT SYCHOGEAR INDONESIA</p>
                      </div>
                    </div>

                    <div className="bg-black/40 p-4 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-brand-500 uppercase tracking-widest mb-1 font-bold">Account Number</p>
                        <p className="text-2xl font-mono font-bold tracking-widest text-white">883190138549</p>
                      </div>
                      <CopyButton text="883190138549" />
                    </div>

                    {/* Price Breakdown */}
                    <div className="pt-4 border-t border-white/5 space-y-2">
                      <div className="flex justify-between text-xs text-brand-400">
                        <span>Subtotal</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>

                      {order.totalDiscount > 0 && (
                        <div className="flex justify-between text-xs text-green-400">
                          <span>Product Discount</span>
                          <span>-{formatCurrency(order.totalDiscount)}</span>
                        </div>
                      )}

                      {order.discount > 0 && (
                        <div className="flex justify-between text-xs text-green-400">
                          <span>Coupon Discount</span>
                          <span>-{formatCurrency(order.discount)}</span>
                        </div>
                      )}

                      {order.taxPpn > 0 && (
                        <div className="flex justify-between text-xs text-brand-400">
                          <span>Tax (PPN)</span>
                          <span>+{formatCurrency(order.taxPpn)}</span>
                        </div>
                      )}

                      {(order.shippingCost ?? 0) > 0 && (
                        <div className="flex justify-between text-xs text-brand-400">
                          <span>International Shipping</span>
                          <span>+{formatCurrency(order.shippingCost ?? 0)}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <p className="text-xs text-brand-500 mb-2 font-bold uppercase tracking-widest text-center">Payment Deadline</p>
                      <p className="text-center text-red-400 font-bold text-lg tabular-nums">
                        {new Date(order.expiredAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[11px] text-brand-500 mb-6 italic">
                    This page will update automatically once your payment is confirmed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={`https://wa.me/6283190138549?text=${encodeURIComponent(`Hello SychoGear, I would like to confirm my international order payment for invoice ${invoiceNumber}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-6 bg-[#25d366] hover:bg-[#1da851] text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all text-center"
                    >
                      Confirm via WhatsApp
                    </a>
                    <Link href="/products" className="btn-secondary w-full">
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Manual Transfer Pending Payment */
              <div className="space-y-6">
                <div className="bg-brand-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <HiOutlineInformationCircle className="w-20 h-20" />
                  </div>
                  
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full" />
                    Detail Pembayaran
                  </h2>
                  
                  <div className="space-y-6 relative z-10">
                    <div>
                      <p className="text-xs text-brand-500 uppercase tracking-widest mb-2 font-bold">Total Transfer</p>
                      <div className="flex items-center justify-between bg-black/40 p-4 border border-white/5 rounded-xl">
                        <span className="text-3xl font-bold text-white tracking-tight">
                          {formatCurrency(order.totalWithCode)}
                        </span>
                        <CopyButton text={order.totalWithCode.toString()} />
                      </div>
                      <p className="text-[10px] text-yellow-500/80 mt-3 flex items-center gap-1.5 font-medium italic">
                        <HiOutlineInformationCircle className="w-3 h-3" />
                        PENTING: Transfer tepat hingga 3 digit terakhir untuk verifikasi otomatis.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/40 p-4 border border-white/5 rounded-xl">
                        <p className="text-[10px] text-brand-500 uppercase tracking-widest mb-1 font-bold">Bank</p>
                        <p className="font-bold text-lg">BCA</p>
                      </div>
                      <div className="bg-black/40 p-4 border border-white/5 rounded-xl">
                        <p className="text-[10px] text-brand-500 uppercase tracking-widest mb-1 font-bold">Atas Nama</p>
                        <p className="font-bold text-brand-200">PT SYCHOGEAR INDONESIA</p>
                      </div>
                    </div>

                    <div className="bg-black/40 p-4 border border-white/5 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-brand-500 uppercase tracking-widest mb-1 font-bold">Nomor Rekening</p>
                        <p className="text-2xl font-mono font-bold tracking-widest text-white">883190138549</p>
                      </div>
                      <CopyButton text="883190138549" />
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-2">
                       <div className="flex justify-between text-xs text-brand-400">
                         <span>Subtotal</span>
                         <span>{formatCurrency(order.subtotal)}</span>
                       </div>
                       
                       {order.totalDiscount > 0 && (
                         <div className="flex justify-between text-xs text-green-400">
                           <span>Diskon Produk</span>
                           <span>-{formatCurrency(order.totalDiscount)}</span>
                         </div>
                       )}

                       {order.discount > 0 && (
                         <div className="flex justify-between text-xs text-green-400">
                           <span>Kupon Diskon</span>
                           <span>-{formatCurrency(order.discount)}</span>
                         </div>
                       )}

                       {order.taxPpn > 0 && (
                         <div className="flex justify-between text-xs text-brand-400">
                           <span>PPN</span>
                           <span>+{formatCurrency(order.taxPpn)}</span>
                         </div>
                       )}

                       {order.taxPph23 > 0 && (
                         <div className="flex justify-between text-xs text-brand-400">
                           <span>PPH 23</span>
                           <span>+{formatCurrency(order.taxPph23)}</span>
                         </div>
                       )}

                       <div className="flex justify-between text-xs text-yellow-500/80 italic">
                         <span>Kode Unik</span>
                         <span>+{order.uniqueCode}</span>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <p className="text-xs text-brand-500 mb-2 font-bold uppercase tracking-widest text-center">Batas Waktu</p>
                      <p className="text-center text-red-400 font-bold text-lg tabular-nums">
                        {new Date(order.expiredAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[11px] text-brand-500 mb-6 italic">
                    Halaman ini akan otomatis diperbarui setelah pembayaran Anda kami konfirmasi.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a 
                      href={`https://wa.me/6283190138549?text=Halo%20SychoGear,%20saya%20ingin%20konfirmasi%20pembayaran%20untuk%20invoice%20${invoiceNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full"
                    >
                      Konfirmasi via WhatsApp
                    </a>
                    <Link href="/products" className="btn-secondary w-full">
                      Lanjut Belanja
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {isPaid && (
               <div className="flex justify-center">
                 <Link href="/products" className="btn-secondary px-12">
                   {isInternational ? "Continue Shopping" : "Lanjut Belanja"}
                 </Link>
               </div>
            )}

            {/* Tracking widget — shown when AWB is available (order SHIPPED or DELIVERED) */}
            {trackingNumber && (isShipped || isPaid) && (
              <div className="border-t border-white/5 pt-6 space-y-4">
                <TrackingWidget awb={trackingNumber} />
              </div>
            )}

            {/* If SHIPPED but no tracking yet */}
            {isShipped && !trackingNumber && (
              <div className="border-t border-white/5 pt-6">
                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center">
                  <p className="text-sm font-bold text-blue-300 mb-1">Your order has been shipped! 🚚</p>
                  <p className="text-xs text-brand-500">
                    Tracking number will be available soon. Check back here or contact us via WhatsApp.
                  </p>
                  <a
                    href={`https://wa.me/6283190138549?text=${encodeURIComponent(`Hello SychoGear, I'd like to get the tracking number for invoice ${invoiceNumber}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#25d366] text-white text-xs font-bold rounded-lg hover:bg-[#1da851] transition-colors"
                  >
                    Ask for tracking
                  </a>
                </div>
              </div>
            )}

             {isExpired && (
               <div className="flex justify-center">
                 <Link href="/products" className="btn-primary px-12">
                   {isInternational ? "Back to Store" : "Kembali ke Toko"}
                 </Link>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
