
import * as dotenv from "dotenv";
import http from 'http';

// Load env vars
dotenv.config({ path: ".env.local" });

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

console.log(`Checking Ollama at: ${OLLAMA_BASE_URL}`);
console.log(`Target Model: ${OLLAMA_MODEL}`);

async function testOllama() {
    try {
        // 1. Check if Ollama is running
        console.log("\n1. Checking Ollama health...");
        const tags = await new Promise((resolve, reject) => {
            const urlObj = new URL(`${OLLAMA_BASE_URL}/api/tags`);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 80,
                path: urlObj.pathname,
                method: 'GET',
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
            req.on('error', reject);
            req.end();
        });

        console.log("Ollama tags response:", JSON.stringify(tags, null, 2));

        const models = (tags as any).models || [];
        const modelNames = models.map((m: any) => m.name);
        console.log("Available models:", modelNames);

        if (!modelNames.includes(OLLAMA_MODEL) && !modelNames.includes(OLLAMA_MODEL + ":latest")) {
            console.warn(`⚠️ Warning: ${OLLAMA_MODEL} not found in available models.`);
        } else {
            console.log(`✅ ${OLLAMA_MODEL} is available.`);
        }

        // 2. Try a simple chat request
        console.log(`\n2. Testing chat with ${OLLAMA_MODEL}...`);
        const chatResponse = await new Promise((resolve, reject) => {
            const urlObj = new URL(`${OLLAMA_BASE_URL}/api/chat`);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 80,
                path: urlObj.pathname,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            };
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            });
            req.on('error', reject);
            req.write(JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [{ role: 'user', content: 'Say hello!' }],
                stream: false
            }));
            req.end();
        });

        console.log("Chat response:", JSON.stringify(chatResponse, null, 2));

    } catch (error: any) {
        console.error("❌ Ollama test failed:");
        console.error(error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error("Connection refused. Is Ollama actually running?");
        }
    }
}

testOllama();
