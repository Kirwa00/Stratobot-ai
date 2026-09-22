# Backlink Tracker

Tracks link-building placements pointing at StratoBot's two priority "money pages" (see
[Task 5 staging rationale](#staging-rationale) below). Update this file each time a placement goes
live, and check Search Console → Links weekly to confirm it was actually picked up.

Target pages:
- `/convert-strategy-to-ea` (commercial intent)
- `/tools/position-size-calculator` (high-volume, low-competition)

## Placements

| Date | Platform | URL | Target page | Status | Notes |
|------|----------|-----|--------------|--------|-------|
| | | | | | |

Status values: `drafted` → `posted` → `live` → `indexed`.

## Staging rationale

Per the keyword report and site audit: this domain has zero backlinks and zero organic authority.
Spreading effort across the full page cluster (calculators, SEO landing pages, learn/blog) too
early risks nothing ranking. Concentrate outreach on the two pages above until they show real
Search Console impressions, then expand.

## Outreach drafts

Substantive answers to post under your own accounts — StratoBot did not post these anywhere. Each
links once to the relevant page; edit before posting so it doesn't read as templated.

### "How do I turn a trading strategy into an EA?" (Quora / forex forums / Stack Exchange)

> Turning a strategy into an EA (Expert Advisor) for MetaTrader means translating your entry,
> exit, and risk rules into MQL4/MQL5 code that runs unattended. There are three realistic paths:
>
> 1. **Learn MQL5 yourself** — free, but a real time investment if you're not already a
>    programmer. MQL5's own docs are solid for this.
> 2. **Hire an MQL5 programmer** — freelance rates run roughly $20–75+/hr depending on experience
>    and strategy complexity; expect a back-and-forth over the spec before it's right.
> 3. **Use a strategy-to-EA tool** that maps your described rules to pre-tested code blocks — no
>    programming, but you're limited to whatever rule types the tool supports. (I use
>    [StratoBot](https://www.stratobot.trade/convert-strategy-to-ea) for this — worth noting since
>    I'm not affiliated with it either way, just sharing what worked for me.)
>
> Whichever path you pick, run the resulting EA in MetaTrader's Strategy Tester against real
> historical data before going live — a tool confirming your logic "fires correctly" isn't the
> same as a backtest confirming it's profitable.

### "Best way to calculate forex position size?" (r/Forex, trading Discords)

> The formula is: `position size = (account size × risk %) / (stop-loss in pips × pip value)`.
> Worth automating this rather than doing it by hand every trade — a calculator removes the
> arithmetic mistakes that happen when you're moving fast. [This one's
> free](https://www.stratobot.trade/tools/position-size-calculator) if you want a quick reference,
> or build your own spreadsheet with the formula above.

## Beta tester testimonials

Ask each active beta tester (via the existing `/feedback` or beta email thread) for a short,
specific testimonial once they've completed the full flow — what strategy they described, what
surprised them, whether the EA compiled cleanly. Post genuine ones (with permission) on a
`/learn` or `/blog` page, or point testers to leave one somewhere linkable (their own blog, a
trading Discord's testimonials channel) with a link back.
