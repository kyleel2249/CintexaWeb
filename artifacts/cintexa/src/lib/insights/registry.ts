import type { InsightSpecialistConfig } from "./types";

/**
 * Central registry of Insight specialists.
 * Customer-facing names always use the "[Tab] Insight" convention.
 */
export const INSIGHT_SPECIALISTS: InsightSpecialistConfig[] = [
  {
    id: "overview",
    displayName: "Overview Insight",
    tab: "overview",
    description: "High-level interpretation of overall account activity when you request account analysis.",
    capabilities: ["account_summary", "cross_tab_signals", "priority_attention"],
    requiredDataSources: ["activity_events", "contributions", "loyalty", "profile"],
    allowedScopes: ["own_account"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "social",
    displayName: "Social Insight",
    tab: "social",
    description: "Understand your social activity, audience engagement, and content opportunities.",
    capabilities: [
      "summarize_activity",
      "publishing_gaps",
      "content_opportunities",
      "connection_health",
    ],
    requiredDataSources: ["social_connections", "social_posts"],
    allowedScopes: ["own_social"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "templates",
    displayName: "Template Insight",
    tab: "templates",
    description: "Track template usage, identify gaps, and recommend suitable kits.",
    capabilities: ["usage_summary", "recommend_templates", "library_gaps"],
    requiredDataSources: ["template_usage"],
    allowedScopes: ["own_templates"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "affiliate",
    displayName: "Affiliate Insight",
    tab: "affiliate",
    description: "Analyze referrals, commissions, and affiliate program performance.",
    capabilities: ["referral_summary", "commission_status", "link_health"],
    requiredDataSources: ["affiliate_links", "commissions"],
    allowedScopes: ["own_affiliate"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "analytics",
    displayName: "Analytics Insight",
    tab: "analytics",
    description: "Interpret authorized business metrics, trends, and opportunities.",
    capabilities: ["metric_summary", "trend_detection", "period_compare"],
    requiredDataSources: ["activity_events", "contributions"],
    allowedScopes: ["own_analytics"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "pixels",
    displayName: "Pixels Insight",
    tab: "pixels",
    description: "Monitor tracking configuration, event health, and attribution readiness.",
    capabilities: ["config_status", "missing_pixels", "consent_check"],
    requiredDataSources: ["pixel_config"],
    allowedScopes: ["own_pixels"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "email",
    displayName: "Email Insight",
    tab: "email",
    description: "Review email activity, support patterns, and communication readiness.",
    capabilities: ["support_summary", "campaign_readiness"],
    requiredDataSources: ["email_campaigns"],
    allowedScopes: ["own_email"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "payback",
    displayName: "Payback Insight",
    tab: "payback",
    description: "Analyze verified payback records and payout readiness based on platform rules.",
    capabilities: ["status_summary", "fee_rules", "method_health"],
    requiredDataSources: ["payback_records"],
    allowedScopes: ["own_payback"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "faq",
    displayName: "FAQ Insight",
    tab: "faq",
    description: "Surface relevant help topics and identify knowledge gaps.",
    capabilities: ["recommend_articles", "gap_detection"],
    requiredDataSources: ["faq_content", "user_interests"],
    allowedScopes: ["own_faq"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "contributions",
    displayName: "Contribution Insight",
    tab: "contributions",
    description: "Analyze verified contribution records, trends, and milestones.",
    capabilities: ["verified_totals", "period_compare", "milestone_progress"],
    requiredDataSources: ["contributions"],
    allowedScopes: ["own_contributions"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "progress",
    displayName: "Progress Insight",
    tab: "progress",
    description: "Track goals, milestones, completion, and recommended next steps.",
    capabilities: ["milestone_status", "streak_status", "next_actions"],
    requiredDataSources: ["activity_events", "subscriptions", "loyalty", "streak"],
    allowedScopes: ["own_progress"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "leaderboard",
    displayName: "Leaderboard Insight",
    tab: "leaderboard",
    description: "Explain rankings, participation, and legitimate ways to improve.",
    capabilities: ["rank_explain", "participation", "rules"],
    requiredDataSources: ["leaderboard_public"],
    allowedScopes: ["public_leaderboard", "own_visibility"],
    version: "1.0.0",
    enabled: true,
  },
  {
    id: "settings",
    displayName: "Settings Insight",
    tab: "settings",
    description: "Review account configuration, security posture, and integration health.",
    capabilities: ["profile_completeness", "security_checklist", "integration_status"],
    requiredDataSources: ["profile", "integrations"],
    allowedScopes: ["own_settings"],
    version: "1.0.0",
    enabled: true,
  },
];

export function getSpecialistByTab(tab: string): InsightSpecialistConfig | undefined {
  return INSIGHT_SPECIALISTS.find((s) => s.tab === tab && s.enabled);
}

export function getSpecialistById(id: string): InsightSpecialistConfig | undefined {
  return INSIGHT_SPECIALISTS.find((s) => s.id === id && s.enabled);
}

export function listEnabledSpecialists(): InsightSpecialistConfig[] {
  return INSIGHT_SPECIALISTS.filter((s) => s.enabled);
}
