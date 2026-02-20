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
                                <Button variant="outline" size="sm" onClick={handleCancel} className="rounded-full gap-2">
                                    <XIcon className="h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleSave} className="rounded-full gap-2 bg-primary">
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        ) : (
                            <Button variant="default" size="sm" onClick={() => setIsEditing(true)} className="rounded-full gap-2 bg-primary hover:bg-primary/90">
                                <Edit3 className="h-4 w-4" />
                                Edit Profile
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 px-4 pb-10 max-w-2xl mx-auto w-full flex flex-col gap-5">

                {/* Incomplete Profile Banner */}
                {!isEditing && (!profile.phone || !profile.dateOfBirth || !profile.currentAddress) && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mt-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-1">
                                Complete Your Profile
                            </h3>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
                                Add your personal details to get personalized recommendations and faster bookings.
                            </p>
                            <Button
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white rounded-full gap-2 h-8"
                            >
                                <Edit3 className="h-3.5 w-3.5" />
                                Fill Out Details
                            </Button>
                        </div>
                    </div>
                )}

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
    const [expanded, setExpanded] = useState<string | null>(null);

    if (bookings.length === 0) return null;

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'bus': return { emoji: '🚌', color: 'bg-orange-500/10 text-orange-600 border-orange-200', badge: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Bus' };
            case 'flight': return { emoji: '✈️', color: 'bg-blue-500/10 text-blue-600 border-blue-200', badge: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Flight' };
            case 'movie': return { emoji: '🎬', color: 'bg-purple-500/10 text-purple-600 border-purple-200', badge: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Movie' };
            default: return { emoji: '🏥', color: 'bg-green-500/10 text-green-600 border-green-200', badge: 'bg-green-50 text-green-700 border-green-200', label: 'Appointment' };
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Confirmed': return 'bg-green-50 text-green-700 border border-green-200';
            case 'Under Review': return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
            case 'Cancelled': return 'bg-red-50 text-red-700 border border-red-200';
            default: return 'bg-gray-50 text-gray-700 border border-gray-200';
        }
    };

    const getLocation = (booking: any) => {
        return booking.subtitle ||
            booking.details?.hospital ||
            booking.details?.clinic ||
            booking.details?.theater ||
            booking.details?.to ||
            null;
    };

    const getTime = (booking: any) => {
        return booking.details?.time || null;
    };

    const getSeats = (booking: any) => {
        if (!booking.details?.seats || booking.details.seats.length === 0) return null;
        return Array.isArray(booking.details.seats)
            ? booking.details.seats.join(', ')
            : booking.details.seats;
    };

    const getPatients = (booking: any) => {
        const passengers = booking.details?.passengers || [];
        return passengers.map((p: any) => p.fullName).filter(Boolean);
    };

    return (
        <SectionCard title="My Bookings & Appointments" icon={Ticket}>
            <div className="space-y-3">
                {bookings.map((booking) => {
                    const config = getTypeConfig(booking.type);
                    const location = getLocation(booking);
                    const time = getTime(booking);
                    const seats = getSeats(booking);
                    const patients = getPatients(booking);
                    const isExpanded = expanded === booking.id;
                    const isAppointment = booking.type === 'appointment';

                    return (
                        <div key={booking.id} className="rounded-xl border border-border/60 overflow-hidden bg-card">
                            {/* Main Row */}
                            <button
                                onClick={() => setExpanded(isExpanded ? null : booking.id)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left"
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${config.color}`}>
                                    <span className="text-lg">{config.emoji}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-sm truncate">{booking.title}</h3>
                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${config.badge}`}>{config.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                        <span>📅 {new Date(booking.date).toLocaleDateString()}</span>
                                        {time && <span>🕐 {time}</span>}
                                        {location && <span className="truncate">📍 {location}</span>}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${getStatusColor(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                    <span className="text-xs font-bold text-primary">{booking.amount}</span>
                                </div>
                            </button>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="border-t border-border/40 bg-muted/20 px-4 py-3 space-y-2">
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Booking ID</span>
                                            <p className="font-mono font-semibold">{booking.id}</p>
                                        </div>
                                        {location && (
                                            <div>
                                                <span className="text-muted-foreground">{isAppointment ? 'Clinic / Hospital' : 'Location'}</span>
                                                <p className="font-medium">{location}</p>
                                            </div>
                                        )}
                                        {time && (
                                            <div>
                                                <span className="text-muted-foreground">Time</span>
                                                <p className="font-medium">{time}</p>
                                            </div>
                                        )}
                                        {seats && (
                                            <div>
                                                <span className="text-muted-foreground">Seats</span>
                                                <p className="font-medium">{seats}</p>
                                            </div>
                                        )}
                                        {patients.length > 0 && (
                                            <div className="col-span-2">
                                                <span className="text-muted-foreground">{isAppointment ? 'Patient(s)' : 'Passenger(s)'}</span>
                                                <p className="font-medium">{patients.join(', ')}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex gap-2 pt-2">
                                        {isAppointment && booking.status === 'Confirmed' && (
                                            <a
                                                href="/chat"
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                            >
                                                <Calendar className="w-3 h-3" />
                                                Reschedule
                                            </a>
                                        )}
                                        <a
                                            href="/chat"
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Get Help
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
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
    const placeholders: Record<string, string> = {
        "Date of Birth": "YYYY-MM-DD",
        "Gender": "Male/Female/Other",
        "Nationality": "e.g., Nepali",
        "Primary Phone": "+977-XXX-XXXXXXX",
        "Alternate Phone": "+977-XXX-XXXXXXX",
        "Current Address": "Enter your current address",
        "Permanent Address": "Enter your permanent address",
        "City": "e.g., Kathmandu",
        "Postal Code": "e.g., 44600",
        "Contact Name": "Emergency contact name",
        "Relationship": "e.g., Spouse, Parent",
        "Phone Number": "+977-XXX-XXXXXXX"
    };

    return (
        <div className={`space-y-1 ${fullWidth ? 'sm:col-span-2' : ''}`}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-muted-foreground/50 shrink-0" />}
                {isEditing && onChange ? (
                    <Input
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholders[label] || `Enter ${label.toLowerCase()}`}
                        className="h-8 text-sm"
                    />
                ) : (
                    <p className={`text-sm font-medium min-h-[20px] ${!value && 'text-muted-foreground/50 italic'}`}>
                        {value || "Not provided"}
                    </p>
                )}
            </div>
        </div>
    );
}
