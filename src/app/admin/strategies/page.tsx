"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";

interface VideoStrategy {
  id: string;
  name: string;
  source: string;
  prompt: string;
  youtubeId?: string;
  status: "published" | "draft" | "archived";
  createdAt: number;
  usageCount: number;
}

// Mock data - in production this would come from an API
const MOCK_STRATEGIES: VideoStrategy[] = [
  {
    id: "strat-1",
    name: "London Sweep + Retrace",
    source: "ICT Concepts — Shorts",
    prompt: "Trade only during the London session. Sweep the previous day high, then enter short on a 50% retrace. Trail the stop by 30 pips.",
    youtubeId: "abc123",
    status: "published",
    createdAt: Date.now() - 86400000 * 7,
    usageCount: 234
  },
  {
    id: "strat-2",
    name: "NY Order Block",
    source: "Smart Money Basics — Shorts",
    prompt: "Wait for a bullish order block during New York session, enter on an engulfing candle, trail stop 25 pips.",
    youtubeId: "def456",
    status: "published",
    createdAt: Date.now() - 86400000 * 5,
    usageCount: 189
  },
  {
    id: "strat-3",
    name: "EMA Trend Cross",
    source: "Simple Systems — Shorts",
    prompt: "9 and 21 EMA cross, only when ATR is above average, trail the stop by 20 pips.",
    status: "draft",
    createdAt: Date.now() - 86400000 * 2,
    usageCount: 0
  },
  {
    id: "strat-4",
    name: "Asia Range Fib",
    source: "Session Trading — Shorts",
    prompt: "During the Asia session, wait for a fair value gap, then enter on a 61.8% retrace, trail stop 15 pips.",
    status: "published",
    createdAt: Date.now() - 86400000 * 10,
    usageCount: 412
  }
];

export default function AdminStrategiesPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<VideoStrategy[]>(MOCK_STRATEGIES);
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "archived">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStrategies = strategies.filter(strategy => {
    const matchesFilter = filter === "all" || strategy.status === filter;
    const matchesSearch = searchQuery === "" || 
      strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: VideoStrategy["status"]) => {
    switch (status) {
      case "published": return "text-green-400";
      case "draft": return "text-yellow-400";
      case "archived": return "text-chalk/40";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Strategy Management" />
      <main className="flex-1 overflow-y-auto px-4 py-6">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-xl text-chalk">
              Video Strategies
            </h1>
            <Button onClick={() => router.push("/admin/strategies/new")}>
              <span className="material-symbols-outlined text-sm mr-2">add</span>
              Add Strategy
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
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
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2.5 rounded-lg border border-outline bg-slate text-chalk text-sm focus:outline-none focus:ring-1 focus:ring-signal"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 rounded-lg border border-outline bg-slate">
            <p className="text-xs text-chalk/50 mb-1">Total Strategies</p>
            <p className="text-lg font-bold text-chalk mono-num">{strategies.length}</p>
          </div>
          <div className="p-3 rounded-lg border border-outline bg-slate">
            <p className="text-xs text-chalk/50 mb-1">Published</p>
            <p className="text-lg font-bold text-green-400 mono-num">
              {strategies.filter(s => s.status === "published").length}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-outline bg-slate">
            <p className="text-xs text-chalk/50 mb-1">Total Usage</p>
            <p className="text-lg font-bold text-chalk mono-num">
              {strategies.reduce((sum, s) => sum + s.usageCount, 0)}
            </p>
          </div>
        </div>

        {/* Strategy List */}
        <div className="flex flex-col gap-2">
          {filteredStrategies.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-chalk/20 mb-2">
                search_off
              </span>
              <p className="text-sm text-chalk/40">No strategies found</p>
            </div>
          ) : (
            filteredStrategies.map((strategy) => (
              <div
                key={strategy.id}
                className="p-4 rounded-lg border border-outline bg-slate hover:border-signal/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/strategies/${strategy.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium text-chalk truncate">
                      {strategy.name}
                    </h3>
                    <p className="text-xs text-chalk/50 truncate">
                      {strategy.source}
                    </p>
                  </div>
                  <span className={`text-xs font-medium uppercase tracking-wide ${getStatusColor(strategy.status)}`}>
                    {strategy.status}
                  </span>
                </div>
                
                <p className="text-xs text-chalk/70 line-clamp-2 mb-3">
                  {strategy.prompt}
                </p>

                <div className="flex items-center justify-between text-xs text-chalk/40">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">calendar_today</span>
                      {formatDate(strategy.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                      {strategy.usageCount} uses
                    </span>
                  </div>
                  {strategy.youtubeId && (
                    <span className="flex items-center gap-1 text-red-400">
                      <span className="material-symbols-outlined text-sm">play_circle</span>
                      YouTube
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}