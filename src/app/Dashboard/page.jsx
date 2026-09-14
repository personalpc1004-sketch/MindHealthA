"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/Authprovider";
import { supabase } from "@/lib/client";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [selectedMood, setSelectedMood] = useState(null);
    const [journalInput, setJournalInput] = useState("");
    const [journalSaved, setJournalSaved] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const handleSignOut = async () => {
        setSigningOut(true);
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const handleMoodSelect = (mood) => {
        setSelectedMood(mood);
    };

    const handleSaveJournal = (e) => {
        e.preventDefault();
        if (!journalInput.trim()) return;
        setJournalSaved(true);
        setTimeout(() => {
            setJournalSaved(false);
            setJournalInput("");
        }, 3000);
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const moods = [
        { label: "Calm", icon: "😌" },
        { label: "Happy", icon: "😊" },
        { label: "Anxious", icon: "😰" },
        { label: "Tired", icon: "😴" },
        { label: "Motivated", icon: "🚀" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Welcome Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 border border-primary/20">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                        Welcome back! 👋
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Here is your daily mental wellness summary. Take a moment to check in with yourself today.
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Wellness Score</CardDescription>
                            <CardTitle className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                                88<span className="text-sm text-muted-foreground font-normal">/100</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">+5% improvement from last week</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Daily Streak</CardDescription>
                            <CardTitle className="text-3xl font-bold text-amber-500">
                                🔥 5 Days
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">Keep checking in daily!</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Mindfulness Minutes</CardDescription>
                            <CardTitle className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                45 mins
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">3 sessions completed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>AI Insights</CardDescription>
                            <CardTitle className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                12 Tips
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">Tailored for your daily routine</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Interactive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Mood & Journaling */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Daily Mood Check-in */}
                        <Card>
                            <CardHeader>
                                <CardTitle>How are you feeling right now?</CardTitle>
                                <CardDescription>Select a mood to log your current emotional state</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                    {moods.map((m) => (
                                        <button
                                            key={m.label}
                                            onClick={() => handleMoodSelect(m.label)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                                                selectedMood === m.label
                                                    ? "border-primary ring-2 ring-primary/20 bg-primary/10"
                                                    : "border-border hover:border-primary/50"
                                            }`}
                                        >
                                            <span className="text-3xl mb-1">{m.icon}</span>
                                            <span className="text-xs font-medium">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {selectedMood && (
                                    <p className="mt-4 text-xs text-center text-primary font-medium">
                                        Mood logged as "{selectedMood}" for today!
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick AI Mind Journal */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Reflection Journal</CardTitle>
                                <CardDescription>Write down your thoughts or anything on your mind</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSaveJournal} className="space-y-4">
                                    <textarea
                                        rows={4}
                                        value={journalInput}
                                        onChange={(e) => setJournalInput(e.target.value)}
                                        placeholder="What is going well today? What challenges are you facing?"
                                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                                    />
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">
                                            {journalSaved ? "✅ Journal entry saved!" : "Private & encrypted"}
                                        </span>
                                        <Button type="submit" size="sm">
                                            Save Entry
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: AI Assistant & Quick Recommendations */}
                    <div className="space-y-6">
                        <Card className="border-primary/30 bg-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <span>🤖</span> AI Mental Wellness Counselor
                                </CardTitle>
                                <CardDescription>Ask for personalized advice or grounding exercises</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    "It looks like you've been working hard. Remember to take a 5-minute deep breathing break."
                                </p>
                                <div className="space-y-2 pt-2">
                                    <Button variant="outline" className="w-full justify-start text-xs h-auto py-2">
                                        🫁 Start 2-Minute Breathing Exercise
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start text-xs h-auto py-2">
                                        🎧 Play Calming Soundscapes
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start text-xs h-auto py-2">
                                        💬 Chat with MindHealth AI
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Recent Check-ins</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-xs text-muted-foreground">
                                    <li className="flex justify-between items-center pb-2 border-b border-border">
                                        <span>Morning Mood Logged</span>
                                        <span className="font-medium text-foreground">Calm (😌)</span>
                                    </li>
                                    <li className="flex justify-between items-center pb-2 border-b border-border">
                                        <span>Mindfulness Meditation</span>
                                        <span className="font-medium text-foreground">15 mins</span>
                                    </li>
                                    <li className="flex justify-between items-center">
                                        <span>AI Wellness Assessment</span>
                                        <span className="font-medium text-foreground">Completed</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
