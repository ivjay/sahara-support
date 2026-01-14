"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_MOVIE_OPTIONS,
    INTENT_KEYWORDS
} from "@/lib/chat/mock-data";
import { BookingOption, BookingState } from "@/lib/chat/types";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Construct the Knowledge Base string
const KNOWLEDGE_BASE = `
You are Sahara, a helpful and empathetic AI support assistant. Your goal is to help users with:
1. Bus Bookings (Kathmandu <-> Pokhara routes mainly)
2. Flight Search (Domestic flights in Nepal)
3. Doctor Appointments
4. Movie Ticket Bookings

Here is your currently available inventory (Knowledge Base):
${JSON.stringify({
    buses: MOCK_BUS_OPTIONS,
    flights: MOCK_FLIGHT_OPTIONS,
    appointments: MOCK_APPOINTMENT_OPTIONS,
    movies: MOCK_MOVIE_OPTIONS
}, null, 2)}

Your Logic Rules:
1. **Understand Intent**: Analyze what the user wants. If they are just saying "hi", greet them warmly.
2. **Missing Information**: If the user wants to book something but hasn't provided enough info (e.g., "I want to go to Pokhara" but didn't say if by bus or flight), ASK clarifying questions.
3. **Show Options**: ONLY when you have enough information and valid options exist in your Knowledge Base, you MUST trigger the UI to show them.
4. **Tone**: Be helpful, polite, and clear. Use emojis.

Response Format:
You must output a JSON object ONLY. Do not include markdown formatting like \`\`\`json.
Structure:
{
  "content": "Your text response to the user here.",
  "showOptions": "BUS_BOOKING" | "FLIGHT_BOOKING" | "APPOINTMENT" | "MOVIE_BOOKING" | null,
  "quickReplies": ["Reply 1", "Reply 2", ...]
}

Example 1 (User: "I want a bus to Pokhara"):
{
  "content": "I can help with that! We have several buses leaving for Pokhara tomorrow. Here are the best options:",
  "showOptions": "BUS_BOOKING",
  "quickReplies": ["Cheapest option", "Morning departure"]
}

Example 2 (User: "Hi"):
{
  "content": "Namaste! 🙏 I'm Sahara. How can I help you today? I can assist with bus tickets, flights, doctor appointments, or movies.",
  "showOptions": null,
  "quickReplies": ["Book a bus", "Find a flight", "Doctor appointment"]
}
`;

export interface AgentResponseAPIType {
    content: string;
    showOptions?: "BUS_BOOKING" | "FLIGHT_BOOKING" | "APPOINTMENT" | "MOVIE_BOOKING" | null;
    quickReplies?: string[];
}

export async function getAgentResponse(
    message: string,
    history: { role: "user" | "model"; parts: string }[] = []
): Promise<AgentResponseAPIType> {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: KNOWLEDGE_BASE }]
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I am Sahara, ready to assist based on the knowledge base and rules provided." }]
                },
                ...history.map(h => ({
                    role: h.role,
                    parts: [{ text: h.parts }]
                }))
            ],
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        try {
            const parsed = JSON.parse(responseText);
            return parsed;
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return {
                content: "I'm having a little trouble connecting right now. Could you say that again?",
                showOptions: null,
                quickReplies: ["Try again"]
            };
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        return {
            content: "Sorry, I'm currently offline. Please try again later.",
            showOptions: null,
            quickReplies: []
        };
    }
}
