import { AnimatedAdsFunnel } from "@/components/visualizations/AnimatedAdsFunnel";
import { SolutionPageShell } from "./SolutionPageShell";

export function AdsBoost() {
  return (
    <SolutionPageShell
      eyebrow="Solutions · Ads Boost"
      title="Programmatic campaigns with a live lifecycle view."
      intro="Watch a campaign move from impression to revenue, and plan the next one with the same funnel in view."
    >
      <AnimatedAdsFunnel className="max-w-2xl" />
    </SolutionPageShell>
  );
}
