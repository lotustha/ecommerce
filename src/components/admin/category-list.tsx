import Link from "next/link";
import { Plus, Edit } from "lucide-react";
import DeleteCategoryButton from "../../app/(admin)/dashboard/categories/_components/delete-button";
import { Category } from "../../../generated/prisma/client";

export const dynamic = "force-dynamic";

type CategoryWithRelations = Category & {
  parent: Category | null;
  _count: { products: number };
};

interface CategoryListProps {
  categories: CategoryWithRelations[];
}

export default function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black tracking-tight">Categories</h1>
        <Link
          href="/dashboard/categories/new"
          className="btn btn-primary rounded-xl"
        >
          <Plus size={20} /> Add Category
        </Link>
      </div>

      <div className="bg-base-100 rounded-3xl border border-base-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-base-200/50">
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Products</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="hover">
                  <td className="font-bold">{cat.name}</td>
                  <td className="font-mono text-xs opacity-50">{cat.slug}</td>
                  <td>
                    {cat.parent ? (
                      <span className="badge badge-ghost badge-sm">
                        {cat.parent.name}
                      </span>
                    ) : (
                      <span className="opacity-30 text-xs">-</span>
                    )}
                  </td>
                  <td>{cat._count.products}</td>
                  <td className="text-right flex justify-end gap-2">
                    <Link
                      href={`/dashboard/categories/edit/${cat.id}`}
                      className="btn btn-xs btn-ghost btn-square text-info"
                    >
                      <Edit size={16} />
                    </Link>
                    <DeleteCategoryButton id={cat.id} />
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 opacity-50">
                    No categories found.
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
