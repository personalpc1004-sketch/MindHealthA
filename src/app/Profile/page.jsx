"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/Authprovider";
import { supabase } from "@/lib/client";
import {
    User,
    Camera,
    Upload,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Star,
    MessageSquare,
    Stethoscope,
    Activity,
    ShieldCheck,
    Save,
    RotateCcw,
    Calendar,
    Phone,
    HeartPulse,
    ThumbsUp,
    Filter,
    Plus,
    X,
    ChevronRight,
    Edit3,
    Clock,
    Award,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Clinical Doctors for Consultation & Reviews
export const CLINICAL_DOCTORS = [
    {
        id: "dr-adams",
        name: "Dr. Sarah Adams, MD, PhD",
        shortName: "Dr. Sarah Adams",
        role: "Chief Clinical Psychologist & AI Telehealth Lead",
        specialty: "Depression, Mood Disorders & Digital Clinical Triage",
        avatar: "/ai-interviewer.jpg",
        rating: 4.9,
        reviewsCount: 38,
        experience: "15+ Years Clinical Practice",
    },
    {
        id: "dr-chen",
        name: "Dr. Michael Chen, MD",
        shortName: "Dr. Michael Chen",
        role: "Board-Certified Neuropsychiatrist",
        specialty: "Anxiety, Sleep Architecture & Neurological Well-being",
        avatar: null,
        rating: 4.8,
        reviewsCount: 24,
        experience: "12+ Years Hospital & Research",
    },
    {
        id: "dr-watson",
        name: "Dr. Emily Watson, PsyD",
        shortName: "Dr. Emily Watson",
        role: "Senior Cognitive Behavioral Therapist",
        specialty: "CBT, Work Burnout & Stress Management",
        avatar: null,
        rating: 5.0,
        reviewsCount: 42,
        experience: "10+ Years CBT Specialist",
    },
    {
        id: "dr-sharma",
        name: "Dr. Rajesh Sharma, MD",
        shortName: "Dr. Rajesh Sharma",
        role: "Adult & Adolescent Psychiatry Specialist",
        specialty: "Executive Focus, Adult ADHD & Lifestyle Psychiatry",
        avatar: null,
        rating: 4.9,
        reviewsCount: 19,
        experience: "14+ Years Psychiatric Care",
    },
];

const CONSULTATION_OPTIONS = [
    "AI Video Telehealth Interview",
    "Comprehensive Psychiatric Assessment",
    "Cognitive Behavioral Therapy (CBT)",
    "Stress & Sleep Architecture Consultation",
    "Routine Mental Wellness Check-in",
    "General Medical & Lifestyle Triage",
];

const PROBLEM_TAGS = [
    "Anxiety & Panic",
    "Sleep Disturbance / Insomnia",
    "Depressed Mood & Hopelessness",
    "Work Burnout & Fatigue",
    "Loss of Interest (Anhedonia)",
    "Focus & Cognitive Fog",
    "Unwarranted Guilt & Self-Criticism",
    "Social & Relationship Stress",
];

const AVATAR_PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80",
];

