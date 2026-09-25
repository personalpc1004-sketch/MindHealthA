"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Brain,
    LayoutDashboard,
    Bot,
    BookOpen,
    Activity,
    Wrench,
    User,
    LogOut,
    Video,
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
        { href: "/Interview", label: "AI Video Interview", icon: Video, badge: "Voice+Cam" },
        { href: "/Assessment", label: "AI Assessment", icon: Brain, badge: "AI" },
        { href: "/Chatbot", label: "AI Medical Chat", icon: Bot },
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
        <aside className="w-64 h-screen bg-white border-r border-orange-100 flex flex-col fixed left-0 top-0 z-40 shadow-sm">
            {/* Logo */}
            <div className="h-16 px-6 border-b border-orange-100 flex items-center gap-3 bg-gradient-to-r from-orange-50/50 to-white">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-500/20">
                    <Brain className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                    <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                        MindHealth<span className="text-orange-600">AI</span>
                    </span>
                    <span className="text-[10px] font-semibold tracking-wider text-orange-500 uppercase mt-0.5">
                        PDF Analytics
                    </span>
                </div>
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
                                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold shadow-md shadow-orange-500/25"
                                    : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-500 group-hover:text-orange-600")} />
                                <span>{link.label}</span>
                            </div>
                            {link.badge && (
                                <span
                                    className={cn(
                                        "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider",
                                        isActive
                                            ? "bg-white/20 text-white border border-white/30"
                                            : "bg-orange-100 text-orange-700 border border-orange-200"
                                    )}
                                >
                                    {link.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile & Sign Out Footer */}
            {user && (
                <div className="p-4 border-t border-orange-100 bg-gradient-to-b from-white to-orange-50/40 space-y-3">
                    <div className="flex items-center gap-3 px-2">
                        <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm border border-orange-200 shadow-xs">
                            {user.email?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                                {user.email}
                            </p>
                            <p className="text-[10px] font-medium text-orange-600 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse inline-block" />
                                Active Account
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 text-xs border-orange-200 text-slate-700 hover:bg-orange-100 hover:text-orange-700 hover:border-orange-300 transition-colors"
                        onClick={handleSignOut}
                    >
                        <LogOut className="h-3.5 w-3.5 text-orange-600" />
                        <span>Log Out</span>
                    </Button>
                </div>
            )}
        </aside>
    );
}
