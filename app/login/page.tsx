"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/logo";
import { Loader2, Mail, Lock, User, Eye, EyeOff, UserCircle } from "lucide-react";

export default function LoginPage() {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail, continueAsGuest, user, loading } = useAuth();
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redirect if already logged in
    if (!loading && user) {
        router.replace("/chat");
        return null;
    }

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            if (isSignUp) {
                if (!name.trim()) {
                    setError("Name is required");
                    setIsSubmitting(false);
                    return;
                }
                await signUpWithEmail(email, password, name);
            } else {
                await signInWithEmail(email, password);
            }
            router.push("/chat");
        } catch (err: any) {
            const code = err?.code || "";
            if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
                setError("Invalid email or password");
            } else if (code === "auth/email-already-in-use") {
                setError("An account with this email already exists");
            } else if (code === "auth/weak-password") {
                setError("Password should be at least 6 characters");
            } else if (code === "auth/invalid-email") {
                setError("Invalid email address");
            } else {
                setError(err?.message || "Authentication failed");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError("");
        try {
            await signInWithGoogle();
            router.push("/chat");
        } catch (err: any) {
            if (err?.code !== "auth/popup-closed-by-user") {
                setError(err?.message || "Google sign-in failed");
            }
        }
    };

    const handleGuestMode = () => {
        continueAsGuest();
        router.push("/chat");
    };

    if (loading) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-dvh flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-20 -left-20 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-chart-2/15 to-transparent rounded-full blur-[120px]" />
                <div className="absolute bottom-20 -right-20 w-[500px] h-[500px] bg-gradient-to-tl from-chart-3/20 via-primary/15 to-transparent rounded-full blur-[120px]" />
            </div>

            <Card className="w-full max-w-md p-8 shadow-2xl border-border/50 bg-card/95 backdrop-blur-md">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo size="md" showText={false} />
                    </div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        {isSignUp ? "Create Account" : "Welcome to Sahara"}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {isSignUp ? "Sign up to unlock all features" : "Sign in to book and manage your services"}
                    </p>
                </div>

                {/* Google Sign-in */}
                <Button
                    variant="outline"
                    className="w-full h-12 gap-3 text-sm font-medium rounded-xl border-2 hover:bg-muted/50"
                    onClick={handleGoogleSignIn}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </Button>

                <div className="relative my-6">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                        or
                    </span>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                    {isSignUp && (
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    placeholder="Your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 h-11 rounded-xl"
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-11 rounded-xl"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10 h-11 rounded-xl"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive font-medium">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-indigo-600 hover:shadow-lg hover:shadow-primary/25 transition-all"
                        disabled={isSubmitting}
                    >
                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        {isSignUp ? "Create Account" : "Sign In"}
                    </Button>
                </form>

                {/* Toggle Sign Up / Sign In */}
                <p className="text-center text-sm text-muted-foreground mt-4">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                        className="text-primary font-semibold hover:underline"
                    >
                        {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                </p>

                <div className="relative my-5">
                    <Separator />
                </div>

                {/* Guest Mode */}
                <Button
                    variant="ghost"
                    className="w-full h-11 gap-2 text-sm text-muted-foreground hover:text-foreground rounded-xl"
                    onClick={handleGuestMode}
                >
                    <UserCircle className="h-4 w-4" />
                    Continue as Guest
                </Button>
                <p className="text-center text-[11px] text-muted-foreground mt-1">
                    Browse services freely. Sign in required to confirm bookings.
                </p>
            </Card>
        </div>
    );
}
