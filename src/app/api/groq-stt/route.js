import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const apiKey = process.env.GROQ_API_KEY?.trim();
        if (!apiKey) {
            return NextResponse.json({ error: "GROQ_API_KEY not found in environment." }, { status: 500 });
        }

        const formData = await req.formData();
        const audioFile = formData.get("file");

        if (!audioFile) {
            return NextResponse.json({ error: "No audio file provided in request." }, { status: 400 });
        }

        const groqFormData = new FormData();
        groqFormData.append("file", audioFile, "audio.webm");
        groqFormData.append("model", "whisper-large-v3-turbo");
        groqFormData.append("response_format", "json");
        groqFormData.append("language", "en");

        const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            },
            body: groqFormData,
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error("Groq STT API Error:", groqRes.status, errText);
            return NextResponse.json(
                { error: `Groq Whisper STT error (${groqRes.status}): ${errText}` },
                { status: groqRes.status }
            );
        }

        const data = await groqRes.json();
        return NextResponse.json({
            text: data.text || "",
            model: "whisper-large-v3-turbo",
        });
    } catch (err) {
        console.error("Server error in /api/groq-stt:", err);
        return NextResponse.json({ error: err.message || "Failed to transcribe audio." }, { status: 500 });
    }
}
