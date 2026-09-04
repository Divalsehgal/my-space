require('dotenv').config({ path: './apps/web/.env' });
console.log('CONTENTFUL_SPACE_ID:', process.env.CONTENTFUL_SPACE_ID);
console.log('CONTENTFUL_ACCESS_TOKEN:', process.env.CONTENTFUL_ACCESS_TOKEN ? 'present' : 'missing');
console.log('CONTENTFUL_PREVIEW_ACCESS_TOKEN:', process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN ? 'present' : 'missing');