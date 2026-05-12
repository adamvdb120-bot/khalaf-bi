"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/diensten", label: "Diensten" },
  { href: "/dashboards", label: "Dashboards" },
  { href: "/klanten", label: "Klanten" },
  { href: "/over-ons", label: "Over ons" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="Khalaf BI — home">
            <Image
              src="/logos/khalaf-bi.png"
              alt="Khalaf BI"
              width={320}
              height={110}
              priority
              className="h-20 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-600 hover:text-navy-700 font-medium transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-navy-700 font-semibold hover:text-gold-500 transition-colors"
            >
              Inloggen
            </Link>
            <Link href="/contact" className="btn-primary text-sm py-2">
              Gratis demo
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-navy-700"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-gray-100 py-4 space-y-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-2 py-2 text-gray-700 font-medium hover:text-navy-700"
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="btn-outline text-sm text-center">
                Inloggen
              </Link>
              <Link href="/contact" className="btn-primary text-sm text-center">
                Gratis demo
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
