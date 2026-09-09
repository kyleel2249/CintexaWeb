/** Social connections, posts, follows — local hub until OAuth backends are wired. */

import { ADMIN_USERNAME } from "./platform-economics";

export const SOCIAL_NETWORKS = [
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "instagram", label: "Instagram", color: "#E4405F" },
  { id: "x", label: "X (Twitter)", color: "#000000" },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2" },
  { id: "tiktok", label: "TikTok", color: "#010101" },
  { id: "youtube", label: "YouTube", color: "#FF0000" },
] as const;

export type NetworkId = (typeof SOCIAL_NETWORKS)[number]["id"];

export type SocialConnection = {
  network: NetworkId;
  handle: string;
  connectedAt: string;
};

export type ContentPost = {
  id: string;
  body: string;
  createdAt: string;
  scheduledFor?: string;
  boost?: boolean;
  shareUrl: string;
};

export type FollowEdge = { username: string; since: string };

const CONN_KEY = "cintexa.social.connections";
const POSTS_KEY = "cintexa.social.posts";
const FOLLOW_KEY = "cintexa.social.following";
const REF_KEY = "cintexa.referrer";

export function ensureAdminReferrer() {
  if (!localStorage.getItem(REF_KEY)) {
    localStorage.setItem(REF_KEY, ADMIN_USERNAME);
  }
  return localStorage.getItem(REF_KEY) ?? ADMIN_USERNAME;
}

export function readConnections(): SocialConnection[] {
  try {
    return JSON.parse(localStorage.getItem(CONN_KEY) ?? "[]") as SocialConnection[];
  } catch {
    return [];
  }
}

export function connectNetwork(network: NetworkId, handle: string) {
  const list = readConnections().filter((c) => c.network !== network);
  list.push({ network, handle, connectedAt: new Date().toISOString() });
  localStorage.setItem(CONN_KEY, JSON.stringify(list));
  return list;
}

export function disconnectNetwork(network: NetworkId) {
  const list = readConnections().filter((c) => c.network !== network);
  localStorage.setItem(CONN_KEY, JSON.stringify(list));
  return list;
}

export function readPosts(): ContentPost[] {
  try {
    return JSON.parse(localStorage.getItem(POSTS_KEY) ?? "[]") as ContentPost[];
  } catch {
    return [];
  }
}

export function createPost(input: { body: string; scheduledFor?: string; boost?: boolean }): ContentPost {
  const id = `post_${Date.now()}`;
  const shareUrl = `${window.location.origin}/share/${id}`;
  const post: ContentPost = {
    id,
    body: input.body,
    createdAt: new Date().toISOString(),
    scheduledFor: input.scheduledFor,
    boost: input.boost,
    shareUrl,
  };
  const list = [post, ...readPosts()].slice(0, 50);
  localStorage.setItem(POSTS_KEY, JSON.stringify(list));
  return post;
}

export function shareUrls(url: string, text: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const combined = encodeURIComponent(`${text} ${url}`);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
    whatsapp: `https://wa.me/?text=${combined}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
    email: `mailto:?subject=${t}&body=${u}`,
    // Instagram / TikTok have no public web share endpoint — copy link for those apps
    copy: url,
  };
}

export function readFollowing(): FollowEdge[] {
  try {
    return JSON.parse(localStorage.getItem(FOLLOW_KEY) ?? "[]") as FollowEdge[];
  } catch {
    return [];
  }
}

export function toggleFollow(username: string) {
  if (username.toUpperCase() === ADMIN_USERNAME) return readFollowing();
  const list = readFollowing();
  const exists = list.some((f) => f.username === username);
  const next = exists
    ? list.filter((f) => f.username !== username)
    : [...list, { username, since: new Date().toISOString() }];
  localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
  return next;
}

/** Suggested accounts (never includes admin on leaderboard; admin may appear as system). */
export function suggestedAccounts(selfUsername?: string) {
  const pool = ["growthlab", "signalshop", "creatorhub", "adboostpro", "commercekit"].filter(
    (u) => u !== selfUsername?.toLowerCase() && u.toUpperCase() !== ADMIN_USERNAME,
  );
  return pool.map((username) => ({
    username,
    blurb: "Active on CINTEXA — follow to see their public activity.",
  }));
}

/** Demo leaderboard rows — excludes admin FREE2026. */
export function demoLeaderboard() {
  return {
    mostReferrer: [
      { username: "growthlab", score: 128 },
      { username: "signalshop", score: 96 },
      { username: "adboostpro", score: 71 },
    ],
    mostCreator: [
      { username: "creatorhub", score: 84 },
      { username: "growthlab", score: 62 },
      { username: "commercekit", score: 55 },
    ],
    mostUser: [
      { username: "signalshop", score: 210 },
      { username: "commercekit", score: 188 },
      { username: "creatorhub", score: 142 },
    ],
  };
}
