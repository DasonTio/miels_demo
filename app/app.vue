<script setup lang="ts">
import { VueLenis } from 'lenis/vue' 
</script>
<template> 
  <VueLenis root/>
  <div class="font-sans text-gray-800 bg-white container mx-auto px-4 py-8">
    <Toaster rich-colors position="bottom-right" />
    <LayoutHeaderComponent/>
    <NuxtPage />
  </div>
</template>