<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabaseClient } from '#imports';
import type { Database, Tables } from '~~/app/types/database';

definePageMeta({
  middleware:"auth"
});

type OrderWithItems = Tables<'orders'> & {
  order_items: ({
    product: { name: string; images: string[] | null } | null;
  })[];
};

// 2. Initialize router, Supabase client, and all necessary state
const router = useRouter();
const supabase = useSupabaseClient<Database>();

const form = ref({
  issueType: 'order_transaction',
  description: '',
  phone: '',
  email: '',
});
const imagePreviews = ref<{ url: string, file: File }[]>([]); // Unified state for previews and files
const isSubmitting = ref(false);
const error = ref<string | null>(null);
const selectedTransaction = ref<OrderWithItems | null>(null);
const isModalOpen = ref(false);

const { data: orders } = await useFetch<OrderWithItems[]>('/api/orders', { default: () => [] });

function handleSelectTransaction(order: OrderWithItems) {
  selectedTransaction.value = order;
  isModalOpen.value = false;
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  
  for (const file of Array.from(input.files)) {
    imagePreviews.value.push({
      url: URL.createObjectURL(file),
      file: file
    });
  }
  input.value = ''; 
}

function removeImage(index: number) {
  const image = imagePreviews.value[index];
  if(image)
    URL.revokeObjectURL(image.url); 
    imagePreviews.value.splice(index, 1);
}

async function handleSubmit() {
  isSubmitting.value = true;
  error.value = null;

  try {
    const uploadPromises = imagePreviews.value.map(async (image) => {
      const filePath = `${Date.now()}-${image.file.name}`;
      const { data, error: uploadError } = await supabase.storage.from('support-files').upload(filePath, image.file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('support-files').getPublicUrl(data.path);
      return publicUrl;
    });

    const supportingFiles = (await Promise.all(uploadPromises)).filter(Boolean) as string[];

    await $fetch('/api/tickets', {
      method: 'POST',
      body: { 
        ...form.value,
        transactionReference: selectedTransaction.value?.order_number,
        supportingFiles 
      }
    });

    router.push('/customer-service');
  } catch (err: any) {
    error.value = err.message || "Failed to create ticket.";
  } finally {
    isSubmitting.value = false;
  }
}

const getFirstImage = (items: any[]): string => {
  const firstItemWithProduct = items.find(item => item.product?.images?.length);
  return firstItemWithProduct?.product.images[0] || 'https://placehold.co/128x128/f0ebe4/a2a2a2?text=MIELS';
};
</script>

<template>
  <div class="container mx-auto max-w-2xl px-4 py-8">
    <h1 class="text-3xl font-serif text-center mb-8">Customer Service Ticket Form</h1>
     <form class="bg-white border rounded-lg p-8" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        
        <div class="space-y-6">
          <div>
            <label for="issue-type" class="block text-sm font-semibold text-gray-700 mb-1">Issue Type*</label>
            <select id="issue-type" v-model="form.issueType" class="w-full border-gray-300 rounded-md shadow-sm p-2 " required>
              <option value="order_transaction">Order & Transaction</option>
              <option value="product_inquiry">Product Inquiry</option>
              <option value="account_issue">Account Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label for="description" class="block text-sm font-semibold text-gray-700 mb-1">Description*</label>
            <textarea id="description" v-model="form.description" rows="8" class="w-full border-gray-300 rounded-md border p-2" required placeholder="Tell us about your issue..."/>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Supporting Files*</label>
            <p class="text-xs text-gray-500 mb-2">JPG, JPEG, PNG, MP4, MOV. Max: 25MB.</p>
            <div class="flex flex-wrap gap-4 mt-2">
              <div v-for="(image, index) in imagePreviews" :key="image.url" class="relative w-24 h-24 rounded-lg border overflow-hidden">
                <img :src="image.url" class="w-full h-full object-cover">
                <button type="button" class="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5" @click="removeImage(index)">
                  <Icon name="ph:x-bold" class="w-3 h-3"/>
                </button>
              </div>
              <label for="file-upload" class="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 hover:border-green-700 hover:text-green-700">
                <Icon name="ph:plus" class="w-8 h-8"/>
                <input id="file-upload" type="file" multiple class="sr-only" @change="onFileChange">
              </label>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Transaction Reference*</label>
            <div class="border border-gray-300 rounded-md p-4 cursor-pointer hover:bg-gray-50 min-h-[140px] flex items-center justify-center" @click="isModalOpen = true">
              <div v-if="!selectedTransaction" class="text-center text-green-700 font-semibold">+ Select a Transaction</div>
              <div v-else class="w-full">
                <div class="flex justify-between items-start">
                  <div class="flex gap-4">
                    <img :src="getFirstImage(selectedTransaction.order_items)" class="w-20 h-20 object-cover rounded-md" >
                    <div class="">
                      <p class="font-bold text-gray-800">{{ selectedTransaction.order_number }}</p>
                      <p class="text-sm text-gray-500">{{ new Date(selectedTransaction.created_at!).toLocaleDateString() }}</p>
                      <UiPrice :amount="selectedTransaction.total_price" class="font-semibold text-lg mt-2" />
                    </div>
                  </div>
                  <button type="button" class="text-green-800 text-sm font-semibold hover:underline" @click.stop="isModalOpen = true">Change</button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label for="phone" class="block text-sm font-semibold text-gray-700 mb-1">Phone Number*</label>
            <input id="phone" v-model="form.phone" type="tel" class="w-full border-gray-300 border p-2 rounded-md" placeholder="08123456789" required >
          </div>

          <div>
            <label for="email" class="block text-sm font-semibold text-gray-700 mb-1">Email*</label>
            <input id="email" v-model="form.email" type="email" class="w-full border-gray-300 border p-2 rounded-md" placeholder="example@gmail.com" required >
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-4 pt-6 mt-8 border-t">
        <NuxtLink to="/customer-service" class="px-8 py-2.5 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300">Cancel</NuxtLink>
        <button type="submit" :disabled="isSubmitting" class="px-8 py-2.5 bg-green-800 text-white rounded-md font-semibold disabled:bg-gray-400">
          <span v-if="isSubmitting">Submitting...</span>
          <span v-else>Submit</span>
        </button>
      </div>

      <div v-if="error" class="mt-4 bg-red-50 text-red-700 p-3 rounded-md text-sm">
        {{ error }}
      </div>
    </form>
    <ModalsSelectTransaction 
      v-if="isModalOpen"
      :orders="orders"
      @close="isModalOpen = false"
      @select="handleSelectTransaction"
    />
  </div>

  
</template>