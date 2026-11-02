"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { FiMoon, FiSun } from "react-icons/fi";

const NAV = [
  { href: "/projects", label: "Workspace", match: (p: string) => p.startsWith("/projects") },
  { href: "/architecture", label: "How it works", match: (p: string) => p.startsWith("/architecture") },
];

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span
      aria-hidden
      className="grid place-items-center rounded-[9px] border-[1.5px] border-[#111827] bg-white font-display font-extrabold text-[#111827] -rotate-6 transition-transform group-hover:rotate-6"
      style={{ width: size, height: size, fontSize: size * 0.5, boxShadow: "2px 2px 0 #111827" }}
    >
      T
    </span>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      className="grid h-9 w-9 place-items-center rounded-lg text-[#111827] hover:bg-black/10"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {isDark ? <FiSun /> : <FiMoon />}
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b-[1.5px] border-[#111827] bg-nav">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-[19px] font-extrabold tracking-tight text-[#111827]">TestMind</span>
          </Link>

          <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Primary">
            {NAV.map(({ href, label, match }) => {
              const active = match(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-[13px] font-semibold sm:px-2.5 sm:text-[13.5px] text-[#111827] transition-colors ${
                    active ? "bg-white/70 shadow-[2px_2px_0_#111827] border-[1.5px] border-[#111827]" : "border-[1.5px] border-transparent hover:bg-black/10"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <a
              href="https://github.com/vini1237777/TestMind"
              target="_blank"
              rel="noreferrer"
              className="grid h-9 w-9 place-items-center rounded-lg text-[#111827] hover:bg-black/10"
              aria-label="Open GitHub repository"
            >
              <FaGithub size={18} />
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="min-w-0">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-2 px-4 py-6 text-[12.5px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <p>
            Built by{" "}
            <a href="https://github.com/vini1237777" className="font-semibold text-fg hover:text-accent" target="_blank" rel="noreferrer">
              Vinisha Yadav
            </a>
          </p>
          <p className="font-mono text-[11.5px]">Next.js · LangGraph · OpenAI · MongoDB · Redis</p>
        </div>
      </footer>
    </div>
  );
}

/** Standard page width for app screens (the landing page manages its own). */
export function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10 animate-rise">{children}</div>;
}
