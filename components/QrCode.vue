<script setup>
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg?component'

const { safeAddress } = useAvocadoSafe()
const { selectedSafe } = storeToRefs(useSafe())
const account = computed(() => safeAddress.value || '0x000000000000000')

const isSafeDeployed = computed(() => {
  return Object.values(selectedSafe.value?.deployed || {}).some(deployed => deployed)
})
</script>

<template>
  <div
    style="will-change: transform;"
    class="relative flex items-center justify-center gap-4 rounded-5.5 bg-slate-50 dark:bg-gray-850"
    :class="{ 'pointer-events-none blur': !safeAddress }"
  >
    <button @click="openQrCode">
      <StyledQrCode
        :key="account"
        class="overflow-hidden rounded-5 bg-white"
        :size="80"
        :margin="3"
        :data="account"
      />
    </button>

    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-1">
        <span class="text-sm text-gray-500">Avo Address</span>
        <div class="flex items-center gap-2.5 text-lg">
          <Copy v-tippy="account" :text="account">
            <template #content>
              {{ shortenHash(account) }}
            </template>
          </Copy>
        </div>
      </div>
      <NuxtLink
        v-if="isSafeDeployed"
        :href="`/w/${account}`"
        external
        target="_blank"
        class="inline-flex items-center gap-2 text-sm text-primary"
      >
        Share
        <ExternalLinkSVG class="h-3 w-3" />
      </NuxtLink>
    </div>
  </div>
</template>
