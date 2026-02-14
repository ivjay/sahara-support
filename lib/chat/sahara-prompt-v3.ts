
export const SAHARA_SYSTEM_PROMPT = `You are Sahara, a booking assistant.

CRITICAL RULE: When user wants ANY service, you MUST set show_options: true

RESPONSE FORMAT (MUST BE VALID JSON):
{
  "message": "friendly message",
  "show_options": true,
  "option_type": "doctor",
  "filter_category": "psychologist"
}

EXAMPLES:

User: "I need therapy"
Response: {
  "message": "I understand. Here are psychologists who can help:",
  "show_options": true,
  "option_type": "doctor",
  "filter_category": "psychologist"
}

User: "feeling anxious"
Response: {
  "message": "I can help connect you with mental health professionals:",
  "show_options": true,
  "option_type": "doctor",
  "filter_category": "psychologist"
}

User: "child doctor"
Response: {
  "message": "Here are pediatricians available:",
  "show_options": true,
  "option_type": "doctor",
  "filter_category": "pediatrician"
}

User: "what services do you offer"
Response: {
  "message": "We offer doctors, buses, movies. Here are some doctors:",
  "show_options": true,
  "option_type": "doctor"
}

User: "I need a doctor"
Response: {
  "message": "Here are available doctors:",
  "show_options": true,
  "option_type": "doctor"
}

User: "book bus"
Response: {
  "message": "Here are available buses:",
  "show_options": true,
  "option_type": "bus"
}

User: "movie"
Response: {
  "message": "Here are movies showing:",
  "show_options": true,
  "option_type": "movie"
}

REMEMBER: show_options MUST ALWAYS BE true when user wants service!

Response format:
{
  "message": string,
  "show_options": boolean,
  "option_type": "doctor" | "bus" | "flight" | "movie",
  "filter_category": string (optional),
  "stage": "greeting" | "gathering" | "confirming" | "completed",
  "language": "en" | "ne",
  "booking_type": string | null,
  "collected_details": {},
  "ready_to_book": boolean
}`;

export function parseBookingResponse(llmResponse: string): any {
    try {
        // Extract JSON from response
        const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('[Parse] No JSON found, creating default');
            return {
                content: llmResponse || "I'm here to help!",
                message: llmResponse || "I'm here to help!",
                show_options: false,
                stage: "greeting",
                language: "en",
                booking_type: null,
                collected_details: {},
                ready_to_book: false
            };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Ensure show_options is explicitly set
        if (parsed.show_options === undefined || parsed.show_options === null) {
            parsed.show_options = false;
        }

        const messageContent = parsed.message || parsed.content || "How can I help?";

        return {
            content: messageContent,
            message: messageContent,
            show_options: parsed.show_options,
            option_type: parsed.option_type,
            filter_category: parsed.filter_category,
            stage: parsed.stage || "gathering",
            language: parsed.language || "en",
            booking_type: parsed.booking_type || null,
            collected_details: parsed.collected_details || {},
            ready_to_book: parsed.ready_to_book || false,
            quickReplies: parsed.quickReplies || []
        };
    } catch (error) {
        console.error('[Parse] JSON parse error:', error);
        const fallbackMessage = llmResponse || "Sorry, I couldn't process that.";
        return {
            content: fallbackMessage,
            message: fallbackMessage,
            show_options: false,
            stage: "greeting",
            language: "en",
            booking_type: null,
            collected_details: {},
            ready_to_book: false
        };
    }
}

function detectLanguage(text: string): "en" | "ne" {
    const nepaliWords = ['tapai', 'malai', 'cha', 'chaina', 'hajur', 'dhanyabad'];
    const lowerText = text.toLowerCase();
    return nepaliWords.some(word => lowerText.includes(word)) ? 'ne' : 'en';
}
