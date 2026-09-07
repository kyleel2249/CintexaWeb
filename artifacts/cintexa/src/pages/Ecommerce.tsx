import { Storefront3D } from "@/components/scene/Storefront3D";
import { SolutionPageShell } from "./SolutionPageShell";

export function Ecommerce() {
  return (
    <SolutionPageShell
      eyebrow="Solutions · E-commerce"
      title="Catalog, checkout, and a storefront that shows itself off."
      intro="A full commerce toolkit with a 3D storefront demo — sample products only, wired to your real catalog on launch."
    >
      <Storefront3D className="max-w-lg" />
    </SolutionPageShell>
  );
}
