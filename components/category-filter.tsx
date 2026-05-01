"use client";

import { Search } from "lucide-react";

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  allLabel: string;
  searchPlaceholder: string;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  allLabel,
  searchPlaceholder,
}: CategoryFilterProps) {
  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-xl border border-white/8 bg-secondary/40 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground backdrop-blur-sm transition-colors duration-200 focus:border-primary/40 focus:bg-secondary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Category pills */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onCategoryChange("all")}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
              activeCategory === "all"
                ? "border-primary bg-primary text-white shadow-sm shadow-primary/25"
                : "border-white/8 bg-secondary/60 text-muted-foreground hover:border-white/15 hover:bg-secondary hover:text-foreground"
            }`}
          >
            {allLabel}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeCategory === cat
                  ? "border-primary bg-primary text-white shadow-sm shadow-primary/25"
                  : "border-white/8 bg-secondary/60 text-muted-foreground hover:border-white/15 hover:bg-secondary hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
