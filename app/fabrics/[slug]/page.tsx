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
  const stock = typeof product.totalInventory === "number" ? product.totalInventory : undefined;

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
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-5">
              <Link href="/" className="hover:text-[#57AD43] transition-colors">Home</Link>
              <ChevronRight size={11} />
              <Link href="/fabrics" className="hover:text-[#57AD43] transition-colors">Fabrics</Link>
              {product.knit_style && product.knit_style !== "N/A" && (
                <>
                  <ChevronRight size={11} />
                  <Link
                    href={`/fabrics?category=${product.knit_style.toLowerCase().trim().replace(/\s+/g, "-")}`}
                    className="hover:text-[#57AD43] transition-colors"
                  >
                    {product.knit_style}
                  </Link>
                </>
              )}
            </nav>

            {/* Title */}
            <div className="mb-8">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 bg-gray-100 px-3 py-1 rounded-full mb-4">
                SKU: {product.sku || "N/A"}
              </span>
              <h1 className="text-2xl lg:!text-[32px] font-bold uppercase text-[#121212] tracking-tight leading-tight">{product.name}</h1>
              {product.gsm && product.gsm !== "N/A" && (
                <p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#57AD43]">
                  {product.gsm} GSM{product.knit_style && product.knit_style !== "N/A" ? ` · ${product.knit_style}` : ""}
                </p>
              )}
            </div>

            {/* Specifications */}
            <div className="mb-8">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-black mb-4">Specifications</h2>
              <div className="grid grid-cols-2 border-t border-l border-gray-100 rounded-xl overflow-hidden">
                <SpecCell label="Fabric" value={product.fabric} />
                <SpecCell label="Knit Style" value={product.knit_style} />
                <SpecCell label="Content" value={product.content || product.composition} />
                <SpecCell label="GSM" value={product.gsm && product.gsm !== "N/A" ? `${product.gsm} g/m²` : undefined} />
                <SpecCell label="Width" value={product.width} />
                <SpecCell label="Width Type" value={product.type} />
                <SpecCell label="Shade" value={product.shade} />
                <SpecCell label="Usage" value={product.usage} />
              </div>
            </div>

            {/* Purchase Box: price + live inventory + quantity + cart */}
            <div className="mb-10 rounded-2xl border border-gray-100 bg-gray-50/60 p-5 lg:p-7 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-4 pb-5 mb-5 border-b border-gray-200/70">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Price</span>
                  <div className="flex items-end gap-1.5">
                    <span className="text-3xl lg:text-4xl font-black tracking-tighter text-[#121212]">₹{parseFloat(product.price || '0').toFixed(2)}</span>
                    <span className="text-sm text-gray-500 font-bold mb-1">/ kg</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Live Inventory</span>
                  {typeof stock === "number" ? (
                    stock > 0 ? (
                      <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#57AD43] bg-[#57AD43]/10 border border-[#57AD43]/25 px-3.5 py-2 rounded-full">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-[#57AD43] opacity-60 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#57AD43]" />
                        </span>
                        {stock} kg available
                      </span>
                    ) : (
                      <span className="inline-flex text-xs font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 px-3.5 py-2 rounded-full">Out of stock</span>
                    )
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Check availability</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center justify-between border border-gray-200 bg-white h-14 rounded-xl overflow-hidden sm:w-[170px] shrink-0">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    className="w-12 h-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                  ><Minus size={14} /></button>
                  <div className="flex flex-col items-center leading-none">
                    <span className="text-base font-black">{quantity}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1">kg</span>
                  </div>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(prev => (typeof stock === "number" && stock > 0 ? Math.min(stock, prev + 1) : prev + 1))}
                    className="w-12 h-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                  ><Plus size={14} /></button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={stock === 0}
                  className="flex-1 bg-[#121212] text-white h-14 rounded-xl flex items-center justify-center gap-3 !text-[14px] font-bold uppercase tracking-[0.2em] hover:bg-[#57AD43] transition-all duration-300 shadow-lg shadow-black/10 active:scale-[0.98] disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={16} /> {stock === 0 ? "Out of stock" : "Add to cart"}
                </button>
              </div>

              <div className="flex items-center justify-between mt-4 text-[11px] font-medium">
                <span className="text-gray-500">
                  Total: <strong className="text-black">₹{(parseFloat(product.price || '0') * quantity).toFixed(2)}</strong>
                </span>
                <Link href="/shipping-and-return-policy" className="text-[#57AD43] underline underline-offset-4 hover:text-black transition-colors">
                  Shipping calculated at checkout
                </Link>
              </div>
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

function SpecCell({ label, value }: { label: string, value?: string }) {
  const cleanedValue = value && value !== "N/A"
    ? value.replace(/-/g, ' ').replace(/\s+/g, ' ').replace(/\s*,\s*/g, ', ').trim()
    : "—";

  return (
    <div className="flex flex-col gap-1 px-4 py-3.5 border-r border-b border-gray-100 bg-white">
      <span className="text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">{label}</span>
      <span className="text-[12px] lg:text-[13px] font-semibold text-[#121212] uppercase tracking-wide leading-snug">{cleanedValue}</span>
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
