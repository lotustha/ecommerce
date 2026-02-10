"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { getSearchSuggestions } from "@/actions/search";

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  price: number;
  discountPrice: number | null;
  image: string;
  category: string;
  description: string;
}

function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Initialize from URL
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync local state with URL if URL changes externally (e.g. back button or clear filters)
  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      // Only fetch suggestions if query is different from URL param (to avoid refetching what we already see)
      // and has length > 2
      if (query.length >= 2 && query !== searchParams.get("q")) {
        setIsLoading(true);
        const results = await getSearchSuggestions(query);
        setSuggestions(results);
        setIsLoading(false);
        setIsOpen(true);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // ✅ Handle Clear: Resets input AND updates URL if on search page
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);

    // If we are currently on the search page, clear the 'q' param to show all products
    if (pathname === "/search") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("q");
      router.push(`/search?${params.toString()}`);
    }
  };

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(p);
  };

  return (
    <div ref={containerRef} className="relative z-30">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search..."
          className="input input-sm input-bordered w-32 md:w-40 focus:w-64 lg:focus:w-80 transition-all duration-500 ease-in-out rounded-full bg-base-200 border-transparent focus:bg-base-100 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 h-10 pl-10 pr-10"
        />
        <Search className="absolute left-3.5 top-2.5 h-5 w-5 text-base-content/40 pointer-events-none" />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-base-content/40 hover:text-base-content"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <X className="h-5 w-5" />
            )}
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-2 bg-base-100 rounded-2xl shadow-2xl border border-base-200 overflow-hidden transform origin-top animate-in fade-in zoom-in-95 duration-200 w-80">
          <div className="p-2">
            <div className="text-[10px] font-bold text-base-content/40 px-3 py-2 uppercase tracking-wider">
              Suggestions
            </div>
            {suggestions.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.slug}`}
                onClick={() => setIsOpen(false)}
                className="flex items-start gap-3 p-2 hover:bg-base-200/60 rounded-xl transition-colors group"
              >
                <div className="w-12 h-12 bg-base-200 rounded-lg overflow-hidden shrink-0 border border-base-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
                  <h4 className="font-bold text-sm truncate group-hover:text-primary transition-colors leading-tight">
                    {item.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-base-content/50 truncate">
                    <span className="bg-base-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-center h-12">
                  <div className="font-bold text-sm text-primary">
                    {formatPrice(item.discountPrice || item.price)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div
            className="bg-base-200/50 p-3 text-center border-t border-base-200 hover:bg-base-200 transition-colors cursor-pointer"
            onClick={handleSubmit}
          >
            <span className="text-xs text-primary font-bold hover:underline">
              View all results for "{query}"
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap in Suspense for safe use of useSearchParams
export default function SearchBar() {
  return (
    <Suspense
      fallback={
        <div className="w-32 h-10 bg-base-200 rounded-full animate-pulse" />
      }
    >
      <SearchInput />
    </Suspense>
  );
}
