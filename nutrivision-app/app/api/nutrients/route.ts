import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";

export const runtime = "nodejs";

type NutrientRow = {
    id: number;
    name: string;
    unit: string | null;
};

export async function GET() {
    try {
        const result = await queryDatabase(
            "SELECT id, name, unit FROM nutrients ORDER BY name ASC",
        );

        const nutrients = result.rows.map((row) => {
            const r = row as Partial<NutrientRow>;
            return {
                id: Number(r.id),
                name: String(r.name),
                unit:
                    r.unit === null || r.unit === undefined
                        ? null
                        : String(r.unit),
            };
        });

        return NextResponse.json({ nutrients }, { status: 200 });
    } catch (error) {
        console.error("GET /api/nutrients error:", error);
        return NextResponse.json(
            { message: "Terjadi kesalahan pada server" },
            { status: 500 },
        );
    }
}
