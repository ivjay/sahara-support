"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    ArrowLeft,
    MessageCircle,
    Mail,
    FileText,
    ExternalLink,
    Search,
    HelpCircle,
    Zap,
    Users,
    Shield,
    ChevronRight,
} from "lucide-react";
import { useState } from "react";

const faqItems = [
    {
        icon: Zap,
        question: "How do I book a bus ticket?",
        answer: "Simply ask Sahara to book a bus ticket and provide your destination, date, and preferences."
    },
    {
        icon: Users,
        question: "Can I book for multiple passengers?",
        answer: "Yes! Just tell Sahara how many passengers and provide their details when prompted."
    },
    {
        icon: Shield,
        question: "Is my data secure?",
        answer: "Absolutely. We use industry-standard encryption and never share your personal information."
    },
];

export default function HelpPage() {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="min-h-dvh bg-gradient-to-b from-muted/30 to-background">
            {/* Header */}
            <header className="h-14 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
                <div className="flex items-center gap-4 px-4 h-full max-w-2xl mx-auto">
                    <Link href="/chat">
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">Help & Support</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-2xl mx-auto p-6 space-y-8">
                {/* Hero Section */}
                <section className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center">
                        <HelpCircle className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">How can we help?</h2>
                    <p className="text-muted-foreground">Search our help center or browse topics below</p>
                </section>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search for help..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 pl-12 rounded-xl text-[15px]"
                    />
                </div>

                {/* Quick Links */}
                <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Quick Links</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <p className="font-medium text-[14px]">Getting Started</p>
                            <p className="text-[12px] text-muted-foreground">Learn the basics</p>
                        </Card>
                        <Card className="p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                <MessageCircle className="h-5 w-5 text-primary" />
                            </div>
                            <p className="font-medium text-[14px]">Chat Tips</p>
                            <p className="text-[12px] text-muted-foreground">Get better results</p>
                        </Card>
                    </div>
                </section>

                {/* FAQ Section */}
                <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Frequently Asked Questions</h3>
                    <Card className="divide-y divide-border">
                        {faqItems.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <item.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-medium">{item.question}</p>
                                        <p className="text-[12px] text-muted-foreground line-clamp-1">{item.answer}</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                            </div>
                        ))}
                    </Card>
                </section>

                {/* Contact Section */}
                <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">Still need help?</h3>
                    <Card className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium">Contact Support</p>
                                <p className="text-[13px] text-muted-foreground">We usually respond within 24 hours</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Input placeholder="Your email" className="h-11 rounded-xl" />
                            <Textarea placeholder="Describe your issue..." className="min-h-[100px] rounded-xl resize-none" />
                            <Button className="w-full h-11 rounded-xl">
                                Send Message
                                <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </Card>
                </section>

                {/* Links */}
                <div className="flex justify-center gap-6 text-[13px] text-muted-foreground">
                    <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
                    <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
                </div>
            </main>
        </div>
    );
}
