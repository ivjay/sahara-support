import { BookingOption } from "./types";
import {
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_MOVIE_OPTIONS,
    MOCK_PAYMENT_OPTIONS,
} from "./mock-data";

/**
 * Smart option filtering that works with BOTH mocks and admin-created services
 * Merges both sources and filters intelligently
 */
export function getOptionsByType(
    type: string,
    filterCategory?: string | null,
    allServices: BookingOption[] = []
): BookingOption[] {

    // 1. Merge Default Mocks with Dynamic Services
    const optionsMap = new Map<string, BookingOption>();

    // Add Static Mocks first
    [
        ...MOCK_BUS_OPTIONS,
        ...MOCK_FLIGHT_OPTIONS,
        ...MOCK_APPOINTMENT_OPTIONS,
        ...MOCK_MOVIE_OPTIONS,
        ...MOCK_PAYMENT_OPTIONS
    ].forEach(opt => optionsMap.set(opt.id, opt));

    // Add/Overwrite with Dynamic Services (admin-created)
    allServices.forEach(opt => optionsMap.set(opt.id, opt));

    let validOptions = Array.from(optionsMap.values());

    // 2. Filter by Intent/Type
    if (type === "BUS_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'bus');
    } else if (type === "FLIGHT_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'flight');
    } else if (type === "MOVIE_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'movie');
    } else if (type === "APPOINTMENT") {
        // Allow 'appointment' type with ANY category
        validOptions = validOptions.filter(o => o.type === 'appointment');
    } else if (type === "PAYMENT") {
        validOptions = validOptions.filter(o => o.type === 'payment_qr' || o.type === 'payment_cash');
    }

    // 3. Smart Matching with Synonyms and Specialty Recognition
    if (filterCategory) {
        // Specialty synonym map for better matching
        const specialtyMap: Record<string, string[]> = {
            'cardiologist': ['heart', 'cardiac', 'cardio', 'heart doctor', 'heart specialist'],
            'dentist': ['teeth', 'dental', 'tooth', 'oral', 'dental care'],
            'dermatologist': ['skin', 'skin doctor', 'derma', 'skin specialist'],
            'gynecologist': ['women', 'pregnancy', 'gyno', 'maternity', 'obs'],
            'urologist': ['kidney', 'bladder', 'urology', 'urinary'],
            'nephrologist': ['kidney', 'kidney specialist', 'nephro', 'renal'],
            'general': ['gp', 'physician', 'general doctor', 'family doctor', 'general physician'],
            'pediatrician': ['child', 'children', 'kids', 'baby', 'infant'],
            'plumber': ['pipe', 'leak', 'water', 'plumbing', 'drainage'],
            'electrician': ['electricity', 'wiring', 'electric', 'power', 'light'],
            'salon': ['hair', 'haircut', 'beauty', 'grooming', 'barber'],
            'makeup': ['makeup artist', 'bridal', 'party makeup', 'mua'],
            'tailor': ['sewing', 'stitching', 'alteration', 'suit', 'clothes'],
        };

        // Normalize query and split into tokens
        const query = filterCategory.toLowerCase();
        const queryTokens = query.split(/\s+/).filter(t => t.length > 2);

        if (queryTokens.length > 0) {
            const scoredOptions = validOptions.map(opt => {
                let score = 0;

                const titleLower = opt.title.toLowerCase();
                const subtitleLower = opt.subtitle.toLowerCase();
                const categoryLower = opt.category?.toLowerCase() || '';

                // Extract all detail values and join them
                const detailsText = Object.values(opt.details || {}).join(' ').toLowerCase();

                // Check for exact specialty match in subtitle (HIGHEST PRIORITY)
                Object.entries(specialtyMap).forEach(([specialty, synonyms]) => {
                    if (subtitleLower.includes(specialty)) {
                        // User query matches this specialty
                        if (queryTokens.some(token =>
                            specialty.includes(token) ||
                            synonyms.some(syn => syn.includes(token) || token.includes(syn))
                        )) {
                            score += 500; // Massive boost for specialty match
                        }
                    }
                });

                queryTokens.forEach(token => {
                    // Exact subtitle match (e.g., "Cardiologist")
                    if (subtitleLower === token) score += 200;
                    if (subtitleLower.includes(token)) score += 100;

                    // Category match
                    if (categoryLower === token) score += 80;
                    if (categoryLower.includes(token)) score += 40;

                    // Title match (doctor name, service name)
                    if (titleLower.includes(token)) score += 30;

                    // Detail matches (hospital, specialization, etc.)
                    if (detailsText.includes(token)) score += 10;

                    // Check synonyms
                    Object.entries(specialtyMap).forEach(([specialty, synonyms]) => {
                        if (synonyms.some(syn => token.includes(syn) || syn.includes(token))) {
                            if (subtitleLower.includes(specialty) || categoryLower.includes(specialty)) {
                                score += 150; // Synonym match
                            }
                        }
                    });
                });

                return { opt, score };
            });

            // Filter out zero-score results and sort by relevance
            validOptions = scoredOptions
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(item => item.opt);
        }
    }

    // 4. Limit to top 5 most relevant results
    return validOptions.slice(0, 5);
}