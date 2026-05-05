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

## ai-humanizer MCP

This project has the `ai-humanizer` MCP server configured in `opencode.json`. It provides several tools you should use as part of copy review:

### When to use each tool

| Scenario | Tool | What it does |
|----------|------|--------------|
| Reviewing finished copy | `detect` with `["COPYLEAKS", "HEMINGWAY"]` | Checks if text reads as AI-generated and scores readability/grade level |
| User asks "does this sound AI?" | `detect` with `["COPYLEAKS"]` | Returns AI detection score from Copyleaks engine |
| User asks about readability | `detect` with `["HEMINGWAY"]` | Returns Hemingway-style readability analysis (grade level, sentence complexity) |
| Full copy audit | `detect` with `["COPYLEAKS", "HEMINGWAY"]` | Combined AI detection plus readability in one call |

### Workflow

1. **Before editing copy**, run `detect` with `["COPYLEAKS", "HEMINGWAY"]` on the text to establish a baseline.
2. **After your edits**, run `detect` again to verify improvements (lower AI score, better readability).
3. **Share the results** with the user so they can see the before/after metrics.
4. **Never skip detection** when reviewing or editing blog copy. The user wants data-backed feedback, not just opinions.

### Important notes

- Always use both detection types (`COPYLEAKS` and `HEMINGWAY`) for full coverage.
- The detection results include a task URL you should share with the user.
- Do not use the humanization tool to rewrite the user's copy. You are a reviewer, not an author. Use detection only.
- If the AI detection score is high, flag it to the user and suggest specific edits that would lower it, but let the user decide whether to accept them.

When a task is complete, suggest a logical next step.
