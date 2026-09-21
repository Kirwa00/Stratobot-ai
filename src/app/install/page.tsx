"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { AffiliateCard } from "@/components/AffiliateCard";
import { AFFILIATE_OFFERS } from "@/lib/affiliates";

const DESKTOP_STEPS = [
  {
    title: "Find your download",
    body: "Locate the .mq5 file you just downloaded — it's usually in your Downloads folder.",
  },
  {
    title: "Open the Data Folder",
    body: "In MetaTrader 5, go to File → Open Data Folder, then open MQL5 → Experts. Copy your .mq5 file into that folder.",
  },
  {
    title: "Compile it",
    body: "Double-click the file in the Navigator panel to open it in MetaEditor, then press Compile (F7). Check the log at the bottom — it should say \"0 errors\". This step is required; MetaTrader can't run uncompiled source.",
  },
  {
    title: "Find your bot",
    body: "Back in MetaTrader 5, open the Navigator panel and expand Expert Advisors — your bot will be listed there.",
  },
  {
    title: "Turn on Algo Trading",
    body: "Click the Algo Trading button in the top toolbar so it's highlighted. Your bot can't place trades while it's off.",
  },
  {
    title: "Attach it to a chart",
    body: "Drag your bot from the Navigator onto a chart. In the dialog that opens, tick \"Allow live trading\" and confirm.",
  },
];

const MOBILE_STEPS = [
  {
    title: "Save the file to your phone",
    body: "Your download is saved to your phone's Downloads. Custom bots like this one need the desktop MetaTrader 5 terminal to run — mobile MT5 can't load them directly.",
  },
  {
    title: "Get it onto a desktop or VPS",
    body: "Email it to yourself, or upload it to cloud storage, so you can open it on a Windows PC or a trading VPS with MetaTrader 5 installed.",
  },
  {
    title: "Follow the desktop steps there",
    body: "Once it's on that device: File → Open Data Folder → MQL5 → Experts, copy the .mq5 file in, then double-click it in the Navigator to open MetaEditor and press Compile (F7) — check the log says \"0 errors\".",
  },
  {
    title: "Turn on Algo Trading",
    body: "Click the Algo Trading button in the top toolbar so it's highlighted. Your bot can't place trades while it's off.",
  },
  {
    title: "Attach it to a chart",
    body: "Drag your bot from the Navigator onto a chart. In the dialog that opens, tick \"Allow live trading\" and confirm.",
  },
];

export default function InstallPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [step, setStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // Platform detection only makes sense post-mount (no navigator on the server).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(/android|iphone|ipad/i.test(navigator.userAgent));
    setMounted(true);
  }, []);

  const steps = isMobile ? MOBILE_STEPS : DESKTOP_STEPS;
  const isLast = step === steps.length - 1;

  if (!mounted) return null;

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Install" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32 flex flex-col gap-5">
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-signal" : "bg-outline"}`}
            />
          ))}
        </div>

        <div className="rounded-lg border border-outline bg-slate aspect-video flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-chalk/25">
            {isMobile ? "smartphone" : "desktop_windows"}
          </span>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold tracking-wider uppercase text-chalk/50 mb-1">
            Step {step + 1} of {steps.length}
          </p>
          <h1 className="font-display font-bold text-xl text-chalk mb-2">
            {steps[step].title}
          </h1>
          <p className="text-[15px] text-chalk/85 leading-relaxed">{steps[step].body}</p>
        </div>

        {isMobile && step === 1 && <AffiliateCard offer={AFFILIATE_OFFERS.vps} />}

        <button
          onClick={() => setShowHelp((s) => !s)}
          className="text-sm text-secondary text-left"
        >
          It&apos;s not showing up
        </button>
        {showHelp && (
          <div className="rounded-lg border border-outline bg-slate px-4 py-3.5 text-sm text-chalk/80 flex flex-col gap-2">
            <p>Three things cause this almost every time:</p>
            <p>1. The file isn&apos;t in the right folder — it must be inside MQL5 → Experts.</p>
            <p>
              2. It hasn&apos;t been compiled — open it in MetaEditor and press Compile (F7). If the
              log shows errors instead of &quot;0 errors&quot;, the bot won&apos;t appear.
            </p>
            <p>3. Algo Trading is off — check the toolbar toggle at the top of the terminal.</p>
          </div>
        )}

        {isLast && (
          <>
            <div className="rounded-lg border border-outline bg-slate px-4 py-3.5">
              <p className="text-sm text-chalk font-medium">
                Run it on demo for at least a week before trading live.
              </p>
            </div>
            {!isMobile && <AffiliateCard offer={AFFILIATE_OFFERS.vps} />}
          </>
        )}
      </main>

      <div className="sticky bottom-0 flex gap-3 px-4 py-4 border-t border-outline bg-ink safe-bottom">
        <Button
          variant="ghost"
          className="flex-1"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={() => (isLast ? router.push("/app") : setStep((s) => s + 1))}
        >
          {isLast ? "Done" : "Next"}
        </Button>
      </div>
    </div>
  );
}
