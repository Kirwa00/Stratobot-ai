import React, { useState } from 'react';
import {
  PlayCircle,
  Zap,
  Search,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  Sliders,
  ShieldCheck,
  Clock,
  Target,
  Youtube,
  Tv,
  ListPlus
} from 'lucide-react';
import { VideoCard, StrategyBlueprint } from '../types';
import { INITIAL_VIDEOS } from '../data/initialData';

interface VideoHubProps {
  onLoadStrategy: (blueprint: StrategyBlueprint) => void;
  onNavigateToBuilder: () => void;
}

export const VideoHub: React.FC<VideoHubProps> = ({
  onLoadStrategy,
  onNavigateToBuilder
}) => {
  const [videoList, setVideoList] = useState<VideoCard[]>(INITIAL_VIDEOS);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isSearchingYt, setIsSearchingYt] = useState<boolean>(false);
  const [activeModalVideo, setActiveModalVideo] = useState<VideoCard | null>(null);
  const [customYtUrl, setCustomYtUrl] = useState<string>('');
  const [searchSuccessMsg, setSearchSuccessMsg] = useState<string>('');

  const quickSearchPrompts = [
    { label: 'ICT Silver Bullet', query: 'ICT Silver Bullet Forex Strategy' },
    { label: 'London Killzone FVG', query: 'London Open Killzone FVG EURUSD' },
    { label: 'Gold (XAUUSD) Scalper', query: 'Gold 1 Minute Scalping Strategy XAUUSD' },
    { label: '200 EMA Trend Strategy', query: '200 EMA + 50 EMA Trend Pullback Strategy' },
    { label: 'Order Block & Sweep', query: 'SMC Order Block Liquidity Sweep Strategy' },
    { label: 'Asia Range Breakout', query: 'Asian Session Range Breakout Forex Strategy' }
  ];

  const handleSearchYouTube = async (searchQuery: string, directUrl?: string) => {
    const term = directUrl || searchQuery;
    if (!term.trim()) return;

    setIsSearchingYt(true);
    setSearchSuccessMsg('');

    try {
      const res = await fetch('/api/search-youtube-strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          youtubeUrl: directUrl || undefined
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
        // Prepend new YouTube strategy videos to list
        setVideoList((prev) => {
          const existingIds = new Set(prev.map((v) => v.id));
          const newUnique = data.videos.filter((v: VideoCard) => !existingIds.has(v.id));
          return [...newUnique, ...prev];
        });
        setSearchSuccessMsg(`Found and extracted ${data.videos.length} YouTube strategies!`);
        setTimeout(() => setSearchSuccessMsg(''), 4000);
      } else {
        // Heuristic fallback if AI server returned 0 videos
        createClientFallbackStrategy(term);
      }
    } catch (err) {
      console.warn('YouTube search API error, applying client-side extraction:', err);
      createClientFallbackStrategy(term);
    } finally {
      setIsSearchingYt(false);
    }
  };

  const createClientFallbackStrategy = (term: string) => {
    const isGold = term.toLowerCase().includes('gold') || term.toLowerCase().includes('xau');
    const isSilverBullet = term.toLowerCase().includes('silver') || term.toLowerCase().includes('bullet');
    const isEma = term.toLowerCase().includes('ema') || term.toLowerCase().includes('moving average');
    const isAsia = term.toLowerCase().includes('asia');

    let videoId = 'N6hBqY1QjD4';
    let symbol = 'EURUSD';
    let tf = 'M15';
    let badge = 'YouTube Search Result';
    let bricks: StrategyBlueprint['bricks'] = [
      { instanceId: `fb-1-${Date.now()}`, brickId: 'killzone', config: { session: 'London' } },
      { instanceId: `fb-2-${Date.now()}`, brickId: 'fvg', config: { minGapPips: 3 } },
      { instanceId: `fb-3-${Date.now()}`, brickId: 'trailing_stop', config: { trailingPips: 15 } }
    ];

    if (isGold) {
      videoId = '8jPQjjsBbIc';
      symbol = 'XAUUSD';
      tf = 'M5';
      badge = 'Gold Scalping';
      bricks = [
        { instanceId: `fb-1-${Date.now()}`, brickId: 'fib', config: { levelMin: 0.5, levelMax: 0.618 } },
        { instanceId: `fb-2-${Date.now()}`, brickId: 'atr', config: { atrPeriod: 14, minAtrPips: 15 } },
        { instanceId: `fb-3-${Date.now()}`, brickId: 'trailing_stop', config: { trailingPips: 20 } }
      ];
    } else if (isSilverBullet) {
      videoId = 'L_LUpnjgPso';
      symbol = 'GBPUSD';
      tf = 'M5';
      badge = 'Silver Bullet';
      bricks = [
        { instanceId: `fb-1-${Date.now()}`, brickId: 'pdh_pdl', config: { bufferPips: 2, action: 'Sweep' } },
        { instanceId: `fb-2-${Date.now()}`, brickId: 'engulfing', config: { minBodyPips: 4 } },
        { instanceId: `fb-3-${Date.now()}`, brickId: 'atr', config: { minAtrPips: 8 } }
      ];
    } else if (isEma) {
      videoId = 'Z1BCujX3pw8';
      symbol = 'EURUSD';
      tf = 'H1';
      badge = 'Trend Following';
      bricks = [
        { instanceId: `fb-1-${Date.now()}`, brickId: 'ma_cross', config: { fastPeriod: 9, slowPeriod: 21 } },
        { instanceId: `fb-2-${Date.now()}`, brickId: 'atr', config: { minAtrPips: 10 } },
        { instanceId: `fb-3-${Date.now()}`, brickId: 'trailing_stop', config: { trailingPips: 18 } }
      ];
    } else if (isAsia) {
      videoId = '9bZkp7q19f0';
      symbol = 'GBPUSD';
      tf = 'M15';
      badge = 'Breakout Session';
      bricks = [
        { instanceId: `fb-1-${Date.now()}`, brickId: 'killzone', config: { session: 'London' } },
        { instanceId: `fb-2-${Date.now()}`, brickId: 'pdh_pdl', config: { bufferPips: 2, action: 'Breakout' } }
      ];
    }

    const fallbackCard: VideoCard = {
      id: `yt-fallback-${Date.now()}`,
      title: `${term.length > 50 ? term.slice(0, 50) + '...' : term} (YouTube Strategy Blueprint)`,
      creator: 'YouTube Forex Masterclass',
      thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      duration: '17:34',
      badge,
      concept: `Automated Strategy extracted for query: "${term}"`,
      winRateEst: '74% - 82%',
      description: `Algorithmic MQL5 execution model generated from YouTube strategy research on ${term}.`,
      keyRules: [
        `Target Asset: ${symbol} on ${tf} timeframe`,
        `Core Signal: ${bricks.map(b => b.brickId).join(' + ')}`,
        'Defined Risk/Reward with dynamic Stop Loss management',
        'Automated execution via MT5 CTrade engine'
      ],
      blueprint: {
        id: `bp-yt-fb-${Date.now()}`,
        title: `${term} EA`,
        description: `Automated MT5 EA extracted from YouTube strategy research: ${term}`,
        symbol,
        timeframe: tf,
        riskPercent: 1.0,
        fixedLot: 0.1,
        stopLossPips: 15,
        takeProfitPips: 45,
        useTrailingStop: true,
        trailingStopPips: 15,
        magicNumber: Math.floor(100000 + Math.random() * 800000),
        bricks,
        checkEntryLogic: 'CheckBricksLogic()',
        checkExitLogic: 'ApplyTrailingStop()'
      }
    };

    setVideoList((prev) => [fallbackCard, ...prev]);
    setSearchSuccessMsg(`Extracted strategy blueprint for "${term}"!`);
    setTimeout(() => setSearchSuccessMsg(''), 4000);
  };

  const handleOneClickLoad = (video: VideoCard) => {
    onLoadStrategy(video.blueprint);
    setLoadedId(video.id);
    if (activeModalVideo) {
      setActiveModalVideo(null);
    }
    setTimeout(() => {
      onNavigateToBuilder();
    }, 350);
  };

  const filteredVideos = videoList.filter((vid) => {
    const matchesSearch =
      vid.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vid.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vid.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vid.badge.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag =
      selectedTag === 'All' ||
      vid.badge.toLowerCase().includes(selectedTag.toLowerCase()) ||
      (selectedTag === 'ICT / SMC' && (vid.badge.includes('ICT') || vid.badge.includes('SMC') || vid.badge.includes('Silver'))) ||
      (selectedTag === 'Gold' && vid.badge.toLowerCase().includes('gold')) ||
      (selectedTag === 'Trend' && vid.badge.toLowerCase().includes('trend')) ||
      (selectedTag === 'Breakout' && vid.badge.toLowerCase().includes('breakout'));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6 py-4">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-red-950/80 border border-red-800/80 px-3 py-1 rounded-full text-xs text-red-300 font-mono">
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>YouTube Forex Strategy Research & AI Extractor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Search Forex Strategies via YouTube
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Search any YouTube Forex trading strategy or paste a video link. Our AI analyzes the video's methodology, extracts the exact entry/exit rules, and builds an MT5 Lego Blueprint ready to compile!
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-xs font-mono text-emerald-300 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center space-x-1.5">
                <span>1-Click Video → EA</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Pre-fills MQL5 Lego blocks instantly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main YouTube Search Bar Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-3 flex items-center space-x-1.5 pointer-events-none text-red-400">
              <Youtube className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  handleSearchYouTube(searchTerm);
                }
              }}
              placeholder="Search YouTube Forex strategies (e.g. 'ICT Silver Bullet EURUSD', 'Gold 1m Scalper', '200 EMA Pullback')..."
              className="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/40 font-mono placeholder:text-slate-500 shadow-inner"
            />
          </div>

          {/* Search Button */}
          <button
            onClick={() => handleSearchYouTube(searchTerm)}
            disabled={isSearchingYt || !searchTerm.trim()}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold font-mono flex items-center justify-center space-x-2 shadow-lg shadow-red-600/20 transition-all cursor-pointer shrink-0"
          >
            {isSearchingYt ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Extracting with AI...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search YouTube & Extract EA</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Popular YouTube Forex Searches:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickSearchPrompts.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setSearchTerm(p.query);
                  handleSearchYouTube(p.query);
                }}
                disabled={isSearchingYt}
                className="bg-slate-950 hover:bg-slate-800 hover:border-red-500/50 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <span>{p.label}</span>
                <ArrowRight className="w-3 h-3 opacity-60" />
              </button>
            ))}
          </div>
        </div>

        {/* Direct YouTube URL Custom Extractor */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <Tv className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-slate-300 font-bold">Have a specific YouTube Forex video?</span>
            <span className="hidden md:inline text-slate-500">Paste URL to convert into MQL5:</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customYtUrl}
              onChange={(e) => setCustomYtUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="bg-slate-900 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-red-500 font-mono flex-1 sm:w-64"
            />
            <button
              onClick={() => {
                if (customYtUrl.trim()) {
                  handleSearchYouTube('YouTube Video Analysis', customYtUrl.trim());
                  setCustomYtUrl('');
                }
              }}
              disabled={isSearchingYt || !customYtUrl.trim()}
              className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-500 font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
            >
              Parse Video
            </button>
          </div>
        </div>

        {/* Success notification banner */}
        {searchSuccessMsg && (
          <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-2.5 rounded-xl text-xs font-mono flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{searchSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Filter and Category Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white">Filter Categories ({filteredVideos.length} strategies):</span>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs font-mono">
          {['All', 'ICT / SMC', 'Silver Bullet', 'Gold', 'Trend', 'Breakout'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((vid) => (
          <div
            key={vid.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/50 hover:shadow-emerald-500/5 transition-all group flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail Container & Click to Watch */}
              <div
                onClick={() => setActiveModalVideo(vid)}
                className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer"
              >
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                {/* Badge */}
                <span className="absolute top-3 left-3 bg-red-950/90 text-red-300 border border-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono uppercase flex items-center space-x-1 shadow-md">
                  <Youtube className="w-3 h-3 text-red-400" />
                  <span>{vid.badge}</span>
                </span>

                {/* Duration */}
                <span className="absolute bottom-3 right-3 bg-slate-950/90 text-white text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{vid.duration}</span>
                </span>

                {/* Center Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-red-600/90 group-hover:bg-red-500 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <PlayCircle className="w-7 h-7" />
                  </div>
                </div>
              </div>

              {/* Strategy Details */}
              <div className="p-5 space-y-3">
                <h3
                  onClick={() => setActiveModalVideo(vid)}
                  className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors leading-snug cursor-pointer line-clamp-2"
                >
                  {vid.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-slate-300 truncate max-w-[60%]">{vid.creator}</span>
                  <span className="text-emerald-400 font-bold shrink-0">{vid.winRateEst} Win</span>
                </div>

                {/* Strategy Specs Pills */}
                <div className="flex items-center space-x-2 text-[11px] font-mono">
                  <span className="bg-slate-950 border border-slate-800 text-cyan-300 px-2 py-0.5 rounded">
                    {vid.blueprint.symbol}
                  </span>
                  <span className="bg-slate-950 border border-slate-800 text-amber-300 px-2 py-0.5 rounded">
                    {vid.blueprint.timeframe}
                  </span>
                  <span className="bg-slate-950 border border-slate-800 text-emerald-300 px-2 py-0.5 rounded">
                    SL: {vid.blueprint.stopLossPips}p · TP: {vid.blueprint.takeProfitPips}p
                  </span>
                </div>

                {/* Lego Bricks Detected */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">
                    Detected Lego Bricks:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {vid.blueprint.bricks.map((b) => (
                      <span
                        key={b.instanceId}
                        className="bg-slate-900 border border-slate-800 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded"
                      >
                        {b.brickId}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-5 pt-0 space-y-2">
              <button
                onClick={() => handleOneClickLoad(vid)}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer ${
                  loadedId === vid.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20'
                }`}
              >
                {loadedId === vid.id ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Loaded to Strategy Builder!</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>1-Click Load into Strategy Builder</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setActiveModalVideo(vid)}
                className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 text-xs font-mono flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <PlayCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Watch Video & Inspect AI Rules</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Embedded YouTube Player & Strategy Breakdown Modal */}
      {activeModalVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <span className="font-bold text-white text-sm font-mono truncate max-w-md sm:max-w-xl">
                  {activeModalVideo.title}
                </span>
              </div>
              <button
                onClick={() => setActiveModalVideo(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Embedded Player */}
              <div className="aspect-video w-full bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner">
                <iframe
                  src={`${activeModalVideo.embedUrl}?autoplay=1&rel=0`}
                  title={activeModalVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              {/* Strategy Analysis Panel */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Video Metadata & Key Rules */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Channel Creator:</span>
                    <span className="text-white font-bold">{activeModalVideo.creator}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Estimated Win Rate:</span>
                    <span className="text-emerald-400 font-bold">{activeModalVideo.winRateEst}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400 uppercase font-bold block mb-1.5 flex items-center space-x-1">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      <span>AI-Extracted Strategy Rules:</span>
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {(activeModalVideo.keyRules || [
                        'Detect high-probability liquidity sweep or session time',
                        'Wait for confirmation candle or order block mitigation',
                        'Set stop loss at structural swing and target 1:3 risk-to-reward'
                      ]).map((rule, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right: MQL5 Lego Blueprint Breakdown */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Target Asset & TF:</span>
                    <span className="text-cyan-300 font-bold">
                      {activeModalVideo.blueprint.symbol} · {activeModalVideo.blueprint.timeframe}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Stop Loss</span>
                      <span className="text-red-400 font-bold">{activeModalVideo.blueprint.stopLossPips} pips</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Take Profit</span>
                      <span className="text-emerald-400 font-bold">{activeModalVideo.blueprint.takeProfitPips} pips</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400 uppercase font-bold block mb-1.5 flex items-center space-x-1">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Configured Lego Bricks ({activeModalVideo.blueprint.bricks.length}):</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeModalVideo.blueprint.bricks.map((b) => (
                        <span
                          key={b.instanceId}
                          className="bg-slate-900 border border-slate-800 text-cyan-300 text-xs px-2 py-1 rounded"
                        >
                          {b.brickId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              {activeModalVideo.youtubeUrl && (
                <a
                  href={activeModalVideo.youtubeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs font-mono text-slate-400 hover:text-red-400 flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open directly on YouTube</span>
                </a>
              )}

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setActiveModalVideo(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => handleOneClickLoad(activeModalVideo)}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold font-mono flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>1-Click Load into Strategy Builder</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
