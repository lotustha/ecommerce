import { searchProducts, getFilterMetadata } from "@/lib/db/data";
import ProductCard from "@/components/product/product-card";
import FilterSidebar from "@/components/shop/filter-sidebar";
import SortSelect from "@/components/shop/sort-select";
import Pagination from "@/components/ui/pagination"; // ✅ Import Pagination
import { Search, SlidersHorizontal } from "lucide-react";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string; // ✅ Added page param
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  // 1. Fetch Data in Parallel
  // Note: searchProducts now returns an object { products, totalPages, currentPage, totalCount }
  const [searchResults, filters] = await Promise.all([
    searchProducts(params),
    getFilterMetadata(),
  ]);

  const { products, totalPages, currentPage, totalCount } = searchResults;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            {params.q ? `Search: "${params.q}"` : "Explore Store"}
          </h1>
          <p className="text-base-content/60">
            Showing {products.length} of {totalCount} results
            {params.category && ` in ${params.category}`}
          </p>
        </div>

        {/* Sort Dropdown */}
        <SortSelect />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* --- LEFT: Filter Sidebar --- */}
        <div className="hidden lg:block lg:col-span-1">
          <FilterSidebar
            categories={filters.categories}
            brands={filters.brands}
            priceRange={filters.priceRange}
          />
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden w-full mb-4">
          <div className="collapse bg-base-100 border border-base-200 rounded-xl">
            <input type="checkbox" />
            <div className="collapse-title font-bold flex items-center gap-2">
              <SlidersHorizontal size={18} /> Filters
            </div>
            <div className="collapse-content">
              <FilterSidebar
                categories={filters.categories}
                brands={filters.brands}
                priceRange={filters.priceRange}
              />
            </div>
          </div>
        </div>

        {/* --- RIGHT: Product Grid --- */}
        <div className="lg:col-span-3">
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* ✅ Pagination Controls */}
              <Pagination totalPages={totalPages} currentPage={currentPage} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-base-100 rounded-3xl border border-base-200 border-dashed">
              <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-4">
                <Search size={32} className="opacity-30" />
              </div>
              <h3 className="text-xl font-bold">No products found</h3>
              <p className="text-base-content/60 text-center max-w-xs mt-2">
                Try adjusting your filters or search for something else.
              </p>
              <a href="/search" className="btn btn-ghost btn-sm mt-4">
                Clear All Filters
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
