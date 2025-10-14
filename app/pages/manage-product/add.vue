<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { CategoryResponse } from '~~/server/api/categories';
import type { DisplayProduct } from '~~/app/types/product';
import { useSupabaseClient } from '#imports';
import type { Database } from '~~/app/types/database';

definePageMeta({
  layout: "authenticated"
});

const router = useRouter();
const route = useRoute();
const supabase = useSupabaseClient<Database>();

const isEditing = computed(() => !!route.params.id);
const productId = computed(() => route.params.id as string);

// --- Form Data State ---
const form = ref<Partial<DisplayProduct>>({
  name: '',
  description: '',
  images: [], // Array of URLs
  category: null, // Will hold the selected category object
  unit: 'gram', // Default
  size: '',
  price: null,
  stock: null,
  min_purchase: null,
  bpom_number: '',
  sku_id: '',
  weight_gr: null,
  length_cm: null,
  width_cm: null,
  height_cm: null,
  is_active: true,
  is_best_seller: false,
});

const uploadImagePreviews = ref<string[]>([]); // To display chosen images
const filesToUpload = ref<File[]>([]); // To hold actual file objects for upload

const loading = ref(false);
const error = ref<string | null>(null);

// --- Fetch Categories ---
const { data: categories } = await useFetch<CategoryResponse[]>('/api/categories', { default: () => [] });
const selectedCategoryId = ref<number | null>(null); // For v-model of select input

// --- Load Product Data for Editing ---
onMounted(async () => {
  if (isEditing.value) {
    loading.value = true;
    try {
      // Fetch product details from API
      const { data: product, error: fetchError } = await useFetch<DisplayProduct>(`/api/admin/products/${productId.value}`);
      if (fetchError.value) throw fetchError.value;
      if (product.value) {
        // Populate form with fetched data
        form.value = {
          ...product.value,
          category: product.value.category, // Keep category object
        };
        selectedCategoryId.value = product.value.category?.id || null;
        uploadImagePreviews.value = product.value.images || []; // Set existing images as previews
      } else {
        error.value = "Product not found.";
      }
    } catch (e: any) {
      error.value = e.message || "Failed to load product data.";
      console.error(e);
    } finally {
      loading.value = false;
    }
  }
});

// --- Watcher for Category Selection ---
watch(selectedCategoryId, (newId) => {
  if (newId) {
    form.value.category = categories.value?.find(cat => cat.id === newId) || null;
  } else {
    form.value.category = null;
  }
}, { immediate: true });

// --- Image Upload Logic ---
const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    // Clear previous files/previews if you only want single image uploads,
    // otherwise append to existing arrays for multiple.
    // For now, let's assume multiple images.
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i];
      if(file){
        filesToUpload.value.push(file);
        uploadImagePreviews.value.push(URL.createObjectURL(file));
      }
    }
  }
};

const removeImage = (index: number, isExistingImage: boolean) => {
  if (isExistingImage) {
    uploadImagePreviews.value.splice(index, 1); // Remove from previews
    // If it's an existing image, it means it's already on Supabase storage.
    // We'll handle its deletion on the server during the save process.
  } else {
    // This is a newly uploaded file that hasn't been saved yet
    const originalIndex = uploadImagePreviews.value.findIndex(preview => preview === uploadImagePreviews.value[index]);
    if (originalIndex !== -1) {
      URL.revokeObjectURL(uploadImagePreviews.value[index] ?? ""); // Free up memory
      uploadImagePreviews.value.splice(index, 1); // Remove from previews
      filesToUpload.value.splice(originalIndex, 1); // Remove actual file
    }
  }
};


