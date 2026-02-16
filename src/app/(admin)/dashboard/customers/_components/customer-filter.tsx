"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

// Simple debounce hook implementation
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return [debouncedValue];
}

export default function CustomerFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [text, setText] = useState(searchParams.get("q") || "");
  const [query] = useDebounce(text, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (query) {
      params.set("q", query);
      params.set("page", "1"); // Reset to page 1 on search
    } else {
      params.delete("q");
    }

    // Only push if changed to avoid loop
    if (params.toString() !== searchParams.toString()) {
      router.push(`/dashboard/customers?${params.toString()}`);
    }
  }, [query, router, searchParams]);

  return (
    <div className="relative w-full sm:max-w-md">
      <Search
        className="absolute left-3 top-3 text-base-content/40"
        size={20}
      />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search customers by name or email..."
        className="input input-bordered w-full pl-10 rounded-xl bg-base-100 focus:bg-base-100 transition-colors"
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
  );
}
