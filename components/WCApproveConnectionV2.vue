<script setup lang="ts">
import type { Web3WalletTypes } from '@walletconnect/web3wallet'

const props = defineProps<{
  proposal: Web3WalletTypes.SessionProposal
  loading: boolean
}>()

defineEmits(['connect', 'destroy'])
const { checkDappIsBanned, checkDappIsWarned, isProUrl } = useWalletConnectV2()

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
  return isProUrl(proposer.value?.metadata?.url)
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
      <div v-if="iconURL" class="h-10 w-10">
        <img
          class="object-fit h-full w-full"
          referrerpolicy="no-referrer"
          :src="iconURL"
        >
      </div>

      <span> {{ proposer.metadata.name }} Wants to Connect </span>
    </div>

    <div class="flex flex-col gap-7.5">
      <p class="text-center text-xs font-medium text-slate-400">
        You need the Avocado web app to be open to initiate transactions. You
        will not receive transaction requests when it is not open.
      </p>

      <div v-if="proposer.metadata.url" class="max-w-sm truncate text-center text-sm text-primary">
        {{ proposer.metadata.url }}
      </div>
    </div>

    <div v-if="isConnectionBanned" class="flex gap-2.5 rounded-2xl bg-red-alert bg-opacity-10 px-4 py-2.5 text-xs font-medium text-red-alert">
      <SvgoInfo2 class="mt-0.5 shrink-0" />
      This DApp does not work with Avocado. Please use an EOA account to interact with this DApp.
    </div>

    <div v-else-if="isConnectionWarned" class="flex gap-2.5 rounded-2xl  bg-orange-400 bg-opacity-10 px-4 py-2.5 text-xs font-medium text-orange">
      <SvgoInfo2 class="mt-0.5 shrink-0" />
      This DApp is known to have some compatability issues with Avocado. Please use at your own risk!
    </div>

    <div v-if="isInstadappConnection" class="flex gap-2.5 rounded-2xl  bg-primary bg-opacity-10 px-4 py-2.5 text-xs font-medium text-primary">
      <SvgoInfo2 class="mt-0.5 shrink-0" />
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
