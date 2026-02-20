/**
 * Search Intent Extractor
 * Extracts structured filters from natural language for hybrid search
 */

import { chat } from '@/lib/integrations/ollama-service';
import type { SearchFilters } from './hybrid-search';

export interface SearchIntent {
    searchQuery: string;  // Cleaned query for text search
    filters: SearchFilters;
    confidence: number;
}

const SEARCH_INTENT_PROMPT = `You are a search intent extraction system for a Nepal-based booking platform.

Extract structured filters from natural language queries.

CATEGORIES (exact values):
- venue (banquet halls, event spaces, conference rooms)
- catering (food service, catering)
- decorator (event decoration, stage decoration)
- photographer (photography, videography)
- entertainment (DJ, band, music)
- event (movies, cinema, theater, concert)
- bus (bus tickets, transport)
- flight (airlines, flights, air travel)
- doctor (medical, health, specialist)
- salon (haircut, beauty, grooming)
- plumber (leaks, pipes, plumbing)
- electrician (wiring, electrical, power)
- makeup (cosmetics, face art)
- tailor (clothes, stitching, fashion)
- clinic (hospital, checkup, dental)
- college (education, admission, counseling)

COMMON NEPAL LOCATIONS:
Kathmandu, Thamel, Patan, Bhaktapur, Lalitpur, Pokhara, Biratnagar, Chitwan

PRICE INTERPRETATION:
- "cheap", "budget", "affordable" → max_price: 20000
- "mid range", "moderate" → max_price: 50000
- "expensive", "premium", "luxury" → min_rating: 4.0

YOUR TASK:
1. Extract a clean search query (remove filler words)
2. Identify category if mentioned
3. Extract location if mentioned
4. Infer capacity from numbers or context
5. Infer price range from budget keywords
6. Extract rating requirements

OUTPUT JSON FORMAT:
{
  "search_query": "rewritten clean query",
  "filters": {
    "category": "venue|catering|decorator|photographer|entertainment" or null,
    "location": "city name" or null,
    "min_capacity": number or null,
    "max_price": number or null,
    "min_rating": number or null
  },
  "confidence": 0.0-1.0
}

EXAMPLES:

User: "Cheap banquet hall near Thamel for 200 people"
{
  "search_query": "banquet hall",
  "filters": {
    "category": "venue",
    "location": "Thamel",
    "min_capacity": 200,
    "max_price": 20000
  },
  "confidence": 0.95
}

User: "Wedding photographer in Kathmandu"
{
  "search_query": "wedding photographer",
  "filters": {
    "category": "photographer",
    "location": "Kathmandu"
  },
  "confidence": 0.9
}

User: "Good caterer"
{
  "search_query": "caterer",
  "filters": {
    "category": "catering",
    "min_rating": 4.0
  },
  "confidence": 0.8
}

User: "Venue for birthday party"
{
  "search_query": "venue birthday party",
  "filters": {
    "category": "venue"
  },
  "confidence": 0.85
}

RULES:
- Extract ONLY explicit information
- Don't infer too much from vague queries
- Leave fields null if not mentioned
- Simplify the search query (remove "I want", "looking for", etc.)
- Match category names exactly from the list

Now extract from: "{query}"`;

/**
 * Extract search intent using LLM
 */
