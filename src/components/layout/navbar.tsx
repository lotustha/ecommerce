import Link from "next/link";
import { auth } from "@/auth";
import CartButton from "@/components/layout/cart-button";
import SearchBar from "@/components/layout/search-bar";
import { Sun, Moon, Heart } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { MobileMenu, ShopMenu, UserMenu } from "@/components/layout/nav-menus";
export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  // ✅ Fetch Top 5 Categories with most items
  const topCategories = await prisma.category.findMany({
    take: 5,
    orderBy: {
      products: {
        _count: 'desc'
      }
    },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: {
        select: { products: true }
      }
    }
  });

  return (
    <div className="navbar bg-base-100/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-base-200 transition-all duration-300">
      {/* --- LEFT: Mobile Menu & Logo --- */}
      <div className="navbar-start">
        {/* ✅ Interactive Mobile Menu */}
        <MobileMenu topCategories={topCategories} />

        <Link href="/" className="btn btn-ghost text-xl font-black text-primary tracking-tight hover:bg-transparent">
          Nepal E-com
        </Link>
      </div>

      {/* --- CENTER: Desktop Menu & Search --- */}
      <div className="navbar-center hidden lg:flex items-center gap-4">
        <ul className="menu menu-horizontal px-1 font-medium text-base-content/80 flex-nowrap">
          <li><Link href="/" className="hover:text-primary">Home</Link></li>
          <li>

            <ShopMenu topCategories={topCategories} />
          </li>
        </ul>

        {/* ✅ Interactive Search Bar */}
        <SearchBar />
      </div>

      {/* --- RIGHT: Actions (Cart, Theme, User) --- */}
      <div className="navbar-end gap-1">
        {/* Theme Toggle */}
        <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm">
          <input type="checkbox" className="theme-controller" value="forest" />
          <Sun className="swap-off w-5 h-5" />
          <Moon className="swap-on w-5 h-5" />
        </label>

        {/* ✅ Wishlist Link */}
        <Link href="/wishlist" className="btn btn-ghost btn-circle btn-sm group tooltip tooltip-bottom" data-tip="Wishlist">
          <Heart className="w-5 h-5 group-hover:text-error transition-colors" />
        </Link>

        {/* LIVE CART BUTTON */}
        <CartButton />

        {/* User Auth State */}
        {!user ? (
          <Link href="/login" className="btn btn-primary btn-sm px-5 ml-2 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            Login
          </Link>
        ) : (

          <UserMenu user={user} />
        )}
      </div>
    </div>
  );
}