<script setup lang="ts">
import type { DisplayProduct } from '~/types/product';
defineProps<{
  product: DisplayProduct
}>();

const localePath = useLocalePath()
</script>
<template>
  <NuxtLink 
    :to="localePath(`/${product.type}s/${product.slug}`)"     
    class="group block bg-white rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl relative"
  >
    <div class="relative w-full h-64 overflow-hidden">
      <img 
        v-if="product.images && product.images.length > 0"
        :src="product.images[0]" 
        :alt="product.name" 
        class="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
      >
      
      <div 
        v-if="product.is_best_seller" 
        class="absolute top-3 left-3 bg-green-800 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md"
      >
        BEST SELLER
      </div>
    </div>
    
    <div class="p-4">
      <p class="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 line-clamp-1">{{ product.category?.name }}</p> 
      
      <h3 class="font-bold text-lg text-gray-800 mb-1 truncate group-hover:text-green-700 transition-colors duration-200">
        {{ product.name }}
      </h3>
      
      <UiPrice :amount="product.price??0" class="mt-2 text-xl" />
    </div>
  </NuxtLink>
</template>