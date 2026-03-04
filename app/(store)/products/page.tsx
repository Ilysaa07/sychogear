"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import ProductCard from "@/components/store/ProductCard";
import type { ProductWithRelations } from "@/types";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

import { Suspense } from "react";

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-main py-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const category = searchParams.get("category") || "";
  const size = searchParams.get("size") || "";
  const sort = searchParams.get("sort") || "latest";
  const page = Number(searchParams.get("page")) || 1;

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

  return (
    <div className="container-main pt-32 pb-12">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs tracking-[0.3em] uppercase text-brand-500 mb-2">
          Collection
        </p>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          All Products
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-10 pb-8 border-b border-white/5">
        {/* Size filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-500 uppercase tracking-wider">Size:</span>
          <div className="flex gap-1">
            {SIZES.map((s) => (
              <button
                key={s}
                onClick={() => updateFilter("size", size === s ? "" : s)}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                  size === s
                    ? "border-white bg-white text-black"
                    : "border-white/10 text-brand-400 hover:border-white/30"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-brand-500 uppercase tracking-wider">Sort:</span>
          <select
            value={sort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="bg-brand-900 border border-white/10 text-sm text-white px-3 py-1.5 outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card">
              <div className="aspect-[3/4] skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-3 skeleton w-1/2 rounded" />
                <div className="h-4 skeleton w-3/4 rounded" />
                <div className="h-4 skeleton w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-brand-400 text-sm mb-4">Tidak ada produk ditemukan.</p>
          <button
            onClick={() => router.push("/products")}
            className="btn-secondary text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateFilter("page", String(p))}
                  className={`w-10 h-10 flex items-center justify-center text-sm font-medium border transition-colors ${
                    page === p
                      ? "border-white bg-white text-black"
                      : "border-white/10 text-brand-400 hover:border-white/30"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
