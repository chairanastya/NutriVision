import { queryDatabase } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

interface NutrientDetail {
    nutrient_name: string;
    amount: number;
    unit: string;
}

interface ProductDetailResponse {
    id: number;
    name: string;
    brand: string | null;
    serving_size: number | null;
    serving_unit: string | null;
    nutrition_score: number;
    scanned_at: string;
    nutrients: NutrientDetail[];
}

export async function GET(request: NextRequest) {
    try {
        const productId = request.nextUrl.searchParams.get('productId');
        const scanId = request.nextUrl.searchParams.get('scanId');

        if (!productId || !scanId) {
            return NextResponse.json(
                { error: 'productId and scanId parameters are required' },
                { status: 400 }
            );
        }

        const productIdNum = parseInt(productId, 10);
        const scanIdNum = parseInt(scanId, 10);

        if (isNaN(productIdNum) || isNaN(scanIdNum)) {
            return NextResponse.json(
                { error: 'productId and scanId must be valid numbers' },
                { status: 400 }
            );
        }

        // Fetch product info
        const productResult = await queryDatabase(
            `SELECT id, name, brand, serving_size, serving_unit FROM products WHERE id = $1`,
            [productIdNum]
        );

        if (productResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        const product = productResult.rows[0];

        // Fetch scan info for nutrition_score and scanned_at
        const scanResult = await queryDatabase(
            `SELECT nutrition_score, scanned_at FROM scans WHERE id = $1 AND product_id = $2`,
            [scanIdNum, productIdNum]
        );

        if (scanResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'Scan not found' },
                { status: 404 }
            );
        }

        const scan = scanResult.rows[0];

        // Fetch all nutrients for this product
        const nutrientsResult = await queryDatabase(
            `SELECT 
                n.name as nutrient_name,
                pn.amount,
                n.unit
            FROM product_nutrients pn
            JOIN nutrients n ON pn.nutrient_id = n.id
            WHERE pn.product_id = $1
            ORDER BY n.id`,
            [productIdNum]
        );

        const nutrients: NutrientDetail[] = nutrientsResult.rows;

        // Combine all data
        const productDetail: ProductDetailResponse = {
            id: product.id,
            name: product.name,
            brand: product.brand,
            serving_size: product.serving_size,
            serving_unit: product.serving_unit,
            nutrition_score: scan.nutrition_score,
            scanned_at: scan.scanned_at,
            nutrients,
        };

        return NextResponse.json(productDetail);
    } catch (error) {
        return NextResponse.json(
            { 
                error: 'Internal server error', 
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}
