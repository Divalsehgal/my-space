const { Client } = require("@notionhq/client");

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const databaseId = "25195533-c718-80ca-a3ad-f8796ed075fa";

async function debug() {
  try {
    console.log("\n--- Retrieving database info ---");
    const db = await notion.databases.retrieve({ database_id: databaseId });
    console.log("DB Keys:", Object.keys(db).join(", "));
    if (db.title) {
        console.log("Database Title:", db.title[0]?.plain_text || "No title");
    }
    if (db.properties) {
        console.log("Found properties:", Object.keys(db.properties).join(", "));
    } else {
        console.log("NO PROPERTIES FOUND in db object");
    }
    
    console.log("\n--- Attempting databases.query ---");
    const query = await notion.databases.query({
      database_id: databaseId,
      page_size: 10
    });
    
    console.log("Results count:", query.results.length);
    if (query.results.length > 0) {
        const firstPage = query.results[0];
        console.log("First Page property keys:", Object.keys(firstPage.properties).join(", "));
        
        query.results.forEach((page, i) => {
            // Find the property of type 'title'
            const titleProp = Object.values(page.properties).find(p => p.type === 'title');
            const title = titleProp?.title[0]?.plain_text || "Untitled";
            
            // Find status
            let status = "N/A";
            const sProp = page.properties.Status;
            if (sProp) {
                if (sProp.type === 'status') status = sProp.status.name;
                else if (sProp.type === 'select') status = sProp.select.name;
            }
            
            console.log(`[${i}] Title: ${title}, Status: ${status}, ID: ${page.id}`);
        });
    }

  } catch (error) {
    console.error("Error:", error.message);
    if (error.body) console.error("Detail:", error.body);
    if (error.stack) console.error("Stack:", error.stack);
  }
}

debug();
