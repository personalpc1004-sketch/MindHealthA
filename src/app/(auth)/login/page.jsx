"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
    Brain,
    BarChart3,
    Calendar,
    ArrowUpRight,
    PieChart,
    Check,
} from "lucide-react";

import { supabase } from "@/lib/client";
import { useAuth } from "@/app/context/Authprovider";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// Dynamically import HealthGraph with SSR disabled for Chart.js
const HealthGraph = dynamic(() => import("@/components/HealthGraph"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
    ),
});

function GoogleIcon(props) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
        </svg>
    );
}

function AppleIcon(props) {
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" {...props}>
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.32c.67-.82 1.13-1.96.99-3.12-1 .04-2.17.67-2.87 1.49-.62.72-1.15 1.88-1.01 3.01 1.12.09 2.22-.56 2.89-1.38z" />
        </svg>
    );
}

export default function Login() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Redirect authenticated users to Dashboard
    useEffect(() => {
        if (user) {
            router.push("/Dashboard");
            router.refresh();
        }
    }, [user, router]);

    // Check URL hash for OAuth tokens
    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
            setLoading(true);
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    router.push("/Dashboard");
                    router.refresh();
                }
            });
        }
    }, [router]);

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        router.push("/Dashboard");
        router.refresh();
    };

    const handleGoogleLogin = async () => {
        setError("");
        setGoogleLoading(true);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback?next=/Dashboard`,
            },
        });

        if (error) {
            setError(error.message);
            setGoogleLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-background grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden">
            {/* Left Column: Form & Details (Slightly Wider) */}
            <div className="lg:col-span-7 xl:col-span-7 flex flex-col justify-between min-h-screen p-6 sm:p-10 lg:p-12 xl:p-16">
                {/* Header Logo */}
                <div>
                    <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-2xl tracking-tight text-slate-900 dark:text-white">
                        <Brain className="h-7 w-7 text-[#FF6600]" />
                        <span>MindHealthAI</span>
                    </Link>
                </div>

                {/* Form Section */}
                <div className="my-auto py-6 space-y-6 max-w-lg w-full mx-auto">
                    <div className="space-y-2">
                        <h1 className="text-4xl sm:text-5xl font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
                            Welcome back,<br />

                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-normal pt-1">
                            We are glad to see you <br />
                            Please, enter your details
                        </p>
                    </div>

                    {/* Social Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border-slate-200 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 transition-colors"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading || loading}
                        >
                            <GoogleIcon />
                            <span className="text-xs sm:text-sm">Log in with Google</span>
                        </Button>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2.5 h-11 rounded-xl border-slate-200 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 transition-colors"
                            onClick={handleGoogleLogin}
                            disabled={googleLoading || loading}
                        >
                            <AppleIcon />
                            <span className="text-xs sm:text-sm">Log in with Apple</span>
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-6">
                        <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
                        <span className="bg-background px-3 text-xs text-slate-400 uppercase absolute font-medium">
                            or
                        </span>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
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

                        {/* Password */}
                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Password <span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 rounded-xl border-slate-200 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 text-sm px-4"
                                required
                            />
                        </div>

                        {/* Options row */}
                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
                                <div
                                    onClick={() => setRememberMe(!rememberMe)}
                                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${rememberMe
                                        ? "border-[#FF6600] bg-white"
                                        : "border-slate-300 bg-transparent"
                                        }`}
                                >
                                    {rememberMe && (
                                        <div className="w-2 h-2 rounded-full bg-[#FF6600]" />
                                    )}
                                </div>
                                <span>Remember me</span>
                            </label>

                            <Link
                                href="/forgot-password"
                                className="text-xs font-medium text-slate-900 dark:text-slate-200 hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <p className="text-xs text-rose-500 font-medium pt-1">
                                {error}
                            </p>
                        )}

                        {/* Submit Login Button */}
                        <Button
                            type="submit"
                            className="w-full h-12 bg-black hover:bg-slate-900 text-white font-medium text-sm rounded-full shadow-md transition-transform active:scale-[0.99] mt-2"
                            disabled={loading || googleLoading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </Button>
                    </form>

                    {/* Sign up Link */}
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
                        Don't have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-semibold text-slate-950 dark:text-white hover:underline"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>

                <div className="h-2"></div>
            </div>

            {/* Right Column: Whole Page Full-Height Orange Gradient Cover */}
            <div className="lg:col-span-5 xl:col-span-5 min-h-screen bg-gradient-to-br from-[#FFA06D] via-[#FF8042] to-[#FF5E1E] p-6 lg:p-10 flex flex-col justify-between relative overflow-hidden shadow-2xl">
                {/* Top Translucent Card Snippet */}
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-white max-w-sm w-full mx-auto shadow-lg space-y-3 transform -translate-y-1 opacity-90">
                    <p className="text-sm font-medium leading-snug">
                        missing key to our health & wellness success.
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                        <div className="h-8 w-8 rounded-full bg-white/40 flex items-center justify-center font-bold text-xs text-slate-900">
                            SJ
                        </div>
                        <div>
                            <h4 className="text-xs font-semibold leading-none">Sarah Johnson</h4>
                            <p className="text-[10px] text-white/80 mt-0.5">CEO at Health Solutions</p>
                        </div>
                    </div>
                </div>

                {/* Center Piece: Main White Card with Health Graph */}
                <div className="bg-white rounded-[28px] p-6 sm:p-8 shadow-2xl max-w-md w-full mx-auto my-auto space-y-5 border border-white/80 transform hover:scale-[1.01] transition-transform">
                    {/* Top Card Controls */}
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-center text-slate-700 shadow-xs">
                            <BarChart3 className="w-5 h-5 text-slate-700" />
                        </div>

                        <button type="button" className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-600 flex items-center gap-1.5 transition-colors">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Last month</span>
                        </button>
                    </div>

                    {/* Big Metric Display */}
                    <div className="flex items-baseline gap-3 pt-1">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                            +84.32%
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-xl text-xs font-bold">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>+84.32%</span>
                        </span>
                    </div>

                    {/* Chart.js Bar Chart Component */}
                    <div className="h-56 sm:h-64 w-full pt-2">
                        <HealthGraph />
                    </div>
                </div>

                {/* Bottom Translucent Card Snippet */}
                <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 text-white max-w-sm w-full mx-auto shadow-lg flex items-center justify-between opacity-80 transform translate-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                            <PieChart className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-xs font-medium">Daily Target</span>
                    </div>
                    <span className="text-xs font-semibold bg-white/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-white/90" />
                        <span>Last month</span>
                    </span>
                </div>
            </div>
        </div>
    );
}