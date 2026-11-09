"use client";

import { FaGithub } from "react-icons/fa";
import { MdDarkMode } from "react-icons/md";
import { CiLight } from "react-icons/ci";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import FeaturesModal, { type FeaturesTab } from "./components/FeaturesModal";
import VisitorCount from "./components/VisitorCount";
import { signOut } from "./components/AuthCard";

/** Signed in: the first letter of the email, opening a small menu with Sign out. */
function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative ml-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account, signed in as ${email}`}
        className="grid h-8 w-8 place-items-center rounded-full bg-black text-sm font-bold uppercase text-amber-300 ring-amber-200 transition hover:ring-4"
      >
        {email[0]}
      </button>
      {open && (
        <div
          role="menu"
          className="tm-pop absolute right-0 top-10 z-50 w-60 rounded-lg border border-black bg-white p-1 text-sm text-black shadow-[4px_4px_0_0_#fcd34d] dark:border-amber-400 dark:bg-slate-900 dark:text-white"
        >
          <p className="truncate px-3 py-2 text-xs text-gray-500">{email}</p>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="w-full rounded-md px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar({ email }: { email: string | null }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [featuresTab, setFeaturesTab] = useState<FeaturesTab>("tour");
  const [openCount, setOpenCount] = useState(0);
  const openFeatures = (tab: FeaturesTab = "tour") => {
    setFeaturesTab(tab);
    setOpenCount((n) => n + 1);
    setFeaturesOpen(true);
  };

  // Other parts of the page can open the modal with: dispatchEvent(new CustomEvent("tm:features", { detail: "tech" }))
  useEffect(() => {
    const onOpen = (e: Event) => openFeatures(((e as CustomEvent).detail as FeaturesTab) || "tour");
    window.addEventListener("tm:features", onOpen);
    return () => window.removeEventListener("tm:features", onOpen);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const handleThemeClick = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleClickIcon = () => {
    window.open("https://github.com/vini1237777/TestMind", "_blank");
  };

  return (
    <div>
      <FeaturesModal key={openCount} open={featuresOpen} initialTab={featuresTab} onClose={() => setFeaturesOpen(false)} />
      <nav className="tm-slide w-full bg-amber-300 h-12 flex items-center justify-between px-4">
        <Link
          href="/"
          aria-label="TestMind home"
          className="tm-logo flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-amber-200 dark:text-black"
        >
          <span className="tm-logo-tile grid h-8 w-8 place-items-center rounded-lg bg-black text-[13px] font-black tracking-tight text-amber-300">
            TM
          </span>
          <span className="hidden text-base font-semibold sm:inline">TestMind</span>
        </Link>

        <div className="flex items-center gap-1">
          <VisitorCount />
          <Link
            href="/"
            aria-current={active("/") ? "page" : undefined}
            className={`text-sm font-medium rounded-md px-2 py-1 text-black transition-colors ${active("/") ? "bg-amber-200" : "hover:bg-amber-200"}`}
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => openFeatures("tour")}
            aria-haspopup="dialog"
            className={`text-sm font-medium rounded-md px-2 py-1 text-black transition-colors ${featuresOpen ? "bg-amber-200" : "hover:bg-amber-200"}`}
          >
            Features
          </button>
          <Link
            href="/projects"
            aria-current={active("/projects") ? "page" : undefined}
            className={`text-sm font-medium rounded-md px-2 py-1 text-black transition-colors ${active("/projects") ? "bg-amber-200" : "hover:bg-amber-200"}`}
          >
            Workspace
          </Link>
          {!email && (
            <Link
              href={pathname === "/" ? "/#signin" : `/?next=${encodeURIComponent(pathname)}`}
              onClick={(e) => {
                if (pathname !== "/") return;
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("tm:signin"));
              }}
              className="ml-1 rounded-md bg-black px-3 py-1 text-sm font-medium text-amber-300 hover:bg-gray-800"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            className="text-3xl cursor-pointer hover:bg-amber-200 rounded-md p-1"
            onClick={handleClickIcon}
            aria-label="Open GitHub repository"
          >
            <FaGithub className="text-black" />
          </button>
          <button
            type="button"
            suppressHydrationWarning
            className="text-3xl cursor-pointer hover:bg-amber-200 rounded-md p-1"
            onClick={handleThemeClick}
            aria-label="Toggle theme"
          >
            {!mounted ? (
              <MdDarkMode className="text-black" />
            ) : isDark ? (
              <CiLight className="text-black" />
            ) : (
              <MdDarkMode className="text-black" />
            )}
          </button>
          {email && <AccountMenu email={email} />}
        </div>
      </nav>
    </div>
  );
}
