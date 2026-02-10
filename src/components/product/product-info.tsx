"use client"

import { useState } from "react";
import { Product, ProductVariant, Attribute, ProductSpec, Category } from "../../../generated/prisma/client";
import { ShoppingCart, Heart, Minus, Plus, Check } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { toast } from "react-hot-toast";

interface ProductInfoProps {
  product: Product & {
    variants: ProductVariant[];
    specs: (ProductSpec & { attribute: Attribute })[];
    category: Category;
  };
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const addToCart = useCartStore((state) => state.addItem);

  const basePrice = Number(product.price);
  const variantPrice = selectedVariant ? Number(selectedVariant.price) : basePrice;
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;

  const finalPrice = discountPrice || variantPrice;

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      maximumFractionDigits: 0,
    }).format(p);
  };

  const handleAddToCart = () => {
    let image = "/placeholder.jpg";
    try {
      const images = product.images ? JSON.parse(product.images) : [];
      if (images.length > 0) image = images[0];
    } catch (e) { }

    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id || null,
      name: product.name + (selectedVariant ? ` (${selectedVariant.name})` : ""),
      price: finalPrice,
      image,
      quantity,
      stock: selectedVariant ? selectedVariant.stock : product.stock,
      categoryName: product.category.name,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);

    // ✅ Custom Toast with Image & Details
    toast.custom((t) => (
      <div className={`bg-base-100 border border-base-200 shadow-xl rounded-2xl p-4 flex items-center gap-4 min-w-[300px] transform transition-all duration-300 ${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="w-12 h-12 bg-base-200 rounded-xl overflow-hidden shrink-0 border border-base-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm truncate pr-2">{product.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="badge badge-sm badge-success text-white gap-1 px-1.5 h-5">
              <Check size={10} /> Added
            </span>
            <span className="text-xs text-base-content/60">
              Qty: <strong className="text-base-content">{quantity}</strong>
            </span>
          </div>
        </div>
      </div>
    ), { position: "bottom-right", duration: 3000 });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-base-content mb-2">{product.name}</h1>
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-primary">{formatPrice(finalPrice)}</div>
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

      {/* Variant Selector */}
      {product.variants.length > 0 && (
        <div className="space-y-3">
          <span className="font-bold text-sm uppercase tracking-wide opacity-70">Available Options</span>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={`btn btn-sm md:btn-md rounded-full px-6 ${selectedVariant?.id === variant.id
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
          disabled={isAdded || product.stock === 0}
          className={`btn btn-block h-14 rounded-full text-lg shadow-xl transition-all ${isAdded ? "btn-success text-white" : "btn-primary shadow-primary/20"
            }`}
        >
          {isAdded ? (
            <>
              <Check size={20} className="mr-2" />
              Added to Cart!
            </>
          ) : (
            <>
              <ShoppingCart size={20} className="mr-2" />
              Add to Cart
            </>
          )}
        </button>
      </div>

      {/* Specs / Details */}
      {product.specs.length > 0 && (
        <div className="bg-base-200/50 rounded-2xl p-6 mt-8">
          <h3 className="font-bold text-lg mb-4">Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8">
            {product.specs.map((spec) => (
              <div key={spec.id} className="flex justify-between py-2 border-b border-base-content/5">
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