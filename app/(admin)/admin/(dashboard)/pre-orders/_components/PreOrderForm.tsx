"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HiOutlineTrash, HiOutlinePlus, HiOutlineUpload } from "react-icons/hi";
import { getSignedUploadUrlAction } from "@/app/actions/upload";

const schema = z.object({
  preOrderNumber: z.string().min(1, "Required"),
  customerName: z.string().min(1, "Required"),
  whatsapp: z.string().min(1, "Required"),
  address: z.string().optional(),
  orderDate: z.string(),
  notes: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountName: z.string().optional(),
  
  dpPercentage: z.number().min(0).max(100),
  totalAmount: z.number().min(0),
  dpAmount: z.number().min(0),
  isPaid: z.boolean(),
  status: z.enum(["PENDING", "DP_PAID", "FULL_PAID", "CANCELLED"]),
  receiptNumber: z.string().optional(),
  
  dpProofUrl: z.string().optional().nullable(),
  fullProofUrl: z.string().optional().nullable(),
  
  items: z.array(
    z.object({
      productId: z.string().optional().nullable(),
      customName: z.string().optional().nullable(),
      size: z.string().min(1, "Required"),
      quantity: z.number().min(1, "Required"),
      price: z.number().min(0)
    })
  ).min(1, "At least one item is required")
});

type FormData = z.infer<typeof schema>;

