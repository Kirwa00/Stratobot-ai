import { buildMetadata } from "@/lib/seo";
import { FeedbackClient } from "./FeedbackClient";

export const metadata = buildMetadata({
  title: "Feedback — StratoBot AI",
  description: "Tell the StratoBot team what's broken, confusing, or missing — it goes straight to the builder.",
  path: "/feedback",
});

export default function FeedbackPage() {
  return <FeedbackClient />;
}
