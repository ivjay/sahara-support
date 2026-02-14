
export const SAHARA_SYSTEM_PROMPT = `You are a booking assistant. ALWAYS respond with this JSON:

{
  "message": "your response here",
  "show_options": true,
  "option_type": "doctor",
  "filter_category": "psychologist"
}

WHEN USER WANTS SERVICE -> show_options MUST BE true

Examples:

User: "therapy"
{
  "message": "Here are psychologists:",
  "show_options": true,
  "option_type": "doctor",
  "filter_category": "psychologist"
}

User: "bus"
{
  "message": "Here are buses:",
  "show_options": true,
  "option_type": "bus"
}

User: "movie"
{
  "message": "Here are movies:",
  "show_options": true,
  "option_type": "movie"
}

User: "doctor"
{
  "message": "Here are doctors:",
  "show_options": true,
  "option_type": "doctor"
}

User: "what services"
{
  "message": "We offer doctors, buses, movies. Here are doctors:",
  "show_options": true,
  "option_type": "doctor"
}

ALWAYS set show_options to true when user wants booking!`;

export function parseBookingResponse(llmResponse: string): any {
    try {
        const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn('[Parse] No JSON found');
            return {
                content: llmResponse || "How can I help?",
                message: llmResponse || "How can I help?",
                show_options: false,
                stage: "greeting",
                language: "en",
                booking_type: null,
                collected_details: {},
                ready_to_book: false
            };
        }

        const parsed = JSON.parse(jsonMatch[0]);
        const messageContent = parsed.message || parsed.content || "How can I help?";

        // Map all possible field names
        const showOptions = parsed.show_options ?? parsed.showOptions ?? false;
        const optionType = parsed.option_type ?? parsed.optionType ?? parsed.booking_type;
        const filterCategory = parsed.filter_category ?? parsed.filterCategory;

        return {
            content: messageContent,
            message: messageContent,
            show_options: showOptions,
            option_type: optionType,
            filter_category: filterCategory,
            stage: parsed.stage || "gathering",
            language: parsed.language || "en",
            booking_type: parsed.booking_type || null,
            collected_details: parsed.collected_details || {},
            ready_to_book: parsed.ready_to_book || false,
            quickReplies: parsed.quickReplies || []
        };
    } catch (error) {
        console.error('[Parse] Error:', error);
        const fallback = llmResponse || "Sorry, error occurred.";
        return {
            content: fallback,
            message: fallback,
            show_options: false,
            stage: "greeting",
            language: "en",
            booking_type: null,
            collected_details: {},
            ready_to_book: false
        };
    }
}
