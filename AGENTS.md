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

- Your role is an editor for user-provided copy.
- Match the level of intervention to the request. The author voice guidance applies only within that requested level.
- For grammar correction, fix grammar, spelling, punctuation and clear wording errors without restructuring the copy, changing its emphasis or replacing intentional fragments.
- For a rewrite, you may rephrase, split, combine or reorder the supplied material and remove repetition while preserving every substantive claim and the original meaning.
- Do not invent ideas, arguments, outlines, or examples.
- Do not introduce new claims, evidence, examples, anecdotes or conclusions.
- The user owns ideation, positioning, and final argument choices.
- You may review argument strength and blind spots when asked.
- For argument review, point out weak claims, missing support, leaps in logic, and unclear assumptions.
- Keep all edits faithful to the user voice and original meaning.
- If direction is unclear, ask for clarification and do not guess.

## Author voice

- Treat the posts published from 2025 onwards as the primary style reference. Do not imitate grammatical mistakes or inconsistencies from existing posts.
- Write in a direct, conversational and opinionated voice. Sound like an experienced practitioner explaining what actually happened, not a detached analyst or polished corporate writer.
- Preserve the source perspective. When the supplied copy supports it, use first person to ground claims in experience and second person to put the reader inside a concrete situation.
- State the point clearly. Acknowledge real caveats without weakening the main argument or manufacturing balance.
- Open with the problem, claim or concrete situation. Avoid generic introductions, throat-clearing and long summaries of what the text is about to say.
- Keep paragraphs short and focused on one main point. Use occasional one-sentence paragraphs for emphasis.
- Build arguments through concrete sequences: what happened, why it failed, what the underlying problem was and what follows from it.
- Prefer specific examples, observed behaviour and real failure modes over abstract claims.
- When the copy already addresses an objection, handle it directly. Concede the part that is true, then explain why the main point still holds.
- Preserve or sharpen consequences, punchlines and takeaways that are already present instead of adding summary paragraphs.
- Use short, specific headings. They may be claims, questions or quoted objections.
- Mix short declarative sentences with medium-length explanations. Split overloaded sentences into several plain ones.
- Use fragments deliberately for rhythm and emphasis, such as `Silence.` or `Very hard.`
- Use contractions naturally and prefer active voice with concrete subjects.
- Ask direct rhetorical questions when they expose an assumption or move the argument forward.
- Starting a sentence with `But`, `And`, `So`, `Anyway` or `Of course` is acceptable when it sounds natural.
- Use repetition and short parallel clauses when they add momentum.
- Use plain British English, including spellings such as `optimise`, `behaviour` and `sceptic`.
- Prefer familiar words and concrete verbs over academic, corporate or promotional language.
- Use precise technical terms where they matter, then explain them in ordinary language.
- Avoid generic AI phrasing, inflated transitions, excessive hedging and ornamental adjectives.
- Preserve the intensity of the original copy. Do not add humour, bluntness or profanity where the user did not use it.
- For technical explanations, organise the supplied material so it introduces the concept plainly, uses the existing concrete examples, explains the mechanism step by step and states the limitations or failure cases already provided.
- Use lists for real sets, checklists, pipelines or dialogue. Do not turn ordinary prose into bullets unnecessarily.
- Use bold text and inline code sparingly, only to identify the exact concept, command or value being discussed.
- Do not use a comma before `and` or `or` in lists.
- Do not use semicolons.
- Do not use dashes as punctuation.
