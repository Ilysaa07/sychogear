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
  const [powerState, setPowerState] = useState<"off" | "turning_on" | "on" | "turning_off">("on");
  const [volume, setVolume] = useState(4);
  const [showOSD, setShowOSD] = useState(false);
  const [osdText, setOsdText] = useState("");

  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const osdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const displayOSD = useCallback((text: string, duration = 2000) => {
    setOsdText(text);
    setShowOSD(true);
    if (osdTimeoutRef.current) clearTimeout(osdTimeoutRef.current);
    osdTimeoutRef.current = setTimeout(() => setShowOSD(false), duration);
  }, []);

  const playClickSound = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    
    // Create a premium, mechanical "click" sound (sharp and tight)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "square";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.04);
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }, []);

  const startNoise = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
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
    playClickSound();
    if (powerState !== "on") return;
    const next = Math.max(0, Math.min(10, volume + dir));
    setVolume(next);
    displayOSD(`VOL ${"▮".repeat(next)}${"-".repeat(10-next)}`);
    if (next > 0) {
      if (!noiseRef.current) startNoise();
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(next * 0.02, audioCtxRef.current.currentTime, 0.1);
      }
    } else {
      stopNoise();
    }
  }, [powerState, volume, startNoise, stopNoise, displayOSD, playClickSound]);

  const switchChannel = useCallback((dir: 1 | -1) => {
    playClickSound();
    if (isSwitching || powerState !== "on") return;
    setIsSwitching(true);
    
    // Simulate static noise blip on channel change
    if (volume > 0) {
      if (!noiseRef.current) startNoise();
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(0.15, audioCtxRef.current.currentTime, 0.02);
      }
    }

    setTimeout(() => {
      setActiveIndex(prev => {
        const n = prev + dir;
        if (n < 0) return products.length - 1;
        if (n >= products.length) return 0;
        return n;
      });
    }, 250);
    
    setTimeout(() => {
      setIsSwitching(false);
      if (volume > 0 && gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(volume * 0.02, audioCtxRef.current.currentTime, 0.1);
      } else if (volume === 0) {
        stopNoise();
      }
      displayOSD(`CH ${String((activeIndex + dir + products.length) % products.length + 1).padStart(2,"0")}`, 3000);
    }, 600);
  }, [isSwitching, powerState, volume, products.length, startNoise, stopNoise, displayOSD, activeIndex, playClickSound]);

  const togglePower = useCallback(() => {
    playClickSound();
    if (powerState === "on" || powerState === "turning_on") {
      setPowerState("turning_off");
      setTimeout(() => setPowerState("off"), 600);
      stopNoise();
    } else {
      setPowerState("turning_on");
      if (volume > 0) {
        startNoise();
        if (gainRef.current && audioCtxRef.current) {
          gainRef.current.gain.setTargetAtTime(volume * 0.02, audioCtxRef.current.currentTime, 0.1);
        }
      }
      setTimeout(() => {
        setPowerState("on");
        displayOSD("LINE A: RGB", 3000);
      }, 1200);
    }
  }, [powerState, volume, stopNoise, startNoise, displayOSD, playClickSound]);

  useEffect(() => () => { stopNoise(); }, [stopNoise]);
  useEffect(() => { if (powerState === "on") displayOSD("LINE A: RGB", 3000); }, []);

  if (!products || products.length === 0) return null;

  const product = products[activeIndex];
  const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
  const base = isOnSale ? product.flashSale!.salePrice : product.salePrice || product.price;
  const finalPrice = product.discountRate > 0 ? base * (1 - product.discountRate / 100) : base;
  const imgUrl = product.images?.[0]?.url;

  return (
    <section style={{ position:"relative", width:"100%", minHeight:"100vh", background:"#050505", display:"flex", alignItems:"center", justifyContent:"center", padding:"clamp(20px, 4vw, 60px) clamp(10px, 2vw, 20px)", overflow:"hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        /* CRT Animations */
        @keyframes pvm-power-on {
          0% { transform: scale(0.001, 0.001); filter: brightness(20); opacity: 0; }
          10% { transform: scale(1, 0.001); filter: brightness(20); opacity: 1; box-shadow: 0 0 100px #fff; }
          30% { transform: scale(1, 0.005); filter: brightness(10); opacity: 1; box-shadow: 0 0 50px #fff; }
          60% { transform: scale(1, 1); filter: brightness(2) contrast(1.5); }
          100% { transform: scale(1, 1); filter: brightness(1) contrast(1); opacity: 1; box-shadow: none; }
        }

        @keyframes pvm-power-off {
          0% { transform: scale(1, 1); filter: brightness(1); opacity: 1; }
          30% { transform: scale(1, 0.005); filter: brightness(10); opacity: 1; }
          60% { transform: scale(0.001, 0.001); filter: brightness(10); opacity: 1; }
          99% { transform: scale(0, 0); opacity: 0; }
          100% { transform: scale(0, 0); opacity: 0; display: none; }
        }

        @keyframes scanline-drift { 0% { background-position: 0 0; } 100% { background-position: 0 100vh; } }

        @keyframes vsync-roll {
          0% { transform: translateY(0); filter: hue-rotate(0deg) saturate(1); }
          10% { transform: translateY(-5%); filter: hue-rotate(20deg) saturate(2); }
          40% { transform: translateY(100%); filter: hue-rotate(-20deg) saturate(0); }
          40.1% { transform: translateY(-100%); }
          60% { transform: translateY(5%); filter: hue-rotate(40deg) saturate(3); }
          100% { transform: translateY(0); filter: hue-rotate(0deg) saturate(1); }
        }

        @keyframes noise-jitter {
          0% { transform: translate(0,0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(2px, -2px); }
          60% { transform: translate(-3px, 0); }
          80% { transform: translate(2px, 3px); }
          100% { transform: translate(0, 0); }
        }

        @keyframes static-dance { 0% { background-position: 0 0; } 100% { background-position: 10px 10px; } }
        @keyframes crt-marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes recBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        /* PVM Chassis (Outer) */
        .pvm-casing-outer {
          position: relative;
          background: linear-gradient(180deg, #303030 0%, #1e1e1e 100%);
          border-radius: clamp(12px, 2.5vw, 24px);
          padding: clamp(12px, 2vw, 24px);
          box-shadow: 
            inset 0 2px 4px rgba(255,255,255,0.08),
            inset 0 -4px 12px rgba(0,0,0,0.8),
            0 40px 80px -10px rgba(0,0,0,0.9),
            0 10px 30px rgba(0,0,0,0.8),
            0 0 0 1px #050505;
          max-width: 900px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: clamp(12px, 2vw, 20px);
          z-index: 10;
        }

        /* Metallic Noise Texture */
        .pvm-casing-outer::before {
          content: ''; position: absolute; inset: 0;
          background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="0.05"/></svg>');
          pointer-events: none; border-radius: inherit; z-index: 1;
        }

        /* Screen Recess Bezel (Thick inner black border) */
        .pvm-screen-recess {
          background: #080808;
          border-radius: clamp(8px, 1.5vw, 16px);
          padding: clamp(12px, 2.5vw, 32px);
          box-shadow: 
            inset 0 8px 24px rgba(0,0,0,1),
            inset 0 0 0 2px #000,
            0 2px 3px rgba(255,255,255,0.08);
          position: relative;
          z-index: 2;
        }

        /* The CRT Screen Tube */
        .pvm-tube {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          background: #020202;
          border-radius: 50% / 4%;
          overflow: hidden;
          box-shadow: 
            inset 0 0 60px rgba(0,0,0,0.95),
            inset 0 0 10px rgba(255,255,255,0.03);
          transform: perspective(1000px) rotateX(1deg) scaleY(0.98);
        }
        
        .pvm-tube-curved-glass {
          position: absolute; inset: 0;
          border-radius: 50% / 4%;
          box-shadow: 
            inset 0 0 40px rgba(0,0,0,0.95),
            inset 0 0 0 2px rgba(255,255,255,0.02);
          background: 
            radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.8) 100%),
            linear-gradient(110deg, rgba(255,255,255,0.06) 0%, transparent 35%, rgba(255,255,255,0.01) 75%, transparent 100%);
          pointer-events: none; z-index: 50;
        }

        .pvm-crt-phosphor {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(90deg, rgba(255,0,0,0.07) 0, rgba(255,0,0,0.07) 1px, rgba(0,255,0,0.07) 1px, rgba(0,255,0,0.07) 2px, rgba(0,0,255,0.07) 2px, rgba(0,0,255,0.07) 3px);
          pointer-events: none; z-index: 40; mix-blend-mode: screen;
        }

        .pvm-scanlines {
          position: absolute; inset: 0;
          background: repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px);
          pointer-events: none; z-index: 41; animation: scanline-drift 20s linear infinite;
        }

        /* Content Area */
        .pvm-content-wrap { width: 100%; height: 100%; position: relative; background: #020202; }
        
        .power-turning_on .pvm-content-wrap { animation: pvm-power-on 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .power-turning_off .pvm-content-wrap { animation: pvm-power-off 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
        .power-off .pvm-content-wrap { opacity: 0; display: none; }

        .pvm-content-inner {
          width: 100%; height: 100%; display: flex; flex-direction: row; position: relative;
        }

        /* Responsive Screen Split */
        @media (max-width: 600px) {
          .pvm-content-inner { flex-direction: column; }
          .pvm-img-wrap, .pvm-info-wrap { flex: 1; border-left: none !important; border-top: 1px solid #1a1a1a; }
        }

        /* Switching Effects */
        .is-switching .pvm-content-inner {
          animation: vsync-roll 0.5s ease-in-out, noise-jitter 0.1s infinite;
          filter: contrast(1.6) brightness(1.3) sepia(0.3) hue-rotate(-15deg);
        }
        .tv-static-noise {
          position: absolute; inset: 0; z-index: 45; pointer-events: none;
          background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="6" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noise)" opacity="1"/></svg>');
          background-size: 100px 100px; mix-blend-mode: color-dodge; opacity: 0.6;
          animation: static-dance 0.1s steps(2) infinite;
        }

        /* Screen Elements */
        .pvm-img-wrap { flex: 1.2; position: relative; background: #050505; min-height: 50%; }
        .pvm-info-wrap {
          flex: 1; background: #010101; border-left: 2px solid #0a0a0a;
          padding: clamp(12px, 3vw, 32px); display: flex; flex-direction: column; justify-content: center; position: relative; overflow: hidden; min-height: 50%;
        }

        /* OSD */
        .pvm-osd {
          position: absolute; bottom: clamp(40px, 6vw, 60px); left: 50%; transform: translateX(-50%);
          color: #1aff1a;
          font-family: 'Courier New', Courier, monospace; font-size: clamp(20px, 3vw, 32px); font-weight: bold;
          text-shadow: 
            0 0 4px rgba(26,255,26,0.8), 
            0 0 12px rgba(26,255,26,0.6), 
            0 0 20px rgba(26,255,26,0.4),
            2px 2px 0 rgba(0,0,0,0.9); 
          z-index: 60; pointer-events: none;
          text-transform: uppercase; opacity: 0; transition: opacity 0.15s ease-out;
          text-align: center; white-space: nowrap;
          letter-spacing: 2px;
        }
        .pvm-osd.show { opacity: 1; }

        /* Control Panel (Bottom) */
        .pvm-control-panel {
          display: flex; justify-content: space-between; align-items: flex-end;
          padding: clamp(8px, 1.5vw, 16px) clamp(16px, 2.5vw, 32px); z-index: 2; position: relative;
          gap: 16px; flex-wrap: wrap;
        }

        .pvm-brand-area {
          display: flex; flex-direction: column; gap: 4px;
        }
        .pvm-brand-logo {
          font-family: 'Arial Black', sans-serif; font-size: clamp(16px, 2.5vw, 24px); letter-spacing: 0.2em;
          color: #b0b0b0; text-transform: uppercase;
          text-shadow: 0 -1px 0 rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.1);
        }
        .pvm-brand-model {
          font-family: 'Arial', sans-serif; font-size: clamp(10px, 1.2vw, 12px); letter-spacing: 0.1em;
          color: #666;
        }

        .pvm-controls-right {
          display: flex; gap: clamp(16px, 3vw, 32px); align-items: flex-end;
        }

        .pvm-btn-group { display: flex; align-items: center; gap: clamp(4px, 1vw, 8px); }
        .pvm-btn-group.column { flex-direction: column; gap: 4px; }
        
        .pvm-btn-label {
          font-family: var(--font-dm-mono, monospace); font-size: clamp(8px, 1vw, 10px); color: #888;
          letter-spacing: 1px; text-transform: uppercase; text-shadow: 0 -1px 0 rgba(0,0,0,0.8);
        }

        .pvm-btn {
          width: clamp(32px, 4.5vw, 44px); height: clamp(20px, 3vw, 28px); border-radius: 4px;
          background: linear-gradient(180deg, #444 0%, #2a2a2a 100%); border: none;
          box-shadow: 0 4px 6px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -1px 2px rgba(0,0,0,0.8);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: #999; font-size: clamp(12px, 1.5vw, 16px); transition: all 0.05s;
        }
        .pvm-btn:active {
          transform: translateY(2px); box-shadow: 0 1px 2px rgba(0,0,0,0.8), inset 0 2px 4px rgba(0,0,0,0.8); color: #fff; background: #222;
        }
        
        .pvm-power-btn {
          width: clamp(36px, 5vw, 48px); height: clamp(36px, 5vw, 48px); border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #444 0%, #1a1a1a 100%);
          box-shadow: 0 4px 8px rgba(0,0,0,0.9), inset 0 2px 2px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.8), 0 0 0 2px #0a0a0a;
        }

        /* LED */
        .pvm-led {
          width: 6px; height: 6px; border-radius: 50%; background: #333;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.8); margin-bottom: 8px; align-self: center;
        }
        .pvm-led.on { background: #0f0; box-shadow: 0 0 12px #0f0, inset 0 -2px 4px rgba(0,0,0,0.2); }
        .pvm-led.standby { background: #f00; box-shadow: 0 0 8px #f00, inset 0 -2px 4px rgba(0,0,0,0.2); }

        /* Ambient Glow */
        .pvm-ambient-glow {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 100vw; height: 100vh; background: radial-gradient(circle at 50% 50%, rgba(15, 255, 60, 0.04) 0%, transparent 60%);
          filter: blur(80px); pointer-events: none; z-index: 1; transition: opacity 1s; opacity: 0;
        }
        .pvm-ambient-glow.on { opacity: 1; }
      `}} />

      {/* Ambient Room Glow */}
      <div className={`pvm-ambient-glow ${powerState === "on" ? "on" : ""}`} />

      {/* Main Shell / Casing */}
      <div className="pvm-casing-outer">
        
        {/* Screen Area */}
        <div className="pvm-screen-recess">
          <div className="pvm-tube">
            
            <div className={`power-${powerState}`} style={{ width: '100%', height: '100%' }}>
              <div className="pvm-content-wrap">
                {/* OSD Overlay */}
                <div className={`pvm-osd ${showOSD ? "show" : ""}`}>{osdText}</div>

                <div className={`pvm-content-inner ${isSwitching ? "is-switching" : ""}`}>
                  
                  {isSwitching && <div className="tv-static-noise" />}

                  {/* Left (Top on Mobile): Image */}
                  <div className="pvm-img-wrap">
                    <Link href={`/products/${product.slug}`} style={{ display:"block", width:"100%", height:"100%" }}>
                      {imgUrl ? (
                        <Image src={imgUrl} alt={product.name} fill priority sizes="(max-width: 800px) 100vw, 50vw" style={{ objectFit:"cover", filter:"contrast(1.2) saturate(0.8) sepia(0.1)" }} />
                      ) : (
                        <div style={{ width:"100%", height:"100%", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ color:"#fff", fontFamily:"monospace" }}>NO SIGNAL</span>
                        </div>
                      )}
                    </Link>

                    {/* VTR PLAY Overlay */}
                    <div style={{ position: "absolute", top: "clamp(12px, 2vw, 20px)", left: "clamp(12px, 2vw, 20px)", display: "flex", alignItems: "center", gap: "8px", pointerEvents: "none", zIndex: 10 }}>
                      <span style={{ fontFamily: "var(--font-dm-mono, monospace)", color: "#0f0", fontSize: "clamp(16px, 2vw, 20px)", animation: "recBlink 1.5s steps(1) infinite", textShadow: "0 0 8px #0f0" }}>▶</span>
                      <span style={{ fontFamily: "var(--font-dm-mono, monospace)", color: "#0f0", fontWeight: "bold", letterSpacing: "4px", fontSize: "clamp(10px, 1.5vw, 14px)", animation: "recBlink 1.5s steps(1) infinite", textShadow: "0 0 8px #0f0" }}>PLAY</span>
                    </div>

                    {/* Station Logo Overlay */}
                    <div style={{ position: "absolute", top: "clamp(12px, 2vw, 16px)", right: "clamp(12px, 2vw, 20px)", pointerEvents: "none", zIndex: 10 }}>
                      <img src="/images/logo-sychogear.webp" alt="Station Logo" style={{ height: "clamp(24px, 3.5vw, 40px)", width: "auto", objectFit: "contain", filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.8)) invert(1)" }} />
                    </div>
                  </div>

                  {/* Right (Bottom on Mobile): Info & News Ticker */}
                  <div className="pvm-info-wrap">
                    <div style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(to bottom, transparent 0, transparent 3px, rgba(0,0,0,.1) 3px, rgba(0,0,0,.1) 4px)", pointerEvents:"none" }} />
                    
                    <p style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(10px, 1.2vw, 14px)", letterSpacing:".3em", color:"#0f0", marginBottom:"8px", textShadow:"0 0 5px rgba(0,255,0,0.5)" }}>
                      CH {String(activeIndex+1).padStart(2,"00")} / ARCHIVE
                    </p>
                    
                    <h2 style={{ fontFamily:"var(--font-syne,sans-serif)", fontWeight:900, fontSize:"clamp(20px, 3.5vw, 42px)", textTransform:"uppercase", lineHeight:0.9, color:"#fff", marginBottom:"16px", textShadow:"2px 2px 0 #000" }}>
                      {product.name}
                    </h2>
                    
                    <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"24px" }}>
                      {isOnSale && product.salePrice && (
                        <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(12px, 1.5vw, 18px)", color:"#ff3333", textDecoration:"line-through" }}>{formatPrice(product.salePrice)}</span>
                      )}
                      <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"clamp(18px, 2.5vw, 28px)", color:"#fff", fontWeight:"bold" }}>{formatPrice(finalPrice)}</span>
                    </div>

                    <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"32px" }}>
                      {product.isNew && <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"10px", padding:"4px 8px", background:"#fff", color:"#000", fontWeight:"bold" }}>NEW</span>}
                      {isOnSale && <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"10px", padding:"4px 8px", background:"#ff3333", color:"#fff", fontWeight:"bold" }}>SALE</span>}
                      {product.category?.name && <span style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"10px", padding:"4px 8px", border:"1px solid #fff", color:"#fff" }}>{product.category.name}</span>}
                    </div>

                    <Link href={`/products/${product.slug}`} style={{ fontFamily:"var(--font-dm-mono,monospace)", fontSize:"12px", letterSpacing:".2em", color:"#fff", borderBottom:"1px solid #fff", paddingBottom:"4px", width:"fit-content", textDecoration:"none", zIndex: 20 }}>
                      ACCESS ITEM [ENTER]
                    </Link>

                  </div>
                </div>

                {/* News Ticker - Full Width */}
                <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", background: "#ff3333", color: "#fff", padding: "8px 0", overflow: "hidden", display: "flex", alignItems: "center", borderTop: "2px solid #000", zIndex: 55 }}>
                  <div style={{ display: "flex", whiteSpace: "nowrap", animation: "crt-marquee-scroll 15s linear infinite" }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "24px", padding: "0 24px", fontFamily: "var(--font-dm-mono, monospace)", fontSize: "12px", fontWeight: "bold", letterSpacing: "1px" }}>
                        <span style={{ color: "#000" }}>BREAKING</span>
                        <span>{marqueeText}</span>
                        <span style={{ color: "#000" }}>■</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Always-on CRT Hardware Overlays */}
            <div className="pvm-crt-phosphor" />
            <div className="pvm-scanlines" />
            <div className="pvm-tube-curved-glass" />
          </div>
        </div>

        {/* Bottom Control Panel */}
        <div className="pvm-control-panel">
          
          <div className="pvm-brand-area">
            <span className="pvm-brand-logo">SYCHOGEAR</span>
            <span className="pvm-brand-model">MULTIFORMAT MONITOR PVM-20M4U</span>
          </div>
          
          <div className="pvm-controls-right">
            
            <div className="pvm-btn-group column">
              <span className="pvm-btn-label">CH</span>
              <div className="pvm-btn-group">
                <button className="pvm-btn" onClick={() => switchChannel(1)} aria-label="Channel Up">▲</button>
                <button className="pvm-btn" onClick={() => switchChannel(-1)} aria-label="Channel Down">▼</button>
              </div>
            </div>

            <div className="pvm-btn-group column">
              <span className="pvm-btn-label">VOL</span>
              <div className="pvm-btn-group">
                <button className="pvm-btn" onClick={() => changeVolume(1)} aria-label="Volume Up">＋</button>
                <button className="pvm-btn" onClick={() => changeVolume(-1)} aria-label="Volume Down">－</button>
              </div>
            </div>

            <div className="pvm-btn-group column" style={{ marginLeft: "clamp(8px, 2vw, 16px)" }}>
              <div className={`pvm-led ${powerState === "on" ? "on" : "standby"}`} />
              <button className="pvm-btn pvm-power-btn" onClick={togglePower} aria-label="Power Toggle">⏻</button>
              <span className="pvm-btn-label" style={{ marginTop: "4px" }}>POWER</span>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}


