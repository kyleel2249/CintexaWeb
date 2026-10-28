import { Link } from "wouter";
import { Storefront3D } from "@/components/scene/Storefront3D";
import { SolutionPageShell } from "./SolutionPageShell";

export function Ecommerce() {
  return (
    <SolutionPageShell
      eyebrow="Solutions · E-commerce"
      title="Ecommerce Platform & Digital Store Technology"
      intro="A full commerce toolkit with a 3D storefront preview — sample products only, wired to your real catalog on launch."
    >
      <Storefront3D className="max-w-lg" />
      <p className="mt-8 max-w-xl text-sm text-[hsl(var(--fg-muted))]">
        An online store is a website first. See our{" "}
        <Link href="/solutions/website-development" className="text-[hsl(var(--accent))] underline">
          web design &amp; development services
        </Link>{" "}
        for business sites, landing pages and custom web applications.
      </p>
    </SolutionPageShell>
  );
}
