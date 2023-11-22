<script lang="ts" setup>
defineProps<{
  pending?: boolean
  safe: ISafe
  balance: string
}>()

const { selectedSafeForMigration } = storeToRefs(useMigration())

function handleSelect(safe: ISafe, balance: string, e: Event) {
  const checked = (e.target as HTMLInputElement).checked

  if (checked) {
    selectedSafeForMigration.value = {
      amount: balance,
      safe,
    }
  }
  else {
    selectedSafeForMigration.value = undefined
  }
}
</script>

<template>
  <li class="flex items-center border-b-[1px] border-slate-750 p-5 last:border-b-[0px]">
    <div class="flex w-full items-center justify-between">
      <div class="flex flex-col">
        {{ shortenHash(safe.safe_address) }}
      </div>
      <div class="flex items-center gap-2.5">
        <div v-if="pending" class="loading-box h-5 w-[70px] rounded-full" />
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
          :checked="selectedSafeForMigration?.safe.safe_address === safe.safe_address"
          class="ml-5 h-5 w-5 cursor-pointer rounded-[6px] border-0 !bg-slate-700 outline-0"
          @change="(e) => handleSelect(safe, balance, e)"
        >
      </div>
    </div>
  </li>
</template>
