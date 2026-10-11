/**
 * POST /api/auth/profile — the signed-in user updates their own account details.
 * Body (all optional): { dateOfBirth: "YYYY-MM-DD" | null, birthdayEmail: boolean, timeZone: string }
 */
import {
  bearerToken,
  corsHeaders,
  publicUser,
  readSession,
  userKey,
  type StoredUser,
} from "../../lib/cintexa-auth";
import { isValidTimeZone, updateBirthdayIndex, validateDob } from "../../lib/birthday";

export interface Env {
  KV: KVNamespace;
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders({ "Content-Type": "application/json" });
  try {
    const session = await readSession(context.env.KV, bearerToken(context.request));
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401, headers });

    let body: { dateOfBirth?: string | null; birthdayEmail?: unknown; timeZone?: unknown };
    try {
      body = (await context.request.json()) as typeof body;
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400, headers });
    }

    const raw = await context.env.KV.get(userKey(session.email));
    if (!raw) return Response.json({ error: "Account not found." }, { status: 404, headers });
    const user = JSON.parse(raw) as StoredUser;
    const previousDob = user.dateOfBirth;

    if ("dateOfBirth" in body) {
      if (body.dateOfBirth === null || body.dateOfBirth === "") {
        delete user.dateOfBirth;
      } else {
        const dob = validateDob(body.dateOfBirth);
        if (!dob.ok) return Response.json({ error: dob.error }, { status: 400, headers });
        user.dateOfBirth = dob.value;
      }
    }
    if (typeof body.birthdayEmail === "boolean") user.birthdayEmail = body.birthdayEmail;
    if (isValidTimeZone(body.timeZone)) user.timeZone = body.timeZone;

    await context.env.KV.put(userKey(user.email), JSON.stringify(user));
    await updateBirthdayIndex(context.env.KV, user.email, previousDob, user.dateOfBirth);

    return Response.json({ ok: true, user: publicUser(user) }, { headers });
  } catch (err) {
    console.error("auth/profile", err);
    return Response.json({ error: "Could not save your details." }, { status: 500, headers });
  }
};