const REVIEW_TAGS = [
    "Compassionate",
    "Great Listener",
    "Accurate Diagnosis",
    "Clear Explanations",
    "Gentle Manner",
    "Practical Guidance",
    "Actionable Advice",
    "Structured Plan",
    "Very Empathetic",
];

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const fileInputRef = useRef(null);

    // Active Section View
    const [activeTab, setActiveTab] = useState("profile"); // "profile" | "reviews"

    // Profile Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [age, setAge] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [consultationType, setConsultationType] = useState(CONSULTATION_OPTIONS[0]);
    const [problemDescription, setProblemDescription] = useState("");
    const [selectedProblemTags, setSelectedProblemTags] = useState([]);
    const [phone, setPhone] = useState("");
    const [emergencyContact, setEmergencyContact] = useState("");

    // Profile UI state
    const [profileLoading, setProfileLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);
    const [saveErrorMsg, setSaveErrorMsg] = useState(null);
    const [latestAssessment, setLatestAssessment] = useState(null);
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);

    // Doctor Reviews State
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [helpfulVotes, setHelpfulVotes] = useState({});

    // Write Review Form State
    const [showWriteReview, setShowWriteReview] = useState(false);
    const [reviewDoctorId, setReviewDoctorId] = useState(CLINICAL_DOCTORS[0].id);
    const [reviewRating, setReviewRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewTitle, setReviewTitle] = useState("");
    const [reviewText, setReviewText] = useState("");
    const [reviewConsultation, setReviewConsultation] = useState(CONSULTATION_OPTIONS[0]);
    const [selectedReviewTags, setSelectedReviewTags] = useState(["Compassionate", "Great Listener"]);
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewSuccessMsg, setReviewSuccessMsg] = useState(null);
    const [reviewErrorMsg, setReviewErrorMsg] = useState(null);

    // Load Profile & Latest Assessment
    useEffect(() => {
        let isMounted = true;
        async function fetchProfileData() {
            if (!user) {
                setProfileLoading(false);
                return;
            }

            try {
                const res = await fetch(`/api/profile?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (isMounted && data.profile) {
                        const p = data.profile;
                        setFirstName(p.first_name || "");
                        setLastName(p.last_name || "");
                        setAge(p.age ? String(p.age) : "");
                        setPhotoUrl(p.photo_url || "");
                        if (p.consultation_type) setConsultationType(p.consultation_type);
                        setProblemDescription(p.problem_description || "");
                        setPhone(p.phone || "");
                        setEmergencyContact(p.emergency_contact || "");
                    }
                    if (isMounted && data.latestAssessment) {
                        setLatestAssessment(data.latestAssessment);
                    }
                }
            } catch (err) {
                console.warn("Could not load profile from API:", err.message);
            } finally {
                if (isMounted) setProfileLoading(false);
            }
        }

        if (!authLoading) {
            fetchProfileData();
        }

        return () => {
            isMounted = false;
        };
    }, [user, authLoading]);

    // Load Doctor Reviews
    const fetchReviews = async (docId = selectedDoctorFilter) => {
        setReviewsLoading(true);
        try {
            const url = docId && docId !== "all"
                ? `/api/doctor-reviews?doctorId=${docId}`
                : `/api/doctor-reviews`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setReviews(data.reviews || []);
            }
        } catch (err) {
            console.warn("Could not load reviews:", err.message);
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews(selectedDoctorFilter);
    }, [selectedDoctorFilter]);

    // Handle Local Image Upload (FileReader to Base64)
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            setSaveErrorMsg("Image is too large. Please select a photo smaller than 4MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoUrl(reader.result);
            setShowAvatarPicker(false);
        };
        reader.readAsDataURL(file);
    };

    // Toggle problem tag chips
    const toggleProblemTag = (tag) => {
        if (selectedProblemTags.includes(tag)) {
            setSelectedProblemTags(selectedProblemTags.filter((t) => t !== tag));
        } else {
            setSelectedProblemTags([...selectedProblemTags, tag]);
            // Also append into description if not already mentioned
            if (!problemDescription.includes(tag)) {
                setProblemDescription((prev) =>
                    prev ? `${prev}, ${tag}` : tag
                );
            }
        }
    };

    // Toggle review tag chips
    const toggleReviewTag = (tag) => {
        if (selectedReviewTags.includes(tag)) {
            setSelectedReviewTags(selectedReviewTags.filter((t) => t !== tag));
        } else {
            setSelectedReviewTags([...selectedReviewTags, tag]);
        }
    };

    // Save Profile to Supabase & Server
    const handleSaveProfile = async (e) => {
        e?.preventDefault();
        setSaveSuccessMsg(null);
        setSaveErrorMsg(null);

        if (!user) {
            setSaveErrorMsg("Please log in to save your profile to Supabase.");
            return;
        }

        setIsSavingProfile(true);

        const payload = {
            userId: user.id,
            firstName,
            lastName,
            age: age ? Number(age) : null,
            photoUrl,
            consultationType,
            problemDescription,
            phone,
            emergencyContact,
        };

        try {
            const res = await fetch("/api/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSaveSuccessMsg("Your medical profile has been saved successfully to Supabase!");
                setTimeout(() => setSaveSuccessMsg(null), 6000);
            } else {
                setSaveErrorMsg(data.error || "Failed to save profile. Please check database permissions.");
            }
        } catch (err) {
            setSaveErrorMsg("Network error saving profile: " + err.message);
        } finally {
            setIsSavingProfile(false);
        }
    };

    // Submit Doctor Review
    const handleSubmitReview = async (e) => {
        e?.preventDefault();
        setReviewSuccessMsg(null);
        setReviewErrorMsg(null);

        if (!reviewTitle.trim() || !reviewText.trim()) {
            setReviewErrorMsg("Please provide both a title and review feedback.");
            return;
        }

        setIsSubmittingReview(true);
        const selectedDoc = CLINICAL_DOCTORS.find((d) => d.id === reviewDoctorId) || CLINICAL_DOCTORS[0];

        const patientName = firstName
            ? `${firstName} ${lastName ? lastName[0] + "." : ""}`
            : user?.email?.split("@")[0] || "Verified Patient";

        const reviewPayload = {
            userId: user?.id || null,
            userName: patientName,
            doctorId: selectedDoc.id,
            doctorName: selectedDoc.name,
            doctorSpecialty: selectedDoc.role,
            rating: reviewRating,
            title: reviewTitle.trim(),
            reviewText: reviewText.trim(),
            consultationType: reviewConsultation,
            tags: selectedReviewTags,
        };

        try {
            const res = await fetch("/api/doctor-reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reviewPayload),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setReviewSuccessMsg(`Thank you! Your review for ${selectedDoc.shortName} has been recorded.`);
                // Reset form
                setReviewTitle("");
                setReviewText("");
                setShowWriteReview(false);
                // Refresh list
                fetchReviews(selectedDoctorFilter);
                setTimeout(() => setReviewSuccessMsg(null), 6000);
            } else {
                setReviewErrorMsg(data.error || "Failed to submit review.");
            }
        } catch (err) {
            setReviewErrorMsg("Error submitting review: " + err.message);
        } finally {
            setIsSubmittingReview(false);
        }
    };

    // Helpful review vote
    const handleHelpfulVote = (reviewId) => {
        setHelpfulVotes((prev) => ({
            ...prev,
            [reviewId]: (prev[reviewId] || 0) + 1,
        }));
    };

    // Filter reviews by query
    const filteredReviews = reviews.filter((r) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            r.doctor_name?.toLowerCase().includes(q) ||
            r.title?.toLowerCase().includes(q) ||
            r.review_text?.toLowerCase().includes(q) ||
            r.user_name?.toLowerCase().includes(q) ||
            r.consultation_type?.toLowerCase().includes(q)
        );
    });

    // Rating text mapping
    const getRatingLabel = (score) => {
        switch (score) {
            case 5:
                return "5 - Outstanding & Compassionate Care";
            case 4:
                return "4 - Very Helpful & Empathetic";
            case 3:
                return "3 - Good Standard Guidance";
            case 2:
                return "2 - Fair Consultation";
            case 1:
                return "1 - Needs Clinical Improvement";
            default:
                return "Select star rating";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-white to-orange-50/30 text-slate-900 pb-16">
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* ── 1. Top Header Banner ─────────────────────────────────── */}
                <div className="rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 p-6 sm:p-8 text-white shadow-xl shadow-orange-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="space-y-1.5 z-10 max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/15 text-white text-xs font-semibold backdrop-blur-sm border border-white/20">
                            <Sparkles className="h-3 w-3 text-amber-200" />
                            <span>Patient Profile &amp; Clinical Care Center</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            {firstName ? `${firstName}'s Health Profile` : "Patient Medical Profile"}
                        </h1>
                        <p className="text-orange-100 text-xs sm:text-sm leading-relaxed">
                            Manage your personal health identity, consultation goals, and primary mental health concerns. Review our certified clinical doctors and read patient feedback.
                        </p>
                    </div>

                    <div className="z-10 flex flex-wrap items-center gap-2.5">

                        <Link href="/Interview">
                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-white text-orange-600 hover:bg-orange-50 border-white text-xs font-bold gap-1.5 shadow-md"
                            >
                                <Stethoscope className="h-3.5 w-3.5 text-orange-600" />
                                <span>AI Consulting</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ── 2. Top Navigation Tabs ───────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl p-2 border border-orange-100 shadow-xs gap-3">
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === "profile"
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                                : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                                }`}
                        >
                            <User className="h-4 w-4" />
                            <span>My Health Profile</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("reviews")}
                            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${activeTab === "reviews"
                                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                                : "text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                                }`}
                        >
                            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                            <span>Doctor Reviews &amp; Ratings ({reviews.length})</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 px-3 text-[11px] text-slate-500">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>Supabase HIPAA-Compliant Data Isolation</span>
                    </div>
                </div>

                {/* Notification Toasts */}
                {saveSuccessMsg && (
                    <div className="p-4 rounded-2xl bg-emerald-600 text-white font-medium text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-emerald-600/20 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="h-5 w-5 text-emerald-100 shrink-0" />
                            <span>{saveSuccessMsg}</span>
                        </div>
                        <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-200 hover:text-white font-bold text-sm px-2">
                            ✕
                        </button>
                    </div>
                )}

                {saveErrorMsg && (
                    <div className="p-4 rounded-2xl bg-rose-500 text-white font-medium text-xs sm:text-sm flex items-center justify-between shadow-lg shadow-rose-500/20 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="h-5 w-5 text-rose-100 shrink-0" />
                            <span>{saveErrorMsg}</span>
                        </div>
                        <button onClick={() => setSaveErrorMsg(null)} className="text-rose-200 hover:text-white font-bold text-sm px-2">
                            ✕
                        </button>
                    </div>
                )}

                {/* ── 3. TAB CONTENT ───────────────────────────────────────── */}
                {activeTab === "profile" ? (
                    /* ══════════ TAB 1: PATIENT PROFILE ══════════ */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Avatar & Summary Card */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Profile Identity Card */}
                            <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm text-center relative overflow-hidden space-y-4">
                                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-orange-100/60 via-amber-100/40 to-orange-100/60 pointer-events-none" />

                                {/* Avatar Circle with Camera Upload trigger */}
                                <div className="relative inline-block mx-auto mt-4">
                                    <div className="h-28 w-28 rounded-full border-4 border-white shadow-xl bg-orange-100 overflow-hidden relative flex items-center justify-center">
                                        {photoUrl ? (
                                            <img
                                                src={photoUrl}
                                                alt="User Avatar"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-orange-600">
                                                <User className="h-12 w-12" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Upload Camera Button */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Upload photo"
                                        className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </div>

                                {/* Avatar Presets Picker Trigger */}
                                <div className="flex items-center justify-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        <span>{showAvatarPicker ? "Close Presets" : "Choose Sample Avatar"}</span>
                                    </button>
                                    {photoUrl && (
                                        <button
                                            type="button"
                                            onClick={() => setPhotoUrl("")}
                                            className="text-xs text-slate-400 hover:text-rose-600 transition-colors"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                {/* Sample Avatars Gallery Drawer */}
                                {showAvatarPicker && (
                                    <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-200/60 space-y-2 animate-in fade-in duration-200">
                                        <p className="text-[11px] font-bold text-orange-900">Select an Avatar Preset</p>
                                        <div className="grid grid-cols-6 gap-2">
                                            {AVATAR_PRESETS.map((preset, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => {
                                                        setPhotoUrl(preset);
                                                        setShowAvatarPicker(false);
                                                    }}
                                                    className="h-10 w-10 rounded-full overflow-hidden border-2 border-transparent hover:border-orange-500 hover:scale-110 transition-all shadow-xs"
                                                >
                                                    <img src={preset} alt={`Preset ${idx + 1}`} className="h-full w-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* User Details Summary */}
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {firstName || lastName ? `${firstName} ${lastName}`.trim() : user?.email?.split("@")[0] || "Patient"}
                                    </h3>
                                    <p className="text-xs text-slate-500 truncate">{user?.email || "Signed in patient"}</p>
                                    <div className="flex items-center justify-center gap-2 pt-1">
                                        {age && (
                                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 border border-orange-200">
                                                Age: {age}
                                            </span>
                                        )}

                                    </div>
                                </div>

                                {/* Consultation Info pill */}

                            </div>

                            {/* Clinical Assessment History Snapshot */}
                            <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Latest PHQ-9 Status</span>
                                    <Link href="/Assessment" className="text-xs font-semibold text-orange-600 hover:underline">
                                        Take Test
                                    </Link>
                                </div>

                                {latestAssessment ? (
                                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/80 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Predicted Severity:</span>
                                            <span className="font-extrabold text-orange-700 text-sm">
                                                {latestAssessment.prediction || "Completed"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                                            <span>Recorded On:</span>
                                            <span>{new Date(latestAssessment.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center space-y-2">
                                        <p className="text-xs text-slate-500">No PHQ-9 assessment taken yet.</p>
                                        <Link href="/Assessment">
                                            <Button size="sm" variant="outline" className="text-xs border-orange-200 text-orange-600 hover:bg-orange-50">
                                                Start Assessment
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Profile Edit Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl border border-orange-100 p-6 sm:p-8 shadow-sm space-y-6">
                                <div className="border-b border-orange-100 pb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">Personal &amp; Clinical Information</h2>
                                        <p className="text-xs text-slate-500">
                                            This information tailors your consultations with Dr. Sarah Adams and our clinical team.
                                        </p>
                                    </div>
                                    <div className="h-8 w-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                        <Edit3 className="h-4 w-4" />
                                    </div>
                                </div>

                                {/* Form Grid: Name, Surname, Age */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">First Name</label>
                                        <input
                                            type="text"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="e.g. Alex"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Surname / Last Name</label>
                                        <input
                                            type="text"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="e.g. Taylor"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Age</label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="120"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            placeholder="e.g. 28"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Form: Consultation Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                        <Stethoscope className="h-3.5 w-3.5 text-orange-600" />
                                        <span>Target Consultation Type</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {CONSULTATION_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                type="button"
                                                onClick={() => setConsultationType(opt)}
                                                className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${consultationType === opt
                                                    ? "border-orange-500 bg-orange-50/70 text-orange-950 font-bold ring-2 ring-orange-500/10"
                                                    : "border-slate-200 text-slate-700 hover:border-orange-200 hover:bg-orange-50/30"
                                                    }`}
                                            >
                                                <span>{opt}</span>
                                                {consultationType === opt && (
                                                    <CheckCircle2 className="h-4 w-4 text-orange-600 shrink-0 ml-2" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Form: Problem Description & Quick Chips */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
                                            <span>Current Symptoms / Mental Health Problem</span>
                                        </label>
                                        <span className="text-[11px] text-slate-400">Click chips to auto-add</span>
                                    </div>

                                    {/* Problem Quick Chips */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {PROBLEM_TAGS.map((tag) => {
                                            const isSelected = selectedProblemTags.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleProblemTag(tag)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${isSelected
                                                        ? "bg-orange-600 text-white border-orange-600 shadow-xs"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-300 hover:text-orange-700"
                                                        }`}
                                                >
                                                    {isSelected ? "✓ " : "+ "}
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Problem Detailed Textarea */}
                                    <textarea
                                        rows={3}
                                        value={problemDescription}
                                        onChange={(e) => setProblemDescription(e.target.value)}
                                        placeholder="Describe what you are currently going through (e.g. trouble concentrating on work, experiencing insomnia for the past 2 weeks, persistent low energy)..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all leading-relaxed"
                                    />
                                </div>

                                {/* Contact & Emergency Contact */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-orange-100">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                            <Phone className="h-3 w-3 text-slate-500" />
                                            <span>Phone Number (Optional)</span>
                                        </label>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                            <HeartPulse className="h-3 w-3 text-rose-500" />
                                            <span>Emergency Contact (Name &amp; Phone)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={emergencyContact}
                                            onChange={(e) => setEmergencyContact(e.target.value)}
                                            placeholder="e.g. Emma (Sister) - 555-0199"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Submit & Save Button */}
                                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-orange-100">
                                    <span className="text-[11px] text-slate-500">
                                        All profile data is saved securely to your Supabase account.
                                    </span>
                                    <Button
                                        type="submit"
                                        disabled={isSavingProfile}
                                        className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-8 py-2.5 rounded-xl shadow-md shadow-orange-500/20 gap-2 transition-all"
                                    >
                                        {isSavingProfile ? (
                                            <>
                                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span>Saving to Supabase...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-3.5 w-3.5" />
                                                <span>Save &amp; Update Profile</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* ══════════ TAB 2: DOCTOR REVIEWS & FEEDBACK ══════════ */
                    <div className="space-y-8">
                        {/* Doctor Overview Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {CLINICAL_DOCTORS.map((doc) => {
                                const isSelected = selectedDoctorFilter === doc.id;
                                return (
                                    <div
                                        key={doc.id}
                                        onClick={() =>
                                            setSelectedDoctorFilter(isSelected ? "all" : doc.id)
                                        }
                                        className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all duration-200 relative group ${isSelected
                                            ? "border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/40"
                                            : "border-orange-100 hover:border-orange-300 hover:bg-orange-50/20"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-orange-100 text-orange-700 font-bold overflow-hidden border border-orange-200 flex items-center justify-center shrink-0">
                                                {doc.avatar ? (
                                                    <img src={doc.avatar} alt={doc.shortName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <Stethoscope className="h-6 w-6 text-orange-600" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-bold text-slate-900 truncate">{doc.shortName}</h4>
                                                <p className="text-[10px] text-slate-500 truncate">{doc.role}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <div className="flex items-center text-amber-500">
                                                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                                        <span className="text-[11px] font-bold ml-1 text-slate-700">{doc.rating}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400">({doc.reviewsCount})</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                            <span className="text-slate-500 truncate">{doc.experience}</span>
                                            <span className={`font-bold ${isSelected ? "text-orange-600" : "text-slate-400"}`}>
                                                {isSelected ? "Filtered ✓" : "View"}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Reviews Control & Action Header */}
                        <div className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Patient Reviews &amp; Doctor Ratings
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Authentic reviews and clinical satisfaction scores stored in Supabase.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button
                                        onClick={() => setShowWriteReview(!showWriteReview)}
                                        className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs gap-1.5 px-5 py-2.5 rounded-xl shadow-md shadow-orange-500/20"
                                    >
                                        <Plus className="h-4 w-4" />
                                        <span>{showWriteReview ? "Cancel Review" : "Write a Review"}</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Filter Bar & Search */}
                            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-orange-50">
                                <div className="flex-1 w-full sm:w-auto relative">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search reviews by doctor name, keywords, consultation..."
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                        <Filter className="h-3 w-3" />
                                        Doctor:
                                    </span>
                                    <select
                                        value={selectedDoctorFilter}
                                        onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                                        className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                    >
                                        <option value="all">All Doctors</option>
                                        {CLINICAL_DOCTORS.map((d) => (
                                            <option key={d.id} value={d.id}>
                                                {d.shortName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Write Review Form Card (Collapsible) */}
                        {showWriteReview && (
                            <form
                                onSubmit={handleSubmitReview}
                                className="bg-white rounded-3xl border-2 border-orange-500/40 p-6 sm:p-8 shadow-lg shadow-orange-500/10 space-y-6 animate-in slide-in-from-top-4 duration-300"
                            >
                                <div className="flex items-center justify-between border-b border-orange-100 pb-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                                            <Edit3 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-base font-bold text-slate-900">Write a Clinical Doctor Review</h4>
                                            <p className="text-xs text-slate-500">Your review helps other patients make informed health choices.</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowWriteReview(false)}
                                        className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {reviewErrorMsg && (
                                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{reviewErrorMsg}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Select Doctor */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Select Doctor</label>
                                        <select
                                            value={reviewDoctorId}
                                            onChange={(e) => setReviewDoctorId(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                        >
                                            {CLINICAL_DOCTORS.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} — {d.role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Consultation Type */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700">Consultation Received</label>
                                        <select
                                            value={reviewConsultation}
                                            onChange={(e) => setReviewConsultation(e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                        >
                                            {CONSULTATION_OPTIONS.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Star Rating Interactive Picker */}
                                <div className="space-y-2 p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
                                    <label className="text-xs font-bold text-slate-700 block">Your Overall Rating</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setReviewRating(star)}
                                                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                                                >
                                                    <Star
                                                        className={`h-7 w-7 transition-colors ${(hoverRating || reviewRating) >= star
                                                            ? "text-amber-400 fill-amber-400"
                                                            : "text-slate-300"
                                                            }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-xs font-semibold text-orange-900 ml-2">
                                            {getRatingLabel(hoverRating || reviewRating)}
                                        </span>
                                    </div>
                                </div>

                                {/* Review Title */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Review Headline</label>
                                    <input
                                        type="text"
                                        value={reviewTitle}
                                        onChange={(e) => setReviewTitle(e.target.value)}
                                        placeholder="e.g. Incredibly supportive and insightful consultation"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                                    />
                                </div>

                                {/* Review Text */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700">Detailed Feedback &amp; Experience</label>
                                    <textarea
                                        rows={4}
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        placeholder="Share details of your experience: how did the doctor listen? Did the explanation help you understand your symptoms? Were the next steps clear?..."
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all leading-relaxed"
                                    />
                                </div>

                                {/* Review Tags */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">Select Experience Highlights</label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {REVIEW_TAGS.map((tag) => {
                                            const isSelected = selectedReviewTags.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleReviewTag(tag)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${isSelected
                                                        ? "bg-orange-500 text-white border-orange-500 shadow-xs"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-orange-200"
                                                        }`}
                                                >
                                                    {isSelected ? "✓ " : "+ "}
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Submit Actions */}
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-orange-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowWriteReview(false)}
                                        className="text-xs"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmittingReview}
                                        className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md gap-2"
                                    >
                                        {isSubmittingReview ? (
                                            <>
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span>Submitting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Star className="h-3.5 w-3.5 fill-white text-white" />
                                                <span>Publish Review to Supabase</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Reviews Feed List */}
                        <div className="space-y-4">
                            {reviewsLoading ? (
                                <div className="p-12 text-center bg-white rounded-3xl border border-orange-100 shadow-sm space-y-3">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
                                    <p className="text-xs font-semibold text-slate-500">Loading doctor reviews from Supabase...</p>
                                </div>
                            ) : filteredReviews.length === 0 ? (
                                <div className="p-12 text-center bg-white rounded-3xl border border-orange-100 shadow-sm space-y-3">
                                    <MessageSquare className="h-10 w-10 text-orange-400 mx-auto" />
                                    <h4 className="text-sm font-bold text-slate-800">No reviews found matching criteria</h4>
                                    <p className="text-xs text-slate-500">Be the first patient to write a review for this clinical doctor!</p>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowWriteReview(true)}
                                        className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold"
                                    >
                                        Write First Review
                                    </Button>
                                </div>
                            ) : (
                                filteredReviews.map((rev) => (
                                    <div
                                        key={rev.id}
                                        className="bg-white rounded-3xl border border-orange-100 p-6 shadow-sm hover:shadow-md transition-all hover:border-orange-200 space-y-3.5"
                                    >
                                        {/* Review Header: User Info & Stars */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                                                    {rev.user_name?.[0]?.toUpperCase() || "P"}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-900">{rev.user_name}</span>
                                                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                                            <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                                            Verified Patient
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span className="text-orange-700 font-medium">{rev.consultation_type || "Clinical Consultation"}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Stars */}
                                            <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 self-start sm:self-auto">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`h-3.5 w-3.5 ${i < (rev.rating || 5)
                                                            ? "text-amber-400 fill-amber-400"
                                                            : "text-slate-300"
                                                            }`}
                                                    />
                                                ))}
                                                <span className="text-xs font-bold text-amber-900 ml-1">{rev.rating || 5}.0</span>
                                            </div>
                                        </div>

                                        {/* Doctor Badge */}
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-orange-50/80 border border-orange-200/80 text-xs">
                                            <Stethoscope className="h-3.5 w-3.5 text-orange-600" />
                                            <span className="font-bold text-slate-800">Review for:</span>
                                            <span className="text-orange-700 font-semibold">{rev.doctor_name}</span>
                                            {rev.doctor_specialty && (
                                                <span className="text-slate-500 text-[10px]">({rev.doctor_specialty})</span>
                                            )}
                                        </div>

                                        {/* Title & Body */}
                                        <div className="space-y-1.5">
                                            <h4 className="text-sm font-bold text-slate-900">{rev.title}</h4>
                                            <p className="text-xs text-slate-600 leading-relaxed">{rev.review_text}</p>
                                        </div>

                                        {/* Tags & Helpful Button */}
                                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                            <div className="flex flex-wrap gap-1.5">
                                                {(Array.isArray(rev.tags) ? rev.tags : []).map((t, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                                                    >
                                                        #{t}
                                                    </span>
                                                ))}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleHelpfulVote(rev.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-orange-600 hover:bg-orange-50 border border-slate-200 transition-colors"
                                            >
                                                <ThumbsUp className="h-3 w-3" />
                                                <span>Helpful</span>
                                                {helpfulVotes[rev.id] && (
                                                    <span className="text-orange-600 font-bold">({helpfulVotes[rev.id]})</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
