<script setup lang="ts">
import type { Web3WalletTypes } from '@walletconnect/web3wallet'

const props = defineProps<{
  proposal: Web3WalletTypes.SessionProposal
  loading: boolean
}>()

defineEmits(['connect'])

const proposer = computed(() => props.proposal.params?.proposer)

const iconURL = computed(() => {
  const [icon] = proposer.value?.metadata?.icons

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

      <div class="text-primary text-sm text-center truncate max-w-sm">
        {{ proposer.metadata.url }}
      </div>
    </div>

    <CommonButton
      type="submit"
      :loading="loading"
      class="w-full justify-center"
      size="lg"
    >
      Approve
    </CommonButton>
  </form>
</template>
