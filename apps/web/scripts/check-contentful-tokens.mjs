#!/usr/bin/env node
/**
 * Verifies each Contentful token is the right kind for its variable, without
 * printing any token. Fails (exit 1) on a mix-up, e.g. a read/write management
 * token sitting in CONTENTFUL_ACCESS_TOKEN — which is set on Vercel and CI, so
 * it must be the read-only Delivery API token.
 *
 *   node scripts/check-contentful-tokens.mjs        (reads apps/web/.env and the environment)
 *
 * Token kinds:
 *   CONTENTFUL_ACCESS_TOKEN          Delivery API (cdn.contentful.com), read-only, published content
 *   CONTENTFUL_PREVIEW_ACCESS_TOKEN  Preview API (preview.contentful.com), read-only, drafts
 *   CONTENTFUL_MANAGEMENT_TOKEN      Management API (api.contentful.com), read/write — local
 *                                    admin scripts only, never on Vercel or CI
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  process.loadEnvFile?.(join(ROOT, ".env"));
} catch {
  // Use the process environment (CI, Vercel).
}

const space = process.env.CONTENTFUL_SPACE_ID;
const environment = process.env.CONTENTFUL_ENVIRONMENT || "master";
const API = {
  delivery: "https://cdn.contentful.com",
  preview: "https://preview.contentful.com",
  management: "https://api.contentful.com",
};
const CHECKS = [
  { name: "CONTENTFUL_ACCESS_TOKEN", api: "delivery", required: true },
  { name: "CONTENTFUL_PREVIEW_ACCESS_TOKEN", api: "preview", required: false },
  { name: "CONTENTFUL_MANAGEMENT_TOKEN", api: "management", required: false },
];

/** True when Contentful accepts the token on that API. */
async function accepts(api, token) {
  const res = await fetch(`${API[api]}/spaces/${space}/environments/${environment}/content_types?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

/** Checks one variable; returns its problems and records its value to catch reuse. */
async function checkToken({ name, api, required }, seen) {
  const token = process.env[name];
  if (!token) {
    console.info(`- ${name}: not set${required ? "" : " (optional)"}`);
    return required ? [`${name} is not set.`] : [];
  }
  const problems = [];
  if (seen.has(token)) {problems.push(`${name} has the same value as ${seen.get(token)}; each needs its own token.`);}
  seen.set(token, name);

  const readOnlySlot = api !== "management";
  const [rightApi, writes] = await Promise.all([accepts(api, token), readOnlySlot ? accepts("management", token) : false]);
  if (!rightApi) {problems.push(`${name} is rejected by the ${api} API: wrong kind of token, revoked, or for another space.`);}
  if (writes) {
    problems.push(`${name} is a MANAGEMENT (read/write) token. Use a ${api} token here; management tokens must never reach Vercel or CI.`);
  }
  console.info(`${rightApi && !writes ? "✓" : "✖"} ${name}: ${api} token${rightApi ? "" : " — rejected"}`);
  return problems;
}

async function main() {
  if (!space) {
    console.error("✖ CONTENTFUL_SPACE_ID is not set.");
    process.exit(1);
  }
  const seen = new Map();
  const problems = [];
  for (const check of CHECKS) {
    problems.push(...(await checkToken(check, seen)));
  }
  if (problems.length) {
    console.error(`\n${problems.map((p) => `✖ ${p}`).join("\n")}`);
    process.exit(1);
  }
  console.info("\nAll Contentful tokens are the right kind.");
}

await main();
