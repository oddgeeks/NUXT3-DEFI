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
    class="relative bg-slate-50 dark:bg-gray-850 rounded-5.5 flex justify-center items-center gap-4"
    :class="{ 'blur pointer-events-none': !safeAddress }"
  >
    <button @click="openQrCode">
      <StyledQrCode
        :key="account"
        class="rounded-5 bg-white overflow-hidden"
        :size="80"
        :margin="3"
        :data="account"
      />
    </button>

    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-1">
        <span class="text-sm text-slate-500">Avo Address</span>
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
        class="inline-flex text-primary text-sm items-center gap-2"
      >
        Share
        <ExternalLinkSVG class="w-3 h-3" />
      </NuxtLink>
    </div>
  </div>
</template>
