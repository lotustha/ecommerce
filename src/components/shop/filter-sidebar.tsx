"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Filter, X, Search } from "lucide-react";
import PriceSlider from "@/components/ui/price-slider";

interface FilterSidebarProps {
  categories: { name: string; slug: string; _count: { products: number } }[];
  brands: { name: string; slug: string; _count: { products: number } }[];
  priceRange: { min: number; max: number };
}

export default function FilterSidebar({
  categories,
  brands,
  priceRange,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local State initialized from URL
  const [minPrice, setMinPrice] = useState(priceRange.min);
  const [maxPrice, setMaxPrice] = useState(priceRange.max);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  // Search state for filters
  const [brandSearch, setBrandSearch] = useState("");

  // ✅ SYNC STATE WITH URL
  // We remove 'priceRange' from dependencies to prevent re-runs when parent passes new object ref
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const brandParam = searchParams.get("brand");
    const brandsList = brandParam ? brandParam.split(",") : [];

    setSelectedCategory(category);
    setSelectedBrands(brandsList);

    const paramMin = searchParams.get("minPrice");
    const paramMax = searchParams.get("maxPrice");

    // Only update price if it's in the URL, otherwise keep current or reset?
    // Usually we want URL to drive it.
    if (paramMin) setMinPrice(Number(paramMin));
    else setMinPrice(priceRange.min);

    if (paramMax) setMaxPrice(Number(paramMax));
    else setMaxPrice(priceRange.max);
  }, [searchParams]); // ⚠️ Only depend on searchParams

  // Handler for price slider
  const handlePriceChange = (min: number, max: number) => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const pushFilters = (overrides?: { category?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    const categoryToUse =
      overrides && overrides.category !== undefined
        ? overrides.category
        : selectedCategory;

    if (categoryToUse) params.set("category", categoryToUse);
    else params.delete("category");

    if (selectedBrands.length > 0)
      params.set("brand", selectedBrands.join(","));
    else params.delete("brand");

    if (minPrice !== priceRange.min)
      params.set("minPrice", minPrice.toString());
    else params.delete("minPrice");

    if (maxPrice !== priceRange.max)
      params.set("maxPrice", maxPrice.toString());
    else params.delete("maxPrice");

    params.delete("page");

    router.push(`/search?${params.toString()}`);
  };

  const toggleBrand = (slug: string) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((b) => b !== slug) : [...prev, slug],
    );
  };

  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  return (
    <div className="bg-base-100 p-6 rounded-3xl border border-base-200 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Filter size={18} /> Filters
        </h3>
        {(selectedCategory ||
          selectedBrands.length > 0 ||
          minPrice !== priceRange.min ||
          maxPrice !== priceRange.max) && (
          <button
            onClick={() => router.push("/search")}
            className="text-xs text-error hover:underline flex items-center gap-1"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h4 className="font-bold mb-3 text-sm uppercase tracking-wide opacity-60">
          Categories
        </h4>
        <div className="space-y-1">
          {/* All Categories Option */}
          <div
            onClick={() => {
              setSelectedCategory("");
              pushFilters({ category: "" });
            }}
            className={`flex items-center gap-3 cursor-pointer p-2 rounded-xl transition-all duration-200 ${
              selectedCategory === ""
                ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
            }`}
          >
            <span className="text-sm font-medium">All Categories</span>
          </div>

          {categories.map((cat) => (
            <div
              key={cat.slug}
              onClick={() => {
                setSelectedCategory(cat.slug);
                pushFilters({ category: cat.slug });
              }}
              className={`flex items-center justify-between gap-3 cursor-pointer p-2 rounded-xl transition-all duration-200 ${
                selectedCategory === cat.slug
                  ? "bg-primary text-primary-content shadow-md shadow-primary/20"
                  : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
              }`}
            >
              <span className="text-sm font-medium flex-1 truncate">
                {cat.name}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedCategory === cat.slug
                    ? "bg-primary-content/20 text-primary-content"
                    : "bg-base-200 text-base-content/40"
                }`}
              >
                {cat._count.products}
              </span>
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-xs opacity-50 px-2">No categories found</p>
          )}
        </div>
      </div>

      <div className="divider my-4"></div>

      {/* Brands */}
      <div className="mb-8">
        <h4 className="font-bold mb-3 text-sm uppercase tracking-wide opacity-60">
          Brands
        </h4>

        {brands.length > 5 && (
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Find brand..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="input input-xs input-bordered w-full pl-7 rounded-lg"
            />
            <Search size={12} className="absolute left-2 top-1.5 opacity-50" />
          </div>
        )}

        <div className="space-y-2">
          {filteredBrands.map((brand) => (
            <label
              key={brand.slug}
              className="flex items-center gap-3 cursor-pointer group hover:bg-base-200/50 p-1.5 rounded-lg transition-colors"
            >
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm rounded-md"
                checked={selectedBrands.includes(brand.slug)}
                onChange={() => toggleBrand(brand.slug)}
              />
              <span className="text-sm transition-colors flex-1 truncate">
                {brand.name}
              </span>
              <span className="text-xs text-base-content/40">
                {brand._count.products}
              </span>
            </label>
          ))}
          {filteredBrands.length === 0 && (
            <p className="text-xs text-center opacity-50 py-2">
              No brands found
            </p>
          )}
        </div>
      </div>

      <div className="divider my-4"></div>

      {/* Price Range */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-sm uppercase tracking-wide opacity-60">
            Price
          </h4>
          <span className="text-xs font-bold text-primary">
            Rs. {minPrice} - Rs. {maxPrice}
          </span>
        </div>

        <PriceSlider
          min={priceRange.min}
          max={priceRange.max}
          minVal={minPrice}
          maxVal={maxPrice}
          onChange={handlePriceChange}
        />

        <div className="flex items-center gap-2 mt-4">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(Number(e.target.value))}
            className="input input-bordered input-xs w-full text-center"
            placeholder="Min"
          />
          <span className="text-base-content/40">-</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="input input-bordered input-xs w-full text-center"
            placeholder="Max"
          />
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={() => pushFilters()}
        className="btn btn-primary btn-block rounded-xl shadow-lg shadow-primary/20"
      >
        Apply Filters
      </button>
    </div>
  );
}
