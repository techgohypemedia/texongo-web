"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ShoppingBag, ArrowLeft, Heart, Share2, Minus, Plus, Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import { Fabric, mapShopifyProduct } from "@/lib/shopify";

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Fabric | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Fabric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");

  // Update active image and SEO metadata when product is loaded
  useEffect(() => {
    if (product?.image) {
      setActiveImage(product.image);
    }
    // Update browser title and meta description for SEO
    if (product?.seoTitle) {
      document.title = `${product.seoTitle} | Texongo`;
    } else if (product?.name) {
      document.title = `${product.name} | Texongo`;
    }

    if (product?.seoDescription) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', product.seoDescription);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = product.seoDescription;
        document.head.appendChild(meta);
      }
    }
  }, [product]);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const productRes = await fetch(`/api/shopify/products/${slug}`);
        if (!productRes.ok) {
          setError(true);
          setLoading(false);
          return;
        }
        const productData = await productRes.json();
        setProduct(productData);

        // Fetch related products
        const relatedRes = await fetch('/api/shopify/products');
        const relatedData = await relatedRes.json();
        if (relatedData.data?.products?.edges) {
          let mapped = relatedData.data.products.edges
            .map(({ node }: any) => mapShopifyProduct(node))
            .filter((p: Fabric) => p.id !== slug);

          const currentKnitStyle = productData.knit_style?.toLowerCase() || '';
          if (currentKnitStyle && currentKnitStyle !== 'n/a') {
            const keywords = currentKnitStyle.split(' ').filter((k: string) => k.length > 2);
            if (keywords.length > 0) {
              const matchedProducts = mapped.filter((p: Fabric) => {
                const pKnitStyle = (p.knit_style || '').toLowerCase();
                return keywords.some((kw: string) => pKnitStyle.includes(kw));
              });
              const matchIds = new Set(matchedProducts.map((p: Fabric) => p.id));
              const otherProducts = mapped.filter((p: Fabric) => !matchIds.has(p.id));
              mapped = [...matchedProducts, ...otherProducts];
            }
          }

          setRelatedProducts(mapped.slice(0, 4));
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
        <Loader2 className="animate-spin text-gray-400" size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Fetching product details...</p>
      </div>
    );
  }

  if (error || !product) {
    notFound();
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      variantId: product.variantId,
      name: product.name,
      price: parseFloat(product.price || '0'),
      gsm: product.gsm,
      image: product.image
    }, quantity);
  };
  const liveQuantityText = typeof product.totalInventory === "number"
    ? `${product.totalInventory} KG AVAILABLE`
    : "CHECK AVAILABILITY";

  return (
    <main className="min-h-screen bg-white pb-16 pt-24 lg:pt-44 lg:pb-32">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          {/* Left Column: Image Gallery */}
          <div className="lg:sticky lg:top-36 h-fit space-y-4 lg:space-y-6">
            <div
              className="relative aspect-square w-[550px] max-w-full mx-auto bg-gray-50/30 overflow-hidden border border-gray-100 group cursor-crosshair"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                const img = e.currentTarget.querySelector('img') as HTMLImageElement;
                if (img) {
                  img.style.transformOrigin = `${x}% ${y}%`;
                }
              }}
            >
              {(activeImage || product.image) ? (
                <LoadingImage
                  src={activeImage || product.image}
                  alt={product.name}
                  fill
                  priority
                  quality={100}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.6]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400">No Image Available</span>
                </div>
              )}
              <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <div className="bg-white px-3 py-1.5 rounded-full shadow-xl border border-black/5 flex items-center justify-center">
                  <img
                    src="/logos/logo.png"
                    alt="Texongo"
                    className="h-4 w-auto object-contain mix-blend-multiply"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 max-w-[550px] mx-auto">
              {product.images?.filter(Boolean).map((imgUrl, i) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`aspect-square relative bg-gray-50 cursor-pointer border transition-all ${activeImage === imgUrl ? 'border-[#57AD43] ring-1 ring-[#57AD43]' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <LoadingImage
                    src={imgUrl}
                    alt={`${product.name} view ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const element = document.getElementById('related-products');
                if (element) {
                  const offset = 140; // height of sticky header + spacing
                  const bodyRect = document.body.getBoundingClientRect().top;
                  const elementRect = element.getBoundingClientRect().top;
                  const elementPosition = elementRect - bodyRect;
                  const offsetPosition = elementPosition - offset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                  });
                }
              }}
              className="w-full bg-[#57AD43] text-white py-4 lg:py-3 !text-[14px] lg:!text-[16px] font-bold uppercase tracking-widest hover:bg-[#489936] transition-colors"
            >
              View Possible Variations
            </button>
          </div>

          {/* Right Column: Product Details */}
          <div className="flex flex-col">
            <div className="space-y-2 mb-6">
              <p className="text-base font-bold text-black uppercase tracking-widest">SKU: {product.sku || "A1K15126"}</p>
              <h1 className="!text-[24px] font-bold uppercase text-[#121212] tracking-tight">{product.name}</h1>
            </div>

            {/* Specifications Table */}
            <div className="space-y-1 mb-8">
              <SpecRow label="FABRIC" value={product.fabric || "N/A"} />
              <SpecRow label="KNIT STYLE" value={product.knit_style || "N/A"} />
              <SpecRow label="CONTENT" value={product.content || product.composition || "N/A"} />
              <SpecRow label="GSM" value={product.gsm === "N/A" ? "N/A" : `${product.gsm} g/m²`} />
              <SpecRow label="WIDTH" value={product.width !== "N/A" ? `${product.width}` : "N/A"} />
              <SpecRow label="WIDTH TYPE" value={product.type || "N/A"} />
              <SpecRow label="SHADE" value={product.shade || "N/A"} />
              <SpecRow label="USAGE" value={product.usage || "N/A"} />
            </div>

            <div className="mb-8 p-6 bg-gray-50/50 border-y border-gray-100 flex items-baseline gap-2">
              <div className="flex items-end gap-2">
                <span className="text-2xl font-black tracking-tighter">₹{parseFloat(product.price || '0').toFixed(2)}</span>
                <span className="text-sm text-gray-500 font-bold mb-1">/ kg</span>
              </div>
            </div>

            <Link href="/shipping-and-return-policy" className="text-[11px] font-medium text-[#57AD43] underline underline-offset-4 mb-6 block hover:text-black transition-colors">
              Shipping calculated at checkout
            </Link>

            {/* Selection & Add to Cart */}
            <div className="flex flex-col gap-6 pt-6 border-t border-gray-100 mb-8">
              <div className="flex flex-row items-start gap-6 lg:gap-12">
                <div className="flex flex-col gap-2 w-full lg:w-auto">
                  <div className="text-[10px] font-bold text-black uppercase tracking-widest">
                    Live Quantity
                  </div>
                  <div className="h-12 flex items-center justify-center min-w-[160px] px-4 text-[11px] font-bold text-[#57AD43] uppercase tracking-widest border border-[#57AD43]/30 bg-[#57AD43]/5 whitespace-nowrap">
                    {liveQuantityText}
                  </div>
                </div>

                <div className="flex flex-col gap-2 w-full lg:w-auto">
                  <div className="text-[10px] font-bold text-black uppercase tracking-widest">
                    Quantity
                  </div>
                  <div className="flex items-center border border-gray-200 bg-white h-12 w-fit">
                    <button onClick={() => setQuantity(prev => Math.max(1, prev - 1))} className="w-12 h-full flex items-center justify-center hover:bg-gray-50 transition-colors border-r border-gray-200"><Minus size={14} /></button>
                    <input type="text" value={quantity} readOnly className="w-16 h-full text-center text-sm font-bold outline-none" />
                    <button onClick={() => setQuantity(prev => prev + 1)} className="w-12 h-full flex items-center justify-center hover:bg-gray-50 transition-colors border-l border-gray-200"><Plus size={14} /></button>
                  </div>
                </div>
              </div>

              <button onClick={handleAddToCart} className="w-full bg-[#121212] text-white h-14 flex items-center justify-center gap-3 !text-[14px] lg:!text-[16px] font-bold uppercase tracking-[0.2em] hover:bg-[#57AD43] transition-all duration-300 shadow-lg shadow-black/5 active:scale-[0.98]">
                <ShoppingBag size={15} /> Add to cart
              </button>
            </div>

            {/* Info accordions */}
            <div className="border-t border-gray-100 divide-y divide-gray-100 mb-8">
              <AccordionItem title="Description" content={product.description || "No description available."} defaultOpen />
              <AccordionItem title="Note" content={
                <ul className="space-y-2 list-disc ml-4">
                  <li><strong>COLOR:</strong> Please note that color difference on website may vary due to lighting and environmental factors.</li>
                  <li><strong>GSM Tolerance:</strong> ±5% variation up and down from specified GSM is standard in knitted fabrics and not a defect.</li>
                  <li><strong>Width Tolerance:</strong> ±5% variation up and down from specified width is standard in knitted fabrics and not a defect.</li>
                  <li><strong>Blends:</strong> Fabric compositions mentioned on our website are approximate and may vary , as not all fabrics undergo detailed composition testing.</li>
                </ul>
              } />
              <AccordionItem title="Queries" content={
                <div className="space-y-4">
                  <p className="text-gray-700 leading-loose">
                    For any queries regarding it or any bulk query, Feel free to connect with us at:
                    <br />
                    <a href="mailto:connect@texongo.com" className="inline-block mt-2 text-[#57AD43] font-black bg-[#57AD43]/10 px-3 py-1 rounded-md hover:bg-[#57AD43] hover:text-white transition-all duration-300">
                      connect@texongo.com
                    </a>
                    <br />
                    <span className="text-gray-400 font-bold mx-1">or</span>
                    <br />
                    <a href="tel:9310598498" className="inline-block mt-1 text-[#57AD43] font-black bg-[#57AD43]/10 px-3 py-1 rounded-md hover:bg-[#57AD43] hover:text-white transition-all duration-300">
                      9310598498
                    </a>
                    <span className="ml-3 text-gray-500 font-medium">( 11 AM to 6 PM IST )</span>
                  </p>
                </div>
              } />
              <AccordionItem title="Shipping Info" content={
                <span>
                  We offer delivery services across India. Shipping charges are calculated based on the total weight of the fabric and the delivery pincode. We also provide international shipping options. For complete details, please refer to our{" "}
                  <Link href="/shipping-and-return-policy" className="text-[#57AD43] font-bold underline hover:text-black transition-colors">
                    Shipping & Return Policy
                  </Link>.
                </span>
              } />
              <AccordionItem title="Care Info" content="Hand wash or dry clean preferred; machine wash on mild cycle. Test before full wash.
