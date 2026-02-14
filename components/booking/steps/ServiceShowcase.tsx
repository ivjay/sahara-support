"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star, Users, Calendar, Sparkles } from "lucide-react";

interface ServiceShowcaseProps {
    service: any;
    serviceType: 'movie' | 'bus' | 'flight' | 'appointment';
}

const SERVICE_SLOGANS = {
    movie: "🎬 Lights, Camera, Action! Let's book your perfect movie experience.",
    bus: "🚌 Your journey begins here. Comfortable travel awaits!",
    flight: "✈️ Soar high with confidence. Book your flight in seconds!",
    appointment: "🏥 Your health matters. Schedule your appointment with ease."
};

const SERVICE_FEATURES = {
    movie: [
        { icon: Calendar, text: "Latest releases" },
        { icon: Users, text: "Group bookings" },
        { icon: MapPin, text: "Multiple locations" }
    ],
    bus: [
        { icon: Clock, text: "On-time departure" },
        { icon: Users, text: "Spacious seating" },
        { icon: Star, text: "Rated service" }
    ],
    flight: [
        { icon: Clock, text: "Quick boarding" },
        { icon: Star, text: "Premium service" },
        { icon: MapPin, text: "Major routes" }
    ],
    appointment: [
        { icon: Star, text: "Expert specialists" },
        { icon: Clock, text: "Flexible timings" },
        { icon: MapPin, text: "Convenient location" }
    ]
};

export function ServiceShowcase({ service, serviceType }: ServiceShowcaseProps) {
    const slogan = SERVICE_SLOGANS[serviceType];
    const features = SERVICE_FEATURES[serviceType];

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Selected Service</span>
                </div>
                <h2 className="text-3xl font-bold">{service.title}</h2>
                <p className="text-lg text-muted-foreground">{slogan}</p>
            </div>

            {/* Service Card */}
            <Card className="p-6 border-2 border-primary/20">
                <div className="space-y-4">
                    {/* Main Details */}
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-semibold text-xl mb-2">{service.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                <MapPin className="w-4 h-4" />
                                <span>{service.subtitle}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                                {service.currency} {service.price}
                            </div>
                            <p className="text-xs text-muted-foreground">per {serviceType === 'appointment' ? 'session' : 'person'}</p>
                        </div>
                    </div>

                    {/* Service Details Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                        {Object.entries(service.details || {}).slice(0, 4).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                                <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                                <p className="text-sm font-medium">{value as string}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4">
                {features.map((feature, idx) => (
                    <div key={idx} className="text-center p-4 rounded-lg bg-muted/50">
                        <feature.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <p className="text-xs font-medium">{feature.text}</p>
                    </div>
                ))}
            </div>

            {/* Availability Badge */}
            {service.available && (
                <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-600 dark:text-green-400 font-medium">Available Now</span>
                </div>
            )}

            {/* CTA Text */}
            <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                    Click <span className="font-semibold text-primary">Next</span> to begin your booking journey →
                </p>
            </div>
        </div>
    );
}
