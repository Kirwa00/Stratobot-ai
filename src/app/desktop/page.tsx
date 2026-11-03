import { Header } from "@/components/Header";
import { TrackView } from "@/components/TrackView";
import { DESKTOP_MAX_PCS, PRICE_DESKTOP_SHORT } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";
import { DesktopBuy } from "./DesktopBuy";

export const metadata = buildMetadata({
  title: "StratoBot for Windows — install EAs into MT5 in one click",
  description: `The StratoBot desktop app builds your EA and installs it straight into MetaTrader 5, compiled and ready to attach. One-off licence, ${PRICE_DESKTOP_SHORT}.`,
  path: "/desktop",
});

const FEATURES = [
  ["bolt", "One-click install", "Finds every MetaTrader 5 terminal on your PC and copies the EA into MQL5 → Experts for you."],
  ["build", "Compiled for you", "Runs MetaEditor in the background and tells you if the build has 0 errors. No F7, no hunting for folders."],
  ["desktop_windows", "Its own window", "StratoBot opens on your desktop next to MT5, with your saved strategies and checkout."],
] as const;

export default function DesktopPage() {
  return (
    <div className="flex flex-col flex-1">
      <TrackView event="pricing_viewed" props={{ page: "desktop" }} />
      <Header back title="Desktop app" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-10 flex flex-col gap-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-chalk mb-2">StratoBot for Windows</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            Build your strategy and download the EA straight into MetaTrader 5, already compiled. Then you only need to
            drag it onto a chart.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {FEATURES.map(([icon, title, body]) => (
            <li key={title} className="rounded-lg border border-outline px-4 py-3 flex gap-3">
              <span className="material-symbols-outlined text-secondary shrink-0">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-chalk">{title}</p>
                <p className="text-sm text-chalk/70 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-lg border border-signal/40 bg-slate px-4 py-4">
          <div className="flex items-baseline justify-between mb-1">
            <p className="font-display font-bold text-lg text-chalk">Desktop licence</p>
            <p className="font-display font-bold text-lg text-chalk mono-num">{PRICE_DESKTOP_SHORT}</p>
          </div>
          <p className="text-sm text-chalk/80 leading-relaxed">
            One-off payment, no subscription. Your licence key works on up to {DESKTOP_MAX_PCS} Windows PCs or VPSs.
            EAs are still priced as on the website.
          </p>
        </div>

        <DesktopBuy />

        <p className="text-xs text-chalk/60 leading-relaxed">
          Needs Windows 10 or 11 (64-bit) and an internet connection. Windows may show a SmartScreen notice the first
          time you run the installer: choose More info → Run anyway.
        </p>
      </main>
    </div>
  );
}
