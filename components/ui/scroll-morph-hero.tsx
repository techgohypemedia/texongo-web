"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { motion, useTransform, useSpring, MotionValue } from "framer-motion";
import type { Fabric, ShopifyCollectionListItem } from "../../lib/shopify";
import { BLEND_ITEMS, KNIT_STYLE_ITEMS, fabricCategoryHref } from "../../lib/fabric-navigation";

// --- Types ---
interface FabricCardProps {
    src: string;
    label: string;
    index: number;
    totalCount: number;
    smoothProgress: MotionValue<number>;
    isMobile: boolean;
    containerSize: { w: number; h: number };
    scatterPos: { x: number; y: number; r: number };
    href: string;
    attachedProductName?: string;
}

const FALLBACK_IMAGES = [
    "/placeholders/cotton.png",
    "/placeholders/viscose.png",
    "/placeholders/linen.png",
    "/placeholders/wool.png",
    "/placeholders/silk.png",
];

// --- Optimized FabricCard Component ---
const FabricCard = React.memo(({
    src,
    label,
    index,
    totalCount,
    smoothProgress,
    isMobile,
    containerSize,
    scatterPos,
    href,
    attachedProductName,
    direction = "clockwise"
}: FabricCardProps & { direction?: "clockwise" | "anticlockwise" }) => {

    // Constant geometry calculations
    const directionMultiplier = direction === "clockwise" ? 1 : -1;
    const baseAngle = directionMultiplier * (index / totalCount) * 360;
    const minDim = Math.min(containerSize.w, containerSize.h);
    const isTablet = containerSize.w >= 768 && containerSize.w < 1200;
    const radius = isMobile ? minDim * 0.36 : (isTablet ? minDim * 0.42 : minDim * 0.36);

    // Spacing between cards in the horizontal line phase
    const hSpacing = isMobile ? 160 : (isTablet ? 220 : 300);
    const totalW = (totalCount - 1) * hSpacing;
    const initialLineX = index * hSpacing;

    // Position & Scale Transform
    const transform = useTransform(smoothProgress, (p) => {
        const morph = p < 0.15 ? 0 : (p < 0.30 ? (p - 0.15) / 0.15 : 1);
        const shuffleProgress = p < 0.30 ? 0 : (p < 0.45 ? (p - 0.30) / 0.15 : 1);
        const lineProgress = p < 0.45 ? 0 : (p < 0.55 ? (p - 0.45) / 0.1 : 1);
        const slideProgress = p < 0.55 ? 0 : (p < 0.90 ? (p - 0.55) / 0.35 : 1);

        const angle = baseAngle + (directionMultiplier * shuffleProgress * 120);
        const rad = (angle * Math.PI) / 180;

        let tx = Math.cos(rad) * radius;
        let ty = Math.sin(rad) * radius;
        let tr = angle + 90;
        let ts = (isMobile ? 0.55 : (isTablet ? 0.75 : 0.9)) / 3;

        if (lineProgress > 0) {
            const endSlideOffset = isMobile ? containerSize.w * 0.1 : (isTablet ? containerSize.w * 0.2 : containerSize.w * 0.35);
            const slideTarget = totalW - endSlideOffset;
            const lineX = (direction === "clockwise" ? 1 : -1) * (initialLineX - (slideProgress * slideTarget));

            tx = tx * (1 - lineProgress) + lineX * lineProgress;
            const shiftY = isMobile ? -15 : -30;
            ty = ty * (1 - lineProgress) + (shiftY * lineProgress);
            tr = tr * (1 - lineProgress);
            const maxCardH = isMobile ? 220 : 380;
            const safeTs = (containerSize.h < maxCardH ? (containerSize.h / 140) * 0.8 : (isMobile ? 1.4 : (isTablet ? 2.0 : 2.7))) / 3;
            ts = ts * (1 - lineProgress) + safeTs * lineProgress;
        }

        const finalX = scatterPos.x * (1 - morph) + tx * morph;
        const finalY = scatterPos.y * (1 - morph) + ty * morph;
        const finalR = scatterPos.r * (1 - morph) + tr * morph;
        const finalS = (0.4 / 3) * (1 - morph) + ts * morph;

        return `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0) rotate(${finalR.toFixed(2)}deg) scale(${finalS.toFixed(3)})`;
    });

    // Counter-rotation for label pill — keeps text always upright so it never blurs during spin
    const labelTransform = useTransform(smoothProgress, (p) => {
        const morph = p < 0.15 ? 0 : (p < 0.30 ? (p - 0.15) / 0.15 : 1);
        const shuffleProgress = p < 0.30 ? 0 : (p < 0.45 ? (p - 0.30) / 0.15 : 1);
        const lineProgress = p < 0.45 ? 0 : (p < 0.55 ? (p - 0.45) / 0.1 : 1);

        const angle = baseAngle + (directionMultiplier * shuffleProgress * 120);
        let tr = angle + 90;
        if (lineProgress > 0) tr = tr * (1 - lineProgress);
        const finalR = scatterPos.r * (1 - morph) + tr * morph;

        // Negate the card rotation so the label stays perfectly level
        return `translate3d(0,0,0) rotate(${(-finalR).toFixed(2)}deg)`;
    });

    const opacity = useTransform(smoothProgress, [0, 0.1, 1.0], [0, 1, 1]);

    return (
        <motion.div
            style={{
                transform,
                opacity,
                position: "absolute",
                width: 300,
                height: 420,
                willChange: "transform",
                zIndex: 2,
                transformStyle: "preserve-3d",
                isolation: "isolate",
            }}
            className="group"
        >
            <Link
                href={href}
                aria-label={attachedProductName ? `View ${attachedProductName}` : `Explore ${label}`}
                title={attachedProductName ? `${label}: ${attachedProductName}` : label}
                className="block h-full w-full"
            >
                    <motion.div
                        className="relative h-full w-full rounded-[30px] shadow-2xl bg-gray-100 border border-black/5 transform-gpu"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        {/* Front Side - Image only */}
                        <div 
                            className="absolute inset-0 w-full h-full rounded-[30px] overflow-hidden" 
                        >
                            {src ? (
                                <img
                                    src={src}
                                    alt={label}
                                    className="h-full w-full object-cover"
                                    loading="eager"
                                    {...{ fetchPriority: "high" }}
                                    decoding="async"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full w-full bg-gray-200 text-gray-500 font-bold text-sm uppercase">
                                    No Image
                                </div>
                            )}
                            <motion.div
                                className="absolute inset-0 bg-black/5 pointer-events-none"
                                initial={{ opacity: 1 }}
                                whileHover={{ opacity: 0 }}
                            />
                            <motion.div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    transform: labelTransform,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "flex-end",
                                    paddingBottom: "24px",
                                    pointerEvents: "none"
                                }}
                            >
                                <span className="text-[20px] font-extrabold uppercase text-white bg-black/30 backdrop-blur-md border border-white/30 px-6 py-2.5 rounded-lg tracking-[0.2em] leading-tight text-center shadow-xl max-w-[90%]">
                                    {label}
                                </span>
                            </motion.div>
                        </div>
                    </motion.div>
                </Link>
        </motion.div>
    );
});

