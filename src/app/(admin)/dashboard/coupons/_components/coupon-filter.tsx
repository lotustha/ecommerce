"use client";

import { Search, X, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CouponFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [text, setText] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      const currentQ = searchParams.get("q") || "";
      const currentStatus = searchParams.get("status") || "";

      let hasChanged = false;

      if (text !== currentQ) {
        if (text) params.set("q", text);
        else params.delete("q");
        hasChanged = true;
      }

      if (status !== currentStatus) {
        if (status) params.set("status", status);
        else params.delete("status");
        hasChanged = true;
      }

      if (hasChanged) {
        params.set("page", "1"); // Reset to page 1 on filter change
        router.push(`/dashboard/coupons?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [text, status, router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-3 text-base-content/40"
          size={20}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value.toUpperCase())}
          placeholder="Search by coupon code..."
          className="input input-bordered w-full pl-10 rounded-xl bg-base-100 focus:bg-base-100 transition-colors uppercase"
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
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="select select-bordered w-full rounded-xl pl-10 bg-base-100"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Disabled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>
    </div>
  );
}
