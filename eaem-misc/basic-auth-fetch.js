const fetch = require('node-fetch');
const https = require('https');
const fs = require('fs');

// Configuration
// Usage: node basic-auth-fetch.js [username] [password] [baseUrl]
const config = {
  username: process.argv[2] || process.env.AUTH_USERNAME,
  password: process.argv[3] || process.env.AUTH_PASSWORD,
  baseUrl: process.argv[4] || process.env.BASE_URL || 'https://100.26.74.229',
  queryPath: '/bin/querybuilder.json?path=/content&type=cq:Page&p.limit=-1&path.flat=true',
};

/**
 * Make request with basic auth using fetch
 */
async function fetchWithAuth(url, username, password) {
  // Create basic auth header
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  
  // Create agent to handle self-signed certificates
  const agent = new https.Agent({
    rejectUnauthorized: false, // For development only!
  });

  console.log(`Fetching: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'User-Agent': 'Node.js Fetch Client',
    },
    agent,
  });

  return response;
}

async function main() {
  try {
    const fullUrl = config.baseUrl + config.queryPath;
    
    const response = await fetchWithAuth(
      fullUrl,
      config.username,
      config.password
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract and list all paths
    const paths = [];
    
    if (data.hits && Array.isArray(data.hits)) {
      data.hits.forEach((hit) => {
        if (hit.path) {
          paths.push(hit.path);
        }
      });
    }

    if (paths.length === 0) {
      console.log('No pages found.');
      return;
    }

    console.log(`=== Paths Found: ${paths.length} ===\n`);

    let grandTotal = 0;
    
    // Initialize CSV file
    const csvFile = 'page-counts.csv';
    fs.writeFileSync(csvFile, 'Path,Count\n', 'utf8');

    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      const queryUrl = `${config.baseUrl}/bin/querybuilder.json?path=${encodeURIComponent(path)}&type=cq:Page&p.limit=-1`;
      
      try {
        console.log(`${i + 1}. Querying: ${path}`);
        
        const pathResponse = await fetchWithAuth(
          queryUrl,
          config.username,
          config.password
        );

        if (pathResponse.ok) {
          const pathData = await pathResponse.json();
          const total = pathData.results || 0;
          grandTotal += total;
          console.log(`Total pages under this path: ${total}\n`);
          
          // Write to CSV
          fs.appendFileSync(csvFile, `"${path}",${total}\n`, 'utf8');
        } else {
          console.log(`   ⚠️ Error: ${pathResponse.status} ${pathResponse.statusText}\n`);
        }
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}\n`);
      }
    }

    console.log(`\n=== Summary ===`);
    console.log(`Total paths queried: ${paths.length}`);
    console.log(`Grand Total (sum of all paths): ${grandTotal} pages`);
    console.log(`CSV file saved: ${csvFile}`);
    console.log(`\n✅ Completed`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchWithAuth };
