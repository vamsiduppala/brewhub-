import { notFound } from "next/navigation";
import { getIdeaById, getAllIdeas } from "@/utils/data";
import IdeaContent from "./IdeaContent";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const idea = await getIdeaById(id);
  if (!idea) return {};

  return {
    title: `${idea.title} - Startup Idea | Brew`,
    description: idea.tagline,
  };
}

// Statically generate paths for the seed mock ideas so they load instantly
export async function generateStaticParams() {
  const ideas = await getAllIdeas();
  return ideas.map((idea) => ({
    id: idea.id,
  }));
}

export default async function IdeaPage({ params }: Props) {
  const { id } = await params;
  const idea = await getIdeaById(id);

  if (!idea) {
    notFound();
  }

  return <IdeaContent idea={idea} />;
}
