<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
definePageMeta({
  layout: "blank"
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)
const isLoading = ref(false)

watchEffect(() => {
  if (user.value) navigateTo('/manage-products')
})

async function signIn() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (error) throw error
  } catch (error: any) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}

async function signInWithGoogle() {
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
  } catch (error: any) {
    errorMessage.value = error.message;
  } 
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <form 
    class="flex flex-col gap-8 bg-white p-8 rounded-lg w-full max-w-md"
    @submit.prevent="signIn"
    >
        <h1 class="text-3xl font-bold text-center text-gray-800">👋🏻 Welcome Back</h1>
        <div class="flex flex-col gap-4">
            <div class="flex gap-2">
                <label for="email" class="flex items-center justify-center">
                    <Icon name="tabler:user-filled" class="text-slate-300 text-2xl" />
                </label>
                <input 
                id="email"
                v-model="email"
                type="email" 
                placeholder="user123@gmail.com"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                required
                >
            </div>

            <div class="flex gap-2">
                <label for="password" class="flex items-center justify-center">
                    <Icon name="tabler:lock-filled" class="text-slate-300 text-2xl" />
                    
                </label>
                <input 
                id="password"
                v-model="password"
                type="password" 
                placeholder="********"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                required
                >
            </div>
        </div>

        <button 
            type="submit"
            :disabled="isLoading"
            class="w-full bg-green-700 text-white py-2 rounded-lg font-semibold hover:bg-green-800 transition duration-300 disabled:bg-gray-400"
        >
            {{ isLoading ? 'Signing In...' : 'Sign In' }}
        </button>

        <div v-if="errorMessage" class="mt-4 text-center text-red-500 bg-red-100 p-3 rounded-lg">
            <p>{{ errorMessage }}</p>
        </div>
        <p class="flex justify-center text-slate-300">or</p>
        <button 
            class="w-full mb-4 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition duration-300 disabled:opacity-50"
            :disabled="isLoading"
            @click="signInWithGoogle"
        >
            <Icon name="logos:google-icon" class="w-5 h-5" />
            Sign in with Google
        </button>
    </form>
    
  </div>
</template>