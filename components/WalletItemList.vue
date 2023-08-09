<script lang="ts" setup>
const { mainSafe, multiSigSafe, safes } = storeToRefs(useSafe())

const filteredSafes = computed(() => {
  if (!safes.value)
    return []

  return safes.value.filter(safe => safe.safe_address !== mainSafe.value?.safe_address && safe.safe_address !== multiSigSafe.value?.safe_address)
})
</script>

<template>
  <div class="flex flex-col">
    <div v-if="mainSafe">
      <h2 class="text-xs mb-3 font-medium">
        Your wallets
      </h2>
      <div class="flex flex-col gap-2.5">
        <WalletItem primary :safe="mainSafe" />
        <WalletItem v-if="multiSigSafe" primary :safe="multiSigSafe" />
      </div>
    </div>

    <div v-if="!!filteredSafes?.length" class="mt-5">
      <h2 class="text-xs mb-3 font-medium">
        Other wallets
      </h2>
      <ul class="flex flex-col gap-2.5">
        <li v-for="safeItem in filteredSafes" :key="safeItem.safe_address">
          <WalletItem :safe="safeItem" />
        </li>
      </ul>
    </div>
  </div>
</template>
