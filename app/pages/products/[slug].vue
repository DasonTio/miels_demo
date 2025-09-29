<script setup lang="ts">
import type { ProductBundle } from '~/types/product';
import { useCartStore } from '#imports';
import { toast } from 'vue-sonner';

const {t} = useI18n()

const route = useRoute();
const cartStore = useCartStore();
const slug = route.params.slug as string;

const { data: product, pending } = await useFetch<ProductBundle>(`/api/products/${slug}`);

const selectedVariants = ref<Record<number, string>>({});
const quantity = ref(1);

const activeTab = ref('description');

function handleAddToCart() {
  if (product.value) {
    cartStore.addProduct(product.value, selectedVariants.value, quantity.value);
    toast.success(`${product.value.name} added to cart!`);
  }
}

function selectVariant(bundleItemId: number, variantName: string) {
  selectedVariants.value[bundleItemId] = variantName;
}

// MARK: Carousel
const currentSlide = ref(0);

function slideTo(val: number) {
  currentSlide.value = val;
}
</script>

<template>
  <div v-if="pending">
    Loading...
  </div>
  <div v-else-if="product" class="container mx-auto px-4 py-12">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <Carousel 
          id="gallery" 
          v-model="currentSlide" 
          :autoplay="4000" 
          :wrap-around="true" 
          :items-to-show="1"
        >
          <Slide v-for="(image, index) in product.images" :key="index">
            <div class="carousel__item w-full h-fit">
              <img :src="image.image_url" :alt="product.name" class="w-full h-full object-cover rounded-lg shadow-lg" >
            </div>
          </Slide>
          <template #addons>
            <Navigation />
          </template>
        </Carousel>

        <div class="w-full overflow-x-auto py-2">
          <div class="flex space-x-2">
            <div 
              v-for="(image, index) in product.images" 
              :key="index" 
              class="w-24 h-24 p-1 cursor-pointer flex-shrink-0" 
              @click="slideTo(index)"
            >
              <img 
                :src="image.image_url" 
                :alt="product.name + ' thumbnail ' + index"
                :class="[
                  'w-full h-full object-cover rounded-md border-2 transition-all',
                  currentSlide === index ? 'border-green-800' : 'border-transparent'
                ]"
              >
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col">
        <h1 class="text-4xl font-serif text-gray-800">{{ product.name }}</h1>
        <UiPrice :amount="product.price" class="mt-4 text-3xl" />
        
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
              t-key="detail.addToCart" 
              class="flex-grow" 
              @click="handleAddToCart" />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-16 border-t border-gray-200 pt-8">
      <div class="flex border-b border-gray-200 mb-6">
        <button 
          :class="['py-3 px-6 text-lg font-semibold transition-colors', activeTab === 'description' ? 'text-green-800 border-b-2 border-green-800' : 'text-gray-500 hover:text-gray-700']"
          @click="activeTab = 'description'" 
        >
          {{ t("detail.productDescription") }}
        </button>
        <button 
          :class="['py-3 px-6 text-lg font-semibold transition-colors', activeTab === 'reviews' ? 'text-green-800 border-b-2 border-green-800' : 'text-gray-500 hover:text-gray-700']"
          @click="activeTab = 'reviews'" 
        >
          {{ t("detail.reviews") }}
        </button>
      </div>

      <div>
        <div v-show="activeTab === 'description'" class="prose max-w-none text-gray-700 leading-relaxed" v-html="product.description"/>
        <div v-show="activeTab === 'reviews'">
          <p class="text-gray-600">No reviews yet for this product.</p>
        </div>
      </div>
    </div>
  </div>
</template>