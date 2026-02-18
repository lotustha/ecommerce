"use client"

import { Search, X, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function OrderFilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [text, setText] = useState(searchParams.get("q") || "");
    const [status, setStatus] = useState(searchParams.get("status") || "");

    useEffect(() => {
        const handler = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());

            if (text) params.set("q", text);
            else params.delete("q");

            if (status) params.set("status", status);
            else params.delete("status");

            params.set("page", "1");

            // Avoid redundant pushes
            if (params.toString() !== searchParams.toString()) {
                router.push(`/dashboard/orders?${params.toString()}`);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [text, status, router, searchParams]);

    return (
        <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-base-content/40" size={20} />
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Search by Order ID, Customer Name..."
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
                    <Filter className="absolute left-3 top-3 text-base-content/40" size={18} />
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="select select-bordered w-full rounded-xl pl-10 bg-base-100"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="PROCESSING">Processing</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>
        </div>
    );
}