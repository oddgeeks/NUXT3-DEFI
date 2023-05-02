<script setup>
import ExternalLinkSVG from '~/assets/images/icons/external-link.svg'

const { safeAddress } = useAvocadoSafe()
const account = computed(() => safeAddress.value || '0x000000000000000')
</script>

<template>
  <div>
    <div
      class="relative pt-7.5 pb-6.25 px-7.5 bg-slate-50 dark:bg-gray-850 rounded-5.5 flex flex-col justify-center items-center"
      :class="{ 'blur pointer-events-none': !safeAddress }"
    >
      <StyledQrCode
        :key="account"
        class="rounded-5 mx-auto bg-white overflow-hidden"
        :size="140"
        :margin="7"
        :data="account"
      />

      <Copy class="mt-5" :text="account">
        <template #content>
          {{ shortenHash(account) }}
        </template>
      </Copy>
      <NuxtLink
        :href="`/w/${account}`"
        external
        target="_blank"
        class="absolute top-0 right-0 m-3.5 inline-flex text-primary text-sm items-center space-x-2"
      >
        <ExternalLinkSVG class="w-4 h-4 text-slate-400" />
      </NuxtLink>
    </div>
  </div>
</template>
