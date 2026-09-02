import Link from "next/link";
import Image from "next/image";
import logoLockup from "@/public/logo-lockup-white.png";
import { org, nav } from "@/lib/content";

// Forest footer, bookending the nav so the light body sits between two dark
// bands. `.on-forest` also recolours the mono-labels inside it.

export default function Footer() {
  return (
    <footer className="on-forest border-t border-line-dark">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-8 py-14 md:grid-cols-3">
        <div>
          <Image src={logoLockup} alt="International Logic Systems" className="h-7 w-auto" />
          <p className="mt-2 max-w-xs text-sm text-soft">{org.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            {org.credentials.slice(0, 3).map((c) => (
              <span key={c} className="mono-label flex items-center gap-2">
                <span className="status-dot" aria-hidden /> {c}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mono-label mb-3">Navigate</p>
          <ul className="grid grid-cols-2 gap-2">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="text-sm text-soft transition-colors hover:text-bright"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mono-label mb-3">Headquarters</p>
          {org.hq.map((line) => (
            <p key={line} className="text-sm text-soft">
              {line}
            </p>
          ))}
          <div className="mt-4 flex gap-4">
            <a href={org.social.linkedin} className="mono-label hover:!text-white">
              LinkedIn
            </a>
            <a href={org.social.twitter} className="mono-label hover:!text-white">
              X / Twitter
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-line-dark">
        <p className="mono-label mx-auto max-w-[1180px] px-8 py-4 text-[10px]">
          © {new Date().getFullYear()} International Logic Systems, Inc. · Local proof of concept
        </p>
      </div>
    </footer>
  );
}
