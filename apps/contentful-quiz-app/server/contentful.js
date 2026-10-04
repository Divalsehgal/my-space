import crypto from 'crypto';
import { HTTP_STATUS } from './http.js';

const MS_PER_SECOND = 1000;
/** Contentful's Management API allows ~7 requests/second; space calls out by this much. */
const MIN_REQUEST_INTERVAL_MS = 200;
const MAX_RETRIES = 5;
/** Exponential backoff base: 500ms, 1s, 2s… */
const RETRY_BASE_DELAY_MS = 500;
/** Extra wait on top of Contentful's rate-limit reset hint. */
const RETRY_AFTER_PADDING_MS = 100;
const SHORT_ID_LENGTH = 8;

export const getContentfulConfig = () => {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT_ID || 'master';
  if (!spaceId || !accessToken) {
    throw new Error('Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN in apps/contentful-quiz-app/.env.');
  }
  return { spaceId, accessToken, environmentId };
};

export const createRichText = (text) => ({
  nodeType: 'document',
  data: {},
  content: [{
    nodeType: 'paragraph',
    data: {},
    content: [{ nodeType: 'text', value: text, marks: [], data: {} }],
  }],
});

export const createEntryLink = (id) => ({ sys: { type: 'Link', linkType: 'Entry', id } });

export const shortId = () => crypto.randomUUID().slice(0, SHORT_ID_LENGTH);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const backoff = (attempt) => RETRY_BASE_DELAY_MS * 2 ** attempt;

// Every request is funneled through this chain so calls never fire in
// parallel bursts, which triggered "too many requests" errors whenever more
// than one question was generated at a time.
let requestChain = Promise.resolve();

function paced(fn) {
  const run = requestChain.then(async () => {
    try {
      return await fn();
    } finally {
      await sleep(MIN_REQUEST_INTERVAL_MS);
    }
  });
  // Keep the chain alive even if this call fails, so later calls still pace correctly.
  requestChain = run.then(() => undefined, () => undefined);
  return run;
}

/** Wait before retrying a rate-limited or failed response, honouring Contentful's reset hint. */
function retryDelay(response, attempt) {
  const header = response.headers.get('x-contentful-ratelimit-reset') || response.headers.get('retry-after');
  const seconds = header ? Number(header) : NaN;
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * MS_PER_SECOND + RETRY_AFTER_PADDING_MS : backoff(attempt);
}

const isRetryable = (response) =>
  response.status === HTTP_STATUS.TOO_MANY_REQUESTS || response.status >= HTTP_STATUS.INTERNAL_SERVER_ERROR;

async function fetchWithRetries(url, init) {
  for (let attempt = 0; ; attempt += 1) {
    let response;
    try {
      response = await fetch(url, init);
    } catch (networkError) {
      // Transient DNS/connection blips, not Contentful errors - retry the same way.
      if (attempt >= MAX_RETRIES) {throw networkError;}
      await sleep(backoff(attempt));
      continue;
    }
    if (!isRetryable(response) || attempt >= MAX_RETRIES) {return response;}
    await sleep(retryDelay(response, attempt));
  }
}

/** Management API call: paced, retried on 429/5xx, JSON in and out. */
export function contentfulRequest(config, urlPath, options = {}) {
  return paced(async () => {
    const response = await fetchWithRetries(
      `https://api.contentful.com/spaces/${config.spaceId}/environments/${config.environmentId}${urlPath}`,
      {
        ...options,
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/vnd.contentful.management.v1+json',
          ...options.headers,
        },
      },
    );
    const body = await response.text();
    const data = body ? JSON.parse(body) : null;
    if (!response.ok) {
      throw new Error(`Contentful request failed (${response.status}): ${data?.message || body || response.statusText}`);
    }
    return data;
  });
}

export const createEntry = (config, contentTypeId, fields) =>
  contentfulRequest(config, '/entries', {
    method: 'POST',
    headers: { 'X-Contentful-Content-Type': contentTypeId },
    body: JSON.stringify({ fields }),
  });

export const publishEntry = (config, entry) =>
  contentfulRequest(config, `/entries/${entry.sys.id}/published`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(entry.sys.version) },
    body: JSON.stringify({}),
  });
