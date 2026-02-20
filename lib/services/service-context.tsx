"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { BookingOption } from "@/lib/chat/types";
import { supabase } from "@/lib/supabase";
import { generateServiceEmbedding } from "@/lib/search/embeddings";

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
                setServices([]);
            } else if (!data || data.length === 0) {
                console.warn('[ServiceContext] ⚠ No services found in database');
                setServices([]);
            } else {
                console.log('[ServiceContext] ✓ Loaded', data.length, 'services from database');
                setServices(data as BookingOption[]);
            }
        } catch (err) {
            console.error('[ServiceContext] ✗ Failed to load services:', err);
            setServices([]);
        } finally {
            setIsLoading(false);
        }
    }

    const addService = async (service: BookingOption) => {
        try {
            // ✅ Generate embedding for hybrid search
            console.log('[ServiceContext] 🔮 Generating embedding for:', service.title);
            const embedding = await generateServiceEmbedding({
                title: service.title,
                description: service.subtitle,
                tags: [] // BookingOption doesn't have tags field
            });

            // ✅ Prepare data: Remove 'id' (UUID auto-generated), keep service_id
            const { id: _unusedId, ...serviceWithoutId } = service;
            const serviceData = {
                ...serviceWithoutId,
                service_id: service.id,  // Use BookingOption.id as service_id
                embedding,
                created_at: new Date().toISOString()
            };

            console.log('[ServiceContext] 📤 Sending to Supabase:', {
                service_id: serviceData.service_id,
                title: serviceData.title,
                category: serviceData.category,
                embeddingLength: embedding?.length
            });

            const { data, error } = await supabase
                .from('services')
                .insert(serviceData)
                .select()
                .single();

            if (error) {
                console.error('[ServiceContext] ✗ Error adding service:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log('[ServiceContext] ✓ Service added with embedding:', data);
            // Use the returned data (includes auto-generated UUID)
            setServices(prev => [{ ...service, id: data.service_id } as BookingOption, ...prev]);
        } catch (err) {
            console.error('[ServiceContext] ✗ Add service failed:', err);
            throw err;
        }
    };

    const updateService = async (id: string, updates: Partial<BookingOption>) => {
        try {
            // ✅ Regenerate embedding if title/subtitle changed
            let embedding = undefined;
            if (updates.title || updates.subtitle) {
                const currentService = services.find(s => s.id === id);
                if (currentService) {
                    console.log('[ServiceContext] 🔮 Regenerating embedding for:', currentService.title);
                    embedding = await generateServiceEmbedding({
                        title: updates.title || currentService.title,
                        description: updates.subtitle || currentService.subtitle,
                        tags: [] // BookingOption doesn't have tags field
                    });
                }
            }

            const { error } = await supabase
                .from('services')
                .update({
                    ...updates,
                    ...(embedding && { embedding }),  // ✅ Update embedding if generated
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

            console.log('[ServiceContext] ✓ All services cleared (Manual re-seed required if needed)');
            setServices([]);
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
