import { BookingOption } from "./types";

export function getOptionsByType(
    type: string,
    filterCategory?: string | null,
    allServices: BookingOption[] = []
): BookingOption[] {

    if (allServices.length === 0) {
        return [];
    }

    const optionsMap = new Map<string, BookingOption>();
    allServices.forEach(opt => optionsMap.set(opt.id, opt));

    let validOptions = Array.from(optionsMap.values());
    console.log(`[OptionHelper] Filtering ${validOptions.length} total services for type: ${type}`);

    // Standardize types for easier matching
    const normalizedType = type.toUpperCase();

    if (normalizedType === "BUS_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'bus');
    } else if (normalizedType === "FLIGHT_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'flight');
    } else if (normalizedType === "MOVIE_BOOKING") {
        validOptions = validOptions.filter(o => o.type === 'movie');

        // Filter by specific movie if requested
        if (filterCategory) {
            const MovieOptions = validOptions.filter(o =>
                o.title.toLowerCase().includes(filterCategory.toLowerCase())
            );
            if (MovieOptions.length > 0) return MovieOptions;
        }
    } else if (normalizedType === "APPOINTMENT") {
        validOptions = validOptions.filter(o => o.type === 'appointment');
    } else if (normalizedType === "PAYMENT") {
        validOptions = validOptions.filter(o => o.type === 'payment_qr' || o.type === 'payment_cash');
    }

    // Category-specific filtering if provided
    if (filterCategory && validOptions.length > 1) {
        const query = filterCategory.toLowerCase();

        // Use a simple score-based approach for remaining options
        const scoredOptions = validOptions.map(opt => {
            let score = 0;
            const title = opt.title.toLowerCase();
            const subtitle = (opt.subtitle || '').toLowerCase();
            const category = (opt.category || '').toLowerCase();

            if (title.includes(query)) score += 100;
            if (subtitle.includes(query)) score += 50;
            if (category.includes(query)) score += 30;

            return { opt, score };
        });

        const filtered = scoredOptions
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.opt);

        if (filtered.length > 0) {
            validOptions = filtered;
        }
    }

    const finalOptions = validOptions.slice(0, 5);
    console.log(`[OptionHelper] ✓ Returning ${finalOptions.length} options:`, finalOptions.map(o => o.title));
    return finalOptions;
}