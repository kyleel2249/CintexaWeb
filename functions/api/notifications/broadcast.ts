import { opportunityBroadcastHtml, sendEmail } from "../../lib/email";
import { constantTimeEquals } from "../../lib/auth";

export interface Env {
  KV: KVNamespace;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_API_KEY?: string;
}

type Body = {
  title?: string;
  kind?: string;
  summary?: string;
  href?: string;
  dryRun?: boolean;
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
  };

  const adminKey = context.env.ADMIN_API_KEY || "";
  const provided = context.request.headers.get("X-Admin-Key") || "";
  if (!adminKey || !constantTimeEquals(provided, adminKey)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: cors });
  }

  try {
    const body = (await context.request.json()) as Body;
    const title = (body.title || "").trim();
    const kind = (body.kind || "Opportunity").trim();
    const summary = (body.summary || "").trim();
    const href = (body.href || "").trim() || undefined;

    if (!title || !summary) {
      return Response.json(
        { error: "title and summary are required" },
        { status: 400, headers: cors },
      );
    }

    const indexRaw = await context.env.KV.get("career_alert:index");
    const emails: string[] = indexRaw ? (JSON.parse(indexRaw) as string[]) : [];

    if (body.dryRun) {
      return Response.json(
        { ok: true, dryRun: true, recipientCount: emails.length },
        { headers: cors },
      );
    }

    const html = opportunityBroadcastHtml({ title, kind, summary, href });
    const results: { email: string; ok: boolean; id?: string; error?: string }[] = [];

    // Sequential to respect provider rate limits on free tiers
    for (const email of emails.slice(0, 500)) {
      const r = await sendEmail(context.env, {
        to: email,
        subject: `${kind}: ${title}`,
        html,
        text: `${title}\n\n${summary}${href ? `\n\n${href}` : ""}`,
        tags: [{ name: "category", value: "opportunity_broadcast" }],
      });
      results.push({
        email,
        ok: r.ok,
        id: r.ok ? r.id : undefined,
        error: r.ok ? undefined : r.error,
      });
    }

    const sent = results.filter((r) => r.ok).length;
    await context.env.KV.put(
      `career_broadcast:${Date.now()}`,
      JSON.stringify({ title, kind, summary, href, sent, at: new Date().toISOString() }),
    );

    return Response.json(
      { ok: true, recipientCount: emails.length, sent, results: results.slice(0, 20) },
      { headers: cors },
    );
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Broadcast failed" }, { status: 500, headers: cors });
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    },
  });
