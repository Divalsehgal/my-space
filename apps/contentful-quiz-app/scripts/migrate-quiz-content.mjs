import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const environmentId = process.env.CONTENTFUL_ENVIRONMENT_ID || 'master';
const fallbackLocale = process.env.CONTENTFUL_LOCALE || 'en-US';

if (!spaceId || !accessToken) {
  throw new Error('Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN in apps/contentful-quiz-app/.env.');
}

const baseUrl = `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}`;

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/vnd.contentful.management.v1+json',
      ...options.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${pathname} failed: ${body?.message || text}`);
  return body;
}

async function updateEntry(entry) {
  const updated = await request(`/entries/${entry.sys.id}`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(entry.sys.version) },
    body: JSON.stringify({ fields: entry.fields }),
  });
  return request(`/entries/${entry.sys.id}/published`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(updated.sys.version) },
    body: JSON.stringify({}),
  });
}

function textFromRichText(document) {
  if (!document || typeof document !== 'object') return '';
  if (typeof document.value === 'string') return document.value;
  return (document.content || []).map(textFromRichText).join(' ');
}

async function updateContentType(contentTypeId, transform) {
  const contentType = await request(`/content_types/${contentTypeId}`);
  const fields = transform(contentType.fields);
  const updated = await request(`/content_types/${contentTypeId}`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(contentType.sys.version) },
    body: JSON.stringify({
      ...contentType,
      fields,
      ...(contentTypeId === 'quizOption' ? { displayField: 'key' } : {}),
    }),
  });
  await request(`/content_types/${contentTypeId}/published`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(updated.sys.version) },
    body: JSON.stringify({}),
  });
}

// The JSON field is retained in Contentful for backwards safety, but omitted so editors
// only see the Questions reference field managed by the custom app.
await updateContentType('quizComponent', (fields) => fields.map((field) =>
  field.id === 'questions' ? { ...field, omitted: true } : field
));

// Key is the readable option label. It is not a global identifier.
// Question Title is superseded by Key and omitted from the editor.
await updateContentType('quizOption', (fields) => fields.map((field) =>
  field.id === 'key'
    ? { ...field, validations: (field.validations || []).filter((validation) => !validation.unique) }
    : field.id === 'questionTitle' ? { ...field, omitted: true } : field
));

const questionResponse = await request('/entries?content_type=questionComponent&limit=1000');
let updatedOptions = 0;

for (const question of questionResponse.items || []) {
  const locale = Object.keys(question.fields.questionText || {})[0] || fallbackLocale;
  const questionText = textFromRichText(question.fields.questionText?.[locale]).replace(/\s+/g, ' ').trim();
  const optionLinks = question.fields.options?.[locale] || [];

  for (const [optionIndex, link] of optionLinks.entries()) {
    const option = await request(`/entries/${link.sys.id}`);
    const optionLocale = Object.keys(option.fields.text || {})[0] || locale;
    const optionText = textFromRichText(option.fields.text?.[optionLocale]).replace(/\s+/g, ' ').trim();
    if (!questionText || !optionText) continue;

    const optionLabel = `Option ${String.fromCharCode(65 + optionIndex)}`;
    option.fields.key = { [optionLocale]: `${questionText} — ${optionLabel}` };
    await updateEntry(option);
    updatedOptions += 1;
  }
}

console.log(`Legacy Questions field omitted. Updated and published ${updatedOptions} option label(s).`);
