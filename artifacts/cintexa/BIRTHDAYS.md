# Birthdays

## What users get
- **Date of birth** is an optional field on sign-up and in **Settings → Birthday** (13+; add, change or
  remove any time). It is used only for birthday wishes.
- **Portal splash:** on their birthday (in their own time zone) a full-screen celebration appears once
  per birthday per browser, and the dashboard greeting switches to "Happy Birthday, <name>!".
- **Email:** a short birthday email is sent automatically on their birthday morning (from 06:00 local).
  Users can switch it off in Settings ("Email me a birthday message").
- 29 February birthdays are celebrated on 28 February in non-leap years.

## How the email is sent
Cloudflare Pages has no cron, so a GitHub Actions workflow (`.github/workflows/birthday-wishes.yml`)
calls `POST /api/cron/birthdays` **hourly**. Each user is checked in *their own* time zone (saved from
their browser at sign-up / login / Settings; UTC if unknown), the wish goes out from 06:00 local, and
`birthday:sent:<userId>:<year>` in KV guarantees at most one email per year. If an email fails (or email
isn't configured) nothing is marked as sent and the next hourly run retries.

To keep it cheap, each date of birth is also listed under `bday:MM-DD` in KV, so the job reads only the
three calendar days that can be "today" somewhere on Earth — it never scans every user.

## One-time setup
1. Pick a long random string and add it as **`CRON_SECRET`**:
   - Cloudflare Pages → Settings → Variables and Secrets (production), and
   - GitHub → Settings → Secrets and variables → Actions → **Repository secret `CRON_SECRET`**.
2. Email must already be configured (`RESEND_API_KEY`, `EMAIL_FROM`) — the same as other emails.
3. Optional: set a repository **variable `SITE_URL`** if the site isn't `https://cintexa.com`.
4. Test: GitHub → Actions → *Birthday wishes* → *Run workflow* (dry run is on by default; it lists who
   would receive an email without sending). Or:
   `curl -X POST -H "Authorization: Bearer $CRON_SECRET" "https://cintexa.com/api/cron/birthdays?dryRun=1"`

Without `CRON_SECRET` the workflow logs a warning and exits, and the endpoint answers 503.

## Existing users
Accounts created before this feature have no date of birth until the user adds one in Settings.

## Data & privacy
Stored in the user's KV record as `dateOfBirth` (`YYYY-MM-DD`), `timeZone` and `birthdayEmail`.
The privacy policy lists it under account information. Age is never shown or emailed.
