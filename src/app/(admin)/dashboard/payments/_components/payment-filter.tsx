"use client";

import { Search, X, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function PaymentFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [text, setText] = useState(searchParams.get("q") || "");
  const [method, setMethod] = useState(searchParams.get("method") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      const currentQ = searchParams.get("q") || "";
      const currentMethod = searchParams.get("method") || "";
      const currentStatus = searchParams.get("status") || "";

      // Logic to track if we actually need to update the URL
      let hasChanged = false;

      if (text !== currentQ) {
        if (text) params.set("q", text);
        else params.delete("q");
        hasChanged = true;
      }

      if (method !== currentMethod) {
        if (method) params.set("method", method);
        else params.delete("method");
        hasChanged = true;
      }

      if (status !== currentStatus) {
        if (status) params.set("status", status);
        else params.delete("status");
        hasChanged = true;
      }

      // Only push if filters changed.
      // We also check if 'page' needs resetting, but only if filters changed.
      if (hasChanged) {
        params.set("page", "1");
        router.push(`/dashboard/payments?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [text, method, status, router, searchParams]);

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      {/* Search */}
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-3 text-base-content/40"
          size={20}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search by Order ID or Customer Name..."
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

      {/* Method Filter */}
      <div className="sm:w-40">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="select select-bordered w-full rounded-xl bg-base-100"
        >
          <option value="">All Methods</option>
          <option value="ESEWA">eSewa</option>
          <option value="KHALTI">Khalti</option>
          <option value="COD">COD</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="sm:w-40">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="select select-bordered w-full rounded-xl bg-base-100"
        >
          <option value="">All Statuses</option>
          <option value="PAID">Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>
    </div>
  );
}
