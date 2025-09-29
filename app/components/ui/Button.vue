<script setup lang="ts">
const props = withDefaults(defineProps<{
  tKey: string, 
  variant?: 'primary' | 'secondary'
}>(), {
  variant: 'primary' 
})

const { t } = useI18n()
const buttonClass = computed(() => {
  const baseClasses = 'px-6 py-3 font-semibold rounded-md transition-colors duration-300'
  if (props.variant === 'primary') return `${baseClasses} bg-green-800 text-white hover:bg-green-700`
  if (props.variant === 'secondary') return `${baseClasses} bg-gray-200 text-green-900 hover:bg-gray-300`
  return baseClasses
})
</script>

<template>
  <button :class="buttonClass">
    {{ t(tKey) }}
  </button>
</template>