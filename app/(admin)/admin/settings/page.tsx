"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { uploadFileAction, deleteFileAction, getSignedUploadUrlAction } from "@/app/actions/upload";
import { useFFmpeg } from "@/hooks/use-ffmpeg";
import { HiOutlineSave, HiOutlinePhotograph, HiOutlineTrash, HiOutlineUpload, HiOutlineRefresh, HiOutlineCurrencyDollar, HiOutlineGlobeAlt } from "react-icons/hi";

interface Settings {
  promoActive: boolean;
  promoImage: string;
  promoTitle: string;
  promoSubtitle: string;
  promoLinkUrl: string;
  promoLinkText: string;
  marqueeText: string;
  // Currency
  idrToUsdRate: string;
  // International Tax — single global rate for all countries
  internationalTaxEnabled: boolean;
  internationalTaxRate: string; // e.g. "11"
}

const defaultSettings: Settings = {
  promoActive: false,
  promoImage: "",
  promoTitle: "LIMITED\nDROP",
  promoSubtitle: "",
  promoLinkUrl: "/",
  promoLinkText: "Claim",
  marqueeText: "",
  idrToUsdRate: "16000",
  internationalTaxEnabled: true,
  internationalTaxRate: "11",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { convertToWebM, converting: isConverting } = useFFmpeg();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get("/api/settings");
        if (data.success) {
          setSettings({
            promoActive: data.data.promoActive === "true",
            promoImage: data.data.promoImage || defaultSettings.promoImage,
            promoTitle: data.data.promoTitle || defaultSettings.promoTitle,
            promoSubtitle: data.data.promoSubtitle || defaultSettings.promoSubtitle,
            promoLinkUrl: data.data.promoLinkUrl || defaultSettings.promoLinkUrl,
            promoLinkText: data.data.promoLinkText || defaultSettings.promoLinkText,
            marqueeText: data.data.marqueeText || defaultSettings.marqueeText,
            idrToUsdRate: data.data.idrToUsdRate || defaultSettings.idrToUsdRate,
            internationalTaxEnabled: data.data.internationalTaxEnabled !== "false",
            internationalTaxRate: data.data.internationalTaxRate || defaultSettings.internationalTaxRate,
          });
        }
      } catch {
        console.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        promoActive: String(settings.promoActive),
        internationalTaxEnabled: String(settings.internationalTaxEnabled),
        internationalTaxRate: settings.internationalTaxRate,
      };

      const { data } = await axios.put("/api/settings", payload);
      if (data.success) {
        toast.success("Settings saved.");
      }
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      if (file.type.startsWith("video/") && file.type !== "video/webm") {
        toast.loading("Converting video to WebM...", { id: "conv" });
        try {
          file = await convertToWebM(file);
          toast.success("Video converted.", { id: "conv" });
        } catch (err) {
          console.error("Conversion failed, uploading original:", err);
          toast.error("Conversion failed, uploading original.", { id: "conv" });
        }
      }

      const signResult = await getSignedUploadUrlAction(file.name, file.type);

      if (!signResult.success || !signResult.uploadUrl) {
        throw new Error(signResult.error || "Failed to get upload permission");
      }

      const uploadResponse = await fetch(signResult.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload to storage");
      }

      if (signResult.publicUrl) {
        toast.success("File uploaded.");
      }
    } catch (error: any) {
      console.error("Direct upload error:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 skeleton w-48 rounded" />
        <div className="card p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 skeleton rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-brand-500 mt-1">Manage your storefront appearance</p>
      </div>
      
      {/* ── STORE CONFIG ─────────────────────────────────────── */}
      <div className="card p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-salt/5 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Store Configuration</h2>
          </div>
        </div>
        
        {/* Marquee Text */}
        <div>
          <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">
            Marquee / Ticker Text
          </label>
          <input
            type="text"
            value={settings.marqueeText}
            onChange={(e) => setSettings({ ...settings, marqueeText: e.target.value })}
            placeholder="Pesan pengumuman atau slogan..."
            className="input-field max-w-xl"
          />
          <p className="text-xs text-brand-600 mt-1">Teks pengumuman berjalan. Gunakan simbol pemisah misalnya ✦ atau —.</p>
        </div>
      </div>

      {/* ── PROMO BANNER ─────────────────────────────────────── */}
      <div className="card p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-salt/5 pb-4 gap-4">
          <div className="flex items-center gap-3">
            <HiOutlinePhotograph className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold">Promo Banner</h2>
          </div>
          <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
            <span className="text-xs font-medium text-brand-400 uppercase tracking-wider">Enable Promo Pop-up</span>
            <input
              type="checkbox"
              checked={settings.promoActive}
              onChange={(e) => setSettings({ ...settings, promoActive: e.target.checked })}
              className="w-4 h-4 rounded border-salt/20 bg-brand-900 text-red-600 focus:ring-red-600 focus:ring-offset-brand-950"
            />
          </label>
        </div>

        {/* Promo Image */}
        <div>
          <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-3">Promo Image (Optional)</label>
          <div className="flex gap-4 items-center">
            {settings.promoImage ? (
              <div className="relative w-40 aspect-[4/5] rounded overflow-hidden border border-salt/10 group">
                <img src={settings.promoImage} alt="Promo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-void/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={async () => {
                      if (settings.promoImage) await deleteFileAction(settings.promoImage);
                      setSettings({ ...settings, promoImage: "" });
                      toast.success("Promo image removed.");
                    }}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-40 aspect-[4/5] rounded border border-dashed border-salt/20 flex items-center justify-center bg-brand-900/50">
                <p className="text-xs text-brand-500 text-center px-4">No image</p>
              </div>
            )}
            <label className="btn-secondary text-xs cursor-pointer inline-flex items-center gap-2">
              <HiOutlineUpload className="w-4 h-4" />
              Upload New
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const signResult = await getSignedUploadUrlAction(file.name, file.type);
                    if (!signResult.success || !signResult.uploadUrl) throw new Error(signResult.error || "Failed to get upload permission");
                    const uploadResponse = await fetch(signResult.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
                    if (!uploadResponse.ok) throw new Error("Failed to upload to storage");
                    if (signResult.publicUrl) {
                      setSettings({ ...settings, promoImage: signResult.publicUrl });
                      toast.success("Promo image uploaded.");
                    }
                  } catch (error: any) {
                    toast.error(error.message || "Upload failed");
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">Title</label>
            <input type="text" value={settings.promoTitle} onChange={(e) => setSettings({ ...settings, promoTitle: e.target.value })} placeholder="LIMITED DROP" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">Subtitle / Eyebrow</label>
            <input type="text" value={settings.promoSubtitle} onChange={(e) => setSettings({ ...settings, promoSubtitle: e.target.value })} placeholder="Just dropped" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">Link URL</label>
            <input type="text" value={settings.promoLinkUrl} onChange={(e) => setSettings({ ...settings, promoLinkUrl: e.target.value })} placeholder="/" className="input-field" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">Button Text</label>
            <input type="text" value={settings.promoLinkText} onChange={(e) => setSettings({ ...settings, promoLinkText: e.target.value })} placeholder="Shop Now" className="input-field" />
          </div>
        </div>
      </div>

      {/* ── INTERNATIONAL PAYMENT & SHIPPING ─────────────────── */}
      <div className="card p-6 space-y-8">
        <div className="flex items-center gap-3 border-b border-salt/5 pb-4">
          <HiOutlineGlobeAlt className="w-5 h-5 text-[#0070ba]" />
          <h2 className="text-lg font-semibold">International Payment & Shipping</h2>
        </div>

        {/* Exchange Rate */}
        <div>
          <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">Exchange Rate (1 USD = ? IDR)</label>
          <div className="flex items-center gap-3 max-w-xs">
            <HiOutlineCurrencyDollar className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <input type="number" value={settings.idrToUsdRate} onChange={(e) => setSettings({ ...settings, idrToUsdRate: e.target.value })} className="input-field" placeholder="16000" />
          </div>
          <p className="text-xs text-brand-500 mt-1">Used to convert IDR prices to USD for international payments.</p>
        </div>

        <div className="h-px bg-white/5 w-full" />

        {/* International Tax */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-1">International Tax (PPN)</label>
              <p className="text-sm text-brand-500 max-w-sm">Enable to apply PPN tax to international orders.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.internationalTaxEnabled}
                onChange={(e) => setSettings({ ...settings, internationalTaxEnabled: e.target.checked })}
              />
              <div className="w-11 h-6 bg-brand-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-salt after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0070ba]" />
            </label>
          </div>

          {settings.internationalTaxEnabled && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">PPN Rate — All Countries (%)</label>
              <div className="flex items-center gap-3 max-w-xs">
                <input type="number" step="0.1" min="0" max="100" value={settings.internationalTaxRate} onChange={(e) => setSettings({ ...settings, internationalTaxRate: e.target.value })} className="input-field" placeholder="11" />
                <span className="text-sm text-brand-500 flex-shrink-0">%</span>
              </div>
              <p className="text-[10px] text-brand-600 mt-1">Applied uniformly to all international orders.</p>
            </div>
          )}
        </div>

      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving || uploading} className="btn-primary flex items-center gap-2">
        <HiOutlineSave className="w-4 h-4" />
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
