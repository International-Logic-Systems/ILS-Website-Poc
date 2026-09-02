"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { nav, secNumber } from "@/lib/content";
// White lockup: the standard mark is navy, which disappears on the forest bar.
// Static imports give next/image the intrinsic size, so the bar cannot shift
// while the logo loads.
import logoLockup from "@/public/logo-lockup-white.png";
import logoMark from "@/public/logo-mark.png";

// Forest top bar, sticky. The active item carries the green underline and its
// section number as a superscript — the same numbering `sec()` gives the page
// kickers, so the bar and the page agree on where you are.

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="neon-header sticky top-0 z-50">
      <div className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between gap-8 px-8">
        {/* Nine nav items plus the CTA only leave room for the full lockup on
            the widest screens; below that the mark carries the brand alone.
            One accessible name on the link, both images decorative. */}
        <Link
          href="/"
          aria-label="International Logic Systems — home"
          className="flex shrink-0 items-center"
          onClick={() => setOpen(false)}
        >
          <Image
            src={logoLockup}
            alt=""
            priority
            className="hidden h-7 w-auto xl:block"
            aria-hidden
          />
          <Image src={logoMark} alt="" priority className="h-8 w-auto xl:hidden" aria-hidden />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-5 lg:flex xl:gap-[26px]">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`neon-link py-1.5 ${active ? "neon-link-active" : ""}`}
              >
                {item.label}
                {active && <sup className="neon-link-index">{secNumber(item.href)}</sup>}
              </Link>
            );
          })}
          <Link
            href="/contact"
            className="neon-cta ml-1 whitespace-nowrap px-4 py-2.5 text-[14px]"
          >
            Start a conversation
          </Link>
        </nav>

        <button
          className="neon-menu-btn px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] lg:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav aria-label="Mobile" className="border-t border-line-dark lg:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === item.href ? "page" : undefined}
              className="neon-mobile-link block px-8 py-3 text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="neon-mobile-link block px-8 py-3 text-sm font-semibold text-bright"
          >
            Start a conversation →
          </Link>
        </nav>
      )}
    </header>
  );
}
