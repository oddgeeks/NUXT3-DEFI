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
    class="inline-flex w-full flex-col items-center justify-center gap-7.5 text-center"
  >
    <SVGErrorCircle class="h-10 w-10 fill-primary text-white" />

    <div class="flex flex-col gap-[15px]">
      <h1 class="text-lg font-semibold">
        Unable to execute transaction
      </h1>
      <div
        class="text-center text-xs font-medium leading-5 text-gray-400"
      >
        Your transaction has been proposed but couldn't be executed. You can retry executing from <NuxtLink
          :to="`/multisig/${safeAddress}/pending-transactions/${proposalId}`"
          class="text-center text-xs font-medium leading-5 text-primary"
          @click="$emit('destroy')"
        >
          Pending Transactions
        </NuxtLink>
      </div>
    </div>
    <div

      class="flex w-full items-center gap-4"
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
