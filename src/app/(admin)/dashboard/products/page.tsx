import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Plus, Edit, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Image from "next/image";
import DeleteProductButton from "./_components/delete-button";
import ProductFilterBar from "./_components/filter-bar";
import Pagination from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const categorySlug = params.category || "";
  const currentPage = Number(params.page) || 1;
  const sort = params.sort || "createdAt";
  const order = params.order === "asc" ? "asc" : "desc";

  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // 1. Build Filter Conditions
  const where: any = {
    AND: [
      {
        OR: [{ name: { contains: query } }],
      },
    ],
  };

  if (categorySlug) {
    where.AND.push({
      category: { slug: categorySlug },
    });
  }

  // 2. Build Sort Conditions
  let orderBy: any = {};
  if (sort === "category") {
    orderBy = { category: { name: order } };
  } else {
    orderBy = { [sort]: order };
  }

  // 3. Fetch Data
  const [products, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      include: { category: true, brand: true },
      take: ITEMS_PER_PAGE,
      skip,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ select: { id: true, name: true, slug: true } }),
  ]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const formatPrice = (p: number) => {
    return new Intl.NumberFormat("en-NP", {
      style: "currency",
      currency: "NPR",
      maximumFractionDigits: 0,
    }).format(Number(p));
  };

  // Helper component for Sortable Headers
  const SortHeader = ({ label, field }: { label: string; field: string }) => {
    const isSorted = sort === field;
    const newOrder = isSorted && order === "asc" ? "desc" : "asc";

    // Construct new URL params keeping existing filters
    const urlParams = new URLSearchParams();
    if (query) urlParams.set("q", query);
    if (categorySlug) urlParams.set("category", categorySlug);
    urlParams.set("sort", field);
    urlParams.set("order", newOrder);

    return (
      <Link
        href={`?${urlParams.toString()}`}
        className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors group select-none"
      >
        {label}
        <span
          className={`transition-opacity ${isSorted ? "opacity-100 text-primary" : "opacity-30 group-hover:opacity-60"}`}
        >
          {isSorted ? (
            order === "asc" ? (
              <ArrowUp size={14} />
            ) : (
              <ArrowDown size={14} />
            )
          ) : (
            <ArrowUpDown size={14} />
          )}
        </span>
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Products</h1>
          <p className="text-sm text-base-content/60">
            Manage your inventory ({totalCount} items)
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="btn btn-primary rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> Add Product
        </Link>
      </div>

      {/* Filter Bar */}
      <ProductFilterBar categories={categories} />

      {/* Products Table */}
      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead className="bg-base-200/50 text-base-content/60 uppercase text-xs font-bold">
              <tr>
                <th className="pl-6 py-4">
                  <SortHeader label="Product" field="name" />
                </th>
                <th>
                  <SortHeader label="Category" field="category" />
                </th>
                <th>
                  <SortHeader label="Price" field="price" />
                </th>
                <th>
                  <SortHeader label="Stock" field="stock" />
                </th>
                <th>Status</th>
                <th className="pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                let image = "/placeholder.jpg";
                try {
                  const imgs = product.images ? JSON.parse(product.images) : [];
                  if (imgs.length > 0) image = imgs[0];
                } catch (e) {}

                return (
                  <tr key={product.id} className="hover">
                    <td className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle w-12 h-12 bg-base-200 border border-base-300">
                            <Image
                              src={image}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold truncate max-w-[200px]">
                            {product.name}
                          </div>
                          <div className="text-xs opacity-50">
                            {product.brand?.name || "No Brand"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-ghost badge-sm font-medium">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="font-mono font-bold text-sm">
                      {formatPrice(Number(product.price))}
                    </td>
                    <td>{product.stock}</td>
                    <td>
                      {product.stock > 0 ? (
                        <span className="badge badge-success badge-xs text-white px-2 py-3">
                          In Stock
                        </span>
                      ) : (
                        <span className="badge badge-error badge-xs text-white px-2 py-3">
                          Out of Stock
                        </span>
                      )}
                    </td>
                    <td className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/products/edit/${product.id}`}
                          className="btn btn-ghost btn-xs btn-square text-info hover:bg-info/10"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </Link>
                        {/* ✅ Custom Delete UI */}
                        <DeleteProductButton
                          id={product.id}
                          productName={product.name}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 opacity-50">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-bold">No products found</p>
                      <p className="text-sm">
                        Try adjusting your filters or add a new product.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="pb-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
}
