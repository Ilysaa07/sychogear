"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/components/store/CurrencyProvider";
import type { ProductWithRelations } from "@/types";

interface Props { products: ProductWithRelations[]; marqueeText?: string; }

export default function CoverFlowSlider({ products, marqueeText = "SYCHOGEAR WORLDWIDE" }: Props) {
  const { formatPrice } = useCurrency();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isPowered, setIsPowered] = useState(true);
  const [volume, setVolume] = useState(0);
  const [showStatic, setShowStatic] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── White noise generator ──
  const startNoise = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    noiseRef.current = src;
    gainRef.current = gain;
  }, []);

  const stopNoise = useCallback(() => {
    noiseRef.current?.stop();
    noiseRef.current = null;
    gainRef.current = null;
  }, []);

  const changeVolume = useCallback((dir: 1 | -1) => {
    const next = Math.max(0, Math.min(10, volume + dir));
    setVolume(next);
    if (next > 0) {
      if (!noiseRef.current) startNoise();
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(next * 0.03, audioCtxRef.current.currentTime, 0.1);
      }
    } else {
      stopNoise();
    }
  }, [volume, startNoise, stopNoise]);

  const switchChannel = useCallback((dir: 1 | -1) => {
    if (isSwitching || !isPowered) return;
    setIsSwitching(true);
    setShowStatic(true);
    setTimeout(() => {
      setActiveIndex(prev => {
        const n = prev + dir;
        if (n < 0) return products.length - 1;
        if (n >= products.length) return 0;
        return n;
      });
      setShowStatic(false);
      setIsSwitching(false);
    }, 380);
  }, [isSwitching, isPowered, products.length]);

  const togglePower = useCallback(() => {
    if (isPowered) {
      setShowStatic(true);
      setTimeout(() => { setShowStatic(false); setIsPowered(false); }, 400);
    } else {
      setShowStatic(true);
      setTimeout(() => { setShowStatic(false); setIsPowered(true); }, 500);
    }
    stopNoise();
    setVolume(0);
  }, [isPowered, stopNoise]);

  useEffect(() => () => { stopNoise(); }, [stopNoise]);

  if (!products || products.length === 0) return null;

  const product = products[activeIndex];
  const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
  const base = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
  const finalPrice = product.discountRate > 0 ? base * (1 - product.discountRate / 100) : base;
  const imgUrl = product.images?.[0]?.url;

  return (
    <section style={{ position:"relative", width:"100%", minHeight:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center", padding:"clamp(40px,7vh,80px) clamp(12px,3vw,40px)", overflow:"hidden", borderTop:"1px solid #111", borderBottom:"1px solid #111" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scanMove { from{background-position:0 0} to{background-position:0 300px} }
        @keyframes flicker {
          0%,100%{opacity:1} 3%{opacity:.97} 3.5%{opacity:1}
          34%{opacity:1} 34.2%{opacity:.91} 34.5%{opacity:1}
          67%{opacity:1} 67.1%{opacity:.88} 67.5%{opacity:1}
        }
        @keyframes staticAnim {
          0%{opacity:1;filter:brightness(4) contrast(1)}
          30%{opacity:.5;filter:brightness(.3)}
          60%{opacity:.9;filter:brightness(3)}
          100%{opacity:0;filter:brightness(1)}
        }
        @keyframes crt-marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes recBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes ledPulse {
          0%,100%{box-shadow:0 0 5px #0f0,0 0 10px rgba(0,220,0,.3)}
          50%{box-shadow:0 0 10px #0f0,0 0 22px rgba(0,220,0,.5)}
        }
        .tv-static { animation: staticAnim 400ms ease-out forwards; }
        .tv-scanlines {
          background: repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(0,0,0,.15) 2px, rgba(0,0,0,.15) 4px);
          animation: scanMove 9s linear infinite;
        }
        .tv-flicker { animation: flicker 8s steps(1) infinite; }
        /* ── ROCKER ── */
        .tv-rocker {
          display:flex; flex-direction:column;
          width:clamp(44px,5.8vw,62px);
          border-radius:12px; overflow:hidden;
          background:#020202;
          box-shadow:
            0 8px 20px rgba(0,0,0,.95),
            0 0 0 1px #000,
            0 0 0 2px rgba(255,255,255,.035);
          gap:2px;
          padding:3px;
        }
        .tv-rocker-half {
          flex:1; min-height:clamp(30px,4vh,46px);
          cursor:pointer; border:none;
          font-family:var(--font-dm-mono,monospace);
          color:#3a3a3a;
          display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
          transition:color .12s,filter .12s,box-shadow .12s; outline:none;
          position:relative;
        }
        .tv-rocker-half.top {
          background:linear-gradient(160deg,#2c2c2c 0%,#1a1a1a 40%,#131313 100%);
          box-shadow:
            inset 0 2px 0 rgba(255,255,255,.1),
            inset 0 -2px 3px rgba(0,0,0,.7),
            inset 2px 0 3px rgba(0,0,0,.3),
            0 2px 4px rgba(0,0,0,.5);
          border-radius:9px 9px 3px 3px;
        }
        .tv-rocker-half.bot {
          background:linear-gradient(200deg,#2c2c2c 0%,#1a1a1a 40%,#131313 100%);
          box-shadow:
            inset 0 -2px 0 rgba(255,255,255,.08),
            inset 0 2px 3px rgba(0,0,0,.7),
            inset 2px 0 3px rgba(0,0,0,.3),
            0 -1px 3px rgba(0,0,0,.4);
          border-radius:3px 3px 9px 9px;
        }
        .tv-rocker-half:hover { color:#aaa; filter:brightness(1.25); }
        .tv-rocker-half:active {
          filter:brightness(.55);
          box-shadow:inset 0 4px 10px rgba(0,0,0,.9) !important;
          transform:scale(.97);
        }
        .tv-rocker-half:disabled { opacity:.15; cursor:not-allowed; pointer-events:none; }
        .tv-rocker-icon { font-size:11px; line-height:1; }
        .tv-rocker-lbl { font-size:5px; letter-spacing:.2em; opacity:.4; text-transform:uppercase; }

        /* ── POWER LED ── */
        @keyframes ledGreen {
          0%,100%{box-shadow:0 0 4px #0f0,0 0 8px rgba(0,220,0,.4)}
          50%{box-shadow:0 0 8px #0f0,0 0 18px rgba(0,220,0,.6),0 0 26px rgba(0,220,0,.2)}
        }
        @keyframes ledRed {
          0%,100%{box-shadow:0 0 4px #f00,0 0 8px rgba(255,0,0,.4)}
          50%{box-shadow:0 0 8px #f44,0 0 18px rgba(255,60,60,.6),0 0 26px rgba(255,0,0,.2)}
        }
        .tv-power-led {
          width:8px; height:8px; border-radius:50%;
          transition:background .4s,box-shadow .4s;
        }
        .tv-power-led.on {
          background:radial-gradient(circle at 35% 35%,#5fff5f,#00cc00);
          animation:ledGreen 2.5s ease-in-out infinite;
        }
        .tv-power-led.off {
          background:radial-gradient(circle at 35% 35%,#ff5f5f,#cc0000);
          animation:ledRed 1.8s ease-in-out infinite;
        }

        /* ── TV BRAND BEZEL ── */
        .tv-brand-bezel {
          display:flex;
          align-items:center;
          justify-content:center;
          padding:clamp(5px,0.8vh,10px) 0 clamp(3px,0.5vh,6px);
        }
        .tv-brand-name {
          font-family:var(--font-syne,sans-serif);
          font-weight:800;
          font-size:clamp(8px,1.1vw,14px);
          letter-spacing:.35em;
          text-transform:uppercase;
          /* embossed metallic effect */
          color:transparent;
          background:linear-gradient(180deg,#2e2e2e 0%,#1a1a1a 40%,#252525 100%);
          -webkit-background-clip:text;
          background-clip:text;
          text-shadow:0 1px 0 rgba(255,255,255,.04);
          user-select:none;
          position:relative;
        }
        /* subtle separator lines either side of brand name */
        .tv-brand-name::before,
        .tv-brand-name::after {
          content:'';
          position:absolute;
          top:50%;
          width:clamp(16px,2.5vw,36px);
          height:1px;
          background:linear-gradient(to right,transparent,#1e1e1e);
        }
        .tv-brand-name::before { right:calc(100% + 6px); background:linear-gradient(to left,transparent,#1e1e1e); }
        .tv-brand-name::after  { left:calc(100% + 6px); }

        @media (max-width:640px) {
          .tv-brand-bezel { padding:4px 0 2px; }
          .tv-brand-name { font-size:clamp(7px,2.2vw,10px); letter-spacing:.25em; }
          .tv-brand-name::before,.tv-brand-name::after { width:10px; }
        }

        /* ── POWER BTN ── */
        .tv-power-wrap {
          display:flex; flex-direction:column; align-items:center; gap:5px;
        }

        /* tiny LED dot above the button */
        .tv-power-led {
          width:5px; height:5px; border-radius:50%;
          transition:background .4s, box-shadow .4s;
        }
        .tv-power-led.on {
          background:#22cc22;
          box-shadow:0 0 4px rgba(0,200,0,.7);
        }
        .tv-power-led.off {
          background:#cc2222;
          box-shadow:0 0 4px rgba(200,0,0,.6);
        }

        /* clean single-piece round button */
        .tv-power-ring { display:contents; }

        .tv-power-btn {
          width:clamp(36px,4.5vw,48px); height:clamp(36px,4.5vw,48px);
          border-radius:50%; border:none; cursor:pointer; outline:none;
          display:flex; align-items:center; justify-content:center;
          transition:transform .12s, box-shadow .12s, filter .15s;
          font-size:clamp(14px,1.8vw,19px);
          background:radial-gradient(circle at 40% 35%, #2e2e2e 0%, #181818 50%, #0c0c0c 100%);
          box-shadow:
            0 4px 12px rgba(0,0,0,.85),
            0 0 0 1px #080808,
            inset 0 2px 0 rgba(255,255,255,.09),
            inset 0 -2px 5px rgba(0,0,0,.75);
        }
        .tv-power-btn.on  { color:#1ecc1e; }
        .tv-power-btn.off { color:#cc2020; }
        .tv-power-btn:hover { filter:brightness(1.2); }
        .tv-power-btn:active {
          transform:scale(.91) translateY(2px);
          box-shadow:0 1px 4px rgba(0,0,0,.8),inset 0 3px 8px rgba(0,0,0,.9);
        }

        /* vol pip */
        .vol-pip { width:9px;height:3px;border-radius:2px;transition:all .25s; }
        .vol-pip.lit {
          background:linear-gradient(to right,#1a4a1a,#2a7a2a);
          box-shadow:0 0 5px rgba(0,200,0,.35);
        }
        .vol-pip.dim { background:#141414; }

        /* channel display */
        .ch-counter {
          font-family:var(--font-dm-mono,monospace);
          font-size:9px; letter-spacing:.14em; color:#303030;
          background:linear-gradient(to bottom,#060606,#030303);
          border:1px solid #111;
          padding:3px 8px;
          box-shadow:inset 0 2px 6px rgba(0,0,0,.9), 0 1px 0 rgba(255,255,255,.02);
        }
        /* ── RESPONSIVE ── */

        /* TV chassis — row on desktop, column on mobile */
        .tv-chassis {
          position:relative; z-index:10;
          display:flex; flex-direction:row; align-items:stretch;
          background:linear-gradient(145deg,#1c1c1c 0%,#0d0d0d 40%,#181818 70%,#0a0a0a 100%);
          border-radius:clamp(16px,3.5vw,48px);
          padding:clamp(10px,1.8vw,24px);
          box-shadow:0 0 0 1px rgba(255,255,255,.04),0 0 0 4px #060606,0 60px 120px -20px rgba(0,0,0,1),0 24px 50px rgba(0,0,0,.9),inset 0 2px 0 rgba(255,255,255,.06),inset 0 -3px 8px rgba(0,0,0,.8);
          gap:clamp(8px,1.5vw,20px);
          max-width:min(96vw,980px); width:100%;
        }

        /* Control panel — vertical column on desktop, horizontal row on mobile */
        .tv-ctrl-panel {
          display:flex; flex-direction:column;
          align-items:center; justify-content:space-between;
          padding:clamp(8px,1.5vw,20px) clamp(6px,1.2vw,14px);
          gap:clamp(10px,1.5vh,28px);
          background:linear-gradient(170deg,#161616 0%,#0e0e0e 50%,#0a0a0a 100%);
          border-radius:clamp(10px,1.8vw,24px);
          min-width:clamp(52px,6.5vw,80px);
          box-shadow:inset 1px 0 0 rgba(255,255,255,.03),inset -1px 0 0 rgba(0,0,0,.5);
        }

        /* Screen content inside CRT — row on desktop, column on mobile */
        .tv-screen-content {
          display:flex; flex-direction:row; height:100%;
        }
        .tv-screen-img {
          position:relative; width:55%; flex-shrink:0;
          overflow:hidden; background:#050505;
        }
        .tv-screen-info {
          flex:1; display:flex; flex-direction:column; justify-content:center;
          padding:clamp(8px,2.5vw,36px);
          background:linear-gradient(135deg,#020302 0%,#010101 100%);
          border-left:1px solid rgba(30,200,50,.03);
          gap:clamp(4px,1vh,14px); overflow:hidden; position:relative;
        }

        /* brand label — hidden on mobile to save space */
        .tv-brand-label { display:block; }

        @media (max-width:640px) {
          .tv-chassis {
            flex-direction:column;
            border-radius:clamp(12px,4vw,28px);
            padding:clamp(8px,3vw,14px);
            gap:clamp(6px,2.5vw,12px);
          }

          /* On mobile, control panel is a horizontal strip below the screen */
          .tv-ctrl-panel {
            flex-direction:row;
            min-width:unset; width:100%;
            padding:8px 12px;
            gap:0;
            justify-content:space-around;
            min-height:unset;
            border-radius:clamp(8px,3vw,16px);
            box-shadow:inset 0 1px 0 rgba(255,255,255,.03),inset 0 -1px 0 rgba(0,0,0,.5);
          }

          /* Hide brand label on mobile */
          .tv-brand-label { display:none; }

          /* Rockers become smaller horizontally */
          .tv-rocker {
            flex-direction:row;
            width:auto;
            height:clamp(36px,9vw,48px);
            border-radius:24px;
            padding:2px;
          }
          .tv-rocker-half { min-height:unset; min-width:clamp(32px,8vw,44px); }
          .tv-rocker-half.top { border-radius:22px 4px 4px 22px; box-shadow:inset 2px 0 0 rgba(255,255,255,.1),inset -1px 0 0 rgba(0,0,0,.6); }
          .tv-rocker-half.bot { border-radius:4px 22px 22px 4px; box-shadow:inset -2px 0 0 rgba(255,255,255,.08),inset 1px 0 0 rgba(0,0,0,.6); }
          .tv-rocker-lbl { display:none; }

          /* Vol pips become horizontal */
          .tv-vol-bar { flex-direction:row !important; }

          /* Power ring smaller on mobile */
          .tv-power-ring {
            width:clamp(44px,11vw,58px);
            height:clamp(44px,11vw,58px);
          }
          .tv-power-btn {
            width:clamp(30px,7.5vw,40px);
            height:clamp(30px,7.5vw,40px);
            font-size:clamp(13px,3.5vw,18px);
          }
          .ctrl-lbl { font-size:5px; letter-spacing:.14em; }
          .ch-counter { font-size:8px; padding:2px 5px; }

          /* Screen content stacks vertically on mobile */
          .tv-screen-content { flex-direction:column; }
          .tv-screen-img { width:100%; height:55%; }
          .tv-screen-info {
            border-left:none;
            border-top:1px solid rgba(30,200,50,.03);
            padding:clamp(6px,3vw,14px);
          }
        }

        @media (max-width:400px) {
          .tv-rocker-half { min-width:28px; }
          .tv-power-ring { width:40px; height:40px; }
          .tv-power-btn  { width:28px; height:28px; font-size:13px; }
        }
      `}} />

      {/* Room ambient glow */}
      <div style={{ position:"absolute", top:"15%", left:"50%", transform:"translateX(-50%)", width:"80vw", height:"60vh", background:"radial-gradient(ellipse 70% 60% at 50% 45%, rgba(40,200,70,0.055) 0%, transparent 70%)", filter:"blur(60px)", pointerEvents:"none", zIndex:1, opacity: isPowered ? 1 : 0, transition:"opacity 600ms" }} aria-hidden />

      {/* ── TV CHASSIS ── */}
      <div className="tv-chassis">

        {/* SCREEN SIDE */}
        <div style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column", gap:"0" }}>

          {/* inner bezel recess */}
          <div style={{
            background:"#020202",
            borderRadius:"clamp(12px,2vw,32px)",
            padding:"clamp(6px,1vw,14px)",
            boxShadow:"inset 0 4px 16px rgba(0,0,0,1), inset 0 0 0 1px #0a0a0a",
            flex:1,
          }}>
            {/* SCREEN */}
            <div style={{
              position:"relative",
              width:"100%",
              aspectRatio:"4/3",
              background:"#010101",
              borderRadius:"clamp(6px,1vw,14px)",
              overflow:"hidden",
              transform:"perspective(1000px) rotateX(1.8deg) scaleY(0.976)",
              transformStyle:"preserve-3d",
              boxShadow:"inset 0 0 80px rgba(0,0,0,.95), inset 0 0 0 1px rgba(255,255,255,.02)",
            }}>

              {/* ── SCREEN CONTENT ── */}
              {isPowered && !showStatic && (
                <div className="tv-flicker" style={{ position:"absolute", inset:0, zIndex:2 }}>
                  <Link href={`/products/${product.slug}`} style={{ display:"flex", height:"100%", textDecoration:"none" }}>
                    <div className="tv-screen-content" style={{ width:"100%" }}>
                      {/* Image */}
                      <div className="tv-screen-img">
                      {imgUrl ? (
                        <Image src={imgUrl} alt={product.name} fill priority sizes="45vw" style={{ objectFit:"cover", filter:"brightness(.72) contrast(1.2) saturate(.6) sepia(.08)" }} />
                      ) : (
                        <div style={{ width:"100%", height:"100%", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ color:"#1a1a1a", fontFamily:"monospace", fontSize:"10px" }}>NO SIGNAL</span>
                        </div>
                      )}
                        {/* image scanlines overlay */}
                        <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(to bottom,transparent 0,transparent 2px,rgba(0,0,0,.1) 2px,rgba(0,0,0,.1) 4px)", pointerEvents:"none", zIndex:3 }} />
                      </div>

                      {/* News / VTR Overlays */}
                      <div style={{
                        position: "absolute", top: "clamp(10px, 2vh, 16px)", left: "clamp(12px, 2vw, 20px)", right: "clamp(12px, 2vw, 20px)",
                        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                        pointerEvents: "none", zIndex: 4,
                        fontFamily: "var(--font-dm-mono, monospace)", fontSize: "clamp(10px, 1.2vw, 14px)",
                        color: "rgba(255, 255, 255, 0.8)", textShadow: "1px 1px 2px rgba(0,0,0,0.8)"
                      }}>
                        {/* Timestamp */}
                        {time && (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                            <span>{time.toLocaleTimeString('en-US', { hour12: false })}</span>
                            <span style={{ fontSize: "0.8em", opacity: 0.7 }}>VTR-0{activeIndex + 1}</span>
                          </div>
                        )}
                        {/* Station Logo & LIVE */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
                          <img src="/images/logo-sychogear.webp" alt="Station Logo" style={{ height: "clamp(30px, 4.5vw, 60px)", width: "auto", objectFit: "contain", opacity: 0.9, filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.8))" }} />
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "2px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#e53e3e", animation: "recBlink 1.5s infinite" }} />
                            <span style={{ fontWeight: 800, letterSpacing: ".1em", fontSize: "0.8em" }}>LIVE</span>
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="tv-screen-info">
                        <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(to bottom, transparent 0, transparent 3px, rgba(0,0,0,.07) 3px, rgba(0,0,0,.07) 4px)", pointerEvents:"none" }} />
                        <p style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(6px,1vw,8px)", letterSpacing:".28em", textTransform:"uppercase", color:"rgba(40,180,60,.5)", position:"relative" }}>
                          CH {String(activeIndex+1).padStart(2,"00")} — New Arrivals
                        </p>
                        <h2 style={{ fontFamily:"var(--font-syne,sans-serif)", fontWeight:800, fontSize:"clamp(10px,1.8vw,26px)", textTransform:"uppercase", letterSpacing:".02em", lineHeight:1.1, color:"#b8b4ac", position:"relative" }}>
                          {product.name}
                        </h2>
                        <div style={{ position:"relative", display:"flex", flexDirection:"column", gap:"2px" }}>
                          {isOnSale && product.salePrice && (
                            <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(7px,1vw,9px)", color:"#383830", textDecoration:"line-through" }}>{formatPrice(product.salePrice)}</span>
                          )}
                          <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(9px,1.4vw,16px)", color:"#7a6a4a" }}>{formatPrice(finalPrice)}</span>
                        </div>
                        <div style={{ position:"relative", display:"flex", flexWrap:"wrap", gap:"4px" }}>
                          {product.isNew && <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(5px,.8vw,6px)", letterSpacing:".2em", textTransform:"uppercase", padding:"2px 6px", border:"1px solid rgba(200,196,188,.2)", color:"#4a4840" }}>New</span>}
                          {isOnSale && <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(5px,.8vw,6px)", letterSpacing:".2em", textTransform:"uppercase", padding:"2px 6px", border:"1px solid rgba(200,169,110,.2)", color:"#5a4a28" }}>Sale</span>}
                          {product.category?.name && <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(5px,.8vw,6px)", letterSpacing:".2em", textTransform:"uppercase", padding:"2px 6px", border:"1px solid #1a1a1a", color:"#2a2a2a" }}>{product.category.name}</span>}
                        </div>
                        <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(6px,1vw,7px)", letterSpacing:".22em", textTransform:"uppercase", color:"#282820", borderBottom:"1px solid #1c1c1c", paddingBottom:"2px", width:"fit-content", position:"relative" }}>
                          View Product →
                        </span>
                      </div>
                    </div>
                  </Link>

                  {/* Marquee Ticker at bottom of screen */}
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "clamp(20px, 3.5vh, 32px)",
                    background: "rgba(0, 0, 0, 0.8)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    overflow: "hidden",
                    zIndex: 5, /* above the Link, below overlays */
                  }}>
                    <div style={{
                      display: "flex",
                      whiteSpace: "nowrap",
                      width: "max-content",
                      animation: "crt-marquee-scroll 20s linear infinite",
                      willChange: "transform",
                    }}>
                      {[...Array(6)].map((_, i) => (
                        <div key={i} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "clamp(12px, 2vw, 24px)",
                          padding: "0 clamp(6px, 1vw, 12px)",
                          fontFamily: "var(--font-dm-mono, monospace)",
                          fontSize: "clamp(8px, 1vw, 12px)",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color: "rgba(200, 200, 200, 0.9)",
                        }}>
                          <span style={{ color: "rgba(220, 40, 40, 0.9)", fontWeight: 800 }}>BREAKING</span>
                          <span>{marqueeText}</span>
                          <span style={{ color: "rgba(255, 255, 255, 0.4)" }}>|</span>
                          <span style={{ color: "rgba(40, 200, 40, 0.8)" }}>{product.category?.name || "ARCHIVE"} UPDATE</span>
                          <span style={{ color: "rgba(200, 30, 30, 0.8)" }}>■</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* OFF state */}
              {!isPowered && !showStatic && (
                <div style={{ position:"absolute", inset:0, zIndex:2, background:"#000", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ width:"3px", height:"3px", borderRadius:"50%", background:"rgba(255,255,255,.05)" }} />
                </div>
              )}

              {/* Static overlay */}
              {showStatic && (
                <div className="tv-static" style={{ position:"absolute", inset:0, zIndex:20,
                  background:"repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0,rgba(255,255,255,.05) 1px,transparent 1px,transparent 3px), repeating-linear-gradient(90deg,rgba(255,255,255,.03) 0,rgba(255,255,255,.03) 1px,transparent 1px,transparent 3px)",
                  backgroundColor:"rgba(200,200,200,.12)" }} />
              )}

              {/* Always-on screen overlays */}
              {/* Convex vignette */}
              <div style={{ position:"absolute", inset:0, zIndex:10, pointerEvents:"none", background:"radial-gradient(ellipse 90% 90% at 50% 50%, transparent 35%, rgba(0,0,0,.55) 75%, rgba(0,0,0,.9) 100%)" }} />
              {/* Scanlines */}
              <div className="tv-scanlines" style={{ position:"absolute", inset:0, zIndex:11, pointerEvents:"none" }} />
              {/* RGB dot mask */}
              <div style={{ position:"absolute", inset:0, zIndex:12, pointerEvents:"none", opacity:.07, background:"repeating-linear-gradient(90deg,rgba(255,0,0,.5) 0,rgba(255,0,0,.5) 1px,rgba(0,255,0,.5) 1px,rgba(0,255,0,.5) 2px,rgba(0,0,255,.5) 2px,rgba(0,0,255,.5) 3px)" }} />
              {/* Phosphor tint */}
              <div style={{ position:"absolute", inset:0, zIndex:13, pointerEvents:"none", background:"rgba(20,230,60,.012)", mixBlendMode:"screen" }} />
              {/* Glass glare */}
              <div style={{ position:"absolute", inset:0, zIndex:14, pointerEvents:"none", background:"linear-gradient(135deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.012) 20%,transparent 42%)" }} />
            </div>
          </div>

          {/* Brand logo on bottom bezel — like a real TV */}
          <div className="tv-brand-bezel">
            <span className="tv-brand-name">Sychogear TV</span>
          </div>
        </div>

        {/* ── CONTROL PANEL ── */}
        <div className="tv-ctrl-panel">

          {/* Brand — hidden on mobile */}
          <div className="tv-brand-label" style={{ writingMode:"vertical-rl", fontFamily:"var(--font-dm-mono,monospace)", fontSize:"5px", letterSpacing:".35em", textTransform:"uppercase", color:"#191919", userSelect:"none" }}>SYCHOGEAR</div>

          {/* CH rocker */}
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", alignItems:"center" }}>
            <span className="ctrl-lbl">CH</span>
            <div className="tv-rocker">
              <button className="tv-rocker-half top" onClick={() => switchChannel(-1)} disabled={isSwitching || !isPowered} aria-label="Previous channel">
                <span className="tv-rocker-icon">▲</span>
                <span className="tv-rocker-lbl">prev</span>
              </button>
              <button className="tv-rocker-half bot" onClick={() => switchChannel(1)} disabled={isSwitching || !isPowered} aria-label="Next channel">
                <span className="tv-rocker-icon">▼</span>
                <span className="tv-rocker-lbl">next</span>
              </button>
            </div>
            <div className="ch-counter">{String(activeIndex+1).padStart(2,"0")}</div>
          </div>

          {/* VOL rocker */}
          <div style={{ display:"flex", flexDirection:"column", gap:"8px", alignItems:"center" }}>
            <span className="ctrl-lbl">VOL</span>
            <div className="tv-rocker">
              <button className="tv-rocker-half top" onClick={() => changeVolume(1)} disabled={!isPowered} aria-label="Volume up">
                <span className="tv-rocker-icon">＋</span>
                <span className="tv-rocker-lbl">up</span>
              </button>
              <button className="tv-rocker-half bot" onClick={() => changeVolume(-1)} disabled={!isPowered} aria-label="Volume down">
                <span className="tv-rocker-icon">－</span>
                <span className="tv-rocker-lbl">dn</span>
              </button>
            </div>
            {/* 5-pip volume bar */}
            <div className="tv-vol-bar" style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
              {[4,3,2,1,0].map(i => (
                <div key={i} className={`vol-pip ${i < Math.ceil(volume/2) ? "lit" : "dim"}`} />
              ))}
            </div>
          </div>

          {/* Power */}
          <div className="tv-power-wrap">
            <span className="ctrl-lbl">PWR</span>
            <div className={`tv-power-led ${isPowered ? "on" : "off"}`} aria-hidden />
            <button
              className={`tv-power-btn ${isPowered ? "on" : "off"}`}
              onClick={togglePower}
              aria-label={isPowered ? "Power off" : "Power on"}
            >⏻</button>
          </div>
        </div>
      </div>
    </section>
  );
}
