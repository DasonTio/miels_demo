<script setup lang="ts">
import type { DisplayProduct } from '~~/app/types/product';
import type { CategoryResponse } from '~~/server/api/categories';

const { t } = useI18n();

const [
  { data: categories, pending: categoriesPending }, 
  { data: productsData, pending: productsPending, error: productsError }, 
  { data: bundlesData, pending: bundlesPending, error: bundlesError }
] = await Promise.all([
  useFetch<CategoryResponse[]>('/api/categories', { default: () => [] }),
  useFetch<DisplayProduct[]>('/api/products', { default: () => [] }),
  useFetch<DisplayProduct[]>('/api/bundles', { default: () => [] })
]);

const pending = computed(() => productsPending.value || bundlesPending.value);
const error = computed(() => productsError.value || bundlesError.value);

const selectedCategory = ref<string | undefined>(undefined);
const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 9;


const combinedProducts = computed(() => {
  const allItems = [...(productsData.value || []), ...(bundlesData.value || [])];
  return allItems.sort((a, b) => a.name.localeCompare(b.name));
});

const filteredProducts = computed(() => {
  let products = combinedProducts.value;
  if (selectedCategory.value) {
    products = products.filter(p => p.category?.slug === selectedCategory.value);
  }
  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(lowerCaseQuery));
  }
  return products;
});

watch([selectedCategory, searchQuery], () => {
  currentPage.value = 1;
});

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage));
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredProducts.value.slice(start, end);
});

function selectCategory(slug?: string) {
  selectedCategory.value = slug;
}
function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  window.scrollTo({ top: document.getElementById('product-grid')?.offsetTop, behavior: 'smooth' });
}
</script>

<template>
  <section class="container mx-auto px-4 pb-12">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
      
      <aside class="col-span-1 border-r border-gray-200 pr-8 py-8">
        <h2 class="text-3xl font-serif text-green-700 font-semibold mb-4 hidden lg:block">{{t("product.title").toUpperCase()}}</h2>
        
        <div v-if="categoriesPending" class="space-y-4">
          <div v-for="n in 8" :key="n" class="h-6 bg-gray-200 rounded-md animate-pulse" />
        </div>
        <nav v-else class="space-y-4">
          <button 
            :class="['w-full text-left font-semibold py-1', !selectedCategory ? 'opacity-100 text-green-700' : 'opacity-50 hover:opacity-100 text-gray-700']"
            @click="selectCategory(undefined)" >
            {{ t("product.allProduct").toUpperCase() }}
          </button>
          <button 
            v-for="cat in categories" 
            :key="cat.id" 
            :class="['w-full text-left font-semibold py-1', selectedCategory === cat.slug ? 'opacity-100 text-green-700' : 'opacity-50 hover:opacity-100 text-gray-700']"
            @click="selectCategory(cat.slug ?? '')" 
          >
            {{ cat.name }}
          </button>
        </nav>
      </aside>

      <main id="product-grid" class="col-span-1 lg:col-span-3 py-8">
        <div class="bg-[#f0ebe4] rounded-lg mb-8 flex justify-between shadow-sm overflow-hidden">
          <div class="p-8">
            <h1 class="text-3xl font-serif text-brown-800">{{ t("product.headline") }}</h1>
            <p class="mt-4 text-gray-600 max-w-md leading-relaxed">
              {{ t("product.description") }}
            </p>
          </div>
          <div class="hidden md:block self-end h-64 ml-8">
            <img src="/images/natural-ingredients.png" alt="Natural Ingredients" class="w-full h-full object-contain">
          </div>
        </div>

        <div class="mb-8 relative">
          <input 
            v-model="searchQuery" 
            type="text" 
            :placeholder="t('product.searchBar')" 
            class="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-700"
          >
          <Icon name="fa6-solid:magnifying-glass" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div v-for="n in 9" :key="n" class="bg-gray-200 rounded-lg h-80"/>
        </div>
        <div v-else-if="error" class="p-4 text-center text-red-500 border border-red-200 bg-red-50 rounded-lg">
          <p>Sorry, we couldn't load the products at this time.</p>
        </div>
        
        <div v-else-if="paginatedProducts.length > 0">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard 
              v-for="product in paginatedProducts" 
              :key="product.id" 
              :product="product" 
            />
          </div>

          <div v-if="totalPages > 1" class="flex justify-center items-center mt-12 space-x-2">
            <button 
              :disabled="currentPage === 1" 
              class="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-100" 
              @click="changePage(currentPage - 1)" 
            >
              &laquo;
            </button>
            <button 
              v-for="page in totalPages" 
              :key="page" 
              :class="['px-4 py-2 border rounded-md', currentPage === page ? 'bg-green-700 text-white border-green-700' : 'hover:bg-gray-100']"
              @click="changePage(page)" 
            >
              {{ page }}
            </button>
            <button 
              :disabled="currentPage === totalPages" 
              class="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-100" 
              @click="changePage(currentPage + 1)"
            >
              &raquo;
            </button>
          </div>
        </div>
        
        <div v-else class="p-8 text-center text-gray-500 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg">
          <p>No products found for this filter.</p>
        </div>
      </main>
    </div>
  </section>
</template>