require('dotenv').config({ path: './contentful-mcp-server/.env' });
const { ContentfulMcpTools } = require('./contentful-mcp-server/packages/mcp-tools/dist/index.js');

async function main() {
  const spaceId = process.env.SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN;
  const environmentId = process.env.ENVIRONMENT_ID || 'master';

  console.log(`Using spaceId: ${spaceId}, environmentId: ${environmentId}`);

  const tools = new ContentfulMcpTools({
    spaceId,
    accessToken: accessToken, // management token
    environmentId,
  });

  // Get the entry tools
  const entryTools = tools.getEntryTools();
  console.log('Available entry tools:', Object.keys(entryTools));

  try {
    console.log('Searching for entries (limit 10)...');
    const searchResponse = await entryTools.searchEntries.tool({
      spaceId,
      environmentId,
      limit: 10,
    });
    console.log('Search response:', JSON.stringify(searchResponse, null, 2));

    if (!searchResponse.isError) {
      console.log('Raw response text:', searchResponse.content[0].text);
    }
  } catch (error) {
    console.error('Error:', error.response || error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

main();