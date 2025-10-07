<script setup lang="ts">
import type { DisplayProduct } from '@/types/product';
import type { CategoryResponse } from '~~/server/api/categories';

const { t } = useI18n();

const { data: categories } = await useFetch<CategoryResponse[]>('/api/categories',{
  default: (): CategoryResponse[] => []
});
const { data: allProducts, pending, error } = await useFetch<DisplayProduct[]>('/api/products', {
  default: (): DisplayProduct[] => []
});

const selectedCategory = ref<string | undefined>(undefined);
const searchQuery = ref('');

const filteredProducts = computed(() => {
  let products = allProducts.value;

  if (selectedCategory.value) {
    products = products.filter(p => p.category?.slug === selectedCategory.value);
  }

  if (searchQuery.value) {
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(lowerCaseQuery));
  }

  return products;
});

function selectCategory(slug?: string) {
  selectedCategory.value = slug;
}
</script>

<template>
  <div  class="container mx-auto px-4 pb-12">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
      
      <aside class="col-span-1 border-r border-gray-200 pr-8 py-8">
        <h2 class="text-3xl font-serif text-green-700 font-semibold mb-4 hidden lg:block">{{t("product.title").toUpperCase()}}</h2>
        <nav v-if="categories" class="space-y-4">
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
        <div v-else>
          <div v-for="n in 8" :key="n" class="h-6 bg-gray-200 rounded-md animate-pulse mb-4" />
        </div>
      </aside>

      <main class="col-span-1 lg:col-span-3 py-8">
        <div class="bg-[#f0ebe4] rounded-lg mb-8 flex justify-between shadow-sm">
          <div class="p-8">
            <h1 class="text-3xl font-serif text-brown-800">{{ t("product.headline") }}</h1>
            <p class="mt-4 text-gray-600 max-w-md leading-relaxed">
              {{ t("product.description") }}
            </p>
          </div>
          <div class="hidden md:block align-top h-64 ml-8">
            <img src="/images/natural-ingredients.png" alt="Natural Ingredients" class="w-full h-full object-cover">
          </div>
        </div>

        <div class="mb-8 relative">
          <input 
            v-model="searchQuery" 
            type="text" 
            :placeholder="t('product.searchBar')" 
            class="w-full p-3 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-700"
          >
          <Icon name="fa7-solid:magnifying-glass" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        
        <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          <div v-for="n in 9" :key="n" class="bg-gray-200 rounded-lg h-80"/>
        </div>
        <div v-else-if="error">
          <p class="text-red-500 p-4 border border-red-300 bg-red-50 rounded">Failed to load products: {{ error.message }}</p>
        </div>
        
        <div v-else-if="filteredProducts.length > 0">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProductCard 
              v-for="product in filteredProducts" 
              :key="product.id" 
              :product="product" 
            />
          </div>
        </div>
        
        <div v-else>
          <p class="p-4 text-center text-gray-500 border border-gray-300 bg-gray-50 rounded">No products found for this filter.</p>
        </div>
      </main>
    </div>
  </div>
</template>