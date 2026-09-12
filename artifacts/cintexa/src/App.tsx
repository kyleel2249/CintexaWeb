import { Route, Switch } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CookieBanner } from "@/components/CookieBanner";
import { ScrollProgress } from "@/components/ScrollProgress";
import { MotionProvider } from "@/components/motion/MotionProvider";

const Home = lazy(() => import("@/pages/Home").then((m) => ({ default: m.Home })));
const Solutions = lazy(() => import("@/pages/Solutions").then((m) => ({ default: m.Solutions })));
const MarketingTech = lazy(() => import("@/pages/MarketingTech").then((m) => ({ default: m.MarketingTech })));
const SalesTech = lazy(() => import("@/pages/SalesTech").then((m) => ({ default: m.SalesTech })));
const AdsBoost = lazy(() => import("@/pages/AdsBoost").then((m) => ({ default: m.AdsBoost })));
const Ecommerce = lazy(() => import("@/pages/Ecommerce").then((m) => ({ default: m.Ecommerce })));
const Platform = lazy(() => import("@/pages/Platform").then((m) => ({ default: m.Platform })));
const Pricing = lazy(() => import("@/pages/Pricing").then((m) => ({ default: m.Pricing })));
const GetStarted = lazy(() => import("@/pages/GetStarted").then((m) => ({ default: m.GetStarted })));
const NotFound = lazy(() => import("@/pages/NotFound").then((m) => ({ default: m.NotFound })));
const DashboardOverview = lazy(() => import("@/pages/dashboard/Overview").then((m) => ({ default: m.DashboardOverview })));
const DashboardProgress = lazy(() => import("@/pages/dashboard/Progress").then((m) => ({ default: m.DashboardProgress })));
const DashboardLeaderboard = lazy(() => import("@/pages/dashboard/Leaderboard").then((m) => ({ default: m.DashboardLeaderboard })));
const DashboardSettings = lazy(() => import("@/pages/dashboard/Settings").then((m) => ({ default: m.DashboardSettings })));
const DashboardAnalytics = lazy(() => import("@/pages/dashboard/Modules").then((m) => ({ default: m.DashboardAnalytics })));
const DashboardEmail = lazy(() => import("@/pages/dashboard/Modules").then((m) => ({ default: m.DashboardEmail })));
const DashboardFaq = lazy(() => import("@/pages/dashboard/Modules").then((m) => ({ default: m.DashboardFaq })));
const Admin = lazy(() => import("@/pages/admin/Admin").then((m) => ({ default: m.Admin })));

function PageFallback() {
  return (
    <div className="cx-section">
      <div className="cx-container">
        <p className="text-sm text-[hsl(var(--fg-muted))]">Loading…</p>
      </div>
    </div>
  );
}

export function App() {
  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  return (
    <MotionProvider>
      <ScrollProgress />
      <SiteHeader />
      <main>
        <Suspense fallback={<PageFallback />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/solutions" component={Solutions} />
            <Route path="/marketing" component={MarketingTech} />
            <Route path="/sales" component={SalesTech} />
            <Route path="/ads-boost" component={AdsBoost} />
            <Route path="/ecommerce" component={Ecommerce} />
            <Route path="/platform" component={Platform} />
            <Route path="/pricing" component={Pricing} />
            <Route path="/get-started" component={GetStarted} />
            <Route path="/dashboard" component={DashboardOverview} />
            <Route path="/dashboard/analytics" component={DashboardAnalytics} />
            <Route path="/dashboard/email" component={DashboardEmail} />
            <Route path="/dashboard/faq" component={DashboardFaq} />
            <Route path="/dashboard/progress" component={DashboardProgress} />
            <Route path="/dashboard/leaderboard" component={DashboardLeaderboard} />
            <Route path="/dashboard/settings" component={DashboardSettings} />
            <Route path="/admin" component={Admin} />
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>
      <SiteFooter />
      <CookieBanner />
    </MotionProvider>
  );
}
