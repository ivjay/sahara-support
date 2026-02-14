"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { BookingOption } from "@/lib/chat/types";
import {
    MOCK_BUS_OPTIONS,
    MOCK_FLIGHT_OPTIONS,
    MOCK_APPOINTMENT_OPTIONS,
    MOCK_MOVIE_OPTIONS
} from "@/lib/chat/mock-data";
import { supabase } from "@/lib/supabase";

// Combine all initial mock data
const INITIAL_SERVICES: BookingOption[] = [
    ...MOCK_BUS_OPTIONS,
    ...MOCK_FLIGHT_OPTIONS,
    ...MOCK_APPOINTMENT_OPTIONS,
    ...MOCK_MOVIE_OPTIONS
];

interface ServiceContextType {
    services: BookingOption[];
    addService: (service: BookingOption) => Promise<void>;
    updateService: (id: string, updates: Partial<BookingOption>) => Promise<void>;
    deleteService: (id: string) => Promise<void>;
    resetToDefaults: () => Promise<void>;
    isLoading: boolean;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: React.ReactNode }) {
    const [services, setServices] = useState<BookingOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load from Supabase on mount
    useEffect(() => {
        loadServicesFromDB();
    }, []);

    async function loadServicesFromDB() {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('available', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('[ServiceContext] ✗ Error loading from Supabase:', error);
                // Fallback to mocks if Supabase fails
                setServices(INITIAL_SERVICES);
            } else if (!data || data.length === 0) {
                // First time: Seed database with mock data
                console.log('[ServiceContext] 🌱 Seeding database with mock data...');
                await seedDatabase();
            } else {
                console.log('[ServiceContext] ✓ Loaded', data.length, 'services from database');
                setServices(data as BookingOption[]);
            }
        } catch (err) {
            console.error('[ServiceContext] ✗ Failed to load services:', err);
            setServices(INITIAL_SERVICES);
        } finally {
            setIsLoading(false);
        }
    }

    async function seedDatabase() {
        try {
            const { error } = await supabase
                .from('services')
                .insert(INITIAL_SERVICES.map(service => ({
                    ...service,
                    created_at: new Date().toISOString()
                })));

            if (error) {
                console.error('[ServiceContext] ✗ Error seeding database:', error);
                setServices(INITIAL_SERVICES);
            } else {
                console.log('[ServiceContext] ✓ Database seeded successfully');
                setServices(INITIAL_SERVICES);
            }
        } catch (err) {
            console.error('[ServiceContext] ✗ Seed failed:', err);
            setServices(INITIAL_SERVICES);
        }
    }

    const addService = async (service: BookingOption) => {
        try {
            const { error } = await supabase
                .from('services')
                .insert({
                    ...service,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error('[ServiceContext] ✗ Error adding service:', error);
                throw error;
            }

            console.log('[ServiceContext] ✓ Service added:', service.id);
            setServices(prev => [service, ...prev]);
        } catch (err) {
            console.error('[ServiceContext] ✗ Add service failed:', err);
            throw err;
        }
    };

    const updateService = async (id: string, updates: Partial<BookingOption>) => {
        try {
            const { error } = await supabase
                .from('services')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.error('[ServiceContext] ✗ Error updating service:', error);
                throw error;
            }

            console.log('[ServiceContext] ✓ Service updated:', id);
            setServices(prev => prev.map(svc =>
                svc.id === id ? { ...svc, ...updates } : svc
            ));
        } catch (err) {
            console.error('[ServiceContext] ✗ Update service failed:', err);
            throw err;
        }
    };

    const deleteService = async (id: string) => {
        try {
            // Soft delete: Set available = false
            const { error } = await supabase
                .from('services')
                .update({
                    available: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) {
                console.error('[ServiceContext] ✗ Error deleting service:', error);
                throw error;
            }

            console.log('[ServiceContext] ✓ Service deleted:', id);
            setServices(prev => prev.filter(svc => svc.id !== id));
        } catch (err) {
            console.error('[ServiceContext] ✗ Delete service failed:', err);
            throw err;
        }
    };

    const resetToDefaults = async () => {
        try {
            // Delete all existing services
            await supabase
                .from('services')
                .delete()
                .neq('id', ''); // Delete all

            // Re-seed with mock data
            await seedDatabase();
            console.log('[ServiceContext] ✓ Reset to defaults');
        } catch (err) {
            console.error('[ServiceContext] ✗ Reset failed:', err);
            throw err;
        }
    };

    return (
        <ServiceContext.Provider value={{
            services,
            addService,
            updateService,
            deleteService,
            resetToDefaults,
            isLoading
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
