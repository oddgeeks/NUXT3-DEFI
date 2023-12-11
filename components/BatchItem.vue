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

const excludedKeys = ['abi', 'params', 'chainId', 'method', 'toAddress', 'contractAddress', 'raw']

function formatValue(i: string) {
  if (isAddress(i))
    return shortenHash(i)

  return i
}
</script>

<template>
  <SlickItem :index="index" class="flex w-full gap-4" tag="li">
    <div class="flex w-full gap-4">
      <span class="mt-5 w-2 text-xs font-medium text-gray-400">
        {{ index + 1 }}
      </span>
      <details :class="!expandable ? 'pointer-events-none select-none' : 'cursor-pointer'" class="group flex w-full items-center gap-2.5 rounded-xl bg-slate-850 py-2.5 font-medium ring-1 ring-slate-750">
        <summary class="flex w-full items-center gap-2.5 px-3">
          <DragHandle class="pointer-events-auto cursor-grab">
            <SvgoHandler class="shrink-0" />
          </DragHandle>
          <div class="flex flex-col">
            <span v-tippy="item.formValues.toAddress" class="text-xs text-gray-400">
              {{ shortenHash(item.formValues.toAddress) }}
            </span>
            <span v-tippy="item.formValues.method" class="w-[150px] max-w-full truncate text-xs leading-5">
              {{ item.formValues.method }}
            </span>
          </div>
          <div class="ml-auto flex items-center gap-2">
            <button class="pointer-events-auto" type="button" @click="$emit('editBatch', index)">
              <SvgoPencil class="h-3 w-3 text-gray-400" />
            </button>
            <button class="pointer-events-auto" type="button" @click="$emit('deleteBatch', index)">
              <SvgoDelete class="h-3 w-3 text-gray-400" />
            </button>
            <SvgoChevronDown v-if="expandable" class="h-4 w-4 text-gray-400 group-open:rotate-180" />
          </div>
        </summary>
        <hr class="my-3 border-gray-800">
        <div>
          <div class="flex flex-col gap-2 px-3 text-xs font-medium">
            <p>
              Interact with
            </p>
            <div class="flex items-center gap-3">
              <AuthorityAvatar :address="item.formValues.toAddress" />
              {{ item.formValues.toAddress }}
            </div>
          </div>
          <hr class="my-3 border-gray-800">
          <ul class="flex flex-col gap-3 px-3 font-medium">
            <template v-for="i, k in item.formValues" :key="i">
              <li v-if="i !== undefined && !excludedKeys.includes(k as string)">
                <dl class="flex">
                  <dt class="w-[140px] text-xs text-gray-400">
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
                <dt class="w-[140px] shrink-0 text-xs text-gray-400">
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
