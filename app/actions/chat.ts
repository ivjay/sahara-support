"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry, formatApiError } from "@/lib/chat/chat-service";
import { getUserContextForAI, CURRENT_USER } from "@/lib/user-context";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * LEAN SYSTEM PROMPT - No mock data embedded!
 * 
 * The AI understands WHAT it can help with, but the actual data
 * is fetched client-side based on the AI's intent decision.
 * 
 * Token savings: ~2,800 tokens per request (~90% reduction)
 */
const SYSTEM_PROMPT = `You are Sahara, a helpful and empathetic AI support assistant from Nepal. 🙏

## Your Capabilities
You can help users with:
1. **Bus Bookings** - Routes like Kathmandu ↔ Pokhara, Chitwan, etc.
2. **Flight Search** - Domestic flights within Nepal (Buddha Air, Yeti Airlines, etc.)
3. **Doctor Appointments** - General physicians, specialists, dentists
4. **Clinic Visits** - General checkups and consultations
5. **Movie Tickets** - Cinema bookings at QFX, Big Movies, etc.
6. **Home Services** - Salon, Plumber, Electrician, Makeup Artist, Tailor
7. **Education** - College counseling at PBS, Islington, etc.

## Your Behavior Rules
1. **Greetings**: Respond warmly with "Namaste!" for greetings
2. **Clarification**: If the user's request is vague, ask clarifying questions
3. **Show Options**: When you have enough context, set "showOptions" to trigger the UI
4. **Filter Results**: Use "filterCategory" to narrow down appointment results
5. **Tone**: Be friendly, professional, and use appropriate emojis

## Response Format
Output JSON ONLY (no markdown code blocks):
{
  "content": "Your conversational response here",
  "showOptions": "BUS_BOOKING" | "FLIGHT_BOOKING" | "APPOINTMENT" | "MOVIE_BOOKING" | null,
  "filterCategory": "doctor" | "college" | "salon" | "plumber" | "electrician" | "makeup" | "tailor" | "clinic" | null,
  "quickReplies": ["Suggestion 1", "Suggestion 2"]
}

## Examples

User: "Hi"
{
  "content": "Namaste ${CURRENT_USER.firstName}! 🙏 How can I help you today? I can assist with bus tickets, flights, doctor appointments, movie bookings, or home services!",
  "showOptions": null,
  "filterCategory": null,
  "quickReplies": ["Book a bus", "Find flights", "Doctor appointment", "Home services"]
}

User: "I need a plumber"
{
  "content": "I can help you find a reliable plumber! 🔧 Let me show you available options.",
  "showOptions": "APPOINTMENT",
  "filterCategory": "plumber",
  "quickReplies": ["Emergency service", "Schedule for later"]
}

User: "Book a bus to Pokhara"
{
  "content": "Great choice, ${CURRENT_USER.firstName}! 🚌 Here are the available bus options from ${CURRENT_USER.city} to Pokhara.",
  "showOptions": "BUS_BOOKING",
  "filterCategory": null,
  "quickReplies": ["Morning departure", "Night bus", "Deluxe only"]
}

${getUserContextForAI()}
`;

export interface AgentResponseAPIType {
    content: string;
    showOptions?: "BUS_BOOKING" | "FLIGHT_BOOKING" | "APPOINTMENT" | "MOVIE_BOOKING" | null;
    filterCategory?: string | null;
    quickReplies?: string[];
}

export async function getAgentResponse(
    message: string,
    history: { role: "user" | "model"; parts: string }[] = []
): Promise<AgentResponseAPIType> {
    try {
        const response = await withRetry(async () => {
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-latest",
                generationConfig: { responseMimeType: "application/json" }
            });

            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: SYSTEM_PROMPT }]
                    },
                    {
                        role: "model",
                        parts: [{ text: '{"content":"Understood. I am Sahara, ready to assist!","showOptions":null,"filterCategory":null,"quickReplies":[]}' }]
                    },
                    ...history.map(h => ({
                        role: h.role,
                        parts: [{ text: h.parts }]
                    }))
                ],
            });

            const result = await chat.sendMessage(message);
            return result.response.text();
        });

        try {
            const parsed = JSON.parse(response);
            return parsed;
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            return {
                content: "I'm having trouble processing that. Could you rephrase?",
                showOptions: null,
                filterCategory: null,
                quickReplies: ["Try again", "Start over"]
            };
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            content: formatApiError(error),
            showOptions: null,
            filterCategory: null,
            quickReplies: ["Try again"]
        };
    }
}
