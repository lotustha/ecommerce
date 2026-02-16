import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";
import { ArrowRight, ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
    // Fetch categories with product counts
    const categories = await prisma.category.findMany({
        include: {
            _count: {
                select: { products: true }
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    return (
        <div className="max-w-7xl mx-auto py-10 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black tracking-tight mb-4">All Categories</h1>
                <p className="text-base-content/60 max-w-xl mx-auto">
                    Browse our extensive collection by category. Find exactly what you are looking for.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category) => (
                    <Link
                        key={category.id}
                        href={`/search?category=${category.slug}`}
                        className="group relative bg-base-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-base-200"
                    >
                        {/* Image Container */}
                        <div className="aspect-[4/3] bg-base-200 relative overflow-hidden">
                            {category.image ? (
                                <Image
                                    src={category.image}
                                    alt={category.name}
                                    fill
                                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full w-full bg-base-200 text-base-content/20 group-hover:bg-base-300 transition-colors">
                                    <ImageIcon size={48} />
                                </div>
                            )}

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        </div>

                        {/* Content */}
                        <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                            <h3 className="text-xl font-bold mb-1 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                {category.name}
                            </h3>
                            <div className="flex items-center justify-between opacity-80 text-sm">
                                <span>{category._count.products} Products</span>
                                <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="text-center py-20 bg-base-100 rounded-3xl border border-base-200 border-dashed">
                    <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ImageIcon size={32} className="opacity-30" />
                    </div>
                    <h3 className="text-xl font-bold">No categories found</h3>
                    <p className="text-base-content/60 mt-2">Check back later for updates.</p>
                </div>
            )}
        </div>
    );
}