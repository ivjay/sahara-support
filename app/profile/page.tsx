"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Edit3,
    Save,
    X as XIcon
} from "lucide-react";
import Link from "next/link";
import { useChatContext } from "@/lib/chat/chat-context";
import { UserProfile, CURRENT_USER } from "@/lib/user-context";
import { useBookings } from "@/lib/services/booking-context";
import { Ticket, Clock, ExternalLink } from "lucide-react";

// Use centralized user context
const DEFAULT_PROFILE = CURRENT_USER;

export default function ProfilePage() {
    const { state, updateUserProfile } = useChatContext();
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

    // Sync with global state on mount or when context updates (only if not editing)
    useEffect(() => {
        if (!isEditing && state.userProfile) {
            setProfile(state.userProfile);
        }
    }, [state.userProfile, isEditing]);

    const handleSave = () => {
        setIsEditing(false);
        updateUserProfile(profile);
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (state.userProfile) {
            setProfile(state.userProfile);
        } else {
            setProfile(DEFAULT_PROFILE);
        }
    };

    const updateField = (key: keyof UserProfile, value: string) => {
        setProfile(prev => ({ ...prev, [key]: value }));
    };

    return (
        <main className="h-dvh overflow-y-auto flex flex-col bg-background relative">
            {/* Background Effects */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-chart-2/10 rounded-full blur-[120px]" />
            </div>

            {/* Header */}
            <header className="p-4 sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-border/50">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/chat">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="font-semibold">My Profile</h1>
                    </div>
                    <div>
                        {isEditing ? (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={handleCancel} className="rounded-full">
                                    <XIcon className="h-4 w-4" />
                                </Button>
                                <Button size="sm" onClick={handleSave} className="rounded-full gap-2">
                                    <Save className="h-4 w-4" />
                                    Save
                                </Button>
                            </div>
                        ) : (
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} className="rounded-full hover:bg-muted">
                                <Edit3 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 px-4 pb-10 max-w-2xl mx-auto w-full flex flex-col gap-5">

                {/* Profile Header Card */}
                <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm mt-4">
                    <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/20 text-2xl font-bold text-primary-foreground">
                                {profile.avatarInitials}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-background p-1 rounded-full shadow-sm border border-border">
                                <div className="bg-green-500 rounded-full p-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            {isEditing ? (
                                <Input
                                    value={profile.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    className="font-bold text-lg h-9"
                                />
                            ) : (
                                <h1 className="text-xl font-bold tracking-tight truncate">{profile.name}</h1>
                            )}
                            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
                                    <ShieldCheck className="w-3 h-3" />
                                    KYC Verified
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                    {profile.accountType}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}

                {/* My Bookings History */}
                <BookingsSection />

                <SectionCard title="Personal Information" icon={User}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoField
                            label="Full Name"
                            value={profile.name}
                            isEditing={isEditing}
                            onChange={(val) => updateField("name", val)}
                        />
                        <InfoField
                            label="Date of Birth"
                            value={profile.dateOfBirth}
                            isEditing={isEditing}
                            onChange={(val) => updateField("dateOfBirth", val)}
                        />
                        <InfoField
                            label="Gender"
                            value={profile.gender}
                            isEditing={isEditing}
                            onChange={(val) => updateField("gender", val)}
                        />
                        <InfoField
                            label="Nationality"
                            value={profile.nationality}
                            isEditing={isEditing}
                            onChange={(val) => updateField("nationality", val)}
                        />
                    </div>
                </SectionCard>

                {/* Contact Details */}
                <SectionCard title="Contact Details" icon={Phone}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoField label="Email Address" value={profile.email} icon={Mail} />
                        <InfoField
                            label="Primary Phone"
                            value={profile.phone}
                            icon={Phone}
                            isEditing={isEditing}
                            onChange={(val) => updateField("phone", val)}
                        />
                        <InfoField
                            label="Alternate Phone"
                            value={profile.alternatePhone}
                            icon={Phone}
                            isEditing={isEditing}
                            onChange={(val) => updateField("alternatePhone", val)}
                        />
                        <InfoField label="Sahara ID" value={profile.idNumber} icon={CreditCard} />
                    </div>
                </SectionCard>

                {/* Address Information */}
                <SectionCard title="Address" icon={Home}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoField
                            label="Current Address"
                            value={profile.currentAddress}
                            fullWidth
                            isEditing={isEditing}
                            onChange={(val) => updateField("currentAddress", val)}
                        />
                        <InfoField
                            label="Permanent Address"
                            value={profile.permanentAddress}
                            fullWidth
                            isEditing={isEditing}
                            onChange={(val) => updateField("permanentAddress", val)}
                        />
                        <InfoField
                            label="City"
                            value={profile.city}
                            isEditing={isEditing}
                            onChange={(val) => updateField("city", val)}
                        />
                        <InfoField
                            label="Postal Code"
                            value={profile.postalCode}
                            isEditing={isEditing}
                            onChange={(val) => updateField("postalCode", val)}
                        />
                    </div>
                </SectionCard>

                {/* Emergency Contact */}
                <SectionCard title="Emergency Contact" icon={AlertCircle}>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <InfoField
                            label="Contact Name"
                            value={profile.emergencyName}
                            isEditing={isEditing}
                            onChange={(val) => updateField("emergencyName", val)}
                        />
                        <InfoField
                            label="Relationship"
                            value={profile.emergencyRelation}
                            isEditing={isEditing}
                            onChange={(val) => updateField("emergencyRelation", val)}
                        />
                        <InfoField
                            label="Phone Number"
                            value={profile.emergencyPhone}
                            fullWidth
                            isEditing={isEditing}
                            onChange={(val) => updateField("emergencyPhone", val)}
                        />
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
                    <p>Member since {profile.memberSince}</p>
                    <p className="mt-1">Sahara v1.0.0</p>
                </div>

            </div>
        </main>
    );
}

