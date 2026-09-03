import PreOrderForm from "../_components/PreOrderForm";
import Link from "next/link";
import { HiArrowLeft } from "react-icons/hi";

export default async function CreatePreOrderPage({ searchParams }: { searchParams: Promise<{ campaignId?: string }> }) {
  const resolvedParams = await searchParams;
  const campaignId = resolvedParams.campaignId;
  
  return (
    <div className="space-y-8">
      <div>
        <Link href={campaignId ? `/admin/pre-orders/campaigns/${campaignId}` : "/admin/pre-orders"} className="text-sm text-brand-400 hover:text-white flex items-center mb-4 transition-colors">
          <HiArrowLeft className="mr-2" /> Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create Pre-Order</h1>
        <p className="text-sm text-brand-500 mt-1">Add a new pre-order manually</p>
      </div>

      <PreOrderForm campaignId={campaignId} />
    </div>
  );
}
