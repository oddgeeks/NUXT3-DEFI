<script setup lang="ts">
const props = defineProps<{
  address: string
}>()

const isInstadappSigner = computed(() => isAddressEqual(props.address, instadappSigner))
</script>

<template>
  <div>
    <div class="flex gap-[14px] p-7.5">
      <CommonTxTypeIcon class="h-10 w-10">
        <template #icon>
          <SvgoNetwork />
        </template>
      </CommonTxTypeIcon>
      <div class="flex flex-col gap-2.5">
        <h1 class="text-lg leading-[20px]">
          Manage networks
        </h1>
        <h2 class="text-xs font-medium leading-5 text-slate-400">
          <template v-if="isInstadappSigner">
            Enable/Disable OTP functionality on each chain separately. If you want to opt out of OTP based 2FA, please disable all chains.
          </template>
          <template v-else>
            Enable/Disable backup signer on each chain separately. If you want to remove backup signer, please disable all chains.
          </template>
        </h2>
      </div>
    </div>
    <hr class="border-slate-150 dark:border-slate-800">
    <ul class="flex flex-col gap-7 p-7.5">
      <MfaSignAddSignerItem v-for="network in availableNetworks" :key="network.chainId" :address="address" :chain-id="network.chainId" />
    </ul>
  </div>
</template>
