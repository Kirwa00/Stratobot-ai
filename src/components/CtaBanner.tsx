import { TrackedLink } from "@/components/TrackedLink";

export function CtaBanner({
  title = "Give us your trading strategy",
  body = "Describe it in plain language and see exactly what your bot will do. Free, no account needed.",
  ctaText = "Build My EA",
}: {
  title?: string;
  body?: string;
  ctaText?: string;
}) {
  return (
    <div className="rounded-2xl border border-outline bg-slate shadow-soft px-5 py-7 text-center flex flex-col items-center gap-3">
      <p className="font-display text-2xl text-chalk">{title}</p>
      <p className="text-sm text-chalk/70 leading-relaxed max-w-[36ch]">{body}</p>
      <TrackedLink href="/app" event="primary_cta_clicked" props={{ location: "banner" }} className="!rounded-full !px-7 mt-1">
        {ctaText}
      </TrackedLink>
      <p className="text-xs text-chalk/55">Your first EA is free.</p>
    </div>
  );
}
