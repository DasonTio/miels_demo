<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});

const localePath = useLocalePath()
const supabase = useSupabaseClient();
const router = useRouter();

async function handleSignOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error.message);
    return;
  }
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b border-gray-200 py-4">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <NuxtLink :to="localePath('/')" class="text-2xl font-serif font-bold text-green-800">
          MIELS
        </NuxtLink>
        <nav class="flex gap-8 items-center">
          <UiLocaleSwitcher/>
          <button 
              class="border border-green-800 text-green-800 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 hover:text-white"
              @click="handleSignOut"
              >
              Sign Out
          </button>
        </nav>
      </div>
    </header>
    <main class="container mx-auto p-4">
      <slot />
    </main>
  </div>
</template>