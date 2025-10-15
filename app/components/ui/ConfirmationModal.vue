<script setup lang="ts">
defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
});

const emit = defineEmits(['confirm', 'cancel']);
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center gap-4 flex flex-col">
      <h3 class="text-lg font-bold text-gray-800">{{ title }}</h3>
      <p class="mt-2 text-sm text-gray-600">{{ message }}</p>
      <div class="mt-6 grid grid-cols-2 gap-4">
        <button 
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300"
            @click="emit('cancel')"
        >
          Cancel
        </button>
        <button
            class="px-4 py-2 bg-green-700 text-white rounded-md font-semibold hover:bg-green-800"
            @click="emit('confirm')"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
</template>