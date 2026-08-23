import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  Play,
  Code,
  Layers,
  Copy,
  Trash2,
  Download,
  Calendar,
  Sparkles,
  Youtube,
  Shield,
  TrendingUp,
  Sliders,
  Check,
  ExternalLink,
  Zap,
  Tag,
  ArrowUpDown,
  Filter,
  BarChart2
} from 'lucide-react';
import { StrategyBlueprint } from '../types';

interface MyStrategiesProps {
  strategies: StrategyBlueprint[];
  currentBlueprint: StrategyBlueprint;
  onSelectStrategy: (blueprint: StrategyBlueprint) => void;
  onSaveStrategy: (blueprint: StrategyBlueprint) => void;
  onDeleteStrategy: (id: string) => void;
  onDuplicateStrategy: (id: string) => void;
  onNavigateToBuilder: () => void;
  onNavigateToSimulator: () => void;
  onNavigateToCompiler: () => void;
}

export const MyStrategies: React.FC<MyStrategiesProps> = ({
  strategies,
  currentBlueprint,
  onSelectStrategy,
  onSaveStrategy,
  onDeleteStrategy,
  onDuplicateStrategy,
  onNavigateToBuilder,
  onNavigateToSimulator,
  onNavigateToCompiler,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'winrate' | 'bricks'>('recent');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract unique symbols for filtering
  const availableSymbols = Array.from(
    new Set(strategies.map((s) => s.symbol).filter(Boolean))
  );

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(''), 3500);
  };

  const handleOpenInBuilder = (strategy: StrategyBlueprint) => {
    onSelectStrategy(strategy);
    onNavigateToBuilder();
  };

  const handleOpenInSimulator = (strategy: StrategyBlueprint) => {
    onSelectStrategy(strategy);
    onNavigateToSimulator();
  };

  const handleOpenInCompiler = (strategy: StrategyBlueprint) => {
    onSelectStrategy(strategy);
    onNavigateToCompiler();
  };

  const handleDuplicate = (id: string) => {
    onDuplicateStrategy(id);
    showNotification('Strategy duplicated successfully!');
  };

  const handleDelete = (id: string) => {
    onDeleteStrategy(id);
    setConfirmDeleteId(null);
    showNotification('Strategy deleted from your collection.');
  };

  const handleExportJson = (strategy: StrategyBlueprint) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(strategy, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${strategy.title.toLowerCase().replace(/[^a-z0-9]/gi, '_')}_stratobot.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification(`Exported ${strategy.title} JSON blueprint.`);
  };

  const handleCreateNewBlank = () => {
    const newBlankStrategy: StrategyBlueprint = {
      id: `my-strat-${Date.now()}`,
      title: `Custom Strategy #${strategies.length + 1}`,
      description: 'Custom discretionary algorithmic strategy built from scratch.',
      symbol: 'EURUSD',
      timeframe: 'M15',
      riskPercent: 1.0,
      fixedLot: 0.1,
      stopLossPips: 15,
      takeProfitPips: 45,
      useTrailingStop: true,
      trailingStopPips: 15,
      magicNumber: Math.floor(100000 + Math.random() * 800000),
      bricks: [
        {
          instanceId: `inst-${Date.now()}-1`,
          brickId: 'killzone',
          config: { session: 'London (08:00 - 11:00 EAT)', restrictTime: true }
        },
        {
          instanceId: `inst-${Date.now()}-2`,
          brickId: 'fvg',
          config: { minGapPips: 3 }
        }
      ],
      checkEntryLogic: 'CheckKillzone() && CheckFVG()',
      checkExitLogic: 'ApplyTrailingStop()',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['Custom', 'M15'],
      source: 'manual',
      winRateEst: '75%'
    };

    onSaveStrategy(newBlankStrategy);
    onSelectStrategy(newBlankStrategy);
    onNavigateToBuilder();
  };

  // Filter and Sort strategies
  const filteredStrategies = strategies
    .filter((strat) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        strat.title.toLowerCase().includes(query) ||
        strat.description?.toLowerCase().includes(query) ||
        strat.symbol.toLowerCase().includes(query) ||
        strat.timeframe.toLowerCase().includes(query) ||
        strat.bricks.some((b) => b.brickId.toLowerCase().includes(query)) ||
        (strat.tags && strat.tags.some((t) => t.toLowerCase().includes(query)));

      const matchesSymbol =
        selectedSymbol === 'all' || strat.symbol.toLowerCase() === selectedSymbol.toLowerCase();

      const matchesSource =
        selectedSource === 'all' || strat.source === selectedSource;

      return matchesSearch && matchesSymbol && matchesSource;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'bricks') {
        return b.bricks.length - a.bricks.length;
      }
      if (sortBy === 'winrate') {
        const wrA = parseInt(a.winRateEst || '70', 10);
        const wrB = parseInt(b.winRateEst || '70', 10);
        return wrB - wrA;
      }
      // 'recent' by default
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

  return (
    <div className="space-y-6 py-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-indigo-950 border border-indigo-800/80 px-3 py-1 rounded-full text-xs text-indigo-300 font-mono">
              <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
              <span>Strategy Vault & Portfolio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              My Forex Strategies
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Manage your saved trading blueprints, modify indicator parameters, run backtests on historical M1 tick data, or compile directly into MQL5 Expert Advisors.
            </p>
          </div>

          {/* Action buttons on banner */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleCreateNewBlank}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs font-mono flex items-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Create New Strategy</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs font-mono">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Saved Strategies</span>
            <span className="text-xl font-bold text-white mt-0.5 block">{strategies.length}</span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Active In Editor</span>
            <span className="text-xl font-bold text-cyan-400 mt-0.5 block truncate">
              {currentBlueprint.symbol} ({currentBlueprint.timeframe})
            </span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">Unique Pairs</span>
            <span className="text-xl font-bold text-indigo-300 mt-0.5 block">
              {availableSymbols.length || 1}
            </span>
          </div>
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px] block">MQL5 Safety Engine</span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">AST Checked</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {actionSuccessMsg && (
        <div className="bg-emerald-950/90 border border-emerald-700 text-emerald-300 p-3 rounded-xl text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button
            onClick={() => setActionSuccessMsg('')}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls / Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search saved strategies by title, symbol, indicator brick, or tag..."
              className="w-full bg-slate-950 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Symbol Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Symbols</option>
                {availableSymbols.map((sym) => (
                  <option key={sym} value={sym} className="bg-slate-900">{sym}</option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl">
              <span className="text-slate-400">Source:</span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Sources</option>
                <option value="ai_generator" className="bg-slate-900">AI Generated</option>
                <option value="youtube" className="bg-slate-900">YouTube Strategy</option>
                <option value="manual" className="bg-slate-900">Custom Built</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="recent" className="bg-slate-900">Recently Updated</option>
                <option value="name" className="bg-slate-900">Strategy Name</option>
                <option value="winrate" className="bg-slate-900">Win Rate</option>
                <option value="bricks" className="bg-slate-900">Most Bricks</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Strategies Grid */}
      {filteredStrategies.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No strategies found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No saved strategies matched your current filter criteria. Reset filters or create a new strategy with the AI generator.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSymbol('all');
                setSelectedSource('all');
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={onNavigateToBuilder}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs font-mono cursor-pointer transition-colors"
            >
              Open Strategy Builder
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredStrategies.map((strat) => {
            const isCurrentlyActive = currentBlueprint.id === strat.id;

            return (
              <div
                key={strat.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between group ${
                  isCurrentlyActive
                    ? 'border-cyan-500/80 ring-1 ring-cyan-500/30 bg-slate-900/90'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header: Title & Source Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                          {strat.title}
                        </h3>
                        {isCurrentlyActive && (
                          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {strat.description || 'Discretionary Forex algorithmic strategy.'}
                      </p>
                    </div>

                    {/* Source Tag */}
                    <div className="shrink-0">
                      {strat.source === 'youtube' ? (
                        <span className="inline-flex items-center space-x-1 bg-red-950/80 text-red-300 border border-red-800/80 text-[10px] font-mono px-2.5 py-1 rounded-lg">
                          <Youtube className="w-3 h-3 text-red-400" />
                          <span>YouTube</span>
                        </span>
                      ) : strat.source === 'ai_generator' ? (
                        <span className="inline-flex items-center space-x-1 bg-purple-950/80 text-purple-300 border border-purple-800/80 text-[10px] font-mono px-2.5 py-1 rounded-lg">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span>Gemini AI</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-mono px-2.5 py-1 rounded-lg">
                          <Layers className="w-3 h-3 text-cyan-400" />
                          <span>Custom</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Core Metrics Strip */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Pair</span>
                      <span className="text-xs font-bold text-cyan-300">{strat.symbol}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Timeframe</span>
                      <span className="text-xs font-bold text-amber-300">{strat.timeframe}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">SL / TP</span>
                      <span className="text-xs font-bold text-emerald-300">
                        {strat.stopLossPips}p / {strat.takeProfitPips}p
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Win Rate</span>
                      <span className="text-xs font-bold text-indigo-300">{strat.winRateEst || '76%'}</span>
                    </div>
                  </div>

                  {/* Bricks / Modules Tag list */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Sliders className="w-3 h-3 text-cyan-400" />
                        <span>Configured Strategy Bricks ({strat.bricks.length}):</span>
                      </span>
                      <span className="text-slate-500">Magic: {strat.magicNumber}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {strat.bricks.map((brick) => (
                        <span
                          key={brick.instanceId}
                          className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded"
                        >
                          {brick.brickId}
                        </span>
                      ))}
                      {strat.useTrailingStop && (
                        <span className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded">
                          trailing: {strat.trailingStopPips}p
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Open in Builder */}
                    <button
                      onClick={() => handleOpenInBuilder(strat)}
                      className="bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/30 hover:border-cyan-500 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                      title="Edit strategy in Strategy Builder canvas"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* Run in Simulator */}
                    <button
                      onClick={() => handleOpenInSimulator(strat)}
                      className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/30 hover:border-emerald-500 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                      title="Backtest strategy against historical candle data"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Backtest</span>
                    </button>

                    {/* Compile to MQL5 */}
                    <button
                      onClick={() => handleOpenInCompiler(strat)}
                      className="bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/30 hover:border-indigo-500 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                      title="Generate and compile MQL5 Expert Advisor"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Compile</span>
                    </button>
                  </div>

                  {/* Secondary Utilities: Clone, Export, Delete */}
                  <div className="flex items-center justify-between pt-1 text-xs font-mono text-slate-400">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDuplicate(strat.id)}
                        className="hover:text-cyan-300 flex items-center space-x-1 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Duplicate strategy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Clone</span>
                      </button>

                      <button
                        onClick={() => handleExportJson(strat)}
                        className="hover:text-indigo-300 flex items-center space-x-1 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Download JSON blueprint"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[11px]">JSON</span>
                      </button>
                    </div>

                    {confirmDeleteId === strat.id ? (
                      <div className="flex items-center space-x-1 bg-red-950/80 px-2 py-1 rounded border border-red-800">
                        <span className="text-[10px] text-red-300">Confirm?</span>
                        <button
                          onClick={() => handleDelete(strat.id)}
                          className="text-red-400 hover:text-white font-bold text-[10px] cursor-pointer"
                        >
                          Yes
                        </button>
                        <span className="text-slate-500 text-[10px]">/</span>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-slate-400 hover:text-white text-[10px] cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(strat.id)}
                        className="hover:text-red-400 flex items-center space-x-1 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer text-slate-500"
                        title="Delete strategy"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
