import { SCAN_PROMPT } from "@/lib/prompts";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    console.log("API HIT");

    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No image uploaded" },
                { status: 400 },
            );
        }

        // convert image → base64
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: SCAN_PROMPT,
                                },
                                {
                                    inline_data: {
                                        mime_type: file.type || "image/jpeg",
                                        data: base64,
                                    },
                                },
                            ],
                        },
                    ],
                }),
            },
        );


        if (!response.ok) {
            const errText = await response.text();
            console.error("Gemini API Error:", errText);

            return NextResponse.json({
                error: "Gemini API failed",
                detail: errText,
            });
        }


        const text = await response.text();
        console.log("RAW RESPONSE TEXT:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            console.error("JSON PARSE ERROR:", err);

            return NextResponse.json({
                error: "Invalid JSON response from Gemini",
                raw: text,
            });
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            return NextResponse.json({
                result: "No result",
                debug: data,
            });
        }

        const cleaned = cleanJsonString(rawText);

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (err) {
            return NextResponse.json({
                error: "Failed to parse JSON",
                raw: cleaned,
            });
        }

        return NextResponse.json({ result: parsed });
    } catch (error) {
        console.error("SERVER ERROR:", error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 },
        );
    }
}

function cleanJsonString(text: string) {
    return text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
}
