<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { CategoryResponse } from '~~/server/api/categories';
import type { DisplayProduct } from '~~/app/types/product';
import { useSupabaseClient } from '#imports';
import type { Database } from '~~/app/types/database';

interface ImageState {
  url: string;
  isNew: boolean;
  file?: File;
}

definePageMeta({
  layout: "authenticated"
});

const router = useRouter();
const route = useRoute();
const supabase = useSupabaseClient<Database>();
const localePath = useLocalePath();
const isEditing = computed(() => !!route.params.id);
const productId = computed(() => route.params.id as string);

const form = ref<Partial<DisplayProduct>>({
  name: '', description: '', images: [], unit: 'gram', size: '', price: null,
  stock: null, min_purchase: 1, is_active: true, is_best_seller: false,
});

const imageState = ref<ImageState[]>([]);
const selectedCategoryId = ref<number | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const hasAttemptedSubmit = ref(false);
const activeSectionId = ref('product-information');
let observer: IntersectionObserver;

const { data: categories } = await useFetch<CategoryResponse[]>('/api/categories', { default: () => [] });

onMounted(async () => {
  const sections = ['product-information', 'product-specification', 'shipping-information'];
  const observerOptions = { root: null, rootMargin: '-25% 0px -65% 0px', threshold: 0 };
  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) activeSectionId.value = entry.target.id; });
  }, observerOptions);
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  if (isEditing.value) {
    loading.value = true;
    try {
      const productData = await $fetch<DisplayProduct>(`/api/admin/products/${productId.value}`);
      form.value = { ...productData };
      selectedCategoryId.value = productData.category?.id ?? null;
      imageState.value = (productData.images || []).map(url => ({ url, isNew: false }));
    } catch (e: any) {
      error.value = e.message || "Failed to load product data.";
    } finally {
      loading.value = false;
    }
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  for (const file of Array.from(input.files)) {
    imageState.value.push({ url: URL.createObjectURL(file), isNew: true, file: file });
  }
  input.value = '';
}

function removeImage(index: number) {
  const image = imageState.value[index];
  if (image && image.isNew) URL.revokeObjectURL(image.url);
  imageState.value.splice(index, 1);
}

