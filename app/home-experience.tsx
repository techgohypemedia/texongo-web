"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll } from "framer-motion";
import { ReactLenis } from "lenis/react";
import styles from "./page.module.css";
import { LazyVideo } from "./lazy-video";
import ScrollExpandMedia from "../components/ui/scroll-expansion-hero";
import { LazySection } from "../components/ui/lazy-section";
import type { Fabric, ShopifyCollectionListItem } from "../lib/shopify";

// Dynamic imports for performance (Separate files)
const CategorySlider = dynamic(() => import("./category-slider").then(mod => mod.CategorySlider), { ssr: false });
const FaqSection = dynamic(() => import("./faq-section").then(mod => mod.FaqSection), { ssr: false });
const ParallaxFeatureSection = dynamic(() => import("../components/ui/parallax-scroll-feature-section").then(mod => mod.ParallaxFeatureSection), { ssr: false });
const IntroAnimation = dynamic(() => import("../components/ui/scroll-morph-hero"), { ssr: false });
const BlendAnimation = dynamic(() => import("../components/ui/scroll-morph-hero").then(mod => mod.BlendAnimation), { ssr: false });




const marqueeProducts = [
  {
    name: "Cotton Spandex Interlock",
    price: "₹650",
    href: "/fabrics/cotton-spandex-interlock",
    image: "/arrivals/prod-cotton-spandex-interlock.png",
  },
  {
    name: "Cotton Indigo Terry",
    price: "₹999",
    href: "/fabrics/cotton-indigo-terry",
    image: "/arrivals/prod-cotton-indigo-terry.png",
  },
  {
    name: "Poly Viscose Spandex S/J",
    price: "₹700",
    href: "/fabrics",
    image: "/arrivals/prod-poly-viscose-spandex.png",
  },
  {
    name: "Nylon Spandex S/J",
    price: "₹799",
    href: "/fabrics",
    image: "/arrivals/prod-nylon-spandex.png",
  },
  {
    name: "Slub Melange Single Jersey",
    price: "₹600",
    href: "/fabrics",
    image: "/arrivals/prod-slub-melange.png",
  },
  {
    name: "Rib Fabric",
    price: "₹380",
    href: "/fabrics?category=rib",
    image: "/category/fabric-rib.png",
  },
  {
    name: "French Terry",
    price: "₹520",
    href: "/fabrics?category=french-terry",
    image: "/category/fabric-french-terry.png",
  },
  {
    name: "Waffle Knit",
    price: "₹440",
    href: "/fabrics?category=waffle",
    image: "/category/fabric-waffle.png",
  },
  {
    name: "Single Jersey",
    price: "₹395",
    href: "/fabrics?category=single-jersey",
    image: "/category/fabric-single-jersey.png",
  },
  {
    name: "Pique",
    price: "₹460",
    href: "/fabrics?category=pique",
    image: "/category/fabric-pique.png",
  },
];

const storyProducts = [
  {
    name: "Digital Drape",
    desc: "Visualize how fabrics drape digitally, bringing realistic flow, elegance, and style to every garment design effortlessly.",
    video: "https://cdn.shopify.com/videos/c/o/v/0a1bbae469b6414f8ad969bcc83c1399.mp4",
    alt: "Digital Drape",
    href: "#digital-drape",
  },
  {
    name: "Digital Fall",
    desc: "Experience digital fabric fall simulations, showcasing authentic movement, structure, and comfort across all fashion creations seamlessly.",
    video: "/video/7.mp4",
    alt: "Digital Fall",
    href: "#digital-fall",
  },
];



