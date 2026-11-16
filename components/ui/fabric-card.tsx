"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store";

interface FabricCardProps {
  id: string;
  name: string;
  price: string;
  gsm: string;
  image: string;
  variantId?: string;
  isNew?: boolean;
  catalogMode?: boolean;
  inventory?: number;
}



export function FabricCard({ id, name, gsm, price, image, variantId, catalogMode, inventory }: FabricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      variantId,
      name,
      price: parseInt(price),
      gsm,
      image: image && image !== "" ? image : ""
    });
  };

  const finalImage = image && image !== "" ? image : "";

  return (
    <motion.div
      className={`group relative flex flex-col items-center text-center bg-white ${catalogMode ? 'p-1 md:p-4' : 'p-4'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <Link href={`/fabrics/${id}`} className="w-full">
        {/* Product Image Container */}
        <div className={`relative ${catalogMode ? 'aspect-[4/5]' : 'aspect-square md:aspect-[4/5]'} w-full overflow-hidden bg-gray-50 mb-2 md:mb-6 border border-gray-100 md:border-none`}>
          {finalImage ? (
            <Image
              src={finalImage}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-500 font-bold text-sm uppercase">
                No Image
            </div>
          )}

          {/* GSM Badge */}
          <div className="absolute top-0 left-0 bg-[#57AD43] text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 z-10">
            GSM: {gsm} g/m²
          </div>

          {/* Hover Action Overlay (Desktop Only) */}
          <div className="hidden lg:block">
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-4 left-4 right-4 z-20"
                >
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-black text-white !text-[10px] font-black uppercase tracking-[0.2em] py-3 hover:bg-[#57AD43] transition-colors rounded-sm shadow-xl"
                  >
                    Add to cart
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full flex flex-col items-center gap-1 md:gap-3 py-2">
          <h3 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-black leading-tight max-w-[240px] text-center group-hover:text-[#57AD43] transition-colors duration-300">
            {name}
          </h3>
          <p className="text-[10px] md:text-lg font-black text-black uppercase tracking-tighter flex items-center gap-1 md:gap-2">
            <span className="text-[#57AD43]">₹</span>{parseFloat(price).toFixed(2)} <span className="text-[8px] md:text-[12px] text-gray-500 font-bold normal-case tracking-normal">/ kg</span>
          </p>

          {/* Live inventory */}
          {typeof inventory === "number" && (
            inventory > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-[#57AD43] bg-[#57AD43]/10 px-2.5 py-1 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#57AD43] opacity-60 animate-ping" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#57AD43]" />
                </span>
                {inventory} kg in stock
              </span>
            ) : (
              <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                Out of stock
              </span>
            )
          )}

          {/* Static Action Button (Mobile/Tablet Only) - Below Price */}
          <div className="w-full mt-2 lg:hidden px-2">
            <button
              onClick={handleAddToCart}
              className="w-full bg-black text-white !text-[10px] font-black uppercase tracking-[0.2em] py-2.5 rounded-sm shadow-md active:bg-[#57AD43] transition-colors"
            >
              Add to cart
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
