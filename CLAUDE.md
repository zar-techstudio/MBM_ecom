# Working on this repo (read first)

This is the **e-commerce website** of MAQDOOM'S Big Mall (Next.js on Cloudflare Workers, live at
https://maqdoomsbigmall.com). Also follow `AGENTS.md` (this Next.js version differs from older ones).

**Before any work, read [WEBSITE.md](WEBSITE.md).** It is the one document for the website: where
it stands, what is left before launch, the owner's decisions, what is built, how it is built (hard
rules, keys, deploy, pages, code) and what the ERP should add next. Keep it current: when you
change the website, update the matching part of `WEBSITE.md` in the same commit.

## The two projects
- **This repo (`MBM_03`)**: the website only.
- **The ERP (`E:\Projects\LEADS\Maqdooms\mbm_inv_v2`)**: owns the database, products, orders and
  every migration. Its contract with the website: `mbm_inv_v2/docs/STOREFRONT_API.md` (check its
  "Website to-do" list at the top for new work). **Do not change the ERP from here.** Anything
  the website needs from the ERP goes in `WEBSITE.md` section 6, and is told to the owner of this
  repo so they can ask in the ERP's own session.

## How the owner of this repo likes to work
- Plain, short answers; no jargon. Say what changed, what was checked and what was not.
- **Phones matter most.** Check every change on a phone-sized screen (and a narrow one, ~340 px)
  as well as desktop, with real screenshots, before saying it is done.
- When given a **reference image**, match it closely (sizes, spacing, colours, details); measure
  it rather than approximating, and compare side by side before reporting.
- **Ask before every deploy**, even after earlier deploys were approved ("Yes, deploy").
  Commit and push freely; end commit messages with the `Co-Authored-By` line the session asks for.
- Never add secret database keys; keep `.env` and the Worker's secrets in step (WEBSITE.md 5.2).

## Practical notes for this computer
- Drive C: is nearly full. Build and deploy with `TEMP`/`TMP` on drive E and
  `NODE_OPTIONS=--max-old-space-size=4096`, with the dev server stopped (WEBSITE.md 5.3). If only
  the upload fails, `npx opennextjs-cloudflare deploy` retries it.
- Dev server: `.claude/launch.json` (`next dev` on port 3100).
- For screenshots, headless Chrome through `playwright-core` (installed in a scratch folder, not
  in this project) at 390×844 and 340 px wide with a mobile user agent works well; the built-in
  browser pane may not draw streamed parts while it is in the background.
