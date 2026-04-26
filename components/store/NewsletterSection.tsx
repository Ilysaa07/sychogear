"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/newsletter", { email });
      if (data.success) {
        setSent(true);
        setEmail("");
        toast.success("Welcome to the Syndicate.");
      } else {
        toast.error(data.error || "Transmission failed.");
      }
    } catch (error: any) {
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center bg-[#020202] px-6 py-32 text-center overflow-hidden border-t border-[#111]">
      
      {/* Massive Background Logo Hologram */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] transition-transform duration-[10s] hover:scale-105">
        <img src="/images/logo.gif" alt="" className="w-[200vw] md:w-[100vw] h-auto object-contain" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        
        {/* Animated small logo */}
        <div className="w-16 h-16 sm:w-24 sm:h-24 mb-16 opacity-70 hover:opacity-100 hover:scale-110 transition-all duration-700">
           <img src="/images/logo.gif" alt="Sychogear Core" className="w-full h-full object-contain" />
        </div>

        {/* Massive Typography Statement */}
        <h2 className="font-syne font-black text-white uppercase leading-[0.8] tracking-tighter mb-20" style={{ fontSize: "clamp(60px, 14vw, 180px)" }}>
          Rule<br/>Your<br/>Domain.
        </h2>

        {/* Sleek Form */}
        <div className="w-full max-w-lg">
          {sent ? (
            <p className="font-syne font-bold text-white text-xl uppercase tracking-[0.3em] py-4 border-b border-white animate-pulse">
              Access Granted.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="relative group">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="ENTER YOUR EMAIL..."
                required
                className={`w-full bg-transparent border-b-2 p-4 text-center font-dm-mono text-sm text-white placeholder-[#444] focus:outline-none transition-all duration-500 uppercase tracking-widest ${isFocused ? 'border-white' : 'border-[#222]'}`}
              />
              {/* Magnetic Button that appears on focus/typing */}
              <button
                type="submit"
                disabled={loading}
                className={`absolute right-2 top-0 bottom-0 px-4 font-syne font-bold text-white transition-all duration-500 flex items-center justify-center ${isFocused || email.length > 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
              >
                {loading ? "..." : "→"}
              </button>
            </form>
          )}
          
          <p className="font-dm-mono text-[10px] text-[#444] uppercase tracking-[0.2em] mt-8">
            Join the archive. No noise. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
