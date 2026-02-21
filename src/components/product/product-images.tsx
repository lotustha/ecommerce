"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ProductImagesProps {
  images: string[];
  title: string;
}

export default function ProductImages({ images, title }: ProductImagesProps) {
  const parsedImages = Array.isArray(images)
    ? images
    : typeof images === "string"
      ? JSON.parse(images)
      : ["/placeholder.jpg"];

  const [mainImage, setMainImage] = useState(parsedImages[0]);

  // ✅ LISTEN FOR SMART COLOR CLICKS
  // This allows the sibling ProductInfo component to tell the Gallery to slide to the Variant's Image
  useEffect(() => {
    const handleVariantChange = (e: CustomEvent) => {
      if (e.detail?.image) {
        setMainImage(e.detail.image);
      }
    };

    window.addEventListener(
      "variantImageChange",
      handleVariantChange as EventListener,
    );
    return () =>
      window.removeEventListener(
        "variantImageChange",
        handleVariantChange as EventListener,
      );
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="aspect-4/5 md:aspect-square bg-base-200 rounded-3xl overflow-hidden relative group">
        <AnimatePresence mode="wait">
          <motion.img
            key={mainImage} // Triggers animation on source change
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3 }}
            src={mainImage}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        </AnimatePresence>
      </div>

      {/* Thumbnails */}
      {parsedImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {parsedImages.map((img: string, i: number) => (
            <button
              key={i}
              onClick={() => setMainImage(img)}
              className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                mainImage === img
                  ? "border-primary shadow-md scale-105"
                  : "border-transparent hover:border-base-300 opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Thumbnail ${i}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
