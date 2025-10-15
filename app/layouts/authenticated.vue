<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});

const localePath = useLocalePath();
const user = useSupabaseUser();
const supabase = useSupabaseClient();
const router = useRouter();

const isUserMenuOpen = ref(false);

async function handleSignOut() {
  await supabase.auth.signOut();
  router.push('/login');
}
</script>

<template>
  <section class="bg-white container mx-auto px-4 py-8">
    <header class="border-b border-gray-200 py-4">
      <div class="container mx-auto px-4 flex justify-between items-center">
        <div class="flex gap-8 items-center">
          <NuxtLink :to="localePath('/manage-products')" class="text-2xl font-serif font-bold text-green-800">
            MIELS <span class="font-light">Admin</span> 
          </NuxtLink>
          <NuxtLink :to="localePath('/')" class=" text-xl font-serif text-green-800 opacity-50 hover:opacity-100">
            Home 
          </NuxtLink>
    
        </div>

        <div class="flex gap-6 items-center">
          <UiLocaleSwitcher />
          <div v-if="user" class="relative">
            <button class="flex items-center gap-2 border rounded-full px-3 py-1.5 hover:bg-gray-100" @click="isUserMenuOpen = !isUserMenuOpen">
              <Icon name="ph:user-circle" class="w-6 h-6" />
              <span class="font-semibold text-sm">{{ user.email?.split('@')[0] }}</span>
            </button>
            <div v-if="isUserMenuOpen" class="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-20" @click="isUserMenuOpen = false">
              <NuxtLink :to="localePath('/')" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Home</NuxtLink>
              <template v-if="user.app_metadata?.role === 'admin'">
                <NuxtLink :to="localePath('/manage-products')" class="relative px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex justify-between group">
                  Manage <span class="absolute right-4 font-semibold text-[0.7rem] text-green-700 border rounded-full px-2 group-hover:bg-green-800 group-hover:text-white transition-all duration-100">Admin</span>
                </NuxtLink>
              </template>
              
              <hr class="my-1">
              <button class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50" @click="handleSignOut">Sign Out</button>
            </div>
          </div>

          <NuxtLink v-else :to="localePath('/login')">
            <button class="font-semibold text-gray-600 hover:text-green-800">Sign In</button>
          </NuxtLink>
        </div>
      </div>
    </header>
    <main class="py-8">
      <slot/>
    </main>
  </section>
</template>