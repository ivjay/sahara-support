"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// Hardcoded initial admins
const INITIAL_ADMIN_EMAILS = [
    "bijayacharya@example.com",
    "acharyabijay07@gmail.com",
];

const ADMIN_STORAGE_KEY = "sahara_admin_emails";

function getAdminEmails(): string[] {
    if (typeof window === "undefined") return INITIAL_ADMIN_EMAILS;
    try {
        const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored) as string[];
            // Merge with initial admins to ensure they're always included
            const merged = [...new Set([...INITIAL_ADMIN_EMAILS, ...parsed])];
            return merged;
        }
    } catch {
        // ignore
    }
    return INITIAL_ADMIN_EMAILS;
}

function saveAdminEmails(emails: string[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(emails));
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isGuest: boolean;
    isAdmin: boolean;
    adminEmails: string[];
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
    signOut: () => Promise<void>;
    continueAsGuest: () => void;
    addAdmin: (email: string) => void;
    removeAdmin: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(false);
    const [adminEmails, setAdminEmails] = useState<string[]>(INITIAL_ADMIN_EMAILS);

    useEffect(() => {
        setAdminEmails(getAdminEmails());

        // Check if guest mode was previously set
        const guestMode = localStorage.getItem("sahara_guest_mode");
        if (guestMode === "true") {
            setIsGuest(true);
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                setIsGuest(false);
                localStorage.removeItem("sahara_guest_mode");
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const isAdmin = !!(user?.email && adminEmails.includes(user.email.toLowerCase()));

    const signInWithGoogle = async () => {
        setIsGuest(false);
        localStorage.removeItem("sahara_guest_mode");
        await signInWithPopup(auth, googleProvider);
    };

    const signInWithEmail = async (email: string, password: string) => {
        setIsGuest(false);
        localStorage.removeItem("sahara_guest_mode");
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUpWithEmail = async (email: string, password: string, name: string) => {
        setIsGuest(false);
        localStorage.removeItem("sahara_guest_mode");
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
    };

    const signOut = async () => {
        setIsGuest(false);
        localStorage.removeItem("sahara_guest_mode");
        await firebaseSignOut(auth);
    };

    const continueAsGuest = () => {
        setIsGuest(true);
        localStorage.setItem("sahara_guest_mode", "true");
    };

    const addAdmin = useCallback((email: string) => {
        const normalized = email.toLowerCase().trim();
        if (!normalized) return;
        const updated = [...new Set([...adminEmails, normalized])];
        setAdminEmails(updated);
        saveAdminEmails(updated);
    }, [adminEmails]);

    const removeAdmin = useCallback((email: string) => {
        const normalized = email.toLowerCase().trim();
        // Can't remove initial admins
        if (INITIAL_ADMIN_EMAILS.includes(normalized)) return;
        const updated = adminEmails.filter(e => e !== normalized);
        setAdminEmails(updated);
        saveAdminEmails(updated);
    }, [adminEmails]);

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isGuest,
            isAdmin,
            adminEmails,
            signInWithGoogle,
            signInWithEmail,
            signUpWithEmail,
            signOut,
            continueAsGuest,
            addAdmin,
            removeAdmin,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
