"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Sparkles, AlertCircle, ArrowUpRight, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export type Source = {
  title: string;
  url: string;
  subreddit: string;
  upvotes: number;
  numComments: number;
};

export type IdeaCardData = {
  id: string;
  category: string;
  title: string;
  tagline: string;
  whatItIs: string;
  momentum: "Emerging" | "Heating Up" | "Hot" | "Crowded";
  momentumScore: number;
  momentumWhy: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  whyNow: string;
  theTea: string;
  whoIsDoingIt: string;
  gettingStarted: string[];
  tags: string[];
  sources: Source[];
  lastUpdated: string;
};

type IdeaCardProps = {
  data: IdeaCardData;
  index: number;
};

export default function IdeaCard({ data, index }: IdeaCardProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("brew-bookmarks") || "[]");
      setIsBookmarked(saved.includes(data.id));
    } catch (e) {
      setIsBookmarked(false);
    }
  }, [data.id]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((centerY - y) / centerY) * 6;
    const rY = ((x - centerX) / centerX) * 6;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const saved = JSON.parse(localStorage.getItem("brew-bookmarks") || "[]") as string[];
      let updated: string[];
      if (saved.includes(data.id)) {
        updated = saved.filter((id) => id !== data.id);
        setIsBookmarked(false);
      } else {
        updated = [...saved, data.id];
        setIsBookmarked(true);
      }
      localStorage.setItem("brew-bookmarks", JSON.stringify(updated));
      window.dispatchEvent(new Event("bookmarks-changed"));
    } catch (err) {
      console.error(err);
    }
  };

  // Badge stylings
  const momentumStyles = {
    "Emerging": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "Heating Up": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    "Hot": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    "Crowded": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  }[data.momentum];

  const difficultyStyles = {
    "Beginner": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    "Intermediate": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    "Advanced": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  }[data.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="perspective-1000"
    >
      <Link href={`/idea/${data.id}`} className="block">
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: "preserve-3d",
          }}
          className="relative flex flex-col justify-between h-full p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-200 ease-out cursor-pointer group"
        >
          {/* Header Row */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex flex-wrap gap-1.5">
                <span className={`text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${momentumStyles}`}>
                  {data.momentum}
                </span>
                <span className={`text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${difficultyStyles}`}>
                  {data.difficulty}
                </span>
              </div>
              <button
                onClick={toggleBookmark}
                className="p-2 rounded-lg border border-border bg-background/50 hover:bg-secondary text-muted hover:text-primary transition-all cursor-pointer active:scale-90"
                aria-label="Bookmark idea"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
              </button>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors flex items-start gap-1">
              <span>{data.title}</span>
              <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0 mt-1" />
            </h3>

            {/* Tagline */}
            <p className="text-sm font-medium text-foreground/80 mb-3 line-clamp-2">
              {data.tagline}
            </p>

            {/* description preview */}
            <p className="text-xs text-muted line-clamp-3 leading-relaxed mb-4">
              {data.whatItIs}
            </p>
          </div>

          {/* Footer details: Momentum bar + Tags */}
          <div className="mt-4 pt-4 border-t border-border/80">
            {/* Momentum Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-muted mb-1 font-medium">
                <span>Momentum score</span>
                <span className="font-bold text-foreground">{data.momentumScore}/100</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.momentumScore}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {data.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md border border-border/30">
                  #{tag}
                </span>
              ))}
              {data.tags.length > 3 && (
                <span className="text-[10px] font-semibold text-muted px-1.5 py-0.5">
                  +{data.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function IdeaCardSkeleton() {
  return (
    <div className="flex flex-col justify-between h-full p-6 rounded-2xl border border-border bg-card/60 animate-pulse">
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex gap-1.5">
            <div className="h-5 w-16 bg-secondary rounded-full" />
            <div className="h-5 w-20 bg-secondary rounded-full" />
          </div>
          <div className="h-8 w-8 bg-secondary rounded-lg" />
        </div>
        <div className="h-6 w-3/4 bg-secondary rounded-md mb-2" />
        <div className="h-4 w-full bg-secondary rounded-md mb-2" />
        <div className="h-3 w-5/6 bg-secondary rounded-md mb-1" />
        <div className="h-3 w-4/6 bg-secondary rounded-md mb-1" />
      </div>
      <div className="mt-6 pt-4 border-t border-border/80">
        <div className="h-3 w-full bg-secondary rounded-md mb-2" />
        <div className="h-1.5 w-full bg-secondary rounded-full mb-3" />
        <div className="flex gap-1.5">
          <div className="h-4 w-12 bg-secondary rounded-md" />
          <div className="h-4 w-14 bg-secondary rounded-md" />
          <div className="h-4 w-10 bg-secondary rounded-md" />
        </div>
      </div>
    </div>
  );
}
