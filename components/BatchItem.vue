<script setup lang="ts">
import { DragHandle, SlickItem } from 'vue-slicksort'

defineProps<{
  item: IBatch
  index: number
}>()

defineEmits(['deleteBatch', 'editBatch'])
</script>

<template>
  <SlickItem :index="index" class="flex items-center gap-4 w-full" tag="li">
    <div class="flex items-center gap-4 w-full">
      <span class="w-2 font-medium text-xs text-slate-400">
        {{ index + 1 }}
      </span>
      <div class="dark:bg-slate-850 flex items-center w-full gap-2.5 font-medium bg-slate-150 rounded-xl py-2.5 px-3 dark:ring-slate-750">
        <DragHandle class="cursor-grab">
          <SvgoHandler class="shrink-0" />
        </DragHandle>
        <div class="flex flex-col">
          <span class="text-xs text-slate-400">
            {{ shortenHash(item.tx.to) }}
          </span>
          <span v-tippy="item.formValues.method" class="text-xs leading-5 truncate max-w-full w-[200px]">
            {{ item.formValues.method }}
          </span>
        </div>
        <div class="ml-auto flex items-center gap-2">
          <button type="button" @click="$emit('editBatch', index)">
            <SvgoPencil class="text-slate-400 w-3 h-3" />
          </button>
          <button type="button" @click="$emit('deleteBatch', index)">
            <SvgoDelete class="text-slate-400 w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  </SlickItem>
</template>
