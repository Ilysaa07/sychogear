"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { HiOutlineTrash, HiOutlinePlus, HiOutlinePencil, HiOutlineGlobeAlt, HiOutlineSave } from "react-icons/hi";
import { WORLDWIDE_COUNTRIES } from "@/lib/countries";

interface ShippingRate {
  id: string;
  countryCode: string;
  baseRate: number;
  nextKgRate: number;
}

export default function AdminShippingPage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    countryCode: "SG",
    baseRate: "",
    nextKgRate: "",
  });

  const fetchRates = async () => {
    try {
      const { data } = await axios.get("/api/shipping-rates");
      if (data.success) {
        setRates(data.data);
      }
    } catch (err) {
      toast.error("Failed to fetch shipping rates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.countryCode || !formData.baseRate || !formData.nextKgRate) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      if (editingId) {
        const { data } = await axios.put(`/api/shipping-rates/${editingId}`, formData);
        if (data.success) {
          toast.success("Rate updated.");
          setEditingId(null);
          fetchRates();
        }
      } else {
        const { data } = await axios.post("/api/shipping-rates", formData);
        if (data.success) {
          toast.success("Rate added.");
          fetchRates();
        }
      }
      setFormData({ countryCode: "SG", baseRate: "", nextKgRate: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save rate");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shipping rate?")) return;
    try {
      const { data } = await axios.delete(`/api/shipping-rates/${id}`);
      if (data.success) {
        toast.success("Rate deleted.");
        fetchRates();
      }
    } catch (err) {
      toast.error("Failed to delete rate.");
    }
  };

  const getCountryName = (code: string) => {
    const country = WORLDWIDE_COUNTRIES.find(c => c.code === code);
    return country ? country.name : code;
  };

  const unusedCountries = WORLDWIDE_COUNTRIES.filter(
    c => 
      c.code !== "ID" && // Exclude Indonesia, handled natively via J&T
      (!rates.find(r => r.countryCode === c.code) || (editingId && rates.find(r => r.id === editingId)?.countryCode === c.code))
  );

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">International Shipping Rates</h1>
        <p className="text-sm text-brand-500 mt-1">Manage Lion Parcel Interpack rates per country</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-8">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <HiOutlineGlobeAlt className="w-5 h-5 text-brand-400" />
              {editingId ? "Edit Rate" : "Add New Rate"}
            </h2>
            <form onSubmit={handleAddOrUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">Country</label>
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="input-field"
                  disabled={!!editingId}
                >
                  {unusedCountries.map(c => (
                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">Base Rate (First 1 KG) - IDR</label>
                <input
                  type="number"
                  value={formData.baseRate}
                  onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 150000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-400 uppercase tracking-wider mb-2">Next KG Rate - IDR</label>
                <input
                  type="number"
                  value={formData.nextKgRate}
                  onChange={(e) => setFormData({ ...formData, nextKgRate: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 100000"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button type="submit" className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                  {editingId ? <HiOutlineSave /> : <HiOutlinePlus />}
                  {editingId ? "Save Changes" : "Add Rate"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setFormData({ countryCode: "SG", baseRate: "", nextKgRate: "" });
                    }}
                    className="btn-secondary py-3 px-4 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="card p-6 animate-pulse bg-brand-900/50 h-32" />
          ) : rates.length === 0 ? (
            <div className="card p-12 text-center text-brand-500">
              <HiOutlineGlobeAlt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No international shipping rates configured.</p>
              <p className="text-xs mt-2">Add rates using the form to enable international shipping calculation.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-void/50 border-b border-salt/5">
                  <tr>
                    <th className="p-4 font-medium text-brand-400 uppercase tracking-wider text-xs">Country</th>
                    <th className="p-4 font-medium text-brand-400 uppercase tracking-wider text-xs text-right">Base Rate (1st KG)</th>
                    <th className="p-4 font-medium text-brand-400 uppercase tracking-wider text-xs text-right">Next KG Rate</th>
                    <th className="p-4 font-medium text-brand-400 uppercase tracking-wider text-xs text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-salt/5">
                  {rates.map(rate => (
                    <tr key={rate.id} className="hover:bg-brand-900/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-white">{getCountryName(rate.countryCode)}</div>
                        <div className="text-xs text-brand-500">{rate.countryCode}</div>
                      </td>
                      <td className="p-4 text-right font-mono text-brand-200">Rp {rate.baseRate.toLocaleString('id-ID')}</td>
                      <td className="p-4 text-right font-mono text-brand-200">Rp {rate.nextKgRate.toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingId(rate.id);
                              setFormData({
                                countryCode: rate.countryCode,
                                baseRate: rate.baseRate.toString(),
                                nextKgRate: rate.nextKgRate.toString()
                              });
                            }}
                            className="p-1.5 text-brand-400 hover:text-white bg-brand-900/50 rounded hover:bg-brand-800 transition-colors"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(rate.id)}
                            className="p-1.5 text-red-500 hover:text-white bg-red-500/10 rounded hover:bg-red-500 transition-colors"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
