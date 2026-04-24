"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/newsletter", { email });
      if (data.success) {
        setSent(true);
        setEmail("");
        toast.success("You're on the list.");
      } else {
        toast.error(data.error || "Something went wrong.");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Could not subscribe. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="newsletter"
      className="relative min-h-[90vh] flex flex-col items-center justify-center bg-[#111512] px-6 py-24 text-center overflow-hidden border-t border-ember"
    >
      {/* Background Graphic Element - subtle glow or noise could go here */}

      {/* Centerpiece: Animated Logo */}
      <div className="relative w-32 h-32 sm:w-48 sm:h-48 mb-8 z-10 transition-transform duration-700 hover:scale-105">
        <img
          src="/images/logo.gif"
          alt="Sychogear"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Massive Typography Statement */}
      <h2
        className="font-syne font-bold text-salt uppercase leading-[0.85] tracking-tight mb-8 z-10"
        style={{ fontSize: "clamp(48px, 12vw, 140px)" }}
      >
        Rule Your<br />Domain.
      </h2>

      {/* Action Link */}
      <Link
        href="/products"
        className="font-syne font-bold text-salt text-xs uppercase tracking-[0.2em] mb-24 pb-2 border-b-2 border-salt hover:text-ash hover:border-ash transition-colors z-10"
      >
        Shop The Archive
      </Link>

      {/* Minimalist Newsletter Form */}
      <div className="w-full max-w-md z-10">
        <p className="font-syne font-bold text-salt text-sm tracking-widest uppercase mb-3">
          Stay Informed
        </p>
        <p className="font-dm-mono text-xs text-ash mb-8">
          Drop alerts. No noise. Unsubscribe any time.
        </p>

        {sent ? (
          <p className="font-syne font-bold text-signal text-xl uppercase tracking-widest py-4 border-b border-signal inline-block">
            You're on the list.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex border-b border-ash group hover:border-salt focus-within:border-salt transition-colors">
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="w-full bg-transparent border-none outline-none py-4 font-dm-mono text-sm text-center text-salt placeholder-dim focus:ring-0"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Subscribe"
              className="px-4 font-syne font-bold text-salt text-xl group-hover:translate-x-1 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "..." : "→"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
