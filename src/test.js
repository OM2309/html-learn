import http from 'http';

const sendStream = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    console.log(`\n--- Calling ${method} ${path} ---`);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {}
    };

    let postData = '';
    if (body) {
      postData = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let fullProposal = '';

      res.on('data', (chunk) => {
        const text = chunk.toString();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.chunk) {
                process.stdout.write(data.chunk);
                fullProposal += data.chunk;
              } else if (data.error) {
                console.error('\nStream Error:', data.error);
                reject(new Error(data.error));
              }
            } catch (err) {
              // Ignore line parsing error
            }
          }
        }
      });

      res.on('end', () => {
        console.log('\n--- Stream Finished ---');
        resolve(fullProposal);
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(postData);
    }
    req.end();
  });
};

const sendPost = (path, body) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n--- Calling POST ${path} ---`);
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const runTest = async () => {
  try {
    const prompt = "I want a user login service using token authentication.";

    // Step 1: Stream initial proposal (POST)
    const initialProposal = await sendStream('/api/prd/propose', 'POST', { prompt });

    if (!initialProposal) {
      throw new Error('Initial proposal streaming returned empty content');
    }

    // Step 2: Refine the proposal with feedback (POST)
    const refinedProposal = await sendStream('/api/prd/propose', 'POST', {
      prompt: "Please suggest session cookie authentication instead of JWT tokens.",
      previousProposal: initialProposal
    });

    if (!refinedProposal) {
      throw new Error('Refined proposal streaming returned empty content');
    }

    // Step 3: Confirm refined proposal and generate final PRD JSON (POST)
    const generateRes = await sendPost('/api/prd/generate', { proposal: refinedProposal });
    console.log('Status Code:', generateRes.status);
    console.log('Final generated PRD saved in DB:\n', JSON.stringify(generateRes.data, null, 2));

    if (generateRes.status !== 201) {
      throw new Error('Generation step failed');
    }

    console.log('\nSuccess: Full conversational proposal, refinement, and PRD generation verified!');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
};

runTest();