FabricCard.displayName = "FabricCard";

const KNIT_STYLE_IMAGE_BY_NAME: Record<(typeof KNIT_STYLE_ITEMS)[number], string> = {
    "Single Jersey": "https://texongo.com/wp-content/uploads/2025/12/Single-Jersey_20241215064031pm.png",
    "French Terry": "https://texongo.com/wp-content/uploads/2025/12/Terry_20241215064032pm.png",
    "Fleece": "https://texongo.com/wp-content/uploads/2025/09/Fleece_20241215064034pm.png",
    "Rib": "https://texongo.com/wp-content/uploads/2025/12/Rib_20241215064030pm.png",
    "Spandex Knits": "https://texongo.com/wp-content/uploads/2025/12/Cotton-Spandex_20241215064033pm.png",
    "Pique": "https://texongo.com/wp-content/uploads/2025/08/Pique_20241215064036pm.png",
    "Interlock": "/arrivals/prod-cotton-spandex-interlock.png",
    "Waffle": "https://texongo.com/wp-content/uploads/2025/08/Waffle_20241215064033pm.png",
    "Jacquard": "https://texongo.com/wp-content/uploads/2025/12/Jacquard_20241215064035pm.png",
    "Stripes": "/category/fabric-french-terry.png",
    "Corduroy Vellour": "/category/fabric-single-jersey.png",
    "Printed": "https://texongo.com/wp-content/uploads/2025/10/M9K4S107_3-600x600-1-300x300.jpg",
    "Shiffly": "https://texongo.com/wp-content/uploads/2025/10/M9K4S107_3-600x600-1-300x300.jpg",
    "Ponte": "/category/fabric-pique.png",
    "Yarn Dyed": "/arrivals/prod-slub-melange.png",
    "Neps": "/arrivals/prod-slub-melange.png",
    "Popcorn": "https://texongo.com/wp-content/uploads/2025/10/A8K1S101-3-768x768-1-300x300.jpg",
};

