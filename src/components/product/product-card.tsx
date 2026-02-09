"use client";

import Link from "next/link";
import { Product, Category, Brand } from "../../../generated/prisma/client";
import { ShoppingCart, Heart } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product & {
    category: Category;
    brand?: Brand | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  let mainImage = "/placeholder.jpg";
  try {
    const images = product.images ? JSON.parse(product.images) : [];
    if (Array.isArray(images) && images.length > 0) {
      mainImage = images[0];
    }
  } catch (e) {
    mainImage = "/placeholder.jpg";
  }

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="group relative"
    >
      {/* Image Container - Aspect 3:4 for modern look */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-base-200">
        <Link href={`/product/${product.slug}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainImage}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Overlay gradient for text readability if needed */}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />

        {/* Wishlist Button - Top Right */}
        <button
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-2 text-gray-900 opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-error group-hover:opacity-100 shadow-sm"
          title="Add to Wishlist"
        >
          <Heart size={18} />
        </button>

        {/* Add to Cart Button - Floating Bottom Center */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 transition-all duration-300 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 px-4">
          <button className="btn btn-primary btn-sm w-full max-w-[80%] rounded-full shadow-lg gap-2 backdrop-blur-md bg-primary/90 border-none hover:bg-primary text-white">
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        </div>

        {/* Badges - Top Left */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isOnSale && (
            <span className="badge badge-error text-white text-xs font-bold border-none shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {product.isFeatured && (
            <span className="badge badge-warning text-warning-content text-xs font-bold border-none shadow-sm">
              Hot
            </span>
          )}
        </div>
      </div>

      {/* Product Info - Clean Layout below image */}
      <div className="mt-4 flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-base-content/90 leading-tight group-hover:text-primary transition-colors line-clamp-2">
            <Link href={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
          <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
            {product.category.name}
          </p>
        </div>

        <div className="flex flex-col items-end text-right">
          <p className="text-sm font-bold text-base-content">
            {formatPrice(finalPrice)}
          </p>
          {isOnSale && (
            <p className="text-xs text-base-content/40 line-through font-medium">
              {formatPrice(price)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
