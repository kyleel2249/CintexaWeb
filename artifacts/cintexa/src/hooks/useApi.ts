import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  ActivityEvent,
  Contribution,
  CustomerProfile,
  LoyaltyLedgerEntry,
  Subscription,
  SubscriptionPlan,
} from "@cintexa/db/schema";

/** Wraps a Clerk-authenticated GET as a TanStack Query hook. */
function useAuthedQuery<T>(key: string[], path: string) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery({
    queryKey: key,
    enabled: isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      return apiFetch<T>(path, { token });
    },
  });
}

export function useMyProfile() {
  return useAuthedQuery<{ profile: CustomerProfile | null }>(["customer", "me"], "/customer/me");
}

export function useUpdateProfile() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      body: Partial<
        Pick<CustomerProfile, "displayName" | "businessName" | "country" | "leaderboardVisible" | "role" | "interests" | "usageFrequency">
      >,
    ) => {
      const token = await getToken();
      return apiFetch<{ profile: CustomerProfile }>("/customer/me", { method: "PATCH", body, token });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customer", "me"] }),
  });
}

export function useMySubscription() {
  return useAuthedQuery<{ subscription: Subscription | null }>(["subscriptions", "me"], "/subscriptions/me");
}

export function useSetSubscription() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const token = await getToken();
      return apiFetch<{ subscription: Subscription }>("/subscriptions/me", { method: "POST", body: { plan }, token });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subscriptions", "me"] }),
  });
}

export function useMyLoyalty() {
  return useAuthedQuery<{ balance: number; entries: LoyaltyLedgerEntry[] }>(["loyalty", "me"], "/loyalty/me");
}

export function useMyContributions() {
  return useAuthedQuery<{ contributions: Contribution[] }>(["contributions"], "/contributions");
}

export function useMyActivity() {
  return useAuthedQuery<{ activity: ActivityEvent[] }>(["activity"], "/activity");
}

/** Public — no auth needed. */
export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => apiFetch<{ leaderboard: { rank: number; name: string; score: number }[] }>("/leaderboard"),
  });
}
