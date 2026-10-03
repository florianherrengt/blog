#!/usr/bin/env node
// Update "Discuss on Hacker News" links with live submission counts.
// Scans root HTML pages for anchors pointing to news.ycombinator.com/item?id=...,
// reads the comment count from the official Hacker News API and rewrites
// the anchor text to "Discuss on Hacker News (y comments)".
// Safe to re-run: existing counts are replaced, untouched pages stay untouched.
// Usage: node hn-counts.mjs [--dry-run]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.argv.includes("--dry-run");

// Matches both hand-written single-line anchors and prettier-formatted ones
// where the tag attributes and the </a> are split across lines. The text node
// must stay tag-free ("Discuss on Hacker News", with or without counts).
const ANCHOR_RE =
  /(<a\b[^>]*href="https:\/\/news\.ycombinator\.com\/item\?id=(\d+)"[^>]*>)([^<]*Discuss on Hacker News[^<]*?)(<\/a\s*>)/g;

const plural = (n, noun) => `${n} ${noun}${n === 1 ? "" : "s"}`;

async function fetchCounts(id) {
  const res = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const story = await res.json();
  if (!story) throw new Error("item not found (deleted)");
  return { comments: story.descendants ?? 0 };
}

const files = fs
  .readdirSync(__dirname)
  .filter((f) => f.endsWith(".html"))
  .map((f) => path.join(__dirname, f))
  .filter((f) => fs.statSync(f).isFile());

// Pass 1: collect every anchor and the submission id it points to.
const found = [];
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  for (const m of html.matchAll(ANCHOR_RE)) {
    found.push({ file, html, id: m[2], current: m[3].trim() });
  }
}

if (found.length === 0) {
  console.log("No Hacker News discussion links found.");
  process.exit(0);
}

// Pass 2: fetch each unique submission once.
const counts = new Map();
for (const id of new Set(found.map((f) => f.id))) {
  try {
    counts.set(id, await fetchCounts(id));
  } catch (err) {
    console.warn(`Skipping item ${id}: ${err.message}`);
  }
}

// Pass 3: rewrite the pages whose counts changed.
for (const file of [...new Set(found.map((f) => f.file))]) {
  const entry = found.find((f) => f.file === file);
  const updated = entry.html.replace(ANCHOR_RE, (m, open, id, _text, close) => {
    const c = counts.get(id);
    if (!c) return m;
    return `${open}Discuss on Hacker News (${plural(c.comments, "comment")})${close}`;
  });
  if (updated === entry.html) continue;
  if (!DRY_RUN) fs.writeFileSync(file, updated);
  for (const f of found.filter((x) => x.file === file)) {
    const c = counts.get(f.id);
    if (!c) continue;
    const next = `Discuss on Hacker News (${plural(c.comments, "comment")})`;
    console.log(
      `${path.basename(file)}: item ${f.id}: "${f.current}" -> "${next}"${DRY_RUN ? " (dry run)" : ""}`
    );
  }
}
