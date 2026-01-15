import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { AgentResponseAPIType } from "@/app/actions/chat";

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
// Using gpt-4o as it's a solid fallback
const modelName = "gpt-4o";

export async function generateContentWithGitHub(
    systemPrompt: string,
    messages: { role: string; content: string }[]
): Promise<string> {
    if (!token) {
        throw new Error("GITHUB_TOKEN is not defined");
    }

    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    // Convert messages to GitHub/OpenAI format
    const formattedMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content
        }))
    ];

    try {
        const response = await client.path("/chat/completions").post({
            body: {
                messages: formattedMessages,
                model: modelName,
                temperature: 0.7,
                max_tokens: 1000,
                response_format: { type: "json_object" } // Enforce JSON
            }
        });

        if (isUnexpected(response)) {
            console.error(response.body);
            throw new Error(`GitHub Models Error: ${response.status}`);
        }

        const content = response.body.choices[0].message.content;
        return content || "";
    } catch (error) {
        console.error("GitHub fallback failed:", error);
        throw error;
    }
}