const BLEND_IMAGE_BY_NAME: Record<(typeof BLEND_ITEMS)[number], string> = {
    "Cotton": "https://texongo.com/wp-content/uploads/2025/12/Cotton_20241215064034pm.png",
    "Viscose": "https://texongo.com/wp-content/uploads/2025/11/Viscose_20241215064032pm.png",
    "Cotton Modal": "/placeholders/cotton.png",
    "Giza/ Egyptian": "/placeholders/cotton.png",
    "Melange": "https://texongo.com/wp-content/uploads/2025/12/Melange_20241215064035pm.png",
    "Nylon": "/arrivals/prod-nylon-spandex.png",
    "Poly Cotton": "https://texongo.com/wp-content/uploads/2025/08/Poly-Cotton_20241215064036pm.png",
    "Polyester": "https://texongo.com/wp-content/uploads/2025/12/Polyester_20241215064037pm.png",
    "Slub": "/arrivals/prod-slub-melange.png",
    "Spandex Blends": "https://texongo.com/wp-content/uploads/2025/12/Cotton-Spandex_20241215064033pm.png",
    "Australian": "/placeholders/wool.png",
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    "Single Jersey": ["single jersey", "jersey"],
    "French Terry": ["french terry", "terry"],
    "Rib": ["rib", "ribs"],
    "Spandex Knits": ["spandex", "elastane", "lycra"],
    "Stripes": ["stripes", "stripe"],
    "Corduroy Vellour": ["corduroy vellour", "corduroy", "vellour", "velour"],
    "Printed": ["printed", "print"],
    "Shiffly": ["shiffly", "schiffli", "embroidery"],
    "Yarn Dyed": ["yarn dyed", "yarn"],
    "Neps": ["neps", "nep"],
    "Cotton Modal": ["cotton modal", "modal cotton", "modal"],
    "Giza/ Egyptian": ["giza", "egyptian"],
    "Polyester": ["polyester", "poly"],
    "Poly Cotton": ["poly cotton", "poly-cotton", "polyester cotton"],
    "Slub": ["slub", "slubs"],
    "Spandex Blends": ["spandex", "elastane", "lycra"],
};

type CategoryKind = "knit" | "blend";

interface CategoryCardData {
    name: string;
    src: string;
    href: string;
    attachedProductName?: string;
}

function seededUnit(seed: number) {
    const value = Math.sin(seed) * 10000;
    return value - Math.floor(value);
}

function getScatterPosition(index: number, salt: number) {
    return {
        x: (seededUnit(index * 11 + salt) - 0.5) * 1200,
        y: (seededUnit(index * 17 + salt) - 0.5) * 800,
        r: (seededUnit(index * 23 + salt) - 0.5) * 180,
    };
}

