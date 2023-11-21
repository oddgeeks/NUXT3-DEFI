<script lang="ts" setup>
import ArrowRight from '~/assets/images/icons/arrow-right.svg?component'
import SVGInfoCircle from '~/assets/images/icons/exclamation-circle.svg?component'

const props = defineProps<{
  payload: SimulationToken
  type: 'approve' | 'recieve' | 'send' | 'revoke'
  chainId: string
}>()

enum Types {
  Approve = 'approve',
  Recieve = 'recieve',
  Send = 'send',
  Revoke = 'revoke',
}

enum TypeTitles {
  Approve = 'Approve',
  In = 'In',
  Out = 'Out',
  RevokedAllowance = 'Revoked Allowance',
}

const { fetchTokenByAddress } = useTokens()
const { fromWei } = useBignumber()

const token = asyncComputed(async () => {
  const tokens
    = (await fetchTokenByAddress([props.payload.token], props.chainId)) || []
  return tokens[0]
})

const amount = computed(() => {
  if (toBN(props.payload.amount).gt(1e29))
    return '∞'

  return fromWei(props.payload.amount, token.value?.decimals).decimalPlaces(5)
})

const formattedAmount = computed(() => {
  if (amount.value === '∞')
    return amount.value

  return amount.value.toFormat()
})

const priceInUSD = computed(() => {
  if (!token.value || amount.value === '∞')
    return

  return times(amount.value, token.value?.price || 0).toFixed()
})

const actualType = computed(() => {
  switch (props.type) {
    case Types.Approve:
      return toBN(props.payload.amount).eq('0')
        ? TypeTitles.RevokedAllowance
        : TypeTitles.Approve
    case Types.Recieve:
      return TypeTitles.In
    case Types.Send:
      return TypeTitles.Out
    case Types.Revoke:
      return TypeTitles.RevokedAllowance
  }
})

const out = computed(() => {
  return props.type === Types.Send || props.type === Types.Approve
})
</script>

<template>
  <li
    :class="{ hidden: !token && payload.type !== 'NFT' }"
    class="flex flex-col items-start justify-between gap-2 rounded-2xl  bg-gray-850 px-3 py-2.5"
  >
    <div class="flex w-full justify-between gap-2">
      <div
        v-if="payload.type === 'NFT'"
        class="flex flex-1 items-center gap-1.5"
      >
        <img width="26" height="26" :src="payload.nftMetadata?.imageUrl">
        <p class="inline text-xs uppercase leading-4">
          {{ payload.nftMetadata?.name }}
        </p>
      </div>
      <div v-else class="flex items-center gap-1.5">
        <img
          v-if="token?.logo_url"
          width="26"
          height="26"
          :src="token?.logo_url"
        >
        <p class="flex flex-col">
          <span class="text-xs uppercase leading-4">
            {{ formattedAmount }}
            {{ token?.symbol }}
          </span>
          <span
            v-if="priceInUSD"
            class="text-[10px] font-medium leading-4 text-gray-400"
          >
            {{ formatUsd(priceInUSD) }}
          </span>
        </p>
      </div>
      <div
        v-if="actualType === TypeTitles.RevokedAllowance"
        class="flex h-4 w-fit items-center gap-1 rounded-[14px] text-primary"
      >
        <div class="h-1 w-1 rounded-full bg-primary" />
        <span class="whitespace-nowrap text-[10px] leading-4">
          {{ actualType }}
        </span>
      </div>
      <div
        v-else
        :class="out ? 'text-red-alert' : 'text-green-400'"
        class="flex h-4 w-fit items-center gap-1 rounded-[14px]"
      >
        <ArrowRight
          :class="out ? '-rotate-90' : 'rotate-90'"
          class="w-3 [&>path]:stroke-[3px]"
        />
        <span class="text-[10px] leading-4">
          {{ actualType }}
        </span>
      </div>
    </div>
    <div class="flex w-full justify-between">
      <div
        class="w-fit rounded-10 bg-gray-900 px-2.5 py-1 text-[10px] font-medium text-gray-400"
      >
        <span v-if="actualType === TypeTitles.In" class="inline-flex items-center leading-4">
          From:&nbsp;{{ shortenHash(payload.from) }}&nbsp;<Copy class="h-3 w-3" :text="payload.from" :icon-only="true" /></span>
        <span v-else class="inline-flex  items-center leading-4"> To:&nbsp;{{ shortenHash(payload.to) }}&nbsp;<Copy class="h-3 w-3" :text="payload.to" :icon-only="true" /></span>
      </div>
      <div
        v-if="payload.type"
        class="flex w-fit items-center gap-[7px] rounded-10  bg-gray-900 px-2.5 py-1 text-[10px] font-medium text-gray-400"
      >
        {{ payload.type }}
        <SVGInfoCircle
          v-if="payload.type === 'Flashloan'"
          v-tippy="
            'This transfer involves taking a flashloan using the Instadapp Flashloan Aggregator'
          "
          class="w-3 text-primary"
        />
      </div>
    </div>
  </li>
</template>
