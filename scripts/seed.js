// scripts/seed.js
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import path from 'path';

// --- CONFIGURATION ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL and Key must be provided via --env-file=.env flag.");
}

const supabase = createClient(supabaseUrl, supabaseKey);
const dataPath = path.join(process.cwd(), 'public', 'data.json');

// --- HELPER FUNCTIONS ---
const log = (message) => console.log(`\n✅ ${message}`);
const logError = (message) => console.error(`\n❌ ${message}`);

// --- MAIN SEEDING FUNCTION ---
async function seedDatabase() {
    try {
        log("Reading data.json file...");
        const jsonData = JSON.parse(readFileSync(dataPath, 'utf-8'));
        const allItems = jsonData.data.data;

        log("Clearing existing data from tables...");
        await supabase.from('bundle_product_items').delete().neq('id', 0);
        await supabase.from('bundles').delete().neq('id', 0);
        await supabase.from('products').delete().neq('id', 0);
        await supabase.from('categories').delete().neq('id', 0);

        log("Seeding categories...");
        const categoriesMap = new Map();
        allItems.forEach(item => {
            if (item.category && !categoriesMap.has(item.category.category_id)) {
                categoriesMap.set(item.category.category_id, {
                    name: item.category.name,
                    slug: item.category.slug,
                    original_id: item.category.category_id,
                });
            }
        });

        const { data: insertedCategories, error: categoryError } = await supabase
            .from('categories')
            .insert(Array.from(categoriesMap.values()))
            .select();
        if (categoryError) throw new Error(`Category seeding failed: ${categoryError.message}`);
        log(`${insertedCategories.length} categories seeded successfully.`);
        const categoryIdMapping = new Map(insertedCategories.map(c => [c.original_id, c.id]));

        log("Gathering and de-duplicating all products...");
        const uniqueProductsMap = new Map();

        allItems.forEach(item => {
            // First, process products nested inside bundles
            if (item.type === 'bundle' && item.bundle_items) {
                item.bundle_items.forEach(bundleItem => {
                    bundleItem.items?.forEach(productItem => {
                        const p = productItem.product;
                        uniqueProductsMap.set(p.product_id, { // Use .set() to add or overwrite
                            name: p.name,
                            slug: p.slug,
                            price: p.price,
                            stock: p.stock,
                            images: JSON.stringify(p.product_images?.map(img => img.image_url) || []),
                            is_active: p.is_active,
                            is_best_seller: p.is_best_seller || false, // Default to false if null
                            original_id: p.product_id,
                            description: p.description || '', // Add description if available
                        });
                    });
                });
            }
        });

        // Second, process standalone products, overwriting to get the most complete data
        allItems.forEach(item => {
            if (item.type === 'product') {
                uniqueProductsMap.set(item.product_id, {
                    name: item.name,
                    slug: item.slug,
                    description: item.description,
                    price: item.price,
                    stock: item.stock,
                    images: JSON.stringify(item.images?.map(img => img.image_url) || []),
                    is_active: item.is_active,
                    is_best_seller: item.is_best_seller,
                    category_id: item.category ? categoryIdMapping.get(item.category.category_id) : null,
                    original_id: item.product_id,
                });
            }
        });

        log("Seeding unique products...");
        const productsToInsert = Array.from(uniqueProductsMap.values());
        const { data: insertedProducts, error: productError } = await supabase
            .from('products')
            .insert(productsToInsert)
            .select();
        if (productError) throw new Error(`Product seeding failed: ${productError.message}`);
        log(`${insertedProducts.length} unique products seeded successfully.`);
        const productIdMapping = new Map(insertedProducts.map(p => [p.original_id, p.id]));

        log("Seeding bundles...");
        const bundlesToInsert = allItems
            .filter(item => item.type === 'bundle')
            .map(item => ({
                name: item.name,
                slug: item.slug,
                description: item.description,
                price: item.price,
                images: JSON.stringify(item.images?.map(img => img.image_url) || []),
                is_active: item.is_active,
                is_best_seller: item.is_best_seller,
                category_id: item.category ? categoryIdMapping.get(item.category.category_id) : null,
                original_id: item.bundle_id,
            }));

        const { data: insertedBundles, error: bundleError } = await supabase
            .from('bundles')
            .insert(bundlesToInsert)
            .select();
        if (bundleError) throw new Error(`Bundle seeding failed: ${bundleError.message}`);
        log(`${insertedBundles.length} bundles seeded successfully.`);
        const bundleIdMapping = new Map(insertedBundles.map(b => [b.original_id, b.id]));

        log("Linking products to bundles...");
        const bundleItemsToInsert = [];
        allItems
            .filter(item => item.type === 'bundle' && item.bundle_items)
            .forEach(bundle => {
                const newBundleId = bundleIdMapping.get(bundle.bundle_id);
                bundle.bundle_items.forEach(bundleItem => {
                    bundleItem.items?.forEach(productItem => {
                        const newProductId = productIdMapping.get(productItem.product.product_id);
                        if (newBundleId && newProductId) {
                            bundleItemsToInsert.push({
                                bundle_id: newBundleId,
                                product_id: newProductId,
                                variant_name: productItem.variant_name
                            });
                        }
                    });
                });
            });

        const { error: bundleItemsError } = await supabase.from('bundle_product_items').insert(bundleItemsToInsert);
        if (bundleItemsError) throw new Error(`Bundle item linking failed: ${bundleItemsError.message}`);
        log(`${bundleItemsToInsert.length} bundle-product links created.`);

        console.log("\n\n🎉 Database seeding completed successfully! 🎉");

    } catch (error) {
        logError(`Seeding failed: ${error.message}`);
    }
}

seedDatabase();