import { Star, User } from "lucide-react"
import { prisma } from "@/lib/db/prisma"
import Image from "next/image"

export default async function Reviews({ productId }: { productId: string }) {
    const reviews = await prisma.review.findMany({
        where: { productId },
        include: {
            user: { select: { name: true, image: true } }
        },
        orderBy: { createdAt: "desc" }
    })

    if (reviews.length === 0) {
        return (
            <div className="text-center py-10 opacity-50">
                <p>No reviews yet. Be the first to review!</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {reviews.map((review) => (
                <div key={review.id} className="flex gap-4 p-4 bg-base-100/50 rounded-2xl border border-base-200">
                    <div className="avatar placeholder h-fit">
                        <div className="bg-neutral text-neutral-content rounded-full w-10 h-10">
                            {review.user.image ? (
                                <Image src={review.user.image} alt={review.user.name || ""} width={40} height={40} />
                            ) : (
                                <span>{review.user.name?.[0] || "U"}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm">{review.user.name || "Anonymous"}</h4>
                            <span className="text-xs opacity-40">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-warning mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < review.rating ? "fill-current" : "text-base-content/20"} />
                            ))}
                        </div>
                        <p className="text-sm opacity-80 leading-relaxed">{review.comment}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}