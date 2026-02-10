"use client"

import Link from "next/link";
import { Product, Category, Brand } from "../../../generated/prisma/client";
import { ShoppingCart, Heart, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useCartStore } from "@/store/cart-store";
import { toast } from "react-hot-toast";
import { useState } from "react";

interface ProductCardProps {
  product: Product & {
    category: Category;
    brand?: Brand | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addToCart = useCartStore((state) => state.addItem);

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
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const finalPrice = discountPrice || price;
  const isOnSale = discountPrice && discountPrice < price;
  const discountPercent = isOnSale
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(p);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart({
      productId: product.id,
      variantId: null,
      name: product.name,
      price: finalPrice,
      image: mainImage,
      quantity: 1,
      stock: product.stock,
      categoryName: product.category.name,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);

    // ✅ Custom Toast matching Product Page style
    toast.custom((t) => (
      <div className={`bg-base-100 border border-base-200 shadow-xl rounded-2xl p-4 flex items-center gap-4 min-w-[300px] transform transition-all duration-300 ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="w-12 h-12 bg-base-200 rounded-xl overflow-hidden shrink-0 border border-base-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
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
    ), { position: "bottom-right", duration: 2500 });
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
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-base-200">
        <Link href={`/product/${product.slug}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mainImage}
            alt={product.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />

        {/* Wishlist Button */}
        <button
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-2 text-gray-900 opacity-0 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-error group-hover:opacity-100 shadow-sm"
          title="Add to Wishlist"
        >
          <Heart size={18} />
        </button>

        {/* Add to Cart Button */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 transition-all duration-300 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 px-4">
          <button
            onClick={handleAddToCart}
            disabled={isAdded || product.stock === 0}
            className={`btn btn-sm w-full max-w-[90%] rounded-full shadow-lg gap-2 backdrop-blur-md border-none text-white transition-all ${isAdded
              ? "bg-success hover:bg-success"
              : "bg-primary/90 hover:bg-primary"
              }`}
          >
            {isAdded ? <Check size={16} /> : <ShoppingCart size={16} />}
            {isAdded ? "Added" : "Add to Cart"}
          </button>
        </div>

        {/* Badges */}
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

      {/* Info */}
      <div className="mt-4 flex justify-between items-start gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-base-content/90 leading-tight group-hover:text-primary transition-colors line-clamp-2">
            <Link href={`/product/${product.slug}`}>
              {product.name}
            </Link>
          </h3>
          <p className="text-xs text-base-content/50 font-medium uppercase tracking-wide">
            {product.category.name}
          </p>
        </div>

        <div className="flex flex-col items-end text-right">
          <p className="text-sm font-bold text-base-content">{formatPrice(finalPrice)}</p>
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