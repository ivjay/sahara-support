"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    Moon,
    Bell,
    Globe,
    Shield,
    Trash2,
    ChevronRight,
    Palette,
    MessageSquare,
    Volume2,
} from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [sounds, setSounds] = useState(true);

    const toggleDarkMode = (checked: boolean) => {
        setDarkMode(checked);
        document.documentElement.classList.toggle("dark", checked);
    };

    return (
        <div className="h-dvh overflow-y-auto bg-gradient-to-b from-muted/30 to-background">
            {/* Header */}
            <header className="h-14 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
                <div className="flex items-center gap-4 px-4 h-full max-w-2xl mx-auto">
                    <Link href="/chat">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">Settings</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-2xl mx-auto p-6 space-y-6">
                {/* Appearance Section */}
                <section>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Appearance</h2>
                    <Card className="divide-y divide-border">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Moon className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <Label className="text-[15px] font-medium">Dark Mode</Label>
                                    <p className="text-[13px] text-muted-foreground">Switch to dark theme</p>
                                </div>
                            </div>
                            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
                        </div>
                    </Card>
                </section>

                {/* Notifications Section */}
                <section>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Notifications</h2>
                    <Card className="divide-y divide-border">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Bell className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <Label className="text-[15px] font-medium">Push Notifications</Label>
                                    <p className="text-[13px] text-muted-foreground">Get notified about updates</p>
                                </div>
                            </div>
                            <Switch checked={notifications} onCheckedChange={setNotifications} />
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Volume2 className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <Label className="text-[15px] font-medium">Sound Effects</Label>
                                    <p className="text-[13px] text-muted-foreground">Play sounds for messages</p>
                                </div>
                            </div>
                            <Switch checked={sounds} onCheckedChange={setSounds} />
                        </div>
                    </Card>
                </section>

                {/* Chat Section */}
                <section>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Chat</h2>
                    <Card className="divide-y divide-border">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Globe className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <Label className="text-[15px] font-medium">Language</Label>
                                    <p className="text-[13px] text-muted-foreground">English (US)</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <Label className="text-[15px] font-medium">Chat History</Label>
                                    <p className="text-[13px] text-muted-foreground">Manage your conversations</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                    </Card>
                </section>

                {/* Privacy Section */}
                <section>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">Privacy & Data</h2>
                    <Card className="divide-y divide-border">
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <Label className="text-[15px] font-medium">Privacy Policy</Label>
                                    <p className="text-[13px] text-muted-foreground">Read our privacy policy</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                    <Label className="text-[15px] font-medium text-destructive">Delete All Data</Label>
                                    <p className="text-[13px] text-muted-foreground">Remove all your data</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                    </Card>
                </section>

                {/* Version info */}
                <p className="text-center text-[12px] text-muted-foreground pt-4">
                    Sahara v1.0.0 • Made with ❤️
                </p>
            </main>
        </div>
    );
}
