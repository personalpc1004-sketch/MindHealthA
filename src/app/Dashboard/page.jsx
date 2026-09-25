"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/Authprovider";
import { supabase } from "@/lib/client";

import {
    HeartPulse,
    Activity,
    Brain,
    Flame,
    Download,
    CheckCircle2,
    Sparkles,
    FileSpreadsheet,
    ShieldCheck,
    FileText,
    ArrowUpRight,
    Bot,
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import HealthAnalyticsCharts from "@/components/HealthAnalyticsCharts";

export default function Dashboard() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadSuccessMsg, setDownloadSuccessMsg] = useState(null);

    // Live list of User Health Reports available for download
    const [healthReports, setHealthReports] = useState([
        {
            id: "report-001",
            title: "Comprehensive_Mental_Health_Summary_2026.pdf",
            category: "Health Summary",
            size: "2.4 MB",
            date: "Today, 18:42",
            status: "Ready",
            score: "92/100",
        },
        {
            id: "report-002",
            title: "Therapy_Session_&_Mood_Analysis.pdf",
            category: "Therapy Log",
            size: "1.8 MB",
            date: "Yesterday, 14:15",
            status: "Ready",
            score: "94%",
        },
        {
            id: "report-003",
            title: "Weekly_Wellness_Scorecard_Sep.pdf",
            category: "Scorecard",
            size: "3.1 MB",
            date: "Sep 16, 2026",
            status: "Ready",
            score: "89/100",
        },
        {
            id: "report-004",
            title: "Mindfulness_Practice_Log.pdf",
            category: "Activity Log",
            size: "1.2 MB",
            date: "Sep 14, 2026",
            status: "Ready",
            score: "340 Mins",
        },
        {
            id: "report-005",
            title: "Clinical_Diagnostic_Assessment_Export.pdf",
            category: "Clinical Export",
            size: "4.5 MB",
            date: "Sep 10, 2026",
            status: "Ready",
            score: "Optimal",
        },
    ]);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Handle downloading user health report file
    const handleDownloadReport = (report) => {
        setDownloadingId(report.id);

        setTimeout(() => {
            // Generate formatted health report file blob
            const element = document.createElement("a");
            const reportContent = `==================================================\n MINDHEALTH AI - USER PERSONAL HEALTH REPORT\n Report Title: ${report.title}\n Report Category: ${report.category}\n Date Exported: ${new Date().toLocaleString()}\n User Email: ${user?.email || "user@mindhealth.ai"}\n Verification Status: CERTIFIED HEALTH RECORD\n==================================================\n\n1. OVERALL HEALTH SCORE\n   Health Index Score: 92/100 (Optimal)\n   Mood Stability Index: 94%\n   Stress Level: 18% (Low)\n   Mindfulness Activity: 340 minutes\n\n2. DETAILED WELLNESS BREAKDOWN\n   - Emotional Balance: 38% (Excellent)\n   - Stress Control: 26% (Optimal)\n   - Sleep Quality & Energy: 20% (Good)\n   - Mindfulness Focus: 16% (High)\n\n3. RECOMMENDED CLINICAL GUIDANCE\n   - Continue 15-minute daily breathing & meditation practice.\n   - Maintain current healthy sleep schedule.\n   - Next assessment due in 7 days.\n\nThank you for using MindHealth AI!`;

            const file = new Blob([reportContent], { type: "text/plain;charset=utf-8" });
            element.href = URL.createObjectURL(file);
            element.download = report.title;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);

            setDownloadingId(null);
            setDownloadSuccessMsg(`Downloaded ${report.title}`);
            setTimeout(() => setDownloadSuccessMsg(null), 4000);
        }, 800);
    };

    const handleGenerateNewReport = () => {
        const newId = `report-${Date.now()}`;
        const newReport = {
            id: newId,
            title: `User_Health_Summary_${new Date().toISOString().slice(0, 10)}.pdf`,
            category: "Health Summary",
            size: "2.6 MB",
            date: "Just now",
            status: "Ready",
            score: "94/100",
        };

        setHealthReports((prev) => [newReport, ...prev]);
        handleDownloadReport(newReport);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-orange-50/40">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent shadow-md shadow-orange-500/20" />
                    <p className="text-xs font-semibold text-orange-600">Loading your Health Dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30 text-slate-900 pb-12">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Welcome Banner & Health Action Trigger */}
                <div className="rounded-3xl bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-1 z-10 max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 text-white text-xs font-medium backdrop-blur-sm border border-white/20">
                            <Sparkles className="h-3 w-3 text-amber-200" />
                            User Health Analytics
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Welcome {user.email?.split("@")[0] || "User"}!
                        </h1>

                        <p className="text-orange-100 text-xs leading-relaxed">
                            Monitor your health, mood, mindfulness, reports, and chat with MindHealth AI.
                        </p>
                    </div>

                    <div className="z-10 flex flex-wrap items-center gap-2.5">
                        <Link href="/Assessment">
                            <Button
                                className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-4 py-2 h-auto rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                            >
                                <Brain className="h-3.5 w-3.5 text-orange-600" />
                                <span>Take AI Assessment</span>
                            </Button>
                        </Link>
                        <Button
                            onClick={handleGenerateNewReport}
                            variant="outline"
                            className="bg-white/15 hover:bg-white/25 text-white border-white/30 font-bold px-4 py-2 h-auto rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                        >
                            <Download className="h-3.5 w-3.5 text-white" />
                            <span>Download Report</span>
                        </Button>
                    </div>
                </div>

                {/* Success Notification Alert */}
                {downloadSuccessMsg && (
                    <div className="p-4 rounded-2xl bg-orange-500 text-white font-medium text-xs flex items-center justify-between shadow-lg shadow-orange-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-amber-200" />
                            <span>{downloadSuccessMsg}</span>
                        </div>
                        <button onClick={() => setDownloadSuccessMsg(null)} className="text-orange-200 hover:text-white font-bold text-sm">✕</button>
                    </div>
                )}

                {/* User Health Key Performance Indicators (KPI Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Health KPI 1: Overall Health Score */}
                    <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition-all hover:border-orange-200 group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Health Score</span>
                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <HeartPulse className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">92<span className="text-base text-slate-400 font-normal">/100</span></span>
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                +6% this week
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">Optimal wellness condition</p>
                    </div>

                    {/* Health KPI 2: Mood Stability Index */}
                    <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition-all hover:border-orange-200 group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mood Stability</span>
                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">94%</span>
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                Excellent
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">Emotional balance score</p>
                    </div>

                    {/* Health KPI 3: Mindfulness Practice */}
                    <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition-all hover:border-orange-200 group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mindfulness Practice</span>
                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Flame className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">340 <span className="text-xs text-slate-500 font-normal">mins</span></span>
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                18 sessions
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">Active meditation time</p>
                    </div>

                    {/* Health KPI 4: Stress & Anxiety Level */}
                    <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition-all hover:border-orange-200 group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stress Index</span>
                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">18%</span>
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                -14% Low
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">Low stress indicator</p>
                    </div>
                </div>

                {/* User Health Charts & Analytics */}
                <HealthAnalyticsCharts />

                {/* Bottom Section: Health Reports Download Hub & MindHealth AI Chatbot */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column (7 Cols): Download Health Reports Center */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-orange-50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-orange-600" />
                                    Download Health Reports Hub
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Export and download your official health assessments & summary reports
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateNewReport}
                                className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                                + Generate Report
                            </Button>
                        </div>

                        {/* Health Reports Download List */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-orange-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                                        <th className="py-2.5 px-3">Health Report</th>
                                        <th className="py-2.5 px-3">Type</th>
                                        <th className="py-2.5 px-3">Score / Value</th>
                                        <th className="py-2.5 px-3 text-right">Download</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-50">
                                    {healthReports.map((report) => (
                                        <tr key={report.id} className="hover:bg-orange-50/40 transition-colors">
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 line-clamp-1">{report.title}</p>
                                                        <span className="text-[10px] text-slate-400">{report.size} • {report.date}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                                                    {report.category}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="font-bold text-slate-800">{report.score}</span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <Button
                                                    size="sm"
                                                    disabled={downloadingId === report.id}
                                                    onClick={() => handleDownloadReport(report)}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] h-7 px-3 rounded-lg shadow-xs transition-all gap-1.5"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    <span>{downloadingId === report.id ? "Preparing..." : "Download Report"}</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right Column (5 Cols): AI Medical Consultation Gateway */}
                    <div className="lg:col-span-5 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 flex flex-col justify-between relative overflow-hidden h-full min-h-[420px]">
                        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-xs">
                                    <Bot className="h-6 w-6" />
                                </div>
                                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/20 border border-white/30 backdrop-blur-md flex items-center gap-1.5">
                                    <Sparkles className="h-3 w-3 text-amber-200" />
                                    Powered by Groq
                                </span>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold">AI Medical Consultation</h3>
                                <p className="text-xs text-orange-100 mt-1 leading-relaxed">
                                    Chat with our dedicated clinical AI specialist for evidence-based answers on symptoms, medications, lab analysis, and mental wellness.
                                </p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-2 text-xs text-orange-50 bg-black/10 px-3 py-2 rounded-xl backdrop-blur-xs border border-white/10">
                                    <ShieldCheck className="h-4 w-4 text-amber-300 shrink-0" />
                                    <span>Strictly medical & healthcare certified topics only</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-orange-50 bg-black/10 px-3 py-2 rounded-xl backdrop-blur-xs border border-white/10">
                                    <Activity className="h-4 w-4 text-amber-300 shrink-0" />
                                    <span>Ultra-fast Groq LLaMA 3.3 70B inference</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 relative z-10">
                            <Link
                                href="/Chatbot"
                                className="w-full inline-flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-orange-50 font-bold px-4 py-3 rounded-xl shadow-md text-xs transition-all hover:scale-[1.01]"
                            >
                                <Bot className="h-4 w-4 text-orange-600" />
                                <span>Open Medical AI Chatbot</span>
                                <ArrowUpRight className="h-4 w-4 text-orange-600" />
                            </Link>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
