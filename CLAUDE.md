# BJJ Analytics

A local-only web app that reads a `jiu-jitsu` photo folder (one subfolder per belt) through the File System Access API and shows training analytics: streaks, averages, heatmap, graduation progress and milestones.
- How it works today: `SPEC.md`. What changed in each version: `CHANGELOG.md`.

## Commands
- Install: `npm install`
- Develop: `npm run dev` (Vite dev server; open in Chrome/Edge/Brave, since File System Access is Chromium-only)
- Build: `npm run build` (runs `tsc --noEmit` first, then writes a single self-contained `dist/bjj-analytics.html`)
- Tests: `npm test` (Vitest). One file: `npx vitest run src/core/stats.test.ts`
- Type-check: `npm run typecheck`

## Conventions
- Everything stays on the user's machine: no network requests, CDNs or analytics. The build output must keep working when opened from `file://`.
- The folder layout is the data format: belt folders `00-branca` … `04-preta`, files `YYYY-MM-DD[-a][_].jpg|png` (`-a`, `-b`… = more trainings on the same day, trailing `_` = unofficial). Parsing lives only in `src/core/filename.ts`; changing it breaks real folders.
- UI text is in Brazilian Portuguese.
- `src/core/` is pure: no DOM, no `localStorage`, no `new Date()`. Settings and the current time come in as parameters. Browser access lives in `src/data/`, rendering in `src/ui/`.
- Weeks are ISO weeks (Monday to Sunday); the current week is left out of all stats unless the "Incluir semana atual" toggle is on.
- `localStorage` keys (`jja-settings`, `includeCurrentWeek`, `collapsed:*`) and the IndexedDB name are kept from the single-file version so saved preferences and the chosen folder survive updates.
- `legacy/bjj-analytics.html` is the original single-file version, kept only as a reference until the new build is confirmed by hand. Don't edit it.

## Tests
- Tests live next to the code as `*.test.ts`.
- The seam is the public functions of `src/core/`: stats, graduation and milestone rules are tested by calling them with fixtures, explicit settings and a fixed `now`, as in `src/core/stats.test.ts`. `src/data/` and `src/ui/` have no automated tests.
- `src/core/test-helpers.ts` builds `Training` fixtures from file paths (`training('00-branca/2025-06-27-a_.jpg')`, `daily(...)`) and stats options with a fixed `now`, so tests describe data the way the folder does.
- What needs a real Chromium browser with a photo folder (folder picking and permission, tooltips and photo previews, lightbox, chart visuals, snapshot export) is checked by hand in the browser; list those checks in the pull request.

## Workflow
- Changes go to `main` through pull requests.
- Documents, issues and pull requests: Brazilian Portuguese.
- Every push to `main` deploys the app to GitHub Pages (`.github/workflows/pages.yml`). To share the single file, run `npm run build` and send `dist/bjj-analytics.html`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for ramonk2o/bjj-analytics, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
