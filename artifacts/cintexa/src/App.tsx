import { Route, Switch } from "wouter";
import { Suspense, useEffect, type ComponentType } from "react";
import { lazyRetry } from "@/lib/lazy-retry";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { SiteLayout } from "@/components/layout/SiteLayout";

import { CookieConsent } from "@/components/CookieConsent";
import { TrackingManager } from "@/components/TrackingManager";
import { Home } from "@/pages/Home";
import { captureReferralFromUrl } from "@/lib/referral-capture";
import { SeoManager } from "@/components/SeoManager";
import { CurrencyProvider } from "@/lib/currency/CurrencyProvider";
import { createQueryClient } from "@/lib/query-client";
import { DASHBOARD_PATHS, type DashboardPath } from "@/pages/dashboard/routes";

const MarketingTech = lazyRetry(() => import("@/pages/MarketingTech").then((m) => ({ default: m.MarketingTech })));
const SalesTech = lazyRetry(() => import("@/pages/SalesTech").then((m) => ({ default: m.SalesTech })));
const AdsBoost = lazyRetry(() => import("@/pages/AdsBoost").then((m) => ({ default: m.AdsBoost })));
const Ecommerce = lazyRetry(() => import("@/pages/Ecommerce").then((m) => ({ default: m.Ecommerce })));
const WebsiteDev = lazyRetry(() => import("@/pages/WebsiteDev").then((m) => ({ default: m.WebsiteDev })));
const SoftwareDev = lazyRetry(() => import("@/pages/SoftwareDev").then((m) => ({ default: m.SoftwareDev })));
const Contact = lazyRetry(() => import("@/pages/Contact").then((m) => ({ default: m.Contact })));
const Careers = lazyRetry(() => import("@/pages/Careers").then((m) => ({ default: m.Careers })));
const CareersRoute = lazyRetry(() => import("@/pages/CareersRoute").then((m) => ({ default: m.CareersRoute })));
const Blog = lazyRetry(() => import("@/pages/Blog").then((m) => ({ default: m.Blog })));
const BlogArticle = lazyRetry(() => import("@/pages/Blog").then((m) => ({ default: m.BlogArticle })));
const About = lazyRetry(() => import("@/pages/TrustPages").then((m) => ({ default: m.About })));
const CaseStudies = lazyRetry(() => import("@/pages/CaseStudies").then((m) => ({ default: m.CaseStudies })));
const CaseStudyDetail = lazyRetry(() => import("@/pages/CaseStudyDetail").then((m) => ({ default: m.CaseStudyDetail })));
const PrivacyPolicy = lazyRetry(() => import("@/pages/LegalPages").then((m) => ({ default: m.PrivacyPolicy })));
const Terms = lazyRetry(() => import("@/pages/LegalPages").then((m) => ({ default: m.Terms })));
const CookiePolicy = lazyRetry(() => import("@/pages/LegalPages").then((m) => ({ default: m.CookiePolicy })));
const Disclaimer = lazyRetry(() => import("@/pages/LegalPages").then((m) => ({ default: m.Disclaimer })));
const GetStarted = lazyRetry(() => import("@/pages/GetStarted").then((m) => ({ default: m.GetStarted })));
const NotFound = lazyRetry(() => import("@/pages/NotFound").then((m) => ({ default: m.NotFound })));
const DashboardOverview = lazyRetry(() => import("@/pages/dashboard/Overview").then((m) => ({ default: m.DashboardOverview })));
const DashboardProgress = lazyRetry(() => import("@/pages/dashboard/Progress").then((m) => ({ default: m.DashboardProgress })));
const DashboardLeaderboard = lazyRetry(() => import("@/pages/dashboard/Leaderboard").then((m) => ({ default: m.DashboardLeaderboard })));
const DashboardSettings = lazyRetry(() => import("@/pages/dashboard/Settings").then((m) => ({ default: m.DashboardSettings })));
const DashboardAnalytics = lazyRetry(() => import("@/pages/dashboard/Modules").then((m) => ({ default: m.DashboardAnalytics })));
const DashboardEmail = lazyRetry(() => import("@/pages/dashboard/Modules").then((m) => ({ default: m.DashboardEmail })));
const DashboardFaq = lazyRetry(() => import("@/pages/dashboard/Modules").then((m) => ({ default: m.DashboardFaq })));
const DashboardContributions = lazyRetry(() => import("@/pages/dashboard/Contributions").then((m) => ({ default: m.DashboardContributions })));
const DashboardSocial = lazyRetry(() => import("@/pages/dashboard/Social").then((m) => ({ default: m.DashboardSocial })));
const DashboardCareers = lazyRetry(() => import("@/pages/dashboard/Careers").then((m) => ({ default: m.DashboardCareers })));
const Admin = lazyRetry(() => import("@/pages/admin/Admin").then((m) => ({ default: m.Admin })));

const queryClient = createQueryClient();

/** Every dashboard tab must be listed here (typed against DASHBOARD_TABS, so a missing one fails to compile). */
const DASHBOARD_PAGES: Record<DashboardPath, ComponentType> = {
  "/dashboard": DashboardOverview,
  "/dashboard/analytics": DashboardAnalytics,
  "/dashboard/email": DashboardEmail,
  "/dashboard/faq": DashboardFaq,
  "/dashboard/progress": DashboardProgress,
  "/dashboard/contributions": DashboardContributions,
  "/dashboard/leaderboard": DashboardLeaderboard,
  "/dashboard/social": DashboardSocial,
  "/dashboard/careers": DashboardCareers,
  "/dashboard/settings": DashboardSettings,
};

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
      <CurrencyProvider>
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
              <Route path="/case-studies/:slug" component={CaseStudyDetail} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              <Route path="/terms" component={Terms} />
              <Route path="/cookie-policy" component={CookiePolicy} />
              <Route path="/disclaimer" component={Disclaimer} />
              <Route path="/contact" component={Contact} />
              <Route path="/blog/:slug" component={BlogArticle} />
              <Route path="/blog" component={Blog} />
              <Route path="/careers/:id" component={CareersRoute} />
              <Route path="/careers" component={Careers} />
              <Route path="/get-started" component={GetStarted} />
              <Route path="/sign-in" component={GetStarted} />
              <Route path="/sign-up" component={GetStarted} />
              {DASHBOARD_PATHS.map((path) => (
                <Route key={path} path={path} component={DASHBOARD_PAGES[path]} />
              ))}
              <Route path="/admin" component={Admin} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </SiteLayout>
        <CookieConsent />
        <TrackingManager />
      </MotionProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  );
}
