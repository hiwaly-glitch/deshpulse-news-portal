# DeshPulse deploy instructions — hiwaly accounts

## Account separation

- GitHub must display `hiwaly-glitch` when you create the repository.
- Vercel scope/team must display `hiwaly-5630` (Hobby) when you import it.
- Do not connect or change projects belonging to `hasaniqram` or `hasaniqram-7926`.
- The two service accounts can use the same email address, but the **GitHub authorization** on Vercel must be for the correct GitHub login.

## Step A — create a new repository

1. Open https://github.com/new in a browser logged into `hiwaly-glitch`.
2. Repository name: `deshpulse-news-portal`. Set Private (or Public if preferred). Do not add a template or initialize a README; the ZIP includes one.
3. Extract `deshpulse-hiwaly-vercel.zip` locally. Upload the **contents** of the extracted project folder, not the ZIP file, using GitHub's Add file → Upload files. Verify that `public/`, `api/`, `lib/`, `data/`, `package.json`, and `vercel.json` are at the repository root.
4. Commit to `main` with a descriptive message. No secret keys are required.

## Step B — connect GitHub to Vercel and deploy

1. Log into https://vercel.com/dashboard using the `hiwaly-5630` account, and select the `hiwaly-5630` Hobby scope, **not** your `hasaniqram-7926` team.
2. Click Add New → Project → Import Git Repository. Authorize the GitHub account `hiwaly-glitch` if prompted. If the repository is not shown, use Configure GitHub App to grant this repository access.
3. Import `hiwaly-glitch/deshpulse-news-portal`.
4. Set project name `deshpulse-news`, Framework Preset **Other**, Root Directory `./`, Node.js `22.x` (if a Node version selector is available). The project has no build dependencies; leave Build Command and Output Directory unset. Let `vercel.json` configure the `/api/news` function.
5. Check the team/scope and Hobby plan. Click Deploy. Let Vercel supply the actual deployed URL; do not assume the desired project slug is free.

## Step C — verify the **actual** URL

- `https://YOUR-DEPLOYMENT-URL/` shows the homepage.
- `https://YOUR-DEPLOYMENT-URL/sources.json` returns a JSON array with 175 directory entries.
- `https://YOUR-DEPLOYMENT-URL/api/health` returns `{"ok":true,...}`.
- `https://YOUR-DEPLOYMENT-URL/api/news` returns `articles` and `feeds`. Read each `feeds[*].status`, don't mistake a valid JSON response for successful RSS import. Feeds may reject automated access or lack recent entries.
- Test Bengali/English toggle and a category search on mobile and desktop.

## Limitations and policies

- Vercel Hobby is for **personal, non-commercial** work. Do not enable ads, affiliate revenue, sponsorships or paid services on that plan; upgrade or move host before monetization.
- Five RSS candidates are enabled; **175 entries are a source directory**, not 175 live feeds.
- This is a discovery site that links to publisher articles, not a full-text copying/republishing platform.
- RSS runs on user visits to `/api/news`; there is no background cron and no durable news archive. A healthy response can be cached by the CDN for up to 15 minutes.
- No existing Vercel/GitHub project needs modifying.
