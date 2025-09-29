<script setup lang="ts">
import { ref, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';

const { locales, locale: currentLocale, setLocale } = useI18n();
const isOpen = ref(false);
const dropdownRef = ref(null);

const currentLocaleName = computed(() => {
  const current = locales.value.find(l => l.code === currentLocale.value);
  return current ? current.name : 'Language';
});

function switchLocale(code: "id" | "en") {
  setLocale(code);
  isOpen.value = false;
}

onClickOutside(dropdownRef, () => {
  isOpen.value = false;
});
</script>

<template>
  <div ref="dropdownRef" class="relative" >
    <button 
      class="flex items-center gap-2 font-semibold text-gray-700 hover:text-green-800 transition-colors"
      @click="isOpen = !isOpen"
    >
      <span>{{ currentLocaleName }}</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform" :class="{ 'rotate-180': isOpen }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
    </button>

    <div 
      v-if="isOpen"
      class="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl z-10"
    >
      <ul>
        <li v-for="lang in locales" :key="lang.code">
          <button 
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            :class="{ 'font-bold bg-gray-100': lang.code === currentLocale }"
            @click="switchLocale(lang.code)"
          >
            {{ lang.name }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>