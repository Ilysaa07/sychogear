"use client";

import { useEffect, useState, use } from "react";
import PreOrderForm from "../_components/PreOrderForm";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi";
import axios from "axios";

export default function EditPreOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPO = async () => {
      try {
        const res = await axios.get(`/api/admin/pre-orders/${resolvedParams.id}`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPO();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="p-8 text-center animate-pulse text-brand-500">Loading...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500">
        Pre-order not found. <Link href="/admin/pre-orders" className="underline text-white">Go back</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/pre-orders" className="text-sm text-brand-400 hover:text-white flex items-center mb-4 transition-colors">
          <HiArrowLeft className="mr-2" /> Back to Pre-Orders
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Pre-Order</h1>
        <p className="text-sm text-brand-500 mt-1">{(data as any).preOrderNumber}</p>
      </div>

      <PreOrderForm initialData={data} />
    </div>
  );
}
