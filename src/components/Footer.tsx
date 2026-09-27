import Link from "next/link";

const GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Product",
    links: [
      { href: "/convert-strategy-to-ea", label: "Convert strategy to EA" },
      { href: "/pricing", label: "Pricing" },
      { href: "/features", label: "Features" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/faq", label: "FAQ" },
      { href: "/demo", label: "Demo" },
    ],
  },
  {
    title: "Compare",
    links: [
      { href: "/compare/ea-programmer-alternative", label: "vs. hiring a programmer" },
      { href: "/compare/mql5-programmer", label: "vs. MQL5 programmer" },
      { href: "/compare/ea-generator", label: "vs. other EA generators" },
    ],
  },
  {
    title: "Tools",
    links: [
      { href: "/tools", label: "All calculators" },
      { href: "/vps", label: "VPS comparison" },
      { href: "/prop-firms", label: "Prop firms" },
    ],
  },
  {
    title: "More",
    links: [
      { href: "/learn", label: "Learn" },
      { href: "/blog", label: "Blog" },
      { href: "/resources", label: "Resources" },
      { href: "/feedback", label: "Feedback" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-outline pt-6 mt-2">
      <div className="grid grid-cols-2 gap-6">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="font-mono text-[10px] font-bold tracking-wider uppercase text-chalk/40 mb-2">
              {g.title}
            </p>
            <ul className="flex flex-col gap-1.5">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-xs text-chalk/70 hover:text-secondary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-chalk/40 mt-6">
        StratoBot AI · Built for Kenyan traders
      </p>
    </footer>
  );
}
