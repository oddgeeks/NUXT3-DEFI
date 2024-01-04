<script setup lang="ts">
import SVGX from '~/assets/images/icons/x.svg?component'

const props = withDefaults(defineProps<{
  tokenBalance: IBalance
  showSelectedUi?: boolean
}>(),
{
  showSelectedUi: false,
},
)

const emits = defineEmits(['toggleCheck'])

const { selectedTokensForMigration } = storeToRefs(useMigration())

const isChecked = computed(() => {
  const index = selectedTokensForMigration?.value?.findIndex((selectedToken) => {
    return `${selectedToken.address}-${selectedToken.chainId}` === `${props.tokenBalance.address}-${props.tokenBalance.chainId}`
  })
  return index > -1
})
</script>

<template>
  <div class="flex items-center border-b-[1px] border-slate-750 p-5 last:border-b-[0px]">
    <div class="relative h-[30px] shrink-0 grow-0 basis-[30px]">
      <SafeTokenLogo class="h-full w-full" :url="tokenBalance.logoURI" />
      <ChainLogo
        v-tippy="chainIdToName(tokenBalance.chainId)"
        :stroke="true"
        class="absolute -bottom-1 -left-1 h-[18px] w-[18px]"
        :chain="tokenBalance.chainId"
      />
    </div>

    <div class="ml-[10px] grow">
      <div class="text-sm font-medium ">
        {{ tokenBalance.name }}
      </div>
      <div class="text-xs font-medium uppercase text-slate-400">
        {{ formatDecimal(tokenBalance.balance) }} {{ tokenBalance.symbol }}
      </div>
    </div>

    <div class="ml-[10px] text-xs font-medium ">
      {{ formatUsd(tokenBalance.balanceInUSD) }}
    </div>

    <input
      v-if="!props.showSelectedUi"
      type="checkbox"
      :checked="isChecked"
      class="ml-5 h-5 w-5 cursor-pointer rounded-[6px] border-0 !bg-slate-700 outline-0"
      @click="emits('toggleCheck')"
    >
    <button v-else class="ml-5" @click="emits('toggleCheck')">
      <SVGX />
    </button>
  </div>
</template>
