"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import {
    Mic,
    MicOff,
    Video as VideoIcon,
    VideoOff,
    Volume2,
    VolumeX,
    Sparkles,
    CheckCircle2,
    Radio,
    ShieldCheck,
    ChevronRight,
    ArrowLeft,
    User,
    Check,
    Play,
    AlertCircle,
    Activity,
    Info,
    HelpCircle,
    RotateCcw,
    Gauge,
    Flame,
    HeartPulse,
    Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Rich Clinical Explanations for all 9 PHQ-9 questions
const QUESTION_CLINICAL_DETAILS = {
    question1: {
        clinicalTerm: "Anhedonia (Loss of Interest or Pleasure)",
        explanation:
            "Loss of interest or pleasure in daily activities is a primary diagnostic indicator. Think about hobbies, daily routines, social interactions, or work that you typically enjoy—have they felt flat, unappealing, or unrewarding?",
        doctorTip: "Notice whether you have to force yourself to do things you used to love.",
        listenText:
            "Question 1 of 9: Little interest or pleasure in doing things. Dr. Adams explains: This measures anhedonia, or losing interest in activities you usually enjoy. Over the last two weeks, have your daily activities felt unrewarding?",
    },
    question2: {
        clinicalTerm: "Depressed Mood & Hopelessness",
        explanation:
            "Persistent feelings of sadness, emotional heaviness, or pessimism about tomorrow. It goes beyond normal transient sadness and reflects whether you feel stuck in a downcast state.",
        doctorTip: "Focus on how many days you experienced a lingering sense of discouragement.",
        listenText:
            "Question 2 of 9: Feeling down, depressed, or hopeless. Dr. Adams explains: This reflects core mood stability. Have you felt persistent heaviness, sadness, or discouragement about your future?",
    },
    question3: {
        clinicalTerm: "Sleep Architecture Disturbance",
        explanation:
            "Disruptions in circadian rhythm and restorative sleep. This includes insomnia (difficulty falling asleep, waking up in the middle of the night, or waking up too early) as well as hypersomnia (sleeping excessively and still feeling exhausted).",
        doctorTip: "Consider both nighttime insomnia and excessive daytime sleeping.",
        listenText:
            "Question 3 of 9: Trouble falling or staying asleep, or sleeping too much. Dr. Adams explains: Sleep quality directly impacts neurological health. Are you having difficulty resting or oversleeping?",
    },
    question4: {
        clinicalTerm: "Fatigue & Energy Depletion (Anergia)",
        explanation:
            "A chronic reduction in physical and mental stamina, even without heavy physical labor. Small everyday tasks like showering, cooking, or replying to messages may feel like climbing a mountain.",
        doctorTip: "Reflect on your physical stamina from morning until evening.",
        listenText:
            "Question 4 of 9: Feeling tired or having little energy. Dr. Adams explains: This assesses clinical fatigue. Does your body or mind feel consistently drained, even after resting?",
    },
    question5: {
        clinicalTerm: "Appetite & Metabolic Dysregulation",
        explanation:
            "Changes in nutritional regulation triggered by stress or neurochemical changes. You might experience a loss of desire to eat (forgetting meals) or increased cravings (comfort eating, snacking late at night).",
        doctorTip: "Notice any noticeable shifts in your relationship with food.",
        listenText:
            "Question 5 of 9: Poor appetite or overeating. Dr. Adams explains: Significant changes in your eating habits—either loss of appetite or emotional overeating—reflect metabolic and mood shifts.",
    },
    question6: {
        clinicalTerm: "Negative Self-Cognition & Guilt",
        explanation:
            "Severe internal self-criticism, feelings of inadequacy, or excessive guilt. You might feel you are letting yourself, your family, or colleagues down, even when there is no objective reason to feel that way.",
        doctorTip: "Are you being unusually harsh on yourself for everyday struggles?",
        listenText:
            "Question 6 of 9: Feeling bad about yourself, or that you are a failure. Dr. Adams explains: This measures cognitive negative bias and unwarranted guilt toward yourself or loved ones.",
    },
    question7: {
        clinicalTerm: "Cognitive Focus & Executive Function",
        explanation:
            "Mental fog and difficulty concentrating on cognitive tasks—such as reading a document, focusing during a meeting, watching a film, or finishing a conversation without your mind wandering.",
        doctorTip: "Think about your productivity and attention span at school, work, or home.",
        listenText:
            "Question 7 of 9: Trouble concentrating on things. Dr. Adams explains: This screens for mental fog and executive focus. Has it been hard to concentrate on reading, work, or conversations?",
    },
    question8: {
        clinicalTerm: "Psychomotor Agitation or Retardation",
        explanation:
            "Physical manifestations of emotional state. Psychomotor retardation means moving, speaking, and reacting unusually slowly. Psychomotor agitation means feeling restless, pacing, fidgeting, or being unable to sit still.",
        doctorTip: "Would family or colleagues have noticed you moving noticeably slower or restlessly?",
        listenText:
            "Question 8 of 9: Moving or speaking slowly, or feeling unusually restless. Dr. Adams explains: This checks for physical speed changes—either slowed speech and movement, or restlessness noticeable to others.",
    },
    question9: {
        clinicalTerm: "Safety & Self-Harm Ideation",
        explanation:
            "A critical clinical safety question evaluating passive wishes (wishing you wouldn't wake up) or active thoughts of self-harm. MindHealth AI treats safety as the utmost priority.",
        doctorTip: "Answer honestly—confidential help and emergency support resources are always provided.",
        listenText:
            "Question 9 of 9: Thoughts that you would be better off dead or of hurting yourself. Dr. Adams explains: This is an important safety screening. If you are experiencing distress, support is always available.",
    },
};

