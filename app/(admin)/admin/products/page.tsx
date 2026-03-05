"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { uploadFileAction } from "@/app/actions/upload";
import { formatCurrency } from "@/lib/utils";
import type { ProductWithRelations } from "@/types";
import toast from "react-hot-toast";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineUpload,
  HiOutlinePhotograph,
} from "react-icons/hi";
import Link from "next/link";
import ConfirmModal from "@/components/admin/ConfirmModal";

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  salePrice: "",
  categoryId: "",
  variants: [{ size: "M", stock: "10" }],
  images: [{ url: "" }],
  featured: false,
  isNew: false,
  isActive: true,
  ppnRate: "0",
  pph23Rate: "0",
  discountRate: "0",
  showTaxDetails: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [uploadingImageIndices, setUploadingImageIndices] = useState<number[]>([]);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get("/api/categories");
      if (data.success) {
        setCategories(data.data);
      }
    } catch {
      toast.error("Failed to fetch categories");
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await axios.get("/api/products?limit=100");
      if (data.success) {
        setProducts(data.data);
      }
    } catch {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEditForm = (product: ProductWithRelations) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description,
      price: String(product.price),
      salePrice: product.salePrice ? String(product.salePrice) : "",
      categoryId: product.categoryId,
      variants: product.variants.map((v) => ({
        size: v.size,
        stock: String(v.stock),
      })),
      images: product.images.length > 0
        ? product.images.map((img) => ({ url: img.url }))
        : [{ url: "" }],
      featured: product.featured,
      isNew: product.isNew,
      isActive: product.isActive,
      ppnRate: String(product.ppnRate || 0),
      pph23Rate: String(product.pph23Rate || 0),
      discountRate: String(product.discountRate || 0),
      showTaxDetails: product.showTaxDetails || false,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        variants: formData.variants.map((v) => ({
          size: v.size,
          stock: Number(v.stock),
        })),
        images: formData.images.filter((i) => i.url),
        ppnRate: Number(formData.ppnRate),
        pph23Rate: Number(formData.pph23Rate),
        discountRate: Number(formData.discountRate),
        showTaxDetails: formData.showTaxDetails,
      };

      if (editingId) {
        const { data } = await axios.put(`/api/products/${editingId}`, payload);
        if (data.success) {
          toast.success("Product updated!");
          closeForm();
          fetchProducts();
        }
      } else {
        const { data } = await axios.post("/api/products", payload);
        if (data.success) {
          toast.success("Product created!");
          closeForm();
          fetchProducts();
        }
      }
    } catch {
      toast.error(editingId ? "Failed to update product" : "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteProductId) return;
    try {
      await axios.delete(`/api/products/${deleteProductId}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleteProductId(null);
    }
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { size: "", stock: "0" }],
    });
  };

  const removeVariant = (index: number) => {
    if (formData.variants.length <= 1) return;
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const addImageField = () => {
    setFormData({
      ...formData,
      images: [...formData.images, { url: "" }],
    });
  };

  const removeImageField = (index: number) => {
    if (formData.images.length <= 1) return;
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageIndices((prev) => [...prev, index]);
    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      const result = await uploadFileAction(formDataObj);

      if (result.success && result.url) {
        setFormData((prev) => {
          const newImages = [...prev.images];
          newImages[index].url = result.url as string;
          return { ...prev, images: newImages };
        });
        toast.success("Image uploaded!");
      } else {
        toast.error(result.error || "Failed to upload image");
      }
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImageIndices((prev) => prev.filter((i) => i !== index));
      // Reset the file input so the same file can be selected again if needed
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-brand-500 mt-1">
            {products.length} products total
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="btn-primary text-sm self-start sm:self-auto"
        >
          <HiOutlinePlus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">
              {editingId ? "Edit Product" : "New Product"}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="p-1 text-brand-400 hover:text-white transition-colors"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Product Name
              </label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Product name"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="input-field"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Price (IDR)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="input-field"
                placeholder="299000"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Sale Price (IDR) — optional
              </label>
              <input
                type="number"
                value={formData.salePrice}
                onChange={(e) =>
                  setFormData({ ...formData, salePrice: e.target.value })
                }
                className="input-field"
                placeholder="249000"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                PPN (%)
              </label>
              <input
                type="number"
                value={formData.ppnRate}
                onChange={(e) => setFormData({ ...formData, ppnRate: e.target.value })}
                className="input-field"
                placeholder="11"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                PPH 23 (%)
              </label>
              <input
                type="number"
                value={formData.pph23Rate}
                onChange={(e) => setFormData({ ...formData, pph23Rate: e.target.value })}
                className="input-field"
                placeholder="2"
              />
            </div>
            <div>
              <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
                Product Discount (%)
              </label>
              <input
                type="number"
                value={formData.discountRate}
                onChange={(e) => setFormData({ ...formData, discountRate: e.target.value })}
                className="input-field"
                placeholder="10"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-brand-400 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-field min-h-[100px] resize-none"
              placeholder="Product description"
              required
            />
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-brand-400 uppercase tracking-wider">
                Size Variants
              </label>
              <button
                type="button"
                onClick={addVariant}
                className="text-xs text-brand-400 hover:text-white"
              >
                + Add Size
              </button>
            </div>
            <div className="space-y-2">
              {formData.variants.map((variant, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={variant.size}
                    onChange={(e) => {
                      const variants = [...formData.variants];
                      variants[i].size = e.target.value;
                      setFormData({ ...formData, variants });
                    }}
                    className="input-field w-24"
                    placeholder="Size"
                  />
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => {
                      const variants = [...formData.variants];
                      variants[i].stock = e.target.value;
                      setFormData({ ...formData, variants });
                    }}
                    className="input-field w-24"
                    placeholder="Stock"
                  />
                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="p-1 text-brand-500 hover:text-red-400 transition-colors"
                    >
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-brand-400 uppercase tracking-wider flex items-center gap-2">
                <HiOutlinePhotograph className="w-4 h-4" />
                Product Images
              </label>
              <button
                type="button"
                onClick={addImageField}
                className="text-xs text-brand-400 hover:text-white transition-colors"
              >
                + Add Image Slot
              </button>
            </div>
            
            <div className="space-y-4 bg-white/[0.02] p-4 rounded-lg border border-white/5">
              {formData.images.map((img, i) => {
                const isUploading = uploadingImageIndices.includes(i);
                
                return (
                  <div key={i} className="flex gap-4 items-start bg-brand-950 p-3 rounded border border-white/10">
                    {/* Image Preview Thumbnail */}
                    <div className="w-20 h-24 bg-brand-900 rounded overflow-hidden flex-shrink-0 border border-white/5 flex items-center justify-center relative shadow-inner">
                      {img.url ? (
                        <img src={img.url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                      ) : (
                        <HiOutlinePhotograph className="w-6 h-6 text-brand-600" />
                      )}
                      
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex gap-2 items-center">
                        <input
                          value={img.url}
                          onChange={(e) => {
                            const images = [...formData.images];
                            images[i].url = e.target.value;
                            setFormData({ ...formData, images });
                          }}
                          className="input-field flex-1 text-sm font-mono"
                          placeholder="https://... or click upload"
                          disabled={isUploading}
                        />
                        
                        {/* Remove Button */}
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(i)}
                            className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors"
                            title="Remove image field"
                            disabled={isUploading}
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Upload Local File Button */}
                      <div>
                        <label className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded ${isUploading ? 'bg-brand-800 text-brand-500 cursor-not-allowed' : 'bg-brand-800 text-brand-300 hover:bg-brand-700 hover:text-white cursor-pointer'} transition-colors`}>
                          <HiOutlineUpload className="w-4 h-4" />
                          {isUploading ? "Uploading..." : "Upload File"}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(i, e)}
                            disabled={isUploading}
                          />
                        </label>
                        <span className="ml-3 text-[10px] text-brand-500 hidden sm:inline-block">Maximum size 5MB. JPG, PNG recommended.</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) =>
                  setFormData({ ...formData, featured: e.target.checked })
                }
                className="w-4 h-4 rounded border-white/20 bg-brand-900 text-red-600 focus:ring-red-600 focus:ring-offset-brand-950"
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) =>
                  setFormData({ ...formData, isNew: e.target.checked })
                }
                className="w-4 h-4 rounded border-white/20 bg-brand-900 text-red-600 focus:ring-red-600 focus:ring-offset-brand-950"
              />
              New Arrival
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded border-white/20 bg-brand-900 text-red-600 focus:ring-red-600 focus:ring-offset-brand-950"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showTaxDetails}
                onChange={(e) =>
                  setFormData({ ...formData, showTaxDetails: e.target.checked })
                }
                className="w-4 h-4 rounded border-white/20 bg-brand-900 text-red-600 focus:ring-red-600 focus:ring-offset-brand-950"
              />
              Show Tax Details on Invoice
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary text-sm"
            >
              {submitting
                ? "Saving..."
                : editingId
                ? "Update Product"
                : "Create Product"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">
                  Product
                </th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">
                  Price
                </th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">
                  Stock
                </th>
                <th className="text-left text-xs text-brand-500 uppercase tracking-wider p-4">
                  Status
                </th>
                <th className="text-right text-xs text-brand-500 uppercase tracking-wider p-4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-4"><div className="h-4 skeleton w-40 rounded" /></td>
                    <td className="p-4"><div className="h-4 skeleton w-20 rounded" /></td>
                    <td className="p-4"><div className="h-4 skeleton w-12 rounded" /></td>
                    <td className="p-4"><div className="h-4 skeleton w-16 rounded" /></td>
                    <td className="p-4"><div className="h-4 skeleton w-20 rounded" /></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-brand-500 text-sm">
                    No products yet. Create your first product!
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const totalStock = product.variants.reduce(
                    (sum, v) => sum + v.stock,
                    0
                  );
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-white/5 hover:bg-white/[.02] transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-brand-900 flex-shrink-0 overflow-hidden">
                            {product.images[0] && (
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-brand-500">
                              {product.category.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm">{formatCurrency(product.price)}</p>
                          {product.salePrice && (
                            <p className="text-xs text-green-400">
                              {formatCurrency(product.salePrice)}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{totalStock}</td>
                      <td className="p-4">
                        <span
                          className={`badge text-[10px] ${
                            product.isActive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="p-2 text-brand-400 hover:text-white transition-colors"
                            title="View"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => openEditForm(product)}
                            className="p-2 text-brand-400 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <HiOutlinePencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteProductId(product.id)}
                            className="p-2 text-brand-400 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteProductId}
        onClose={() => setDeleteProductId(null)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message="Are you sure you want to permanently delete this product? All variants and sizes will be lost. This action cannot be undone."
        confirmText="Delete Product"
        isDestructive={true}
      />
    </div>
  );
}
