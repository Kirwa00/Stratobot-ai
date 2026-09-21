import Link from "next/link";
import { Button } from "@/components/Button";

export function CtaBanner({
  title = "Give us your trading strategy",
  body = "Describe it in plain language and see if the logic check reads your rules correctly — free, no account needed.",
  ctaText = "Describe your strategy",
}: {
  title?: string;
  body?: string;
  ctaText?: string;
}) {
  return (
    <div className="rounded-lg border border-signal/40 bg-slate px-4 py-5 text-center flex flex-col items-center gap-3">
      <p className="font-display font-bold text-lg text-chalk">{title}</p>
      <p className="text-sm text-chalk/70 leading-relaxed max-w-[32ch]">{body}</p>
      <Link href="/" className="w-full">
        <Button className="w-full">{ctaText}</Button>
      </Link>
      <p className="text-xs text-chalk/50">
        Want 30 days free?{" "}
        <Link href="/beta" className="text-secondary hover:underline">
          Join the beta
        </Link>
      </p>
    </div>
  );
}
