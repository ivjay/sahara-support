"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit2, Save, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useServices } from "@/lib/services/service-context";
import { DoctorForm } from "@/components/admin/DoctorForm";
import { TransportForm } from "@/components/admin/TransportForm";
import { MovieForm } from "@/components/admin/MovieForm";
import { BookingOption } from "@/lib/chat/types";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export default function ServiceProviderPage() {
    const params = useParams();
    const router = useRouter();
    const serviceId = params.id as string;
    const { services, updateService, deleteService } = useServices();

    const [service, setService] = useState<BookingOption | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (services.length > 0) {
            const found = services.find(s => s.id === serviceId);
            if (found) {
                setService(JSON.parse(JSON.stringify(found))); // Deep copy to avoid direct mutation
            }
            setLoading(false);
        }
    }, [services, serviceId]);

    const handleSave = async () => {
        if (!service) return;
        setIsSaving(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        updateService(serviceId, service);
        setIsSaving(false);
        alert("Changes saved successfully!");
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this service?")) {
            deleteService(serviceId);
            router.push('/admin');
        }
    };

    if (loading) {
        return <div className="p-10 text-center">Loading service details...</div>;
    }

    if (!service) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <h1 className="text-2xl font-bold text-muted-foreground">Service Not Found</h1>
                <Link href="/admin">
                    <Button>Return to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/10 font-sans p-6 pb-20">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <Button variant="outline" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">Edit Service</h1>
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase border border-primary/20">
                                    {service.type}
                                </span>
                            </div>
                            <p className="text-muted-foreground text-sm">ID: {serviceId}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleDelete}
                            className="bg-red-100 text-red-600 hover:bg-red-200"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="min-w-[140px]">
                            {isSaving ? (
                                "Saving..."
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-6 border-0 shadow-sm bg-white/80 backdrop-blur-md">
                            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-primary" />
                                Service Details
                            </h2>

                            {/* Reusing existing forms based on type */}
                            {service.type === 'appointment' && (
                                <DoctorForm
                                    data={service}
                                    onChange={(updates) => setService({ ...service, ...updates } as BookingOption)}
                                />
                            )}
                            {(service.type === 'bus' || service.type === 'flight') && (
                                <TransportForm
                                    data={service}
                                    onChange={(updates) => setService({ ...service, ...updates } as BookingOption)}
                                    type={service.type}
                                />
                            )}
                            {service.type === 'movie' && (
                                <MovieForm
                                    data={service}
                                    onChange={(updates) => setService({ ...service, ...updates } as BookingOption)}
                                />
                            )}

                            {/* Fallback for unknown types if any */}
                            {!['appointment', 'bus', 'flight', 'movie'].includes(service.type) && (
                                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                                    Generic editor for unknown service type.
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar / Quick Settings */}
                    <div className="space-y-6">
                        <Card className="p-6 border-0 shadow-sm">
                            <h3 className="font-semibold mb-4">Quick Actions</h3>

                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-medium">Availability</label>
                                <div
                                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${service.available ? 'bg-green-500' : 'bg-gray-300'}`}
                                    onClick={() => setService({ ...service, available: !service.available })}
                                >
                                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${service.available ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                            </div>

                            <Separator className="my-4" />

                            <div className="space-y-3">
                                <label className="text-sm font-medium">Base Price ({service.currency})</label>
                                <Input
                                    type="number"
                                    value={service.price}
                                    onChange={(e) => setService({ ...service, price: Number(e.target.value) })}
                                />
                            </div>
                        </Card>

                        <Card className="p-6 border-0 shadow-sm bg-blue-50/50 border-blue-100">
                            <div className="flex gap-3">
                                <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-sm text-blue-900">Optimization Tip</h4>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Ensure the title and specializations are clear so the AI agent can accurately recommend this service.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
