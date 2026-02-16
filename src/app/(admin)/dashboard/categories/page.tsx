import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Plus, Edit, ImageOff, FolderTree } from "lucide-react";
import DeleteCategoryButton from "./_components/delete-button";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      parent: true,
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Categories</h1>
          <p className="text-sm opacity-60">
            Manage catalog structure ({categories.length} items)
          </p>
        </div>
        <Link
          href="/dashboard/categories/new"
          className="btn btn-primary rounded-xl shadow-lg shadow-primary/20"
        >
          <Plus size={20} /> Add Category
        </Link>
      </div>

      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50 text-base-content/60 uppercase text-xs font-bold">
              <tr>
                <th className="pl-6">Image</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Products</th>
                <th className="pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="hover group">
                  <td className="pl-6">
                    <div className="avatar">
                      <div className="mask mask-squircle w-12 h-12 bg-base-200 flex items-center justify-center border border-base-300">
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        ) : (
                          <ImageOff size={20} className="opacity-20" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="font-bold text-base">{cat.name}</div>
                  </td>
                  <td>
                    <div className="badge badge-ghost badge-sm font-mono opacity-70">
                      /{cat.slug}
                    </div>
                  </td>
                  <td>
                    {cat.parent ? (
                      <div className="flex items-center gap-2 text-sm">
                        <FolderTree size={14} className="opacity-40" />
                        <span>{cat.parent.name}</span>
                      </div>
                    ) : (
                      <span className="opacity-30 text-xs">-</span>
                    )}
                  </td>
                  <td>
                    <div className="badge badge-neutral badge-sm font-bold">
                      {cat._count.products}
                    </div>
                  </td>
                  <td className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/dashboard/categories/edit/${cat.id}`}
                        className="btn btn-ghost btn-xs btn-square text-info hover:bg-info/10"
                      >
                        <Edit size={16} />
                      </Link>
                      <DeleteCategoryButton id={cat.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 opacity-50">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-bold">No categories found</p>
                      <p className="text-sm">
                        Create one to organize your products.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
