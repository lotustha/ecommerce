"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

export default function Pagination({
  totalPages,
  currentPage,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="join flex justify-center mt-10">
      <button
        className="join-item btn btn-outline"
        disabled={currentPage <= 1}
        onClick={() => router.push(createPageURL(currentPage - 1))}
      >
        <ChevronLeft size={16} />
      </button>

      {/* Simple Logic: Show all pages if < 5, else show subset (Simplified for now) */}
      {[...Array(totalPages)].map((_, i) => {
        const page = i + 1;
        // Basic truncation logic could go here, keeping it simple for < 10 pages
        return (
          <button
            key={page}
            className={`join-item btn ${currentPage === page ? "btn-primary" : "btn-outline"}`}
            onClick={() => router.push(createPageURL(page))}
          >
            {page}
          </button>
        );
      })}

      <button
        className="join-item btn btn-outline"
        disabled={currentPage >= totalPages}
        onClick={() => router.push(createPageURL(currentPage + 1))}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
