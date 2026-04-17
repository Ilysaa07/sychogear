"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

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
      className="relative bg-abyss border-t border-ember overflow-hidden"
      style={{ padding: "clamp(80px, 12vw, 140px) 0" }}
    >
      <div className="container-main">
        <div className="max-w-2xl">

          {/* Eyebrow */}
          <p className="label-eyebrow mb-6">§ INNER CIRCLE</p>

          {/* Heading */}
          <h2
            className="font-display text-salt mb-4 reveal"
            style={{
              fontSize: "clamp(40px, 6vw, 72px)",
              lineHeight: 0.95,
              letterSpacing: "0.02em",
            }}
          >
            THE INNER CIRCLE.
          </h2>

          {/* Subtext */}
          <p
            className="reveal"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "0.8125rem",
              color: "var(--ash)",
              letterSpacing: "0.05em",
              lineHeight: 1.8,
              marginBottom: "clamp(32px, 5vw, 56px)",
              maxWidth: "380px",
            }}
          >
            Drop alerts. No noise.
            <br />
            We don&apos;t share intel.
          </p>

          {/* Form */}
          {sent ? (
            <div className="reveal is-visible">
              <p
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "0.8125rem",
                  color: "var(--signal)",
                  letterSpacing: "0.1em",
                }}
              >
                ✓ intel received.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-0 max-w-sm reveal"
              style={{ borderBottom: "1px solid var(--ember)" }}
            >
              <div className="flex-1">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  style={{
                    width: "100%",
                    padding: "0.75rem 0",
                    background: "transparent",
                    border: "none",
                    color: "var(--salt)",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.8125rem",
                    letterSpacing: "0.05em",
                    outline: "none",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                aria-label="Subscribe"
                style={{
                  background: "none",
                  border: "none",
                  padding: "0.75rem 0 0.75rem 1rem",
                  color: loading ? "var(--fog)" : "var(--signal)",
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "1rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "color 200ms ease",
                  lineHeight: 1,
                }}
              >
                {loading ? "…" : "→"}
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Subtle ambient glow — bottom right corner */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "-10%",
          bottom: "-20%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,169,110,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
    </section>
  );
}
