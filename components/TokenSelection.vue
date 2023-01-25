<script lang="ts" setup>
import { IToken } from "~~/stores/tokens";

const emit = defineEmits(["resolve", "reject", "update:modelValue"]);

const props = defineProps<{
  tokens: IToken[];
  modelValue: IToken;
}>();

const selectedToken = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit("update:modelValue", value);
  },
});

const handleTokenSelection = async () => {
  const result = await openTokenSelectionModal({
    tokens: props.tokens,
    selectedToken: selectedToken.value,
  });

  if (result.success) {
    selectedToken.value = result.payload as IToken;
  }
};
</script>

<template>
  <button
    type="button"
    @click="handleTokenSelection"
    class="dark:bg-gray-850 text-sm uppercase h-fit inline-flex gap-2 items-center rounded-2xl px-4 py-3"
  >
    <img :src="selectedToken?.logoURI" class="h-6 w-6 rounded-full" />
    {{ selectedToken?.symbol }}
  </button>
</template>
