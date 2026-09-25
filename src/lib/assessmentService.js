import { supabase } from "@/lib/client";

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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
 * 2. Send request to Python Flask XGBoost API (POST /predict)
 * 3. Receive actual prediction
 * 4. Update Supabase record with prediction and status = 'completed' (or 'failed')
 * 5. Return prediction to frontend
 */
export async function runAssessmentFlow({ userId, payload }) {
    if (!userId) {
        throw new Error("User must be authenticated to perform assessment");
    }

    // Validate inputs match XGBoost model requirements
    validateAssessmentPayload(payload);

    let supabaseRecordId = null;

    // STEP 1: Insert record into Supabase with status = 'processing'
    try {
        const { data: record, error: insertError } = await supabase
            .from("mental_health_assessments")
            .insert({
                user_id: userId,
                input_data: payload,
                status: "processing",
                error_message: null,
            })
            .select()
            .single();

        if (insertError) {
            console.error("Supabase insert error:", insertError);
            if (insertError.code === "PGRST205" || insertError.message?.includes("schema cache")) {
                throw new Error(
                    "The Supabase table 'mental_health_assessments' does not exist yet. Please execute 'supabase_schema.sql' in your Supabase SQL Editor."
                );
            }
            throw new Error(`Supabase insert failed: ${insertError.message}`);
        }

        supabaseRecordId = record?.id;
    } catch (err) {
        console.error("Initial Supabase stage error:", err);
        throw err;
    }

    // STEP 2 & 3: Call Python Flask API with exact XGBoost inputs
    let predictionResult = null;
    let rawApiResponse = null;

    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const resData = await response.json();

        if (!response.ok || resData.status === "error" || resData.success === false) {
            const errorMsg =
                resData.message || resData.error || `Python API error (status ${response.status})`;
            throw new Error(errorMsg);
        }

        rawApiResponse = resData;
        predictionResult =
            resData.prediction ||
            resData.data?.predicted_severity ||
            "Completed";

    } catch (apiError) {
        console.error("Python Flask API call failed:", apiError);

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
                console.error("Failed to update status to failed in Supabase:", updateErr);
            }
        }

        throw new Error(
            `AI Model Error: ${apiError.message}. Ensure Python Flask server is running at ${API_BASE_URL}`
        );
    }

    // STEP 5: Update Supabase record with prediction and status = 'completed'
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
            console.error("Supabase update error:", updateError);
        }
    } catch (updateErr) {
        console.error("Supabase completion update exception:", updateErr);
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
