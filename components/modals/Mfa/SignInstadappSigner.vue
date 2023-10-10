<script setup lang="ts">
defineProps<{
  address: string
  removeSigner?: boolean
}>()
</script>

<template>
  <div>
    <div class="flex flex-col gap-7.5 p-5 sm:p-7.5">
      <div class="flex gap-[14px]">
        <div class="flex flex-col gap-1">
          <h1 class="text-lg leading-10">
            Sign on networks to proceed
          </h1>
        </div>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <ul class="flex flex-col gap-7 p-7.5">
      <MfaSignAddSignerItem v-for="network in availableNetworks" :key="network.chainId" :remove-signer="removeSigner" :address="address" :chain-id="network.chainId" />
    </ul>
  </div>
</template>
