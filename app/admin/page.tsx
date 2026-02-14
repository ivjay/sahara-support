"use client";

import { useState } from "react";
import { useServices } from "@/lib/services/service-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Trash2,
    Search,
    MapPin,
    Bus,
    Plane,
    Stethoscope,
    Film,
    ArrowLeft,
    Sparkles,
    Briefcase,
    Edit2
} from "lucide-react";
import Link from "next/link";
import { BookingOption } from "@/lib/chat/types";
import { LivePreview } from "@/components/admin/LivePreview";
import { DoctorForm } from "@/components/admin/DoctorForm";
import { TransportForm } from "@/components/admin/TransportForm";
import { MovieForm } from "@/components/admin/MovieForm";
import { cn } from "@/lib/utils";

export default function AdminPage() {
    const { services, addService, deleteService, isLoading } = useServices();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [isAddMode, setIsAddMode] = useState(false);

    // New Service State
    const [serviceType, setServiceType] = useState<"appointment" | "bus" | "flight" | "movie">("appointment");
    const [newService, setNewService] = useState<Partial<BookingOption>>({
        type: "appointment",
        currency: "NPR",
        available: true,
        details: {},
        category: "doctor"
    });

    const filteredServices = services.filter(s => {
        const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.subtitle?.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesType = true;
        if (activeTab === "doctors") matchesType = s.type === "appointment";
        if (activeTab === "transport") matchesType = s.type === "bus" || s.type === "flight";
        if (activeTab === "movies") matchesType = s.type === "movie";

        return matchesSearch && matchesType;
    });

    const handleAddService = async () => {
    if (!newService.title) {
        alert("Title is required!");
        return;
    }

    const id = `svc-${Date.now()}`;

    // ✅ Auto-assign category based on type
    let finalCategory = newService.category;
    if (!finalCategory) {
        if (serviceType === 'appointment') finalCategory = 'doctor';
        else if (serviceType === 'bus') finalCategory = 'transport';
        else if (serviceType === 'flight') finalCategory = 'transport';
        else if (serviceType === 'movie') finalCategory = 'event';
    }

    // ✅ CRITICAL: Ensure ALL detail values are strings
    const stringifiedDetails: Record<string, string> = {};
    if (newService.details) {
        Object.entries(newService.details).forEach(([key, value]) => {
            stringifiedDetails[key] = String(value); // Force to string
        });
    }

    try {
        await addService({
            id,
            title: newService.title!,
            subtitle: newService.subtitle || "Service Provider",
            type: serviceType,
            price: Number(newService.price) || 0,
            currency: newService.currency || "NPR",
            available: true,
            details: stringifiedDetails,
            category: finalCategory
        });

        setIsAddMode(false);
        // Reset
        setNewService({
            type: "appointment",
            currency: "NPR",
            available: true,
            details: {},
            category: "doctor"
        });
    } catch (error) {
        console.error('[Admin] ✗ Failed to add service:', error);
        alert('Failed to add service. Please try again.');
    }
};

    const getIcon = (type: string) => {
        switch (type) {
            case "bus": return <Bus className="h-4 w-4" />;
            case "flight": return <Plane className="h-4 w-4" />;
            case "movie": return <Film className="h-4 w-4" />;
            default: return <Stethoscope className="h-4 w-4" />;
        }
    };

    return (
        <div className="min-h-screen bg-muted/10 font-sans pb-20">
            {/* Top Navigation */}
            <header className="bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-border/50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/chat">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                                Sahara Admin
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isAddMode && (
                            <>
                                <Link href="/admin/verify">
                                    <Button variant="outline" className="rounded-full border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800">
                                        Verify Payments
                                    </Button>
                                </Link>
                                <Button
                                    onClick={() => setIsAddMode(true)}
                                    className="rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add New Service
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6">

                {/* Stats / Overview (Simple) */}
                {!isAddMode && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200/50 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                                    <Stethoscope className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Doctors</p>
                                    <h3 className="text-2xl font-bold">{services.filter(s => s.type === 'appointment').length}</h3>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-200/50 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-500/10 rounded-xl text-orange-600">
                                    <Bus className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Transport Routes</p>
                                    <h3 className="text-2xl font-bold">{services.filter(s => s.type === 'bus' || s.type === 'flight').length}</h3>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-200/50 backdrop-blur-sm">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600">
                                    <Film className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Movies</p>
                                    <h3 className="text-2xl font-bold">{services.filter(s => s.type === 'movie').length}</h3>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Add Service Modal / View */}
                {isAddMode ? (
                    <div className="animate-in slide-in-from-bottom-5 fade-in duration-300">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="icon" onClick={() => setIsAddMode(false)} className="rounded-full">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <h2 className="text-2xl font-bold">Create New Service</h2>
                            </div>
                            <Button variant="ghost" onClick={() => setIsAddMode(false)}>Cancel</Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                            {/* Left: Form */}
                            <div className="lg:col-span-3 space-y-6">
                                <div className="flex flex-wrap gap-2 mb-4 p-1 bg-muted/50 rounded-xl w-fit">
                                    <button
                                        onClick={() => { setServiceType("appointment"); setNewService(prev => ({ ...prev, type: "appointment" })) }}
                                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", serviceType === 'appointment' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        <Stethoscope className="h-4 w-4" /> Doctor / Service
                                    </button>
                                    <button
                                        onClick={() => { setServiceType("bus"); setNewService(prev => ({ ...prev, type: "bus" })) }}
                                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", serviceType === 'bus' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        <Bus className="h-4 w-4" /> Bus
                                    </button>
                                    <button
                                        onClick={() => { setServiceType("flight"); setNewService(prev => ({ ...prev, type: "flight" })) }}
                                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", serviceType === 'flight' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        <Plane className="h-4 w-4" /> Flight
                                    </button>
                                    <button
                                        onClick={() => { setServiceType("movie"); setNewService(prev => ({ ...prev, type: "movie" })) }}
                                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", serviceType === 'movie' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >
                                        <Film className="h-4 w-4" /> Movie
                                    </button>
                                </div>

                                <Card className="p-6 border-0 shadow-xl bg-white/80 backdrop-blur-md rounded-2xl">
                                    {serviceType === 'appointment' && (
                                        <DoctorForm data={newService} onChange={setNewService} />
                                    )}
                                    {(serviceType === 'bus' || serviceType === 'flight') && (
                                        <TransportForm data={newService} onChange={setNewService} type={serviceType} />
                                    )}
                                    {serviceType === 'movie' && (
                                        <MovieForm data={newService} onChange={setNewService} />
                                    )}
                                </Card>

                                <div className="flex justify-end gap-3 sticky bottom-6 z-10">
                                    <Button
                                        onClick={handleAddService}
                                        size="lg"
                                        className="bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/20 transition-all font-semibold px-8 rounded-full"
                                    >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Publish Service
                                    </Button>
                                </div>
                            </div>

                            {/* Right: Live Preview */}
                            <div className="lg:col-span-2 hidden lg:block sticky top-24 h-fit">
                                <LivePreview data={{ ...newService, type: serviceType }} />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Service List View */
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                                <TabsList className="bg-background/60 backdrop-blur border h-11 p-1 rounded-full shadow-sm">
                                    <TabsTrigger value="all" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
                                    <TabsTrigger value="doctors" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Doctors</TabsTrigger>
                                    <TabsTrigger value="transport" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Transport</TabsTrigger>
                                    <TabsTrigger value="movies" className="rounded-full px-6 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Movies</TabsTrigger>
                                </TabsList>

                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search services..."
                                        className="pl-9 h-11 rounded-full bg-background/60 border-transparent hover:bg-background/80 focus:bg-background transition-all shadow-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <TabsContent value={activeTab} className="mt-0 min-h-[400px]">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredServices.map((service) => (
                                        <div key={service.id} className="group relative animate-in zoom-in-95 duration-300">
                                            <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />
                                            <div className="relative h-full bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/30 transition-all flex flex-col justify-between shadow-sm hover:shadow-md">
                                                <Link href={`/admin/service/${service.id}`} className="absolute inset-0 z-0" aria-label={`Edit ${service.title}`} />
                                                <div className="relative z-10 pointer-events-none">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="p-2.5 rounded-xl bg-muted text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                                            {getIcon(service.type)}
                                                        </div>
                                                        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider">
                                                            {service.type}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-bold text-lg leading-tight mb-1 group-hover:text-primary transition-colors">{service.title}</h3>
                                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.subtitle}</p>

                                                    {service.details?.specialization && (
                                                        <div className="flex flex-wrap gap-1 mb-4">
                                                            {service.details.specialization.split(',').slice(0, 2).map((tag: string, i: number) => (
                                                                <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-primary/5 text-primary font-medium border border-primary/10">
                                                                    {tag.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="relative z-20 flex items-center justify-between pt-4 border-t border-border/40 mt-auto">
                                                    <span className="font-bold text-sm bg-muted/30 px-2 py-1 rounded-md">
                                                        {service.currency} {service.price}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <Link href={`/admin/service/${service.id}`}>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-muted-foreground hover:bg-primary/10 hover:text-primary h-8 w-8 hover:scale-110 transition-all"
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-8 w-8 hover:scale-110 transition-all"
                                                            onClick={async (e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (confirm(`Delete ${service.title}?`)) {
                                                                    try {
                                                                        await deleteService(service.id);
                                                                    } catch (error) {
                                                                        console.error('[Admin] ✗ Delete failed:', error);
                                                                        alert('Failed to delete service. Please try again.');
                                                                    }
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {filteredServices.length === 0 && (
                                        <div className="col-span-full py-20 text-center text-muted-foreground">
                                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Briefcase className="h-8 w-8 opacity-50" />
                                            </div>
                                            <h3 className="text-lg font-medium mb-1">No services found</h3>
                                            <p className="max-w-xs mx-auto mb-6">There are no services in this category matching your search.</p>
                                            <Button onClick={() => setIsAddMode(true)}>
                                                Create First Service
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </main>
        </div>
    );
}
