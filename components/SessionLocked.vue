<script lang="ts" setup>
const formattedTime = ref()

const { getMFATokenExpiry, terminateMFAToken } = useMfa()

function formatCountDown() {
  const transactionTokenExpiry = getMFATokenExpiry()

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

async function handleTerminate2faSession() {
  const { success } = await open2faTerminateSessionModal()

  if (success)
    terminateMFAToken()
}
</script>

<template>
  <button type="button" class="flex w-fit items-center gap-2 rounded-5 bg-primary/10 px-3 py-1.5 text-sm font-medium" @click="handleTerminate2faSession">
    <SvgoUnlocked v-tippy="'You will not be asked to verify using OTP before doing a transaction for the specified time'" class="w-4 text-primary" />

    <span class="rounded-5 bg-primary px-1.5 text-xs tabular-nums leading-5 text-white">
      {{ formattedTime }}
    </span>
  </button>
</template>
