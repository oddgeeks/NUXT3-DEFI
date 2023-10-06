<script lang="ts" setup>
const formattedTime = ref()

const { selectedSafe } = storeToRefs(useSafe())

function formatCountDown() {
  const transactionTokenExpiry = useCookie<string | undefined>(`transaction-token-expiry-${selectedSafe.value?.safe_address}`)

  if (!transactionTokenExpiry.value) {
    formattedTime.value = undefined
    return
  }

  const date = new Date(transactionTokenExpiry.value)
  const now = new Date()

  // find diff in min and second like 10:12 should be 10 min and 12 sec
  const diff = Math.floor((date.getTime() - now.getTime()))
  const ms = Number(diff) || 0

  const timeInSeconds = ms / 1000
  const hours = Math.floor((timeInSeconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds - hours * 3600 - minutes * 60)

  const mDisplay = String(minutes).padStart(2, '0')
  const sDisplay = String(seconds).padStart(2, '0')

  formattedTime.value = `${mDisplay}:${sDisplay}`
}

useIntervalFn(() => formatCountDown(), 1000)
</script>

<template>
  <span v-if="formattedTime" class="flex w-fit items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium">
    <span class="text-primary">
      Session unlocked for

    </span>
    <span class="rounded-md bg-white px-1.5 text-xs leading-5 text-slate-900 dark:bg-slate-900 dark:text-white">
      {{ formattedTime }}
    </span>
  </span>
</template>
