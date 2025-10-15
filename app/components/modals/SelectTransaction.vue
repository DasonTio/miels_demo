<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import type { Tables } from '~~/app/types/database';

type OrderWithItems = Tables<'orders'> & {
  order_items: ({
    product: { name: string; images: string[] | null } | null;
  })[];
};

defineProps<{
  orders: OrderWithItems[];
}>();

const emit = defineEmits(['select', 'close']);

const getFirstImage = (items: any[]): string => {
  const firstItemWithProduct = items.find(item => item.product?.images?.length);
  return firstItemWithProduct?.product.images[0] || 'https://placehold.co/128x128/f0ebe4/a2a2a2?text=MIELS';
};
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
      <div class="p-5 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-lg">
        <h3 class="text-2xl font-serif text-gray-800">Select a Transaction</h3>
        <button class="text-gray-400 hover:text-gray-800" @click="emit('close')">
          <Icon name="ph:x-bold" class="w-5 h-5" />
        </button>
      </div>
      
      <div class="p-6 overflow-y-auto">
        <div v-if="orders.length === 0" class="text-center py-16 text-gray-500">
          <p>No completed transactions found.</p>
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            v-for="order in orders" 
            :key="order.id" 
            class="border rounded-lg p-4 transition-shadow hover:shadow-md"
          >
            <div class="flex gap-4">
              <img :src="getFirstImage(order.order_items)" class="w-20 h-20 object-cover rounded-md" >
              <div>
                <p class="font-bold text-sm">{{ order.order_number }}</p>
                <p class="text-xs text-gray-500">{{ new Date(order.created_at!).toLocaleDateString() }}</p>
                <p class="font-semibold mt-2 text-gray-800">{{ order.order_items[0]?.product?.name }}</p>
                <p v-if="order.order_items.length > 1" class="text-xs text-gray-500">+ {{ order.order_items.length - 1 }} other products</p>
              </div>
            </div>
            <button 
              class="w-full mt-4 bg-gray-100 text-gray-800 py-2 rounded-md font-semibold hover:bg-green-100 hover:text-green-800 transition-colors" 
              @click="emit('select', order)"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>