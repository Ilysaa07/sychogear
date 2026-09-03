"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { orderStatusSchema, type OrderStatusFormData } from "@/lib/validations";
import { formatCurrency } from "@/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import { 
  HiOutlineSearch, 
  HiOutlineExclamationCircle, 
  HiOutlineCheckCircle,
  HiOutlineCube,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineCog,
  HiOutlineTruck,
  HiOutlineHome,
  HiOutlineDocumentDuplicate,
  HiOutlineClipboardList
} from "react-icons/hi";
import type { OrderWithRelations } from "@/types";
import Script from "next/script";

// --- Subcomponents for Timelines ---

function TimelineStep({ 
  title, 
  description, 
  icon: Icon, 
  isActive, 
  isCompleted, 
  isError 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  isActive: boolean; 
  isCompleted: boolean; 
  isError?: boolean;
}) {
  return (
    <div className={`relative flex items-start gap-4 ${!isCompleted && !isActive ? 'opacity-40' : ''}`}>
      <div className="relative z-10 flex flex-col items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
          isError ? 'bg-red-500/20 border-red-500 text-red-500' :
          isCompleted ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 
          isActive ? 'bg-salt/20 border-salt text-salt shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 
          'bg-[#111111] border-salt/20 text-salt/50'
        }`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="pt-2 pb-8 flex-1">
        <h4 className={`text-sm font-bold uppercase tracking-widest ${
          isError ? 'text-red-500' :
          isActive || isCompleted ? 'text-white' : 'text-salt/50'
        }`}>{title}</h4>
        <p className="text-xs text-pale mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function RegularTimeline({ status }: { status: string }) {
  const isError = ["CANCELLED", "EXPIRED", "FAILED"].includes(status);
  
  const steps = [
    {
      title: "Order Placed",
      description: "Your order has been successfully placed.",
      icon: HiOutlineClipboardList,
      isCompleted: true,
      isActive: false,
    },
    {
      title: "Payment",
      description: isError ? "Payment failed or expired." : "Awaiting payment or already paid.",
      icon: HiOutlineCreditCard,
      isCompleted: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status),
      isActive: status === "UNPAID" && !isError,
      isError: isError
    },
    {
      title: "Processing",
      description: "Your order is being prepared.",
      icon: HiOutlineCog,
      isCompleted: ["SHIPPED", "DELIVERED"].includes(status),
      isActive: status === "PROCESSING",
    },
    {
      title: "Shipped",
      description: "Your order is on the way.",
      icon: HiOutlineTruck,
      isCompleted: ["DELIVERED"].includes(status),
      isActive: status === "SHIPPED",
    },
    {
      title: "Delivered",
      description: "Your order has arrived.",
      icon: HiOutlineHome,
      isCompleted: status === "DELIVERED",
      isActive: status === "DELIVERED",
    }
  ];

  return (
    <div className="relative pl-2">
      {/* Connecting Line */}
      <div className="absolute left-[1.65rem] top-5 bottom-8 w-px bg-salt/10"></div>
      
      {steps.map((step, idx) => (
        <TimelineStep key={idx} {...step} />
      ))}
    </div>
  );
}

function PreOrderTimeline({ status, hasResi }: { status: string, hasResi: boolean }) {
  const isError = status === "CANCELLED";
  
  const steps = [
    {
      title: "Order Placed",
      description: "Pre-order successfully entered the queue.",
      icon: HiOutlineClipboardList,
      isCompleted: true,
      isActive: false,
    },
    {
      title: "Down Payment",
      description: "Initial payment (DP) received.",
      icon: HiOutlineCreditCard,
      isCompleted: ["DP_PAID", "FULL_PAID"].includes(status),
      isActive: status === "PENDING" && !isError,
      isError: isError
    },
    {
      title: "Production",
      description: "Items are currently in production.",
      icon: HiOutlineCog,
      isCompleted: ["FULL_PAID"].includes(status) || hasResi,
      isActive: status === "DP_PAID",
    },
    {
      title: "Fully Paid",
      description: "Final payment has been completed.",
      icon: HiOutlineCheckCircle,
      isCompleted: status === "FULL_PAID" || hasResi,
      isActive: status === "FULL_PAID" && !hasResi,
    },
    {
      title: "Shipped",
      description: "Pre-Order has been shipped.",
      icon: HiOutlineTruck,
      isCompleted: hasResi,
      isActive: hasResi,
    }
  ];

  return (
    <div className="relative pl-2">
      {/* Connecting Line */}
      <div className="absolute left-[1.65rem] top-5 bottom-8 w-px bg-salt/10"></div>
      
      {steps.map((step, idx) => (
        <TimelineStep key={idx} {...step} />
      ))}
    </div>
  );
}


export default function UnifiedTrackingPage() {
  const [activeTab, setActiveTab] = useState<"regular" | "preorder">("regular");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // --- Regular Order States ---
  const [order, setOrder] = useState<OrderWithRelations | null>(null);
  const [loadingRegular, setLoadingRegular] = useState(false);
  const [searchedRegular, setSearchedRegular] = useState(false);

  const {
    register: registerRegular,
    handleSubmit: handleRegularSubmit,
    formState: { errors: errorsRegular },
  } = useForm<OrderStatusFormData>({
    resolver: zodResolver(orderStatusSchema),
  });

  // --- Pre-Order States ---
  const [poWhatsapp, setPoWhatsapp] = useState("");
  const [loadingPo, setLoadingPo] = useState(false);
  const [poError, setPoError] = useState("");
  const [poResults, setPoResults] = useState<any[]>([]);

  // --- Handlers ---
  const getTurnstileToken = () => {
    const token = (document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement)?.value;
    if (!token) {
      toast.error("Please complete the security check.");
      return null;
    }
    return token;
  };

  useEffect(() => {
    // Attempt to render if script is already loaded
    const turnstile = (window as any).turnstile;
    if (turnstile && turnstileRef.current && turnstileRef.current.innerHTML === "") {
      widgetIdRef.current = turnstile.render(turnstileRef.current, {
        sitekey: "0x4AAAAAAElyQyM0Ru1Qj7kv",
        action: "unified_tracking",
        theme: "dark"
      });
    }
  }, []);

  // Reset turnstile when WhatsApp number is changed
  useEffect(() => {
    const turnstile = (window as any).turnstile;
    if (turnstile && widgetIdRef.current !== null) {
      turnstile.reset(widgetIdRef.current);
    }
  }, [poWhatsapp]);

  const onSubmitRegular = async (data: OrderStatusFormData) => {
    const turnstileToken = getTurnstileToken();
    if (!turnstileToken) return;

    setLoadingRegular(true);
    setSearchedRegular(true);
    try {
      const response = await axios.post("/api/order-status", { ...data, turnstileToken });
      if (response.data.success) {
        setOrder(response.data.data);
      } else {
        setOrder(null);
        toast.error(response.data.error || "Order not found");
      }
    } catch {
      setOrder(null);
      toast.error("Order not found");
    } finally {
      setLoadingRegular(false);
    }
  };

  const onSubmitPreOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poWhatsapp.trim()) return;
    
    const turnstileToken = getTurnstileToken();
    if (!turnstileToken) {
      return;
    }

    setLoadingPo(true);
    setPoError("");
    setPoResults([]);
    
    try {
      const { data } = await axios.get(
        `/api/pre-orders/validate?whatsapp=${encodeURIComponent(poWhatsapp)}&turnstileToken=${encodeURIComponent(turnstileToken)}`
      );
      setPoResults(data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setPoError("We couldn't find a Pre-Order with this number. Please ensure the number is correct.");
      } else {
        setPoError("A system error occurred. Please try again later.");
      }
    } finally {
      setLoadingPo(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="container-main pt-32 pb-24 min-h-screen">
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
        strategy="afterInteractive" 
        onLoad={() => {
          const turnstile = (window as any).turnstile;
          if (turnstile && turnstileRef.current) {
            widgetIdRef.current = turnstile.render(turnstileRef.current, {
              sitekey: "0x4AAAAAAElyQyM0Ru1Qj7kv",
              action: "unified_tracking",
              theme: "dark"
            });
          }
        }}
      />

      <div className="mb-12 relative flex flex-col items-center text-center">
        <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-salt mb-3 font-bold flex items-center gap-2">
          <HiOutlineSearch className="w-4 h-4" /> Order Tracking
        </p>
        <h1 className="text-3xl md:text-5xl font-syne font-black uppercase leading-tight text-white tracking-tight">
          Track <span className="text-salt">Order</span>
        </h1>
        <p className="text-sm text-salt/80 mt-4 max-w-md mx-auto font-medium">
          Monitor your orders and pre-orders in real-time.
        </p>
      </div>

      <div className="max-w-xl mx-auto mb-16">
        {/* Tab Switcher */}
        <div className="flex bg-[#0a0a0a] rounded-xl border border-salt/10 p-1.5 mb-8 shadow-2xl">
          <button
            onClick={() => {
              setActiveTab("regular");
              setPoError("");
              setPoResults([]);
            }}
            className={`flex-1 py-3 px-4 flex flex-col items-center justify-center gap-1 transition-all rounded-lg ${
              activeTab === "regular" 
                ? "bg-salt text-void shadow-lg scale-100" 
                : "text-salt/60 hover:bg-white/5 hover:text-white scale-95"
            }`}
          >
            <HiOutlineCube className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Regular</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("preorder");
              setSearchedRegular(false);
              setOrder(null);
            }}
            className={`flex-1 py-3 px-4 flex flex-col items-center justify-center gap-1 transition-all rounded-lg ${
              activeTab === "preorder" 
                ? "bg-salt text-void shadow-lg scale-100" 
                : "text-salt/60 hover:bg-white/5 hover:text-white scale-95"
            }`}
          >
            <HiOutlineClock className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Pre-Order</span>
          </button>
        </div>

        {/* Turnstile is placed outside the conditionally rendered forms so it stays mounted */}
        <div className="flex justify-center mb-6">
          <div ref={turnstileRef} className="min-h-[65px]"></div>
        </div>

        {/* Regular Order Form */}
        {activeTab === "regular" && (
          <form onSubmit={handleRegularSubmit(onSubmitRegular)} className="bg-[#111111] p-6 md:p-8 rounded-2xl border border-salt/10 shadow-xl fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-salt/5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-pale uppercase tracking-widest mb-2 ml-1">
                  Email Address
                </label>
                <input
                  {...registerRegular("email")}
                  type="email"
                  className="w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 py-3.5 text-base text-white placeholder-salt/40 focus:outline-none focus:border-salt transition-colors"
                  placeholder="Email used at checkout"
                />
                {errorsRegular.email && (
                  <p className="text-red-400 text-xs mt-1.5 ml-1">{errorsRegular.email.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-pale uppercase tracking-widest mb-2 ml-1">
                  Invoice Number
                </label>
                <input
                  {...registerRegular("invoiceNumber")}
                  className="w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 py-3.5 text-base text-white placeholder-salt/40 focus:outline-none focus:border-salt transition-colors uppercase font-mono"
                  placeholder="INV-YYYYMMDD-XXXX"
                />
                {errorsRegular.invoiceNumber && (
                  <p className="text-red-400 text-xs mt-1.5 ml-1">{errorsRegular.invoiceNumber.message}</p>
                )}
              </div>

              <button type="submit" disabled={loadingRegular} className="w-full bg-salt hover:bg-pale text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm">
                {loadingRegular ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin"></span>
                    Searching...
                  </span>
                ) : (
                  <>
                    <HiOutlineSearch className="w-5 h-5" /> Track Order
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Pre-Order Form */}
        {activeTab === "preorder" && (
          <form onSubmit={onSubmitPreOrder} className="bg-[#111111] p-6 md:p-8 rounded-2xl border border-salt/10 shadow-xl fade-in relative overflow-hidden">
            <div className="absolute top-0 left-0 p-32 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            
            <div className="space-y-6 relative z-10">
              <p className="text-sm text-salt/80 mb-6 bg-[#0a0a0a] p-4 rounded-lg border border-salt/10 font-medium">
                Enter the WhatsApp number you used during checkout to check your pre-order status and remaining balance.
              </p>
              <div>
                <label className="block text-xs font-bold text-pale uppercase tracking-widest mb-2 ml-1">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  value={poWhatsapp}
                  onChange={(e) => setPoWhatsapp(e.target.value)}
                  placeholder="e.g., 081234567890"
                  className="w-full bg-[#0a0a0a] border border-salt/10 rounded-lg px-4 py-3.5 text-base text-white placeholder-salt/40 focus:outline-none focus:border-salt transition-colors font-mono"
                />
              </div>

              <button type="submit" disabled={loadingPo || !poWhatsapp.trim()} className="w-full bg-salt hover:bg-pale text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm">
                {loadingPo ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-void border-t-transparent rounded-full animate-spin"></span>
                    Searching...
                  </span>
                ) : (
                  <>
                    <HiOutlineSearch className="w-5 h-5" /> Track Pre-Order
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Pre-Order Error Message */}
        {activeTab === "preorder" && poError && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg flex items-start gap-3 fade-in">
            <HiOutlineExclamationCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed">{poError}</p>
          </div>
        )}
      </div>

      {/* --- Results Section --- */}

      {/* Regular Order Results */}
      {activeTab === "regular" && searchedRegular && !loadingRegular && (
        <div className="max-w-4xl mx-auto">
          {order ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 fade-in">
              {/* Left Col: Timeline */}
              <div className="md:col-span-5 bg-[#111111] border border-salt/10 rounded-2xl p-6 md:p-8 shadow-xl">
                <h3 className="text-xs font-bold text-salt uppercase tracking-widest mb-8 border-b border-salt/10 pb-4">Order Status</h3>
                <RegularTimeline status={order.status} />
                
                {order.payment?.invoiceUrl && order.status === "UNPAID" && (
                  <div className="mt-8 pt-6 border-t border-salt/10">
                    <p className="text-sm text-salt/80 mb-4 font-medium">Your order has not been paid. Complete payment before it expires.</p>
                    <a
                      href={order.payment.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-void font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs"
                    >
                      <HiOutlineCreditCard className="w-5 h-5" /> Pay Now
                    </a>
                  </div>
                )}
              </div>

              {/* Right Col: Details */}
              <div className="md:col-span-7 space-y-6">
                <div className="bg-[#111111] border border-salt/10 rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-salt/10">
                    <div>
                      <p className="text-[10px] font-bold text-salt/50 uppercase tracking-widest mb-1">Invoice Number</p>
                      <p className="font-mono text-xl font-bold text-white tracking-tight">{order.invoiceNumber}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-salt/50 uppercase tracking-widest mb-1">Date</p>
                      <p className="text-sm font-medium text-pale">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-salt uppercase tracking-widest mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-[#0a0a0a] p-3 rounded-xl border border-salt/5">
                        <div className="w-16 h-16 bg-[#111111] rounded-lg flex-shrink-0 overflow-hidden border border-salt/10">
                          <img
                            src={item.product.images[0]?.url || "/placeholder.svg"}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <p className="text-sm font-bold text-white">{item.product.name}</p>
                          <p className="text-xs text-salt/60 mt-1">
                            Size: <span className="text-pale font-medium">{item.size}</span>
                          </p>
                        </div>
                        <div className="text-right flex flex-col justify-center">
                          <p className="text-sm font-bold text-white">{formatCurrency(item.price * item.quantity)}</p>
                          <p className="text-xs text-salt/50 mt-1">Qty: {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-salt/10 pt-4 mt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-widest text-salt/60">Total Amount</span>
                      <span className="text-xl font-black text-white">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div className="bg-[#111111] border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-16 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none"></div>
                    <div className="relative z-10">
                      <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-1">Tracking Number / AWB</p>
                      <p className="font-mono font-bold text-2xl text-white">{order.trackingNumber}</p>
                      {order.courier && <p className="text-sm text-salt/80 mt-1 font-medium">Courier: <span className="text-white">{order.courier}</span></p>}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(order.trackingNumber!)}
                      className="p-3 bg-[#0a0a0a] hover:bg-white/5 border border-salt/10 rounded-lg transition-colors text-salt"
                      title="Copy Resi"
                    >
                      <HiOutlineDocumentDuplicate className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-[#111111] border border-salt/10 rounded-2xl max-w-xl mx-auto shadow-xl">
              <HiOutlineExclamationCircle className="w-12 h-12 text-salt/20 mx-auto mb-4" />
              <p className="text-white font-bold text-lg mb-2">Order Not Found</p>
              <p className="text-salt/60 text-sm font-medium">
                Please ensure the email address and invoice number are correct.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pre-Order Results */}
      {activeTab === "preorder" && poResults.length > 0 && (
        <div className="max-w-5xl mx-auto space-y-12 fade-in">
          {poResults.map((po) => {
            const totalPcs = po.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
            const hasResi = !!po.receiptNumber;
            
            return (
              <div key={po.id} className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Left Col: Timeline */}
                <div className="w-full lg:w-1/3 bg-[#111111] border border-salt/10 rounded-2xl p-6 md:p-8 shadow-xl lg:sticky lg:top-24">
                  <h3 className="text-xs font-bold text-salt uppercase tracking-widest mb-8 border-b border-salt/10 pb-4">Pre-Order Status</h3>
                  <PreOrderTimeline status={po.status} hasResi={hasResi} />
                  
                  {po.status === "DP_PAID" && (
                    <div className="mt-8 pt-6 border-t border-salt/10">
                      <div className="bg-salt/10 border border-salt/20 rounded-xl p-5 text-center">
                        <p className="text-xs font-bold text-pale uppercase tracking-widest mb-2">Remaining Balance</p>
                        <p className="text-3xl font-black text-salt mb-3">{formatCurrency(po.totalAmount - po.dpAmount)}</p>
                        <p className="text-sm font-medium text-salt/80">Wait for admin instructions to complete the payment.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Col: Details */}
                <div className="w-full lg:w-2/3 space-y-6">
                  
                  {/* Receipt Header */}
                  <div className="bg-[#111111] border border-salt/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-salt/50 uppercase tracking-widest mb-1">Pre-Order Number</p>
                        <div className="flex items-center gap-3">
                          <p className="font-mono text-xl font-bold text-white tracking-tight">{po.preOrderNumber}</p>
                          {po.campaign && (
                            <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider text-salt">
                              {po.campaign.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold text-salt/50 uppercase tracking-widest mb-1">Customer</p>
                        <p className="text-base font-bold text-pale">{po.customerName}</p>
                        <p className="text-sm font-mono text-salt/60 font-medium">{po.whatsapp}</p>
                      </div>
                    </div>
                  </div>

                  {/* Resi Tracking if shipped */}
                  {hasResi && (
                    <div className="bg-[#111111] border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex items-center justify-between gap-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-16 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none"></div>
                      <div className="relative z-10">
                        <p className="text-xs text-emerald-500 font-bold uppercase tracking-widest mb-1">Tracking Number / AWB</p>
                        <p className="font-mono font-bold text-2xl text-white">{po.receiptNumber}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(po.receiptNumber!)}
                        className="p-3 bg-[#0a0a0a] hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-colors text-emerald-500 relative z-10"
                        title="Copy Resi"
                      >
                        <HiOutlineDocumentDuplicate className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="bg-[#111111] border border-salt/10 rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xs font-bold text-salt uppercase tracking-widest mb-4 border-b border-salt/10 pb-4">Items ({totalPcs} Pcs)</h3>
                    <div className="space-y-3">
                      {po.items.map((item: any, i: number) => (
                        <div key={i} className="flex gap-4 bg-[#0a0a0a] p-3 rounded-xl border border-salt/5">
                          <div className="w-16 h-16 bg-[#111111] rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-salt/10">
                            {item.product?.images?.[0]?.url ? (
                              <img src={item.product.images[0].url} alt="Product" className="w-full h-full object-cover" />
                            ) : item.customImage ? (
                              <img src={item.customImage} alt="Product" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-2xl opacity-20"><HiOutlineCube /></span>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col justify-center min-w-0">
                            <p className="text-sm font-bold text-white truncate">{item.product?.name || item.customName || "Pre-Order Item"}</p>
                            <p className="text-xs text-salt/60 mt-1">
                              Size: <span className="text-pale font-medium">{item.size}</span>
                            </p>
                          </div>
                          <div className="text-right flex flex-col justify-center">
                            <p className="text-xs text-salt/50 mb-1">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Financial Summary */}
                    <div className="mt-8 bg-[#0a0a0a] rounded-xl border border-salt/10 p-5">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-salt/60 font-medium">Total Price</span>
                          <span className="text-white font-bold">{formatCurrency(po.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-salt/60 font-medium">Down Payment Paid</span>
                          <span className="text-emerald-400 font-bold">-{formatCurrency(po.dpAmount)}</span>
                        </div>
                        
                        <div className="pt-4 mt-4 border-t border-salt/10 flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-widest text-salt">Remaining Balance</span>
                          <span className={`text-2xl font-black ${po.totalAmount - po.dpAmount <= 0 ? 'text-emerald-500' : 'text-white'}`}>
                            {po.totalAmount - po.dpAmount <= 0 ? (
                              <span className="flex items-center gap-2"><HiOutlineCheckCircle /> FULLY PAID</span>
                            ) : (
                              formatCurrency(po.totalAmount - po.dpAmount)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
