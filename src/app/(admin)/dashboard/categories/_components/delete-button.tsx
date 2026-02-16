"use client";

import { deleteCategory } from "@/actions/categories";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "react-hot-toast";

export default function DeleteCategoryButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (!confirm("Delete this category?")) return;

    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) toast.error(result.error);
      else toast.success(result.success ?? "Category deleted");
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="btn btn-xs btn-ghost btn-square text-error"
    >
      {isPending ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  );
}
