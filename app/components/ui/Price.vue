<script setup lang="ts">
const props = defineProps<{
  amount: number
}>()

const { n } = useI18n()
</script>

<template>
  <span class="font-bold text-lg text-gray-800">
    {{ n(props.amount, 'currency') }}
  </span>
</template>