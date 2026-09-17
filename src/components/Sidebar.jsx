"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Brain,
    LayoutDashboard,
    BookOpen,
    Activity,
    Wrench,
    User,
    LogOut,
} from "lucide-react";

import { useAuth } from "@/app/context/Authprovider";
import { supabase } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    const navLinks = [
        { href: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/Journal", label: "Journal", icon: BookOpen },
        { href: "/Exercises", label: "Exercises", icon: Activity },
        { href: "/Tools", label: "Tools", icon: Wrench },
        { href: "/Profile", label: "Profile", icon: User },
    ];

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <aside className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-40 shadow-sm">
            {/* Logo */}
            <div className="h-16 px-6 border-b border-border flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                    <Brain className="h-5 w-5" />
                </div>
                <span className="font-bold text-xl tracking-tight text-foreground">
                    MindHealthAI
                </span>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Sign Out Footer */}
            {user && (
                <div className="p-4 border-t border-border bg-card/50 space-y-3">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20">
                            {user.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                                {user.email}
                            </p>
                            <p className="text-[10px] text-muted-foreground">Logged in</p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-xs"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Log Out</span>
                    </Button>
                </div>
            )}
        </aside>
    );
}
