---
name: strict-proofreading
description: Make minimal, strictly scoped corrections to user-provided prose. Use when the user asks to fix spelling, grammar, or another named copy category without rewriting. Do not use for requested rewrites or broader editing.
---

# Strict Proofreading

Change only errors that fall unambiguously within the categories the user named.

## Treat the scope literally

- Interpret `spelling and grammar` as spelling and grammar only.
- Do not treat punctuation, style, clarity, flow, tone, wording, emphasis, consistency, localisation, or factual accuracy as implicitly included.
- Preserve punctuation exactly unless the user explicitly asks for punctuation changes. This includes commas, apostrophes, quotation marks and hyphens.
- Preserve headings, paragraph order, line breaks, Markdown, emphasis and intentional fragments.
- Do not change valid regional variants such as `labor` and `labour` unless the user explicitly asks for localisation or dialect consistency.
- Do not enforce a house style when the existing form is valid and the request is correction only.

## Require an unambiguous error

Edit a passage only when both conditions hold:

1. The existing form is not valid standard spelling or grammar in context.
2. The correction does not require choosing among meanings, tense or aspect, voice, register, emphasis, or other authorial preferences.

Do not change a sentence merely because another version sounds smoother or is more idiomatic. In particular, do not change:

- one grammatical tense or aspect to another
- optional parallel phrasing
- a grammatical but awkward construction
- a valid word to a preferred synonym
- an implied object by inventing a noun
- punctuation that would conventionally improve the sentence

When more than one plausible correction would change the meaning, stop before editing and ask the user to choose. Group every such ambiguity into one concise question.

## Make the smallest correction

- Replace or remove the minimum number of words needed.
- Keep every unaffected character unchanged.
- Do not repair adjacent issues outside the named scope.
- Do not rewrite the whole sentence when a token-level correction is sufficient.

Examples of allowed corrections:

- `Inevitability, this comes up.` to `Inevitably, this comes up.`
- `I do have are a few pointers.` to `I do have a few pointers.`
- `There is pattern in these stories.` to `There is a pattern in these stories.`

Examples of changes to reject:

- `I couldn't find` to `I haven't found`, because both are grammatical and the change selects a different tense and aspect
- `labor` to `labour`, because both are valid spellings
- adding a comma before `but`, when punctuation was not requested
- `How are you are supposed to do...` to `What are you supposed to do...`, without asking whether the intended repair is instead `How are you supposed to...`

## Verify the completed edit

Inspect the complete diff against the original text before reporting completion.

For every changed token, state internally which explicit category authorised it and why the original was unambiguously wrong. Revert any change that is stylistic, optional, meaning-altering, punctuation-only, or doubtful. Confirm that no punctuation or formatting changed when those categories were not requested.
