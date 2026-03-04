import { orderRepository } from "@/repositories/order.repository";
import { formatCurrency } from "@/lib/utils";
import { OrderWithRelations } from "@/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineInformationCircle } from "react-icons/hi";
import OrderStatusPoller from "@/components/store/OrderStatusPoller";
import CopyButton from "@/components/store/CopyButton";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;
  const order = (await orderRepository.findByInvoiceNumber(invoiceNumber)) as any as OrderWithRelations;

  if (!order) {
    notFound();
  }

  const isExpired = new Date() > order.expiredAt || order.status === "EXPIRED";
  const isPaid = order.status === "PAID";

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
                ? "Pembayaran Berhasil" 
                : isExpired 
                  ? "Pesanan Kedaluwarsa" 
                  : "Menunggu Pembayaran"}
            </h1>
            
            <p className="text-brand-400 max-w-md mx-auto">
              Nomor Invoice: <span className="font-mono text-white tracking-widest bg-white/5 px-2 py-1 rounded">{order.invoiceNumber}</span>
            </p>
          </div>

          <div className="px-8 pb-12 space-y-8">
            {/* Payment Instructions / Success Message */}
            {isPaid ? (
              <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 text-center">
                <p className="text-green-400 font-medium">Terima kasih! Pembayaran Anda telah kami terima.</p>
                <p className="text-sm text-brand-400 mt-2">Pesanan Anda segera kami proses dan kirim.</p>
              </div>
            ) : isExpired ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
                <p className="text-red-400 font-medium">Maaf, waktu pembayaran telah habis.</p>
                <p className="text-sm text-brand-400 mt-2">Silakan buat pesanan baru jika Anda masih ingin membeli produk ini.</p>
              </div>
            ) : (
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
                   Lanjut Belanja
                 </Link>
               </div>
            )}
             {isExpired && (
               <div className="flex justify-center">
                 <Link href="/products" className="btn-primary px-12">
                   Kembali ke Toko
                 </Link>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
