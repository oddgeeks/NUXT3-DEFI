<script lang="ts" setup>
defineProps<{
  pending?: boolean
  safe: ISafe
  balance: string
}>()

const { toggleSelectedGasBalanceForMigration, isGasBalanceSelected } = useTokens()
</script>

<template>
  <li class="p-5 flex items-center border-b-[1px] last:border-b-[0px] dark:border-slate-750 border-white">
    <div class="flex justify-between w-full items-center">
      <div class="flex flex-col">
        {{ shortenHash(safe.safe_address) }}
      </div>
      <div class="flex gap-2.5 items-center">
        <div v-if="pending" class="h-5 w-[70px] rounded-full loading-box" />
        <template v-else>
          <span v-if="balance === '0x0'">
            0
          </span>
          <span v-else>
            {{ fromWei(balance).toFixed() }}
          </span>
          USDC
        </template>
        <input
          type="checkbox"
          :disabled="balance === '0x0'"
          :checked="isGasBalanceSelected({ amount: balance, safe }).isSelected"
          class="ml-5 w-5 h-5 rounded-[6px] !bg-slate-700 border-0 outline-0 cursor-pointer"
          @change="toggleSelectedGasBalanceForMigration({
            amount: balance,
            safe,
          })"
        >
      </div>
    </div>
  </li>
</template>
