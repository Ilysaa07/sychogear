"use client";

import { useState, MouseEvent } from "react";
import { useCartStore } from "@/stores/cart-store";
import { useUIStore } from "@/stores/ui-store";
import { useCurrency } from "@/components/store/CurrencyProvider";
import type { ProductWithRelations } from "@/types";
import Link from "next/link";
import toast from "react-hot-toast";

interface Props {
  product: ProductWithRelations;
}

export default function ProductDetailClient({ product }: Props) {
  const { formatPrice } = useCurrency();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [descOpen, setDescOpen] = useState(true);
  const [careOpen, setCareOpen] = useState(false);
  const [addPressed, setAddPressed] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const setCartOpen = useUIStore((s) => s.setCartDrawerOpen);

  const isOnSale = product.flashSale?.isActive && product.flashSale.salePrice;
  const displayPrice = isOnSale
    ? product.flashSale!.salePrice
    : product.salePrice || product.price;
  const finalPrice =
    product.discountRate > 0
      ? displayPrice * (1 - product.discountRate / 100)
      : displayPrice;
  const originalPrice =
    isOnSale || product.salePrice || product.discountRate > 0
      ? product.price
      : null;

  const selectedVariantData = product.variants.find(
    (v) => v.id === selectedVariant
  );
  const inStock = selectedVariantData ? selectedVariantData.stock > 0 : true;
  const maxQty = selectedVariantData?.stock ?? 10;

  /* ── Zoom handlers ──────────────────────────────────── */
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setIsZooming(true);
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: "scale(2.4)" });
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
    setZoomStyle({ transformOrigin: "center center", transform: "scale(1)" });
  };

  /* ── Add to cart ────────────────────────────────────── */
  const handleAddToCart = () => {
    if (!selectedVariant || !selectedVariantData) {
      toast.error("Select a size to continue.");
      return;
    }
    if (!inStock) {
      toast.error("This size is issued out.");
      return;
    }
    // Press animation
    setAddPressed(true);
    setTimeout(() => setAddPressed(false), 180);
    addItem({
      productId: product.id,
      variantId: selectedVariant,
      name: product.name,
      price: product.price,
      salePrice: isOnSale ? product.flashSale!.salePrice : product.salePrice,
      size: selectedVariantData.size,
      quantity,
      image: product.images[0]?.url || "",
      slug: product.slug,
      stock: selectedVariantData.stock,
      ppnRate: product.ppnRate || 0,
      pph23Rate: product.pph23Rate || 0,
      discountRate: product.discountRate || 0,
    });
    toast.success("Secured.");
    setCartOpen(true);
  };

  return (
    <div
      className="relative min-h-screen bg-void detail-atmosphere"
      style={{ paddingTop: "clamp(80px, 12vw, 120px)" }}
    >
      <div
        className="container-main"
        style={{
          paddingTop: "clamp(40px, 6vw, 80px)",
          paddingBottom: "clamp(60px, 10vw, 120px)",
        }}
      >
        {/* ─── Breadcrumb ─────────────────────────────────── */}
        <nav
          className="label-eyebrow flex items-center gap-2 mb-10"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-pale transition-colors duration-200">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/products" className="hover:text-pale transition-colors duration-200">
            Archive
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-pale truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* ─── Split layout ────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-16 lg:items-start">

          {/* ══ LEFT — Image Theater ══════════════════════════ */}
          <div className="w-full lg:w-[55%] flex flex-row-reverse gap-3">

            {/* Main image */}
            <div
              className="flex-1 overflow-hidden relative cursor-crosshair"
              style={{ aspectRatio: "3 / 4" }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              aria-label="Product image — hover to zoom"
            >
              <img
                src={product.images[selectedImage]?.url || "/placeholder.svg"}
                alt={product.name}
                style={{
                  ...zoomStyle,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: "grayscale(10%) brightness(0.92) contrast(1.05)",
                  transition: isZooming
                    ? "transform 80ms linear"
                    : "transform 500ms ease-out",
                  display: "block",
                }}
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                {product.isNew && (
                  <span className="badge badge-new">New</span>
                )}
                {isOnSale && (
                  <span className="badge badge-sale">Sale</span>
                )}
              </div>
            </div>

            {/* Thumbnail strip — vertical, on the left */}
            {product.images.length > 1 && (
              <div className="flex flex-col gap-2 hide-scrollbar overflow-y-auto" style={{ maxHeight: "600px" }}>
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className="flex-shrink-0 overflow-hidden transition-all duration-200"
                    style={{
                      width: "52px",
                      aspectRatio: "3 / 4",
                      borderLeft: selectedImage === i
                        ? "2px solid var(--signal)"
                        : "2px solid transparent",
                      opacity: selectedImage === i ? 1 : 0.45,
                    }}
                    aria-label={`View image ${i + 1}`}
                    aria-pressed={selectedImage === i}
                  >
                    <img
                      src={img.url}
                      alt={img.alt || product.name}
                      className="w-full h-full object-cover"
                      style={{ filter: "grayscale(20%)" }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ══ RIGHT — Product Manifesto ═════════════════════ */}
          <div
            className="w-full lg:w-[45%] lg:sticky"
            style={{ top: "clamp(100px, 14vw, 140px)" }}
          >
            {/* Category */}
            <p
              className="text-signal mb-3"
              style={{
                fontFamily: "var(--font-syne), system-ui, sans-serif",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              {product.category.name}
            </p>

            {/* Product name */}
            <h1
              className="font-display text-salt mb-6"
              style={{
                fontSize: "clamp(40px, 5vw, 68px)",
                lineHeight: 0.92,
              }}
            >
              {product.name}
            </h1>

            {/* Price zone */}
            <div className="flex items-baseline gap-3 mb-8">
              <span
                className="text-signal"
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "1.375rem",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                }}
              >
                {formatPrice(finalPrice)}
              </span>
              {originalPrice && (
                <span
                  className="text-ash line-through"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.875rem",
                  }}
                >
                  {formatPrice(originalPrice)}
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="section-divider mb-8" />

            {/* ── Size selector ─────────────────────────── */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <p className="label-syne">Size</p>
                <button className="btn-link text-[10px]">
                  Size Guide ↗
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant === variant.id;
                  const oos = variant.stock === 0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => !oos && setSelectedVariant(variant.id)}
                      disabled={oos}
                      aria-pressed={isSelected}
                      aria-disabled={oos}
                      className="transition-all duration-150"
                      style={{
                        position: "relative",
                        width: "52px",
                        height: "52px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-dm-mono), monospace",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        border: isSelected
                          ? "1px solid var(--signal)"
                          : oos
                          ? "1px solid var(--fog)"
                          : "1px solid var(--ember)",
                        color: isSelected
                          ? "var(--signal)"
                          : oos
                          ? "var(--fog)"
                          : "var(--ash)",
                        background: isSelected
                          ? "rgba(200, 169, 110, 0.1)"
                          : "transparent",
                        cursor: oos ? "not-allowed" : "pointer",
                        overflow: "hidden",
                      }}
                    >
                      {/* Diagonal slash for OOS */}
                      {oos && (
                        <span
                          aria-hidden="true"
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "repeating-linear-gradient(-45deg, var(--fog) 0px, var(--fog) 1px, transparent 1px, transparent 6px)",
                            opacity: 0.25,
                          }}
                        />
                      )}
                      {variant.size}
                    </button>
                  );
                })}
              </div>

              {/* Scarcity warning — only when stock ≤ 3 */}
              {selectedVariantData && selectedVariantData.stock > 0 && selectedVariantData.stock <= 3 && (
                <p
                  className="mt-3"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.625rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#8b1a1a",
                  }}
                >
                  LAST {selectedVariantData.stock} UNIT{selectedVariantData.stock > 1 ? "S" : ""} — SIZE {selectedVariantData.size}
                </p>
              )}
            </div>

            {/* ── Quantity ───────────────────────────────── */}
            <div className="mb-8">
              <p className="label-syne mb-4">Qty</p>
              <div
                className="inline-flex items-center gap-4"
                style={{
                  borderBottom: "1px solid var(--ember)",
                  paddingBottom: "8px",
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-ash hover:text-salt transition-colors duration-150 w-6 h-6 flex items-center justify-center"
                  aria-label="Decrease quantity"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "1rem",
                  }}
                >
                  −
                </button>
                <span
                  className="text-salt"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.875rem",
                    minWidth: "24px",
                    textAlign: "center",
                  }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(quantity + 1, maxQty))}
                  disabled={quantity >= maxQty}
                  className="text-ash hover:text-salt transition-colors duration-150 w-6 h-6 flex items-center justify-center disabled:opacity-25"
                  aria-label="Increase quantity"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "1rem",
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* ── CTA ───────────────────────────────────── */}
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant || !inStock}
              className="btn-primary w-full py-5 mb-3"
              id="add-to-cart-btn"
              style={{
                fontSize: "0.75rem",
                transform: addPressed ? "scale(0.97)" : "scale(1)",
                transition: "transform 120ms ease, background-color 250ms ease, color 250ms ease",
              }}
            >
              {!selectedVariant
                ? "SELECT A SIZE"
                : !inStock
                ? "ISSUED OUT"
                : "ADD TO KIT →"}
            </button>

            {/* ── Divider ───────────────────────────────── */}
            <div className="section-divider my-8" />

            {/* ── Info accordions ───────────────────────── */}
            {/* Description */}
            <div className="border-b border-ember">
              <button
                onClick={() => setDescOpen(!descOpen)}
                className="w-full flex items-center justify-between py-4 text-left group"
                aria-expanded={descOpen}
              >
                <p className="label-syne group-hover:text-pale transition-colors duration-150">
                  DETAILS
                </p>
                <span
                  className="text-ash transition-colors duration-150 group-hover:text-pale"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.875rem",
                    lineHeight: 1,
                  }}
                >
                  {descOpen ? "×" : "+"}
                </span>
              </button>
              {descOpen && (
                <div className="pb-6">
                  <p
                    className="text-pale"
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.8125rem",
                      lineHeight: 1.85,
                      letterSpacing: "0.03em",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {product.description}
                  </p>
                </div>
              )}
            </div>

            {/* Care & Material */}
            <div className="border-b border-ember">
              <button
                onClick={() => setCareOpen(!careOpen)}
                className="w-full flex items-center justify-between py-4 text-left group"
                aria-expanded={careOpen}
              >
                <p className="label-syne group-hover:text-pale transition-colors duration-150">
                  MATERIALS
                </p>
                <span
                  className="text-ash transition-colors duration-150 group-hover:text-pale"
                  style={{
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.875rem",
                    lineHeight: 1,
                  }}
                >
                  {careOpen ? "×" : "+"}
                </span>
              </button>
              {careOpen && (
                <div className="pb-6">
                  <p
                    className="text-pale"
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.8125rem",
                      lineHeight: 1.85,
                      letterSpacing: "0.03em",
                    }}
                  >
                    Machine wash cold. Tumble dry low.
                    <br />
                    Do not iron print. Do not dry clean.
                  </p>
                </div>
              )}
            </div>

            {/* Category + ID — low-key metadata */}
            <div className="mt-8 flex items-center gap-6">
              <p
                className="text-fog"
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "0.625rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Cat: {product.category.name}
              </p>
              <p
                className="text-fog"
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "0.625rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                Ref: {product.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
