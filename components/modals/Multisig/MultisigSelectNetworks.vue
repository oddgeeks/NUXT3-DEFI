<script setup lang="ts">
defineProps<{
  selectedChainId?: string | number
}>()
defineEmits(['resolve'])

const { safeOptions, selectedSafe } = storeToRefs(useSafe())
</script>

<template>
  <div>
    <div class="flex flex-col gap-5 border-b border-gray-875 p-5 sm:px-7.5 sm:pt-7.5">
      <ModalTitle class="items-center">
        <template #icon>
          <SvgoCopy class="header-icon" />
        </template>
        <template #title>
          Select Network
        </template>
      </ModalTitle>
    </div>

    <div class="flex flex-col gap-5 px-[14px] py-5">
      <ul class="flex flex-col gap-2.5">
        <li v-for="option in safeOptions" :key="option.chainId" class="group flex items-center justify-between rounded-2xl px-4 py-2.5 hover:bg-gray-850">
          <div class="flex gap-[14px]">
            <ChainLogo class="h-9 w-9" :chain="option.chainId" />
            <div>
              {{ chainIdToName(option.chainId) }}
              <div class="flex items-center gap-5">
                <span class="flex items-center gap-1.5 text-xs text-gray-400">
                  <SvgoUsers class="h-3 w-3" />
                  {{ selectedSafe?.signers[option.chainId]?.length || 1 }} total signers
                </span>
                <span class="flex items-center gap-1.5 text-xs text-gray-400">
                  <SvgoStamp class="h-3 w-3" />
                  {{ option.threshold ?? 1 }} confirm. required
                </span>
              </div>
            </div>
          </div>
          <CommonButton v-if="String(option.chainId) === String(selectedChainId)" disabled size="sm">
            Selected
          </CommonButton>
          <CommonButton v-else class="invisible group-hover:visible" size="sm" @click="$emit('resolve', true, option.chainId)">
            Select
          </CommonButton>
        </li>
      </ul>
    </div>
  </div>
</template>
