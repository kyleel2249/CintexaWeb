import { Route, Switch } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteLayout } from "@/components/layout/SiteLayout";

import { CookieConsent } from "@/components/CookieConsent";
import { Home } from "@/pages/Home";
import { captureReferralFromUrl } from "@/lib/referral-capture";
import { SeoManager } from "@/components/SeoManager";

const MarketingTech = lazy(() => import("@/pages/MarketingTech").then((m) => ({ default: m.MarketingTech })));
const SalesTech = lazy(() => import("@/pages/SalesTech").then((m) => ({ default: m.SalesTech })));
const AdsBoost = lazy(() => import("@/pages/AdsBoost").then((m) => ({ default: m.AdsBoost })));
const Ecommerce = lazy(() => import("@/pages/Ecommerce").then((m) => ({ default: m.Ecommerce })));
const WebsiteDev = lazy(() => import("@/pages/WebsiteDev").then((m) => ({ default: m.WebsiteDev })));
const SoftwareDev = lazy(() => import("@/pages/SoftwareDev").then((m) => ({ default: m.SoftwareDev })));
const Contact = lazy(() => import("@/pages/Contact").then((m) => ({ default: m.Contact })));
const Careers = lazy(() => import("@/pages/Careers").then((m) => ({ default: m.Careers })));
const JobDetail = lazy(() => import("@/pages/JobDetail").then((m) => ({ default: m.JobDetail })));
const Blog = lazy(() => import("@/pages/Blog").then((m) => ({ default: m.Blog })));
const BlogArticle = lazy(() => import("@/pages/Blog").then((m) => ({ default: m.BlogArticle })));
const About = lazy(() => import("@/pages/TrustPages").then((m) => ({ default: m.About })));
const CaseStudies = lazy(() => import("@/pages/TrustPages").then((m) => ({ default: m.CaseStudies })));
const PrivacyPolicy = lazy(() => import("@/pages/LegalPages").then((m) => ({ default: m.PrivacyPolicy })));
const Terms = lazy(() => import("@/pages/LegalPages").then((m) => ({ default: m.Terms })));
const CookiePolicy = lazy(() => import("@/pages/LegalPages").then((m) => ({ default: m.CookiePolicy })));
const Disclaimer = lazy(() => import("@/pages/LegalPages").then((m) => ({ default: m.Disclaimer })));
const GetStarted = lazy(() => import("@/pages/GetStarted").then((m) => ({ default: m.GetStarted })));
const NotFound = lazy(() => import("@/pages/NotFound").then((m) => ({ default: m.NotFound })));
const DashboardOverview = lazy(() => import("@/pages/dashboard/Overview").then((m) => ({ default: m.DashboardOverview })));
const DashboardProgress = lazy(() => import("@/pages/dashboard/Progress").then((m) => ({ default: m.DashboardProgress })));
const DashboardLeaderboard = lazy(() => import("@/pages/dashboard/Leaderboard").then((m) => ({ default: m.DashboardLeaderboard })));
const DashboardSettings = lazy(() => import("@/pages/dashboard/Settings").then((m) => ({ default: m.DashboardSettings })));
const DashboardAnalytics = lazy(() => import("@/pages/dashboard/Modules").then((m) => ({ default: m.DashboardAnalytics })));
const DashboardEmail = lazy(() => import("@/pages/dashboard/Modules").then((m) => ({ default: m.DashboardEmail })));
const DashboardFaq = lazy(() => import("@/pages/dashboard/Modules").then((m) => ({ default: m.DashboardFaq })));
const DashboardCareers = lazy(() => import("@/pages/dashboard/Careers").then((m) => ({ default: m.DashboardCareers })));
const Admin = lazy(() => import("@/pages/admin/Admin").then((m) => ({ default: m.Admin })));

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
  useEffect(() => {
    captureReferralFromUrl();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <SeoManager />
        <SiteLayout>
          <Suspense fallback={<RouteFallback />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/solutions/marketing" component={MarketingTech} />
              <Route path="/solutions/sales" component={SalesTech} />
              <Route path="/solutions/ads-boost" component={AdsBoost} />
              <Route path="/solutions/ecommerce" component={Ecommerce} />
              <Route path="/solutions/website-development" component={WebsiteDev} />
              <Route path="/solutions/software-development" component={SoftwareDev} />
              <Route path="/about" component={About} />
              <Route path="/case-studies" component={CaseStudies} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              <Route path="/terms" component={Terms} />
              <Route path="/cookie-policy" component={CookiePolicy} />
              <Route path="/disclaimer" component={Disclaimer} />
              <Route path="/contact" component={Contact} />
              <Route path="/blog/:slug" component={BlogArticle} />
              <Route path="/blog" component={Blog} />
              <Route path="/careers/:id" component={JobDetail} />
              <Route path="/careers" component={Careers} />
              <Route path="/get-started" component={GetStarted} />
              <Route path="/sign-in" component={GetStarted} />
              <Route path="/sign-up" component={GetStarted} />
              <Route path="/dashboard" component={DashboardOverview} />
              <Route path="/dashboard/analytics" component={DashboardAnalytics} />
              <Route path="/dashboard/email" component={DashboardEmail} />
              <Route path="/dashboard/faq" component={DashboardFaq} />
              <Route path="/dashboard/progress" component={DashboardProgress} />
              <Route path="/dashboard/leaderboard" component={DashboardLeaderboard} />
              <Route path="/dashboard/careers" component={DashboardCareers} />
              <Route path="/dashboard/settings" component={DashboardSettings} />
              <Route path="/admin" component={Admin} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </SiteLayout>
        <CookieConsent />
      </MotionProvider>
    </QueryClientProvider>
  );
}
