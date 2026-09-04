require('dotenv').config({ path: './apps/web/.env' });
const { ContentfulMcpTools } = require('./contentful-mcp-server/packages/mcp-tools/dist/index.js');

async function main() {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_MANAGEMENT_ACCESS_TOKEN;
  const environmentId = process.env.ENVIRONMENT_ID || 'master';

  console.log(`Using spaceId: ${spaceId}, environmentId: ${environmentId}`);

  const tools = new ContentfulMcpTools({
    spaceId,
    accessToken: accessToken, // management token
    environmentId,
  });

  // Get the content type tools
  const contentTypeTools = tools.getContentTypeTools();
  console.log('Available content type tools:', Object.keys(contentTypeTools));

  try {
    console.log('Listing content types...');
    // The tool is under contentTypeTools.listContentTypes.tool
    const contentTypesResponse = await contentTypeTools.listContentTypes.tool({
      spaceId,
      environmentId,
    });
    console.log('Response:', JSON.stringify(contentTypesResponse, null, 2));

    // If successful, parse the response to get the content types
    if (!contentTypesResponse.isError) {
      // The response structure might be different, but let's assume it has a .content array with text
      // We'll need to parse the text to get the JSON. However, the tool returns a formatted string.
      // Let's look at the response format from the inspect-spaces2.js: it returns a text array with a string.
      // We'll need to extract the JSON from that string if it's wrapped.
      // For now, let's just log the response and then try to get the Quiz and Question by name.

      // We'll try to get the content types by iterating over the items in the response.
      // But note: the response might not be in the same format as we expect.
      // Let's first check if the response is a string that contains JSON.

      // Since we are having trouble with the structure, let's try to get the Quiz and Question directly by name if we know them.
      // But we don't know the sys.id yet.

      // Alternatively, we can try to get the content type for Quiz and Question by name if the tool supports filtering by name.
      // However, the list_content_types tool doesn't have a name filter.

      // Let's try to get all content types and then filter by name in the client.

      // We'll assume the response is in the format: { content: [{ type: 'text', text: '...' }] }
      // and the text is a string that contains the JSON.

      // For now, let's just output the response and then we can adjust.

      console.log('Raw response text:', contentTypesResponse.content[0].text);
    }
  } catch (error) {
    console.error('Error:', error.response || error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

main();
