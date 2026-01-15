
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

// Load env vars
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("No API key found in .env.local");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        // Unfortunately the Node SDK doesn't expose listModels directly easily on the factory,
        // but we can try a basic model and print info, or use the model manager if accessible.
        // Actually, let's just try to instantiate a few standard ones and see which one doesn't throw.

        const models = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash-001",
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        console.log("Testing models...");

        for (const modelName of models) {
            console.log(`\nTesting ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hi");
                console.log(`✅ SUCCESS: ${modelName} works!`);
                console.log("Response:", result.response.text().substring(0, 50) + "...");
            } catch (e: any) {
                console.log(`❌ FAILED: ${modelName}`);
                console.log(`Error: ${e.message.split('\n')[0]}`);
            }
        }

    } catch (e) {
        console.error("Fatal error:", e);
    }
}

listModels();