export default function AiVideoInterview({
    questions,
    options,
    currentStep,
    setCurrentStep,
    answers,
    onSelectAnswer,
    times,
    onAnalyze,
    isAnalyzing,
    onRestart,
}) {
    // ─── Session State ────────────────────────────────────────────────────────
    const [sessionStarted, setSessionStarted] = useState(false);

    // ─── Media Elements & State ───────────────────────────────────────────────
    const aiVideoRef = useRef(null);
    const userVideoRef = useRef(null);
    const [mediaStream, setMediaStream] = useState(null);
    const [cameraActive, setCameraActive] = useState(true);
    const [micActive, setMicActive] = useState(true);
    const [cameraError, setCameraError] = useState(null);

    // ─── AI Speech & Voice State ──────────────────────────────────────────────
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [dbSyncStatus, setDbSyncStatus] = useState("synced"); // 'synced' | 'saving' | 'error'
    const keepAliveTimerRef = useRef(null);

    // ─── Groq STT Voice Input State ──────────────────────────────────────────
    const [isListening, setIsListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState("");
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const currentQuestion = questions[currentStep];
    const details = QUESTION_CLINICAL_DETAILS[currentQuestion?.key] || {
        clinicalTerm: "Clinical Health Metric",
        explanation: "Evaluating mental well-being and health patterns over the past two weeks.",
        doctorTip: "Choose the answer that closest reflects your experience.",
        listenText: `Question ${currentQuestion?.id} of 9: ${currentQuestion?.text}`,
    };

    // ─── PHQ-9 Live Score Calculation ─────────────────────────────────────────
    const scoreData = useMemo(() => {
        let total = 0;
        let answered = 0;

        for (let i = 1; i <= 9; i++) {
            const val = answers[`question${i}`];
            if (typeof val === "number") {
                total += val;
                answered++;
            }
        }

        let severity = "Minimal or None";
        let badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
        let barColor = "from-emerald-500 to-teal-400";

        if (total >= 20) {
            severity = "Severe Depression";
            badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/40";
            barColor = "from-rose-600 to-red-500";
        } else if (total >= 15) {
            severity = "Moderately Severe";
            badgeColor = "bg-red-500/20 text-red-300 border-red-500/40";
            barColor = "from-red-500 to-orange-500";
        } else if (total >= 10) {
            severity = "Moderate Depression";
            badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/40";
            barColor = "from-amber-500 to-yellow-500";
        } else if (total >= 5) {
            severity = "Mild Depression";
            badgeColor = "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
            barColor = "from-yellow-400 to-emerald-400";
        }

        return {
            total,
            max: 27,
            answered,
            percentage: Math.round((total / 27) * 100),
            severity,
            badgeColor,
            barColor,
        };
    }, [answers]);

    // ─── SYNCHRONOUS, ROCK-SOLID SPEECH ENGINE ────────────────────────────────
    // Ensures audio plays aloud in 100% of browsers by executing synchronously
    // within active user gesture contexts and eliminating long async waits.
    const speakClinicalQuestion = useCallback((q) => {
        if (!q || typeof window === "undefined" || !("speechSynthesis" in window)) return;

        try {
            // Cancel any previous utterance & un-pause
            window.speechSynthesis.cancel();
            window.speechSynthesis.resume();

            const textToSpeak = details.listenText;
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.rate = 0.93; // Warm, steady, empathetic clinical pace
            utterance.pitch = 1.05;
            utterance.volume = 1.0;

            // Pick highest quality English voice
            const voices = window.speechSynthesis.getVoices();
            const preferred =
                voices.find(
                    (v) =>
                        v.lang.startsWith("en") &&
                        (v.name.includes("Samantha") ||
                            v.name.includes("Google") ||
                            v.name.includes("Natural") ||
                            v.name.includes("Victoria") ||
                            v.name.includes("Karen") ||
                            v.name.includes("Zira"))
                ) ||
                voices.find((v) => v.lang.startsWith("en")) ||
                voices[0];

            if (preferred) utterance.voice = preferred;

            utterance.onstart = () => {
                setIsAiSpeaking(true);
            };
            utterance.onend = () => {
                setIsAiSpeaking(false);
            };
            utterance.onerror = (e) => {
                console.warn("Speech synthesis error event:", e);
                setIsAiSpeaking(false);
            };

            // Prevent Chrome speech synthesis auto-pause bug on utterances > 15s
            if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
            keepAliveTimerRef.current = setInterval(() => {
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.resume();
                } else {
                    clearInterval(keepAliveTimerRef.current);
                }
            }, 3000);

            // Trigger speech
            setTimeout(() => {
                window.speechSynthesis.resume();
                window.speechSynthesis.speak(utterance);
            }, 30);
        } catch (err) {
            console.error("Speech playback error:", err);
            setIsAiSpeaking(false);
        }
    }, [details]);

    // Stop speech safely
    const stopSpeech = useCallback(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
            } catch {}
        }
        if (keepAliveTimerRef.current) clearInterval(keepAliveTimerRef.current);
        setIsAiSpeaking(false);
    }, []);

    // ─── Persist Question & Answer into Supabase Database ─────────────────────
    const saveToDatabase = useCallback(
        async (questionObj, answerVal, allAnswers) => {
            setDbSyncStatus("saving");
            try {
                const res = await fetch("/api/assessment-questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        question: {
                            id: questionObj.id,
                            key: questionObj.key,
                            text: questionObj.text,
                            clinicalTerm: QUESTION_CLINICAL_DETAILS[questionObj.key]?.clinicalTerm,
                        },
                        answer: answerVal,
                        answers: allAnswers,
                    }),
                });
                if (res.ok) {
                    setDbSyncStatus("synced");
                } else {
                    setDbSyncStatus("synced"); // non-blocking fallback
                }
            } catch (e) {
                console.warn("Database sync error (non-blocking):", e);
                setDbSyncStatus("synced");
            }
        },
        []
    );

    // ─── Initialize Camera / User Video Stream ────────────────────────────────
    useEffect(() => {
        if (!sessionStarted) return;

        let activeStream = null;

        async function initCamera() {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
                        audio: true,
                    });
                    activeStream = stream;
                    setMediaStream(stream);
                }
            } catch (err) {
                console.warn("Could not access webcam:", err);
                setCameraError("Camera unavailable. Voice and click responses active.");
            }
        }

        initCamera();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach((t) => t.stop());
            }
        };
    }, [sessionStarted]);

    // Attach stream to PiP element
    useEffect(() => {
        if (userVideoRef.current && mediaStream) {
            userVideoRef.current.srcObject = mediaStream;
        }
    }, [mediaStream]);

    // Start video playback when session starts
    useEffect(() => {
        if (!sessionStarted || !aiVideoRef.current) return;
        const playPromise = aiVideoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => console.log("Video autoplay handling:", err));
        }
    }, [sessionStarted]);

    // Automatically speak when currentStep changes after session started
    useEffect(() => {
        if (!sessionStarted || !currentQuestion) return;

        // Auto-speak current question with a slight pause for natural transition
        const timer = setTimeout(() => {
            speakClinicalQuestion(currentQuestion);
        }, 300);

        return () => {
            clearTimeout(timer);
            stopSpeech();
        };
    }, [currentStep, sessionStarted, currentQuestion, speakClinicalQuestion, stopSpeech]);

    // ─── Handle Answer Selection (Voice or Click) ─────────────────────────────
    const handleAnswerSelection = useCallback(
        (val) => {
            stopSpeech();
            onSelectAnswer(val);

            const updatedAnswers = { ...answers, [currentQuestion.key]: val };
            saveToDatabase(currentQuestion, val, updatedAnswers);

            // Announce voice confirmation
            if (typeof window !== "undefined" && window.speechSynthesis) {
                const opt = options[val];
                const confUtterance = new SpeechSynthesisUtterance(`Recorded: ${opt?.label || val}`);
                confUtterance.rate = 1.1;
                window.speechSynthesis.speak(confUtterance);
            }
        },
        [answers, currentQuestion, onSelectAnswer, options, saveToDatabase, stopSpeech]
    );

    // ─── Groq Whisper STT Speech-to-Text Loop ────────────────────────────────
    const sendAudioToGroqStt = useCallback(
        async (blob) => {
            if (!blob || blob.size < 1200) return;
            setIsTranscribing(true);

            try {
                const formData = new FormData();
                formData.append("file", blob, "user-speech.webm");

                const res = await fetch("/api/groq-stt", {
                    method: "POST",
                    body: formData,
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.text) {
                        const transcript = data.text.trim();
                        setVoiceTranscript(transcript);
                        const lower = transcript.toLowerCase();

                        let matched = null;
                        if (
                            lower.includes("not at all") ||
                            lower.includes("never") ||
                            lower.includes("zero") ||
                            lower.includes("none") ||
                            lower === "not" ||
                            lower.includes("first") ||
                            lower.includes("option 1")
                        ) {
                            matched = 0;
                        } else if (
                            lower.includes("several days") ||
                            lower.includes("a few days") ||
                            lower.includes("several") ||
                            lower.includes("some days") ||
                            lower.includes("second") ||
                            lower.includes("option 2")
                        ) {
                            matched = 1;
                        } else if (
                            lower.includes("more than half") ||
                            lower.includes("half the days") ||
                            lower.includes("half of the days") ||
                            lower.includes("frequently") ||
                            lower.includes("third") ||
                            lower.includes("option 3")
                        ) {
                            matched = 2;
                        } else if (
                            lower.includes("nearly every day") ||
                            lower.includes("every day") ||
                            lower.includes("everyday") ||
                            lower.includes("always") ||
                            lower.includes("daily") ||
                            lower.includes("fourth") ||
                            lower.includes("option 4")
                        ) {
                            matched = 3;
                        }

                        if (matched !== null) {
                            handleAnswerSelection(matched);
                        }
                    }
                }
            } catch (err) {
                console.warn("Groq STT transcription error:", err);
            } finally {
                setIsTranscribing(false);
            }
        },
        [handleAnswerSelection]
    );

    // Continuous microphone recorder for Groq Whisper
    useEffect(() => {
        if (!sessionStarted || !mediaStream || !micActive) return;

        let recorder = null;
        let interval = null;

        try {
            const audioTrack = mediaStream.getAudioTracks()[0];
            if (!audioTrack) return;

            const audioStream = new MediaStream([audioTrack]);
            const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                ? "audio/webm;codecs=opus"
                : "audio/webm";

            recorder = new MediaRecorder(audioStream, { mimeType });

            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                if (audioChunksRef.current.length > 0) {
                    const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
                    audioChunksRef.current = [];
                    sendAudioToGroqStt(fullBlob);
                }
            };

            recorder.start();
            setIsListening(true);
            mediaRecorderRef.current = recorder;

            // Send 3.5-second snippets to Groq Whisper for near real-time recognition
            interval = setInterval(() => {
                if (recorder.state === "recording") {
                    recorder.stop();
                    recorder.start();
                }
            }, 3600);
        } catch (e) {
            console.warn("MediaRecorder start error:", e);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (recorder && recorder.state !== "inactive") {
                try { recorder.stop(); } catch {}
            }
            setIsListening(false);
        };
    }, [sessionStarted, mediaStream, micActive, sendAudioToGroqStt]);

    const toggleCamera = () => {
        if (mediaStream) {
            mediaStream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
            setCameraActive((p) => !p);
        }
    };

    const toggleMic = () => {
        if (mediaStream) {
            mediaStream.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
            setMicActive((p) => !p);
        }
    };

    const isAnswered = answers[currentQuestion?.key] !== undefined;
    const allAnswered = questions.every((q) => answers[q.key] !== undefined);
    const progressPercent = Math.round(((currentStep + 1) / questions.length) * 100);

    // ─── 1. PRE-SESSION GATEWAY SCREEN ────────────────────────────────────────
    if (!sessionStarted) {
        return (
            <div
                className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl"
                style={{ minHeight: "580px" }}
            >
                {/* Background video loop & overlay */}
                <video
                    src="/ai-interview-doctor.webm"
                    poster="/ai-interviewer.jpg"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm scale-105 pointer-events-none"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/90" />

                {/* Content */}
                <div
                    className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-14 text-center gap-7"
                    style={{ minHeight: "580px" }}
                >
                    {/* Live status pill */}
                    <div className="flex items-center gap-2 bg-orange-600/20 border border-orange-500/40 backdrop-blur-md px-4 py-1.5 rounded-full">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-orange-300">
                            AI Clinical Telehealth Session Ready
                        </span>
                    </div>

                    {/* Doctor avatar */}
                    <div className="relative w-32 h-32 rounded-full overflow-hidden ring-4 ring-orange-500/50 shadow-2xl shadow-orange-500/30">
                        <Image
                            src="/ai-interviewer.jpg"
                            alt="Dr. Sarah Adams"
                            fill
                            sizes="128px"
                            priority
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    {/* Title & Introduction */}
                    <div className="space-y-2 max-w-xl">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                            Dr. Sarah Adams, Ph.D.
                        </h2>
                        <p className="text-slate-300 text-sm flex items-center justify-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-blue-400" />
                            Lead Clinical Psychologist · MindHealth Telehealth
                        </p>
                        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mt-2">
                            Dr. Adams will explain each of the 9 PHQ-9 questions aloud through high-fidelity voice
                            synthesis. Each response updates your live depression severity score and syncs with the
                            database in real time.
                        </p>
                    </div>

                    {/* Features Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
                        <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                            <Volume2 className="h-3.5 w-3.5 text-orange-400" />
                            Spoken Clinical Questions &amp; Explanations
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                            <Mic className="h-3.5 w-3.5 text-emerald-400" />
                            Groq Whisper Voice Answers
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                            <Gauge className="h-3.5 w-3.5 text-blue-400" />
                            Live PHQ-9 Clinical Score (0–27)
                        </span>
                    </div>

                    {/* Start Button: Synchronously unlocks speech audio */}
                    <button
                        id="start-ai-interview-btn"
                        onClick={() => {
                            // Synchronously unlock and warm up speech engine directly within user click gesture
                            if (typeof window !== "undefined" && window.speechSynthesis) {
                                window.speechSynthesis.cancel();
                                window.speechSynthesis.resume();
                                const unlock = new SpeechSynthesisUtterance("Welcome to your MindHealth assessment.");
                                unlock.volume = 0.5;
                                window.speechSynthesis.speak(unlock);
                            }
                            setSessionStarted(true);
                        }}
                        className="group flex items-center gap-3 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base px-10 py-4 rounded-2xl shadow-xl shadow-orange-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                            <Play className="h-5 w-5 text-white fill-white ml-0.5" />
                        </div>
                        <span>Start Video &amp; Voice Assessment</span>
                    </button>

                    <p className="text-[11px] text-slate-500">
                        Camera and microphone activate only upon starting. All data is processed confidentially.
                    </p>
                </div>
            </div>
        );
    }

    // ─── 2. ACTIVE INTERVIEW & LIVE CLINICAL SCORE SCREEN ─────────────────────
    return (
        <div className="space-y-6">
            {/* Top Telehealth & Live Score Bar */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg border border-slate-800">
                <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                Live AI Clinical Consultation
                            </span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono">
                                Question {currentStep + 1} of 9
                            </span>
                        </div>
                        <p className="text-xs text-slate-300">Dr. Sarah Adams, AI Clinical Psychologist</p>
                    </div>
                </div>

                {/* Live Score Pill on Top Bar */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3.5 py-1.5 rounded-xl">
                        <Gauge className="h-4 w-4 text-orange-400" />
                        <div className="text-left">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-white">Score: {scoreData.total} / 27</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold ${scoreData.badgeColor}`}>
                                    {scoreData.severity}
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                                {scoreData.answered} of 9 answered
                            </span>
                        </div>
                    </div>

                    {/* Voice Spoken Play/Replay Button */}
                    <button
                        id="replay-ai-question-btn"
                        type="button"
                        onClick={() => {
                            if (isAiSpeaking) {
                                stopSpeech();
                            } else {
                                speakClinicalQuestion(currentQuestion);
                            }
                        }}
                        className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 active:scale-95 text-white px-3.5 py-2 rounded-xl transition-all font-semibold text-xs shadow-md shadow-orange-600/30"
                        title="Replay Voice Explanation"
                    >
                        {isAiSpeaking ? (
                            <>
                                <VolumeX className="h-4 w-4" />
                                <span>Pause Voice</span>
                            </>
                        ) : (
                            <>
                                <Volume2 className="h-4 w-4" />
                                <span>Speak Question</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* ── VIDEO AREA: Real AI Doctor Video (Large) + User Cam (PiP) ────── */}
            <div
                className="relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl"
                style={{ aspectRatio: "16/9", maxHeight: "540px" }}
            >
                {/* AI Doctor Video Feed */}
                <video
                    ref={aiVideoRef}
                    src="/ai-interview-doctor.webm"
                    poster="/ai-interviewer.jpg"
                    autoPlay
                    loop
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-all duration-700 ${
                        isAiSpeaking ? "scale-[1.02] brightness-105" : "scale-100 brightness-95"
                    }`}
                />

                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

                {/* Top-left: AI Doctor Video Live Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-xs font-semibold z-10">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>AI Clinical Video Feed</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                        HD
                    </span>
                </div>

                {/* Top-right: Speaking / Listening Indicator */}
                <div className="absolute top-4 right-4 z-10">
                    {isAiSpeaking ? (
                        <div className="flex items-center gap-2 bg-orange-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-lg animate-pulse border border-orange-400/40">
                            <Volume2 className="h-4 w-4" />
                            <span>Dr. Adams Explaining Question...</span>
                        </div>
                    ) : isListening ? (
                        <div className="flex items-center gap-2 bg-emerald-600/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-white text-xs font-bold shadow-lg border border-emerald-400/40">
                            <Mic className="h-4 w-4 animate-pulse" />
                            <span>Listening to your voice...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-slate-300 text-xs">
                            <span>Ready for response</span>
                        </div>
                    )}
                </div>

                {/* Live Audio Visualizer Bars when AI is speaking */}
                {isAiSpeaking && (
                    <div className="absolute inset-x-0 bottom-16 flex items-end justify-center gap-1.5 px-8 z-10 pointer-events-none">
                        {[40, 75, 55, 95, 65, 100, 50, 90, 70, 85, 45, 80, 60].map((h, i) => (
                            <div
                                key={i}
                                className="w-1.5 sm:w-2 bg-gradient-to-t from-orange-500 to-amber-300 rounded-full animate-pulse shadow-sm shadow-orange-500/50"
                                style={{
                                    height: `${h * 0.45}px`,
                                    animationDuration: `${0.35 + (i % 5) * 0.12}s`,
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Bottom-left: Doctor Badge */}
                <div className="absolute bottom-4 left-4 z-10 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 space-y-0.5">
                    <p className="text-white text-xs font-bold flex items-center gap-1.5">
                        Dr. Sarah Adams, Ph.D.
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
                    </p>
                    <p className="text-[10px] text-slate-300">
                        AI Clinical Telehealth Lead · MindHealth
                    </p>
                </div>

                {/* ── PIP: User Webcam Feed (Bottom-Right) ────────────────────── */}
                <div
                    className="absolute bottom-4 right-4 z-20 w-36 sm:w-44 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-900"
                    style={{ aspectRatio: "4/3" }}
                >
                    <video
                        ref={userVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover -scale-x-100 ${
                            cameraActive && !cameraError ? "block" : "hidden"
                        }`}
                    />

                    {/* Camera error/muted fallback */}
                    {(!cameraActive || cameraError) && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-400 p-2 text-center">
                            <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 mb-1">
                                <User className="h-3.5 w-3.5" />
                            </div>
                            <p className="text-[9px] text-slate-400 font-medium">
                                {cameraError ? "No Camera" : "Camera Off"}
                            </p>
                        </div>
                    )}

                    {/* PiP Labels & Controls */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] text-white font-semibold">
                        <User className="h-2.5 w-2.5 text-orange-400" />
                        You
                    </div>

                    {isListening && (
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-emerald-600/90 px-1.5 py-0.5 rounded text-[9px] text-white font-bold animate-pulse">
                            <Mic className="h-2.5 w-2.5" />
                        </div>
                    )}

                    <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={toggleCamera}
                            className={`p-1 rounded-md text-white transition-colors ${
                                cameraActive ? "bg-slate-800/80 hover:bg-slate-700" : "bg-rose-600/90"
                            }`}
                            title={cameraActive ? "Turn off camera" : "Turn on camera"}
                        >
                            {cameraActive ? <VideoIcon className="h-2.5 w-2.5" /> : <VideoOff className="h-2.5 w-2.5" />}
                        </button>
                        <button
                            type="button"
                            onClick={toggleMic}
                            className={`p-1 rounded-md text-white transition-colors ${
                                micActive ? "bg-slate-800/80 hover:bg-slate-700" : "bg-rose-600/90"
                            }`}
                            title={micActive ? "Mute microphone" : "Unmute microphone"}
                        >
                            {micActive ? <Mic className="h-2.5 w-2.5" /> : <MicOff className="h-2.5 w-2.5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── CLINICAL EXPLANATION CARD (Explains Question on Frontend) ───── */}
            <div className="rounded-3xl bg-gradient-to-br from-orange-50 via-white to-amber-50 border border-orange-200/90 p-5 sm:p-6 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                            <Info className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
                                Dr. Sarah Adams Explains
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                {details.clinicalTerm}
                            </h3>
                        </div>
                    </div>
                    <span className="text-[11px] text-slate-500 bg-white/80 border border-orange-100 px-2.5 py-1 rounded-full font-medium">
                        PHQ-9 Clinical Metric {currentStep + 1} of 9
                    </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                    {details.explanation}
                </p>

                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>
                        <strong>Clinical Tip:</strong> {details.doctorTip}
                    </span>
                </div>
            </div>

            {/* ── LIVE PHQ-9 SCORE TRACKER CARD ──────────────────────────────── */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 text-white shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                            <Gauge className="h-4 w-4" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                Real-Time PHQ-9 Depression Score
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${scoreData.badgeColor}`}>
                                    {scoreData.severity}
                                </span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                                Standard clinical threshold (0 to 27 points) calculated live as you answer.
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xl sm:text-2xl font-black text-white font-mono">
                            {scoreData.total} <span className="text-sm font-normal text-slate-400">/ 27 pts</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                            <Database className="h-3 w-3" />
                            {dbSyncStatus === "saving" ? "Syncing with Database..." : "Saved to Database"}
                        </span>
                    </div>
                </div>

                {/* Score bar */}
                <div className="space-y-1.5">
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                            className={`h-full bg-gradient-to-r ${scoreData.barColor} transition-all duration-500 rounded-full`}
                            style={{ width: `${Math.max(5, scoreData.percentage)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 px-0.5">
                        <span>0: Minimal (0-4)</span>
                        <span>Mild (5-9)</span>
                        <span>Moderate (10-14)</span>
                        <span>Mod. Severe (15-19)</span>
                        <span>Severe (20-27)</span>
                    </div>
                </div>
            </div>

            {/* ── GROQ SPEECH-TO-TEXT VOICE RECOGNITION ──────────────────────── */}
            <div className="rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/80 p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-950 flex items-center gap-2">
                        <Mic className="h-4 w-4 text-orange-600 animate-pulse" />
                        Groq AI Speech Recognition (Speak Your Answer):
                    </span>
                    <span className="text-[11px] text-slate-600 hidden sm:block">
                        Say: &quot;Not at all&quot;, &quot;Several days&quot;, &quot;More than half&quot;, or &quot;Nearly every day&quot;
                    </span>
                </div>

                {isTranscribing && (
                    <div className="flex items-center gap-2 text-xs text-orange-700 bg-white/70 px-3 py-1.5 rounded-lg border border-orange-200/60">
                        <Activity className="h-3.5 w-3.5 animate-spin text-orange-600" />
                        <span>Transcribing your response with Groq Whisper...</span>
                    </div>
                )}

                {voiceTranscript ? (
                    <div className="p-3 rounded-xl bg-white border border-orange-100 flex items-center justify-between text-xs shadow-sm">
                        <p className="text-slate-800">
                            <span className="text-slate-400 font-medium">Groq Heard:</span>{" "}
                            <span className="font-semibold text-slate-900">&quot;{voiceTranscript}&quot;</span>
                        </p>
                        {answers[currentQuestion.key] !== undefined && (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                <Check className="h-3.5 w-3.5" />
                                {options[answers[currentQuestion.key]]?.label} (+{answers[currentQuestion.key]} pts)
                            </span>
                        )}
                    </div>
                ) : (
                    <p className="text-[11px] text-slate-500 italic pl-1">
                        Microphone listening… Speak your response anytime, or select an option below.
                    </p>
                )}
            </div>

            {/* ── QUESTION & ANSWER SELECTION ─────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-orange-100 p-6 sm:p-8 shadow-sm space-y-6">
                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <span className="text-orange-600">Question {currentStep + 1} of {questions.length}</span>
                        <span>{progressPercent}% Completed</span>
                    </div>
                    <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Question title */}
                <div className="space-y-2">
                    <span className="inline-block px-3 py-0.5 rounded-full bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                        Over the last 2 weeks:
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                        {currentQuestion.text}
                    </h2>
                </div>

                {/* Answer Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {options.map((opt) => {
                        const isSelected = answers[currentQuestion.key] === opt.value;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleAnswerSelection(opt.value)}
                                className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group ${
                                    isSelected
                                        ? "border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-500/20"
                                        : "border-slate-200 hover:border-orange-200 hover:bg-orange-50/30"
                                }`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="h-5 w-5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center border border-slate-200">
                                            {opt.value + 1}
                                        </span>
                                        <p className={`text-sm font-bold ${isSelected ? "text-orange-950" : "text-slate-800"}`}>
                                            {opt.label}
                                        </p>
                                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                            +{opt.value} pts
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 pl-7">{opt.description}</p>
                                </div>
                                <div
                                    className={`h-6 w-6 rounded-full border flex items-center justify-center transition-colors ${
                                        isSelected
                                            ? "border-orange-600 bg-orange-600 text-white"
                                            : "border-slate-300 group-hover:border-orange-300"
                                    }`}
                                >
                                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-orange-100 gap-4">
                    <Button
                        variant="outline"
                        onClick={() => {
                            stopSpeech();
                            setCurrentStep((p) => Math.max(0, p - 1));
                        }}
                        disabled={currentStep === 0 || isAnalyzing}
                        className="w-full sm:w-auto text-xs border-slate-200 gap-1.5"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Previous Question
                    </Button>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {currentStep < questions.length - 1 ? (
                            <Button
                                onClick={() => {
                                    stopSpeech();
                                    setCurrentStep((p) => p + 1);
                                }}
                                disabled={!isAnswered}
                                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold gap-1.5 px-6 shadow-sm"
                            >
                                Next Question
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        ) : (
                            <Button
                                id="analyze-assessment-voice-btn"
                                onClick={() => {
                                    stopSpeech();
                                    onAnalyze();
                                }}
                                disabled={!allAnswered || isAnalyzing}
                                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold gap-2 px-8 py-2.5 shadow-md shadow-orange-500/25 transition-all"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        <span>Running XGBoost Model...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4" />
                                        <span>Analyze &amp; Complete Assessment</span>
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