function MarqueeProductCard({
  name,
  price,
  href,
  image,
  index,
  gsm,
  category,
}: {
  name: string;
  price: string;
  href: string;
  image: string;
  index: number;
  gsm?: string;
  category?: string;
}) {
  const finalImage = image && image !== "" ? image : "";

  // Extract a plausible category from name if not provided
  const displayCategory = category || (name.toLowerCase().includes("jersey") ? "SINGLE JERSEY" : name.toLowerCase().includes("terry") ? "FRENCH TERRY" : name.toLowerCase().includes("rib") ? "RIB" : "PREMIUM");
  const displayPrice = price.includes('.') ? price : `${price}.00`;
  const displayGsm = gsm || "200";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.productCard} shrink-0 block group pb-4`}
      style={{ boxShadow: 'none', background: 'transparent', overflow: 'visible' }}
    >
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-xl transition-all duration-500 flex flex-col h-full w-full">
        <div className="aspect-square rounded-xl overflow-hidden mb-4 relative bg-[#F9FAFB]">
          {finalImage ? (
            <img
              src={finalImage}
              alt={name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-500 font-bold text-sm uppercase">
                No Image
            </div>
          )}
          <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-[#57AD43] text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md z-10">
            GSM: {displayGsm}
          </div>
        </div>
        <div className="text-center px-1 flex flex-col items-center flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#57AD43] mb-1.5 line-clamp-1">
            {displayCategory}
          </span>
          <p className="text-[14px] xl:text-[16px] font-black leading-tight text-black mb-1 line-clamp-2 lg:line-clamp-1 w-full text-center px-2">
            {name}
          </p>
          <p className="text-[14px] xl:text-[16px] font-black text-black mt-1">
            {displayPrice} <span className="text-[10px] text-gray-500 font-bold normal-case tracking-normal">/ kg</span>
          </p>
        </div>
      </div>
    </a>
  );
}

function StoryProductCard({
  name,
  desc,
  video,
  alt,
  href,
}: {
  name: string;
  desc: string;
  video: string;
  alt: string;
  href: string;
}) {
  return (
    <article className="flex flex-col items-center text-center">
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full max-w-[300px] relative aspect-square bg-transparent mb-8 flex items-center justify-center overflow-hidden shadow-none transform-gpu"
        style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
      >
        <LazyVideo
          src={video}
          aria-label={alt}
          threshold={0.01}
          className="absolute inset-0"
        />
      </Link>



      <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4 tracking-tight px-4">{name}</h3>
      <p className="text-[#121212]/80 text-sm font-medium max-w-sm mb-8 md:mb-10 leading-relaxed px-6">
        {desc}
      </p>

      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 bg-[#57AD43] text-white px-6 md:px-8 py-3 rounded-full font-bold text-xs md:text-sm tracking-wide shadow-md hover:bg-[#489935] transition-colors w-[80%] md:w-auto"
      >
        Shop Now
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16l4-4-4-4" /><path d="M8 12h8" /></svg>
      </Link>
    </article>
  );
}

function KnitStylesSection({ products, collections }: { products?: Fabric[], collections?: ShopifyCollectionListItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="relative h-[600vh] bg-white">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <IntroAnimation scrollProgress={scrollYProgress} products={products} collections={collections} />
      </div>
    </section>
  );
}

function BlendStylesSection({ products, collections }: { products?: Fabric[], collections?: ShopifyCollectionListItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="relative h-[600vh] bg-white">
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <BlendAnimation scrollProgress={scrollYProgress} products={products} collections={collections} />
      </div>
    </section>
  );
}


function SustainableBlendSection() {
  const baseLogos = [
    { name: "Banana Fiber", src: "/sustainable%20blends/Bana%20Fiber.png", href: "/fabrics?category=banana" },
    { name: "Supima", src: "/sustainable%20blends/Supima.jfif", href: "/fabrics?category=supima" },
    { name: "Lotus Fiber", src: "/sustainable%20blends/lotus%20fiber.jpg", href: "/fabrics?category=lotus" },
    { name: "Hemp", src: "/sustainable%20blends/Hemp.jfif", href: "/fabrics?category=hemp" },
    { name: "BCI Cotton", src: "/sustainable%20blends/BCI.png", href: "/fabrics?category=bci" },
  ];

  // Repeat the logos enough times to create a seamless infinite scroll effect
  const logos = [...baseLogos, ...baseLogos, ...baseLogos, ...baseLogos, ...baseLogos, ...baseLogos];

  return (
    <section className="py-12 md:py-16 bg-white border-b border-black/5 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 mb-8 md:mb-16 text-center">
        <h2 className="hp-heading text-[#111111]">Sustainable Brand</h2>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="-mx-6 lg:-mx-12 overflow-hidden">
          <div className={styles.marqueeViewport}>
            <div className={styles.productTrack} style={{ animationDuration: '35s' }}>
              {logos.map((logo, idx) => (
                <Link
                  key={idx}
                  href={logo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-[clamp(11rem,16vw,18rem)] shrink-0 group block"
                >
                  <div className="aspect-square relative flex items-center justify-center p-8 transition-all duration-700">
                    <img
                      src={logo.src || undefined}
                      alt={logo.name}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-1000"
                    />
                  </div>
                  <div className="text-center mt-2 pb-4">
                    <span className="text-sm font-bold uppercase tracking-wider text-black">{logo.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: "Kamal Singh", text: "I've ordered several times from Syndicate Cloth House Pvt. Ltd. and the durability never disappoints. Their dense, even stitches mean the fabric resists pilling and lasts a long time. It's affordable for the high quality you get.", sub: "1 review • 3 months ago", rating: 5 },
    { name: "Neeraj Kumar", text: "This mill have Wide range of designer fabrics and different types of textiles available and the owner Mr. Aman and his team shashank ji nature is very nice. Thank you for providing such reliable, high-quality fabrics.", sub: "5 reviews • 3 months ago", rating: 5 },
    { name: "Jeet Sharma", text: "The team was professional, responsive, and very helpful throughout the process. The quality of service exceeded my expectations, and everything was delivered on time. Highly recommended!", sub: "3 reviews • 3 months ago", rating: 5 },
    { name: "Daksh Sharma", text: "Excellent fabric quality and a very professional team. Syndicate Cloth House has a wide variety of knits with consistent quantity. Truly reliable and trusted.", sub: "1 review • 3 months ago", rating: 5 },
    { name: "Krish Arora", text: "Nice collection of knitted fabrics and textured structures. Jacquard quality was good. Overall a decent experience.", sub: "1 review • 3 months ago", rating: 4 },
    { name: "Alice", text: "Good range of single jersey, ribs, and French terry. Reliable supplier. Loved the pointelle and Jacquard fabrics—great texture and finish.", sub: "5 reviews • 2 months ago", rating: 5 },
    { name: "Jigisha Bhatia", text: "Texongo has a wide range of knitted and structured fabrics. Average experience overall.", sub: "8 reviews • 3 months ago", rating: 3.5 },
    { name: "Mamta Narula", text: "Nice variety in ribs, French terry, and other knitted fabrics. Excellent quality Jacquards and structured knits. Very consistent fabric.", sub: "1 review • 2 months ago", rating: 5 },
    { name: "Trending Abstracts", text: "Great quality knit fabrics and very reliable supplier. Consistent materials, fair pricing, & timely delivery. Highly recommended.", sub: "1 review • 2 months ago", rating: 5 },
    { name: "Pavni Manchanda", text: "Absolutely loved the fabric and the service they provided. The entire experience was smooth and delightful!", sub: "4 reviews • 3 months ago", rating: 5 },
    { name: "Neha", text: "Huge collections of basic to Novelty fabrics. Quality fabrics at this store. Staff is very supportive.", sub: "3 reviews • 3 months ago", rating: 5 },
    { name: "Urmila Vaid", text: "Excellent quality of textured knits fabric. Very consistent fabric.", sub: "1 review • 2 months ago", rating: 5 },
    { name: "Mithun Yadav", text: "Good supplier with amazing fabric qualities. Highly recommended.", sub: "3 reviews • 2 months ago", rating: 4.5 },
    { name: "Ansh", text: "Good fabric consistency and finishing across knits fabric. Liked it.", sub: "1 review • 2 months ago", rating: 5 },
    { name: "Punita", text: "I bought terry fabric from Texongo. Nice quality I received.", sub: "1 review • 3 months ago", rating: 4.5 },
    { name: "Premjit Sahoo", text: "Fabric quality achi or range bhi kafi achi h.", sub: "1 review • 3 months ago", rating: 4 },
    { name: "Seamless", text: "Best Fabric supplier in India. Little bit expensive but quality is so good it's definitely worth it.", sub: "1 review • 2 years ago", rating: 5 },
    { name: "Kanishka Soni", text: "I purchased their swatch box and was amazed by the idea. If you want to start in the fashion industry, their swatches really help select premium fabrics. Thank you Texongo!", sub: "7 reviews • 3 years ago", rating: 5 },
    { name: "Mansi Vaid", text: "Nice texture and finish in pointelle and Jacquard knits.", sub: "5 reviews • 2 months ago", rating: 5 },
    { name: "Mahaveer Verma", text: "Absolutely love the quality of fabrics! The selection is premium and the materials feel luxurious and durable.", sub: "1 review • 1 year ago", rating: 5 },
    { name: "Priyanshi Sharma", text: "Syndicate Cloth House is a dependable supplier for ribs and single jersey.", sub: "1 review • 2 months ago", rating: 5 },
    { name: "Nitin Baghel", text: "Sampling range is excellent though the place can get busy at times.", sub: "1 review • 3 months ago", rating: 4 }
  ];

  return (
    <section className="relative py-12 md:py-16 overflow-hidden bg-black text-white">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/fabric-bg-clean.png"
          alt="Testimonials Background"
          fill
          className="object-cover opacity-60 mix-blend-overlay grayscale-[30%]"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-12 text-center">
        <div className="mb-8">
          <h2 className="hp-heading mb-1.5 text-white">What Our Customers Say</h2>

          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-12 bg-white/30"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-white/80">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <div className="h-[1px] w-12 bg-white/30"></div>
          </div>
        </div>

        <div className="h-[500px] md:h-[750px] overflow-hidden relative mt-8 md:mt-12">
          {/* Top and Bottom Fades for a seamless look */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black to-transparent z-20 pointer-events-none"></div>
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 h-full">
            {[
              { items: testimonials.slice(0, 8), duration: 45 },
              { items: testimonials.slice(8, 15), duration: 60, reverse: true },
              { items: testimonials.slice(15), duration: 52 }
            ].map((column, colIdx) => (
              <div key={colIdx} className={`relative h-full overflow-hidden ${colIdx === 1 ? 'hidden md:block' : colIdx === 2 ? 'hidden lg:block' : ''}`}>
                <motion.div
                  className="flex flex-col gap-8"
                  animate={{ y: column.reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: column.duration,
                    ease: "linear"
                  }}
                >
                  {[...column.items, ...column.items].map((t, idx) => (
                    <div key={idx} className="break-inside-avoid bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 flex flex-col shadow-xl text-center">
                      <div className="flex justify-center gap-1 mb-6">
                        <svg width="0" height="0" className="absolute">
                          <defs>
                            <linearGradient id="halfStar">
                              <stop offset="50%" stopColor="#FFD700" />
                              <stop offset="50%" stopColor="#333" stopOpacity="1" />
                            </linearGradient>
                          </defs>
                        </svg>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                            fill={star <= t.rating ? "#FFD700" : (star - 0.5 === t.rating ? "url(#halfStar)" : "#333")}
                            stroke="none">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium italic">
                        "{t.text}"
                      </p>
                      <div className="mt-auto pt-6 border-t border-white/5">
                        <h4 className="font-bold text-base text-white tracking-wide">{t.name}</h4>
                        <p className="text-[9px] text-white/40 mt-1 uppercase tracking-[0.2em] font-bold">{t.sub}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeExperience({ products, blogs, newArrivals, collections }: { products?: Fabric[], blogs?: any[], newArrivals?: Fabric[], collections?: ShopifyCollectionListItem[] }) {
  const [scrolled, setScrolled] = useState(false);

  const uniqueProducts = useMemo(() => {
    if (!products) return [];
    const seenNames = new Set();
    const result = [];
    for (const p of products) {
      if (!seenNames.has(p.name)) {
        seenNames.add(p.name);
        result.push(p);
      }
    }
    return result;
  }, [products]);

  const heroImages = useMemo(() => {
    const heroCategories = ["Single Jersey", "French Terry", "Rib", "Waffle", "Pique"];
    const images = heroCategories.map(name => {
      const collectionHandle = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const collection = collections?.find(c => 
          c.title.toLowerCase() === name.toLowerCase() || 
          c.handle === collectionHandle
      );
      
      if (collection?.image && collection.image !== "") return collection.image;
      
      const product = products?.find(p => 
         p.knit_style?.toLowerCase() === name.toLowerCase() || 
         p.type?.toLowerCase() === name.toLowerCase() || 
         p.name?.toLowerCase().includes(name.toLowerCase())
      );
      if (product?.image && product.image !== "") return product.image;
      return "";
    }).filter(img => img !== "");
    
    // Ensure we have at least some images to prevent empty carousel breaking
    if (images.length === 0) {
      return [
        "/category/fabric-single-jersey.png",
        "/category/fabric-french-terry.png",
        "/category/fabric-rib.png",
        "/category/fabric-waffle.png",
        "/category/fabric-pique.png"
      ];
    }
    return images;
  }, [collections, products]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <ReactLenis root>
      <main className="homepage-container relative overflow-clip bg-[#F9FAFB] text-[#121212]">
        {/* ── HERO ─────────────────────────────────────────── */}
        <ScrollExpandMedia
          mediaType="video"
          mediaSrc="/Texongohomepagevideo.mp4"
          bgImageSrc={heroImages}
          title="Premium Knits"
          date="Collection 2026"
          scrollToExpand="Scroll to Explore"
          textBlend={true}
        >
          <div className="max-w-4xl mx-auto text-center pt-0 pb-4 px-6">

            <h2 className="hp-heading mb-1.5 md:mb-2 text-black">Crafting the <span className="text-[#57AD43]">Future</span> of Fabric</h2>
            <p className="!text-[14px] md:!text-[16px] text-[#475467] font-medium leading-normal md:leading-relaxed max-w-[340px] md:max-w-none mx-auto">
              Texongo combines traditional craftsmanship with cutting-edge 3D visualization. Our digital-first approach allows designers to experience the texture, drape, and movement of high-performance textiles before the first thread is even woven.
            </p>
          </div>
        </ScrollExpandMedia>



        {/* ── THE STORY ───────────────────────────────────── */}
        <section id="collections" className="relative">
          <LazySection>
            <ParallaxFeatureSection />
          </LazySection>
        </section>

        <LazySection>
          <section className="relative bg-white overflow-hidden border-y border-black/5">
            {/* Split Backgrounds extending full width */}
            <div className="absolute inset-y-0 right-0 w-1/2 bg-[#F9FAFB] hidden md:block z-0" />

            <div className="relative z-10 flex flex-col md:flex-row w-full max-w-[1440px] mx-auto">
              <div className="w-full md:w-1/2 relative min-h-[250px] md:min-h-[400px] flex items-center justify-center p-8 lg:p-16">
                <LazyVideo
                  src="/Texon%20Sourcing.mp4"
                  objectFit="contain"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 lg:p-16 bg-[#F9FAFB] md:bg-transparent">
                <div className="w-full max-w-xl pl-0 lg:pl-16 text-center md:text-left">
                  <span className="hp-overline text-[#57AD43] mb-1 md:mb-2 block">Innovation</span>
                  <h2 className="hp-heading mb-2 md:mb-3 text-black">
                    Streamline Your<br className="hidden md:block" /> Fabric Journey
                  </h2>
                  <p className="text-sm md:text-base text-black/70 leading-relaxed font-medium">
                    Traditional sourcing often gets trapped in a cycle of physical sampling and endless reviews, creating costly conflicts and delays. Texongo solves this by introducing 3D Samples early in the journey. By reviewing and refining digitally before production, we eliminate friction and ensure a seamless path from design to market.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </LazySection>

        {/* ── CAMPAIGN STORY ─────────────────────────────── */}
        {/* <LazySection>
          <section id="womenswear" className="bg-white py-20 pb-0">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                {storyProducts.map((product) => (
                  <StoryProductCard key={product.name} {...product} />
                ))}
              </div>
            </div>
          </section>
        </LazySection> */}

        <LazySection y={0}>
          <KnitStylesSection products={products} collections={collections} />
        </LazySection>

        <LazySection y={0}>
          <BlendStylesSection products={products} collections={collections} />
        </LazySection>

        <LazySection>
          <SustainableBlendSection />
        </LazySection>



        <LazySection>
          <ProductCatalogSection products={uniqueProducts} />
        </LazySection>

        {/* ── NEW ARRIVALS ─────────────────────────────────── */}
        <LazySection>
          <section id="menswear" className="py-12 md:py-16 bg-white border-y border-black/5">
            <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
              <div className="relative mb-10 md:mb-16 w-full">
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#57AD43] mb-2 md:mb-4 block">New Arrivals</span>
                  <h2 className="hp-heading">Fabric Collection.</h2>
                </div>

                {/* Right-aligned Link on desktop */}
                <div className="absolute right-0 bottom-0 translate-y-1 hidden md:block">
                  <Link href="/fabrics" className="inline-block">
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest border-b-2 border-[#57AD43] pb-2 cursor-pointer hover:text-[#57AD43] transition-colors">
                      View All Fabrics
                    </p>
                  </Link>
                </div>

              </div>

              <div className={`-mx-6 lg:-mx-10 overflow-hidden ${styles.marqueeViewport}`}>
                <div className={styles.productTrack}>
                  {(newArrivals && newArrivals.length > 0
                    ? [...newArrivals.slice(0, 12), ...newArrivals.slice(0, 12)]
                    : (uniqueProducts && uniqueProducts.length > 0
                      ? [...uniqueProducts.slice(0, 12), ...uniqueProducts.slice(0, 12)]
                      : [...marqueeProducts.slice(0, 12), ...marqueeProducts.slice(0, 12)]))
                    .map((product, index) => (
                      <MarqueeProductCard
                        key={`${product.name}-${index}`}
                        name={product.name}
                        price={typeof product.price === 'string' ? (product.price.startsWith('₹') ? product.price : `₹${product.price}`) : `₹${product.price}`}
                        href={('href' in product && (product as any).href) ? (product as any).href : ('id' in product ? `/fabrics/${(product as any).id}` : '#')}
                        image={product.image}
                        index={index}
                        gsm={'gsm' in product ? (product as any).gsm : undefined}
                        category={'knit_style' in product ? (product as any).knit_style : ('category' in product ? (product as any).category : undefined)}
                      />
                    ))}
                </div>
              </div>

              {/* Centered on mobile */}
              <div className="text-center mt-8 md:hidden">
                <Link href="/fabrics" className="inline-block">
                  <p className="text-[8px] font-bold text-black/40 uppercase tracking-widest border-b-2 border-[#57AD43] pb-1 cursor-pointer hover:text-[#57AD43] transition-colors">
                    View All Fabrics
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </LazySection>

        <LazySection>
          <TestimonialsSection />
        </LazySection>

        <LazySection>
          <FaqSection />
        </LazySection>

        <LazySection>
          <BlogSection blogs={blogs} />
        </LazySection>
      </main>
    </ReactLenis>
  );
}

// function TrendyFabricsSection() {
//   const models = [
//     { id: 1, image: "/Screenshot 2026-04-16 134454.png" },
//     { id: 2, image: "/Screenshot 2026-04-16 134502.png" },
//     { id: 3, image: "/Screenshot 2026-04-16 134513.png" },
//     { id: 4, image: "/Screenshot 2026-04-16 134521.png" },
//     { id: 5, image: "/Screenshot 2026-04-16 134527.png" },
//   ];

//   return (
//     <section className="py-24 bg-[#c5e3b6] overflow-hidden">
//       <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
//         <div className="flex flex-wrap justify-center gap-4 md:gap-5 mb-16">
//           {models.map((m, idx) => (
//             <motion.div
//               key={idx}
//               initial={{ opacity: 0, y: 50 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
//               viewport={{ once: true }}
//               className="w-[140px] md:w-[220px] h-[220px] md:h-[390px] bg-white/40 backdrop-blur-md rounded-t-full border-2 border-white/50 overflow-hidden relative group shadow-xl"
//             >
//               <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
//               <img 
//                 src={m.image} 
//                 alt="Trendy Fabric Showcase" 
//                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out relative z-10"
//               />
//             </motion.div>
//           ))}
//         </div>

function ProductCatalogSection({ products }: { products: any[] }) {
  const womensProducts = products.filter(p => {
    const usage = (p.usage || "").toLowerCase();
    const name = (p.name || "").toLowerCase();
    return usage.includes("women") || name.includes("women");
  });

  const mensProducts = products.filter(p => {
    const usage = (p.usage || "").toLowerCase();
    const name = (p.name || "").toLowerCase();
    // Prevent "women" from matching "men"
    const hasMen = (usage.includes("men") && !usage.includes("women")) || (name.includes("men") && !name.includes("women"));
    const hasCargo = usage.includes("cargo") || name.includes("cargo");
    return hasMen || hasCargo;
  });

  const row1 = [...womensProducts, ...products.filter(p => !womensProducts.includes(p))].slice(0, 10);
  const row2 = [...mensProducts, ...products.filter(p => !mensProducts.includes(p))].slice(0, 10);

  return (
    <section className="py-12 md:py-16 bg-white border-b border-black/5 overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 mb-8 md:mb-16 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#57AD43] mb-2 md:mb-4 block">Collection</span>
        <h2 className="hp-heading text-[#111111]">Product Catalog</h2>
      </div>

      <div className="space-y-20">
        {/* Row 1 - Women's Wear */}
        <div>
          <div className="mx-auto max-w-[1440px] px-[clamp(0.9rem,1.4vw,1.9rem)] mb-10 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="hp-heading text-[#111111] uppercase">Womens Wear</h3>
            </div>
            <Link href="/fabrics?category=womenwear" className="hp-link text-black/40 border-b-2 border-[#57AD43] pb-1 hover:text-[#57AD43] transition-colors hidden md:block">
              Explore Section
            </Link>
          </div>

          <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
            <div className="-mx-6 lg:-mx-12 overflow-hidden">
              <div className={styles.marqueeViewport}>
                <div className={styles.productTrack} style={{ animationDuration: '40s' }}>
                  {[...row1, ...row1].map((p, idx) => (
                    <MarqueeProductCard
                      key={`${p.name}-${idx}`}
                      name={p.name}
                      price={typeof p.price === 'string' ? (p.price.startsWith('₹') ? p.price : `₹${p.price}`) : `₹${p.price}`}
                      href={('href' in p && (p as any).href) ? (p as any).href : ('id' in p ? `/fabrics/${(p as any).id}` : '#')}
                      image={p.image || ""}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4 md:hidden">
            <Link href="/fabrics?category=womenwear" className="hp-link text-black/40 border-b-2 border-[#57AD43] pb-1 hover:text-[#57AD43] transition-colors">
              Explore Section
            </Link>
          </div>
        </div>

        {/* Row 2 - Men's Wear */}
        <div>
          <div className="mx-auto max-w-[1440px] px-[clamp(0.9rem,1.4vw,1.9rem)] mb-10 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="hp-heading text-[#111111] uppercase">Mens Wear</h3>
            </div>
            <Link href="/fabrics?category=menwear" className="hp-link text-black/40 border-b-2 border-[#57AD43] pb-1 hover:text-[#57AD43] transition-colors hidden md:block">
              Explore Section
            </Link>
          </div>

          <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
            <div className="-mx-6 lg:-mx-12 overflow-hidden">
              <div className={styles.marqueeViewport}>
                <div className={styles.productTrack} style={{ animationDuration: '45s', animationDirection: 'reverse' }}>
                  {[...row2, ...row2].map((p, idx) => (
                    <MarqueeProductCard
                      key={`${p.name}-${idx}`}
                      name={p.name}
                      price={typeof p.price === 'string' ? (p.price.startsWith('₹') ? p.price : `₹${p.price}`) : `₹${p.price}`}
                      href={('href' in p && (p as any).href) ? (p as any).href : ('id' in p ? `/fabrics/${(p as any).id}` : '#')}
                      image={p.image || ""}
                      index={idx}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-4 md:hidden">
            <Link href="/fabrics?category=menwear" className="hp-link text-black/40 border-b-2 border-[#57AD43] pb-1 hover:text-[#57AD43] transition-colors">
              Explore Section
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}


function BlogSection({ blogs: externalBlogs }: { blogs?: any[] }) {
  const defaultBlogs = [
    {
      title: "Trump's Trade Policies: Impact on Fashion Imports",
      image: "https://texongo.com/wp-content/uploads/2026/04/trumps-trade-policies-impact-blog1.png",
      category: "Market Insights",
      link: "https://texongo.com/trumps-trade-policies-impact-on-fashion-imports-and-exports/"
    },
    {
      title: "Behind the Scenes at Texongo: A Day in the Life",
      image: "https://texongo.com/wp-content/uploads/2026/04/Behind-the-Scenes-at-Texongo1.png",
      category: "Culture",
      link: "https://texongo.com/behind-the-scenes-at-texongo-a-day-in-the-life/"
    },
    {
      title: "Cross-Cultural Collaborations in the Digital Fashion Space",
      image: "https://texongo.com/wp-content/uploads/2026/02/how-India-global-designers-are-merging-traditions-with-digital-Innovation.png",
      category: "Innovation",
      link: "https://texongo.com/cross-cultural-collaborations-in-the-digital-fashion-space-how-india-and-global-designers-are-merging-traditions-with-digital-innovation/"
    }
  ];

  const displayBlogs = externalBlogs && externalBlogs.length > 0 ? externalBlogs.slice(0, 3) : defaultBlogs;

  return (
    <section className="py-12 md:py-16 bg-[#F9FAFB]">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="flex flex-col items-center mb-6">
          <span className="hp-overline text-[#57AD43] mb-0.5 block">Latest Insights</span>
          <h2 className="hp-heading text-center text-[#111111]">Our Stories</h2>
        </div>
        <div className="flex xl:grid xl:grid-cols-3 overflow-x-auto snap-x snap-mandatory gap-4 md:gap-6 lg:gap-8 xl:gap-12 pb-8 md:pb-12 xl:pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {displayBlogs.map((b, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0.01, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.05, ease: "easeOut" }}
              viewport={{ once: true, margin: "100px" }}
              className="snap-center shrink-0 w-[85%] sm:w-[60%] md:w-[45%] lg:w-[35%] xl:w-auto group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-black/5 flex flex-col h-full"
            >
              <div className="aspect-[16/10] overflow-hidden relative">
                <img src={b.image || undefined} alt={b.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
              </div>
              <div className="p-4 sm:p-6 md:p-10 space-y-3 md:space-y-6 flex flex-col flex-1">
                <span className="hp-badge inline-block bg-[#57AD43] text-white w-fit shadow-md line-clamp-1">
                  {b.category}
                </span>
                <h3 className="hp-card-title !text-[16px] xl:!text-[20px] hp-text-500 flex-1 text-[#111111] group-hover:text-[#57AD43] transition-colors duration-300">
                  {b.title}
                </h3>
                <Link
                  href={b.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hp-link flex items-center justify-between gap-1 md:gap-3 text-[#57AD43] group/btn pt-3 md:pt-8 border-t border-black/5 w-full"
                >
                  <span className="line-clamp-1">Read Full Story</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover/btn:translate-x-1.5 transition-transform duration-300 shrink-0">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
