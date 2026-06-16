import { IdeaCardData } from "@/components/IdeaCard";
import categories from "@/data/categories.json";
import mockIdeas from "@/data/mock-ideas.json";

export async function getIdeasForCategory(slug: string): Promise<IdeaCardData[]> {
  try {
    // Next.js dynamic import will resolve client-side or server-side
    const module = await import(`@/data/${slug}.json`);
    return module.default as IdeaCardData[];
  } catch (error) {
    // Fallback to mock data filtered by category
    return (mockIdeas as IdeaCardData[]).filter(
      (idea) => idea.category === slug
    );
  }
}

export async function getAllIdeas(): Promise<IdeaCardData[]> {
  let allIdeas: IdeaCardData[] = [...(mockIdeas as IdeaCardData[])];
  
  for (const cat of categories) {
    try {
      const module = await import(`@/data/${cat.slug}.json`);
      if (module && module.default) {
        // Remove mock items for this category to avoid duplicates, then add real ones
        allIdeas = [
          ...allIdeas.filter((i) => i.category !== cat.slug),
          ...(module.default as IdeaCardData[]),
        ];
      }
    } catch (e) {
      // JSON file doesn't exist yet, ignore and keep mock items
    }
  }
  
  return allIdeas;
}

export async function getIdeaById(id: string): Promise<IdeaCardData | null> {
  const all = await getAllIdeas();
  return all.find((idea) => idea.id === id) || null;
}

export async function getTrendingIdeas(): Promise<IdeaCardData[]> {
  const all = await getAllIdeas();
  // Sort by momentum score descending, and return top 3
  return [...all].sort((a, b) => b.momentumScore - a.momentumScore).slice(0, 3);
}

// Helper to count ideas per category
export async function getCategoryIdeaCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  
  // Set default counts based on mock data
  for (const cat of categories) {
    counts[cat.slug] = (mockIdeas as IdeaCardData[]).filter(
      (idea) => idea.category === cat.slug
    ).length;
  }

  for (const cat of categories) {
    try {
      const module = await import(`@/data/${cat.slug}.json`);
      if (module && module.default) {
        counts[cat.slug] = (module.default as IdeaCardData[]).length;
      }
    } catch (e) {
      // file does not exist, keep mock count
    }
  }

  return counts;
}
