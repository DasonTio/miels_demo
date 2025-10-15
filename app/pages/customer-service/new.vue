<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabaseClient } from '#imports';
import type { Database } from '~/app/types/database';

definePageMeta({
  layout: 'authenticated'
});

const router = useRouter();
const supabase = useSupabaseClient<Database>();

// --- STATE MANAGEMENT ---
const form = ref({
  issueType: 'order_transaction',
  transactionReference: '', // This would be populated by your transaction selection modal
  description: '',
  phone: '',
  email: '',
});
const filesToUpload = ref<File[]>([]);
const isSubmitting = ref(false);
const error = ref<string | null>(null);

// --- FILE UPLOAD & SUBMISSION LOGIC ---
async function handleSubmit() {
  isSubmitting.value = true;
  error.value = null;

  try {
    // 1. Upload files to Supabase Storage in parallel for performance
    const uploadPromises = filesToUpload.value.map(async (file) => {
      const filePath = `${Date.now()}-${file.name}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('support-files') // The name of your new bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the full public URL of the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('support-files')
        .getPublicUrl(data.path);
        
      return publicUrl;
    });

    const supportingFiles = (await Promise.all(uploadPromises)).filter(Boolean) as string[];

    // 2. Call the API to create the ticket with the file URLs
    await $fetch('/api/tickets', {
      method: 'POST',
      body: { ...form.value, supportingFiles }
    });

    // On success, navigate back to the ticket list
    router.push('/customer-service');
  } catch (err: any) {
    error.value = err.message || "Failed to create ticket.";
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="container mx-auto max-w-2xl px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-6">Customer Service Ticket Form</h1>
    <form @submit.prevent="handleSubmit" class="bg-white border rounded-lg p-8 space-y-6">
      
      <div>
        <label for="issue-type" class="block font-semibold mb-1">Issue Type*</label>
        <select id="issue-type" v-model="form.issueType" class="w-full border-gray-300 rounded-md" required>
          <option value="order_transaction">Order & Transaction</option>
          <option value="product_inquiry">Product Inquiry</option>
          <option value="account_issue">Account Issue</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label for="transaction" class="block font-semibold mb-1">Transaction Reference*</label>
        <div @click="console.log('Open transaction modal')" class="border border-gray-300 rounded-md p-4 text-center cursor-pointer hover:bg-gray-50">
          <span v-if="!form.transactionReference" class="text-green-700 font-semibold">+ Select a Transaction</span>
          <div v-else>{{ form.transactionReference }} <button type="button" class="text-blue-500 ml-2 font-semibold">Change</button></div>
        </div>
      </div>

      <div>
        <label for="description" class="block font-semibold mb-1">Description*</label>
        <textarea id="description" v-model="form.description" rows="5" class="w-full border-gray-300 rounded-md" required placeholder="Tell us about your issue..."></textarea>
      </div>

      <div>
        <label for="phone" class="block font-semibold mb-1">Phone Number*</label>
        <input id="phone" v-model="form.phone" type="tel" class="w-full border-gray-300 rounded-md" required />
      </div>

      <div>
        <label for="email" class="block font-semibold mb-1">Email*</label>
        <input id="email" v-model="form.email" type="email" class="w-full border-gray-300 rounded-md" required />
      </div>

      <div>
        <label for="supporting-files" class="block font-semibold mb-1">Supporting Files</label>
        <p class="text-xs text-gray-500 mb-2">Max size: 25MB.</p>
        <input id="supporting-files" type="file" @change="e => filesToUpload = Array.from((e.target as HTMLInputElement).files || [])" multiple class="w-full text-sm" />
      </div>

      <div v-if="error" class="bg-red-50 text-red-700 p-3 rounded-md text-sm">
        {{ error }}
      </div>

      <div class="flex justify-end gap-4 pt-4 border-t">
        <NuxtLink to="/customer-service" class="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold">Cancel</NuxtLink>
        <button type="submit" :disabled="isSubmitting" class="px-6 py-2 bg-green-700 text-white rounded-md font-semibold disabled:bg-gray-400">
          <span v-if="isSubmitting">Submitting...</span>
          <span v-else>Submit</span>
        </button>
      </div>
    </form>
  </div>
</template>