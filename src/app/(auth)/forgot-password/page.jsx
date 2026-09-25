"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        setMessage("Password reset link sent! Please check your email inbox.");
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
                <div>
                    <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                        <Brain className="h-7 w-7 text-[#FF6600]" />
                        <span>MindHealthAI</span>
                    </Link>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Reset your password
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Enter your email address and we&apos;ll send you instructions to reset your password.
                    </p>
                </div>

                <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Email <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-11 rounded-xl border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm px-4"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-rose-500 font-medium">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p className="text-xs text-emerald-600 font-medium">
                            {message}
                        </p>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 bg-black hover:bg-slate-900 text-white font-medium text-sm rounded-full shadow-md transition-transform active:scale-[0.99]"
                        disabled={loading}
                    >
                        {loading ? "Sending link..." : "Send Reset Link"}
                    </Button>
                </form>

                <div className="pt-2 text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Login</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
