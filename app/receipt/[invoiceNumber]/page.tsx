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
      <div className="w-full max-w-3xl bg-white text-black p-8 sm:p-12 shadow-2xl print:shadow-none print:p-0 relative">
        
        {/* Print Button Wrapper - Hidden on Print */}
        <div className="absolute top-4 right-4 print:hidden">
          <PrintButton />
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-gray-200 pb-8 mb-8">
          <div className="mb-6 sm:mb-0">
            <Image
              src="/images/logo.png"
              alt="SYCHOGEAR Logo"
              width={180}
              height={60}
              className="object-contain filter invert" // Logo might be white text, invert makes it black
              priority
            />
            <p className="mt-2 text-sm text-gray-500 font-medium">Premium Streetwear</p>
            <p className="text-xs text-gray-400">sychogear.com</p>
          </div>
          <div className="text-left sm:text-right">
            <h1 className="text-4xl font-black uppercase tracking-widest text-gray-900 mb-2">Receipt</h1>
            <p className="text-sm font-mono text-gray-500">Invoice: <span className="font-bold text-gray-900">{order.invoiceNumber}</span></p>
            <p className="text-sm text-gray-500">Date: <span className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
            <p className="text-sm text-gray-500">
              Status: <span className="font-bold uppercase tracking-wider text-gray-900">{order.status}</span>
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">Billed To</h2>
            <p className="font-bold text-lg text-gray-900">{order.customer.name}</p>
            <p className="text-sm text-gray-600 mt-1">{order.customer.email}</p>
            <p className="text-sm text-gray-600">{order.customer.phone || "-"}</p>
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-100 pb-2">Shipping Details</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.customer.address || "No address provided"}</p>
            {isInternational && (
              <p className="mt-2 inline-block px-2 py-1 bg-gray-100 text-xs font-bold text-gray-700 rounded uppercase tracking-wider">
                International: {order.country}
              </p>
            )}
            {order.trackingNumber && (
              <p className="text-sm text-gray-700 mt-2 font-mono">
                Tracking: <span className="font-bold">{order.courier} {order.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 text-xs font-bold uppercase tracking-widest text-gray-400">Item</th>
                <th className="py-3 text-xs font-bold uppercase tracking-widest text-gray-400 text-center">Qty</th>
                <th className="py-3 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Price</th>
                <th className="py-3 text-xs font-bold uppercase tracking-widest text-gray-400 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-bold text-gray-900 text-sm sm:text-base">{item.product.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-1">Size: {item.size}</p>
                  </td>
                  <td className="py-4 text-center font-medium text-gray-700">{item.quantity}</td>
                  <td className="py-4 text-right font-medium text-gray-700">{formatCurrency(item.price)}</td>
                  <td className="py-4 text-right font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end">
          <div className="mb-6 sm:mb-0">
            {order.payment?.method && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Payment Method</h3>
                <p className="font-bold text-gray-900">{order.payment.method}</p>
                {order.payment.paidAt && (
                  <p className="text-xs text-gray-500 mt-1">Paid on: {new Date(order.payment.paidAt).toLocaleDateString()}</p>
                )}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-6 max-w-xs italic">
              Thank you for shopping with SYCHOGEAR. For any inquiries, please contact our support.
            </p>
          </div>
          
          <div className="w-full sm:w-1/2 max-w-sm space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.totalDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Product Discount</span>
                <span>-{formatCurrency(order.totalDiscount)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Coupon Discount</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            {order.taxPpn > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (PPN)</span>
                <span>+{formatCurrency(order.taxPpn)}</span>
              </div>
            )}
            {order.taxPph23 > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>PPH 23</span>
                <span>+{formatCurrency(order.taxPph23)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600 border-b border-gray-200 pb-2">
              <span>Unique Code</span>
              <span>+{order.uniqueCode}</span>
            </div>
            <div className="flex justify-between items-end pt-2">
              <span className="text-lg font-black tracking-wide text-gray-900 uppercase">Total</span>
              <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">{formatCurrency(order.totalWithCode)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col items-center justify-center text-center">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`https://sychogear.com/order-success/${order.invoiceNumber}`)}`} 
            alt="QR Code" 
            className="w-20 h-20 mb-3 mix-blend-multiply"
          />
          <p className="text-[10px] tracking-widest text-gray-400 uppercase font-bold mb-6">Scan to Track Order</p>
          <p className="text-xs font-bold tracking-widest text-gray-300 uppercase">
            Sychogear — Those Who Move In Silence
          </p>
        </div>

      </div>
    </div>
  );
}
