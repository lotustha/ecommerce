"use client";

import { updateOrderStatus } from "@/actions/admin";
import { OrderStatus } from "../../../../../generated/prisma/enums";
import { useState, useTransition } from "react";
import { toast } from "react-hot-toast";

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    setStatus(newStatus); // Optimistic update

    startTransition(async () => {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.error) {
        toast.error("Failed to update status");
        setStatus(currentStatus); // Revert on error
      } else {
        toast.success(`Order marked as ${newStatus}`);
      }
    });
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case "PENDING":
        return "select-warning";
      case "PROCESSING":
        return "select-info";
      case "SHIPPED":
        return "select-primary";
      case "DELIVERED":
        return "select-success";
      case "CANCELLED":
        return "select-error";
      default:
        return "select-bordered";
    }
  };

  return (
    <select
      className={`select select-xs w-full max-w-[140px] font-bold ${getStatusColor(status)} transition-colors`}
      value={status}
      onChange={handleChange}
      disabled={isPending}
    >
      <option value="PENDING">PENDING</option>
      <option value="PROCESSING">PROCESSING</option>
      <option value="READY_TO_SHIP">READY TO SHIP</option>
      <option value="SHIPPED">SHIPPED</option>
      <option value="DELIVERED">DELIVERED</option>
      <option value="CANCELLED">CANCELLED</option>
      <option value="RETURNED">RETURNED</option>
    </select>
  );
}
