"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useStrategyStore } from "@/lib/store";

// Enhanced video-derived strategies with YouTube integration
// In production these come from the admin Curation Hub (Engineering Plan §3-B3 / SDLC)
const PRESETS = [
  {
    id: "strat-1",
    name: "London Sweep + Retrace",
    source: "ICT Concepts — Shorts",
    youtubeId: "abc123",
    duration: "8:24",
    thumbnailUrl: "https://img.youtube.com/vi/abc123/default.jpg",
    prompt:
      "Trade only during the London session. Sweep the previous day high, then enter short on a 50% retrace. Trail the stop by 30 pips.",
    category: "Session Trading",
    difficulty: "Intermediate",
    usageCount: 234
  },
  {
    id: "strat-2",
    name: "NY Order Block",
    source: "Smart Money Basics — Shorts",
    youtubeId: "def456",
    duration: "12:15",
    thumbnailUrl: "https://img.youtube.com/vi/def456/default.jpg",
    prompt:
      "Wait for a bullish order block during New York session, enter on an engulfing candle, trail stop 25 pips.",
    category: "Smart Money",
    difficulty: "Beginner",
    usageCount: 189
  },
  {
    id: "strat-3",
    name: "EMA Trend Cross",
    source: "Simple Systems — Shorts",
    youtubeId: "ghi789",
    duration: "6:45",
    thumbnailUrl: "https://img.youtube.com/vi/ghi789/default.jpg",
    prompt:
      "9 and 21 EMA cross, only when ATR is above average, trail the stop by 20 pips.",
    category: "Trend Following",
    difficulty: "Beginner",
    usageCount: 312
  },
  {
    id: "strat-4",
    name: "Asia Range Fib",
    source: "Session Trading — Shorts",
    youtubeId: "jkl012",
    duration: "10:30",
    thumbnailUrl: "https://img.youtube.com/vi/jkl012/default.jpg",
    prompt:
      "During the Asia session, wait for a fair value gap, then enter on a 61.8% retrace, trail stop 15 pips.",
    category: "Session Trading",
    difficulty: "Advanced",
    usageCount: 156
  },
  {
    id: "strat-5",
    name: "FVG Breakout",
    source: "ICT Advanced — Shorts",
    youtubeId: "mno345",
    duration: "15:20",
    thumbnailUrl: "https://img.youtube.com/vi/mno345/default.jpg",
    prompt:
      "Wait for a fair value gap during London session, enter on breakout with 20 pip stop loss.",
    category: "Breakout",
    difficulty: "Advanced",
    usageCount: 98
  }
];

const CATEGORIES = ["All", "Session Trading", "Smart Money", "Trend Following", "Breakout"];
const DIFFICULTY_LEVELS = ["All", "Beginner", "Intermediate", "Advanced"];

export default function LibraryPage() {
  const router = useRouter();
  const { loadPreset } = useStrategyStore();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPresets = PRESETS.filter(preset => {
    const matchesCategory = selectedCategory === "All" || preset.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "All" || preset.difficulty === selectedDifficulty;
    const matchesSearch = searchQuery === "" || 
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const handleLoadPreset = (preset: typeof PRESETS[0]) => {
    loadPreset(preset.prompt, preset.name);
    router.push("/readback");
  };

  const handleWatchVideo = (e: React.MouseEvent, youtubeId: string) => {
    e.stopPropagation();
    // Open YouTube video
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, "_blank");
  };

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Strategy Library" />
      <main className="flex-1 overflow-y-auto px-4 py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="font-display font-bold text-xl text-chalk mb-1">
            Video Strategies
          </h1>
          <p className="text-sm text-chalk/60">
            Strategies from trading videos, mapped to blocks by experts
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-chalk/40 text-lg">
            search
          </span>
          <input
            type="text"
            placeholder="Search strategies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline bg-slate text-chalk placeholder:text-chalk/40 text-sm focus:outline-none focus:ring-1 focus:ring-signal"
          />
        </div>

        {/* Category Filters */}
        <div className="mb-4">
          <p className="text-xs text-chalk/50 mb-2 uppercase tracking-wide">Category</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-signal text-white"
                    : "bg-slate text-chalk/70 hover:bg-slate-high"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Filters */}
        <div className="mb-6">
          <p className="text-xs text-chalk/50 mb-2 uppercase tracking-wide">Difficulty</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {DIFFICULTY_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => setSelectedDifficulty(level)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDifficulty === level
                    ? "bg-signal text-white"
                    : "bg-slate text-chalk/70 hover:bg-slate-high"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Cards */}
        <div className="flex flex-col gap-3">
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-chalk/20 mb-2">
                search_off
              </span>
              <p className="text-sm text-chalk/40">No strategies found</p>
            </div>
          ) : (
            filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-3 rounded-lg border border-outline bg-slate hover:border-signal/50 transition-colors"
              >
                <div className="flex gap-3 mb-3">
                  {/* Thumbnail */}
                  <div className="w-28 h-20 shrink-0 rounded-md bg-slate-high overflow-hidden relative">
                    <img
                      src={preset.thumbnailUrl}
                      alt={preset.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='112' height='80'%3E%3Crect fill='%231b2333' width='112' height='80'/%3E%3Ctext fill='%2384967e' font-size='12' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Thumbnail%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white mono-num">
                      {preset.duration}
                    </div>
                    <button
                      onClick={(e) => handleWatchVideo(e, preset.youtubeId)}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-white text-3xl">
                        play_circle
                      </span>
                    </button>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-chalk mb-1 line-clamp-2">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-chalk/50 mb-2">
                      {preset.source}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-high text-chalk/70">
                        {preset.category}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-slate-high text-chalk/70">
                        {preset.difficulty}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-chalk/40">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span className="mono-num">{preset.usageCount}</span>
                    <span>uses</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleLoadPreset(preset)}
                  >
                    Load Strategy
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
