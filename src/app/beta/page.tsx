import { buildMetadata } from "@/lib/seo";
import { BetaClient } from "./BetaClient";

export const metadata = buildMetadata({
  title: "Join the beta — StratoBot AI",
  description:
    "Get a free 30-day Pro pass by joining the StratoBot private beta and telling us what's wrong with it.",
  path: "/beta",
});

export default function BetaPage() {
  return <BetaClient />;
}
