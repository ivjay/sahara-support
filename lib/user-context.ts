/**
 * Centralized User Context
 * 
 * This is the single source of truth for user profile data.
 * Used by both the UI (profile page) and the AI (chat prompt).
 * 
 * In a real app, this would come from:
 * - Authentication context
 * - Database/API
 * - Local storage
 */

export interface UserProfile {
    // Basic Info
    id: string;
    name: string;
    firstName: string;
    email: string;
    phone: string;
    alternatePhone: string;
    avatarInitials: string;

    // Identity (KYC)
    dateOfBirth: string;
    gender: string;
    nationality: string;
    idNumber: string;

    // Location
    currentAddress: string;
    permanentAddress: string;
    city: string;
    postalCode: string;

    // Emergency Contact
    emergencyName: string;
    emergencyPhone: string;
    emergencyRelation: string;

    // Account
    kycStatus: "Verified" | "Pending" | "Not Started";
    accountType: "Free" | "Premium" | "Business";
    memberSince: string;

    // Preferences (for AI context)
    preferences: string[];
}

/**
 * Mock user data - In production, this would come from auth/database
 */
export const CURRENT_USER: UserProfile = {
    // Basic Info
    id: "usr_bijay_001",
    name: "Bijay Acharya",
    firstName: "Bijay",
    email: "bijay.acharya@example.com",
    phone: "+977 9841XXXXXX",
    alternatePhone: "+977 9801XXXXXX",
    avatarInitials: "BA",

    // Identity
    dateOfBirth: "1995-05-15",
    gender: "Male",
    nationality: "Nepali",
    idNumber: "NPL-09384723",

    // Location
    currentAddress: "Baneshwor, Kathmandu",
    permanentAddress: "Pokhara-12, Kaski",
    city: "Kathmandu",
    postalCode: "44600",

    // Emergency Contact
    emergencyName: "Sita Acharya",
    emergencyPhone: "+977 9812XXXXXX",
    emergencyRelation: "Spouse",

    // Account
    kycStatus: "Verified",
    accountType: "Premium",
    memberSince: "January 2024",

    // Preferences
    preferences: [
        "Vegetarian",
        "Window Seat",
        "Morning Travel",
        "Budget Hotels",
        "Non-Smoking",
        "Aisle Preferred"
    ]
};

/**
 * Get user context string for AI prompt injection
 * This formats the user data in a way the AI can understand
 */
export function getUserContextForAI(profile?: UserProfile): string {
    const user = profile || CURRENT_USER;

    return `
## User Context (Personalization)
You are speaking with a specific user. Use this information to personalize your responses:

- **Name**: ${user.name} (call them "${user.firstName}")
- **Location**: ${user.city}, Nepal
- **Account**: ${user.accountType} member since ${user.memberSince}
- **KYC Status**: ${user.kycStatus}

### User Preferences
${user.preferences.length > 0
            ? user.preferences.map(p => `- ${p}`).join('\n')
            : "No specific preferences set yet."}

### Personalization Rules
1. Greet the user by their first name ("${user.firstName}")
2. When booking buses/flights, default departure to "${user.city}"
3. For food/service suggestions, check their preferences: ${user.preferences.length > 0 ? user.preferences.join(', ') : 'no specific preferences'}
`;
}

/**
 * Get a short greeting for the user
 * @param userName - Optional user name or Firebase user object
 */
export function getUserGreeting(userName?: string | { displayName?: string | null; email?: string | null }): string {
    const hour = new Date().getHours();

    let firstName = "there"; // Default generic greeting

    if (userName) {
        if (typeof userName === 'string') {
            // Extract first name from full name
            firstName = userName.split(' ')[0] || "there";
        } else if (userName.displayName) {
            // Firebase user object with displayName
            firstName = userName.displayName.split(' ')[0] || "there";
        } else if (userName.email) {
            // Fallback to email username (before @)
            firstName = userName.email.split('@')[0] || "there";
        }
    }

    // Time-based greeting
    if (hour < 12) {
        return `Good morning, ${firstName}!`;
    } else if (hour < 17) {
        return `Good afternoon, ${firstName}!`;
    } else {
        return `Good evening, ${firstName}!`;
    }
}
