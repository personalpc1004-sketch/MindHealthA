import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const body = await req.json();
        const { text, voice = "hannah" } = body;

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Text string is required" }, { status: 400 });
        }

        const apiKey = process.env.GROQ_API_KEY?.trim();
        if (!apiKey) {
            return NextResponse.json({ error: "GROQ_API_KEY is not configured in .env" }, { status: 500 });
        }

        // Groq Orpheus TTS model max input is 200 characters.
        // Trim and ensure safe length
        const safeText = text.trim().slice(0, 195);

        const groqRes = await fetch("https://api.groq.com/openai/v1/audio/speech", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "canopylabs/orpheus-v1-english",
                input: safeText,
                voice: voice,
                response_format: "wav",
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error("Groq TTS API returned error:", groqRes.status, errText);
            return NextResponse.json(
                {
                    error: `Groq TTS error (${groqRes.status}): ${errText}`,
                    fallbackRequired: true,
                },
                { status: groqRes.status }
            );
        }

        const audioBuffer = await groqRes.arrayBuffer();

        return new Response(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": audioBuffer.byteLength.toString(),
                "Cache-Control": "public, max-age=86400",
            },
        });
    } catch (err) {
        console.error("Server error in /api/groq-tts:", err);
        return NextResponse.json(
            { error: err.message || "Failed to process TTS", fallbackRequired: true },
            { status: 500 }
        );
    }
}
