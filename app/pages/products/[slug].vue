<script setup lang="ts">
import type { ProductBundle } from '~/types/product';
import { useCartStore } from '#imports';
import { toast } from 'vue-sonner';

const route = useRoute();
const cartStore = useCartStore();
const slug = route.params.slug as string;

const { data: product, pending } = await useFetch<ProductBundle>(`/api/products/${slug}`);

const selectedVariants = ref<Record<number, string>>({});
const quantity = ref(1);

function handleAddToCart() {
  if (product.value) {
    cartStore.addProduct(product.value, selectedVariants.value, quantity.value);
    toast.success(`${product.value.name} added to cart!`)
  }
}

function selectVariant(bundleItemId: number, variantName: string) {
  selectedVariants.value[bundleItemId] = variantName;
}
</script>

<template>
  <div v-if="pending">
    Loading...
  </div>
  <div v-else-if="product" class="container mx-auto px-4 py-12">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <img 
          v-if="product.images.length > 0" 
          :src="product.images[0]?.image_url" 
          :alt="product.name"
          class="w-full rounded-lg shadow-lg"
        >
      </div>

      <div class="flex flex-col">
        <h1 class="text-4xl font-serif text-gray-800">{{ product.name }}</h1>
        <UiPrice :amount="product.price" class="mt-4 text-3xl" />
        <div class="prose mt-6 text-gray-600" v-html="product.description"></div>

        <div class="mt-8 space-y-6">
          <div v-for="bundleItem in product.bundle_items" :key="bundleItem.bundle_item_id">
            <h3 class="font-semibold text-gray-700">{{ bundleItem.name }}</h3>
            <div class="flex flex-wrap gap-2 mt-2">
              <button 
                v-for="variant in bundleItem.items" 
                :key="variant.product_id"
                :class="[
                  'px-4 py-2 border rounded-full text-sm transition-colors',
                  selectedVariants[bundleItem.bundle_item_id] === variant.variant_name
                    ? 'bg-green-800 text-white border-green-800'
                    : 'hover:border-green-800 hover:bg-green-50'
                ]"
                @click="selectVariant(bundleItem.bundle_item_id, variant.variant_name)"
              >
                {{ variant.variant_name }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="mt-auto pt-8">
          <div class="flex items-center gap-4">
            <div class="flex border rounded-md">
              <button 
                class="px-4 py-2 font-bold"
                @click="quantity > 1 ? quantity-- : null" 
              >-</button>
              <span class="px-4 py-2 w-12 text-center">{{ quantity }}</span>
              <button 
                class="px-4 py-2 font-bold"
                @click="quantity++" 
              >+</button>
            </div>
            <UiButton 
              t-key="product.addToCart" 
              class="flex-grow" 
              @click="handleAddToCart" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>