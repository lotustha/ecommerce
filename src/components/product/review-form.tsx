"use client"

import { useState, useTransition } from "react"
import { Star } from "lucide-react"
import { toast } from "react-hot-toast"
import { submitReview } from "@/actions/review-actions"

export default function ReviewForm({ productId }: { productId: string }) {
    const [rating, setRating] = useState(0)
    const [hover, setHover] = useState(0)
    const [comment, setComment] = useState("")
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) return toast.error("Please select a rating")

        startTransition(async () => {
            const result = await submitReview({ productId, rating, comment })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.success ?? "Review submitted successfully!")
                setRating(0)
                setComment("")
            }
        })
    }

    return (
        <div className="bg-base-100 rounded-3xl border border-base-200 p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Write a Review</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star Rating */}
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="focus:outline-none transition-transform hover:scale-110"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(rating)}
                        >
                            <Star
                                size={28}
                                className={`${star <= (hover || rating) ? "fill-warning text-warning" : "text-base-content/20"} transition-colors`}
                            />
                        </button>
                    ))}
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    className="textarea textarea-bordered w-full rounded-xl h-24 focus:outline-none focus:border-primary"
                    required
                />

                <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn-primary rounded-xl px-8"
                >
                    {isPending ? "Submitting..." : "Submit Review"}
                </button>
            </form>
        </div>
    )
}