async function handleSubmit() {
  loading.value = true;
  error.value = null;

  try {
    // 1. Upload new images in parallel for better performance
    const uploadPromises = filesToUpload.value.map(async (file) => {
      const filePath = `public/${Date.now()}-${file.name}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('images') // Your bucket name
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // **FIX 1: Get the full Public URL after uploading**
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);
        
      return publicUrl;
    });

    const newImageUrls = await Promise.all(uploadPromises);

    // 2. Construct the final payload for the API
    const payload = {
      ...form.value,
      // **FIX 2: Correctly assign `category_id` and existing images**
      category_id: selectedCategoryId.value,
      images: [
        ...uploadImagePreviews.value.filter(url => !url.startsWith('blob:')), // Keep old images that weren't removed
        ...newImageUrls // Add the new public URLs
      ]
    };

    // 3. Call the API to create or update
    if (isEditing.value) {
      await $fetch(`/api/admin/products/${productId.value}`, { method: 'PUT', body: payload });
    } else {
      await $fetch('/api/admin/products', { method: 'POST', body: payload });
    }

    router.push('/manage-product');
  } catch (e: any) {
    error.value = e.message;
    console.error("Failed to save product:", e);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="px-8 py-6">
    <div class="flex items-center justify-between pb-4 border-b">
      <h2 class="text-2xl font-bold text-gray-800">{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h2>
      <button @click="handleSubmit" :disabled="loading" class="bg-green-700 px-6 py-2.5 text-white rounded-md font-semibold flex items-center gap-2">
        <Icon v-if="loading" name="eos-icons:loading" class="w-5 h-5" />
        {{ isEditing ? 'Update Product' : 'Finish & Upload' }}
      </button>
    </div>

    <div class="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
      <aside class="md:col-span-1">
        <nav class="flex flex-col gap-2">
          <a href="#product-information" class="px-4 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium">Product Information</a>
          <a href="#product-specification" class="px-4 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium">Product Specification</a>
          <a href="#shipping-information" class="px-4 py-2 rounded-md hover:bg-gray-100 text-gray-700 font-medium">Shipping Information</a>
        </nav>
      </aside>

      <div class="md:col-span-3 space-y-8">
        <section id="product-information" class="p-6 border rounded-lg bg-white shadow-sm space-y-6">
          <h3 class="text-xl font-semibold text-gray-800">Product Information</h3>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Product Photo*</label>
            <p class="text-xs text-gray-500 mb-2">File format: JPG, JPEG, PNG. Max size: 2MB.</p>
            <div class="mt-2 flex items-center space-x-4">
              <div class="w-24 h-24 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50 relative cursor-pointer group">
                <input type="file" @change="onFileChange" accept="image/*" multiple class="absolute inset-0 opacity-0 cursor-pointer" />
                <Icon name="uil:image-upload" class="w-8 h-8 text-gray-400 group-hover:text-gray-600" />
              </div>
              <div v-for="(img, index) in uploadImagePreviews" :key="index" class="relative w-24 h-24 rounded-lg overflow-hidden border">
                <img :src="img ? img : `https://your-supabase-url/storage/v1/object/public/images/${img}`" class="w-full h-full object-cover" />
                <button @click="removeImage(index, !img.startsWith('blob:'))" class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs leading-none">
                  <Icon name="fa6-solid:xmark" class="w-3 h-3"/>
                </button>
              </div>
            </div>
            <p v-if="error && error.includes('upload')" class="text-red-500 text-xs mt-2">{{ error }}</p>
          </div>

          <div>
            <label for="product-name" class="block text-sm font-medium text-gray-700">Product Name*</label>
            <input type="text" id="product-name" v-model="form.name" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="Enter Product Name" />
          </div>

          <div>
            <label for="product-category" class="block text-sm font-medium text-gray-700">Product Category*</label>
            <select id="product-category" v-model="selectedCategoryId" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm">
              <option :value="null">Uncategorized</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
            </select>
          </div>

          <div>
            <label for="product-description" class="block text-sm font-medium text-gray-700">Product Description*</label>
            <textarea id="product-description" v-model="form.description" rows="5" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="Tell your customer about the product, benefits, & how to use it."></textarea>
            <div class="mt-2 text-xs text-gray-500">{{ form.description?.length || 0 }}/3000</div>
          </div>
        </section>

        <section id="product-specification" class="p-6 border rounded-lg bg-white shadow-sm space-y-6">
          <h3 class="text-xl font-semibold text-gray-800">Product Specification</h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Select Unit*</label>
            <div class="mt-2 flex gap-4">
              <label class="inline-flex items-center">
                <input type="radio" v-model="form.unit" value="gram" class="form-radio text-green-600" />
                <span class="ml-2 text-gray-700">gram</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" v-model="form.unit" value="ml" class="form-radio text-green-600" />
                <span class="ml-2 text-gray-700">ml</span>
              </label>
            </div>
          </div>

          <div>
            <label for="size" class="block text-sm font-medium text-gray-700">Size*</label>
            <input type="text" id="size" v-model="form.size" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" />
          </div>

          <div>
            <label for="price" class="block text-sm font-medium text-gray-700">Price (Rupiah)*</label>
            <div class="mt-1 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 sm:text-sm">Rp</span>
              </div>
              <input type="number" id="price" v-model.number="form.price" class="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" />
            </div>
          </div>

          <div>
            <label for="stock" class="block text-sm font-medium text-gray-700">Stock (pcs)*</label>
            <input type="number" id="stock" v-model.number="form.stock" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" />
          </div>

          <div>
            <label for="min-purchase" class="block text-sm font-medium text-gray-700">Min. Purchase (pcs)*</label>
            <input type="number" id="min-purchase" v-model.number="form.min_purchase" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="1" />
          </div>

          <div>
            <label for="bpom-number" class="block text-sm font-medium text-gray-700">BPOM Number</label>
            <input type="text" id="bpom-number" v-model="form.bpom_number" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" />
          </div>

          <div>
            <label for="sku-id" class="block text-sm font-medium text-gray-700">SKU ID</label>
            <input type="text" id="sku-id" v-model="form.sku_id" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" />
          </div>
        </section>

        <section id="shipping-information" class="p-6 border rounded-lg bg-white shadow-sm space-y-6">
          <h3 class="text-xl font-semibold text-gray-800">Shipping Information</h3>

          <div>
            <label for="weight" class="block text-sm font-medium text-gray-700">Weight (gr)*</label>
            <input type="number" id="weight" v-model.number="form.weight_gr" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="length" class="block text-sm font-medium text-gray-700">Length (cm)*</label>
              <input type="number" id="length" v-model.number="form.length_cm" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" />
            </div>
            <div>
              <label for="width" class="block text-sm font-medium text-gray-700">Width (cm)*</label>
              <input type="number" id="width" v-model.number="form.width_cm" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" />
            </div>
            <div>
              <label for="height" class="block text-sm font-medium text-gray-700">Height (cm)*</label>
              <input type="number" id="height" v-model.number="form.height_cm" class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-green-500 focus:border-green-500 sm:text-sm" placeholder="0" />
            </div>
          </div>
        </section>
      </div>
    </div>

    <div v-if="error" class="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
      {{ error }}
    </div>
  </div>
</template>