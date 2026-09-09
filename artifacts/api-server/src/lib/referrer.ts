import { ADMIN_USERNAME } from "@cintexa/db";

/**
 * Every account is referred by the admin (FREE2026) by default. A real
 * ?ref=<username> capture (sent as referredByUserId in the request) takes
 * precedence when present. Once a referrer is set on an existing profile,
 * it's never changed — passing `hasExistingProfile: true` returns undefined
 * so the caller leaves the column untouched on updates.
 */
export function resolveReferrer(hasExistingProfile: boolean, requestedReferrer?: string): string | undefined {
  if (hasExistingProfile) return undefined;
  return requestedReferrer ?? ADMIN_USERNAME;
}
