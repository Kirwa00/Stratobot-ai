"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Button } from "@/components/Button";
import { useStrategyStore } from "@/lib/store";
import { composeStrategyFile, downloadFile } from "@/lib/composer";

export default function DownloadPage() {
  const router = useRouter();
  const { hydrated, strategy, paid, disclaimerAccepted, acceptDisclaimer } = useStrategyStore();
  const [checked, setChecked] = useState(disclaimerAccepted);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!strategy || !paid) router.replace("/");
  }, [hydrated, strategy, paid, router]);

  if (!strategy) return null;

  function handleDownload() {
    if (!strategy) return;
    acceptDisclaimer();
    const contents = composeStrategyFile(strategy);
    const filename = `${strategy.name.toLowerCase().replace(/\s+/g, "-")}.mq5`;
    downloadFile(filename, contents);
    setDownloaded(true);
  }

  if (downloaded) {
    return (
      <div className="flex flex-col flex-1">
        <Header back />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
          <span className="material-symbols-outlined text-signal text-4xl">check_circle</span>
          <h1 className="font-display font-bold text-xl text-chalk">Your bot is downloaded</h1>
          <p className="text-sm text-chalk/70 leading-relaxed">
            It&apos;s a normal .mq5 file, saved straight to your device — yours to keep, and yours
            to forward to a teammate or subscriber if you want (they&apos;ll need MetaTrader 5
            too). Lost it? Just describe the same strategy again — rebuilding is unlimited on Pro.
          </p>
          <Button className="mt-4 w-full" onClick={() => router.push("/install")}>
            How do I install this?
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Header back title="Before you download" />
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-32 flex flex-col gap-5">
        <p className="text-[15px] text-chalk leading-relaxed">
          This bot will place real trades with real money.
        </p>

        <ul className="flex flex-col gap-2.5 text-sm text-chalk/85">
          {[
            "It does what your rules say — not necessarily what makes money.",
            "The simulation used 100 candles. That is not proof.",
            "Run it on a demo account first.",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="text-chalk/40">•</span>
              {line}
            </li>
          ))}
        </ul>

        <p className="text-sm text-chalk/60">This is not financial advice.</p>

        <label className="flex items-center gap-2.5 mt-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-5 h-5 rounded-sm border border-outline accent-[var(--signal)]"
          />
          <span className="text-sm text-chalk">I understand</span>
        </label>
      </main>

      <div className="sticky bottom-0 px-4 py-4 border-t border-outline bg-ink safe-bottom">
        <Button className="w-full" disabled={!checked} onClick={handleDownload}>
          Download my bot
        </Button>
      </div>
    </div>
  );
}
