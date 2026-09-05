"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";

interface CuratedVideo {
  id: string;
  title: string;
  channel: string;
  youtubeId: string;
  duration: string;
  thumbnailUrl: string;
  strategyId?: string;
  status: "pending" | "mapped" | "rejected";
  addedAt: number;
}

// Mock data - in production this would come from YouTube API + internal database
const MOCK_VIDEOS: CuratedVideo[] = [
  {
    id: "vid-1",
    title: "ICT Concepts: London Killzone Strategy",
    channel: "ICT Shorts",
    youtubeId: "abc123",
    duration: "8:24",
    thumbnailUrl: "https://img.youtube.com/vi/abc123/default.jpg",
    strategyId: "strat-1",
    status: "mapped",
    addedAt: Date.now() - 86400000 * 7
  },
  {
    id: "vid-2",
    title: "Smart Money: Order Block Entry",
    channel: "Smart Money Basics",
    youtubeId: "def456",
    duration: "12:15",
    thumbnailUrl: "https://img.youtube.com/vi/def456/default.jpg",
    strategyId: "strat-2",
    status: "mapped",
    addedAt: Date.now() - 86400000 * 5
  },
  {
    id: "vid-3",
    title: "Price Action: Engulfing Candle Setup",
    channel: "Trading Mastery",
    youtubeId: "ghi789",
    duration: "6:45",
    thumbnailUrl: "https://img.youtube.com/vi/ghi789/default.jpg",
    status: "pending",
    addedAt: Date.now() - 86400000 * 2
  },
  {
    id: "vid-4",
    title: "Session Trading: Asia Range",
    channel: "Forex Pro",
    youtubeId: "jkl012",
    duration: "10:30",
    thumbnailUrl: "https://img.youtube.com/vi/jkl012/default.jpg",
    strategyId: "strat-4",
    status: "mapped",
    addedAt: Date.now() - 86400000 * 10
  }
];

export default function AdminVideosPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<CuratedVideo[]>(MOCK_VIDEOS);
  const [filter, setFilter] = useState<"all" | "pending" | "mapped" | "rejected">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = videos.filter(video => {
    const matchesFilter = filter === "all" || video.status === filter;
    const matchesSearch = searchQuery === "" || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.channel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: CuratedVideo["status"]) => {
    switch (status) {
      case "mapped": return "text-green-400";
      case "pending": return "text-yellow-400";
      case "rejected": return "text-red-400";
    }
  };

  const getStatusBadge = (status: CuratedVideo["status"]) => {
    switch (status) {
      case "mapped": return "✓ Mapped";
      case "pending": return "⏳ Pending";
      case "rejected": return "✗ Rejected";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Video Curation" />
      <main className="flex-1 overflow-y-auto px-4 py-6">
        {/* Header Actions */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display font-bold text-xl text-chalk">
              YouTube Video Library
            </h1>
            <Button onClick={() => {/* TODO: Add YouTube URL input modal */}}>
              <span className="material-symbols-outlined text-sm mr-2">add_link</span>
              Add YouTube URL
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
                placeholder="Search videos..."
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
              <option value="pending">Pending</option>
              <option value="mapped">Mapped</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-lg border border-outline bg-slate">
            <p className="text-xs text-chalk/50 mb-1">Total Videos</p>
            <p className="text-lg font-bold text-chalk mono-num">{videos.length}</p>
          </div>
          <div className="p-3 rounded-lg border border-outline bg-slate">
            <p className="text-xs text-chalk/50 mb-1">Mapped</p>
            <p className="text-lg font-bold text-green-400 mono-num">
              {videos.filter(v => v.status === "mapped").length}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-outline bg-slate">
            <p className="text-xs text-chalk/50 mb-1">Pending</p>
            <p className="text-lg font-bold text-yellow-400 mono-num">
              {videos.filter(v => v.status === "pending").length}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-outline bg-slate">
            <p className="text-xs text-chalk/50 mb-1">Rejected</p>
            <p className="text-lg font-bold text-red-400 mono-num">
              {videos.filter(v => v.status === "rejected").length}
            </p>
          </div>
        </div>

        {/* Video List */}
        <div className="flex flex-col gap-3">
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-chalk/20 mb-2">
                video_library
              </span>
              <p className="text-sm text-chalk/40">No videos found</p>
            </div>
          ) : (
            filteredVideos.map((video) => (
              <div
                key={video.id}
                className="flex gap-3 p-3 rounded-lg border border-outline bg-slate hover:border-signal/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/videos/${video.id}`)}
              >
                {/* Thumbnail */}
                <div className="w-32 h-20 shrink-0 rounded-md bg-slate-high overflow-hidden relative">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='80'%3E%3Crect fill='%231b2333' width='128' height='80'/%3E%3Ctext fill='%2384967e' font-size='12' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Thumbnail%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-xs text-white mono-num">
                    {video.duration}
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-chalk line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <p className="text-xs text-chalk/50">
                      {video.channel}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${getStatusColor(video.status)}`}>
                      {getStatusBadge(video.status)}
                    </span>
                    <span className="text-xs text-chalk/40">
                      {formatDate(video.addedAt)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  {video.status === "pending" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Map to strategy
                        }}
                        className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        title="Map to strategy"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Reject video
                        }}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="Reject video"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </>
                  )}
                  {video.status === "mapped" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/strategies/${video.strategyId}`);
                      }}
                      className="p-2 rounded-lg bg-signal/10 text-signal hover:bg-signal/20 transition-colors"
                      title="View strategy"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>
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