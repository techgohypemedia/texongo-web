"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FabricCard } from "./fabric-card";
import { ChevronDown, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { createFabricSearchMatcher } from "@/lib/fabric-search";
import { Fabric } from "@/lib/shopify";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const ITEMS_PER_PAGE = 12;

interface FabricsCatalogClientProps {
  initialFabrics: Fabric[];
}

export function FabricsCatalogClient({ initialFabrics }: FabricsCatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const categoryParam = searchParams.get("category") || "";
  const queryParam = searchParams.get("search") || "";

  // Use initialFabrics directly for instant load!
  const [fabrics] = useState<Fabric[]>(initialFabrics);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [selectedGsm, setSelectedGsm] = useState<string>("");
  const [gsmInput, setGsmInput] = useState<string>(""); // free-text GSM input
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("Latest Selection");

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGsm, gsmInput, selectedColor, sortBy, categoryParam, queryParam]);

  // Whenever the filtered list or page changes, refresh ScrollTrigger to ensure the footer triggers correctly!
  useEffect(() => {
    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentPage, selectedGsm, gsmInput, selectedColor, sortBy, categoryParam, queryParam]);

  // Derived Data
  const gsmOptions = ["All GSM", "Light (<200)", "Medium (200-300)", "Heavy (>300)"];

  const colorOptions = useMemo(() => {
    const shades = Array.from(new Set(fabrics.map(f => f.shade).filter((val): val is string => !!val && val !== 'N/A'))).sort();
    return ["All Colors", ...shades];
  }, [fabrics]);

  const sortOptions = ["Latest Selection", "Price: Low to High", "Price: High to Low", "GSM: Low to High"];

  // Human-readable Category Formatter
  const formatCategoryName = (slug: string) => {
    return slug
      .split("-")
      .map(word => {
        if (word === "tshirt") return "T-Shirt";
        if (word === "coords") return "Co-Ords";
        if (word === "coord") return "Co-Ord";
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  // Filtering & Sorting Logic
  const filteredFabrics = useMemo(() => {
    const searchMatcher = createFabricSearchMatcher(queryParam);
    return fabrics
      .filter(f => {
        // GSM Filter Match — text input takes priority over dropdown range
        const rawValue = typeof f.gsm === 'string' ? f.gsm : '';
        const rawGsm = parseInt(rawValue.replace(/[^0-9]/g, ''));
        let gsmMatch = true;
        if (gsmInput.trim()) {
          // Free-text: match if fabric GSM contains the typed value
          gsmMatch = rawValue.replace(/[^0-9]/g, '').includes(gsmInput.trim().replace(/[^0-9]/g, ''));
        } else if (selectedGsm && selectedGsm !== "All GSM") {
          if (isNaN(rawGsm)) {
            gsmMatch = false;
          } else if (rawGsm < 200) {
            gsmMatch = selectedGsm === "Light (<200)";
          } else if (rawGsm <= 300) {
            gsmMatch = selectedGsm === "Medium (200-300)";
          } else {
            gsmMatch = selectedGsm === "Heavy (>300)";
          }
        }

        // Color Filter Match
        const colorMatch = !selectedColor || selectedColor === "All Colors" || f.shade === selectedColor;

        // Category Filter Match from MegaMenu URL parameter
        let categoryMatch = true;
        if (categoryParam) {
          const normParam = categoryParam.toLowerCase().replace(/[^a-z0-9]/g, '');
          const ignoredDescriptors = ["blend", "blends", "fabric", "fabrics", "knit", "knits", "style", "styles", "wear", "wears"];

          // Handle broad heading categories explicitly
          if (normParam === "knitstyle" || normParam === "knitstyles") {
            const knitKeywords = [
              "jersey", "terry", "fleece", "rib", "spandex", "knit", "knits", "pique", "interlock",
              "waffle", "jacquard", "stripe", "stripes", "corduroy", "vellour", "printed", "shiffly",
              "ponte", "yarn dyed", "neps", "popcorn"
            ];
            const searchStr = `${f.knit_style || ""} ${f.composition || ""} ${f.fabric || ""} ${f.name || ""} ${f.type || ""}`.toLowerCase();
            categoryMatch = knitKeywords.some(keyword => searchStr.includes(keyword));
          } else if (normParam === "blends" || normParam === "blend") {
            const blendKeywords = [
              "cotton", "viscose", "modal", "giza", "egyptian", "melange",
              "nylon", "poly", "polyester", "slub", "spandex", "australian", "blend"
            ];
            const searchStr = `${f.composition || ""} ${f.fabric || ""} ${f.name || ""}`.toLowerCase();
            categoryMatch = blendKeywords.some(keyword => searchStr.includes(keyword));
          } else if (normParam === "menwear" || normParam === "menswear" || normParam === "men") {
            const menKeywords = [
              "cargo", "hoodie", "hoodies", "coord", "coords", "tshirt", "t-shirt", "jogger", "joggers",
              "loungewear", "polo", "polos", "sweatshirt", "sweatshirts", "men", "mens", "boy", "boys"
            ];
            const searchStr = `${f.composition || ""} ${f.fabric || ""} ${f.name || ""} ${f.type || ""} ${f.usage || ""}`.toLowerCase();
            categoryMatch = menKeywords.some(keyword => searchStr.includes(keyword));
          } else if (normParam === "womenwear" || normParam === "womenswear" || normParam === "women") {
            const womenKeywords = [
              "tshirt", "t-shirt", "top", "tops", "athleisure", "coord", "coords", "dress", "dresses", "hoodie",
              "hoodies", "jumpsuit", "jumpsuits", "lining", "polo", "polos", "scarf", "scarves", "skirt", "skirts",
              "sweatshirt", "sweatshirts", "women", "womens", "girl", "girls"
            ];
            const searchStr = `${f.composition || ""} ${f.fabric || ""} ${f.name || ""} ${f.type || ""} ${f.usage || ""}`.toLowerCase();
            categoryMatch = womenKeywords.some(keyword => searchStr.includes(keyword));
          } else if (normParam === "sustainableblends" || normParam === "sustainableblend" || normParam === "sustainable") {
            const sustKeywords = [
              "wool", "supima", "banana", "ecovero", "eco vero", "hemp",
              "linen", "lotus", "modal", "organic", "recycled", "tencel", "bci", "sustainable", "eco"
            ];
            const searchStr = `${f.composition || ""} ${f.fabric || ""}`.toLowerCase();
            categoryMatch = sustKeywords.some(keyword => searchStr.includes(keyword));
          } else if (normParam === "printed") {
            const searchStr = `${f.name || ""}`.toLowerCase();
            categoryMatch = searchStr.includes("printed") || searchStr.includes("print");
          } else {
            // Helper to normalize and check for containing or being contained (handles singular/plural and partial words)
            const checkMatch = (val: string | undefined | null) => {
              if (!val || val === 'N/A') return false;
              const normVal = val.toLowerCase().replace(/[^a-z0-9]/g, '');
              return normVal.includes(normParam) || normParam.includes(normVal);
            };

            // Group categories to apply precise filtering rules
            const knitStyles = [
              "singlejersey", "frenchterry", "fleece", "rib", "spandexknits",
              "pique", "interlock", "waffle", "jacquard", "stripes",
              "corduroy", "vellour", "corduroyvellour", "printed", "shiffly", "ponte", "yarndyed", "neps", "popcorn"
            ];

            const blends = [
              "cotton", "viscose", "cottonmodal", "giza", "egyptian", "gizagyptian", "melange",
              "nylon", "polycotton", "polyester", "slub", "spandexblends", "australian",
              "wool", "supima", "bananafabric", "ecovero", "hemp",
              "linen", "lotus", "modal", "organiccotton", "recycledcotton", "tencel", "bci"
            ];

            const isKnitStyleCat = knitStyles.some(style => normParam.includes(style) || style.includes(normParam));
            const isBlendCat = blends.some(blend => normParam.includes(blend) || blend.includes(normParam));

            if (isKnitStyleCat) {
              // For Knit Styles:
              // 1. If product has an explicit knit style metafield, it MUST match the category.
              // 2. Otherwise, if it has a product type (other than generic 'Knit Fabric'), it MUST match.
              // 3. Otherwise fall back to title or fabric metafield.
              // We intentionally do NOT match description or composition to avoid false positives (e.g. Corduroy showing under Jersey).
              const productKnit = (f.knit_style && f.knit_style !== 'N/A')
                ? f.knit_style
                : (f.type && f.type !== 'N/A' && f.type !== 'Knit Fabric')
                  ? f.type
                  : null;

              if (productKnit) {
                categoryMatch = checkMatch(productKnit);
              } else {
                categoryMatch = checkMatch(f.fabric) || checkMatch(f.name);
              }
            } else if (isBlendCat) {
              // For Blends (e.g., Cotton, Viscose, Poly Cotton):
              // Check composition, fabric using split OR/AND logic
              const checkBlendMatch = (val: string | undefined | null) => {
                if (!val || val === 'N/A') return false;
                const normVal = val.toLowerCase().replace(/[^a-z0-9]/g, '');

                if (normVal.includes(normParam)) return true;

                // Handle composite blend queries like poly-cotton or giza/-egyptian
                const orGroups = categoryParam.toLowerCase().split(/[\/]/);
                return orGroups.some(group => {
                  const cleanGroup = group.replace(/^-+|-+$/g, '');
                  const andParts = cleanGroup.split('-').filter(p => p.length > 1 && !ignoredDescriptors.includes(p));
                  if (andParts.length > 0) {
                    return andParts.every(part => normVal.includes(part));
                  }
                  return false;
                });
              };

              categoryMatch = checkBlendMatch(f.composition) || checkBlendMatch(f.fabric);
            } else {
              // For Garment / Usage / Wear categories:
              // Check usage, product type, or title using OR logic for parts (e.g. tshirt/tops)
              const checkUsageMatch = (val: string | undefined | null) => {
                if (!val || val === 'N/A') return false;
                const normVal = val.toLowerCase().replace(/[^a-z0-9]/g, '');

                if (normVal.includes(normParam) || normParam.includes(normVal)) return true;

                const orGroups = categoryParam.toLowerCase().split(/[\/]/);
                return orGroups.some(group => {
                  const cleanGroup = group.replace(/^-+|-+$/g, '');
                  const parts = cleanGroup.split('-').filter(p => p.length > 1 && !ignoredDescriptors.includes(p));
                  if (parts.length > 0) {
                    return parts.some(part => normVal.includes(part) || part.includes(normVal));
                  }
                  return false;
                });
              };

              categoryMatch = checkUsageMatch(f.usage) || checkUsageMatch(f.type) || checkUsageMatch(f.name);
            }
          }
        }

        const queryMatch = searchMatcher(f);

        return gsmMatch && colorMatch && categoryMatch && queryMatch;
      })
      .sort((a, b) => {
        if (sortBy === "Price: Low to High") return parseFloat(a.price) - parseFloat(b.price);
        if (sortBy === "Price: High to Low") return parseFloat(b.price) - parseFloat(a.price);
        if (sortBy === "GSM: Low to High") {
          const gsmA = parseInt(a.gsm.replace(/[^0-9]/g, '')) || 0;
          const gsmB = parseInt(b.gsm.replace(/[^0-9]/g, '')) || 0;
          return gsmA - gsmB;
        }
        return 0; // Latest Selection is default order from API
      });
  }, [fabrics, selectedGsm, gsmInput, selectedColor, sortBy, categoryParam, queryParam]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredFabrics.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedFabrics = filteredFabrics.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic page heading — follows the selected category / search
  const headingSpecial: Record<string, string> = {
    menwear: "Men's Wear",
    womenwear: "Women's Wear",
    bci: "BCI Cotton",
  };
  const headingText = categoryParam
    ? headingSpecial[categoryParam.toLowerCase()] ?? formatCategoryName(decodeURIComponent(categoryParam))
    : queryParam
      ? `Results for "${queryParam}"`
      : "Fabrics Catalog";
  const headingWords = headingText.split(" ");
  const headingLead = headingWords.length > 1 ? headingWords.slice(0, -1).join(" ") : "";
  const headingAccent = headingWords[headingWords.length - 1];
  const headingEyebrow = categoryParam ? "Fabrics Catalog" : queryParam ? "Search" : "Premium Collection";

  return (
    <>
    {/* Title Header Section */}
    <div className="max-w-[1680px] mx-auto px-6 lg:px-10 pt-28 md:pt-36 pb-6 relative z-[100]">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#57AD43] mb-1 block">{headingEyebrow}</span>
        <h1 className="text-3xl md:text-6xl font-bold tracking-tight text-black">
          {headingLead && <>{headingLead} </>}<span className="text-[#57AD43]">{headingAccent}</span>
        </h1>
        <div className="h-px bg-emerald-100/60 w-24 mx-auto mt-4" />
      </div>
    </div>
    <div className="max-w-[1680px] mx-auto px-6 lg:px-10 pb-20 relative z-[50]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mt-0 md:mt-2">

        {/* Filters Sidebar (Left Column on Desktop, stacks on top on Mobile) */}
        <div className="lg:col-span-1 order-1 lg:order-1">
          <div className="lg:sticky lg:top-28 space-y-6 lg:pr-8 lg:border-r lg:border-gray-100 relative z-[200]">
            <div className="flex items-center gap-2 pb-2">
              <Filter size={14} className="text-black" />
              <span className="text-[11px] font-black uppercase tracking-widest text-black">Filter & Sort</span>
            </div>

            <div className="space-y-6">
              {/* GSM Filter */}
              <div className="space-y-2">
                <span className="gsm-range-label !text-[11px] font-bold text-gray-400 uppercase tracking-widest block" style={{ fontSize: '11px' }}>Gsm Range</span>
                {/* Free-text GSM input */}
                <div className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 w-full transition-all ${gsmInput ? 'border-[#57AD43] bg-[#57AD43]/5' : 'border-emerald-100/60 bg-white/40 shadow-[0_8px_20px_rgba(87,173,67,0.03)] hover:border-[#57AD43] backdrop-blur-sm'
                  }`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Type GSM e.g. 220"
                    value={gsmInput}
                    onChange={e => {
                      setGsmInput(e.target.value);
                      if (e.target.value) setSelectedGsm(""); // clear dropdown when typing
                    }}
                    className={`gsm-input-field flex-1 bg-transparent !text-[11px] font-medium uppercase tracking-wider outline-none placeholder:text-gray-300 ${gsmInput ? 'text-[#57AD43]' : 'text-black'
                      }`}
                    style={{ fontSize: '11px' }}
                  />
                  {gsmInput && (
                    <button
                      onClick={() => setGsmInput("")}
                      className="text-gray-300 hover:text-[#57AD43] transition-colors text-[10px] shrink-0"
                    >✕</button>
                  )}
                </div>
                {/* OR label */}
                <div className="flex items-center gap-2 py-0.5">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="gsm-or-range-label !text-[11px] font-bold text-gray-300 uppercase tracking-widest" style={{ fontSize: '11px' }}>or range</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <FilterDropdown
                  label={selectedGsm || "All GSM"}
                  options={gsmOptions}
                  onSelect={(val) => { setSelectedGsm(val); setGsmInput(""); }}
                  active={!!selectedGsm && selectedGsm !== "All GSM" && !gsmInput}
                />
              </div>

              {/* Color Filter */}
              <div className="space-y-2">
                <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-widest block">Color Palette</span>
                <SearchableFilterDropdown
                  label={selectedColor || "All Colors"}
                  options={colorOptions}
                  onSelect={setSelectedColor}
                  active={!!selectedColor && selectedColor !== "All Colors"}
                />
              </div>

              {/* Sort Matrix */}
              <div className="space-y-2">
                <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-widest block">Sort Matrix</span>
                <SortDropdown
                  label={sortBy}
                  options={sortOptions}
                  onSelect={setSortBy}
                />
              </div>
            </div>

            {((selectedGsm && selectedGsm !== "All GSM") || (gsmInput && gsmInput.trim() !== "") || (selectedColor && selectedColor !== "All Colors") || (sortBy && sortBy !== "Latest Selection") || categoryParam) ? (
              <div className="pt-4">
                <button
                  onClick={() => {
                    setSelectedGsm("");
                    setGsmInput("");
                    setSelectedColor("");
                    setSortBy("Latest Selection");
                    if (categoryParam) {
                      router.push(pathname);
                    }
                  }}
                  className="reset-filters-btn w-full flex items-center justify-center gap-2 border border-emerald-100/60 bg-white/40 shadow-[0_8px_20px_rgba(87,173,67,0.03)] rounded-xl px-5 py-3 !text-[11px] font-medium text-[#435C46] uppercase tracking-wider hover:border-[#57AD43] hover:bg-emerald-50/20 backdrop-blur-sm transition-all cursor-pointer"
                  style={{ fontSize: '11px' }}
                >
                  Reset Filters
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Product Grid (Right Column on Desktop, stacked underneath filters on Mobile) */}
        <div className="lg:col-span-3 order-2 lg:order-2">
          {(categoryParam || queryParam) && (
            <div className="mb-8 flex flex-wrap items-center gap-3 bg-emerald-50/20 border border-emerald-100/60 rounded-2xl px-5 py-3 backdrop-blur-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Filters:</span>
              {categoryParam && (
                <span className="text-[10px] font-black text-[#57AD43] uppercase tracking-widest bg-[#57AD43]/10 px-3 py-1 rounded-full">
                  Category: {formatCategoryName(categoryParam)}
                </span>
              )}
              {queryParam && (
                <span className="text-[10px] font-black text-[#57AD43] uppercase tracking-widest bg-[#57AD43]/10 px-3 py-1 rounded-full">
                  Search: "{queryParam}"
                </span>
              )}
              <button
                onClick={() => {
                  router.push(pathname);
                }}
                className="ml-auto !text-[10px] font-bold uppercase tracking-widest text-[#435C46] hover:text-[#57AD43] transition-colors border-b border-transparent hover:border-[#57AD43] pb-0.5"
              >
                Clear All
              </button>
            </div>
          )}

          {paginatedFabrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-6 text-center">
              <p className="text-xl font-black uppercase tracking-tighter text-gray-300">No matches found for these filters</p>
              <button
                onClick={() => { setSelectedGsm("All GSM"); setSelectedColor("All Colors"); }}
                className="text-xs font-black uppercase tracking-widest text-[#57AD43] border-b border-[#57AD43] pb-1"
              >
                Clear All Selections
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-4 md:gap-y-12 mt-4">
                {paginatedFabrics.map((fabric) => (
                  <FabricCard
                    key={fabric.id}
                    id={fabric.id}
                    name={fabric.name}
                    price={fabric.price}
                    gsm={fabric.gsm}
                    image={fabric.image}
                    variantId={fabric.variantId}
                    catalogMode={true}
                    inventory={fabric.totalInventory}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 md:gap-3 mt-8 md:mt-24 mb-4 md:mb-12">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-7 w-7 md:h-10 md:w-10 flex items-center justify-center rounded-full border border-emerald-100/60 text-[#435C46]/60 hover:border-[#57AD43] hover:text-[#57AD43] transition-all disabled:opacity-30 disabled:hover:border-emerald-100/60 disabled:hover:text-[#435C46]/60"
                  >
                    <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      return p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1;
                    })
                    .map((page, index, array) => {
                      const showEllipsis = index > 0 && page - array[index - 1] > 1;
                      return (
                        <div key={page} className="flex items-center gap-1.5 md:gap-3">
                          {showEllipsis && <span className="text-gray-300 text-[8px] md:text-base">...</span>}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`h-7 w-7 md:h-10 md:w-10 flex items-center justify-center text-[8px] md:text-[11px] font-black transition-all rounded-full border ${currentPage === page
                              ? "bg-black text-white border-black shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                              : "bg-white text-[#435C46]/60 border-emerald-100/60 hover:border-[#57AD43] hover:text-[#57AD43]"
                              }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}

                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 w-7 md:h-10 md:w-10 flex items-center justify-center rounded-full border border-emerald-100/60 text-[#435C46]/60 hover:border-[#57AD43] hover:text-[#57AD43] transition-all disabled:opacity-30 disabled:hover:border-emerald-100/60 disabled:hover:text-[#435C46]/60"
                  >
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
    </>
  );
}

interface FilterDropdownProps {
  label: string;
  options: string[];
  onSelect: (val: string) => void;
  active?: boolean;
}

function FilterDropdown({ label, options, onSelect, active }: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-4 border rounded-xl px-5 py-3 w-full justify-between cursor-pointer transition-all group ${active
          ? 'border-[#57AD43] bg-[#57AD43]/5'
          : 'border-emerald-100/60 bg-white/40 shadow-[0_8px_20px_rgba(87,173,67,0.03)] hover:border-[#57AD43] hover:bg-emerald-50/20 backdrop-blur-sm'
          }`}
      >
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] truncate ${active ? 'text-[#57AD43]' : 'text-black'}`}>{label}</span>
        <ChevronDown size={14} className={`${active ? 'text-[#57AD43]' : 'text-[#435C46]/60'} group-hover:text-black transition-all ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white/95 backdrop-blur-lg border border-emerald-100/60 rounded-xl shadow-[0_20px_40px_rgba(87,173,67,0.12)] z-[500] overflow-hidden py-2 max-h-[300px] overflow-y-auto overscroll-contain">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(opt);
                setIsOpen(false);
              }}
              className={`px-5 py-3 text-[9px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${label === opt ? 'bg-[#57AD43] text-white' : 'text-[#435C46] hover:bg-emerald-50/40 hover:text-black'
                }`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SortDropdownProps {
  label: string;
  options: string[];
  onSelect: (val: string) => void;
}

function SortDropdown({ label, options, onSelect }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 border border-emerald-100/60 bg-white/40 shadow-[0_8px_20px_rgba(87,173,67,0.03)] rounded-xl px-5 py-3 w-full justify-between cursor-pointer transition-all group hover:border-[#57AD43] hover:bg-emerald-50/20 backdrop-blur-sm"
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black truncate">{label}</span>
        <ChevronDown size={14} className={`text-[#435C46]/60 group-hover:text-black transition-all ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white/95 backdrop-blur-lg border border-emerald-100/60 rounded-xl shadow-[0_20px_40px_rgba(87,173,67,0.12)] z-[500] overflow-hidden py-2 max-h-[300px] overflow-y-auto overscroll-contain">
          {options.map((opt) => (
            <div
              key={opt}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(opt);
                setIsOpen(false);
              }}
              className={`px-5 py-3 text-[9px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${label === opt ? 'bg-[#57AD43] text-white' : 'text-[#435C46] hover:bg-emerald-50/40 hover:text-black'
                }`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Searchable color dropdown — has a live text input inside the dropdown menu
interface SearchableFilterDropdownProps {
  label: string;
  options: string[];
  onSelect: (val: string) => void;
  active?: boolean;
}

function SearchableFilterDropdown({ label, options, onSelect, active }: SearchableFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="relative w-full">
      <div
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearch(""); }}
        className={`flex items-center gap-4 border rounded-xl px-5 py-3 w-full justify-between cursor-pointer transition-all group ${active
          ? 'border-[#57AD43] bg-[#57AD43]/5'
          : 'border-emerald-100/60 bg-white/40 shadow-[0_8px_20px_rgba(87,173,67,0.03)] hover:border-[#57AD43] hover:bg-emerald-50/20 backdrop-blur-sm'
          }`}
      >
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] truncate ${active ? 'text-[#57AD43]' : 'text-black'}`}>{label}</span>
        <ChevronDown size={14} className={`${active ? 'text-[#57AD43]' : 'text-[#435C46]/60'} group-hover:text-black transition-all ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full bg-white/95 backdrop-blur-lg border border-emerald-100/60 rounded-xl shadow-[0_20px_40px_rgba(87,173,67,0.12)] z-[500] overflow-hidden">
          {/* Search input inside dropdown */}
          <div className="px-4 py-2.5 border-b border-emerald-50" onClick={e => e.stopPropagation()}>
            <input
              id="search-color-input"
              autoFocus
              type="text"
              placeholder="Search color..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-[12px] font-bold uppercase tracking-[0.15em] outline-none text-black placeholder:text-gray-300"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-gray-300">No matches</div>
            ) : filtered.map((opt) => (
              <div
                key={opt}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(opt);
                  setIsOpen(false);
                  setSearch("");
                }}
                className={`px-5 py-3 text-[9px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${label === opt ? 'bg-[#57AD43] text-white' : 'text-[#435C46] hover:bg-emerald-50/40 hover:text-black'
                  }`}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
