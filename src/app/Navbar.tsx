"use client";

import { FaGithub } from "react-icons/fa";
import { MdDarkMode } from "react-icons/md";
import { CiLight } from "react-icons/ci";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TestMindInfoCard from "./components/InformationCard";

export default function Navbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const handleButtonClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleThemeClick = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleClickIcon = () => {
    window.open("https://github.com/vini1237777/TestMind", "_blank");
  };

  return (
    <div>
      {isOpen && <TestMindInfoCard open={isOpen} setIsOpen={setIsOpen} />}
      <nav className="tm-slide w-full bg-amber-300 h-12 flex items-center justify-between px-4 dark:bg-gray-200">
        <button
          type="button"
          onClick={handleButtonClick}
          aria-label="About TestMind"
          className="tm-logo flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-amber-200 dark:text-black"
        >
          <span className="tm-logo-tile grid h-8 w-8 place-items-center rounded-lg bg-black text-[13px] font-black tracking-tight text-amber-300">
            TM
          </span>
          <span className="text-base font-semibold">TestMind</span>
        </button>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            aria-current={active("/") ? "page" : undefined}
            className={`text-sm font-medium rounded-md px-2 py-1 text-black transition-colors ${active("/") ? "bg-amber-200 dark:bg-gray-300" : "hover:bg-amber-200"}`}
          >
            Home
          </Link>
          <Link
            href="/projects"
            aria-current={active("/projects") ? "page" : undefined}
            className={`text-sm font-medium rounded-md px-2 py-1 text-black transition-colors ${active("/projects") ? "bg-amber-200 dark:bg-gray-300" : "hover:bg-amber-200"}`}
          >
            Workspace
          </Link>
          <Link
            href="/tech"
            aria-current={active("/tech") ? "page" : undefined}
            className={`text-sm font-medium rounded-md px-2 py-1 text-black transition-colors ${active("/tech") ? "bg-amber-200 dark:bg-gray-300" : "hover:bg-amber-200"}`}
          >
            Tech stack
          </Link>
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
        </div>
      </nav>
    </div>
  );
}
