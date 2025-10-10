<script setup lang="ts">
import { useCartStore } from '#imports';
const cartStore = useCartStore();
const localePath = useLocalePath()
</script>

<template>
  <section class="bg-white container mx-auto px-4 py-8">
    <header class="border-b border-gray-200 py-4">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <NuxtLink :to="localePath('/')" class="text-2xl font-serif font-bold text-green-800">
          MIELS
        </NuxtLink>
        <nav class="flex gap-8 items-center">
          <UiLocaleSwitcher/>
          <NuxtLink :to="localePath('/cart')" class="relative group">
            <span class="font-semibold">
              <Icon name="material-symbols:shopping-bag-outline" class="w-7 h-7" />
            </span>
            <span 
              v-if="cartStore.totalItems > 0"
              class="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
            >
              {{ cartStore.totalItems }}
            </span>
          </NuxtLink>
        </nav>
      </div>
    </header>
    <main>
      <slot/>
    </main>
  </section>
</template>