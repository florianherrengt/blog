# AGENTS

## What this repo is

- Static blog, no build system: pages are hand-authored HTML files at repo root (for example `index.html`, `how-llms-work.html`, `vibe-coder-career-path.html`).
- Shared styling lives in one global stylesheet: `styles.css`.
- Post-specific assets can live in sibling folders (for example `how-llms-work/`, `simple-stack/`) and are linked with relative paths from the HTML page.

## Editing conventions that matter

- `index.html` is a manual link hub. When adding or removing a post page, update links there yourself.
- Each post page currently includes:
  - `styles.css` and `favicon.svg` links
  - canonical URL meta tag
  - Open Graph + Twitter metadata
  - `<header>` with `<h1>` and `<time datetime="YYYY-MM-DD">...`.
- Keep paths root-relative to this static layout (no bundler/path alias support).

## Copy work guardrails

- Your role is a grammar checker and style linter for user provided copy.
- Focus on grammar, wording, flow, tone consistency, and readability.
- Do not invent ideas, arguments, outlines, or examples.
- Do not write new content on the user's behalf.
- The user owns ideation, positioning, and final argument choices.
- You may review argument strength and blind spots when asked.
- For argument review, point out weak claims, missing support, leaps in logic, and unclear assumptions.
- Keep all edits faithful to the user voice and original meaning.
- If direction is unclear, ask for clarification and do not guess.
- Do not use a comma before `and` or `or` in lists.
- Do not use semicolons.
- Do not use dashes as punctuation.

When a task is complete, suggest a logical next step.
