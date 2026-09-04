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
    // Filter for types that are OBJECT and have a field named 'sys' of type Object
    const contentTypes = data.__schema.types
      .filter(type => type.kind === 'OBJECT')
      .filter(type => {
        // Look for a field named 'sys'
        const sysField = type.fields.find(field => field.name === 'sys');
        if (!sysField) return false;
        // The sys field should be an Object (or maybe a Link? Actually, in Contentful, sys is an object)
        // We'll just check that the type of sys is not null.
        return sysField.type.kind === 'OBJECT' || sysField.type.kind === 'SCALAR' || sysField.type.kind === 'NON_NULL';
      })
      .map(type => type.name);

    console.log('Possible content types (based on having a sys field):');
    console.log(contentTypes);

    // Now, let's try to get the actual content type IDs by looking at the root fields that end with 'Collection'
    const rootFields = data.__schema.types
      .find(type => type.name === 'Query')
      .fields
      .map(field => field.name)
      .filter(field => field.endsWith('Collection'));

    console.log('Root collection fields (likely content types):');
    console.log(rootFields);

    // For each root collection field, we can try to get the content type ID by making a request for one item and looking at the sys.contentType.sys.id
    // But we can also infer from the field name: in Contentful, the GraphQL field name is the content type ID in camelCase? Not exactly.
    // Let's try to get one entry for each collection field and see the content type ID.

    for (const field of rootFields) {
      try {
        const query = `
          {
            ${field}(limit: 1) {
              items {
                sys {
                  id
                  contentType {
                    sys {
                      id
                    }
                  }
                }
              }
            }
          }
        `;
        const result = await client.request(query);
        const items = result[field]?.items;
        if (items && items.length > 0) {
          const contentTypeId = items[0].sys.contentType.sys.id;
          console.log(`Field ${field} -> Content Type ID: ${contentTypeId}`);
        } else {
          console.log(`Field ${field} -> No items found`);
        }
      } catch (error) {
        console.error(`Error querying field ${field}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error introspecting schema:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

main();