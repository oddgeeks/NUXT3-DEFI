<script setup lang="ts">
import type { Web3WalletTypes } from '@walletconnect/web3wallet'

const props = defineProps<{
  proposal: Web3WalletTypes.SessionProposal
  loading: boolean
}>()

defineEmits(['connect', 'destroy'])
const { checkDappIsBanned, checkDappIsWarned } = useWalletConnectV2()

const proposer = computed(() => props.proposal.params?.proposer)

const isConnectionBanned = computed(() => {
  if (!proposer.value?.metadata?.url)
    return false

  return checkDappIsBanned(proposer.value?.metadata?.url)
})
const isConnectionWarned = computed(() => {
  if (!proposer.value?.metadata?.url)
    return true

  return checkDappIsWarned(proposer.value?.metadata?.url)
})

const isInstadappConnection = computed(() => {
  return proposer.value?.metadata?.url?.includes('instadapp.io')
})

const iconURL = computed(() => {
  const [icon] = proposer.value?.metadata?.icons

  // check icon string is SVG tag
  if (icon?.startsWith('<svg'))
    return

  return icon
})
</script>

<template>
  <form
    v-focus
    tabindex="0"
    class="space-y-8 focus:outline-none"
    @keypress.enter="$emit('connect')"
    @submit.prevent="$emit('connect')"
  >
    <div class="flex flex-col items-center space-y-8">
      <div v-if="iconURL" class="w-10 h-10">
        <img
          class="w-full h-full object-fit"
          referrerpolicy="no-referrer"
          :src="iconURL"
        >
      </div>

      <span> {{ proposer.metadata.name }} Wants to Connect </span>
    </div>

    <div class="flex flex-col gap-7.5">
      <p class="text-slate-400 text-xs text-center font-medium">
        You need the Avocado web app to be open to initiate transactions. You
        will not receive transaction requests when it is not open.
      </p>

      <div v-if="proposer.metadata.url" class="text-primary text-sm text-center truncate max-w-sm">
        {{ proposer.metadata.url }}
      </div>
    </div>

    <div v-if="isConnectionBanned" class="bg-red-alert font-medium gap-2.5 flex bg-opacity-10 text-xs rounded-2xl text-red-alert py-2.5 px-4">
      <SvgoInfo2 class="shrink-0 mt-0.5" />
      This DApp does not work with Avocado. Please use an EOA account to interact with this DApp.
    </div>

    <div v-else-if="isConnectionWarned" class="text-orange bg-orange-400 bg-opacity-10  font-medium gap-2.5 flex text-xs rounded-2xl py-2.5 px-4">
      <SvgoInfo2 class="shrink-0 mt-0.5" />
      This DApp is known to have some compatability issues with Avocado. Please use at your own risk!
    </div>

    <div v-if="isInstadappConnection" class="text-primary bg-primary bg-opacity-10  font-medium gap-2.5 flex text-xs rounded-2xl py-2.5 px-4">
      <SvgoInfo2 class="shrink-0 mt-0.5" />
      To use your Avocado wallet with Instadapp Pro connect your wallet normally, once connected select Avocado in the Account panel.
    </div>

    <div class="flex flex-col gap-4">
      <CommonButton
        :disabled="isConnectionBanned"
        type="submit"
        :loading="loading"
        class="w-full justify-center"
        size="lg"
      >
        Approve
      </CommonButton>

      <CommonButton
        color="red"
        class="w-full justify-center"
        size="lg"
        @click="$emit('destroy')"
      >
        Disconnect
      </CommonButton>
    </div>
  </form>
</template>
