# Admin console

`/admin` is a username-and-password console for users, activity and analytics. It is `noindex` and disallowed
in `robots.txt`. The original API-server operations panel (customers, loyalty, agents) is kept as the
**Operations** tab and still uses its own admin key.

## First-time setup (no default credentials exist)
1. Open `/admin` → **First time? Send the setup link to info@cintexa.com**.
2. Open the e-mail in the `info@cintexa.com` inbox and follow the one-time link (valid 30 minutes, works once).
3. Choose a username and a password (12+ characters, three kinds of character).
4. If e-mail isn't configured yet, set `ADMIN_SETUP_TOKEN` (Cloudflare Pages secret, 32+ random characters)
   and open `/admin?setup=<that value>` instead. Remove it afterwards.

## What reaches `info@cintexa.com`
Setup and reset **links** (one-time), a **security alert on every admin sign-in** (username, time, IP, location,
browser), and notices when an admin is created, locked out or has the password reset. **Passwords are never
sent** — by e-mail or anywhere else. Change the destination with `ADMIN_SECURITY_EMAIL`.

## Why passwords are not stored in readable form (and never will be)
Every user and admin password is stored only as a salted PBKDF2 hash, in Cloudflare KV. Passwords that are typed
wrongly are not recorded either (a mistyped password is usually a real one with a typo). Storing readable
passwords would turn any breach, leaked backup or compromised admin account into a loss of every user's
credentials — across all the other sites where people reuse them. A locked-out user uses **Forgot password**;
admins use the reset link above. Tests scan all storage, events and e-mails to prove no password appears.

## What is captured
- **At sign-up:** every form field (name, e-mail, phone, company, job role, date of birth, time zone) plus IP
  address, country/region/city, browser, language and time.
- **At every sign-in:** time, IP, location, browser — successful *and* failed (with the e-mail tried and why:
  wrong password / unknown account / locked out). Also sign-outs, password-reset requests and resets, profile
  changes, job applications and alert signups.
- Events are kept 400 days (the policy says 13 months); each user's last 50 events are on their record.

## Admin security
Hashed passwords; 5 failed sign-ins lock an account for 15 minutes (and e-mail an alert); per-IP rate limits;
identical errors for wrong password and unknown username; sessions are random tokens of which only the SHA-256
is stored, last 8 hours and are kept in `sessionStorage` (gone when the tab closes); a password reset signs every
session out; setup/reset links are single-use and survive a typo; every admin action is in the **Audit log**;
CSV exports neutralise spreadsheet formulas and are audited. No `Access-Control-Allow-Origin` header is sent.

## Tabs
Overview (totals, 30-day trends, countries, profile completeness) · Users (search, detail with sign-in history and
contributions, CSV export) · Activity (filterable, newest first) · Applications · Alerts · Audit log · Operations.

## Limits and scaling
Data lives in Workers KV. One admin request reads at most 600 users (KV allows ~1,000 operations per request), so
Overview figures and search cover the **newest 600 accounts** and say so on screen; the user list itself pages
through everyone. Above a few thousand users, move users/events to **D1** (SQL) — the API shapes can stay the same.
Accounts created before this feature have no sign-up IP/location; they gain sign-in data from their next sign-in.
