<script setup lang="ts">
import { ChevronDownIcon } from "@heroicons/vue/solid";
import { CheckIcon } from "@heroicons/vue/outline";

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: [String, Object, Number],
    default: null,
  }
});

const emit = defineEmits(["update:modelValue"]);

const defaultValue = ref(props.items[0]);

const selected = computed({
  get() {
    return props.modelValue ? props.modelValue : defaultValue.value;
  },
  set(value) {
    defaultValue.value = value;
    emit("update:modelValue", value);
  },
});
</script>

<template>
  <Listbox v-slot="{ open }" v-model="selected">
    <div class="relative">
      <ListboxButton
        class="w-full flex gap-2 items-center justify-between py-[10px] pl-[14px] pr-2 text-left rounded-[10px] bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 sm:text-sm ${props.class}"
      >
        <span v-if="!$slots.selected" class="block truncate">{{
          selected
        }}</span>
        <span v-else>
          <slot :selected="selected" name="selected" />
        </span>
        <span class="flex items-center pointer-events-none">
          <ChevronDownIcon
            :class="`w-5 h-5 text-gray-400 transition-transform ease-in-out ${open ? 'rotate-180' : ''}`"
            aria-hidden="true"
          />
        </span>
      </ListboxButton>

      <transition
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute w-full z-30 py-1 mt-[10px] overflow-auto text-base rounded-[10px] bg-slate-100 max-h-60 ring-1 ring-slate-200 focus:outline-none sm:text-sm min-w-[162px]"
        >
          <ListboxOption
            v-for="(item, k) in items"
            v-slot="{ active, selected: isSelected }"
            :key="k"
            :value="item"
            as="template"
          >
            <li
              :class="[
                { '!text-gray-800': active },
                { '!text-gray-400': isSelected },
              ]"
              class="relative py-2 pl-3 pr-4 text-gray-500 select-none"
            >
              <span>
                <slot :item="item" :selected="isSelected" name="item" />
              </span>
              <span
                v-if="isSelected"
                class="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <span
                  class="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full bg-opacity-10"
                >
                  <CheckIcon
                    class="w-3 h-3 text-green-500 check-icon"
                    aria-hidden="true"
                  />
                </span>
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<style scoped>
.check-icon :deep(path) {
  stroke-width: 4;
}
</style>