export async function extractSearchIntent(query: string): Promise<SearchIntent> {
    const trimmedQuery = query.toLowerCase().trim();

    // ✅ FAST TRACK: Handle single keywords or simple phrases instantly
    const fastTrackIntent = keywordFastTrack(trimmedQuery);
    if (fastTrackIntent) {
        console.log('[SearchIntent] ⚡ Fast-track match:', fastTrackIntent.searchQuery, fastTrackIntent.filters.category);
        return fastTrackIntent;
    }

    try {
        const response = await chat([{
            role: 'system',
            content: SEARCH_INTENT_PROMPT.replace('{query}', query)
        }], {
            temperature: 0.1,  // Low temperature for consistent extraction
            forceJson: true
        });

        const parsed = JSON.parse(response.message.content);

        // Validate and sanitize
        return {
            searchQuery: parsed.search_query || query,
            filters: {
                category: validateCategory(parsed.filters?.category),
                location: parsed.filters?.location || undefined,
                minCapacity: parsed.filters?.min_capacity ? parseInt(parsed.filters.min_capacity) : undefined,
                maxPrice: parsed.filters?.max_price ? parseFloat(parsed.filters.max_price) : undefined,
                minRating: parsed.filters?.min_rating ? parseFloat(parsed.filters.min_rating) : undefined
            },
            confidence: parsed.confidence || 0.5
        };
    } catch (error) {
        console.error('[SearchIntentExtractor] Error:', error);

        // Fallback: simple keyword extraction
        return fallbackExtraction(query);
    }
}

/**
 * Fast-track intent for common keywords
 * Skips LLM call for ultra-responsive search
 */
function keywordFastTrack(query: string): SearchIntent | null {
    const keywords: Record<string, string> = {
        'movie': 'event', 'movies': 'event', 'cinema': 'event', 'film': 'event',
        'bus': 'bus', 'buses': 'bus', 'ticket': 'bus',
        'flight': 'flight', 'flights': 'flight', 'plane': 'flight',
        'doctor': 'doctor', 'doctors': 'doctor', 'appointment': 'doctor',
        'pediatrician': 'pediatrician', 'psychologist': 'psychologist',
        'insomnia': 'doctor', 'sleep': 'doctor', 'pain': 'doctor', 'fever': 'doctor',
        'skin': 'dermatologist', 'hair': 'salon', 'teeth': 'dentist', 'tooth': 'dentist',
        'salon': 'salon', 'barber': 'salon', 'plumber': 'plumber',
        'electrician': 'electrician', 'makeup': 'makeup', 'tailor': 'tailor',
        'clinic': 'clinic', 'college': 'college'
    };

    // Normalize: remove filler words
    const cleanQuery = query
        .replace(/\b(bro|please|find|get|show|me|need|thanks|thank you|ok|okay)\b/gi, '')
        .trim();

    // Check for exact keyword match on cleaned query
    if (keywords[cleanQuery]) {
        return {
            searchQuery: cleanQuery,
            filters: { category: keywords[cleanQuery] },
            confidence: 1.0
        };
    }

    // Check for "watch/book/find/need [category] [location]" or just "[category]"
    const simplePatterns = [
        // Category with location: "movies in kathmandu", "bus to pokhara"
        { regex: /.*?(movies?|film|cinema)\s*(in|at|near|around)?\s*(.+)$/i, groupIndex: 3, catKey: 'movie' },
        { regex: /.*?(bus(es)?)\s*(to|from|in)?\s*(.+)$/i, groupIndex: 4, catKey: 'bus' },
        { regex: /.*?(flights?)\s*(to|from|in)?\s*(.+)$/i, groupIndex: 4, catKey: 'flight' },
        { regex: /.*?(doctors?|appointment)\s*(in|at|near|around)?\s*(.+)$/i, groupIndex: 3, catKey: 'doctor' },

        // Category only: "watch a movie", "book a bus", "find a doctor"
        { regex: /.*?(movies?|film|cinema)$/i, catKey: 'movie' },
        { regex: /.*?(bus(es)?)$/i, catKey: 'bus' },
        { regex: /.*?(flights?)$/i, catKey: 'flight' },
        { regex: /.*?(doctors?|appointment|insomnia|fever|pain)$/i, catKey: 'doctor' }
    ];

    for (const pattern of simplePatterns) {
        const match = cleanQuery.match(pattern.regex);
        if (match) {
            const categoryKey = pattern.catKey;
            const location = pattern.groupIndex ? match[pattern.groupIndex].trim() : undefined;

            return {
                searchQuery: cleanQuery,
                filters: {
                    category: keywords[categoryKey],
                    location: location ? location.charAt(0).toUpperCase() + location.slice(1) : undefined
                },
                confidence: 0.95
            };
        }
    }

    return null;
}

