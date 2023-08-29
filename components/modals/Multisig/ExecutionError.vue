<script setup lang="ts">
import SVGErrorCircle from '~/assets/images/icons/error-circle.svg?component'

defineProps<{
  proposalId: string
  safeAddress: string
}>()

defineEmits(['resolve', 'destroy'])
</script>

<template>
  <div
    class="inline-flex gap-7.5 flex-col items-center justify-center text-center w-full"
  >
    <SVGErrorCircle class="text-white w-10 h-10 fill-primary" />

    <div class="flex flex-col gap-[15px]">
      <h1 class="text-lg font-semibold">
        Unable to execute transaction
      </h1>
      <div
        class="text-slate-400 text-xs text-center leading-5 font-medium"
      >
        Your transaction has been proposed but couldn't be executed. You can retry executing from <NuxtLink
          :to="`/multisig/${safeAddress}/pending-transactions/${proposalId}`"
          class="text-primary text-xs text-center leading-5 font-medium"
          @click="$emit('destroy')"
        >
          Pending Transactions
        </NuxtLink>
      </div>
    </div>
    <div

      class="flex w-full gap-4 items-center"
    >
      <CommonButton

        class="flex-1 justify-center"

        size="lg"
        @click="$emit('resolve', true)"
      >
        Okay
      </CommonButton>
    </div>
  </div>
</template>
