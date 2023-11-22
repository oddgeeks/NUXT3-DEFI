<script setup lang="ts">
const { selectedSafe } = storeToRefs(useSafe())

const { authorisedNetworks, isWalletSecondary } = useAuthorities()
</script>

<template>
  <div v-if="selectedSafe && isWalletSecondary" class="flex flex-col items-baseline justify-between gap-2.5 rounded-5 bg-gray-850 px-4 py-[14px] sm:flex-row sm:items-center sm:px-5">
    <div class="flex flex-col gap-0.5">
      <div class="flex gap-2">
        <span class="text-sm">Multisig owned by</span>
        <span class="inline-flex items-center gap-1.5 rounded-5 px-2 py-0.5  text-xs leading-5 text-gray-400 ring-1 ring-gray-700">
          {{ shortenHash(selectedSafe.owner_address) }}
          <Copy icon-class="w-3 h-3" icon-only :text="selectedSafe.owner_address" />
        </span>
      </div>
      <span class="text-xs leading-5 text-gray-400">
        You are not the primary owner
      </span>
    </div>
    <div class="flex flex-1 flex-wrap items-center gap-1.5 sm:justify-center sm:gap-4">
      <span class="text-xs">
        Networks available to you
      </span>
      <SupportedChains stroke :networks="authorisedNetworks" class="!flex !gap-0 -space-x-2" :max-count="10" />
      <NuxtLink target="_blank" external to="https://guides.avocado.instadapp.io/avocado-multisig/owner-on-multisig" class="inline-flex items-center gap-2 text-xs text-primary">
        <span class="hidden sm:block">
          What does this mean?
        </span>
        <SvgoQuestionCircle class="h-4.5 w-4.5" />
      </NuxtLink>
    </div>
  </div>
</template>
