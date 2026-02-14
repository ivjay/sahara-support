import { BookingOption } from "./types";
import {
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_MOVIE_OPTIONS,
    MOCK_PAYMENT_OPTIONS,
} from "./mock-data";

export function getOptionsByType(
    type: string,
    filterCategory?: string | null,
    allServices: BookingOption[] = []
): BookingOption[] {

    const optionsMap = new Map<string, BookingOption>();

    [
        ...MOCK_BUS_OPTIONS,
        ...MOCK_FLIGHT_OPTIONS,
        ...MOCK_APPOINTMENT_OPTIONS,
        ...MOCK_MOVIE_OPTIONS,
        ...MOCK_PAYMENT_OPTIONS
    ].forEach(opt => optionsMap.set(opt.id, opt));

    allServices.forEach(opt => optionsMap.set(opt.id, opt));

    let validOptions = Array.from(optionsMap.values());

    if (type === "BUS_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'bus');
    } else if (type === "FLIGHT_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'flight');
    } else if (type === "MOVIE_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'movie');
        
        // Filter by specific movie if requested
        if (filterCategory) {
            const exactMovie = validOptions.find(o => 
                o.title.toLowerCase().includes(filterCategory.toLowerCase())
            );
            
            if (exactMovie) {
                console.log(`[Filter] Showing only: ${exactMovie.title}`);
                return [exactMovie];
            }
        }
    } else if (type === "APPOINTMENT") {
        validOptions = validOptions.filter(o => o.type === 'appointment');
    } else if (type === "PAYMENT") {
        validOptions = validOptions.filter(o => o.type === 'payment_qr' || o.type === 'payment_cash');
    }

    // Doctor/service filtering
    if (filterCategory && type === "APPOINTMENT") {
        const specialtyMap: Record<string, string[]> = {
            'cardiologist': ['heart', 'cardiac', 'cardio'],
            'dentist': ['teeth', 'dental', 'tooth', 'oral'],
            'dermatologist': ['skin', 'derma'],
            'gynecologist': ['women', 'pregnancy', 'gyno'],
            'urologist': ['kidney', 'bladder', 'urology'],
            'nephrologist': ['kidney specialist', 'nephro', 'renal'],
            'psychologist': ['therapy', 'therapist', 'mental', 'counseling', 'counsellor', 'psychiatrist', 'psycho'],
            'pediatrician': ['child', 'baby', 'pediatric', 'kids'],
            'orthopedic': ['bone', 'ortho', 'fracture', 'joint'],
            'ent': ['ear', 'nose', 'throat'],
            'neurologist': ['neuro', 'brain', 'nervous', 'migraine'],
            'general': ['gp', 'physician', 'family doctor'],
        };

        const query = filterCategory.toLowerCase();
        const queryTokens = query.split(/\s+/).filter(t => t.length > 2);

        if (queryTokens.length > 0) {
            const scoredOptions = validOptions.map(opt => {
                let score = 0;

                const titleLower = opt.title.toLowerCase();
                const subtitleLower = opt.subtitle.toLowerCase();
                const categoryLower = opt.category?.toLowerCase() || '';
                const detailsText = Object.values(opt.details || {}).join(' ').toLowerCase();

                Object.entries(specialtyMap).forEach(([specialty, synonyms]) => {
                    if (subtitleLower.includes(specialty)) {
                        if (queryTokens.some(token =>
                            specialty.includes(token) ||
                            synonyms.some(syn => syn.includes(token) || token.includes(syn))
                        )) {
                            score += 500;
                        }
                    }
                });

                queryTokens.forEach(token => {
                    if (subtitleLower === token) score += 200;
                    if (subtitleLower.includes(token)) score += 100;
                    if (categoryLower === token) score += 80;
                    if (categoryLower.includes(token)) score += 40;
                    if (titleLower.includes(token)) score += 30;
                    if (detailsText.includes(token)) score += 10;

                    Object.entries(specialtyMap).forEach(([specialty, synonyms]) => {
                        if (synonyms.some(syn => token.includes(syn) || syn.includes(token))) {
                            if (subtitleLower.includes(specialty) || categoryLower.includes(specialty)) {
                                score += 150;
                            }
                        }
                    });
                });

                return { opt, score };
            });

            validOptions = scoredOptions
                .filter(item => item.score > 0)
                .sort((a, b) => b.score - a.score)
                .map(item => item.opt);
        }
    }

    return validOptions.slice(0, 5);
}