import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
}

// Calculate PHQ-9 standard clinical score
export function calculatePhq9Score(answers = {}) {
    let totalScore = 0;
    let answeredCount = 0;

    for (let i = 1; i <= 9; i++) {
        const val = answers[`question${i}`];
        if (typeof val === "number") {
            totalScore += val;
            answeredCount++;
        }
    }

    let severity = "Minimal / None";
    let severityClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
    let recommendation = "Your responses indicate minimal or no depressive symptoms. Continue healthy lifestyle habits.";

    if (totalScore >= 20) {
        severity = "Severe";
        severityClass = "text-rose-700 bg-rose-50 border-rose-200";
        recommendation = "Active clinical attention and treatment (psychotherapy/pharmacotherapy) is strongly recommended.";
    } else if (totalScore >= 15) {
        severity = "Moderately Severe";
        severityClass = "text-red-700 bg-red-50 border-red-200";
        recommendation = "Active treatment including professional counseling and potential medical evaluation recommended.";
    } else if (totalScore >= 10) {
        severity = "Moderate";
        severityClass = "text-amber-700 bg-amber-50 border-amber-200";
        recommendation = "A treatment plan including therapy or monitoring with a mental health professional is suggested.";
    } else if (totalScore >= 5) {
        severity = "Mild";
        severityClass = "text-yellow-700 bg-yellow-50 border-yellow-200";
        recommendation = "Mild symptoms detected. Supportive counseling, stress reduction, and watchful waiting are helpful.";
    }

    return {
        totalScore,
        maxScore: 27,
        answeredCount,
        severity,
        severityClass,
        recommendation,
    };
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { userId, sessionId, question, answer, answers } = body;

        const scoreSummary = calculatePhq9Score(answers || {});
        const supabase = getSupabase();

        let dbSaved = false;
        let dbError = null;

        if (supabase && userId) {
            try {
                // Try saving or updating in mental_health_assessments table
                const { error: upsertErr } = await supabase
                    .from("mental_health_assessments")
                    .upsert(
                        {
                            user_id: userId,
                            input_data: {
                                ...(answers || {}),
                                last_question: question?.text,
                                last_answer: answer,
                                score_summary: scoreSummary,
                                updated_at: new Date().toISOString(),
                            },
                            status: scoreSummary.answeredCount === 9 ? "ready_for_analysis" : "in_progress",
                        },
                        { onConflict: "id" }
                    );

                if (!upsertErr) {
                    dbSaved = true;
                } else {
                    dbError = upsertErr.message;
                }
            } catch (e) {
                dbError = e.message;
            }
        }

        return NextResponse.json({
            success: true,
            dbSaved,
            dbError,
            scoreSummary,
            question,
            answer,
        });
    } catch (err) {
        console.error("Error in /api/assessment-questions:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        status: "active",
        service: "MindHealth AI Assessment Questions & Scoring API",
        scoringModel: "PHQ-9 Clinical Depression Screening",
        thresholds: {
            "0-4": "Minimal or None",
            "5-9": "Mild Depression",
            "10-14": "Moderate Depression",
            "15-19": "Moderately Severe Depression",
            "20-27": "Severe Depression"
        }
    });
}

