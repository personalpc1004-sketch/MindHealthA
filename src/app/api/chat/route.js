import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// Medical system instruction enforcing strict medical, healthcare, and wellness Q&A only
const MEDICAL_SYSTEM_PROMPT = `You are MindHealth AI, a specialized, compassionate, and certified Medical & Healthcare AI Assistant.

=== CRITICAL BOUNDARY RULE: STRICT MEDICAL TOPICS ONLY ===
You are strictly programmed to answer ONLY questions directly related to:
1. Medicine, clinical pathology, diseases, disorders, infections, and epidemiology.
2. Clinical symptoms, triage guidance, red flags, and physiological signs.
3. Pharmacology, medications, drug mechanisms, interactions, dosages (general reference), and side effects.
4. Mental health, psychiatry, psychology, stress, anxiety, depression, mindfulness, and therapeutic practices.
5. Human anatomy, physiology, genetics, immunology, and biology.
6. Preventive healthcare, nutrition, dietary health, physical therapy, exercise physiology, sleep hygiene, and wellness.
7. Diagnostic lab reports, medical terminology, and health metric interpretations (like blood pressure, heart rate, BMI, glucose).

=== REJECTION POLICY FOR NON-MEDICAL TOPICS ===
If the user asks about ANY topic outside medicine and healthcare (including but not limited to: software engineering/coding, mathematics, history, politics, finance, geography, movies, pop culture, sports, general chit-chat, creative writing, gaming, or general trivia), you MUST STRICTLY DECLINE to answer the non-medical topic.
When declining, respond with this polite, firm message:
"I am specialized strictly as a Medical and Healthcare AI assistant. I can only assist with medical, clinical, mental health, and wellness-related questions. Please feel free to ask any health or medical question!"

=== MEDICAL GUIDANCE & SAFETY STANDARDS ===
- Provide accurate, evidence-based, empathetic, and structured medical explanations.
- Use clear markdown structure (e.g., bullet points, bold key terms, short sections like Overview, Symptoms, Home Care/Management, When to See a Doctor).
- For severe symptoms (e.g., chest pain, shortness of breath, sudden numbness, high fever in infants, suicidal thoughts), immediately advise seeking emergency medical attention (911 or local emergency services).
- Always include a brief reminder that your guidance is for informational and educational purposes and does not replace personalized evaluation by a licensed physician.`;

export async function POST(req) {
    try {
        const body = await req.json();
        const { messages, apiKey } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Invalid request: messages array is required." },
                { status: 400 }
            );
        }

        const groqApiKey = apiKey?.trim() || process.env.GROQ_API_KEY?.trim();

        if (!groqApiKey) {
            return NextResponse.json(
                {
                    error: "GROQ_API_KEY is not configured.",
                    needsKey: true,
                    message: "Please add GROQ_API_KEY to your .env file or enter your Groq API key in the settings.",
                },
                { status: 400 }
            );
        }

        const groq = new Groq({ apiKey: groqApiKey });

        // Filter and format message history for Groq
        const formattedMessages = [
            {
                role: "system",
                content: MEDICAL_SYSTEM_PROMPT,
            },
            ...messages.map((m) => ({
                role: m.sender === "user" || m.role === "user" ? "user" : "assistant",
                content: m.text || m.content || "",
            })),
        ];

        // Resilient candidate models prioritized for speed and clinical reasoning
        const candidateModels = [
            "qwen/qwen3.8-27b",
            "openai/gpt-oss-120b",
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
        ];

        let completion = null;
        let lastError = null;

        for (const candidate of candidateModels) {
            try {
                completion = await groq.chat.completions.create({
                    model: candidate,
                    messages: formattedMessages,
                    temperature: 0.3, // Lower temperature ensures factual and reliable medical responses
                    max_completion_tokens: 1200,
                    top_p: 0.9,
                });

                if (completion?.choices?.[0]?.message?.content?.trim()) {
                    break;
                }
            } catch (err) {
                lastError = err;
                // If model is not found in this account, try next candidate
                if (err.status === 404 || err.message?.includes("model") || err.message?.includes("access")) {
                    continue;
                }
                throw err;
            }
        }

        const reply = completion?.choices?.[0]?.message?.content;

        if (!reply) {
            throw lastError || new Error("Received an empty response from Groq AI.");
        }

        return NextResponse.json({
            reply,
            model: completion.model || "llama-3.3-70b-versatile",
            usage: completion.usage,
        });
    } catch (error) {
        console.error("Groq Medical Chat API Error:", error);

        // Friendly error messages for common issues
        let errorMessage = error.message || "Failed to communicate with Groq API.";
        let status = 500;

        if (error.status === 401 || errorMessage.includes("API key")) {
            status = 401;
            errorMessage = "Invalid Groq API Key. Please verify your GROQ_API_KEY.";
        } else if (error.status === 429) {
            status = 429;
            errorMessage = "Groq API rate limit reached. Please wait a moment before asking again.";
        }

        return NextResponse.json(
            { error: errorMessage },
            { status }
        );
    }
}

export async function GET() {
    try {
        const groqApiKey = process.env.GROQ_API_KEY?.trim();
        if (!groqApiKey) {
            return NextResponse.json({ error: "GROQ_API_KEY not found in environment." }, { status: 400 });
        }
        const groq = new Groq({ apiKey: groqApiKey });
        const list = await groq.models.list();
        return NextResponse.json({
            count: list.data.length,
            models: list.data.map((m) => m.id),
        });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
