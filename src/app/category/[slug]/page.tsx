import { notFound } from "next/navigation";
import categories from "@/data/categories.json";
import { getIdeasForCategory } from "@/utils/data";
import CategoryContent from "./CategoryContent";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata dynamically for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) return {};

  return {
    title: `${category.name} Ideas | Brew`,
    description: `Browse product & business ideas in the ${category.name} category decoded from Reddit discussions.`,
  };
}

// Enable static path generation for all 14 seed categories
export async function generateStaticParams() {
  return categories.map((cat) => ({
    slug: cat.slug,
  }));
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const ideas = await getIdeasForCategory(slug);

  return <CategoryContent category={category} initialIdeas={ideas} />;
}
