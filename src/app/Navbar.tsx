"use client";

import { FaGithub } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { MdDarkMode } from "react-icons/md";
import { CiLight } from "react-icons/ci";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const handleBack = () => {
    router.push("/projects");
  };

  const handleThemeClick = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleClickIcon = () => {
    window.open("https://github.com/vini1237777/TestMind", "_blank");
  };

  return (
    <nav className="w-full bg-amber-300 h-12 flex items-center justify-between px-4">
      <h1
        className="font-semibold cursor-pointer hover:bg-amber-200 rounded-md p-2 dark:text-black"
        onClick={handleBack}
      >
        TestMind
      </h1>

      <div className="flex gap-1">
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
  );
}
