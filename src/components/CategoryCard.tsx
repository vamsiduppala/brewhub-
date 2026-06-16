"use client";

import React, { useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { motion } from "framer-motion";

type CategoryProps = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  ideaCount?: number;
  index: number;
};

export default function CategoryCard({
  slug,
  name,
  description,
  icon,
  ideaCount = 0,
  index,
}: CategoryProps) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Dynamic Lucide Icon Resolution
  const IconComponent = (Icons as any)[icon] || Icons.HelpCircle;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Max rotation 8 degrees
    const rX = ((centerY - y) / centerY) * 8;
    const rY = ((x - centerX) / centerX) * 8;
    
    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="perspective-1000"
    >
      <Link href={`/category/${slug}`} className="block">
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onMouseEnter={() => setIsHovered(true)}
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            transformStyle: "preserve-3d",
          }}
          className="relative h-full p-6 rounded-2xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-xl transition-all duration-200 ease-out overflow-hidden cursor-pointer select-none group"
        >
          {/* Subtle gradient sheen overlay */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(circle 220px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(217, 119, 6, 0.08), transparent)`,
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
              e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
            }}
          />

          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-secondary text-primary rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent">
              <IconComponent className="w-6 h-6" />
            </div>
            {ideaCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-accent-foreground border border-primary/10">
                {ideaCount} {ideaCount === 1 ? "Idea" : "Ideas"}
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold tracking-tight mb-2 group-hover:text-primary transition-colors duration-200">
            {name}
          </h3>
          <p className="text-sm text-muted line-clamp-3 leading-relaxed">
            {description}
          </p>

          {/* Underlay glow bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </div>
      </Link>
    </motion.div>
  );
}
