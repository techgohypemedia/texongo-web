"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { PageHero } from "../../components/ui/page-hero";
import { useEffect, useState } from "react";
import { createCheckout } from "@/lib/shopify";
import { Loader2 } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice, getItemCount } = useCartStore();
  const [isReady, setIsReady] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Fix hydration mismatch for persisted store
  useEffect(() => {
    setIsReady(true);
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsCheckingOut(true);
    try {
      const checkoutItems = items.map(item => ({
        variantId: item.variantId || "",
        quantity: item.quantity
      })).filter(item => item.variantId !== "");

      if (checkoutItems.length === 0) {
        alert("Your cart items are missing Shopify identifiers. Please try removing and re-adding them to your cart.");
        setIsCheckingOut(false);
        return;
      }

      const response = await fetch('/api/shopify/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: checkoutItems }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Failed to create checkout. Please try refreshing and adding items again.");
        setIsCheckingOut(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred during checkout. Please check your internet connection.");
      setIsCheckingOut(false);
    }
  };

  if (!isReady) return null;

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-white pb-40">
        <PageHero subtitle="Your Selection" mainTitle="Your" accentTitle="Bag" />
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 text-center mt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag size={40} className="text-gray-300" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-4 text-black">Your Bag Is Empty</h2>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-10">Start adding some premium fabrics to your collection.</p>
            <Link
              href="/fabrics"
              className="inline-flex items-center gap-3 bg-black !text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-[#57AD43] transition-all rounded-sm"
            >
              Explore Fabrics
            </Link>
          </motion.div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/50 pb-32">
      <PageHero subtitle="Your Selection" mainTitle="Your" accentTitle="Bag" />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 mt-8">
        <div className="flex flex-col lg:flex-row gap-16">

          {/* Left: Items List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <span id="cart-page-items-count" className="text-[12px] font-bold text-gray-400 uppercase tracking-[0.2em]">{getItemCount()} Items In Bag</span>
            </div>

            <div className="space-y-8">
              <AnimatePresence mode='popLayout'>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-sm border border-gray-100 rounded-sm relative overflow-hidden"
                  >
                    <Link href={`/fabrics/${item.id}`} className="block w-full md:w-32 aspect-[4/5] relative bg-gray-50 shrink-0 overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center p-2">No Image</div>
                      )}
                    </Link>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <Link href={`/fabrics/${item.id}`} className="text-sm md:text-md font-black uppercase tracking-tight hover:text-[#57AD43] transition-colors leading-tight">
                            {item.name}
                          </Link>
                          <span className="text-sm font-black whitespace-nowrap">₹{item.price * item.quantity}.00</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">GSM: {item.gsm} g/m²</p>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-50">
                        <div className="flex items-center gap-1 border border-gray-100 rounded-sm bg-gray-50/50 p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-sm transition-colors text-gray-500 hover:text-black"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center text-xs font-black">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-sm transition-colors text-gray-500 hover:text-black"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <button
                          id={`cart-page-remove-btn-${item.id}`}
                          onClick={() => removeItem(item.id)}
                          className="flex items-center gap-2 text-[12px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Link
              href="/fabrics"
              className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-black mt-12 transition-colors"
            >
              <ArrowLeft size={14} />
              Continue Shopping
            </Link>
          </div>

          {/* Right: Summary Card */}
          <aside className="w-full lg:w-[400px]">
            <div className="bg-black text-white p-10 lg:sticky lg:top-32 rounded-sm shadow-2xl">
              <h2 className="text-xl font-black uppercase tracking-[0.2em] mb-10 pb-6 border-b border-white/10 text-center">Order Summary</h2>

              <div className="space-y-6 mb-10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                  <span>Subtotal</span>
                  <span className="text-white">₹{getTotalPrice()}.00</span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                  <span>Estimated Shipping</span>
                  <span className="text-[#57AD43]">Calculated Next</span>
                </div>
                <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Total</span>
                  <span className="text-3xl font-black">₹{getTotalPrice()}.00</span>
                </div>
              </div>

              <button
                id="cart-page-checkout-btn"
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full h-16 bg-white flex items-center justify-center gap-3 text-[12px] font-black uppercase tracking-[0.3em] hover:bg-[#57AD43] hover:text-white transition-all rounded-sm group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-black group-hover:text-white transition-colors">{isCheckingOut ? "Processing..." : "Checkout Now"}</span>
                {!isCheckingOut && <ArrowRight size={18} className="text-black group-hover:text-white transition-all group-hover:translate-x-1" />}
                {isCheckingOut && <Loader2 size={18} className="text-black group-hover:text-white animate-spin" />}
              </button>

              <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-4">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] text-center leading-relaxed">
                  Shipping charges (weight-based) and applicable GST (5%) are calculated at checkout.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </main>
  );
}
