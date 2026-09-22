import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { LoginClient } from "./LoginClient";

export const metadata = buildMetadata({
  title: "Sign in — StratoBot AI",
  description: "Sign in or create a StratoBot account to save your strategies and pick up where you left off.",
  path: "/login",
});

// useSearchParams() in LoginClient would otherwise make Next statically
// prerender this route behind an empty Suspense fallback (no server-rendered
// content for crawlers that don't execute JS); force-dynamic renders the
// real content on every request instead.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="sr-only">Loading sign in…</p>}>
      <LoginClient />
    </Suspense>
  );
}
