# BJJ Analytics

A local-only web app that reads a `jiu-jitsu` photo folder (one subfolder per belt) through the File System Access API and shows training analytics: streaks, averages, heatmap, graduation progress and milestones.
- How it works today: `SPEC.md`. Ideas and the feature in progress: `BACKLOG.md`. What changed in each version: `CHANGELOG.md`.

## Commands
- Install: `npm install`
- Develop: `npm run dev` (Vite dev server; open in Chrome/Edge/Brave, since File System Access is Chromium-only)
- Build: `npm run build` (runs `tsc --noEmit` first, then writes a single self-contained `dist/bjj-analytics.html`)
- Tests: `npm test` (Vitest)
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
- `src/core/test-helpers.ts` builds `Training` fixtures from file paths (`training('00-branca/2025-06-27-a_.jpg')`, `daily(...)`) and stats options with a fixed `now`, so tests describe data the way the folder does.
- Stats, graduation and milestone rules are tested by calling the `src/core` functions with fixtures, explicit settings and a fixed `now`, as in `src/core/stats.test.ts`. Only what needs a real Chromium browser with a photo folder (folder picking and permission, tooltips and photo previews, lightbox, chart visuals, snapshot export) goes into "To check by hand".

## Development cycle
Uses the `grilling`, `document` and `build` skills and the `tester` agent from the `mini-devkit` plugin. When a step needs one that isn't available, tell the user and stop; don't imitate it from memory.

1. **Idea:** if the idea is clear, record it with `document`. If it leaves behavior open (decisions that would change what gets built), start a `grilling` interview; before its final summary, load `document` and write the summary as the backlog entry, so my OK approves the text that will be recorded. "Just note it" ("só anota", "anota aí") always skips the interview.
2. **Build:** `build`.
3. **Bugs:** no backlog entry or tester. If the bug can be reproduced in a test (see Tests), write the test and show it fails, then fix it. If it needs a real Chromium browser with a photo folder, put the steps to reproduce it in the commit message's `To check by hand:` block. Record it with `document` (CHANGELOG under Fixed; SPEC.md if a rule changed) and commit. If the fix needs a decision about behavior, it's a feature: go to step 1.
4. **Release:** cut the version with `document`, then `npm run build` and share `dist/bjj-analytics.html`.
