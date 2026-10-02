import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
}

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            userId,
            assessmentId,
            payload,
            input_data,
            prediction,
            status = "processing",
            error_message = null,
        } = body;

        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json(
                { success: false, error: "Supabase credentials not configured in environment" },
                { status: 500 }
            );
        }

        const dataToSave = input_data || payload || {};

        // If updating an existing assessment record
        if (assessmentId) {
            const updatePayload = {
                status,
                error_message,
                ...(prediction ? { prediction } : {}),
                ...(Object.keys(dataToSave).length > 0 ? { input_data: dataToSave } : {}),
            };

            const { data, error } = await supabase
                .from("mental_health_assessments")
                .update(updatePayload)
                .eq("id", assessmentId)
                .select()
                .single();

            if (error) {
                console.error("Supabase assessment update error:", error);
                return NextResponse.json({ success: false, error: error.message }, { status: 400 });
            }

            return NextResponse.json({ success: true, id: assessmentId, record: data });
        }

        // Otherwise insert a new record
        const insertPayload = {
            input_data: dataToSave,
            status,
            error_message,
            ...(prediction ? { prediction } : {}),
        };

        // Note: user_id has a foreign key to auth.users. Only set if a valid uuid is provided
        if (userId && typeof userId === "string" && userId.length > 10) {
            insertPayload.user_id = userId;
        }

        const { data, error } = await supabase
            .from("mental_health_assessments")
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            console.error("Supabase assessment insert error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, id: data?.id, record: data });
    } catch (err) {
        console.error("Error in /api/assessment-submit:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
