import { NextResponse } from "next/server";
import { queryDatabase } from "@/lib/db";

export const runtime = "nodejs";

type MedicalConditionRow = {
    id: number;
    name: string;
    description: string | null;
    restricted_nutrient_id: number | null;
    nutrient_name: string | null;
    nutrient_unit: string | null;
};

export async function GET() {
    try {
        const result = await queryDatabase(
            `SELECT 
                mc.id,
                mc.name,
                mc.description,
                mc.restricted_nutrient_id,
                n.name as nutrient_name,
                n.unit as nutrient_unit
             FROM medical_conditions mc
             LEFT JOIN nutrients n ON mc.restricted_nutrient_id = n.id
             ORDER BY mc.name ASC`,
        );

        const conditions = result.rows.map((row) => {
            const r = row as Partial<MedicalConditionRow>;
            return {
                id: Number(r.id),
                name: String(r.name),
                description:
                    r.description === null || r.description === undefined
                        ? null
                        : String(r.description),
                restrictedNutrient:
                    r.restricted_nutrient_id === null ||
                    r.restricted_nutrient_id === undefined
                        ? null
                        : {
                              id: Number(r.restricted_nutrient_id),
                              name:
                                  r.nutrient_name === null ||
                                  r.nutrient_name === undefined
                                      ? null
                                      : String(r.nutrient_name),
                              unit:
                                  r.nutrient_unit === null ||
                                  r.nutrient_unit === undefined
                                      ? null
                                      : String(r.nutrient_unit),
                          },
            };
        });

        return NextResponse.json({ conditions }, { status: 200 });
    } catch (error) {
        console.error("GET /api/medical-conditions error:", error);
        return NextResponse.json(
            { message: "Terjadi kesalahan pada server" },
            { status: 500 },
        );
    }
}
