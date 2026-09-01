import { orderRepository } from "@/repositories/order.repository";
import { formatCurrency } from "@/lib/utils";
import { OrderWithRelations } from "@/types";
import { notFound } from "next/navigation";
import Image from "next/image";
import PrintButton from "./PrintButton"; // We will create a client component for the print button

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const { invoiceNumber } = await params;
  const order = (await orderRepository.findByInvoiceNumber(
    invoiceNumber
  )) as any as OrderWithRelations & {
    country?: string;
    paymentMethod?: string;
    shippingCost?: number;
    trackingNumber?: string;
    courier?: string;
  };

  if (!order) {
    notFound();
  }

  const isInternational = order.country && order.country !== "ID";

  return (
    <div className="min-h-screen bg-brand-950 print:bg-white p-4 sm:p-8 flex justify-center items-start font-sans">
      <div className="w-full max-w-3xl bg-void text-salt p-8 sm:p-12 shadow-2xl print:shadow-none print:p-0 print:bg-white print:text-black relative border border-salt/5">

        {/* Print Button Wrapper - Hidden on Print */}
        <div className="absolute top-4 right-4 print:hidden">
          <PrintButton />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-brand-500/20 print:border-gray-200 pb-8 mb-8">
          <div className="mb-6 sm:mb-0">
            <div className="bg-brand-500/10 p-2 rounded-lg inline-block print:bg-transparent print:p-0">
              <Image
                src="/images/logo-sychogear.webp"
                alt="SYCHOGEAR Logo"
                width={180}
                height={60}
                className="object-contain print:invert"
                priority
              />
            </div>
            <p className="mt-2 text-sm text-ash font-medium print:text-gray-500">VIOLENCE IS OUR AESTHETIC</p>
            <p className="text-xs text-brand-500 print:text-gray-400">sychogear.com</p>
          </div>
          <div className="text-left sm:text-right">
            <h1 className="text-4xl font-black uppercase tracking-widest text-white print:text-gray-900 mb-2">Receipt</h1>
            <p className="text-sm font-mono text-ash print:text-gray-500">Invoice: <span className="font-bold text-white print:text-gray-900">{order.invoiceNumber}</span></p>
            <p className="text-sm text-ash print:text-gray-500">Date: <span className="font-medium text-white print:text-gray-900">{new Date(order.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
            <p className="text-sm text-ash print:text-gray-500">
              Status: <span className="font-bold uppercase tracking-wider text-brand-500 print:text-gray-900">{order.status}</span>
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 border-b border-brand-500/20 print:border-gray-100 pb-2">Billed To</h2>
            <p className="font-bold text-lg text-white print:text-gray-900">{order.customer.name}</p>
            <p className="text-sm text-ash mt-1 print:text-gray-600">{order.customer.email}</p>
            <p className="text-sm text-ash print:text-gray-600">{order.customer.phone || "-"}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 border-b border-brand-500/20 print:border-gray-100 pb-2">Shipping Details</h2>
            <p className="text-sm text-ash whitespace-pre-wrap print:text-gray-700">{order.customer.address || "No address provided"}</p>
            {isInternational && (
              <p className="mt-2 inline-block px-2 py-1 bg-brand-500/10 text-brand-500 text-xs font-bold rounded uppercase tracking-wider print:bg-gray-100 print:text-gray-700">
                International: {order.country}
              </p>
            )}
            {order.trackingNumber && (
              <p className="text-sm text-ash mt-2 font-mono print:text-gray-700">
                Tracking: <span className="font-bold text-white print:text-gray-900">{order.courier} {order.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-brand-500/20 print:border-gray-200">
                <th className="py-3 text-xs font-bold uppercase tracking-widest text-brand-500 print:text-gray-400">Item</th>
                <th className="py-3 text-xs font-bold uppercase tracking-widest text-brand-500 print:text-gray-400 text-center">Qty</th>
                <th className="py-3 text-xs font-bold uppercase tracking-widest text-brand-500 print:text-gray-400 text-right">Price</th>
                <th className="py-3 text-xs font-bold uppercase tracking-widest text-brand-500 print:text-gray-400 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} className="border-b border-salt/5 print:border-gray-100">
                  <td className="py-4">
                    <p className="font-bold text-white text-sm sm:text-base print:text-gray-900">{item.product.name}</p>
                    <p className="text-xs text-ash font-mono mt-1 print:text-gray-500">Size: {item.size}</p>
                  </td>
                  <td className="py-4 text-center font-medium text-ash print:text-gray-700">{item.quantity}</td>
                  <td className="py-4 text-right font-medium text-ash print:text-gray-700">{formatCurrency(item.price)}</td>
                  <td className="py-4 text-right font-bold text-white print:text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end">
          <div className="mb-6 sm:mb-0">
            {order.payment?.method && (
              <div className="bg-abyss p-4 rounded-lg border border-salt/5 print:bg-gray-50 print:border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-500 print:text-gray-400 mb-1">Payment Method</h3>
                <p className="font-bold text-white print:text-gray-900">{order.payment.method}</p>
                {order.payment.paidAt && (
                  <p className="text-xs text-ash mt-1 print:text-gray-500">Paid on: {new Date(order.payment.paidAt).toLocaleDateString()}</p>
                )}
              </div>
            )}
            <p className="text-xs text-ash mt-6 max-w-xs italic print:text-gray-400">
              Thank you for shopping with SYCHOGEAR. For any inquiries, please contact our support.
            </p>
          </div>

          <div className="w-full sm:w-1/2 max-w-sm space-y-2">
            <div className="flex justify-between text-sm text-ash print:text-gray-600">
              <span>Subtotal</span>
              <span className="text-white print:text-gray-900">{formatCurrency(order.subtotal)}</span>
            </div>

            {order.shippingCost !== undefined && order.shippingCost > 0 && (
              <div className="flex justify-between text-sm text-ash print:text-gray-600">
                <span>Shipping</span>
                <span className="text-white print:text-gray-900">+{formatCurrency(order.shippingCost)}</span>
              </div>
            )}

            {order.totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-400 font-medium print:text-green-600">
                <span>Product Discount</span>
                <span>-{formatCurrency(order.totalDiscount)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-400 font-medium print:text-green-600">
                <span>Coupon Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.taxPpn > 0 && (
              <div className="flex justify-between text-sm text-ash print:text-gray-600">
                <span>Tax (PPN)</span>
                <span className="text-white print:text-gray-900">+{formatCurrency(order.taxPpn)}</span>
              </div>
            )}
            {order.taxPph23 > 0 && (
              <div className="flex justify-between text-sm text-ash print:text-gray-600">
                <span>PPH 23</span>
                <span className="text-white print:text-gray-900">+{formatCurrency(order.taxPph23)}</span>
              </div>
            )}
            {order.uniqueCode > 0 && (
              <div className="flex justify-between text-sm text-yellow-500 print:text-gray-600 border-b border-salt/10 print:border-gray-200 pb-2">
                <span>Unique Code</span>
                <span>+{order.uniqueCode}</span>
              </div>
            )}
            {!(order.uniqueCode > 0) && (
              <div className="border-b border-salt/10 print:border-gray-200 pb-2"></div>
            )}

            <div className="flex justify-between items-end pt-2">
              <span className="text-lg font-black tracking-wide text-white uppercase print:text-gray-900">Total</span>
              <span className="text-2xl font-black text-brand-500 font-mono tracking-tight print:text-gray-900">{formatCurrency(order.totalWithCode)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-salt/10 print:border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-2 rounded-lg mb-3 print:bg-transparent print:p-0">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://sychogear.com/order-success/${order.invoiceNumber}`)}`}
              alt="QR Code"
              className="w-20 h-20 print:mix-blend-multiply"
            />
          </div>
          <p className="text-[10px] tracking-widest text-brand-500 uppercase font-bold mb-6 print:text-gray-400">Scan to Track Order</p>
        </div>

      </div>
    </div>
  );
}
