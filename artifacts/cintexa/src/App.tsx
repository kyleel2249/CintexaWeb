import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { Home } from "@/pages/Home";
import { MarketingTech } from "@/pages/MarketingTech";
import { SalesTech } from "@/pages/SalesTech";
import { AdsBoost } from "@/pages/AdsBoost";
import { Ecommerce } from "@/pages/Ecommerce";
import { Platform } from "@/pages/Platform";
import { Pricing } from "@/pages/Pricing";
import { NotFound } from "@/pages/NotFound";
import { DashboardOverview } from "@/pages/dashboard/Overview";
import { DashboardContributions } from "@/pages/dashboard/Contributions";
import { DashboardProgress } from "@/pages/dashboard/Progress";
import { DashboardLeaderboard } from "@/pages/dashboard/Leaderboard";
import { DashboardSettings } from "@/pages/dashboard/Settings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <SiteLayout>
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
        </SiteLayout>
      </MotionProvider>
    </QueryClientProvider>
  );
}
