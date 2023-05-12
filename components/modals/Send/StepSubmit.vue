<script setup>
import ArrowRight from '~/assets/images/icons/arrow-right.svg'

const { data, token } = useSend()

const amountInUsd = computed(() => toBN(token.value.price).times(data.value.amount))
</script>

<template>
  <div>
    <div class="bg-slate-50 dark:bg-gray-850 rounded-5 py-[14px] px-5 text-sm">
      <div class="flex flex-col gap-2.5 font-medium">
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Network
          </dt>
          <dd class="flex items-center gap-2">
            <span>{{ chainIdToName(data.fromChainId) }}</span>
            <ArrowRight class="text-slate-400 w-4" />
            <span>{{ chainIdToName(data.toChainId) }}</span>
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Token
          </dt>
          <dd class="uppercase">
            {{ token?.symbol }}
          </dd>
        </dl>
        <dl class="flex items-center justify-between">
          <dt class="text-slate-400">
            Address
          </dt>
          <dd>
            {{ shortenHash(data.address) }}
          </dd>
        </dl>
      </div>
      <div class="ticket-divider w-full my-4" />
      <div class="flex justify-between items-center font-semibold text-base">
        <span>
          You send
        </span>
        <p class="flex items-center gap-2.5">
          <span class="uppercase">
            {{ formatDecimal(data.amount) }} {{ token.symbol }}
          </span>
          <span class="text-xs text-slate-400">
            ({{ formatUsd(amountInUsd) }})
          </span>
        </p>
      </div>
    </div>
  </div>
</template>
