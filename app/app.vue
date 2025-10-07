<script setup lang="ts">
import { VueLenis } from 'lenis/vue' 
</script>
<template> 
  <VueLenis root/>
  <div class="font-sans text-gray-800 ">
    <Toaster rich-colors position="bottom-right" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>