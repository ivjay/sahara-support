"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { BookingApi } from "./booking-api";
import { BookingState } from "@/lib/chat/types";

export interface BookingRecord {
    id: string;
    serviceId?: string; // Links back to Admin Service ID
    title: string;
    subtitle: string;
    type: string;
    date: Date;
    status: "Confirmed" | "Pending" | "Pending Payment" | "Cancelled" | "Completed";
    amount: string;
    details: Record<string, string>;
}

interface BookingContextType {
    bookings: BookingRecord[];
    addBooking: (booking: BookingRecord) => Promise<void>;
    updateBookingStatus: (id: string, status: BookingRecord["status"]) => Promise<void>;
    refreshBookings: () => Promise<void>;
    clearHistory: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);




export function BookingProvider({ children }: { children: React.ReactNode }) {
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from API
    const refreshBookings = async () => {
        try {
            const data = await BookingApi.getAll();
            // Sort by Date (descending)
            const sorted = data.map((b: any) => ({
                ...b,
                date: new Date(b.date)
            })).sort((a: any, b: any) => b.date.getTime() - a.date.getTime()); // Sort by timestamp

            setBookings(sorted);
        } catch (e) {
            console.error("Failed to load bookings", e);
        }
    };

    // Initial Load & Polling (Realtime Simulation)
    useEffect(() => {
        refreshBookings();
        setIsInitialized(true);

        // Poll every 2 seconds to keep Chat & Admin in sync without Sockets
        const interval = setInterval(refreshBookings, 2000);
        return () => clearInterval(interval);
    }, []);

    // Save Booking
    const addBooking = async (booking: BookingRecord) => {
        try {
            // Optimistic UI Update
            setBookings(prev => [booking, ...prev]);

            // Real API Call
            await BookingApi.create(booking);

            // Re-fetch to ensure sync
            await refreshBookings();
        } catch (err) {
            console.error("Failed to add booking", err);
            // Revert on failure? (Simplification: just log for now)
        }
    };

    // Update Status (Verify)
    const updateBookingStatus = async (id: string, status: BookingRecord["status"]) => {
        try {
            // Optimistic
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));

            if (status === "Confirmed") {
                await BookingApi.verify(id);
            }

            await refreshBookings();
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const clearHistory = async () => {
        try {
            setBookings([]); // Optimistic clear
            await BookingApi.deleteAll();
            await refreshBookings(); // Re-fetch to confirm
        } catch (err) {
            console.error("Failed to clear history", err);
        }
    };

    return (
        <BookingContext.Provider value={{ bookings, addBooking, updateBookingStatus, refreshBookings, clearHistory }}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBookings() {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error("useBookings must be used within a BookingProvider");
    }
    return context;
}
