"use client";

import { deleteCustomer } from "@/actions/customer-actions";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "react-hot-toast";

export default function DeleteCustomerButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this customer? This will remove their login access and order history.",
      )
    )
      return;

    startTransition(async () => {
      const result = await deleteCustomer(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Customer deleted successfully");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
      title="Delete Customer"
    >
      {isPending ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <Trash2 size={16} />
      )}
    </button>
  );
}
