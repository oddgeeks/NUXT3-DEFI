<script setup lang="ts">
defineProps({
  address: String,
})
</script>

<template>
  <div class="flex flex-col items-center gap-7.5">
    <span class="text-lg">Your Avocado Wallet</span>
    <StyledQrCode
      :key="address"
      :size="220"
      :margin="16"
      class="mx-auto overflow-hidden rounded-5 bg-white"
      :data="address"
    />

    <div class="flex flex-col items-center gap-2">
      <Copy v-if="address" class="text-xl" :text="address">
        <template #content>
          {{ shortenHash(address) }}
        </template>
      </Copy>

      <NuxtLink
        :href="`/w/${address}`"
        external
        target="_blank"
        class="absolute left-0 top-0 m-6 inline-flex items-center space-x-2 text-primary"
      >
        <SvgoExternalLink class="h-6.5 w-6.5 text-gray-400" />
      </NuxtLink>
    </div>

    <div class="flex flex-col items-center gap-4">
      <span>Supported Chains</span>
      <div class="flex flex-wrap justify-center gap-2">
        <div
          v-for="network in availableNetworks"
          :key="network.chainId"
          class="flex items-center gap-2 rounded-full bg-gray-850 p-1.5 text-[10px]"
        >
          <ChainLogo
            style="width: 14px; height: 14px"
            :chain="network.chainId"
          />
          <span>{{ network.name }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col items-center gap-2.5">
      <div class="text-center text-xs font-semibold leading-6">
        Send funds to your Avocado wallet using the details above on any
        supported chain
      </div>

      <a
        href=" https://guides.avocado.instadapp.io/getting-started/depositing-fundscount"
        target="blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2.5 text-xs font-medium text-primary"
      >
        <span class="underline underline-offset-4">Learn more about how to deposit</span>
        <SvgoExternalLink class="h-4 w-4" />
      </a>
    </div>
  </div>
</template>
