#!/usr/bin/env node
/**
 * Env-driven chatbot seeding script.
 *
 * Triggers the Cloudflare Worker's `/api/seed` endpoint to (re)build the
 * Vectorize index from the live portfolio + blog content. Everything is read
 * from environment variables so it can run locally, in CI, or from a hook with
 * no hard-coded secrets.
 *
 * Required env:
 *   CHATBOT_SEED_SECRET   Bearer token that matches the Worker's SEED_SECRET.
 *
 * Optional env:
 *   NEXT_PUBLIC_CHATBOT_URL   Worker base URL.
 *                             Defaults to the production Worker URL.
 *
 * Env is loaded from (in order, first match wins for a given key):
 *   process.env  ->  apps/web/.env.local  ->  apps/web/.env
 *
 * Usage:
 *   yarn workspace web seed
 *   # or
 *   node scripts/seed-chatbot.mjs
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");

const DEFAULT_WORKER_URL = "https://ai-chatbot-widget.sehgaldival.workers.dev";

/**
 * Minimal .env parser (no dependency needed). Existing process.env values win,
 * so real environment/CI secrets always take precedence over files.
 */
function loadEnvFile(fileName) {
  const path = resolve(appRoot, fileName);
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    return; // File is optional.
  }

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes if present.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  // Later files do not override earlier ones because loadEnvFile only fills
  // keys that are still undefined. Load the more specific file first.
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const secret = process.env.CHATBOT_SEED_SECRET;
  const workerUrl = (process.env.NEXT_PUBLIC_CHATBOT_URL || DEFAULT_WORKER_URL).replace(/\/$/, "");

  if (!secret) {
    console.error(
      "\n[seed] Missing CHATBOT_SEED_SECRET.\n" +
        "       Set it in apps/web/.env(.local) or your shell/CI environment.\n" +
        "       It must match the Worker secret set via:\n" +
        "         yarn wrangler secret put SEED_SECRET\n"
    );
    process.exit(1);
  }

  const endpoint = `${workerUrl}/api/seed`;
  console.log(`[seed] Reseeding Vectorize via ${endpoint} ...`);

  const started = Date.now();
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
    });
  } catch (err) {
    console.error(`[seed] Network error calling the Worker: ${err?.message || err}`);
    process.exit(1);
  }

  const bodyText = await response.text();
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    body = { raw: bodyText };
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);

  if (!response.ok || body?.success !== true) {
    console.error(`[seed] Failed (HTTP ${response.status}, ${elapsed}s):`, body);
    process.exit(1);
  }

  console.log(`[seed] Success in ${elapsed}s — ${body.count} vectors upserted.`);
}

main();
