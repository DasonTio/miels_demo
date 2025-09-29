<script setup lang="ts">
import { useCartStore } from '#imports';

const { t } = useI18n()
const cartStore = useCartStore();

function updateItemQuantity(productId: number, newQuantity: number) {
  cartStore.updateQuantity(productId, newQuantity);
}

function removeItem(productId: number) {
  if (confirm('Are you sure you want to remove this item?')) {
    cartStore.removeProduct(productId);
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-12">
    <div v-if="cartStore.items.length === 0" class="text-center py-20  border rounded-lg">
      <p class="text-gray-500">{{ t("cart.cartIsEmpty") }}</p>
      
      <NuxtLink to="/">
        <UiButton
          t-key="cart.continueShopping"
          variant="secondary"
          class="mt-4"
        />
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <div class="lg:col-span-2 space-y-4">
        <div 
          v-for="item in cartStore.items" 
          :key="item.product.id"
          class="flex items-center gap-4 p-4 border rounded-lg"
        >
          <img 
            :src="item.product.images[0]?.image_url" 
            :alt="item.product.name" 
            class="w-24 h-24 object-cover rounded-md"
          >
          
          <div class="flex-grow">
            <h2 class="font-bold text-lg">{{ item.product.name }}</h2>
            <div class="text-sm text-gray-500">
              <div v-for="(variantName, bundleId) in item.variants" :key="bundleId">
                - {{ variantName }}
              </div>
            </div>
            <UiPrice :amount="item.product.price" class="mt-1" />
          </div>

          <div class="flex items-center gap-4">
             <div class="flex border rounded-md items-center">
              <button class="px-3 py-1 font-bold" @click="updateItemQuantity(item.product.id, item.quantity - 1)">-</button>
              <span class="px-3 py-1 w-10 text-center">{{ item.quantity }}</span>
              <button class="px-3 py-1 font-bold" @click="updateItemQuantity(item.product.id, item.quantity + 1)">+</button>
            </div>
            <button class="text-gray-400 hover:text-red-500" @click="removeItem(item.product.id)" >
              <Icon name="fa6-regular:trash-can" style="color: black" />
            </button>
          </div>
        </div>
      </div>

      <aside class="lg:col-span-1">
        <div class="border rounded-lg p-6 bg-gray-50">
          <h2 class="text-2xl font-serif mb-4">{{ t("cart.summary") }}</h2>
          <div class="flex justify-between text-gray-600">
            <span>{{ t("cart.subtotal") }}</span>
            <UiPrice :amount="cartStore.totalPrice" />
          </div>
          <div class="flex justify-between text-gray-600 mt-2">
            <span>{{ t("cart.shipping") }}</span>
            <span>{{ t("cart.free") }}</span>
          </div>
          <hr class="my-4">
          <div class="flex justify-between font-bold text-xl">
            <span>{{ t("cart.total") }}</span>
            <UiPrice :amount="cartStore.totalPrice" />
          </div>

          <UiButton t-key="cart.checkout" class="w-full mt-6" />
        </div>
      </aside>
    </div>
  </div>
</template>