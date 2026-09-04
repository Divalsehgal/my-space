import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
const environmentId = process.env.CONTENTFUL_ENVIRONMENT_ID || 'master';

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

const quizQuestionEntries = {
  id: 'questionEntries',
  name: 'Questions',
  type: 'Array',
  required: false,
  localized: false,
  validations: [{ size: { min: 1 } }],
  items: {
    type: 'Link',
    linkType: 'Entry',
    validations: [{ linkContentType: ['questionComponent'] }],
  },
};

const blogQuiz = {
  id: 'quiz',
  name: 'Quiz',
  type: 'Link',
  linkType: 'Entry',
  required: false,
  localized: false,
  validations: [{ linkContentType: ['quizComponent'] }],
};

async function addField(contentTypeId, field) {
  const contentType = await request(`/content_types/${contentTypeId}`);
  const fields = contentType.fields.some((current) => current.id === field.id)
    ? contentType.fields
    : [...contentType.fields, field];

  if (fields === contentType.fields) {
    console.log(`${contentTypeId}.${field.id} already exists.`);
    return;
  }

  const updated = await request(`/content_types/${contentTypeId}`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(contentType.sys.version) },
    body: JSON.stringify({ ...contentType, fields }),
  });

  await request(`/content_types/${contentTypeId}/published`, {
    method: 'PUT',
    headers: { 'X-Contentful-Version': String(updated.sys.version) },
    body: JSON.stringify({}),
  });
  console.log(`Added and published ${contentTypeId}.${field.id}.`);
}

await addField('quizComponent', quizQuestionEntries);
await addField('blogPage', blogQuiz);
