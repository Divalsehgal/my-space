require('dotenv').config({ path: './apps/web/.env' });
const { GraphQLClient } = require('graphql-request');

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;

if (!spaceId || !accessToken) {
  console.error('Missing CONTENTFUL_SPACE_ID or CONTENTFUL_ACCESS_TOKEN in apps/web/.env');
  process.exit(1);
}

const endpoint = `https://graphql.contentful.com/content/v1/spaces/${spaceId}`;

const client = new GraphQLClient(endpoint, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

const introspectionQuery = `
  {
    __schema {
      types {
        name
        kind
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
        }
      }
    }
  }
`;

async function main() {
  try {
    const data = await client.request(introspectionQuery);
    // Find the QuizComponent type
    const quizComponentType = data.__schema.types.find(type => type.name === 'QuizComponent');
    if (!quizComponentType) {
      console.log('QuizComponent type not found in schema');
      return;
    }
    console.log('QuizComponent fields:');
    quizComponentType.fields.forEach(field => {
      console.log(`  ${field.name}: ${field.type.name} ${field.type.kind === 'LIST' ? '[]' : ''}`);
      if (field.type.kind === 'OBJECT' || field.type.kind === 'SCALAR' || field.type.kind === 'NON_NULL') {
        // We can try to get more details about the type if needed
      }
    });

    // Similarly for QuestionComponent
    const questionComponentType = data.__schema.types.find(type => type.name === 'QuestionComponent');
    if (!questionComponentType) {
      console.log('QuestionComponent type not found in schema');
      return;
    }
    console.log('\\nQuestionComponent fields:');
    questionComponentType.fields.forEach(field => {
      console.log(`  ${field.name}: ${field.type.name} ${field.type.kind === 'LIST' ? '[]' : ''}`);
    });

    // And for QuizOption
    const quizOptionType = data.__schema.types.find(type => type.name === 'QuizOption');
    if (!quizOptionType) {
      console.log('QuizOption type not found in schema');
      return;
    }
    console.log('\\nQuizOption fields:');
    quizOptionType.fields.forEach(field => {
      console.log(`  ${field.name}: ${field.type.name} ${field.type.kind === 'LIST' ? '[]' : ''}`);
    });

    // And for BlogPage
    const blogPageType = data.__schema.types.find(type => type.name === 'BlogPage');
    if (!blogPageType) {
      console.log('BlogPage type not found in schema');
      return;
    }
    console.log('\\nBlogPage fields:');
    blogPageType.fields.forEach(field => {
      console.log(`  ${field.name}: ${field.type.name} ${field.type.kind === 'LIST' ? '[]' : ''}`);
    });

  } catch (error) {
    console.error('Error introspecting schema:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

main();