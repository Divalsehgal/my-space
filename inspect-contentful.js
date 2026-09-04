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
    console.log('Searching for entries (limit 100)...');
    const searchResponse = await entryTools.searchEntries.tool({
      spaceId,
      environmentId,
      query: {
        limit: 100,
      },
    });
    console.log('Search response:', JSON.stringify(searchResponse, null, 2));
    if (!searchResponse.isError) {
      // The response is a text array, we need to parse the text.
      const text = searchResponse.content[0].text;
      console.log('Raw text:', text);
      // Try to parse as JSON
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.log('Text is not JSON, maybe it\'s a formatted string.');
        // Maybe the text is a string that contains JSON? Let's look for {.
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart >= 0 && jsonEnd >= 0) {
          const jsonStr = text.substring(jsonStart, jsonEnd + 1);
          try {
            json = JSON.parse(jsonStr);
            console.log('Parsed JSON from substring:', json);
          } catch (e2) {
            console.log('Could not parse JSON from substring.');
          }
        }
      }
      if (json && json.items) {
        console.log('Found items:', json.items.length);
        // Group by content type
        const typeMap = {};
        json.items.forEach(item => {
          const typeId = item.sys.contentType.sys.id;
          if (!typeMap[typeId]) {
            typeMap[typeId] = 0;
          }
          typeMap[typeId]++;
        });
        console.log('Content type counts:', typeMap);
        // Also, let's look at the first few items to see their fields
        console.log('First item:', JSON.stringify(json.items[0], null, 2));
        // If there are more items, show a second one for comparison
        if (json.items.length > 1) {
          console.log('Second item:', JSON.stringify(json.items[1], null, 2));
        }
      }
    }
  } catch (error) {
    console.error('Error searching entries:', error.response || error.message);
  }
}

main();