import type { CodegenConfig } from '@graphql-codegen/cli';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      [`https://graphql.contentful.com/content/v1/spaces/${spaceId}`]: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    },
  ],
  documents: 'src/lib/graphql/**/*.gql',
  generates: {
    'src/lib/graphql/generated/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        fragmentMasking: false,
      },
    },
  },
};

export default config;
