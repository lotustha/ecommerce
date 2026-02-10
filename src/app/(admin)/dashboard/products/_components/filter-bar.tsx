"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

// Hook definition moved outside component
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return [debouncedValue];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ProductFilterBar({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [text, setText] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");

  // Custom Debounce logic
  const [query] = useDebounce(text, 500);

  // Effect to sync URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentQ = searchParams.get("q") || "";
    const currentCategory = searchParams.get("category") || "";

    // Update params based on state
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }

    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }

    // Reset to page 1 ONLY when filters actually change
    if (query !== currentQ || category !== currentCategory) {
      params.set("page", "1");
    }

    // Check if the URL actually needs to change to avoid infinite loops
    if (params.toString() !== searchParams.toString()) {
      router.push(`/dashboard/products?${params.toString()}`);
    }
  }, [query, category, router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-3 text-base-content/40"
          size={20}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by product name..."
          className="input input-bordered w-full pl-10 rounded-xl bg-base-200/50 focus:bg-base-100 transition-colors"
        />
        {text && (
          <button
            onClick={() => setText("")}
            className="absolute right-3 top-3 text-base-content/40 hover:text-base-content"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Category Select */}
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="select select-bordered rounded-xl w-full sm:w-48 bg-base-200/50 focus:bg-base-100"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.slug}>
            {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
