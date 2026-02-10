import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/actions/logout";
import CartButton from "@/components/layout/cart-button"; // ✅ Integrated Client Component
import { Sun, Moon } from "lucide-react";

export default async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <div className="navbar bg-base-100/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-base-200 transition-all duration-300">
      {/* --- LEFT: Mobile Menu & Logo --- */}
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-200">
            <li><Link href="/">Home</Link></li>
            <li>
              <a>Categories</a>
              <ul className="p-2">
                <li><Link href="/search?category=electronics">Electronics</Link></li>
                <li><Link href="/search?category=fashion">Fashion</Link></li>
              </ul>
            </li>
            <li><Link href="/about">About Us</Link></li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl font-black text-primary tracking-tight hover:bg-transparent">
          Nepal E-com
        </Link>
      </div>

      {/* --- CENTER: Desktop Menu & Search --- */}
      <div className="navbar-center hidden lg:flex items-center gap-4">
        <ul className="menu menu-horizontal px-1 font-medium text-base-content/80">
          <li><Link href="/" className="hover:text-primary">Home</Link></li>
          <li>
            <details>
              <summary className="hover:text-primary">Shop</summary>
              <ul className="p-2 w-48 bg-base-100 shadow-lg rounded-box z-20 border border-base-200">
                <li><Link href="/search?category=electronics">Electronics</Link></li>
                <li><Link href="/search?category=fashion">Fashion</Link></li>
                <li><Link href="/search?category=groceries">Groceries</Link></li>
                <li><Link href="/search">All Products</Link></li>
              </ul>
            </details>
          </li>
        </ul>

        {/* Search Bar */}
        <div className="form-control">
          <input
            type="text"
            placeholder="Search products..."
            className="input input-sm input-bordered w-24 md:w-auto focus:w-64 transition-all duration-300 rounded-full bg-base-200 border-transparent focus:bg-base-100 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 h-10"
          />
        </div>
      </div>

      {/* --- RIGHT: Actions (Cart, Theme, User) --- */}
      <div className="navbar-end gap-1">
        {/* Theme Toggle */}
        <label className="swap swap-rotate btn btn-ghost btn-circle btn-sm">
          <input type="checkbox" className="theme-controller" value="forest" />

          {/* Sun icon (Light Mode) */}
          <Sun className="swap-off w-5 h-5" />

          {/* Moon icon (Dark Mode) */}
          <Moon className="swap-on w-5 h-5" />
        </label>

        {/* ✅ LIVE CART BUTTON */}
        <CartButton />

        {/* User Auth State */}
        {!user ? (
          <Link href="/login" className="btn btn-primary btn-sm px-5 ml-2 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            Login
          </Link>
        ) : (
          <div className="dropdown dropdown-end ml-2">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar online">
              <div className="w-9 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="User" src={user.image} />
                ) : (
                  <div className="bg-neutral text-neutral-content w-full h-full flex items-center justify-center text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-box w-56 border border-base-200">
              <li className="menu-title px-4 py-2 opacity-60">Hi, {user.name?.split(" ")[0]}</li>
              <li><Link href="/dashboard" className="justify-between">Dashboard <span className="badge badge-sm badge-secondary">New</span></Link></li>
              <li><Link href="/orders">My Orders</Link></li>
              <li><Link href="/profile">Settings</Link></li>
              <div className="divider my-1"></div>
              <li>
                <form action={logout} className="w-full">
                  <button type="submit" className="text-error font-medium w-full text-left">Logout</button>
                </form>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}