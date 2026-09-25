import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
    try {
        const publicDir = path.join(process.cwd(), "public");
        const targetPath = path.join(publicDir, "ai-interview-doctor.mp4");

        if (fs.existsSync(targetPath)) {
            const stats = fs.statSync(targetPath);
            return NextResponse.json({ exists: true, size: stats.size, path: "/ai-interview-doctor.mp4" });
        }

        // Test fetching a video from reliable source
        // Let's try downloading a sample talking interview video
        const videoUrls = [
            "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            "https://upload.wikimedia.org/wikipedia/commons/1/1a/UNESCO_Director-General_Irina_Bokova_interview_on_Palmyra.webm"
        ];

        for (const url of videoUrls) {
            try {
                const res = await fetch(url, {
                    headers: {
                        "User-Agent": "MindHealthAI/1.0 (Educational Mental Health App; contact@mindhealth.ai)"
                    }
                });
                if (res.ok) {
                    const buffer = Buffer.from(await res.arrayBuffer());
                    const ext = url.endsWith(".webm") ? ".webm" : ".mp4";
                    const fileName = `ai-interview-doctor${ext}`;
                    const filePath = path.join(publicDir, fileName);
                    fs.writeFileSync(filePath, buffer);
                    return NextResponse.json({
                        success: true,
                        downloadedFrom: url,
                        fileName: `/${fileName}`,
                        sizeBytes: buffer.length
                    });
                }
            } catch (err) {
                console.error("Failed fetching from", url, err.message);
            }
        }

        return NextResponse.json({ error: "Could not download video sources" }, { status: 500 });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
