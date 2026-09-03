"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/validations";
import toast from "react-hot-toast";
import Script from "next/script";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

    const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      // Extract the Turnstile token directly from the form
      const form = document.querySelector("form");
      const formData = new FormData(form!);
      const turnstileToken = formData.get("cf-turnstile-response");

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        turnstileToken: turnstileToken, // Pass token to NextAuth
        redirect: false,
      });

      if (result?.error) {
        toast.error("Email atau password salah");
      } else {
        toast.success("Login berhasil");
        window.location.href = "/admin"; // Force a hard reload to respect session changes
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Cloudflare Turnstile explicit rendering script */}
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
        strategy="afterInteractive" 
        onLoad={() => {
          const turnstile = (window as any).turnstile;
          if (turnstile && turnstileRef.current) {
            turnstile.render(turnstileRef.current, {
              sitekey: "0x4AAAAAAElyQyM0Ru1Qj7kv",
              action: "admin_login",
              theme: "dark"
            });
          }
        }}
      />
      
      <div className="w-full max-w-sm">
        {/* Logo Area */}
        <div className="text-center mb-10 flex flex-col items-center">
          <img 
            src="/images/logo-sychogear.webp" 
            alt="SYCHOGEAR" 
            className="h-10 md:h-12 object-contain mb-3" 
          />
          <p className="text-xs tracking-[0.2em] uppercase text-brand-500 font-medium">
            Admin Panel
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
          <div>
            <label className="block text-[10px] md:text-xs text-brand-400 uppercase tracking-widest font-semibold mb-2">
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              className="input-field w-full text-sm"
              placeholder="admin@sychogear.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] md:text-xs text-brand-400 uppercase tracking-widest font-semibold mb-2">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              className="input-field w-full text-sm"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Turnstile Widget */}
          <div className="flex justify-center pt-2">
            <div ref={turnstileRef} className="min-h-[65px]"></div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="admin-btn-primary w-full mt-2 py-3 text-sm tracking-widest uppercase font-bold"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
