const http = require('http');

const testCases = [
    {
        name: "Scenario 1: New contact",
        payload: { email: "lorraine@hillvalley.edu", phoneNumber: "123456" }
    },
    {
        name: "Scenario 2: Existing contact, new email",
        payload: { email: "mcfly@hillvalley.edu", phoneNumber: "123456" }
    },
    {
        name: "Scenario 3: Existing contact, no new info",
        payload: { email: null, phoneNumber: "123456" }
    },
    {
        name: "Scenario 4: Independent primary",
        payload: { email: "doc@hillvalley.edu", phoneNumber: "999999" }
    },
    {
        name: "Scenario 5: Link independent primary to the first cluster",
        payload: { email: "mcfly@hillvalley.edu", phoneNumber: "999999" }
    }
];

async function runTests() {
    for (const tc of testCases) {
        console.log(`\nRunning: ${tc.name}`);
        console.log(`Request:`, tc.payload);

        await new Promise((resolve) => {
            const req = http.request(
                {
                    hostname: 'localhost',
                    port: 3000,
                    path: '/identify',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                },
                (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        console.log(`Response Code: ${res.statusCode}`);
                        console.log(`Response Body:`, JSON.parse(data));
                        resolve(true);
                    });
                }
            );
            req.write(JSON.stringify(tc.payload));
            req.end();
        });

        // slight delay to ensure DB writes are fully settled though it's sync
        await new Promise(r => setTimeout(r, 200));
    }
}

runTests().catch(console.error);
