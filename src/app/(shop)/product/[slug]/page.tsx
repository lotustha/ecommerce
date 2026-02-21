import { getProductBySlug, getSimilarProducts } from "@/lib/db/data";
import ProductImages from "@/components/product/product-images";
import ProductInfo from "@/components/product/product-info";
import ProductCard from "@/components/product/product-card";
import Reviews from "@/components/product/reviews";
import ReviewForm from "@/components/product/review-form";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  Star,
  ShoppingBag,
  ArrowRight,
  ListChecks,
  FileText,
  Link2,
} from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Product Not Found | Nepal E-com" };

  return {
    title: `${product.name} | Nepal E-com`,
    description:
      product.metaDescription ||
      product.description?.slice(0, 160).replace(/<[^>]*>?/gm, ""), // Strip HTML for meta
    openGraph: {
      images: product.images ? JSON.parse(product.images)[0] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  const session = await auth();

  if (!product) notFound();

  // Check if user has purchased this item (for verified reviews)
  let hasPurchased = false;
  if (session?.user?.id) {
    const order = await prisma.order.findFirst({
      where: {
        userId: session.user.id,
        status: "DELIVERED",
        items: { some: { productId: product.id } },
      },
    });
    hasPurchased = !!order;
  }

  const similarProducts = await getSimilarProducts(
    product.categoryId,
    product.id,
  );

  // Review math
  const totalReviews = product.reviews?.length || 0;
  const avgRating =
    totalReviews > 0
      ? (
          product.reviews.reduce(
            (acc: number, rev: any) => acc + rev.rating,
            0,
          ) / totalReviews
        ).toFixed(1)
      : "0.0";

  // ✅ CRITICAL FIX: Clean up aggressive non-breaking spaces from rich text editors
  const cleanDescription = product.description
    ? product.description.replace(/&nbsp;/g, " ")
    : "";

  return (
    <div className="max-w-7xl mx-auto px-4 py-2 lg:py-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-base-content/60 mb-3 lg:mb-4 overflow-x-auto whitespace-nowrap pb-2 lg:pb-0">
        <Link
          href="/"
          className="hover:text-primary flex items-center transition-colors"
        >
          <Home className="w-4 h-4 mr-1" /> Home
        </Link>
        <ChevronRight className="w-4 h-4 mx-2 opacity-50 shrink-0" />
        <Link
          href={`/search?category=${product.category.slug}`}
          className="hover:text-primary transition-colors capitalize"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="w-4 h-4 mx-2 opacity-50 shrink-0" />
        <span className="font-medium text-base-content truncate">
          {product.name}
        </span>
      </nav>

      {/* TOP SECTION: Gallery & Buy Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mb-8">
        {/* Left: Sticky Image Gallery (Reduced col-span to make image smaller) */}
        <div className="lg:col-span-6 xl:col-span-5 lg:sticky lg:top-20">
          <ProductImages
            images={product.images ? JSON.parse(product.images) : []}
            title={product.name}
          />
        </div>

        {/* Right: Product Info (Increased col-span to give text more horizontal room) */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex text-warning">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={
                    star <= Math.round(Number(avgRating))
                      ? "fill-current"
                      : "text-base-content/20"
                  }
                />
              ))}
            </div>
            <a
              href="#reviews"
              className="text-xs font-medium hover:text-primary transition-colors hover:underline"
            >
              {avgRating} ({totalReviews} Reviews)
            </a>
          </div>

          <ProductInfo product={product} />
        </div>
      </div>

      {/* MIDDLE SECTION: Description & Specs (50/50 Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-16">
        {/* Rich Text Overview */}
        <div className="min-w-0 w-full pb-4">
          <h2 className="text-xl font-black flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <FileText size={20} />
            </div>
            Product Overview
          </h2>

          {cleanDescription ? (
            <div
              className="prose prose-sm sm:prose-base max-w-none w-full text-base-content/80 prose-headings:font-black prose-headings:tracking-tight prose-headings:text-base-content prose-a:text-primary prose-a:font-bold hover:prose-a:underline prose-img:rounded-2xl prose-img:shadow-sm prose-img:max-w-full prose-img:h-auto wrap-break-word whitespace-normal"
              dangerouslySetInnerHTML={{ __html: cleanDescription }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
              <FileText size={40} className="mb-3 opacity-20" />
              <p className="text-base font-medium">
                No detailed description provided.
              </p>
              <p className="text-xs">Information will be updated soon.</p>
            </div>
          )}
        </div>

        {/* Specifications Sidebar */}
        <div className="min-w-0 w-full">
          <div className="sticky top-20">
            <h3 className="text-xl font-black flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <ListChecks size={20} />
              </div>
              Specifications
            </h3>

            {product.specs && product.specs.length > 0 ? (
              <div className="flex flex-col gap-2">
                {product.specs.map((spec: any) => (
                  <div
                    key={spec.id}
                    className="flex justify-between items-start p-3 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors border border-base-200/50 hover:border-base-300 group gap-4 text-sm"
                  >
                    <span className="opacity-70 font-medium shrink-0 w-1/4 group-hover:opacity-100 transition-opacity">
                      {spec.attribute.name}
                    </span>
                    <span className="font-bold text-right text-base-content flex-1">
                      {spec.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center opacity-50 border border-dashed border-base-200 rounded-2xl">
                <ListChecks size={24} className="mb-2 opacity-20" />
                <p className="text-xs font-medium">No specifications listed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ NEW: MANUALLY SELECTED CROSS-SELLS (BOUGHT TOGETHER) */}
      {product.crossSells && product.crossSells.length > 0 && (
        <div className="mb-24 bg-base-200/30 p-6 md:p-10 rounded-4xl border border-base-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <Link2 size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black mb-1">
                  Frequently Bought Together
                </h2>
                <p className="text-sm opacity-60">
                  Customers usually buy these items with {product.name}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.crossSells.map((crossProduct: any) => (
              <ProductCard key={crossProduct.id} product={crossProduct} />
            ))}
          </div>
        </div>
      )}

      {/* REVIEWS SECTION */}
      <div
        className="border-t border-base-200 pt-12 mb-20 scroll-mt-20"
        id="reviews"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-6 sticky top-20 h-fit">
            <div>
              <h2 className="text-2xl font-black mb-1">Customer Reviews</h2>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-5xl font-black text-base-content leading-none">
                  {avgRating}
                </span>
                <div className="flex flex-col pb-1">
                  <div className="flex text-warning">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={
                          star <= Math.round(Number(avgRating))
                            ? "fill-current"
                            : "text-base-content/20"
                        }
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium opacity-60 mt-1">
                    Based on {totalReviews} reviews
                  </span>
                </div>
              </div>
            </div>

            {session ? (
              hasPurchased ? (
                <ReviewForm productId={product.id} />
              ) : (
                <div className="bg-base-200/50 p-5 rounded-2xl text-center border border-base-200 border-dashed">
                  <div className="w-10 h-10 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <ShoppingBag size={18} className="opacity-40" />
                  </div>
                  <h4 className="font-bold text-sm mb-1">
                    Verified Purchase Required
                  </h4>
                  <p className="text-xs text-base-content/60">
                    You can only review products you have purchased and
                    received.
                  </p>
                </div>
              )
            ) : (
              <div className="bg-base-200/50 p-6 rounded-2xl text-center border border-base-200">
                <p className="font-bold mb-1 text-sm">
                  Have you used this product?
                </p>
                <p className="text-xs text-base-content/60 mb-4">
                  Log in to leave a review and help others.
                </p>
                <Link
                  href={`/login?callbackUrl=/product/${product.slug}`}
                  className="btn btn-primary btn-sm btn-block rounded-lg shadow-md"
                >
                  Login to Review
                </Link>
              </div>
            )}
          </div>

          <div className="lg:col-span-8 min-w-0">
            <h3 className="text-lg font-bold mb-4">Recent Reviews</h3>
            <Reviews productId={product.id} />
          </div>
        </div>
      </div>

      {/* AUTOMATIC RELATED PRODUCTS */}
      {similarProducts.length > 0 && (
        <div className="border-t border-base-200 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-3">
            <div>
              <h2 className="text-2xl font-black mb-1">You might also like</h2>
              <p className="text-sm text-base-content/60">
                Explore similar products in {product.category.name}
              </p>
            </div>
            <Link
              href={`/search?category=${product.category.slug}`}
              className="btn btn-ghost btn-sm hover:bg-base-200 rounded-full group"
            >
              View More{" "}
              <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