function normalizeSearchText(value: string | undefined | null) {
    return (value || "")
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function textHasKeyword(text: string, keyword: string) {
    const cleanText = ` ${normalizeSearchText(text)} `;
    const cleanKeyword = normalizeSearchText(keyword);

    if (!cleanKeyword) return false;
    return cleanText.includes(` ${cleanKeyword} `);
}

function keywordsForLabel(label: string) {
    return CATEGORY_KEYWORDS[label] || [label];
}

function findProductForCategory(products: Fabric[] | undefined, label: string, kind: CategoryKind) {
    if (!products?.length) return undefined;

    const keywords = keywordsForLabel(label);
    let bestProduct: Fabric | undefined;
    let bestScore = 0;

    products.forEach((product, index) => {
        if (!product.id) return;

        const primaryFields = kind === "knit"
            ? [product.knit_style, product.type, product.name]
            : [product.fabric, product.content, product.type, product.name];
        const secondaryFields = [
            product.name,
            product.description,
            product.type,
            product.knit_style,
            product.composition,
            product.content,
            product.fabric,
        ];

        // STRICT MATCH: Ensure the product actually belongs to this category explicitly
        // by checking if any primary field exactly matches the label or keywords.
        const isStrictMatch = primaryFields.some(field => {
            if (!field) return false;
            const cleanField = field.trim().toLowerCase();
            if (cleanField === label.toLowerCase()) return true;
            return keywords.some(kw => cleanField === kw.toLowerCase() || cleanField.includes(kw.toLowerCase()));
        });

        if (!isStrictMatch) return;

        const primaryText = primaryFields.filter(Boolean).join(" ");
        const secondaryText = secondaryFields.filter(Boolean).join(" ");

        let score = 0;
        if (textHasKeyword(primaryText, label)) score += 12;
        if (textHasKeyword(secondaryText, label)) score += 6;

        keywords.forEach((keyword) => {
            if (textHasKeyword(primaryText, keyword)) score += 5;
            if (textHasKeyword(secondaryText, keyword)) score += 2;
        });

        const tieBreaker = Math.max(0, 1 - index / 1000);
        const finalScore = score + tieBreaker;

        if (score > 0 && finalScore > bestScore) {
            bestScore = finalScore;
            bestProduct = product;
        }
    });

    return bestProduct;
}

function buildCategoryCards(
    labels: readonly string[],
    imagesByName: Record<string, string>,
    kind: CategoryKind,
    products?: Fabric[],
    collections?: ShopifyCollectionListItem[]
): CategoryCardData[] {
    const cards: CategoryCardData[] = [];
    
    labels.forEach((name, index) => {
        const product = findProductForCategory(products, name, kind);
        
        const collection = collections?.find(c => {
            const cTitle = c.title.toLowerCase().trim();
            const nTitle = name.toLowerCase().trim();
            const cHandle = c.handle.toLowerCase().trim();
            const nHandle = nTitle.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            if (cTitle === nTitle || cHandle === nHandle) return true;
            
            // Plural/singular matching
            if (cTitle === nTitle + 's' || cTitle + 's' === nTitle) return true;
            
            // Substring mappings
            if (nTitle === "giza/ egyptian" && cTitle === "giza") return true;

            return false;
        });
        
        const collectionHandle = collection ? collection.handle : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        const imgSrc = (collection?.image && collection.image !== "") ? collection.image : ((product?.image && product.image !== "") ? product.image : "");

        cards.push({
            name, // we keep the category name for the label
            src: imgSrc,
            href: `/collections/${collectionHandle}`,
            attachedProductName: product?.name || "",
        });
    });
    
    return cards;
}

export function IntroAnimation({ scrollProgress, products, collections }: { scrollProgress: MotionValue<number>, products?: Fabric[], collections?: ShopifyCollectionListItem[] }) {
    const [isMobile, setIsMobile] = useState(false);
    const [containerSize, setContainerSize] = useState({ w: 1200, h: 800 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const update = () => {
            setIsMobile(window.innerWidth < 768);
            if (containerRef.current) {
                setContainerSize({
                    w: containerRef.current.offsetWidth,
                    h: containerRef.current.offsetHeight,
                });
            }
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const smoothProgress = useSpring(scrollProgress, {
        stiffness: 60,
        damping: 40,
        mass: 1.2,
        restDelta: 0.001
    });

    const cards = useMemo(() => {
        const allCards = buildCategoryCards(KNIT_STYLE_ITEMS, KNIT_STYLE_IMAGE_BY_NAME, "knit", products, collections);
        return isMobile ? allCards.slice(0, 10) : allCards;
    }, [products, collections, isMobile]);

    const scatterPositions = useMemo(() => {
        return Array.from({ length: cards.length }, (_, index) => getScatterPosition(index, 7));
    }, [cards.length]);

    const titleOpacity = useTransform(smoothProgress, [0, 0.1, 0.2, 0.4, 0.45], [0, 0, 1, 1, 0]);
    const titleY = useTransform(smoothProgress, [0, 0.1, 0.2, 0.4, 0.45], [20, 20, 0, 0, -30]);

    const horizontalTitleOpacity = useTransform(smoothProgress, [0.45, 0.55, 0.85, 0.95], [0, 1, 1, 0]);
    const horizontalTitleY = useTransform(smoothProgress, [0.45, 0.55, 0.85, 0.95], [20, 0, 0, -30]);

    const arrowOpacity = useTransform(smoothProgress, [0.45, 0.55, 0.9], [0, 1, 1]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-white overflow-hidden font-sans select-none transform-gpu">
            <div className="flex h-full w-full items-center justify-center pt-12 md:pt-18">

                {/* Hero Header */}
                <motion.div
                    style={{ opacity: titleOpacity, y: titleY }}
                    className="absolute z-10 text-center pointer-events-none"
                >
                    <h1 className="hp-heading !text-3xl md:!text-6xl text-black uppercase mb-6">
                        Choose Your <br />
                        <span className="text-[#57AD43]">Knit Style</span>
                    </h1>
                </motion.div>

                {/* Cards Layer */}
                <div className="relative flex items-center justify-center w-full h-full perspective-1000 transform-gpu z-20">
                    {cards.map((item, i) => (
                        <FabricCard
                            key={i}
                            index={i}
                            src={item.src}
                            label={item.name}
                            href={item.href}
                            attachedProductName={item.attachedProductName}
                            totalCount={cards.length}
                            smoothProgress={smoothProgress}
                            isMobile={isMobile}
                            containerSize={containerSize}
                            scatterPos={scatterPositions[i] || { x: 0, y: 0, r: 0 }}
                            direction="clockwise"
                        />
                    ))}
                </div>

                {/* Horizontal Phase Header */}
                <motion.div 
                    style={{ opacity: horizontalTitleOpacity, y: horizontalTitleY }} 
                    className="absolute top-[clamp(6rem,10vh,10rem)] w-full flex justify-center items-center z-50 pointer-events-none px-6"
                >
                    <h2 className="hp-heading text-black text-center uppercase">Our Premium Knit Collection</h2>
                </motion.div>
            </div>
        </div>
    );
}

export function BlendAnimation({ scrollProgress, products, collections }: { scrollProgress: MotionValue<number>, products?: Fabric[], collections?: ShopifyCollectionListItem[] }) {
    const [isMobile, setIsMobile] = useState(false);
    const [containerSize, setContainerSize] = useState({ w: 1200, h: 800 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const update = () => {
            setIsMobile(window.innerWidth < 768);
            if (containerRef.current) {
                setContainerSize({
                    w: containerRef.current.offsetWidth,
                    h: containerRef.current.offsetHeight,
                });
            }
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    const smoothProgress = useSpring(scrollProgress, {
        stiffness: 60,
        damping: 40,
        mass: 1.2,
        restDelta: 0.001
    });

    const cards = useMemo(() => {
        const allCards = buildCategoryCards(BLEND_ITEMS, BLEND_IMAGE_BY_NAME, "blend", products, collections);
        return isMobile ? allCards.slice(0, 8) : allCards;
    }, [products, collections, isMobile]);

    const scatterPositions = useMemo(() => {
        return Array.from({ length: cards.length }, (_, index) => getScatterPosition(index, 31));
    }, [cards.length]);

    const titleOpacity = useTransform(smoothProgress, [0, 0.1, 0.2, 0.4, 0.45], [0, 0, 1, 1, 0]);
    const titleY = useTransform(smoothProgress, [0, 0.1, 0.2, 0.4, 0.45], [20, 20, 0, 0, -30]);

    const horizontalTitleOpacity = useTransform(smoothProgress, [0.45, 0.55, 0.85, 0.95], [0, 1, 1, 0]);
    const horizontalTitleY = useTransform(smoothProgress, [0.45, 0.55, 0.85, 0.95], [20, 0, 0, -30]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-white overflow-hidden font-sans select-none transform-gpu">
            <div className="flex h-full w-full items-center justify-center pt-12 md:pt-18">

                {/* Hero Header */}
                <motion.div
                    style={{ opacity: titleOpacity, y: titleY }}
                    className="absolute z-10 text-center pointer-events-none"
                >
                    <h1 className="hp-heading !text-3xl md:!text-6xl text-black mb-6">
                        Choose Your <br />
                        <span className="text-[#57AD43]">Blend Style</span>
                    </h1>
                </motion.div>

                {/* Cards Layer */}
                <div className="relative flex items-center justify-center w-full h-full perspective-1000 transform-gpu z-20">
                    {cards.map((item, i) => (
                        <FabricCard
                            key={i}
                            index={i}
                            src={item.src}
                            label={item.name}
                            href={item.href}
                            attachedProductName={item.attachedProductName}
                            totalCount={cards.length}
                            smoothProgress={smoothProgress}
                            isMobile={isMobile}
                            containerSize={containerSize}
                            scatterPos={scatterPositions[i] || { x: 0, y: 0, r: 0 }}
                            direction="anticlockwise"
                        />
                    ))}
                </div>

                {/* Horizontal Phase Header */}
                <motion.div 
                    style={{ opacity: horizontalTitleOpacity, y: horizontalTitleY }} 
                    className="absolute top-[clamp(6rem,10vh,10rem)] w-full flex justify-center items-center z-50 pointer-events-none px-6"
                >
                    <h2 className="hp-heading text-black text-center uppercase">Our Premium Blend Collection</h2>
                </motion.div>
            </div>
        </div>
    );
}

export default IntroAnimation;
