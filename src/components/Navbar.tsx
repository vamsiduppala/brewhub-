"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, Bookmark, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [savedCount, setSavedCount] = useState(0);

  // Read saved count from localStorage on mount and when changed
  useEffect(() => {
    const updateCount = () => {
      try {
        const bookmarks = JSON.parse(localStorage.getItem("brew-bookmarks") || "[]");
        setSavedCount(bookmarks.length);
      } catch (e) {
        setSavedCount(0);
      }
    };
    
    updateCount();
    window.addEventListener("storage", updateCount);
    
    // Custom event dispatch for same-tab updates
    window.addEventListener("bookmarks-changed", updateCount);
    
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("bookmarks-changed", updateCount);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md transition-colors duration-250">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-primary text-primary-foreground rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
              <Coffee className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 group-hover:from-primary group-hover:to-primary/80 bg-clip-text text-transparent transition-all duration-300">
              Brew
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/" 
                  ? "bg-secondary text-secondary-foreground" 
                  : "text-muted hover:text-foreground"
              }`}
            >
              Explore Categories
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/saved"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group ${
              pathname === "/saved"
                ? "bg-secondary text-secondary-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Bookmark className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Saved Ideas</span>
            <AnimatePresence>
              {savedCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-between justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border border-background shadow-sm"
                >
                  <span className="w-full text-center">{savedCount}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-secondary transition-all active:scale-95 cursor-pointer"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-primary animate-pulse" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
