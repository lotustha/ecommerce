"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ProductImagesProps {
  images: string[];
  title: string;
}

export default function ProductImages({ images, title }: ProductImagesProps) {
  // Parse JSON string if necessary, or use array directly
  const parsedImages = Array.isArray(images)
    ? images
    : typeof images === "string"
      ? JSON.parse(images)
      : ["/placeholder.jpg"];

  const [mainImage, setMainImage] = useState(parsedImages[0]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <motion.div
        layoutId={`product-image-${title}`}
        className="aspect-4/5 md:aspect-square bg-base-200 rounded-3xl overflow-hidden relative group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mainImage}
          alt={title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
      </motion.div>

      {/* Thumbnails */}
      {parsedImages.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {parsedImages.map((img: string, i: number) => (
            <button
              key={i}
              onClick={() => setMainImage(img)}
              className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                mainImage === img
                  ? "border-primary"
                  : "border-transparent hover:border-base-300"
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
