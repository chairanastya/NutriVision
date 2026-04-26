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
    created_at: string;
    nutrition_score: number;
    scanned_at: string;
    nutrients: NutrientDetail[];
}

export async function GET(request: NextRequest) {
    try {
        const productId = request.nextUrl.searchParams.get('productId');
        const scanId = request.nextUrl.searchParams.get('scanId');

        console.log('🔍 Product Detail API - Request Params:', { productId, scanId });

        if (!productId || !scanId) {
            console.warn('❌ Missing params: productId or scanId');
            return NextResponse.json(
                { error: 'productId and scanId parameters are required' },
                { status: 400 }
            );
        }

        const productIdNum = parseInt(productId, 10);
        const scanIdNum = parseInt(scanId, 10);

        if (isNaN(productIdNum) || isNaN(scanIdNum)) {
            console.warn('❌ Invalid params: productId or scanId not a valid number');
            return NextResponse.json(
                { error: 'productId and scanId must be valid numbers' },
                { status: 400 }
            );
        }

        // Fetch product info
        console.log('📦 Fetching product with ID:', productIdNum);
        const productResult = await queryDatabase(
            `SELECT id, name, brand, serving_size, serving_unit, created_at FROM products WHERE id = $1`,
            [productIdNum]
        );

        console.log('📦 Product Query Result:', productResult.rows.length, 'rows found');

        if (productResult.rows.length === 0) {
            console.warn('❌ Product not found with ID:', productIdNum);
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        const product = productResult.rows[0];
        console.log('✅ Product found:', product.name);

        // Fetch scan info for nutrition_score and scanned_at
        console.log('🔍 Fetching scan with ID:', scanIdNum, 'for product:', productIdNum);
        const scanResult = await queryDatabase(
            `SELECT nutrition_score, scanned_at FROM scans WHERE id = $1 AND product_id = $2`,
            [scanIdNum, productIdNum]
        );

        console.log('📋 Scan Query Result:', scanResult.rows.length, 'rows found');

        if (scanResult.rows.length === 0) {
            console.warn('❌ Scan not found with ID:', scanIdNum, 'for product:', productIdNum);
            return NextResponse.json(
                { error: 'Scan not found' },
                { status: 404 }
            );
        }

        const scan = scanResult.rows[0];
        console.log('✅ Scan found with score:', scan.nutrition_score);

        // Fetch all nutrients for this product
        console.log('🥗 Fetching nutrients for product:', productIdNum);
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

        console.log('🥗 Nutrients Query Result:', nutrientsResult.rows.length, 'nutrients found');

        const nutrients: NutrientDetail[] = nutrientsResult.rows;

        // Combine all data
        const productDetail: ProductDetailResponse = {
            id: product.id,
            name: product.name,
            brand: product.brand,
            serving_size: product.serving_size,
            serving_unit: product.serving_unit,
            created_at: product.created_at,
            nutrition_score: scan.nutrition_score,
            scanned_at: scan.scanned_at,
            nutrients,
        };

        console.log('✅ Returning product detail with', nutrients.length, 'nutrients');
        return NextResponse.json(productDetail);
    } catch (error) {
        console.error('❌ Product detail API error:', error);
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        if (error instanceof Error && error.stack) {
            console.error('Stack:', error.stack);
        }
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
