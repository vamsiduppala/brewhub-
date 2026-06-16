import categories from "@/data/categories.json";
import CategoryCard from "@/components/CategoryCard";
import IdeaCard from "@/components/IdeaCard";
import { getCategoryIdeaCounts, getTrendingIdeas } from "@/utils/data";
import { Sparkles, Database, Code2, Rocket, ArrowRight } from "lucide-react";
import Link from "next/link";

export const revalidate = 3600; // Revalidate page cache hourly

export default async function HomePage() {
  const ideaCounts = await getCategoryIdeaCounts();
  const trendingIdeas = await getTrendingIdeas();

  return (
    <div className="space-y-16 md:space-y-24">
      {/* Hero Section */}
      <section className="relative text-center max-w-3xl mx-auto space-y-6 pt-4">
        {/* Glow effect background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10" />
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent border border-primary/20 text-xs font-semibold text-primary mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Antigravity 2.0 Idea Hub</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Find what to <span className="bg-gradient-to-r from-primary via-amber-500 to-primary bg-clip-text text-transparent">build next</span>
        </h1>
        
        <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
          Brew filters out complaints and decodes real Reddit discussions into structured, high-momentum startup and product ideas. Built for creators, developers, and side-hustlers.
        </p>
      </section>

      {/* How it Works Strip */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 rounded-2xl border border-border/80 bg-card/50 backdrop-blur-sm shadow-sm relative overflow-hidden">
        <div className="flex gap-4">
          <div className="p-3 bg-secondary rounded-xl h-fit text-primary">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1">1. Fetch Raw Threads</h3>
            <p className="text-xs text-muted leading-relaxed">
              We monitor 14 startup spaces, collecting hot and top discussions from curated subreddit lists.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="p-3 bg-secondary rounded-xl h-fit text-primary">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1">2. Decode with Gemini</h3>
            <p className="text-xs text-muted leading-relaxed">
              Gemini filters out the noise, structures raw feedback, identifies the debates, and writes startable Idea Cards.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="p-3 bg-secondary rounded-xl h-fit text-primary">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1">3. Build & Launch</h3>
            <p className="text-xs text-muted leading-relaxed">
              You get clear explanations, checkable startup steps, and links to source discussions to build your MVP.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border/80 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Explore Categories</h2>
            <p className="text-sm text-muted">Tap a category to discover curated startup cards</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <CategoryCard
              key={cat.slug}
              slug={cat.slug}
              name={cat.name}
              description={cat.description}
              icon={cat.icon}
              ideaCount={ideaCounts[cat.slug] || 0}
              index={idx}
            />
          ))}
        </div>
      </section>

      {/* Trending / Highlighted Section */}
      {trendingIdeas.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="flex items-end justify-between border-b border-border/80 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Trending Ideas</span>
              </h2>
              <p className="text-sm text-muted">Startup cards showing strong discussions and momentum right now</p>
            </div>
            <Link 
              href="/saved" 
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 group"
            >
              <span>View Saved List</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingIdeas.map((idea, idx) => (
              <IdeaCard key={idea.id} data={idea} index={idx} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
