import { orderRepository } from "@/repositories/order.repository";
import { formatCurrency } from "@/lib/utils";
import { OrderWithRelations } from "@/types";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HiOutlineCheckCircle, HiOutlineClock, HiOutlineInformationCircle } from "react-icons/hi";
import OrderStatusPoller from "@/components/store/OrderStatusPoller";
import CopyButton from "@/components/store/CopyButton";
import TrackingWidget from "@/components/TrackingWidget";
import ClearCart from "@/components/store/ClearCart";

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

  const payment = order.payment as any;
  const paymentMethod = payment?.method || order.paymentMethod;
  const paymentCode = payment?.paymentCode;
  const invoiceUrl = payment?.invoiceUrl;
  const isDoku = ["BCA_VA", "MANDIRI_VA", "BRI_VA", "BNI_VA", "PERMATA_VA", "DOKU"].includes(paymentMethod || "");

  return (
    <div className="container-main pt-32 pb-20 max-w-2xl">
      <ClearCart />
      <OrderStatusPoller invoiceNumber={invoiceNumber} initialStatus={order.status} expiredAt={order.expiredAt} />

      <div className="fade-in">
        <div className={`card glass border-salt/5 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500`}>
          {/* Header Status */}
          <div className={`py-12 px-8 text-center bg-gradient-to-b ${isPaid ? "from-green-500/10 to-transparent" :
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
                ? "Payment Successful"
                : isExpired
                  ? "Order Expired"
                  : "Awaiting Payment"}
            </h1>

            <p className="text-brand-400 max-w-md mx-auto">
              Invoice Number: <span className="font-mono text-white tracking-widest bg-white/5 px-2 py-1 rounded">{order.invoiceNumber}</span>
            </p>

            {/* Country Badge */}
            {isInternational && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-salt/10">
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
                  Thank you! Your payment has been received.
                </p>
                <p className="text-sm text-brand-400 mt-2">
                  Your order will be processed and shipped soon.
                </p>
              </div>
            ) : isExpired ? (
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center">
                <p className="text-red-400 font-medium">
                  Sorry, the payment deadline has passed.
                </p>
                <p className="text-sm text-brand-400 mt-2">
                  Please create a new order if you're still interested.
                </p>
              </div>
            ) : (
              /* Pending Payment */
              <div className="space-y-6">
                <div className="bg-brand-900/50 border border-salt/5 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <HiOutlineInformationCircle className="w-20 h-20" />
                  </div>

                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <span className="w-1 h-1 bg-yellow-500 rounded-full" />
                    Payment Details
                  </h2>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <p className="text-xs text-brand-500 uppercase tracking-widest mb-2 font-bold">Total Amount</p>
                      <div className="bg-void/40 p-4 border border-salt/5 rounded-xl flex items-center justify-between">
                        <span className="text-3xl font-bold text-white tracking-tight">
                          {isInternational && order.payment?.currencyAmount
                            ? formatUSD(order.payment.currencyAmount)
                            : formatCurrency(order.totalWithCode)}
                        </span>
                        <CopyButton text={isInternational && order.payment?.currencyAmount ? order.payment.currencyAmount.toString() : order.totalWithCode.toString()} />
                      </div>
                    </div>

                    {/* ── Payment Code (DOKU VA) ── */}
                    {isDoku && paymentCode ? (
                      <div className="text-center space-y-4">
                        <p className="font-dm-mono text-xs text-ash">
                          Please complete your payment via Virtual Account to the number below.
                        </p>
                        <div className="bg-void/40 p-6 border border-salt/5 rounded-xl text-center">
                          <p className="text-[10px] text-brand-500 uppercase tracking-widest mb-2 font-bold">
                            {paymentMethod?.replace("_", " ")} VIRTUAL ACCOUNT
                          </p>
                          <div className="flex items-center justify-center gap-4 mb-2">
                            <span className="text-3xl font-mono text-white tracking-widest font-bold">
                              {paymentCode}
                            </span>
                            <CopyButton text={paymentCode} />
                          </div>
                          <p className="text-xs text-brand-400 mt-2">
                            Automatically verified by DOKU
                          </p>
                        </div>
                        <p className="font-dm-mono text-[10px] text-brand-500">
                          Expires at:{" "}
                          {new Date(order.expiredAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    ) : invoiceUrl ? (
                      <div className="text-center space-y-4">
                        <p className="font-dm-mono text-xs text-ash">
                          Click the button below to complete your payment.
                        </p>
                        <a
                          href={invoiceUrl}
                          className="btn-primary w-full py-4 text-sm uppercase tracking-wider block text-center"
                        >
                          Pay Now →
                        </a>
                        <p className="font-dm-mono text-[10px] text-brand-500">
                          Expires at:{" "}
                          {new Date(order.expiredAt).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    ) : (
                      /* ── Manual Transfer / Alternate Payment ── */
                      <>
                        <div className="bg-void/40 p-6 border border-salt/5 rounded-xl text-center">
                          <div className="bg-white inline-block px-3 py-1 rounded mb-3">
                            <span className="text-black font-black uppercase italic">DOKU</span>
                          </div>
                          <p className="text-[10px] text-brand-500 uppercase tracking-widest mb-1 font-bold">Payment Gateway</p>
                          <p className="font-bold text-lg">DOKU</p>
                          <p className="text-sm text-brand-400 mt-2">
                            Automatic verification via Virtual Account, QRIS & E-Wallet.
                          </p>
                        </div>

                        {/* Price Breakdown */}
                        <div className="pt-4 border-t border-salt/5 space-y-2">
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
                          {!isInternational && (
                            <div className="flex justify-between text-xs text-yellow-500/80 italic">
                              <span>Unique Code</span>
                              <span>+{order.uniqueCode}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-4 border-t border-salt/5">
                          <p className="text-[10px] text-yellow-500/80 mb-4 flex items-start gap-1.5 font-medium leading-tight">
                            <HiOutlineInformationCircle className="w-4 h-4 flex-shrink-0" />
                            <span>* Price does not include shipping fee. Please contact our CS via WhatsApp to coordinate shipping costs.</span>
                          </p>
                          <p className="text-xs text-brand-500 mb-2 font-bold uppercase tracking-widest text-center">Payment Deadline</p>
                          <p className="text-center text-red-400 font-bold text-lg tabular-nums">
                            {new Date(order.expiredAt).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-[11px] text-brand-500 mb-6 italic">
                    This page will update automatically once your payment is confirmed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {!isDoku && !invoiceUrl && (
                      <a
                        href={`https://wa.me/6283190138549?text=${encodeURIComponent(`Hello SychoGear, I would like to confirm my payment for invoice ${invoiceNumber}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary w-full sm:w-auto px-6 py-4 text-sm uppercase tracking-wider"
                      >
                        Confirm via WA
                      </a>
                    )}
                    <Link href={`/receipt/${invoiceNumber}`} target="_blank" className="btn-secondary w-full sm:w-auto px-6 py-4 text-sm uppercase tracking-wider">
                      Print Receipt
                    </Link>
                    <Link href="/" className="btn-secondary w-full sm:w-auto px-6 py-4 text-sm uppercase tracking-wider">
                      Shop More
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ── Invoice / Order Summary ── */}
            <div className="mt-12 bg-void/40 border border-salt/5 rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-1 bg-brand-500 rounded-full" />
                Order Summary
              </h2>

              <div className="space-y-4 mb-8">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-abyss rounded-xl border border-salt/5">
                    {item.product.images?.[0] ? (
                      <img src={item.product.images[0].url || item.product.images[0]} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg bg-void" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-void" />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-sm text-salt">{item.product.name}</p>
                      <p className="text-xs text-ash mt-1">Size: {item.size} | Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-dm-mono text-sm text-salt">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-6 border-t border-salt/5 space-y-3">
                <div className="flex justify-between text-sm text-ash">
                  <span>Subtotal</span>
                  <span className="font-dm-mono text-salt">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.shippingCost > 0 && (
                  <div className="flex justify-between text-sm text-ash">
                    <span>Shipping</span>
                    <span className="font-dm-mono text-salt">{formatCurrency(order.shippingCost)}</span>
                  </div>
                )}
                {order.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Product Discount</span>
                    <span className="font-dm-mono">-{formatCurrency(order.totalDiscount)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Coupon Discount</span>
                    <span className="font-dm-mono">-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                {order.taxPpn > 0 && (
                  <div className="flex justify-between text-sm text-ash">
                    <span>Tax (PPN)</span>
                    <span className="font-dm-mono text-salt">+{formatCurrency(order.taxPpn)}</span>
                  </div>
                )}
                {!isInternational && order.uniqueCode > 0 && (
                  <div className="flex justify-between text-sm text-yellow-500">
                    <span>Unique Code</span>
                    <span className="font-dm-mono">+{order.uniqueCode}</span>
                  </div>
                )}

                <div className="pt-4 mt-4 border-t border-salt/10 flex justify-between items-center">
                  <span className="font-bold text-salt uppercase tracking-widest text-sm">Total</span>
                  <span className="font-dm-mono text-2xl font-bold text-brand-500">
                    {isInternational && order.payment?.currencyAmount
                      ? formatUSD(order.payment.currencyAmount)
                      : formatCurrency(order.totalWithCode)}
                  </span>
                </div>
              </div>
            </div>

            {isPaid && (
              <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <Link href={`/receipt/${invoiceNumber}`} target="_blank" className="btn-primary px-8 py-4 text-sm uppercase tracking-wider text-center flex items-center justify-center gap-2">
                  Download Invoice
                </Link>
                <Link href="/" className="btn-secondary px-8 py-4 text-sm uppercase tracking-wider text-center">
                  Continue Shopping
                </Link>
              </div>
            )}

            {/* Tracking widget — shown when AWB is available (order SHIPPED or DELIVERED) */}
            {trackingNumber && (isShipped || isPaid) && (
              <div className="border-t border-salt/5 pt-6 space-y-4">
                <TrackingWidget awb={trackingNumber} courier={order.courier} />
              </div>
            )}

            {/* If SHIPPED but no tracking yet */}
            {isShipped && !trackingNumber && (
              <div className="border-t border-salt/5 pt-6">
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
                <Link href="/" className="btn-primary px-12">
                  Back to Store
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
