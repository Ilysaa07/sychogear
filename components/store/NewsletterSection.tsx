"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { data } = await axios.post("/api/newsletter", { email });
      if (data.success) {
        toast.success("Berhasil berlangganan newsletter!");
        setEmail("");
      } else {
        toast.error(data.error || "Gagal berlangganan");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Gagal berlangganan");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 lg:py-32 bg-brand-950 border-t border-white/5 relative z-10 transition-colors">
      <div className="container-main max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-12 lg:gap-20">
        
        {/* Minimalist Heading Side */}
        <div className="text-left w-full md:w-1/2">
          <p className="text-[10px] tracking-[0.4em] font-bold uppercase text-brand-500 mb-6 slide-up">
            [ UNLOCK ACCESS ]
          </p>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-marker tracking-tighter mb-4 slide-up text-white leading-none">
            JOIN EARLY
          </h2>
          <p className="text-brand-400 text-xs md:text-sm max-w-sm slide-up leading-relaxed">
            Gain immediate priority access to unreleased drops, limited events, and exclusive brand updates before the masses.
          </p>
        </div>

        {/* Stark Input Side */}
        <div className="w-full md:w-1/2 slide-up">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 w-full max-w-md ml-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="YOUR EMAIL ADDRESS //"
              className="w-full bg-transparent text-white placeholder-brand-700 pb-4 border-b border-white/20 focus:outline-none focus:border-white transition-colors text-xs md:text-sm tracking-widest uppercase font-semibold rounded-none"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-black hover:text-white border border-transparent hover:border-white font-bold uppercase tracking-[0.2em] text-xs py-5 transition-all duration-300 flex items-center justify-center gap-3"
            >
              {loading ? "PROCESSING..." : "SUBSCRIBE"}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="hidden sm:block">
                <path d="M1 11L11 1M11 1H3.5M11 1V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
