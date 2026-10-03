import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ success: false, error: "userId query parameter is required" }, { status: 400 });
        }

        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
        }

        let profile = null;
        let latestAssessment = null;

        // Fetch user profile
        try {
            const { data, error } = await supabase
                .from("user_profiles")
                .select("*")
                .eq("user_id", userId)
                .maybeSingle();

            if (!error && data) {
                profile = data;
            }
        } catch (e) {
            console.warn("Notice fetching user_profiles:", e.message);
        }

        // Fetch latest assessment if available
        try {
            const { data: assessments, error: asmtError } = await supabase
                .from("mental_health_assessments")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(1);

            if (!asmtError && assessments && assessments.length > 0) {
                latestAssessment = assessments[0];
            }
        } catch (e) {
            console.warn("Notice fetching latest assessment:", e.message);
        }

        return NextResponse.json({
            success: true,
            profile,
            latestAssessment,
        });
    } catch (err) {
        console.error("Error in /api/profile GET:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const {
            userId,
            firstName,
            lastName,
            age,
            photoUrl,
            consultationType,
            problemDescription,
            phone,
            emergencyContact,
        } = body;

        if (!userId) {
            return NextResponse.json({ success: false, error: "userId is required to save profile" }, { status: 400 });
        }

        const supabase = getSupabase();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 500 });
        }

        const row = {
            user_id: userId,
            first_name: firstName?.trim() || null,
            last_name: lastName?.trim() || null,
            age: age !== undefined && age !== "" ? Number(age) : null,
            photo_url: photoUrl || null,
            consultation_type: consultationType || null,
            problem_description: problemDescription || null,
            phone: phone || null,
            emergency_contact: emergencyContact || null,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("user_profiles")
            .upsert(row, { onConflict: "user_id" })
            .select()
            .single();

        if (error) {
            console.error("Supabase user_profiles upsert error:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            profile: data,
        });
    } catch (err) {
        console.error("Error in /api/profile POST:", err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
