"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import type { ProductWithRelations } from "@/types";
import ProductCard from "@/components/store/ProductCard";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const SORT_OPTIONS = [
  { value: "latest", label: "Newest First" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

export default function ProductsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sychogear.com";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Archive",
        item: `${baseUrl}/products`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen bg-void flex items-center justify-center pt-20">
            <p
              className="text-ash"
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.6875rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              Loading archive…
            </p>
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
    </>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOpen, setSortOpen] = useState(false);

  const category = searchParams.get("category") || "";
  const size = searchParams.get("size") || "";
  const sort = searchParams.get("sort") || "latest";
  const page = Number(searchParams.get("page")) || 1;

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label || "Newest First";

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (size) params.set("size", size);
        if (sort) params.set("sort", sort);
        params.set("page", String(page));

        const { data } = await axios.get(`/api/products?${params}`);
        if (data.success) {
          setProducts(data.data);
          setTotalPages(data.totalPages);
        }
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, size, sort, page]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/products?${params}`);
  };

  const hasActiveFilters = size || category;

  return (
    <div
      className="relative min-h-screen bg-void"
      style={{ paddingTop: "clamp(100px, 16vw, 160px)" }}
    >
      {/* ─── Page Header ──────────────────────────────── */}
      <header className="container-main mb-0 pb-10 border-b border-ember">
        {/* Breadcrumb */}
        <nav
          className="label-eyebrow mb-6 flex items-center gap-2"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-pale transition-colors duration-200">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-pale">
            {category ? category.replace(/-/g, " ") : "Archive"}
          </span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h1
            className="font-display text-salt"
            style={{
              fontSize: "clamp(52px, 9vw, 110px)",
              lineHeight: 0.9,
            }}
          >
            {category ? category.replace(/-/g, " ") : "The Archive"}
          </h1>
          <p
            className="text-ash flex-shrink-0 self-end"
            style={{
              fontFamily: "var(--font-dm-mono), monospace",
              fontSize: "0.6875rem",
              letterSpacing: "0.2em",
            }}
          >
            {loading ? "—" : `${products.length} pieces`}
          </p>
        </div>
      </header>

      {/* ─── Sticky Filter Bar ──────────────────────── */}
      <div
        className="sticky z-40 border-b border-ember"
        style={{
          top: "64px",
          background: "rgba(8,8,8,0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="container-main">
          <div className="flex items-center justify-between gap-6 py-4">

            {/* Size filters */}
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
              <span
                className="text-fog flex-shrink-0 mr-3"
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "0.625rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                Size
              </span>
              {SIZES.map((s) => {
                const isActive = size === s;
                return (
                  <button
                    key={s}
                    onClick={() => updateFilter("size", isActive ? "" : s)}
                    className="flex-shrink-0 transition-all duration-200"
                    style={{
                      fontFamily: "var(--font-dm-mono), monospace",
                      fontSize: "0.6875rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "4px 10px",
                      color: isActive ? "var(--salt)" : "var(--ash)",
                      borderBottom: isActive
                        ? "1px solid var(--signal)"
                        : "1px solid transparent",
                    }}
                    aria-pressed={isActive}
                  >
                    {s}
                  </button>
                );
              })}

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  onClick={() => router.push("/products")}
                  className="flex-shrink-0 ml-4 btn-link text-[10px]"
                  style={{ color: "var(--error)" }}
                >
                  Clear ×
                </button>
              )}
            </div>

            {/* Custom sort dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setSortOpen((o) => !o)}
                className="flex items-center gap-2 text-ash hover:text-salt transition-colors duration-200"
                style={{
                  fontFamily: "var(--font-dm-mono), monospace",
                  fontSize: "0.6875rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
                aria-expanded={sortOpen}
                aria-haspopup="listbox"
              >
                {activeSortLabel}
                <span
                  className="transition-transform duration-200"
                  style={{
                    display: "inline-block",
                    transform: sortOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ↓
                </span>
              </button>

              {sortOpen && (
                <>
                  {/* Click away to close */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSortOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2 z-50 py-2 min-w-[200px]"
                    role="listbox"
                    style={{
                      background: "var(--abyss)",
                      border: "1px solid var(--ember)",
                    }}
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        role="option"
                        aria-selected={sort === opt.value}
                        onClick={() => {
                          updateFilter("sort", opt.value);
                          setSortOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 transition-colors duration-150 hover:bg-dim"
                        style={{
                          fontFamily: "var(--font-dm-mono), monospace",
                          fontSize: "0.6875rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color:
                            sort === opt.value
                              ? "var(--signal)"
                              : "var(--ash)",
                        }}
                      >
                        {opt.value === sort && (
                          <span className="mr-2">✓</span>
                        )}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Product Grid ────────────────────────────── */}
      <div
        className="container-main"
        style={{ padding: "clamp(40px, 6vw, 80px) var(--container-pad)" }}
      >
        {loading ? (
          /* Skeleton grid */
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card" aria-hidden="true" />
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div
            className="flex flex-col items-center justify-center text-center py-32 border border-ember"
          >
            <p
              className="text-ash mb-3"
              style={{
                fontFamily: "var(--font-syne), system-ui, sans-serif",
                fontSize: "0.75rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Nothing found
            </p>
            <p
              className="text-fog mb-10"
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
              }}
            >
              Try adjusting your filters or browse the full archive.
            </p>
            <button
              onClick={() => router.push("/products")}
              className="btn-ghost py-3 px-8 text-xs"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* Products — 1px gap mosaic */
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns:
                "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
            }}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* ─── Pagination ────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-16">
            <span
              className="text-fog mr-4"
              style={{
                fontFamily: "var(--font-dm-mono), monospace",
                fontSize: "0.625rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              Page
            </span>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = page === p;
              return (
                <button
                  key={p}
                  onClick={() => updateFilter("page", String(p))}
                  className="transition-all duration-200"
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-dm-mono), monospace",
                    fontSize: "0.6875rem",
                    letterSpacing: "0.05em",
                    color: isActive ? "var(--salt)" : "var(--ash)",
                    borderBottom: isActive
                      ? "1px solid var(--signal)"
                      : "1px solid transparent",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
