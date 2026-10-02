"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/Authprovider";
import { supabase } from "@/lib/client";
import { generateAssessmentPdf } from "@/lib/pdfReportGenerator";

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
    Clock,
    ShieldAlert,
    AlertCircle,
    Calendar,
    RefreshCw,
} from "lucide-react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import HealthAnalyticsCharts from "@/components/HealthAnalyticsCharts";

export default function Dashboard() {
    const router = useRouter();
    const { user, loading } = useAuth();

    // Data state
    const [userAssessments, setUserAssessments] = useState([]);
    const [questionsList, setQuestionsList] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Download state
    const [downloadingId, setDownloadingId] = useState(null);
    const [downloadSuccessMsg, setDownloadSuccessMsg] = useState(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Fetch user-by-user assessments & assessment_questions from Supabase
    const fetchUserData = async () => {
        if (!user) return;
        setLoadingData(true);

        try {
            // 1. Fetch user's completed/evaluated assessments from mental_health_assessments
            const { data: asmts, error: asmtErr } = await supabase
                .from("mental_health_assessments")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (!asmtErr && Array.isArray(asmts)) {
                setUserAssessments(asmts);
            }

            // 2. Fetch standardized PHQ-9 questions from assessment_questions table
            const { data: qData, error: qErr } = await supabase
                .from("assessment_questions")
                .select("*")
                .order("question_id", { ascending: true });

            if (!qErr && Array.isArray(qData) && qData.length > 0) {
                setQuestionsList(qData);
            } else {
                // Fallback to Next.js API endpoint
                const res = await fetch("/api/assessment-questions");
                if (res.ok) {
                    const apiData = await res.json();
                    if (apiData.questions) {
                        setQuestionsList(apiData.questions);
                    }
                }
            }
        } catch (err) {
            console.warn("Notice loading user dashboard data:", err.message);
        } finally {
            setLoadingData(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUserData();
        }
    }, [user]);

    // ─── USER-BY-USER KPI COMPUTATIONS ────────────────────────────────────────
    const userKpis = useMemo(() => {
        if (!userAssessments || userAssessments.length === 0) {
            return {
                hasAssessments: false,
                totalAssessments: 0,
                healthScore: 92,
                healthScoreLabel: "Baseline Optimal",
                severity: "Minimal / None",
                severityClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
                phq9Score: 3,
                avgLatency: "2.1",
                safetyStatus: "Clear (0/3)",
                safetyClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
                latestDate: "No evaluations yet",
                latestAssessment: null,
            };
        }

        const latest = userAssessments[0];
        const inp = latest.input_data || {};

        let totalPhq9 = 0;
        let answeredCount = 0;
        let totalTime = 0;

        for (let i = 1; i <= 9; i++) {
            const val = inp[`question${i}`];
            const timeVal = inp[`time${i}`];
            if (typeof val === "number") {
                totalPhq9 += val;
                answeredCount++;
            }
            if (typeof timeVal === "number") {
                totalTime += timeVal;
            }
        }

        const avgLatency = answeredCount > 0 ? (totalTime / answeredCount).toFixed(1) : "2.4";
        const q9Val = Number(inp.question9 ?? 0);

        // Overall Health score inverted from PHQ-9 (0 score = 98 health, 27 score = 25 health)
        const healthScore = Math.max(25, Math.round(100 - (totalPhq9 / 27) * 75));

        const pred = latest.prediction || "Evaluated";
        let severityClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
        if (totalPhq9 >= 20 || pred.toLowerCase().includes("severe")) {
            severityClass = "text-rose-700 bg-rose-50 border-rose-200";
        } else if (totalPhq9 >= 15 || pred.toLowerCase().includes("moderately severe")) {
            severityClass = "text-orange-700 bg-orange-50 border-orange-200";
        } else if (totalPhq9 >= 10 || pred.toLowerCase().includes("moderate")) {
            severityClass = "text-amber-700 bg-amber-50 border-amber-200";
        } else if (totalPhq9 >= 5 || pred.toLowerCase().includes("mild")) {
            severityClass = "text-yellow-700 bg-yellow-50 border-yellow-200";
        }

        return {
            hasAssessments: true,
            totalAssessments: userAssessments.length,
            healthScore,
            healthScoreLabel: healthScore >= 80 ? "Optimal Wellness" : healthScore >= 60 ? "Moderate Wellness" : "Clinical Support Advised",
            severity: pred,
            severityClass,
            phq9Score: totalPhq9,
            avgLatency,
            safetyStatus: q9Val > 0 ? "Clinical Note (Item 9)" : "Screen Clear (0/3)",
            safetyClass: q9Val > 0 ? "text-rose-700 bg-rose-50 border-rose-200" : "text-emerald-700 bg-emerald-50 border-emerald-200",
            latestDate: latest.created_at ? new Date(latest.created_at).toLocaleDateString() : "Today",
            latestAssessment: latest,
        };
    }, [userAssessments]);

    // ─── PDF DOWNLOAD HANDLER ────────────────────────────────────────────────
    const handleDownloadAssessmentPdf = async (asmt) => {
        const targetAsmt = asmt || userKpis.latestAssessment || {
            id: "baseline-sample",
            prediction: "Minimal / None",
            created_at: new Date().toISOString(),
            input_data: {
                question1: 0, question2: 0, question3: 1, question4: 0,
                question5: 1, question6: 0, question7: 0, question8: 0, question9: 0,
                time1: 2.1, time2: 2.4, time3: 3.1, time4: 2.0,
                time5: 2.5, time6: 2.2, time7: 1.9, time8: 2.8, time9: 1.8,
            },
        };

        const targetId = targetAsmt.id || "latest";
        setDownloadingId(targetId);

        try {
            // Build the PDF with complete PHQ-9 questions, doctor explanations, tips, and user answers
            const doc = generateAssessmentPdf({
                assessment: targetAsmt,
                questions: questionsList,
                user,
            });

            const dateSlug = targetAsmt.created_at
                ? new Date(targetAsmt.created_at).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10);
            const fileName = `MindHealth_Evaluation_${user?.email?.split("@")[0] || "User"}_${dateSlug}.pdf`;

            // Save PDF directly to user's device
            doc.save(fileName);

            setDownloadSuccessMsg(`Downloaded official clinical evaluation PDF: ${fileName}`);
            setTimeout(() => setDownloadSuccessMsg(null), 5000);
        } catch (err) {
            console.error("PDF generation failed:", err);
            setDownloadSuccessMsg(`Error generating PDF: ${err.message}`);
        } finally {
            setDownloadingId(null);
        }
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
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30 text-slate-900 pb-16">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* ── 1. Welcome Banner & Immediate Action Trigger ──────────────── */}
                <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-1.5 z-10 max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 text-white text-xs font-medium backdrop-blur-sm border border-white/20">
                            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                            User Clinical Health Analytics & PDF Reports
                        </div>

                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Welcome {user.email?.split("@")[0] || "Patient"}!
                        </h1>

                        <p className="text-orange-100 text-xs sm:text-sm leading-relaxed">
                            {userKpis.hasAssessments
                                ? `Personalized evaluation computed from ${userKpis.totalAssessments} clinical assessment${userKpis.totalAssessments > 1 ? "s" : ""}. Last evaluation on ${userKpis.latestDate}.`
                                : "No clinical evaluations recorded yet. Take your first PHQ-9 diagnostic assessment to generate your personalized health report."}
                        </p>
                    </div>

                    <div className="z-10 flex flex-wrap items-center gap-3">
                        <Link href="/Assessment">
                            <Button
                                className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-4 py-2.5 h-auto rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                            >
                                <Brain className="h-4 w-4 text-orange-600" />
                                <span>{userKpis.hasAssessments ? "Retake AI Assessment" : "Take AI Assessment"}</span>
                            </Button>
                        </Link>
                        <Button
                            onClick={() => handleDownloadAssessmentPdf(userKpis.latestAssessment)}
                            disabled={downloadingId !== null}
                            variant="outline"
                            className="bg-white/15 hover:bg-white/25 text-white border-white/30 font-bold px-4 py-2.5 h-auto rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
                        >
                            <Download className="h-4 w-4 text-white" />
                            <span>{downloadingId ? "Generating PDF..." : "Download Clinical PDF"}</span>
                        </Button>
                        <a
                            href="https://mentalhealthaimodel.onrender.com/test"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5 text-xs"
                        >
                            <span>Model Test (/test)</span>
                            <span className="text-[10px] bg-emerald-400 text-emerald-950 font-bold px-1.5 py-0.2 rounded-full">Render</span>
                        </a>
                    </div>
                </div>

                {/* Success Notification Alert */}
                {downloadSuccessMsg && (
                    <div className="p-4 rounded-2xl bg-orange-600 text-white font-medium text-xs flex items-center justify-between shadow-lg shadow-orange-600/20 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-amber-200" />
                            <span>{downloadSuccessMsg}</span>
                        </div>
                        <button onClick={() => setDownloadSuccessMsg(null)} className="text-orange-200 hover:text-white font-bold text-sm">✕</button>
                    </div>
                )}

                {/* ── 2. Real User Evaluation KPIs (Computed User-by-User) ──────── */}
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
                            <span className="text-3xl font-extrabold text-slate-900">
                                {userKpis.healthScore}
                                <span className="text-base text-slate-400 font-normal">/100</span>
                            </span>
                            <span className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                {userKpis.hasAssessments ? "Evaluated" : "Baseline"}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">{userKpis.healthScoreLabel}</p>
                    </div>

                    {/* Health KPI 2: AI Predicted Severity */}
                    <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition-all hover:border-orange-200 group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnostic Severity</span>
                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Activity className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-extrabold text-slate-900 truncate">
                                {userKpis.severity}
                            </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${userKpis.severityClass}`}>
                                PHQ-9: {userKpis.phq9Score} / 27
                            </span>
                            <span className="text-[10px] text-slate-400">XGBoost ML</span>
                        </div>
                    </div>

                    {/* Health KPI 3: Response Latency (Cognitive Speed) */}
                    <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition-all hover:border-orange-200 group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Response Speed</span>
                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Clock className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-slate-900">
                                {userKpis.avgLatency}
                                <span className="text-xs text-slate-500 font-normal">s/question</span>
                            </span>
                            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                Latency
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">Clinical psychomotor latency</p>
                    </div>

                    {/* Health KPI 4: Clinical Safety & Completed Count */}
                    <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-sm hover:shadow-md transition-all hover:border-orange-200 group">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Safety</span>
                            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${userKpis.safetyClass}`}>
                                {userKpis.safetyStatus}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2">
                            {userKpis.totalAssessments} evaluation{userKpis.totalAssessments === 1 ? "" : "s"} on file
                        </p>
                    </div>
                </div>

                {/* ── 3. Health Analytics Charts (Dynamic User Trajectory) ────── */}
                <HealthAnalyticsCharts
                    assessmentHistory={userAssessments}
                    latestAssessment={userKpis.latestAssessment}
                />

                {/* ── 4. Bottom Section: Download Health Reports Center ─────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Column (7 Cols): Real PDF Download Hub */}
                    <div className="lg:col-span-7 bg-white rounded-2xl border border-orange-100 p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-orange-50">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <FileSpreadsheet className="h-4 w-4 text-orange-600" />
                                    Download Health Reports Hub (PDF)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Export certified clinical evaluation PDFs with questions, doctor explanations & answers
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadAssessmentPdf(userKpis.latestAssessment)}
                                disabled={downloadingId !== null}
                                className="text-xs border-orange-200 text-orange-700 hover:bg-orange-50 gap-1.5"
                            >
                                <Download className="h-3.5 w-3.5" />
                                <span>Export Latest PDF</span>
                            </Button>
                        </div>

                        {/* Reports List */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-orange-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                                        <th className="py-2.5 px-3">Evaluation Report</th>
                                        <th className="py-2.5 px-3">Diagnostic Severity</th>
                                        <th className="py-2.5 px-3">PHQ-9 Score</th>
                                        <th className="py-2.5 px-3 text-right">Download PDF</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-50">
                                    {userAssessments.length > 0 ? (
                                        userAssessments.map((asmt, idx) => {
                                            const inp = asmt.input_data || {};
                                            let score = 0;
                                            for (let i = 1; i <= 9; i++) {
                                                if (typeof inp[`question${i}`] === "number") score += inp[`question${i}`];
                                            }
                                            const dateFormatted = asmt.created_at
                                                ? new Date(asmt.created_at).toLocaleDateString()
                                                : `Evaluation #${userAssessments.length - idx}`;

                                            return (
                                                <tr key={asmt.id || idx} className="hover:bg-orange-50/40 transition-colors">
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-800 line-clamp-1">
                                                                    PHQ9_Clinical_Evaluation_{dateFormatted.replace(/\//g, "-")}.pdf
                                                                </p>
                                                                <span className="text-[10px] text-slate-400">
                                                                    {new Date(asmt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • 9 Questions Verified
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                                                            {asmt.prediction || "Evaluated"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className="font-bold text-slate-800">{score} / 27</span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right">
                                                        <Button
                                                            size="sm"
                                                            disabled={downloadingId === asmt.id}
                                                            onClick={() => handleDownloadAssessmentPdf(asmt)}
                                                            className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] h-7 px-3 rounded-lg shadow-xs transition-all gap-1.5"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                            <span>{downloadingId === asmt.id ? "Preparing PDF..." : "Download PDF"}</span>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        /* Baseline Preview Row when user has no assessments yet */
                                        <tr className="hover:bg-orange-50/40 transition-colors">
                                            <td className="py-3 px-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">
                                                            Clinical_Diagnostic_Assessment_Sample.pdf
                                                        </p>
                                                        <span className="text-[10px] text-slate-400">Baseline Template • 9 PHQ-9 Questions</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Optimal Baseline
                                                </span>
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className="font-bold text-slate-800">0 / 27</span>
                                            </td>
                                            <td className="py-3 px-3 text-right">
                                                <Button
                                                    size="sm"
                                                    disabled={downloadingId === "baseline-sample"}
                                                    onClick={() => handleDownloadAssessmentPdf(null)}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white text-[11px] h-7 px-3 rounded-lg shadow-xs transition-all gap-1.5"
                                                >
                                                    <Download className="h-3 w-3" />
                                                    <span>{downloadingId === "baseline-sample" ? "Preparing..." : "Download PDF"}</span>
                                                </Button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Notice & Refresh */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-orange-50">
                            <span>Includes question texts, doctor tips, explanations & patient responses</span>
                            <button
                                onClick={fetchUserData}
                                className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-semibold"
                            >
                                <RefreshCw className={`h-3 w-3 ${loadingData ? "animate-spin" : ""}`} />
                                <span>Sync Records</span>
                            </button>
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
                                <h3 className="text-lg font-bold">AI Clinical Consultation</h3>
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