// Bookings Section Component
function BookingsSection() {
    const { bookings } = useBookings();

    if (bookings.length === 0) return null;

    return (
        <SectionCard title="My Booking History" icon={Ticket}>
            <div className="space-y-3">
                {bookings.map((booking) => (
                    <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors gap-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${booking.type === 'bus' ? 'bg-orange-500/10 text-orange-600' :
                                    booking.type === 'flight' ? 'bg-blue-500/10 text-blue-600' :
                                        booking.type === 'movie' ? 'bg-purple-500/10 text-purple-600' :
                                            'bg-green-500/10 text-green-600'
                                }`}>
                                {booking.type === 'bus' ? <span className="text-lg">🚌</span> :
                                    booking.type === 'flight' ? <span className="text-lg">✈️</span> :
                                        booking.type === 'movie' ? <span className="text-lg">🎬</span> :
                                            <span className="text-lg">🏥</span>}
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">{booking.title}</h3>
                                <p className="text-xs text-muted-foreground">{booking.subtitle} • {new Date(booking.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end">
                            <span className="text-xs font-bold px-2 py-1 bg-green-500/10 text-green-600 rounded-md border border-green-500/20">
                                {booking.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
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
function InfoField({
    label,
    value,
    icon: Icon,
    fullWidth,
    isEditing,
    onChange
}: {
    label: string,
    value: string,
    icon?: any,
    fullWidth?: boolean,
    isEditing?: boolean,
    onChange?: (val: string) => void
}) {
    return (
        <div className={`space-y-1 ${fullWidth ? 'sm:col-span-2' : ''}`}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-muted-foreground/50 shrink-0" />}
                {isEditing && onChange ? (
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-8 text-sm"
                    />
                ) : (
                    <p className="text-sm font-medium min-h-[20px]">{value}</p>
                )}
            </div>
        </div>
    );
}
