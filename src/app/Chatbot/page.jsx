"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/Authprovider";
import {
    Bot,
    Send,
    Sparkles,
    RefreshCw,
    User,
    ShieldAlert,
    ShieldCheck,
    Stethoscope,
    Pill,
    Brain,
    HeartPulse,
    Apple,
    Moon,
    Copy,
    Check,
    Key,
    AlertCircle,
    Info,
    Download,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

let idSeq = 1;
function generateUniqueId(prefix = "msg") {
    idSeq += 1;
    return `${prefix}-${idSeq}`;
}

function getCurrentTimeStr() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MedicalChatbotPage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [messages, setMessages] = useState([
        {
            id: "bot-init",
            sender: "bot",
            text: "Hello! I am your **MindHealth Medical AI Assistant**, powered by Groq.\n\nI am specially trained to assist you **strictly with medical, healthcare, clinical symptoms, medications, mental health, and wellness questions**.\n\nHow can I help you with your health today?",
            time: "Just now",
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [customApiKey, setCustomApiKey] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("groq_api_key") || "";
        }
        return "";
    });
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("groq_api_key") || "";
        }
        return "";
    });
    const [copiedId, setCopiedId] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Redirect to login if unauthenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSaveKey = () => {
        const trimmed = apiKeyInput.trim();
        setCustomApiKey(trimmed);
        if (typeof window !== "undefined") {
            if (trimmed) {
                localStorage.setItem("groq_api_key", trimmed);
            } else {
                localStorage.removeItem("groq_api_key");
            }
        }
        setShowKeyModal(false);
        setErrorMessage(null);
    };

    // Quick medical specialty topic starters
    const medicalTopics = [
        {
            label: "Symptom Check",
            icon: Stethoscope,
            prompt: "What are the common early warning symptoms of Type 2 Diabetes?",
        },
        {
            label: "Medication Guide",
            icon: Pill,
            prompt: "What is the difference between ibuprofen and acetaminophen, and when should each be used?",
        },
        {
            label: "Mental Wellness",
            icon: Brain,
            prompt: "What are evidence-based physiological techniques to stop an acute anxiety attack?",
        },
        {
            label: "Heart & Vitals",
            icon: HeartPulse,
            prompt: "What is considered a normal resting heart rate and blood pressure for an adult?",
        },
        {
            label: "Clinical Nutrition",
            icon: Apple,
            prompt: "What dietary protocols help reduce chronic systemic inflammation?",
        },
        {
            label: "Sleep Medicine",
            icon: Moon,
            prompt: "How does chronic sleep deprivation impact cardiovascular health and cognitive function?",
        },
    ];

    const handleSend = async (textToSend) => {
        const query = (textToSend || input).trim();
        if (!query || isTyping) return;

        setErrorMessage(null);

        const userMsg = {
            id: generateUniqueId("user"),
            sender: "user",
            text: query,
            time: getCurrentTimeStr(),
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        if (!textToSend) setInput("");
        setIsTyping(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages: newMessages.map((m) => ({
                        role: m.sender === "user" ? "user" : "assistant",
                        content: m.text,
                    })),
                    apiKey: customApiKey || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.needsKey) {
                    setErrorMessage(
                        "Groq API Key is not configured. Please add GROQ_API_KEY to your .env file or enter your API key via the Key Settings icon above."
                    );
                    setShowKeyModal(true);
                } else {
                    setErrorMessage(data.error || "Failed to receive a response from Groq AI.");
                }

                const botErrMsg = {
                    id: generateUniqueId("bot-err"),
                    sender: "bot",
                    isError: true,
                    text: `⚠️ **Unable to complete request:**\n\n${data.error || "Please check your Groq API key configuration in .env or settings."
                        }`,
                    time: getCurrentTimeStr(),
                };
                setMessages((prev) => [...prev, botErrMsg]);
            } else {
                const botMsg = {
                    id: generateUniqueId("bot"),
                    sender: "bot",
                    text: data.reply,
                    model: data.model,
                    time: getCurrentTimeStr(),
                };
                setMessages((prev) => [...prev, botMsg]);
            }
        } catch (err) {
            console.error("Chat request failed:", err);
            setErrorMessage("Network error: Could not reach the medical chat server.");
            const botErrMsg = {
                id: generateUniqueId("bot-err"),
                sender: "bot",
                isError: true,
                text: "⚠️ **Connection Error:** Could not contact the MindHealth AI server. Please verify your internet connection or dev server.",
                time: getCurrentTimeStr(),
            };
            setMessages((prev) => [...prev, botErrMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleReset = () => {
        setMessages([
            {
                id: generateUniqueId("bot-reset"),
                sender: "bot",
                text: "Chat refreshed! How can I assist you with your medical, healthcare, or wellness questions today?",
                time: "Just now",
            },
        ]);
        setErrorMessage(null);
    };

    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleExportTranscript = () => {
        const transcript = messages
            .map(
                (m) =>
                    `[${m.time}] ${m.sender === "user" ? "USER" : "MINDHEALTH MEDICAL AI"}:\n${m.text}\n`
            )
            .join("\n" + "=".repeat(40) + "\n\n");

        const header = `==================================================\n MINDHEALTH AI - MEDICAL CONSULTATION TRANSCRIPT\n Date: ${new Date().toLocaleString()}\n Patient: ${user?.email || "User"}\n Engine: Groq LLaMA 3.3 70B (Strict Medical Q&A)\n==================================================\n\n`;

        const blob = new Blob([header + transcript], { type: "text/plain;charset=utf-8" });
        const element = document.createElement("a");
        element.href = URL.createObjectURL(blob);
        element.download = `Medical_AI_Consult_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Helper to render formatted text with basic bolding and bullet lists
    const renderFormattedText = (text) => {
        if (!text) return null;

        // Split into paragraphs/lines
        const lines = text.split("\n");

        return (
            <div className="space-y-2 text-xs leading-relaxed">
                {lines.map((line, idx) => {
                    if (!line.trim()) {
                        return <div key={idx} className="h-1.5" />;
                    }

                    // Headers ###
                    if (line.startsWith("### ")) {
                        return (
                            <h4 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1 text-orange-950">
                                {line.replace("### ", "")}
                            </h4>
                        );
                    }
                    if (line.startsWith("## ")) {
                        return (
                            <h3 key={idx} className="font-bold text-slate-900 text-sm mt-3 mb-1 border-b border-orange-100 pb-1 text-orange-950">
                                {line.replace("## ", "")}
                            </h3>
                        );
                    }

                    // Bullet points
                    const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
                    const content = isBullet ? line.trim().substring(2) : line;

                    // Parse bold markers **word**
                    const parts = content.split(/(\*\*.*?\*\*)/g);
                    const renderedParts = parts.map((part, pIdx) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                                <strong key={pIdx} className="font-semibold text-slate-900">
                                    {part.slice(2, -2)}
                                </strong>
                            );
                        }
                        return part;
                    });

                    if (isBullet) {
                        return (
                            <div key={idx} className="flex items-start gap-2 pl-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                <span>{renderedParts}</span>
                            </div>
                        );
                    }

                    return <p key={idx}>{renderedParts}</p>;
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-orange-50/40">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent shadow-md shadow-orange-500/20" />
                    <p className="text-xs font-semibold text-orange-600">Initializing Medical AI Suite...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30 text-slate-900 flex flex-col">
            {/* Top Bar Header */}
            <div className="bg-white border-b border-orange-100 px-6 py-4 sticky top-0 z-30 shadow-xs">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/25 shrink-0">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="font-bold text-slate-900 text-base">MindHealth AI Medical Counselor</h1>

                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Specialized clinical Q&A, symptom analysis, pharmacology, and mental wellness guidance
                            </p>
                        </div>
                    </div>

                    {/* Top Action Toolbar */}
                    <div className="flex items-center gap-2">


                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportTranscript}
                            disabled={messages.length <= 1}
                            className="text-xs border-orange-200 text-slate-700 hover:bg-orange-50 gap-1.5 h-8 px-3 rounded-lg"
                            title="Download Consultation Transcript"
                        >
                            <Download className="h-3.5 w-3.5 text-orange-600" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="text-xs border-orange-200 text-slate-700 hover:bg-orange-50 gap-1.5 h-8 px-3 rounded-lg"
                            title="Clear conversation and start new session"
                        >
                            <RefreshCw className="h-3.5 w-3.5 text-orange-600" />
                            <span className="hidden sm:inline">New Session</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Chat Container */}
            <div className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col justify-between">

                {/* Error Banner if any */}
                {errorMessage && (
                    <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowKeyModal(true)}
                            className="text-xs text-amber-800 underline hover:text-amber-900 font-semibold h-auto p-0"
                        >
                            Open Settings
                        </Button>
                    </div>
                )}

                {/* Scope Guidance Alert Box */}
                <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50/50 to-orange-50 border border-orange-100/80 flex items-start gap-3">
                    <ShieldAlert className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-slate-600 leading-relaxed">
                        <span className="font-bold text-orange-900">Certified Medical Guardrails Active: </span>
                        This AI counselor answers strictly medical, healthcare, anatomical, pharmacological, mental wellness, and biological queries. Non-medical queries (coding, trivia, entertainment, etc.) will be respectfully declined.
                    </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 min-h-[460px] bg-white rounded-3xl border border-orange-100 shadow-sm p-4 sm:p-6 overflow-y-auto space-y-4 mb-4">
                    {messages.map((msg) => {
                        const isUser = msg.sender === "user";
                        return (
                            <div
                                key={msg.id}
                                className={`flex gap-3 max-w-[88%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                                    }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-xs ${isUser
                                        ? "bg-slate-900 text-white"
                                        : msg.isError
                                            ? "bg-amber-500 text-white"
                                            : "bg-gradient-to-br from-orange-500 to-amber-500 text-white"
                                        }`}
                                >
                                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>

                                {/* Message Content Bubble */}
                                <div className="space-y-1 max-w-[calc(100%-2.5rem)]">
                                    <div
                                        className={`p-4 rounded-2xl ${isUser
                                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-tr-xs shadow-sm shadow-orange-500/15"
                                            : msg.isError
                                                ? "bg-amber-50 border border-amber-200 text-amber-950 rounded-tl-xs"
                                                : "bg-orange-50/30 border border-orange-100/90 text-slate-800 rounded-tl-xs shadow-2xs"
                                            }`}
                                    >
                                        {isUser ? (
                                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                        ) : (
                                            renderFormattedText(msg.text)
                                        )}
                                    </div>

                                    {/* Footer Info: Timestamp, Model, Copy button */}
                                    <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                                        <span>{msg.time}</span>
                                        {!isUser && !msg.isError && (
                                            <>
                                                <span>•</span>
                                                <span className="text-orange-600 font-medium">Groq LLaMA 3.3</span>
                                                <span>•</span>
                                                <button
                                                    onClick={() => handleCopy(msg.id, msg.text)}
                                                    className="inline-flex items-center gap-1 text-slate-400 hover:text-orange-600 transition-colors"
                                                    title="Copy response"
                                                >
                                                    {copiedId === msg.id ? (
                                                        <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                                                            <Check className="h-3 w-3" /> Copied
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-0.5">
                                                            <Copy className="h-3 w-3" /> Copy
                                                        </span>
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="p-3.5 bg-orange-50/40 border border-orange-100 rounded-2xl rounded-tl-xs text-xs text-orange-700 flex items-center gap-2 shadow-2xs">
                                <div className="flex gap-1">
                                    <span className="h-2 w-2 bg-orange-500 rounded-full animate-bounce" />
                                    <span className="h-2 w-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="h-2 w-2 bg-orange-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                                <span className="text-[11px] font-medium text-slate-600">
                                    Groq AI is analyzing clinical information...
                                </span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Specialty Medical Topic Chips */}
                <div className="mb-3 space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Stethoscope className="h-3.5 w-3.5 text-orange-600" />
                            Quick Medical Topics:
                        </span>
                        <span className="text-[10px] text-slate-400">Click to ask instantly</span>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {medicalTopics.map((topic, i) => {
                            const TopicIcon = topic.icon;
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleSend(topic.prompt)}
                                    disabled={isTyping}
                                    className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-orange-200/80 px-3 py-1.5 rounded-full whitespace-nowrap transition-all shadow-2xs hover:border-orange-300 disabled:opacity-50"
                                >
                                    <TopicIcon className="h-3 w-3 text-orange-500" />
                                    <span>{topic.label}</span>
                                </button>
                            );
                        })}

                        {/* Guardrail Test Pill */}
                        <button
                            onClick={() => handleSend("Can you write a Python script for web scraping?")}
                            disabled={isTyping}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-orange-100/70 hover:bg-orange-100 text-orange-800 border border-orange-300 px-3 py-1.5 rounded-full whitespace-nowrap transition-all shadow-2xs disabled:opacity-50"
                            title="Test the guardrail: non-medical queries will be declined"
                        >
                            <ShieldAlert className="h-3 w-3 text-orange-600" />
                            <span>Test Non-Medical Rejection</span>
                        </button>
                    </div>
                </div>

                {/* Input Form */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        handleSend();
                    }}
                    className="relative bg-white rounded-2xl border border-orange-200 shadow-sm p-2 flex items-center gap-2 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about medical symptoms, medications, health scores, mental wellness, or diet..."
                        disabled={isTyping}
                        className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />

                    <Button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-10 px-4 rounded-xl shadow-md shadow-orange-500/20 shrink-0 font-medium text-xs gap-1.5 disabled:opacity-50"
                    >
                        <span>Send</span>
                        <Send className="h-3.5 w-3.5" />
                    </Button>
                </form>

                {/* Medical Safety Disclaimer Footer */}
                <div className="mt-3 text-center">
                    <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                        <Info className="h-3 w-3 text-orange-500" />
                        <span>
                            <strong>Clinical Disclaimer:</strong> MindHealth AI is for educational and wellness guidance. In an emergency or severe distress, please dial your local emergency services (911/112) or consult a licensed physician.
                        </span>
                    </p>
                </div>
            </div>

            {/* Groq API Key Configuration Modal */}
            {showKeyModal && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-orange-100 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-orange-100">
                            <div className="flex items-center gap-2.5">
                                <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                    <Key className="h-4 w-4" />
                                </div>

                            </div>
                            <button
                                onClick={() => setShowKeyModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs text-slate-600">
                            <p>
                                MindHealth AI uses Groq&apos;s lightning-fast LLaMA 3.3 70B model to answer medical questions.
                            </p>

                            <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-200 space-y-1">
                                <p className="font-semibold text-orange-900">Recommended setup:</p>
                                <p className="text-[11px] text-orange-800">
                                    Add <code className="bg-white px-1.5 py-0.5 rounded border border-orange-200 font-mono text-[10px]">GROQ_API_KEY=your_key</code> into your project&apos;s <code className="bg-white px-1.5 py-0.5 rounded border border-orange-200 font-mono text-[10px]">.env</code> file.
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="font-semibold text-slate-700 block">
                                    Or paste Groq API Key here:
                                </label>
                                <input
                                    type="password"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="gsk_..."
                                    className="w-full bg-orange-50/30 text-slate-900 placeholder:text-slate-400 px-3 py-2 rounded-xl border border-orange-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 font-mono text-xs"
                                />
                                <p className="text-[10px] text-slate-400">
                                    Don&apos;t have a key? You can get a free key instantly at{" "}
                                    <a
                                        href="https://console.groq.com/keys"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-600 underline font-semibold"
                                    >
                                        console.groq.com/keys
                                    </a>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-orange-100">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowKeyModal(false)}
                                className="text-xs border-orange-200 text-slate-600 hover:bg-orange-50"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveKey}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold px-4"
                            >
                                Save Key
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
