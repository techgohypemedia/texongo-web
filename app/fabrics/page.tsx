import { Suspense } from "react";
import { FabricsCatalogClient } from "../../components/ui/fabrics-catalog-client";
import { getAllShopifyProducts } from "@/lib/shopify";

export const revalidate = 60; // Keep it fresh with 1 minute Incremental Static Regeneration

export default async function FabricsListingPage() {
  const fabrics = await getAllShopifyProducts();

  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading Fabrics Catalog...</span>
        </div>
      }>
        <FabricsCatalogClient initialFabrics={fabrics} />
      </Suspense>
    </main>
  );
}