Minor GSM, width, and color variations may occur—acceptable as per industry standards." />
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div id="related-products" className="mt-12 lg:mt-32 scroll-mt-40">
          <h2 className="!text-[14px] lg:!text-[16px] font-bold uppercase tracking-tight mb-12 text-center">Related products</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((fabric) => (
              <Link key={fabric.id} href={`/fabrics/${fabric.id}`} className="group cursor-pointer">
                <div className="relative aspect-square mb-4 bg-gray-50 overflow-hidden border border-gray-100">
                  {fabric.image ? (
                    <Image src={fabric.image} alt={fabric.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest">No Image</div>
                  )}
                  <div className="absolute top-0 left-0 bg-[#57AD43] text-white text-[8px] font-black px-2 py-0.5 z-10">GSM: {fabric.gsm} g/m²</div>
                </div>
                <h3 className="!text-[10px] lg:!text-[14px] font-bold uppercase tracking-widest text-center group-hover:text-[#57AD43] transition-colors">{fabric.name}</h3>
                <p className="!text-[10px] lg:!text-[14px] font-bold text-gray-400 text-center mt-1">₹{fabric.price}.00 <span className="text-[10px] text-gray-400 font-medium normal-case tracking-normal">/ kg</span></p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function SpecRow({ label, value }: { label: string, value: string }) {
  const cleanedValue = value
    ? value
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .trim()
    : value;

  return (
    <div className="flex items-baseline gap-4 text-[11px] lg:text-[12px] leading-relaxed py-1.5 border-b border-gray-50 last:border-0">
      <span className="font-bold text-black min-w-[100px] uppercase tracking-wider shrink-0">{label}:</span>
      <span className="text-gray-600 font-medium">{cleanedValue}</span>
    </div>
  );
}

function AccordionItem({ title, content, defaultOpen = false }: { title: string, content: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left focus:outline-none"
      >
        <span className="text-xl font-bold text-gray-400">{isOpen ? "−" : "+"}</span>
        <span className="text-sm font-bold uppercase tracking-widest">{title}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 text-sm text-gray-800 leading-relaxed pl-6 whitespace-pre-line">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingImage({ src, alt, className, ...props }: any) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <>
      {(status === 'loading' || status === 'error') && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-0">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={`transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'} ${className || ''}`}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        {...props}
      />
    </>
  );
}
