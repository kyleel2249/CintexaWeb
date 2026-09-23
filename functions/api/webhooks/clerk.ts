import { escapeHtml, sendEmail } from "../../lib/email";
import { constantTimeEquals } from "../../lib/auth";

export interface Env {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  NOTIFY_ADMIN_EMAIL?: string;
  CLERK_WEBHOOK_SECRET?: string;
}

/**
 * Verifies a Svix-signed webhook (Clerk delivers webhooks via Svix) per Svix's own
 * scheme: https://docs.svix.com/receiving/verifying-payloads/how-manual
 *
 * `secret` is the dashboard's "whsec_..." value - base64 payload after that prefix.
 * Signed content is `${svixId}.${svixTimestamp}.${rawBody}`, HMAC-SHA256'd with the
 * decoded secret, compared against each `v1,<base64>` entry in svix-signature
 * (there can be more than one during secret rotation - valid if any match).
 * Timestamps older than 5 minutes are rejected to guard against replay, matching
 * Svix's own official-library default tolerance.
 *
 * Runs in the Cloudflare Pages Functions (Workers) runtime, not Node, so this uses
 * Web Crypto (crypto.subtle) rather than node:crypto - the same HMAC approach
 * webhookAuth.ts uses on the api-server side, just via the Workers-native API.
 */
async function verifySvixSignature(
  secret: string,
  rawBody: string,
  headers: { id: string; timestamp: string; signature: string },
): Promise<boolean> {
  const timestampSeconds = Number(headers.timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;
  if (Math.abs(Date.now() / 1000 - timestampSeconds) > 5 * 60) return false;

  const secretBytes = base64Decode(secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret);
  const signedContent = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expected = base64Encode(new Uint8Array(sigBuffer));

  return headers.signature
    .split(" ")
    .map((entry) => entry.split(",")[1])
    .filter((sig): sig is string => Boolean(sig))
    .some((sig) => constantTimeEquals(sig, expected));
}

function base64Decode(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function base64Encode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Clerk webhook: user.created / user.updated
 * Configure in Clerk Dashboard -> Webhooks -> endpoint:
 *   https://cintexa.com/api/webhooks/clerk
 * Subscribe to: user.created
 *
 * Signature verification: when CLERK_WEBHOOK_SECRET is set, svix-id/svix-timestamp/
 * svix-signature headers are required and verified against the raw body (see
 * verifySvixSignature above). Without a secret (dev), payloads are accepted
 * unverified with a warning logged.
 */
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const raw = await context.request.text();

    const secret = context.env.CLERK_WEBHOOK_SECRET;
    if (secret) {
      const svixId = context.request.headers.get("svix-id");
      const svixTimestamp = context.request.headers.get("svix-timestamp");
      const svixSignature = context.request.headers.get("svix-signature");
      if (!svixId || !svixTimestamp || !svixSignature) {
        return Response.json({ error: "Missing svix headers" }, { status: 401 });
      }
      const valid = await verifySvixSignature(secret, raw, {
        id: svixId,
        timestamp: svixTimestamp,
        signature: svixSignature,
      });
      if (!valid) {
        return Response.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.warn("CLERK_WEBHOOK_SECRET not set — accepting webhook without signature verify");
    }

    let payload: {
      type?: string;
      data?: {
        id?: string;
        first_name?: string | null;
        last_name?: string | null;
        email_addresses?: { email_address?: string }[];
        phone_numbers?: { phone_number?: string }[];
        username?: string | null;
        created_at?: number;
      };
    };

    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (payload.type !== "user.created" && payload.type !== "user.updated") {
      return Response.json({ ok: true, ignored: payload.type });
    }

    const data = payload.data || {};
    const email =
      data.email_addresses?.[0]?.email_address?.toLowerCase()?.trim() || "";
    const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ").trim() || "New user";
    const phone = data.phone_numbers?.[0]?.phone_number || "";

    if (!email) {
      return Response.json({ ok: true, skipped: "no_email" });
    }

    const record = {
      id: crypto.randomUUID(),
      type: "clerk_" + (payload.type || "user"),
      fullName,
      email,
      phone,
      company: "",
      role: "",
      message: "",
      source: "clerk_webhook",
      clerkUserId: data.id || null,
      username: data.username || null,
      createdAt: new Date().toISOString(),
    };

    await context.env.KV.put(`signup:${email}`, JSON.stringify(record));
    await context.env.KV.put(`signup:clerk:${data.id || email}`, JSON.stringify(record));

    const indexRaw = await context.env.KV.get("signup:index");
    const index: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];
    if (!index.includes(email)) {
      index.unshift(email);
      await context.env.KV.put("signup:index", JSON.stringify(index.slice(0, 10000)));
    }

    const adminTo = context.env.NOTIFY_ADMIN_EMAIL || "info@cintexa.com";
    const adminNotify = await sendEmail(context.env, {
      to: adminTo,
      subject: `New Clerk ${payload.type} — ${fullName}`,
      html: `<h2>Clerk ${escapeHtml(payload.type || "")}</h2>
        <p><strong>${escapeHtml(fullName)}</strong> &lt;${escapeHtml(email)}&gt;</p>
        <p>Phone: ${escapeHtml(phone || "—")}</p>
        <p>Clerk ID: ${escapeHtml(data.id || "—")}</p>`,
      text: `${payload.type}: ${fullName} <${email}>`,
      replyTo: email,
    });

    return Response.json({ ok: true, stored: true, adminNotify });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Webhook failed" }, { status: 500 });
  }
};
