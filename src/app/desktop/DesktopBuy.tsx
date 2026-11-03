"use client";

import { useEffect, useState } from "react";
import { MpesaCheckout } from "@/components/MpesaCheckout";
import { DESKTOP_DOWNLOAD_URL } from "@/lib/constants";
import { trackEvent } from "@/lib/analytics";

const KEY_STORAGE = "stratobot_desktop_key_v1";

export function DesktopBuy() {
  const [key, setKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKey(window.localStorage.getItem(KEY_STORAGE));
    } catch {
      // storage blocked: the key is still shown once after paying
    }
  }, []);

  function paid(licenseKey?: string) {
    if (!licenseKey) return;
    setKey(licenseKey);
    try {
      window.localStorage.setItem(KEY_STORAGE, licenseKey);
    } catch {}
  }

  return (
    <div className="flex flex-col gap-3">
      {key ? (
        <div className="rounded-lg border border-buy/40 bg-slate px-4 py-4 flex flex-col gap-2" aria-live="polite">
          <p className="text-sm font-semibold text-chalk">Your licence key</p>
          <p className="font-mono text-base text-chalk select-all break-all">{key}</p>
          <button
            type="button"
            className="self-start text-xs text-secondary hover:underline"
            onClick={() => {
              void navigator.clipboard?.writeText(key).then(() => setCopied(true));
            }}
          >
            {copied ? "Copied" : "Copy key"}
          </button>
          <p className="text-xs text-chalk/60 leading-relaxed">
            Keep it somewhere safe. Install the app, then paste this key when it asks.
          </p>
        </div>
      ) : (
        <MpesaCheckout kinds={["desktop"]} onPaid={(_kind, licenseKey) => paid(licenseKey)} />
      )}
      <a
        href={DESKTOP_DOWNLOAD_URL}
        onClick={() => trackEvent("desktop_download_clicked", {})}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline px-4 py-2.5 text-sm font-semibold text-chalk hover:border-secondary"
      >
        <span className="material-symbols-outlined text-base">download</span>
        Download for Windows
      </a>
    </div>
  );
}
