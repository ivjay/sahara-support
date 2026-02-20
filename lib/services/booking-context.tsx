"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useCallback,
    useMemo
} from "react";
import { BookingApi } from "./booking-api";

export interface BookingRecord {
    id: string;
    serviceId: string;
    type: string;
    title: string;
    subtitle: string;
    date: Date;
    status: string;
    amount: string;
    details?: Record<string, any>;
}

interface BookingContextType {
    bookings: BookingRecord[];
    isLoading: boolean;
    addBooking: (booking: BookingRecord) => Promise<void>;
    deleteBooking: (id: string) => Promise<void>;
    updateBooking: (id: string, updates: Partial<BookingRecord>) => Promise<void>;
    refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
    const [bookings, setBookings] = useState<BookingRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refreshBookings = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const data = await BookingApi.getAll();
            setBookings(data);
        } catch (error) {
            console.error("Failed to refresh bookings:", error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, []);

    // ✅ FIXED: Load bookings once on mount, NO auto-polling
    useEffect(() => {
        // Only load once when component mounts
        refreshBookings(false);
    }, [refreshBookings]);

    const addBooking = useCallback(async (booking: BookingRecord) => {
        try {
            await BookingApi.create(booking);
            await refreshBookings();
        } catch (error) {
            console.error("Failed to add booking:", error);
            throw error;
        }
    }, [refreshBookings]);

    const deleteBooking = useCallback(async (id: string) => {
        try {
            await BookingApi.delete(id);
            await refreshBookings();
        } catch (error) {
            console.error("Failed to delete booking:", error);
            throw error;
        }
    }, [refreshBookings]);

    const updateBooking = useCallback(async (id: string, updates: Partial<BookingRecord>) => {
        try {
            await BookingApi.update(id, updates);
            await refreshBookings();
        } catch (error) {
            console.error("Failed to update booking:", error);
            throw error;
        }
    }, [refreshBookings]);

    const value = useMemo(() => ({
        bookings,
        isLoading,
        addBooking,
        deleteBooking,
        updateBooking,
        refreshBookings
    }), [
        bookings,
        isLoading,
        addBooking,
        deleteBooking,
        updateBooking,
        refreshBookings
    ]);

    return (
        <BookingContext.Provider value={value}>
            {children}
        </BookingContext.Provider>
    );
}

export function useBookings() {
    const context = useContext(BookingContext);
    if (!context) {
        throw new Error("useBookings must be used within BookingProvider");
    }
    return context;
}