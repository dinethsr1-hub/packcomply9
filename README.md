# PackComply V7 — AI Packaging Inspection

Free export-compliance screening MVP with product/country/material rule matching and an optional live AI vision inspection.

## Deploy to Vercel

1. Create a new GitHub repository, e.g. `packcomply-v7`.
2. Upload the files in this folder to the repository root. Keep the `api` folder and its `index.js` file.
3. Import the repository into Vercel.
4. In Vercel Project Settings → Environment Variables, add:
   - `OPENAI_API_KEY` = your OpenAI API key (do not put it in GitHub).
   - Optional: `OPENAI_MODEL` = a vision-capable model available to your account.
5. Redeploy.

Without `OPENAI_API_KEY`, the AI inspection deliberately returns a clearly labelled demo/fallback response. It must not be presented as a live AI assessment.

## What the AI inspection does

It can extract preliminary visual evidence such as likely packaging type/material, visible text/symbols and possible visual issues. It must not claim legal compliance, exact polymer/layer composition, migration compliance, certification validity, or legal responsibility from a photograph alone.

## Important

The regulatory checker is preliminary decision-support, not legal advice or a binding compliance determination. Country/product rules must be maintained and verified against current official sources before commercial reliance.


## V9 deployment
- Vercel serves `index.html` and `ai-inspector.html` as static files.
- `/ai-inspector` rewrites to `ai-inspector.html`.
- `/api/inspect` is a standalone Vercel function.
- Set `OPENAI_API_KEY` in Vercel Environment Variables for live AI inspection.
