"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, RefreshCw, User } from "lucide-react";
import { Button } from "@/components/ui/button";

let dashMsgSeq = 1;
function getDashMsgId(prefix = "dash") {
    dashMsgSeq += 1;
    return `${prefix}-${dashMsgSeq}`;
}

function getDashTimeStr() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardChatbot() {
    const [messages, setMessages] = useState([
        {
            id: "bot-init",
            sender: "bot",
            text: "Hello! I am your MindHealth AI Counselor. How can I support your mental health or assist with downloading your health reports today?",
            time: "Just now",
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const suggestedPrompts = [
        "📊 Explain my Health Score",
        "📥 Download my Health Summary Report",
        "💡 Tips for reducing stress",
        "🧘 Recommended daily mindfulness exercises",
    ];

    const handleSend = (textToSend) => {
        const query = textToSend || input;
        if (!query.trim()) return;

        const msgId = getDashMsgId("user");
        const userMsg = {
            id: msgId,
            sender: "user",
            text: query,
            time: getDashTimeStr(),
        };

        setMessages((prev) => [...prev, userMsg]);
        if (!textToSend) setInput("");
        setIsTyping(true);

        // Intelligent AI counselor responses in Orange & White theme
        setTimeout(() => {
            let replyText = "Your health score is currently 92/100, which reflects strong emotional stability! You can download your official Health Report directly from the Health Reports Download section below.";

            const lower = query.toLowerCase();
            if (lower.includes("download") || lower.includes("report")) {
                replyText = "You can download your complete Mental Health Summary Report or Therapy Notes using the download buttons in the 'Health Reports Download Hub' below!";
            } else if (lower.includes("score") || lower.includes("health") || lower.includes("stat")) {
                replyText = "Your Overall Health Index is at 92/100 (+6% improvement this week). Your mood stability is optimal at 94%, and stress levels remain low.";
            } else if (lower.includes("stress") || lower.includes("tip") || lower.includes("feel")) {
                replyText = "To reduce stress quickly: Practice box breathing (4s in, 4s hold, 4s out, 4s hold) for 3 minutes. Regular mindfulness exercises help keep your stress index under 20%.";
            } else if (lower.includes("mindfulness") || lower.includes("exercise")) {
                replyText = "We recommend 15 minutes of guided morning meditation and a 5-minute evening reflection journal. Track your active minutes in the daily activity graph!";
            }

            const botMsgId = getDashMsgId("bot");
            const botMsg = {
                id: botMsgId,
                sender: "bot",
                text: replyText,
                time: getDashTimeStr(),
            };

            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
        }, 1000);
    };

    const handleReset = () => {
        const resetMsgId = getDashMsgId("bot-reset");
        setMessages([
            {
                id: resetMsgId,
                sender: "bot",
                text: "Chat refreshed! How can I assist you with your health metrics today?",
                time: "Just now",
            },
        ]);
    };

    return (
        <div className="bg-white rounded-2xl border border-orange-100 shadow-sm flex flex-col h-[530px] overflow-hidden">
            {/* Chatbot Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">MindHealth AI Assistant</h3>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded-full border border-orange-200">
                                <Sparkles className="h-3 w-3" /> Live
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-500">Personalized mental health counselor & report guide</p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-orange-600 hover:bg-orange-100/50 rounded-lg"
                    onClick={handleReset}
                    title="Reset Conversation"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-orange-50/20 via-white to-white">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-2.5 max-w-[85%] ${
                            msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                        }`}
                    >
                        <div
                            className={`h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                                msg.sender === "user"
                                    ? "bg-slate-900 text-white"
                                    : "bg-orange-500 text-white shadow-xs"
                            }`}
                        >
                            {msg.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>

                        <div>
                            <div
                                className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                    msg.sender === "user"
                                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-tr-xs shadow-sm shadow-orange-500/10"
                                        : "bg-white border border-orange-100 text-slate-800 rounded-tl-xs shadow-xs"
                                }`}
                            >
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block px-1">
                                {msg.time}
                            </span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-2.5 max-w-[80%] mr-auto items-center">
                        <div className="h-7 w-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
                            <Bot className="h-4 w-4" />
                        </div>
                        <div className="p-3 bg-white border border-orange-100 rounded-2xl rounded-tl-xs text-xs text-orange-600 flex items-center gap-1.5 shadow-xs">
                            <span className="h-2 w-2 bg-orange-500 rounded-full animate-bounce" />
                            <span className="h-2 w-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="h-2 w-2 bg-orange-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                            <span className="text-[11px] font-medium ml-1 text-slate-500">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggested Prompts */}
            <div className="px-4 py-2 bg-orange-50/50 border-t border-orange-100 overflow-x-auto flex gap-2 no-scrollbar">
                {suggestedPrompts.map((prompt, i) => (
                    <button
                        key={i}
                        onClick={() => handleSend(prompt)}
                        className="text-[11px] font-medium bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors shadow-2xs"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Chat Input Field */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                }}
                className="p-3 bg-white border-t border-orange-100 flex items-center gap-2"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask MindHealth AI about your wellness metrics..."
                    className="flex-1 bg-orange-50/40 text-slate-900 placeholder:text-slate-400 text-xs px-3.5 py-2.5 rounded-xl border border-orange-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                />
                <Button
                    type="submit"
                    disabled={!input.trim()}
                    className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-9 px-3.5 rounded-xl shadow-sm shadow-orange-500/25 shrink-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
