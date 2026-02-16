"use client"

import Link from "next/link";
import { logout } from "@/actions/logout";
import { useRef } from "react";

// Helper to close DaisyUI Dropdowns (Focus based)
const closeDropdown = () => {
    const elem = document.activeElement as HTMLElement;
    if (elem) {
        elem.blur();
    }
};

interface CategoryData {
    id: string;
    name: string;
    slug: string;
    _count: { products: number };
}

// --- Mobile Menu Component ---
export function MobileMenu({ topCategories }: { topCategories: CategoryData[] }) {
    return (
        <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-xl bg-base-100 rounded-box w-52 border border-base-200">
                <li><Link href="/" onClick={closeDropdown}>Home</Link></li>
                <li>
                    <details>
                        <summary>Categories</summary>
                        <ul>
                            {topCategories.map((cat) => (
                                <li key={cat.id}>
                                    <Link href={`/search?category=${cat.slug}`} onClick={closeDropdown}>{cat.name}</Link>
                                </li>
                            ))}
                            <li><Link href="/categories" className="text-primary font-bold" onClick={closeDropdown}>View All</Link></li>
                        </ul>
                    </details>
                </li>
                <li><Link href="/about" onClick={closeDropdown}>About Us</Link></li>
            </ul>
        </div>
    );
}

// --- Desktop Shop Menu Component ---
export function ShopMenu({ topCategories }: { topCategories: CategoryData[] }) {
    const detailsRef = useRef<HTMLDetailsElement>(null);

    const closeDetails = () => {
        if (detailsRef.current) {
            detailsRef.current.removeAttribute("open");
        }
    };

    return (
        <details ref={detailsRef}>
            <summary className="hover:text-primary">Shop</summary>
            <ul className="p-2 w-64 bg-base-100 shadow-lg rounded-box z-20 border border-base-200">
                <li className="menu-title px-4 py-2 opacity-60 uppercase text-xs font-bold">Top Categories</li>
                {topCategories.map((cat) => (
                    <li key={cat.id}>
                        <Link href={`/search?category=${cat.slug}`} className="flex justify-between group" onClick={closeDetails}>
                            {cat.name}
                            <span className="badge badge-sm badge-ghost group-hover:bg-base-200">{cat._count.products}</span>
                        </Link>
                    </li>
                ))}
                <div className="divider my-1"></div>
                <li><Link href="/categories" className="font-bold text-primary" onClick={closeDetails}>View All Categories</Link></li>
                <div className="divider my-1"></div>
                <li><Link href="/search" onClick={closeDetails}>All Products</Link></li>
            </ul>
        </details>
    );
}

// --- User Menu Component ---
export function UserMenu({ user }: { user: any }) {
    return (
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
                <li><Link href="/dashboard" className="justify-between" onClick={closeDropdown}>Dashboard <span className="badge badge-sm badge-secondary">New</span></Link></li>
                <li><Link href="/orders" onClick={closeDropdown}>My Orders</Link></li>
                <li><Link href="/wishlist" onClick={closeDropdown}>My Wishlist</Link></li>
                <li><Link href="/profile" onClick={closeDropdown}>Settings</Link></li>
                <div className="divider my-1"></div>
                <li>
                    <button
                        onClick={async () => {
                            closeDropdown();
                            await logout();
                        }}
                        className="text-error font-medium w-full text-left"
                    >
                        Logout
                    </button>
                </li>
            </ul>
        </div>
    );
}