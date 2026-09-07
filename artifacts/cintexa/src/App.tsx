import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Home } from "@/pages/Home";

const MarketingTech = lazy(() => import("@/pages/MarketingTech").then((m) => ({ default: m.MarketingTech })));
const SalesTech = lazy(() => import("@/pages/SalesTech").then((m) => ({ default: m.SalesTech })));
const AdsBoost = lazy(() => import("@/pages/AdsBoost").then((m) => ({ default: m.AdsBoost })));
const Ecommerce = lazy(() => import("@/pages/Ecommerce").then((m) => ({ default: m.Ecommerce })));
const Platform = lazy(() => import("@/pages/Platform").then((m) => ({ default: m.Platform })));
const Pricing = lazy(() => import("@/pages/Pricing").then((m) => ({ default: m.Pricing })));
const NotFound = lazy(() => import("@/pages/NotFound").then((m) => ({ default: m.NotFound })));
const DashboardOverview = lazy(() => import("@/pages/dashboard/Overview").then((m) => ({ default: m.DashboardOverview })));
const DashboardContributions = lazy(() => import("@/pages/dashboard/Contributions").then((m) => ({ default: m.DashboardContributions })));
const DashboardProgress = lazy(() => import("@/pages/dashboard/Progress").then((m) => ({ default: m.DashboardProgress })));
const DashboardLeaderboard = lazy(() => import("@/pages/dashboard/Leaderboard").then((m) => ({ default: m.DashboardLeaderboard })));
const DashboardSettings = lazy(() => import("@/pages/dashboard/Settings").then((m) => ({ default: m.DashboardSettings })));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="cx-section">
      <div className="cx-container">
        <div className="h-40 w-full animate-pulse rounded-2xl bg-[hsl(var(--bg-raised))]" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <SiteLayout>
          <Suspense fallback={<RouteFallback />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/solutions/marketing" component={MarketingTech} />
              <Route path="/solutions/sales" component={SalesTech} />
              <Route path="/solutions/ads-boost" component={AdsBoost} />
              <Route path="/solutions/ecommerce" component={Ecommerce} />
              <Route path="/platform" component={Platform} />
              <Route path="/pricing" component={Pricing} />
              <Route path="/dashboard" component={DashboardOverview} />
              <Route path="/dashboard/contributions" component={DashboardContributions} />
              <Route path="/dashboard/progress" component={DashboardProgress} />
              <Route path="/dashboard/leaderboard" component={DashboardLeaderboard} />
              <Route path="/dashboard/settings" component={DashboardSettings} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </SiteLayout>
      </MotionProvider>
    </QueryClientProvider>
  );
}
