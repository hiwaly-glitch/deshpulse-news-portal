# DeshPulse / দেশপালস — Bangladesh News Portal

Bengali-English news-discovery website with 175 media/government/defence source links, 5 RSS collector candidates, and clear original-publisher attribution.

**Deploy with the new GitHub/Vercel accounts:** see [DEPLOY-HIWALY-VERCEL.md](DEPLOY-HIWALY-VERCEL.md).

## Run locally

```powershell
npm install
npm test
npm run check
npm start
```

Then open http://localhost:3000. Local Node server endpoints are `/healthz` and `/api/news`; Vercel serverless endpoint for health is `/api/health`.

## Deployment

- GitHub owner: `hiwaly-glitch`
- Vercel scope: `hiwaly-5630` (Hobby / Free)
- Vercel framework preset: `Other`; Node 22.x; no build step.
- Static assets in `public/`; serverless RSS collector in `api/news.js`.
- All five enabled RSS feeds can fail due to publisher access controls. The site must not fabricate news if no feed succeeds.
- No API keys or extra database required for this demo.
- Not suited to unattended scheduled collection or monetization without further work and an appropriate plan.

## Legal notice

Do not copy complete news articles or publisher images without permission. Link to official publishers and attribute statements to sources.
