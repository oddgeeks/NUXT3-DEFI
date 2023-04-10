<script lang="ts" setup>
import ChevronDownSVG from "~/assets/images/icons/chevron-down.svg?component";
import { IToken } from "~~/stores/tokens";

const emit = defineEmits(["resolve", "reject", "update:modelValue"]);

const props = defineProps<{
  tokens: IToken[];
  modelValue: IToken;
}>();

const tokens = toRef(props, "tokens");

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
    tokens: tokens,
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
    class="dark:bg-gray-900 bg-white text-sm uppercase h-fit inline-flex gap-2.5 items-center rounded-2xl pl-[14px] pr-3 py-3"
  >
    <img :src="selectedToken?.logoURI" class="h-6 w-6 rounded-full" />
    <span class="inline-flex items-center gap-[6px] w-full justify-between">
      {{ selectedToken?.symbol }}
      <ChevronDownSVG class="w-5 text-slate-400 -rotate-90" />
    </span>
  </button>
</template>
