"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { BookingOption } from "@/lib/chat/types";
import {
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_MOVIE_OPTIONS
} from "@/lib/chat/mock-data";

// Combine all initial mock data
const INITIAL_SERVICES: BookingOption[] = [
    ...MOCK_BUS_OPTIONS,
    ...MOCK_FLIGHT_OPTIONS,
    ...MOCK_APPOINTMENT_OPTIONS,
    ...MOCK_MOVIE_OPTIONS
];

interface ServiceContextType {
    services: BookingOption[];
    addService: (service: BookingOption) => void;
    updateService: (id: string, updates: Partial<BookingOption>) => void;
    deleteService: (id: string) => void;
    resetToDefaults: () => void;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<BookingOption[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from LocalStorage on mount
    useEffect(() => {
        const savedServices = localStorage.getItem("sahara_services");
        if (savedServices) {
            try {
                setServices(JSON.parse(savedServices));
            } catch (e) {
                console.error("Failed to parse services from storage", e);
                setServices(INITIAL_SERVICES);
            }
        } else {
            // First time load: Seed with mock data
            setServices(INITIAL_SERVICES);
        }
        setIsInitialized(true);
    }, []);

    // Save to LocalStorage whenever services change
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("sahara_services", JSON.stringify(services));
        }
    }, [services, isInitialized]);

    const addService = (service: BookingOption) => {
        setServices(prev => [service, ...prev]);
    };

    const updateService = (id: string, updates: Partial<BookingOption>) => {
        setServices(prev => prev.map(svc =>
            svc.id === id ? { ...svc, ...updates } : svc
        ));
    };

    const deleteService = (id: string) => {
        setServices(prev => prev.filter(svc => svc.id !== id));
    };

    const resetToDefaults = () => {
        setServices(INITIAL_SERVICES);
        localStorage.setItem("sahara_services", JSON.stringify(INITIAL_SERVICES));
    };

    return (
        <ServiceContext.Provider value={{
            services,
            addService,
            updateService,
            deleteService,
            resetToDefaults
        }}>
            {children}
        </ServiceContext.Provider>
    );
}

export function useServices() {
    const context = useContext(ServiceContext);
    if (context === undefined) {
        throw new Error("useServices must be used within a ServiceProvider");
    }
    return context;
}
