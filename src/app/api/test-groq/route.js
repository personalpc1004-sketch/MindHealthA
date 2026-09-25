import { NextResponse } from "next/server";

export async function GET() {
    try {
        const apiKey = process.env.GROQ_API_KEY?.trim();
        if (!apiKey) {
            return NextResponse.json({ ok: false, error: "No GROQ_API_KEY" });
        }

        // Test TTS
        let ttsStatus = "unknown";
        let ttsError = null;
        try {
            const ttsRes = await fetch("https://api.groq.com/openai/v1/audio/speech", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "canopylabs/orpheus-v1-english",
                    input: "Hello world.",
                    voice: "hannah",
                }),
            });
            ttsStatus = ttsRes.status;
            if (!ttsRes.ok) {
                ttsError = await ttsRes.text();
            }
        } catch (e) {
            ttsError = e.message;
        }

        return NextResponse.json({
            groqApiKeyConfigured: true,
            tts: { status: ttsStatus, error: ttsError },
            sttModel: "whisper-large-v3-turbo",
        });
    } catch (e) {
        return NextResponse.json({ ok: false, error: e.message });
    }
}
