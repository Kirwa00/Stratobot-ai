import { buildMetadata } from "@/lib/seo";
import { AppClient } from "./AppClient";

export const metadata = buildMetadata({
  title: "Describe your strategy — StratoBot AI",
  description:
    "Type your trading strategy in plain language and StratoBot reads it back as editable blocks, ready for a free logic check.",
  path: "/app",
});

export default function AppPage() {
  return <AppClient />;
}