export default function PreOrderForm({ initialData, campaignId }: { initialData?: any, campaignId?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingDp, setUploadingDp] = useState(false);
  const [uploadingFull, setUploadingFull] = useState(false);
  
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      ...initialData,
      orderDate: new Date(initialData.orderDate).toISOString().split('T')[0],
      dpProofUrl: initialData.dpProofUrl || "",
      fullProofUrl: initialData.fullProofUrl || ""
    } : {
      preOrderNumber: `PO-${Date.now().toString().slice(-6)}`,
      orderDate: new Date().toISOString().split('T')[0],
      dpPercentage: 50,
      totalAmount: 0,
      dpAmount: 0,
      isPaid: false,
      status: "PENDING",
      items: [{ size: "M", quantity: 1, price: 0, productId: "", customName: "" }]
    }
  });

  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    axios.get("/api/products").then((res) => {
      setProducts(res.data.data || res.data.products || []);
    }).catch(err => console.error("Failed to load products", err));
  }, []);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const items = watch("items");
  const dpPercentage = watch("dpPercentage");

  // Auto-calculate totals when items or dpPercentage changes
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    if (!initialData || total !== 0) { // Don't override initial amounts if items don't have prices yet
       setValue("totalAmount", total);
       setValue("dpAmount", (total * Number(dpPercentage)) / 100);
    }
  }, [items, dpPercentage, setValue, initialData]);

  const handleUpload = async (file: File, type: "dp" | "full") => {
    if (type === "dp") setUploadingDp(true);
    else setUploadingFull(true);
    
    try {
      const cleanFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const signResult = await getSignedUploadUrlAction(cleanFilename);
      
      if (!signResult.success || !signResult.uploadUrl) {
        throw new Error(signResult.error || "Failed to get upload permission");
      }
      
      const uploadResponse = await fetch(signResult.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });
      
      if (!uploadResponse.ok) throw new Error("Failed to upload file");
      
      const fileUrl = signResult.publicUrl || signResult.uploadUrl.split('?')[0];
      
      if (type === "dp") {
        setValue("dpProofUrl", fileUrl);
      } else {
        setValue("fullProofUrl", fileUrl);
      }
      toast.success("File uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      if (type === "dp") setUploadingDp(false);
      else setUploadingFull(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      if (initialData) {
        await axios.put(`/api/admin/pre-orders/${initialData.id}`, data);
        toast.success("Pre-order updated");
        router.push(initialData.campaignId ? `/admin/pre-orders/campaigns/${initialData.campaignId}` : "/admin/pre-orders");
      } else {
        await axios.post("/api/admin/pre-orders", { ...data, campaignId });
        toast.success("Pre-order created");
        router.push(campaignId ? `/admin/pre-orders/campaigns/${campaignId}` : "/admin/pre-orders");
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="admin-card p-6 space-y-6">
            <h3 className="text-sm font-semibold text-[var(--admin-muted)] uppercase tracking-wider border-b border-[var(--admin-border)] pb-3">Customer Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">PO Number</label>
                <input {...register("preOrderNumber")} className="admin-input" />
                {errors.preOrderNumber && <p className="text-red-400 text-xs mt-1">{errors.preOrderNumber.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Order Date</label>
                <input type="date" {...register("orderDate")} className="admin-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Customer Name</label>
                <input {...register("customerName")} className="admin-input" />
                {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">WhatsApp</label>
                <input {...register("whatsapp")} className="admin-input" placeholder="e.g. 62812..." />
                {errors.whatsapp && <p className="text-red-400 text-xs mt-1">{errors.whatsapp.message}</p>}
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Address</label>
                <textarea {...register("address")} className="admin-input min-h-[80px]" />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Notes / Catatan</label>
                <input {...register("notes")} className="admin-input" />
              </div>
            </div>
          </div>

          <div className="admin-card p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--admin-border)] pb-3">
              <h3 className="text-sm font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Order Items</h3>
              <button 
                type="button" 
                onClick={() => append({ customName: "", productId: "", size: "M", quantity: 1, price: 0 })}
                className="text-xs font-semibold text-emerald-400 flex items-center hover:text-emerald-300 transition-colors"
              >
                <HiOutlinePlus className="mr-1 w-4 h-4" /> Add Item
              </button>
            </div>
            
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-wrap md:flex-nowrap gap-4 items-end bg-[var(--admin-bg)]/50 p-5 border border-[var(--admin-border)] rounded-lg relative group">
                  <div className="flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-muted)]">Product</label>
                    <div className="flex flex-col gap-2">
                      <select 
                        className="admin-input"
                        {...register(`items.${index}.productId`, {
                          onChange: (e) => {
                            const selectedProduct = products.find(p => p.id === e.target.value);
                            if (selectedProduct) {
                              setValue(`items.${index}.customName`, selectedProduct.name);
                            }
                          }
                        })}
                      >
                        <option value="">-- Custom Product --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input {...register(`items.${index}.customName`)} placeholder="Custom Product Name" className="admin-input" />
                    </div>
                  </div>
                  <div className="w-24 space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-muted)]">Size</label>
                    <input {...register(`items.${index}.size`)} className="admin-input" />
                  </div>
                  <div className="w-24 space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-muted)]">Qty</label>
                    <input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="admin-input" />
                  </div>
                  <div className="w-32 space-y-1.5">
                    <label className="text-xs font-medium text-[var(--admin-muted)]">Price (ea)</label>
                    <input type="number" {...register(`items.${index}.price`, { valueAsNumber: true })} className="admin-input" />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => remove(index)}
                    className="p-2.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / Financials */}
        <div className="space-y-6">
          <div className="admin-card p-6 space-y-6">
            <h3 className="text-sm font-semibold text-[var(--admin-muted)] uppercase tracking-wider border-b border-[var(--admin-border)] pb-3">Financials</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Status</label>
                <select {...register("status")} className="admin-input">
                  <option value="PENDING">PENDING</option>
                  <option value="DP_PAID">DP PAID</option>
                  <option value="FULL_PAID">FULL PAID</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              
              <div className="space-y-1.5 border-t border-[var(--admin-border)] pt-4">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">DP Percentage (%)</label>
                <input type="number" {...register("dpPercentage", { valueAsNumber: true })} className="admin-input" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider flex items-center">
                  Total Amount <span className="text-[10px] text-emerald-400 normal-case ml-2 font-medium">(Auto-calculated)</span>
                </label>
                <input type="number" readOnly {...register("totalAmount", { valueAsNumber: true })} className="admin-input font-mono text-white text-lg bg-white/5 opacity-70 cursor-not-allowed border-transparent" tabIndex={-1} />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider flex items-center">
                  DP Amount <span className="text-[10px] text-emerald-400 normal-case ml-2 font-medium">(Auto-calculated)</span>
                </label>
                <input type="number" readOnly {...register("dpAmount", { valueAsNumber: true })} className="admin-input font-mono text-amber-400 text-lg bg-white/5 opacity-70 cursor-not-allowed border-transparent" tabIndex={-1} />
              </div>
            </div>
          </div>

          <div className="admin-card p-6 space-y-6">
            <h3 className="text-sm font-semibold text-[var(--admin-muted)] uppercase tracking-wider border-b border-[var(--admin-border)] pb-3">Bank / Proof</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Bank Name</label>
                <input {...register("bankName")} className="admin-input" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Account Name</label>
                <input {...register("bankAccountName")} className="admin-input" />
              </div>
              
              <div className="space-y-1.5 border-t border-[var(--admin-border)] pt-4">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Proof of DP</label>
                <div className="flex gap-2">
                  <input {...register("dpProofUrl")} className="admin-input text-xs" readOnly placeholder="URL will appear here" />
                  <label className="admin-btn-secondary px-3 cursor-pointer flex-shrink-0 flex items-center justify-center">
                    <input type="file" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files[0], "dp")} disabled={uploadingDp} />
                    {uploadingDp ? "..." : <HiOutlineUpload />}
                  </label>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Proof of Full Payment</label>
                <div className="flex gap-2">
                  <input {...register("fullProofUrl")} className="admin-input text-xs" readOnly placeholder="URL will appear here" />
                  <label className="admin-btn-secondary px-3 cursor-pointer flex-shrink-0 flex items-center justify-center">
                    <input type="file" className="hidden" onChange={(e) => e.target.files && handleUpload(e.target.files[0], "full")} disabled={uploadingFull} />
                    {uploadingFull ? "..." : <HiOutlineUpload />}
                  </label>
                </div>
              </div>
              
              <div className="space-y-1.5 border-t border-[var(--admin-border)] pt-4">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Resi / Receipt Number</label>
                <input {...register("receiptNumber")} className="admin-input" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-[var(--admin-bg)]/90 backdrop-blur-md border-t border-[var(--admin-border)] flex justify-end gap-3 z-40">
        <button type="button" onClick={() => router.back()} className="admin-btn-secondary">Cancel</button>
        <button type="submit" disabled={saving} className="admin-btn-primary w-40 shadow-lg shadow-blue-500/20">
          {saving ? "Saving..." : "Save Pre-Order"}
        </button>
      </div>
    </form>
  );
}
