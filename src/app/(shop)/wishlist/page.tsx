import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import ProductCard from "@/components/product/product-card";
import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login?callbackUrl=/wishlist");
    }

    const rawWishlistItems = await prisma.wishlist.findMany({
        where: { userId: session.user.id },
        include: {
            product: {
                include: {
                    category: true,
                    brand: true
                }
            }

        },
        orderBy: { id: 'desc' }

    });
    const wishlistItems = JSON.parse(JSON.stringify(rawWishlistItems));
    return (
        <div className="max-w-7xl mx-auto py-10 px-4">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black flex items-center gap-3">
                    My Wishlist
                    <span className="text-lg font-normal text-base-content/50 bg-base-200 px-3 py-1 rounded-full">
                        {wishlistItems.length} items
                    </span>
                </h1>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-base-100 rounded-3xl border border-base-200 border-dashed text-center">
                    <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
                        <Heart size={32} className="opacity-30" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Your wishlist is empty</h3>
                    <p className="text-base-content/60 mb-8 max-w-md">
                        Heart items while you shop to save them for later.
                    </p>
                    <Link href="/search" className="btn btn-primary rounded-full px-8 shadow-lg hover:scale-105 transition-transform">
                        Start Shopping <ArrowRight size={18} />
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {wishlistItems.map((item: any) => (
                        <ProductCard key={item.productId} product={item.product} />
                    ))}
                </div>
            )}
        </div>
    );
}