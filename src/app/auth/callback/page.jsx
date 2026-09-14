"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/client";

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const next = searchParams.get("next") || "/Dashboard";

            // 1. Check if PKCE code is in query params
            const code = searchParams.get("code");
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code);
                if (!error) {
                    router.push(next);
                    router.refresh();
                    return;
                }
            }

            // 2. Check if a user session is already established (e.g. from hash fragment)
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session) {
                router.push(next);
                router.refresh();
                return;
            }

            // 3. Listen for auth state changes if session is still processing
            const {
                data: { subscription },
            } = supabase.auth.onAuthStateChange((event, session) => {
                if (session) {
                    router.push(next);
                    router.refresh();
                }
            });

            // 4. Fallback timeout if authentication fails
            const timer = setTimeout(async () => {
                const {
                    data: { session: currentSession },
                } = await supabase.auth.getSession();

                if (currentSession) {
                    router.push(next);
                    router.refresh();
                } else {
                    router.push("/login?error=Could%20not%20authenticate");
                }
            }, 2500);

            return () => {
                subscription?.unsubscribe();
                clearTimeout(timer);
            };
        };

        handleAuthCallback();
    }, [router, searchParams]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground font-medium">
                    Completing authentication...
                </p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            }
        >
            <AuthCallbackContent />
        </Suspense>
    );
}
