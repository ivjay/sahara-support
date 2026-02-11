"use client";

import { PendingBookingsList } from "@/components/admin/PendingBookingsList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VerifyPage() {
    return (
        <div className="min-h-screen bg-muted/10 font-sans p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin">
                        <Button variant="outline" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Payment Verification</h1>
                        <p className="text-muted-foreground">Approve online claims and mark counter payments</p>
                    </div>
                </div>

                <PendingBookingsList />
            </div>
        </div>
    );
}
