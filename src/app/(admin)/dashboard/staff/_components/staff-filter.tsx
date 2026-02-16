"use client";

import { Search, X, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function StaffFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [text, setText] = useState(searchParams.get("q") || "");
  const [role, setRole] = useState(searchParams.get("role") || "");

  // Debounce for text search
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (text) params.set("q", text);
      else params.delete("q");

      if (role) params.set("role", role);
      else params.delete("role");

      params.set("page", "1"); // Reset pagination

      router.push(`/dashboard/staff?${params.toString()}`);
    }, 500);

    return () => clearTimeout(handler);
  }, [text, role, router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-3 text-base-content/40"
          size={20}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search staff by name or email..."
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

      <div className="sm:w-48">
        <div className="relative">
          <Filter
            className="absolute left-3 top-3 text-base-content/40"
            size={18}
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="select select-bordered w-full rounded-xl pl-10 bg-base-100"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="RIDER">Rider</option>
          </select>
        </div>
      </div>
    </div>
  );
}
