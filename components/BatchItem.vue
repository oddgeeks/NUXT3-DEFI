<script setup lang="ts">
import { isAddress } from 'ethers/lib/utils'
import { DragHandle, SlickItem } from 'vue-slicksort'

defineProps<{
  item: IBatch
  index: number
  data?: any
  expandable?: boolean
}>()

defineEmits(['deleteBatch', 'editBatch'])

const excludedKeys = ['abi', 'params', 'chainId', 'method', 'toAddress', 'contractAddress']

function formatValue(i: string) {
  if (isAddress(i))
    return shortenHash(i)

  return i
}
</script>

<template>
  <SlickItem :index="index" class="flex gap-4 w-full" tag="li">
    <div class="flex gap-4 w-full">
      <span class="w-2 font-medium text-xs text-slate-400 mt-5">
        {{ index + 1 }}
      </span>
      <details :class="!expandable ? 'pointer-events-none select-none' : 'cursor-pointer'" class="group dark:bg-slate-850 dark:border-slate-750 border flex items-center w-full gap-2.5 font-medium bg-slate-150 rounded-xl py-2.5 dark:ring-slate-750">
        <summary class="w-full flex items-center gap-2.5 px-3">
          <DragHandle class="cursor-grab pointer-events-auto">
            <SvgoHandler class="shrink-0" />
          </DragHandle>
          <div class="flex flex-col">
            <span v-tippy="item.formValues.toAddress" class="text-xs text-slate-400">
              {{ shortenHash(item.formValues.toAddress) }}
            </span>
            <span v-tippy="item.formValues.method" class="text-xs leading-5 truncate max-w-full w-[150px]">
              {{ item.formValues.method }}
            </span>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <button class="pointer-events-auto" type="button" @click="$emit('editBatch', index)">
              <SvgoPencil class="text-slate-400 w-3 h-3" />
            </button>
            <button class="pointer-events-auto" type="button" @click="$emit('deleteBatch', index)">
              <SvgoDelete class="text-slate-400 w-3 h-3" />
            </button>
            <SvgoChevronDown v-if="expandable" class="group-open:rotate-180 text-slate-400 w-4 h-4" />
          </div>
        </summary>
        <hr class="border-slate-150 dark:border-slate-800 my-3">
        <div>
          <div class="text-xs font-medium px-3 gap-2 flex flex-col">
            <p>
              Interact with
            </p>
            <div class="flex gap-3 items-center">
              <AuthorityAvatar :address="item.formValues.toAddress" />
              {{ item.formValues.toAddress }}
            </div>
          </div>
          <hr class="border-slate-150 dark:border-slate-800 my-3">
          <ul class="flex flex-col gap-3 px-3 font-medium">
            <template v-for="i, k in item.formValues" :key="i">
              <li v-if="i !== undefined && !excludedKeys.includes(k as string)">
                <dl class="flex">
                  <dt class="text-xs text-slate-400 w-[140px]">
                    {{ k }}
                  </dt>
                  <dd class="text-xs">
                    {{ formatValue(i) }}
                  </dd>
                </dl>
              </li>
            </template>
            <li v-if="data">
              <dl class="flex">
                <dt class="text-xs text-slate-400 w-[140px] shrink-0">
                  data
                </dt>
                <dd style="word-break: break-word;" class="text-xs">
                  {{ data }}
                </dd>
              </dl>
            </li>
          </ul>
        </div>
      </details>
    </div>
  </SlickItem>
</template>