/**
 * Validate category against allowed values
 */
function validateCategory(category: string | null | undefined): string | undefined {
    const validCategories = [
        'venue', 'catering', 'decorator', 'photographer', 'entertainment',
        'event', 'bus', 'flight', 'doctor', 'pediatrician', 'psychologist',
        'salon', 'plumber', 'electrician', 'makeup', 'tailor', 'clinic', 'college'
    ];

    if (!category) return undefined;

    const normalized = category.toLowerCase().trim();
    return validCategories.includes(normalized) ? normalized : undefined;
}

/**
 * Fallback extraction using simple keyword matching
 */
function fallbackExtraction(query: string): SearchIntent {
    const lowerQuery = query.toLowerCase();

    // Category detection
    let category: string | undefined;
    if (lowerQuery.includes('hall') || lowerQuery.includes('venue') || lowerQuery.includes('space')) {
        category = 'venue';
    } else if (lowerQuery.includes('movie') || lowerQuery.includes('cinema') || lowerQuery.includes('film')) {
        category = 'event';
    } else if (lowerQuery.includes('bus') || lowerQuery.includes('ticket')) {
        category = 'bus';
    } else if (lowerQuery.includes('flight') || lowerQuery.includes('airline') || lowerQuery.includes('plane')) {
        category = 'flight';
    } else if (lowerQuery.includes('doctor') || lowerQuery.includes('appointment')) {
        category = 'doctor';
    } else if (lowerQuery.includes('salon') || lowerQuery.includes('hair')) {
        category = 'salon';
    } else if (lowerQuery.includes('plumb')) {
        category = 'plumber';
    } else if (lowerQuery.includes('electri')) {
        category = 'electrician';
    } else if (lowerQuery.includes('makeup')) {
        category = 'makeup';
    } else if (lowerQuery.includes('tailor')) {
        category = 'tailor';
    } else if (lowerQuery.includes('clinic')) {
        category = 'clinic';
    } else if (lowerQuery.includes('college')) {
        category = 'college';
    } else if (lowerQuery.includes('cater') || lowerQuery.includes('food')) {
        category = 'catering';
    } else if (lowerQuery.includes('decor') || lowerQuery.includes('decoration')) {
        category = 'decorator';
    } else if (lowerQuery.includes('photo') || lowerQuery.includes('camera')) {
        category = 'photographer';
    } else if (lowerQuery.includes('dj') || lowerQuery.includes('band') || lowerQuery.includes('music')) {
        category = 'entertainment';
    }

    // Location detection (common Nepal cities)
    const locations = ['kathmandu', 'thamel', 'patan', 'bhaktapur', 'lalitpur', 'pokhara'];
    let location: string | undefined;
    for (const loc of locations) {
        if (lowerQuery.includes(loc)) {
            location = loc.charAt(0).toUpperCase() + loc.slice(1);
            break;
        }
    }

    // Capacity detection (look for numbers)
    const capacityMatch = lowerQuery.match(/(\d+)\s*(people|person|guest|pax)/i);
    const minCapacity = capacityMatch ? parseInt(capacityMatch[1]) : undefined;

    // Price detection
    let maxPrice: number | undefined;
    if (lowerQuery.includes('cheap') || lowerQuery.includes('budget') || lowerQuery.includes('affordable')) {
        maxPrice = 20000;
    } else if (lowerQuery.includes('expensive') || lowerQuery.includes('premium') || lowerQuery.includes('luxury')) {
        maxPrice = undefined; // No max, but will sort by rating
    }

    // Clean query
    const searchQuery = query
        .replace(/\b(i want|looking for|need|find me|show me|get me)\b/gi, '')
        .replace(/\b(cheap|budget|expensive|premium)\b/gi, '')
        .trim();

    return {
        searchQuery: searchQuery || query,
        filters: {
            category,
            location,
            minCapacity,
            maxPrice
        },
        confidence: 0.5
    };
}
