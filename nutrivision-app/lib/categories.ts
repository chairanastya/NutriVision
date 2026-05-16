// Fetch product categories with emoji and gradient mappings from database
interface ProductCategory {
    id: number;
    name: string;
    emoji: string;
    gradient: string;
}

let categoriesCache: ProductCategory[] | null = null;

export async function fetchProductCategories(): Promise<
    Map<string, ProductCategory>
> {
    try {
        // Use cache if available
        if (categoriesCache) {
            return new Map(categoriesCache.map((c) => [c.name, c]));
        }

        const response = await fetch("/api/product-categories", {
            credentials: "include",
        });

        if (!response.ok) {
            console.error("Failed to fetch categories:", response.status);
            return new Map();
        }

        const data: ProductCategory[] = await response.json();
        categoriesCache = data;

        return new Map(data.map((c) => [c.name, c]));
    } catch (error) {
        console.error("Error fetching product categories:", error);
        return new Map();
    }
}

// Get emoji and gradient for a category
export async function getCategoryDisplay(
    category: string | null | undefined,
): Promise<{ emoji: string; gradient: string }> {
    if (!category) {
        return { emoji: "📦", gradient: "from-gray-100 to-gray-50" };
    }

    const categories = await fetchProductCategories();
    const categoryInfo = categories.get(category);

    if (categoryInfo) {
        return {
            emoji: categoryInfo.emoji,
            gradient: categoryInfo.gradient,
        };
    }

    // Fallback defaults
    return { emoji: "📦", gradient: "from-gray-100 to-gray-50" };
}
