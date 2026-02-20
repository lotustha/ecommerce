"use client"

import { updateOrderStatus } from "@/actions/order-actions"
import { OrderStatus } from "../../../../../../generated/prisma/enums"
import { useState, useTransition } from "react"
import { toast } from "react-hot-toast"
import { Loader2 } from "lucide-react"

interface StatusSelectProps {
    id: string
    currentStatus: OrderStatus
}

export default function OrderStatusSelect({ id, currentStatus }: StatusSelectProps) {
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState(currentStatus)

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as OrderStatus

        // Optimistic update
        setStatus(newStatus)

        startTransition(async () => {
            const result = await updateOrderStatus(id, newStatus)
            if (result.error) {
                toast.error(result.error)
                setStatus(currentStatus) // Revert
            } else {
                toast.success(result.success ?? "Order updated successfully")
            }
        })
    }

    const getStatusColor = (s: string) => {
        switch (s) {
            case "PENDING": return "bg-warning/20 text-warning-content border-warning/20";
            case "PROCESSING": return "bg-info/20 text-info-content border-info/20";
            case "READY_TO_SHIP": return "bg-primary/20 text-primary border-primary/20";
            case "SHIPPED": return "bg-secondary/20 text-secondary border-secondary/20";
            case "DELIVERED": return "bg-success/20 text-success border-success/20";
            case "CANCELLED": return "bg-error/20 text-error border-error/20";
            case "RETURNED": return "bg-neutral/20 text-neutral-content border-neutral/20";
            default: return "bg-base-200 text-base-content/70";
        }
    };

    return (
        <div className="relative">
            <select
                className={`select select-xs w-32 font-bold border-2 focus:outline-none ${getStatusColor(status)}`}
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
            {isPending && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 size={12} className="animate-spin opacity-50" />
                </div>
            )}
        </div>
    );
}