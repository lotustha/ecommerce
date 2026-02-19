import Link from "next/link";
import { getPublicSettings } from "@/actions/public-settings";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default async function Footer() {
  const settings = await getPublicSettings();

  const storeName = settings?.storeName || "Nepal E-com";
  const storeSubtitle =
    settings?.storeSubtitle ||
    "Your trusted destination for quality products from local vendors and global brands."; // ✅ Changed

  return (
    <footer className="bg-base-300 text-base-content mt-auto">
      <div className="footer p-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Column 1: Brand Info */}
        <aside>
          <div className="font-bold text-2xl mb-2 flex items-center gap-2">
            <span className="text-primary">{storeName.split(" ")[0]}</span>{" "}
            {storeName.split(" ").slice(1).join(" ")}
          </div>
          <p className="max-w-xs text-sm opacity-80">
            {storeSubtitle} {/* ✅ Changed */}
          </p>
          <div className="flex gap-4 mt-4">
            {settings?.socialFacebook && (
              <a
                href={settings.socialFacebook}
                target="_blank"
                className="btn btn-ghost btn-sm btn-circle hover:text-blue-600"
              >
                <Facebook size={20} />
              </a>
            )}
            {settings?.socialInstagram && (
              <a
                href={settings.socialInstagram}
                target="_blank"
                className="btn btn-ghost btn-sm btn-circle hover:text-pink-600"
              >
                <Instagram size={20} />
              </a>
            )}
            {settings?.socialTwitter && (
              <a
                href={settings.socialTwitter}
                target="_blank"
                className="btn btn-ghost btn-sm btn-circle hover:text-sky-500"
              >
                <Twitter size={20} />
              </a>
            )}
            {settings?.socialTiktok && (
              <a
                href={settings.socialTiktok}
                target="_blank"
                className="btn btn-ghost btn-sm btn-circle hover:text-black dark:hover:text-white"
              >
                <span className="font-bold text-lg leading-none">TT</span>
              </a>
            )}
          </div>
        </aside>

        {/* Column 2: Shopping */}
        <nav className="flex flex-col gap-2">
          <h6 className="footer-title opacity-100 text-base-content">Shop</h6>
          <Link href="/search?category=electronics" className="link link-hover">
            Electronics
          </Link>
          <Link href="/search?category=fashion" className="link link-hover">
            Fashion
          </Link>
          <Link href="/search?category=home" className="link link-hover">
            Home & Living
          </Link>
          <Link href="/search?sort=latest" className="link link-hover">
            New Arrivals
          </Link>
          <Link
            href="/deals"
            className="link link-hover text-primary font-medium"
          >
            Today's Deals
          </Link>
        </nav>

        {/* Column 3: Customer Support */}
        <nav className="flex flex-col gap-2">
          <h6 className="footer-title opacity-100 text-base-content">
            Support
          </h6>
          <Link href="/profile" className="link link-hover">
            My Account
          </Link>
          <Link href="/orders" className="link link-hover">
            Order History
          </Link>
          <Link href="/contact" className="link link-hover">
            Contact Us
          </Link>
        </nav>

        {/* Column 4: Contact & Legal */}
        <nav className="flex flex-col gap-2">
          <h6 className="footer-title opacity-100 text-base-content">
            Contact & Legal
          </h6>
          <span className="flex items-center gap-2 text-sm">
            <span>📍</span> {settings?.storeAddress || "Kathmandu, Nepal"}
          </span>
          <span className="flex items-center gap-2 text-sm">
            <span>📞</span> {settings?.storePhone || "+977 9800000000"}
          </span>
          <span className="flex items-center gap-2 text-sm">
            <span>📧</span> {settings?.storeEmail || "support@store.com"}
          </span>
          {settings?.storeTaxId && (
            <span className="flex items-center gap-2 text-sm">
              <span>🧾</span> VAT/PAN: {settings.storeTaxId}
            </span>
          )}
          <div className="h-2"></div>
          <Link href="/privacy" className="link link-hover text-xs opacity-70">
            Privacy Policy
          </Link>
          <Link href="/terms" className="link link-hover text-xs opacity-70">
            Terms of Service
          </Link>
        </nav>
      </div>

      {/* Bottom Bar */}
      <div className="footer footer-center p-4 bg-base-200 text-base-content border-t border-base-300">
        <aside>
          <p className="text-xs">
            Copyright © {new Date().getFullYear()} - All rights reserved by{" "}
            {storeName}
          </p>
        </aside>
      </div>
    </footer>
  );
}
