"use client";

import Link from "next/link";
import {
  Product,
  Category,
  Brand,
  ProductVariant,
} from "../../../generated/prisma/client";
import { ShoppingCart, Check, ArrowRight, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cart-store";
import { toast } from "react-hot-toast";
import { useState, useMemo } from "react";
import WishlistButton from "@/components/product/wishlist-button";

interface ProductCardProps {
  product: Product & {
    category: Category;
    brand?: Brand | null;
    variants?: ProductVariant[]; // ✅ Added variants to props
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);

  const addToCart = useCartStore((state) => state.addItem);

  // 1. Extract Default Image
  const defaultImage = useMemo(() => {
    try {
      const images = product.images ? JSON.parse(product.images) : [];
      if (Array.isArray(images) && images.length > 0) return images[0];
    } catch (e) {}
    return "/placeholder.jpg";
  }, [product.images]);

  const currentImage = activeImage || defaultImage;

  // 2. Extract Unique Colors from Variants
  const colorVariants = useMemo(() => {
    if (!product.variants) return [];
    const uniqueColors: ProductVariant[] = [];
    const seenHex = new Set<string>();

    product.variants.forEach((v) => {
      if (v.colorCode && !seenHex.has(v.colorCode.toLowerCase())) {
        seenHex.add(v.colorCode.toLowerCase());
        uniqueColors.push(v);
      }
    });
    return uniqueColors;
  }, [product.variants]);

  const displayVariants = colorVariants.slice(0, 5);
  const extraVariantsCount = colorVariants.length - 5;

  // 3. Pricing Logic
  const price = Number(product.price);
  const discountPrice = product.discountPrice
    ? Number(product.discountPrice)
    : null;
  const finalPrice = discountPrice || price;
  const isOnSale = discountPrice && discountPrice < price;
  const discountPercent = isOnSale
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(p);
  };

  const hasOptions =
    product.hasVariants && product.variants && product.variants.length > 0;

  // 4. Action Handlers
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      productId: product.id,
      variantId: null,
      name: product.name,
      price: finalPrice,
      image: currentImage,
      quantity: 1,
      stock: product.stock,
      categoryName: product.category.name,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);

    toast.custom(
      (t) => (
        <div
          className={`bg-base-100 border border-base-200 shadow-xl rounded-2xl p-4 flex items-center gap-4 min-w-[300px] transform transition-all duration-300 ${t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        >
          <div className="w-12 h-12 bg-base-200 rounded-xl overflow-hidden shrink-0 border border-base-300">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm truncate pr-2">{product.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="badge badge-sm badge-success text-white gap-1 px-1.5 h-5">
                <Check size={10} /> Added
              </span>
              <span className="text-xs text-base-content/60">
                Qty: <strong className="text-base-content">1</strong>
              </span>
            </div>
          </div>
        </div>
      ),
      { position: "bottom-right", duration: 2500 },
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group flex flex-col bg-base-100 rounded-3xl border border-base-200 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
    >
      {/* --- TOP: IMAGE GALLERY --- */}
      <div className="relative aspect-4/5 w-full overflow-hidden bg-base-200/50">
        <Link href={`/product/${product.slug}`} className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImage}
              initial={{ opacity: 0.8, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0.8, scale: 1.02 }}
              transition={{ duration: 0.3 }}
              src={currentImage}
              alt={product.name}
              className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
            />
          </AnimatePresence>
        </Link>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5 pointer-events-none" />

        {/* Floating Actions */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <WishlistButton
            productId={product.id}
            className="rounded-full bg-base-100/90 p-2.5 text-base-content backdrop-blur-md shadow-lg hover:bg-base-100 hover:text-error transition-all"
          />
          <Link
            href={`/product/${product.slug}`}
            className="rounded-full bg-base-100/90 p-2.5 text-base-content backdrop-blur-md shadow-lg hover:bg-primary hover:text-white transition-all"
            title="Quick View"
          >
            <Eye size={20} />
          </Link>
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2 pointer-events-none">
          {isOnSale && (
            <span className="badge badge-error text-white font-bold border-none shadow-md backdrop-blur-md px-3 py-3">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="badge badge-warning text-warning-content font-bold border-none shadow-md backdrop-blur-md px-3 py-3">
              HOT
            </span>
          )}
          {product.stock === 0 && (
            <span className="badge badge-neutral text-white font-bold border-none shadow-md backdrop-blur-md px-3 py-3">
              SOLD OUT
            </span>
          )}
        </div>

        {/* Bottom Slide-up Action Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out z-10">
          {hasOptions ? (
            <Link
              href={`/product/${product.slug}`}
              className="btn btn-primary w-full rounded-2xl shadow-xl backdrop-blur-md border-none text-white transition-all hover:scale-[1.02]"
            >
              Choose Options <ArrowRight size={16} />
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isAdded || product.stock === 0}
              className={`btn w-full rounded-2xl shadow-xl backdrop-blur-md border-none text-white transition-all hover:scale-[1.02] ${
                isAdded
                  ? "bg-success hover:bg-success"
                  : "bg-primary hover:bg-primary/90"
              }`}
            >
              {isAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
              {isAdded ? "Added to Cart" : "Add to Cart"}
            </button>
          )}
        </div>
      </div>

      {/* --- BOTTOM: DETAILS --- */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          {/* Category & Brand */}
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold text-base-content/50 uppercase tracking-widest">
              {product.category.name}
            </p>
            {product.brand && (
              <p className="text-[11px] font-bold text-primary opacity-80">
                {product.brand.name}
              </p>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-bold text-base-content leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-12">
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>

        {/* Price & Colors Row */}
        <div className="flex items-end justify-between mt-auto">
          {/* Pricing */}
          <div className="flex flex-col">
            {isOnSale && (
              <span className="text-xs text-base-content/40 line-through font-medium mb-0.5">
                {formatPrice(price)}
              </span>
            )}
            <span className="text-lg font-black text-base-content">
              {formatPrice(finalPrice)}
            </span>
          </div>

          {/* Color Swatches */}
          {colorVariants.length > 0 && (
            <div className="flex items-center gap-1.5 bg-base-200/50 p-1.5 rounded-full border border-base-200">
              {displayVariants.map((v) => (
                <button
                  key={v.id}
                  onMouseEnter={() => {
                    if (v.image) setActiveImage(v.image);
                    setActiveColor(v.colorCode);
                  }}
                  onMouseLeave={() => {
                    setActiveImage(null);
                    setActiveColor(null);
                  }}
                  onClick={(e) => e.preventDefault()}
                  className={`w-5 h-5 rounded-full shadow-sm transition-all duration-300 ${
                    activeColor === v.colorCode
                      ? "ring-2 ring-primary ring-offset-2 scale-110"
                      : "border border-base-300 hover:scale-110"
                  }`}
                  style={{ backgroundColor: v.colorCode || "#fff" }}
                  title={v.name}
                  aria-label={`Color: ${v.name}`}
                />
              ))}
              {extraVariantsCount > 0 && (
                <span className="text-[10px] font-bold text-base-content/60 px-1">
                  +{extraVariantsCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
