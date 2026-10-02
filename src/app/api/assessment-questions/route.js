import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Generates all 9 clinical PHQ-9 diagnostic questions using Groq AI.
 * Returns formatted array of 9 questions with clinical terms, doctor explanations, tips, and listen_text.
 */
async function generateQuestionsWithGroq(providedApiKey) {
    const apiKey = providedApiKey?.trim() || process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
        console.warn("Groq API key not configured for question generation. Using clinical fallback.");
        return null;
    }

    const groq = new Groq({ apiKey });

    const prompt = `You are an expert clinical psychologist, psychometrician, and certified psychiatric diagnostic specialist.
Generate the complete set of 9 standardized Patient Health Questionnaire (PHQ-9) diagnostic questions used for clinical depression screening.

The 9 questions must assess these 9 core clinical criteria in this exact sequence:
1: Anhedonia (Little interest or pleasure in doing things)
2: Depressed Mood (Feeling down, depressed, or hopeless)
3: Sleep Architecture (Trouble falling or staying asleep, or sleeping too much)
4: Fatigue / Anergia (Feeling tired or having little energy)
5: Appetite Regulation (Poor appetite or overeating)
6: Self-Concept & Guilt (Feeling bad about yourself or that you are a failure)
7: Cognitive Concentration (Trouble concentrating on things such as reading or work)
8: Psychomotor Agitation/Retardation (Moving or speaking noticeably slowly, or being fidgety/restless)
9: Safety & Self-Harm Ideation (Thoughts that you would be better off dead or hurting yourself)

Return a strict JSON object with a single key "questions" containing an array of 9 questions:
{
  "questions": [
    {
      "id": 1,
      "key": "question1",
      "timeKey": "time1",
      "text": "Little interest or pleasure in doing things?",
      "clinical_term": "Anhedonia (Loss of Interest or Pleasure)",
      "doctor_explanation": "Loss of interest or pleasure in daily activities is a primary diagnostic indicator. Think about hobbies, daily routines, social interactions, or work that you typically enjoy—have they felt flat, unappealing, or unrewarding?",
      "doctor_tip": "Notice whether you have to force yourself to do things you used to love.",
      "listen_text": "Question 1 of 9: Little interest or pleasure in doing things. Dr. Adams explains: This measures anhedonia, or losing interest in activities you usually enjoy. Over the last two weeks, have your daily activities felt unrewarding?",
      "options": [
        { "value": 0, "label": "Not at all", "description": "0 days" },
        { "value": 1, "label": "Several days", "description": "1-7 days" },
        { "value": 2, "label": "More than half the days", "description": "7-11 days" },
        { "value": 3, "label": "Nearly every day", "description": "12-14 days" }
      ]
    }
  ]
}
You MUST return all 9 questions, id 1 through 9, keys question1 through question9, and timeKey time1 through time9.`;

    const candidateModels = [
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
    ];

    for (const model of candidateModels) {
        try {
            const completion = await groq.chat.completions.create({
                model,
                messages: [
                    {
                        role: "system",
                        content: "You are a psychiatric assessment generator. You must return strictly valid JSON containing all 9 PHQ-9 questions.",
                    },
                    { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.25,
                max_completion_tokens: 3500,
            });

            const content = completion?.choices?.[0]?.message?.content;
            if (!content) continue;

            const parsed = JSON.parse(content);
            const list = parsed.questions || parsed.data || parsed.phq9_questions;

            if (Array.isArray(list) && list.length >= 9) {
                return list.slice(0, 9).map((q, idx) => {
                    const num = idx + 1;
                    const defaultQ = DEFAULT_CLINICAL_QUESTIONS[idx];
                    return {
                        id: num,
                        key: `question${num}`,
                        timeKey: `time${num}`,
                        text: q.text || defaultQ.text,
                        clinical_term: q.clinical_term || q.clinicalTerm || defaultQ.clinical_term,
                        doctor_explanation: q.doctor_explanation || q.explanation || defaultQ.doctor_explanation,
                        doctor_tip: q.doctor_tip || q.doctorTip || defaultQ.doctor_tip,
                        listen_text: q.listen_text || q.listenText || `Question ${num} of 9: ${q.text || defaultQ.text}`,
                        options: [
                            { value: 0, label: "Not at all", description: "0 days" },
                            { value: 1, label: "Several days", description: "1-7 days" },
                            { value: 2, label: "More than half the days", description: "7-11 days" },
                            { value: 3, label: "Nearly every day", description: "12-14 days" },
                        ],
                    };
                });
            }
        } catch (err) {
            console.warn(`Groq question generation failed with model ${model}:`, err.message);
        }
    }

    return null;
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
        const supabase = getSupabase();

        // Check if this is a request to generate fresh questions via Groq AI
        if (body.action === "generate") {
            const groqQuestions = await generateQuestionsWithGroq(body.apiKey);
            const questionsToUse = groqQuestions || DEFAULT_CLINICAL_QUESTIONS;
            let syncResult = { success: false };
            if (supabase && Array.isArray(questionsToUse)) {
                syncResult = await syncQuestionsToSupabase(supabase, questionsToUse);
            }
            return NextResponse.json({
                success: true,
                source: groqQuestions ? "groq_ai" : "clinical_default_seed",
                questions: questionsToUse,
                stored_in_supabase: syncResult.success,
                supabase_sync: syncResult,
                meta: {
                    model: "qwen/qwen3.8-27b",
                    generated_at: new Date().toISOString()
                }
            });
        }

        // Direct request to sync questions into Supabase
        if (body.action === "sync") {
            if (supabase) {
                const syncResult = await syncQuestionsToSupabase(supabase, body.questions || DEFAULT_CLINICAL_QUESTIONS);
                return NextResponse.json({ success: syncResult.success, syncResult });
            }
            return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
        }

        const { userId, sessionId, question, answer, answers } = body;
        const scoreSummary = calculatePhq9Score(answers || {});

        let dbSaved = false;
        let dbError = null;

        if (supabase) {
            try {
                const recordData = {
                    input_data: {
                        ...(answers || {}),
                        last_question: question?.text,
                        last_answer: answer,
                        score_summary: scoreSummary,
                        updated_at: new Date().toISOString(),
                    },
                    status: scoreSummary.answeredCount === 9 ? "ready_for_analysis" : "in_progress",
                };

                if (userId && typeof userId === "string" && userId.length > 10) {
                    recordData.user_id = userId;
                }

                if (sessionId) {
                    recordData.id = sessionId;
                    const { error: upsertErr } = await supabase
                        .from("mental_health_assessments")
                        .upsert(recordData, { onConflict: "id" });

                    if (!upsertErr) {
                        dbSaved = true;
                    } else {
                        dbError = upsertErr.message;
                    }
                } else if (userId && typeof userId === "string" && userId.length > 10) {
                    // Check for existing active assessment
                    const { data: existing, error: selErr } = await supabase
                        .from("mental_health_assessments")
                        .select("id")
                        .eq("user_id", userId)
                        .eq("status", "in_progress")
                        .order("created_at", { ascending: false })
                        .limit(1);

                    if (!selErr && existing && existing.length > 0) {
                        const { error: updateErr } = await supabase
                            .from("mental_health_assessments")
                            .update(recordData)
                            .eq("id", existing[0].id);

                        if (!updateErr) dbSaved = true;
                        else dbError = updateErr.message;
                    } else {
                        const { error: insErr } = await supabase
                            .from("mental_health_assessments")
                            .insert(recordData);

                        if (!insErr) dbSaved = true;
                        else dbError = insErr.message;
                    }
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
        console.error("Error in /api/assessment-questions POST:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

const DEFAULT_CLINICAL_QUESTIONS = [
    {
        id: 1,
        key: "question1",
        timeKey: "time1",
        text: "Little interest or pleasure in doing things?",
        clinical_term: "Anhedonia (Loss of Interest or Pleasure)",
        doctor_explanation: "Loss of interest or pleasure in daily activities is a primary diagnostic indicator. Think about hobbies, daily routines, social interactions, or work that you typically enjoy—have they felt flat, unappealing, or unrewarding?",
        doctor_tip: "Notice whether you have to force yourself to do things you used to love.",
        listen_text: "Question 1 of 9: Little interest or pleasure in doing things. Dr. Adams explains: This measures anhedonia, or losing interest in activities you usually enjoy. Over the last two weeks, have your daily activities felt unrewarding?",
        options: [
            { value: 0, label: "Not at all", description: "0 days" },
            { value: 1, label: "Several days", description: "1-7 days" },
            { value: 2, label: "More than half the days", description: "7-11 days" },
            { value: 3, label: "Nearly every day", description: "12-14 days" },
        ]
    },
    {
        id: 2,
        key: "question2",
        timeKey: "time2",
        text: "Feeling down, depressed, or hopeless?",
        clinical_term: "Depressed Mood & Hopelessness",
        doctor_explanation: "Persistent feelings of sadness, emotional heaviness, or pessimism about tomorrow. It goes beyond normal transient sadness and reflects whether you feel stuck in a downcast state.",
        doctor_tip: "Focus on how many days you experienced a lingering sense of discouragement.",
        listen_text: "Question 2 of 9: Feeling down, depressed, or hopeless. Dr. Adams explains: This reflects core mood stability. Have you felt persistent heaviness, sadness, or discouragement about your future?",
        options: [
            { value: 0, label: "Not at all", description: "0 days" },
            { value: 1, label: "Several days", description: "1-7 days" },
            { value: 2, label: "More than half the days", description: "7-11 days" },
            { value: 3, label: "Nearly every day", description: "12-14 days" },
        ]
    },
    {
        id: 3,
        key: "question3",
        timeKey: "time3",
        text: "Trouble falling or staying asleep, or sleeping too much?",
        clinical_term: "Sleep Architecture Disturbance",
        doctor_explanation: "Disruptions in circadian rhythm and restorative sleep. This includes insomnia (difficulty falling asleep or waking up early) as well as hypersomnia (sleeping excessively and still feeling exhausted).",
        doctor_tip: "Consider both nighttime insomnia and excessive daytime sleeping.",
        listen_text: "Question 3 of 9: Trouble falling or staying asleep, or sleeping too much. Dr. Adams explains: Sleep quality directly impacts neurological health. Are you having difficulty resting or oversleeping?",
        options: [
            { value: 0, label: "Not at all", description: "0 days" },
            { value: 1, label: "Several days", description: "1-7 days" },
            { value: 2, label: "More than half the days", description: "7-11 days" },
            { value: 3, label: "Nearly every day", description: "12-14 days" },
        ]
    },
    {
        id: 4,
        key: "question4",
        timeKey: "time4",
        text: "Feeling tired or having little energy?",
        clinical_term: "Fatigue & Energy Depletion (Anergia)",
        doctor_explanation: "A chronic reduction in physical and mental stamina, even without heavy physical labor. Small everyday tasks like showering, cooking, or replying to messages may feel like climbing a mountain.",
        doctor_tip: "Reflect on your physical stamina from morning until evening.",
        listen_text: "Question 4 of 9: Feeling tired or having little energy. Dr. Adams explains: This assesses clinical fatigue. Does your body or mind feel consistently drained, even after resting?",
        options: [
            { value: 0, label: "Not at all", description: "0 days" },
            { value: 1, label: "Several days", description: "1-7 days" },
            { value: 2, label: "More than half the days", description: "7-11 days" },
            { value: 3, label: "Nearly every day", description: "12-14 days" },
        ]
    },
    {
        id: 5,
        key: "question5",
        timeKey: "time5",
        text: "Poor appetite or overeating?",
        clinical_term: "Appetite & Metabolic Dysregulation",
        doctor_explanation: "Changes in nutritional regulation triggered by stress or neurochemical changes. You might experience a loss of desire to eat or increased emotional cravings.",
        doctor_tip: "Notice any noticeable shifts in your relationship with food.",
        listen_text: "Question 5 of 9: Poor appetite or overeating. Dr. Adams explains: Significant changes in your eating habits—either loss of appetite or emotional overeating—reflect metabolic and mood shifts.",
        options: [
            { value: 0, label: "Not at all", description: "0 days" },
            { value: 1, label: "Several days", description: "1-7 days" },
            { value: 2, label: "More than half the days", description: "7-11 days" },
            { value: 3, label: "Nearly every day", description: "12-14 days" },
        ]
    },
    {
        id: 6,
        key: "question6",
        timeKey: "time6",
        text: "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
        clinical_term: "Negative Self-Cognition & Guilt",
        doctor_explanation: "Severe internal self-criticism, feelings of inadequacy, or excessive guilt toward yourself or loved ones.",
        doctor_tip: "Are you being unusually harsh on yourself for everyday struggles?",
        listen_text: "Question 6 of 9: Feeling bad about yourself, or that you are a failure. Dr. Adams explains: This measures cognitive negative bias and unwarranted guilt toward yourself or loved ones.",
        options: [
            { value: 0, label: "Not at all", description: "0 days" },
            { value: 1, label: "Several days", description: "1-7 days" },
            { value: 2, label: "More than half the days", description: "7-11 days" },
            { value: 3, label: "Nearly every day", description: "12-14 days" },
        ]
    },
    {
        id: 7,
        key: "question7",
        timeKey: "time7",
        text: "Trouble concentrating on things, such as reading the newspaper or watching television?",
        clinical_term: "Cognitive Focus & Executive Function",
        doctor_explanation: "Mental fog and difficulty concentrating on cognitive tasks—such as reading a document, focusing during a meeting, or finishing a conversation.",
        doctor_tip: "Think about your productivity and attention span at school, work, or home.",
        listen_text: "Question 7 of 9: Trouble concentrating on things. Dr. Adams explains: This screens for mental fog and executive focus. Has it been hard to concentrate on reading, work, or conversations?",
        options: [
            { value: 0, label: "Not at all", description: "0 days" },
            { value: 1, label: "Several days", description: "1-7 days" },
            { value: 2, label: "More than half the days", description: "7-11 days" },
            { value: 3, label: "Nearly every day", description: "12-14 days" },
        ]
    },
    {
        id: 8,
        key: "question8",
        timeKey: "time8",
        text: "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
        clinical_term: "Psychomotor Agitation or Retardation",
        doctor_explanation: "Physical manifestations of emotional state. Slowed speech and movement, or restlessness and inability to sit still.",
        doctor_tip: "Would family or colleagues have noticed you moving noticeably slower or restlessly?",
        listen_text: "Question 8 of 9: Moving or speaking noticeably slower, or feeling unusually restless. Dr. Adams explains: This checks for physical speed changes noticeable to others.",
        options: [
            { value: 0, label: "Not at all", description: "0 days" },
            { value: 1, label: "Several days", description: "1-7 days" },
            { value: 2, label: "More than half the days", description: "7-11 days" },
            { value: 3, label: "Nearly every day", description: "12-14 days" },
        ]
    },
    {
        id: 9,
        key: "question9",
        timeKey: "time9",
        text: "Thoughts that you would be better off dead or of hurting yourself in some way?",
        clinical_term: "Safety & Self-Harm Ideation",
        doctor_explanation: "A critical clinical safety question evaluating passive wishes or active thoughts of self-harm. MindHealth AI treats safety as the utmost priority.",
        doctor_tip: "Answer honestly—confidential help and emergency support resources are always provided.",
        listen_text: "Question 9 of 9: Thoughts that you would be better off dead or of hurting yourself. Dr. Adams explains: This is an important safety screening. Support is always available.",
        options: [
            { value: 0, label: "Not at all", description: "0 days" },
            { value: 1, label: "Several days", description: "1-7 days" },
            { value: 2, label: "More than half the days", description: "7-11 days" },
            { value: 3, label: "Nearly every day", description: "12-14 days" },
        ]
    }
];

async function syncQuestionsToSupabase(supabase, questions) {
    if (!supabase || !Array.isArray(questions) || questions.length === 0) {
        return { success: false, reason: "No client or questions" };
    }

    try {
        const rows = questions.map((q) => ({
            question_id: q.id,
            question_key: q.key,
            time_key: q.timeKey,
            question_text: q.text,
            clinical_term: q.clinical_term || q.clinicalTerm || "",
            doctor_explanation: q.doctor_explanation || q.explanation || "",
            doctor_tip: q.doctor_tip || q.doctorTip || "",
            listen_text: q.listen_text || q.listenText || "",
            options: q.options || [],
            updated_at: new Date().toISOString(),
        }));

        const { data, error } = await supabase
            .from("assessment_questions")
            .upsert(rows, { onConflict: "question_id" });

        if (error) {
            console.error("Supabase assessment_questions upsert error:", error);
            return { success: false, error: error.message, details: error.details, code: error.code };
        }

        return { success: true, count: rows.length };
    } catch (e) {
        console.error("Supabase sync exception:", e);
        return { success: false, error: e.message };
    }
}

export async function GET(req) {
    const supabase = getSupabase();
    let questionsToReturn = null;
    let source = "fallback";

    let forceRefresh = false;
    try {
        const { searchParams } = new URL(req.url);
        forceRefresh = searchParams.get("generate") === "true" || searchParams.get("refresh") === "true";
    } catch {}

    // 1. First, check if questions exist in Supabase database (unless refresh requested)
    if (supabase && !forceRefresh) {
        try {
            const { data: dbQuestions, error: dbErr } = await supabase
                .from("assessment_questions")
                .select("*")
                .order("question_id", { ascending: true });

            if (!dbErr && dbQuestions && dbQuestions.length >= 9) {
                const formatted = dbQuestions.map((r) => ({
                    id: r.question_id,
                    key: r.question_key,
                    timeKey: r.time_key,
                    text: r.question_text,
                    clinical_term: r.clinical_term,
                    doctor_explanation: r.doctor_explanation,
                    doctor_tip: r.doctor_tip,
                    listen_text: r.listen_text,
                    options: r.options || []
                }));

                return NextResponse.json({
                    success: true,
                    source: "supabase_database",
                    stored_in_supabase: true,
                    count: formatted.length,
                    questions: formatted
                });
            }
        } catch (dbEx) {
            console.warn("Supabase initial fetch notice:", dbEx.message);
        }
    }

    // 2. Generate questions dynamically using Groq AI
    try {
        const groqQuestions = await generateQuestionsWithGroq();
        if (groqQuestions && groqQuestions.length >= 9) {
            questionsToReturn = groqQuestions;
            source = "groq_ai";
        }
    } catch (err) {
        console.warn("Groq questions generation notice:", err.message);
    }

    // 3. Fallback to complete default clinical questions if Groq is unreachable
    if (!questionsToReturn) {
        questionsToReturn = DEFAULT_CLINICAL_QUESTIONS;
        source = "clinical_default_seed";
    }

    // 4. Guaranteed sync into Supabase assessment_questions table
    let supabaseSyncResult = { success: false, reason: "Supabase client not initialized" };
    if (supabase) {
        supabaseSyncResult = await syncQuestionsToSupabase(supabase, questionsToReturn);
    }

    return NextResponse.json({
        success: true,
        source: source,
        stored_in_supabase: supabaseSyncResult.success,
        supabase_sync: supabaseSyncResult,
        count: questionsToReturn.length,
        questions: questionsToReturn
    });
}

