<script setup lang="ts">
const props = defineProps<{
  compact?: boolean
}>()
const { allSafes, safesLoading } = storeToRefs(useSafe())
const { pinnedSafes, isSafePinned, displayLegacySafe } = useAccountState()

const priorSafes = computed(() => {
  const showCount = props.compact ? 2 : 3

  const safes = String(displayLegacySafe.value).toLowerCase() == 'true'
    ? allSafes.value
    : allSafes.value?.filter((safe) => {
      return safe.multisig === 1
    })

  if (!pinnedSafes.value.length)
    return safes.slice(0, showCount)

  const filteredSafes = safes.filter((safe) => {
    return isSafePinned(safe.safe_address)
  })

  return filteredSafes.slice(0, showCount)
})
</script>

<template>
  <div v-if="!safesLoading" class="flex items-center gap-2 sm:gap-4">
    <TransitionGroup name="wallet-list">
      <WalletItem v-for="safe in priorSafes" :key="safe.safe_address" :safe="safe" />
    </TransitionGroup>
    <button v-if="allSafes?.length" class="flex h-[44px] w-full items-center justify-center gap-2.5 rounded-7.5 border  border-gray-800 bg-gray-850 py-1 pl-[14px] pr-2.5 text-left text-xs hover:bg-gray-900" @click="openAllWalletsModal()">
      All
      <SvgoChevronDown class="h-3.5 w-3.5 -rotate-90" />
    </button>
  </div>
</template>