async function handleSubmit(event: Event) {
  hasAttemptedSubmit.value = true;
  const formEl = event.target as HTMLFormElement;
  if (!formEl.checkValidity()) return;

  loading.value = true;
  error.value = null;

  try {
    const newFilesToUpload = imageState.value.filter(img => img.isNew && img.file);
    const uploadPromises = newFilesToUpload.map(async (image) => {
      const filePath = `${Date.now()}-${image.file!.name}`;
      const { data, error: uploadError } = await supabase.storage.from('images').upload(filePath, image.file!);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(data.path);
      return publicUrl;
    });

    const newImageUrls = await Promise.all(uploadPromises);
    const existingImageUrls = imageState.value.filter(img => !img.isNew).map(img => img.url);

    const payload = { ...form.value, category_id: selectedCategoryId.value, images: [...existingImageUrls, ...newImageUrls] };

    if (isEditing.value) {
      await $fetch(`/api/admin/products/${productId.value}`, { method: 'PUT', body: payload });
    } else {
      await $fetch('/api/admin/products', { method: 'POST', body: payload });
    }
    router.push('/manage-products');
  } catch (e: any) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template> 
  <form :class="{ 'form-submitted': hasAttemptedSubmit }" class="px-8 py-6" @submit.prevent="handleSubmit">
    <div class="flex items-center justify-between pb-4 border-b">
      <div class="flex flex-col gap-4">
        <NuxtLink :to="localePath('/manage-products')">
          <button type="button" class="flex items-center gap-2 text-sm text-gray-400"><Icon name="tabler:arrow-left"/> Back to Manage Product</button>
        </NuxtLink>
        <h2 class="text-2xl font-bold text-gray-800">{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h2>
      </div>
      <button type="submit" class="bg-green-700 px-6 py-2.5 text-white rounded-md font-semibold flex items-center gap-2" :disabled="loading" @click="hasAttemptedSubmit = true">
        <Icon v-if="loading" name="eos-icons:loading" class="w-5 h-5" />
        {{ isEditing ? 'Update Product' : 'Finish & Upload' }}
      </button>
    </div>

    <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8 pb-[30vh]">
      <aside class="md:col-span-1 sticky top-28 h-fit">
        <nav class="flex flex-col border bg-white rounded-md">
          <a
            v-for="section in ['product-information', 'product-specification', 'shipping-information']" :key="section" :href="`#${section}`"
            class="px-4 py-3 rounded-md font-medium transition-colors duration-200 capitalize"
            :class="{ 
              'bg-gray-100 text-gray-900': activeSectionId === section, 
              'text-gray-500 hover:bg-gray-100 hover:text-gray-900': activeSectionId !== section 
            }"
          >
            {{ section.replace(/-/g, ' ') }}
          </a>
        </nav>
      </aside>

      <div class="md:col-span-3 space-y-8">
        <section id="product-information" class="p-6 border rounded-lg bg-white shadow-sm space-y-6 scroll-mt-24">
          <h3 class="text-xl font-semibold text-gray-800">Product Information</h3>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Product Photo*</label>
            <p class="text-xs text-gray-500 mb-2">File format: JPG, JPEG, PNG. Max size: 2MB.</p>
            <div class="mt-2 flex items-center flex-wrap gap-4">
              <label for="file-upload" class="w-24 h-24 border rounded-lg flex items-center justify-center bg-gray-50 relative cursor-pointer group">
                <input id="file-upload" type="file" accept="image/*" multiple class="absolute inset-0 opacity-0 w-full h-full cursor-pointer" :required="imageState.length === 0" @change="onFileChange">
                <Icon name="uil:image-upload" class="w-8 h-8 text-gray-400 group-hover:text-gray-600" />
              </label>
              <div v-for="(image, index) in imageState" :key="image.url" class="relative w-24 h-24 rounded-lg overflow-hidden border">
                <img :src="image.url" class="w-full h-full object-cover" >
                <button type="button" class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs leading-none" @click="removeImage(index)">
                  <Icon name="fa6-solid:xmark" class="w-3 h-3"/>
                </button>
              </div>
            </div>
            <p v-if="error && error.includes('upload')" class="text-red-500 text-xs mt-2">{{ error }}</p>
          </div>
          <div>
            <label for="product-name" class="block text-sm font-medium text-gray-700">Product Name*</label>
            <input id="product-name" v-model="form.name" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="Enter Product Name"  required >
          </div>
          <div>
            <label for="product-category" class="block text-sm font-medium text-gray-700">Product Category*</label>
            <select id="product-category" v-model="selectedCategoryId" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm"  required >
              <option :value="null" disabled>Select a category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>
          <div>
            <label for="product-description" class="block text-sm font-medium text-gray-700">Product Description*</label>
            <textarea id="product-description" v-model="form.description" rows="5" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="Tell your customer about the product, benefits, & how to use it."  required />
            <div class="mt-2 text-xs text-gray-500">{{ form.description?.length || 0 }}/3000</div>
          </div>
        </section>

        <section id="product-specification" class="p-6 border rounded-lg bg-white shadow-sm space-y-6 scroll-mt-24">
          <h3 class="text-xl font-semibold text-gray-800">Product Specification</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700">Select Unit*</label>
              <div class="mt-2 flex gap-4"><label class="inline-flex items-center"><input v-model="form.unit" type="radio" value="gram" class="form-radio text-green-600" ><span class="ml-2 text-gray-700">gram</span></label><label class="inline-flex items-center"><input v-model="form.unit" type="radio" value="ml" class="form-radio text-green-600" ><span class="ml-2 text-gray-700">ml</span></label></div>
            </div>
            <div>
              <label for="size" class="block text-sm font-medium text-gray-700">Size*</label>
              <input id="size" v-model="form.size" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" required  >
            </div>
            <div>
              <label for="price" class="block text-sm font-medium text-gray-700">Price (Rupiah)*</label>
              <div class="mt-1 relative rounded-md shadow-sm"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span class="text-gray-500 sm:text-sm">Rp</span></div><input id="price" v-model.number="form.price" type="number" class="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" required  ></div>
            </div>
            <div>
              <label for="stock" class="block text-sm font-medium text-gray-700">Stock (pcs)*</label>
              <input id="stock" v-model.number="form.stock" type="number" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" required  >
            </div>
            <div>
              <label for="min-purchase" class="block text-sm font-medium text-gray-700">Min. Purchase (pcs)*</label>
              <input id="min-purchase" v-model.number="form.min_purchase" type="number" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="1" required  >
            </div>
            <div>
              <label for="bpom-number" class="block text-sm font-medium text-gray-700">BPOM Number</label>
              <input id="bpom-number" v-model="form.bpom_number" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm"   >
            </div>
            <div>
              <label for="sku-id" class="block text-sm font-medium text-gray-700">SKU ID</label>
              <input id="sku-id" v-model="form.sku_id" type="text" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm"  >
            </div>
          </div>
        </section>

        <section id="shipping-information" class="p-6 border rounded-lg bg-white shadow-sm space-y-6 scroll-mt-24">
          <h3 class="text-xl font-semibold text-gray-800">Shipping Information</h3>
          <div>
            <label for="weight" class="block text-sm font-medium text-gray-700">Weight (gr)*</label>
            <input id="weight" v-model.number="form.weight_gr" type="number" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" required  >
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label for="length" class="block text-sm font-medium text-gray-700">Length (cm)*</label>
              <input id="length" v-model.number="form.length_cm" type="number" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" required  >
            </div>
            <div>
              <label for="width" class="block text-sm font-medium text-gray-700">Width (cm)*</label>
              <input id="width" v-model.number="form.width_cm" type="number" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" required >
            </div>
            <div>
              <label for="height" class="block text-sm font-medium text-gray-700">Height (cm)*</label>
              <input id="height" v-model.number="form.height_cm" type="number" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" required >
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-if="error" class="fixed bottom-10 right-10 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-lg" role="alert">
      {{ error }}
    </div>
  </form>
</template>