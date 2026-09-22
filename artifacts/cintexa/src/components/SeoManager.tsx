import { useLocation } from "wouter";
import { usePageSeo } from "@/hooks/usePageSeo";

/** Global SEO manager — applies master-map meta on every route change. */
export function SeoManager() {
  const [location] = useLocation();
  usePageSeo(location);
  return null;
}
