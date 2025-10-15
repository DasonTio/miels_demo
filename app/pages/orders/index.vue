<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import type { Tables } from '~~/app/types/database';

definePageMeta({
  middleware: 'auth'
});

type OrderWithItems = Tables<'orders'> & {
  order_items: ({
    quantity: number;
    price_at_purchase: number;
    product: {
      name: string;
      images: string[] | null;
    } | null;
  })[];
};

const { data: orders, pending } = await useFetch<OrderWithItems[]>('/api/orders', {
  default: () => []
});

const getFirstImage = (items: any[]): string => {
  const firstItemWithProduct = items.find(item => item.product?.images?.length);
  return firstItemWithProduct?.product.images[0] || 'https://placehold.co/128x128/f0ebe4/a2a2a2?text=MIELS';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-serif text-gray-800 mb-8">My Orders</h1>

      <div v-if="pending" class="space-y-4">
        <div v-for="n in 3" :key="n" class="bg-white border border-gray-200 rounded-lg p-6 animate-pulse h-40"/>
      </div>

      <div v-else-if="orders.length === 0" class="text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg py-20">
        <p class="text-lg text-gray-600">You haven't placed any orders yet.</p>
        <NuxtLink to="/">
          <button class="mt-6 bg-green-800 text-white px-6 py-2.5 rounded-md font-semibold hover:bg-green-900 transition-colors">
            Continue Shopping
          </button>
        </NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <div v-for="order in orders" :key="order.id" class="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div class="p-4 border-b flex items-center gap-4 text-sm text-gray-500">
            <Icon name="ph:shopping-bag" class="w-5 h-5" />
            <span class="font-semibold text-gray-800">Belanja</span>
            <span>{{ formatDate(order.created_at!) }}</span>
            <span
:class="['px-2 py-0.5 text-xs font-medium rounded-md capitalize', {
              'bg-yellow-100 text-yellow-800': order.status === 'pending' || order.status === 'paid',
              'bg-blue-100 text-blue-800': order.status === 'processed' || order.status === 'shipped',
              'bg-green-100 text-green-800': order.status === 'delivered',
            }]">
              {{ order.status === 'delivered' ? 'Selesai' : order.status }}
            </span>
            <span>{{ order.order_number }}</span>
          </div>

          <div class="p-6 flex justify-between items-center">
            <div class="flex gap-4">
              <img :src="getFirstImage(order.order_items)" alt="Product image" class="w-20 h-20 object-cover rounded-md">
              <div>
                <p class="font-bold text-gray-900">{{ order.order_items[0]?.product?.name }}</p>
                <p class="text-sm text-gray-500">{{ order.order_items[0]?.quantity }} barang x <UiPrice :amount="order.order_items[0]?.price_at_purchase ?? 0" /></p>
                <p v-if="order.order_items.length > 1" class="text-sm text-gray-500 mt-1">+{{ order.order_items.length - 1 }} produk lainnya</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-500">Total Belanja</p>
              <p class="font-bold text-lg text-gray-900">
                <UiPrice :amount="order.total_price" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>