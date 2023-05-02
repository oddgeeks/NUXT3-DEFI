<script setup>
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg'

const { safeAddress } = useAvocadoSafe()
const account = computed(() => safeAddress.value || '0x000000000000000')
</script>

<template>
  <div
    class="relative bg-slate-50 dark:bg-gray-850 rounded-5.5 flex justify-center items-center gap-4"
    :class="{ 'blur pointer-events-none': !safeAddress }"
  >
    <StyledQrCode
      :key="account"
      class="rounded-5 bg-white overflow-hidden"
      :size="80"
      :margin="3"
      :data="account"
    />

    <div class="flex flex-col gap-2">
      <div class="flex flex-col gap-1">
        <span class="text-sm dark:text-slate-500 text-slate-400">Avo Address</span>
        <div class="flex items-center gap-2.5 text-lg">
          <Copy :text="account">
            <template #content>
              {{ shortenHash(account) }}
            </template>
          </Copy>
        </div>
      </div>
      <NuxtLink
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
