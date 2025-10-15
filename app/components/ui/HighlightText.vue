<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  text: {
    type: String,
    required: true,
  },
  query: {
    type: String,
    required: true,
  },
});

const parts = computed(() => {
  if (!props.query) {
    return [{ text: props.text, highlight: false }];
  }

  const lowerCaseText = props.text.toLowerCase();
  const lowerCaseQuery = props.query.toLowerCase();
  const startIndex = lowerCaseText.indexOf(lowerCaseQuery);

  if (startIndex === -1) {
    return [{ text: props.text, highlight: false }];
  }

  const endIndex = startIndex + props.query.length;

  return [
    { text: props.text.substring(0, startIndex), highlight: false },
    { text: props.text.substring(startIndex, endIndex), highlight: true },
    { text: props.text.substring(endIndex), highlight: false },
  ];
});
</script>

<template>
  <span>
    <template v-for="(part, index) in parts" :key="index">
      <mark v-if="part.highlight" class="bg-yellow-200 px-0 py-0 rounded-sm">
        {{ part.text }}
      </mark>
      <span v-else>{{ part.text }}</span>
    </template>
  </span>
</template>