import { useMemo, useState } from "react";
import { DashboardShell } from "./DashboardShell";
import { useMyProfile } from "@/hooks/useApi";
import {
  SOCIAL_NETWORKS,
  connectNetwork,
  createPost,
  disconnectNetwork,
  readConnections,
  readPosts,
  shareUrls,
  suggestedAccounts,
  toggleFollow,
  readFollowing,
  type NetworkId,
} from "@/lib/social-hub";
import { ensureAdminReferrer } from "@/lib/social-hub";
import { ADMIN_USERNAME } from "@/lib/platform-economics";

export function DashboardSocial() {
  const profile = useMyProfile();
  const self = (profile.data?.profile as { username?: string } | null)?.username;
  const [connections, setConnections] = useState(() => readConnections());
  const [posts, setPosts] = useState(() => readPosts());
  const [following, setFollowing] = useState(() => readFollowing());
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState("");
  const [boost, setBoost] = useState(false);
  const referrer = useMemo(() => ensureAdminReferrer(), []);

  function handleConnect(network: NetworkId) {
    const handle = window.prompt(`Handle / page name for ${network}?`, self ? `@${self}` : "");
    if (!handle) return;
    setConnections(connectNetwork(network, handle));
  }

  function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const post = createPost({
      body: body.trim(),
      scheduledFor: schedule || undefined,
      boost,
    });
    setPosts(readPosts());
    setBody("");
    setSchedule("");
    setBoost(false);
    const urls = shareUrls(post.shareUrl, post.body.slice(0, 120));
    // Open share sheet intent for X as quick path; user can use all links below
    void urls;
  }

  const suggestions = suggestedAccounts(self);

  return (
    <DashboardShell>
      <p className="text-xs text-[hsl(var(--fg-muted))]">
        Referred by admin <strong>@{referrer}</strong> (every account is linked to @{ADMIN_USERNAME}).
      </p>

      <h2 className="cx-display mt-4 text-xl">Connect social accounts</h2>
      <p className="mt-2 text-sm text-[hsl(var(--fg-muted))]">
        Connect networks to schedule posts and boost ads from the dashboard. OAuth handshakes can be wired to each
        provider; handles are stored for this workspace now.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SOCIAL_NETWORKS.map((n) => {
          const conn = connections.find((c) => c.network === n.id);
          return (
            <div key={n.id} className="cx-card flex items-center justify-between gap-2">
              <div>
                <p className="font-medium" style={{ color: n.color }}>
                  {n.label}
                </p>
                <p className="text-xs text-[hsl(var(--fg-muted))]">{conn ? conn.handle : "Not connected"}</p>
              </div>
              {conn ? (
                <button
                  type="button"
                  className="cx-btn cx-btn-ghost cx-btn-sm"
                  onClick={() => setConnections(disconnectNetwork(n.id))}
                >
                  Disconnect
                </button>
              ) : (
                <button type="button" className="cx-btn cx-btn-primary cx-btn-sm" onClick={() => handleConnect(n.id)}>
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="cx-display mt-10 text-xl">Post, schedule &amp; boost</h2>
      <form className="cx-card mt-4 max-w-xl space-y-3" onSubmit={handlePost}>
        <textarea
          className="cx-input min-h-[100px]"
          placeholder="Write something to publish or schedule…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <label className="cx-field">
          <span className="cx-label">Schedule (optional)</span>
          <input
            type="datetime-local"
            className="cx-input"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={boost} onChange={(e) => setBoost(e.target.checked)} />
          Boost this as an ad
        </label>
        <button type="submit" className="cx-btn cx-btn-primary">
          {schedule ? "Schedule post" : "Publish post"}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {posts.map((p) => {
          const urls = shareUrls(p.shareUrl, p.body.slice(0, 100));
          return (
            <article key={p.id} className="cx-card">
              <p className="text-sm">{p.body}</p>
              <p className="mt-2 text-xs text-[hsl(var(--fg-muted))]">
                {p.scheduledFor ? `Scheduled ${p.scheduledFor}` : `Posted ${new Date(p.createdAt).toLocaleString()}`}
                {p.boost ? " · Boosted ad" : ""}
              </p>
              <p className="mt-1 font-mono text-xs text-[hsl(var(--accent))]">{p.shareUrl}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(urls).map(([name, href]) => (
                  <a key={name} className="cx-btn cx-btn-secondary cx-btn-sm" href={href} target="_blank" rel="noreferrer">
                    Share {name}
                  </a>
                ))}
              </div>
            </article>
          );
        })}
        {posts.length === 0 && <p className="text-sm text-[hsl(var(--fg-muted))]">No posts yet — create one above.</p>}
      </div>

      <h2 className="cx-display mt-10 text-xl">Suggested to follow</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {suggestions.map((s) => {
          const isFollowing = following.some((f) => f.username === s.username);
          return (
            <div key={s.username} className="cx-card flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">@{s.username}</p>
                <p className="text-xs text-[hsl(var(--fg-muted))]">{s.blurb}</p>
              </div>
              <button
                type="button"
                className={`cx-btn cx-btn-sm ${isFollowing ? "cx-btn-secondary" : "cx-btn-primary"}`}
                onClick={() => setFollowing(toggleFollow(s.username))}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          );
        })}
      </div>
    </DashboardShell>
  );
}
