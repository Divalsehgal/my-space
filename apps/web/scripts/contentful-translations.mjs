#!/usr/bin/env node
/**
 * Manages the `translation` content model in Contentful (Management API).
 *
 *   node scripts/contentful-translations.mjs setup   create / update the content type and publish it
 *   node scripts/contentful-translations.mjs push    create entries for keys in the local (generated) en-US.json that aren't in Contentful yet
 *   node scripts/contentful-translations.mjs push --update   also overwrite default-locale values that differ
 *
 * Needs CONTENTFUL_MANAGEMENT_TOKEN (a personal access token) and
 * CONTENTFUL_SPACE_ID, read from apps/web/.env or the environment.
 * Idempotent: entry ids are derived from the key, so re-running is safe.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
try {
  process.loadEnvFile?.(join(ROOT, ".env"));
} catch {
  // Use the process environment.
}

const TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const SPACE = process.env.CONTENTFUL_SPACE_ID;
const ENV = process.env.CONTENTFUL_ENVIRONMENT || "master";
const CONTENT_TYPE = "translation";
const UNAUTHORIZED = 401;
const [command = "help", ...flags] = process.argv.slice(2);

if (!TOKEN || !SPACE) {
  console.error("Set CONTENTFUL_MANAGEMENT_TOKEN and CONTENTFUL_SPACE_ID (e.g. in apps/web/.env).");
  process.exit(1);
}

const BASE = `https://api.contentful.com/spaces/${SPACE}/environments/${ENV}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** A readable error for a failed Management API call, with a hint when the token is the wrong kind. */
function requestError(method, path, status, json) {
  const hint = status === UNAUTHORIZED
    ? " — CONTENTFUL_MANAGEMENT_TOKEN must be a management token (Account settings → CMA tokens, starts with CFPAT-), not the delivery token."
    : "";
  return new Error(`${method} ${path}: ${status} ${json?.sys?.id ?? ""} ${json?.message ?? ""}${hint}`);
}

/** Management API call with retry on rate limiting (429). */
async function cma(path, { method = "GET", body, headers = {} } = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/vnd.contentful.management.v1+json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429) {
      await sleep(Number(res.headers.get("x-contentful-ratelimit-reset") || 1) * 1000);
      continue;
    }
    const json = res.status === 204 ? {} : await res.json();
    if (!res.ok) {
      const error = requestError(method, path, res.status, json);
      error.status = res.status;
      throw error;
    }
    return json;
  }
  throw new Error(`${method} ${path}: still rate limited`);
}

const CONTENT_TYPE_BODY = {
  name: "Translation",
  displayField: "key",
  description: "One static UI string per entry. Synced into the site at build time (scripts/sync-translations.mjs).",
  fields: [
    {
      id: "key",
      name: "Key",
      type: "Symbol",
      required: true,
      localized: false,
      validations: [
        { unique: true },
        { regexp: { pattern: String.raw`^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_-]+)+$` }, message: "Use dot.separated.keys, e.g. nav.home" },
      ],
    },
    { id: "value", name: "Value", type: "Text", required: true, localized: true },
    {
      id: "description",
      name: "Context for translators",
      type: "Symbol",
      required: false,
      localized: false,
    },
  ],
};

async function setup() {
  let version;
  try {
    version = (await cma(`/content_types/${CONTENT_TYPE}`)).sys.version;
  } catch (error) {
    if (error.status !== 404) {throw error;}
  }
  const saved = await cma(`/content_types/${CONTENT_TYPE}`, {
    method: "PUT",
    body: CONTENT_TYPE_BODY,
    headers: version ? { "X-Contentful-Version": String(version) } : {},
  });
  await cma(`/content_types/${CONTENT_TYPE}/published`, {
    method: "PUT",
    headers: { "X-Contentful-Version": String(saved.sys.version) },
  });
  console.info(`${version ? "Updated" : "Created"} and published content type "${CONTENT_TYPE}".`);
}

/** Entry ids allow [A-Za-z0-9._-]{1,64}; keys already match, long ones are trimmed with a hash. */
function entryId(key) {
  const safe = `t.${key}`.replace(/[^A-Za-z0-9._-]/g, "-");
  if (safe.length <= 64) {return safe;}
  let hash = 0;
  for (const char of key) {hash = (hash * 31 + char.codePointAt(0)) >>> 0;}
  return `${safe.slice(0, 55)}.${hash.toString(36)}`;
}

async function loadExisting(locale) {
  const existing = new Map();
  for (let skip = 0; ; skip += 1000) {
    const page = await cma(`/entries?content_type=${CONTENT_TYPE}&limit=1000&skip=${skip}`);
    for (const item of page.items) {existing.set(item.fields.key?.[locale], item);}
    if (skip + page.items.length >= page.total) {break;}
  }
  return existing;
}

/** Creates (or updates) one entry and publishes it. */
async function upsert(key, value, locale, current) {
  const fields = current
    ? { ...current.fields, value: { ...current.fields.value, [locale]: value } }
    : { key: { [locale]: key }, value: { [locale]: value } };
  const id = current?.sys.id ?? entryId(key);
  const headers = current
    ? { "X-Contentful-Version": String(current.sys.version) }
    : { "X-Contentful-Content-Type": CONTENT_TYPE };
  const saved = await cma(`/entries/${id}`, { method: "PUT", body: { fields }, headers });
  await cma(`/entries/${id}/published`, { method: "PUT", headers: { "X-Contentful-Version": String(saved.sys.version) } });
}

async function push() {
  const update = flags.includes("--update");
  const locales = (await cma("/locales")).items;
  const locale = locales.find((l) => l.default)?.code ?? "en-US";
  const messages = JSON.parse(readFileSync(join(ROOT, `src/i18n/translations/${locale}.json`), "utf8"));
  const existing = await loadExisting(locale);

  const counts = { created: 0, updated: 0 };
  for (const [key, value] of Object.entries(messages)) {
    const current = existing.get(key);
    const unchanged = current && (!update || current.fields.value?.[locale] === value);
    if (unchanged) {continue;}
    await upsert(key, value, locale, current); // NOSONAR: sequential on purpose — Contentful Management API rate limit
    counts[current ? "updated" : "created"] += 1;
  }
  const untouched = Object.keys(messages).length - counts.created - counts.updated;
  console.info(`Pushed ${locale}: ${counts.created} created, ${counts.updated} updated, ${untouched} unchanged.`);
}

const COMMANDS = { setup, push };
if (!COMMANDS[command]) {
  console.info("Usage: node scripts/contentful-translations.mjs <setup|push> [--update]");
  process.exit(command === "help" ? 0 : 1);
}
await COMMANDS[command]();
