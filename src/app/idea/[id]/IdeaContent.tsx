"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  TrendingUp,
  Clock,
  Sparkles,
  CheckSquare,
  Square,
  MessageSquare,
  Users,
  Compass,
  ArrowUpRight,
  ExternalLink,
  Monitor,
} from "lucide-react";
import { IdeaCardData } from "@/components/IdeaCard";
import categories from "@/data/categories.json";
import { motion } from "framer-motion";

type IdeaContentProps = {
  idea: IdeaCardData;
};

export default function IdeaContent({ idea }: IdeaContentProps) {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [meterWidth, setMeterWidth] = useState(0);

  const categoryInfo = categories.find((c) => c.slug === idea.category);

  // Load bookmark and progress from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("brew-bookmarks") || "[]");
      setIsBookmarked(saved.includes(idea.id));

      const progress = JSON.parse(localStorage.getItem(`brew-progress-${idea.id}`) || "[]");
      setCheckedSteps(progress);
    } catch (e) {
      // ignore
    }

    // Trigger meter filling animation after mount
    const timer = setTimeout(() => {
      setMeterWidth(idea.momentumScore);
    }, 100);

    return () => clearTimeout(timer);
  }, [idea.id, idea.momentumScore]);

  const toggleBookmark = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("brew-bookmarks") || "[]") as string[];
      let updated: string[];
      if (saved.includes(idea.id)) {
        updated = saved.filter((id) => id !== idea.id);
        setIsBookmarked(false);
      } else {
        updated = [...saved, idea.id];
        setIsBookmarked(true);
      }
      localStorage.setItem("brew-bookmarks", JSON.stringify(updated));
      window.dispatchEvent(new Event("bookmarks-changed"));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStep = (idx: number) => {
    const updated = checkedSteps.includes(idx)
      ? checkedSteps.filter((i) => i !== idx)
      : [...checkedSteps, idx];
    
    setCheckedSteps(updated);
    try {
      localStorage.setItem(`brew-progress-${idea.id}`, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  // Badge stylings
  const momentumStyles = {
    "Emerging": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    "Heating Up": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    "Hot": "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    "Crowded": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  }[idea.momentum];

  const difficultyStyles = {
    "Beginner": "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    "Intermediate": "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    "Advanced": "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  }[idea.difficulty];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back button & Action row */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </button>

        <button
          onClick={toggleBookmark}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-sm font-bold transition-all active:scale-95 cursor-pointer"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-primary text-primary" : "text-muted"}`} />
          <span>{isBookmarked ? "Saved Idea" : "Save Idea"}</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {categoryInfo && (
            <Link
              href={`/category/${idea.category}`}
              className="text-[11px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground px-3 py-1 rounded-md border border-border hover:border-primary/50 transition-colors"
            >
              {categoryInfo.name}
            </Link>
          )}
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${momentumStyles}`}>
            {idea.momentum}
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-md border ${difficultyStyles}`}>
            {idea.difficulty}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
          {idea.title}
        </h1>
        <p className="text-lg sm:text-xl font-medium text-foreground/90 max-w-3xl leading-relaxed">
          {idea.tagline}
        </p>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card: What it is */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              <span>What it is</span>
            </h2>
            <p className="text-foreground/85 text-sm sm:text-base leading-relaxed">
              {idea.whatItIs}
            </p>
          </div>

          {/* Card: Momentum Meter */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span>Momentum Analysis</span>
              </h2>
              <span className="text-lg font-extrabold text-primary">{idea.momentumScore}/100</span>
            </div>
            
            <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
              <div
                style={{ width: `${meterWidth}%` }}
                className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-1000 cubic-bezier(0.25, 1, 0.5, 1)"
              />
            </div>
            
            <div className="p-3 bg-secondary/40 rounded-xl border border-border/50 text-xs leading-relaxed">
              <span className="font-bold text-foreground">Why the score: </span>
              <span className="text-muted">{idea.momentumWhy}</span>
            </div>
          </div>

          {/* Card: The Tea (Discourse & Debates) */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4 relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

            <h2 className="text-lg font-bold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span>The Tea (Community Debate)</span>
            </h2>
            <p className="text-xs text-muted leading-relaxed font-semibold uppercase tracking-wider mb-2">
              Inside perspectives from the developers, customers, and builders on the ground
            </p>
            
            <div className="p-5 rounded-xl bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 text-sm sm:text-base text-foreground/90 italic leading-relaxed relative">
              <span className="absolute -top-3.5 left-4 text-2xl font-serif text-primary opacity-60">“</span>
              <p className="pl-4 pr-2">{idea.theTea}</p>
              <span className="absolute -bottom-8 right-4 text-2xl font-serif text-primary opacity-60">”</span>
            </div>
          </div>

          {/* Card: Why Now */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Why Now?</span>
            </h2>
            <p className="text-foreground/85 text-sm leading-relaxed">
              {idea.whyNow}
            </p>
          </div>

          {/* Card: Getting Started checklist */}
          <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span>Getting Started Checklist</span>
            </h2>
            
            <div className="flex flex-col gap-3">
              {(idea.gettingStarted || []).map((step, idx) => {
                const checked = checkedSteps.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className="flex items-start gap-3 w-full text-left p-3.5 rounded-xl border border-border/80 bg-background/50 hover:bg-secondary/40 transition-colors cursor-pointer group"
                  >
                    <span className="text-primary shrink-0 mt-0.5">
                      {checked ? (
                        <CheckSquare className="w-5 h-5 fill-primary/10" />
                      ) : (
                        <Square className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
                      )}
                    </span>
                    <span className={`text-sm leading-relaxed font-medium transition-all ${checked ? "line-through text-muted" : "text-foreground"}`}>
                      {step}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Sidebar Info & Sources */}
        <div className="space-y-8">
          {/* Card: Audience / Builders */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-1.5 uppercase text-muted tracking-wider">
              <Users className="w-4 h-4 text-primary" />
              <span>Active Builders</span>
            </h3>
            <p className="text-xs font-semibold leading-relaxed text-foreground">
              {idea.whoIsDoingIt}
            </p>
          </div>

          {/* Card: Target User Environment */}
          {idea.environment && (
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-1.5 uppercase text-muted tracking-wider">
                <Monitor className="w-4 h-4 text-primary" />
                <span>User Environment</span>
              </h3>
              <p className="text-xs font-semibold leading-relaxed text-foreground">
                {idea.environment}
              </p>
            </div>
          )}

          {/* Card: Tags */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase text-muted tracking-wider">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {(idea.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-bold bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg border border-border/40"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Card: Source Reddit Threads */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase text-muted tracking-wider flex items-center justify-between px-1">
              <span>Source citations</span>
              <span className="text-[10px] text-muted font-normal">Link to Reddit</span>
            </h3>

            <div className="flex flex-col gap-4">
              {(idea.sources || []).map((src, idx) => (
                <a
                  key={idx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/40 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-primary font-mono uppercase">
                      <span>r/{src.subreddit}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-muted group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xs font-bold leading-relaxed text-foreground/90 group-hover:text-primary transition-colors line-clamp-3">
                      {src.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-semibold text-muted pt-2 border-t border-border/40">
                    <span>{src.upvotes} upvotes</span>
                    <span>{src.numComments} comments</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
