"use client";

import { useState } from "react";
import {
  Product,
  ProductVariant,
  Attribute,
  ProductSpec,
} from "../../../generated/prisma/client";
import { ShoppingCart, Heart, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";

interface ProductInfoProps {
  product: Product & {
    variants: ProductVariant[];
    specs: (ProductSpec & { attribute: Attribute })[];
  };
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null,
  );
  const [quantity, setQuantity] = useState(1);

  // Calculate Display Price
  const basePrice = Number(product.price);
  const variantPrice = selectedVariant
    ? Number(selectedVariant.price)
    : basePrice;
  const discountPrice = product.discountPrice
    ? Number(product.discountPrice)
    : null;

  // Logic: If variant exists, use variant price. If discount exists on base product, apply it logic (simplified)
  // For this demo: We'll show variant price if selected, else base price.
  // Discounts usually apply to base, but let's assume discountPrice overrides everything if present for simplicity
  const finalPrice = discountPrice || variantPrice;

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(p);
  };

  const handleAddToCart = () => {
    // Phase 9: Connect to Cart Store
    console.log("Add to cart:", {
      productId: product.id,
      variantId: selectedVariant?.id,
      quantity,
      price: finalPrice,
    });
    // Temporary Alert
    alert(`Added ${quantity} x ${product.name} to cart!`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-base-content mb-2">
          {product.name}
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-primary">
            {formatPrice(finalPrice)}
          </div>
          {discountPrice && (
            <div className="text-lg text-base-content/40 line-through">
              {formatPrice(variantPrice)}
            </div>
          )}
          {product.stock > 0 ? (
            <div className="badge badge-success badge-outline">In Stock</div>
          ) : (
            <div className="badge badge-error badge-outline">Out of Stock</div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-base-content/70 leading-relaxed text-lg">
        {product.description}
      </p>

      {/* Variant Selector (Simple Implementation) */}
      {product.variants.length > 0 && (
        <div className="space-y-3">
          <span className="font-bold text-sm uppercase tracking-wide opacity-70">
            Available Options
          </span>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={`btn btn-sm md:btn-md rounded-full px-6 ${
                  selectedVariant?.id === variant.id
                    ? "btn-neutral"
                    : "btn-outline border-base-300 hover:bg-base-200 hover:text-base-content"
                }`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 pt-4 border-t border-base-200">
        <div className="flex items-center gap-4">
          {/* Quantity */}
          <div className="flex items-center border border-base-300 rounded-full h-12 w-32 justify-between px-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <Minus size={16} />
            </button>
            <span className="font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Wishlist */}
          <button className="btn btn-outline btn-circle h-12 w-12 border-base-300">
            <Heart size={20} />
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          className="btn btn-primary btn-block h-14 rounded-full text-lg shadow-xl shadow-primary/20"
        >
          <ShoppingCart size={20} className="mr-2" />
          Add to Cart
        </button>
      </div>

      {/* Specs / Details */}
      {product.specs.length > 0 && (
        <div className="bg-base-200/50 rounded-2xl p-6 mt-8">
          <h3 className="font-bold text-lg mb-4">Technical Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
            {product.specs.map((spec) => (
              <div
                key={spec.id}
                className="flex justify-between py-2 border-b border-base-content/5"
              >
                <span className="opacity-70">{spec.attribute.name}</span>
                <span className="font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
