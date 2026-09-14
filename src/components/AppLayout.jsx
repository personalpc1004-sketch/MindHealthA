"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/Authprovider";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }) {
    const pathname = usePathname();
    const { user } = useAuth();

    // Hide sidebar on auth routes or landing page if unauthenticated
    const hideSidebarRoutes = ["/login", "/signup"];
    const isAuthRoute = pathname?.startsWith("/auth");
    const isHomeUnauthenticated = pathname === "/" && !user;

    const shouldHideSidebar =
        hideSidebarRoutes.includes(pathname) || isAuthRoute || isHomeUnauthenticated;

    if (shouldHideSidebar) {
        return <main className="w-full min-h-screen">{children}</main>;
    }

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <main className="flex-1 pl-64 w-full transition-all">
                {children}
            </main>
        </div>
    );
}
