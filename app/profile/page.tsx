"use client";

import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Calendar,
    User,
    Heart,
    Briefcase,
    Home,
    AlertCircle,
    Edit3
} from "lucide-react";
import Link from "next/link";
import { CURRENT_USER } from "@/lib/user-context";

// Use centralized user context
const USER_PROFILE = CURRENT_USER;

export default function ProfilePage() {
    return (
        <main className="h-dvh overflow-y-auto flex flex-col bg-background relative">
            {/* Background Effects - Enhanced for light mode */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/15 dark:bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-chart-2/15 dark:bg-blue-500/10 rounded-full blur-[120px]" />
                {/* Subtle grid for light mode */}
                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />
            </div>

            {/* Header */}
            <header className="p-4 sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/50">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <Link href="/chat">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="font-semibold">My Profile</h1>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                        <Edit3 className="h-4 w-4" />
                    </Button>
                </div>
            </header>

            <div className="flex-1 px-4 pb-10 max-w-2xl mx-auto w-full flex flex-col gap-5">

                {/* Profile Header Card */}
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mt-4">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/20 text-2xl font-bold text-primary-foreground">
                                {USER_PROFILE.avatarInitials}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full shadow-sm border border-border">
                                <div className="bg-green-500 rounded-full p-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold tracking-tight truncate">{USER_PROFILE.name}</h1>
                            <p className="text-sm text-muted-foreground truncate">{USER_PROFILE.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                                    <ShieldCheck className="w-3 h-3" />
                                    KYC Verified
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                    {USER_PROFILE.accountType}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <SectionCard title="Personal Information" icon={User}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoField label="Full Name" value={USER_PROFILE.name} />
                        <InfoField label="Date of Birth" value={formatDate(USER_PROFILE.dateOfBirth)} />
                        <InfoField label="Gender" value={USER_PROFILE.gender} />
                        <InfoField label="Nationality" value={USER_PROFILE.nationality} />
                    </div>
                </SectionCard>

                {/* Contact Details */}
                <SectionCard title="Contact Details" icon={Phone}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoField label="Email Address" value={USER_PROFILE.email} icon={Mail} />
                        <InfoField label="Primary Phone" value={USER_PROFILE.phone} icon={Phone} />
                        <InfoField label="Alternate Phone" value={USER_PROFILE.alternatePhone} icon={Phone} />
                        <InfoField label="Sahara ID" value={USER_PROFILE.idNumber} icon={CreditCard} />
                    </div>
                </SectionCard>

                {/* Address Information */}
                <SectionCard title="Address" icon={Home}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoField label="Current Address" value={USER_PROFILE.currentAddress} fullWidth />
                        <InfoField label="Permanent Address" value={USER_PROFILE.permanentAddress} fullWidth />
                        <InfoField label="City" value={USER_PROFILE.city} />
                        <InfoField label="Postal Code" value={USER_PROFILE.postalCode} />
                    </div>
                </SectionCard>

                {/* Emergency Contact */}
                <SectionCard title="Emergency Contact" icon={AlertCircle}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoField label="Contact Name" value={USER_PROFILE.emergencyName} />
                        <InfoField label="Relationship" value={USER_PROFILE.emergencyRelation} />
                        <InfoField label="Phone Number" value={USER_PROFILE.emergencyPhone} fullWidth />
                    </div>
                </SectionCard>

                {/* Preferences */}
                <SectionCard title="Travel Preferences" icon={Heart}>
                    <div className="flex flex-wrap gap-2">
                        {["Vegetarian", "Window Seat", "Morning Travel", "Budget Hotels", "Non-Smoking", "Aisle Preferred"].map((pref) => (
                            <span
                                key={pref}
                                className="px-3 py-1.5 bg-secondary border border-border/50 rounded-full text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors cursor-pointer"
                            >
                                {pref}
                            </span>
                        ))}
                    </div>
                </SectionCard>

                {/* Account Info Footer */}
                <div className="text-center text-xs text-muted-foreground pt-2 pb-6">
                    <p>Member since {USER_PROFILE.memberSince}</p>
                    <p className="mt-1">Sahara v1.0.0</p>
                </div>

            </div>
        </main>
    );
}

// Section Card Component
function SectionCard({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
    return (
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
            </div>
            {children}
        </div>
    );
}

// Info Field Component
function InfoField({ label, value, icon: Icon, fullWidth }: { label: string, value: string, icon?: any, fullWidth?: boolean }) {
    return (
        <div className={`space-y-1 ${fullWidth ? 'sm:col-span-2' : ''}`}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-muted-foreground/50" />}
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

// Helper to format date
function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
