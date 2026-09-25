"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/Authprovider";
import {
    Brain,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    History,
    ShieldAlert,
    RefreshCw,
    Video,
    Volume2,
    Mic,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import AiVideoInterview from "@/components/AiVideoInterview";
import {
    runAssessmentFlow,
    getUserAssessmentHistory,
} from "@/lib/assessmentService";

const PHQ9_QUESTIONS = [
    {
        id: 1,
        key: "question1",
        timeKey: "time1",
        text: "Little interest or pleasure in doing things?",
    },
    {
        id: 2,
        key: "question2",
        timeKey: "time2",
        text: "Feeling down, depressed, or hopeless?",
    },
    {
        id: 3,
        key: "question3",
        timeKey: "time3",
        text: "Trouble falling or staying asleep, or sleeping too much?",
    },
    {
        id: 4,
        key: "question4",
        timeKey: "time4",
        text: "Feeling tired or having little energy?",
    },
    {
        id: 5,
        key: "question5",
        timeKey: "time5",
        text: "Poor appetite or overeating?",
    },
    {
        id: 6,
        key: "question6",
        timeKey: "time6",
        text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
    },
    {
        id: 7,
        key: "question7",
        timeKey: "time7",
        text: "Trouble concentrating on things, such as reading the newspaper or watching television?",
    },
    {
        id: 8,
        key: "question8",
        timeKey: "time8",
        text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
    },
    {
        id: 9,
        key: "question9",
        timeKey: "time9",
        text: "Thoughts that you would be better off dead or of hurting yourself in some way?",
    },
];

const ANSWER_OPTIONS = [
    { value: 0, label: "Not at all", description: "0 days" },
    { value: 1, label: "Several days", description: "1-7 days" },
    { value: 2, label: "More than half the days", description: "7-11 days" },
    { value: 3, label: "Nearly every day", description: "12-14 days" },
];

function calculateElapsedSeconds(startTime) {
    if (!startTime) return 1.5;
    const elapsed = (Date.now() - startTime) / 1000;
    return Math.max(0.5, Number(elapsed.toFixed(2)));
}

export default function AiInterviewPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Questionnaire state
    const [currentStep, setCurrentStep] = useState(0); // 0 to 8
    const [answers, setAnswers] = useState({});
    const [times, setTimes] = useState({});
    const questionStartTimeRef = useRef(0);

    // Flow states
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    // History state
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
        }
    }, [user, authLoading, router]);

    // Track time per question
    useEffect(() => {
        questionStartTimeRef.current = Date.now();
    }, [currentStep]);

    // Fetch user assessment history from Supabase
    const refreshHistory = async () => {
        if (!user) return;
        setHistoryLoading(true);
        const { data, error } = await getUserAssessmentHistory(user.id);
        if (error) {
            console.error("Error loading history:", error);
        } else {
            setHistory(data || []);
        }
        setHistoryLoading(false);
    };

    useEffect(() => {
        let isMounted = true;
        if (user) {
            getUserAssessmentHistory(user.id).then(({ data, error }) => {
                if (!isMounted) return;
                if (error) {
                    console.error("Error loading history:", error);
                } else {
                    setHistory(data || []);
                }
                setHistoryLoading(false);
            });
        }
        return () => {
            isMounted = false;
        };
    }, [user]);

    const handleSelectAnswer = (value) => {
        const q = PHQ9_QUESTIONS[currentStep];
        const elapsedSec = calculateElapsedSeconds(questionStartTimeRef.current);

        setAnswers((prev) => ({ ...prev, [q.key]: value }));
        setTimes((prev) => ({
            ...prev,
            [q.timeKey]: (prev[q.timeKey] || 0) + elapsedSec,
        }));
    };

    // Fill sample values for quick testing if user wants to test quickly
    const handleQuickFill = (preset = "mild") => {
        const newAnswers = {};
        const newTimes = {};

        const presetValues =
            preset === "severe"
                ? [3, 3, 2, 3, 2, 3, 2, 2, 1]
                : preset === "moderate"
                ? [2, 1, 2, 1, 1, 1, 2, 1, 0]
                : [1, 0, 1, 1, 0, 1, 0, 0, 0];

        PHQ9_QUESTIONS.forEach((q, idx) => {
            newAnswers[q.key] = presetValues[idx];
            newTimes[q.timeKey] = Number((2.5 + Math.random() * 2).toFixed(2));
        });

        setAnswers(newAnswers);
        setTimes(newTimes);
        setCurrentStep(8);
    };

    // Submit Assessment Flow to Supabase and Flask XGBoost Model
    const handleAnalyze = async () => {
        setErrorMessage(null);
        setIsAnalyzing(true);

        try {
            // Build full payload containing 9 questions and 9 times
            const finalPayload = {};
            PHQ9_QUESTIONS.forEach((q) => {
                finalPayload[q.key] = answers[q.key] ?? 0;
                finalPayload[q.timeKey] = times[q.timeKey] ?? 2.0;
            });

            // Execute full flow: Supabase insert -> Flask XGBoost -> Supabase update -> Result
            const flowResult = await runAssessmentFlow({
                userId: user.id,
                payload: finalPayload,
            });

            setResult(flowResult);
            // Refresh history
            refreshHistory();
        } catch (err) {
            console.error("Interview assessment flow failed:", err);
            setErrorMessage(err.message || "Failed to complete interview assessment.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRestart = () => {
        setAnswers({});
        setTimes({});
        setCurrentStep(0);
        setResult(null);
        setErrorMessage(null);
        questionStartTimeRef.current = 0;
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-orange-50/40">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent shadow-md shadow-orange-500/20" />
                    <p className="text-xs font-semibold text-orange-600">Initializing AI Video Telehealth Room...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30 text-slate-900 pb-16">
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Banner */}
                <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-1.5 z-10 max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 text-white text-xs font-medium backdrop-blur-sm border border-white/20">
                            <Video className="h-3.5 w-3.5 text-amber-200" />
                            <span>Interactive Telehealth AI Interview</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            AI Clinical Video Interview
                        </h1>
                        <p className="text-orange-100 text-xs sm:text-sm leading-relaxed">
                            Experience a realistic voice & video clinical assessment. The AI doctor speaks each question, your webcam stream is displayed live, and you can speak your answers directly.
                        </p>
                    </div>

                    <div className="z-10 flex flex-col sm:flex-row items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickFill("mild")}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs"
                        >
                            Demo Fill (Mild)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickFill("moderate")}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs"
                        >
                            Demo Fill (Moderate)
                        </Button>
                    </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-4 rounded-2xl bg-rose-500 text-white font-medium text-xs sm:text-sm flex items-start justify-between shadow-lg shadow-rose-500/20 animate-in fade-in duration-300">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-rose-100 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">Interview Assessment Request Issue</p>
                                <p className="text-rose-100 text-xs mt-0.5">{errorMessage}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setErrorMessage(null)}
                            className="text-rose-200 hover:text-white font-bold text-sm px-2"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Main Content Area */}
                {!result ? (
                    /* AI Video Interview View */
                    <AiVideoInterview
                        questions={PHQ9_QUESTIONS}
                        options={ANSWER_OPTIONS}
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        answers={answers}
                        onSelectAnswer={handleSelectAnswer}
                        times={times}
                        onAnalyze={handleAnalyze}
                        isAnalyzing={isAnalyzing}
                        onRestart={handleRestart}
                    />
                ) : (
                    /* Assessment Result View */
                    <div className="bg-white rounded-3xl border border-orange-100 p-6 sm:p-10 shadow-sm space-y-8 animate-in fade-in duration-300">
                        {/* Status Header */}
                        <div className="text-center space-y-2 border-b border-orange-100 pb-6">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Status: {result.status || "Completed"}
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                AI Interview Assessment Result
                            </h2>
                            <p className="text-xs text-slate-500">
                                Processed and verified via Supabase & Python XGBoost AI Model
                            </p>
                        </div>

                        {/* Prediction Display Card */}
                        <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50/50 border border-orange-200/80 p-6 sm:p-8 text-center space-y-4">
                            <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">
                                Prediction
                            </span>
                            <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                                {result.prediction}
                            </div>
                            {result.confidence && (
                                <p className="text-xs text-slate-600 font-medium">
                                    Model Confidence:{" "}
                                    <span className="font-bold text-orange-700">
                                        {(result.confidence * 100).toFixed(1)}%
                                    </span>
                                </p>
                            )}
                        </div>

                        {/* Probabilities Breakdown */}
                        {result.probabilities && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Model Class Probabilities
                                </h3>
                                <div className="space-y-2.5">
                                    {Object.entries(result.probabilities).map(([cls, prob]) => {
                                        const pct = (prob * 100).toFixed(1);
                                        const isPredicted = cls === result.prediction;
                                        return (
                                            <div key={cls} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className={isPredicted ? "font-bold text-orange-600" : "text-slate-600"}>
                                                        {cls} {isPredicted && "(Predicted)"}
                                                    </span>
                                                    <span className="font-mono text-slate-700">{pct}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${
                                                            isPredicted ? "bg-orange-500" : "bg-slate-300"
                                                        }`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Disclaimer */}
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-4 text-xs text-slate-500 flex items-start gap-3 leading-relaxed">
                            <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <p>
                                <strong>Clinical Disclaimer:</strong> This assessment result is generated
                                by a trained machine learning model based on your reported responses.
                                It does not constitute an official psychiatric diagnosis or clinical evaluation.
                                If you are experiencing distress, please consult a qualified healthcare provider.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={handleRestart}
                                className="w-full sm:w-auto text-xs border-orange-200 text-orange-700 hover:bg-orange-50 gap-2"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Retake Video Interview
                            </Button>
                            <Button
                                onClick={() => router.push("/Dashboard")}
                                className="w-full sm:w-auto bg-slate-900 hover:bg-black text-white text-xs font-semibold px-6"
                            >
                                Return to Dashboard
                            </Button>
                        </div>
                    </div>
                )}

                {/* Previous Assessments History */}
                <div className="bg-white rounded-3xl border border-orange-100 p-6 sm:p-8 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-orange-50">
                        <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                <History className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Assessment & Interview History
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Logged records from Supabase for {user.email}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshHistory}
                            disabled={historyLoading}
                            className="text-xs text-slate-500 hover:text-orange-600 gap-1.5"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${historyLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>

                    {historyLoading ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                            Loading assessment history from Supabase...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                            <p>No previous assessments recorded yet.</p>
                            <p className="text-slate-400">Complete an assessment above to record your first entry.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-orange-100 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3">Input Summary</th>
                                        <th className="py-3 px-3">Prediction</th>
                                        <th className="py-3 px-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-50">
                                    {history.map((item) => {
                                        let totalScore = null;
                                        if (item.input_data) {
                                            let sum = 0;
                                            for (let i = 1; i <= 9; i++) {
                                                sum += Number(item.input_data[`question${i}`] || 0);
                                            }
                                            totalScore = sum;
                                        }

                                        const dateStr = item.created_at
                                            ? new Date(item.created_at).toLocaleString()
                                            : "N/A";

                                        const statusBadge =
                                            item.status === "completed"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                : item.status === "failed"
                                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                                : "bg-amber-50 text-amber-700 border-amber-200";

                                        return (
                                            <tr key={item.id} className="hover:bg-orange-50/40 transition-colors">
                                                <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                                                    {dateStr}
                                                </td>
                                                <td className="py-3 px-3 text-slate-600">
                                                    {totalScore !== null ? (
                                                        <span>PHQ-9 Score: {totalScore} / 27 (9 questions)</span>
                                                    ) : (
                                                        <span>Standard Assessment</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="font-bold text-slate-900">
                                                        {item.prediction || "—"}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right">
                                                    <span
                                                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusBadge}`}
                                                    >
                                                        {item.status || "processing"}
                                                    </span>
                                                    {item.error_message && (
                                                        <span className="block text-[10px] text-rose-500 truncate max-w-xs ml-auto">
                                                            {item.error_message}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
