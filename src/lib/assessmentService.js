import { supabase } from "@/lib/client";

export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://mentalhealthaimodel.onrender.com";

export const PREDICTION_URL =
    process.env.NEXT_PUBLIC_PREDICTION_URL || `${API_BASE_URL}/predict`;

export const MODEL_TEST_URL =
    process.env.NEXT_PUBLIC_MODEL_TEST_URL || "https://mentalhealthaimodel.onrender.com/test";

/**
 * Validates that all 9 questions and 9 response times required
 * by the XGBoost model are present.
 */
export function validateAssessmentPayload(data) {
    const requiredQuestions = Array.from({ length: 9 }, (_, i) => `question${i + 1}`);
    const requiredTimes = Array.from({ length: 9 }, (_, i) => `time${i + 1}`);
    const allRequired = [...requiredQuestions, ...requiredTimes];

    const missing = allRequired.filter((key) => data[key] === undefined || data[key] === null);
    if (missing.length > 0) {
        throw new Error(`Missing required fields for XGBoost model: ${missing.join(", ")}`);
    }

    return true;
}

/**
 * Executes the complete end-to-end Assessment flow:
 * 1. Insert record into Supabase with status = 'processing'
 * 2. Send request to deployed XGBoost API (POST https://mentalhealthaimodel.onrender.com/predict)
 * 3. Receive actual prediction
 * 4. Update Supabase record with prediction and status = 'completed' (or 'failed')
 * 5. Return prediction to frontend
 */
export async function runAssessmentFlow({ userId, payload }) {
    // Validate inputs match XGBoost model requirements
    validateAssessmentPayload(payload);

    let supabaseRecordId = null;

    // STEP 1: Insert record into Supabase with status = 'processing'
    try {
        const insertPayload = {
            input_data: payload,
            status: "processing",
            error_message: null,
        };
        if (userId) {
            insertPayload.user_id = userId;
        }

        const { data: record, error: insertError } = await supabase
            .from("mental_health_assessments")
            .insert(insertPayload)
            .select()
            .single();

        if (insertError) {
            console.warn("Supabase browser insert notice:", insertError.message);
            // Fallback to server API bridge /api/assessment-submit
            try {
                const apiRes = await fetch("/api/assessment-submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: userId || null,
                        payload,
                        status: "processing",
                    }),
                });
                if (apiRes.ok) {
                    const apiData = await apiRes.json();
                    supabaseRecordId = apiData.id;
                }
            } catch (bridgeErr) {
                console.warn("API bridge insert notice:", bridgeErr);
            }
        } else {
            supabaseRecordId = record?.id;
        }
    } catch (err) {
        console.warn("Initial Supabase stage notice:", err);
    }

    // STEP 2 & 3: Call Render deployed XGBoost model API (/predict)
    let predictionResult = null;
    let rawApiResponse = null;

    try {
        const response = await fetch(PREDICTION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const resData = await response.json();

        if (!response.ok || resData.status === "error" || resData.success === false) {
            const errorMsg =
                resData.message || resData.error || `Prediction API error (status ${response.status})`;
            throw new Error(errorMsg);
        }

        rawApiResponse = resData;
        predictionResult =
            resData.prediction ||
            resData.data?.predicted_severity ||
            "Completed";

    } catch (apiError) {
        console.error("XGBoost Prediction API call failed:", apiError);

        // Update Supabase status = 'failed'
        if (supabaseRecordId) {
            try {
                await supabase
                    .from("mental_health_assessments")
                    .update({
                        status: "failed",
                        error_message: apiError.message || "Failed to contact AI model",
                    })
                    .eq("id", supabaseRecordId);
            } catch (updateErr) {
                console.warn("Failed to update status to failed in Supabase:", updateErr);
            }
        }

        throw new Error(
            `AI Model Error: ${apiError.message}. Ensure prediction endpoint is reachable at ${PREDICTION_URL}`
        );
    }

    // STEP 5: Update Supabase record with prediction and status = 'completed'
    if (supabaseRecordId) {
        try {
            const { error: updateError } = await supabase
                .from("mental_health_assessments")
                .update({
                    prediction: predictionResult,
                    status: "completed",
                    error_message: null,
                })
                .eq("id", supabaseRecordId);

            if (updateError) {
                // Try via server bridge
                await fetch("/api/assessment-submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        assessmentId: supabaseRecordId,
                        prediction: predictionResult,
                        status: "completed",
                    }),
                });
            }
        } catch (updateErr) {
            console.warn("Supabase completion update exception:", updateErr);
        }
    } else {
        // If initial insert was delayed, store complete record now via bridge
        try {
            const finalRes = await fetch("/api/assessment-submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: userId || null,
                    payload,
                    prediction: predictionResult,
                    status: "completed",
                }),
            });
            if (finalRes.ok) {
                const finalData = await finalRes.json();
                supabaseRecordId = finalData.id;
            }
        } catch {}
    }

    // STEP 6: Return prediction and details to frontend
    return {
        id: supabaseRecordId,
        prediction: predictionResult,
        status: "completed",
        confidence: rawApiResponse?.data?.confidence,
        probabilities: rawApiResponse?.data?.probabilities,
        model_version: rawApiResponse?.data?.model_version || "v1",
        created_at: new Date().toISOString(),
    };
}

/**
 * Fetches previous assessments for the logged-in user from Supabase.
 */
export async function getUserAssessmentHistory(userId) {
    if (!userId) return { data: [], error: null };

    try {
        const { data, error } = await supabase
            .from("mental_health_assessments")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        return { data: data || [], error };
    } catch (err) {
        console.error("Fetch assessment history error:", err);
        return { data: [], error: err };
    }
}
