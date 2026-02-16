"use client"

import { Heart } from "lucide-react"
import { toggleWishlist } from "@/actions/wishlist-actions"
import { useState, useTransition } from "react"
import { toast } from "react-hot-toast"

interface WishlistButtonProps {
    productId: string
    initialIsWishlisted?: boolean
    className?: string
}

export default function WishlistButton({ productId, initialIsWishlisted = false, className = "" }: WishlistButtonProps) {
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted)
    const [isPending, startTransition] = useTransition()

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent parent link click
        e.stopPropagation()

        // Optimistic Update
        const newState = !isWishlisted
        setIsWishlisted(newState)

        if (newState) toast.success("Added to wishlist")
        else toast.success("Removed from wishlist")

        startTransition(async () => {
            const result = await toggleWishlist(productId)
            if (result.error) {
                setIsWishlisted(!newState) // Revert on error
                toast.error(result.error)
            }
        })
    }

    return (
        <button
            onClick={handleToggle}
            disabled={isPending}
            className={`transition-all active:scale-95 group ${className}`}
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
            <Heart
                size={20}
                className={`transition-colors ${isWishlisted
                    ? "fill-error text-error"
                    : "text-base-content/60 group-hover:text-error"
                    }`}
            />
        </button>
    )
}