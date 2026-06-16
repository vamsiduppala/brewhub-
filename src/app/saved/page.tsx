"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, ArrowRight, HelpCircle } from "lucide-react";
import IdeaCard, { IdeaCardData } from "@/components/IdeaCard";
import { getAllIdeas } from "@/utils/data";

export default function SavedPage() {
  const [savedIdeas, setSavedIdeas] = useState<IdeaCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedIdeas = async () => {
    try {
      const bookmarks = JSON.parse(localStorage.getItem("brew-bookmarks") || "[]") as string[];
      if (bookmarks.length === 0) {
        setSavedIdeas([]);
        setLoading(false);
        return;
      }
      
      const all = await getAllIdeas();
      const filtered = all.filter((idea) => bookmarks.includes(idea.id));
      setSavedIdeas(filtered);
    } catch (e) {
      setSavedIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedIdeas();
    window.addEventListener("bookmarks-changed", loadSavedIdeas);
    return () => {
      window.removeEventListener("bookmarks-changed", loadSavedIdeas);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
          <Bookmark className="w-7 h-7 text-primary fill-primary/10" />
          <span>Saved Ideas</span>
          {savedIdeas.length > 0 && (
            <span className="text-sm font-semibold px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted">
              {savedIdeas.length}
            </span>
          )}
        </h1>
        <p className="text-muted text-sm mt-2">
          Your personal shortlist of startup concepts and product ideas. Saved in your local browser state.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-2xl border border-border bg-card/50 animate-pulse" />
          ))}
        </div>
      ) : savedIdeas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedIdeas.map((idea, idx) => (
            <IdeaCard key={idea.id} data={idea} index={idx} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 p-8 rounded-2xl border border-dashed border-border bg-card/20 max-w-md mx-auto space-y-4">
          <HelpCircle className="w-12 h-12 text-muted mx-auto" />
          <h3 className="font-extrabold text-lg">No saved ideas yet</h3>
          <p className="text-xs text-muted leading-relaxed">
            Browse through our categories and tap the bookmark icon on any startup card to add it to your shortlist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs transition-opacity hover:opacity-90 cursor-pointer"
          >
            <span>Explore Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
