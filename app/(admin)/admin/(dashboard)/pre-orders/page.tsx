"use client";

import { useState } from "react";
import axios from "axios";
import useSWR from "swr";
import toast from "react-hot-toast";
import { HiOutlineTrash, HiOutlinePlus, HiOutlineEye, HiOutlineCube, HiOutlineX } from "react-icons/hi";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

const fetcher = (url: string) => axios.get(url).then((res) => res.data.data);

export default function AdminPreOrderCampaignsPage() {
  const { data: campaigns = [], isLoading: loading, mutate: mutateCampaigns } = useSWR<any[]>("/api/admin/pre-orders/campaigns", fetcher);
  const { data: products = [] } = useSWR<any[]>("/api/products", fetcher);
  
  const [deleting, setDeleting] = useState(false);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [creating, setCreating] = useState(false);

  const confirmDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign and ALL its pre-orders? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const { data } = await axios.delete(`/api/admin/pre-orders/campaigns/${id}`);
      if (data.success) {
        toast.success("Campaign deleted");
        mutateCampaigns();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { name, productId, endDate, bannerUrl, isActive };
      if (editingId) {
        await axios.put(`/api/admin/pre-orders/campaigns/${editingId}`, payload);
        toast.success("Campaign updated");
      } else {
        await axios.post("/api/admin/pre-orders/campaigns", payload);
        toast.success("Campaign created");
      }
      setShowModal(false);
      setEditingId(null);
      setName("");
      setProductId("");
      setEndDate("");
      setBannerUrl("");
      setIsActive(true);
      mutateCampaigns();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to save campaign");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (campaign: any) => {
    setEditingId(campaign.id);
    setName(campaign.name);
    setProductId(campaign.productId || "");
    setEndDate(campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : "");
    setBannerUrl(campaign.bannerUrl || "");
    setIsActive(campaign.isActive);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setProductId("");
    setEndDate("");
    setBannerUrl("");
    setIsActive(true);
    setShowModal(true);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingBanner(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const { data } = await axios.post("/api/upload", formData);
      if (data.success) {
        setBannerUrl(data.url);
      }
    } catch (err) {
      toast.error("Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pre-Order Campaigns</h1>
          <p className="text-sm text-[var(--admin-muted)] mt-1">
            Manage your pre-order batches and products
          </p>
        </div>
        <div>
          <button onClick={openCreateModal} className="admin-btn-primary text-sm flex items-center">
            <HiOutlinePlus className="w-4 h-4 mr-2" />
            New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="admin-card p-6 h-40 bg-white/5 animate-pulse" />
          ))
        ) : campaigns.length === 0 ? (
          <div className="col-span-full admin-card p-12 flex flex-col items-center justify-center text-center border-dashed border-[var(--admin-border)]">
            <HiOutlineCube className="w-12 h-12 text-[var(--admin-muted)] mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-white mb-1">No campaigns found</h3>
            <p className="text-sm text-[var(--admin-muted)] max-w-sm mb-6">
              Create a pre-order campaign first before you can manage pre-order data.
            </p>
            <button onClick={openCreateModal} className="admin-btn-secondary text-sm">
              Create First Campaign
            </button>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div key={campaign.id} className="admin-card flex flex-col hover:border-[var(--admin-accent)] transition-colors group overflow-hidden">
              {campaign.bannerUrl && (
                <div className="h-32 w-full border-b border-[var(--admin-border)] overflow-hidden bg-[var(--admin-bg)]">
                  <img src={campaign.bannerUrl} alt={campaign.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-[var(--admin-accent)] transition-colors">
                      {campaign.name}
                    </h3>
                    {campaign.product ? (
                      <p className="text-xs text-[var(--admin-muted)] flex items-center mt-1">
                        <HiOutlineCube className="mr-1" /> Linked to: {campaign.product.name}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--admin-muted)] mt-1">Custom Product / Unlinked</p>
                    )}
                  </div>
                  <span className={`admin-badge ${campaign.isActive ? 'admin-badge-success' : 'admin-badge-neutral'}`}>
                    {campaign.isActive ? "ACTIVE" : "ENDED"}
                  </span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-[var(--admin-border)] flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-[var(--admin-muted)]">Total Orders: </span>
                    <span className="font-semibold text-white">{campaign._count?.preOrders || 0}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(campaign)}
                      className="p-2 text-[var(--admin-muted)] hover:text-emerald-400 bg-[var(--admin-bg)] hover:bg-emerald-400/10 rounded-lg transition-colors"
                      title="Edit Campaign"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <Link
                      href={`/admin/pre-orders/campaigns/${campaign.id}`}
                      className="p-2 text-[var(--admin-muted)] hover:text-white bg-[var(--admin-bg)] hover:bg-white/10 rounded-lg transition-colors"
                      title="Manage Orders"
                    >
                      <HiOutlineEye className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => confirmDelete(campaign.id)}
                      disabled={deleting}
                      className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete Campaign"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all">
            <div className="p-5 border-b border-[var(--admin-border)] flex justify-between items-center bg-[var(--admin-bg)]/50">
              <h3 className="text-lg font-semibold">{editingId ? "Edit Campaign" : "New Pre-Order Campaign"}</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--admin-muted)] hover:text-white">
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Campaign Name</label>
                <input 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. KXBX Pre-Order Batch 1"
                  className="admin-input"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Link to Existing Product (Optional)</label>
                <select 
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="admin-input"
                >
                  <option value="">-- No link (Custom Product) --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">End Date (Optional)</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="admin-input"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--admin-muted)] uppercase tracking-wider">Campaign Banner (Optional)</label>
                <div className="flex items-center gap-3">
                  {bannerUrl && (
                    <img src={bannerUrl} alt="Banner" className="w-16 h-16 object-cover rounded-md border border-[var(--admin-border)]" />
                  )}
                  <div className="flex-1">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={uploadingBanner}
                      className="admin-input text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                    />
                  </div>
                </div>
              </div>

              {editingId && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--admin-border)] bg-[var(--admin-bg)] text-emerald-500 focus:ring-emerald-500/20"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-white">
                    Campaign is Active
                  </label>
                </div>
              )}
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="admin-btn-secondary">Cancel</button>
                <button type="submit" disabled={creating} className="admin-btn-primary">
                  {creating ? "Saving..." : (editingId ? "Save Changes" : "Create Campaign")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
