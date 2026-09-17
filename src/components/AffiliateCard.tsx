import type { AffiliateOffer } from "@/lib/affiliates";

export function AffiliateCard({ offer }: { offer: AffiliateOffer }) {
  return (
    <div className="rounded-lg border border-outline bg-slate px-4 py-3.5 flex flex-col gap-2.5">
      <div className="flex items-start gap-2.5">
        <span className="material-symbols-outlined text-secondary text-xl mt-0.5">
          {offer.icon}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-chalk">{offer.label}</p>
          <p className="text-xs text-chalk/70 leading-relaxed mt-1">{offer.body}</p>
        </div>
      </div>
      <a
        href={offer.href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        className="text-sm font-semibold text-secondary hover:underline"
      >
        {offer.ctaText} →
      </a>
      <p className="text-[10px] text-chalk/40 leading-relaxed">
        Affiliate link — we may earn a commission at no extra cost to you.
      </p>
    </div>
  );
}
