import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import {
  clearLocalProfile,
  exportLocalData,
  readLocalProfile,
  writeLocalProfile,
  type LocalProfile,
} from "@/lib/local-profile";
import type {
  ActivityEvent,
  Contribution,
  CustomerProfile,
  LoyaltyLedgerEntry,
  Subscription,
  SubscriptionPlan,
  PaymentMethod,
  SupportTicket,
} from "@cintexa/db/schema";

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

function mergeProfile(api: CustomerProfile | null | undefined, local: LocalProfile | null) {
  if (!api && !local) return null;
  return {
    ...(api ?? {
      userId: local?.userId ?? "local",
      displayName: null,
      businessName: null,
      country: null,
      leaderboardVisible: false,
      role: null,
      interests: [],
      usageFrequency: null,
      onboardingCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    ...local,
    onboardingCompleted: Boolean(api?.onboardingCompleted || local?.onboardingCompleted),
    interests: (local?.interests ?? api?.interests ?? []) as string[],
  } as CustomerProfile & LocalProfile;
}

export function useMyProfile() {
  const { getToken, isSignedIn, userId } = useAuth();
  return useQuery({
    queryKey: ["customer", "me"],
    enabled: isSignedIn,
    queryFn: async () => {
      const local = readLocalProfile();
      try {
        const token = await getToken();
        const data = await apiFetch<{ profile: CustomerProfile | null }>("/customer/me", { token });
        return { profile: mergeProfile(data.profile, local), source: "api" as const };
      } catch {
        // API down / not deployed — still allow dashboard from local onboarding
        const profile = mergeProfile(null, local ? { ...local, userId: userId ?? local.userId } : null);
        return { profile, source: "local" as const };
      }
    },
  });
}

type ProfilePatch = Partial<
  Pick<
    CustomerProfile,
    | "displayName"
    | "businessName"
    | "country"
    | "leaderboardVisible"
    | "role"
    | "interests"
    | "usageFrequency"
    | "referredByUserId"
  >
> & {
  username?: string;
  avatarId?: string;
  twoFactorEnabled?: boolean;
  onboardingCompleted?: boolean;
};

export function useUpdateProfile() {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ProfilePatch) => {
      const localPatch: LocalProfile = {
        userId: userId ?? undefined,
        ...body,
        onboardingCompleted: body.role ? true : body.onboardingCompleted,
      };
      // Always persist locally first so onboarding never blocks on a missing API
      const local = writeLocalProfile(localPatch);

      try {
        const token = await getToken();
        const data = await apiFetch<{ profile: CustomerProfile }>("/customer/me", {
          method: "PATCH",
          body,
          token,
        });
        return { profile: mergeProfile(data.profile, local)!, source: "api" as const };
      } catch {
        // Treat local save as success so the user can enter the dashboard
        return {
          profile: mergeProfile(null, local)!,
          source: "local" as const,
        };
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["customer", "me"], data);
      queryClient.invalidateQueries({ queryKey: ["customer", "me"] });
    },
  });
}

export function useExportMyData() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async () => {
      try {
        const token = await getToken();
        const remote = await apiFetch<{ profile: CustomerProfile | null }>("/customer/me", { token });
        return JSON.stringify(
          { exportedAt: new Date().toISOString(), profile: remote.profile, local: readLocalProfile() },
          null,
          2,
        );
      } catch {
        return exportLocalData();
      }
    },
  });
}

export function useDeleteMyData() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      clearLocalProfile();
      try {
        const token = await getToken();
        await apiFetch("/customer/me", { method: "DELETE", token });
      } catch {
        // local clear already done
      }
      return true;
    },
    onSuccess: () => {
      queryClient.setQueryData(["customer", "me"], { profile: null });
      queryClient.invalidateQueries({ queryKey: ["customer"] });
    },
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

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export function useMyContributions() {
  return useAuthedQuery<{ contributions: Contribution[]; pagination: PaginationMeta }>(["contributions"], "/contributions");
}

export function useMyActivity() {
  return useAuthedQuery<{ activity: ActivityEvent[]; pagination: PaginationMeta }>(["activity"], "/activity");
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () =>
      apiFetch<{ mostReferrer: LeaderboardEntry[]; mostCreator: LeaderboardEntry[]; mostUser: LeaderboardEntry[] }>(
        "/leaderboard",
      ),
  });
}

export function useMyTickets() {
  return useAuthedQuery<{ tickets: SupportTicket[] }>(["support", "tickets"], "/support/tickets");
}

export function useCreateTicket() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { subject: string; message: string }) => {
      const token = await getToken();
      return apiFetch<{ ticket: SupportTicket }>("/support/tickets", { method: "POST", body, token });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["support", "tickets"] }),
  });
}

export function useMyPaymentMethods() {
  return useAuthedQuery<{ paymentMethods: PaymentMethod[] }>(["payment-methods"], "/payment-methods");
}

export function useAddPaymentMethod() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      type: PaymentMethod["type"];
      label: string;
      provider?: string;
      last4?: string;
      isDefault?: boolean;
    }) => {
      const token = await getToken();
      return apiFetch<{ paymentMethod: PaymentMethod }>("/payment-methods", { method: "POST", body, token });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}

export function useDeletePaymentMethod() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ deleted: boolean }>(`/payment-methods/${id}`, { method: "DELETE", token });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-methods"] }),
  });
}
