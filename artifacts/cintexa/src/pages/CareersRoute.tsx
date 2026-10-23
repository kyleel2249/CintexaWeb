import { useParams } from "wouter";
import { getCampaignBySlug } from "@/data/campaigns";
import { CampaignDetail } from "@/pages/CampaignDetail";
import { JobDetail } from "@/pages/JobDetail";

/** /careers/:id — a multi-vacancy campaign page when the slug matches one, otherwise a single vacancy. */
export function CareersRoute() {
  const params = useParams<{ id: string }>();
  const campaign = getCampaignBySlug(params.id ?? "");
  return campaign ? <CampaignDetail campaign={campaign} /> : <JobDetail />;
}

export default CareersRoute;
